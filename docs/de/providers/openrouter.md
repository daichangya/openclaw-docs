---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
summary: Mit der einheitlichen API von OpenRouter in OpenClaw auf viele Modelle zugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Wechseln der Base-URL.

## Erste Schritte

<Steps>
  <Step title="Ihren API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Zu einem bestimmten Modell wechseln">
    Onboarding verwendet standardmäßig `openrouter/auto`. Wählen Sie später ein konkretes Modell:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Konfigurationsbeispiel

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Modell-Referenzen

<Note>
Modell-Refs folgen dem Muster `openrouter/<provider>/<model>`. Die vollständige Liste der
verfügbaren Provider und Modelle finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
</Note>

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten App-Attribution-Header von OpenRouter hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Base-URL umstellen, fügt OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht** ein.
</Warning>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modell-Refs die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker, die OpenClaw für
    eine bessere Wiederverwendung des Prompt-Caches bei System-/Developer-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Routen, die nicht `auto` sind, ordnet OpenClaw die ausgewählte Thinking-Stufe
    OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion.
  </Accordion>

  <Accordion title="Nur-OpenAI-Anfrageformung">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    werden native nur-OpenAI-Anfrageformungen wie `serviceTier`, Responses-`store`,
    OpenAI-Reasoning-kompatible Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    OpenRouter-Refs auf Basis von Gemini bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält dort
    die Bereinigung der Gemini-Thought-Signature bei, aktiviert aber keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    diese als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
