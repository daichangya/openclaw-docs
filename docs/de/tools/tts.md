---
read_when:
    - Text-zu-Sprache für Antworten aktivieren
    - TTS-Provider oder Limits konfigurieren
    - '`/tts`-Befehle verwenden'
summary: Text-zu-Sprache (TTS) für ausgehende Antworten
title: Text-zu-Sprache
x-i18n:
    generated_at: "2026-04-12T23:34:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad79a6be34879347dc73fdab1bd219823cd7c6aa8504e3e4c73e1a0554c837c5
    source_path: tools/tts.md
    workflow: 15
---

# Text-zu-Sprache (TTS)

OpenClaw kann ausgehende Antworten mit ElevenLabs, Microsoft, MiniMax oder OpenAI in Audio umwandeln.
Das funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Provider)
- **Microsoft** (primärer oder Fallback-Provider; die aktuelle gebündelte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Provider; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Provider; wird auch für Zusammenfassungen verwendet)

### Hinweise zu Microsoft Speech

Der gebündelte Microsoft-Sprach-Provider verwendet derzeit den Online-
Neural-TTS-Dienst von Microsoft Edge über die Bibliothek `node-edge-tts`. Es handelt sich um einen gehosteten Dienst (nicht lokal), der Microsoft-Endpunkte verwendet und keinen API-Schlüssel erfordert.
`node-edge-tts` stellt Sprachkonfigurationsoptionen und Ausgabeformate bereit,
aber nicht alle Optionen werden vom Dienst unterstützt. Legacy-Konfiguration und Direktiveingaben
mit `edge` funktionieren weiterhin und werden zu `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Kontingente ist,
sollten Sie ihn als Best-Effort behandeln. Wenn Sie garantierte Limits und Support benötigen, verwenden Sie OpenAI
oder ElevenLabs.

## Optionale Schlüssel

Wenn Sie OpenAI, ElevenLabs oder MiniMax verwenden möchten:

- `ELEVENLABS_API_KEY` (oder `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft Speech erfordert **keinen** API-Schlüssel.

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte Provider verwendet, die anderen dienen als Fallback-Optionen.
Die automatische Zusammenfassung verwendet das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss dieser Provider ebenfalls authentifiziert sein, wenn Sie Zusammenfassungen aktivieren.

## Dienstlinks

- [OpenAI-Leitfaden für Text-zu-Sprache](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI-Audio-API-Referenz](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft-Speech-Ausgabeformate](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Ist es standardmäßig aktiviert?

Nein. Auto‑TTS ist standardmäßig **deaktiviert**. Aktivieren Sie es in der Konfiguration mit
`messages.tts.auto` oder lokal mit `/tts on`.

Wenn `messages.tts.provider` nicht gesetzt ist, wählt OpenClaw den ersten konfigurierten
Speech-Provider in der Auto-Select-Reihenfolge des Registry aus.

## Konfiguration

Die TTS-Konfiguration liegt unter `messages.tts` in `openclaw.json`.
Das vollständige Schema finden Sie unter [Gateway-Konfiguration](/de/gateway/configuration).

### Minimale Konfiguration (aktivieren + Provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI primär mit ElevenLabs als Fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft primär (ohne API-Schlüssel)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax primär

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Microsoft Speech deaktivieren

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### Benutzerdefinierte Limits + Prefs-Pfad

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### Nur nach einer eingehenden Sprachnachricht mit Audio antworten

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### Automatische Zusammenfassung für lange Antworten deaktivieren

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

Dann ausführen:

```
/tts summary off
```

### Hinweise zu Feldern

- `auto`: Auto‑TTS-Modus (`off`, `always`, `inbound`, `tagged`).
  - `inbound` sendet nur nach einer eingehenden Sprachnachricht Audio.
  - `tagged` sendet nur dann Audio, wenn die Antwort `[[tts:key=value]]`-Direktiven oder einen Block `[[tts:text]]...[[/tts:text]]` enthält.
- `enabled`: Legacy-Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: Speech-Provider-ID wie `"elevenlabs"`, `"microsoft"`, `"minimax"` oder `"openai"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Speech-Provider in der Auto-Select-Reihenfolge des Registry.
- Legacy `provider: "edge"` funktioniert weiterhin und wird zu `microsoft` normalisiert.
- `summaryModel`: optionales günstiges Modell für die automatische Zusammenfassung; standardmäßig `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modellalias.
- `modelOverrides`: erlaubt dem Modell, TTS-Direktiven auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: Provider-eigene Einstellungen, verschlüsselt nach Speech-Provider-ID.
- Legacy-direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden beim Laden automatisch zu `messages.tts.providers.<id>` migriert.
- `maxTextLength`: harte Obergrenze für TTS-Eingaben (Zeichen). `/tts audio` schlägt fehl, wenn diese überschritten wird.
- `timeoutMs`: Anfrage-Timeout (ms).
- `prefsPath`: überschreibt den lokalen Prefs-JSON-Pfad (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte verwenden Env-Variablen als Fallback (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: überschreibt die ElevenLabs-API-Base-URL.
- `providers.openai.baseUrl`: überschreibt den OpenAI-TTS-Endpunkt.
  - Auflösungsreihenfolge: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Voice-Namen akzeptiert.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-stelliger ISO-639-1-Code (z. B. `en`, `de`)
- `providers.elevenlabs.seed`: Ganzzahl `0..4294967295` (Best-Effort-Determinismus)
- `providers.minimax.baseUrl`: überschreibt die MiniMax-API-Base-URL (Standard `https://api.minimax.io`, Env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-Modell (Standard `speech-2.8-hd`, Env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: Voice-Kennung (Standard `English_expressive_narrator`, Env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: Tonhöhenverschiebung `-12..12` (Standard 0).
- `providers.microsoft.enabled`: erlaubt die Verwendung von Microsoft Speech (Standard `true`; kein API-Schlüssel).
- `providers.microsoft.voice`: Name der neuronalen Microsoft-Voice (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte finden Sie unter Microsoft-Speech-Ausgabeformate; nicht alle Formate werden vom gebündelten, Edge-basierten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozentzeichenfolgen (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: JSON-Untertitel zusammen mit der Audiodatei schreiben.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Anfragen.
- `providers.microsoft.timeoutMs`: Überschreibung des Anfrage-Timeouts (ms).
- `edge.*`: Legacy-Alias für dieselben Microsoft-Einstellungen.

## Modellgesteuerte Überschreibungen (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Direktiven für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` gesetzt ist, sind diese Direktiven erforderlich, um Audio auszulösen.

Wenn aktiviert, kann das Modell `[[tts:...]]`-Direktiven ausgeben, um die Voice
für eine einzelne Antwort zu überschreiben, plus optional einen Block `[[tts:text]]...[[/tts:text]]`, um
ausdrucksstarke Tags (Lachen, Gesangshinweise usw.) bereitzustellen, die nur im
Audio erscheinen sollen.

`provider=...`-Direktiven werden ignoriert, sofern nicht `modelOverrides.allowProvider: true` gesetzt ist.

Beispiel-Payload für eine Antwort:

```
Hier ist es.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](lacht) Lies das Lied noch einmal vor.[[/tts:text]]
```

Verfügbare Direktivschlüssel (wenn aktiviert):

- `provider` (registrierte Speech-Provider-ID, zum Beispiel `openai`, `elevenlabs`, `minimax` oder `microsoft`; erfordert `allowProvider: true`)
- `voice` (OpenAI-Voice) oder `voiceId` (ElevenLabs / MiniMax)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID oder MiniMax-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (MiniMax-Tonhöhe, -12 bis 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Alle Modellüberschreibungen deaktivieren:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

Optionale Allowlist (Provider-Wechsel aktivieren, während andere Einstellungen konfigurierbar bleiben):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## Benutzerbezogene Einstellungen

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Zusammenfassungsschwelle; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` für diesen Host.

## Ausgabeformate (fest)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus-Sprachnachricht (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbit/s ist ein guter Kompromiss für Sprachnachrichten.
- **Andere Channels**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbit/s ist die Standardbalance für Sprachverständlichkeit.
- **MiniMax**: MP3 (Modell `speech-2.8-hd`, 32-kHz-Abtastrate). Voice-Note-Format wird nativ nicht unterstützt; verwenden Sie OpenAI oder ElevenLabs für garantiert Opus-Sprachnachrichten.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind vom Dienst verfügbar.
  - Werte für Ausgabeformate folgen den Microsoft-Speech-Ausgabeformaten (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantiert Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

OpenAI-/ElevenLabs-Ausgabeformate sind pro Channel fest vorgegeben (siehe oben).

## Auto-TTS-Verhalten

Wenn aktiviert, tut OpenClaw Folgendes:

- überspringt TTS, wenn die Antwort bereits Medien oder eine `MEDIA:`-Direktive enthält.
- überspringt sehr kurze Antworten (< 10 Zeichen).
- fasst lange Antworten zusammen, wenn aktiviert, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- hängt das generierte Audio an die Antwort an.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Schlüssel für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> Medien / MEDIA: / kurz vorhanden?
          ja  -> Text senden
          nein -> Länge > Limit?
                   nein -> TTS -> Audio anhängen
                   ja   -> Zusammenfassung aktiviert?
                            nein -> Text senden
                            ja   -> zusammenfassen (summaryModel oder agents.defaults.model.primary)
                                      -> TTS -> Audio anhängen
```

## Verwendung des Slash-Befehls

Es gibt einen einzelnen Befehl: `/tts`.
Einzelheiten zur Aktivierung finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

Hinweis zu Discord: `/tts` ist ein integrierter Discord-Befehl, daher registriert OpenClaw dort
`/voice` als nativen Befehl. Textbasiertes `/tts ...` funktioniert weiterhin.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Hinweise:

- Befehle erfordern einen autorisierten Absender (Allowlist-/Owner-Regeln gelten weiterhin).
- `commands.text` oder die Registrierung nativer Befehle muss aktiviert sein.
- Die Konfiguration `messages.tts.auto` akzeptiert `off|always|inbound|tagged`.
- `/tts on` schreibt die lokale TTS-Einstellung auf `always`; `/tts off` schreibt sie auf `off`.
- Verwenden Sie die Konfiguration, wenn Sie `inbound`- oder `tagged`-Standards wünschen.
- `limit` und `summary` werden in lokalen Prefs gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht dauerhaft).
- `/tts status` enthält Sichtbarkeit des Fallbacks für den letzten Versuch:
  - erfolgreicher Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnose: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI- und ElevenLabs-API-Fehler enthalten jetzt geparste Provider-Fehlerdetails und die Anfrage-ID (wenn vom Provider zurückgegeben), die in TTS-Fehlern/Logs angezeigt werden.

## Agent-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für
die Zustellung der Antwort zurück. Wenn der Channel Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Sprachnachricht statt als Dateianhang zugestellt.

## Gateway-RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
