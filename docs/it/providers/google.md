---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Ti serve la chiave API o il flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei contenuti multimediali, TTS, ricerca sul web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Il Plugin Google fornisce l'accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei contenuti multimediali (immagini/audio/video), sintesi vocale e ricerca sul web tramite
Gemini Grounding.

- Provider: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternativo: `google-gemini-cli` (OAuth)

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso standard alle API Gemini tramite Google AI Studio.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oppure passa la chiave direttamente:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Le variabili d'ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` sono entrambe accettate. Usa quella che hai già configurato.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite PKCE OAuth invece di una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando usano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Installa Gemini CLI">
        Il comando locale `gemini` deve essere disponibile nel `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oppure npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw supporta sia le installazioni Homebrew sia le installazioni npm globali, incluse
        le comuni configurazioni Windows/npm.
      </Step>
      <Step title="Accedi tramite OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth di Gemini CLI falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e riprova.
    </Note>

    <Note>
    Se l'accesso fallisce prima che inizi il flusso nel browser, assicurati che il comando locale `gemini`
    sia installato e disponibile nel `PATH`.
    </Note>

    Il provider `google-gemini-cli`, solo OAuth, è una superficie separata per
    l'inferenza testuale. La generazione di immagini, la comprensione dei contenuti multimediali e Gemini Grounding restano sul
    provider id `google`.

  </Tab>
</Tabs>

## Capacità

| Capacità               | Supportato                    |
| ---------------------- | ----------------------------- |
| Completamenti chat     | Sì                            |
| Generazione di immagini | Sì                           |
| Generazione musicale   | Sì                            |
| Sintesi vocale         | Sì                            |
| Voce in tempo reale    | Sì (Google Live API)          |
| Comprensione immagini  | Sì                            |
| Trascrizione audio     | Sì                            |
| Comprensione video     | Sì                            |
| Ricerca web (Grounding) | Sì                           |
| Thinking/ragionamento  | Sì (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4        | Sì                            |

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di ragionamento per Gemini 3, Gemini 3.1 e gli alias `gemini-*-latest` a
`thinkingLevel`, così le esecuzioni predefinite/a bassa latenza non inviano valori
`thinkingBudget` disabilitati.

I modelli Gemma 4 (per esempio `gemma-4-26b-a4b-it`) supportano la modalità thinking. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il thinking su `off` mantiene il thinking disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione di immagini

Il provider di generazione immagini `google` incluso usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini in ingresso
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Per usare Google come provider di immagini predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione video

Il Plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: text-to-video, image-to-video e flussi con riferimento a singolo video
- Supporta `aspectRatio`, `resolution` e `audio`
- Limite attuale della durata: **da 4 a 8 secondi**

Per usare Google come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione musicale

Il Plugin `google` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione si scollegano tramite il flusso condiviso task/stato, incluso `action: "status"`

Per usare Google come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Vedi [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Sintesi vocale

Il provider vocale `google` incluso usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per i normali allegati TTS, PCM per Talk/telefonia
- Output nativo come nota vocale: non supportato su questo percorso Gemini API perché l'API restituisce PCM anziché Opus

Per usare Google come provider TTS predefinito:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Il TTS della Gemini API accetta tag audio espressivi tra parentesi quadre nel testo, come
`[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta visibile in chat mentre
li invii al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Ecco il testo pulito della risposta.

[[tts:text]][whispers] Ecco la versione parlata.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata alla Gemini API è valida per questo
provider. Questo non è il percorso separato della Cloud Text-to-Speech API.
</Note>

## Voce in tempo reale

Il Plugin `google` incluso registra un provider vocale in tempo reale supportato dalla
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione          | Percorso config                                                       | Predefinito                                                                           |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modello               | `plugins.entries.voice-call.config.realtime.providers.google.model`   | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voce                  | `...google.voice`                                                     | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                               | (non impostato)                                                                       |
| Sensibilità avvio VAD | `...google.startSensitivity`                                          | (non impostato)                                                                       |
| Sensibilità fine VAD  | `...google.endSensitivity`                                            | (non impostato)                                                                       |
| Durata del silenzio   | `...google.silenceDurationMs`                                         | (non impostato)                                                                       |
| Chiave API            | `...google.apiKey`                                                    | Usa come fallback `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY` |

Esempio di configurazione realtime per Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API usa audio bidirezionale e chiamata di funzioni su WebSocket.
OpenClaw adatta l'audio dei bridge telefonici/Meet al flusso PCM Live API di Gemini e
mantiene le chiamate agli strumenti sul contratto condiviso per la voce in tempo reale. Lascia `temperature`
non impostato a meno che tu non abbia bisogno di modifiche al campionamento; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio per `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'attuale SDK Google
rifiuta gli hint sui codici lingua su questo percorso API.
</Note>

<Note>
Le sessioni browser UI Talk del Control richiedono ancora un provider vocale in tempo reale con
un'implementazione di sessione browser WebRTC. Oggi quel percorso è OpenAI Realtime; il
provider Google è per i bridge realtime backend.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache Gemini">
    Per le esecuzioni dirette con Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato direttamente alle richieste Gemini.

    - Configura i parametri per modello o globali con
      `cachedContent` oppure con il legacy `cached_content`
    - Se sono presenti entrambi, `cachedContent` ha la precedenza
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo della cache-hit di Gemini è normalizzato in OpenClaw `cacheRead` da
      `cachedContentTokenCount` upstream

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Note sull'uso del JSON di Gemini CLI">
    Quando usi il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo JSON `response` della CLI.
    - L'utilizzo usa come fallback `stats` quando la CLI lascia vuoto `usage`.
    - `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
    - Se `stats.input` è mancante, OpenClaw ricava i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del demone">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (per esempio, in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per le immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per i video e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento per la musica e selezione del provider.
  </Card>
</CardGroup>
