#!/usr/bin/env node

/**
 * Script para remover arquivos de teste desnecessários
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileSize(filePath) {
    try {
        return fs.statSync(filePath).size;
    } catch (error) {
        return 0;
    }
}

function analyzeTestFiles() {
    console.log('🧪 Analisando arquivos de teste...\n');
    
    const testPatterns = [
        'test-*.js',
        'examples/test-*.js',
        'scripts/test-*.js'
    ];
    
    let totalFiles = 0;
    let totalSize = 0;
    
    // Buscar arquivos de teste
    const testFiles = [];
    
    function findTestFiles(dir) {
        try {
            const items = fs.readdirSync(dir);
            
            items.forEach(item => {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isFile() && item.includes('test')) {
                    testFiles.push(itemPath);
                    totalFiles++;
                    totalSize += stats.size;
                } else if (stats.isDirectory() && !item.includes('node_modules')) {
                    findTestFiles(itemPath);
                }
            });
        } catch (error) {
            // Ignorar erros
        }
    }
    
    findTestFiles('.');
    
    console.log(`📁 Arquivos de teste encontrados: ${totalFiles}`);
    console.log(`💾 Tamanho total: ${formatBytes(totalSize)}\n`);
    
    // Categorizar arquivos
    const categories = {
        examples: testFiles.filter(f => f.includes('examples')),
        scripts: testFiles.filter(f => f.includes('scripts') && f.includes('test')),
        root: testFiles.filter(f => !f.includes('examples') && !f.includes('scripts'))
    };
    
    console.log('📋 Categorias:');
    console.log(`   📚 Exemplos: ${categories.examples.length} arquivos`);
    console.log(`   🔧 Scripts: ${categories.scripts.length} arquivos`);
    console.log(`   📄 Raiz: ${categories.root.length} arquivos\n`);
    
    return { testFiles, totalFiles, totalSize, categories };
}

function cleanupTests(keepScripts = true) {
    console.log('🗑️ Removendo arquivos de teste...\n');
    
    const analysis = analyzeTestFiles();
    let removedFiles = 0;
    let freedSpace = 0;
    
    analysis.testFiles.forEach(filePath => {
        // Manter scripts de teste se solicitado
        if (keepScripts && filePath.includes('scripts') && filePath.includes('test')) {
            console.log(`⚠️ Mantido: ${filePath} (script útil)`);
            return;
        }
        
        try {
            const size = getFileSize(filePath);
            fs.unlinkSync(filePath);
            console.log(`✅ Removido: ${filePath}`);
            removedFiles++;
            freedSpace += size;
        } catch (error) {
            console.error(`❌ Erro ao remover ${filePath}: ${error.message}`);
        }
    });
    
    // Remover diretório examples se estiver vazio
    try {
        const examplesDir = './examples';
        if (fs.existsSync(examplesDir)) {
            const remainingFiles = fs.readdirSync(examplesDir);
            if (remainingFiles.length === 0) {
                fs.rmdirSync(examplesDir);
                console.log('✅ Diretório examples vazio removido');
            }
        }
    } catch (error) {
        // Ignorar erro
    }
    
    console.log(`\n📊 Limpeza de testes concluída:`);
    console.log(`   🗑️ Arquivos removidos: ${removedFiles}`);
    console.log(`   💾 Espaço liberado: ${formatBytes(freedSpace)}`);
    
    return { removedFiles, freedSpace };
}

// Processar argumentos
const command = process.argv[2];

if (command === 'analyze') {
    analyzeTestFiles();
} else if (command === 'clean') {
    analyzeTestFiles();
    console.log('⚠️ Esta operação removerá arquivos de teste desnecessários');
    console.log('   📚 Exemplos serão removidos');
    console.log('   🔧 Scripts úteis serão mantidos\n');
    
    cleanupTests(true);
    
    console.log('\n✅ Projeto de produção otimizado!');
    
} else if (command === 'clean-all') {
    analyzeTestFiles();
    console.log('⚠️ Esta operação removerá TODOS os arquivos de teste');
    console.log('   📚 Exemplos serão removidos');
    console.log('   🔧 Scripts também serão removidos\n');
    
    cleanupTests(false);
    
    console.log('\n✅ Projeto completamente limpo!');
    
} else {
    console.log('🧪 Script de Limpeza de Testes');
    console.log('=============================\n');
    console.log('Uso: node scripts/cleanup-tests.js [comando]');
    console.log('');
    console.log('Comandos:');
    console.log('  analyze    - Analisar arquivos de teste sem remover');
    console.log('  clean      - Remover exemplos, manter scripts úteis');
    console.log('  clean-all  - Remover TODOS os arquivos de teste');
    console.log('');
    console.log('💡 Recomendação para produção: clean');
}
