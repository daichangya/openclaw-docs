---
read_when:
    - Vous voulez une étape LLM en JSON uniquement dans des flux de travail
    - Vous avez besoin d’une sortie LLM validée par schéma pour l’automatisation
summary: Tâches LLM en JSON uniquement pour les flux de travail (outil de Plugin facultatif)
title: Tâche LLM
x-i18n:
    generated_at: "2026-04-24T07:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` est un **outil de Plugin facultatif** qui exécute une tâche LLM en JSON uniquement et
renvoie une sortie structurée (facultativement validée contre un schéma JSON Schema).

C’est idéal pour des moteurs de workflow comme Lobster : vous pouvez ajouter une seule étape LLM
sans écrire de code OpenClaw personnalisé pour chaque workflow.

## Activer le Plugin

1. Activez le Plugin :

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Ajoutez l’outil à la liste d’autorisation (il est enregistré avec `optional: true`) :

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

## Configuration (facultative)

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

`allowedModels` est une liste d’autorisation de chaînes `provider/model`. Si elle est définie, toute requête
hors de cette liste est rejetée.

## Paramètres de l’outil

- `prompt` (string, obligatoire)
- `input` (any, facultatif)
- `schema` (object, facultatif, JSON Schema)
- `provider` (string, facultatif)
- `model` (string, facultatif)
- `thinking` (string, facultatif)
- `authProfileId` (string, facultatif)
- `temperature` (number, facultatif)
- `maxTokens` (number, facultatif)
- `timeoutMs` (number, facultatif)

`thinking` accepte les préréglages standard de raisonnement OpenClaw, tels que `low` ou `medium`.

## Sortie

Renvoie `details.json` contenant le JSON analysé (et le valide contre
`schema` lorsqu’il est fourni).

## Exemple : étape de workflow Lobster

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

- L’outil est en **JSON uniquement** et demande au modèle de ne produire que du JSON (pas de
  blocs de code, pas de commentaires).
- Aucun outil n’est exposé au modèle pour cette exécution.
- Traitez la sortie comme non fiable à moins de la valider avec `schema`.
- Placez les approbations avant toute étape à effet de bord (send, post, exec).

## Voir aussi

- [Niveaux de réflexion](/fr/tools/thinking)
- [Sous-agents](/fr/tools/subagents)
- [Commandes slash](/fr/tools/slash-commands)
