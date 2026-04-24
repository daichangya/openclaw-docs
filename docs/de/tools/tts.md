---
read_when:
    - Text-to-Speech für Antworten aktivieren
    - TTS-Provider oder -Limits konfigurieren
    - '`/tts`-Befehle verwenden'
summary: Text-to-Speech (TTS) für ausgehende Antworten
title: Text-to-Speech
x-i18n:
    generated_at: "2026-04-24T07:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw kann ausgehende Antworten mit ElevenLabs, Google Gemini, Microsoft, MiniMax, OpenAI oder xAI in Audio umwandeln.
Es funktioniert überall dort, wo OpenClaw Audio senden kann.

## Unterstützte Dienste

- **ElevenLabs** (primärer oder Fallback-Provider)
- **Google Gemini** (primärer oder Fallback-Provider; verwendet Gemini API TTS)
- **Microsoft** (primärer oder Fallback-Provider; die aktuell gebündelte Implementierung verwendet `node-edge-tts`)
- **MiniMax** (primärer oder Fallback-Provider; verwendet die T2A-v2-API)
- **OpenAI** (primärer oder Fallback-Provider; wird auch für Zusammenfassungen verwendet)
- **xAI** (primärer oder Fallback-Provider; verwendet die xAI-TTS-API)

### Hinweise zu Microsoft Speech

Der gebündelte Microsoft-Speech-Provider verwendet derzeit den gehosteten
neuralen TTS-Dienst von Microsoft Edge über die Bibliothek `node-edge-tts`. Es ist ein gehosteter Dienst (nicht
lokal), nutzt Microsoft-Endpunkte und erfordert keinen API-Schlüssel.
`node-edge-tts` bietet Optionen für Sprachkonfiguration und Ausgabeformate,
aber nicht alle Optionen werden vom Dienst unterstützt. Legacy-Konfiguration und Direktiv-Eingaben mit
`edge` funktionieren weiterhin und werden zu `microsoft` normalisiert.

Da dieser Pfad ein öffentlicher Webdienst ohne veröffentlichte SLA oder Quote ist,
sollten Sie ihn als Best-Effort behandeln. Wenn Sie garantierte Limits und Support benötigen, verwenden Sie OpenAI
oder ElevenLabs.

## Optionale Schlüssel

Wenn Sie OpenAI, ElevenLabs, Google Gemini, MiniMax oder xAI verwenden möchten:

- `ELEVENLABS_API_KEY` (oder `XI_API_KEY`)
- `GEMINI_API_KEY` (oder `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft Speech erfordert **keinen** API-Schlüssel.

Wenn mehrere Provider konfiguriert sind, wird der ausgewählte Provider zuerst verwendet, die anderen sind Fallback-Optionen.
Die automatische Zusammenfassung verwendet das konfigurierte `summaryModel` (oder `agents.defaults.model.primary`),
daher muss dieser Provider ebenfalls authentifiziert sein, wenn Sie Zusammenfassungen aktivieren.

## Service-Links

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Ist es standardmäßig aktiviert?

Nein. Auto‑TTS ist standardmäßig **deaktiviert**. Aktivieren Sie es in der Konfiguration mit
`messages.tts.auto` oder lokal mit `/tts on`.

Wenn `messages.tts.provider` nicht gesetzt ist, wählt OpenClaw den ersten konfigurierten
Speech-Provider in der automatischen Registry-Auswahlreihenfolge.

## Konfiguration

Die TTS-Konfiguration befindet sich unter `messages.tts` in `openclaw.json`.
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

### OpenAI als Primärprovider mit ElevenLabs als Fallback

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

### Microsoft als Primärprovider (kein API-Schlüssel)

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

### MiniMax als Primärprovider

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

### Google Gemini als Primärprovider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS verwendet den API-Schlüsselpfad der Gemini API. Ein API-Schlüssel aus der Google Cloud Console,
der auf die Gemini API beschränkt ist, ist hier gültig, und es ist derselbe Schlüsseltyp, der auch
vom gebündelten Google-Provider für Bildgenerierung verwendet wird. Die Auflösungsreihenfolge ist
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI als Primärprovider

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS verwendet denselben `XAI_API_KEY`-Pfad wie der gebündelte Grok-Modellprovider.
Die Auflösungsreihenfolge ist `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
Derzeit verfügbare Live-Stimmen sind `ara`, `eve`, `leo`, `rex`, `sal` und `una`; `eve` ist
der Standard. `language` akzeptiert ein BCP-47-Tag oder `auto`.

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

Führen Sie dann aus:

```
/tts summary off
```

### Hinweise zu Feldern

- `auto`: Auto‑TTS-Modus (`off`, `always`, `inbound`, `tagged`).
  - `inbound` sendet Audio nur nach einer eingehenden Sprachnachricht.
  - `tagged` sendet Audio nur, wenn die Antwort Direktiven `[[tts:key=value]]` oder einen Block `[[tts:text]]...[[/tts:text]]` enthält.
- `enabled`: Legacy-Schalter (doctor migriert dies zu `auto`).
- `mode`: `"final"` (Standard) oder `"all"` (einschließlich Tool-/Block-Antworten).
- `provider`: ID des Speech-Providers wie `"elevenlabs"`, `"google"`, `"microsoft"`, `"minimax"` oder `"openai"` (Fallback erfolgt automatisch).
- Wenn `provider` **nicht gesetzt** ist, verwendet OpenClaw den ersten konfigurierten Speech-Provider in der automatischen Registry-Auswahlreihenfolge.
- Legacy-`provider: "edge"` funktioniert weiterhin und wird zu `microsoft` normalisiert.
- `summaryModel`: optionales günstiges Modell für die automatische Zusammenfassung; Standard ist `agents.defaults.model.primary`.
  - Akzeptiert `provider/model` oder einen konfigurierten Modell-Alias.
- `modelOverrides`: erlaubt dem Modell, TTS-Direktiven auszugeben (standardmäßig aktiviert).
  - `allowProvider` ist standardmäßig `false` (Provider-Wechsel ist Opt-in).
- `providers.<id>`: provider-eigene Einstellungen, verschlüsselt nach Speech-Provider-ID.
- Legacy-direkte Provider-Blöcke (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) werden beim Laden automatisch nach `messages.tts.providers.<id>` migriert.
- `maxTextLength`: hartes Limit für TTS-Eingaben (Zeichen). `/tts audio` schlägt fehl, wenn es überschritten wird.
- `timeoutMs`: Request-Timeout (ms).
- `prefsPath`: überschreibt den lokalen JSON-Pfad für Prefs (Provider/Limit/Zusammenfassung).
- `apiKey`-Werte greifen auf Env-Variablen zurück (`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: überschreibt die ElevenLabs-API-Basis-URL.
- `providers.openai.baseUrl`: überschreibt den OpenAI-TTS-Endpunkt.
  - Auflösungsreihenfolge: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - Nicht standardmäßige Werte werden als OpenAI-kompatible TTS-Endpunkte behandelt, daher werden benutzerdefinierte Modell- und Stimmnamen akzeptiert.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = normal)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2-stelliger ISO-639-1-Code (z. B. `en`, `de`)
- `providers.elevenlabs.seed`: Ganzzahl `0..4294967295` (Best-Effort-Determinismus)
- `providers.minimax.baseUrl`: überschreibt die MiniMax-API-Basis-URL (Standard `https://api.minimax.io`, Env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS-Modell (Standard `speech-2.8-hd`, Env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: Stimmkennung (Standard `English_expressive_narrator`, Env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: Wiedergabegeschwindigkeit `0.5..2.0` (Standard 1.0).
- `providers.minimax.vol`: Lautstärke `(0, 10]` (Standard 1.0; muss größer als 0 sein).
- `providers.minimax.pitch`: Tonhöhenverschiebung `-12..12` (Standard 0).
- `providers.google.model`: Gemini-TTS-Modell (Standard `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Name der integrierten Gemini-Stimme (Standard `Kore`; `voice` wird ebenfalls akzeptiert).
- `providers.google.baseUrl`: überschreibt die Gemini-API-Basis-URL. Nur `https://generativelanguage.googleapis.com` wird akzeptiert.
  - Wenn `messages.tts.providers.google.apiKey` weggelassen wird, kann TTS vor dem Env-Fallback `models.providers.google.apiKey` wiederverwenden.
- `providers.xai.apiKey`: xAI-TTS-API-Schlüssel (Env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: überschreibt die xAI-TTS-Basis-URL (Standard `https://api.x.ai/v1`, Env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI-Stimm-ID (Standard `eve`; aktuell verfügbare Live-Stimmen: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47-Sprachcode oder `auto` (Standard `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` (Standard `mp3`).
- `providers.xai.speed`: provider-natives Override für die Geschwindigkeit.
- `providers.microsoft.enabled`: erlaubt die Nutzung von Microsoft Speech (Standard `true`; kein API-Schlüssel).
- `providers.microsoft.voice`: Name der Microsoft-Neural-Stimme (z. B. `en-US-MichelleNeural`).
- `providers.microsoft.lang`: Sprachcode (z. B. `en-US`).
- `providers.microsoft.outputFormat`: Microsoft-Ausgabeformat (z. B. `audio-24khz-48kbitrate-mono-mp3`).
  - Gültige Werte finden Sie unter Microsoft Speech output formats; nicht alle Formate werden vom gebündelten, Edge-gestützten Transport unterstützt.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: Prozent-Strings (z. B. `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: schreibt JSON-Untertitel neben die Audiodatei.
- `providers.microsoft.proxy`: Proxy-URL für Microsoft-Speech-Requests.
- `providers.microsoft.timeoutMs`: Override für Request-Timeout (ms).
- `edge.*`: Legacy-Alias für dieselben Microsoft-Einstellungen.

## Modellgesteuerte Overrides (standardmäßig aktiviert)

Standardmäßig **kann** das Modell TTS-Direktiven für eine einzelne Antwort ausgeben.
Wenn `messages.tts.auto` auf `tagged` gesetzt ist, sind diese Direktiven erforderlich, um Audio auszulösen.

Wenn aktiviert, kann das Modell `[[tts:...]]`-Direktiven ausgeben, um die Stimme
für eine einzelne Antwort zu überschreiben, plus optional einen Block `[[tts:text]]...[[/tts:text]]`, um
ausdrucksstarke Markierungen (Lachen, Gesangshinweise usw.) bereitzustellen, die nur im
Audio erscheinen sollen.

Direktiven `provider=...` werden ignoriert, es sei denn, `modelOverrides.allowProvider: true` ist gesetzt.

Beispiel für eine Antwort-Payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Verfügbare Direktivschlüssel (wenn aktiviert):

- `provider` (registrierte Speech-Provider-ID, zum Beispiel `openai`, `elevenlabs`, `google`, `minimax` oder `microsoft`; erfordert `allowProvider: true`)
- `voice` (OpenAI-Stimme), `voiceName` / `voice_name` / `google_voice` (Google-Stimme) oder `voiceId` (ElevenLabs / MiniMax / xAI)
- `model` (OpenAI-TTS-Modell, ElevenLabs-Modell-ID oder MiniMax-Modell) oder `google_model` (Google-TTS-Modell)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax-Lautstärke, 0-10)
- `pitch` (MiniMax-Tonhöhe, -12 bis 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

Alle Modell-Overrides deaktivieren:

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

Optionale Allowlist (Provider-Wechsel aktivieren, während andere Regler konfigurierbar bleiben):

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

## Einstellungen pro Benutzer

Slash-Befehle schreiben lokale Overrides nach `prefsPath` (Standard:
`~/.openclaw/settings/tts.json`, überschreibbar mit `OPENCLAW_TTS_PREFS` oder
`messages.tts.prefsPath`).

Gespeicherte Felder:

- `enabled`
- `provider`
- `maxLength` (Schwellenwert für Zusammenfassung; Standard 1500 Zeichen)
- `summarize` (Standard `true`)

Diese überschreiben `messages.tts.*` auf diesem Host.

## Ausgabeformate (fest)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus-Sprachnachricht (`opus_48000_64` von ElevenLabs, `opus` von OpenAI).
  - 48kHz / 64kbps ist ein guter Kompromiss für Sprachnachrichten.
- **Andere Kanäle**: MP3 (`mp3_44100_128` von ElevenLabs, `mp3` von OpenAI).
  - 44,1kHz / 128kbps ist die Standardbalance für Sprachverständlichkeit.
- **MiniMax**: MP3 (`speech-2.8-hd`-Modell, 32kHz-Samplerate). Voice-Note-Format wird nativ nicht unterstützt; verwenden Sie OpenAI oder ElevenLabs für garantiert unterstützte Opus-Sprachnachrichten.
- **Google Gemini**: Gemini API TTS gibt rohes 24kHz-PCM zurück. OpenClaw verpackt dies als WAV für Audioanhänge und gibt PCM direkt für Talk/Telefonie zurück. Das native Opus-Voice-Note-Format wird von diesem Pfad nicht unterstützt.
- **xAI**: standardmäßig MP3; `responseFormat` kann `mp3`, `wav`, `pcm`, `mulaw` oder `alaw` sein. OpenClaw verwendet den Batch-REST-TTS-Endpunkt von xAI und gibt einen vollständigen Audioanhang zurück; das Streaming-TTS-WebSocket von xAI wird von diesem Provider-Pfad nicht verwendet. Das native Opus-Voice-Note-Format wird von diesem Pfad nicht unterstützt.
- **Microsoft**: verwendet `microsoft.outputFormat` (Standard `audio-24khz-48kbitrate-mono-mp3`).
  - Der gebündelte Transport akzeptiert ein `outputFormat`, aber nicht alle Formate sind vom Dienst verfügbar.
  - Werte für das Ausgabeformat folgen den Microsoft Speech output formats (einschließlich Ogg/WebM Opus).
  - Telegram `sendVoice` akzeptiert OGG/MP3/M4A; verwenden Sie OpenAI/ElevenLabs, wenn Sie
    garantiert unterstützte Opus-Sprachnachrichten benötigen.
  - Wenn das konfigurierte Microsoft-Ausgabeformat fehlschlägt, versucht OpenClaw es erneut mit MP3.

Die Ausgabeformate von OpenAI/ElevenLabs sind pro Kanal festgelegt (siehe oben).

## Verhalten von Auto-TTS

Wenn aktiviert, führt OpenClaw Folgendes aus:

- überspringt TTS, wenn die Antwort bereits Medien oder eine Direktive `MEDIA:` enthält.
- überspringt sehr kurze Antworten (< 10 Zeichen).
- fasst lange Antworten zusammen, wenn dies aktiviert ist, unter Verwendung von `agents.defaults.model.primary` (oder `summaryModel`).
- hängt das generierte Audio an die Antwort an.

Wenn die Antwort `maxLength` überschreitet und die Zusammenfassung deaktiviert ist (oder kein API-Schlüssel für das
Zusammenfassungsmodell vorhanden ist), wird Audio
übersprungen und die normale Textantwort gesendet.

## Ablaufdiagramm

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## Verwendung von Slash-Befehlen

Es gibt einen einzelnen Befehl: `/tts`.
Einzelheiten zur Aktivierung finden Sie unter [Slash-Befehle](/de/tools/slash-commands).

Hinweis zu Discord: `/tts` ist ein integrierter Discord-Befehl, daher registriert OpenClaw dort
`/voice` als nativen Befehl. Text-`/tts ...` funktioniert weiterhin.

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

- Befehle erfordern einen autorisierten Sender (Allowlist-/Owner-Regeln gelten weiterhin).
- `commands.text` oder die Registrierung nativer Befehle muss aktiviert sein.
- Die Konfiguration `messages.tts.auto` akzeptiert `off|always|inbound|tagged`.
- `/tts on` schreibt die lokale TTS-Präferenz auf `always`; `/tts off` schreibt sie auf `off`.
- Verwenden Sie die Konfiguration, wenn Sie `inbound`- oder `tagged`-Standards möchten.
- `limit` und `summary` werden in lokalen Prefs gespeichert, nicht in der Hauptkonfiguration.
- `/tts audio` erzeugt eine einmalige Audioantwort (aktiviert TTS nicht dauerhaft).
- `/tts status` enthält Fallback-Sichtbarkeit für den letzten Versuch:
  - erfolgreiches Fallback: `Fallback: <primary> -> <used>` plus `Attempts: ...`
  - Fehler: `Error: ...` plus `Attempts: ...`
  - detaillierte Diagnostik: `Attempt details: provider:outcome(reasonCode) latency`
- API-Fehler von OpenAI und ElevenLabs enthalten jetzt geparste Provider-Fehlerdetails und Request-ID (wenn vom Provider zurückgegeben), die in TTS-Fehlern/-Logs sichtbar gemacht werden.

## Agenten-Tool

Das Tool `tts` wandelt Text in Sprache um und gibt einen Audioanhang für
die Zustellung der Antwort zurück. Wenn der Kanal Feishu, Matrix, Telegram oder WhatsApp ist,
wird das Audio als Sprachnachricht statt als Dateianhang zugestellt.
Es akzeptiert optionale Felder `channel` und `timeoutMs`; `timeoutMs` ist ein
Timeout pro Aufruf für Provider-Anfragen in Millisekunden.

## Gateway-RPC

Gateway-Methoden:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## Verwandt

- [Medienüberblick](/de/tools/media-overview)
- [Musikgenerierung](/de/tools/music-generation)
- [Videogenerierung](/de/tools/video-generation)
