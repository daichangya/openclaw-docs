---
read_when:
    - Vous voulez utiliser Qwen avec OpenClaw
    - Vous utilisiez auparavant Qwen OAuth
summary: Utilisez Qwen Cloud via le fournisseur qwen intégré d'OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-06T03:11:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f175793693ab6a4c3f1f4d42040e673c15faf7603a500757423e9e06977c989d
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth a été supprimé.** L'intégration OAuth du niveau gratuit
(`qwen-portal`) qui utilisait les endpoints `portal.qwen.ai` n'est plus disponible.
Voir [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour
le contexte.

</Warning>

## Recommandé : Qwen Cloud

OpenClaw traite désormais Qwen comme un fournisseur intégré de première classe avec l'identifiant canonique
`qwen`. Le fournisseur intégré cible les endpoints Qwen Cloud / Alibaba DashScope et
Coding Plan, et conserve les identifiants hérités `modelstudio` comme
alias de compatibilité.

- Fournisseur : `qwen`
- Variable d'environnement préférée : `QWEN_API_KEY`
- Également acceptées pour la compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d'API : compatible OpenAI

Si vous voulez `qwen3.6-plus`, préférez l'endpoint **Standard (pay-as-you-go)**.
La prise en charge de Coding Plan peut être en retard par rapport au catalogue public.

```bash
# Endpoint global Coding Plan
openclaw onboard --auth-choice qwen-api-key

# Endpoint China Coding Plan
openclaw onboard --auth-choice qwen-api-key-cn

# Endpoint global Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Endpoint China Standard (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Les identifiants `auth-choice` hérités `modelstudio-*` et les références de modèle `modelstudio/...`
fonctionnent toujours comme alias de compatibilité, mais les nouveaux flux de configuration doivent préférer les identifiants canoniques
`qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.

Après l'onboarding, définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Types de plan et endpoints

| Plan | Région | Auth choice | Endpoint |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go) | Chine | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1` |
| Standard (pay-as-you-go) | Global | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement) | Chine | `qwen-api-key-cn` | `coding.dashscope.aliyuncs.com/v1` |
| Coding Plan (abonnement) | Global | `qwen-api-key` | `coding-intl.dashscope.aliyuncs.com/v1` |

Le fournisseur sélectionne automatiquement l'endpoint en fonction de votre choix d'authentification. Les choix canoniques
utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez remplacer cela avec un `baseUrl` personnalisé dans la configuration.

Les endpoints natifs Model Studio annoncent une compatibilité d'utilisation du streaming sur le
transport partagé `openai-completions`. OpenClaw s'appuie maintenant sur les capacités des endpoints pour cela,
de sorte que les identifiants de fournisseur personnalisés compatibles DashScope ciblant les
mêmes hôtes natifs héritent du même comportement d'utilisation du streaming au lieu
d'exiger spécifiquement l'identifiant de fournisseur intégré `qwen`.

## Obtenir votre clé API

- **Gérer les clés** : [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentation** : [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Qwen intégré :

| Réf. de modèle | Entrée | Contexte | Notes |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus` | texte, image | 1,000,000 | Modèle par défaut |
| `qwen/qwen3.6-plus` | texte, image | 1,000,000 | Préférez les endpoints Standard lorsque vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | texte | 262,144 | Gamme Qwen Max |
| `qwen/qwen3-coder-next` | texte | 262,144 | Codage |
| `qwen/qwen3-coder-plus` | texte | 1,000,000 | Codage |
| `qwen/MiniMax-M2.5` | texte | 1,000,000 | Raisonnement activé |
| `qwen/glm-5` | texte | 202,752 | GLM |
| `qwen/glm-4.7` | texte | 202,752 | GLM |
| `qwen/kimi-k2.5` | texte, image | 262,144 | Moonshot AI via Alibaba |

La disponibilité peut toujours varier selon l'endpoint et le plan de facturation même lorsqu'un modèle est
présent dans le catalogue intégré.

La compatibilité d'utilisation du streaming natif s'applique à la fois aux hôtes Coding Plan et
aux hôtes Standard compatibles DashScope :

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilité de Qwen 3.6 Plus

`qwen3.6-plus` est disponible sur les endpoints Model Studio Standard (pay-as-you-go) :

- Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
- Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Si les endpoints Coding Plan renvoient une erreur « unsupported model » pour
`qwen3.6-plus`, basculez vers Standard (pay-as-you-go) au lieu du couple
endpoint/clé Coding Plan.

## Plan de capacités

L'extension `qwen` est en train d'être positionnée comme l'emplacement fournisseur du
surface complète de Qwen Cloud, et pas seulement pour les modèles de codage/texte.

- Modèles texte/chat : intégrés maintenant
- Appel d'outils, sortie structurée, réflexion : hérités du transport compatible OpenAI
- Génération d'images : prévue au niveau du plugin fournisseur
- Compréhension d'image/vidéo : intégrée maintenant sur l'endpoint Standard
- Speech/audio : prévu au niveau du plugin fournisseur
- Embeddings/reranking de mémoire : prévus via la surface d'adaptateur d'embedding
- Génération vidéo : intégrée maintenant via la capacité partagée de génération vidéo

## Extensions multimodales

L'extension `qwen` expose désormais aussi :

- Compréhension vidéo via `qwen-vl-max-latest`
- Génération vidéo Wan via :
  - `wan2.6-t2v` (par défaut)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Ces surfaces multimodales utilisent les endpoints DashScope **Standard**, et non les
endpoints Coding Plan.

- URL de base Standard Global/Intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- URL de base Standard Chine : `https://dashscope.aliyuncs.com/compatible-mode/v1`

Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l'hôte
DashScope AIGC correspondant avant de soumettre la tâche :

- Global/Intl : `https://dashscope-intl.aliyuncs.com`
- Chine : `https://dashscope.aliyuncs.com`

Cela signifie qu'un `models.providers.qwen.baseUrl` normal pointant vers les hôtes Qwen
Coding Plan ou Standard continue à maintenir la génération vidéo sur le bon endpoint vidéo
DashScope régional.

Pour la génération vidéo, définissez explicitement un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites actuelles de génération vidéo du Qwen intégré :

- Jusqu'à **1** vidéo de sortie par requête
- Jusqu'à **1** image d'entrée
- Jusqu'à **4** vidéos d'entrée
- Jusqu'à **10 secondes** de durée
- Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
- Le mode image/vidéo de référence exige actuellement des **URL http(s) distantes**. Les
  chemins de fichier locaux sont rejetés immédiatement car l'endpoint vidéo DashScope n'accepte pas
  les buffers locaux téléversés pour ces références.

Voir [Video Generation](/tools/video-generation) pour les paramètres
d'outil partagés, la sélection du fournisseur et le comportement de bascule.

## Remarque sur l'environnement

Si la Gateway s'exécute en tant que démon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).
