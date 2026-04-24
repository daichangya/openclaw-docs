---
read_when:
    - Vous souhaitez utiliser Tencent Hy3 preview avec OpenClaw
    - Vous avez besoin de configurer la clé API TokenHub
summary: Configuration de Tencent Cloud TokenHub pour Hy3 preview
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-24T07:29:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud est fourni comme **plugin fournisseur intégré** dans OpenClaw. Il donne accès à Tencent Hy3 preview via le point de terminaison TokenHub (`tencent-tokenhub`).

Le fournisseur utilise une API compatible OpenAI.

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Fournisseur      | `tencent-tokenhub`                         |
| Modèle par défaut | `tencent-tokenhub/hy3-preview`             |
| Auth          | `TOKENHUB_API_KEY`                         |
| API           | Chat completions compatible OpenAI         |
| URL de base      | `https://tokenhub.tencentmaas.com/v1`      |
| URL globale    | `https://tokenhub-intl.tencentmaas.com/v1` |

## Démarrage rapide

<Steps>
  <Step title="Créer une clé API TokenHub">
    Créez une clé API dans Tencent Cloud TokenHub. Si vous choisissez une portée d’accès limitée pour la clé, incluez **Hy3 preview** dans les modèles autorisés.
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Vérifier le modèle">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Model ref                      | Name                   | Input | Context | Max output | Notes                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | Par défaut ; raisonnement activé |

Hy3 preview est le grand modèle de langage MoE de Tencent Hunyuan pour le raisonnement, le suivi d’instructions en contexte long, le code et les flux de travail d’agent. Les exemples compatibles OpenAI de Tencent utilisent `hy3-preview` comme identifiant de modèle et prennent en charge les appels d’outils standard de type chat-completions ainsi que `reasoning_effort`.

<Tip>
L’identifiant du modèle est `hy3-preview`. Ne le confondez pas avec les modèles Tencent `HY-3D-*`, qui sont des API de génération 3D et ne constituent pas le modèle de chat OpenClaw configuré par ce fournisseur.
</Tip>

## Remplacement du point de terminaison

OpenClaw utilise par défaut le point de terminaison `https://tokenhub.tencentmaas.com/v1` de Tencent Cloud. Tencent documente également un point de terminaison TokenHub international :

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Ne remplacez le point de terminaison que si votre compte TokenHub ou votre région l’exige.

## Remarques

- Les références de modèle TokenHub utilisent `tencent-tokenhub/<modelId>`.
- Le catalogue intégré inclut actuellement `hy3-preview`.
- Le plugin marque Hy3 preview comme capable de raisonnement et compatible avec l’usage en streaming.
- Le plugin est livré avec des métadonnées de tarification Hy3 par niveaux, de sorte que les estimations de coût sont remplies sans remplacement manuel des prix.
- Ne remplacez les métadonnées de tarification, de contexte ou de point de terminaison dans `models.providers` qu’en cas de besoin.

## Remarque sur l’environnement

Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `TOKENHUB_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Documentation liée

- [Configuration OpenClaw](/fr/gateway/configuration)
- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Page produit Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Génération de texte Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Configuration Tencent TokenHub Cline pour Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Carte de modèle Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
