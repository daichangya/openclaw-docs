---
read_when:
    - Du möchtest einen Nur-JSON-LLM-Schritt innerhalb von Workflows
    - Du benötigst schema-validierte LLM-Ausgabe für Automatisierung
summary: Nur-JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T12:57:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` ist ein **optionales Plugin-Tool**, das eine Nur-JSON-LLM-Aufgabe ausführt und
strukturierte Ausgabe zurückgibt (optional gegen JSON Schema validiert).

Das ist ideal für Workflow-Engines wie Lobster: Du kannst einen einzelnen LLM-Schritt hinzufügen,
ohne für jeden Workflow benutzerdefinierten OpenClaw-Code schreiben zu müssen.

## Das Plugin aktivieren

1. Das Plugin aktivieren:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Das Tool auf die Allowlist setzen (es wird mit `optional: true` registriert):

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

## Konfiguration (optional)

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

`allowedModels` ist eine Allowlist von `provider/model`-Strings. Wenn sie gesetzt ist, wird jede Anfrage
außerhalb dieser Liste abgelehnt.

## Tool-Parameter

- `prompt` (string, erforderlich)
- `input` (beliebig, optional)
- `schema` (object, optionales JSON Schema)
- `provider` (string, optional)
- `model` (string, optional)
- `thinking` (string, optional)
- `authProfileId` (string, optional)
- `temperature` (number, optional)
- `maxTokens` (number, optional)
- `timeoutMs` (number, optional)

`thinking` akzeptiert die Standard-Reasoning-Presets von OpenClaw, wie `low` oder `medium`.

## Ausgabe

Gibt `details.json` zurück, das das geparste JSON enthält (und gegen
`schema` validiert wird, wenn angegeben).

## Beispiel: Lobster-Workflow-Schritt

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

## Sicherheitshinweise

- Das Tool ist **Nur-JSON** und weist das Modell an, nur JSON auszugeben (keine
  Code-Fences, keine Kommentare).
- Für diesen Lauf werden dem Modell keine Tools bereitgestellt.
- Behandle die Ausgabe als nicht vertrauenswürdig, sofern du sie nicht mit `schema` validierst.
- Setze Genehmigungen vor jeden Schritt mit Nebenwirkungen (send, post, exec).
