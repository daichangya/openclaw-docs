---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Box bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy an
    - Sie benötigen die sicherste Anleitung für lokale Modelle
summary: OpenClaw mit lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-04-05T12:42:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Lokale Modelle

Lokal ist machbar, aber OpenClaw erwartet großen Kontext und starke Abwehr gegen Prompt Injection. Kleine Karten kürzen den Kontext und schwächen die Sicherheit. Setzen Sie hoch an: **≥2 voll ausgestattete Mac Studios oder ein gleichwertiges GPU-Setup (~30.000 $+)**. Eine einzelne **24-GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Verwenden Sie die **größte / vollwertige Modellvariante, die Sie ausführen können**; aggressiv quantisierte oder „kleine“ Checkpoints erhöhen das Risiko von Prompt Injection (siehe [Security](/gateway/security)).

Wenn Sie das lokale Setup mit der geringsten Reibung möchten, starten Sie mit [Ollama](/providers/ollama) und `openclaw onboard`. Diese Seite ist der meinungsstarke Leitfaden für höherwertige lokale Stacks und benutzerdefinierte OpenAI-kompatible lokale Server.

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der derzeit beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um Reasoning vom endgültigen Text getrennt zu halten.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checkliste für die Einrichtung**

- Installieren Sie LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie „small“-/stark quantisierte Varianten), starten Sie den Server und bestätigen Sie, dass `http://127.0.0.1:1234/v1/models` ihn auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Halten Sie das Modell geladen; Kaltladen erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn sich Ihr LM-Studio-Build unterscheidet.
- Bleiben Sie für WhatsApp bei der Responses API, damit nur der endgültige Text gesendet wird.

Lassen Sie gehostete Modelle auch dann konfiguriert, wenn Sie lokal ausführen; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybride Konfiguration: gehostetes Primärmodell, lokaler Fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Lokal zuerst mit gehostetem Sicherheitsnetz

Tauschen Sie die Reihenfolge von Primärmodell und Fallback aus; behalten Sie denselben Provider-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Box ausfällt.

### Regionales Hosting / Datenrouting

- Gehostete MiniMax-/Kimi-/GLM-Varianten gibt es auch auf OpenRouter mit regional festgelegten Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante, um den Traffic in Ihrer gewählten Jurisdiktion zu halten, und verwenden Sie trotzdem `models.mode: "merge"` für Anthropic-/OpenAI-Fallbacks.
- Nur lokal bleibt der stärkste Datenschutzpfad; regionales gehostetes Routing ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber Kontrolle über den Datenfluss möchten.

## Andere OpenAI-kompatible lokale Proxys

vLLM, LiteLLM, OAI-proxy oder benutzerdefinierte Gateways funktionieren, wenn sie einen OpenAI-ähnlichen `/v1`-Endpunkt bereitstellen. Ersetzen Sie den obigen Provider-Block durch Ihren Endpunkt und Ihre Modell-ID:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Behalten Sie `models.mode: "merge"` bei, damit gehostete Modelle als Fallbacks verfügbar bleiben.

Verhaltenshinweis für lokale/proxied `/v1`-Backends:

- OpenClaw behandelt diese als OpenAI-kompatible Routen im Proxy-Stil, nicht als native
  OpenAI-Endpunkte
- natives nur-OpenAI-Request-Shaping gilt hier nicht: kein
  `service_tier`, kein Responses-`store`, kein OpenAI-Reasoning-Compat-Payload-
  Shaping und keine Prompt-Cache-Hinweise
- versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
  werden auf diesen benutzerdefinierten Proxy-URLs nicht eingefügt

## Fehlerbehebung

- Kann das Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM-Studio-Modell entladen? Laden Sie es erneut; ein Kaltstart ist eine häufige Ursache für „hängendes“ Verhalten.
- Kontextfehler? Verringern Sie `contextWindow` oder erhöhen Sie das Limit Ihres Servers.
- Sicherheit: Lokale Modelle überspringen providerseitige Filter; halten Sie Agenten eng begrenzt und die Komprimierung aktiviert, um den Wirkungsbereich von Prompt Injection zu begrenzen.
