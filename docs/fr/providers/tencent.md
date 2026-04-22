---
read_when:
    - Vous souhaitez utiliser les modèles Tencent Hy avec OpenClaw
    - Vous avez besoin de la configuration de la clé API TokenHub
summary: Configuration de Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T06:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Le fournisseur Tencent Cloud donne accès aux modèles Tencent Hy via le point de terminaison TokenHub (`tencent-tokenhub`).

Le fournisseur utilise une API compatible OpenAI.

## Démarrage rapide

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Fournisseurs et points de terminaison

| Provider           | Endpoint                      | Cas d’usage             |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy via Tencent TokenHub |

## Modèles disponibles

### tencent-tokenhub

- **hy3-preview** — Aperçu de Hy3 (contexte 256K, raisonnement, par défaut)

## Remarques

- Les références de modèles TokenHub utilisent `tencent-tokenhub/<modelId>`.
- Remplacez les métadonnées de tarification et de contexte dans `models.providers` si nécessaire.

## Remarque sur l’environnement

Si le Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que `TOKENHUB_API_KEY` est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via `env.shellEnv`).

## Documentation associée

- [Configuration d’OpenClaw](/fr/gateway/configuration)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
