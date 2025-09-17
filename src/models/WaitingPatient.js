/**
 * @typedef {Object} WaitingPatient
 * @property {string} id - ID único do paciente
 * @property {string} name - Nome do paciente
 * @property {string} phone - Telefone do paciente
 * @property {string} sectorId - ID do setor
 * @property {string} sectorName - Nome do setor
 * @property {string} channelId - ID do canal
 * @property {'normal'|'api_oficial'} channelType - Tipo do canal
 * @property {Date} waitStartTime - Horário de início da espera
 * @property {number} waitTimeMinutes - Tempo de espera em minutos
 */

/**
 * Valida se um objeto é um WaitingPatient válido
 * @param {any} patient - Objeto a ser validado
 * @returns {boolean} - True se válido
 */
function validateWaitingPatient(patient) {
  if (!patient || typeof patient !== 'object') {
    return false;
  }

  // Validar campos obrigatórios
  if (!patient.id || typeof patient.id !== 'string' || patient.id.trim() === '') {
    return false;
  }

  if (!patient.name || typeof patient.name !== 'string' || patient.name.trim() === '') {
    return false;
  }

  if (!patient.phone || typeof patient.phone !== 'string' || patient.phone.trim() === '') {
    return false;
  }

  if (!patient.sectorId || typeof patient.sectorId !== 'string' || patient.sectorId.trim() === '') {
    return false;
  }

  if (!patient.sectorName || typeof patient.sectorName !== 'string' || patient.sectorName.trim() === '') {
    return false;
  }

  if (!patient.channelId || typeof patient.channelId !== 'string' || patient.channelId.trim() === '') {
    return false;
  }

  // Validar channelType
  if (!patient.channelType || !['normal', 'api_oficial'].includes(patient.channelType)) {
    return false;
  }

  // Validar waitStartTime
  if (!patient.waitStartTime || !(patient.waitStartTime instanceof Date) || isNaN(patient.waitStartTime.getTime())) {
    return false;
  }

  // Validar waitTimeMinutes
  if (typeof patient.waitTimeMinutes !== 'number' || patient.waitTimeMinutes < 0) {
    return false;
  }

  return true;
}

/**
 * Cria um WaitingPatient a partir de dados parciais
 * @param {Partial<WaitingPatient>} data - Dados parciais do paciente
 * @returns {WaitingPatient|null} - Paciente válido ou null se inválido
 */
function createWaitingPatient(data) {
  const patient = {
    id: data.id || '',
    name: data.name || '',
    phone: data.phone || '',
    sectorId: data.sectorId || '',
    sectorName: data.sectorName || '',
    channelId: data.channelId || '',
    channelType: data.channelType || 'normal',
    waitStartTime: data.waitStartTime || new Date(),
    waitTimeMinutes: data.waitTimeMinutes || 0
  };

  return validateWaitingPatient(patient) ? patient : null;
}

module.exports = {
  validateWaitingPatient,
  createWaitingPatient
};
