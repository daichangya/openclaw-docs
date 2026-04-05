---
read_when:
    - Vous souhaitez un accès à des modèles hébergés par OpenCode
    - Vous souhaitez choisir entre les catalogues Zen et Go
summary: Utiliser les catalogues OpenCode Zen et Go avec OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T12:52:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode expose deux catalogues hébergés dans OpenClaw :

- `opencode/...` pour le catalogue **Zen**
- `opencode-go/...` pour le catalogue **Go**

Les deux catalogues utilisent la même clé API OpenCode. OpenClaw garde les identifiants de fournisseur d’exécution
séparés afin que le routage amont par modèle reste correct, mais l’intégration guidée et la documentation les traitent
comme une seule configuration OpenCode.

## Configuration CLI

### Catalogue Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Catalogue Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Extrait de configuration

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catalogues

### Zen

- Fournisseur d’exécution : `opencode`
- Exemples de modèles : `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Idéal lorsque vous voulez le proxy multi-modèles OpenCode sélectionné

### Go

- Fournisseur d’exécution : `opencode-go`
- Exemples de modèles : `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Idéal lorsque vous voulez la gamme Kimi/GLM/MiniMax hébergée par OpenCode

## Remarques

- `OPENCODE_ZEN_API_KEY` est également pris en charge.
- Saisir une seule clé OpenCode pendant la configuration stocke les identifiants pour les deux fournisseurs d’exécution.
- Vous vous connectez à OpenCode, ajoutez les détails de facturation, puis copiez votre clé API.
- La facturation et la disponibilité des catalogues sont gérées depuis le tableau de bord OpenCode.
- Les références OpenCode adossées à Gemini restent sur le chemin proxy-Gemini, de sorte qu’OpenClaw y conserve
  l’assainissement des signatures de réflexion Gemini sans activer la validation native de relecture
  Gemini ni les réécritures bootstrap.
- Les références OpenCode non Gemini conservent la politique minimale de relecture compatible OpenAI.
