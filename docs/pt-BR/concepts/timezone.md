---
read_when:
    - Você precisa entender como timestamps são normalizados para o modelo
    - Configurando o fuso horário do usuário para prompts de sistema
summary: Tratamento de fuso horário para agentes, envelopes e prompts
title: Fusos horários
x-i18n:
    generated_at: "2026-04-05T12:40:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31a195fa43e3fc17b788d8e70d74ef55da998fc7997c4f0538d4331b1260baac
    source_path: concepts/timezone.md
    workflow: 15
---

# Fusos horários

O OpenClaw padroniza timestamps para que o modelo veja **um único horário de referência**.

## Envelopes de mensagem (local por padrão)

Mensagens recebidas são encapsuladas em um envelope como:

```
[Provider ... 2026-01-05 16:26 PST] texto da mensagem
```

O timestamp no envelope é **local ao host por padrão**, com precisão de minutos.

Você pode substituir isso com:

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
- `envelopeTimezone: "user"` usa `agents.defaults.userTimezone` (usa o fuso horário do host como fallback).
- Use um fuso horário IANA explícito (por exemplo, `"Europe/Vienna"`) para um offset fixo.
- `envelopeTimestamp: "off"` remove timestamps absolutos dos cabeçalhos de envelope.
- `envelopeElapsed: "off"` remove sufixos de tempo decorrido (no estilo `+2m`).

### Exemplos

**Local (padrão):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] olá
```

**Fuso horário fixo:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] olá
```

**Tempo decorrido:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] acompanhamento
```

## Payloads de ferramenta (dados brutos do provider + campos normalizados)

Chamadas de ferramenta (`channels.discord.readMessages`, `channels.slack.readMessages` etc.) retornam **timestamps brutos do provider**.
Também anexamos campos normalizados para consistência:

- `timestampMs` (milissegundos de época UTC)
- `timestampUtc` (string UTC ISO 8601)

Os campos brutos do provider são preservados.

## Fuso horário do usuário para o prompt do sistema

Defina `agents.defaults.userTimezone` para informar ao modelo o fuso horário local do usuário. Se ele
não estiver definido, o OpenClaw resolve o **fuso horário do host em runtime** (sem gravação na configuração).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

O prompt do sistema inclui:

- seção `Current Date & Time` com horário local e fuso horário
- `Time format: 12-hour` ou `24-hour`

Você pode controlar o formato no prompt com `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Consulte [Date & Time](/date-time) para o comportamento completo e exemplos.

## Relacionado

- [Heartbeat](/gateway/heartbeat) — horas ativas usam o fuso horário para agendamento
- [Cron Jobs](/automation/cron-jobs) — expressões cron usam o fuso horário para agendamento
- [Date & Time](/date-time) — comportamento completo de data/hora e exemplos
