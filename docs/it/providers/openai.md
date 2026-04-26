---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l’autenticazione con abbonamento Codex invece delle chiavi API
    - Ti serve un comportamento di esecuzione dell’agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:37:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI fornisce API per sviluppatori per i modelli GPT, e Codex è disponibile anche come agente di coding del piano ChatGPT tramite i client Codex di OpenAI. OpenClaw mantiene separate queste superfici così la config resta prevedibile.

  OpenClaw supporta tre percorsi della famiglia OpenAI. Il prefisso del modello seleziona il
  percorso provider/auth; un’impostazione runtime separata seleziona chi esegue il
  loop dell’agente incorporato:

  - **Chiave API** — accesso diretto a OpenAI Platform con fatturazione a consumo (modelli `openai/*`)
  - **Abbonamento Codex tramite PI** — accesso con login ChatGPT/Codex e abbonamento (modelli `openai-codex/*`)
  - **Harness app-server Codex** — esecuzione nativa dell’app-server Codex (modelli `openai/*` più `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI supporta esplicitamente l’uso di OAuth con abbonamento in strumenti e workflow esterni come OpenClaw.

  Provider, modello, runtime e canale sono livelli separati. Se queste etichette si
  stanno confondendo, leggi [Agent runtimes](/it/concepts/agent-runtimes) prima di
  cambiare la config.

  ## Scelta rapida

  | Obiettivo                                       | Usa                                              | Note                                                                         |
  | ----------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Fatturazione diretta con chiave API             | `openai/gpt-5.5`                                 | Imposta `OPENAI_API_KEY` oppure esegui l’onboarding con chiave API OpenAI.  |
  | GPT-5.5 con auth da abbonamento ChatGPT/Codex   | `openai-codex/gpt-5.5`                           | Percorso PI predefinito per OAuth Codex. Migliore prima scelta per setup con abbonamento. |
  | GPT-5.5 con comportamento nativo dell’app-server Codex | `openai/gpt-5.5` più `agentRuntime.id: "codex"` | Forza l’harness app-server Codex per quel model ref.                         |
  | Generazione o modifica di immagini              | `openai/gpt-image-2`                             | Funziona sia con `OPENAI_API_KEY` sia con OpenAI Codex OAuth.                |
  | Immagini con sfondo trasparente                 | `openai/gpt-image-1.5`                           | Usa `outputFormat=png` o `webp` e `openai.background=transparent`.           |

  ## Mappa dei nomi

  I nomi sono simili ma non intercambiabili:

  | Nome che vedi                       | Livello           | Significato                                                                                           |
  | ----------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
  | `openai`                            | Prefisso provider | Percorso diretto dell’API OpenAI Platform.                                                            |
  | `openai-codex`                      | Prefisso provider | Percorso OpenAI Codex OAuth/abbonamento tramite il normale runner PI di OpenClaw.                    |
  | Plugin `codex`                      | Plugin            | Plugin OpenClaw incluso che fornisce il runtime nativo dell’app-server Codex e i controlli chat `/codex`. |
  | `agentRuntime.id: codex`            | Runtime agente    | Forza l’harness nativo dell’app-server Codex per i turni incorporati.                                 |
  | `/codex ...`                        | Set di comandi chat | Associa/controlla i thread dell’app-server Codex da una conversazione.                              |
  | `runtime: "acp", agentId: "codex"`  | Percorso sessione ACP | Percorso di fallback esplicito che esegue Codex tramite ACP/acpx.                                  |

  Questo significa che una config può intenzionalmente contenere sia `openai-codex/*` sia il
  Plugin `codex`. È valido quando vuoi Codex OAuth tramite PI e vuoi anche avere
  disponibili i controlli chat nativi `/codex`. `openclaw doctor` avvisa su questa
  combinazione così puoi confermare che sia intenzionale; non la riscrive.

  <Note>
  GPT-5.5 è disponibile sia tramite accesso diretto all’API OpenAI Platform con chiave API sia
  tramite percorsi abbonamento/OAuth. Usa `openai/gpt-5.5` per traffico diretto con `OPENAI_API_KEY`,
  `openai-codex/gpt-5.5` per Codex OAuth tramite PI, oppure
  `openai/gpt-5.5` con `agentRuntime.id: "codex"` per l’harness
  nativo dell’app-server Codex.
  </Note>

  <Note>
  Abilitare il Plugin OpenAI, o selezionare un modello `openai-codex/*`, non
  abilita il Plugin incluso dell’app-server Codex. OpenClaw abilita quel Plugin solo
  quando selezioni esplicitamente l’harness Codex nativo con
  `agentRuntime.id: "codex"` oppure usi un model ref legacy `codex/*`.
  Se il Plugin `codex` incluso è abilitato ma `openai-codex/*` continua a risolversi
  tramite PI, `openclaw doctor` avvisa e lascia invariato il percorso.
  </Note>

  ## Copertura delle funzionalità OpenClaw

  | Capability OpenAI          | Superficie OpenClaw                                       | Stato                                                  |
  | -------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses           | Provider di modelli `openai/<model>`                      | Sì                                                     |
  | Modelli con abbonamento Codex | `openai-codex/<model>` con OAuth `openai-codex`       | Sì                                                     |
  | Harness app-server Codex   | `openai/<model>` con `agentRuntime.id: codex`             | Sì                                                     |
  | Ricerca web lato server    | Strumento nativo OpenAI Responses                         | Sì, quando la ricerca web è abilitata e nessun provider è fissato |
  | Immagini                   | `image_generate`                                          | Sì                                                     |
  | Video                      | `video_generate`                                          | Sì                                                     |
  | Text-to-speech             | `messages.tts.provider: "openai"` / `tts`                 | Sì                                                     |
  | Speech-to-text batch       | `tools.media.audio` / comprensione media                  | Sì                                                     |
  | Speech-to-text streaming   | Voice Call `streaming.provider: "openai"`                 | Sì                                                     |
  | Voce realtime              | Voice Call `realtime.provider: "openai"` / Control UI Talk | Sì                                                   |
  | Embeddings                 | Provider embedding di memoria                             | Sì                                                     |

  ## Per iniziare

  Scegli il metodo auth preferito e segui i passaggi di configurazione.

  <Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso diretto API e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Model ref             | Config runtime                        | Percorso                     | Auth             |
    | --------------------- | ------------------------------------- | ---------------------------- | ---------------- |
    | `openai/gpt-5.5`      | omessa / `agentRuntime.id: "pi"`      | API diretta OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | omessa / `agentRuntime.id: "pi"`      | API diretta OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "codex"`            | Harness app-server Codex     | app-server Codex |

    <Note>
    `openai/*` è il percorso diretto OpenAI con chiave API a meno che tu non forzi esplicitamente
    l’harness app-server Codex. Usa `openai-codex/*` per Codex OAuth tramite
    il runner PI predefinito, oppure usa `openai/gpt-5.5` con
    `agentRuntime.id: "codex"` per l’esecuzione nativa dell’app-server Codex.
    </Note>

    ### Esempio di config

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste live all’API OpenAI rifiutano quel modello e anche l’attuale catalogo Codex non lo espone.
    </Warning>

  </Tab>

  <Tab title="Abbonamento Codex">
    **Ideale per:** usare il tuo abbonamento ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede il login ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per setup headless o ostili al callback, aggiungi `--device-code` per accedere con un flusso ChatGPT device-code invece del callback browser su localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Imposta il modello predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Model ref | Config runtime | Percorso | Auth |
    |-----------|----------------|----------|------|
    | `openai-codex/gpt-5.5` | omessa / `runtime: "pi"` | ChatGPT/Codex OAuth tramite PI | login Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Sempre PI a meno che un Plugin non rivendichi esplicitamente `openai-codex` | login Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Harness app-server Codex | auth app-server Codex |

    <Note>
    Continua a usare l’id provider `openai-codex` per i comandi auth/profilo. Anche il
    prefisso modello `openai-codex/*` è il percorso PI esplicito per Codex OAuth.
    Non seleziona né abilita automaticamente l’harness incluso dell’app-server Codex.
    </Note>

    ### Esempio di config

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L’onboarding non importa più materiale OAuth da `~/.codex`. Accedi con OAuth da browser (predefinito) oppure con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio archivio auth dell’agente.
    </Note>

    ### Indicatore di stato

    La chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L’harness PI predefinito appare come `Runtime: OpenClaw Pi Default`. Quando viene
    selezionato l’harness incluso dell’app-server Codex, `/status` mostra
    `Runtime: OpenAI Codex`. Le sessioni esistenti mantengono l’id harness registrato, quindi usa
    `/new` o `/reset` dopo aver cambiato `agentRuntime` se vuoi che `/status`
    rifletta una nuova scelta PI/Codex.

    ### Avviso di Doctor

    Se il Plugin `codex` incluso è abilitato mentre il percorso
    `openai-codex/*` di questa scheda è selezionato, `openclaw doctor` avvisa che il modello
    continua a risolversi tramite PI. Lascia invariata la config quando quello è il
    percorso di autenticazione con abbonamento desiderato. Passa a `openai/<model>` più
    `agentRuntime.id: "codex"` solo quando vuoi l’esecuzione nativa dell’
    app-server Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite runtime del contesto come valori separati.

    Per `openai-codex/gpt-5.5` tramite Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - limite runtime predefinito `contextTokens`: `272000`

    Il limite predefinito più piccolo offre in pratica caratteristiche migliori di latenza e qualità. Fai override con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto del runtime.
    </Note>

    ### Recupero del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando sono
    presenti. Se il rilevamento live di Codex omette la riga `openai-codex/gpt-5.5` mentre
    l’account è autenticato, OpenClaw sintetizza quella riga di modello OAuth così
    le esecuzioni Cron, i sottoagenti e le esecuzioni del modello predefinito configurato non falliscono con
    `Unknown model`.

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini OpenAI con chiave API sia la
generazione di immagini Codex OAuth tramite lo stesso model ref `openai/gpt-image-2`.

| Capability                | Chiave API OpenAI                   | Codex OAuth                           |
| ------------------------- | ----------------------------------- | ------------------------------------- |
| Model ref                 | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| Auth                      | `OPENAI_API_KEY`                    | Login OpenAI Codex OAuth              |
| Transport                 | OpenAI Images API                   | Backend Codex Responses               |
| Max immagini per richiesta | 4                                  | 4                                     |
| Modalità modifica         | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override dimensione       | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Aspect ratio / resolution | Non inoltrati a OpenAI Images API   | Mappati a una dimensione supportata quando sicuro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulta [Image Generation](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il predefinito sia per la generazione text-to-image OpenAI sia per la
modifica di immagini. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` restano utilizzabili come
override espliciti del modello. Usa `openai/gpt-image-1.5` per output PNG/WebP
con sfondo trasparente; l’attuale API `gpt-image-2` rifiuta
`background: "transparent"`.

Per una richiesta con sfondo trasparente, gli agenti dovrebbero chiamare `image_generate` con
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` o `"webp"`, e
`background: "transparent"`; la vecchia opzione provider `openai.background` è
ancora accettata. OpenClaw protegge anche i percorsi pubblici OpenAI e
OpenAI Codex OAuth riscrivendo le richieste trasparenti predefinite `openai/gpt-image-2`
a `gpt-image-1.5`; Azure e gli endpoint personalizzati compatibili OpenAI mantengono
i nomi di deployment/modello configurati.

La stessa impostazione è esposta per esecuzioni CLI headless:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Usa gli stessi flag `--output-format` e `--background` con
`openclaw infer image edit` quando parti da un file di input.
`--openai-background` resta disponibile come alias specifico OpenAI.

Per le installazioni Codex OAuth, mantieni lo stesso ref `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth memorizzato
e invia le richieste di immagini tramite il backend Codex Responses. Non
prova prima `OPENAI_API_KEY` né ripiega silenziosamente su una chiave API per quella
richiesta. Configura esplicitamente `models.providers.openai` con una chiave API,
URL base personalizzato o endpoint Azure quando vuoi invece il percorso diretto
OpenAI Images API.
Se quell’endpoint immagine personalizzato si trova su una LAN attendibile/indirizzo privato, imposta
anche `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw continua
a bloccare gli endpoint immagine OpenAI-compatibili privati/interni a meno che questo opt-in non sia
presente.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Genera un PNG trasparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin `openai` incluso registra la generazione video tramite lo strumento `video_generate`.

| Capability       | Valore                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Modello predefinito | `openai/sora-2`                                                                |
| Modalità         | Text-to-video, image-to-video, modifica di singolo video                          |
| Input di riferimento | 1 immagine o 1 video                                                          |
| Override dimensione | Supportati                                                                     |
| Altri override   | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un warning dello strumento |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulta [Video Generation](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica per model id, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri ref GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x più vecchi no.

L’harness nativo Codex incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni developer dell’app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `agentRuntime.id: "codex"` mantengono la stessa guida di follow-through e Heartbeat proattivo anche se Codex gestisce il resto del prompt dell’harness.

Il contributo GPT-5 aggiunge un contratto di comportamento con tag per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell’output, controlli di completamento e verifica. Il comportamento specifico del canale per risposta e messaggi silenziosi resta nel system prompt condiviso di OpenClaw e nella policy di recapito in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                        |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias di `"friendly"`                          |
| `"off"`                | Disabilita solo il livello di stile amichevole |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
A runtime i valori non distinguono tra maiuscole e minuscole, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

<Note>
Il legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando non è impostata l’impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Voce e speech

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin `openai` incluso registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Ripiega su `OPENAI_API_KEY` |
    | URL base | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Modelli disponibili: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voci disponibili: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Imposta `OPENAI_TTS_BASE_URL` per fare override dell’URL base TTS senza influire sull’endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin `openai` incluso registra lo speech-to-text batch tramite
    la superficie di trascrizione media-understanding di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: upload multipart di file audio
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi i segmenti dei canali vocali Discord e gli
      allegati audio dei canali

    Per forzare OpenAI per la trascrizione audio in ingresso:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    I suggerimenti di lingua e prompt vengono inoltrati a OpenAI quando forniti dalla
    config audio media condivisa o dalla richiesta di trascrizione per singola chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin `openai` incluso registra la trascrizione realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostato) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; la voce Discord al momento registra brevi segmenti e usa invece il percorso di trascrizione batch `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin `openai` incluso registra la voce realtime per il Plugin Voice Call.

    | Impostazione | Percorso config | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Ripiega su `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di config `azureEndpoint` e `azureDeployment`. Supporta la chiamata bidirezionale agli strumenti. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider `openai` incluso può puntare a una risorsa Azure OpenAI per la generazione
di immagini facendo override dell’URL base. Sul percorso di generazione immagini, OpenClaw
rileva gli hostname Azure su `models.providers.openai.baseUrl` e passa automaticamente
alla forma di richiesta di Azure.

<Note>
La voce realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Consulta l’accordion **Voce
realtime** sotto [Voce e speech](#voice-and-speech) per le relative
impostazioni Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già un abbonamento, quote o un accordo enterprise Azure OpenAI
- Ti servono residenza dei dati regionale o controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all’interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider `openai` incluso, punta
`models.providers.openai.baseUrl` alla tua risorsa Azure e imposta `apiKey` sulla
chiave Azure OpenAI (non una chiave OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw riconosce questi suffissi host Azure per il percorso Azure di generazione
immagini:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l’header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con scope di deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta
- Usa un timeout di richiesta predefinito di 600s per le chiamate Azure di generazione immagini.
  I valori `timeoutMs` per singola chiamata continuano comunque a fare override di questo valore predefinito.

Gli altri URL base (OpenAI pubblico, proxy compatibili OpenAI) mantengono la
forma di richiesta immagine standard OpenAI.

<Note>
Il routing Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l’endpoint pubblico OpenAI e falliscono contro i
deployment immagine Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione preview o GA di Azure
per il percorso Azure di generazione immagini:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il valore predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI associa i modelli ai deployment. Per le richieste di generazione immagini Azure
instradate tramite il provider `openai` incluso, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** che hai configurato nel portale Azure, non
l’id del modello OpenAI pubblico.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini
instradate tramite il provider `openai` incluso.

### Disponibilità regionale

La generazione immagini Azure al momento è disponibile solo in un sottoinsieme di regioni
(ad esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l’elenco aggiornato delle regioni Microsoft prima di creare un
deployment, e conferma che il modello specifico sia offerto nella tua regione.

### Differenze nei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni che OpenAI pubblico consente (ad esempio certi
valori `background` su `gpt-image-2`) oppure esporle solo su versioni specifiche del modello.
Queste differenze dipendono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla il
set di parametri supportati dal tuo deployment e dalla tua versione API specifici nel
portale Azure.

<Note>
Azure OpenAI usa comportamento di transport e compat nativi ma non riceve
gli header nascosti di attribuzione di OpenClaw — consulta l’accordion **Percorsi nativi vs compatibili OpenAI**
sotto [Configurazione avanzata](#advanced-configuration).

Per traffico chat o Responses su Azure (oltre alla generazione immagini), usa il
flusso di onboarding o una config provider Azure dedicata — `openai.baseUrl` da solo
non adotta la forma Azure di API/auth. Esiste un provider separato
`azure-openai-responses/*`; consulta l’accordion Compaction lato server qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Riprova un primo fallimento WebSocket prima di ripiegare su SSE
    - Dopo un fallimento, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - Collega header stabili di identità della sessione e del turno per retry e reconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra varianti di transport

    | Valore | Comportamento |
    |-------|----------|
    | `"auto"` (predefinito) | Prima WebSocket, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita per impostazione predefinita il warm-up WebSocket per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modalità fast">
    OpenClaw espone un toggle condiviso fast-mode per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando abilitata, OpenClaw mappa la modalità fast all’elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati, e la modalità fast non riscrive `reasoning` o `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla config. Cancellare l’override di sessione nella UI Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L’API OpenAI espone l’elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia invariato `service_tier`.
    </Warning>

  </Accordion>

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli direct OpenAI Responses (`openai/*` su `api.openai.com`), il wrapper stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compat del modello imposti `supportsStore: false`)
    - Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook provider OpenAI usati dalle esecuzioni incorporate. L’harness nativo dell’app-server Codex gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Abilita esplicitamente">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Soglia personalizzata">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disabilita">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controlla solo l’iniezione di `context_management`. I modelli direct OpenAI Responses continuano comunque a forzare `store: true` a meno che la compat non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporata più rigoroso:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Con `strict-agentic`, OpenClaw:
    - Non considera più un turno con solo piano come avanzamento riuscito quando è disponibile un’azione strumento
    - Riprova il turno con uno steer act-now
    - Abilita automaticamente `update_plan` per lavori sostanziali
    - Mostra uno stato esplicitamente bloccato se il modello continua a pianificare senza agire

    <Note>
    Con ambito solo per le esecuzioni OpenAI e Codex della famiglia GPT-5. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili OpenAI">
    OpenClaw tratta gli endpoint OpenAI diretti, Codex e Azure OpenAI in modo diverso rispetto ai proxy generici compatibili OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano OpenAI `none` effort
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano gli schemi degli strumenti in modalità strict per impostazione predefinita
    - Allegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono la formattazione delle richieste riservata a OpenAI (`service_tier`, `store`, reasoning-compat, suggerimenti prompt-cache)

    **Percorsi proxy/compatibili:**
    - Usano comportamento di compat più permissivo
    - Rimuovono `store` di Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili OpenAI
    - Accettano `params.chat_template_kwargs` per proxy Completions compatibili OpenAI come vLLM
    - Non forzano schemi strict degli strumenti né header solo-nativi

    Azure OpenAI usa comportamento di transport e compat nativi ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, model ref e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e auth" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riuso delle credenziali.
  </Card>
</CardGroup>
