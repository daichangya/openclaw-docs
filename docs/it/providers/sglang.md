---
read_when:
    - Vuoi eseguire OpenClaw usando un server SGLang locale
    - Vuoi endpoint `/v1` compatibili con OpenAI con i tuoi modelli
summary: Esegui OpenClaw con SGLang (server self-hosted compatibile con OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:32:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang può esporre modelli open source tramite un'API HTTP **compatibile con OpenAI**.
OpenClaw può connettersi a SGLang usando l'API `openai-completions`.

OpenClaw può anche **rilevare automaticamente** i modelli disponibili da SGLang se scegli
di abilitarlo con `SGLANG_API_KEY` (qualsiasi valore funziona se il tuo server non impone autenticazione)
e non definisci una voce esplicita `models.providers.sglang`.

## Per iniziare

<Steps>
  <Step title="Avvia SGLang">
    Avvia SGLang con un server compatibile con OpenAI. Il tuo URL di base dovrebbe esporre
    endpoint `/v1` (per esempio `/v1/models`, `/v1/chat/completions`). SGLang
    di solito viene eseguito su:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Imposta una chiave API">
    Qualsiasi valore funziona se sul tuo server non è configurata alcuna autenticazione:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Esegui l'onboarding o imposta direttamente un modello">
    ```bash
    openclaw onboard
    ```

    Oppure configura manualmente il modello:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Rilevamento dei modelli (provider implicito)

Quando `SGLANG_API_KEY` è impostato (o esiste un profilo di autenticazione) e **non**
definisci `models.providers.sglang`, OpenClaw interroga:

- `GET http://127.0.0.1:30000/v1/models`

e converte gli ID restituiti in voci modello.

<Note>
Se imposti esplicitamente `models.providers.sglang`, il rilevamento automatico viene saltato e
devi definire i modelli manualmente.
</Note>

## Configurazione esplicita (modelli manuali)

Usa la configurazione esplicita quando:

- SGLang è in esecuzione su host/porta diversi.
- Vuoi fissare i valori `contextWindow`/`maxTokens`.
- Il tuo server richiede una vera chiave API (oppure vuoi controllare gli header).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modello SGLang locale",
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
    SGLang viene trattato come un backend `/v1` compatibile con OpenAI in stile proxy, non come un
    endpoint OpenAI nativo.

    | Comportamento | SGLang |
    |----------|--------|
    | Modellamento delle richieste solo OpenAI | Non applicato |
    | `service_tier`, Responses `store`, suggerimenti per la prompt cache | Non inviati |
    | Modellamento del payload di compatibilità del ragionamento | Non applicato |
    | Header di attribuzione nascosti (`originator`, `version`, `User-Agent`) | Non iniettati negli URL base SGLang personalizzati |

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    **Server non raggiungibile**

    Verifica che il server sia in esecuzione e risponda:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Errori di autenticazione**

    Se le richieste falliscono con errori di autenticazione, imposta una vera `SGLANG_API_KEY` che corrisponda
    alla configurazione del tuo server, oppure configura esplicitamente il provider sotto
    `models.providers.sglang`.

    <Tip>
    Se esegui SGLang senza autenticazione, qualsiasi valore non vuoto per
    `SGLANG_API_KEY` è sufficiente per abilitare il rilevamento dei modelli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le voci provider.
  </Card>
</CardGroup>
