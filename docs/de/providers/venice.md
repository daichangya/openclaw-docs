---
read_when:
    - Sie möchten datenschutzorientierte Inferenz in OpenClaw
    - Sie möchten Einrichtungsanleitungen für Venice AI
summary: Verwenden Sie die datenschutzorientierten Modelle von Venice AI in OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T12:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (Venice-Highlight)

**Venice** ist unser hervorgehobenes Venice-Setup für datenschutzorientierte Inferenz mit optionalem anonymisiertem Zugriff auf proprietäre Modelle.

Venice AI bietet datenschutzorientierte KI-Inferenz mit Unterstützung für unzensierte Modelle und Zugriff auf große proprietäre Modelle über ihren anonymisierten Proxy. Jede Inferenz ist standardmäßig privat – kein Training auf Ihren Daten, keine Protokollierung.

## Warum Venice in OpenClaw

- **Private Inferenz** für Open-Source-Modelle (keine Protokollierung).
- **Unzensierte Modelle**, wenn Sie sie benötigen.
- **Anonymisierter Zugriff** auf proprietäre Modelle (Opus/GPT/Gemini), wenn Qualität entscheidend ist.
- OpenAI-kompatible `/v1`-Endpunkte.

## Datenschutzmodi

Venice bietet zwei Datenschutzstufen – deren Verständnis ist entscheidend für die Wahl Ihres Modells:

| Modus | Beschreibung | Modelle |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privat** | Vollständig privat. Prompts/Antworten werden **nie gespeichert oder protokolliert**. Ephemer. | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored usw. |
| **Anonymisiert** | Über Venice weitergeleitet, wobei Metadaten entfernt werden. Der zugrunde liegende Provider (OpenAI, Anthropic, Google, xAI) sieht anonymisierte Anfragen. | Claude, GPT, Gemini, Grok |

## Funktionen

- **Datenschutzorientiert**: Wählen Sie zwischen den Modi „private“ (vollständig privat) und „anonymized“ (über Proxy)
- **Unzensierte Modelle**: Zugriff auf Modelle ohne Inhaltsbeschränkungen
- **Zugriff auf große Modelle**: Verwenden Sie Claude, GPT, Gemini und Grok über den anonymisierten Proxy von Venice
- **OpenAI-kompatible API**: Standard-`/v1`-Endpunkte zur einfachen Integration
- **Streaming**: ✅ Auf allen Modellen unterstützt
- **Funktionsaufrufe**: ✅ Auf ausgewählten Modellen unterstützt (prüfen Sie die Modellfähigkeiten)
- **Vision**: ✅ Auf Modellen mit Vision-Fähigkeit unterstützt
- **Keine harten Ratenlimits**: Bei extremer Nutzung kann Fair-Use-Drosselung gelten

## Einrichtung

### 1. API-Schlüssel abrufen

1. Registrieren Sie sich unter [venice.ai](https://venice.ai)
2. Gehen Sie zu **Settings → API Keys → Create new key**
3. Kopieren Sie Ihren API-Schlüssel (Format: `vapi_xxxxxxxxxxxx`)

### 2. OpenClaw konfigurieren

**Option A: Umgebungsvariable**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Option B: Interaktive Einrichtung (empfohlen)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Dadurch wird:

1. nach Ihrem API-Schlüssel gefragt (oder ein vorhandener `VENICE_API_KEY` verwendet)
2. alle verfügbaren Venice-Modelle angezeigt
3. Ihnen ermöglicht, Ihr Standardmodell auszuwählen
4. der Provider automatisch konfiguriert

**Option C: Nicht-interaktiv**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Einrichtung überprüfen

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hallo, funktionierst du?"
```

## Modellauswahl

Nach der Einrichtung zeigt OpenClaw alle verfügbaren Venice-Modelle an. Wählen Sie je nach Bedarf:

- **Standardmodell**: `venice/kimi-k2-5` für starke private Reasoning-Fähigkeiten plus Vision.
- **Option mit hoher Leistungsfähigkeit**: `venice/claude-opus-4-6` für den stärksten anonymisierten Venice-Pfad.
- **Datenschutz**: Wählen Sie „private“-Modelle für vollständig private Inferenz.
- **Fähigkeiten**: Wählen Sie „anonymized“-Modelle, um über den Proxy von Venice auf Claude, GPT und Gemini zuzugreifen.

Ändern Sie Ihr Standardmodell jederzeit:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Alle verfügbaren Modelle auflisten:

```bash
openclaw models list | grep venice
```

## Über `openclaw configure` konfigurieren

1. Führen Sie `openclaw configure` aus
2. Wählen Sie **Model/auth**
3. Wählen Sie **Venice AI**

## Welches Modell sollte ich verwenden?

| Anwendungsfall | Empfohlenes Modell | Warum |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Allgemeiner Chat (Standard)** | `kimi-k2-5` | Starke private Reasoning-Fähigkeiten plus Vision |
| **Beste Gesamtqualität** | `claude-opus-4-6` | Stärkste anonymisierte Venice-Option |
| **Datenschutz + Programmierung** | `qwen3-coder-480b-a35b-instruct` | Privates Coding-Modell mit großem Kontext |
| **Private Vision** | `kimi-k2-5` | Vision-Unterstützung ohne Verlassen des privaten Modus |
| **Schnell + günstig** | `qwen3-4b` | Leichtgewichtiges Reasoning-Modell |
| **Komplexe private Aufgaben** | `deepseek-v3.2` | Starkes Reasoning, aber keine Venice-Tool-Unterstützung |
| **Unzensiert** | `venice-uncensored` | Keine Inhaltsbeschränkungen |

## Verfügbare Modelle (insgesamt 41)

### Private Modelle (26) – vollständig privat, keine Protokollierung

| Modell-ID | Name | Kontext | Funktionen |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5` | Kimi K2.5 | 256k | Standard, Reasoning, Vision |
| `kimi-k2-thinking` | Kimi K2 Thinking | 256k | Reasoning |
| `llama-3.3-70b` | Llama 3.3 70B | 128k | Allgemein |
| `llama-3.2-3b` | Llama 3.2 3B | 128k | Allgemein |
| `hermes-3-llama-3.1-405b` | Hermes 3 Llama 3.1 405B | 128k | Allgemein, Tools deaktiviert |
| `qwen3-235b-a22b-thinking-2507` | Qwen3 235B Thinking | 128k | Reasoning |
| `qwen3-235b-a22b-instruct-2507` | Qwen3 235B Instruct | 128k | Allgemein |
| `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B | 256k | Coding |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo | 256k | Coding |
| `qwen3-5-35b-a3b` | Qwen3.5 35B A3B | 256k | Reasoning, Vision |
| `qwen3-next-80b` | Qwen3 Next 80B | 256k | Allgemein |
| `qwen3-vl-235b-a22b` | Qwen3 VL 235B (Vision) | 256k | Vision |
| `qwen3-4b` | Venice Small (Qwen3 4B) | 32k | Schnell, Reasoning |
| `deepseek-v3.2` | DeepSeek V3.2 | 160k | Reasoning, Tools deaktiviert |
| `venice-uncensored` | Venice Uncensored (Dolphin-Mistral) | 32k | Unzensiert, Tools deaktiviert |
| `mistral-31-24b` | Venice Medium (Mistral) | 128k | Vision |
| `google-gemma-3-27b-it` | Google Gemma 3 27B Instruct | 198k | Vision |
| `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 128k | Allgemein |
| `nvidia-nemotron-3-nano-30b-a3b` | NVIDIA Nemotron 3 Nano 30B | 128k | Allgemein |
| `olafangensan-glm-4.7-flash-heretic` | GLM 4.7 Flash Heretic | 128k | Reasoning |
| `zai-org-glm-4.6` | GLM 4.6 | 198k | Allgemein |
| `zai-org-glm-4.7` | GLM 4.7 | 198k | Reasoning |
| `zai-org-glm-4.7-flash` | GLM 4.7 Flash | 128k | Reasoning |
| `zai-org-glm-5` | GLM 5 | 198k | Reasoning |
| `minimax-m21` | MiniMax M2.1 | 198k | Reasoning |
| `minimax-m25` | MiniMax M2.5 | 198k | Reasoning |

### Anonymisierte Modelle (15) – über Venice-Proxy

| Modell-ID | Name | Kontext | Funktionen |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6` | Claude Opus 4.6 (über Venice) | 1M | Reasoning, Vision |
| `claude-opus-4-5` | Claude Opus 4.5 (über Venice) | 198k | Reasoning, Vision |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 (über Venice) | 1M | Reasoning, Vision |
| `claude-sonnet-4-5` | Claude Sonnet 4.5 (über Venice) | 198k | Reasoning, Vision |
| `openai-gpt-54` | GPT-5.4 (über Venice) | 1M | Reasoning, Vision |
| `openai-gpt-53-codex` | GPT-5.3 Codex (über Venice) | 400k | Reasoning, Vision, Coding |
| `openai-gpt-52` | GPT-5.2 (über Venice) | 256k | Reasoning |
| `openai-gpt-52-codex` | GPT-5.2 Codex (über Venice) | 256k | Reasoning, Vision, Coding |
| `openai-gpt-4o-2024-11-20` | GPT-4o (über Venice) | 128k | Vision |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (über Venice) | 128k | Vision |
| `gemini-3-1-pro-preview` | Gemini 3.1 Pro (über Venice) | 1M | Reasoning, Vision |
| `gemini-3-pro-preview` | Gemini 3 Pro (über Venice) | 198k | Reasoning, Vision |
| `gemini-3-flash-preview` | Gemini 3 Flash (über Venice) | 256k | Reasoning, Vision |
| `grok-41-fast` | Grok 4.1 Fast (über Venice) | 1M | Reasoning, Vision |
| `grok-code-fast-1` | Grok Code Fast 1 (über Venice) | 256k | Reasoning, Coding |

## Modellerkennung

OpenClaw erkennt Modelle automatisch über die Venice-API, wenn `VENICE_API_KEY` gesetzt ist. Wenn die API nicht erreichbar ist, wird auf einen statischen Katalog zurückgegriffen.

Der Endpunkt `/models` ist öffentlich zugänglich (keine Authentifizierung zum Auflisten erforderlich), aber für Inferenz ist ein gültiger API-Schlüssel erforderlich.

## Streaming- und Tool-Unterstützung

| Funktion | Unterstützung |
| -------------------- | ------------------------------------------------------- |
| **Streaming** | ✅ Alle Modelle |
| **Funktionsaufrufe** | ✅ Die meisten Modelle (prüfen Sie `supportsFunctionCalling` in der API) |
| **Vision/Bilder** | ✅ Modelle mit dem Merkmal „Vision“ |
| **JSON-Modus** | ✅ Über `response_format` unterstützt |

## Preise

Venice verwendet ein kreditbasiertes System. Prüfen Sie [venice.ai/pricing](https://venice.ai/pricing) für aktuelle Tarife:

- **Private Modelle**: Im Allgemeinen geringere Kosten
- **Anonymisierte Modelle**: Ähnlich wie direkte API-Preise + kleine Venice-Gebühr

## Vergleich: Venice vs. direkte API

| Aspekt | Venice (anonymisiert) | Direkte API |
| ------------ | ----------------------------- | ------------------- |
| **Datenschutz** | Metadaten entfernt, anonymisiert | Ihr Konto ist verknüpft |
| **Latenz** | +10-50ms (Proxy) | Direkt |
| **Funktionen** | Die meisten Funktionen unterstützt | Vollständige Funktionen |
| **Abrechnung** | Venice-Credits | Provider-Abrechnung |

## Verwendungsbeispiele

```bash
# Das private Standardmodell verwenden
openclaw agent --model venice/kimi-k2-5 --message "Schneller Gesundheitscheck"

# Claude Opus über Venice verwenden (anonymisiert)
openclaw agent --model venice/claude-opus-4-6 --message "Fasse diese Aufgabe zusammen"

# Unzensiertes Modell verwenden
openclaw agent --model venice/venice-uncensored --message "Optionen entwerfen"

# Vision-Modell mit Bild verwenden
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Angehängtes Bild prüfen"

# Coding-Modell verwenden
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Diese Funktion refaktorieren"
```

## Fehlerbehebung

### API-Schlüssel wird nicht erkannt

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Stellen Sie sicher, dass der Schlüssel mit `vapi_` beginnt.

### Modell nicht verfügbar

Der Venice-Modellkatalog wird dynamisch aktualisiert. Führen Sie `openclaw models list` aus, um die derzeit verfügbaren Modelle anzuzeigen. Einige Modelle können vorübergehend offline sein.

### Verbindungsprobleme

Die Venice-API befindet sich unter `https://api.venice.ai/api/v1`. Stellen Sie sicher, dass Ihr Netzwerk HTTPS-Verbindungen zulässt.

## Beispiel für eine Konfigurationsdatei

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Links

- [Venice AI](https://venice.ai)
- [API-Dokumentation](https://docs.venice.ai)
- [Preise](https://venice.ai/pricing)
- [Status](https://status.venice.ai)
