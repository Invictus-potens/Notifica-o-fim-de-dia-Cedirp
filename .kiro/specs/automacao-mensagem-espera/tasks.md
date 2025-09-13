# Plano de Implementação

- [x] 1. Configurar estrutura do projeto e interfaces principais





  - Criar estrutura de diretórios para services, models, controllers e interface web
  - Definir interfaces TypeScript para todos os componentes principais
  - Configurar package.json com dependências necessárias (express, supabase, axios)
  - _Requisitos: Todos os requisitos dependem desta base_

- [x] 2. Implementar modelos de dados e validação




- [x] 2.1 Criar interfaces e tipos de dados principais


  - Implementar interfaces WaitingPatient, SystemConfig, ExclusionEntry
  - Criar funções de validação para integridade dos dados
  - Escrever testes unitários para validação de modelos
  - _Requisitos: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2.2 Implementar sistema de configuração


  - Criar classe ConfigManager com métodos para gerenciar configurações
  - Implementar persistência de configurações no Supabase
  - Adicionar fallback para armazenamento local
  - Escrever testes para gerenciamento de configurações
  - _Requisitos: 3.2, 3.3, 3.4, 3.5, 5.1, 5.4_
-

- [x] 3. Criar cliente da API CAM Krolik










- [x] 3.1 Implementar KrolikApiClient base



  - Criar classe base com autenticação e tratamento de erros
  - Implementar métodos para todos os endpoints necessários
  - Adicionar retry logic e timeout configurável
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_


- [x] 3.2 Implementar métodos específicos da API



  - Codificar listWaitingAttendances() usando endpoint /chats/list-lite
  - Implementar sendActionCard() e sendTemplate() para diferentes tipos de canal
  - Criar métodos getSectors() e getActionCards()
  - Escrever testes unitários com mocks da API
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.4_
- [x] 4. Desenvolver serviço de monitoramento









- [ ] 4. Desenvolver serviço de monitoramento

- [x] 4.1 Implementar MonitoringService


  - Criar lógica para verificar atendimentos em espera
  - Implementar cálculo de tempo de espera em minutos
  - Adicionar verificação de elegibilidade para mensagem de 30 minutos
  - Implementar detecção de horário comercial e dias úteis
  - _Requisitos: 1.1, 1.3, 2.1, 2.4_

- [x] 4.2 Criar sistema de verificação periódica


  - Implementar scheduler para execução a cada minuto
  - Adicionar lógica para pausar/retomar monitoramento
  - Criar testes para cenários de tempo e elegibilidade
  - _Requisitos: 1.4, 3.2, 3.3_

- [x] 5. Implementar serviço de mensagens




- [x] 5.1 Criar MessageService base


  - Implementar lógica para envio de mensagens de 30 minutos
  - Criar método para mensagens de fim de expediente
  - Adicionar verificação de listas de exceção para setores e canais
  - _Requisitos: 1.1, 1.2, 2.1, 2.2, 2.3, 6.4_

- [x] 5.2 Implementar diferenciação de canais


  - Adicionar lógica para detectar tipo de canal (normal vs API oficial)
  - Implementar envio via cartão de ação para canais normais
  - Implementar envio via template para canais API oficial
  - Criar tratamento de erros específico por tipo de canal
  - Escrever testes para ambos os tipos de canal
  - _Requisitos: 6.1, 6.2, 6.3, 6.5_

- [x] 6. Desenvolver integração com Supabase







- [x] 6.1 Configurar conexão e estrutura de dados


  - Implementar conexão com Supabase
  - Criar tabelas para lista de exclusão e configurações
  - Adicionar verificação automática de estrutura das tabelas
  - _Requisitos: 5.1, 5.3_

- [x] 6.2 Implementar persistência de exclusões





  - Criar métodos para salvar atendimentos que receberam mensagem de 30 min
  - Implementar limpeza automática de dados no fim do dia
  - Adicionar fallback para armazenamento local em caso de falha
  - Escrever testes para persistência e limpeza de dados
  - _Requisitos: 1.2, 5.1, 5.2, 5.4_

- [x] 7. Criar controlador principal




- [x] 7.1 Implementar MainController



  - Criar coordenação entre todos os serviços
  - Implementar métodos start(), stop(), getStatus()
  - Adicionar gerenciamento de ciclo de vida da aplicação
  - Criar tratamento global de erros
  - _Requisitos: Todos os requisitos dependem da coordenação_

- [x] 7.2 Integrar fluxos de automação


  - Conectar monitoramento com envio de mensagens de 30 minutos
  - Implementar fluxo de mensagens de fim de expediente às 18h
  - Adicionar lógica de pausa/retomada do fluxo
  - Escrever testes de integração para fluxos completos
  - _Requisitos: 1.1, 1.2, 1.4, 2.1, 2.4, 3.2, 3.3_

- [x] 8. Desenvolver interface web





- [x] 8.1 Criar estrutura HTML base


  - Implementar layout responsivo com CSS/Bootstrap
  - Criar seções para status, atendimentos, configurações e logs
  - Adicionar elementos interativos (botões, listas, formulários)
  - _Requisitos: 3.1, 7.1, 7.2, 7.3_

- [x] 8.2 Implementar funcionalidades interativas


  - Criar JavaScript para pausar/reativar fluxo
  - Implementar gerenciamento de listas de exceção (setores e canais)
  - Adicionar seleção de cartões de ação e templates
  - Implementar atualização automática da lista de atendimentos
  - _Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6, 7.5_

- [x] 8.3 Adicionar feedback visual e responsividade


  - Implementar indicadores de carregamento e feedback de ações
  - Criar mensagens de erro claras para o usuário
  - Otimizar interface para dispositivos móveis
  - Adicionar testes de responsividade
  - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Implementar sistema de logs e monitoramento





- [x] 9.1 Criar sistema de logging





  - Implementar ErrorHandler com diferentes níveis de log
  - Adicionar logging de todas as operações críticas
  - Criar interface para visualização de logs na web
  - _Requisitos: 4.6, 5.4, 6.5_

- [x] 9.2 Adicionar métricas e estatísticas


  - Implementar coleta de estatísticas de envio
  - Criar dashboard com métricas de performance
  - Adicionar alertas para falhas críticas
  - Escrever testes para sistema de monitoramento
  - _Requisitos: 7.4, 7.5_

- [x] 10. Criar testes abrangentes




- [x] 10.1 Implementar testes unitários


  - Criar testes para todos os serviços individuais
  - Implementar mocks para APIs externas
  - Adicionar testes de validação de dados
  - Garantir cobertura mínima de 80%
  - _Requisitos: Todos os requisitos precisam de validação_

- [x] 10.2 Desenvolver testes de integração


  - Criar testes para fluxo completo de 30 minutos
  - Implementar testes para fluxo de fim de expediente
  - Adicionar testes de cenários de falha e recuperação
  - Testar integração com Supabase e fallback local
  - _Requisitos: 1.1, 1.2, 2.1, 5.1, 5.4_

- [-] 11. Finalizar configuração e deployment







- [x] 11.1 Configurar ambiente de produção






  - Criar scripts de inicialização e configuração
  - Implementar variáveis de ambiente para configurações sensíveis
  - Adicionar documentação de instalação e configuração
  - _Requisitos: Todos os requisitos dependem do deployment_

- [x] 11.2 Realizar testes finais e otimização





  - Executar testes end-to-end completos
  - Otimizar performance para 1000 atendimentos simultâneos
  - Validar todos os cenários de uso definidos nos requisitos
  - Criar documentação de usuário final
  - _Requisitos: Todos os requisitos devem ser validados_