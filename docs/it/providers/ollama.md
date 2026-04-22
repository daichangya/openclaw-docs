---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di indicazioni per la configurazione e l'impostazione di Ollama
    - Vuoi modelli vision di Ollama per la comprensione delle immagini
summary: Esegui OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T08:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw si integra con l'API nativa di Ollama (`/api/chat`) per modelli cloud ospitati e server Ollama locali/self-hosted. Puoi usare Ollama in tre modalità: `Cloud + Local` tramite un host Ollama raggiungibile, `Cloud only` contro `https://ollama.com`, oppure `Local only` contro un host Ollama raggiungibile.

<Warning>
**Utenti di Ollama remoto**: non usare l'URL compatibile OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Questo interrompe la chiamata degli strumenti e i modelli potrebbero produrre JSON grezzo degli strumenti come testo normale. Usa invece l'URL dell'API nativa di Ollama: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

## Per iniziare

Scegli il metodo e la modalità di configurazione che preferisci.

<Tabs>
  <Tab title="Onboarding (consigliato)">
    **Ideale per:** il percorso più rapido verso una configurazione funzionante di Ollama cloud o locale.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard
        ```

        Seleziona **Ollama** dall'elenco dei provider.
      </Step>
      <Step title="Scegli la modalità">
        - **Cloud + Local** — host Ollama locale più modelli cloud instradati tramite quell'host
        - **Cloud only** — modelli Ollama ospitati tramite `https://ollama.com`
        - **Local only** — solo modelli locali
      </Step>
      <Step title="Seleziona un modello">
        `Cloud only` richiede `OLLAMA_API_KEY` e suggerisce impostazioni predefinite cloud ospitate. `Cloud + Local` e `Local only` richiedono un URL base Ollama, individuano i modelli disponibili e scaricano automaticamente il modello locale selezionato se non è ancora disponibile. `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'uso cloud.
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Modalità non interattiva

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Facoltativamente, specifica un URL base o un modello personalizzato:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configurazione manuale">
    **Ideale per:** controllo completo sulla configurazione cloud o locale.

    <Steps>
      <Step title="Scegli cloud o locale">
        - **Cloud + Local**: installa Ollama, accedi con `ollama signin` e instrada le richieste cloud tramite quell'host
        - **Cloud only**: usa `https://ollama.com` con un `OLLAMA_API_KEY`
        - **Local only**: installa Ollama da [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Scarica un modello locale (solo locale)">
        ```bash
        ollama pull gemma4
        # oppure
        ollama pull gpt-oss:20b
        # oppure
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Abilita Ollama per OpenClaw">
        Per `Cloud only`, usa il tuo vero `OLLAMA_API_KEY`. Per le configurazioni basate su host, va bene qualsiasi valore segnaposto:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Solo locale
        export OLLAMA_API_KEY="ollama-local"

        # Oppure configura nel file di configurazione
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Esamina e imposta il modello">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Oppure imposta il valore predefinito nella configurazione:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modelli cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` usa un host Ollama raggiungibile come punto di controllo sia per i modelli locali sia per quelli cloud. Questo è il flusso ibrido preferito da Ollama.

    Usa **Cloud + Local** durante la configurazione. OpenClaw richiede l'URL base di Ollama, individua i modelli locali da quell'host e controlla se l'host ha effettuato l'accesso per l'accesso cloud con `ollama signin`. Quando l'host ha effettuato l'accesso, OpenClaw suggerisce anche impostazioni predefinite cloud ospitate come `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se l'host non ha ancora effettuato l'accesso, OpenClaw mantiene la configurazione in modalità solo locale finché non esegui `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` viene eseguito contro l'API ospitata di Ollama su `https://ollama.com`.

    Usa **Cloud only** durante la configurazione. OpenClaw richiede `OLLAMA_API_KEY`, imposta `baseUrl: "https://ollama.com"` e inizializza l'elenco dei modelli cloud ospitati. Questo percorso **non** richiede un server Ollama locale né `ollama signin`.

    L'elenco dei modelli cloud mostrato durante `openclaw onboard` viene popolato in tempo reale da `https://ollama.com/api/tags`, con un limite di 500 voci, in modo che il selettore rifletta il catalogo ospitato corrente anziché un seed statico. Se `ollama.com` non è raggiungibile o non restituisce modelli al momento della configurazione, OpenClaw torna ai suggerimenti hardcoded precedenti così l'onboarding può comunque completarsi.

  </Tab>

  <Tab title="Local only">
    In modalità solo locale, OpenClaw individua i modelli dall'istanza Ollama configurata. Questo percorso è pensato per server Ollama locali o self-hosted.

    OpenClaw al momento suggerisce `gemma4` come valore predefinito locale.

  </Tab>
</Tabs>

## Individuazione dei modelli (provider implicito)

Quando imposti `OLLAMA_API_KEY` (o un profilo di autenticazione) e **non** definisci `models.providers.ollama`, OpenClaw individua i modelli dall'istanza Ollama locale su `http://127.0.0.1:11434`.

| Comportamento        | Dettaglio                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query del catalogo   | Interroga `/api/tags`                                                                                                                                                  |
| Rilevamento capacità | Usa ricerche `/api/show` best-effort per leggere `contextWindow` e rilevare le capacità (inclusa la vision)                                                           |
| Modelli vision       | I modelli con capacità `vision` riportata da `/api/show` sono contrassegnati come compatibili con immagini (`input: ["text", "image"]`), quindi OpenClaw inserisce automaticamente le immagini nel prompt |
| Rilevamento reasoning | Contrassegna `reasoning` con un'euristica sul nome del modello (`r1`, `reasoning`, `think`)                                                                           |
| Limiti di token      | Imposta `maxTokens` sul limite massimo di token predefinito di Ollama usato da OpenClaw                                                                                |
| Costi                | Imposta tutti i costi a `0`                                                                                                                                            |

Questo evita voci di modello manuali mantenendo il catalogo allineato con l'istanza Ollama locale.

```bash
# Vedi quali modelli sono disponibili
ollama list
openclaw models list
```

Per aggiungere un nuovo modello, basta scaricarlo con Ollama:

```bash
ollama pull mistral
```

Il nuovo modello verrà individuato automaticamente e sarà disponibile per l'uso.

<Note>
Se imposti esplicitamente `models.providers.ollama`, l'individuazione automatica viene saltata e devi definire i modelli manualmente. Vedi la sezione di configurazione esplicita qui sotto.
</Note>

## Vision e descrizione delle immagini

Il plugin Ollama incluso registra Ollama come provider di comprensione dei media compatibile con le immagini. Questo permette a OpenClaw di instradare richieste esplicite di descrizione di immagini e i valori predefiniti configurati per i modelli di immagini tramite modelli vision Ollama locali o ospitati.

Per la vision locale, scarica un modello che supporti le immagini:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Poi verifica con la CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` deve essere un riferimento completo `<provider/model>`. Quando è impostato, `openclaw infer image describe` esegue direttamente quel modello invece di saltare la descrizione perché il modello supporta la vision nativa.

Per rendere Ollama il modello predefinito di comprensione delle immagini per i media in ingresso, configura `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Se definisci manualmente `models.providers.ollama.models`, contrassegna i modelli vision con il supporto per input immagine:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rifiuta le richieste di descrizione delle immagini per i modelli che non sono contrassegnati come compatibili con le immagini. Con l'individuazione implicita, OpenClaw legge questa informazione da Ollama quando `/api/show` riporta una capacità vision.

## Configurazione

<Tabs>
  <Tab title="Base (individuazione implicita)">
    Il percorso più semplice per abilitare la modalità solo locale è tramite variabile d'ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostato, puoi omettere `apiKey` nella voce del provider e OpenClaw lo compilerà per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usa la configurazione esplicita quando vuoi una configurazione cloud ospitata, Ollama è in esecuzione su un altro host/porta, vuoi forzare specifiche finestre di contesto o elenchi di modelli, oppure vuoi definizioni dei modelli completamente manuali.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="URL base personalizzato">
    Se Ollama è in esecuzione su un host o una porta diversi (la configurazione esplicita disabilita l'individuazione automatica, quindi definisci i modelli manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    Non aggiungere `/v1` all'URL. Il percorso `/v1` usa la modalità compatibile con OpenAI, in cui la chiamata degli strumenti non è affidabile. Usa l'URL base di Ollama senza un suffisso di percorso.
    </Warning>

  </Tab>
</Tabs>

### Selezione del modello

Una volta configurato, tutti i tuoi modelli Ollama sono disponibili:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ricerca Web Ollama

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso.

| Proprietà   | Dettaglio                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa l'host Ollama configurato (`models.providers.ollama.baseUrl` se impostato, altrimenti `http://127.0.0.1:11434`)   |
| Auth        | Senza chiave                                                                                                           |
| Requisito   | Ollama deve essere in esecuzione e con accesso effettuato tramite `ollama signin`                                     |

Scegli **Ollama Web Search** durante `openclaw onboard` o `openclaw configure --section web`, oppure imposta:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Per i dettagli completi su configurazione e comportamento, vedi [Ollama Web Search](/it/tools/ollama-search).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità legacy compatibile con OpenAI">
    <Warning>
    **La chiamata degli strumenti non è affidabile nella modalità compatibile con OpenAI.** Usa questa modalità solo se hai bisogno del formato OpenAI per un proxy e non dipendi dal comportamento nativo della chiamata degli strumenti.
    </Warning>

    Se invece hai bisogno di usare l'endpoint compatibile con OpenAI (per esempio, dietro un proxy che supporta solo il formato OpenAI), imposta esplicitamente `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Questa modalità potrebbe non supportare contemporaneamente streaming e chiamata degli strumenti. Potrebbe essere necessario disabilitare lo streaming con `params: { streaming: false }` nella configurazione del modello.

    Quando `api: "openai-completions"` viene usato con Ollama, OpenClaw inserisce `options.num_ctx` per impostazione predefinita in modo che Ollama non ricada silenziosamente su una finestra di contesto di 4096. Se il tuo proxy/upstream rifiuta campi `options` sconosciuti, disabilita questo comportamento:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Finestre di contesto">
    Per i modelli individuati automaticamente, OpenClaw usa la finestra di contesto riportata da Ollama quando disponibile, altrimenti ricorre alla finestra di contesto predefinita di Ollama usata da OpenClaw.

    Puoi sovrascrivere `contextWindow` e `maxTokens` nella configurazione esplicita del provider:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modelli reasoning">
    OpenClaw tratta per impostazione predefinita come compatibili con il reasoning i modelli con nomi come `deepseek-r1`, `reasoning` o `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Non è necessaria alcuna configurazione aggiuntiva -- OpenClaw li contrassegna automaticamente.

  </Accordion>

  <Accordion title="Costi dei modelli">
    Ollama è gratuito e viene eseguito in locale, quindi tutti i costi dei modelli sono impostati a $0. Questo vale sia per i modelli individuati automaticamente sia per quelli definiti manualmente.
  </Accordion>

  <Accordion title="Embedding della memoria">
    Il plugin Ollama incluso registra un provider di embedding della memoria per
    la [ricerca nella memoria](/it/concepts/memory). Usa l'URL base di Ollama
    configurato e la chiave API.

    | Proprietà      | Valore              |
    | -------------- | ------------------- |
    | Modello predefinito | `nomic-embed-text`  |
    | Auto-pull      | Sì — il modello di embedding viene scaricato automaticamente se non è presente in locale |

    Per selezionare Ollama come provider di embedding per la ricerca nella memoria:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configurazione dello streaming">
    L'integrazione Ollama di OpenClaw usa per impostazione predefinita l'**API nativa di Ollama** (`/api/chat`), che supporta pienamente contemporaneamente lo streaming e la chiamata degli strumenti. Non è necessaria alcuna configurazione speciale.

    Per le richieste native `/api/chat`, OpenClaw inoltra anche il controllo del thinking direttamente a Ollama: `/think off` e `openclaw agent --thinking off` inviano `think: false` al livello superiore, mentre i livelli di thinking diversi da `off` inviano `think: true`.

    <Tip>
    Se hai bisogno di usare l'endpoint compatibile con OpenAI, vedi la sezione "Modalità legacy compatibile con OpenAI" sopra. In quella modalità, streaming e chiamata degli strumenti potrebbero non funzionare contemporaneamente.
    </Tip>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Ollama non rilevato">
    Assicurati che Ollama sia in esecuzione, di aver impostato `OLLAMA_API_KEY` (o un profilo di autenticazione) e di **non** aver definito una voce esplicita `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Verifica che l'API sia accessibile:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Nessun modello disponibile">
    Se il tuo modello non è elencato, scaricalo localmente oppure definiscilo esplicitamente in `models.providers.ollama`.

    ```bash
    ollama list  # Vedi cosa è installato
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Oppure un altro modello
    ```

  </Accordion>

  <Accordion title="Connessione rifiutata">
    Controlla che Ollama sia in esecuzione sulla porta corretta:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Più aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Ollama Web Search" href="/it/tools/ollama-search" icon="magnifying-glass">
    Dettagli completi su configurazione e comportamento per la ricerca web basata su Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
