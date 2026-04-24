---
read_when:
    - Audio-Transkription oder Medienverarbeitung ändern
summary: Wie eingehendes Audio/Sprachnachrichten heruntergeladen, transkribiert und in Antworten eingefügt werden
title: Audio und Sprachnachrichten
x-i18n:
    generated_at: "2026-04-24T06:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / Sprachnachrichten (2026-01-17)

## Was funktioniert

- **Medienverständnis (Audio)**: Wenn Audioverständnis aktiviert ist (oder automatisch erkannt wird), führt OpenClaw Folgendes aus:
  1. Sucht den ersten Audio-Anhang (lokaler Pfad oder URL) und lädt ihn bei Bedarf herunter.
  2. Erzwingt `maxBytes`, bevor an jeden Modelleintrag gesendet wird.
  3. Führt den ersten berechtigten Modelleintrag in Reihenfolge aus (Provider oder CLI).
  4. Wenn er fehlschlägt oder übersprungen wird (Größe/Timeout), wird der nächste Eintrag versucht.
  5. Bei Erfolg ersetzt es `Body` durch einen Block `[Audio]` und setzt `{{Transcript}}`.
- **Befehls-Parsing**: Wenn die Transkription erfolgreich ist, werden `CommandBody`/`RawBody` auf das Transkript gesetzt, sodass Slash-Befehle weiterhin funktionieren.
- **Ausführliches Logging**: In `--verbose` protokollieren wir, wann die Transkription läuft und wann sie den Body ersetzt.

## Automatische Erkennung (Standard)

Wenn Sie **keine Modelle konfigurieren** und `tools.media.audio.enabled` **nicht** auf `false` gesetzt ist,
erkennt OpenClaw automatisch in dieser Reihenfolge und stoppt bei der ersten funktionierenden Option:

1. **Aktives Antwortmodell**, wenn dessen Provider Audioverständnis unterstützt.
2. **Lokale CLIs** (wenn installiert)
   - `sherpa-onnx-offline` (erfordert `SHERPA_ONNX_MODEL_DIR` mit encoder/decoder/joiner/tokens)
   - `whisper-cli` (von `whisper-cpp`; verwendet `WHISPER_CPP_MODEL` oder das gebündelte Tiny-Modell)
   - `whisper` (Python-CLI; lädt Modelle automatisch herunter)
3. **Gemini CLI** (`gemini`) unter Verwendung von `read_many_files`
4. **Provider-Authentifizierung**
   - Konfigurierte Einträge `models.providers.*`, die Audio unterstützen, werden zuerst versucht
   - Gebündelte Fallback-Reihenfolge: OpenAI → Groq → Deepgram → Google → Mistral

Um die automatische Erkennung zu deaktivieren, setzen Sie `tools.media.audio.enabled: false`.
Zum Anpassen setzen Sie `tools.media.audio.models`.
Hinweis: Die Binärerkennung erfolgt nach Best Effort auf macOS/Linux/Windows; stellen Sie sicher, dass die CLI auf `PATH` liegt (wir expandieren `~`), oder setzen Sie ein explizites CLI-Modell mit vollständigem Befehlspfad.

## Konfigurationsbeispiele

### Provider + CLI-Fallback (OpenAI + Whisper CLI)

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

### Nur Provider mit Scope-Gating

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

## Hinweise & Einschränkungen

- Provider-Authentifizierung folgt der Standardreihenfolge für Modell-Authentifizierung (Authentifizierungsprofile, Env-Variablen, `models.providers.*.apiKey`).
- Details zur Einrichtung von Groq: [Groq](/de/providers/groq).
- Deepgram verwendet `DEEPGRAM_API_KEY`, wenn `provider: "deepgram"` genutzt wird.
- Details zur Einrichtung von Deepgram: [Deepgram (Audio-Transkription)](/de/providers/deepgram).
- Details zur Einrichtung von Mistral: [Mistral](/de/providers/mistral).
- Audio-Provider können `baseUrl`, `headers` und `providerOptions` über `tools.media.audio` überschreiben.
- Standardgrenze für die Größe ist 20MB (`tools.media.audio.maxBytes`). Zu großes Audio wird für dieses Modell übersprungen und der nächste Eintrag wird versucht.
- Sehr kleine/leere Audiodateien unter 1024 Bytes werden vor der Provider-/CLI-Transkription übersprungen.
- Standard-`maxChars` für Audio ist **nicht gesetzt** (vollständiges Transkript). Setzen Sie `tools.media.audio.maxChars` oder `maxChars` pro Eintrag, um die Ausgabe zu kürzen.
- Der automatische Standard für OpenAI ist `gpt-4o-mini-transcribe`; setzen Sie `model: "gpt-4o-transcribe"` für höhere Genauigkeit.
- Verwenden Sie `tools.media.audio.attachments`, um mehrere Sprachnachrichten zu verarbeiten (`mode: "all"` + `maxAttachments`).
- Das Transkript ist für Templates als `{{Transcript}}` verfügbar.
- `tools.media.audio.echoTranscript` ist standardmäßig deaktiviert; aktivieren Sie es, um die Transkriptbestätigung vor der Agent-Verarbeitung an den Ursprungs-Chat zurückzusenden.
- `tools.media.audio.echoFormat` passt den Echo-Text an (Platzhalter: `{transcript}`).
- CLI-stdout ist auf 5MB begrenzt; halten Sie die CLI-Ausgabe knapp.

### Unterstützung für Proxy-Umgebungen

Providerbasierte Audio-Transkription berücksichtigt standardmäßige Env-Variablen für ausgehende Proxys:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Wenn keine Proxy-Env-Variablen gesetzt sind, wird direkte Egress-Verbindung verwendet. Wenn die Proxy-Konfiguration fehlerhaft ist, protokolliert OpenClaw eine Warnung und greift auf direkten Fetch zurück.

## Mention-Erkennung in Gruppen

Wenn `requireMention: true` für einen Gruppenchat gesetzt ist, transkribiert OpenClaw Audio jetzt **vor** der Prüfung auf Erwähnungen. Dadurch können Sprachnachrichten verarbeitet werden, auch wenn sie Erwähnungen enthalten.

**So funktioniert es:**

1. Wenn eine Sprachnachricht keinen Text-Body hat und die Gruppe Erwähnungen erfordert, führt OpenClaw eine „Preflight“-Transkription aus.
2. Das Transkript wird auf Erwähnungsmuster geprüft (z. B. `@BotName`, Emoji-Trigger).
3. Wenn eine Erwähnung gefunden wird, durchläuft die Nachricht die vollständige Antwort-Pipeline.
4. Das Transkript wird für die Mention-Erkennung verwendet, sodass Sprachnachrichten das Mention-Gate passieren können.

**Fallback-Verhalten:**

- Wenn die Transkription während des Preflight fehlschlägt (Timeout, API-Fehler usw.), wird die Nachricht auf Grundlage der textbasierten Mention-Erkennung verarbeitet.
- Dadurch wird sichergestellt, dass gemischte Nachrichten (Text + Audio) nie fälschlich verworfen werden.

**Opt-out pro Telegram-Gruppe/Thema:**

- Setzen Sie `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, um Preflight-Transkriptprüfungen auf Erwähnungen für diese Gruppe zu überspringen.
- Setzen Sie `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, um pro Thema zu überschreiben (`true` zum Überspringen, `false` zum Erzwingen der Aktivierung).
- Standard ist `false` (Preflight aktiviert, wenn Mention-Gating-Bedingungen zutreffen).

**Beispiel:** Ein Benutzer sendet in einer Telegram-Gruppe mit `requireMention: true` eine Sprachnachricht mit den Worten „Hey @Claude, wie ist das Wetter?“. Die Sprachnachricht wird transkribiert, die Erwähnung wird erkannt und der Agent antwortet.

## Stolperfallen

- Scope-Regeln verwenden First-Match-Wins. `chatType` wird auf `direct`, `group` oder `room` normalisiert.
- Stellen Sie sicher, dass Ihre CLI mit Exit 0 endet und Klartext ausgibt; JSON muss über `jq -r .text` angepasst werden.
- Wenn Sie bei `parakeet-mlx` `--output-dir` übergeben, liest OpenClaw `<output-dir>/<media-basename>.txt`, wenn `--output-format` `txt` ist (oder weggelassen wird); Nicht-`txt`-Ausgabeformate greifen auf stdout-Parsing zurück.
- Halten Sie Timeouts angemessen (`timeoutSeconds`, Standard 60 s), um die Antwort-Queue nicht zu blockieren.
- Die Preflight-Transkription verarbeitet für die Mention-Erkennung nur den **ersten** Audio-Anhang. Zusätzliche Audiodaten werden während der Hauptphase des Medienverständnisses verarbeitet.

## Verwandt

- [Medienverständnis](/de/nodes/media-understanding)
- [Talk-Modus](/de/nodes/talk)
- [Voice Wake](/de/nodes/voicewake)
