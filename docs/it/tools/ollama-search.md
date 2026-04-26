---
read_when:
    - Vuoi usare Ollama per `web_search`
    - Vuoi un provider `web_search` senza chiave
    - Hai bisogno di indicazioni per configurare Ollama Web Search
summary: Ricerca Web di Ollama tramite l'host Ollama configurato dall'utente
title: ricerca web di Ollama
x-i18n:
    generated_at: "2026-04-26T11:40:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw supporta **Ollama Web Search** come provider `web_search` incluso. Utilizza l'API di ricerca web di Ollama e restituisce risultati strutturati con titoli, URL e frammenti.

A differenza del provider di modelli Ollama, questa configurazione non richiede una chiave API per impostazione predefinita. Richiede però:

- un host Ollama raggiungibile da OpenClaw
- `ollama signin`

## Configurazione

<Steps>
  <Step title="Avvia Ollama">
    Assicurati che Ollama sia installato e in esecuzione.
  </Step>
  <Step title="Accedi">
    Esegui:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Scegli Ollama Web Search">
    Esegui:

    ```bash
    openclaw configure --section web
    ```

    Quindi seleziona **Ollama Web Search** come provider.

  </Step>
</Steps>

Se usi già Ollama per i modelli, Ollama Web Search riutilizza lo stesso host configurato.

## Configurazione

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

Override facoltativo dell'host Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Se non è impostato alcun URL di base Ollama esplicito, OpenClaw usa `http://127.0.0.1:11434`.

Se il tuo host Ollama richiede l'autenticazione bearer, OpenClaw riutilizza
`models.providers.ollama.apiKey` (o l'autenticazione del provider corrispondente basata su variabili d'ambiente)
anche per le richieste di ricerca web.

## Note

- Per questo provider non è richiesto alcun campo di chiave API specifico per la ricerca web.
- Se l'host Ollama è protetto da autenticazione, OpenClaw riutilizza la normale
  chiave API del provider Ollama quando presente.
- OpenClaw avvisa durante la configurazione se Ollama non è raggiungibile o se non è stato effettuato l'accesso, ma
  non impedisce la selezione.
- Il rilevamento automatico in fase di esecuzione può ripiegare su Ollama Web Search quando non è configurato alcun provider con credenziali di priorità superiore.
- Il provider usa l'endpoint `/api/web_search` di Ollama.

## Correlati

- [Panoramica di Web Search](/it/tools/web) -- tutti i provider e il rilevamento automatico
- [Ollama](/it/providers/ollama) -- configurazione del modello Ollama e modalità cloud/locali
