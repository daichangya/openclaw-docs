---
read_when:
    - Atualizando o comportamento ou os padrões de repetição do provedor
    - Depurando erros de envio do provedor ou limites de taxa
summary: Política de repetição para chamadas de saída para provedores
title: Política de repetição
x-i18n:
    generated_at: "2026-04-05T12:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55bb261ff567f46ce447be9c0ee0c5b5e6d2776287d7662762656c14108dd607
    source_path: concepts/retry.md
    workflow: 15
---

# Política de repetição

## Objetivos

- Repetir por solicitação HTTP, não por fluxo de várias etapas.
- Preservar a ordem repetindo apenas a etapa atual.
- Evitar duplicar operações não idempotentes.

## Padrões

- Tentativas: 3
- Limite máximo de atraso: 30000 ms
- Jitter: 0.1 (10 por cento)
- Padrões do provedor:
  - Atraso mínimo do Telegram: 400 ms
  - Atraso mínimo do Discord: 500 ms

## Comportamento

### Discord

- Repete apenas em erros de limite de taxa (HTTP 429).
- Usa `retry_after` do Discord quando disponível; caso contrário, usa backoff exponencial.

### Telegram

- Repete em erros transitórios (429, timeout, connect/reset/closed, temporariamente indisponível).
- Usa `retry_after` quando disponível; caso contrário, usa backoff exponencial.
- Erros de parse de markdown não são repetidos; eles usam fallback para texto simples.

## Configuração

Defina a política de repetição por provedor em `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

## Observações

- As repetições se aplicam por solicitação (envio de mensagem, upload de mídia, reação, enquete, figurinha).
- Fluxos compostos não repetem etapas já concluídas.
