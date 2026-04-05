---
read_when:
    - Vous voulez utiliser les modèles OpenAI dans OpenClaw
    - Vous voulez une authentification par abonnement Codex au lieu de clés API
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T12:52:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fournit des API pour développeurs pour les modèles GPT. Codex prend en charge **la connexion ChatGPT** pour un accès par abonnement
ou **la connexion par clé API** pour un accès facturé à l’usage. Codex cloud nécessite une connexion ChatGPT.
OpenAI prend explicitement en charge l’utilisation d’un abonnement OAuth dans des outils/workflows externes comme OpenClaw.

## Style d’interaction par défaut

OpenClaw ajoute par défaut une petite surcouche de prompt spécifique à OpenAI pour les exécutions
`openai/*` et `openai-codex/*`. Cette surcouche garde l’assistant chaleureux,
collaboratif, concis et direct sans remplacer le prompt système de base d’OpenClaw.

Clé de configuration :

`plugins.entries.openai.config.personalityOverlay`

Valeurs autorisées :

- `"friendly"` : par défaut ; active la surcouche spécifique à OpenAI.
- `"off"` : désactive la surcouche et utilise uniquement le prompt de base d’OpenClaw.

Portée :

- S’applique aux modèles `openai/*`.
- S’applique aux modèles `openai-codex/*`.
- N’affecte pas les autres fournisseurs.

Ce comportement est activé par défaut :

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Désactiver la surcouche de prompt OpenAI

Si vous préférez le prompt de base d’OpenClaw non modifié, désactivez la surcouche :

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Vous pouvez aussi la définir directement avec la CLI de configuration :

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Option A : clé API OpenAI (OpenAI Platform)

**Idéal pour :** l’accès direct à l’API et la facturation à l’usage.
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

La documentation actuelle des modèles API d’OpenAI liste `gpt-5.4` et `gpt-5.4-pro` pour un usage direct de
l’API OpenAI. OpenClaw transmet les deux via le chemin `openai/*` Responses.
OpenClaw supprime volontairement l’entrée obsolète `openai/gpt-5.3-codex-spark`,
car les appels directs à l’API OpenAI la rejettent en trafic réel.

OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark` sur le chemin direct de l’API OpenAI.
`pi-ai` fournit toujours une entrée intégrée pour ce modèle, mais les requêtes réelles à l’API OpenAI
la rejettent actuellement. Spark est traité comme Codex-only dans OpenClaw.

## Option B : abonnement OpenAI Code (Codex)

**Idéal pour :** utiliser un accès par abonnement ChatGPT/Codex au lieu d’une clé API.
Codex cloud nécessite une connexion ChatGPT, tandis que Codex CLI prend en charge une connexion ChatGPT ou par clé API.

### Configuration CLI (Codex OAuth)

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

La documentation actuelle de Codex d’OpenAI liste `gpt-5.4` comme modèle Codex actuel. OpenClaw
le mappe sur `openai-codex/gpt-5.4` pour l’usage OAuth ChatGPT/Codex.

Si l’onboarding réutilise une connexion Codex CLI existante, ces identifiants restent
gérés par Codex CLI. À l’expiration, OpenClaw relit d’abord la source externe Codex
et, lorsque le fournisseur peut l’actualiser, réécrit l’identifiant actualisé
dans le stockage Codex au lieu d’en prendre possession dans une copie séparée propre à OpenClaw.

Si votre compte Codex a droit à Codex Spark, OpenClaw prend également en charge :

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw traite Codex Spark comme Codex-only. Il n’expose pas de chemin direct
`openai/gpt-5.3-codex-spark` par clé API.

OpenClaw conserve également `openai-codex/gpt-5.3-codex-spark` lorsque `pi-ai`
le découvre. Traitez-le comme dépendant des droits et expérimental : Codex Spark est
distinct de GPT-5.4 `/fast`, et sa disponibilité dépend du compte Codex /
ChatGPT connecté.

### Limite de fenêtre de contexte Codex

OpenClaw traite les métadonnées du modèle Codex et la limite de contexte du runtime comme des
valeurs distinctes.

Pour `openai-codex/gpt-5.4` :

- `contextWindow` natif : `1050000`
- limite `contextTokens` du runtime par défaut : `272000`

Cela garde les métadonnées du modèle fidèles tout en conservant la fenêtre
plus petite par défaut du runtime, qui a en pratique de meilleures caractéristiques de latence et de qualité.

Si vous voulez une limite effective différente, définissez `models.providers.<provider>.models[].contextTokens` :

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

Utilisez `contextWindow` uniquement lorsque vous déclarez ou remplacez les métadonnées natives du modèle.
Utilisez `contextTokens` lorsque vous voulez limiter le budget de contexte du runtime.

### Transport par défaut

OpenClaw utilise `pi-ai` pour le streaming des modèles. Pour `openai/*` comme pour
`openai-codex/*`, le transport par défaut est `"auto"` (WebSocket d’abord, puis repli
SSE).

En mode `"auto"`, OpenClaw réessaie aussi un échec WebSocket précoce et réessayable
avant de se replier sur SSE. Le mode `"websocket"` forcé continue d’exposer directement les erreurs de transport
au lieu de les masquer derrière un repli.

Après un échec WebSocket à la connexion ou au début d’un tour en mode `"auto"`, OpenClaw marque
le chemin WebSocket de cette session comme dégradé pendant environ 60 secondes et envoie
les tours suivants via SSE pendant la période de refroidissement au lieu d’osciller entre
les transports.

Pour les points de terminaison natifs de la famille OpenAI (`openai/*`, `openai-codex/*`, et Azure
OpenAI Responses), OpenClaw attache aussi un état stable d’identité de session et de tour
aux requêtes afin que les réessais, reconnexions et replis SSE restent alignés sur la même
identité de conversation. Sur les routes natives de la famille OpenAI, cela inclut des en-têtes d’identité stables de requête session/tour ainsi que des métadonnées de transport correspondantes.

OpenClaw normalise aussi les compteurs d’usage OpenAI entre variantes de transport avant
qu’ils n’atteignent les surfaces session/statut. Le trafic natif OpenAI/Codex Responses peut
rapporter l’usage sous la forme `input_tokens` / `output_tokens` ou
`prompt_tokens` / `completion_tokens` ; OpenClaw les traite comme les mêmes compteurs d’entrée
et de sortie pour `/status`, `/usage`, et les journaux de session. Lorsque le trafic natif
WebSocket omet `total_tokens` (ou indique `0`), OpenClaw se rabat sur le total
normalisé entrée + sortie afin que les affichages de session/statut restent renseignés.

Vous pouvez définir `agents.defaults.models.<provider/model>.params.transport` :

- `"sse"` : forcer SSE
- `"websocket"` : forcer WebSocket
- `"auto"` : essayer WebSocket, puis se replier sur SSE

Pour `openai/*` (API Responses), OpenClaw active aussi par défaut le warm-up WebSocket
(`openaiWsWarmup: true`) lorsque le transport WebSocket est utilisé.

Documentation OpenAI associée :

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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

### Warm-up WebSocket OpenAI

La documentation OpenAI décrit le warm-up comme facultatif. OpenClaw l’active par défaut pour
`openai/*` afin de réduire la latence du premier tour lors de l’utilisation du transport WebSocket.

### Désactiver le warm-up

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

### Activer explicitement le warm-up

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
pour transmettre ce champ aux points de terminaison natifs OpenAI/Codex Responses.

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

Les valeurs prises en charge sont `auto`, `default`, `flex`, et `priority`.

OpenClaw transmet `params.serviceTier` à la fois aux requêtes directes `openai/*` Responses
et aux requêtes `openai-codex/*` Codex Responses lorsque ces modèles pointent
vers les points de terminaison natifs OpenAI/Codex.

Comportement important :

- `openai/*` direct doit cibler `api.openai.com`
- `openai-codex/*` doit cibler `chatgpt.com/backend-api`
- si vous routez l’un ou l’autre fournisseur via une autre URL de base ou un proxy, OpenClaw laisse `service_tier` intact

### Mode fast OpenAI

OpenClaw expose un basculement partagé de mode fast pour les sessions `openai/*` et
`openai-codex/*` :

- Chat/UI : `/fast status|on|off`
- Configuration : `agents.defaults.models["<provider>/<model>"].params.fastMode`

Lorsque le mode fast est activé, OpenClaw le mappe sur le traitement prioritaire OpenAI :

- les appels directs `openai/*` Responses vers `api.openai.com` envoient `service_tier = "priority"`
- les appels `openai-codex/*` Responses vers `chatgpt.com/backend-api` envoient aussi `service_tier = "priority"`
- les valeurs existantes de `service_tier` dans la charge utile sont conservées
- le mode fast ne réécrit pas `reasoning` ni `text.verbosity`

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

Les surcharges de session l’emportent sur la configuration. Effacer la surcharge de session dans l’interface Sessions
ramène la session à la valeur par défaut configurée.

### Routes OpenAI natives versus compatibles OpenAI

OpenClaw traite différemment les points de terminaison directs OpenAI, Codex et Azure OpenAI
par rapport aux proxys génériques compatibles OpenAI `/v1` :

- les routes natives `openai/*`, `openai-codex/*`, et Azure OpenAI conservent
  `reasoning: { effort: "none" }` intact lorsque vous désactivez explicitement le raisonnement
- les routes natives de la famille OpenAI mettent par défaut les schémas d’outils en mode strict
- les en-têtes cachés d’attribution OpenClaw (`originator`, `version`, et
  `User-Agent`) ne sont attachés que sur les hôtes OpenAI natifs vérifiés
  (`api.openai.com`) et les hôtes Codex natifs (`chatgpt.com/backend-api`)
- les routes OpenAI/Codex natives conservent le modelage de requête spécifique à OpenAI comme
  `service_tier`, `store` de Responses, les charges utiles de compatibilité de raisonnement OpenAI, et
  les indices de cache de prompt
- les routes de type proxy compatibles OpenAI conservent le comportement de compatibilité plus souple et
  ne forcent ni les schémas d’outils stricts, ni le modelage natif des requêtes, ni les en-têtes
  cachés d’attribution OpenAI/Codex

Azure OpenAI reste dans la catégorie de routage natif pour le transport et le comportement de compatibilité,
mais ne reçoit pas les en-têtes cachés d’attribution OpenAI/Codex.

Cela préserve le comportement actuel des Responses OpenAI natives sans imposer d’anciens
shims compatibles OpenAI à des backends tiers `/v1`.

### Compaction côté serveur OpenAI Responses

Pour les modèles directs OpenAI Responses (`openai/*` utilisant `api: "openai-responses"` avec
`baseUrl` sur `api.openai.com`), OpenClaw active maintenant automatiquement les indices de charge utile
de compaction côté serveur OpenAI :

- Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
- Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`

Par défaut, `compact_threshold` vaut `70%` du `contextWindow` du modèle (ou `80000`
lorsqu’il est indisponible).

### Activer explicitement la compaction côté serveur

Utilisez ceci lorsque vous voulez forcer l’injection de `context_management` sur des modèles
Responses compatibles (par exemple Azure OpenAI Responses) :

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

### Désactiver la compaction côté serveur

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

`responsesServerCompaction` ne contrôle que l’injection de `context_management`.
Les modèles directs OpenAI Responses continuent de forcer `store: true` sauf si la compatibilité définit
`supportsStore: false`.

## Remarques

- Les références de modèle utilisent toujours `provider/model` (voir [/concepts/models](/concepts/models)).
- Les détails d’authentification + les règles de réutilisation se trouvent dans [/concepts/oauth](/concepts/oauth).
