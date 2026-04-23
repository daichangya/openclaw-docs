---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI fournit des API pour développeurs pour les modèles GPT. OpenClaw prend en charge deux modes d’authentification :

  - **Clé API** — accès direct à la plateforme OpenAI avec facturation à l’usage (modèles `openai/*`)
  - **Abonnement Codex** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)

  OpenAI prend explicitement en charge l’utilisation d’OAuth par abonnement dans des outils externes et des workflows comme OpenClaw.

  ## Couverture des fonctionnalités OpenClaw

  | Capacité OpenAI          | Surface OpenClaw                          | Statut                                                 |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | fournisseur de modèles `openai/<model>`   | Oui                                                    |
  | Modèles d’abonnement Codex | fournisseur de modèles `openai-codex/<model>` | Oui                                                |
  | Recherche web côté serveur | Outil natif OpenAI Responses            | Oui, lorsque la recherche web est activée et qu’aucun fournisseur n’est épinglé |
  | Images                   | `image_generate`                          | Oui                                                    |
  | Vidéos                   | `video_generate`                          | Oui                                                    |
  | Synthèse vocale          | `messages.tts.provider: "openai"` / `tts` | Oui                                                    |
  | Speech-to-text par lot   | `tools.media.audio` / compréhension média | Oui                                                    |
  | Speech-to-text en streaming | Voice Call `streaming.provider: "openai"` | Oui                                                 |
  | Voix temps réel          | Voice Call `realtime.provider: "openai"`  | Oui                                                    |
  | Embeddings               | fournisseur d’embeddings mémoire          | Oui                                                    |

  ## Prise en main

  Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

  <Tabs>
  <Tab title="Clé API (plateforme OpenAI)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence de modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |

    <Note>
    La connexion ChatGPT/Codex passe par `openai-codex/*`, pas par `openai/*`.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark` sur le chemin API direct. Les requêtes API OpenAI en direct rejettent ce modèle. Spark est réservé à Codex.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API séparée. Codex cloud nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations headless ou peu compatibles avec les callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence de modèle | Route | Authentification |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Connexion Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Connexion Codex (dépend des droits) |

    <Note>
    Cette route est intentionnellement distincte de `openai/gpt-5.4`. Utilisez `openai/*` avec une clé API pour l’accès direct à la plateforme, et `openai-codex/*` pour l’accès par abonnement Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus le matériel OAuth depuis `~/.codex`. Connectez-vous avec OAuth navigateur (par défaut) ou avec le flux code d’appareil ci-dessus — OpenClaw gère les identifiants résultants dans son propre magasin d’authentification d’agent.
    </Note>

    ### Plafond de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et le plafond de contexte du runtime comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.4` :

    - `contextWindow` natif : `1050000`
    - Plafond `contextTokens` du runtime par défaut : `272000`

    Le plafond par défaut plus petit offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-le avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte du runtime.
    </Note>

  </Tab>
</Tabs>

## Génération d’images

Le plugin `openai` groupé enregistre la génération d’images via l’outil `image_generate`.

| Capacité                | Valeur                             |
| ----------------------- | ---------------------------------- |
| Modèle par défaut       | `openai/gpt-image-2`               |
| Nombre maximal d’images par requête | 4                       |
| Mode édition            | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille | Pris en charge, y compris les tailles 2K/4K |
| Ratio d’aspect / résolution | Non transmis à l’API OpenAI Images |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut à la fois pour la génération texte-vers-image OpenAI et pour l’édition d’image. `gpt-image-1` reste utilisable comme remplacement de modèle explicite, mais les nouveaux workflows d’image OpenAI doivent utiliser `openai/gpt-image-2`.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Une affiche de lancement soignée pour OpenClaw sur macOS" size=3840x2160 count=1
```

Éditer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Préservez la forme de l’objet, changez le matériau en verre translucide" image=/path/to/reference.png size=1024x1536
```

## Génération vidéo

Le plugin `openai` groupé enregistre la génération vidéo via l’outil `video_generate`.

| Capacité       | Valeur                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                |
| Modes          | Texte-vers-vidéo, image-vers-vidéo, édition d’une seule vidéo                    |
| Entrées de référence | 1 image ou 1 vidéo                                                          |
| Remplacements de taille | Pris en charge                                                             |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l’outil |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 sur l’ensemble des fournisseurs. Elle s’applique par ID de modèle, de sorte que `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` et les autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x n’en bénéficient pas.

Le fournisseur natif groupé du harnais Codex (`codex/*`) utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur du serveur d’application Codex, de sorte que les sessions `codex/gpt-5.x` conservent les mêmes consignes de suivi et de Heartbeat proactif même si Codex gère le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications d’achèvement et la vérification. Le comportement des réponses spécifique au canal et des messages silencieux reste dans le prompt système partagé OpenClaw et la politique de livraison sortante. Les consignes GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction amical est séparée et configurable.

| Valeur                 | Effet                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (par défaut) | Active la couche de style d’interaction amical |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Désactive uniquement la couche de style amical |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Les valeurs ne sont pas sensibles à la casse au runtime, donc `"Off"` et `"off"` désactivent tous deux la couche de style amical.
</Tip>

<Note>
L’ancien réglage `plugins.entries.openai.config.personality` est toujours lu comme solution de compatibilité de repli lorsque le réglage partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin `openai` groupé enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Revient à `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter le point de terminaison de l’API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le plugin `openai` groupé enregistre le speech-to-text par lot via
    la surface de transcription de compréhension média d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : upload de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salons vocaux Discord et les
      pièces jointes audio des canaux

    Pour forcer OpenAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Les indices de langue et de prompt sont transmis à OpenAI lorsqu’ils sont fournis par la
    configuration média audio partagée ou par une requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le plugin `openai` groupé enregistre la transcription en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Revient à `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le plugin `openai` groupé enregistre la voix en temps réel pour le plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    |---------|------------|---------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Revient à `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` groupé peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure dans `models.providers.openai.baseUrl` et bascule automatiquement vers
le format de requête Azure.

<Note>
La voix en temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Voir l’accordéon **Voix en temps réel**
sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement, d’un quota ou d’un contrat d’entreprise Azure OpenAI
- Vous avez besoin de la résidence des données régionale ou des contrôles de conformité fournis par Azure
- Vous souhaitez conserver le trafic dans un locataire Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` groupé, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé de la plateforme OpenAI) :

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route de génération d’images Azure :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins à portée de déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête

Les autres URL de base (OpenAI public, proxies compatibles OpenAI) conservent le format de requête d’image OpenAI standard.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou ultérieur. Les versions antérieures traitent toute
`openai.baseUrl` personnalisée comme le point de terminaison OpenAI public et échoueront face aux déploiements
d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version preview ou GA Azure spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI associe les modèles à des déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` groupé, le champ `model` dans OpenClaw
doit être le **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’id public du modèle OpenAI.

Si vous créez un déploiement appelé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Une affiche épurée" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur `openai` groupé.

### Disponibilité régionale

La génération d’images Azure est actuellement disponible uniquement dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Vérifiez la liste actuelle des régions de Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options qu’OpenAI public autorise (par exemple certaines
valeurs de `background` sur `gpt-image-2`) ou ne les exposer que sur certaines versions
de modèle. Ces différences viennent d’Azure et du modèle sous-jacent, pas
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble
de paramètres pris en charge par votre déploiement et votre version d’API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise un transport natif et un comportement de compatibilité natif, mais ne reçoit
pas les en-têtes d’attribution cachés d’OpenClaw. Voir l’accordéon **Routes natives vs compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration)
pour plus de détails.
</Note>

<Tip>
Pour un fournisseur Azure OpenAI Responses séparé (distinct du fournisseur `openai`), voir les références de modèle `azure-openai-responses/*` dans l’accordéon
[Compaction côté serveur](#server-side-compaction-responses-api).
</Tip>

<Note>
Le trafic de chat et Responses Azure nécessite une configuration fournisseur/API spécifique à Azure en
plus d’un remplacement d’URL de base. Si vous souhaitez des appels de modèles Azure au-delà de la génération
d’images, utilisez le flux d’onboarding ou une configuration fournisseur qui définit la
forme d’API/authentification Azure appropriée plutôt que de supposer que `openai.baseUrl` seul
suffit.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une fois après un échec WebSocket précoce avant de basculer vers SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et reconnexions
    - Normalise les compteurs d’utilisation (`input_tokens` / `prompt_tokens`) selon les variantes de transport

    | Valeur | Comportement |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d’abord, repli SSE |
    | `"sse"` | Force SSE uniquement |
    | `"websocket"` | Force WebSocket uniquement |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active le préchauffage WebSocket par défaut pour `openai/*` afin de réduire la latence du premier tour.

    ```json5
    // Désactiver le préchauffage
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Mode rapide">
    OpenClaw expose un basculement partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide sur le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont préservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session l’emportent sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` n’est transmis qu’aux points de terminaison OpenAI natifs (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), OpenClaw active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu’il n’est pas disponible)

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Seuil personnalisé">
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
      </Tab>
      <Tab title="Désactiver">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`. Les modèles OpenAI Responses directs forcent toujours `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*` et `openai-codex/*`, OpenClaw peut utiliser un contrat d’exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne traite plus un tour de planification seule comme une progression réussie lorsqu’une action d’outil est disponible
    - Relance le tour avec une incitation à agir maintenant
    - Active automatiquement `update_plan` pour les travaux substantiels
    - Fait apparaître un état bloqué explicite si le modèle continue à planifier sans agir

    <Note>
    Portée limitée aux exécutions GPT-5 de la famille OpenAI et Codex uniquement. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs compatibles OpenAI">
    OpenClaw traite différemment les points de terminaison directs OpenAI, Codex et Azure OpenAI par rapport aux proxies `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, `openai-codex/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omets le raisonnement désactivé pour les modèles ou proxies qui rejettent `reasoning.effort: "none"`
    - Utilisent par défaut des schémas d’outils en mode strict
    - Attachent des en-têtes d’attribution cachés uniquement sur les hôtes natifs vérifiés
    - Conservent la mise en forme de requête propre à OpenAI (`service_tier`, `store`, compatibilité de raisonnement, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés aux routes natives

    Azure OpenAI utilise un transport natif et un comportement de compatibilité natif, mais ne reçoit pas les en-têtes d’attribution cachés.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
