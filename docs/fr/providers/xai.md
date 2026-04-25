---
read_when:
    - Vous souhaitez utiliser les modèles Grok dans OpenClaw
    - Vous configurez l’authentification xAI ou les identifiants de modèle
summary: Utiliser les modèles xAI Grok dans OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:21:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw inclut un Plugin fournisseur `xai` intégré pour les modèles Grok.

## Bien démarrer

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
OpenClaw utilise l’API xAI Responses comme transport xAI intégré. La même
`XAI_API_KEY` peut aussi alimenter `web_search` avec Grok, `x_search` de première classe,
et `code_execution` distant.
Si vous stockez une clé xAI sous `plugins.entries.xai.config.webSearch.apiKey`,
le fournisseur de modèles xAI intégré réutilise aussi cette clé comme solution de secours.
Le réglage de `code_execution` se trouve sous `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogue intégré

OpenClaw inclut ces familles de modèles xAI prêtes à l’emploi :

| Famille        | Identifiants de modèle                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4         | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code      | `grok-code-fast-1`                                                        |

Le Plugin résout aussi par anticipation les nouveaux identifiants `grok-4*` et `grok-code-fast*` lorsqu’ils
suivent la même forme d’API.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, et les variantes `grok-4.20-beta-*` sont les
références Grok actuelles compatibles avec les images dans le catalogue intégré.
</Tip>

## Couverture des fonctionnalités OpenClaw

Le Plugin intégré mappe la surface actuelle de l’API publique xAI vers les contrats partagés
de fournisseur et d’outil d’OpenClaw. Les capacités qui ne correspondent pas au contrat partagé
(par exemple le TTS en streaming et la voix en temps réel) ne sont pas exposées — consultez le tableau
ci-dessous.

| Capacité xAI               | Surface OpenClaw                         | Statut                                                              |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | Fournisseur de modèles `xai/<model>`     | Oui                                                                 |
| Recherche web côté serveur | Fournisseur `web_search` `grok`          | Oui                                                                 |
| Recherche X côté serveur   | Outil `x_search`                         | Oui                                                                 |
| Exécution de code côté serveur | Outil `code_execution`                | Oui                                                                 |
| Images                     | `image_generate`                         | Oui                                                                 |
| Vidéos                     | `video_generate`                         | Oui                                                                 |
| Text-to-speech par lot     | `messages.tts.provider: "xai"` / `tts`   | Oui                                                                 |
| TTS en streaming           | —                                        | Non exposé ; le contrat TTS d’OpenClaw renvoie des buffers audio complets |
| Speech-to-text par lot     | `tools.media.audio` / compréhension média | Oui                                                                |
| Speech-to-text en streaming | Voice Call `streaming.provider: "xai"`  | Oui                                                                 |
| Voix en temps réel         | —                                        | Pas encore exposé ; contrat de session/WebSocket différent          |
| Fichiers / lots            | Compatibilité API de modèle générique uniquement | Pas un outil OpenClaw de première classe                     |

<Note>
OpenClaw utilise les API REST d’images/vidéos/TTS/STT de xAI pour la génération média,
la voix, et la transcription par lot, le WebSocket STT en streaming de xAI pour la
transcription live des appels vocaux, et l’API Responses pour les modèles, la recherche, et
les outils d’exécution de code. Les fonctionnalités qui nécessitent des contrats OpenClaw différents, comme
les sessions vocales en temps réel, sont documentées ici comme capacités amont plutôt que comme
comportement caché du Plugin.
</Note>

### Mappages du mode rapide

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
réécrit les requêtes xAI natives comme suit :

| Modèle source | Cible du mode rapide |
| ------------- | -------------------- |
| `grok-3`      | `grok-3-fast`        |
| `grok-3-mini` | `grok-3-mini-fast`   |
| `grok-4`      | `grok-4-fast`        |
| `grok-4-0709` | `grok-4-fast`        |

### Alias de compatibilité hérités

Les alias hérités continuent d’être normalisés vers les identifiants intégrés canoniques :

| Alias hérité              | Identifiant canonique                  |
| ------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning`  |

## Fonctionnalités

<AccordionGroup>
  <Accordion title="Recherche web">
    Le fournisseur de recherche web `grok` intégré utilise aussi `XAI_API_KEY` :

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Génération de vidéo">
    Le Plugin `xai` intégré enregistre la génération de vidéo via l’outil partagé
    `video_generate`.

    - Modèle vidéo par défaut : `xai/grok-imagine-video`
    - Modes : texte-vers-vidéo, image-vers-vidéo, génération à partir d’image de référence, édition vidéo
      distante, et extension vidéo distante
    - Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Résolutions : `480P`, `720P`
    - Durée : 1 à 15 secondes pour la génération/image-vers-vidéo, 1 à 10 secondes lors de l’utilisation
      des rôles `reference_image`, 2 à 10 secondes pour l’extension
    - Génération à partir d’image de référence : définissez `imageRoles` sur `reference_image` pour
      chaque image fournie ; xAI accepte jusqu’à 7 images de ce type

    <Warning>
    Les buffers vidéo locaux ne sont pas acceptés. Utilisez des URL distantes `http(s)` pour les
    entrées d’édition/extension vidéo. Image-vers-vidéo accepte des buffers d’images locaux parce qu’OpenClaw
    peut les encoder en URL de données pour xAI.
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
    Consultez [Génération de vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil,
    la sélection du fournisseur, et le comportement de basculement.
    </Note>

  </Accordion>

  <Accordion title="Génération d’image">
    Le Plugin `xai` intégré enregistre la génération d’image via l’outil partagé
    `image_generate`.

    - Modèle d’image par défaut : `xai/grok-imagine-image`
    - Modèle supplémentaire : `xai/grok-imagine-image-pro`
    - Modes : texte-vers-image et édition à partir d’image de référence
    - Entrées de référence : une `image` ou jusqu’à cinq `images`
    - Ratios d’aspect : `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Résolutions : `1K`, `2K`
    - Quantité : jusqu’à 4 images

    OpenClaw demande à xAI des réponses d’image `b64_json` afin que les médias générés puissent être
    stockés et livrés via le chemin normal des pièces jointes de canal. Les images de référence locales
    sont converties en URL de données ; les références distantes `http(s)` sont
    transmises telles quelles.

    Pour utiliser xAI comme fournisseur d’images par défaut :

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
    xAI documente aussi `quality`, `mask`, `user`, et des ratios natifs supplémentaires
    comme `1:2`, `2:1`, `9:20`, et `20:9`. OpenClaw ne transmet aujourd’hui que les
    contrôles d’image partagés inter-fournisseurs ; les réglages natifs uniquement non pris en charge
    ne sont intentionnellement pas exposés via `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    Le Plugin `xai` intégré enregistre le text-to-speech via la surface partagée du fournisseur `tts`.

    - Voix : `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - Voix par défaut : `eve`
    - Formats : `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - Langue : code BCP-47 ou `auto`
    - Vitesse : surcharge de vitesse native au fournisseur
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
    OpenClaw utilise le endpoint batch `/v1/tts` de xAI. xAI propose aussi un TTS en streaming
    via WebSocket, mais le contrat actuel du fournisseur de voix d’OpenClaw attend
    un buffer audio complet avant la livraison de la réponse.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Le Plugin `xai` intégré enregistre le speech-to-text par lot via la
    surface de transcription de compréhension média d’OpenClaw.

    - Modèle par défaut : `grok-stt`
    - Endpoint : REST xAI `/v1/stt`
    - Chemin d’entrée : téléversement multipart de fichier audio
    - Pris en charge par OpenClaw partout où la transcription de l’audio entrant utilise
      `tools.media.audio`, y compris les segments de canaux vocaux Discord et
      les pièces jointes audio de canaux

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

    La langue peut être fournie via la configuration média audio partagée ou par requête
    de transcription individuelle. Les indications de prompt sont acceptées par la surface OpenClaw
    partagée, mais l’intégration STT REST xAI ne transmet que le fichier, le modèle, et
    la langue parce que ce sont les éléments qui se mappent proprement au endpoint public xAI actuel.

  </Accordion>

  <Accordion title="Speech-to-text en streaming">
    Le Plugin `xai` intégré enregistre également un fournisseur de transcription en temps réel
    pour l’audio live des appels vocaux.

    - Endpoint : WebSocket xAI `wss://api.x.ai/v1/stt`
    - Encodage par défaut : `mulaw`
    - Taux d’échantillonnage par défaut : `8000`
    - Endpointing par défaut : `800ms`
    - Transcriptions intermédiaires : activées par défaut

    Le flux média Twilio de Voice Call envoie des trames audio G.711 µ-law, donc le
    fournisseur xAI peut transmettre directement ces trames sans transcodage :

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
    Ce fournisseur de streaming concerne le chemin de transcription en temps réel de Voice Call.
    La voix Discord enregistre actuellement de courts segments et utilise à la place
    le chemin de transcription batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Configuration de x_search">
    Le Plugin xAI intégré expose `x_search` comme un outil OpenClaw pour rechercher
    du contenu X (anciennement Twitter) via Grok.

    Chemin de configuration : `plugins.entries.xai.config.xSearch`

    | Clé                | Type    | Par défaut         | Description                              |
    | ------------------ | ------- | ------------------ | ---------------------------------------- |
    | `enabled`          | boolean | —                  | Activer ou désactiver x_search           |
    | `model`            | string  | `grok-4-1-fast`    | Modèle utilisé pour les requêtes x_search |
    | `inlineCitations`  | boolean | —                  | Inclure des citations en ligne dans les résultats |
    | `maxTurns`         | number  | —                  | Nombre maximal de tours de conversation  |
    | `timeoutSeconds`   | number  | —                  | Délai d’expiration de la requête en secondes |
    | `cacheTtlMinutes`  | number  | —                  | Durée de vie du cache en minutes         |

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

  <Accordion title="Configuration de code execution">
    Le Plugin xAI intégré expose `code_execution` comme un outil OpenClaw pour
    l’exécution de code à distance dans l’environnement sandbox de xAI.

    Chemin de configuration : `plugins.entries.xai.config.codeExecution`

    | Clé               | Type    | Par défaut                | Description                                   |
    | ----------------- | ------- | ------------------------- | --------------------------------------------- |
    | `enabled`         | boolean | `true` (si une clé est disponible) | Activer ou désactiver l’exécution de code |
    | `model`           | string  | `grok-4-1-fast`           | Modèle utilisé pour les requêtes d’exécution de code |
    | `maxTurns`        | number  | —                         | Nombre maximal de tours de conversation       |
    | `timeoutSeconds`  | number  | —                         | Délai d’expiration de la requête en secondes  |

    <Note>
    Il s’agit d’une exécution dans la sandbox xAI distante, et non de [`exec`](/fr/tools/exec) local.
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
    - L’authentification se fait uniquement par clé API aujourd’hui. Il n’existe pas encore de flux OAuth ni device-code xAI dans
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` n’est pas pris en charge sur le
      chemin normal du fournisseur xAI parce qu’il nécessite une surface API amont
      différente du transport xAI OpenClaw standard.
    - La voix Realtime xAI n’est pas encore enregistrée comme fournisseur OpenClaw. Elle
      nécessite un contrat de session vocale bidirectionnelle différent du STT batch ou
      de la transcription en streaming.
    - Les paramètres xAI image `quality`, image `mask`, et les ratios supplémentaires natifs uniquement
      ne sont pas exposés tant que l’outil partagé `image_generate` n’a pas les contrôles
      inter-fournisseurs correspondants.
  </Accordion>

  <Accordion title="Notes avancées">
    - OpenClaw applique automatiquement des correctifs de compatibilité spécifiques à xAI
      pour le schéma d’outils et les appels d’outils sur le chemin du runner partagé.
    - Les requêtes xAI natives utilisent par défaut `tool_stream: true`. Définissez
      `agents.defaults.models["xai/<model>"].params.tool_stream` sur `false` pour
      le désactiver.
    - Le wrapper xAI intégré supprime les drapeaux stricts de schéma d’outils non pris en charge et
      les clés de payload reasoning avant d’envoyer les requêtes xAI natives.
    - `web_search`, `x_search`, et `code_execution` sont exposés comme outils OpenClaw.
      OpenClaw active le built-in xAI spécifique dont il a besoin dans chaque requête d’outil
      au lieu d’attacher tous les outils natifs à chaque tour de chat.
    - `x_search` et `code_execution` appartiennent au Plugin xAI intégré plutôt que d’être
      codés en dur dans le runtime de modèle core.
    - `code_execution` est une exécution distante dans la sandbox xAI, et non un
      [`exec`](/fr/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Tests en direct

Les chemins média xAI sont couverts par des tests unitaires et des suites live sur option. Les commandes live
chargent les secrets depuis votre shell de connexion, y compris `~/.profile`, avant
de vérifier `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Le fichier live spécifique au fournisseur synthétise un TTS normal, un
TTS PCM adapté à la téléphonie, transcrit l’audio via le STT batch xAI, diffuse le même PCM via le STT
temps réel xAI, génère une sortie texte-vers-image, et modifie une image de référence. Le
fichier live d’image partagé vérifie le même fournisseur xAI via la
sélection du runtime OpenClaw, le basculement, la normalisation, et le chemin de pièce jointe média.

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles, et le comportement de basculement.
  </Card>
  <Card title="Génération de vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Tous les fournisseurs" href="/fr/providers/index" icon="grid-2">
    Vue d’ensemble plus large des fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et correctifs.
  </Card>
</CardGroup>
