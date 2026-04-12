---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Ti servono l’onboarding con la chiave API Mistral e i riferimenti di modello
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T23:31:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw supporta Mistral sia per l’instradamento di modelli testo/immagine (`mistral/...`) sia
per la trascrizione audio tramite Voxtral nel media understanding.
Mistral può anche essere usato per gli embedding di memoria (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API nella [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oppure passa direttamente la chiave:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogo LLM integrato

OpenClaw al momento include questo catalogo Mistral integrato:

| Model ref                        | Input       | Context | Max output | Notes                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384     | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384     | Mistral Small 4; reasoning regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000     | Reasoning abilitato                                              |

## Trascrizione audio (Voxtral)

Usa Voxtral per la trascrizione audio tramite la pipeline di media understanding.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Il percorso di trascrizione dei media usa `/v1/audio/transcriptions`. Il modello audio predefinito per Mistral è `voxtral-mini-latest`.
</Tip>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Reasoning regolabile (mistral-small-latest)">
    `mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [reasoning regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sull’API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il thinking aggiuntivo nell’output; `high` mostra le tracce complete di thinking prima della risposta finale).

    OpenClaw mappa il livello di **thinking** della sessione all’API di Mistral:

    | OpenClaw thinking level                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`             |

    <Note>
    Gli altri modelli del catalogo Mistral integrato non usano questo parametro. Continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima di tutto al reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embedding di memoria">
    Mistral può fornire embedding di memoria tramite `/v1/embeddings` (modello predefinito: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e URL di base">
    - L’autenticazione Mistral usa `MISTRAL_API_KEY`.
    - L’URL di base del provider è predefinito su `https://api.mistral.ai/v1`.
    - Il modello predefinito dell’onboarding è `mistral/mistral-large-latest`.
    - Z.AI usa l’autenticazione Bearer con la tua chiave API.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    Configurazione della trascrizione audio e selezione del provider.
  </Card>
</CardGroup>
