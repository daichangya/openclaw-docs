---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con sottoscrizione Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usare OpenAI tramite chiavi API o sottoscrizione Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T13:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 576a453f42fff8d90837ebee3894443c37f177c611c134113944fbf0d11c2455
    source_path: providers/openai.md
    workflow: 15
---

OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta tre percorsi della famiglia OpenAI. Il prefisso del modello seleziona il percorso:

- **Chiave API** — accesso diretto a OpenAI Platform con fatturazione a consumo (modelli `openai/*`)
- **Sottoscrizione Codex tramite Pi** — accesso ChatGPT/Codex con abbonamento (`openai-codex/*` modelli)
- **Harness app-server Codex** — esecuzione nativa dell'app-server Codex (modelli `openai/*` più `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI supporta esplicitamente l'uso di OAuth della sottoscrizione in strumenti e flussi di lavoro esterni come OpenClaw.

Provider, modello, runtime e canale sono livelli separati. Se queste etichette si stanno
confondendo, leggi [Agent runtimes](/it/concepts/agent-runtimes) prima di
modificare la configurazione.

## Scelta rapida

| Obiettivo                                     | Usa                                                      | Note                                                                         |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Fatturazione diretta con chiave API           | `openai/gpt-5.4`                                         | Imposta `OPENAI_API_KEY` o esegui l'onboarding della chiave API OpenAI.      |
| GPT-5.5 con autenticazione tramite sottoscrizione ChatGPT/Codex | `openai-codex/gpt-5.5`                                   | Percorso Pi predefinito per OAuth Codex. Migliore prima scelta per configurazioni con sottoscrizione. |
| GPT-5.5 con comportamento nativo app-server Codex | `openai/gpt-5.5` più `embeddedHarness.runtime: "codex"` | Usa l'harness app-server Codex, non il percorso API pubblico OpenAI.         |
| Generazione o modifica di immagini            | `openai/gpt-image-2`                                     | Funziona sia con `OPENAI_API_KEY` sia con OpenAI Codex OAuth.                |

<Note>
GPT-5.5 è attualmente disponibile in OpenClaw tramite percorsi di sottoscrizione/OAuth:
`openai-codex/gpt-5.5` con il runner PI, oppure `openai/gpt-5.5` con
l'harness app-server Codex. L'accesso diretto con chiave API a `openai/gpt-5.5` è
supportato quando OpenAI abiliterà GPT-5.5 sull'API pubblica; fino ad allora usa un
modello abilitato per API come `openai/gpt-5.4` per configurazioni con `OPENAI_API_KEY`.
</Note>

<Note>
Abilitare il Plugin OpenAI, o selezionare un modello `openai-codex/*`, non
abilita il Plugin app-server Codex incluso. OpenClaw abilita quel Plugin solo
quando selezioni esplicitamente l'harness Codex nativo con
`embeddedHarness.runtime: "codex"` o usi un ref di modello legacy `codex/*`.
</Note>

## Copertura delle funzionalità OpenClaw

| Capacità OpenAI            | Superficie OpenClaw                                        | Stato                                                  |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses           | provider di modelli `openai/<model>`                       | Sì                                                     |
| Modelli con sottoscrizione Codex | `openai-codex/<model>` con OAuth `openai-codex`     | Sì                                                     |
| Harness app-server Codex   | `openai/<model>` con `embeddedHarness.runtime: codex`      | Sì                                                     |
| Web search lato server     | Strumento nativo OpenAI Responses                          | Sì, quando la web search è abilitata e nessun provider è fissato |
| Immagini                   | `image_generate`                                           | Sì                                                     |
| Video                      | `video_generate`                                           | Sì                                                     |
| Text-to-speech             | `messages.tts.provider: "openai"` / `tts`                  | Sì                                                     |
| Speech-to-text batch       | `tools.media.audio` / comprensione dei media               | Sì                                                     |
| Speech-to-text in streaming | Voice Call `streaming.provider: "openai"`                 | Sì                                                     |
| Voce realtime              | Voice Call `realtime.provider: "openai"` / Talk di Control UI | Sì                                                  |
| Embedding                  | provider di embedding della memoria                        | Sì                                                     |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API (OpenAI Platform)">
    **Ideale per:** accesso API diretto e fatturazione a consumo.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API dalla [dashboard OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Esegui l'onboarding">
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

    | Ref del modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Futuro percorso API diretto quando OpenAI abiliterà GPT-5.5 sull'API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` è il percorso diretto con chiave API OpenAI a meno che tu non forzi esplicitamente
    l'harness app-server Codex. GPT-5.5 al momento è solo sottoscrizione/OAuth;
    usa `openai-codex/*` per Codex OAuth tramite il runner PI predefinito, oppure
    usa `openai/gpt-5.5` con `embeddedHarness.runtime: "codex"` per l'esecuzione
    nativa dell'app-server Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark`. Le richieste API OpenAI live rifiutano quel modello e nemmeno l'attuale catalogo Codex lo espone.
    </Warning>

  </Tab>

  <Tab title="Sottoscrizione Codex">
    **Ideale per:** usare la tua sottoscrizione ChatGPT/Codex invece di una chiave API separata. Codex cloud richiede l'accesso a ChatGPT.

    <Steps>
      <Step title="Esegui OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Oppure esegui direttamente OAuth:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Per configurazioni headless o ostili al callback, aggiungi `--device-code` per accedere con un flusso ChatGPT device-code invece del callback browser su localhost:

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

    | Ref del modello | Percorso | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex tramite PI | Accesso Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | Auth app-server Codex |

    <Note>
    Continua a usare l'id provider `openai-codex` per i comandi auth/profilo. Il
    prefisso del modello `openai-codex/*` è anche il percorso PI esplicito per Codex OAuth.
    Non seleziona né auto-abilita l'harness app-server Codex incluso.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    L'onboarding non importa più materiale OAuth da `~/.codex`. Esegui l'accesso con OAuth nel browser (predefinito) o con il flusso device-code sopra — OpenClaw gestisce le credenziali risultanti nel proprio store auth dell'agente.
    </Note>

    ### Indicatore di stato

    In chat `/status` mostra quale runtime del modello è attivo per la sessione corrente.
    L'harness PI predefinito appare come `Runtime: OpenClaw Pi Default`. Quando
    viene selezionato l'harness app-server Codex incluso, `/status` mostra
    `Runtime: OpenAI Codex`. Le sessioni esistenti mantengono il loro harness id registrato, quindi usa
    `/new` o `/reset` dopo aver cambiato `embeddedHarness` se vuoi che `/status` rifletta
    una nuova scelta PI/Codex.

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto a runtime come valori separati.

    Per `openai-codex/gpt-5.5` tramite Codex OAuth:

    - `contextWindow` nativo: `1000000`
    - Limite predefinito `contextTokens` a runtime: `272000`

    Il limite predefinito più piccolo ha in pratica migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

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
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto a runtime.
    </Note>

    ### Recupero del catalogo

    OpenClaw usa i metadati del catalogo Codex upstream per `gpt-5.5` quando
    presenti. Se la discovery live di Codex omette la riga `openai-codex/gpt-5.5` mentre
    l'account è autenticato, OpenClaw sintetizza quella riga di modello OAuth così
    cron, subagente ed esecuzioni con modello predefinito configurato non falliscono con
    `Unknown model`.

  </Tab>
</Tabs>

## Generazione di immagini

Il Plugin `openai` incluso registra la generazione di immagini tramite lo strumento `image_generate`.
Supporta sia la generazione di immagini OpenAI con chiave API sia la generazione
tramite Codex OAuth attraverso lo stesso ref di modello `openai/gpt-image-2`.

| Capacità                  | Chiave API OpenAI                  | Codex OAuth                         |
| ------------------------- | ---------------------------------- | ----------------------------------- |
| Ref del modello           | `openai/gpt-image-2`               | `openai/gpt-image-2`                |
| Auth                      | `OPENAI_API_KEY`                   | Accesso OpenAI Codex OAuth          |
| Trasporto                 | API Images di OpenAI               | Backend Codex Responses             |
| Immagini massime per richiesta | 4                             | 4                                   |
| Modalità modifica         | Abilitata (fino a 5 immagini di riferimento) | Abilitata (fino a 5 immagini di riferimento) |
| Override dimensione       | Supportati, incluse dimensioni 2K/4K | Supportati, incluse dimensioni 2K/4K |
| Aspect ratio / resolution | Non inoltrati all'API OpenAI Images | Mappati a una dimensione supportata quando sicuro |

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
Vedi [Image Generation](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

`gpt-image-2` è il predefinito sia per la generazione text-to-image di OpenAI sia per la modifica di immagini. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi flussi di lavoro immagine OpenAI dovrebbero usare `openai/gpt-image-2`.

Per le installazioni con Codex OAuth, mantieni lo stesso ref `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw risolve quel token di accesso OAuth memorizzato
e invia le richieste di immagini tramite il backend Codex Responses. Non prova
prima `OPENAI_API_KEY` né effettua un fallback silenzioso a una chiave API per quella
richiesta. Configura `models.providers.openai` esplicitamente con una chiave API,
base URL personalizzato o endpoint Azure quando vuoi invece il percorso diretto dell'API OpenAI Images.
Se quell'endpoint immagine personalizzato si trova su un indirizzo trusted di LAN/rete privata, imposta anche
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw mantiene
bloccati gli endpoint di immagini compatibili con OpenAI privati/interni a meno che questo opt-in
non sia presente.

Generare:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Modificare:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il Plugin incluso `openai` registra la generazione video tramite lo strumento `video_generate`.

| Capacità         | Valore                                                                            |
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
Vedi [Video Generation](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo condiviso al prompt GPT-5 per le esecuzioni della famiglia GPT-5 tra provider. Si applica in base all'id del modello, quindi `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` e altri ref GPT-5 compatibili ricevono lo stesso overlay. I modelli GPT-4.x più vecchi no.

L'harness Codex nativo incluso usa lo stesso comportamento GPT-5 e lo stesso overlay Heartbeat tramite le istruzioni sviluppatore dell'app-server Codex, quindi le sessioni `openai/gpt-5.x` forzate tramite `embeddedHarness.runtime: "codex"` mantengono la stessa guida proattiva su follow-through e Heartbeat anche se Codex possiede il resto del prompt dell'harness.

Il contributo GPT-5 aggiunge un contratto di comportamento etichettato per persistenza della persona, sicurezza dell'esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento specifico del canale per risposte e messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nella policy di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Valore                 | Effetto                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (predefinito) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias per `"friendly"`                       |
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
Il legacy `plugins.entries.openai.config.personality` viene ancora letto come fallback di compatibilità quando l'impostazione condivisa `agents.defaults.promptOverlays.gpt5.personality` non è impostata.
</Note>

## Voce e speech

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il Plugin incluso `openai` registra la sintesi vocale per la superficie `messages.tts`.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostata) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostate, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per note vocali, `mp3` per file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere il base URL TTS senza influenzare l'endpoint API della chat.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Il Plugin incluso `openai` registra lo speech-to-text batch tramite
    la superficie di trascrizione della comprensione dei media di OpenClaw.

    - Modello predefinito: `gpt-4o-transcribe`
    - Endpoint: REST OpenAI `/v1/audio/transcriptions`
    - Percorso di input: caricamento file audio multipart
    - Supportato da OpenClaw ovunque la trascrizione audio in ingresso usi
      `tools.media.audio`, inclusi segmenti di canale vocale Discord e allegati
      audio dei canali

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
    configurazione media audio condivisa o da una richiesta di trascrizione per chiamata.

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il Plugin incluso `openai` registra la trascrizione realtime per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Lingua | `...openai.language` | (non impostata) |
    | Prompt | `...openai.prompt` | (non impostato) |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Questo provider di streaming è per il percorso di trascrizione realtime di Voice Call; la voce Discord attualmente registra segmenti brevi e usa invece il percorso batch di trascrizione `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il Plugin incluso `openai` registra la voce realtime per il Plugin Voice Call.

    | Impostazione | Percorso di configurazione | Predefinito |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Usa `OPENAI_API_KEY` come fallback |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta le chiamate agli strumenti bidirezionali. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Il provider incluso `openai` può puntare a una risorsa Azure OpenAI per la
generazione di immagini sovrascrivendo il base URL. Sul percorso di generazione immagini, OpenClaw
rileva gli hostname Azure in `models.providers.openai.baseUrl` e passa
automaticamente alla forma di richiesta di Azure.

<Note>
La voce realtime usa un percorso di configurazione separato
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e non è influenzata da `models.providers.openai.baseUrl`. Vedi l'accordion **Voce
realtime** sotto [Voce e speech](#voice-and-speech) per le sue impostazioni
Azure.
</Note>

Usa Azure OpenAI quando:

- Hai già una sottoscrizione, quota o contratto enterprise Azure OpenAI
- Hai bisogno di residenza dei dati regionale o controlli di conformità forniti da Azure
- Vuoi mantenere il traffico all'interno di una tenancy Azure esistente

### Configurazione

Per la generazione di immagini Azure tramite il provider incluso `openai`, punta
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

OpenClaw riconosce questi suffissi host Azure per il percorso Azure di generazione immagini:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Per le richieste di generazione immagini su un host Azure riconosciuto, OpenClaw:

- Invia l'header `api-key` invece di `Authorization: Bearer`
- Usa percorsi con ambito deployment (`/openai/deployments/{deployment}/...`)
- Aggiunge `?api-version=...` a ogni richiesta

Gli altri base URL (OpenAI pubblico, proxy compatibili con OpenAI) mantengono la forma standard
della richiesta immagine OpenAI.

<Note>
L'instradamento Azure per il percorso di generazione immagini del provider `openai` richiede
OpenClaw 2026.4.22 o successivo. Le versioni precedenti trattano qualsiasi
`openai.baseUrl` personalizzato come l'endpoint OpenAI pubblico e falliranno contro i deployment
immagine di Azure.
</Note>

### Versione API

Imposta `AZURE_OPENAI_API_VERSION` per fissare una specifica versione Azure preview o GA
per il percorso di generazione immagini Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Il predefinito è `2024-12-01-preview` quando la variabile non è impostata.

### I nomi dei modelli sono nomi di deployment

Azure OpenAI lega i modelli ai deployment. Per le richieste Azure di generazione immagini
instradate tramite il provider incluso `openai`, il campo `model` in OpenClaw
deve essere il **nome del deployment Azure** che hai configurato nel portale Azure, non
l'id pubblico del modello OpenAI.

Se crei un deployment chiamato `gpt-image-2-prod` che serve `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

La stessa regola del nome del deployment si applica alle chiamate di generazione immagini instradate tramite
il provider incluso `openai`.

### Disponibilità regionale

La generazione di immagini Azure è attualmente disponibile solo in un sottoinsieme di regioni
(per esempio `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Controlla l'elenco aggiornato delle regioni Microsoft prima di creare un
deployment e conferma che il modello specifico sia offerto nella tua regione.

### Differenze dei parametri

Azure OpenAI e OpenAI pubblico non accettano sempre gli stessi parametri immagine.
Azure può rifiutare opzioni che OpenAI pubblico consente (per esempio certi
valori `background` su `gpt-image-2`) oppure esporle solo su specifiche versioni
del modello. Queste differenze provengono da Azure e dal modello sottostante, non da
OpenClaw. Se una richiesta Azure fallisce con un errore di validazione, controlla
l'insieme di parametri supportati dal tuo specifico deployment e dalla versione API nel
portale Azure.

<Note>
Azure OpenAI usa trasporto nativo e comportamento compat, ma non riceve
gli header di attribuzione nascosti di OpenClaw — vedi l'accordion **Percorsi nativi vs compatibili con OpenAI**
sotto [Configurazione avanzata](#advanced-configuration).

Per traffico chat o Responses su Azure (oltre la generazione immagini), usa il
flusso di onboarding o una configurazione provider Azure dedicata — `openai.baseUrl` da solo
non adotta la forma API/auth di Azure. Esiste un provider separato
`azure-openai-responses/*`; vedi
l'accordion Server-side compaction qui sotto.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa prima WebSocket con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - Ritenta un errore WebSocket iniziale prima di passare a SSE
    - Dopo un errore, contrassegna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - Collega header stabili di identità di sessione e turno per retry e riconnessioni
    - Normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

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
            "openai/gpt-5.4": {
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
    OpenClaw abilita il warm-up WebSocket per impostazione predefinita per `openai/*` e `openai-codex/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita il warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modalità veloce">
    OpenClaw espone un toggle condiviso per la modalità veloce per `openai/*` e `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando abilitata, OpenClaw mappa la modalità veloce al processamento prioritario di OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` o `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno priorità sulla configurazione. Cancellare l'override di sessione nella UI Sessions riporta la sessione al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritario (service_tier)">
    L'API di OpenAI espone il processamento prioritario tramite `service_tier`. Impostalo per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valori supportati: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` viene inoltrato solo agli endpoint OpenAI nativi (`api.openai.com`) e agli endpoint Codex nativi (`chatgpt.com/backend-api`). Se instradi uno dei due provider tramite un proxy, OpenClaw lascia `service_tier` invariato.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Per i modelli diretti OpenAI Responses (`openai/*` su `api.openai.com`), il wrapper di stream Pi-harness del Plugin OpenAI abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che il compat del modello non imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    Questo si applica al percorso Pi harness integrato e agli hook provider OpenAI usati dalle esecuzioni incorporate. L'harness app-server Codex nativo gestisce il proprio contesto tramite Codex ed è configurato separatamente con `agents.defaults.embeddedHarness.runtime`.

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
                "openai/gpt-5.4": {
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
                "openai/gpt-5.4": {
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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli diretti OpenAI Responses continuano comunque a forzare `store: true` a meno che il compat non imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*`, OpenClaw può usare un contratto di esecuzione incorporato più rigoroso:

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
    - Non tratta più un turno solo-piano come progresso riuscito quando è disponibile un'azione con strumento
    - Riprova il turno con un'indicazione act-now
    - Abilita automaticamente `update_plan` per lavoro sostanziale
    - Mostra uno stato esplicito di blocco se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni OpenAI e Codex della famiglia GPT-5. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso dai proxy generici compatibili con OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort `none` di OpenAI
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano gli schemi degli strumenti in modalità strict per impostazione predefinita
    - Collegano header di attribuzione nascosti solo su host nativi verificati
    - Mantengono il request shaping solo OpenAI (`service_tier`, `store`, compat reasoning, suggerimenti per prompt-cache)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Rimuovono `store` delle Completions dai payload `openai-completions` non nativi
    - Accettano JSON pass-through avanzato `params.extra_body`/`params.extraBody` per proxy Completions compatibili con OpenAI
    - Non forzano schemi di strumenti strict né header solo nativi

    Azure OpenAI usa trasporto nativo e comportamento compat ma non riceve gli header di attribuzione nascosti.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riuso delle credenziali.
  </Card>
</CardGroup>
