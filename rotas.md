❌ GET /api/patients - Lista pacientes em espera
Correto - https://api.camkrolik.com.br/core/v2/api/chats/list-lite
{
  "sectorId": "string",
  "userId": "string",
  "number": "string",
  "contactId": "string",
  "typeChat": 2,
  "status": 1,
  "dateFilters": {
    }
  },
  "page": 0
}

❌ GET /api/sectors - Lista setores disponíveis
Correto - https://api.camkrolik.com.br/core/v2/api/sectors
[
  {
    "id": "string",
    "name": "string",
    "organizationId": "string",
    "serviceTimeRuleId": "string"
  }
]

❌ GET /api/action-cards - Lista cartões de ação
Correto - https://api.camkrolik.com.br/core/v2/api/action-cards
[
  {
    "id": "string",
    "description": "string",
    "messages": [
      {
        "id": "string",
        "typeMessage": 0,
        "typeFile": 0,
        "text": "string",
        "extension": "string",
        "file": "string",
        "order": 0,
        "scriptId": "string",
        "typeEvent": 0
      }
    ]
  }
]


❌ GET /api/channels - Lista canais disponíveis
Correto - https://api.camkrolik.com.br/core/v2/api/channel/list
[
  {
    "id": "string",
    "organizationId": "string",
    "description": "string",
    "identifier": "string",
    "type": 0
  }
]


❌ POST /api/messages/send-action-card - Envio manual de cartões
Correto - https://api.camkrolik.com.br/core/v2/api/chats/send-action-card
{
  "number": "string",
  "contactId": "string",
  "action_card_id": "string",
  "forceSend": true,
  
}
