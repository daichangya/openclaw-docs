---
read_when:
    - Потрібен крок LLM лише з JSON усередині робочих процесів
    - Потрібен валідований за схемою вивід LLM для автоматизації
summary: Завдання LLM лише з JSON для робочих процесів (необов’язковий plugin-інструмент)
title: Завдання LLM
x-i18n:
    generated_at: "2026-04-05T18:20:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# Завдання LLM

`llm-task` — це **необов’язковий plugin-інструмент**, який виконує завдання LLM лише з JSON і
повертає структурований вивід (за бажанням валідований за JSON Schema).

Це ідеально підходить для рушіїв робочих процесів на кшталт Lobster: ви можете додати один крок LLM
без написання власного коду OpenClaw для кожного робочого процесу.

## Увімкнення plugin

1. Увімкніть plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Додайте інструмент до allowlist (він реєструється з `optional: true`):

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

## Конфігурація (необов’язково)

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

`allowedModels` — це allowlist рядків `provider/model`. Якщо його задано, будь-який запит
поза цим списком відхиляється.

## Параметри інструмента

- `prompt` (string, обов’язково)
- `input` (any, необов’язково)
- `schema` (object, необов’язкова JSON Schema)
- `provider` (string, необов’язково)
- `model` (string, необов’язково)
- `thinking` (string, необов’язково)
- `authProfileId` (string, необов’язково)
- `temperature` (number, необов’язково)
- `maxTokens` (number, необов’язково)
- `timeoutMs` (number, необов’язково)

`thinking` приймає стандартні пресети міркування OpenClaw, наприклад `low` або `medium`.

## Вивід

Повертає `details.json`, який містить розібраний JSON (і виконує валідацію за
`schema`, якщо її надано).

## Приклад: крок робочого процесу Lobster

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

## Зауваження щодо безпеки

- Інструмент працює **лише з JSON** і наказує моделі повертати лише JSON (без
  code fences, без коментарів).
- Для цього запуску моделі не надаються жодні інструменти.
- Вважайте вивід недовіреним, якщо не виконуєте валідацію через `schema`.
- Розміщуйте approvals перед будь-яким кроком із побічними ефектами (send, post, exec).
