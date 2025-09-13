#!/usr/bin/env node

/**
 * Script de backup para Automação de Mensagem de Espera
 * CAM Krolik Integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = 'data/backup';
const LOG_DIR = 'logs';

function createBackup() {
    console.log('🗄️  Iniciando backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
    
    // Criar diretório de backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    fs.mkdirSync(backupPath, { recursive: true });
    
    try {
        // Backup de logs
        if (fs.existsSync(LOG_DIR)) {
            console.log('📋 Fazendo backup dos logs...');
            execSync(`cp -r ${LOG_DIR} ${backupPath}/`);
        }
        
        // Backup de configurações
        const configFiles = ['.env', 'ecosystem.config.js', 'docker-compose.yml'];
        configFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`⚙️  Fazendo backup de ${file}...`);
                fs.copyFileSync(file, path.join(backupPath, file));
            }
        });
        
        // Backup de dados locais (se existirem)
        const dataDir = 'data/local';
        if (fs.existsSync(dataDir)) {
            console.log('💾 Fazendo backup dos dados locais...');
            execSync(`cp -r ${dataDir} ${backupPath}/`);
        }
        
        // Criar arquivo de metadados
        const metadata = {
            timestamp: new Date().toISOString(),
            version: require('../package.json').version,
            nodeVersion: process.version,
            platform: process.platform
        };
        
        fs.writeFileSync(
            path.join(backupPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        console.log(`✅ Backup criado com sucesso: ${backupPath}`);
        
        // Limpar backups antigos (manter apenas os últimos 7)
        cleanOldBackups();
        
    } catch (error) {
        console.error('❌ Erro durante o backup:', error.message);
        process.exit(1);
    }
}

function cleanOldBackups() {
    console.log('🧹 Limpando backups antigos...');
    
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(name => name.startsWith('backup-'))
            .map(name => ({
                name,
                path: path.join(BACKUP_DIR, name),
                mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);
        
        // Manter apenas os últimos 7 backups
        const toDelete = backups.slice(7);
        
        toDelete.forEach(backup => {
            console.log(`🗑️  Removendo backup antigo: ${backup.name}`);
            execSync(`rm -rf "${backup.path}"`);
        });
        
        console.log(`📊 Backups mantidos: ${Math.min(backups.length, 7)}`);
        
    } catch (error) {
        console.warn('⚠️  Erro ao limpar backups antigos:', error.message);
    }
}

function listBackups() {
    console.log('📋 Backups disponíveis:');
    
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log('   Nenhum backup encontrado');
        return;
    }
    
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(name => name.startsWith('backup-'))
        .map(name => {
            const backupPath = path.join(BACKUP_DIR, name);
            const stats = fs.statSync(backupPath);
            const metadataPath = path.join(backupPath, 'metadata.json');
            
            let metadata = {};
            if (fs.existsSync(metadataPath)) {
                metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            }
            
            return {
                name,
                created: stats.mtime.toISOString(),
                size: getDirectorySize(backupPath),
                version: metadata.version || 'unknown'
            };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    backups.forEach(backup => {
        console.log(`   ${backup.name}`);
        console.log(`     Criado: ${backup.created}`);
        console.log(`     Versão: ${backup.version}`);
        console.log(`     Tamanho: ${formatBytes(backup.size)}`);
        console.log('');
    });
}

function getDirectorySize(dirPath) {
    let size = 0;
    
    function calculateSize(itemPath) {
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
            size += stats.size;
        } else if (stats.isDirectory()) {
            const items = fs.readdirSync(itemPath);
            items.forEach(item => {
                calculateSize(path.join(itemPath, item));
            });
        }
    }
    
    calculateSize(dirPath);
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Processar argumentos da linha de comando
const command = process.argv[2];

switch (command) {
    case 'create':
        createBackup();
        break;
    case 'list':
        listBackups();
        break;
    case 'clean':
        cleanOldBackups();
        break;
    default:
        console.log('Uso: node scripts/backup.js [create|list|clean]');
        console.log('');
        console.log('Comandos:');
        console.log('  create  - Criar novo backup');
        console.log('  list    - Listar backups existentes');
        console.log('  clean   - Limpar backups antigos');
        process.exit(1);
}