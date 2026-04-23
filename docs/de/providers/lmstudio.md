---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen.
    - Sie möchten LM Studio einrichten und konfigurieren.
summary: OpenClaw mit LM Studio ausführen
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T14:05:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio ist eine benutzerfreundliche und zugleich leistungsstarke App, um Open-Weight-Modelle auf Ihrer eigenen Hardware auszuführen. Sie ermöglicht die Ausführung von llama.cpp- (GGUF) oder MLX-Modellen (Apple Silicon). Verfügbar als GUI-Paket oder headless-Daemon (`llmster`). Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (headless) und starten Sie dann den lokalen Server:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Den Server starten

Stellen Sie sicher, dass Sie entweder die Desktop-App starten oder den Daemon mit dem folgenden Befehl ausführen:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT aktiviert ist, damit die Nutzung reibungslos läuft. Weitere Informationen finden Sie im [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw benötigt einen LM-Studio-Tokenwert. Setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM-Studio-Authentifizierung deaktiviert ist, verwenden Sie einen beliebigen nicht leeren Tokenwert:

```bash
export LM_API_TOKEN="placeholder-key"
```

Details zur Einrichtung der LM-Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie das Onboarding aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie im Onboarding die Abfrage `Default model`, um Ihr LM-Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM-Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-
Modellreferenzen stellen den Providernamen voran: `lmstudio/qwen/qwen3.5-9b`. Den exakten Schlüssel für
ein Modell finden Sie mit `curl http://localhost:1234/api/v1/models` im Feld `key`.

## Nicht interaktives Onboarding

Verwenden Sie nicht interaktives Onboarding, wenn Sie das Setup skripten möchten (CI, Provisioning, Remote-Bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oder geben Sie Base-URL oder Modell mit API-Schlüssel an:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` verwendet den Modellschlüssel, wie er von LM Studio zurückgegeben wird (z. B. `qwen/qwen3.5-9b`), ohne
das Provider-Präfix `lmstudio/`.

Nicht interaktives Onboarding erfordert `--lmstudio-api-key` (oder `LM_API_TOKEN` in der Umgebung).
Für LM-Studio-Server ohne Authentifizierung funktioniert jeder nicht leere Tokenwert.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, aber `--lmstudio-api-key` wird für LM Studio bevorzugt.

Dadurch werden `models.providers.lmstudio` geschrieben, das Standardmodell auf
`lmstudio/<custom-model-id>` gesetzt und das Auth-Profil `lmstudio:default` geschrieben.

Das interaktive Setup kann nach einer optional bevorzugten Kontextlänge für das Laden fragen und wendet diese auf die erkannten LM-Studio-Modelle an, die in die Konfiguration gespeichert werden.

## Konfiguration

### Kompatibilität mit Streaming-Nutzung

LM Studio ist mit Streaming-Nutzung kompatibel. Wenn es kein OpenAI-förmiges
`usage`-Objekt ausgibt, stellt OpenClaw die Token-Zahlen stattdessen aus llama.cpp-artigen
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

Stellen Sie sicher, dass LM Studio läuft und dass Sie `LM_API_TOKEN` gesetzt haben (für Server ohne Authentifizierung funktioniert jeder nicht leere Tokenwert):

```bash
# Über die Desktop-App starten oder headless:
lms server start --port 1234
```

Prüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

Wenn das Setup HTTP 401 meldet, prüfen Sie Ihren API-Schlüssel:

- Stellen Sie sicher, dass `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Details zur Einrichtung der LM-Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, verwenden Sie für `LM_API_TOKEN` einen beliebigen nicht leeren Tokenwert.

### Just-in-time-Modellladen

LM Studio unterstützt Just-in-time-Modellladen (JIT), bei dem Modelle bei der ersten Anfrage geladen werden. Stellen Sie sicher, dass dies aktiviert ist, um Fehler wie „Model not loaded“ zu vermeiden.
