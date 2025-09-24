#!/usr/bin/env node

/**
 * Script para validar e corrigir arquivos JSON do sistema
 * Verifica se todos os arquivos JSON estão válidos e os corrige se necessário
 */

const fs = require('fs');
const path = require('path');

class JsonValidator {
  constructor() {
    this.dataDir = 'data';
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Executa validação completa
   */
  async validateAll() {
    console.log('🔍 ===========================================');
    console.log('   VALIDAÇÃO DE ARQUIVOS JSON');
    console.log('===========================================');
    console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
    console.log('===========================================\n');

    try {
      // Listar todos os arquivos JSON na pasta data
      const jsonFiles = this.getJsonFiles();
      
      console.log(`📋 Encontrados ${jsonFiles.length} arquivos JSON para validar:\n`);
      
      for (const file of jsonFiles) {
        await this.validateFile(file);
      }
      
      this.showResults();
      
    } catch (error) {
      console.error('❌ Erro na validação:', error.message);
    }
  }

  /**
   * Obtém lista de arquivos JSON
   */
  getJsonFiles() {
    try {
      const files = fs.readdirSync(this.dataDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(this.dataDir, file));
    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error.message);
      return [];
    }
  }

  /**
   * Valida um arquivo JSON específico
   */
  async validateFile(filePath) {
    const fileName = path.basename(filePath);
    console.log(`🔍 Validando: ${fileName}`);
    
    try {
      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️ Arquivo não existe: ${fileName}`);
        this.errors.push({ file: fileName, error: 'Arquivo não existe' });
        return;
      }

      // Ler conteúdo
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Verificar se está vazio
      if (!content || content.trim() === '') {
        console.log(`   ⚠️ Arquivo vazio: ${fileName}`);
        await this.fixEmptyFile(filePath, fileName);
        return;
      }

      // Tentar fazer parse do JSON
      try {
        JSON.parse(content);
        console.log(`   ✅ Válido: ${fileName}`);
      } catch (parseError) {
        console.log(`   ❌ JSON inválido: ${fileName} - ${parseError.message}`);
        await this.fixCorruptedFile(filePath, fileName, parseError);
      }

    } catch (error) {
      console.log(`   ❌ Erro ao validar ${fileName}: ${error.message}`);
      this.errors.push({ file: fileName, error: error.message });
    }
  }

  /**
   * Corrige arquivo vazio
   */
  async fixEmptyFile(filePath, fileName) {
    try {
      console.log(`   🔧 Corrigindo arquivo vazio: ${fileName}`);
      
      // Determinar estrutura padrão baseada no nome do arquivo
      const defaultStructure = this.getDefaultStructure(fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(defaultStructure, null, 2));
      console.log(`   ✅ Arquivo vazio corrigido: ${fileName}`);
      
      this.fixedFiles.push({ file: fileName, action: 'Arquivo vazio corrigido' });
      
    } catch (error) {
      console.log(`   ❌ Erro ao corrigir arquivo vazio ${fileName}: ${error.message}`);
      this.errors.push({ file: fileName, error: `Erro ao corrigir arquivo vazio: ${error.message}` });
    }
  }

  /**
   * Corrige arquivo corrompido
   */
  async fixCorruptedFile(filePath, fileName, parseError) {
    try {
      console.log(`   🔧 Tentando corrigir arquivo corrompido: ${fileName}`);
      
      // Fazer backup do arquivo corrompido
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`   💾 Backup criado: ${path.basename(backupPath)}`);
      
      // Recriar arquivo com estrutura padrão
      const defaultStructure = this.getDefaultStructure(fileName);
      fs.writeFileSync(filePath, JSON.stringify(defaultStructure, null, 2));
      console.log(`   ✅ Arquivo corrompido corrigido: ${fileName}`);
      
      this.fixedFiles.push({ 
        file: fileName, 
        action: 'Arquivo corrompido corrigido',
        backup: path.basename(backupPath)
      });
      
    } catch (error) {
      console.log(`   ❌ Erro ao corrigir arquivo corrompido ${fileName}: ${error.message}`);
      this.errors.push({ file: fileName, error: `Erro ao corrigir arquivo corrompido: ${error.message}` });
    }
  }

  /**
   * Obtém estrutura padrão baseada no nome do arquivo
   */
  getDefaultStructure(fileName) {
    const now = new Date().toISOString();
    
    switch (fileName) {
      case 'messages_sent.json':
        return {
          messages: [],
          lastCleanup: null,
          totalSent: 0,
          createdAt: now
        };
        
      case 'patients_active.json':
        return [];
        
      case 'patients_processed.json':
        return [];
        
      case 'patients_history.json':
        return [];
        
      case 'patients_backup.json':
        return [];
        
      case 'user_actions.json':
        return [];
        
      case 'system_config.json':
        return {
          excludedSectors: "[]",
          excludedChannels: "[]",
          flowPaused: "false",
          endOfDayPaused: "false",
          ignoreBusinessHours: "true",
          minWaitTime: "30",
          maxWaitTime: "40",
          selectedActionCard: "",
          selectedActionCard30Min: "",
          selectedActionCardEndDay: "",
          selectedTemplate: "",
          startOfDayTime: "08:00",
          endOfDayTime: "18:00",
          saturdayStartTime: "08:00",
          saturdayEndTime: "12:00",
          logCleanupTime: "23:59",
          refreshInterval: "60",
          channels: [],
          channelMetrics: {}
        };
        
      case 'message_metrics.json':
        return {
          totalSent: 0,
          totalFailed: 0,
          lastSent: null,
          dailyStats: {},
          channelStats: {},
          createdAt: now
        };
        
      default:
        return {};
    }
  }

  /**
   * Mostra resultados da validação
   */
  showResults() {
    console.log('\n📊 ===========================================');
    console.log('   RESULTADOS DA VALIDAÇÃO');
    console.log('===========================================');
    
    if (this.fixedFiles.length > 0) {
      console.log(`\n✅ ${this.fixedFiles.length} arquivo(s) corrigido(s):`);
      this.fixedFiles.forEach(fix => {
        console.log(`   🔧 ${fix.file}: ${fix.action}`);
        if (fix.backup) {
          console.log(`      💾 Backup: ${fix.backup}`);
        }
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ${this.errors.length} erro(s) encontrado(s):`);
      this.errors.forEach(error => {
        console.log(`   ❌ ${error.file}: ${error.error}`);
      });
    }
    
    if (this.fixedFiles.length === 0 && this.errors.length === 0) {
      console.log('\n🎉 Todos os arquivos JSON estão válidos!');
    }
    
    console.log('\n===========================================');
    console.log('🏁 VALIDAÇÃO CONCLUÍDA');
    console.log('===========================================');
  }
}

// Executar validação
async function main() {
  const validator = new JsonValidator();
  await validator.validateAll();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro na validação:', error.message);
    process.exit(1);
  });
}

module.exports = { JsonValidator };
