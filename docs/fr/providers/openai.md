---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous souhaitez une authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T07:28:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fournit des API développeur pour les modèles GPT. OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la route :

- **Clé API** — accès direct à la plateforme OpenAI avec facturation à l’usage (modèles `openai/*`)
- **Abonnement Codex via PI** — connexion ChatGPT/Codex avec accès par abonnement (modèles `openai-codex/*`)
- **Harnais serveur d’application Codex** — exécution native du serveur d’application Codex (modèles `openai/*` plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI prend explicitement en charge l’utilisation OAuth par abonnement dans des outils externes et des flux de travail comme OpenClaw.

<Note>
GPT-5.5 est actuellement disponible dans OpenClaw via les routes d’abonnement/OAuth :
`openai-codex/gpt-5.5` avec l’exécuteur PI, ou `openai/gpt-5.5` avec le
harnais serveur d’application Codex. L’accès direct par clé API à `openai/gpt-5.5` est
pris en charge une fois qu’OpenAI activera GPT-5.5 sur l’API publique ; d’ici là utilisez un
modèle activé pour l’API tel que `openai/gpt-5.4` pour les configurations `OPENAI_API_KEY`.
</Note>

<Note>
Activer le Plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n’active pas
le Plugin groupé du serveur d’application Codex. OpenClaw n’active ce Plugin que
lorsque vous sélectionnez explicitement le harnais Codex natif avec
`embeddedHarness.runtime: "codex"` ou utilisez une ancienne référence de modèle `codex/*`.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI          | Surface OpenClaw                                           | Statut                                                 |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | fournisseur de modèle `openai/<model>`                    | Oui                                                    |
| Modèles d’abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`        | Oui                                                    |
| Harnais serveur d’application Codex | `openai/<model>` avec `embeddedHarness.runtime: codex` | Oui                                           |
| Recherche Web côté serveur | Outil natif OpenAI Responses                            | Oui, lorsque la recherche Web est activée et qu’aucun fournisseur n’est épinglé |
| Images                   | `image_generate`                                           | Oui                                                    |
| Vidéos                   | `video_generate`                                           | Oui                                                    |
| Synthèse vocale          | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                    |
| Speech-to-text par lots  | `tools.media.audio` / compréhension des médias             | Oui                                                    |
| Speech-to-text en streaming | Voice Call `streaming.provider: "openai"`               | Oui                                                    |
| Voix temps réel          | Voice Call `realtime.provider: "openai"` / Talk de l’interface Control | Oui                                        |
| Embeddings               | fournisseur d’embeddings mémoire                           | Oui                                                    |

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (plateforme OpenAI)">
    **Idéal pour :** accès API direct et facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez directement la clé :

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
    | `openai/gpt-5.4` | API plateforme OpenAI directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API plateforme OpenAI directe | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Future route API directe une fois GPT-5.5 activé par OpenAI sur l’API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` est la route directe OpenAI par clé API sauf si vous forcez explicitement
    le harnais serveur d’application Codex. GPT-5.5 lui-même est actuellement réservé à l’abonnement/OAuth ;
    utilisez `openai-codex/*` pour l’OAuth Codex via l’exécuteur PI par défaut.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw n’expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes live à l’API OpenAI rejettent ce modèle, et le catalogue Codex actuel ne l’expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d’une clé API distincte. Codex cloud exige une connexion ChatGPT.

    <Steps>
      <Step title="Exécuter l’OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations headless ou hostiles aux callbacks, ajoutez `--device-code` pour vous connecter avec un flux de code d’appareil ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définir le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
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
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex via PI | Connexion Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harnais serveur d’application Codex | Authentification du serveur d’application Codex |

    <Note>
    Continuez à utiliser l’identifiant de fournisseur `openai-codex` pour les commandes
    auth/profil. Le préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour l’OAuth Codex.
    Il ne sélectionne ni n’active automatiquement le harnais groupé du serveur d’application Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding n’importe plus le matériel OAuth depuis `~/.codex`. Connectez-vous avec l’OAuth navigateur (par défaut) ou le flux par code d’appareil ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Indicateur d’état

    Le `/status` du chat affiche quel harnais embarqué est actif pour la
    session courante. Le harnais PI par défaut apparaît comme `Runner: pi (embedded)` et
    n’ajoute pas de badge distinct. Lorsque le harnais groupé du serveur d’application Codex est
    sélectionné, `/status` ajoute l’identifiant du harnais non-PI à côté de `Fast`, par exemple
    `Fast · codex`. Les sessions existantes conservent leur identifiant de harnais enregistré, donc utilisez
    `/new` ou `/reset` après avoir modifié `embeddedHarness` si vous voulez que `/status`
    reflète un nouveau choix PI/Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte d’exécution comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.5` via OAuth Codex :

    - `contextWindow` natif : `1000000`
    - Limite par défaut d’exécution `contextTokens` : `272000`

    La limite par défaut plus petite présente de meilleures caractéristiques de latence et de qualité en pratique. Remplacez-la avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte d’exécution.
    </Note>

  </Tab>
</Tabs>

## Génération d’images

Le Plugin groupé `openai` enregistre la génération d’images via l’outil `image_generate`.
Il prend en charge à la fois la génération d’images OpenAI par clé API et la génération d’images par OAuth Codex
via la même référence de modèle `openai/gpt-image-2`.

| Capacité                | Clé API OpenAI                     | OAuth Codex                          |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| Référence de modèle     | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification        | `OPENAI_API_KEY`                   | Connexion OAuth OpenAI Codex         |
| Transport               | API OpenAI Images                  | Backend Codex Responses              |
| Images max par requête  | 4                                  | 4                                    |
| Mode édition            | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Remplacements de taille | Pris en charge, y compris tailles 2K/4K | Pris en charge, y compris tailles 2K/4K |
| Format d’image / résolution | Non transmis à l’API OpenAI Images | Mappé à une taille prise en charge lorsque c’est sûr |

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
Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération texte-vers-image OpenAI comme pour l’édition d’image. `gpt-image-1` reste utilisable comme remplacement explicite de modèle, mais les nouveaux flux de travail d’image OpenAI doivent utiliser `openai/gpt-image-2`.

Pour les installations OAuth Codex, gardez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai-codex` est configuré, OpenClaw résout le jeton d’accès OAuth stocké et envoie les requêtes d’image via le backend Codex Responses. Il
n’essaie pas d’abord `OPENAI_API_KEY` et ne se replie pas silencieusement sur une clé API pour cette requête. Configurez `models.providers.openai` explicitement avec une clé API,
une URL de base personnalisée ou un endpoint Azure lorsque vous voulez la route directe de l’API OpenAI Images.
Si cet endpoint d’image personnalisé se trouve sur un LAN/adresse privée approuvé, définissez aussi
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw garde
les endpoints d’image OpenAI-compatibles privés/internes bloqués tant que cette activation explicite n’est pas présente.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Éditer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Génération vidéo

Le Plugin groupé `openai` enregistre la génération vidéo via l’outil `video_generate`.

| Capacité       | Valeur                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                |
| Modes          | Texte-vers-vidéo, image-vers-vidéo, édition d’une seule vidéo                    |
| Entrées de référence | 1 image ou 1 vidéo                                                           |
| Remplacements de taille | Pris en charge                                                            |
| Autres remplacements | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement outil |

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
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de basculement.
</Note>

## Contribution de prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 chez tous les fournisseurs. Elle s’applique par identifiant de modèle, donc `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, et d’autres références GPT-5 compatibles reçoivent la même superposition. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais natif Codex groupé utilise le même comportement GPT-5 et la même superposition Heartbeat via les instructions développeur du serveur d’application Codex, de sorte que les sessions `openai/gpt-5.x` forcées via `embeddedHarness.runtime: "codex"` conservent les mêmes indications de suivi et de Heartbeat proactif même si Codex possède le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la persona, la sécurité d’exécution, la discipline des outils, la forme de sortie, les vérifications de complétion et la vérification. Le comportement de réponse spécifique au canal et de message silencieux reste dans le prompt système partagé OpenClaw et la politique de livraison sortante. Les indications GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d’interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (par défaut) | Active la couche de style d’interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Désactive uniquement la couche de style conviviale |

<Tabs>
  <Tab title="Configuration">
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
Les valeurs sont insensibles à la casse à l’exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style conviviale.
</Tip>

<Note>
L’ancien `plugins.entries.openai.config.personality` est toujours lu comme solution de secours de compatibilité lorsque le paramètre partagé `agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin groupé `openai` enregistre la synthèse vocale pour la surface `messages.tts`.

    | Paramètre | Chemin de configuration | Par défaut |
    | --------- | ----------------------- | ---------- |
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Se replie sur `OPENAI_API_KEY` |
    | URL de base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles : `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base TTS sans affecter l’endpoint d’API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le Plugin groupé `openai` enregistre le speech-to-text par lots via
    la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Endpoint : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : envoi de fichier audio multipart
    - Pris en charge partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de canal vocal Discord et les
      pièces jointes audio de canal

    Pour forcer OpenAI pour la transcription audio entrante :

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

    Les indications de langue et de prompt sont transmises à OpenAI lorsqu’elles sont fournies par la
    configuration audio média partagée ou par une requête de transcription spécifique à l’appel.

  </Accordion>

  <Accordion title="Transcription temps réel">
    Le Plugin groupé `openai` enregistre la transcription temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    | --------- | ----------------------- | ---------- |
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket vers `wss://api.openai.com/v1/realtime` avec l’audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix temps réel">
    Le Plugin groupé `openai` enregistre la voix temps réel pour le Plugin Voice Call.

    | Paramètre | Chemin de configuration | Par défaut |
    | --------- | ----------------------- | ---------- |
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Se replie sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l’appel d’outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

Le fournisseur groupé `openai` peut cibler une ressource Azure OpenAI pour la génération d’images
en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure dans `models.providers.openai.baseUrl` et bascule automatiquement vers
la forme de requête Azure.

<Note>
La voix temps réel utilise un chemin de configuration séparé
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Voir l’accordéon **Voix
temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- Vous disposez déjà d’un abonnement Azure OpenAI, de quota ou d’un contrat entreprise
- Vous avez besoin de résidence des données régionale ou de contrôles de conformité fournis par Azure
- Vous voulez garder le trafic à l’intérieur d’un tenant Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur groupé `openai`, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé de plateforme OpenAI) :

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

OpenClaw reconnaît ces suffixes d’hôte Azure pour la route Azure de génération d’images :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins ciblés par déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la forme standard
des requêtes d’image OpenAI.

<Note>
Le routage Azure pour le chemin de génération d’images du fournisseur `openai` exige
OpenClaw 2026.4.22 ou une version ultérieure. Les versions antérieures traitent toute
`openai.baseUrl` personnalisée comme l’endpoint OpenAI public et échouent contre les
déploiements d’images Azure.
</Note>

### Version d’API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version preview ou GA spécifique
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI lie les modèles à des déploiements. Pour les requêtes Azure de génération d’images
routées via le fournisseur groupé `openai`, le champ `model` dans OpenClaw
doit être le **nom de déploiement Azure** que vous avez configuré dans le portail Azure, et non
l’identifiant public du modèle OpenAI.

Si vous créez un déploiement nommé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La même règle de nom de déploiement s’applique aux appels de génération d’images routés via
le fournisseur groupé `openai`.

### Disponibilité régionale

La génération d’images Azure est actuellement disponible uniquement dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Vérifiez la liste actuelle des régions Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut rejeter des options que l’OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur des versions de modèle spécifiques. Ces différences proviennent d’Azure et du modèle sous-jacent, pas d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l’ensemble
de paramètres pris en charge par votre déploiement et version d’API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise un transport natif et un comportement compatible, mais ne reçoit pas
les en-têtes d’attribution cachés d’OpenClaw — voir l’accordéon **Routes natives vs compatibles OpenAI** sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d’images), utilisez le
flux d’onboarding ou une configuration dédiée de fournisseur Azure — `openai.baseUrl` seul
ne reprend pas la forme d’API/authentification Azure. Un fournisseur distinct
`azure-openai-responses/*` existe ; voir
l’accordéon Server-side compaction ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` comme pour `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une fois après un échec précoce WebSocket avant de se replier sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le refroidissement
    - Attache des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et reconnexions
    - Normalise les compteurs d’usage (`input_tokens` / `prompt_tokens`) entre les variantes de transport

    | Valeur | Comportement |
    |-------|--------------|
    | `"auto"` (par défaut) | WebSocket d’abord, repli SSE |
    | `"sse"` | Forcer SSE uniquement |
    | `"websocket"` | Forcer WebSocket uniquement |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API temps réel avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active le préchauffage WebSocket par défaut pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

    ```json5
    // Disable warm-up
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

  <Accordion title="Mode rapide">
    OpenClaw expose un basculement partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw mappe le mode rapide vers le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs existantes de `service_tier` sont préservées, et le mode rapide ne réécrit ni `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements de session sont prioritaires sur la configuration. Effacer le remplacement de session dans l’interface Sessions ramène la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` n’est transmis qu’aux endpoints OpenAI natifs (`api.openai.com`) et aux endpoints Codex natifs (`chatgpt.com/backend-api`). Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse `service_tier` intact.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), le wrapper de flux Pi-harness du Plugin OpenAI active automatiquement la Compaction côté serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valeur par défaut de `compact_threshold` : 70 % de `contextWindow` (ou `80000` lorsqu’il est indisponible)

    Cela s’applique au chemin du harnais Pi intégré ainsi qu’aux hooks de fournisseur OpenAI utilisés par les exécutions embarquées. Le harnais natif du serveur d’application Codex gère son propre contexte via Codex et se configure séparément avec `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour des endpoints compatibles comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d’exécution embarqué plus strict :

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Avec `strict-agentic`, OpenClaw :
    - Ne traite plus un tour uniquement planificateur comme une progression réussie lorsqu’une action d’outil est disponible
    - Réessaie le tour avec une incitation à agir maintenant
    - Active automatiquement `update_plan` pour un travail conséquent
    - Affiche un état explicitement bloqué si le modèle continue à planifier sans agir

    <Note>
    Limité aux exécutions OpenAI et Codex de la famille GPT-5 uniquement. Les autres fournisseurs et familles de modèles plus anciennes conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs compatibles OpenAI">
    OpenClaw traite différemment les endpoints directs OpenAI, Codex et Azure OpenAI par rapport aux proxys génériques compatibles OpenAI `/v1` :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Ne conservent `reasoning: { effort: "none" }` que pour les modèles qui prennent en charge l’effort OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - Font passer les schémas d’outils en mode strict par défaut
    - Joignent des en-têtes d’attribution cachés uniquement sur des hôtes natifs vérifiés
    - Conservent la mise en forme de requête réservée à OpenAI (`service_tier`, `store`, compatibilité reasoning, indices de cache de prompt)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Ne forcent pas les schémas d’outils stricts ni les en-têtes réservés au natif

    Azure OpenAI utilise un transport natif et un comportement compatible, mais ne reçoit pas les en-têtes d’attribution cachés.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
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
