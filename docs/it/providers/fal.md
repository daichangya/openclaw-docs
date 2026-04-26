---
read_when:
    - Vuoi usare la generazione di immagini fal in OpenClaw
    - Hai bisogno del flusso di autenticazione `FAL_KEY`
    - Vuoi i valori predefiniti di fal per image_generate o video_generate
summary: Configurazione della generazione di immagini e video fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw include un provider `fal` integrato per la generazione ospitata di immagini e video.

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

Il provider di generazione immagini `fal` integrato usa per impostazione predefinita
`fal/fal-ai/flux/dev`.

| Capacità       | Valore                     |
| -------------- | -------------------------- |
| Immagini max   | 4 per richiesta            |
| Modalità modifica | Abilitata, 1 immagine di riferimento |
| Override dimensioni | Supportati             |
| Rapporto d'aspetto | Supportato             |
| Risoluzione    | Supportata                 |
| Formato output | `png` o `jpeg`             |

<Warning>
L'endpoint fal per la modifica delle immagini **non** supporta gli override `aspectRatio`.
</Warning>

Usa `outputFormat: "png"` quando vuoi output PNG. fal non dichiara un
controllo esplicito dello sfondo trasparente in OpenClaw, quindi `background:
"transparent"` viene segnalato come override ignorato per i modelli fal.

Per usare fal come provider di immagini predefinito:

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

## Generazione di video

Il provider di generazione video `fal` integrato usa per impostazione predefinita
`fal/fal-ai/minimax/video-01-live`.

| Capacità | Valore                                                             |
| -------- | ------------------------------------------------------------------ |
| Modalità | Da testo a video, riferimento con immagine singola, Seedance reference-to-video |
| Runtime  | Flusso submit/status/result supportato da coda per job di lunga durata |

<AccordionGroup>
  <Accordion title="Modelli video disponibili">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Esempio di configurazione di Seedance 2.0">
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

  <Accordion title="Esempio di configurazione reference-to-video di Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    reference-to-video accetta fino a 9 immagini, 3 video e 3 riferimenti audio
    tramite i parametri condivisi `images`, `videos` e `audioRefs` di `video_generate`,
    con al massimo 12 file di riferimento totali.

  </Accordion>

  <Accordion title="Esempio di configurazione di HeyGen video-agent">
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
disponibili, incluse eventuali voci aggiunte di recente.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/config-agents#agent-defaults" icon="gear">
    Valori predefiniti dell'agente, inclusa la selezione del modello immagine e video.
  </Card>
</CardGroup>
