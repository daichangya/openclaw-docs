---
read_when:
    - Vous voulez utiliser Fireworks avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Fireworks ou de l’ID de modèle par défaut
summary: Configuration de Fireworks (auth + sélection de modèle)
x-i18n:
    generated_at: "2026-04-05T12:51:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expose des modèles open-weight et routés via une API compatible OpenAI. OpenClaw inclut désormais un plugin de fournisseur Fireworks intégré.

- Fournisseur : `fireworks`
- Auth : `FIREWORKS_API_KEY`
- API : chat/completions compatible OpenAI
- Base URL : `https://api.fireworks.ai/inference/v1`
- Modèle par défaut : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Démarrage rapide

Configurez l’auth Fireworks via l’onboarding :

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Cela stocke votre clé Fireworks dans la config OpenClaw et définit le modèle de démarrage Fire Pass comme modèle par défaut.

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Remarque sur l’environnement

Si Gateway s’exécute en dehors de votre shell interactif, assurez-vous que `FIREWORKS_API_KEY`
est aussi disponible pour ce processus. Une clé présente uniquement dans `~/.profile` ne
servira pas à un daemon launchd/systemd sauf si cet environnement y est également importé.

## Catalogue intégré

| Référence de modèle                                     | Nom                         | Entrée     | Contexte | Sortie max | Remarques                                  |
| ------------------------------------------------------- | --------------------------- | ---------- | -------- | ---------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000    | Modèle de démarrage intégré par défaut sur Fireworks |

## ID de modèles Fireworks personnalisés

OpenClaw accepte aussi des ID de modèles Fireworks dynamiques. Utilisez l’ID exact du modèle ou du routeur affiché par Fireworks et préfixez-le avec `fireworks/`.

Exemple :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Si Fireworks publie un modèle plus récent, comme une nouvelle version de Qwen ou de Gemma, vous pouvez y passer directement en utilisant son ID de modèle Fireworks sans attendre une mise à jour du catalogue intégré.
