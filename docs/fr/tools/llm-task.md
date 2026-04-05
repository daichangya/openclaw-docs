---
read_when:
    - Vous voulez une étape LLM en JSON uniquement dans des workflows
    - Vous avez besoin d’une sortie LLM validée par schéma pour l’automatisation
summary: Tâches LLM en JSON uniquement pour les workflows (outil de plugin facultatif)
title: Tâche LLM
x-i18n:
    generated_at: "2026-04-05T12:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# Tâche LLM

`llm-task` est un **outil de plugin facultatif** qui exécute une tâche LLM en JSON uniquement et
renvoie une sortie structurée (éventuellement validée par rapport à un schéma JSON).

C’est idéal pour des moteurs de workflow comme Lobster : vous pouvez ajouter une seule étape LLM
sans écrire de code OpenClaw personnalisé pour chaque workflow.

## Activer le plugin

1. Activez le plugin :

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Ajoutez l’outil à la liste d’autorisation (il est enregistré avec `optional: true`) :

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

## Configuration (facultatif)

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

`allowedModels` est une liste d’autorisation de chaînes `provider/model`. Si elle est définie, toute requête
hors de cette liste est rejetée.

## Paramètres de l’outil

- `prompt` (chaîne, requis)
- `input` (quelconque, facultatif)
- `schema` (objet, schéma JSON facultatif)
- `provider` (chaîne, facultatif)
- `model` (chaîne, facultatif)
- `thinking` (chaîne, facultatif)
- `authProfileId` (chaîne, facultatif)
- `temperature` (nombre, facultatif)
- `maxTokens` (nombre, facultatif)
- `timeoutMs` (nombre, facultatif)

`thinking` accepte les préréglages de raisonnement standard d’OpenClaw, tels que `low` ou `medium`.

## Sortie

Renvoie `details.json` contenant le JSON analysé (et le valide par rapport à
`schema` lorsqu’il est fourni).

## Exemple : étape de workflow Lobster

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

## Notes de sécurité

- L’outil est **JSON uniquement** et demande au modèle de produire uniquement du JSON (sans
  blocs de code, sans commentaire).
- Aucun outil n’est exposé au modèle pour cette exécution.
- Traitez la sortie comme non fiable sauf si vous la validez avec `schema`.
- Placez les approbations avant toute étape avec effet de bord (send, post, exec).
