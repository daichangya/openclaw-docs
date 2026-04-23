---
read_when:
    - Atualizando o comportamento ou os padrões de repetição do provedor
    - Depurando erros de envio do provedor ou limites de taxa
summary: Política de repetição para chamadas de saída ao provedor
title: Política de repetição
x-i18n:
    generated_at: "2026-04-23T05:38:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa16219d197492be15925dfd49359cfbed20e53ecdaa5309bbe122d4fe611e75
    source_path: concepts/retry.md
    workflow: 15
---

# Política de repetição

## Objetivos

- Repetir por requisição HTTP, não por fluxo de várias etapas.
- Preservar a ordem repetindo apenas a etapa atual.
- Evitar duplicação de operações não idempotentes.

## Padrões

- Tentativas: 3
- Limite máximo de atraso: 30000 ms
- Jitter: 0.1 (10 por cento)
- Padrões por provedor:
  - Atraso mínimo do Telegram: 400 ms
  - Atraso mínimo do Discord: 500 ms

## Comportamento

### Provedores de modelo

- O OpenClaw permite que os SDKs dos provedores tratem as repetições curtas normais.
- Para SDKs baseados em Stainless, como Anthropic e OpenAI, respostas repetíveis
  (`408`, `409`, `429` e `5xx`) podem incluir `retry-after-ms` ou
  `retry-after`. Quando esse tempo de espera é maior que 60 segundos, o OpenClaw injeta
  `x-should-retry: false` para que o SDK exponha o erro imediatamente e o failover de modelo
  possa alternar para outro perfil de autenticação ou modelo de fallback.
- Substitua o limite com `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS=<seconds>`.
  Defina como `0`, `false`, `off`, `none` ou `disabled` para permitir que os SDKs respeitem internamente
  esperas longas de `Retry-After`.

### Discord

- Repete apenas em erros de limite de taxa (HTTP 429).
- Usa `retry_after` do Discord quando disponível; caso contrário, usa backoff exponencial.

### Telegram

- Repete em erros transitórios (429, timeout, connect/reset/closed, temporariamente indisponível).
- Usa `retry_after` quando disponível; caso contrário, usa backoff exponencial.
- Erros de análise de Markdown não são repetidos; eles usam fallback para texto simples.

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

- As repetições se aplicam por requisição (envio de mensagem, upload de mídia, reação, enquete, sticker).
- Fluxos compostos não repetem etapas já concluídas.
