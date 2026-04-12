---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Ti servono i riferimenti di modello runtime per i modelli ospitati in Go
summary: Usa il catalogo OpenCode Go con la configurazione condivisa di OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:31:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go è il catalogo Go all’interno di [OpenCode](/it/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l’ID provider runtime
`opencode-go` in modo che l’instradamento upstream per modello resti corretto.

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Runtime provider | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Parent setup     | [OpenCode](/it/providers/opencode) |

## Modelli supportati

| Model ref                  | Name         |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

## Per iniziare

<Tabs>
  <Tab title="Interattivo">
    <Steps>
      <Step title="Esegui l’onboarding">
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
      <Step title="Passa direttamente la chiave">
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
    OpenClaw gestisce automaticamente l’instradamento per modello quando il riferimento del modello usa
    `opencode-go/...`. Non è richiesta alcuna configurazione aggiuntiva del provider.
  </Accordion>

  <Accordion title="Convenzione dei riferimenti runtime">
    I riferimenti runtime restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
    Questo mantiene corretto l’instradamento upstream per modello in entrambi i cataloghi.
  </Accordion>

  <Accordion title="Credenziali condivise">
    La stessa `OPENCODE_API_KEY` viene usata sia dal catalogo Zen sia da quello Go. Inserendo
    la chiave durante la configurazione vengono memorizzate le credenziali per entrambi i provider runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consulta [OpenCode](/it/providers/opencode) per la panoramica condivisa dell’onboarding e il riferimento completo
dei cataloghi Zen + Go.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/it/providers/opencode" icon="server">
    Onboarding condiviso, panoramica del catalogo e note avanzate.
  </Card>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
</CardGroup>
