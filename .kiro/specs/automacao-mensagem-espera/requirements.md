# Documento de Requisitos

## Introdução

Este sistema automatiza o envio de mensagens para pacientes em fila de espera, melhorando a comunicação e gerenciando expectativas durante longos períodos de espera e no encerramento do expediente. O sistema integra com a API do CAM Krolik para gerenciar atendimentos e enviar mensagens automáticas baseadas em regras de tempo e configurações de exceção.

## Requisitos

### Requisito 1

**História do Usuário:** Como um atendente, eu quero que mensagens automáticas sejam enviadas para pacientes que aguardam por 30 minutos, para que eles sejam informados sobre a alta demanda e mantenham a expectativa de atendimento.

#### Critérios de Aceitação

1. QUANDO um paciente estiver aguardando por 30 minutos ENTÃO o sistema DEVE enviar uma mensagem automática informando sobre alta demanda
2. QUANDO uma mensagem de 30 minutos for enviada ENTÃO o sistema DEVE adicionar o atendimento à lista de exclusão para evitar mensagens duplicadas
3. QUANDO o sistema verificar tempo de espera ENTÃO DEVE considerar todos os setores sem exceção
4. SE o fluxo estiver pausado ENTÃO o sistema NÃO DEVE enviar mensagens mas DEVE continuar monitorando

### Requisito 2

**História do Usuário:** Como um atendente, eu quero que mensagens de fim de expediente sejam enviadas automaticamente às 18h (horário de Brasília), para que pacientes em espera sejam informados sobre o encerramento do atendimento.

#### Critérios de Aceitação

1. QUANDO for 18h no horário de Brasília EM dias úteis ENTÃO o sistema DEVE enviar mensagens de fim de expediente
2. SE um setor estiver na lista de exceção ENTÃO o sistema NÃO DEVE enviar mensagem para atendimentos desse setor
3. SE um canal estiver na lista de exceção ENTÃO o sistema NÃO DEVE enviar mensagem através desse canal
4. QUANDO for fim de semana ENTÃO o sistema NÃO DEVE executar a automação de fim de expediente

### Requisito 3

**História do Usuário:** Como um administrador, eu quero gerenciar configurações através de um painel HTML, para que eu possa controlar a automação sem precisar modificar código.

#### Critérios de Aceitação

1. QUANDO acessar o painel ENTÃO DEVE exibir lista de todos os atendimentos aguardando com nome, telefone e setor
2. QUANDO clicar em pausar fluxo ENTÃO o sistema DEVE parar de enviar mensagens mas continuar monitorando
3. QUANDO clicar em reativar fluxo ENTÃO o sistema DEVE voltar a enviar mensagens normalmente
4. QUANDO selecionar setores ENTÃO DEVE permitir adicionar/remover da lista de exceção
5. QUANDO selecionar canais ENTÃO DEVE permitir adicionar/remover da lista de exceção
6. QUANDO escolher mensagem ENTÃO DEVE permitir selecionar cartão de ação ou template para envio

### Requisito 4

**História do Usuário:** Como um desenvolvedor, eu quero integrar com a API do CAM Krolik, para que o sistema possa listar atendimentos e enviar mensagens através dos canais configurados.

#### Critérios de Aceitação

1. QUANDO listar atendimentos ENTÃO o sistema DEVE usar endpoint /core/v2/api/chats/list-lite com status=1 (aguardando)
2. QUANDO enviar mensagem para canal normal ENTÃO DEVE usar endpoint /core/v2/api/chats/send-action-card
3. QUANDO enviar mensagem para canal API oficial ENTÃO DEVE usar endpoint /core/v2/api/chats/send-template
4. QUANDO listar setores ENTÃO DEVE usar endpoint /core/v2/api/sectors
5. QUANDO listar cartões de ação ENTÃO DEVE usar endpoint /core/v2/api/action-cards
6. SE a requisição falhar ENTÃO o sistema DEVE registrar erro e continuar operação

### Requisito 5

**História do Usuário:** Como um administrador do sistema, eu quero que dados temporários sejam armazenados no Supabase, para que informações de atendimento sejam persistidas durante o dia e limpas automaticamente.

#### Critérios de Aceitação

1. QUANDO um atendimento receber mensagem de 30 minutos ENTÃO DEVE ser salvo na lista de exclusão no Supabase
2. QUANDO for fim do dia ENTÃO todos os dados temporários DEVEM ser excluídos automaticamente
3. QUANDO o sistema iniciar ENTÃO DEVE conectar com Supabase e verificar estrutura das tabelas
4. SE a conexão com Supabase falhar ENTÃO o sistema DEVE usar armazenamento local temporário

### Requisito 6

**História do Usuário:** Como um atendente, eu quero que o sistema suporte múltiplos canais com diferentes tipos, para que mensagens sejam enviadas através dos canais apropriados com suas respectivas configurações.

#### Critérios de Aceitação

1. QUANDO configurar canal normal ENTÃO DEVE permitir uso de cartões de ação
2. QUANDO configurar canal API oficial ENTÃO DEVE usar templates em vez de cartões de ação
3. QUANDO adicionar novo canal ENTÃO DEVE permitir configurar token API específico
4. QUANDO enviar mensagem ENTÃO DEVE usar o método apropriado baseado no tipo do canal
5. SE token do canal for inválido ENTÃO DEVE registrar erro e pular esse canal

### Requisito 7

**História do Usuário:** Como um usuário do sistema, eu quero que a interface seja responsiva e intuitiva, para que eu possa gerenciar a automação facilmente através do navegador.

#### Critérios de Aceitação

1. QUANDO acessar a interface ENTÃO DEVE carregar em menos de 3 segundos
2. QUANDO visualizar em dispositivos móveis ENTÃO a interface DEVE ser responsiva
3. QUANDO realizar ações ENTÃO DEVE fornecer feedback visual imediato
4. QUANDO ocorrer erro ENTÃO DEVE exibir mensagem clara para o usuário
5. QUANDO dados forem atualizados ENTÃO a interface DEVE refletir mudanças automaticamente