---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - TTS-Provider oder Limits konfigurieren
    - '`/tts`-Befehle verwenden'
summary: Text-to-Speech (TTS) für ausgehende Antworten
title: Text-to-Speech (älterer Pfad)
x-i18n:
    generated_at: "2026-04-05T12:59:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: acca61773996299a582ab88e5a5db12d8f22ce8a28292ce97cc5dd5fdc2d3b83
    source_path: tts.md
    workflow: 15
---

# Text-to-Speech (TTS)

OpenClaw kann ausgehende Antworten mit ElevenLabs, Microsoft, MiniMax oder OpenAI in Audio umwandeln.
Das funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Provider)
- **Microsoft** (primärer oder Fallback-Provider; die aktuelle gebündelte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Provider; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Provider; wird auch für Zusammenfassungen verwendet)

### Hinweise zu Microsoft Speech

Der gebündelte Microsoft-Speech-Provider verwendet derzeit den Online-
Neural-TTS-Dienst von Microsoft Edge über die Bibliothek `node-edge-tts`. Es handelt sich um einen gehosteten Dienst (nicht lokal), der Microsoft-Endpunkte verwendet und keinen API-Key erfordert.
`node-edge-tts` stellt Optionen für Speech-Konfiguration und Ausgabeformate bereit, aber
nicht alle Optionen werden vom Dienst unterstützt. Ältere Konfigurationen und Directive-Eingaben
mit `edge` funktionieren weiterhin und werden auf `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Quote ist,
solltest du ihn als Best-Effort behandeln. Wenn du garantierte Limits und Support benötigst, verwende OpenAI
oder ElevenLabs.

## Optionale Keys

Wenn du OpenAI, ElevenLabs oder MiniMax verwenden möchtest:

- `ELEVENLABS_API_KEY` (oder `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft Speech erfordert **keinen** API-Key.

Wenn mehrere Provider konfiguriert sind, wird zuerst der ausgewählte Provider verwendet und die anderen dienen als Fallback-Optionen.
Die automatische Zusammenfassung verwendet das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss auch dieser Provider authentifiziert sein, wenn du Zusammenfassungen aktivierst.

## Service-Links

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## Ist es standardmäßig aktiviert?

Nein. Auto‑TTS ist standardmäßig **deaktiviert**. Aktiviere es in der Konfiguration mit
`messages.tts.auto` oder pro Sitzung mit `/tts always` (Alias: `/tts on`).

Wenn `messages.tts.provider` nicht gesetzt ist, wählt OpenClaw den ersten konfigurierten
Speech-Provider in der automatischen Auswahlreihenfolge der Registry.

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `openclaw.json`.
Das vollständige Schema findest du unter [Gateway-Konfiguration](/de/gateway/configuration).

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

### Microsoft primär (ohne API-Key)

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

### Benutzerdefinierte Limits + Pfad für Präferenzen

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
  - `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht.
  - `tagged` sendet Audio nur, wenn die Antwort `[[tts]]`-Tags enthält.
- `enabled`: älterer Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: Speech-Provider-ID wie `"elevenlabs"`, `"microsoft"`, `"minimax"` oder `"openai"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Speech-Provider in der automatischen Auswahlreihenfolge der Registry.
- Das ältere `provider: "edge"` funktioniert weiterhin und wird auf `microsoft` normalisiert.
- `summaryModel`: optionales günstiges Modell für automatische Zusammenfassungen; standardmäßig `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modell-Alias.
- `modelOverrides`: erlaubt dem Modell, TTS-Directives auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: provider-eigene Einstellungen, indiziert nach Speech-Provider-ID.
- Ältere direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden beim Laden automatisch zu `messages.tts.providers.<id>` migriert.
- `maxTextLength`: hartes Limit für TTS-Eingaben (Zeichen). `/tts audio` schlägt fehl, wenn es überschritten wird.
- `timeoutMs`: Request-Timeout (ms).
- `prefsPath`: überschreibt den lokalen JSON-Pfad für Präferenzen (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte greifen auf Env-Vars zurück (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
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
- `providers.minimax.voiceId`: Voice-Identifier (Standard `English_expressive_narrator`, Env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: Tonhöhenverschiebung `-12..12` (Standard 0).
- `providers.microsoft.enabled`: erlaubt die Nutzung von Microsoft Speech (Standard `true`; kein API-Key).
- `providers.microsoft.voice`: Name der neuralen Microsoft-Stimme (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte findest du unter Microsoft Speech output formats; nicht alle Formate werden vom gebündelten, Edge-basierten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozent-Strings (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: schreibt JSON-Untertitel neben die Audiodatei.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Requests.
- `providers.microsoft.timeoutMs`: Überschreibung für Request-Timeout (ms).
- `edge.*`: älterer Alias für dieselben Microsoft-Einstellungen.

## Modellgesteuerte Überschreibungen (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Directives für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` gesetzt ist, sind diese Directives erforderlich, um Audio auszulösen.

Wenn aktiviert, kann das Modell `[[tts:...]]`-Directives ausgeben, um die Stimme
für eine einzelne Antwort zu überschreiben, plus optional einen Block `[[tts:text]]...[[/tts:text]]`,
um ausdrucksstarke Tags (Lachen, Gesangshinweise usw.) bereitzustellen, die nur
im Audio erscheinen sollen.

Directives mit `provider=...` werden ignoriert, sofern `modelOverrides.allowProvider: true` nicht gesetzt ist.

Beispiel für eine Antwort-Payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Verfügbare Directive-Schlüssel (wenn aktiviert):

- `provider` (registrierte Speech-Provider-ID, z. B. `openai`, `elevenlabs`, `minimax` oder `microsoft`; erfordert `allowProvider: true`)
- `voice` (OpenAI-Voice) oder `voiceId` (ElevenLabs / MiniMax)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID oder MiniMax-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (MiniMax-Tonhöhe, -12 bis 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Alle Modell-Überschreibungen deaktivieren:

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

Optionale Allowlist (Provider-Wechsel aktivieren und andere Regler weiterhin konfigurierbar halten):

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

## Präferenzen pro Benutzer

Slash-Befehle schreiben lokale Überschreibungen nach `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Schwelle für Zusammenfassung; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` für diesen Host.

## Ausgabeformate (fest)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus-Voice-Message (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48 kHz / 64 kbps ist ein guter Kompromiss für Voice-Messages.
- **Andere Channels**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1 kHz / 128 kbps ist der Standardausgleich für klare Sprachwiedergabe.
- **MiniMax**: MP3 (`speech-2.8-hd`-Modell, 32-kHz-Sampling-Rate). Das Voice-Note-Format wird nicht nativ unterstützt; verwende OpenAI oder ElevenLabs für garantierte Opus-Voice-Messages.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind vom Dienst verfügbar.
  - Werte für Ausgabeformate folgen Microsoft Speech output formats (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwende OpenAI/ElevenLabs, wenn du
    garantierte Opus-Voice-Messages benötigst.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Channel festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn aktiviert, macht OpenClaw Folgendes:

- überspringt TTS, wenn die Antwort bereits Medien oder eine Directive `MEDIA:` enthält.
- überspringt sehr kurze Antworten (< 10 Zeichen).
- fasst lange Antworten zusammen, wenn diese Funktion aktiviert ist, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- hängt das erzeugte Audio an die Antwort an.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Key für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Antwort -> TTS aktiviert?
  nein -> Text senden
  ja   -> Medien / MEDIA: / kurz?
          ja   -> Text senden
          nein -> Länge > Limit?
                   nein -> TTS -> Audio anhängen
                   ja   -> Zusammenfassung aktiviert?
                            nein -> Text senden
                            ja   -> zusammenfassen (summaryModel oder agents.defaults.model.primary)
                                      -> TTS -> Audio anhängen
```

## Verwendung von Slash-Befehlen

Es gibt einen einzelnen Befehl: `/tts`.
Details zur Aktivierung findest du unter [Slash-Befehle](/tools/slash-commands).

Hinweis zu Discord: `/tts` ist ein integrierter Discord-Befehl, daher registriert OpenClaw
dort `/voice` als nativen Befehl. Textbasiertes `/tts ...` funktioniert weiterhin.

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

Hinweise:

- Befehle erfordern einen autorisierten Sender (Allowlist-/Besitzerregeln gelten weiterhin).
- `commands.text` oder die Registrierung nativer Befehle müssen aktiviert sein.
- `off|always|inbound|tagged` sind Umschalter pro Sitzung (`/tts on` ist ein Alias für `/tts always`).
- `limit` und `summary` werden in lokalen Präferenzen gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht dauerhaft).
- `/tts status` enthält Fallback-Sichtbarkeit für den letzten Versuch:
  - erfolgreicher Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnosen: `Attempt details: provider:outcome(reasonCode) latency`
- API-Fehler von OpenAI und ElevenLabs enthalten jetzt geparste providerspezifische Fehlerdetails und die Request-ID (wenn vom Provider zurückgegeben), die in TTS-Fehlern/Logs sichtbar gemacht werden.

## Agent-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audio-Anhang für die
Antwortzustellung zurück. Wenn der Channel Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Voice-Message statt als Dateianhang zugestellt.

## Gateway-RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
