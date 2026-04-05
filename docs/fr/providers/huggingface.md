---
read_when:
    - Vous souhaitez utiliser Hugging Face Inference avec OpenClaw
    - Vous avez besoin de la variable d’environnement du jeton HF ou du choix d’authentification CLI
summary: Configuration de Hugging Face Inference (authentification + sélection du modèle)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T12:52:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

Les [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) proposent des chat completions compatibles OpenAI via une API de routage unique. Vous obtenez l’accès à de nombreux modèles (DeepSeek, Llama, etc.) avec un seul jeton. OpenClaw utilise le **point de terminaison compatible OpenAI** (chat completions uniquement) ; pour le text-to-image, les embeddings ou la parole, utilisez directement les [clients HF inference](https://huggingface.co/docs/api-inference/quicktour).

- Provider : `huggingface`
- Authentification : `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN` (jeton à granularité fine avec **Make calls to Inference Providers**)
- API : compatible OpenAI (`https://router.huggingface.co/v1`)
- Facturation : jeton HF unique ; la [tarification](https://huggingface.co/docs/inference-providers/pricing) suit les tarifs des providers avec un niveau gratuit.

## Démarrage rapide

1. Créez un jeton à granularité fine sur [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) avec l’autorisation **Make calls to Inference Providers**.
2. Lancez l’onboarding et choisissez **Hugging Face** dans la liste déroulante des providers, puis saisissez votre clé API lorsqu’elle est demandée :

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Dans la liste déroulante **Default Hugging Face model**, choisissez le modèle souhaité (la liste est chargée depuis l’API Inference lorsque vous avez un jeton valide ; sinon une liste intégrée est affichée). Votre choix est enregistré comme modèle par défaut.
4. Vous pouvez également définir ou modifier le modèle par défaut plus tard dans la configuration :

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Cela définira `huggingface/deepseek-ai/DeepSeek-R1` comme modèle par défaut.

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Découverte des modèles et liste déroulante pendant l’onboarding

OpenClaw découvre les modèles en appelant directement le **point de terminaison Inference** :

```bash
GET https://router.huggingface.co/v1/models
```

(Facultatif : envoyez `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` ou `$HF_TOKEN` pour la liste complète ; certains points de terminaison renvoient un sous-ensemble sans authentification.) La réponse suit le style OpenAI : `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Lorsque vous configurez une clé API Hugging Face (via l’onboarding, `HUGGINGFACE_HUB_TOKEN`, ou `HF_TOKEN`), OpenClaw utilise ce GET pour découvrir les modèles de chat completion disponibles. Pendant la **configuration interactive**, après avoir saisi votre jeton, vous voyez une liste déroulante **Default Hugging Face model** alimentée à partir de cette liste (ou du catalogue intégré si la requête échoue). À l’exécution (par exemple au démarrage de la Gateway), lorsqu’une clé est présente, OpenClaw appelle de nouveau **GET** `https://router.huggingface.co/v1/models` pour actualiser le catalogue. La liste est fusionnée avec un catalogue intégré (pour des métadonnées comme la fenêtre de contexte et le coût). Si la requête échoue ou si aucune clé n’est définie, seul le catalogue intégré est utilisé.

## Noms de modèles et options modifiables

- **Nom depuis l’API :** le nom d’affichage du modèle est **hydraté depuis GET /v1/models** lorsque l’API renvoie `name`, `title`, ou `display_name` ; sinon il est dérivé de l’identifiant du modèle (par exemple `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Remplacer le nom d’affichage :** vous pouvez définir un libellé personnalisé par modèle dans la configuration afin qu’il apparaisse comme vous le souhaitez dans la CLI et l’UI :

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (rapide)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (économique)" },
      },
    },
  },
}
```

- **Suffixes de politique :** la documentation et les assistants intégrés OpenClaw pour Hugging Face traitent actuellement ces deux suffixes comme les variantes de politique intégrées :
  - **`:fastest`** — débit maximal.
  - **`:cheapest`** — coût le plus faible par jeton de sortie.

  Vous pouvez les ajouter comme entrées distinctes dans `models.providers.huggingface.models` ou définir `model.primary` avec le suffixe. Vous pouvez aussi définir votre ordre de provider par défaut dans les [paramètres Inference Provider](https://hf.co/settings/inference-providers) (sans suffixe = utiliser cet ordre).

- **Fusion de configuration :** les entrées existantes dans `models.providers.huggingface.models` (par exemple dans `models.json`) sont conservées lors de la fusion de la configuration. Ainsi, tout `name`, `alias` ou toute option de modèle que vous y définissez est préservé.

## ID de modèle et exemples de configuration

Les références de modèle utilisent la forme `huggingface/<org>/<model>` (ID de style Hub). La liste ci-dessous provient de **GET** `https://router.huggingface.co/v1/models` ; votre catalogue peut en inclure davantage.

**Exemples d’ID (depuis le point de terminaison inference) :**

| Modèle                 | Référence (préfixer avec `huggingface/`) |
| ---------------------- | ---------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`                |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`              |
| Qwen3 8B               | `Qwen/Qwen3-8B`                          |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`               |
| Qwen3 32B              | `Qwen/Qwen3-32B`                         |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`      |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`       |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                    |
| GLM 4.7                | `zai-org/GLM-4.7`                        |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                   |

Vous pouvez ajouter `:fastest` ou `:cheapest` à l’identifiant du modèle. Définissez votre ordre par défaut dans les [paramètres Inference Provider](https://hf.co/settings/inference-providers) ; voir [Inference Providers](https://huggingface.co/docs/inference-providers) et **GET** `https://router.huggingface.co/v1/models` pour la liste complète.

### Exemples de configuration complets

**DeepSeek R1 principal avec Qwen en repli :**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen par défaut, avec variantes `:cheapest` et `:fastest` :**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (économique)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (rapide)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS avec alias :**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Plusieurs modèles Qwen et DeepSeek avec suffixes de politique :**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (économique)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (rapide)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
