---
read_when:
    - Você quer uma etapa de LLM somente em JSON dentro de workflows
    - Você precisa de saída de LLM validada por esquema para automação
summary: Tarefas de LLM somente em JSON para workflows (ferramenta opcional de plugin)
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T12:55:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` é uma **ferramenta opcional de plugin** que executa uma tarefa de LLM somente em JSON e
retorna saída estruturada (opcionalmente validada com JSON Schema).

Isso é ideal para motores de workflow como Lobster: você pode adicionar uma única etapa de LLM
sem escrever código personalizado do OpenClaw para cada workflow.

## Habilite o plugin

1. Habilite o plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Adicione a ferramenta à allowlist (ela é registrada com `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Configuração (opcional)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` é uma allowlist de strings `provider/model`. Se estiver definida, qualquer solicitação
fora da lista será rejeitada.

## Parâmetros da ferramenta

- `prompt` (string, obrigatório)
- `input` (qualquer tipo, opcional)
- `schema` (objeto, JSON Schema opcional)
- `provider` (string, opcional)
- `model` (string, opcional)
- `thinking` (string, opcional)
- `authProfileId` (string, opcional)
- `temperature` (number, opcional)
- `maxTokens` (number, opcional)
- `timeoutMs` (number, opcional)

`thinking` aceita os presets padrão de raciocínio do OpenClaw, como `low` ou `medium`.

## Saída

Retorna `details.json` contendo o JSON analisado (e valida em relação a
`schema` quando fornecido).

## Exemplo: etapa de workflow no Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Observações de segurança

- A ferramenta é **somente JSON** e instrui o modelo a emitir apenas JSON (sem
  code fences, sem comentários).
- Nenhuma ferramenta é exposta ao modelo nesta execução.
- Trate a saída como não confiável, a menos que você valide com `schema`.
- Coloque aprovações antes de qualquer etapa com efeitos colaterais (enviar, publicar, exec).
