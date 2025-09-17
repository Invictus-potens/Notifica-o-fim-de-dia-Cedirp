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

  /**
   * Obtém o horário atual de Brasília
   * @returns {DateTime} Horário de Brasília
   */
  static getBrasiliaTime() {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Verifica se está em horário comercial (8h às 18h)
   * @returns {boolean} True se horário comercial
   */
  static isBusinessHours() {
    const brasiliaTime = this.getBrasiliaTime();
    const hour = brasiliaTime.hour;
    return hour >= this.BUSINESS_START_HOUR && hour < this.BUSINESS_END_HOUR;
  }

  /**
   * Verifica se é dia útil (segunda a sexta)
   * @returns {boolean} True se dia útil
   */
  static isWorkingDay() {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    return weekday >= 1 && weekday <= 5; // Segunda (1) a Sexta (5)
  }

  /**
   * Verifica se é horário de fim de expediente (18:00)
   * @returns {boolean} True se 18:00
   */
  static isEndOfDayTime() {
    const brasiliaTime = this.getBrasiliaTime();
    return brasiliaTime.hour === this.END_OF_DAY_HOUR && 
           brasiliaTime.minute === this.END_OF_DAY_MINUTE;
  }

  /**
   * Verifica se é horário de fim de expediente com tolerância (18:00 ± 1 minuto)
   * @param {number} toleranceMinutes - Tolerância em minutos (padrão: 1)
   * @returns {boolean} True se dentro da tolerância
   */
  static isEndOfDayTimeWithTolerance(toleranceMinutes = 1) {
    const brasiliaTime = this.getBrasiliaTime();
    const targetTime = brasiliaTime.set({
      hour: this.END_OF_DAY_HOUR,
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
   * Obtém o próximo horário de fim de expediente
   * @returns {DateTime} Próximo fim de expediente
   */
  static getNextEndOfDayTime() {
    const now = this.getBrasiliaTime();
    let nextEndOfDay = now.set({
      hour: this.END_OF_DAY_HOUR,
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
