---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen
summary: Verwenden Sie die Unified API von Kilo Gateway, um in OpenClaw auf viele Modelle zuzugreifen
title: Kilocode
x-i18n:
    generated_at: "2026-04-12T23:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway bietet eine **Unified API**, die Anfragen über einen einzelnen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Base URL.

| Eigenschaft | Wert                               |
| ----------- | ---------------------------------- |
| Provider    | `kilocode`                         |
| Auth        | `KILOCODE_API_KEY`                 |
| API         | OpenAI-kompatibel                  |
| Base URL    | `https://api.kilo.ai/api/gateway/` |

## Erste Schritte

<Steps>
  <Step title="Ein Konto erstellen">
    Gehen Sie zu [app.kilo.ai](https://app.kilo.ai), melden Sie sich an oder erstellen Sie ein Konto, navigieren Sie dann zu API Keys und generieren Sie einen neuen Schlüssel.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Oder setzen Sie die Umgebungsvariable direkt:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Standardmodell

Das Standardmodell ist `kilocode/kilo/auto`, ein Provider-eigenes Smart-Routing-
Modell, das von Kilo Gateway verwaltet wird.

<Note>
OpenClaw behandelt `kilocode/kilo/auto` als stabile Standard-Ref, veröffentlicht jedoch kein quellgestütztes Mapping von Aufgaben zu Upstream-Modellen für diese Route. Das genaue Upstream-Routing hinter `kilocode/kilo/auto` liegt in der Verantwortung von Kilo Gateway und ist in OpenClaw nicht hart codiert.
</Note>

## Verfügbare Modelle

OpenClaw erkennt verfügbare Modelle beim Start dynamisch von Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der für Ihr Konto verfügbaren Modelle zu sehen.

Jedes auf dem Gateway verfügbare Modell kann mit dem Präfix `kilocode/` verwendet werden:

| Modell-Ref                             | Hinweise                           |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Standard — Smart Routing           |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic über Kilo                |
| `kilocode/openai/gpt-5.4`              | OpenAI über Kilo                   |
| `kilocode/google/gemini-3-pro-preview` | Google über Kilo                   |
| ...and many more                       | Verwenden Sie `/models kilocode`, um alle aufzulisten |

<Tip>
Beim Start fragt OpenClaw `GET https://api.kilo.ai/api/gateway/models` ab und führt die erkannten Modelle vor dem statischen Fallback-Katalog zusammen. Der gebündelte Fallback enthält immer `kilocode/kilo/auto` (`Kilo Auto`) mit `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` und `maxTokens: 128000`.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport und Kompatibilität">
    Kilo Gateway ist im Quellcode als OpenRouter-kompatibel dokumentiert, daher bleibt es auf dem Proxy-artigen OpenAI-kompatiblen Pfad statt bei nativer OpenAI-Request-Formung.

    - Gemini-gestützte Kilo-Refs bleiben auf dem Proxy-Gemini-Pfad, daher behält OpenClaw dort die Gemini-Thought-Signature-Bereinigung bei, ohne native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
    - Kilo Gateway verwendet intern einen Bearer-Token mit Ihrem API-Schlüssel.

  </Accordion>

  <Accordion title="Stream-Wrapper und Reasoning">
    Kilos gemeinsamer Stream-Wrapper fügt den Provider-App-Header hinzu und normalisiert Proxy-Reasoning-Payloads für unterstützte konkrete Modell-Refs.

    <Warning>
    `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning überspringen die Reasoning-Injektion. Wenn Sie Reasoning-Unterstützung benötigen, verwenden Sie eine konkrete Modell-Ref wie `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Wenn die Modellerkennung beim Start fehlschlägt, greift OpenClaw auf den gebündelten statischen Katalog mit `kilocode/kilo/auto` zurück.
    - Prüfen Sie, ob Ihr API-Schlüssel gültig ist und ob in Ihrem Kilo-Konto die gewünschten Modelle aktiviert sind.
    - Wenn das Gateway als Daemon läuft, stellen Sie sicher, dass `KILOCODE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo-Gateway-Dashboard, API-Schlüssel und Kontoverwaltung.
  </Card>
</CardGroup>
