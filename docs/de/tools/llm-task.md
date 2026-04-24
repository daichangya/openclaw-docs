---
read_when:
    - Sie möchten einen Nur-JSON-LLM-Schritt innerhalb von Workflows.
    - Sie benötigen schema-validierte LLM-Ausgabe für Automatisierung.
summary: Nur-JSON-LLM-Aufgaben für Workflows (optionales Plugin-Tool)
title: LLM-Task
x-i18n:
    generated_at: "2026-04-24T07:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` ist ein **optionales Plugin-Tool**, das einen Nur-JSON-LLM-Task ausführt und
strukturierte Ausgabe zurückgibt (optional gegen JSON Schema validiert).

Das ist ideal für Workflow-Engines wie Lobster: Sie können einen einzelnen LLM-Schritt
hinzufügen, ohne für jeden Workflow benutzerdefinierten OpenClaw-Code schreiben zu müssen.

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

`allowedModels` ist eine Allowlist aus Strings `provider/model`. Wenn gesetzt, wird jede Anfrage
außerhalb der Liste abgelehnt.

## Tool-Parameter

- `prompt` (String, erforderlich)
- `input` (beliebig, optional)
- `schema` (Objekt, optionales JSON Schema)
- `provider` (String, optional)
- `model` (String, optional)
- `thinking` (String, optional)
- `authProfileId` (String, optional)
- `temperature` (Zahl, optional)
- `maxTokens` (Zahl, optional)
- `timeoutMs` (Zahl, optional)

`thinking` akzeptiert die Standard-Reasoning-Presets von OpenClaw, zum Beispiel `low` oder `medium`.

## Ausgabe

Gibt `details.json` zurück, das das geparste JSON enthält (und gegen
`schema` validiert, wenn es angegeben wurde).

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
- Für diesen Lauf werden dem Modell keine Tools offengelegt.
- Behandeln Sie die Ausgabe als nicht vertrauenswürdig, sofern Sie sie nicht mit `schema` validieren.
- Platzieren Sie Freigaben vor jedem Schritt mit Seiteneffekten (senden, posten, `exec`).

## Verwandt

- [Thinking levels](/de/tools/thinking)
- [Sub-agents](/de/tools/subagents)
- [Slash commands](/de/tools/slash-commands)
