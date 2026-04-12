---
read_when:
    - Vuoi la funzione speech-to-text di Deepgram per gli allegati audio
    - Hai bisogno di un esempio rapido di configurazione Deepgram
summary: Trascrizione Deepgram per i messaggi vocali in ingresso
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Trascrizione audio)

Deepgram è un'API speech-to-text. In OpenClaw viene usata per la **trascrizione di audio/messaggi vocali in ingresso** tramite `tools.media.audio`.

Quando è abilitata, OpenClaw carica il file audio su Deepgram e inserisce la trascrizione
nella pipeline di risposta (blocco `{{Transcript}}` + `[Audio]`). Questa modalità **non è in streaming**;
usa l'endpoint di trascrizione preregistrata.

| Dettaglio      | Valore                                                     |
| -------------- | ---------------------------------------------------------- |
| Sito web       | [deepgram.com](https://deepgram.com)                       |
| Documentazione | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticazione | `DEEPGRAM_API_KEY`                                         |
| Modello predefinito | `nova-3`                                              |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
    Aggiungi la tua chiave API Deepgram all'ambiente:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Abilita il provider audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Invia un messaggio vocale">
    Invia un messaggio audio tramite qualsiasi canale connesso. OpenClaw lo trascrive
    tramite Deepgram e inserisce la trascrizione nella pipeline di risposta.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione           | Percorso                                                     | Descrizione                              |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID modello Deepgram (predefinito: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Suggerimento lingua (facoltativo)        |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Abilita il rilevamento della lingua (facoltativo) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Abilita la punteggiatura (facoltativo)   |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Abilita la formattazione intelligente (facoltativo) |

<Tabs>
  <Tab title="Con suggerimento lingua">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Con opzioni Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    L'autenticazione segue l'ordine standard dei provider. `DEEPGRAM_API_KEY` è
    il percorso più semplice.
  </Accordion>
  <Accordion title="Proxy ed endpoint personalizzati">
    Sovrascrivi endpoint o header con `tools.media.audio.baseUrl` e
    `tools.media.audio.headers` quando usi un proxy.
  </Accordion>
  <Accordion title="Comportamento dell'output">
    L'output segue le stesse regole audio degli altri provider (limiti di dimensione, timeout,
    inserimento della trascrizione).
  </Accordion>
</AccordionGroup>

<Note>
La trascrizione Deepgram è **solo preregistrata** (non in streaming in tempo reale). OpenClaw
carica il file audio completo e attende la trascrizione completa prima di inserirla
nella conversazione.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Strumenti media" href="/tools/media" icon="photo-film">
    Panoramica della pipeline di elaborazione audio, immagini e video.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni degli strumenti media.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
  <Card title="FAQ" href="/it/help/faq" icon="circle-question">
    Domande frequenti sulla configurazione di OpenClaw.
  </Card>
</CardGroup>
