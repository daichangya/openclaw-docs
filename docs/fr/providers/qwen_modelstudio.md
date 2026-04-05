---
x-i18n:
    generated_at: "2026-04-05T12:52:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Détail des points de terminaison pour le provider `qwen` intégré et sa surface de compatibilité historique modelstudio"
read_when:

- Vous souhaitez des détails au niveau des points de terminaison pour Qwen Cloud / Alibaba DashScope
- Vous avez besoin de l’historique de compatibilité des variables d’environnement pour le provider qwen
- Vous souhaitez utiliser le point de terminaison Standard (paiement à l’usage) ou Coding Plan

---

# Qwen / Model Studio (Alibaba Cloud)

Cette page documente le mappage des points de terminaison derrière le provider `qwen`
intégré d’OpenClaw. Le provider conserve les identifiants de provider, les identifiants auth-choice et
les références de modèle `modelstudio` comme alias de compatibilité pendant que `qwen` devient la
surface canonique.

<Info>

Si vous avez besoin de **`qwen3.6-plus`**, préférez **Standard (paiement à l’usage)**. La
disponibilité de Coding Plan peut être en retard par rapport au catalogue public Model Studio, et l’API
Coding Plan peut rejeter un modèle jusqu’à ce qu’il apparaisse dans la liste des modèles pris en charge
par votre plan.

</Info>

- Provider : `qwen` (alias historique : `modelstudio`)
- Authentification : `QWEN_API_KEY`
- Également acceptés : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API : compatible OpenAI

## Démarrage rapide

### Standard (paiement à l’usage)

```bash
# Point de terminaison Chine
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Point de terminaison Global/Intl
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (abonnement)

```bash
# Point de terminaison Chine
openclaw onboard --auth-choice qwen-api-key-cn

# Point de terminaison Global/Intl
openclaw onboard --auth-choice qwen-api-key
```

Les anciens identifiants auth-choice `modelstudio-*` fonctionnent toujours comme alias de compatibilité, mais
les identifiants d’onboarding canoniques sont les choix `qwen-*` affichés ci-dessus.

Après l’onboarding, définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Types de plan et points de terminaison

| Plan                       | Région | Auth choice                | Point de terminaison                            |
| -------------------------- | ------ | -------------------------- | ----------------------------------------------- |
| Standard (paiement à l’usage) | Chine  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (paiement à l’usage) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)   | Chine  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Le provider sélectionne automatiquement le point de terminaison en fonction de votre auth choice. Les choix
canoniques utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez
remplacer cela avec un `baseUrl` personnalisé dans la configuration.

Les points de terminaison Model Studio natifs annoncent une compatibilité d’utilisation du streaming sur le transport partagé `openai-completions`. OpenClaw s’appuie désormais sur les capacités des points de terminaison, de sorte que les identifiants de provider personnalisés compatibles DashScope pointant vers les mêmes hôtes natifs héritent du même comportement d’utilisation en streaming au lieu d’exiger spécifiquement l’identifiant de provider intégré `qwen`.

## Obtenir votre clé API

- **Gérer les clés** : [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Documentation** : [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Catalogue intégré

OpenClaw inclut actuellement ce catalogue Qwen intégré :

| Référence de modèle         | Entrée       | Contexte  | Remarques                                         |
| --------------------------- | ------------ | --------- | ------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texte, image | 1,000,000 | Modèle par défaut                                 |
| `qwen/qwen3.6-plus`         | texte, image | 1,000,000 | Préférez les points de terminaison Standard lorsque vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | texte        | 262,144   | Ligne Qwen Max                                    |
| `qwen/qwen3-coder-next`     | texte        | 262,144   | Coding                                            |
| `qwen/qwen3-coder-plus`     | texte        | 1,000,000 | Coding                                            |
| `qwen/MiniMax-M2.5`         | texte        | 1,000,000 | Raisonnement activé                               |
| `qwen/glm-5`                | texte        | 202,752   | GLM                                               |
| `qwen/glm-4.7`              | texte        | 202,752   | GLM                                               |
| `qwen/kimi-k2.5`            | texte, image | 262,144   | Moonshot AI via Alibaba                           |

La disponibilité peut tout de même varier selon le point de terminaison et le plan de facturation, même lorsqu’un modèle est présent dans le catalogue intégré.

La compatibilité d’utilisation du streaming natif s’applique à la fois aux hôtes Coding Plan et aux hôtes Standard compatibles DashScope :

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Disponibilité de Qwen 3.6 Plus

`qwen3.6-plus` est disponible sur les points de terminaison Standard (paiement à l’usage) de Model Studio :

- Chine : `dashscope.aliyuncs.com/compatible-mode/v1`
- Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Si les points de terminaison Coding Plan renvoient une erreur « unsupported model » pour
`qwen3.6-plus`, passez à Standard (paiement à l’usage) au lieu du couple
point de terminaison/clé Coding Plan.

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que
`QWEN_API_KEY` est disponible pour ce processus (par exemple dans
`~/.openclaw/.env` ou via `env.shellEnv`).
