---
read_when:
    - Sie möchten Synthetic als Modell-Provider verwenden.
    - Sie benötigen einen Synthetic-API-Schlüssel oder die Einrichtung einer Base-URL.
summary: Synthetics Anthropic-kompatible API in OpenClaw verwenden
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T23:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new) stellt Anthropic-kompatible Endpunkte bereit.
OpenClaw registriert es als Provider `synthetic` und verwendet die Anthropic
Messages API.

| Eigenschaft | Wert                                  |
| ----------- | ------------------------------------- |
| Provider    | `synthetic`                           |
| Auth        | `SYNTHETIC_API_KEY`                   |
| API         | Anthropic Messages                    |
| Base-URL    | `https://api.synthetic.new/anthropic` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel abrufen">
    Besorgen Sie sich einen `SYNTHETIC_API_KEY` aus Ihrem Synthetic-Konto, oder lassen Sie sich
    im Onboarding-Assistenten nach einem fragen.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Das Standardmodell prüfen">
    Nach dem Onboarding ist das Standardmodell auf Folgendes gesetzt:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Der Anthropic-Client von OpenClaw hängt automatisch `/v1` an die Base-URL an, verwenden Sie also
`https://api.synthetic.new/anthropic` (nicht `/anthropic/v1`). Falls Synthetic
seine Base-URL ändert, überschreiben Sie `models.providers.synthetic.baseUrl`.
</Warning>

## Konfigurationsbeispiel

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

## Modellkatalog

Alle Synthetic-Modelle verwenden Kosten von `0` (Eingabe/Ausgabe/Cache).

| Modell-ID                                             | Kontextfenster | Max. Tokens | Reasoning | Eingabe      |
| ----------------------------------------------------- | -------------- | ----------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                           | 192,000        | 65,536      | nein      | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                      | 256,000        | 8,192       | ja        | text         |
| `hf:zai-org/GLM-4.7`                                  | 198,000        | 128,000     | nein      | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                     | 128,000        | 8,192       | nein      | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                     | 128,000        | 8,192       | nein      | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                        | 128,000        | 8,192       | nein      | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`               | 128,000        | 8,192       | nein      | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                        | 159,000        | 8,192       | nein      | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                | 128,000        | 8,192       | nein      | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000       | 8,192       | nein      | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                 | 256,000        | 8,192       | nein      | text         |
| `hf:moonshotai/Kimi-K2.5`                             | 256,000        | 8,192       | ja        | text + image |
| `hf:openai/gpt-oss-120b`                              | 128,000        | 8,192       | nein      | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`               | 256,000        | 8,192       | nein      | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`              | 256,000        | 8,192       | nein      | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                 | 250,000        | 8,192       | nein      | text + image |
| `hf:zai-org/GLM-4.5`                                  | 128,000        | 128,000     | nein      | text         |
| `hf:zai-org/GLM-4.6`                                  | 198,000        | 128,000     | nein      | text         |
| `hf:zai-org/GLM-5`                                    | 256,000        | 128,000     | ja        | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                          | 128,000        | 8,192       | nein      | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`               | 256,000        | 8,192       | ja        | text         |

<Tip>
Modell-Refs verwenden die Form `synthetic/<modelId>`. Verwenden Sie
`openclaw models list --provider synthetic`, um alle für Ihr
Konto verfügbaren Modelle anzuzeigen.
</Tip>

<AccordionGroup>
  <Accordion title="Modell-Allowlist">
    Wenn Sie eine Modell-Allowlist aktivieren (`agents.defaults.models`), fügen Sie jedes
    Synthetic-Modell hinzu, das Sie verwenden möchten. Modelle, die nicht in der Allowlist stehen, werden
    vor dem Agenten verborgen.
  </Accordion>

  <Accordion title="Base-URL-Override">
    Falls Synthetic seinen API-Endpunkt ändert, überschreiben Sie die Base-URL in Ihrer Konfiguration:

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

    Denken Sie daran, dass OpenClaw `/v1` automatisch anhängt.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic-Dashboard und API-Dokumentation.
  </Card>
</CardGroup>
