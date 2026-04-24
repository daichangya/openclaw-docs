---
read_when:
    - Vous voulez la génération média Vydra dans OpenClaw
    - Vous avez besoin d’un guide de configuration de clé API Vydra
summary: Utiliser l’image, la vidéo et la parole Vydra dans OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T07:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Le plugin Vydra intégré ajoute :

- La génération d’images via `vydra/grok-imagine`
- La génération de vidéos via `vydra/veo3` et `vydra/kling`
- La synthèse vocale via la route TTS Vydra adossée à ElevenLabs

OpenClaw utilise la même `VYDRA_API_KEY` pour les trois capacités.

<Warning>
Utilisez `https://www.vydra.ai/api/v1` comme URL de base.

L’hôte apex de Vydra (`https://vydra.ai/api/v1`) redirige actuellement vers `www`. Certains clients HTTP abandonnent `Authorization` lors de cette redirection inter-hôte, ce qui transforme une clé API valide en un échec d’authentification trompeur. Le plugin intégré utilise directement l’URL de base `www` pour éviter cela.
</Warning>

## Configuration

<Steps>
  <Step title="Lancer l’intégration interactive">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou définissez directement la variable d’environnement :

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choisir une capacité par défaut">
    Choisissez une ou plusieurs des capacités ci-dessous (image, vidéo ou parole) et appliquez la configuration correspondante.
  </Step>
</Steps>

## Capacités

<AccordionGroup>
  <Accordion title="Génération d’images">
    Modèle d’image par défaut :

    - `vydra/grok-imagine`

    Définissez-le comme fournisseur d’image par défaut :

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    La prise en charge intégrée actuelle se limite au texte-vers-image. Les routes d’édition hébergées de Vydra attendent des URL d’image distantes, et OpenClaw n’ajoute pas encore de pont de téléversement spécifique à Vydra dans le plugin intégré.

    <Note>
    Voir [Génération d’images](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de repli.
    </Note>

  </Accordion>

  <Accordion title="Génération de vidéos">
    Modèles vidéo enregistrés :

    - `vydra/veo3` pour le texte-vers-vidéo
    - `vydra/kling` pour l’image-vers-vidéo

    Définissez Vydra comme fournisseur vidéo par défaut :

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Remarques :

    - `vydra/veo3` est intégré uniquement en texte-vers-vidéo.
    - `vydra/kling` exige actuellement une référence d’URL d’image distante. Les téléversements de fichiers locaux sont rejetés d’emblée.
    - La route HTTP `kling` actuelle de Vydra a été incohérente quant à l’exigence de `image_url` ou `video_url` ; le fournisseur intégré mappe la même URL d’image distante sur les deux champs.
    - Le plugin intégré reste conservateur et ne transmet pas de paramètres de style non documentés tels que le ratio d’aspect, la résolution, le watermark ou l’audio généré.

    <Note>
    Voir [Génération de vidéos](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de fournisseur et le comportement de repli.
    </Note>

  </Accordion>

  <Accordion title="Tests live vidéo">
    Couverture live spécifique au fournisseur :

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Le fichier live Vydra intégré couvre maintenant :

    - `vydra/veo3` texte-vers-vidéo
    - `vydra/kling` image-vers-vidéo à l’aide d’une URL d’image distante

    Redéfinissez la fixture d’image distante si nécessaire :

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Synthèse vocale">
    Définissez Vydra comme fournisseur de parole :

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Valeurs par défaut :

    - Modèle : `elevenlabs/tts`
    - ID de voix : `21m00Tcm4TlvDq8ikWAM`

    Le plugin intégré expose actuellement une voix par défaut connue comme fiable et renvoie des fichiers audio MP3.

  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Annuaire des fournisseurs" href="/fr/providers/index" icon="list">
    Parcourir tous les fournisseurs disponibles.
  </Card>
  <Card title="Génération d’images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
</CardGroup>
