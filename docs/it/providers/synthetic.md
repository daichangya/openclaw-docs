---
read_when:
    - Vuoi usare Synthetic come provider di modelli
    - Hai bisogno di configurare una chiave API o un URL base di Synthetic
summary: Usa l'API compatibile con Anthropic di Synthetic in OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T23:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new) espone endpoint compatibili con Anthropic.
OpenClaw lo registra come provider `synthetic` e usa l'API Anthropic
Messages.

| Proprietà | Valore                                |
| --------- | ------------------------------------- |
| Provider  | `synthetic`                           |
| Auth      | `SYNTHETIC_API_KEY`                   |
| API       | Anthropic Messages                    |
| URL base  | `https://api.synthetic.new/anthropic` |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Ottieni una `SYNTHETIC_API_KEY` dal tuo account Synthetic oppure lascia che la
    procedura guidata di onboarding te ne richieda una.
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Verifica il modello predefinito">
    Dopo l'onboarding il modello predefinito è impostato su:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Il client Anthropic di OpenClaw aggiunge automaticamente `/v1` all'URL base, quindi usa
`https://api.synthetic.new/anthropic` (non `/anthropic/v1`). Se Synthetic
cambia il suo URL base, sovrascrivi `models.providers.synthetic.baseUrl`.
</Warning>

## Esempio di configurazione

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Catalogo modelli

Tutti i modelli Synthetic usano costo `0` (input/output/cache).

| ID modello                                             | Finestra di contesto | Token max | Reasoning | Input          |
| ------------------------------------------------------ | -------------------- | --------- | --------- | -------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000              | 65,536    | no        | testo          |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000              | 8,192     | yes       | testo          |
| `hf:zai-org/GLM-4.7`                                   | 198,000              | 128,000   | no        | testo          |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000              | 8,192     | no        | testo          |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000              | 8,192     | no        | testo          |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000              | 8,192     | no        | testo          |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000              | 8,192     | no        | testo          |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000              | 8,192     | no        | testo          |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000              | 8,192     | no        | testo          |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000              | 8,192     | no        | testo          |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000              | 8,192     | no        | testo          |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000              | 8,192     | yes       | testo + immagine |
| `hf:openai/gpt-oss-120b`                               | 128,000              | 8,192     | no        | testo          |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000              | 8,192     | no        | testo          |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000              | 8,192     | no        | testo          |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000              | 8,192     | no        | testo + immagine |
| `hf:zai-org/GLM-4.5`                                   | 128,000              | 128,000   | no        | testo          |
| `hf:zai-org/GLM-4.6`                                   | 198,000              | 128,000   | no        | testo          |
| `hf:zai-org/GLM-5`                                     | 256,000              | 128,000   | yes       | testo + immagine |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000              | 8,192     | no        | testo          |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000              | 8,192     | yes       | testo          |

<Tip>
I riferimenti modello usano il formato `synthetic/<modelId>`. Usa
`openclaw models list --provider synthetic` per vedere tutti i modelli disponibili nel tuo
account.
</Tip>

<AccordionGroup>
  <Accordion title="Allowlist dei modelli">
    Se abiliti un'allowlist dei modelli (`agents.defaults.models`), aggiungi ogni
    modello Synthetic che prevedi di usare. I modelli non presenti nell'allowlist verranno nascosti
    all'agente.
  </Accordion>

  <Accordion title="Override dell'URL base">
    Se Synthetic cambia il suo endpoint API, sovrascrivi l'URL base nella tua configurazione:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    Ricorda che OpenClaw aggiunge automaticamente `/v1`.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni dei provider.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Dashboard Synthetic e documentazione API.
  </Card>
</CardGroup>
