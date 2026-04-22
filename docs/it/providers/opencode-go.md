---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Hai bisogno dei riferimenti ai modelli runtime per i modelli ospitati su Go
summary: Usa il catalogo OpenCode Go con la configurazione condivisa di OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go è il catalogo Go all'interno di [OpenCode](/it/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l'id provider di runtime
`opencode-go` così l'instradamento upstream per modello resta corretto.

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Provider di runtime | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Setup padre     | [OpenCode](/it/providers/opencode) |

## Modelli supportati

OpenClaw ottiene il catalogo Go dal registro modelli pi bundled. Esegui
`openclaw models list --provider opencode-go` per l'elenco aggiornato dei modelli.

Nel catalogo pi bundled attuale, il provider include:

| Model ref                  | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (limiti 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Per iniziare

<Tabs>
  <Tab title="Interattivo">
    <Steps>
      <Step title="Esegui onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Imposta un modello Go come predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non interattivo">
    <Steps>
      <Step title="Passa la chiave direttamente">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Esempio di configurazione

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Note avanzate

<AccordionGroup>
  <Accordion title="Comportamento di instradamento">
    OpenClaw gestisce automaticamente l'instradamento per modello quando il model ref usa
    `opencode-go/...`. Non è richiesta alcuna configurazione provider aggiuntiva.
  </Accordion>

  <Accordion title="Convenzione dei runtime ref">
    I runtime ref restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
    Questo mantiene corretto l'instradamento upstream per modello in entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    La stessa `OPENCODE_API_KEY` viene usata sia dal catalogo Zen sia da quello Go. Inserire
    la chiave durante il setup memorizza le credenziali per entrambi i provider di runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Vedi [OpenCode](/it/providers/opencode) per la panoramica condivisa dell'onboarding e il riferimento completo
dei cataloghi Zen + Go.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenCode (padre)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
</CardGroup>
