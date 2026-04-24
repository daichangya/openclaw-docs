---
read_when:
    - Sie möchten von OpenCode gehosteten Modellzugriff.
    - Sie möchten zwischen den Zen- und Go-Katalogen wählen.
summary: OpenCode-Zen- und Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T06:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode stellt in OpenClaw zwei gehostete Kataloge bereit:

| Katalog | Präfix            | Runtime-Provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Beide Kataloge verwenden denselben OpenCode-API-Key. OpenClaw hält die Runtime-Provider-IDs
getrennt, damit das Upstream-Routing pro Modell korrekt bleibt, aber Onboarding und Dokumentation behandeln sie
als ein gemeinsames OpenCode-Setup.

## Erste Schritte

<Tabs>
  <Tab title="Zen-Katalog">
    **Am besten geeignet für:** den kuratierten Multi-Model-Proxy von OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ein Zen-Modell als Standard setzen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verifizieren, dass Modelle verfügbar sind">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go-Katalog">
    **Am besten geeignet für:** die von OpenCode gehostete Kimi-, GLM- und MiniMax-Auswahl.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Ein Go-Modell als Standard setzen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verifizieren, dass Modelle verfügbar sind">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Eingebaute Kataloge

### Zen

| Eigenschaft      | Wert                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime-Provider | `opencode`                                                              |
| Beispielmodelle  | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Eigenschaft      | Wert                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime-Provider | `opencode-go`                                                            |
| Beispielmodelle  | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="API-Key-Aliase">
    `OPENCODE_ZEN_API_KEY` wird ebenfalls als Alias für `OPENCODE_API_KEY` unterstützt.
  </Accordion>

  <Accordion title="Gemeinsam genutzte Zugangsdaten">
    Wenn Sie während des Setups einen OpenCode-Schlüssel eingeben, werden die Zugangsdaten für beide Runtime-
    Provider gespeichert. Sie müssen nicht für jeden Katalog separat ein Onboarding durchführen.
  </Accordion>

  <Accordion title="Abrechnung und Dashboard">
    Sie melden sich bei OpenCode an, hinterlegen Abrechnungsdaten und kopieren Ihren API-Key. Abrechnung
    und Verfügbarkeit der Kataloge werden im OpenCode-Dashboard verwaltet.
  </Accordion>

  <Accordion title="Replay-Verhalten bei Gemini">
    Gemini-gestützte OpenCode-Referenzen bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw
    dort die Bereinigung von Gemini-Thought-Signaturen bei, ohne native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
  </Accordion>

  <Accordion title="Replay-Verhalten bei Nicht-Gemini">
    Nicht-Gemini-OpenCode-Referenzen behalten die minimale OpenAI-kompatible Replay-Richtlinie.
  </Accordion>
</AccordionGroup>

<Tip>
Wenn Sie während des Setups einen OpenCode-Schlüssel eingeben, werden Zugangsdaten sowohl für die Zen- als auch für die
Go-Runtime-Provider gespeichert, sodass ein einmaliges Onboarding ausreicht.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agents, Modelle und Provider.
  </Card>
</CardGroup>
