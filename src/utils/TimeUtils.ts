import { DateTime } from 'luxon';

/**
 * Utilitário para gerenciamento de fuso horário usando Luxon
 * Garante precisão com horário de verão e mudanças de fuso
 */
export class TimeUtils {
  private static readonly TIMEZONE = 'America/Sao_Paulo';
  private static readonly BUSINESS_START_HOUR = 8;
  private static readonly BUSINESS_END_HOUR = 18;
  private static readonly END_OF_DAY_HOUR = 18;
  private static readonly END_OF_DAY_MINUTE = 0;

  /**
   * Obtém o horário atual de Brasília
   */
  static getBrasiliaTime(): DateTime {
    return DateTime.now().setZone(this.TIMEZONE);
  }

  /**
   * Verifica se está em horário comercial (8h às 18h)
   */
  static isBusinessHours(): boolean {
    const brasiliaTime = this.getBrasiliaTime();
    const hour = brasiliaTime.hour;
    return hour >= this.BUSINESS_START_HOUR && hour < this.BUSINESS_END_HOUR;
  }

  /**
   * Verifica se é dia útil (segunda a sexta)
   */
  static isWorkingDay(): boolean {
    const brasiliaTime = this.getBrasiliaTime();
    const weekday = brasiliaTime.weekday;
    return weekday >= 1 && weekday <= 5; // Segunda (1) a Sexta (5)
  }

  /**
   * Verifica se é horário de fim de expediente (18:00)
   */
  static isEndOfDayTime(): boolean {
    const brasiliaTime = this.getBrasiliaTime();
    return brasiliaTime.hour === this.END_OF_DAY_HOUR && 
           brasiliaTime.minute === this.END_OF_DAY_MINUTE;
  }

  /**
   * Verifica se é horário de fim de expediente com tolerância (18:00 ± 1 minuto)
   */
  static isEndOfDayTimeWithTolerance(toleranceMinutes: number = 1): boolean {
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
   */
  static isBusinessTime(): boolean {
    return this.isBusinessHours() && this.isWorkingDay();
  }

  /**
   * Calcula tempo de espera em minutos entre duas datas
   */
  static calculateWaitTimeMinutes(startTime: Date): number {
    const start = DateTime.fromJSDate(startTime).setZone(this.TIMEZONE);
    const now = this.getBrasiliaTime();
    return Math.floor(now.diff(start, 'minutes').minutes);
  }

  /**
   * Converte Date para DateTime no fuso de Brasília
   */
  static toBrasiliaTime(date: Date): DateTime {
    return DateTime.fromJSDate(date).setZone(this.TIMEZONE);
  }

  /**
   * Converte DateTime para Date
   */
  static toJSDate(dateTime: DateTime): Date {
    return dateTime.toJSDate();
  }

  /**
   * Obtém o próximo horário de fim de expediente
   */
  static getNextEndOfDayTime(): DateTime {
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
   */
  static getNextDailyCleanupTime(): DateTime {
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
   */
  static formatForDisplay(dateTime: DateTime): string {
    return dateTime.toFormat('dd/MM/yyyy HH:mm:ss');
  }

  /**
   * Formata data/hora para logs
   */
  static formatForLogs(dateTime: DateTime): string {
    return dateTime.toISO() || '';
  }

  /**
   * Verifica se uma data é hoje
   */
  static isToday(date: Date): boolean {
    const brasiliaTime = this.getBrasiliaTime();
    const targetDate = this.toBrasiliaTime(date);
    return brasiliaTime.hasSame(targetDate, 'day');
  }

  /**
   * Obtém informações detalhadas do horário atual
   */
  static getTimeInfo(): {
    currentTime: DateTime;
    isBusinessHours: boolean;
    isWorkingDay: boolean;
    isEndOfDayTime: boolean;
    nextEndOfDay: DateTime;
    nextCleanup: DateTime;
  } {
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
export const getBrasiliaTime = () => TimeUtils.getBrasiliaTime();
export const isBusinessHours = () => TimeUtils.isBusinessHours();
export const isWorkingDay = () => TimeUtils.isWorkingDay();
export const isEndOfDayTime = () => TimeUtils.isEndOfDayTime();
export const calculateWaitTimeMinutes = (startTime: Date) => TimeUtils.calculateWaitTimeMinutes(startTime);
