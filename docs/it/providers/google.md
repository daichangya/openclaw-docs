---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Hai bisogno della chiave API o del flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-16T08:18:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2d62855f5e80efda758aad71bcaa95c38b1e41761fa1100d47a06c62881419
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Il Plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagini/audio/video), sintesi vocale e ricerca web tramite
Gemini Grounding.

- Provider: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternativo: `google-gemini-cli` (OAuth)

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

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
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite OAuth PKCE invece di una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
    segnalano limitazioni dell'account quando si usa OAuth in questo modo. Usalo a tuo rischio.
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

        OpenClaw supporta sia le installazioni Homebrew sia quelle npm globali, inclusi
        i layout comuni di Windows/npm.
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
    Se le richieste OAuth di Gemini CLI falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` oppure
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway e riprova.
    </Note>

    <Note>
    Se l'accesso fallisce prima che inizi il flusso nel browser, assicurati che il comando locale `gemini`
    sia installato e presente nel `PATH`.
    </Note>

    Il provider solo OAuth `google-gemini-cli` è una superficie separata di
    inferenza testuale. La generazione di immagini, la comprensione dei media e Gemini Grounding restano sul
    provider con id `google`.

  </Tab>
</Tabs>

## Capacità

| Capacità               | Supportato        |
| ---------------------- | ----------------- |
| Completamenti chat     | Sì                |
| Generazione di immagini| Sì                |
| Generazione musicale   | Sì                |
| Sintesi vocale         | Sì                |
| Comprensione immagini  | Sì                |
| Trascrizione audio     | Sì                |
| Comprensione video     | Sì                |
| Ricerca web (Grounding)| Sì                |
| Thinking/ragionamento  | Sì (Gemini 3.1+)  |
| Modelli Gemma 4        | Sì                |

<Tip>
I modelli Gemma 4 (ad esempio `gemma-4-26b-a4b-it`) supportano la modalità thinking. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare thinking su `off` mantiene thinking disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione di immagini

Il provider di generazione immagini `google` incluso usa come predefinito
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di input
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
Consulta [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione video

Il Plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: testo in video, immagine in video e flussi con riferimento a singolo video
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
Consulta [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione musicale

Il Plugin `google` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione si staccano tramite il flusso condiviso attività/stato, incluso `action: "status"`

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
Consulta [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Sintesi vocale

Il provider vocale `google` incluso usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per i normali allegati TTS, PCM per Talk/telefonia
- Output nativo di note vocali: non supportato su questo percorso Gemini API perché l'API restituisce PCM invece di Opus

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
provider. Questo non è il percorso separato dell'API Cloud Text-to-Speech.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache Gemini">
    Per le esecuzioni dirette della Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato direttamente alle richieste Gemini.

    - Configura i parametri per modello o globali con
      `cachedContent` oppure il legacy `cached_content`
    - Se sono presenti entrambi, `cachedContent` ha la precedenza
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'uso di Gemini con cache hit è normalizzato in OpenClaw `cacheRead` a partire da
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
    - L'utilizzo ricade su `stats` quando la CLI lascia vuoto `usage`.
    - `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
    - Se `stats.input` manca, OpenClaw ricava i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configurazione di ambiente e daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti ai modelli e comportamento di failover.
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
