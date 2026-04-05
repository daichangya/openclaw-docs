---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs
    - Sie möchten Modelle über OpenRouter in OpenClaw ausführen
summary: Verwenden Sie die einheitliche API von OpenRouter, um in OpenClaw auf viele Modelle zuzugreifen
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T12:53:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter bietet eine **einheitliche API**, die Anfragen über einen einzigen
Endpunkt und API-Schlüssel an viele Modelle weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs durch Umstellen der Basis-URL.

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice openrouter-api-key
```

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

## Hinweise

- Modellreferenzen sind `openrouter/<provider>/<model>`.
- Beim Onboarding ist standardmäßig `openrouter/auto` gesetzt. Wechseln Sie später mit
  `openclaw models set openrouter/<provider>/<model>` zu einem konkreten Modell.
- Weitere Optionen für Modelle/Provider finden Sie unter [/concepts/model-providers](/de/concepts/model-providers).
- OpenRouter verwendet intern ein Bearer-Token mit Ihrem API-Schlüssel.
- Bei echten OpenRouter-Anfragen (`https://openrouter.ai/api/v1`) fügt OpenClaw außerdem
  die von OpenRouter dokumentierten Header zur App-Zuordnung hinzu:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw` und
  `X-OpenRouter-Categories: cli-agent`.
- Auf verifizierten OpenRouter-Routen behalten Anthropic-Modellreferenzen außerdem die
  OpenRouter-spezifischen Anthropic-`cache_control`-Marker bei, die OpenClaw für
  eine bessere Wiederverwendung des Prompt-Caches bei System-/Developer-Prompt-Blöcken verwendet.
- Wenn Sie den OpenRouter-Provider auf einen anderen Proxy/eine andere Basis-URL umleiten, injiziert OpenClaw
  diese OpenRouter-spezifischen Header oder Anthropic-Cache-Marker nicht.
- OpenRouter läuft weiterhin über den Proxy-artigen OpenAI-kompatiblen Pfad, daher werden
  native, nur für OpenAI verfügbare Request-Formate wie `serviceTier`, Responses `store`,
  OpenAI-Reasoning-Kompatibilitäts-Payloads und Prompt-Cache-Hinweise nicht weitergeleitet.
- Von Gemini unterstützte OpenRouter-Referenzen bleiben auf dem Proxy-Gemini-Pfad: OpenClaw behält dort
  die Bereinigung von Gemini-Thought-Signaturen bei, aktiviert aber keine native Gemini-
  Replay-Validierung oder Bootstrap-Umschreibungen.
- Auf unterstützten Nicht-`auto`-Routen ordnet OpenClaw die ausgewählte Thinking-Stufe den
  OpenRouter-Proxy-Reasoning-Payloads zu. Nicht unterstützte Modellhinweise und
  `openrouter/auto` überspringen diese Reasoning-Injektion.
- Wenn Sie OpenRouter-Provider-Routing unter den Modellparametern übergeben, leitet OpenClaw
  es als OpenRouter-Routing-Metadaten weiter, bevor die gemeinsamen Stream-Wrapper ausgeführt werden.
