---
read_when:
    - Vuoi una singola chiave API per molti LLM
    - Vuoi eseguire modelli tramite OpenRouter in OpenClaw
    - Vuoi usare OpenRouter per la generazione di immagini
summary: Usare l'API unificata di OpenRouter per accedere a molti modelli in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:56:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un singolo
endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando il base URL.

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
    L'onboarding imposta per default `openrouter/auto`. In seguito scegli un modello concreto:

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

## Riferimenti ai modelli

<Note>
I riferimenti ai modelli seguono il pattern `openrouter/<provider>/<model>`. Per l'elenco completo di
provider e modelli disponibili, vedi [/concepts/model-providers](/it/concepts/model-providers).
</Note>

Esempi di fallback inclusi:

| Riferimento modello                   | Note                          |
| ------------------------------------- | ----------------------------- |
| `openrouter/auto`                     | Instradamento automatico OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`     | Kimi K2.6 via MoonshotAI      |
| `openrouter/openrouter/healer-alpha`  | Route OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha`  | Route OpenRouter Hunter Alpha |

## Generazione di immagini

OpenRouter può anche supportare lo strumento `image_generate`. Usa un modello immagine OpenRouter in `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw invia le richieste immagine all'API immagini di chat completions di OpenRouter con `modalities: ["image", "text"]`. I modelli immagine Gemini ricevono gli hint supportati `aspectRatio` e `resolution` tramite `image_config` di OpenRouter.

## Text-to-speech

OpenRouter può anche essere usato come provider TTS tramite il suo endpoint
`/audio/speech` compatibile con OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Se `messages.tts.providers.openrouter.apiKey` è omesso, TTS riusa
`models.providers.openrouter.apiKey`, poi `OPENROUTER_API_KEY`.

## Autenticazione e header

OpenRouter usa internamente un token Bearer con la tua chiave API.

Sulle richieste OpenRouter reali (`https://openrouter.ai/api/v1`), OpenClaw aggiunge anche
gli header di attribuzione app documentati da OpenRouter:

| Header                    | Valore                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Se ripunti il provider OpenRouter verso un altro proxy o base URL, OpenClaw
**non** inietta quegli header specifici di OpenRouter né i marker di cache Anthropic.
</Warning>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Marker di cache Anthropic">
    Sulle route OpenRouter verificate, i riferimenti ai modelli Anthropic mantengono i marker
    `cache_control` Anthropic specifici di OpenRouter che OpenClaw usa per
    un migliore riuso della prompt-cache sui blocchi di prompt system/developer.
  </Accordion>

  <Accordion title="Iniezione thinking / reasoning">
    Sulle route supportate non `auto`, OpenClaw mappa il livello di thinking selezionato ai
    payload reasoning del proxy OpenRouter. Gli hint di modelli non supportati e
    `openrouter/auto` saltano tale iniezione di reasoning.
  </Accordion>

  <Accordion title="Formattazione delle richieste solo OpenAI">
    OpenRouter continua a passare tramite il percorso compatibile con OpenAI in stile proxy, quindi
    la formattazione nativa delle richieste solo OpenAI come `serviceTier`, Responses `store`,
    payload di compatibilità reasoning OpenAI e hint di prompt-cache non viene inoltrata.
  </Accordion>

  <Accordion title="Route basate su Gemini">
    I riferimenti OpenRouter basati su Gemini restano sul percorso proxy-Gemini: OpenClaw mantiene
    lì la sanitizzazione della thought-signature di Gemini, ma non abilita la validazione di replay Gemini nativa né le riscritture bootstrap.
  </Accordion>

  <Accordion title="Metadati di instradamento provider">
    Se passi l'instradamento del provider OpenRouter sotto i parametri del modello, OpenClaw lo inoltra
    come metadati di instradamento OpenRouter prima che vengano eseguiti i wrapper di stream condivisi.
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
