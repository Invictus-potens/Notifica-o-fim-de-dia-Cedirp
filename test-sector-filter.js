#!/usr/bin/env node

/**
 * Script de teste para verificar o filtro de setores
 * Este script simula dados de atendimentos e testa a funcionalidade de filtro
 */

console.log('🧪 ===========================================');
console.log('   TESTE DO FILTRO DE SETORES');
console.log('===========================================');

// Simular dados de setores
const sectors = [
    { id: '65eb53aa0e74e281e12ba594', name: 'Grupos WhatsApp/Setor geral' },
    { id: '65eb5a0e681c0098402e5839', name: 'Ressonância Magnética' },
    { id: '65eb5a1a01515baa7f9c6b9f', name: 'Tomografia Computadorizada' },
    { id: '65eb5a217b2ad8749ef7aa42', name: 'Ultrassom' },
    { id: '65eb5a270c00c6ae4943cdc6', name: 'Mamografia' },
    { id: '65eb5a3501515baa7fa15ef8', name: 'Densitometria Óssea' },
    { id: '65eb5a3c01515baa7fa25c4a', name: 'Cardiologia' },
    { id: '65eb5a420c00c6ae49486316', name: 'Raio X' },
    { id: '65eb5a4d973bd0cedb32efa2', name: 'Biopsias e Procedimentos' },
    { id: '65eb5a52973bd0cedb33df0d', name: 'Outros' }
];

// Simular dados de atendimentos
const mockAttendances = {
    'channel1': {
        channel: { id: 'channel1', name: 'WhatsApp Oficial', number: '5511999999999', active: true },
        attendances: [
            {
                id: 'att1',
                name: 'João Silva',
                phone: '5511888888888',
                sectorName: 'Cardiologia',
                channelId: 'channel1',
                channelName: 'WhatsApp Oficial',
                channelNumber: '5511999999999',
                waitTimeMinutes: 45
            },
            {
                id: 'att2',
                name: 'Maria Santos',
                phone: '5511777777777',
                sectorName: 'Ultrassom',
                channelId: 'channel1',
                channelName: 'WhatsApp Oficial',
                channelNumber: '5511999999999',
                waitTimeMinutes: 30
            },
            {
                id: 'att3',
                name: 'Pedro Costa',
                phone: '5511666666666',
                sectorName: 'Cardiologia',
                channelId: 'channel1',
                channelName: 'WhatsApp Oficial',
                channelNumber: '5511999999999',
                waitTimeMinutes: 60
            }
        ],
        count: 3
    },
    'channel2': {
        channel: { id: 'channel2', name: 'Confirmação 1', number: '5511555555555', active: true },
        attendances: [
            {
                id: 'att4',
                name: 'Ana Oliveira',
                phone: '5511444444444',
                sectorName: 'Tomografia Computadorizada',
                channelId: 'channel2',
                channelName: 'Confirmação 1',
                channelNumber: '5511555555555',
                waitTimeMinutes: 25
            },
            {
                id: 'att5',
                name: 'Carlos Lima',
                phone: '5511333333333',
                sectorName: 'Ressonância Magnética',
                channelId: 'channel2',
                channelName: 'Confirmação 1',
                channelNumber: '5511555555555',
                waitTimeMinutes: 40
            }
        ],
        count: 2
    }
};

// Função para mapear nome do setor para ID
function getSectorIdByName(sectorName, sectors) {
    if (!sectorName || !sectors || sectors.length === 0) {
        return null;
    }
    
    const sector = sectors.find(s => 
        s.name === sectorName || 
        s.name.toLowerCase() === sectorName.toLowerCase()
    );
    
    return sector ? sector.id : null;
}

// Função para simular o carregamento de pacientes
function loadPatientsFromAttendances(attendancesByChannel, sectors) {
    const patients = [];
    
    Object.values(attendancesByChannel).forEach(channelData => {
        const { attendances } = channelData;
        
        attendances.forEach(attendance => {
            const patientData = {
                name: attendance.name || 'Nome não informado',
                phone: attendance.phone || '',
                sectorName: attendance.sectorName || 'Setor não informado',
                sectorId: getSectorIdByName(attendance.sectorName, sectors),
                channelId: attendance.channelId,
                channelName: attendance.channelName,
                channelNumber: attendance.channelNumber,
                waitTimeMinutes: attendance.waitTimeMinutes || 0,
                attendanceId: attendance.id,
                ...attendance
            };
            
            patients.push(patientData);
        });
    });
    
    return patients;
}

// Função para filtrar pacientes por setor
function filterPatientsBySector(patients, sectorId) {
    if (!sectorId) {
        return patients;
    }
    
    return patients.filter(patient => patient.sectorId === sectorId);
}

// Executar testes
console.log('📊 Testando carregamento de pacientes...');
const patients = loadPatientsFromAttendances(mockAttendances, sectors);
console.log(`✅ ${patients.length} pacientes carregados`);

// Mostrar setores encontrados
const sectorsFound = [...new Set(patients.map(p => p.sectorName))];
console.log('📋 Setores encontrados nos dados:', sectorsFound);

console.log('\n🔍 Testando filtros por setor...');

// Teste 1: Filtrar por Cardiologia
const cardiologyId = getSectorIdByName('Cardiologia', sectors);
console.log(`\n1. Filtrando por Cardiologia (ID: ${cardiologyId})`);
const cardiologyPatients = filterPatientsBySector(patients, cardiologyId);
console.log(`   Resultado: ${cardiologyPatients.length} pacientes`);
cardiologyPatients.forEach(p => {
    console.log(`   - ${p.name} (${p.sectorName}) - ${p.waitTimeMinutes} min`);
});

// Teste 2: Filtrar por Ultrassom
const ultrasoundId = getSectorIdByName('Ultrassom', sectors);
console.log(`\n2. Filtrando por Ultrassom (ID: ${ultrasoundId})`);
const ultrasoundPatients = filterPatientsBySector(patients, ultrasoundId);
console.log(`   Resultado: ${ultrasoundPatients.length} pacientes`);
ultrasoundPatients.forEach(p => {
    console.log(`   - ${p.name} (${p.sectorName}) - ${p.waitTimeMinutes} min`);
});

// Teste 3: Filtrar por setor inexistente
const nonExistentId = 'inexistente';
console.log(`\n3. Filtrando por setor inexistente (ID: ${nonExistentId})`);
const nonExistentPatients = filterPatientsBySector(patients, nonExistentId);
console.log(`   Resultado: ${nonExistentPatients.length} pacientes`);

// Teste 4: Sem filtro (todos)
console.log(`\n4. Sem filtro (todos os pacientes)`);
const allPatients = filterPatientsBySector(patients, null);
console.log(`   Resultado: ${allPatients.length} pacientes`);

console.log('\n✅ ===========================================');
console.log('   TESTE CONCLUÍDO');
console.log('===========================================');

// Verificar se os resultados estão corretos
const expectedResults = {
    cardiology: 2,
    ultrasound: 1,
    nonExistent: 0,
    all: 5
};

const actualResults = {
    cardiology: cardiologyPatients.length,
    ultrasound: ultrasoundPatients.length,
    nonExistent: nonExistentPatients.length,
    all: allPatients.length
};

const testsPassed = Object.keys(expectedResults).every(key => 
    expectedResults[key] === actualResults[key]
);

if (testsPassed) {
    console.log('🎯 Todos os testes passaram! O filtro está funcionando corretamente.');
} else {
    console.log('❌ Alguns testes falharam:');
    Object.keys(expectedResults).forEach(key => {
        if (expectedResults[key] !== actualResults[key]) {
            console.log(`   ${key}: esperado ${expectedResults[key]}, obtido ${actualResults[key]}`);
        }
    });
}

console.log('\n🏁 Teste finalizado');
