---
read_when:
    - Sie möchten modellgehosteten Zugriff über OpenCode.
    - Sie möchten zwischen den Zen- und Go-Katalogen wählen.
summary: OpenCode-Zen- und Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-04-12T23:32:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a68444d8c403c3caba4a18ea47f078c7a4c163f874560e1fad0e818afb6e0e60
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode stellt in OpenClaw zwei gehostete Kataloge bereit:

| Katalog | Präfix            | Laufzeit-Provider |
| ------- | ----------------- | ----------------- |
| **Zen** | `opencode/...`    | `opencode`        |
| **Go**  | `opencode-go/...` | `opencode-go`     |

Beide Kataloge verwenden denselben OpenCode-API-Schlüssel. OpenClaw hält die Laufzeit-Provider-IDs
getrennt, damit das Upstream-Routing pro Modell korrekt bleibt, aber Onboarding und Dokumentation behandeln sie
als eine gemeinsame OpenCode-Einrichtung.

## Erste Schritte

<Tabs>
  <Tab title="Zen-Katalog">
    **Am besten geeignet für:** den kuratierten OpenCode-Multi-Modell-Proxy (Claude, GPT, Gemini).

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
      <Step title="Ein Zen-Modell als Standard festlegen">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
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
      <Step title="Ein Go-Modell als Standard festlegen">
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
</Tabs>

## Konfigurationsbeispiel

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Kataloge

### Zen

| Eigenschaft      | Wert                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| Laufzeit-Provider | `opencode`                                                             |
| Beispielmodelle  | `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro` |

### Go

| Eigenschaft      | Wert                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| Laufzeit-Provider | `opencode-go`                                                           |
| Beispielmodelle  | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="API-Schlüssel-Aliasse">
    `OPENCODE_ZEN_API_KEY` wird ebenfalls als Alias für `OPENCODE_API_KEY` unterstützt.
  </Accordion>

  <Accordion title="Gemeinsam genutzte Anmeldedaten">
    Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Anmeldedaten für beide Laufzeit-
    Provider gespeichert. Sie müssen nicht jedes Katalog-Setup separat durchlaufen.
  </Accordion>

  <Accordion title="Abrechnung und Dashboard">
    Sie melden sich bei OpenCode an, hinterlegen Abrechnungsdaten und kopieren Ihren API-Schlüssel. Abrechnung
    und Katalogverfügbarkeit werden über das OpenCode-Dashboard verwaltet.
  </Accordion>

  <Accordion title="Gemini-Replay-Verhalten">
    Gemini-gestützte OpenCode-Refs bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw
    dort die Bereinigung von Gemini-Thought-Signaturen bei, ohne native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
  </Accordion>

  <Accordion title="Nicht-Gemini-Replay-Verhalten">
    OpenCode-Refs, die nicht auf Gemini basieren, behalten die minimale OpenAI-kompatible Replay-Richtlinie.
  </Accordion>
</AccordionGroup>

<Tip>
Wenn Sie während der Einrichtung einen OpenCode-Schlüssel eingeben, werden Anmeldedaten sowohl für die Zen- als auch für die
Go-Laufzeit-Provider gespeichert, sodass Sie das Onboarding nur einmal durchführen müssen.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
