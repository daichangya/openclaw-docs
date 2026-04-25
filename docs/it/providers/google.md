---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Ti serve il flusso di autenticazione con chiave API o OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T13:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Il Plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagine/audio/video), text-to-speech e web search tramite
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oppure `GOOGLE_API_KEY`
- API: Google Gemini API
- Opzione runtime: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`
  riusa OAuth di Gemini CLI mantenendo canonici i model ref come `google/*`.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso standard all'API Gemini tramite Google AI Studio.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oppure passa direttamente la chiave:

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
    **Ideale per:** riusare un login Gemini CLI esistente tramite PKCE OAuth invece di una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando usano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Installa Gemini CLI">
        Il comando locale `gemini` deve essere disponibile in `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oppure npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw supporta sia installazioni Homebrew sia installazioni npm globali, incluse
        le comuni configurazioni Windows/npm.
      </Step>
      <Step title="Accedi tramite OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modello predefinito: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth di Gemini CLI falliscono dopo il login, imposta `GOOGLE_CLOUD_PROJECT` oppure
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e riprova.
    </Note>

    <Note>
    Se il login fallisce prima che inizi il flusso del browser, assicurati che il comando locale `gemini`
    sia installato e presente in `PATH`.
    </Note>

    I model ref `google-gemini-cli/*` sono alias di compatibilità legacy. Le nuove
    configurazioni dovrebbero usare model ref `google/*` più il runtime `google-gemini-cli`
    quando vogliono l'esecuzione locale di Gemini CLI.

  </Tab>
</Tabs>

## Capability

| Capability             | Supportata                    |
| ---------------------- | ----------------------------- |
| Chat completions       | Sì                            |
| Generazione di immagini | Sì                           |
| Generazione di musica  | Sì                            |
| Text-to-speech         | Sì                            |
| Voce realtime          | Sì (Google Live API)          |
| Comprensione immagini  | Sì                            |
| Trascrizione audio     | Sì                            |
| Comprensione video     | Sì                            |
| Web search (Grounding) | Sì                            |
| Thinking/reasoning     | Sì (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4        | Sì                            |

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di reasoning di Gemini 3, Gemini 3.1 e gli alias `gemini-*-latest` su
`thinkingLevel` in modo che le esecuzioni predefinite/a bassa latenza non inviino
valori disabilitati di `thinkingBudget`.

`/think adaptive` mantiene la semantica di thinking dinamico di Google invece di scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso in modo
che Google possa scegliere il livello; Gemini 2.5 invia il sentinel dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (ad esempio `gemma-4-26b-a4b-it`) supportano la modalità thinking. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il thinking su `off` preserva il thinking disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione di immagini

Il provider di generazione immagini bundled `google` usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità edit: abilitata, fino a 5 immagini in input
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Per usare Google come provider immagini predefinito:

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
Vedi [Image Generation](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione di video

Il Plugin bundled `google` registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: text-to-video, image-to-video e flussi con singolo video di riferimento
- Supporta `aspectRatio`, `resolution` e `audio`
- Clamp attuale della durata: **da 4 a 8 secondi**

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
Vedi [Video Generation](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione di musica

Il Plugin bundled `google` registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione si staccano tramite il flusso condiviso task/status, incluso `action: "status"`

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
Vedi [Music Generation](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Text-to-speech

Il provider speech bundled `google` usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per normali allegati TTS, PCM per Talk/telefonia
- Output nativo come nota vocale: non supportato su questo percorso Gemini API perché l'API restituisce PCM invece di Opus

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
          audioProfile: "Parla in modo professionale con un tono calmo.",
        },
      },
    },
  },
}
```

Il TTS della Gemini API usa prompting in linguaggio naturale per il controllo dello stile. Imposta
`audioProfile` per anteporre un prompt di stile riutilizzabile prima del testo parlato. Imposta
`speakerName` quando il testo del prompt fa riferimento a uno speaker con nome.

Il TTS della Gemini API accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta visibile in chat
pur inviandoli al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Ecco il testo pulito della risposta.

[[tts:text]][whispers] Ecco la versione parlata.[[/tts:text]]
```

<Note>
Una chiave API Google Cloud Console limitata alla Gemini API è valida per questo
provider. Non è il percorso separato della Cloud Text-to-Speech API.
</Note>

## Voce realtime

Il Plugin bundled `google` registra un provider di voce realtime basato sulla
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione          | Percorso di configurazione                                           | Predefinito                                                                          |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Modello               | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Voce                  | `...google.voice`                                                    | `Kore`                                                                               |
| Temperature           | `...google.temperature`                                              | (non impostato)                                                                      |
| Sensibilità inizio VAD | `...google.startSensitivity`                                        | (non impostato)                                                                      |
| Sensibilità fine VAD  | `...google.endSensitivity`                                           | (non impostato)                                                                      |
| Durata silenzio       | `...google.silenceDurationMs`                                        | (non impostato)                                                                      |
| Chiave API            | `...google.apiKey`                                                   | Fallback a `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY` |

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
Google Live API usa audio bidirezionale e function calling su WebSocket.
OpenClaw adatta l'audio dei bridge telefonia/Meet al flusso PCM Live API di Gemini e
mantiene le tool call sul contratto condiviso di voce realtime. Lascia `temperature`
non impostato a meno che tu non abbia bisogno di cambiare il sampling; OpenClaw omette valori non positivi
perché Google Live può restituire transcript senza audio con `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'attuale SDK Google
rifiuta suggerimenti sui codici lingua su questo percorso API.
</Note>

<Note>
Le sessioni browser Talk della Control UI richiedono ancora un provider di voce realtime con una
implementazione di sessione WebRTC browser. Oggi quel percorso è OpenAI Realtime; il
provider Google è per bridge realtime backend.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache Gemini">
    Per le esecuzioni dirette Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato alle richieste Gemini.

    - Configura parametri per modello o globali con
      `cachedContent` oppure il legacy `cached_content`
    - Se sono presenti entrambi, `cachedContent` ha la precedenza
    - Esempio di valore: `cachedContents/prebuilt-context`
    - L'utilizzo cache-hit di Gemini viene normalizzato in OpenClaw `cacheRead` a partire da
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

  <Accordion title="Note sull'utilizzo JSON di Gemini CLI">
    Quando usi il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo JSON `response` della CLI.
    - L'utilizzo usa `stats` come fallback quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
    - Se `stats.input` manca, OpenClaw deriva i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configurazione di ambiente e daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile a quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musica e selezione del provider.
  </Card>
</CardGroup>
