---
read_when:
    - Vous voulez le catalogue OpenCode Go
    - Vous avez besoin des références de modèle runtime pour les modèles hébergés sur Go
summary: Utiliser le catalogue OpenCode Go avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T12:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go est le catalogue Go au sein de [OpenCode](/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’ID de fournisseur
runtime `opencode-go` afin que le routage amont par modèle reste correct.

## Modèles pris en charge

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Configuration CLI

```bash
openclaw onboard --auth-choice opencode-go
# ou en mode non interactif
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Extrait de configuration

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Comportement de routage

OpenClaw gère automatiquement le routage par modèle lorsque la référence de modèle utilise `opencode-go/...`.

## Remarques

- Utilisez [OpenCode](/providers/opencode) pour la vue d’ensemble partagée de l’onboarding et du catalogue.
- Les références runtime restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
