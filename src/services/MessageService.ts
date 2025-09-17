import { WaitingPatient } from '../models';
import { IConfigManager } from './ConfigManager';
import { KrolikApiClient } from './KrolikApiClient';
import { IErrorHandler } from './ErrorHandler';
import { TimeUtils } from '../utils/TimeUtils';
import { retryApiCall, retryCriticalOperation } from '../utils/RetryUtils';
import { executeWithFallback, executeWithDefaultFallback } from '../utils/FallbackUtils';
import { logsService } from './LogsService';
import { metricsService } from './MetricsService';

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
    const startTime = Date.now();
    
    try {
      // Verificar se o fluxo está pausado (Requisito 1.4)
      if (this.configManager.isFlowPaused()) {
        return false;
      }

      // Verificar se o setor está na lista de exceção (Requisito 2.2)
      if (this.isSectorExcluded(patient.sectorId)) {
        console.log(`❌ MessageService: Setor ${patient.sectorId} está excluído para ${patient.name}`);
        return false;
      }

      // Verificar se o canal está na lista de exceção (Requisito 2.3)
      if (this.isChannelExcluded(patient.channelId)) {
        console.log(`❌ MessageService: Canal ${patient.channelId} está excluído para ${patient.name}`);
        return false;
      }

      // Verificar se o atendimento já recebeu mensagem de 30 minutos (Requisito 1.2)
      // Usar nova chave baseada em nome+telefone+setor
      const patientKey = `${patient.name}_${patient.phone}_${patient.sectorId}`;
      const isExcluded = await this.configManager.isAttendanceExcluded(patientKey, '30min');
      if (isExcluded) {
        return false;
      }

      // Verificar se o paciente realmente está aguardando há 30 minutos
      if (patient.waitTimeMinutes < 30) {
        return false;
      }

      // Enviar mensagem baseada no tipo de canal (Requisito 6.4)
      const messageSent = await this.sendMessageByChannelType(patient, '30min');
      const responseTime = Date.now() - startTime;

      if (messageSent) {
        // Adicionar à lista de exclusão para evitar mensagens duplicadas (Requisito 1.2)
        await this.configManager.addToExclusionList(patientKey, '30min');
        
        // Registrar métrica de sucesso
        metricsService.recordMessageSent(
          true, 
          '30min', 
          patient.sectorId, 
          patient.channelId, 
          responseTime
        );
        
        // Log de sucesso para o usuário
        logsService.addLog('info', 
          `Mensagem de 30min enviada com sucesso para ${patient.name}`, 
          'Envio de Mensagem',
          { 
            patientId: patient.id, 
            patientName: patient.name,
            channelType: patient.channelType,
            messageType: '30min'
          }
        );
        
        return true;
      } else {
        // Registrar métrica de falha
        metricsService.recordMessageSent(
          false, 
          '30min', 
          patient.sectorId, 
          patient.channelId, 
          responseTime
        );
        
        // Log de erro para o usuário
        logsService.addLog('error', 
          `Falha ao enviar mensagem de 30min para ${patient.name}`, 
          'Envio de Mensagem',
          { 
            patientId: patient.id, 
            patientName: patient.name,
            channelType: patient.channelType,
            messageType: '30min'
          }
        );
      }

      return false;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Registrar métrica de erro
      metricsService.recordMessageSent(
        false, 
        '30min', 
        patient.sectorId, 
        patient.channelId, 
        responseTime
      );
      
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

      // Log de início do processo
      logsService.addLog('info', 
        `Iniciando envio de mensagens de fim de dia para ${eligiblePatients.length} pacientes`, 
        'Envio de Mensagem',
        { 
          totalPatients: eligiblePatients.length,
          messageType: 'end_of_day'
        }
      );

      // Enviar mensagens para pacientes elegíveis
      const sendPromises = eligiblePatients.map(async (patient) => {
        const startTime = Date.now();
        
        try {
          const messageSent = await this.sendMessageByChannelType(patient, 'end_of_day');
          const responseTime = Date.now() - startTime;
          
          if (messageSent) {
            await this.configManager.addToExclusionList(patient.id, 'end_of_day');
            
            // Registrar métrica de sucesso
            metricsService.recordMessageSent(
              true, 
              'end_of_day', 
              patient.sectorId, 
              patient.channelId, 
              responseTime
            );
            
            // Log de sucesso para o usuário
            logsService.addLog('info', 
              `Mensagem de fim de dia enviada com sucesso para ${patient.name}`, 
              'Envio de Mensagem',
              { 
                patientId: patient.id, 
                patientName: patient.name,
                channelType: patient.channelType,
                messageType: 'end_of_day'
              }
            );
          } else {
            // Registrar métrica de falha
            metricsService.recordMessageSent(
              false, 
              'end_of_day', 
              patient.sectorId, 
              patient.channelId, 
              responseTime
            );
            
            // Log de erro para o usuário
            logsService.addLog('error', 
              `Falha ao enviar mensagem de fim de dia para ${patient.name}`, 
              'Envio de Mensagem',
              { 
                patientId: patient.id, 
                patientName: patient.name,
                channelType: patient.channelType,
                messageType: 'end_of_day'
              }
            );
          }
          return messageSent;
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          // Registrar métrica de erro
          metricsService.recordMessageSent(
            false, 
            'end_of_day', 
            patient.sectorId, 
            patient.channelId, 
            responseTime
          );
          
          this.errorHandler.logError(
            error as Error,
            `MessageService.sendEndOfDayMessages - Patient: ${patient.id}`
          );
          
          // Log de erro para o usuário
          logsService.addLog('error', 
            `Erro ao enviar mensagem de fim de dia para ${patient.name}`, 
            'Envio de Mensagem',
            { 
              patientId: patient.id, 
              patientName: patient.name,
              channelType: patient.channelType,
              messageType: 'end_of_day',
              error: (error as Error).message
            }
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
      // Determinar qual action card usar baseado no tipo de mensagem
      let actionCardId: string | undefined;
      
      if (messageType === '30min') {
        actionCardId = config.selectedActionCard30Min || config.selectedActionCard;
        console.log(`🎯 Usando cartão de 30min: ${actionCardId} para paciente ${patient.name}`);
      } else if (messageType === 'end_of_day') {
        actionCardId = config.selectedActionCardEndDay || config.selectedActionCard;
        console.log(`🎯 Usando cartão de fim de dia: ${actionCardId} para paciente ${patient.name}`);
      }

      // Verificar se há cartão de ação configurado
      if (!actionCardId) {
        const errorMsg = messageType === '30min' 
          ? 'Nenhum cartão de ação configurado para mensagens de 30 minutos'
          : 'Nenhum cartão de ação configurado para mensagens de fim de expediente';
          
        console.error(`❌ ${errorMsg}`);
        this.errorHandler.logError(
          new Error(errorMsg),
          `MessageService.sendActionCardMessage - Patient: ${patient.id}, Type: ${messageType}`
        );
        return false;
      }

      console.log(`📤 Enviando cartão de ação ${actionCardId} para ${patient.name} (${patient.phone}) via canal ${patient.channelId}`);

      // Enviar cartão de ação através da API com retry e fallback
      const result = await executeWithFallback(
        async () => {
          const retryResult = await retryApiCall(async () => {
            return await this.krolikApiClient.sendActionCardByPhone(
              patient.phone,
              actionCardId!
            );
          });
          
          if (!retryResult.success) {
            throw new Error(retryResult.error?.message || 'API call failed');
          }
          
          return retryResult.data;
        },
        async () => {
          // Fallback: tentar enviar mensagem de texto simples
          const fallbackMessage = messageType === '30min' 
            ? `Mensagem automática: Sua consulta está aguardando há mais de 30 minutos. Em breve você será atendido.`
            : `Mensagem automática: O expediente está encerrando. Entre em contato conosco amanhã para reagendar sua consulta.`;
          return await this.krolikApiClient.sendTextMessage(patient.id, fallbackMessage);
        }
      );

      const success = result.success && result.data;

      if (success) {
        console.log(`✅ Cartão de ação enviado com sucesso para ${patient.name}`);
      } else {
        console.error(`❌ Falha ao enviar cartão de ação para ${patient.name}`);
        this.errorHandler.logError(
          new Error(`Falha ao enviar cartão de ação para canal ${patient.channelId}`),
          `MessageService.sendActionCardMessage - Patient: ${patient.id}`
        );
      }

      return success || false;
    } catch (error) {
      // Tratamento de erro específico para cartão de ação (Requisito 6.5)
      console.error(`❌ Erro ao enviar cartão de ação para ${patient.name}:`, error);
      this.errorHandler.logError(
        error as Error,
        `MessageService.sendActionCardMessage - Patient: ${patient.id}, Channel: ${patient.channelId}`
      );
      return false;
    }
  }


  /**
   * Verifica se é horário de fim de expediente (18h) em dia útil
   * Requisito: 2.4
   */
  private isEndOfDayTime(): boolean {
    return TimeUtils.isEndOfDayTime() && TimeUtils.isWorkingDay();
  }
}