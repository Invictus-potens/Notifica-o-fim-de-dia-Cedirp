#!/usr/bin/env node

/**
 * Script para limpeza de backups antigos
 * Automação de Mensagem de Espera - CAM Krolik Integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = 'data';
const DEFAULT_MAX_BACKUPS = 10;

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
    let size = 0;
    
    function calculateSize(itemPath) {
        try {
            const stats = fs.statSync(itemPath);
            
            if (stats.isFile()) {
                size += stats.size;
            } else if (stats.isDirectory()) {
                const items = fs.readdirSync(itemPath);
                items.forEach(item => {
                    calculateSize(path.join(itemPath, item));
                });
            }
        } catch (error) {
            // Ignorar erros de acesso
        }
    }
    
    calculateSize(dirPath);
    return size;
}

function listBackups() {
    console.log('📋 Analisando backups existentes...\n');
    
    if (!fs.existsSync(DATA_DIR)) {
        console.log('❌ Diretório de dados não encontrado');
        return [];
    }
    
    const backups = fs.readdirSync(DATA_DIR)
        .filter(name => name.startsWith('backup_'))
        .map(name => {
            const backupPath = path.join(DATA_DIR, name);
            const stats = fs.statSync(backupPath);
            
            return {
                name,
                path: backupPath,
                created: stats.mtime,
                size: getDirectorySize(backupPath)
            };
        })
        .sort((a, b) => b.created - a.created);
    
    if (backups.length === 0) {
        console.log('✅ Nenhum backup encontrado');
        return [];
    }

    console.log(`📊 Total de backups encontrados: ${backups.length}`);
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    console.log(`💾 Espaço total ocupado: ${formatBytes(totalSize)}\n`);

    console.log('📁 Lista de backups (mais recente primeiro):');
    backups.forEach((backup, index) => {
        const age = Math.round((Date.now() - backup.created.getTime()) / (1000 * 60 * 60));
        console.log(`   ${index + 1}. ${backup.name}`);
        console.log(`      Criado: ${backup.created.toLocaleString('pt-BR')}`);
        console.log(`      Idade: ${age}h`);
        console.log(`      Tamanho: ${formatBytes(backup.size)}`);
        console.log('');
    });

    return backups;
}

function cleanupBackups(maxBackups = DEFAULT_MAX_BACKUPS) {
    console.log(`🧹 Iniciando limpeza de backups (mantendo ${maxBackups} mais recentes)...\n`);
    
    const backups = listBackups();
    
    if (backups.length <= maxBackups) {
        console.log(`✅ Nenhuma limpeza necessária. Backups atuais (${backups.length}) <= máximo permitido (${maxBackups})`);
        return;
    }

    const backupsToDelete = backups.slice(maxBackups);
    const backupsToKeep = backups.slice(0, maxBackups);
    
    console.log(`🗑️ Serão removidos ${backupsToDelete.length} backups antigos:`);
    
    let deletedSize = 0;
    let deletedCount = 0;
    
    backupsToDelete.forEach((backup, index) => {
        try {
            console.log(`   ${index + 1}. Removendo: ${backup.name} (${formatBytes(backup.size)})`);
            
            // Usar execSync para compatibilidade com Windows
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${backup.path}"`, { stdio: 'ignore' });
            } else {
                execSync(`rm -rf "${backup.path}"`, { stdio: 'ignore' });
            }
            
            deletedSize += backup.size;
            deletedCount++;
        } catch (error) {
            console.error(`   ❌ Erro ao remover ${backup.name}: ${error.message}`);
        }
    });
    
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`📊 Backups removidos: ${deletedCount}`);
    console.log(`📊 Backups mantidos: ${backupsToKeep.length}`);
    console.log(`💾 Espaço liberado: ${formatBytes(deletedSize)}`);
    
    const remainingSize = backupsToKeep.reduce((sum, backup) => sum + backup.size, 0);
    console.log(`💾 Espaço ocupado restante: ${formatBytes(remainingSize)}`);
}

function cleanupOldBackups(daysOld = 7) {
    console.log(`🧹 Removendo backups com mais de ${daysOld} dias...\n`);
    
    const backups = listBackups();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const backupsToDelete = backups.filter(backup => backup.created.getTime() < cutoffTime);
    
    if (backupsToDelete.length === 0) {
        console.log(`✅ Nenhum backup com mais de ${daysOld} dias encontrado`);
        return;
    }

    console.log(`🗑️ Serão removidos ${backupsToDelete.length} backups antigos:`);
    
    let deletedSize = 0;
    let deletedCount = 0;
    
    backupsToDelete.forEach((backup, index) => {
        try {
            const age = Math.round((Date.now() - backup.created.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`   ${index + 1}. Removendo: ${backup.name} (${age} dias, ${formatBytes(backup.size)})`);
            
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${backup.path}"`, { stdio: 'ignore' });
            } else {
                execSync(`rm -rf "${backup.path}"`, { stdio: 'ignore' });
            }
            
            deletedSize += backup.size;
            deletedCount++;
        } catch (error) {
            console.error(`   ❌ Erro ao remover ${backup.name}: ${error.message}`);
        }
    });
    
    console.log(`\n✅ Limpeza concluída!`);
    console.log(`📊 Backups removidos: ${deletedCount}`);
    console.log(`💾 Espaço liberado: ${formatBytes(deletedSize)}`);
}

// Processar argumentos da linha de comando
const command = process.argv[2];
const param = process.argv[3];

switch (command) {
    case 'list':
        listBackups();
        break;
    case 'clean':
        const maxBackups = param ? parseInt(param) : DEFAULT_MAX_BACKUPS;
        if (isNaN(maxBackups) || maxBackups < 1) {
            console.error('❌ Número máximo de backups deve ser um número positivo');
            process.exit(1);
        }
        cleanupBackups(maxBackups);
        break;
    case 'clean-old':
        const daysOld = param ? parseInt(param) : 7;
        if (isNaN(daysOld) || daysOld < 1) {
            console.error('❌ Número de dias deve ser um número positivo');
            process.exit(1);
        }
        cleanupOldBackups(daysOld);
        break;
    default:
        console.log('🗂️ Script de Limpeza de Backups');
        console.log('');
        console.log('Uso: node scripts/cleanup-backups.js [comando] [parâmetro]');
        console.log('');
        console.log('Comandos:');
        console.log('  list              - Listar todos os backups existentes');
        console.log('  clean [N]         - Manter apenas os N backups mais recentes (padrão: 10)');
        console.log('  clean-old [dias]  - Remover backups com mais de X dias (padrão: 7)');
        console.log('');
        console.log('Exemplos:');
        console.log('  node scripts/cleanup-backups.js list');
        console.log('  node scripts/cleanup-backups.js clean 5');
        console.log('  node scripts/cleanup-backups.js clean-old 3');
        process.exit(1);
}
