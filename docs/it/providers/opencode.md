---
read_when:
    - Vuoi l'accesso ai modelli ospitati su OpenCode
    - Vuoi scegliere tra i cataloghi Zen e Go
summary: Usa i cataloghi OpenCode Zen e Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode espone due cataloghi ospitati in OpenClaw:

| Catalogo | Prefisso          | Provider runtime |
| -------- | ----------------- | ---------------- |
| **Zen**  | `opencode/...`    | `opencode`       |
| **Go**   | `opencode-go/...` | `opencode-go`    |

Entrambi i cataloghi usano la stessa chiave API OpenCode. OpenClaw mantiene separati
gli ID dei provider runtime in modo che l'instradamento upstream per modello resti corretto,
ma onboarding e documentazione li trattano come un'unica configurazione OpenCode.

## Per iniziare

<Tabs>
  <Tab title="Catalogo Zen">
    **Ideale per:** il proxy multi-modello OpenCode curato (Claude, GPT, Gemini).

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Imposta un modello Zen come predefinito">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifica che i modelli siano disponibili">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalogo Go">
    **Ideale per:** la gamma Kimi, GLM e MiniMax ospitata da OpenCode.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oppure passa direttamente la chiave:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## Esempio di configurazione

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Cataloghi

### Zen

| Proprietà        | Valore                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Provider runtime | `opencode`                                                              |
| Modelli di esempio | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| Proprietà        | Valore                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Provider runtime | `opencode-go`                                                            |
| Modelli di esempio | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Note avanzate

<AccordionGroup>
  <Accordion title="Alias della chiave API">
    `OPENCODE_ZEN_API_KEY` è supportato anche come alias di `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Credenziali condivise">
    Inserendo una sola chiave OpenCode durante la configurazione vengono memorizzate le credenziali per entrambi i
    provider runtime. Non è necessario eseguire l'onboarding di ciascun catalogo separatamente.
  </Accordion>

  <Accordion title="Fatturazione e dashboard">
    Accedi a OpenCode, aggiungi i dettagli di fatturazione e copia la tua chiave API. La fatturazione
    e la disponibilità dei cataloghi sono gestite dalla dashboard di OpenCode.
  </Accordion>

  <Accordion title="Comportamento di replay di Gemini">
    I riferimenti OpenCode basati su Gemini restano sul percorso proxy-Gemini, quindi OpenClaw mantiene
    lì la sanitizzazione della thought-signature di Gemini senza abilitare la validazione di replay nativa di Gemini
    o le riscritture bootstrap.
  </Accordion>

  <Accordion title="Comportamento di replay non-Gemini">
    I riferimenti OpenCode non-Gemini mantengono la policy minima di replay compatibile con OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Inserendo una sola chiave OpenCode durante la configurazione vengono memorizzate le credenziali sia per i provider runtime Zen sia per quelli
Go, quindi ti basta eseguire l'onboarding una sola volta.
</Tip>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
