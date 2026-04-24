---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T06:54:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio ist eine benutzerfreundliche und zugleich leistungsfähige App zum Ausführen von Open-Weight-Modellen auf Ihrer eigenen Hardware. Sie ermöglicht das Ausführen von llama.cpp- (GGUF) oder MLX-Modellen (Apple Silicon). Sie ist als GUI-Paket oder als headless Daemon (`llmster`) verfügbar. Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (headless), und starten Sie dann den lokalen Server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Starten Sie den Server

Stellen Sie sicher, dass Sie entweder die Desktop-App starten oder den Daemon mit folgendem Befehl ausführen:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT aktiviert ist, um eine flüssige Nutzung zu gewährleisten. Mehr dazu im [Leitfaden zu LM Studio JIT und TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw benötigt einen Token-Wert für LM Studio. Setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM-Studio-Authentifizierung deaktiviert ist, verwenden Sie einen beliebigen nicht leeren Token-Wert:

```bash
export LM_API_TOKEN="placeholder-key"
```

Details zur Einrichtung der LM-Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie das Onboarding aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie im Onboarding den Prompt `Default model`, um Ihr LM-Studio-Modell auszuwählen.

Sie können es auch später setzen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM-Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-
Modellreferenzen stellen den Providernamen voran: `lmstudio/qwen/qwen3.5-9b`. Den exakten Schlüssel
eines Modells finden Sie mit `curl http://localhost:1234/api/v1/models` im Feld `key`.

## Nicht interaktives Onboarding

Verwenden Sie nicht interaktives Onboarding, wenn Sie die Einrichtung skripten möchten (CI, Provisioning, Remote-Bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oder geben Sie Basis-URL oder Modell mit API-Key an:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` verwendet den Modellschlüssel, wie ihn LM Studio zurückgibt (z. B. `qwen/qwen3.5-9b`), ohne
das Provider-Präfix `lmstudio/`.

Nicht interaktives Onboarding erfordert `--lmstudio-api-key` (oder `LM_API_TOKEN` in der Umgebung).
Für nicht authentifizierte LM-Studio-Server funktioniert jeder nicht leere Token-Wert.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, aber `--lmstudio-api-key` wird für LM Studio bevorzugt.

Dies schreibt `models.providers.lmstudio`, setzt das Standardmodell auf
`lmstudio/<custom-model-id>` und schreibt das Auth-Profil `lmstudio:default`.

Die interaktive Einrichtung kann nach einer optionalen bevorzugten Load-Kontextlänge fragen und wendet sie auf die erkannten LM-Studio-Modelle an, die in die Konfiguration gespeichert werden.

## Konfiguration

### Kompatibilität mit Streaming-Nutzungsdaten

LM Studio ist kompatibel mit Streaming-Nutzungsdaten. Wenn es kein im Stil von OpenAI geformtes
`usage`-Objekt ausgibt, stellt OpenClaw die Token-Zahlen aus llama.cpp-artigen
Metadaten `timings.prompt_n` / `timings.predicted_n` wieder her.

Dasselbe Verhalten gilt für diese OpenAI-kompatiblen lokalen Backends:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Explizite Konfiguration

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Fehlerbehebung

### LM Studio wird nicht erkannt

Stellen Sie sicher, dass LM Studio läuft und dass Sie `LM_API_TOKEN` gesetzt haben (für nicht authentifizierte Server funktioniert jeder nicht leere Token-Wert):

```bash
# Start über die Desktop-App oder headless:
lms server start --port 1234
```

Prüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

Wenn das Setup HTTP 401 meldet, prüfen Sie Ihren API-Key:

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Details zur Einrichtung der LM-Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, verwenden Sie einen beliebigen nicht leeren Token-Wert für `LM_API_TOKEN`.

### Just-in-time-Modellladen

LM Studio unterstützt Just-in-time- (JIT-) Modellladen, wobei Modelle beim ersten Request geladen werden. Stellen Sie sicher, dass dies aktiviert ist, um Fehler wie „Model not loaded“ zu vermeiden.

## Verwandt

- [Modellauswahl](/de/concepts/model-providers)
- [Ollama](/de/providers/ollama)
- [Lokale Modelle](/de/gateway/local-models)
