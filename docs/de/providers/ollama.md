---
read_when:
    - Sie möchten OpenClaw mit Cloud- oder lokalen Modellen über Ollama ausführen
    - Sie benötigen Anleitungen für Einrichtung und Konfiguration von Ollama
summary: OpenClaw mit Ollama ausführen (Cloud- und lokale Modelle)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T12:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama ist eine lokale LLM-Laufzeitumgebung, mit der sich Open-Source-Modelle einfach auf Ihrem Rechner ausführen lassen. OpenClaw integriert sich in die native API von Ollama (`/api/chat`), unterstützt Streaming und Tool-Calling und kann lokale Ollama-Modelle automatisch erkennen, wenn Sie dies mit `OLLAMA_API_KEY` (oder einem Authentifizierungsprofil) aktivieren und keinen expliziten Eintrag `models.providers.ollama` definieren.

<Warning>
**Für Remote-Ollama-Nutzer**: Verwenden Sie mit OpenClaw nicht die OpenAI-kompatible URL `/v1` (`http://host:11434/v1`). Dadurch wird Tool-Calling beeinträchtigt, und Modelle können rohe Tool-JSON als Klartext ausgeben. Verwenden Sie stattdessen die native Ollama-API-URL: `baseUrl: "http://host:11434"` (ohne `/v1`).
</Warning>

## Schnellstart

### Onboarding (empfohlen)

Der schnellste Weg, Ollama einzurichten, ist über das Onboarding:

```bash
openclaw onboard
```

Wählen Sie **Ollama** aus der Provider-Liste. Das Onboarding wird:

1. nach der Ollama-Base-URL fragen, unter der Ihre Instanz erreichbar ist (Standard `http://127.0.0.1:11434`).
2. Sie zwischen **Cloud + Local** (Cloud-Modelle und lokale Modelle) oder **Local** (nur lokale Modelle) wählen lassen.
3. einen Browser-Anmeldefluss öffnen, wenn Sie **Cloud + Local** wählen und nicht bei ollama.com angemeldet sind.
4. verfügbare Modelle erkennen und Standardwerte vorschlagen.
5. das ausgewählte Modell automatisch ziehen, wenn es lokal nicht verfügbar ist.

Der nicht interaktive Modus wird ebenfalls unterstützt:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

Optional können Sie eine benutzerdefinierte Base-URL oder ein Modell angeben:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Manuelle Einrichtung

1. Installieren Sie Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Ziehen Sie ein lokales Modell, wenn Sie lokale Inferenz verwenden möchten:

```bash
ollama pull glm-4.7-flash
# oder
ollama pull gpt-oss:20b
# oder
ollama pull llama3.3
```

3. Wenn Sie auch Cloud-Modelle möchten, melden Sie sich an:

```bash
ollama signin
```

4. Führen Sie das Onboarding aus und wählen Sie `Ollama`:

```bash
openclaw onboard
```

- `Local`: nur lokale Modelle
- `Cloud + Local`: lokale Modelle plus Cloud-Modelle
- Cloud-Modelle wie `kimi-k2.5:cloud`, `minimax-m2.5:cloud` und `glm-5:cloud` erfordern **kein** lokales `ollama pull`

OpenClaw schlägt derzeit vor:

- lokaler Standard: `glm-4.7-flash`
- Cloud-Standards: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Wenn Sie die manuelle Einrichtung bevorzugen, aktivieren Sie Ollama direkt für OpenClaw (jeder Wert funktioniert; Ollama benötigt keinen echten Schlüssel):

```bash
# Umgebungsvariable setzen
export OLLAMA_API_KEY="ollama-local"

# Oder in Ihrer Konfigurationsdatei konfigurieren
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Modelle prüfen oder wechseln:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Oder den Standardwert in der Konfiguration setzen:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Modellerkennung (impliziter Provider)

Wenn Sie `OLLAMA_API_KEY` (oder ein Authentifizierungsprofil) setzen und **keinen** Eintrag `models.providers.ollama` definieren, erkennt OpenClaw Modelle aus der lokalen Ollama-Instanz unter `http://127.0.0.1:11434`:

- Fragt `/api/tags` ab
- Verwendet nach bestem Bemühen `/api/show`-Abfragen, um `contextWindow` zu lesen, wenn verfügbar
- Markiert `reasoning` mit einer Modellnamens-Heuristik (`r1`, `reasoning`, `think`)
- Setzt `maxTokens` auf die von OpenClaw verwendete Standard-Max-Token-Grenze für Ollama
- Setzt alle Kosten auf `0`

Dadurch werden manuelle Modelleinträge vermieden, während der Katalog mit der lokalen Ollama-Instanz abgestimmt bleibt.

So sehen Sie, welche Modelle verfügbar sind:

```bash
ollama list
openclaw models list
```

Um ein neues Modell hinzuzufügen, ziehen Sie es einfach mit Ollama:

```bash
ollama pull mistral
```

Das neue Modell wird automatisch erkannt und kann direkt verwendet werden.

Wenn Sie `models.providers.ollama` explizit setzen, wird die automatische Erkennung übersprungen, und Sie müssen Modelle manuell definieren (siehe unten).

## Konfiguration

### Grundlegende Einrichtung (implizite Erkennung)

Der einfachste Weg, Ollama zu aktivieren, ist über eine Umgebungsvariable:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Explizite Einrichtung (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- Ollama auf einem anderen Host/Port läuft.
- Sie bestimmte Kontextfenster oder Modelllisten erzwingen möchten.
- Sie vollständig manuelle Modelldefinitionen möchten.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Wenn `OLLAMA_API_KEY` gesetzt ist, können Sie `apiKey` im Provider-Eintrag weglassen, und OpenClaw ergänzt ihn für Verfügbarkeitsprüfungen.

### Benutzerdefinierte Base-URL (explizite Konfiguration)

Wenn Ollama auf einem anderen Host oder Port läuft (eine explizite Konfiguration deaktiviert die automatische Erkennung, daher müssen Sie Modelle manuell definieren):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // Kein /v1 - native Ollama-API-URL verwenden
        api: "ollama", // Explizit setzen, um natives Tool-Calling-Verhalten sicherzustellen
      },
    },
  },
}
```

<Warning>
Fügen Sie der URL kein `/v1` hinzu. Der Pfad `/v1` verwendet den OpenAI-kompatiblen Modus, in dem Tool-Calling nicht zuverlässig ist. Verwenden Sie die Basis-Ollama-URL ohne Pfadsuffix.
</Warning>

### Modellauswahl

Sobald alles konfiguriert ist, sind alle Ihre Ollama-Modelle verfügbar:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Cloud-Modelle

Cloud-Modelle ermöglichen es Ihnen, in der Cloud gehostete Modelle (zum Beispiel `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) zusammen mit Ihren lokalen Modellen auszuführen.

Um Cloud-Modelle zu verwenden, wählen Sie bei der Einrichtung den Modus **Cloud + Local**. Der Assistent prüft, ob Sie angemeldet sind, und öffnet bei Bedarf einen Browser-Anmeldefluss. Wenn die Authentifizierung nicht verifiziert werden kann, fällt der Assistent auf Standardwerte für lokale Modelle zurück.

Sie können sich auch direkt unter [ollama.com/signin](https://ollama.com/signin) anmelden.

## Ollama Web Search

OpenClaw unterstützt auch **Ollama Web Search** als gebündelten `web_search`-
Provider.

- Dabei wird Ihr konfigurierter Ollama-Host verwendet (`models.providers.ollama.baseUrl`, wenn gesetzt, andernfalls `http://127.0.0.1:11434`).
- Er benötigt keinen Schlüssel.
- Er setzt voraus, dass Ollama läuft und Sie mit `ollama signin` angemeldet sind.

Wählen Sie **Ollama Web Search** bei `openclaw onboard` oder
`openclaw configure --section web`, oder setzen Sie:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Die vollständigen Details zu Einrichtung und Verhalten finden Sie unter [Ollama Web Search](/tools/ollama-search).

## Erweitert

### Reasoning-Modelle

OpenClaw behandelt Modelle mit Namen wie `deepseek-r1`, `reasoning` oder `think` standardmäßig als reasoning-fähig:

```bash
ollama pull deepseek-r1:32b
```

### Modellkosten

Ollama ist kostenlos und läuft lokal, daher sind alle Modellkosten auf $0 gesetzt.

### Streaming-Konfiguration

Die Ollama-Integration von OpenClaw verwendet standardmäßig die **native Ollama-API** (`/api/chat`), die Streaming und Tool-Calling gleichzeitig vollständig unterstützt. Es ist keine besondere Konfiguration erforderlich.

#### Veralteter OpenAI-kompatibler Modus

<Warning>
**Tool-Calling ist im OpenAI-kompatiblen Modus nicht zuverlässig.** Verwenden Sie diesen Modus nur, wenn Sie das OpenAI-Format für einen Proxy benötigen und nicht von nativem Tool-Calling-Verhalten abhängig sind.
</Warning>

Wenn Sie stattdessen den OpenAI-kompatiblen Endpunkt verwenden müssen (z. B. hinter einem Proxy, der nur das OpenAI-Format unterstützt), setzen Sie explizit `api: "openai-completions"`:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // Standard: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Dieser Modus unterstützt möglicherweise Streaming + Tool-Calling nicht gleichzeitig. Unter Umständen müssen Sie Streaming mit `params: { streaming: false }` in der Modellkonfiguration deaktivieren.

Wenn `api: "openai-completions"` mit Ollama verwendet wird, fügt OpenClaw standardmäßig `options.num_ctx` ein, damit Ollama nicht stillschweigend auf ein Kontextfenster von 4096 zurückfällt. Wenn Ihr Proxy/Upstream unbekannte `options`-Felder ablehnt, deaktivieren Sie dieses Verhalten:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: false,
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

### Kontextfenster

Bei automatisch erkannten Modellen verwendet OpenClaw das von Ollama gemeldete Kontextfenster, wenn es verfügbar ist, andernfalls fällt es auf das von OpenClaw verwendete Standard-Kontextfenster für Ollama zurück. Sie können `contextWindow` und `maxTokens` in der expliziten Provider-Konfiguration überschreiben.

## Fehlerbehebung

### Ollama wird nicht erkannt

Stellen Sie sicher, dass Ollama läuft, dass Sie `OLLAMA_API_KEY` (oder ein Authentifizierungsprofil) gesetzt haben und dass Sie **keinen** expliziten Eintrag `models.providers.ollama` definiert haben:

```bash
ollama serve
```

Und dass die API erreichbar ist:

```bash
curl http://localhost:11434/api/tags
```

### Keine Modelle verfügbar

Wenn Ihr Modell nicht aufgeführt ist, dann entweder:

- Ziehen Sie das Modell lokal, oder
- Definieren Sie das Modell explizit in `models.providers.ollama`.

So fügen Sie Modelle hinzu:

```bash
ollama list  # Anzeigen, was installiert ist
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Oder ein anderes Modell
```

### Verbindung abgelehnt

Prüfen Sie, ob Ollama auf dem richtigen Port läuft:

```bash
# Prüfen, ob Ollama läuft
ps aux | grep ollama

# Oder Ollama neu starten
ollama serve
```

## Siehe auch

- [Modell-Provider](/de/concepts/model-providers) - Überblick über alle Provider
- [Modellauswahl](/de/concepts/models) - So wählen Sie Modelle aus
- [Konfiguration](/de/gateway/configuration) - Vollständige Konfigurationsreferenz
