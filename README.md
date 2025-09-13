# Automação de Mensagem de Espera

Sistema de automação para envio de mensagens para pacientes em fila de espera, integrado com a API do CAM Krolik.

## Funcionalidades

- Envio automático de mensagens após 30 minutos de espera
- Mensagens de fim de expediente às 18h
- Interface web para gerenciamento
- Integração com Supabase para persistência de dados
- Suporte a múltiplos canais (normal e API oficial)

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. Compile o projeto:
   ```bash
   npm run build
   ```

5. Inicie o servidor:
   ```bash
   npm start
   ```

## Desenvolvimento

Para executar em modo de desenvolvimento:
```bash
npm run dev
```

Para executar os testes:
```bash
npm test
```

## Estrutura do Projeto

```
src/
├── controllers/     # Controladores principais
├── services/        # Serviços de negócio
├── models/          # Interfaces e tipos TypeScript
└── index.ts         # Ponto de entrada da aplicação

public/              # Interface web
├── index.html
├── styles.css
└── app.js
```

## Configuração

O sistema utiliza variáveis de ambiente para configuração. Consulte o arquivo `.env.example` para ver todas as opções disponíveis.

## API Endpoints

- `GET /` - Interface web principal
- `GET /api/status` - Status do sistema

Mais endpoints serão adicionados durante a implementação.