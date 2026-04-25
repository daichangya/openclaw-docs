---
read_when:
    - Vous souhaitez utiliser des modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex au lieu de clés API
    - Vous avez besoin d’un comportement d’exécution d’agent GPT-5 plus strict
summary: Utiliser OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fournit des API développeur pour les modèles GPT. OpenClaw prend en charge trois routes de la famille OpenAI. Le préfixe du modèle sélectionne la route :

- **Clé API** — accès direct à la plateforme OpenAI avec facturation à l'usage (`openai/*` models)
- **Abonnement Codex via PI** — connexion ChatGPT/Codex avec accès par abonnement (`openai-codex/*` models)
- **Harnais app-server Codex** — exécution native de l'app-server Codex (`openai/*` models plus `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI prend explicitement en charge l'utilisation d'OAuth par abonnement dans des outils et workflows externes comme OpenClaw.

Le fournisseur, le modèle, le runtime et le canal sont des couches distinctes. Si ces libellés
commencent à se mélanger, lisez [Runtimes d'agent](/fr/concepts/agent-runtimes) avant de
modifier la configuration.

## Choix rapide

| Objectif                                      | Utiliser                                                | Notes                                                                          |
| --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Facturation directe par clé API               | `openai/gpt-5.5`                                        | Définissez `OPENAI_API_KEY` ou exécutez l'onboarding par clé API OpenAI.       |
| GPT-5.5 avec auth par abonnement ChatGPT/Codex | `openai-codex/gpt-5.5`                                  | Route PI par défaut pour Codex OAuth. Meilleur premier choix pour les configs par abonnement. |
| GPT-5.5 avec comportement natif app-server Codex | `openai/gpt-5.5` plus `embeddedHarness.runtime: "codex"` | Force le harnais app-server Codex pour cette référence de modèle.              |
| Génération ou édition d'images                | `openai/gpt-image-2`                                    | Fonctionne avec `OPENAI_API_KEY` ou OpenAI Codex OAuth.                        |

<Note>
GPT-5.5 est disponible à la fois via l'accès direct par clé API à la plateforme OpenAI et
via les routes abonnement/OAuth. Utilisez `openai/gpt-5.5` pour le trafic direct `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` pour Codex OAuth via PI, ou
`openai/gpt-5.5` avec `embeddedHarness.runtime: "codex"` pour le harnais natif
app-server Codex.
</Note>

<Note>
Activer le plugin OpenAI, ou sélectionner un modèle `openai-codex/*`, n'active pas
le plugin app-server Codex fourni. OpenClaw active ce plugin uniquement
lorsque vous sélectionnez explicitement le harnais Codex natif avec
`embeddedHarness.runtime: "codex"` ou utilisez une ancienne référence de modèle `codex/*`.
</Note>

## Couverture des fonctionnalités OpenClaw

| Capacité OpenAI           | Surface OpenClaw                                           | Statut                                                  |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses          | fournisseur de modèle `openai/<model>`                     | Oui                                                     |
| Modèles d'abonnement Codex | `openai-codex/<model>` avec OAuth `openai-codex`          | Oui                                                     |
| Harnais app-server Codex  | `openai/<model>` avec `embeddedHarness.runtime: codex`     | Oui                                                     |
| Recherche web côté serveur | Outil natif OpenAI Responses                              | Oui, lorsque la recherche web est activée et qu'aucun fournisseur n'est épinglé |
| Images                    | `image_generate`                                           | Oui                                                     |
| Vidéos                    | `video_generate`                                           | Oui                                                     |
| Synthèse vocale           | `messages.tts.provider: "openai"` / `tts`                  | Oui                                                     |
| Speech-to-text par lot    | `tools.media.audio` / compréhension média                  | Oui                                                     |
| Speech-to-text en streaming | Voice Call `streaming.provider: "openai"`                | Oui                                                     |
| Voix temps réel           | Voice Call `realtime.provider: "openai"` / Talk de Control UI | Oui                                                  |
| Embeddings                | fournisseur d'embeddings mémoire                           | Oui                                                     |

## Prise en main

Choisissez votre méthode d'authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clé API (plateforme OpenAI)">
    **Idéal pour :** accès direct à l'API et facturation à l'usage.

    <Steps>
      <Step title="Obtenez votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord de la plateforme OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécutez l'onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifiez que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé de la route

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API directe de la plateforme OpenAI | `OPENAI_API_KEY` |

    <Note>
    `openai/*` est la route directe par clé API OpenAI sauf si vous forcez explicitement
    le harnais app-server Codex. Utilisez `openai-codex/*` pour Codex OAuth via
    l'exécuteur PI par défaut, ou utilisez `openai/gpt-5.5` avec
    `embeddedHarness.runtime: "codex"` pour l'exécution native app-server Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw n'expose **pas** `openai/gpt-5.3-codex-spark`. Les requêtes API OpenAI en direct rejettent ce modèle, et le catalogue Codex actuel ne l'expose pas non plus.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex au lieu d'une clé API distincte. Codex cloud nécessite une connexion ChatGPT.

    <Steps>
      <Step title="Exécutez Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Ou exécutez OAuth directement :

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Pour les configurations headless ou hostiles au callback, ajoutez `--device-code` pour vous connecter avec un flux device-code ChatGPT au lieu du callback navigateur localhost :

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Définissez le modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Vérifiez que le modèle est disponible">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Résumé de la route

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth via PI | Connexion Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harnais app-server Codex | Auth app-server Codex |

    <Note>
    Continuez à utiliser l'id de fournisseur `openai-codex` pour les commandes d'authentification/profil. Le
    préfixe de modèle `openai-codex/*` est aussi la route PI explicite pour Codex OAuth.
    Il ne sélectionne ni n'active automatiquement le harnais app-server Codex fourni.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L'onboarding n'importe plus les éléments OAuth depuis `~/.codex`. Connectez-vous avec OAuth via navigateur (par défaut) ou avec le flux device-code ci-dessus — OpenClaw gère les identifiants obtenus dans son propre magasin d'authentification d'agent.
    </Note>

    ### Indicateur d'état

    Le `/status` du chat affiche quel runtime de modèle est actif pour la session en cours.
    Le harnais PI par défaut apparaît sous la forme `Runtime: OpenClaw Pi Default`. Lorsque le
    harnais app-server Codex fourni est sélectionné, `/status` affiche
    `Runtime: OpenAI Codex`. Les sessions existantes conservent leur id de harnais enregistré, utilisez donc
    `/new` ou `/reset` après avoir modifié `embeddedHarness` si vous voulez que `/status`
    reflète un nouveau choix PI/Codex.

    ### Limite de fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte du runtime comme des valeurs distinctes.

    Pour `openai-codex/gpt-5.5` via Codex OAuth :

    - `contextWindow` natif : `1000000`
    - Limite `contextTokens` du runtime par défaut : `272000`

    Cette limite par défaut plus petite offre en pratique de meilleures caractéristiques de latence et de qualité. Remplacez-la avec `contextTokens` :

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
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens` pour limiter le budget de contexte du runtime.
    </Note>

    ### Récupération du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex amont pour `gpt-5.5` lorsqu'elles sont
    présentes. Si la découverte Codex en direct omet la ligne `openai-codex/gpt-5.5` alors
    que le compte est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que
    les exécutions Cron, sous-agent et celles configurées avec le modèle par défaut n'échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Génération d'images

Le plugin `openai` fourni enregistre la génération d'images via l'outil `image_generate`.
Il prend en charge à la fois la génération d'images OpenAI par clé API et la génération d'images
via Codex OAuth à travers la même référence de modèle `openai/gpt-image-2`.

| Capacité                | Clé API OpenAI                     | Codex OAuth                          |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| Référence de modèle     | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification        | `OPENAI_API_KEY`                   | Connexion OpenAI Codex OAuth         |
| Transport               | API Images OpenAI                  | Backend Codex Responses              |
| Nombre max d'images par requête | 4                           | 4                                    |
| Mode édition            | Activé (jusqu'à 5 images de référence) | Activé (jusqu'à 5 images de référence) |
| Surcharges de taille    | Prises en charge, y compris les tailles 2K/4K | Prises en charge, y compris les tailles 2K/4K |
| Ratio d'aspect / résolution | Non transmis à l'API Images OpenAI | Mappé vers une taille prise en charge lorsque c'est sûr |

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
Consultez [Génération d'images](/fr/tools/image-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut à la fois pour la génération texte-vers-image OpenAI et pour l'édition d'images. `gpt-image-1` reste utilisable comme surcharge de modèle explicite, mais les nouveaux workflows d'image OpenAI doivent utiliser `openai/gpt-image-2`.

Pour les installations Codex OAuth, conservez la même référence `openai/gpt-image-2`. Lorsqu'un profil OAuth `openai-codex` est configuré, OpenClaw résout ce jeton d'accès OAuth stocké et envoie les requêtes d'image via le backend Codex Responses. Il n'essaie pas d'abord `OPENAI_API_KEY` et ne bascule pas silencieusement vers une clé API pour cette requête. Configurez explicitement `models.providers.openai` avec une clé API, une URL de base personnalisée ou un endpoint Azure lorsque vous voulez utiliser à la place la route directe de l'API OpenAI Images.
Si cet endpoint d'image personnalisé se trouve sur un LAN/une adresse privée de confiance, définissez aussi `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw continue de bloquer les endpoints d'image OpenAI-compatibles privés/internes tant que cet opt-in n'est pas présent.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Une affiche de lancement soignée pour OpenClaw sur macOS" size=3840x2160 count=1
```

Modifier :

```
/tool image_generate model=openai/gpt-image-2 prompt="Préserver la forme de l'objet, changer le matériau en verre translucide" image=/path/to/reference.png size=1024x1536
```

## Génération de vidéos

Le plugin `openai` fourni enregistre la génération de vidéos via l'outil `video_generate`.

| Capacité       | Valeur                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| Modèle par défaut | `openai/sora-2`                                                                |
| Modes          | Texte vers vidéo, image vers vidéo, édition d'une seule vidéo                    |
| Entrées de référence | 1 image ou 1 vidéo                                                          |
| Surcharges de taille | Prises en charge                                                            |
| Autres surcharges | `aspectRatio`, `resolution`, `audio`, `watermark` sont ignorés avec un avertissement de l'outil |

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
Consultez [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d'outil partagés, la sélection du fournisseur et le comportement de basculement.
</Note>

## Contribution au prompt GPT-5

OpenClaw ajoute une contribution de prompt GPT-5 partagée pour les exécutions de la famille GPT-5 chez les différents fournisseurs. Elle s'applique par id de modèle, donc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` et d'autres références GPT-5 compatibles reçoivent la même surcouche. Les anciens modèles GPT-4.x ne la reçoivent pas.

Le harnais Codex natif fourni utilise le même comportement GPT-5 et la même surcouche Heartbeat via les instructions développeur de l'app-server Codex, de sorte que les sessions `openai/gpt-5.x` forcées via `embeddedHarness.runtime: "codex"` conservent le même suivi d'exécution et les mêmes indications proactives Heartbeat, même si Codex possède le reste du prompt du harnais.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance du persona, la sécurité d'exécution, la discipline des outils, la forme de sortie, les vérifications de complétion et la vérification. Le comportement de réponse spécifique au canal et le comportement des messages silencieux restent dans le prompt système OpenClaw partagé et la politique de livraison sortante. Les indications GPT-5 sont toujours activées pour les modèles correspondants. La couche de style d'interaction conviviale est distincte et configurable.

| Valeur                 | Effet                                            |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (par défaut) | Active la couche de style d'interaction conviviale |
| `"on"`                 | Alias de `"friendly"`                            |
| `"off"`                | Désactive uniquement la couche de style convivial |

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
Les valeurs ne sont pas sensibles à la casse à l'exécution, donc `"Off"` et `"off"` désactivent toutes deux la couche de style convivial.
</Tip>

<Note>
L'ancien `plugins.entries.openai.config.personality` est toujours lu comme repli de compatibilité lorsque le réglage partagé `agents.defaults.promptOverlays.gpt5.personality` n'est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le plugin `openai` fourni enregistre la synthèse vocale pour la surface `messages.tts`.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|-------------------------|------------|
    | Modèle | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voix | `messages.tts.providers.openai.voice` | `coral` |
    | Vitesse | `messages.tts.providers.openai.speed` | (non défini) |
    | Instructions | `messages.tts.providers.openai.instructions` | (non défini, `gpt-4o-mini-tts` uniquement) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` pour les notes vocales, `mp3` pour les fichiers |
    | Clé API | `messages.tts.providers.openai.apiKey` | Repli sur `OPENAI_API_KEY` |
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
    Définissez `OPENAI_TTS_BASE_URL` pour surcharger l'URL de base TTS sans affecter l'endpoint de l'API de chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le plugin `openai` fourni enregistre le speech-to-text par lot via
    la surface de transcription de compréhension média d'OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Endpoint : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d'entrée : upload de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salon vocal Discord et les pièces jointes
      audio des canaux

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

    Les indications de langue et de prompt sont transmises à OpenAI lorsqu'elles sont fournies par la
    configuration média audio partagée ou par une requête de transcription par appel.

  </Accordion>

  <Accordion title="Transcription temps réel">
    Le plugin `openai` fourni enregistre la transcription temps réel pour le plugin Voice Call.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|-------------------------|------------|
    | Modèle | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue | `...openai.language` | (non défini) |
    | Prompt | `...openai.prompt` | (non défini) |
    | Durée de silence | `...openai.silenceDurationMs` | `800` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Clé API | `...openai.apiKey` | Repli sur `OPENAI_API_KEY` |

    <Note>
    Utilise une connexion WebSocket à `wss://api.openai.com/v1/realtime` avec l'audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ce fournisseur de streaming est destiné au chemin de transcription temps réel de Voice Call ; la voix Discord enregistre actuellement de courts segments et utilise à la place le chemin de transcription par lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix temps réel">
    Le plugin `openai` fourni enregistre la voix temps réel pour le plugin Voice Call.

    | Réglage | Chemin de configuration | Par défaut |
    |---------|-------------------------|------------|
    | Modèle | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voix | `...openai.voice` | `alloy` |
    | Température | `...openai.temperature` | `0.8` |
    | Seuil VAD | `...openai.vadThreshold` | `0.5` |
    | Durée de silence | `...openai.silenceDurationMs` | `500` |
    | Clé API | `...openai.apiKey` | Repli sur `OPENAI_API_KEY` |

    <Note>
    Prend en charge Azure OpenAI via les clés de configuration `azureEndpoint` et `azureDeployment`. Prend en charge l'appel d'outils bidirectionnel. Utilise le format audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

Le fournisseur `openai` fourni peut cibler une ressource Azure OpenAI pour la génération
d'images en surchargeant l'URL de base. Sur le chemin de génération d'images, OpenClaw
détecte les noms d'hôte Azure sur `models.providers.openai.baseUrl` et bascule vers
la forme de requête Azure automatiquement.

<Note>
La voix temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n'est pas affectée par `models.providers.openai.baseUrl`. Consultez l'accordéon **Voix
temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI lorsque :

- vous avez déjà un abonnement, un quota ou un contrat entreprise Azure OpenAI
- vous avez besoin de contrôles de résidence des données ou de conformité fournis par Azure
- vous voulez conserver le trafic dans un tenant Azure existant

### Configuration

Pour la génération d'images Azure via le fournisseur `openai` fourni, pointez
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé de plateforme OpenAI) :

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

OpenClaw reconnaît ces suffixes d'hôte Azure pour la route Azure de génération d'images :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d'images sur un hôte Azure reconnu, OpenClaw :

- envoie l'en-tête `api-key` au lieu de `Authorization: Bearer`
- utilise des chemins à portée de déploiement (`/openai/deployments/{deployment}/...`)
- ajoute `?api-version=...` à chaque requête

Les autres URL de base (OpenAI public, proxys compatibles OpenAI) conservent la
forme de requête d'image OpenAI standard.

<Note>
Le routage Azure pour le chemin de génération d'images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou version ultérieure. Les versions précédentes traitent toute
`openai.baseUrl` personnalisée comme l'endpoint public OpenAI et échoueront face aux déploiements
d'images Azure.
</Note>

### Version d'API

Définissez `AZURE_OPENAI_API_VERSION` pour épingler une version preview ou GA Azure spécifique
pour le chemin de génération d'images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n'est pas définie.

### Les noms de modèle sont des noms de déploiement

Azure OpenAI associe les modèles à des déploiements. Pour les requêtes de génération d'images Azure
routées via le fournisseur `openai` fourni, le champ `model` dans OpenClaw
doit être le **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
l'id public du modèle OpenAI.

Si vous créez un déploiement nommé `gpt-image-2-prod` qui sert `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Une affiche épurée" size=1024x1024 count=1
```

La même règle des noms de déploiement s'applique aux appels de génération d'images routés via
le fournisseur `openai` fourni.

### Disponibilité régionale

La génération d'images Azure est actuellement disponible uniquement dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Vérifiez la liste actuelle des régions Microsoft avant de créer un
déploiement, et confirmez que le modèle spécifique est proposé dans votre région.

### Différences de paramètres

Azure OpenAI et OpenAI public n'acceptent pas toujours les mêmes paramètres d'image.
Azure peut rejeter des options qu'OpenAI public autorise (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les exposer que sur certaines versions
de modèle. Ces différences proviennent d'Azure et du modèle sous-jacent, pas
d'OpenClaw. Si une requête Azure échoue avec une erreur de validation, vérifiez l'ensemble
de paramètres pris en charge par votre déploiement et votre version d'API spécifiques dans le
portail Azure.

<Note>
Azure OpenAI utilise le transport natif et le comportement compatible, mais ne reçoit
pas les en-têtes d'attribution cachés d'OpenClaw — voir l'accordéon **Routes natives vs compatibles OpenAI**
sous [Configuration avancée](#advanced-configuration).

Pour le trafic chat ou Responses sur Azure (au-delà de la génération d'images), utilisez le
flux d'onboarding ou une configuration de fournisseur Azure dédiée — `openai.baseUrl` seul
n'applique pas la forme API/auth Azure. Un fournisseur distinct
`azure-openai-responses/*` existe ; voir
l'accordéon Compaction côté serveur ci-dessous.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw utilise WebSocket en priorité avec repli SSE (`"auto"`) pour `openai/*` et `openai-codex/*`.

    En mode `"auto"`, OpenClaw :
    - retente un échec WebSocket précoce avant de basculer vers SSE
    - après un échec, marque WebSocket comme dégradé pendant ~60 secondes et utilise SSE pendant le refroidissement
    - attache des en-têtes stables d'identité de session et de tour pour les nouvelles tentatives et les reconnexions
    - normalise les compteurs d'usage (`input_tokens` / `prompt_tokens`) entre les variantes de transport

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (par défaut) | WebSocket d'abord, repli SSE |
    | `"sse"` | Forcer SSE uniquement |
    | `"websocket"` | Forcer WebSocket uniquement |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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

    Documentation OpenAI liée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses API en streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Préchauffage WebSocket">
    OpenClaw active par défaut le préchauffage WebSocket pour `openai/*` et `openai-codex/*` afin de réduire la latence du premier tour.

    ```json5
    // Désactiver le préchauffage
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un basculeur partagé de mode rapide pour `openai/*` et `openai-codex/*` :

    - **Chat/UI :** `/fast status|on|off`
    - **Config :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu'il est activé, OpenClaw mappe le mode rapide vers le traitement prioritaire OpenAI (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont préservées, et le mode rapide ne réécrit pas `reasoning` ni `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Les surcharges de session priment sur la configuration. Effacer la surcharge de session dans l'interface Sessions remet la session à la valeur par défaut configurée.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L'API d'OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le par modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` n'est transmis qu'aux endpoints OpenAI natifs (`api.openai.com`) et aux endpoints Codex natifs (`chatgpt.com/backend-api`). Si vous routez l'un ou l'autre fournisseur via un proxy, OpenClaw laisse `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles OpenAI Responses directs (`openai/*` sur `api.openai.com`), le wrapper de flux du harnais Pi du plugin OpenAI active automatiquement la Compaction côté serveur :

    - force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` par défaut : 70 % de `contextWindow` (ou `80000` lorsqu'il n'est pas disponible)

    Cela s'applique au chemin du harnais Pi intégré et aux hooks de fournisseur OpenAI utilisés par les exécutions embarquées. Le harnais app-server Codex natif gère son propre contexte via Codex et se configure séparément avec `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les endpoints compatibles comme Azure OpenAI Responses :

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` contrôle uniquement l'injection de `context_management`. Les modèles OpenAI Responses directs continuent de forcer `store: true` sauf si la compatibilité définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT agentique strict">
    Pour les exécutions de la famille GPT-5 sur `openai/*`, OpenClaw peut utiliser un contrat d'exécution embarqué plus strict :

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
    - ne traite plus un tour uniquement de planification comme une progression réussie lorsqu'une action d'outil est disponible
    - retente le tour avec une indication d'agir maintenant
    - active automatiquement `update_plan` pour les travaux substantiels
    - expose un état bloqué explicite si le modèle continue de planifier sans agir

    <Note>
    Limité aux exécutions de la famille GPT-5 d'OpenAI et Codex uniquement. Les autres fournisseurs et les anciennes familles de modèles conservent le comportement par défaut.
    </Note>

  </Accordion>

  <Accordion title="Routes natives vs compatibles OpenAI">
    OpenClaw traite différemment les endpoints OpenAI directs, Codex et Azure OpenAI par rapport aux proxys `/v1` génériques compatibles OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l'effort OpenAI `none`
    - omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent `reasoning.effort: "none"`
    - définissent par défaut les schémas d'outils en mode strict
    - attachent des en-têtes d'attribution cachés uniquement sur les hôtes natifs vérifiés
    - conservent la mise en forme de requête propre à OpenAI (`service_tier`, `store`, compatibilité du raisonnement, indications de cache de prompt)

    **Routes proxy/compatibles :**
    - utilisent un comportement de compatibilité plus souple
    - retirent `store` de Completions des payloads `openai-completions` non natifs
    - acceptent le JSON passthrough avancé `params.extra_body`/`params.extraBody` pour les proxys Completions compatibles OpenAI
    - ne forcent ni les schémas d'outils stricts ni les en-têtes natifs uniquement

    Azure OpenAI utilise le transport natif et le comportement compatible, mais ne reçoit pas les en-têtes d'attribution cachés.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Génération d'images" href="/fr/tools/image-generation" icon="image">
    Paramètres d'outil d'image partagés et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres d'outil vidéo partagés et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d'authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
