---
read_when:
    - Adicionar ou modificar a análise de localização de canal
    - Usar campos de contexto de localização em prompts ou ferramentas de agentes
summary: Análise de localização de entrada de canais (Telegram/WhatsApp/Matrix) e campos de contexto
title: Análise de localização de canal
x-i18n:
    generated_at: "2026-04-05T12:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# Análise de localização de canal

O OpenClaw normaliza localizações compartilhadas de canais de chat em:

- texto legível por humanos anexado ao corpo de entrada, e
- campos estruturados no payload de contexto de resposta automática.

Compatível atualmente com:

- **Telegram** (pins de localização + locais + localizações ao vivo)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` com `geo_uri`)

## Formatação de texto

As localizações são renderizadas como linhas amigáveis sem colchetes:

- Pin:
  - `📍 48.858844, 2.294351 ±12m`
- Local com nome:
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- Compartilhamento ao vivo:
  - `🛰 Localização ao vivo: 48.858844, 2.294351 ±12m`

Se o canal incluir uma legenda/comentário, ela será anexada na linha seguinte:

```
📍 48.858844, 2.294351 ±12m
Encontre aqui
```

## Campos de contexto

Quando uma localização está presente, estes campos são adicionados a `ctx`:

- `LocationLat` (número)
- `LocationLon` (número)
- `LocationAccuracy` (número, metros; opcional)
- `LocationName` (string; opcional)
- `LocationAddress` (string; opcional)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (booleano)

## Observações sobre canais

- **Telegram**: locais são mapeados para `LocationName/LocationAddress`; localizações ao vivo usam `live_period`.
- **WhatsApp**: `locationMessage.comment` e `liveLocationMessage.caption` são anexados como a linha de legenda.
- **Matrix**: `geo_uri` é analisado como uma localização de pin; a altitude é ignorada e `LocationIsLive` é sempre false.
