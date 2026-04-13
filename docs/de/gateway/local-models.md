---
read_when:
    - Sie möchten Modelle von Ihrer eigenen GPU-Maschine bereitstellen.
    - Sie richten LM Studio oder einen OpenAI-kompatiblen Proxy ein.
    - Sie benötigen die sicherste Anleitung für lokale Modelle.
summary: Führen Sie OpenClaw auf lokalen LLMs aus (LM Studio, vLLM, LiteLLM, benutzerdefinierte OpenAI-Endpunkte)
title: Lokale Modelle
x-i18n:
    generated_at: "2026-04-13T08:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecb61b3e6e34d3666f9b688cd694d92c5fb211cf8c420fa876f7ccf5789154a
    source_path: gateway/local-models.md
    workflow: 15
---

# Lokale Modelle

Lokal ist machbar, aber OpenClaw erwartet einen großen Kontext sowie starke Abwehrmaßnahmen gegen Prompt Injection. Kleine Karten kürzen den Kontext und schwächen die Sicherheit. Setzen Sie hoch an: **≥2 voll ausgestattete Mac Studios oder ein vergleichbares GPU-System (~30.000 $+)**. Eine einzelne **24-GB**-GPU funktioniert nur für leichtere Prompts mit höherer Latenz. Verwenden Sie die **größte / vollwertige Modellvariante, die Sie ausführen können**; stark quantisierte oder „kleine“ Checkpoints erhöhen das Risiko für Prompt Injection (siehe [Sicherheit](/de/gateway/security)).

Wenn Sie die lokale Einrichtung mit dem geringsten Aufwand möchten, beginnen Sie mit [LM Studio](/de/providers/lmstudio) oder [Ollama](/de/providers/ollama) und `openclaw onboard`. Diese Seite ist der meinungsstarke Leitfaden für hochwertigere lokale Stacks und benutzerdefinierte lokale OpenAI-kompatible Server.

## Empfohlen: LM Studio + großes lokales Modell (Responses API)

Der aktuell beste lokale Stack. Laden Sie ein großes Modell in LM Studio (zum Beispiel einen vollwertigen Qwen-, DeepSeek- oder Llama-Build), aktivieren Sie den lokalen Server (Standard: `http://127.0.0.1:1234`) und verwenden Sie die Responses API, um das Reasoning vom endgültigen Text getrennt zu halten.

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
- Laden Sie in LM Studio den **größten verfügbaren Modell-Build** herunter (vermeiden Sie „kleine“/stark quantisierte Varianten), starten Sie den Server und prüfen Sie, ob `http://127.0.0.1:1234/v1/models` das Modell auflistet.
- Ersetzen Sie `my-local-model` durch die tatsächliche Modell-ID, die in LM Studio angezeigt wird.
- Lassen Sie das Modell geladen; das Kaltladen erhöht die Startlatenz.
- Passen Sie `contextWindow`/`maxTokens` an, wenn Ihr LM-Studio-Build abweicht.
- Für WhatsApp sollten Sie bei der Responses API bleiben, damit nur der endgültige Text gesendet wird.

Behalten Sie gehostete Modelle auch dann konfiguriert, wenn Sie lokal ausführen; verwenden Sie `models.mode: "merge"`, damit Fallbacks verfügbar bleiben.

### Hybride Konfiguration: gehostet als primär, lokal als Fallback

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

Tauschen Sie die Reihenfolge von primärem Modell und Fallback aus; behalten Sie denselben Provider-Block und `models.mode: "merge"` bei, damit Sie auf Sonnet oder Opus zurückfallen können, wenn die lokale Maschine ausfällt.

### Regionales Hosting / Datenrouting

- Gehostete MiniMax-, Kimi- und GLM-Varianten sind auch auf OpenRouter mit regional festgelegten Endpunkten verfügbar (z. B. in den USA gehostet). Wählen Sie dort die regionale Variante, um den Datenverkehr in Ihrer gewünschten Jurisdiktion zu halten und trotzdem `models.mode: "merge"` für Anthropic/OpenAI-Fallbacks zu verwenden.
- Ausschließlich lokal bleibt der stärkste Datenschutzpfad; regionales Hosting ist der Mittelweg, wenn Sie Provider-Funktionen benötigen, aber den Datenfluss kontrollieren möchten.

## Andere OpenAI-kompatible lokale Proxys

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

Verhaltenshinweis für lokale/proxierte `/v1`-Backends:

- OpenClaw behandelt diese als proxyartige OpenAI-kompatible Routen, nicht als native OpenAI-Endpunkte.
- Native, nur für OpenAI geltende Request-Formung gilt hier nicht: kein
  `service_tier`, kein Responses-`store`, keine OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
  und keine Prompt-Cache-Hinweise.
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
  werden bei diesen benutzerdefinierten Proxy-URLs nicht eingefügt.

Kompatibilitätshinweise für strengere OpenAI-kompatible Backends:

- Manche Server akzeptieren bei Chat Completions nur String-Werte in `messages[].content`, keine
  strukturierten Content-Part-Arrays. Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true` für
  diese Endpunkte.
- Manche kleineren oder strengeren lokalen Backends sind mit der vollständigen
  Prompt-Form des OpenClaw-Agent-Runtimes instabil, insbesondere wenn Tool-Schemas enthalten sind. Wenn das
  Backend bei kleinen direkten `/v1/chat/completions`-Aufrufen funktioniert, aber bei normalen
  OpenClaw-Agent-Turns fehlschlägt, versuchen Sie zuerst
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Wenn das Backend weiterhin nur bei größeren OpenClaw-Ausführungen fehlschlägt,
  liegt das verbleibende Problem in der Regel an der Kapazität des vorgeschalteten Modells/Servers
  oder an einem Backend-Fehler, nicht an der Transportebene von OpenClaw.

## Fehlerbehebung

- Kann Gateway den Proxy erreichen? `curl http://127.0.0.1:1234/v1/models`.
- LM-Studio-Modell entladen? Laden Sie es erneut; ein Kaltstart ist eine häufige Ursache für „Hängenbleiben“.
- Kontextfehler? Verringern Sie `contextWindow` oder erhöhen Sie Ihr Server-Limit.
- OpenAI-kompatibler Server gibt `messages[].content ... expected a string` zurück?
  Fügen Sie beim entsprechenden Modelleintrag `compat.requiresStringContent: true` hinzu.
- Kleine direkte `/v1/chat/completions`-Aufrufe funktionieren, aber `openclaw infer model run`
  schlägt bei Gemma oder einem anderen lokalen Modell fehl? Deaktivieren Sie zuerst Tool-Schemas mit
  `compat.supportsTools: false` und testen Sie dann erneut. Wenn der Server weiterhin nur
  bei größeren OpenClaw-Prompts abstürzt, behandeln Sie das als Einschränkung des vorgeschalteten Servers/Modells.
- Sicherheit: Lokale Modelle umgehen providerseitige Filter; halten Sie Agents eng begrenzt und lassen Sie Compaction aktiviert, um den Wirkungsradius von Prompt Injection zu begrenzen.
