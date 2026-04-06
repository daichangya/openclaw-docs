---
read_when:
    - Vous voulez utiliser des modèles OpenAI dans OpenClaw
    - Vous voulez utiliser l’authentification par abonnement Codex au lieu de clés API
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-06T03:11:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e04db5787f6ed7b1eda04d965c10febae10809fc82ae4d9769e7163234471f5
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fournit des API pour développeurs pour les modèles GPT. Codex prend en charge **la connexion ChatGPT** pour un accès par abonnement
ou **la connexion par clé API** pour un accès facturé à l’usage. Codex cloud nécessite une connexion ChatGPT.
OpenAI prend explicitement en charge l’usage d’OAuth par abonnement dans des outils/flux de travail externes comme OpenClaw.

## Style d’interaction par défaut

OpenClaw peut ajouter une petite surcouche de prompt spécifique à OpenAI pour les exécutions `openai/*` et
`openai-codex/*`. Par défaut, la surcouche garde l’assistant réactif,
collaboratif, concis, direct et un peu plus expressif émotionnellement
sans remplacer le prompt système de base d’OpenClaw. La surcouche conviviale
autorise aussi l’emoji occasionnel lorsque cela convient naturellement, tout en gardant
une sortie globalement concise.

Clé de configuration :

`plugins.entries.openai.config.personality`

Valeurs autorisées :

- `"friendly"` : valeur par défaut ; active la surcouche spécifique à OpenAI.
- `"off"` : désactive la surcouche et utilise uniquement le prompt de base d’OpenClaw.

Portée :

- S’applique aux modèles `openai/*`.
- S’applique aux modèles `openai-codex/*`.
- N’affecte pas les autres fournisseurs.

Ce comportement est activé par défaut. Conservez explicitement `"friendly"` si vous voulez que
cela survive à de futurs remaniements de configuration locale :

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Désactiver la surcouche de prompt OpenAI

Si vous voulez le prompt de base OpenClaw non modifié, définissez la surcouche sur `"off"` :

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Vous pouvez aussi la définir directement avec la CLI de configuration :

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## Option A : clé API OpenAI (plateforme OpenAI)

**Idéal pour :** un accès API direct et une facturation à l’usage.
Obtenez votre clé API depuis le tableau de bord OpenAI.

### Configuration CLI

```bash
openclaw onboard --auth-choice openai-api-key
# or non-interactive
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Extrait de configuration

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

La documentation actuelle des modèles API d’OpenAI mentionne `gpt-5.4` et `gpt-5.4-pro` pour l’usage direct
de l’API OpenAI. OpenClaw transmet les deux via le chemin Responses `openai/*`.
OpenClaw supprime intentionnellement la ligne obsolète `openai/gpt-5.3-codex-spark`,
car les appels directs à l’API OpenAI la rejettent en trafic réel.

OpenClaw **n’expose pas** `openai/gpt-5.3-codex-spark` sur le chemin direct de l’API OpenAI
avec clé API. `pi-ai` inclut toujours une ligne intégrée pour ce modèle, mais les requêtes vers l’API OpenAI en direct
la rejettent actuellement. Spark est traité comme Codex uniquement dans OpenClaw.

## Génération d’images

Le plugin groupé `openai` enregistre aussi la génération d’images via l’outil partagé
`image_generate`.

- Modèle d’image par défaut : `openai/gpt-image-1`
- Génération : jusqu’à 4 images par requête
- Mode édition : activé, jusqu’à 5 images de référence
- Prend en charge `size`
- Limitation actuelle spécifique à OpenAI : OpenClaw ne transmet pas aujourd’hui `aspectRatio` ni
  les substitutions `resolution` à l’API OpenAI Images

Pour utiliser OpenAI comme fournisseur d’images par défaut :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Consultez [Image Generation](/fr/tools/image-generation) pour les
paramètres de l’outil partagé, la sélection du fournisseur et le comportement de bascule.

## Génération vidéo

Le plugin groupé `openai` enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `openai/sora-2`
- Modes : texte-vers-vidéo, image-vers-vidéo et flux de référence/édition à vidéo unique
- Limites actuelles : 1 image ou 1 vidéo en entrée de référence
- Limitation actuelle spécifique à OpenAI : OpenClaw ne transmet actuellement que les substitutions
  `size` pour la génération vidéo OpenAI native. Les substitutions optionnelles non prises en charge
  comme `aspectRatio`, `resolution`, `audio` et `watermark` sont ignorées
  et signalées comme avertissement de l’outil.

Pour utiliser OpenAI comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Consultez [Video Generation](/tools/video-generation) pour les
paramètres de l’outil partagé, la sélection du fournisseur et le comportement de bascule.

## Option B : abonnement OpenAI Code (Codex)

**Idéal pour :** utiliser un accès par abonnement ChatGPT/Codex au lieu d’une clé API.
Codex cloud nécessite une connexion ChatGPT, tandis que la CLI Codex prend en charge une connexion par ChatGPT ou par clé API.

### Configuration CLI (OAuth Codex)

```bash
# Run Codex OAuth in the wizard
openclaw onboard --auth-choice openai-codex

# Or run OAuth directly
openclaw models auth login --provider openai-codex
```

### Extrait de configuration (abonnement Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

La documentation actuelle de Codex chez OpenAI mentionne `gpt-5.4` comme modèle Codex actuel. OpenClaw
mappe cela vers `openai-codex/gpt-5.4` pour l’usage OAuth ChatGPT/Codex.

Si l’intégration réutilise une connexion Codex CLI existante, ces identifiants restent
gérés par la CLI Codex. À l’expiration, OpenClaw relit d’abord la source Codex externe
et, lorsque le fournisseur peut la renouveler, écrit l’identifiant actualisé
dans le stockage Codex au lieu d’en prendre possession dans une copie séparée réservée à OpenClaw.

Si votre compte Codex est autorisé à utiliser Codex Spark, OpenClaw prend aussi en charge :

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw traite Codex Spark comme réservé à Codex. Il n’expose pas de chemin API direct
`openai/gpt-5.3-codex-spark` avec clé API.

OpenClaw conserve aussi `openai-codex/gpt-5.3-codex-spark` lorsque `pi-ai`
le découvre. Considérez-le comme dépendant des droits et expérimental : Codex Spark est
distinct de GPT-5.4 `/fast`, et sa disponibilité dépend du compte Codex / ChatGPT connecté.

### Plafond de fenêtre de contexte Codex

OpenClaw traite séparément les métadonnées du modèle Codex et le plafond de contexte à l’exécution
comme deux valeurs distinctes.

Pour `openai-codex/gpt-5.4` :

- `contextWindow` natif : `1050000`
- plafond `contextTokens` d’exécution par défaut : `272000`

Cela permet de garder des métadonnées de modèle fidèles tout en conservant la plus petite fenêtre d’exécution par défaut
qui présente en pratique de meilleures caractéristiques de latence et de qualité.

Si vous voulez un plafond effectif différent, définissez `models.providers.<provider>.models[].contextTokens` :

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Utilisez `contextWindow` uniquement lorsque vous déclarez ou remplacez des métadonnées natives de modèle.
Utilisez `contextTokens` lorsque vous voulez limiter le budget de contexte à l’exécution.

### Transport par défaut

OpenClaw utilise `pi-ai` pour le streaming des modèles. Pour `openai/*` comme pour
`openai-codex/*`, le transport par défaut est `"auto"` (WebSocket d’abord, puis repli
SSE).

En mode `"auto"`, OpenClaw réessaie aussi un échec WebSocket précoce et récupérable
avant de revenir à SSE. Le mode `"websocket"` forcé continue d’exposer directement les erreurs de transport
au lieu de les masquer derrière le repli.

Après un échec WebSocket à la connexion ou au début d’un tour en mode `"auto"`, OpenClaw marque
le chemin WebSocket de cette session comme dégradé pendant environ 60 secondes et envoie
les tours suivants via SSE pendant le refroidissement au lieu de faire des allers-retours
entre les transports.

Pour les endpoints natifs de la famille OpenAI (`openai/*`, `openai-codex/*`, et Azure
OpenAI Responses), OpenClaw attache aussi un état stable d’identité de session et de tour
aux requêtes afin que les nouvelles tentatives, les reconnexions et le repli SSE restent alignés sur la même
identité de conversation. Sur les routes natives de la famille OpenAI, cela inclut des en-têtes d’identité de requête session/tour stables plus des métadonnées de transport correspondantes.

OpenClaw normalise aussi les compteurs d’usage OpenAI selon les variantes de transport avant qu’ils n’atteignent les surfaces de session/statut. Le trafic natif OpenAI/Codex Responses peut
rapporter l’usage soit comme `input_tokens` / `output_tokens`, soit comme
`prompt_tokens` / `completion_tokens` ; OpenClaw les traite comme les mêmes compteurs d’entrée
et de sortie pour `/status`, `/usage` et les journaux de session. Lorsque le trafic WebSocket natif
omet `total_tokens` (ou rapporte `0`), OpenClaw revient au total normalisé entrée + sortie afin que les affichages de session/statut restent renseignés.

Vous pouvez définir `agents.defaults.models.<provider/model>.params.transport` :

- `"sse"` : force SSE
- `"websocket"` : force WebSocket
- `"auto"` : essaie WebSocket, puis revient à SSE

Pour `openai/*` (API Responses), OpenClaw active aussi par défaut le préchauffage WebSocket
(`openaiWsWarmup: true`) lorsque le transport WebSocket est utilisé.

Documentation OpenAI associée :

- [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Préchauffage WebSocket OpenAI

La documentation OpenAI décrit le préchauffage comme facultatif. OpenClaw l’active par défaut pour
`openai/*` afin de réduire la latence du premier tour lors de l’utilisation du transport WebSocket.

### Désactiver le préchauffage

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Activer explicitement le préchauffage

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Traitement prioritaire OpenAI et Codex

L’API d’OpenAI expose le traitement prioritaire via `service_tier=priority`. Dans
OpenClaw, définissez `agents.defaults.models["<provider>/<model>"].params.serviceTier`
pour transmettre ce champ aux endpoints natifs OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Les valeurs prises en charge sont `auto`, `default`, `flex` et `priority`.

OpenClaw transmet `params.serviceTier` aux requêtes Responses `openai/*` directes
comme aux requêtes Codex Responses `openai-codex/*` lorsque ces modèles pointent
vers les endpoints natifs OpenAI/Codex.

Comportement important :

- `openai/*` direct doit cibler `api.openai.com`
- `openai-codex/*` doit cibler `chatgpt.com/backend-api`
- si vous acheminez l’un ou l’autre fournisseur via une autre URL de base ou un proxy, OpenClaw laisse `service_tier` inchangé

### Mode rapide OpenAI

OpenClaw expose un basculement de mode rapide partagé pour les sessions `openai/*` et
`openai-codex/*` :

- Chat/UI : `/fast status|on|off`
- Configuration : `agents.defaults.models["<provider>/<model>"].params.fastMode`

Lorsque le mode rapide est activé, OpenClaw le mappe au traitement prioritaire OpenAI :

- les appels directs `openai/*` Responses à `api.openai.com` envoient `service_tier = "priority"`
- les appels `openai-codex/*` Responses à `chatgpt.com/backend-api` envoient aussi `service_tier = "priority"`
- les valeurs existantes de `service_tier` dans la charge utile sont préservées
- le mode rapide ne réécrit ni `reasoning` ni `text.verbosity`

Pour GPT 5.4 en particulier, la configuration la plus courante est :

- envoyer `/fast on` dans une session utilisant `openai/gpt-5.4` ou `openai-codex/gpt-5.4`
- ou définir `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- si vous utilisez aussi Codex OAuth, définissez également `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Exemple :

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Les substitutions de session priment sur la configuration. Effacer la substitution de session dans l’interface Sessions
ramène la session à la valeur par défaut configurée.

### Routes OpenAI natives versus routes compatibles OpenAI

OpenClaw traite les endpoints directs OpenAI, Codex et Azure OpenAI différemment
des proxys génériques compatibles OpenAI `/v1` :

- les routes natives `openai/*`, `openai-codex/*` et Azure OpenAI conservent
  `reasoning: { effort: "none" }` intact lorsque vous désactivez explicitement le raisonnement
- les routes natives de la famille OpenAI utilisent par défaut le mode strict pour les schémas d’outils
- les en-têtes d’attribution OpenClaw masqués (`originator`, `version`, et
  `User-Agent`) ne sont joints que sur les hôtes OpenAI natifs vérifiés
  (`api.openai.com`) et les hôtes Codex natifs (`chatgpt.com/backend-api`)
- les routes OpenAI/Codex natives conservent la mise en forme de requête réservée à OpenAI comme
  `service_tier`, `store` de Responses, les charges utiles de compatibilité de raisonnement OpenAI, et
  les indications de cache de prompt
- les routes compatibles OpenAI de style proxy conservent le comportement de compatibilité plus souple et
  ne forcent pas les schémas d’outils stricts, la mise en forme de requête réservée au natif, ni les en-têtes
  d’attribution OpenAI/Codex masqués

Azure OpenAI reste dans la catégorie de routage natif pour le comportement de transport et de compatibilité,
mais ne reçoit pas les en-têtes d’attribution OpenAI/Codex masqués.

Cela préserve le comportement actuel de OpenAI Responses natif sans imposer d’anciens
adaptateurs compatibles OpenAI à des backends tiers `/v1`.

### Compactage côté serveur OpenAI Responses

Pour les modèles directs OpenAI Responses (`openai/*` utilisant `api: "openai-responses"` avec
`baseUrl` sur `api.openai.com`), OpenClaw active désormais automatiquement les indications de charge utile
de compactage côté serveur OpenAI :

- Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
- Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`

Par défaut, `compact_threshold` vaut `70%` du `contextWindow` du modèle (ou `80000`
lorsqu’il n’est pas disponible).

### Activer explicitement le compactage côté serveur

Utilisez ceci lorsque vous voulez forcer l’injection de `context_management` sur des
modèles Responses compatibles (par exemple Azure OpenAI Responses) :

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Activer avec un seuil personnalisé

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Désactiver le compactage côté serveur

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` contrôle uniquement l’injection de `context_management`.
Les modèles directs OpenAI Responses forcent toujours `store: true` sauf si la compatibilité définit
`supportsStore: false`.

## Remarques

- Les références de modèle utilisent toujours `provider/model` (voir [/concepts/models](/fr/concepts/models)).
- Les détails d’authentification + règles de réutilisation se trouvent dans [/concepts/oauth](/fr/concepts/oauth).
