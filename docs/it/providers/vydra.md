---
read_when:
    - Vuoi la generazione di media Vydra in OpenClaw
    - Ti serve una guida per la configurazione della chiave API Vydra
summary: Usa immagini, video e speech Vydra in OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-12T23:33:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Il plugin Vydra integrato aggiunge:

- Generazione di immagini tramite `vydra/grok-imagine`
- Generazione video tramite `vydra/veo3` e `vydra/kling`
- Sintesi vocale tramite il percorso TTS di Vydra basato su ElevenLabs

OpenClaw usa la stessa `VYDRA_API_KEY` per tutte e tre le capacità.

<Warning>
Usa `https://www.vydra.ai/api/v1` come URL di base.

L’host apex di Vydra (`https://vydra.ai/api/v1`) al momento reindirizza a `www`. Alcuni client HTTP eliminano `Authorization` durante quel reindirizzamento cross-host, trasformando una chiave API valida in un fuorviante errore di autenticazione. Il plugin integrato usa direttamente l’URL di base `www` per evitare questo problema.
</Warning>

## Configurazione

<Steps>
  <Step title="Esegui l’onboarding interattivo">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oppure imposta direttamente la variabile d’ambiente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Scegli una capacità predefinita">
    Scegli una o più delle capacità qui sotto (immagine, video o speech) e applica la configurazione corrispondente.
  </Step>
</Steps>

## Capacità

<AccordionGroup>
  <Accordion title="Generazione di immagini">
    Modello immagine predefinito:

    - `vydra/grok-imagine`

    Impostalo come provider di immagini predefinito:

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

    Il supporto integrato attuale è solo text-to-image. I percorsi di modifica ospitati da Vydra si aspettano URL immagine remoti e OpenClaw non aggiunge ancora nel plugin integrato un bridge di upload specifico per Vydra.

    <Note>
    Consulta [Image Generation](/it/tools/image-generation) per i parametri condivisi degli strumenti, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Generazione video">
    Modelli video registrati:

    - `vydra/veo3` per text-to-video
    - `vydra/kling` per image-to-video

    Imposta Vydra come provider video predefinito:

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

    Note:

    - `vydra/veo3` è integrato solo come text-to-video.
    - `vydra/kling` al momento richiede un riferimento a un URL immagine remoto. I caricamenti di file locali vengono rifiutati in anticipo.
    - L’attuale percorso HTTP `kling` di Vydra è stato incoerente sul fatto che richieda `image_url` o `video_url`; il provider integrato mappa lo stesso URL immagine remoto in entrambi i campi.
    - Il plugin integrato resta prudente e non inoltra controlli di stile non documentati come aspect ratio, resolution, watermark o audio generato.

    <Note>
    Consulta [Video Generation](/it/tools/video-generation) per i parametri condivisi degli strumenti, la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Test live video">
    Copertura live specifica del provider:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Il file live Vydra integrato ora copre:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video usando un URL immagine remoto

    Sostituisci il fixture dell’immagine remota quando necessario:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sintesi vocale">
    Imposta Vydra come provider speech:

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

    Valori predefiniti:

    - Modello: `elevenlabs/tts`
    - ID voce: `21m00Tcm4TlvDq8ikWAM`

    Il plugin integrato al momento espone una sola voce predefinita nota per funzionare e restituisce file audio MP3.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Directory dei provider" href="/it/providers/index" icon="list">
    Sfoglia tutti i provider disponibili.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference#agent-defaults" icon="gear">
    Valori predefiniti degli agenti e configurazione del modello.
  </Card>
</CardGroup>
