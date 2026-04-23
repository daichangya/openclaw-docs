---
read_when:
    - Ви хочете JSON-only крок LLM всередині workflows
    - Вам потрібен вивід LLM, валідований схемою, для автоматизації
summary: Завдання LLM лише з JSON для workflows (необов’язковий інструмент plugin)
title: Завдання LLM
x-i18n:
    generated_at: "2026-04-23T23:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` — це **необов’язковий інструмент plugin**, який запускає JSON-only завдання LLM і
повертає структурований вивід (за бажанням валідований за JSON Schema).

Це ідеально підходить для рушіїв workflow, таких як Lobster: ви можете додати один крок LLM
без написання користувацького коду OpenClaw для кожного workflow.

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
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` — це allowlist рядків формату `provider/model`. Якщо його задано, будь-який запит
поза списком відхиляється.

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

Повертає `details.json`, що містить розібраний JSON (і виконує валідацію за
`schema`, якщо її надано).

## Приклад: крок workflow Lobster

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

## Примітки щодо безпеки

- Інструмент є **JSON-only** і наказує моделі виводити лише JSON (без
  code fence, без коментарів).
- Для моделі під час цього запуску не відкриваються жодні інструменти.
- Вважайте вивід недовіреним, якщо ви не виконуєте валідацію через `schema`.
- Додавайте погодження перед будь-яким кроком із побічними ефектами (send, post, exec).

## Пов’язано

- [Рівні Thinking](/uk/tools/thinking)
- [Sub-agents](/uk/tools/subagents)
- [Slash-команди](/uk/tools/slash-commands)
