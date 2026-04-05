---
read_when:
    - Ändern von Audiotranskription oder Medienverarbeitung
summary: Wie eingehende Audio-/Sprachnotizen heruntergeladen, transkribiert und in Antworten eingebunden werden
title: Audio und Sprachnotizen
x-i18n:
    generated_at: "2026-04-05T12:48:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Sprachnotizen (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Es findet den ersten Audioanhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Es erzwingt `maxBytes`, bevor an jeden Modelleintrag gesendet wird.
  3. Es führt den ersten geeigneten Modelleintrag der Reihe nach aus (Provider oder CLI).
  4. Wenn dieser fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg ersetzt es `Body` durch einen `[Audio]`-Block und setzt `{{Transcript}}`.
- **Befehlsparsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliches Logging**: Mit `--verbose` protokollieren wir, wann die Transkription ausgeführt wird und wann sie den Body ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn sein Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (falls installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (aus `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Gemini CLI** (`gemini`) mit `read_many_files`
4. **Provider-Authentifizierung**
   - Konfigurierte `models.providers.*`-Einträge, die Audio unterstützen, werden zuerst versucht
   - Gebündelte Fallback-Reihenfolge: OpenAI → Groq → Deepgram → Google → Mistral

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Zum Anpassen setzen Sie `tools.media.audio.models`.
Hinweis: Die Binärerkennung erfolgt nach Best Effort unter macOS/Linux/Windows; stellen Sie sicher, dass sich die CLI auf `PATH` befindet (wir erweitern `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

## Konfigurationsbeispiele

### Provider- + CLI-Fallback (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Nur Provider mit Bereichs-Gating

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Nur Provider (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Nur Provider (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Transkript im Chat zurückgeben (Opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // Standard ist false
        echoFormat: '📝 "{transcript}"', // optional, unterstützt {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Hinweise und Einschränkungen

- Die Provider-Authentifizierung folgt der Standardreihenfolge für Modell-Authentifizierung (Auth-Profile, Umgebungsvariablen, `models.providers.*.apiKey`).
- Details zur Groq-Einrichtung: [Groq](/providers/groq).
- Deepgram übernimmt `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` verwendet wird.
- Details zur Deepgram-Einrichtung: [Deepgram (Audiotranskription)](/providers/deepgram).
- Details zur Mistral-Einrichtung: [Mistral](/providers/mistral).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Die Standardgrößenbegrenzung beträgt 20 MB (`tools.media.audio.maxBytes`). Zu große Audiodateien werden für dieses Modell übersprungen, und der nächste Eintrag wird versucht.
- Sehr kleine/leere Audiodateien unter 1024 Byte werden vor der Transkription durch Provider/CLI übersprungen.
- Das Standard-`maxChars` für Audio ist **nicht gesetzt** (volles Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische OpenAI-Standard ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnotizen zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist in Templates als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um vor der Agentenverarbeitung eine Transkriptbestätigung an den ursprünglichen Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist begrenzt (5 MB); halten Sie die CLI-Ausgabe knapp.

### Unterstützung für Proxy-Umgebungsvariablen

Providerbasierte Audiotranskription berücksichtigt die Standard-Proxy-Umgebungsvariablen für ausgehende Verbindungen:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Umgebungsvariablen gesetzt sind, wird direkter Egress verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und greift auf direkten Abruf zurück.

## Erwähnungserkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnotizen verarbeitet werden, auch wenn sie Erwähnungen enthalten.

**So funktioniert es:**

1. Wenn eine Sprachnachricht keinen Textkörper hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Trigger).
3. Wenn eine Erwähnung gefunden wird, läuft die Nachricht durch die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Erwähnungserkennung verwendet, sodass Sprachnotizen das Mention-Gate passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht anhand der reinen Texterkennung für Erwähnungen verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) niemals fälschlicherweise verworfen werden.

**Opt-out pro Telegram-Gruppe/Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Erwähnungsprüfungen per Preflight-Transkript für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um pro Thema zu überschreiben (`true` zum Überspringen, `false` zum erzwungenen Aktivieren).
- Der Standard ist `false` (Preflight aktiviert, wenn mention-gesteuerte Bedingungen zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnotiz mit dem Inhalt „Hey @Claude, wie ist das Wetter?“. Die Sprachnotiz wird transkribiert, die Erwähnung erkannt und der Agent antwortet.

## Fallstricke

- Bereichsregeln verwenden „first match wins“. `chatType` wird auf `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit Exit-Code 0 endet und Klartext ausgibt; JSON muss über `jq -r .text` angepasst werden.
- Bei `parakeet-mlx` liest OpenClaw, wenn Sie `--output-dir` übergeben, `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder weggelassen wird); Ausgabeformate ungleich `txt` greifen auf stdout-Parsing zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um das Blockieren der Antwortwarteschlange zu vermeiden.
- Die Preflight-Transkription verarbeitet für die Erwähnungserkennung nur den **ersten** Audioanhang. Zusätzliche Audiodateien werden während der Hauptphase des Medienverständnisses verarbeitet.
