---
read_when:
    - Sie möchten einen einzigen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über Kilo Gateway in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von Kilo Gateway, um in OpenClaw auf viele Modelle zuzugreifen
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T12:53:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch das Umstellen der Basis-URL.

## Einen API-Schlüssel erhalten

1. Gehen Sie zu [app.kilo.ai](https://app.kilo.ai)
2. Melden Sie sich an oder erstellen Sie ein Konto
3. Navigieren Sie zu API Keys und erzeugen Sie einen neuen Schlüssel

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Oder setzen Sie die Umgebungsvariable:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

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

## Standardmodell

Das Standardmodell ist `kilocode/kilo/auto`, ein provider-eigenes Smart-Routing-
Modell, das von Kilo Gateway verwaltet wird.

OpenClaw behandelt `kilocode/kilo/auto` als stabile Standardreferenz, veröffentlicht aber
keine quellengestützte Zuordnung von Aufgaben zu Upstream-Modellen für diese Route.

## Verfügbare Modelle

OpenClaw erkennt verfügbare Modelle beim Start dynamisch über Kilo Gateway. Verwenden Sie
`/models kilocode`, um die vollständige Liste der mit Ihrem Konto verfügbaren Modelle anzuzeigen.

Jedes auf dem Gateway verfügbare Modell kann mit dem Präfix `kilocode/` verwendet werden:

```
kilocode/kilo/auto              (Standard - Smart Routing)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...und viele mehr
```

## Hinweise

- Modellreferenzen sind `kilocode/<model-id>` (z. B. `kilocode/anthropic/claude-sonnet-4`).
- Standardmodell: `kilocode/kilo/auto`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der gebündelte Fallback-Katalog enthält immer `kilocode/kilo/auto` (`Kilo Auto`) mit
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`
  und `maxTokens: 128000`
- Beim Start versucht OpenClaw `GET https://api.kilo.ai/api/gateway/models` und
  führt erkannte Modelle vor dem statischen Fallback-Katalog zusammen
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` gehört zu Kilo Gateway
  und ist nicht fest in OpenClaw codiert
- Kilo Gateway ist im Quellcode als OpenRouter-kompatibel dokumentiert und bleibt daher auf
  dem OpenAI-kompatiblen Pfad im Proxy-Stil statt bei nativem OpenAI-Request-Shaping
- Kilo-Referenzen mit Gemini im Hintergrund bleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw dort
  weiterhin die Bereinigung von Gemini-Thought-Signaturen beibehält, ohne native Gemini-
  Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
- Der gemeinsame Stream-Wrapper von Kilo fügt den Provider-App-Header hinzu und normalisiert
  Proxy-Reasoning-Payloads für unterstützte konkrete Modellreferenzen. `kilocode/kilo/auto`
  und andere Hinweise ohne Unterstützung für Proxy-Reasoning überspringen diese Reasoning-Injektion.
- Weitere Modell-/Provider-Optionen finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
- Kilo Gateway verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.
