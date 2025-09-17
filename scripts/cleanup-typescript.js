#!/usr/bin/env node

/**
 * Script para remover arquivos TypeScript desnecessários após migração
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Script de Limpeza TypeScript');
console.log('==============================\n');

function removeDirectory(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            if (process.platform === 'win32') {
                execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
            } else {
                execSync(`rm -rf "${dirPath}"`, { stdio: 'ignore' });
            }
            console.log(`✅ Removido: ${dirPath}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Erro ao remover ${dirPath}: ${error.message}`);
        return false;
    }
    return false;
}

function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✅ Removido: ${filePath}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Erro ao remover ${filePath}: ${error.message}`);
        return false;
    }
    return false;
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
    
    if (fs.existsSync(dirPath)) {
        calculateSize(dirPath);
    }
    return size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeTypeScriptFiles() {
    console.log('📊 Analisando arquivos TypeScript...\n');
    
    let totalFiles = 0;
    let totalSize = 0;
    
    // Contar arquivos .ts
    function countTsFiles(dir) {
        try {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isFile() && item.endsWith('.ts')) {
                    totalFiles++;
                    totalSize += stats.size;
                } else if (stats.isDirectory() && !item.includes('node_modules')) {
                    countTsFiles(itemPath);
                }
            });
        } catch (error) {
            // Ignorar erros
        }
    }
    
    countTsFiles('./src');
    
    // Calcular tamanho da pasta dist
    const distSize = getDirectorySize('./dist');
    
    console.log(`📁 Arquivos TypeScript encontrados: ${totalFiles}`);
    console.log(`💾 Tamanho dos arquivos .ts: ${formatBytes(totalSize)}`);
    console.log(`📦 Tamanho da pasta dist/: ${formatBytes(distSize)}`);
    console.log(`💾 Total a ser liberado: ${formatBytes(totalSize + distSize)}\n`);
    
    return { totalFiles, totalSize: totalSize + distSize };
}

function cleanupTypeScript() {
    console.log('🗑️ Removendo arquivos TypeScript...\n');
    
    let removedFiles = 0;
    let freedSpace = 0;
    
    // Remover pasta dist
    const distSize = getDirectorySize('./dist');
    if (removeDirectory('./dist')) {
        freedSpace += distSize;
    }
    
    // Remover tsconfig.json
    if (removeFile('./tsconfig.json')) {
        removedFiles++;
    }
    
    // Remover arquivos .ts recursivamente
    function removeTsFiles(dir) {
        try {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isFile() && item.endsWith('.ts')) {
                    freedSpace += stats.size;
                    if (removeFile(itemPath)) {
                        removedFiles++;
                    }
                } else if (stats.isDirectory() && !item.includes('node_modules')) {
                    removeTsFiles(itemPath);
                    
                    // Remover diretório se estiver vazio
                    try {
                        const remainingItems = fs.readdirSync(itemPath);
                        if (remainingItems.length === 0) {
                            fs.rmdirSync(itemPath);
                            console.log(`✅ Diretório vazio removido: ${itemPath}`);
                        }
                    } catch (error) {
                        // Ignorar erro
                    }
                }
            });
        } catch (error) {
            // Ignorar erros
        }
    }
    
    removeTsFiles('./src');
    
    console.log(`\n📊 Limpeza concluída:`);
    console.log(`   🗑️ Arquivos removidos: ${removedFiles}`);
    console.log(`   💾 Espaço liberado: ${formatBytes(freedSpace)}`);
    
    return { removedFiles, freedSpace };
}

// Processar argumentos
const command = process.argv[2];

if (command === 'analyze') {
    analyzeTypeScriptFiles();
} else if (command === 'clean') {
    const analysis = analyzeTypeScriptFiles();
    
    console.log('⚠️ ATENÇÃO: Esta operação removerá TODOS os arquivos TypeScript!');
    console.log(`   📁 ${analysis.totalFiles} arquivos serão removidos`);
    console.log(`   💾 ${formatBytes(analysis.totalSize)} de espaço será liberado\n`);
    
    console.log('🚀 Executando limpeza...\n');
    cleanupTypeScript();
    
    console.log('\n✅ Projeto agora é 100% JavaScript!');
    console.log('🚀 Para iniciar: node src/index.js');
    
} else {
    console.log('Uso: node scripts/cleanup-typescript.js [comando]');
    console.log('');
    console.log('Comandos:');
    console.log('  analyze  - Analisar arquivos TypeScript sem remover');
    console.log('  clean    - Remover todos os arquivos TypeScript');
    console.log('');
    console.log('⚠️ ATENÇÃO: O comando clean é irreversível!');
    console.log('   Certifique-se de que o sistema JavaScript está funcionando.');
}
