const fs = require('fs');
const path = require('path');

/**
 * Gerenciador de histórico de mensagens enviadas
 * Armazena mensagens enviadas e implementa limpeza diária
 */
class MessageHistoryManager {
  constructor(errorHandler, dataDir = './data') {
    this.errorHandler = errorHandler;
    this.dataDir = dataDir;
    this.messagesFile = path.join(dataDir, 'messages_sent.json');
    
    this.ensureDataDirectory();
    this.initializeMessagesFile();
  }

  /**
   * Garante que o diretório de dados existe
   */
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.ensureDataDirectory');
    }
  }

  /**
   * Inicializa arquivo de mensagens se não existir
   */
  initializeMessagesFile() {
    try {
      if (!fs.existsSync(this.messagesFile)) {
        const initialData = {
          messages: [],
          lastCleanup: null,
          totalSent: 0,
          createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync(this.messagesFile, JSON.stringify(initialData, null, 2));
        console.log('📄 Arquivo de histórico de mensagens criado');
      }
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.initializeMessagesFile');
    }
  }

  /**
   * Registra uma mensagem enviada
   * @param {Object} messageData - Dados da mensagem
   * @param {string} messageData.patientId - ID do paciente
   * @param {string} messageData.patientName - Nome do paciente
   * @param {string} messageData.patientPhone - Telefone do paciente
   * @param {string} messageData.actionCardId - ID do action card
   * @param {string} messageData.messageType - Tipo da mensagem (30min, end_of_day)
   * @param {Date} messageData.sentAt - Horário do envio
   * @param {boolean} messageData.success - Se o envio foi bem-sucedido
   */
  async recordMessageSent(messageData) {
    try {
      const data = this.loadMessagesData();
      
      const messageRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId: messageData.patientId,
        patientName: messageData.patientName,
        patientPhone: messageData.patientPhone,
        actionCardId: messageData.actionCardId,
        messageType: messageData.messageType,
        channelId: messageData.channelId || null,
        channelName: messageData.channelName || null,
        channelNumber: messageData.channelNumber || null,
        sentAt: messageData.sentAt || new Date(),
        sentAtFormatted: (messageData.sentAt || new Date()).toLocaleString('pt-BR'),
        success: messageData.success !== false,
        createdAt: new Date().toISOString()
      };
      
      data.messages.push(messageRecord);
      
      if (messageRecord.success) {
        data.totalSent++;
      }
      
      this.saveMessagesData(data);
      
      console.log(`📨 Mensagem registrada: ${messageRecord.patientName} - ${messageRecord.messageType}`);
      
      return messageRecord;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.recordMessageSent');
      throw error;
    }
  }

  /**
   * Obtém mensagens enviadas para um paciente específico
   * @param {string} patientId - ID do paciente
   * @returns {Array} Lista de mensagens enviadas
   */
  getMessagesForPatient(patientId) {
    try {
      const data = this.loadMessagesData();
      return data.messages.filter(msg => msg.patientId === patientId);
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.getMessagesForPatient');
      return [];
    }
  }

  /**
   * Obtém a última mensagem enviada para um paciente
   * @param {string} patientId - ID do paciente
   * @returns {Object|null} Última mensagem ou null
   */
  getLastMessageForPatient(patientId) {
    try {
      const messages = this.getMessagesForPatient(patientId);
      if (messages.length === 0) {
        return null;
      }
      
      // Ordenar por data de envio (mais recente primeiro)
      messages.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      return messages[0];
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.getLastMessageForPatient');
      return null;
    }
  }

  /**
   * Obtém todas as mensagens enviadas hoje
   * @returns {Array} Mensagens enviadas hoje
   */
  getTodaysMessages() {
    try {
      const data = this.loadMessagesData();
      const today = new Date().toDateString();
      
      return data.messages.filter(msg => {
        const messageDate = new Date(msg.sentAt).toDateString();
        return messageDate === today;
      });
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.getTodaysMessages');
      return [];
    }
  }

  /**
   * Executa limpeza diária das mensagens antigas
   * @param {string} cleanupTime - Horário de limpeza (formato HH:mm)
   */
  async performDailyCleanup(cleanupTime = '20:52') {
    try {
      console.log(`🧹 Executando limpeza diária de mensagens às ${cleanupTime}...`);
      
      const data = this.loadMessagesData();
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      
      // Filtrar mensagens de hoje (manter apenas mensagens de hoje)
      const messagesToKeep = data.messages.filter(msg => {
        const messageDate = new Date(msg.sentAt);
        return messageDate >= yesterday;
      });
      
      const messagesRemoved = data.messages.length - messagesToKeep.length;
      
      data.messages = messagesToKeep;
      data.lastCleanup = new Date().toISOString();
      
      this.saveMessagesData(data);
      
      console.log(`✅ Limpeza concluída: ${messagesRemoved} mensagens antigas removidas`);
      console.log(`📊 Mensagens mantidas: ${messagesToKeep.length}`);
      
      return {
        removed: messagesRemoved,
        kept: messagesToKeep.length
      };
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.performDailyCleanup');
      throw error;
    }
  }

  /**
   * Obtém estatísticas das mensagens
   * @returns {Object} Estatísticas
   */
  getStats() {
    try {
      const data = this.loadMessagesData();
      const today = new Date().toDateString();
      
      const todaysMessages = data.messages.filter(msg => {
        const messageDate = new Date(msg.sentAt).toDateString();
        return messageDate === today;
      });
      
      const successfulToday = todaysMessages.filter(msg => msg.success).length;
      const failedToday = todaysMessages.filter(msg => !msg.success).length;
      
      return {
        totalSent: data.totalSent,
        totalMessages: data.messages.length,
        todaysMessages: todaysMessages.length,
        todaysSuccessful: successfulToday,
        todaysFailed: failedToday,
        lastCleanup: data.lastCleanup,
        createdAt: data.createdAt
      };
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.getStats');
      return {
        totalSent: 0,
        totalMessages: 0,
        todaysMessages: 0,
        todaysSuccessful: 0,
        todaysFailed: 0,
        lastCleanup: null,
        createdAt: null
      };
    }
  }

  /**
   * Carrega dados das mensagens do arquivo
   * @returns {Object} Dados das mensagens
   */
  loadMessagesData() {
    try {
      if (!fs.existsSync(this.messagesFile)) {
        this.initializeMessagesFile();
      }
      
      const content = fs.readFileSync(this.messagesFile, 'utf8');
      
      // Verificar se o arquivo está vazio ou contém apenas espaços
      if (!content || content.trim() === '') {
        console.warn('⚠️ Arquivo de mensagens está vazio, reinicializando...');
        this.initializeMessagesFile();
        return this.loadMessagesData(); // Recursão para carregar após reinicialização
      }
      
      return JSON.parse(content);
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.loadMessagesData');
      
      // Se houve erro de parsing, tentar recriar o arquivo
      if (error instanceof SyntaxError) {
        console.warn('⚠️ Arquivo de mensagens corrompido, recriando...');
        try {
          this.initializeMessagesFile();
          const content = fs.readFileSync(this.messagesFile, 'utf8');
          return JSON.parse(content);
        } catch (recoveryError) {
          this.errorHandler.logError(recoveryError, 'MessageHistoryManager.loadMessagesData.recovery');
        }
      }
      
      return {
        messages: [],
        lastCleanup: null,
        totalSent: 0,
        createdAt: new Date().toISOString()
      };
    }
  }

  /**
   * Salva dados das mensagens no arquivo
   * @param {Object} data - Dados para salvar
   */
  saveMessagesData(data) {
    try {
      fs.writeFileSync(this.messagesFile, JSON.stringify(data, null, 2));
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.saveMessagesData');
      throw error;
    }
  }

  /**
   * Cria backup do histórico de mensagens
   * @param {string} backupPath - Caminho do backup
   */
  async createBackup(backupPath = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultBackupPath = path.join(this.dataDir, 'backup_current', `messages_sent_backup_${timestamp}.json`);
      const finalBackupPath = backupPath || defaultBackupPath;
      
      // Garantir que o diretório de backup existe
      const backupDir = path.dirname(finalBackupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const data = this.loadMessagesData();
      fs.writeFileSync(finalBackupPath, JSON.stringify(data, null, 2));
      
      console.log(`💾 Backup do histórico de mensagens criado: ${finalBackupPath}`);
      
      return finalBackupPath;
      
    } catch (error) {
      this.errorHandler.logError(error, 'MessageHistoryManager.createBackup');
      throw error;
    }
  }
}

module.exports = { MessageHistoryManager };
