---
read_when:
    - Vuoi la sintesi Azure Speech per le risposte in uscita
    - Hai bisogno di output nativo di note vocali Ogg Opus da Azure Speech
summary: Sintesi vocale Azure AI Speech per le risposte di OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech è un provider di sintesi vocale Azure AI Speech. In OpenClaw sintetizza l'audio delle risposte in uscita come MP3 per impostazione predefinita, Ogg/Opus nativo per le note vocali e audio mulaw a 8 kHz per i canali di telefonia come Voice Call.

OpenClaw usa direttamente l'API REST di Azure Speech con SSML e invia il formato di output gestito dal provider tramite `X-Microsoft-OutputFormat`.

| Dettaglio               | Valore                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sito web                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                 |
| Documentazione          | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Autenticazione          | `AZURE_SPEECH_KEY` più `AZURE_SPEECH_REGION`                                                                   |
| Voce predefinita        | `en-US-JennyNeural`                                                                                            |
| Output file predefinito | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| File nota vocale predefinito | `ogg-24khz-16bit-mono-opus`                                                                               |

## Introduzione

<Steps>
  <Step title="Crea una risorsa Azure Speech">
    Nel portale Azure, crea una risorsa Speech. Copia **KEY 1** da
    Resource Management > Keys and Endpoint e copia la posizione della risorsa,
    ad esempio `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Seleziona Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Invia un messaggio">
    Invia una risposta tramite qualsiasi canale connesso. OpenClaw sintetizza l'audio
    con Azure Speech e consegna MP3 per l'audio standard, oppure Ogg/Opus quando
    il canale si aspetta una nota vocale.
  </Step>
</Steps>

## Opzioni di configurazione

| Opzione                 | Percorso                                                    | Descrizione                                                                                             |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Chiave della risorsa Azure Speech. Usa come fallback `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Regione della risorsa Azure Speech. Usa come fallback `AZURE_SPEECH_REGION` o `SPEECH_REGION`.         |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Override facoltativo dell'endpoint/base URL di Azure Speech.                                            |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Override facoltativo della base URL di Azure Speech.                                                    |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | `ShortName` della voce Azure (predefinito `en-US-JennyNeural`).                                        |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Codice lingua SSML (predefinito `en-US`).                                                               |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Formato di output del file audio (predefinito `audio-24khz-48kbitrate-mono-mp3`).                      |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Formato di output della nota vocale (predefinito `ogg-24khz-16bit-mono-opus`).                         |

## Note

<AccordionGroup>
  <Accordion title="Autenticazione">
    Azure Speech usa una chiave della risorsa Speech, non una chiave Azure OpenAI. La chiave
    viene inviata come `Ocp-Apim-Subscription-Key`; OpenClaw deriva
    `https://<region>.tts.speech.microsoft.com` da `region` a meno che tu non
    fornisca `endpoint` o `baseUrl`.
  </Accordion>
  <Accordion title="Nomi delle voci">
    Usa il valore `ShortName` della voce Azure Speech, ad esempio
    `en-US-JennyNeural`. Il provider incluso può elencare le voci tramite la
    stessa risorsa Speech e filtra le voci contrassegnate come deprecated o retired.
  </Accordion>
  <Accordion title="Output audio">
    Azure accetta formati di output come `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` e `riff-24khz-16bit-mono-pcm`. OpenClaw
    richiede Ogg/Opus per i target `voice-note` così i canali possono inviare
    bubble vocali native senza una conversione MP3 aggiuntiva.
  </Accordion>
  <Accordion title="Alias">
    `azure` è accettato come alias del provider per PR esistenti e configurazioni utente,
    ma la nuova configurazione dovrebbe usare `azure-speech` per evitare confusione con i provider di modelli
    Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Sintesi vocale" href="/it/tools/tts" icon="waveform-lines">
    Panoramica di TTS, provider e configurazione `messages.tts`.
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
