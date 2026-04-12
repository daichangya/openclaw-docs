---
read_when:
    - Vuoi usare la generazione di immagini con fal in OpenClaw
    - Hai bisogno del flusso di autenticazione `FAL_KEY`
    - Vuoi i valori predefiniti di fal per `image_generate` o `video_generate`
summary: Configurazione della generazione di immagini e video con fal in OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw include un provider integrato `fal` per la generazione ospitata di immagini e video.

| Proprietà | Valore                                                        |
| --------- | ------------------------------------------------------------- |
| Provider  | `fal`                                                         |
| Auth      | `FAL_KEY` (canonico; anche `FAL_API_KEY` funziona come fallback) |
| API       | endpoint dei modelli fal                                      |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Imposta un modello immagine predefinito">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Generazione di immagini

Il provider integrato di generazione immagini `fal` usa come predefinito
`fal/fal-ai/flux/dev`.

| Capacità       | Valore                     |
| -------------- | -------------------------- |
| Numero massimo di immagini | 4 per richiesta     |
| Modalità modifica | Abilitata, 1 immagine di riferimento |
| Override delle dimensioni | Supportati         |
| Aspect ratio   | Supportato                 |
| Risoluzione    | Supportata                 |

<Warning>
L'endpoint fal di modifica delle immagini **non** supporta override di `aspectRatio`.
</Warning>

Per usare fal come provider immagine predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generazione video

Il provider integrato di generazione video `fal` usa come predefinito
`fal/fal-ai/minimax/video-01-live`.

| Capacità | Valore                                                       |
| -------- | ------------------------------------------------------------ |
| Modalità | Da testo a video, immagine singola di riferimento            |
| Runtime  | Flusso submit/status/result supportato da coda per job di lunga durata |

<AccordionGroup>
  <Accordion title="Modelli video disponibili">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Esempio di configurazione Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Esempio di configurazione HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Usa `openclaw models list --provider fal` per vedere l'elenco completo dei modelli fal
disponibili, comprese eventuali voci aggiunte di recente.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference#agent-defaults" icon="gear">
    Valori predefiniti dell'agente, inclusa la selezione del modello immagine e video.
  </Card>
</CardGroup>
