---
read_when:
    - Vous voulez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les ID de modèles
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T07:29:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw fournit un Plugin fournisseur `xai` intégré pour les modèles Grok.

## Prise en main

<Steps>
  <Step title="Créer une clé API">
    Créez une clé API dans la [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Définir votre clé API">
    Définissez `XAI_API_KEY`, ou exécutez :

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Choisir un modèle">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw utilise l’API Responses de xAI comme transport xAI intégré. La même
`XAI_API_KEY` peut aussi alimenter le `web_search` adossé à Grok, `x_search`
de première classe, et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèle xAI intégré réutilise aussi cette clé comme repli.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogue intégré

OpenClaw inclut ces familles de modèles xAI prêtes à l’emploi :

| Famille        | ID de modèles                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`              |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Le Plugin résout aussi en transfert les nouveaux ID `grok-4*` et `grok-code-fast*` lorsqu’ils
suivent la même forme d’API.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, et les variantes `grok-4.20-beta-*` sont les
références Grok actuellement compatibles image dans le catalogue intégré.
</Tip>

## Couverture fonctionnelle OpenClaw

Le Plugin intégré mappe la surface d’API publique actuelle de xAI vers les contrats partagés
de fournisseur et d’outils d’OpenClaw. Les capacités qui ne correspondent pas au contrat partagé
(par exemple le TTS en streaming et la voix temps réel) ne sont pas exposées — voir le tableau
ci-dessous.

| Capacité xAI               | Surface OpenClaw                          | Statut                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | fournisseur de modèle `xai/<model>`       | Oui                                                                 |
| Recherche Web côté serveur | fournisseur `web_search` `grok`           | Oui                                                                 |
| Recherche X côté serveur   | outil `x_search`                          | Oui                                                                 |
| Exécution de code côté serveur | outil `code_execution`                | Oui                                                                 |
| Images                     | `image_generate`                          | Oui                                                                 |
| Vidéos                     | `video_generate`                          | Oui                                                                 |
| Synthèse vocale en lot     | `messages.tts.provider: "xai"` / `tts`    | Oui                                                                 |
| TTS en streaming           | —                                         | Non exposé ; le contrat TTS d’OpenClaw renvoie des buffers audio complets |
| Conversion parole-texte en lot | `tools.media.audio` / compréhension des médias | Oui                                                          |
| Conversion parole-texte en streaming | Voice Call `streaming.provider: "xai"` | Oui                                                            |
| Voix temps réel            | —                                         | Pas encore exposé ; contrat de session/WebSocket différent          |
| Fichiers / lots            | Compatibilité générique d’API modèle      | Pas un outil OpenClaw de première classe                            |

<Note>
OpenClaw utilise les API REST image/vidéo/TTS/STT de xAI pour la génération média,
la parole et la transcription en lot, le WebSocket STT en streaming de xAI pour la
transcription live des appels vocaux, et l’API Responses pour les outils de modèle, recherche et
exécution de code. Les fonctionnalités qui exigent des contrats OpenClaw différents, comme les
sessions vocales Realtime, sont documentées ici comme capacités amont plutôt que comme
comportement caché du Plugin.
</Note>

### Mappages du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
réécrit les requêtes xAI natives comme suit :

| Modèle source | Cible en mode rapide |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`        |
| `grok-3-mini` | `grok-3-mini-fast`   |
| `grok-4`      | `grok-4-fast`        |
| `grok-4-0709` | `grok-4-fast`        |

### Alias de compatibilité hérités

Les alias hérités sont toujours normalisés vers les ID canoniques intégrés :

| Alias hérité              | ID canonique                           |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Recherche Web">
    Le fournisseur `grok` intégré de recherche Web utilise aussi `XAI_API_KEY` :

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération vidéo">
    Le Plugin `xai` intégré enregistre la génération vidéo via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte-vers-vidéo, image-vers-vidéo, modification vidéo distante, et extension
      vidéo distante
    - Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image-vers-vidéo, 2 à 10 secondes pour
      l’extension

    <Warning>
    Les buffers vidéo locaux ne sont pas acceptés. Utilisez des URL distantes `http(s)` pour
    les entrées de modification/extension vidéo. L’image-vers-vidéo accepte des buffers d’image locaux parce qu’OpenClaw peut les encoder en URL de données pour xAI.
    </Warning>

    Pour utiliser xAI comme fournisseur vidéo par défaut :

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil,
    la sélection du fournisseur et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’image">
    Le Plugin `xai` intégré enregistre la génération d’image via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-pro`
    - Modes : texte-vers-image et édition d’image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Quantité : jusqu’à 4 images

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et livrés via le chemin normal de pièces jointes des canaux. Les
    images de référence locales sont converties en URL de données ; les références distantes `http(s)` sont
    transmises telles quelles.

    Pour utiliser xAI comme fournisseur d’image par défaut :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI documente aussi `quality`, `mask`, `user`, et d’autres ratios natifs
    tels que `1:2`, `2:1`, `9:20`, et `20:9`. OpenClaw ne transmet aujourd’hui que les
    contrôles d’image partagés entre fournisseurs ; les réglages uniquement natifs non pris en charge
    ne sont volontairement pas exposés via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Synthèse vocale">
    Le Plugin `xai` intégré enregistre la synthèse vocale via la surface partagée de fournisseur
    `tts`.

    - Voix : `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voix par défaut : `eve`
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : remplacement natif de vitesse du fournisseur
    - Le format natif de note vocale Opus n’est pas pris en charge

    Pour utiliser xAI comme fournisseur TTS par défaut :

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw utilise le point de terminaison batch `/v1/tts` de xAI. xAI propose aussi le TTS en streaming
    via WebSocket, mais le contrat actuel du fournisseur de parole d’OpenClaw attend
    un buffer audio complet avant la livraison de la réponse.
    </Note>

  </Accordion>

  <Accordion title="Conversion parole-texte">
    Le Plugin `xai` intégré enregistre la conversion parole-texte en lot via la surface de
    transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Point de terminaison : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement de fichier audio multipart
    - Pris en charge par OpenClaw partout où la transcription audio entrante utilise
      `tools.media.audio`, y compris les segments de salon vocal Discord et
      les pièces jointes audio des canaux

    Pour forcer xAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    La langue peut être fournie via la configuration média audio partagée ou par requête de transcription.
    Les indications de prompt sont acceptées par la surface partagée d’OpenClaw,
    mais l’intégration REST STT de xAI ne transmet que file, model, et
    language car ce sont les seuls éléments qui correspondent proprement au point de terminaison public actuel de xAI.

  </Accordion>

  <Accordion title="Conversion parole-texte en streaming">
    Le Plugin `xai` intégré enregistre aussi un fournisseur de transcription temps réel
    pour l’audio live des appels vocaux.

    - Point de terminaison : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Fréquence d’échantillonnage par défaut : `8000`
    - Endpointing par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux média Twilio de Voice Call envoie des trames audio G.711 µ-law, donc le
    fournisseur xAI peut transférer directement ces trames sans transcodage :

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    La configuration détenue par le fournisseur se trouve sous
    `plugins.entries.voice-call.config.streaming.providers.xai`. Les
    clés prises en charge sont `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, ou
    `alaw`), `interimResults`, `endpointingMs`, et `language`.

    <Note>
    Ce fournisseur de streaming concerne le chemin de transcription temps réel de Voice Call.
    La voix Discord enregistre actuellement de courts segments et utilise à la place
    le chemin de transcription en lot `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuration de x_search">
    Le Plugin xAI intégré expose `x_search` comme outil OpenClaw pour rechercher
    du contenu sur X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Valeur par défaut  | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Activer ou désactiver x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes x_search |
    | `inlineCitations`  | boolean | —                  | Inclure des citations en ligne dans les résultats |
    | `maxTurns`         | number  | —                  | Nombre maximal de tours de conversation |
    | `timeoutSeconds`   | number  | —                  | Délai d’expiration de la requête en secondes |
    | `cacheTtlMinutes`  | number  | —                  | Durée de vie du cache en minutes     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuration de l’exécution de code">
    Le Plugin xAI intégré expose `code_execution` comme outil OpenClaw pour
    l’exécution de code distante dans l’environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Valeur par défaut          | Description                              |
    | ----------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (si une clé est disponible) | Activer ou désactiver l’exécution de code |
    | `model`           | string  | `grok-4-1-fast`            | Modèle utilisé pour les requêtes d’exécution de code |
    | `maxTurns`        | number  | —                          | Nombre maximal de tours de conversation  |
    | `timeoutSeconds`  | number  | —                          | Délai d’expiration de la requête en secondes |

    <Note>
    Il s’agit d’une exécution sandbox distante xAI, pas du [`exec`](/fr/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites connues">
    - L’authentification se fait uniquement par clé API aujourd’hui. Il n’existe pas encore de flux OAuth ou device-code xAI dans
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le
      chemin normal du fournisseur xAI car il exige une surface d’API amont
      différente du transport xAI standard d’OpenClaw.
    - La voix Realtime xAI n’est pas encore enregistrée comme fournisseur OpenClaw. Elle
      exige un contrat différent de session vocale bidirectionnelle par rapport au STT batch ou à la
      transcription en streaming.
    - `quality` pour l’image xAI, `mask` pour l’image, et les ratios supplémentaires uniquement natifs ne sont
      pas exposés tant que l’outil partagé `image_generate` n’a pas de contrôles
      correspondants inter-fournisseurs.
  </Accordion>

  <Accordion title="Remarques avancées">
    - OpenClaw applique automatiquement des correctifs de compatibilité spécifiques à xAI pour les schémas d’outils et les appels d’outils
      sur le chemin partagé de l’exécuteur.
    - Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
      le désactiver.
    - L’enrobage xAI intégré retire les indicateurs stricts de schéma d’outil non pris en charge et
      les clés de charge utile de raisonnement avant d’envoyer les requêtes xAI natives.
    - `web_search`, `x_search`, et `code_execution` sont exposés comme outils OpenClaw.
      OpenClaw active le built-in xAI spécifique dont il a besoin dans chaque requête d’outil
      au lieu d’attacher tous les outils natifs à chaque tour de chat.
    - `x_search` et `code_execution` appartiennent au Plugin xAI intégré plutôt que d’être
      codés en dur dans le runtime core du modèle.
    - `code_execution` est une exécution sandbox distante xAI, pas du
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests live

Les chemins média xAI sont couverts par des tests unitaires et des suites live sur adhésion explicite. Les commandes live chargent les secrets depuis votre shell de connexion, y compris `~/.profile`, avant de sonder `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier live spécifique au fournisseur synthétise du TTS normal, du
TTS PCM compatible téléphonie, transcrit l’audio via le STT batch xAI, diffuse le même PCM via le STT temps réel xAI, génère une sortie texte-vers-image, et modifie une image de référence. Le
fichier live d’image partagé vérifie le même fournisseur xAI via la
sélection d’exécution, le repli, la normalisation et le chemin de pièce jointe média d’OpenClaw.

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés d’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    La vue d’ensemble plus large des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
