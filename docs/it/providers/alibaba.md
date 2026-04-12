---
read_when:
    - Vuoi usare la generazione video Wan di Alibaba in OpenClaw
    - Hai bisogno di configurare una chiave API di Model Studio o DashScope per la generazione video
summary: Generazione video Wan di Alibaba Model Studio in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:28:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw include un provider integrato `alibaba` per la generazione video per i modelli Wan su Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Autenticazione preferita: `MODELSTUDIO_API_KEY`
- Accettate anche: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: generazione video asincrona DashScope / Model Studio

## Per iniziare

<Steps>
  <Step title="Imposta una chiave API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Imposta un modello video predefinito">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifica che il provider sia disponibile">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Qualsiasi delle chiavi di autenticazione accettate (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funzionerà. L'opzione di onboarding `qwen-standard-api-key` configura la credenziale DashScope condivisa.
</Note>

## Modelli Wan integrati

Il provider integrato `alibaba` attualmente registra:

| Riferimento modello      | Modalità                    |
| ------------------------ | --------------------------- |
| `alibaba/wan2.6-t2v`     | Da testo a video            |
| `alibaba/wan2.6-i2v`     | Da immagine a video         |
| `alibaba/wan2.6-r2v`     | Da riferimento a video      |
| `alibaba/wan2.6-r2v-flash` | Da riferimento a video (veloce) |
| `alibaba/wan2.7-r2v`     | Da riferimento a video      |

## Limiti attuali

| Parametro             | Limite                                                    |
| --------------------- | --------------------------------------------------------- |
| Video in output       | Fino a **1** per richiesta                                |
| Immagini in input     | Fino a **1**                                              |
| Video in input        | Fino a **4**                                              |
| Durata                | Fino a **10 secondi**                                     |
| Controlli supportati  | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Immagine/video di riferimento | Solo URL remoti `http(s)`                         |

<Warning>
La modalità immagine/video di riferimento attualmente richiede **URL remoti http(s)**. I percorsi di file locali non sono supportati per gli input di riferimento.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Relazione con Qwen">
    Il provider integrato `qwen` usa anch'esso endpoint DashScope ospitati da Alibaba per la generazione video Wan. Usa:

    - `qwen/...` quando vuoi la superficie canonica del provider Qwen
    - `alibaba/...` quando vuoi la superficie video Wan diretta gestita dal vendor

    Consulta la [documentazione del provider Qwen](/it/providers/qwen) per maggiori dettagli.

  </Accordion>

  <Accordion title="Priorità delle chiavi di autenticazione">
    OpenClaw controlla le chiavi di autenticazione in questo ordine:

    1. `MODELSTUDIO_API_KEY` (preferita)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Qualsiasi di queste autenticherà il provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Qwen" href="/it/providers/qwen" icon="microchip">
    Configurazione del provider Qwen e integrazione DashScope.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference#agent-defaults" icon="gear">
    Valori predefiniti dell'agente e configurazione del modello.
  </Card>
</CardGroup>
