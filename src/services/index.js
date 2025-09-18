// Exportações dos serviços do sistema de monitoramento
const { ErrorHandler } = require('./ErrorHandler');
const { ConfigManager } = require('./ConfigManager');
const { JsonPatientManager } = require('./JsonPatientManager');
const { KrolikApiClient } = require('./KrolikApiClient');
const { MonitoringService } = require('./MonitoringService');
const { MessageService } = require('./MessageService');
const { CronService } = require('./CronService');
const { ProductionScheduler } = require('./ProductionScheduler');

module.exports = {
  ErrorHandler,
  ConfigManager,
  JsonPatientManager,
  KrolikApiClient,
  MonitoringService,
  MessageService,
  CronService,
  ProductionScheduler
};
