---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
summary: Usa l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un unico
endpoint e un'unica chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facoltativo) Passa a un modello specifico">
    L'onboarding usa per impostazione predefinita `openrouter/auto`. Scegli in seguito un modello concreto:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Esempio di configurazione

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Riferimenti dei modelli

<Note>
I riferimenti dei modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, vedi [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello                  | Note                          |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 tramite MoonshotAI  |
| `openrouter/openrouter/healer-alpha` | Route OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Route OpenRouter Hunter Alpha |

## Autenticazione e header

OpenRouter usa internamente un Bearer token con la tua chiave API.

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione app documentati da OpenRouter:

| Header                    | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se ripunti il provider OpenRouter verso un altro proxy o URL di base, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marcatori di cache Anthropic.
</Warning>

## Note avanzate

<AccordionGroup>
  <Accordion title="Marcatori di cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti di modelli Anthropic mantengono i
    marcatori `cache_control` Anthropic specifici di OpenRouter che OpenClaw usa per
    un migliore riutilizzo della prompt-cache sui blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Iniezione thinking / reasoning">
    Sulle route supportate non `auto`, OpenClaw mappa il livello di thinking selezionato ai
    payload di reasoning del proxy OpenRouter. Gli hint di modelli non supportati e
    `openrouter/auto` saltano quell'iniezione di reasoning.
  </Accordion>

  <Accordion title="Request shaping solo OpenAI">
    OpenRouter continua a passare attraverso il percorso compatibile OpenAI in stile proxy, quindi
    il request shaping nativo solo OpenAI come `serviceTier`, Responses `store`,
    payload di compatibilità reasoning OpenAI e hint di prompt-cache non viene inoltrato.
  </Accordion>

  <Accordion title="Route supportate da Gemini">
    I riferimenti OpenRouter supportati da Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanitizzazione della thought-signature Gemini, ma non abilita la validazione di replay nativa Gemini
    né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Metadata di instradamento del provider">
    Se passi l'instradamento del provider OpenRouter sotto model params, OpenClaw lo inoltra
    come metadata di instradamento OpenRouter prima che vengano eseguiti i wrapper di stream condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
