---
read_when:
    - Vuoi la sintesi vocale Inworld per le risposte in uscita
    - Hai bisogno di telefonia PCM o di output di note vocali OGG_OPUS da Inworld
summary: Sintesi vocale in streaming di Inworld per le risposte di OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:37:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld è un provider di sintesi vocale (TTS) in streaming. In OpenClaw
sintetizza l'audio delle risposte in uscita (MP3 per impostazione predefinita, OGG_OPUS per le note vocali)
e l'audio PCM per i canali di telefonia come Voice Call.

OpenClaw invia richieste all'endpoint TTS in streaming di Inworld, concatena i
blocchi audio base64 restituiti in un unico buffer e passa il risultato alla
pipeline standard dell'audio di risposta.

| Dettaglio     | Valore                                                      |
| ------------- | ----------------------------------------------------------- |
| Sito web      | [inworld.ai](https://inworld.ai)                            |
| Documentazione| [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Autenticazione| `INWORLD_API_KEY` (HTTP Basic, credenziale dashboard Base64) |
| Voce predefinita | `Sarah`                                                  |
| Modello predefinito | `inworld-tts-1.5-max`                                |

## Per iniziare

<Steps>
  <Step title="Imposta la tua chiave API">
    Copia la credenziale dalla dashboard di Inworld (Workspace > API Keys)
    e impostala come variabile d'ambiente. Il valore viene inviato testualmente come credenziale
    HTTP Basic, quindi non codificarlo di nuovo in Base64 e non convertirlo in un
    token bearer.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Seleziona Inworld in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Invia un messaggio">
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza l'
    audio con Inworld e lo consegna come MP3 (oppure OGG_OPUS quando il canale
    prevede una nota vocale).
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione       | Percorso                                     | Descrizione                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Credenziale dashboard Base64. Usa `INWORLD_API_KEY` come fallback. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Sovrascrive l'URL base dell'API Inworld (predefinito `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Identificatore della voce (predefinito `Sarah`).                 |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | ID del modello TTS (predefinito `inworld-tts-1.5-max`).          |
| `temperature` | `messages.tts.providers.inworld.temperature` | Temperatura di campionamento `0..2` (facoltativa).               |

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Inworld usa l'autenticazione HTTP Basic con una singola stringa di credenziali
    codificata in Base64. Copiala testualmente dalla dashboard di Inworld. Il provider la invia
    come `Authorization: Basic <apiKey>` senza alcuna ulteriore codifica, quindi
    non codificarla tu stesso in Base64 e non passare un token in stile bearer.
    Vedi [note di autenticazione TTS](/it/tools/tts#inworld-primary) per lo stesso avviso.
  </Accordion>
  <Accordion title="Modelli">
    ID modello supportati: `inworld-tts-1.5-max` (predefinito),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Output audio">
    Le risposte usano MP3 per impostazione predefinita. Quando la destinazione del canale è `voice-note`
    OpenClaw chiede a Inworld `OGG_OPUS` così l'audio viene riprodotto come
    una bolla vocale nativa. La sintesi per telefonia usa `PCM` grezzo a 22050 Hz per alimentare
    il bridge di telefonia.
  </Accordion>
  <Accordion title="Endpoint personalizzati">
    Sovrascrivi l'host API con `messages.tts.providers.inworld.baseUrl`.
    Le barre finali vengono rimosse prima dell'invio delle richieste.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="waveform-lines">
    Panoramica TTS, provider e configurazione `messages.tts`.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione, incluse le impostazioni `messages.tts`.
  </Card>
  <Card title="Provider" href="/it/providers" icon="grid">
    Tutti i provider OpenClaw inclusi.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e passaggi di debug.
  </Card>
</CardGroup>
