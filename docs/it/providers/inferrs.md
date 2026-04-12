---
read_when:
    - Vuoi eseguire OpenClaw usando un server inferrs locale
    - Stai esponendo Gemma o un altro modello tramite inferrs
    - Hai bisogno dei flag di compatibilità OpenClaw esatti per inferrs
summary: Esegui OpenClaw tramite inferrs (server locale compatibile con OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-12T23:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) può esporre modelli locali dietro un'API
`/v1` compatibile con OpenAI. OpenClaw funziona con `inferrs` tramite il percorso generico
`openai-completions`.

Al momento `inferrs` è meglio considerarlo come un backend OpenAI-compatible
self-hosted personalizzato, non come un Plugin provider dedicato di OpenClaw.

## Per iniziare

<Steps>
  <Step title="Avvia inferrs con un modello">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verifica che il server sia raggiungibile">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Aggiungi una voce provider OpenClaw">
    Aggiungi una voce provider esplicita e punta a essa il tuo modello predefinito. Vedi l'esempio di configurazione completo qui sotto.
  </Step>
</Steps>

## Esempio completo di configurazione

Questo esempio usa Gemma 4 su un server locale `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Avanzato

<AccordionGroup>
  <Accordion title="Perché `requiresStringContent` è importante">
    Alcuni percorsi Chat Completions di `inferrs` accettano solo
    `messages[].content` come stringa, non array strutturati di content part.

    <Warning>
    Se le esecuzioni di OpenClaw falliscono con un errore come:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    imposta `compat.requiresStringContent: true` nella voce del modello.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw appiattirà le content part di puro testo in stringhe semplici prima di inviare
    la richiesta.

  </Accordion>

  <Accordion title="Avvertenza su Gemma e schema degli strumenti">
    Alcune combinazioni attuali di `inferrs` + Gemma accettano piccole richieste dirette
    `/v1/chat/completions` ma falliscono comunque nei turni completi del runtime agente di OpenClaw.

    Se succede, prova prima questo:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Questo disabilita la superficie dello schema degli strumenti di OpenClaw per il modello e può ridurre la pressione del prompt
    sui backend locali più rigidi.

    Se piccole richieste dirette continuano a funzionare ma i normali turni agente di OpenClaw
    continuano a bloccarsi dentro `inferrs`, il problema residuo di solito è un comportamento
    a monte del modello/server piuttosto che del livello di trasporto di OpenClaw.

  </Accordion>

  <Accordion title="Smoke test manuale">
    Una volta configurato, testa entrambi i livelli:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Se il primo comando funziona ma il secondo fallisce, controlla la sezione di risoluzione dei problemi qui sotto.

  </Accordion>

  <Accordion title="Comportamento in stile proxy">
    `inferrs` viene trattato come un backend `/v1` compatibile con OpenAI in stile proxy, non come un
    endpoint OpenAI nativo.

    - Il modellamento nativo delle richieste solo OpenAI qui non si applica
    - Nessun `service_tier`, nessun Responses `store`, nessun suggerimento per la prompt cache e nessun
      modellamento del payload di compatibilità del ragionamento OpenAI
    - Gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`)
      non vengono iniettati negli URL base `inferrs` personalizzati

  </Accordion>
</AccordionGroup>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="`curl /v1/models` fallisce">
    `inferrs` non è in esecuzione, non è raggiungibile o non è collegato all'host/porta
    previsti. Assicurati che il server sia avviato e in ascolto sull'indirizzo che hai
    configurato.
  </Accordion>

  <Accordion title="`messages[].content` si aspetta una stringa">
    Imposta `compat.requiresStringContent: true` nella voce del modello. Vedi la sezione
    `requiresStringContent` qui sopra per i dettagli.
  </Accordion>

  <Accordion title="Le chiamate dirette a `/v1/chat/completions` passano ma `openclaw infer model run` fallisce">
    Prova a impostare `compat.supportsTools: false` per disabilitare la superficie dello schema degli strumenti.
    Vedi l'avvertenza sopra su Gemma e schema degli strumenti.
  </Accordion>

  <Accordion title="`inferrs` continua a bloccarsi su turni agente più grandi">
    Se OpenClaw non riceve più errori di schema ma `inferrs` continua a bloccarsi su turni agente più grandi,
    trattalo come una limitazione a monte di `inferrs` o del modello. Riduci
    la pressione del prompt oppure passa a un backend o modello locale differente.
  </Accordion>
</AccordionGroup>

<Tip>
Per assistenza generale, vedi [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Tip>

## Vedi anche

<CardGroup cols={2}>
  <Card title="Modelli locali" href="/it/gateway/local-models" icon="server">
    Eseguire OpenClaw con server di modelli locali.
  </Card>
  <Card title="Risoluzione dei problemi del Gateway" href="/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debug dei backend locali compatibili con OpenAI che superano le probe ma falliscono nelle esecuzioni agente.
  </Card>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Panoramica di tutti i provider, riferimenti ai modelli e comportamento di failover.
  </Card>
</CardGroup>
