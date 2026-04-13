---
read_when:
    - Sie möchten OpenClaw mit Open-Source-Modellen über LM Studio ausführen
    - Sie möchten LM Studio einrichten und konfigurieren
summary: Führe OpenClaw mit LM Studio aus
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio ist eine benutzerfreundliche und zugleich leistungsstarke App, mit der Sie Open-Weight-Modelle auf Ihrer eigenen Hardware ausführen können. Sie ermöglicht das Ausführen von llama.cpp- (GGUF) oder MLX-Modellen (Apple Silicon). Sie ist als GUI-Paket oder als Headless-Daemon (`llmster`) verfügbar. Produkt- und Einrichtungsdokumentation finden Sie unter [lmstudio.ai](https://lmstudio.ai/).

## Schnellstart

1. Installieren Sie LM Studio (Desktop) oder `llmster` (Headless) und starten Sie dann den lokalen Server:

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

Wenn Sie die App verwenden, stellen Sie sicher, dass JIT für ein reibungsloses Erlebnis aktiviert ist. Weitere Informationen finden Sie im [Leitfaden zu LM Studio JIT und TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw benötigt einen LM Studio-Tokenwert. Setzen Sie `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Wenn die LM Studio-Authentifizierung deaktiviert ist, verwenden Sie einen beliebigen nicht leeren Tokenwert:

```bash
export LM_API_TOKEN="placeholder-key"
```

Einzelheiten zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Führen Sie das Onboarding aus und wählen Sie `LM Studio`:

```bash
openclaw onboard
```

5. Verwenden Sie im Onboarding die Eingabeaufforderung `Default model`, um Ihr LM Studio-Modell auszuwählen.

Sie können es auch später festlegen oder ändern:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio-Modellschlüssel folgen dem Format `author/model-name` (z. B. `qwen/qwen3.5-9b`). OpenClaw-Modellreferenzen stellen den Providernamen voran: `lmstudio/qwen/qwen3.5-9b`. Sie finden den genauen Schlüssel für ein Modell, indem Sie `curl http://localhost:1234/api/v1/models` ausführen und im Feld `key` nachsehen.

## Nicht interaktives Onboarding

Verwenden Sie das nicht interaktive Onboarding, wenn Sie die Einrichtung skripten möchten (CI, Bereitstellung, Remote-Bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oder geben Sie mit API-Schlüssel die Basis-URL oder das Modell an:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` verwendet den von LM Studio zurückgegebenen Modellschlüssel (z. B. `qwen/qwen3.5-9b`) ohne das Providerpräfix `lmstudio/`.

Für das nicht interaktive Onboarding ist `--lmstudio-api-key` erforderlich (oder `LM_API_TOKEN` in der Umgebung).
Für nicht authentifizierte LM Studio-Server funktioniert jeder nicht leere Tokenwert.

`--custom-api-key` wird aus Kompatibilitätsgründen weiterhin unterstützt, aber `--lmstudio-api-key` wird für LM Studio bevorzugt.

Dadurch wird `models.providers.lmstudio` geschrieben, das Standardmodell auf
`lmstudio/<custom-model-id>` gesetzt und das Auth-Profil `lmstudio:default` geschrieben.

Die interaktive Einrichtung kann nach einer optionalen bevorzugten Kontextlänge beim Laden fragen und wendet sie auf die erkannten LM Studio-Modelle an, die in der Konfiguration gespeichert werden.

## Konfiguration

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

### LM Studio wurde nicht erkannt

Stellen Sie sicher, dass LM Studio ausgeführt wird und dass Sie `LM_API_TOKEN` gesetzt haben (für nicht authentifizierte Server funktioniert jeder nicht leere Tokenwert):

```bash
# Starten Sie über die Desktop-App oder headless:
lms server start --port 1234
```

Prüfen Sie, ob die API erreichbar ist:

```bash
curl http://localhost:1234/api/v1/models
```

### Authentifizierungsfehler (HTTP 401)

Wenn bei der Einrichtung HTTP 401 gemeldet wird, überprüfen Sie Ihren API-Schlüssel:

- Prüfen Sie, ob `LM_API_TOKEN` mit dem in LM Studio konfigurierten Schlüssel übereinstimmt.
- Einzelheiten zur Einrichtung der LM Studio-Authentifizierung finden Sie unter [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Wenn Ihr Server keine Authentifizierung erfordert, verwenden Sie einen beliebigen nicht leeren Tokenwert für `LM_API_TOKEN`.

### Just-in-Time-Modellladen

LM Studio unterstützt Just-in-Time- (JIT-)Modellladen, bei dem Modelle bei der ersten Anfrage geladen werden. Stellen Sie sicher, dass dies aktiviert ist, um Fehler wie „Model not loaded“ zu vermeiden.
