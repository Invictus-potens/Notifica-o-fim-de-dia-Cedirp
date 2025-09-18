const cron = require('node-cron');

/**
 * Serviço de agendamento usando cron jobs
 * Gerencia execução de tarefas em horários específicos
 */
class CronService {
  constructor(errorHandler) {
    this.errorHandler = errorHandler;
    this.jobs = new Map();
    this.jobStatus = new Map(); // Rastreamento manual de status
    this.isRunning = false;
  }

  /**
   * Inicia o serviço de cron
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ CronService já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('⏰ CronService iniciado');
  }

  /**
   * Para o serviço de cron
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ CronService não está rodando');
      return;
    }

    // Parar todos os jobs ativos
    for (const [jobName, job] of this.jobs.entries()) {
      job.stop();
      this.jobStatus.set(jobName, false); // Marcar como parado
      console.log(`⏹️ Job '${jobName}' parado`);
    }

    this.jobs.clear();
    this.jobStatus.clear();
    this.isRunning = false;
    console.log('⏰ CronService parado');
  }

  /**
   * Agenda verificação de pacientes a cada 3 minutos
   */
  schedulePatientCheck(callback) {
    try {
      const jobName = 'patient-check-3min';
      
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job: a cada 3 minutos
      const job = cron.schedule('*/3 * * * *', async () => {
        try {
          console.log(`🔄 [${new Date().toLocaleString('pt-BR')}] Executando verificação de pacientes (3min)`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, 'CronService.patientCheck');
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log('✅ Verificação de pacientes agendada (a cada 3 minutos)');
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.schedulePatientCheck');
      throw error;
    }
  }

  /**
   * Agenda verificação de pacientes a cada minuto (para monitoramento intensivo)
   */
  scheduleIntensivePatientCheck(callback) {
    try {
      const jobName = 'patient-check-1min';
      
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job: a cada minuto
      const job = cron.schedule('* * * * *', async () => {
        try {
          console.log(`🔄 [${new Date().toLocaleString('pt-BR')}] Executando verificação intensiva de pacientes (1min)`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, 'CronService.intensivePatientCheck');
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log('✅ Verificação intensiva de pacientes agendada (a cada minuto)');
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.scheduleIntensivePatientCheck');
      throw error;
    }
  }

  /**
   * Agenda mensagens de fim de dia às 18:00
   */
  scheduleEndOfDayMessages(callback) {
    try {
      const jobName = 'end-of-day-messages';
      
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job: todos os dias às 18:00
      const job = cron.schedule('0 18 * * *', async () => {
        try {
          console.log(`🌅 [${new Date().toLocaleString('pt-BR')}] Executando mensagens de fim de dia (18:00)`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, 'CronService.endOfDayMessages');
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log('✅ Mensagens de fim de dia agendadas (18:00 diariamente)');
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.scheduleEndOfDayMessages');
      throw error;
    }
  }

  /**
   * Agenda limpeza diária às 18:05 (após mensagens de fim de dia)
   */
  scheduleDailyCleanup(callback) {
    try {
      const jobName = 'daily-cleanup';
      
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job: todos os dias às 18:05
      const job = cron.schedule('5 18 * * *', async () => {
        try {
          console.log(`🧹 [${new Date().toLocaleString('pt-BR')}] Executando limpeza diária (18:05)`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, 'CronService.dailyCleanup');
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log('✅ Limpeza diária agendada (18:05 diariamente)');
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.scheduleDailyCleanup');
      throw error;
    }
  }

  /**
   * Agenda backup diário às 23:00
   */
  scheduleDailyBackup(callback) {
    try {
      const jobName = 'daily-backup';
      
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job: todos os dias às 23:00
      const job = cron.schedule('0 23 * * *', async () => {
        try {
          console.log(`💾 [${new Date().toLocaleString('pt-BR')}] Executando backup diário (23:00)`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, 'CronService.dailyBackup');
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log('✅ Backup diário agendado (23:00 diariamente)');
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.scheduleDailyBackup');
      throw error;
    }
  }

  /**
   * Cria um job personalizado
   */
  scheduleCustomJob(jobName, cronExpression, callback, description = '') {
    try {
      // Parar job existente se houver
      if (this.jobs.has(jobName)) {
        this.jobs.get(jobName).stop();
        this.jobStatus.set(jobName, false);
      }

      // Criar novo job
      const job = cron.schedule(cronExpression, async () => {
        try {
          console.log(`🔄 [${new Date().toLocaleString('pt-BR')}] Executando job '${jobName}' ${description}`);
          await callback();
        } catch (error) {
          this.errorHandler.logError(error, `CronService.${jobName}`);
        }
      }, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
      });

      this.jobs.set(jobName, job);
      this.jobStatus.set(jobName, true); // Marcar como ativo
      
      console.log(`✅ Job '${jobName}' agendado: ${cronExpression} ${description}`);
      return job;

    } catch (error) {
      this.errorHandler.logError(error, 'CronService.scheduleCustomJob');
      throw error;
    }
  }

  /**
   * Para um job específico
   */
  stopJob(jobName) {
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName).stop();
      this.jobs.delete(jobName);
      this.jobStatus.set(jobName, false); // Marcar como parado
      console.log(`⏹️ Job '${jobName}' parado`);
      return true;
    }
    console.log(`⚠️ Job '${jobName}' não encontrado`);
    return false;
  }

  /**
   * Obtém status de todos os jobs
   */
  getJobsStatus() {
    const status = {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      jobs: []
    };

    for (const [jobName, job] of this.jobs.entries()) {
      status.jobs.push({
        name: jobName,
        isRunning: job.running,
        nextExecution: null // node-cron não fornece próxima execução facilmente
      });
    }

    return status;
  }

  /**
   * Lista todos os jobs ativos
   */
  listActiveJobs() {
    console.log('\n📋 Jobs Ativos:');
    console.log('================');
    
    if (this.jobs.size === 0) {
      console.log('Nenhum job ativo');
      return;
    }

    for (const [jobName] of this.jobs.entries()) {
      const isActive = this.jobStatus.get(jobName) || false;
      const status = isActive ? '🟢 Ativo' : '🔴 Parado';
      
      console.log(`📌 ${jobName}: ${status}`);
    }
  }

  /**
   * Valida expressão cron
   */
  static validateCronExpression(expression) {
    try {
      return cron.validate(expression);
    } catch (error) {
      return false;
    }
  }
}

module.exports = { CronService };
