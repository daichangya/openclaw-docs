---
read_when:
    - Vuoi eseguire OpenClaw con modelli cloud o locali tramite Ollama
    - Hai bisogno di istruzioni per la configurazione e il setup di Ollama
summary: Esegui OpenClaw con Ollama (modelli cloud e locali)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:31:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama è un runtime LLM locale che rende semplice eseguire modelli open source sulla tua macchina. OpenClaw si integra con l’API nativa di Ollama (`/api/chat`), supporta lo streaming e il tool calling, e può rilevare automaticamente i modelli Ollama locali quando abiliti questa opzione con `OLLAMA_API_KEY` (o un profilo auth) e non definisci una voce esplicita `models.providers.ollama`.

<Warning>
**Utenti di Ollama remoto**: non usare l’URL compatibile OpenAI `/v1` (`http://host:11434/v1`) con OpenClaw. Questo interrompe il tool calling e i modelli potrebbero produrre JSON degli strumenti grezzo come testo normale. Usa invece l’URL dell’API nativa di Ollama: `baseUrl: "http://host:11434"` (senza `/v1`).
</Warning>

## Per iniziare

Scegli il metodo di configurazione e la modalità che preferisci.

<Tabs>
  <Tab title="Onboarding (consigliato)">
    **Ideale per:** il percorso più rapido verso una configurazione Ollama funzionante con rilevamento automatico dei modelli.

    <Steps>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard
        ```

        Seleziona **Ollama** dall’elenco dei provider.
      </Step>
      <Step title="Scegli la modalità">
        - **Cloud + Local** — modelli ospitati nel cloud e modelli locali insieme
        - **Local** — solo modelli locali

        Se scegli **Cloud + Local** e non hai effettuato l’accesso a ollama.com, l’onboarding apre un flusso di accesso nel browser.
      </Step>
      <Step title="Seleziona un modello">
        L’onboarding rileva i modelli disponibili e suggerisce i valori predefiniti. Scarica automaticamente il modello selezionato se non è disponibile localmente.
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

    Facoltativamente puoi specificare un URL base personalizzato o un modello:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configurazione manuale">
    **Ideale per:** pieno controllo su installazione, download dei modelli e configurazione.

    <Steps>
      <Step title="Installa Ollama">
        Scaricalo da [ollama.com/download](https://ollama.com/download).
      </Step>
      <Step title="Scarica un modello locale">
        ```bash
        ollama pull gemma4
        # oppure
        ollama pull gpt-oss:20b
        # oppure
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Accedi per i modelli cloud (facoltativo)">
        Se vuoi anche i modelli cloud:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="Abilita Ollama per OpenClaw">
        Imposta un valore qualsiasi per la chiave API (Ollama non richiede una chiave reale):

        ```bash
        # Imposta la variabile d’ambiente
        export OLLAMA_API_KEY="ollama-local"

        # Oppure configuralo nel file di configurazione
        openclaw config set models.providers.ollama.apiKey "ollama-local"
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
    I modelli cloud ti permettono di eseguire modelli ospitati nel cloud insieme ai tuoi modelli locali. Esempi includono `kimi-k2.5:cloud`, `minimax-m2.7:cloud` e `glm-5.1:cloud` -- questi **non** richiedono un `ollama pull` locale.

    Seleziona la modalità **Cloud + Local** durante la configurazione. La procedura guidata verifica se hai effettuato l’accesso e apre un flusso di accesso nel browser quando necessario. Se l’autenticazione non può essere verificata, la procedura guidata torna ai valori predefiniti dei modelli locali.

    Puoi anche accedere direttamente su [ollama.com/signin](https://ollama.com/signin).

    OpenClaw attualmente suggerisce questi valori predefiniti cloud: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="Solo locale">
    In modalità solo locale, OpenClaw rileva i modelli dall’istanza locale di Ollama. Non è necessario alcun accesso cloud.

    OpenClaw attualmente suggerisce `gemma4` come valore predefinito locale.

  </Tab>
</Tabs>

## Rilevamento dei modelli (provider implicito)

Quando imposti `OLLAMA_API_KEY` (o un profilo auth) e **non** definisci `models.providers.ollama`, OpenClaw rileva i modelli dall’istanza locale di Ollama all’indirizzo `http://127.0.0.1:11434`.

| Comportamento        | Dettaglio                                                                                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Query del catalogo   | Interroga `/api/tags`                                                                                                                                                   |
| Rilevamento capacità | Usa lookup `/api/show` best-effort per leggere `contextWindow` e rilevare le capacità (inclusa la vision)                                                             |
| Modelli vision       | I modelli con capacità `vision` riportata da `/api/show` sono contrassegnati come capaci di elaborare immagini (`input: ["text", "image"]`), quindi OpenClaw inietta automaticamente le immagini nel prompt |
| Rilevamento reasoning | Contrassegna `reasoning` con un’euristica basata sul nome del modello (`r1`, `reasoning`, `think`)                                                                   |
| Limiti di token      | Imposta `maxTokens` sul limite massimo predefinito di token Ollama usato da OpenClaw                                                                                  |
| Costi                | Imposta tutti i costi a `0`                                                                                                                                             |

Questo evita voci manuali dei modelli mantenendo il catalogo allineato con l’istanza Ollama locale.

```bash
# Vedi quali modelli sono disponibili
ollama list
openclaw models list
```

Per aggiungere un nuovo modello, scaricalo semplicemente con Ollama:

```bash
ollama pull mistral
```

Il nuovo modello verrà rilevato automaticamente e sarà disponibile per l’uso.

<Note>
Se imposti esplicitamente `models.providers.ollama`, il rilevamento automatico viene saltato e devi definire i modelli manualmente. Vedi la sezione della configurazione esplicita qui sotto.
</Note>

## Configurazione

<Tabs>
  <Tab title="Base (rilevamento implicito)">
    Il modo più semplice per abilitare Ollama è tramite variabile d’ambiente:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Se `OLLAMA_API_KEY` è impostata, puoi omettere `apiKey` nella voce del provider e OpenClaw la compilerà per i controlli di disponibilità.
    </Tip>

  </Tab>

  <Tab title="Esplicita (modelli manuali)">
    Usa la configurazione esplicita quando Ollama è in esecuzione su un altro host/porta, vuoi forzare finestre di contesto o elenchi di modelli specifici, oppure vuoi definizioni dei modelli completamente manuali.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
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
            baseUrl: "http://ollama-host:11434", // Nessun /v1 - usa l’URL dell’API nativa di Ollama
            api: "ollama", // Impostalo esplicitamente per garantire il comportamento nativo del tool calling
          },
        },
      },
    }
    ```

    <Warning>
    Non aggiungere `/v1` all’URL. Il percorso `/v1` usa la modalità compatibile OpenAI, in cui il tool calling non è affidabile. Usa l’URL base di Ollama senza suffisso di percorso.
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

## Ollama Web Search

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso.

| Proprietà   | Dettaglio                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Host        | Usa l’host Ollama configurato (`models.providers.ollama.baseUrl` quando impostato, altrimenti `http://127.0.0.1:11434`) |
| Auth        | Nessuna chiave richiesta                                                                                              |
| Requisito   | Ollama deve essere in esecuzione e con accesso effettuato tramite `ollama signin`                                    |

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
Per i dettagli completi di configurazione e comportamento, vedi [Ollama Web Search](/it/tools/ollama-search).
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Modalità legacy compatibile OpenAI">
    <Warning>
    **Il tool calling non è affidabile in modalità compatibile OpenAI.** Usa questa modalità solo se ti serve il formato OpenAI per un proxy e non dipendi dal comportamento nativo del tool calling.
    </Warning>

    Se invece devi usare l’endpoint compatibile OpenAI (ad esempio dietro un proxy che supporta solo il formato OpenAI), imposta esplicitamente `api: "openai-completions"`:

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

    Questa modalità potrebbe non supportare contemporaneamente streaming e tool calling. Potrebbe essere necessario disabilitare lo streaming con `params: { streaming: false }` nella configurazione del modello.

    Quando `api: "openai-completions"` viene usato con Ollama, OpenClaw inietta `options.num_ctx` per default così Ollama non torna silenziosamente a una finestra di contesto di 4096. Se il tuo proxy/upstream rifiuta campi `options` sconosciuti, disabilita questo comportamento:

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
    Per i modelli rilevati automaticamente, OpenClaw usa la finestra di contesto riportata da Ollama quando disponibile, altrimenti torna alla finestra di contesto predefinita di Ollama usata da OpenClaw.

    Puoi sostituire `contextWindow` e `maxTokens` nella configurazione esplicita del provider:

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
    OpenClaw tratta per default come capaci di reasoning i modelli con nomi come `deepseek-r1`, `reasoning` o `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Non è necessaria alcuna configurazione aggiuntiva -- OpenClaw li contrassegna automaticamente.

  </Accordion>

  <Accordion title="Costi dei modelli">
    Ollama è gratuito e viene eseguito localmente, quindi tutti i costi dei modelli sono impostati a $0. Questo vale sia per i modelli rilevati automaticamente sia per quelli definiti manualmente.
  </Accordion>

  <Accordion title="Embedding della memoria">
    Il Plugin Ollama incluso registra un provider di embedding della memoria per
    la [ricerca nella memoria](/it/concepts/memory). Usa l’URL base
    e la chiave API Ollama configurati.

    | Proprietà      | Valore              |
    | -------------- | ------------------- |
    | Modello predefinito | `nomic-embed-text`  |
    | Download automatico | Sì — il modello di embedding viene scaricato automaticamente se non è presente localmente |

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
    L’integrazione Ollama di OpenClaw usa per default l’**API nativa di Ollama** (`/api/chat`), che supporta pienamente streaming e tool calling simultaneamente. Non è necessaria alcuna configurazione speciale.

    <Tip>
    Se devi usare l’endpoint compatibile OpenAI, vedi la sezione "Modalità legacy compatibile OpenAI" qui sopra. In quella modalità, streaming e tool calling potrebbero non funzionare contemporaneamente.
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

    Verifica che l’API sia accessibile:

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
    Verifica che Ollama sia in esecuzione sulla porta corretta:

    ```bash
    # Verifica se Ollama è in esecuzione
    ps aux | grep ollama

    # Oppure riavvia Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
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
    Dettagli completi di configurazione e comportamento per la ricerca web supportata da Ollama.
  </Card>
  <Card title="Configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione.
  </Card>
</CardGroup>
