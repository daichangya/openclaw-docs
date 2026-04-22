---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di indicazioni per la configurazione e il setup di Ollama
    - Vuoi modelli Ollama con capacità visive per la comprensione delle immagini
summary: Esegui OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:27:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw si integra con l'API nativa di Ollama (`/api/chat`) per modelli cloud ospitati e server Ollama locali/self-hosted. Puoi usare Ollama in tre modalità: `Cloud + Local` tramite un host Ollama raggiungibile, `Cloud only` contro `https://ollama.com`, oppure `Local only` contro un host Ollama raggiungibile.

<Warning>
**Utenti Ollama remoti**: non usare l'URL OpenAI-compatibile `/v1` (`http://host:11434/v1`) con OpenClaw. Questo interrompe il tool calling e i modelli potrebbero emettere JSON dei tool grezzi come testo semplice. Usa invece l'URL dell'API nativa di Ollama: `baseUrl: "http://host:11434"` (senza `/v1`).
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
        `Cloud only` richiede `OLLAMA_API_KEY` e suggerisce valori predefiniti cloud ospitati. `Cloud + Local` e `Local only` chiedono un URL base Ollama, rilevano i modelli disponibili e scaricano automaticamente il modello locale selezionato se non è ancora disponibile. `Cloud + Local` verifica anche se quell'host Ollama ha effettuato l'accesso per l'uso cloud.
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

    Facoltativamente specifica un URL base o un modello personalizzato:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configurazione manuale">
    **Ideale per:** pieno controllo sulla configurazione cloud o locale.

    <Steps>
      <Step title="Scegli cloud o locale">
        - **Cloud + Local**: installa Ollama, accedi con `ollama signin` e instrada le richieste cloud tramite quell'host
        - **Cloud only**: usa `https://ollama.com` con `OLLAMA_API_KEY`
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
      <Step title="Ispeziona e imposta il modello">
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

    Usa **Cloud + Local** durante la configurazione. OpenClaw richiede l'URL base di Ollama, rileva i modelli locali da quell'host e verifica se l'host ha effettuato l'accesso per l'accesso cloud con `ollama signin`. Quando l'host ha effettuato l'accesso, OpenClaw suggerisce anche valori predefiniti cloud ospitati come `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud`.

    Se l'host non ha ancora effettuato l'accesso, OpenClaw mantiene la configurazione solo locale finché non esegui `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` viene eseguito contro l'API ospitata di Ollama su `https://ollama.com`.

    Usa **Cloud only** durante la configurazione. OpenClaw richiede `OLLAMA_API_KEY`, imposta `baseUrl: "https://ollama.com"` e inizializza l'elenco dei modelli cloud ospitati. Questo percorso **non** richiede un server Ollama locale né `ollama signin`.

    L'elenco dei modelli cloud mostrato durante `openclaw onboard` viene popolato in tempo reale da `https://ollama.com/api/tags`, con limite di 500 voci, quindi il selettore riflette il catalogo ospitato corrente invece di un elenco statico. Se `ollama.com` non è raggiungibile o non restituisce modelli al momento della configurazione, OpenClaw torna ai precedenti suggerimenti hardcoded così che l'onboarding possa comunque completarsi.

  </Tab>

  <Tab title="Local only">
    In modalità solo locale, OpenClaw rileva i modelli dall'istanza Ollama configurata. Questo percorso è pensato per server Ollama locali o self-hosted.

    OpenClaw attualmente suggerisce `gemma4` come valore predefinito locale.

  </Tab>
</Tabs>

## Rilevamento dei modelli (provider implicito)

Quando imposti `OLLAMA_API_KEY` (o un profilo auth) e **non** definisci `models.providers.ollama`, OpenClaw rileva i modelli dall'istanza Ollama locale su `http://127.0.0.1:11434`.

| Comportamento         | Dettaglio                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query del catalogo    | Interroga `/api/tags`                                                                                                                                                  |
| Rilevamento capacità  | Usa lookup best-effort su `/api/show` per leggere `contextWindow` e rilevare le capacità (inclusa la visione)                                                         |
| Modelli visivi        | I modelli con capacità `vision` riportata da `/api/show` vengono contrassegnati come compatibili con immagini (`input: ["text", "image"]`), quindi OpenClaw inietta automaticamente le immagini nel prompt |
| Rilevamento reasoning | Contrassegna `reasoning` con un'euristica basata sul nome del modello (`r1`, `reasoning`, `think`)                                                                    |
| Limiti token          | Imposta `maxTokens` al limite massimo di token predefinito di Ollama usato da OpenClaw                                                                                |
| Costi                 | Imposta tutti i costi a `0`                                                                                                                                           |

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

Il nuovo modello verrà rilevato automaticamente e sarà disponibile per l'uso.

<Note>
Se imposti esplicitamente `models.providers.ollama`, il rilevamento automatico viene saltato e devi definire manualmente i modelli. Vedi la sezione sulla configurazione esplicita qui sotto.
</Note>

## Visione e descrizione delle immagini

Il plugin Ollama incluso registra Ollama come provider di comprensione dei media con capacità immagine. Questo consente a OpenClaw di instradare richieste esplicite di descrizione delle immagini e valori predefiniti configurati del modello immagine tramite modelli visivi Ollama locali o ospitati.

Per la visione locale, scarica un modello che supporti le immagini:

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

`--model` deve essere un riferimento completo `<provider/model>`. Quando è impostato, `openclaw infer image describe` esegue direttamente quel modello invece di saltare la descrizione perché il modello supporta la visione nativa.

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

Se definisci manualmente `models.providers.ollama.models`, contrassegna i modelli visivi con supporto per input immagine:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rifiuta richieste di descrizione delle immagini per modelli che non sono contrassegnati come compatibili con immagini. Con il rilevamento implicito, OpenClaw legge questa informazione da Ollama quando `/api/show` riporta una capacità vision.

## Configurazione

<Tabs>
  <Tab title="Base (rilevamento implicito)">
    Il percorso di abilitazione più semplice per solo locale avviene tramite variabile d'ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostato, puoi omettere `apiKey` nella voce provider e OpenClaw lo compilerà per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usa la configurazione esplicita quando vuoi una configurazione cloud ospitata, Ollama viene eseguito su un altro host/porta, vuoi forzare specifiche finestre di contesto o elenchi di modelli, oppure vuoi definizioni di modelli completamente manuali.

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
    Se Ollama è in esecuzione su un host o una porta diversi (la configurazione esplicita disabilita il rilevamento automatico, quindi definisci i modelli manualmente):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Nessun /v1 - usa l'URL dell'API nativa di Ollama
            api: "ollama", // Impostalo esplicitamente per garantire il comportamento nativo di tool-calling
          },
        },
      },
    }
    ```

    <Warning>
    Non aggiungere `/v1` all'URL. Il percorso `/v1` usa la modalità OpenAI-compatibile, in cui il tool calling non è affidabile. Usa l'URL base di Ollama senza suffisso di percorso.
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

## Web Search di Ollama

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso.

| Proprietà   | Dettaglio                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa l'host Ollama configurato (`models.providers.ollama.baseUrl` se impostato, altrimenti `http://127.0.0.1:11434`) |
| Auth        | Senza chiave                                                                                                         |
| Requisito   | Ollama deve essere in esecuzione e aver effettuato l'accesso con `ollama signin`                                    |

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
    **Il tool calling non è affidabile in modalità compatibile con OpenAI.** Usa questa modalità solo se ti serve il formato OpenAI per un proxy e non dipendi dal comportamento nativo del tool calling.
    </Warning>

    Se invece hai bisogno di usare l'endpoint compatibile con OpenAI (per esempio dietro un proxy che supporta solo il formato OpenAI), imposta esplicitamente `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // predefinito: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Questa modalità potrebbe non supportare contemporaneamente streaming e tool calling. Potresti dover disabilitare lo streaming con `params: { streaming: false }` nella configurazione del modello.

    Quando `api: "openai-completions"` viene usato con Ollama, OpenClaw inietta per impostazione predefinita `options.num_ctx` così Ollama non torna silenziosamente a una finestra di contesto di 4096. Se il tuo proxy/upstream rifiuta campi `options` sconosciuti, disabilita questo comportamento:

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
    Per i modelli rilevati automaticamente, OpenClaw usa la finestra di contesto riportata da Ollama quando disponibile, altrimenti torna alla finestra di contesto Ollama predefinita usata da OpenClaw.

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

  <Accordion title="Modelli di reasoning">
    OpenClaw tratta per impostazione predefinita come compatibili con il reasoning i modelli con nomi come `deepseek-r1`, `reasoning` o `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Non è necessaria alcuna configurazione aggiuntiva -- OpenClaw li contrassegna automaticamente.

  </Accordion>

  <Accordion title="Costi dei modelli">
    Ollama è gratuito e viene eseguito localmente, quindi tutti i costi dei modelli sono impostati a $0. Questo vale sia per i modelli rilevati automaticamente sia per quelli definiti manualmente.
  </Accordion>

  <Accordion title="Embedding della memoria">
    Il plugin Ollama incluso registra un provider di embedding della memoria per
    la [ricerca in memoria](/it/concepts/memory). Usa l'URL base Ollama configurato
    e la chiave API.

    | Proprietà      | Valore              |
    | -------------- | ------------------- |
    | Modello predefinito | `nomic-embed-text`  |
    | Auto-pull      | Sì — il modello di embedding viene scaricato automaticamente se non è presente localmente |

    Per selezionare Ollama come provider di embedding per la ricerca in memoria:

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
    L'integrazione Ollama di OpenClaw usa per impostazione predefinita l'**API nativa di Ollama** (`/api/chat`), che supporta completamente streaming e tool calling contemporaneamente. Non è necessaria alcuna configurazione speciale.

    <Tip>
    Se hai bisogno di usare l'endpoint compatibile con OpenAI, vedi la sezione "Modalità legacy compatibile con OpenAI" qui sopra. Streaming e tool calling potrebbero non funzionare contemporaneamente in quella modalità.
    </Tip>

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Ollama non rilevato">
    Assicurati che Ollama sia in esecuzione, di aver impostato `OLLAMA_API_KEY` (o un profilo auth) e di **non** aver definito una voce esplicita `models.providers.ollama`:

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
    # Controlla se Ollama è in esecuzione
    ps aux | grep ollama

    # Oppure riavvia Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altri aiuti: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/models" icon="brain">
    Come scegliere e configurare i modelli.
  </Card>
  <Card title="Ollama Web Search" href="/it/tools/ollama-search" icon="magnifying-glass">
    Dettagli completi su configurazione e comportamento della ricerca web basata su Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
