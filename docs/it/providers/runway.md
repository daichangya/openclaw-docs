---
read_when:
    - Vuoi usare la generazione video Runway in OpenClaw
    - Hai bisogno della configurazione della chiave API/env per Runway
    - Vuoi impostare Runway come provider video predefinito
summary: Configurazione della generazione video Runway in OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-12T23:32:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw include un provider `runway` per la generazione video ospitata.

| Proprietà   | Valore                                                            |
| ----------- | ----------------------------------------------------------------- |
| ID provider | `runway`                                                          |
| Auth        | `RUNWAYML_API_SECRET` (canonico) o `RUNWAY_API_KEY`               |
| API         | Generazione video Runway basata su task (polling `GET /v1/tasks/{id}`) |

## Per iniziare

<Steps>
  <Step title="Imposta la chiave API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Imposta Runway come provider video predefinito">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Genera un video">
    Chiedi all’agente di generare un video. Runway verrà usato automaticamente.
  </Step>
</Steps>

## Modalità supportate

| Modalità       | Modello            | Input di riferimento     |
| -------------- | ------------------ | ------------------------ |
| Text-to-video  | `gen4.5` (predefinito) | Nessuno               |
| Image-to-video | `gen4.5`           | 1 immagine locale o remota |
| Video-to-video | `gen4_aleph`       | 1 video locale o remoto  |

<Note>
I riferimenti locali a immagini e video sono supportati tramite URI dati. Le esecuzioni solo testuali
espongono attualmente i rapporti d’aspetto `16:9` e `9:16`.
</Note>

<Warning>
Video-to-video richiede attualmente in modo specifico `runway/gen4_aleph`.
</Warning>

## Configurazione

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Note avanzate

<AccordionGroup>
  <Accordion title="Alias delle variabili d’ambiente">
    OpenClaw riconosce sia `RUNWAYML_API_SECRET` (canonico) sia `RUNWAY_API_KEY`.
    Entrambe le variabili autenticano il provider Runway.
  </Accordion>

  <Accordion title="Polling dei task">
    Runway usa un’API basata su task. Dopo l’invio di una richiesta di generazione, OpenClaw
    esegue il polling di `GET /v1/tasks/{id}` finché il video non è pronto. Non è necessaria alcuna
    configurazione aggiuntiva per il comportamento di polling.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento, selezione del provider e comportamento asincrono.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference#agent-defaults" icon="gear">
    Impostazioni predefinite dell’agente, incluso il modello di generazione video.
  </Card>
</CardGroup>
