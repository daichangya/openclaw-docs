---
read_when:
    - Vuoi eseguire OpenClaw con un server vLLM locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con vLLM (server locale compatibile OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:37:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM può servire modelli open-source (e alcuni modelli personalizzati) tramite un'API HTTP **compatibile con OpenAI**. OpenClaw si connette a vLLM usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da vLLM quando scegli di attivarlo con `VLLM_API_KEY` (qualsiasi valore funziona se il tuo server non applica l'autenticazione) e non definisci una voce `models.providers.vllm` esplicita.

OpenClaw tratta `vllm` come un provider locale compatibile con OpenAI che supporta
la contabilizzazione dell'utilizzo in streaming, quindi i conteggi dei token di stato/contesto possono aggiornarsi dalle
risposte `stream_options.include_usage`.

| Proprietà        | Valore                                   |
| ---------------- | ---------------------------------------- |
| ID provider      | `vllm`                                   |
| API              | `openai-completions` (compatibile con OpenAI) |
| Autenticazione   | variabile d'ambiente `VLLM_API_KEY`      |
| URL base predefinito | `http://127.0.0.1:8000/v1`           |

## Per iniziare

<Steps>
  <Step title="Avvia vLLM con un server compatibile con OpenAI">
    Il tuo URL base dovrebbe esporre endpoint `/v1` (ad esempio `/v1/models`, `/v1/chat/completions`). vLLM viene comunemente eseguito su:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Imposta la variabile d'ambiente della chiave API">
    Qualsiasi valore funziona se il tuo server non applica l'autenticazione:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Seleziona un modello">
    Sostituisci con uno degli ID modello del tuo vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Rilevamento dei modelli (provider implicito)

Quando `VLLM_API_KEY` è impostata (o esiste un profilo di autenticazione) e **non** definisci `models.providers.vllm`, OpenClaw interroga:

```
GET http://127.0.0.1:8000/v1/models
```

e converte gli ID restituiti in voci di modello.

<Note>
Se imposti esplicitamente `models.providers.vllm`, il rilevamento automatico viene saltato e devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa una configurazione esplicita quando:

- vLLM viene eseguito su un host o una porta diversi
- Vuoi fissare i valori di `contextWindow` o `maxTokens`
- Il tuo server richiede una chiave API reale (oppure vuoi controllare le intestazioni)
- Ti connetti a un endpoint vLLM di loopback attendibile, LAN o Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Modello vLLM locale",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Comportamento in stile proxy">
    vLLM viene trattato come un backend `/v1` compatibile con OpenAI in stile proxy, non come un endpoint
    OpenAI nativo. Questo significa:

    | Comportamento | Applicato? |
    |----------|----------|
    | Formattazione nativa delle richieste OpenAI | No |
    | `service_tier` | Non inviato |
    | `store` delle risposte | Non inviato |
    | Suggerimenti per la cache dei prompt | Non inviati |
    | Formattazione del payload di compatibilità con il reasoning OpenAI | Non applicata |
    | Intestazioni di attribuzione OpenClaw nascoste | Non iniettate su URL base personalizzati |

  </Accordion>

  <Accordion title="Controlli thinking di Nemotron 3">
    vLLM/Nemotron 3 può usare argomenti keyword del template di chat per controllare se il reasoning viene
    restituito come reasoning nascosto o come testo di risposta visibile. Quando una sessione OpenClaw
    usa `vllm/nemotron-3-*` con il thinking disattivato, OpenClaw invia:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Per personalizzare questi valori, imposta `chat_template_kwargs` nei parametri del modello.
    Se imposti anche `params.extra_body.chat_template_kwargs`, tale valore ha
    la precedenza finale perché `extra_body` è l'ultima sostituzione del corpo della richiesta.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="URL base personalizzato">
    Se il tuo server vLLM viene eseguito su un host o una porta non predefiniti, imposta `baseUrl` nella configurazione esplicita del provider:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Modello vLLM remoto",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Server non raggiungibile">
    Verifica che il server vLLM sia in esecuzione e accessibile:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Se vedi un errore di connessione, verifica l'host, la porta e che vLLM sia stato avviato in modalità server compatibile con OpenAI.
    Per endpoint espliciti di loopback, LAN o Tailscale, imposta anche
    `models.providers.vllm.request.allowPrivateNetwork: true`; le richieste del provider
    bloccano per impostazione predefinita gli URL di rete privata, a meno che il provider non sia
    esplicitamente considerato attendibile.

  </Accordion>

  <Accordion title="Errori di autenticazione nelle richieste">
    Se le richieste non riescono con errori di autenticazione, imposta un `VLLM_API_KEY` reale che corrisponda alla configurazione del tuo server, oppure configura il provider esplicitamente in `models.providers.vllm`.

    <Tip>
    Se il tuo server vLLM non applica l'autenticazione, qualsiasi valore non vuoto per `VLLM_API_KEY` funziona come segnale di attivazione per OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nessun modello rilevato">
    Il rilevamento automatico richiede che `VLLM_API_KEY` sia impostata **e** che non sia presente alcuna voce di configurazione esplicita `models.providers.vllm`. Se hai definito manualmente il provider, OpenClaw salta il rilevamento e usa solo i modelli che hai dichiarato.
  </Accordion>
</AccordionGroup>

<Warning>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Warning>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="OpenAI" href="/it/providers/openai" icon="bolt">
    Provider OpenAI nativo e comportamento del percorso compatibile con OpenAI.
  </Card>
  <Card title="OAuth e autenticazione" href="/it/gateway/authentication" icon="key">
    Dettagli dell'autenticazione e regole di riutilizzo delle credenziali.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e come risolverli.
  </Card>
</CardGroup>
