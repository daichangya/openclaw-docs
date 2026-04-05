---
read_when:
    - Beim Entwerfen oder Refaktorieren des Medienverständnisses
    - Beim Abstimmen der Vorverarbeitung eingehender Audios/Videos/Bilder
summary: Verstehen eingehender Bilder/Audios/Videos (optional) mit Provider- und CLI-Fallbacks
title: Medienverständnis
x-i18n:
    generated_at: "2026-04-05T12:49:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medienverständnis - eingehend (2026-01-17)

OpenClaw kann **eingehende Medien zusammenfassen** (Bild/Audio/Video), bevor die Antwortpipeline läuft. Es erkennt automatisch, wenn lokale Tools oder Provider-Schlüssel verfügbar sind, und kann deaktiviert oder angepasst werden. Wenn das Verständnis deaktiviert ist, erhalten Modelle wie gewohnt weiterhin die ursprünglichen Dateien/URLs.

Anbieterspezifisches Medienverhalten wird von Anbieter-Plugins registriert, während der
OpenClaw-Core die gemeinsame Konfiguration `tools.media`, die Fallback-Reihenfolge und die Integration in die Antwortpipeline besitzt.

## Ziele

- Optional: eingehende Medien in kurzen Text vorverdauen, um schnelleres Routing und bessere Befehlsauswertung zu ermöglichen.
- Ursprüngliche Medienzustellung an das Modell immer beibehalten.
- **Provider-APIs** und **CLI-Fallbacks** unterstützen.
- Mehrere Modelle mit geordnetem Fallback zulassen (Fehler/Größe/Timeout).

## Verhalten auf hoher Ebene

1. Eingehende Anhänge sammeln (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Für jede aktivierte Fähigkeit (Bild/Audio/Video) Anhänge gemäß Richtlinie auswählen (Standard: **erstes**).
3. Den ersten zulässigen Modelleintrag auswählen (Größe + Fähigkeit + Auth).
4. Wenn ein Modell fehlschlägt oder die Medien zu groß sind, **auf den nächsten Eintrag zurückfallen**.
5. Bei Erfolg:
   - `Body` wird zu einem `[Image]`-, `[Audio]`- oder `[Video]`-Block.
   - Audio setzt `{{Transcript}}`; die Befehlsauswertung verwendet, wenn vorhanden, den Bildunterschriftstext, andernfalls das Transkript.
   - Bildunterschriften bleiben als `User text:` innerhalb des Blocks erhalten.

Wenn das Verständnis fehlschlägt oder deaktiviert ist, **läuft der Antwortablauf weiter** mit dem ursprünglichen Body + den Anhängen.

## Konfigurationsüberblick

`tools.media` unterstützt **gemeinsame Modelle** sowie Überschreibungen pro Fähigkeit:

- `tools.media.models`: gemeinsame Modellliste (verwenden Sie `capabilities` zur Begrenzung).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - Standardwerte (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - Provider-Überschreibungen (`baseUrl`, `headers`, `providerOptions`)
  - Deepgram-Audiooptionen über `tools.media.audio.providerOptions.deepgram`
  - Echo-Steuerung für Audiotranskripte (`echoTranscript`, Standard `false`; `echoFormat`)
  - optionale **Modellliste pro Fähigkeit** `models` (wird vor gemeinsamen Modellen bevorzugt)
  - Richtlinie für `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (optionale Begrenzung nach Kanal/Chat-Typ/Sitzungsschlüssel)
- `tools.media.concurrency`: maximale Anzahl gleichzeitiger Fähigkeitsläufe (Standard **2**).

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

### Modelleinträge

Jeder Eintrag in `models[]` kann **provider** oder **cli** sein:

```json5
{
  type: "provider", // Standard, wenn weggelassen
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, für multimodale Einträge verwendet
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
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI-Vorlagen können außerdem Folgendes verwenden:

- `{{MediaDir}}` (Verzeichnis, das die Mediendatei enthält)
- `{{OutputDir}}` (temporäres Verzeichnis, das für diesen Lauf erstellt wird)
- `{{OutputBase}}` (Basispfad der temporären Datei, ohne Erweiterung)

## Standardwerte und Limits

Empfohlene Standardwerte:

- `maxChars`: **500** für Bild/Video (kurz, befehlsfreundlich)
- `maxChars`: **nicht gesetzt** für Audio (volles Transkript, sofern Sie kein Limit setzen)
- `maxBytes`:
  - Bild: **10MB**
  - Audio: **20MB**
  - Video: **50MB**

Regeln:

- Wenn Medien `maxBytes` überschreiten, wird dieses Modell übersprungen und **das nächste Modell versucht**.
- Audiodateien kleiner als **1024 Bytes** werden als leer/beschädigt behandelt und vor der Provider-/CLI-Transkription übersprungen.
- Wenn das Modell mehr als `maxChars` zurückgibt, wird die Ausgabe gekürzt.
- `prompt` verwendet standardmäßig ein einfaches „Describe the {media}.“ plus die `maxChars`-Anweisung (nur Bild/Video).
- Wenn das aktive primäre Bildmodell bereits nativ Vision unterstützt, überspringt OpenClaw
  den Zusammenfassungsblock `[Image]` und übergibt stattdessen das Originalbild an das
  Modell.
- Wenn `<capability>.enabled: true` gesetzt ist, aber keine Modelle konfiguriert sind, versucht OpenClaw das
  **aktive Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.

### Medienverständnis automatisch erkennen (Standard)

Wenn `tools.media.<capability>.enabled` **nicht** auf `false` gesetzt ist und Sie keine
Modelle konfiguriert haben, erkennt OpenClaw automatisch in dieser Reihenfolge und **stoppt bei der ersten
funktionierenden Option**:

1. **Aktives Antwortmodell**, wenn dessen Provider die Fähigkeit unterstützt.
2. **`agents.defaults.imageModel`** Primär-/Fallback-Referenzen (nur Bild).
3. **Lokale CLIs** (nur Audio; wenn installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte tiny-Modell)
   - `whisper` (Python CLI; lädt Modelle automatisch herunter)
4. **Gemini CLI** (`gemini`) mit `read_many_files`
5. **Provider-Auth**
   - Konfigurierte Einträge `models.providers.*`, die die Fähigkeit unterstützen, werden
     vor der gebündelten Fallback-Reihenfolge versucht.
   - Nur-Bild-Konfigurationsprovider mit einem bildfähigen Modell werden automatisch für
     Medienverständnis registriert, selbst wenn sie kein gebündeltes Anbieter-Plugin sind.
   - Gebündelte Fallback-Reihenfolge:
     - Audio: OpenAI → Groq → Deepgram → Google → Mistral
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

Hinweis: Die Erkennung von Binärdateien erfolgt best-effort unter macOS/Linux/Windows; stellen Sie sicher, dass sich die CLI im `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

### Proxy-Unterstützung per Umgebungsvariablen (Provider-Modelle)

Wenn providerbasiertes Medienverständnis für **Audio** und **Video** aktiviert ist, berücksichtigt OpenClaw
Standard-Umgebungsvariablen für ausgehende Proxys bei HTTP-Aufrufen an Provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-env-Variablen gesetzt sind, verwendet das Medienverständnis direkten ausgehenden Verkehr.
Wenn der Proxy-Wert fehlerhaft ist, protokolliert OpenClaw eine Warnung und fällt auf direkten
Abruf zurück.

## Fähigkeiten (optional)

Wenn Sie `capabilities` setzen, läuft der Eintrag nur für diese Medientypen. Für gemeinsame
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
- `deepgram`: **audio**
- Jeder Katalog `models.providers.<id>.models[]` mit einem bildfähigen Modell:
  **image**

Bei CLI-Einträgen sollten Sie `capabilities` **explizit setzen**, um überraschende Treffer zu vermeiden.
Wenn Sie `capabilities` weglassen, ist der Eintrag für die Liste zulässig, in der er erscheint.

## Matrix der Provider-Unterstützung (OpenClaw-Integrationen)

| Fähigkeit | Provider-Integration                                                                  | Hinweise                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Bild       | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, Konfigurationsprovider | Anbieter-Plugins registrieren Bildunterstützung; MiniMax und MiniMax OAuth verwenden beide `MiniMax-VL-01`; bildfähige Konfigurationsprovider werden automatisch registriert. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                                | Provider-Transkription (Whisper/Deepgram/Gemini/Voxtral).                                                                                |
| Video      | Google, Qwen, Moonshot                                                                 | Videoverständnis über Provider per Anbieter-Plugins; das Qwen-Videoverständnis verwendet die Standard-DashScope-Endpunkte.              |

Hinweis zu MiniMax:

- Das Bildverständnis von `minimax` und `minimax-portal` stammt vom plugin-eigenen
  Medienprovider `MiniMax-VL-01`.
- Der gebündelte MiniMax-Textkatalog beginnt weiterhin nur mit Text; explizite
  Einträge `models.providers.minimax` materialisieren bildfähige M2.7-Chat-Referenzen.

## Hinweise zur Modellauswahl

- Bevorzugen Sie das stärkste Modell der neuesten Generation, das für die jeweilige Medienfähigkeit verfügbar ist, wenn Qualität und Sicherheit wichtig sind.
- Vermeiden Sie bei tool-fähigen Agents, die mit nicht vertrauenswürdigen Eingaben arbeiten, ältere/schwächere Medienmodelle.
- Halten Sie pro Fähigkeit mindestens einen Fallback für Verfügbarkeit bereit (Qualitätsmodell + schnelleres/günstigeres Modell).
- CLI-Fallbacks (`whisper-cli`, `whisper`, `gemini`) sind nützlich, wenn Provider-APIs nicht verfügbar sind.
- Hinweis zu `parakeet-mlx`: Mit `--output-dir` liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn das Ausgabeformat `txt` ist (oder nicht angegeben wird); Nicht-`txt`-Formate fallen auf stdout zurück.

## Richtlinie für Anhänge

`attachments` pro Fähigkeit steuert, welche Anhänge verarbeitet werden:

- `mode`: `first` (Standard) oder `all`
- `maxAttachments`: begrenzt die Anzahl der verarbeiteten Anhänge (Standard **1**)
- `prefer`: `first`, `last`, `path`, `url`

Wenn `mode: "all"` gesetzt ist, werden Ausgaben mit `[Image 1/2]`, `[Audio 2/2]` usw. beschriftet.

Verhalten bei der Extraktion von Dateianhängen:

- Extrahierter Dateitext wird als **nicht vertrauenswürdiger externer Inhalt** umschlossen, bevor er
  an den Medien-Prompt angehängt wird.
- Der injizierte Block verwendet explizite Begrenzungsmarker wie
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` und enthält eine
  Metadatenzeile `Source: External`.
- Dieser Pfad zur Extraktion von Anhängen lässt das lange Banner
  `SECURITY NOTICE:` absichtlich weg, um den Medien-Prompt nicht aufzublähen; die Begrenzungsmarker
  und Metadaten bleiben jedoch erhalten.
- Wenn eine Datei keinen extrahierbaren Text hat, injiziert OpenClaw `[No extractable text]`.
- Wenn ein PDF in diesem Pfad auf gerenderte Seitenbilder zurückfällt, behält der Medien-Prompt
  den Platzhalter `[PDF content rendered to images; images not forwarded to model]` bei,
  weil dieser Schritt der Anhangsextraktion Textblöcke weiterleitet, nicht die gerenderten PDF-Bilder.

## Konfigurationsbeispiele

### 1) Gemeinsame Modellliste + Überschreibungen

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
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
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) Optionales Bildverständnis

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Ein einzelner multimodaler Eintrag (explizite Fähigkeiten)

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

Wenn Medienverständnis läuft, enthält `/status` eine kurze Zusammenfassungszeile:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Dies zeigt Ergebnisse pro Fähigkeit und, falls zutreffend, den gewählten Provider/das gewählte Modell.

## Hinweise

- Das Verständnis ist **best-effort**. Fehler blockieren Antworten nicht.
- Anhänge werden weiterhin an Modelle übergeben, selbst wenn das Verständnis deaktiviert ist.
- Verwenden Sie `scope`, um zu begrenzen, wo das Verständnis läuft (z. B. nur DMs).

## Verwandte Dokumentation

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
