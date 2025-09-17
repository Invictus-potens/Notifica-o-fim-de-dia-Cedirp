#!/usr/bin/env node

/**
 * Script para remover TODOS os backups timestamped antigos
 * Deixando apenas o sistema de pasta única funcionando
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = 'data';

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

function removeAllTimestampedBackups() {
    console.log('🗑️ Removendo TODOS os backups timestamped antigos...\n');
    
    if (!fs.existsSync(DATA_DIR)) {
        console.log('❌ Diretório de dados não encontrado');
        return;
    }
    
    const backups = fs.readdirSync(DATA_DIR)
        .filter(name => name.startsWith('backup_') && name !== 'backup_current')
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
        console.log('✅ Nenhum backup timestamped encontrado para remover');
        return;
    }

    console.log(`📊 Total de backups timestamped encontrados: ${backups.length}`);
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    console.log(`💾 Espaço total ocupado: ${formatBytes(totalSize)}\n`);

    console.log('🗑️ Removendo todos os backups timestamped:');
    
    let deletedSize = 0;
    let deletedCount = 0;
    
    backups.forEach((backup, index) => {
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
    console.log(`💾 Espaço liberado: ${formatBytes(deletedSize)}`);
    
    // Verificar se existe backup_current
    const currentBackupPath = path.join(DATA_DIR, 'backup_current');
    if (fs.existsSync(currentBackupPath)) {
        const currentSize = getDirectorySize(currentBackupPath);
        console.log(`📁 Pasta de backup única mantida: backup_current (${formatBytes(currentSize)})`);
    } else {
        console.log('📁 Pasta de backup única será criada automaticamente quando necessário');
    }
}

// Processar argumentos da linha de comando
const command = process.argv[2];

if (command === 'confirm') {
    removeAllTimestampedBackups();
} else {
    console.log('🗂️ Script de Limpeza Completa de Backups Timestamped');
    console.log('');
    console.log('⚠️  ATENÇÃO: Este script remove TODOS os backups timestamped antigos!');
    console.log('   Apenas a pasta backup_current será mantida (se existir).');
    console.log('');
    console.log('Para executar a limpeza:');
    console.log('   node scripts/cleanup-all-backups.js confirm');
    console.log('');
}
