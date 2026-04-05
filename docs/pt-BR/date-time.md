---
read_when:
    - Você está alterando como timestamps são mostrados para o modelo ou para usuários
    - Você está depurando a formatação de hora em mensagens ou na saída do prompt do sistema
summary: Tratamento de data e hora em envelopes, prompts, ferramentas e conectores
title: Data e Hora
x-i18n:
    generated_at: "2026-04-05T12:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 753af5946a006215d6af2467fa478f3abb42b1dff027cf85d5dc4c7ba4b58d39
    source_path: date-time.md
    workflow: 15
---

# Data e Hora

O OpenClaw usa por padrão **hora local do host para timestamps de transporte** e **fuso horário do usuário apenas no prompt do sistema**.
Os timestamps do provider são preservados para que as ferramentas mantenham sua semântica nativa (a hora atual está disponível via `session_status`).

## Envelopes de mensagem (local por padrão)

Mensagens recebidas são encapsuladas com um timestamp (precisão de minutos):

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

Esse timestamp do envelope é **local ao host por padrão**, independentemente do fuso horário do provider.

Você pode substituir esse comportamento:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | fuso horário IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` usa UTC.
- `envelopeTimezone: "local"` usa o fuso horário do host.
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (usa o fuso horário do host como fallback).
- Use um fuso horário IANA explícito (por exemplo, `"America/Chicago"`) para uma zona fixa.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos do envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (no estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] olá
```

**Fuso horário do usuário:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] olá
```

**Tempo decorrido ativado:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] acompanhamento
```

## Prompt do sistema: Current Date & Time

Se o fuso horário do usuário for conhecido, o prompt do sistema inclui uma seção dedicada
**Current Date & Time** apenas com o **fuso horário** (sem relógio/formato de hora)
para manter estável o cache do prompt:

```
Time zone: America/Chicago
```

Quando o agente precisar da hora atual, use a ferramenta `session_status`; o cartão
de status inclui uma linha de timestamp.

## Linhas de evento do sistema (local por padrão)

Eventos do sistema enfileirados inseridos no contexto do agente recebem um prefixo com timestamp usando a
mesma seleção de fuso horário dos envelopes de mensagem (padrão: hora local do host).

```
System: [2026-01-12 12:19:17 PST] Modelo alterado.
```

### Configurar fuso horário + formato do usuário

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` define o **fuso horário local do usuário** para o contexto do prompt.
- `timeFormat` controla a exibição em **12h/24h** no prompt. `auto` segue as preferências do SO.

## Detecção de formato de hora (auto)

Quando `timeFormat: "auto"`, o OpenClaw inspeciona a preferência do SO (macOS/Windows)
e usa a formatação de localidade como fallback. O valor detectado é **armazenado em cache por processo**
para evitar chamadas repetidas ao sistema.

## Payloads de ferramenta + conectores (hora bruta do provider + campos normalizados)

Ferramentas de canal retornam **timestamps nativos do provider** e adicionam campos normalizados para consistência:

- `timestampMs`: milissegundos de época (UTC)
- `timestampUtc`: string UTC ISO 8601

Os campos brutos do provider são preservados para que nada seja perdido.

- Slack: strings no formato de época da API
- Discord: timestamps UTC ISO
- Telegram/WhatsApp: timestamps numéricos/ISO específicos do provider

Se você precisar da hora local, converta-a depois usando o fuso horário conhecido.

## Documentação relacionada

- [System Prompt](/concepts/system-prompt)
- [Fusos horários](/concepts/timezone)
- [Mensagens](/concepts/messages)
