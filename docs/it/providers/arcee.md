---
read_when:
    - Vuoi usare Arcee AI con OpenClaw
    - Ti serve la variabile d’ambiente della chiave API o l’opzione di autenticazione della CLI
summary: Configurazione di Arcee AI (autenticazione + selezione del modello)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-12T23:29:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68c5fddbe272c69611257ceff319c4de7ad21134aaf64582d60720a6f3b853cc
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) fornisce accesso alla famiglia Trinity di modelli mixture-of-experts tramite un’API compatibile con OpenAI. Tutti i modelli Trinity sono concessi in licenza Apache 2.0.

È possibile accedere ai modelli Arcee AI direttamente tramite la piattaforma Arcee oppure tramite [OpenRouter](/it/providers/openrouter).

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (diretto) oppure `OPENROUTER_API_KEY` (tramite OpenRouter)          |
| API      | Compatibile con OpenAI                                                                |
| Base URL | `https://api.arcee.ai/api/v1` (diretto) oppure `https://openrouter.ai/api/v1` (OpenRouter) |

## Per iniziare

<Tabs>
  <Tab title="Diretto (piattaforma Arcee)">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave API su [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Tramite OpenRouter">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave API su [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Esegui l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Gli stessi riferimenti di modello funzionano sia per le configurazioni dirette sia per quelle OpenRouter (ad esempio `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione non interattiva

<Tabs>
  <Tab title="Diretto (piattaforma Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Tramite OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catalogo integrato

OpenClaw al momento include questo catalogo Arcee integrato:

| Model ref                      | Name                   | Input | Context | Cost (in/out per 1M) | Notes                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Modello predefinito; ragionamento abilitato |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Uso generale; 400B parametri, 13B attivi  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Veloce ed efficiente nei costi; chiamata di funzioni |

<Tip>
Il preset di onboarding imposta `arcee/trinity-large-thinking` come modello predefinito.
</Tip>

## Funzionalità supportate

| Feature                                       | Supported                    |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Sì                           |
| Uso di strumenti / chiamata di funzioni       | Sì                           |
| Output strutturato (modalità JSON e schema JSON) | Sì                        |
| Thinking esteso                               | Sì (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Nota sull’ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `ARCEEAI_API_KEY`
    (oppure `OPENROUTER_API_KEY`) sia disponibile per quel processo (ad esempio, in
    `~/.openclaw/.env` oppure tramite `env.shellEnv`).
  </Accordion>

  <Accordion title="Instradamento OpenRouter">
    Quando usi modelli Arcee tramite OpenRouter, si applicano gli stessi riferimenti di modello `arcee/*`.
    OpenClaw gestisce l’instradamento in modo trasparente in base alla tua scelta di autenticazione. Consulta la
    [documentazione del provider OpenRouter](/it/providers/openrouter) per i dettagli di configurazione
    specifici di OpenRouter.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/it/providers/openrouter" icon="shuffle">
    Accedi ai modelli Arcee e a molti altri tramite una singola chiave API.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
</CardGroup>
