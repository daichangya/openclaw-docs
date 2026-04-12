---
read_when:
    - Vuoi usare Chutes con OpenClaw
    - Hai bisogno del percorso di configurazione OAuth o con chiave API
    - Vuoi il modello predefinito, gli alias o il comportamento di rilevamento
summary: Configurazione di Chutes (OAuth o chiave API, rilevamento dei modelli, alias)
title: Chutes
x-i18n:
    generated_at: "2026-04-12T23:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) espone cataloghi di modelli open source tramite un'API compatibile con OpenAI. OpenClaw supporta sia l'OAuth via browser sia l'autenticazione diretta con chiave API per il provider integrato `chutes`.

| Proprietà | Valore                       |
| --------- | ---------------------------- |
| Provider  | `chutes`                     |
| API       | Compatibile con OpenAI       |
| URL base  | `https://llm.chutes.ai/v1`   |
| Auth      | OAuth o chiave API (vedi sotto) |

## Per iniziare

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Esegui il flusso di onboarding OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw avvia il flusso nel browser in locale, oppure mostra un flusso con URL + incolla del redirect su host remoti/headless. I token OAuth vengono aggiornati automaticamente tramite i profili di autenticazione OpenClaw.
      </Step>
      <Step title="Verifica il modello predefinito">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes integrato viene
        registrato.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Chiave API">
    <Steps>
      <Step title="Ottieni una chiave API">
        Crea una chiave su
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Esegui il flusso di onboarding con chiave API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifica il modello predefinito">
        Dopo l'onboarding, il modello predefinito viene impostato su
        `chutes/zai-org/GLM-4.7-TEE` e il catalogo Chutes integrato viene
        registrato.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Entrambi i percorsi di autenticazione registrano il catalogo Chutes integrato e impostano il modello predefinito su
`chutes/zai-org/GLM-4.7-TEE`. Variabili d'ambiente runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento di rilevamento

Quando l'autenticazione Chutes è disponibile, OpenClaw interroga il catalogo Chutes con quella credenziale e usa i modelli rilevati. Se il rilevamento fallisce, OpenClaw torna a un catalogo statico integrato così onboarding e avvio continuano a funzionare.

## Alias predefiniti

OpenClaw registra tre alias di comodità per il catalogo Chutes integrato:

| Alias           | Modello di destinazione                              |
| --------------- | ---------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                         |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`               |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogo iniziale integrato

Il catalogo di fallback integrato include gli attuali riferimenti Chutes:

| Riferimento modello                                    |
| ------------------------------------------------------ |
| `chutes/zai-org/GLM-4.7-TEE`                           |
| `chutes/zai-org/GLM-5-TEE`                             |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                 |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`              |
| `chutes/moonshotai/Kimi-K2.5-TEE`                      |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`  |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                     |
| `chutes/openai/gpt-oss-120b-TEE`                       |

## Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Override OAuth">
    Puoi personalizzare il flusso OAuth con variabili d'ambiente opzionali:

    | Variabile | Scopo |
    | --------- | ----- |
    | `CHUTES_CLIENT_ID` | ID client OAuth personalizzato |
    | `CHUTES_CLIENT_SECRET` | Secret client OAuth personalizzato |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI di redirect personalizzato |
    | `CHUTES_OAUTH_SCOPES` | Scope OAuth personalizzati |

    Consulta la [documentazione OAuth di Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    per i requisiti dell'app di redirect e ulteriore assistenza.

  </Accordion>

  <Accordion title="Note">
    - Il rilevamento con chiave API e con OAuth usa entrambi lo stesso id provider `chutes`.
    - I modelli Chutes vengono registrati come `chutes/<model-id>`.
    - Se il rilevamento fallisce all'avvio, il catalogo statico integrato viene usato automaticamente.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni dei provider.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Dashboard Chutes e documentazione API.
  </Card>
  <Card title="Chiavi API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crea e gestisci le chiavi API Chutes.
  </Card>
</CardGroup>
