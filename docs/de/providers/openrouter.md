---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs გამოიყენું
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
    - Sie möchten OpenRouter für die Bildgenerierung verwenden
summary: Die einheitliche API von OpenRouter verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T06:55:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzelnen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, sodass die meisten OpenAI-SDKs durch Umschalten der Base-URL funktionieren.

## Erste Schritte

<Steps>
  <Step title="Ihren API-Schlüssel holen">
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

Gebündelte Fallback-Beispiele:

| Modell-Ref                           | Hinweise                       |
| ------------------------------------ | ------------------------------ |
| `openrouter/auto`                    | Automatisches Routing von OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 über MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | OpenRouter-Healer-Alpha-Route  |
| `openrouter/openrouter/hunter-alpha` | OpenRouter-Hunter-Alpha-Route  |

## Bildgenerierung

OpenRouter kann auch das Tool `image_generate` unterstützen. Verwenden Sie ein OpenRouter-Bildmodell unter `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw sendet Bildanfragen an die Bild-API für Chat-Completions von OpenRouter mit `modalities: ["image", "text"]`. Gemini-Bildmodelle erhalten unterstützte Hinweise für `aspectRatio` und `resolution` über `image_config` von OpenRouter.

## Authentifizierung und Header

OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.

Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
die dokumentierten Header zur App-Attribution von OpenRouter hinzu:

| Header                    | Wert                  |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Wenn Sie den OpenRouter-Provider auf einen anderen Proxy oder eine andere Base-URL umleiten, injiziert OpenClaw
diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker **nicht**.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anthropic-Cache-Marker">
    Auf verifizierten OpenRouter-Routen behalten Anthropic-Modell-Refs die
    OpenRouter-spezifischen Anthropic-`cache_control`-Marker bei, die OpenClaw für
    bessere Wiederverwendung des Prompt-Caches bei System-/Developer-Prompt-Blöcken verwendet.
  </Accordion>

  <Accordion title="Thinking-/Reasoning-Injektion">
    Auf unterstützten Nicht-`auto`-Routen bildet OpenClaw die ausgewählte Thinking-Stufe auf
    Reasoning-Payloads des OpenRouter-Proxys ab. Nicht unterstützte Modell-Hinweise und
    `openrouter/auto` überspringen diese Reasoning-Injektion.
  </Accordion>

  <Accordion title="Nur-OpenAI-Request-Shaping">
    OpenRouter läuft weiterhin über den proxyartigen OpenAI-kompatiblen Pfad, daher
    werden natives nur-OpenAI-Request-Shaping wie `serviceTier`, Responses `store`,
    OpenAI-Reasoning-kompatible Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
  </Accordion>

  <Accordion title="Gemini-gestützte Routen">
    Gemini-gestützte OpenRouter-Refs bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält dort
    die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert jedoch keine native Gemini-
    Replay-Validierung oder Bootstrap-Umschreibungen.
  </Accordion>

  <Accordion title="Provider-Routing-Metadaten">
    Wenn Sie OpenRouter-Provider-Routing unter Modellparametern übergeben, leitet OpenClaw
    es als Routing-Metadaten von OpenRouter weiter, bevor die gemeinsamen Stream-Wrapper laufen.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
