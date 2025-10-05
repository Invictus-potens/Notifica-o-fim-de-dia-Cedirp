const { DateTime } = require('luxon');

/**
 * Utilitário para gerenciamento de fuso horário usando Luxon
 * Garante precisão com horário de verão e mudanças de fuso
 */
class TimeUtils {
  static TIMEZONE = 'America/Sao_Paulo';
  static BUSINESS_START_HOUR = 8;
  static BUSINESS_END_HOUR = 18;
  static END_OF_DAY_HOUR = 18;
  static END_OF_DAY_MINUTE = 0;

  // ConfigManager será injetado para permitir horários dinâmicos
  static configManager = null;

  /**
   * Configura o ConfigManager para horários dinâmicos
   * @param {ConfigManager} configManager - Instância do ConfigManager
   */
  static setConfigManager(configManager) {
    this.configManager = configManager;
  }

  /**
   * Obtém o horário de início do dia (dinâmico ou padrão)
   * @returns {number} Hora de início (0-23)
   */
  static getBusinessStartHour() {
    if (this.configManager) {
      const startTime = this.configManager.getStartOfDayTime();
      const [hour] = startTime.split(':').map(Number);
      return hour;
    }
    return this.BUSINESS_START_HOUR;
  }

  /**
   * Obtém o horário de fim do dia (dinâmico ou padrão)
   * @returns {number} Hora de fim (0-23)
   */
  static getBusinessEndHour() {
    if (this.configManager) {
      const endTime = this.configManager.getEndOfDayTime();
      const [hour] = endTime.split(':').map(Number);
      return hour;
    }
    return this.BUSINESS_END_HOUR;
  }

  /**
   * Obtém o horário atual de Brasília
   * @returns {DateTime} Horário de Brasília
   */
  static getBrasiliaTime() {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Verifica se está em horário comercial (dinâmico baseado na configuração)
   * Considera horários específicos para sábado
   * @returns {boolean} True se horário comercial
   */
  static isBusinessHours() {
    const brasiliaTime = this.getBrasiliaTime();
    const hour = brasiliaTime.hour;
    const weekday = brasiliaTime.weekday;
    
    let startHour, endHour;
    
    // Verificar se é sábado e usar horários específicos
    if (weekday === 6 && this.configManager) { // Sábado
      const saturdayStartTime = this.configManager.getSaturdayStartTime();
      const saturdayEndTime = this.configManager.getSaturdayEndTime();
      startHour = parseInt(saturdayStartTime.split(':')[0]);
      endHour = parseInt(saturdayEndTime.split(':')[0]);
    } else {
      // Dias úteis normais
      startHour = this.getBusinessStartHour();
      endHour = this.getBusinessEndHour();
    }
    
    return hour >= startHour && hour < endHour;
  }

  /**
   * Verifica se é dia útil (segunda a sexta + sábado)
   * @returns {boolean} True se dia útil
   */
  static isWorkingDay() {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    return weekday >= 1 && weekday <= 6; // Segunda (1) a Sábado (6)
  }

  /**
   * Verifica se é horário de fim de expediente (dinâmico baseado na configuração)
   * Considera horários específicos para sábado
   * @returns {boolean} True se horário de fim de expediente
   */
  static isEndOfDayTime() {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    
    let endHour;
    
    // Verificar se é sábado e usar horário específico
    if (weekday === 6 && this.configManager) { // Sábado
      const saturdayEndTime = this.configManager.getSaturdayEndTime();
      endHour = parseInt(saturdayEndTime.split(':')[0]);
    } else {
      // Dias úteis normais
      endHour = this.getBusinessEndHour();
    }
    
    return brasiliaTime.hour === endHour && brasiliaTime.minute === this.END_OF_DAY_MINUTE;
  }

  /**
   * Verifica se é horário de fim de expediente com tolerância (dinâmico ± 1 minuto)
   * Considera horários específicos para sábado
   * @param {number} toleranceMinutes - Tolerância em minutos (padrão: 1)
   * @returns {boolean} True se dentro da tolerância
   */
  static isEndOfDayTimeWithTolerance(toleranceMinutes = 1) {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    
    let endHour;
    
    // Verificar se é sábado e usar horário específico
    if (weekday === 6 && this.configManager) { // Sábado
      const saturdayEndTime = this.configManager.getSaturdayEndTime();
      endHour = parseInt(saturdayEndTime.split(':')[0]);
    } else {
      // Dias úteis normais
      endHour = this.getBusinessEndHour();
    }
    
    const targetTime = brasiliaTime.set({
      hour: endHour,
      minute: this.END_OF_DAY_MINUTE,
      second: 0,
      millisecond: 0
    });
    
    const diffMinutes = Math.abs(brasiliaTime.diff(targetTime, 'minutes').minutes);
    return diffMinutes <= toleranceMinutes;
  }

  /**
   * Verifica se está em horário comercial E dia útil
   * @returns {boolean} True se horário de trabalho
   */
  static isBusinessTime() {
    return this.isBusinessHours() && this.isWorkingDay();
  }

  /**
   * Calcula tempo de espera em minutos entre duas datas
   * @param {Date} startTime - Horário de início
   * @returns {number} Tempo em minutos
   */
  static calculateWaitTimeMinutes(startTime) {
    const start = DateTime.fromJSDate(startTime).setZone(this.TIMEZONE);
    const now = this.getBrasiliaTime();
    return Math.floor(now.diff(start, 'minutes').minutes);
  }

  /**
   * Converte Date para DateTime no fuso de Brasília
   * @param {Date} date - Data JavaScript
   * @returns {DateTime} DateTime de Brasília
   */
  static toBrasiliaTime(date) {
    return DateTime.fromJSDate(date).setZone(this.TIMEZONE);
  }

  /**
   * Converte DateTime para Date
   * @param {DateTime} dateTime - DateTime do Luxon
   * @returns {Date} Data JavaScript
   */
  static toJSDate(dateTime) {
    return dateTime.toJSDate();
  }

  /**
   * Obtém o próximo horário de fim de expediente (dinâmico)
   * @returns {DateTime} Próximo fim de expediente
   */
  static getNextEndOfDayTime() {
    const now = this.getBrasiliaTime();
    const endHour = this.getBusinessEndHour();
    let nextEndOfDay = now.set({
      hour: endHour,
      minute: this.END_OF_DAY_MINUTE,
      second: 0,
      millisecond: 0
    });

    // Se já passou do horário hoje, pegar o próximo dia útil
    if (nextEndOfDay <= now) {
      nextEndOfDay = nextEndOfDay.plus({ days: 1 });
      
      // Pular fins de semana
      while (nextEndOfDay.weekday > 5) {
        nextEndOfDay = nextEndOfDay.plus({ days: 1 });
      }
    }

    return nextEndOfDay;
  }

  /**
   * Obtém o próximo horário de limpeza diária (23:59)
   * @returns {DateTime} Próxima limpeza
   */
  static getNextDailyCleanupTime() {
    const now = this.getBrasiliaTime();
    let nextCleanup = now.set({
      hour: 23,
      minute: 59,
      second: 0,
      millisecond: 0
    });

    // Se já passou do horário hoje, pegar amanhã
    if (nextCleanup <= now) {
      nextCleanup = nextCleanup.plus({ days: 1 });
    }

    return nextCleanup;
  }

  /**
   * Formata data/hora para exibição
   * @param {DateTime} dateTime - DateTime para formatar
   * @returns {string} Data formatada
   */
  static formatForDisplay(dateTime) {
    return dateTime.toFormat('dd/MM/yyyy HH:mm:ss');
  }

  /**
   * Formata data/hora para logs
   * @param {DateTime} dateTime - DateTime para formatar
   * @returns {string} Data formatada para logs
   */
  static formatForLogs(dateTime) {
    return dateTime.toISO() || '';
  }

  /**
   * Verifica se uma data é hoje
   * @param {Date} date - Data para verificar
   * @returns {boolean} True se é hoje
   */
  static isToday(date) {
    const brasiliaTime = this.getBrasiliaTime();
    const targetDate = this.toBrasiliaTime(date);
    return brasiliaTime.hasSame(targetDate, 'day');
  }

  /**
   * 🚫 NOVA FUNÇÃO: Verifica se está no período de bloqueio (17h às 18h)
   * Durante este período, mensagens "aguardando" são bloqueadas
   * @returns {boolean} True se está no período de bloqueio
   */
  static isWaitingMessageBlocked() {
    const brasiliaTime = this.getBrasiliaTime();
    const hour = brasiliaTime.hour;
    const weekday = brasiliaTime.weekday;
    
    // Verificar se é dia útil (segunda a sexta + sábado)
    if (!this.isWorkingDay()) {
      return false; // Não aplica bloqueio em domingos
    }
    
    // Bloqueio ativo das 17h às 18h (exceto sábados que é 11h às 12h)
    if (weekday === 6 && this.configManager) { // Sábado
      const saturdayEndTime = this.configManager.getSaturdayEndTime();
      const saturdayEndHour = parseInt(saturdayEndTime.split(':')[0]);
      return hour >= (saturdayEndHour - 1) && hour < saturdayEndHour; // 11h-12h sábados
    } else {
      // Dias úteis: 17h-18h
      return hour >= 17 && hour < 18;
    }
  }

  /**
   * 🚫 NOVA FUNÇÃO: Verifica se mensagens de fim de expediente estão permitidas
   * Apenas às 18h (dias úteis) ou 12h (sábados)
   * @returns {boolean} True se pode enviar mensagem de fim de expediente
   */
  static canSendEndOfDayMessage() {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    
    // Verificar se é dia útil
    if (!this.isWorkingDay()) {
      return false;
    }
    
    // 🚫 IMPORTANTE: Não permitir mensagem de fim durante período de bloqueio
    if (this.isWaitingMessageBlocked()) {
      return false;
    }
    
    // Mensagem de fim de expediente permitida apenas no horário exato
    return this.isEndOfDayTimeWithTolerance(5); // ±5 minutos de tolerância
  }

  /**
   * Obtém informações detalhadas do horário atual
   * @returns {Object} Informações de tempo
   */
  static getTimeInfo() {
    const currentTime = this.getBrasiliaTime();
    
    return {
      currentTime,
      isBusinessHours: this.isBusinessHours(),
      isWorkingDay: this.isWorkingDay(),
      isEndOfDayTime: this.isEndOfDayTime(),
      isWaitingMessageBlocked: this.isWaitingMessageBlocked(),
      canSendEndOfDayMessage: this.canSendEndOfDayMessage(),
      nextEndOfDay: this.getNextEndOfDayTime(),
      nextCleanup: this.getNextDailyCleanupTime()
    };
  }
}

/**
 * Funções de conveniência para compatibilidade com código existente
 */
const getBrasiliaTime = () => TimeUtils.getBrasiliaTime();
const isBusinessHours = () => TimeUtils.isBusinessHours();
const isWorkingDay = () => TimeUtils.isWorkingDay();
const isEndOfDayTime = () => TimeUtils.isEndOfDayTime();
const calculateWaitTimeMinutes = (startTime) => TimeUtils.calculateWaitTimeMinutes(startTime);

module.exports = {
  TimeUtils,
  getBrasiliaTime,
  isBusinessHours,
  isWorkingDay,
  isEndOfDayTime,
  calculateWaitTimeMinutes
};
