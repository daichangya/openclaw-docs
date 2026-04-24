---
read_when:
    - Medienverarbeitung entwerfen oder überarbeiten.
    - Vorverarbeitung eingehender Audio-/Video-/Bildmedien abstimmen.
summary: Verarbeitung eingehender Bilder/Audio/Video (optional) mit Provider- und CLI-Fallbacks
title: Medienverarbeitung
x-i18n:
    generated_at: "2026-04-24T06:46:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medienverarbeitung - eingehend (2026-01-17)

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Reply-Pipeline läuft. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn die Verarbeitung deaktiviert ist, erhalten Modelle die ursprünglichen Dateien/URLs weiterhin wie gewohnt.

Anbieterspezifisches Medienverhalten wird von Vendor-Plugins registriert, während OpenClaw
Core die gemeinsame `tools.media`-Konfiguration, die Fallback-Reihenfolge und die Integration in die Reply-Pipeline besitzt.

## Ziele

- Optional: eingehende Medien in kurzen Text vorverdauen für schnelleres Routing + besseres Parsing von Befehlen.
- Ursprüngliche Medienzustellung an das Modell immer erhalten.
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback erlauben (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

1. Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **der erste**).
3. Den ersten geeigneten Modelleintrag wählen (Größe + Fähigkeit + Auth).
4. Wenn ein Modell fehlschlägt oder das Medium zu groß ist, **auf den nächsten Eintrag zurückfallen**.
5. Bei Erfolg:
   - `Body` wird zu einem Block `[Image]`, `[Audio]` oder `[Video]`.
   - Audio setzt `{{Transcript}}`; das Parsing von Befehlen verwendet Caption-Text, wenn vorhanden, andernfalls das Transkript.
   - Captions bleiben als `User text:` im Block erhalten.

Wenn die Verarbeitung fehlschlägt oder deaktiviert ist, **läuft der Reply-Flow weiter** mit dem ursprünglichen Body + den Anhängen.

## Überblick über die Konfiguration

`tools.media` unterstützt **gemeinsame Modelle** plus Überschreibungen pro Fähigkeit:

- `tools.media.models`: gemeinsame Modellliste (verwenden Sie `capabilities` zum Gating).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram-Audio-Optionen über `tools.media.audio.providerOptions.deepgram`
  - Echo-Steuerung für Audio-Transkripte (`echoTranscript`, Standard `false`; `echoFormat`)
  - optionale **`models`-Liste pro Fähigkeit** (wird vor gemeinsamen Modellen bevorzugt)
  - Richtlinie für `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (optionales Gating nach Channel/chatType/Sitzungsschlüssel)
- `tools.media.concurrency`: maximale gleichzeitige Läufe pro Fähigkeit (Standard **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* gemeinsame Liste */
      ],
      image: {
        /* optionale Überschreibungen */
      },
      audio: {
        /* optionale Überschreibungen */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optionale Überschreibungen */
      },
    },
  },
}
```

### Modell-Einträge

Jeder Eintrag in `models[]` kann **Provider** oder **CLI** sein:

```json5
{
  type: "provider", // Standard, wenn weggelassen
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Beschreibe das Bild in <= 500 Zeichen.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, verwendet für multimodale Einträge
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI-Templates können außerdem verwenden:

- `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
- `{{OutputDir}}` (Scratch-Verzeichnis, das für diesen Lauf erstellt wurde)
- `{{OutputBase}}` (Basis-Pfad der Scratch-Datei, ohne Erweiterung)

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (vollständiges Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10 MB**
  - Audio: **20 MB**
  - Video: **50 MB**

Regeln:

- Wenn ein Medium `maxBytes` überschreitet, wird dieses Modell übersprungen und **das nächste Modell versucht**.
- Audiodateien kleiner als **1024 Byte** werden als leer/korrupt behandelt und vor der Provider-/CLI-Transkription übersprungen.
- Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
- `prompt` verwendet standardmäßig ein einfaches „Beschreibe das {media}.“ plus den Hinweis auf `maxChars` (nur Bild/Video).
- Wenn das aktive primäre Bildmodell Vision bereits nativ unterstützt, überspringt OpenClaw
  den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das
  Modell.
- Wenn ein primäres Modell für Gateway/WebChat nur Text unterstützt, bleiben Bildanhänge
  als ausgelagerte Referenzen `media://inbound/*` erhalten, sodass das Bild-Tool oder das konfigurierte
  Bildmodell sie weiterhin prüfen kann, statt den Anhang zu verlieren.
- Explizite Requests `openclaw infer image describe --model <provider/model>` sind etwas anderes: Sie führen dieses bildfähige Provider/Modell direkt aus, einschließlich
  Ollama-Referenzen wie `ollama/qwen2.5vl:7b`.
- Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw
  das **aktive Reply-Modell**, wenn dessen Provider die Fähigkeit unterstützt.

### Automatische Erkennung der Medienverarbeitung (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine
Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten
funktionierenden Option**:

1. **Aktives Reply-Modell**, wenn sein Provider die Fähigkeit unterstützt.
2. **`agents.defaults.imageModel`**-Referenzen primary/fallback (nur Bild).
3. **Lokale CLIs** (nur Audio; falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
4. **Gemini CLI** (`gemini`) mit `read_many_files`
5. **Provider-Authentifizierung**
   - Konfigurierte Einträge `models.providers.*`, die die Fähigkeit unterstützen, werden
     vor der gebündelten Fallback-Reihenfolge versucht.
   - Nur-Bild-Konfigurations-Provider mit einem bildfähigen Modell registrieren sich automatisch für die Medienverarbeitung, selbst wenn sie kein gebündeltes Vendor-Plugin sind.
   - Ollama-Bildverarbeitung ist verfügbar, wenn sie explizit ausgewählt wird, zum
     Beispiel über `agents.defaults.imageModel` oder
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Gebündelte Fallback-Reihenfolge:
     - Audio: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - Bild: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Um die automatische Erkennung zu deaktivieren, setzen Sie:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Hinweis: Die Erkennung von Binärdateien erfolgt best-effort auf macOS/Linux/Windows; stellen Sie sicher, dass die CLI in `PATH` liegt (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

### Unterstützung für Proxy-Umgebungsvariablen (Provider-Modelle)

Wenn providerbasierte Medienverarbeitung für **Audio** und **Video** aktiviert ist, berücksichtigt OpenClaw
Standard-Umgebungsvariablen für ausgehende Proxys bei HTTP-Aufrufen an Provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Env-Variablen gesetzt sind, verwendet die Medienverarbeitung direkte Egress-Verbindungen.
Wenn der Proxy-Wert fehlerhaft formatiert ist, protokolliert OpenClaw eine Warnung und greift auf direkten
Fetch zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, wird der Eintrag nur für diese Medientypen ausgeführt. Für gemeinsame
Listen kann OpenClaw Standardwerte ableiten:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Jeder Katalog `models.providers.<id>.models[]` mit einem bildfähigen Modell:
  **image**

Für CLI-Einträge sollten Sie **`capabilities` explizit setzen**, um überraschende Treffer zu vermeiden.
Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste geeignet, in der er erscheint.

## Provider-Support-Matrix (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                                                         | Hinweise                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bild       | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurations-Provider | Vendor-Plugins registrieren Bildunterstützung; `openai-codex/*` verwendet OAuth-Provider-Plumbing; `codex/*` verwendet einen begrenzten Codex-App-Server-Turn; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurations-Provider registrieren sich automatisch. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                                                      | Provider-Transkription (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                               |
| Video      | Google, Qwen, Moonshot                                                                                                       | Provider-Videoverarbeitung über Vendor-Plugins; Qwen-Videoverarbeitung verwendet die Standard-DashScope-Endpunkte.                                                                                                                        |

Hinweis zu MiniMax:

- Die Bildverarbeitung für `minimax` und `minimax-portal` kommt vom pluginverwalteten
  Medienprovider `MiniMax-VL-01`.
- Der gebündelte Textkatalog von MiniMax startet weiterhin nur mit Text; explizite
  Einträge `models.providers.minimax` materialisieren bildfähige M2.7-Chat-Referenzen.

## Hinweise zur Modellauswahl

- Bevorzugen Sie das stärkste Modell der neuesten Generation, das für die jeweilige Medienfähigkeit verfügbar ist, wenn Qualität und Sicherheit wichtig sind.
- Für Tool-aktivierte Agenten mit nicht vertrauenswürdigen Inputs sollten ältere/schwächere Medienmodelle vermieden werden.
- Halten Sie mindestens einen Fallback pro Fähigkeit bereit, damit Verfügbarkeit gegeben ist (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wurde); Nicht-`txt`-Formate greifen auf stdout zurück.

## Richtlinie für Anhänge

`attachments` pro Fähigkeit steuert, welche Anhänge verarbeitet werden:

- `mode`: `first` (Standard) oder `all`
- `maxAttachments`: begrenzt die Anzahl der verarbeiteten Anhänge (Standard **1**)
- `prefer`: `first`, `last`, `path`, `url`

Wenn `mode: "all"` gesetzt ist, werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

Verhalten bei der Extraktion von Dateianhängen:

- Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** verpackt, bevor er
  an den Medien-Prompt angehängt wird.
- Der injizierte Block verwendet explizite Boundary-Marker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad zur Anhangsextraktion lässt absichtlich das lange
  Banner `SECURITY NOTICE:` weg, um den Medien-Prompt nicht aufzublähen; die Boundary-
  Marker und Metadaten bleiben dennoch erhalten.
- Wenn eine Datei keinen extrahierbaren Text hat, injiziert OpenClaw `[No extractable text]`.
- Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt
  den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei,
  weil dieser Schritt der Anhangsextraktion Textblöcke weiterleitet und nicht die gerenderten PDF-Bilder.

## Konfigurationsbeispiele

### 1) Gemeinsame Modellliste + Überschreibungen

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Nur Audio + Video (Bild aus)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Optionale Bildverarbeitung

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.5" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Lies das Medium unter {{MediaPath}} und beschreibe es in <= {{MaxChars}} Zeichen.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Einzelner multimodaler Eintrag (explizite Fähigkeiten)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Statusausgabe

Wenn die Medienverarbeitung läuft, enthält `/status` eine kurze Zusammenfassungszeile:

```text
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Fähigkeit und – sofern zutreffend – den gewählten Provider/das gewählte Modell.

## Hinweise

- Die Verarbeitung ist **best-effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, selbst wenn die Verarbeitung deaktiviert ist.
- Verwenden Sie `scope`, um einzuschränken, wo die Verarbeitung läuft (z. B. nur in DMs).

## Verwandte Dokumentation

- [Configuration](/de/gateway/configuration)
- [Image & Media Support](/de/nodes/images)
