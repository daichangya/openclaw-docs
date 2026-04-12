---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
summary: Usa l’API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter fornisce un’**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l’URL di base.

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facoltativo) Passa a un modello specifico">
    L’onboarding usa come predefinito `openrouter/auto`. Scegli più tardi un modello concreto:

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

## Riferimenti di modello

<Note>
I riferimenti di modello seguono il formato `openrouter/<provider>/<model>`. Per l’elenco completo di
provider e modelli disponibili, consulta [/concepts/model-providers](/it/concepts/model-providers).
</Note>

## Autenticazione e header

OpenRouter usa internamente un token Bearer con la tua chiave API.

Nelle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione dell’app documentati da OpenRouter:

| Header                    | Value                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se punti il provider OpenRouter a un altro proxy o URL di base, OpenClaw
**non** inserisce quegli header specifici di OpenRouter né i marker di cache Anthropic.
</Warning>

## Note avanzate

<AccordionGroup>
  <Accordion title="Marker di cache Anthropic">
    Sui percorsi OpenRouter verificati, i riferimenti di modello Anthropic mantengono i
    marker `cache_control` Anthropic specifici di OpenRouter che OpenClaw usa per
    un migliore riutilizzo della cache del prompt nei blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Inserimento di thinking / reasoning">
    Sui percorsi supportati non `auto`, OpenClaw mappa il livello di thinking selezionato ai
    payload di reasoning del proxy OpenRouter. Gli hint di modello non supportati e
    `openrouter/auto` saltano questo inserimento del reasoning.
  </Accordion>

  <Accordion title="Formattazione della richiesta solo OpenAI">
    OpenRouter continua a passare attraverso il percorso proxy in stile compatibile OpenAI, quindi
    la formattazione nativa delle richieste solo OpenAI come `serviceTier`, `store` di Responses,
    payload di compatibilità reasoning OpenAI e hint di cache del prompt non viene inoltrata.
  </Accordion>

  <Accordion title="Percorsi basati su Gemini">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanificazione della thought-signature di Gemini, ma non abilita la validazione nativa del replay di Gemini
    né le riscritture di bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento del provider">
    Se passi l’instradamento del provider OpenRouter sotto i parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima che vengano eseguiti i wrapper di streaming condivisi.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
