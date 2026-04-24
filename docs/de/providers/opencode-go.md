---
read_when:
    - Sie möchten den OpenCode-Go-Katalog nutzen
    - Sie benötigen die Laufzeit-Modellreferenzen für Go-gehostete Modelle
summary: Den OpenCode-Go-Katalog mit dem gemeinsamen OpenCode-Setup verwenden
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T06:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/de/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Laufzeit-
Provider-ID `opencode-go`, damit das vorgelagerte Routing pro Modell korrekt bleibt.

| Eigenschaft      | Wert                            |
| ---------------- | ------------------------------- |
| Laufzeit-Provider | `opencode-go`                  |
| Auth             | `OPENCODE_API_KEY`              |
| Übergeordnetes Setup | [OpenCode](/de/providers/opencode) |

## Integrierter Katalog

OpenClaw bezieht den Go-Katalog aus der gebündelten Pi-Modell-Registry. Führen Sie
`openclaw models list --provider opencode-go` aus, um die aktuelle Modellliste zu sehen.

Im gebündelten Pi-Katalog enthält der Provider derzeit:

| Modellreferenz             | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (3x-Limits) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Erste Schritte

<Tabs>
  <Tab title="Interaktiv">
    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Ein Go-Modell als Standard setzen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Nicht interaktiv">
    <Steps>
      <Step title="Schlüssel direkt übergeben">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
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

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Routing-Verhalten">
    OpenClaw übernimmt das Routing pro Modell automatisch, wenn die Modellreferenz
    `opencode-go/...` verwendet. Es ist keine zusätzliche Provider-Konfiguration erforderlich.
  </Accordion>

  <Accordion title="Konvention für Laufzeit-Referenzen">
    Laufzeit-Referenzen bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
    So bleibt das vorgelagerte Routing pro Modell über beide Kataloge hinweg korrekt.
  </Accordion>

  <Accordion title="Gemeinsam genutzte Anmeldedaten">
    Derselbe `OPENCODE_API_KEY` wird sowohl vom Zen- als auch vom Go-Katalog verwendet. Wenn
    Sie den Schlüssel während des Setups eingeben, werden Anmeldedaten für beide Laufzeit-Provider gespeichert.
  </Accordion>
</AccordionGroup>

<Tip>
Siehe [OpenCode](/de/providers/opencode) für den gemeinsamen Überblick zum Onboarding und die vollständige
Referenz für Zen- + Go-Katalog.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenCode (übergeordnet)" href="/de/providers/opencode" icon="server">
    Gemeinsames Onboarding, Katalogüberblick und erweiterte Hinweise.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modellreferenzen und Failover-Verhalten auswählen.
  </Card>
</CardGroup>
