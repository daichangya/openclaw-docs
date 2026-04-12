---
read_when:
    - Vuoi configurare Moonshot K2 (Moonshot Open Platform) rispetto a Kimi Coding
    - Hai bisogno di capire endpoint, chiavi e riferimenti ai modelli separati
    - Vuoi una configurazione pronta da copiare e incollare per uno dei due provider
summary: Configura Moonshot K2 e Kimi Coding (provider e chiavi separati)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-12T23:31:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f261f83a9b37e4fffb0cd0803e0c64f27eae8bae91b91d8a781a030663076f8
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fornisce l'API Kimi con endpoint compatibili con OpenAI. Configura il
provider e imposta il modello predefinito su `moonshot/kimi-k2.5`, oppure usa
Kimi Coding con `kimi/kimi-code`.

<Warning>
Moonshot e Kimi Coding sono **provider separati**. Le chiavi non sono intercambiabili, gli endpoint sono diversi e anche i riferimenti ai modelli differiscono (`moonshot/...` vs `kimi/...`).
</Warning>

## Catalogo modelli integrato

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nome                   | Ragionamento | Input       | Contesto | Output massimo |
| --------------------------------- | ---------------------- | ------------ | ----------- | -------- | -------------- |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No           | text, image | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Sì           | text        | 262,144  | 262,144        |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Sì           | text        | 262,144  | 262,144        |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No           | text        | 256,000  | 16,384         |

[//]: # "moonshot-kimi-k2-ids:end"

## Per iniziare

Scegli il provider e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API Moonshot">
    **Ideale per:** modelli Kimi K2 tramite Moonshot Open Platform.

    <Steps>
      <Step title="Scegli la regione dell'endpoint">
        | Scelta di autenticazione | Endpoint                     | Regione       |
        | ------------------------ | ---------------------------- | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1` | Internazionale |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1` | Cina          |
      </Step>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oppure per l'endpoint Cina:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.5" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.5" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Ideale per:** attività orientate al codice tramite l'endpoint Kimi Coding.

    <Note>
    Kimi Coding usa una chiave API diversa e un prefisso provider diverso (`kimi/...`) rispetto a Moonshot (`moonshot/...`). Il riferimento modello legacy `kimi/k2p5` resta accettato come ID di compatibilità.
    </Note>

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Esempio di configurazione

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Ricerca web Kimi

OpenClaw include anche **Kimi** come provider `web_search`, supportato dalla ricerca web Moonshot.

<Steps>
  <Step title="Esegui la configurazione interattiva della ricerca web">
    ```bash
    openclaw configure --section web
    ```

    Scegli **Kimi** nella sezione della ricerca web per salvare
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configura la regione e il modello della ricerca web">
    La configurazione interattiva richiede:

    | Impostazione        | Opzioni                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | Regione API         | `https://api.moonshot.ai/v1` (internazionale) oppure `https://api.moonshot.cn/v1` (Cina) |
    | Modello ricerca web | Predefinito: `kimi-k2.5`                                             |

  </Step>
</Steps>

La configurazione si trova sotto `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oppure usa KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Avanzato

<AccordionGroup>
  <Accordion title="Modalità thinking nativa">
    Moonshot Kimi supporta una modalità thinking nativa binaria:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configurala per modello tramite `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.5": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mappa anche i livelli runtime di `/think` per Moonshot:

    | Livello `/think`    | Comportamento Moonshot     |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Qualsiasi livello diverso da off | `thinking.type=enabled`    |

    <Warning>
    Quando il thinking di Moonshot è abilitato, `tool_choice` deve essere `auto` oppure `none`. OpenClaw normalizza i valori `tool_choice` incompatibili a `auto` per compatibilità.
    </Warning>

  </Accordion>

  <Accordion title="Compatibilità dell'uso dello streaming">
    Gli endpoint Moonshot nativi (`https://api.moonshot.ai/v1` e
    `https://api.moonshot.cn/v1`) dichiarano compatibilità con l'uso dello streaming sul
    trasporto condiviso `openai-completions`. OpenClaw basa questo comportamento sulle capacità dell'endpoint, quindi gli ID provider personalizzati compatibili che puntano agli stessi host Moonshot nativi ereditano lo stesso comportamento di utilizzo dello streaming.
  </Accordion>

  <Accordion title="Riferimento di endpoint e model ref">
    | Provider      | Prefisso model ref | Endpoint                     | Variabile env auth  |
    | ------------- | ------------------ | ---------------------------- | ------------------- |
    | Moonshot      | `moonshot/`        | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`  |
    | Moonshot CN   | `moonshot/`        | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`  |
    | Kimi Coding   | `kimi/`            | endpoint Kimi Coding         | `KIMI_API_KEY`      |
    | Ricerca web   | N/D                | Uguale alla regione API Moonshot | `KIMI_API_KEY` o `MOONSHOT_API_KEY` |

    - La ricerca web Kimi usa `KIMI_API_KEY` o `MOONSHOT_API_KEY` e per default usa `https://api.moonshot.ai/v1` con il modello `kimi-k2.5`.
    - Se necessario, sovrascrivi i metadati di prezzi e contesto in `models.providers`.
    - Se Moonshot pubblica limiti di contesto diversi per un modello, regola `contextWindow` di conseguenza.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Ricerca web" href="/tools/web-search" icon="magnifying-glass">
    Configurazione dei provider di ricerca web, incluso Kimi.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione per provider, modelli e Plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestione delle chiavi API Moonshot e documentazione.
  </Card>
</CardGroup>
