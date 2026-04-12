---
read_when:
    - Sie möchten den OpenCode-Go-Katalog
    - Sie benötigen die Laufzeit-Modell-Referenzen für Go-gehostete Modelle
summary: Den OpenCode-Go-Katalog mit der gemeinsamen OpenCode-Einrichtung verwenden
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-12T23:32:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f0f182de81729616ccc19125d93ba0445de2349daf7067b52e8c15b9d3539c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Laufzeit-
Provider-ID `opencode-go`, damit das Upstream-Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Laufzeit-Provider | `opencode-go`                  |
| Authentifizierung | `OPENCODE_API_KEY`             |
| Übergeordnete Einrichtung | [OpenCode](/de/providers/opencode) |

## Unterstützte Modelle

| Modell-Ref                 | Name         |
| -------------------------- | ------------ |
| `opencode-go/kimi-k2.5`    | Kimi K2.5    |
| `opencode-go/glm-5`        | GLM 5        |
| `opencode-go/minimax-m2.5` | MiniMax M2.5 |

## Erste Schritte

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Routing-Verhalten">
    OpenClaw übernimmt das Routing pro Modell automatisch, wenn die Modell-Ref
    `opencode-go/...` verwendet. Keine zusätzliche Provider-Konfiguration ist erforderlich.
  </Accordion>

  <Accordion title="Laufzeit-Ref-Konvention">
    Laufzeit-Refs bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    Dadurch bleibt das Upstream-Routing pro Modell in beiden Katalogen korrekt.
  </Accordion>

  <Accordion title="Gemeinsame Anmeldedaten">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Wenn Sie
    den Schlüssel während der Einrichtung eingeben, werden Anmeldedaten für beide Laufzeit-Provider gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Siehe [OpenCode](/de/providers/opencode) für den gemeinsamen Überblick zum Onboarding und die vollständige
Referenz für den Zen- und Go-Katalog.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogüberblick und erweiterte Hinweise.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
</CardGroup>
