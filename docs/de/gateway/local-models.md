---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Maschine bereitstellen
    - Sie binden LM Studio oder einen OpenAI-kompatiblen Proxy an
    - Sie benötigen die sichersten Empfehlungen für lokale Modelle
summary: OpenClaw mit lokalen LLMs ausführen (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-04-24T06:38:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Lokal ist machbar, aber OpenClaw erwartet großen Kontext + starke Abwehr gegen Prompt Injection. Kleine Karten kürzen den Kontext und schwächen die Sicherheit. Setzen Sie hoch an: **≥2 voll ausgestattete Mac Studios oder eine vergleichbare GPU-Maschine (~30.000 $+)**. Eine einzelne **24-GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Verwenden Sie die **größte / vollwertige Modellvariante, die Sie ausführen können**; aggressiv quantisierte oder „kleine“ Checkpoints erhöhen das Risiko von Prompt Injection (siehe [Sicherheit](/de/gateway/security)).

Wenn Sie die lokale Einrichtung mit möglichst wenig Reibung möchten, beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`. Diese Seite ist der pointierte Leitfaden für leistungsstärkere lokale Stacks und benutzerdefinierte lokale OpenAI-kompatible Server.

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Aktuell der beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard `http://127.0.0.1:1234`) und verwenden Sie Responses API, damit Reasoning vom endgültigen Text getrennt bleibt.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
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
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie „kleine“/stark quantisierte Varianten), starten Sie den Server und prüfen Sie, dass `http://127.0.0.1:1234/v1/models` ihn auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Halten Sie das Modell geladen; Cold-Load erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihr LM-Studio-Build abweicht.
- Für WhatsApp sollten Sie bei Responses API bleiben, damit nur der endgültige Text gesendet wird.

Lassen Sie gehostete Modelle auch dann konfiguriert, wenn Sie lokal arbeiten; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybride Konfiguration: gehostetes primäres Modell, lokaler Fallback

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

### Local-first mit gehostetem Sicherheitsnetz

Tauschen Sie die Reihenfolge von primärem Modell und Fallback; behalten Sie denselben Provider-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine ausfällt.

### Regionales Hosting / Datenrouting

- Gehostete Varianten von MiniMax/Kimi/GLM gibt es auch auf OpenRouter mit regional gebundenen Endpunkten (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante, um den Datenverkehr in Ihrer gewünschten Jurisdiktion zu halten, und verwenden Sie weiterhin `models.mode: "merge"` für Fallbacks auf Anthropic/OpenAI.
- Rein lokal bleibt der stärkste Datenschutzpfad; gehostetes regionales Routing ist der Mittelweg, wenn Sie Anbieterfunktionen benötigen, aber den Datenfluss steuern möchten.

## Andere lokale OpenAI-kompatible Proxys

vLLM, LiteLLM, OAI-proxy oder benutzerdefinierte Gateways funktionieren, wenn sie einen OpenAI-artigen `/v1`-Endpunkt bereitstellen. Ersetzen Sie den obigen Provider-Block durch Ihren Endpunkt und Ihre Modell-ID:

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

Hinweis zum Verhalten lokaler/proxied `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native
  OpenAI-Endpunkte
- native, nur für OpenAI geltende Request-Formung greift hier nicht: kein
  `service_tier`, kein Responses-`store`, keine OpenAI-Reasoning-kompatible Payload-
  Formung und keine Prompt-Cache-Hinweise
- versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
  werden bei diesen benutzerdefinierten Proxy-URLs nicht eingefügt

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Einige Server akzeptieren bei Chat Completions nur Zeichenfolgen in `messages[].content`, nicht
  strukturierte Content-Part-Arrays. Setzen Sie für
  diese Endpunkte `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Einige kleinere oder strengere lokale Backends sind mit der vollständigen
  Agenten-Runtime-Prompt-Struktur von OpenClaw instabil, besonders wenn Tool-Schemas enthalten sind. Wenn das
  Backend für kleine direkte `/v1/chat/completions`-Aufrufe funktioniert, aber bei normalen
  OpenClaw-Agenten-Turns fehlschlägt, versuchen Sie zuerst
  `agents.defaults.experimental.localModelLean: true`, um umfangreiche
  Standard-Tools wie `browser`, `cron` und `message` zu entfernen; dies ist ein experimentelles
  Flag, keine stabile Einstellung für den Standardmodus. Siehe
  [Experimentelle Funktionen](/de/concepts/experimental-features). Wenn das weiterhin fehlschlägt, versuchen Sie
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Wenn das Backend weiterhin nur bei größeren OpenClaw-Läufen fehlschlägt, liegt das verbleibende Problem
  normalerweise an der Kapazität des Upstream-Modells/Servers oder an einem Backend-Fehler, nicht an der
  Transportschicht von OpenClaw.

## Fehlerbehebung

- Kann das Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM-Studio-Modell entladen? Neu laden; Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- OpenClaw warnt, wenn das erkannte Kontextfenster unter **32k** liegt, und blockiert unter **16k**. Wenn Sie auf diese Vorabprüfung stoßen, erhöhen Sie das Kontextlimit von Server/Modell oder wählen Sie ein größeres Modell.
- Kontextfehler? Senken Sie `contextWindow` oder erhöhen Sie Ihr Server-Limit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück?
  Fügen Sie `compat.requiresStringContent: true` beim entsprechenden Modelleintrag hinzu.
- Kleine direkte `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run`
  schlägt bei Gemma oder einem anderen lokalen Modell fehl? Deaktivieren Sie zuerst Tool-Schemas mit
  `compat.supportsTools: false` und testen Sie dann erneut. Wenn der Server weiterhin nur bei
  größeren OpenClaw-Prompts abstürzt, behandeln Sie das als Einschränkung des Upstream-Servers/Modells.
- Sicherheit: Lokale Modelle umgehen anbieterseitige Filter; halten Sie Agenten eng gefasst und lassen Sie Compaction aktiviert, um den Blast Radius von Prompt Injection zu begrenzen.

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Model Failover](/de/concepts/model-failover)
