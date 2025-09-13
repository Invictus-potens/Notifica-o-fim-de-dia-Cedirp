import { WaitingPatient } from '../models';
import { IConfigManager } from './ConfigManager';
import { KrolikApiClient } from './KrolikApiClient';
import { IErrorHandler } from './ErrorHandler';

export interface IMessageService {
  send30MinuteMessage(patient: WaitingPatient): Promise<boolean>;
  sendEndOfDayMessages(patients: WaitingPatient[]): Promise<void>;
  isChannelExcluded(channelId: string): boolean;
  isSectorExcluded(sectorId: string): boolean;
}

export class MessageService implements IMessageService {
  private configManager: IConfigManager;
  private krolikApiClient: KrolikApiClient;
  private errorHandler: IErrorHandler;

  constructor(
    configManager: IConfigManager,
    krolikApiClient: KrolikApiClient,
    errorHandler: IErrorHandler
  ) {
    this.configManager = configManager;
    this.krolikApiClient = krolikApiClient;
    this.errorHandler = errorHandler;
  }

  /**
   * Envia mensagem de 30 minutos para um paciente específico
   * Requisitos: 1.1, 1.2, 2.1, 2.2, 2.3, 6.4
   */
  async send30MinuteMessage(patient: WaitingPatient): Promise<boolean> {
    try {
      // Verificar se o fluxo está pausado (Requisito 1.4)
      if (this.configManager.isFlowPaused()) {
        return false;
      }

      // Verificar se o setor está na lista de exceção (Requisito 2.2)
      if (this.isSectorExcluded(patient.sectorId)) {
        return false;
      }

      // Verificar se o canal está na lista de exceção (Requisito 2.3)
      if (this.isChannelExcluded(patient.channelId)) {
        return false;
      }

      // Verificar se o atendimento já recebeu mensagem de 30 minutos (Requisito 1.2)
      const isExcluded = await this.configManager.isAttendanceExcluded(patient.id, '30min');
      if (isExcluded) {
        return false;
      }

      // Verificar se o paciente realmente está aguardando há 30 minutos
      if (patient.waitTimeMinutes < 30) {
        return false;
      }

      // Enviar mensagem baseada no tipo de canal (Requisito 6.4)
      const messageSent = await this.sendMessageByChannelType(patient, '30min');

      if (messageSent) {
        // Adicionar à lista de exclusão para evitar mensagens duplicadas (Requisito 1.2)
        await this.configManager.addToExclusionList(patient.id, '30min');
        return true;
      }

      return false;
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        `MessageService.send30MinuteMessage - Patient: ${patient.id}`
      );
      return false;
    }
  }

  /**
   * Envia mensagens de fim de expediente para múltiplos pacientes
   * Requisitos: 2.1, 2.4
   */
  async sendEndOfDayMessages(patients: WaitingPatient[]): Promise<void> {
    try {
      // Verificar se é horário comercial e dia útil (Requisito 2.4)
      if (!this.isEndOfDayTime()) {
        return;
      }

      // Filtrar pacientes elegíveis
      const eligiblePatients = patients.filter(patient => {
        // Verificar se o setor está na lista de exceção (Requisito 2.2)
        if (this.isSectorExcluded(patient.sectorId)) {
          return false;
        }

        // Verificar se o canal está na lista de exceção (Requisito 2.3)
        if (this.isChannelExcluded(patient.channelId)) {
          return false;
        }

        return true;
      });

      // Enviar mensagens para pacientes elegíveis
      const sendPromises = eligiblePatients.map(async (patient) => {
        try {
          const messageSent = await this.sendMessageByChannelType(patient, 'end_of_day');
          if (messageSent) {
            await this.configManager.addToExclusionList(patient.id, 'end_of_day');
          }
          return messageSent;
        } catch (error) {
          this.errorHandler.logError(
            error as Error,
            `MessageService.sendEndOfDayMessages - Patient: ${patient.id}`
          );
          return false;
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        'MessageService.sendEndOfDayMessages'
      );
    }
  }

  /**
   * Verifica se um canal está na lista de exceção
   * Requisito: 2.3
   */
  isChannelExcluded(channelId: string): boolean {
    const excludedChannels = this.configManager.getExcludedChannels();
    return excludedChannels.includes(channelId);
  }

  /**
   * Verifica se um setor está na lista de exceção
   * Requisito: 2.2
   */
  isSectorExcluded(sectorId: string): boolean {
    const excludedSectors = this.configManager.getExcludedSectors();
    return excludedSectors.includes(sectorId);
  }

  /**
   * Envia mensagem baseada no tipo de canal
   * Requisitos: 6.1, 6.2, 6.3, 6.5
   */
  private async sendMessageByChannelType(
    patient: WaitingPatient,
    messageType: '30min' | 'end_of_day'
  ): Promise<boolean> {
    try {
      const config = this.configManager.getSystemConfig();
      
      // Detectar tipo de canal e enviar mensagem apropriada
      if (patient.channelType === 'normal') {
        // Canal normal usa cartão de ação (Requisito 6.1)
        return await this.sendActionCardMessage(patient, messageType, config);
      } else if (patient.channelType === 'api_oficial') {
        // Canal API oficial usa template (Requisito 6.2)
        return await this.sendTemplateMessage(patient, messageType, config);
      } else {
        // Tipo de canal desconhecido
        this.errorHandler.logError(
          new Error(`Tipo de canal desconhecido: ${patient.channelType}`),
          `MessageService.sendMessageByChannelType - Patient: ${patient.id}`
        );
        return false;
      }
    } catch (error) {
      // Tratamento de erros específico por tipo de canal (Requisito 6.5)
      this.errorHandler.logError(
        error as Error,
        `MessageService.sendMessageByChannelType - Patient: ${patient.id}, Channel: ${patient.channelType}`
      );
      return false;
    }
  }

  /**
   * Envia mensagem via cartão de ação para canais normais
   * Requisito: 6.1
   */
  private async sendActionCardMessage(
    patient: WaitingPatient,
    messageType: '30min' | 'end_of_day',
    config: any
  ): Promise<boolean> {
    try {
      // Verificar se há cartão de ação configurado
      if (!config.selectedActionCard) {
        this.errorHandler.logError(
          new Error('Nenhum cartão de ação configurado para canais normais'),
          `MessageService.sendActionCardMessage - Patient: ${patient.id}`
        );
        return false;
      }

      // Enviar cartão de ação através da API
      const success = await this.krolikApiClient.sendActionCard(
        patient.channelId,
        config.selectedActionCard
      );

      if (!success) {
        this.errorHandler.logError(
          new Error(`Falha ao enviar cartão de ação para canal ${patient.channelId}`),
          `MessageService.sendActionCardMessage - Patient: ${patient.id}`
        );
      }

      return success;
    } catch (error) {
      // Tratamento de erro específico para cartão de ação (Requisito 6.5)
      this.errorHandler.logError(
        error as Error,
        `MessageService.sendActionCardMessage - Patient: ${patient.id}, Channel: ${patient.channelId}`
      );
      return false;
    }
  }

  /**
   * Envia mensagem via template para canais API oficial
   * Requisito: 6.2
   */
  private async sendTemplateMessage(
    patient: WaitingPatient,
    messageType: '30min' | 'end_of_day',
    config: any
  ): Promise<boolean> {
    try {
      // Verificar se há template configurado
      if (!config.selectedTemplate) {
        this.errorHandler.logError(
          new Error('Nenhum template configurado para canais API oficial'),
          `MessageService.sendTemplateMessage - Patient: ${patient.id}`
        );
        return false;
      }

      // Enviar template através da API
      const success = await this.krolikApiClient.sendTemplate(
        patient.channelId,
        config.selectedTemplate
      );

      if (!success) {
        this.errorHandler.logError(
          new Error(`Falha ao enviar template para canal ${patient.channelId}`),
          `MessageService.sendTemplateMessage - Patient: ${patient.id}`
        );
      }

      return success;
    } catch (error) {
      // Tratamento de erro específico para template (Requisito 6.5)
      this.errorHandler.logError(
        error as Error,
        `MessageService.sendTemplateMessage - Patient: ${patient.id}, Channel: ${patient.channelId}`
      );
      return false;
    }
  }

  /**
   * Verifica se é horário de fim de expediente (18h) em dia útil
   * Requisito: 2.4
   */
  private isEndOfDayTime(): boolean {
    const now = new Date();
    
    // Verificar se é fim de semana (Requisito 2.4)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Domingo = 0, Sábado = 6
      return false;
    }

    // Verificar se é o horário configurado (padrão 18:00)
    const config = this.configManager.getSystemConfig();
    const [endHour, endMinute] = config.endOfDayTime.split(':').map(Number);
    
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Verificar se é exatamente o horário de fim de expediente
    return currentHour === endHour && currentMinute === endMinute;
  }
}