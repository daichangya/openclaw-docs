---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con abbonamento Codex invece delle chiavi API
    - Ti serve un comportamento di esecuzione dell'agente GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-22T04:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692615b77885c0387d339d47c02ff056ba95d3608aa681882893a46d2a0f723f
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fornisce API per sviluppatori per i modelli GPT. OpenClaw supporta due percorsi di autenticazione:

- **Chiave API** — accesso diretto alla piattaforma OpenAI con fatturazione a consumo (modelli `openai/*`)
- **Abbonamento Codex** — accesso con login ChatGPT/Codex tramite abbonamento (modelli `openai-codex/*`)

OpenAI supporta esplicitamente l'uso di OAuth dell'abbonamento in strumenti e flussi di lavoro esterni come OpenClaw.

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

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

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | API diretta OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | API diretta OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Il login ChatGPT/Codex viene instradato tramite `openai-codex/*`, non `openai/*`.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **non** espone `openai/gpt-5.3-codex-spark` sul percorso API diretto. Le richieste API OpenAI live rifiutano quel modello. Spark è solo Codex.
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
      </Step>
      <Step title="Imposta il modello predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Riepilogo del percorso

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | login Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | login Codex (dipende dai diritti disponibili) |

    <Note>
    Questo percorso è intenzionalmente separato da `openai/gpt-5.4`. Usa `openai/*` con una chiave API per accesso diretto alla Platform, e `openai-codex/*` per accesso tramite abbonamento Codex.
    </Note>

    ### Esempio di configurazione

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    Se l'onboarding riutilizza un login esistente della CLI Codex, quelle credenziali restano gestite dalla CLI Codex. Alla scadenza, OpenClaw rilegge prima la fonte esterna Codex e riscrive la credenziale aggiornata nello storage Codex.
    </Tip>

    ### Limite della finestra di contesto

    OpenClaw tratta i metadati del modello e il limite di contesto runtime come valori separati.

    Per `openai-codex/gpt-5.4`:

    - `contextWindow` nativo: `1050000`
    - limite predefinito runtime `contextTokens`: `272000`

    Il limite predefinito più piccolo ha in pratica migliori caratteristiche di latenza e qualità. Sovrascrivilo con `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Usa `contextWindow` per dichiarare i metadati nativi del modello. Usa `contextTokens` per limitare il budget di contesto runtime.
    </Note>

  </Tab>
</Tabs>

## Generazione immagini

Il plugin bundled `openai` registra la generazione immagini tramite lo strumento `image_generate`.

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| Default model             | `openai/gpt-image-2`               |
| Max images per request    | 4                                  |
| Edit mode                 | Enabled (up to 5 reference images) |
| Size overrides            | Supported, including 2K/4K sizes   |
| Aspect ratio / resolution | Not forwarded to OpenAI Images API |

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
Vedi [Generazione immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

`gpt-image-2` è il valore predefinito sia per la generazione di immagini da testo OpenAI sia per il fotoritocco. `gpt-image-1` resta utilizzabile come override esplicito del modello, ma i nuovi flussi di lavoro OpenAI per le immagini dovrebbero usare `openai/gpt-image-2`.

Genera:

```
/tool image_generate model=openai/gpt-image-2 prompt="Un poster di lancio rifinito per OpenClaw su macOS" size=3840x2160 count=1
```

Modifica:

```
/tool image_generate model=openai/gpt-image-2 prompt="Mantieni la forma dell'oggetto, cambia il materiale in vetro traslucido" image=/path/to/reference.png size=1024x1536
```

## Generazione video

Il plugin bundled `openai` registra la generazione video tramite lo strumento `video_generate`.

| Capability       | Value                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                   |
| Modes            | Da testo a video, da immagine a video, modifica di un singolo video               |
| Reference inputs | 1 immagine o 1 video                                                              |
| Size overrides   | Supportati                                                                        |
| Other overrides  | `aspectRatio`, `resolution`, `audio`, `watermark` vengono ignorati con un avviso dello strumento |

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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Contributo al prompt GPT-5

OpenClaw aggiunge un contributo al prompt GPT-5 specifico per OpenAI per le esecuzioni della famiglia GPT-5 `openai/*` e `openai-codex/*`. Si trova nel plugin OpenAI bundled, si applica a ID modello come `gpt-5`, `gpt-5.2`, `gpt-5.4` e `gpt-5.4-mini` e non si applica ai modelli GPT-4.x meno recenti.

Il contributo GPT-5 aggiunge un contratto di comportamento taggato per persistenza della persona, sicurezza di esecuzione, disciplina degli strumenti, forma dell'output, controlli di completamento e verifica. Il comportamento di risposta specifico del canale e dei messaggi silenziosi resta nel prompt di sistema condiviso di OpenClaw e nel criterio di consegna in uscita. La guida GPT-5 è sempre abilitata per i modelli corrispondenti. Il livello di stile di interazione amichevole è separato e configurabile.

| Value                  | Effect                                               |
| ---------------------- | ---------------------------------------------------- |
| `"friendly"` (default) | Abilita il livello di stile di interazione amichevole |
| `"on"`                 | Alias per `"friendly"`                               |
| `"off"`                | Disabilita solo il livello di stile amichevole       |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
I valori non distinguono tra maiuscole e minuscole a runtime, quindi sia `"Off"` sia `"off"` disabilitano il livello di stile amichevole.
</Tip>

## Voce e parlato

<AccordionGroup>
  <Accordion title="Sintesi vocale (TTS)">
    Il plugin bundled `openai` registra la sintesi vocale per la superficie `messages.tts`.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modello | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voce | `messages.tts.providers.openai.voice` | `coral` |
    | Velocità | `messages.tts.providers.openai.speed` | (non impostato) |
    | Istruzioni | `messages.tts.providers.openai.instructions` | (non impostato, solo `gpt-4o-mini-tts`) |
    | Formato | `messages.tts.providers.openai.responseFormat` | `opus` per le note vocali, `mp3` per i file |
    | Chiave API | `messages.tts.providers.openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |
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
    Imposta `OPENAI_TTS_BASE_URL` per sovrascrivere il base URL TTS senza influenzare l'endpoint API chat.
    </Note>

  </Accordion>

  <Accordion title="Trascrizione realtime">
    Il plugin bundled `openai` registra la trascrizione realtime per il plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `800` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Chiave API | `...openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |

    <Note>
    Usa una connessione WebSocket a `wss://api.openai.com/v1/realtime` con audio G.711 u-law.
    </Note>

  </Accordion>

  <Accordion title="Voce realtime">
    Il plugin bundled `openai` registra la voce realtime per il plugin Voice Call.

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Modello | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voce | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Soglia VAD | `...openai.vadThreshold` | `0.5` |
    | Durata del silenzio | `...openai.silenceDurationMs` | `500` |
    | Chiave API | `...openai.apiKey` | Usa come fallback `OPENAI_API_KEY` |

    <Note>
    Supporta Azure OpenAI tramite le chiavi di configurazione `azureEndpoint` e `azureDeployment`. Supporta il tool calling bidirezionale. Usa il formato audio G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Trasporto (WebSocket vs SSE)">
    OpenClaw usa WebSocket-first con fallback SSE (`"auto"`) sia per `openai/*` sia per `openai-codex/*`.

    In modalità `"auto"`, OpenClaw:
    - ritenta un errore WebSocket iniziale prima di ricadere su SSE
    - dopo un errore, segna WebSocket come degradato per ~60 secondi e usa SSE durante il cool-down
    - allega header stabili di identità della sessione e del turno per retry e riconnessioni
    - normalizza i contatori di utilizzo (`input_tokens` / `prompt_tokens`) tra le varianti di trasporto

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (default) | Prima WebSocket, fallback SSE |
    | `"sse"` | Forza solo SSE |
    | `"websocket"` | Forza solo WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentazione OpenAI correlata:
    - [Realtime API con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming delle risposte API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Warm-up WebSocket">
    OpenClaw abilita per impostazione predefinita il warm-up WebSocket per `openai/*` per ridurre la latenza del primo turno.

    ```json5
    // Disabilita warm-up
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
    OpenClaw espone un toggle condiviso della modalità veloce sia per `openai/*` sia per `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando è abilitata, OpenClaw mappa la modalità veloce all'elaborazione prioritaria OpenAI (`service_tier = "priority"`). I valori `service_tier` esistenti vengono preservati e la modalità veloce non riscrive `reasoning` né `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Gli override di sessione hanno la precedenza sulla configurazione. Cancellando l'override di sessione nell'interfaccia Sessions, la sessione torna al valore predefinito configurato.
    </Note>

  </Accordion>

  <Accordion title="Elaborazione prioritaria (service_tier)">
    L'API OpenAI espone l'elaborazione prioritaria tramite `service_tier`. Impostala per modello in OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
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

  <Accordion title="Compaction lato server (Responses API)">
    Per i modelli OpenAI Responses diretti (`openai/*` su `api.openai.com`), OpenClaw abilita automaticamente la Compaction lato server:

    - Forza `store: true` (a meno che la compat del modello imposti `supportsStore: false`)
    - Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` predefinito: 70% di `contextWindow` (oppure `80000` quando non disponibile)

    <Tabs>
      <Tab title="Abilita esplicitamente">
        Utile per endpoint compatibili come Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
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
    `responsesServerCompaction` controlla solo l'iniezione di `context_management`. I modelli OpenAI Responses diretti continuano comunque a forzare `store: true` a meno che la compat imposti `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modalità GPT agentica rigorosa">
    Per le esecuzioni della famiglia GPT-5 su `openai/*` e `openai-codex/*`, OpenClaw può usare un contratto di esecuzione embedded più rigoroso:

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
    - Non considera più un turno solo piano come progresso riuscito quando è disponibile un'azione di strumento
    - Ritenta il turno con uno steer act-now
    - Abilita automaticamente `update_plan` per il lavoro sostanziale
    - Mostra uno stato bloccato esplicito se il modello continua a pianificare senza agire

    <Note>
    Limitato solo alle esecuzioni della famiglia GPT-5 di OpenAI e Codex. Gli altri provider e le famiglie di modelli più vecchie mantengono il comportamento predefinito.
    </Note>

  </Accordion>

  <Accordion title="Percorsi nativi vs compatibili con OpenAI">
    OpenClaw tratta gli endpoint OpenAI diretti, Codex e Azure OpenAI in modo diverso dai proxy generici compatibili OpenAI `/v1`:

    **Percorsi nativi** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Mantengono `reasoning: { effort: "none" }` solo per i modelli che supportano l'effort OpenAI `none`
    - Omettono il reasoning disabilitato per modelli o proxy che rifiutano `reasoning.effort: "none"`
    - Impostano per default gli schemi degli strumenti in modalità strict
    - Allegano header nascosti di attribuzione solo su host nativi verificati
    - Mantengono il request shaping solo OpenAI (`service_tier`, `store`, reasoning-compat, hint di prompt-cache)

    **Percorsi proxy/compatibili:**
    - Usano un comportamento compat più permissivo
    - Non forzano schemi strict degli strumenti né header solo nativi

    Azure OpenAI usa il trasporto nativo e il comportamento compat nativo, ma non riceve gli header nascosti di attribuzione.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, model ref e comportamento di failover.
  </Card>
  <Card title="Generazione immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli auth e regole di riutilizzo delle credenziali.
  </Card>
</CardGroup>
