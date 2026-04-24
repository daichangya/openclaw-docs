---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf von OpenClaw aus starten.
    - Sie konfigurieren oder entwickeln das Voice-Call-Plugin.
summary: 'Voice-Call-Plugin: ausgehende + eingehende Anrufe über Twilio/Telnyx/Plivo (Plugin-Installation + Konfiguration + CLI)'
title: Voice-Call-Plugin
x-i18n:
    generated_at: "2026-04-24T06:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen und
mehrturnige Konversationen mit Richtlinien für eingehende Anrufe.

Aktuelle Provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML-Transfer + GetInput Speech)
- `mock` (Entwicklung/ohne Netzwerk)

Kurzes Modell dazu:

- Plugin installieren
- Gateway neu starten
- Unter `plugins.entries.voice-call.config` konfigurieren
- `openclaw voicecall ...` oder das Tool `voice_call` verwenden

## Wo es läuft (lokal vs. remote)

Das Voice-Call-Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie ein Remote-Gateway verwenden, installieren/konfigurieren Sie das Plugin auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie dann das Gateway neu, damit es geladen wird.

## Installation

### Option A: aus npm installieren (empfohlen)

```bash
openclaw plugins install @openclaw/voice-call
```

Starten Sie danach das Gateway neu.

### Option B: aus einem lokalen Ordner installieren (Entwicklung, ohne Kopieren)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie danach das Gateway neu.

## Konfiguration

Setzen Sie die Konfiguration unter `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oder "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // oder TWILIO_FROM_NUMBER für Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Öffentlicher Telnyx-Webhook-Schlüssel aus dem Telnyx Mission Control Portal
            // (Base64-String; kann auch über TELNYX_PUBLIC_KEY gesetzt werden).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook-Server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook-Sicherheit (empfohlen für Tunnel/Proxys)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Öffentliche Bereitstellung (eine auswählen)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; erster registrierter Realtime-Transcription-Provider, wenn nicht gesetzt
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional, wenn OPENAI_API_KEY gesetzt ist
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Hinweise:

- Twilio/Telnyx erfordern eine **öffentlich erreichbare** Webhook-URL.
- Plivo erfordert eine **öffentlich erreichbare** Webhook-URL.
- `mock` ist ein lokaler Entwicklungs-Provider (ohne Netzwerkaufrufe).
- Wenn ältere Konfigurationen noch `provider: "log"`, `twilio.from` oder alte OpenAI-Schlüssel unter `streaming.*` verwenden, führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben.
- Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), außer `skipSignatureVerification` ist true.
- `skipSignatureVerification` ist nur für lokale Tests gedacht.
- Wenn Sie das kostenlose ngrok-Tier verwenden, setzen Sie `publicUrl` auf die exakte ngrok-URL; Signaturprüfung wird immer erzwungen.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` auf loopback steht (lokaler ngrok-Agent). Nur für lokale Entwicklung verwenden.
- URLs im kostenlosen ngrok-Tier können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für Produktion bevorzugen Sie eine stabile Domain oder Tailscale funnel.
- Standards für Streaming-Sicherheit:
  - `streaming.preStartTimeoutMs` schließt Sockets, die nie einen gültigen `start`-Frame senden.
- `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Pre-Start-Sockets.
- `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Pre-Start-Sockets pro Quell-IP.
- `streaming.maxConnections` begrenzt alle offenen Media-Stream-Sockets insgesamt (ausstehend + aktiv).
- Zur Laufzeit werden diese alten Voice-Call-Schlüssel derzeit weiterhin als Fallback akzeptiert, aber der Umschreibpfad ist `openclaw doctor --fix`, und der Kompatibilitätsshift ist nur vorübergehend.

## Streaming-Transkription

`streaming` wählt einen Realtime-Transcription-Provider für Live-Anrufaudio aus.

Aktuelles Laufzeitverhalten:

- `streaming.provider` ist optional. Wenn nicht gesetzt, verwendet Voice Call den ersten
  registrierten Realtime-Transcription-Provider.
- Gebündelte Realtime-Transcription-Provider umfassen Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) und xAI
  (`xai`), registriert durch ihre Provider-Plugins.
- Provider-eigene Rohkonfiguration befindet sich unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Provider zeigt oder überhaupt kein Realtime-Transcription-Provider registriert ist, protokolliert Voice Call eine Warnung und überspringt Media-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

Standardwerte für OpenAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.openai.apiKey` oder `OPENAI_API_KEY`
- Modell: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Standardwerte für xAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.xai.apiKey` oder `XAI_API_KEY`
- Endpunkt: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Beispiel:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional, wenn OPENAI_API_KEY gesetzt ist
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

xAI stattdessen verwenden:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // optional, wenn XAI_API_KEY gesetzt ist
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Alte Schlüssel werden weiterhin automatisch von `openclaw doctor --fix` migriert:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Stale-Call-Reaper

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die niemals einen terminalen Webhook erhalten
(zum Beispiel Notify-Mode-Anrufe, die nie abgeschlossen werden). Standard ist `0`
(deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Notify-artige Abläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe
  abgeschlossen werden können. Ein guter Ausgangspunkt ist `maxDurationSeconds + 30–60` Sekunden.

Beispiel:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook-Sicherheit

Wenn ein Proxy oder Tunnel vor dem Gateway sitzt, rekonstruiert das Plugin die
öffentliche URL für die Signaturprüfung. Diese Optionen steuern, welchen weitergeleiteten
Headern vertraut wird.

`webhookSecurity.allowedHosts` erstellt eine Allowlist von Hosts aus weitergeleiteten Headern.

`webhookSecurity.trustForwardingHeaders` vertraut weitergeleiteten Headern ohne Allowlist.

`webhookSecurity.trustedProxyIPs` vertraut weitergeleiteten Headern nur dann, wenn die
Remote-IP der Anfrage zur Liste passt.

Webhook-Replay-Schutz ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-
Anfragen werden bestätigt, aber für Seiteneffekte übersprungen.

Twilio-Konversationsturns enthalten ein Token pro Turn in `<Gather>`-Callbacks, sodass
veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkript-Turn erfüllen können.

Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die
erforderlichen Signatur-Header des Providers fehlen.

Der Voice-Call-Webhook verwendet das gemeinsame Pre-Auth-Body-Profil (64 KB / 5 Sekunden)
plus ein In-Flight-Limit pro IP vor der Signaturprüfung.

Beispiel mit stabilem öffentlichem Host:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS für Anrufe

Voice Call verwendet die Core-Konfiguration `messages.tts` für
gestreamte Sprache in Anrufen. Sie können sie unter der Plugin-Konfiguration mit derselben
**Form** überschreiben — sie wird tief mit `messages.tts` zusammengeführt.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Hinweise:

- Alte Schlüssel `tts.<provider>` innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden beim Laden automatisch nach `tts.providers.<provider>` migriert. Bevorzugen Sie die Form `providers` in versionierter Konfiguration.
- **Microsoft speech wird für Voice Calls ignoriert** (Telefonie-Audio benötigt PCM; der aktuelle Microsoft-Transport stellt keinen telefonietauglichen PCM-Output bereit).
- Core-TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf native Stimmen des Providers zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telephony-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanfrage fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telephony-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`) für Debugging.

### Weitere Beispiele

Nur Core-TTS verwenden (keine Überschreibung):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Nur für Anrufe auf ElevenLabs überschreiben (Core-Standard anderswo beibehalten):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Nur das OpenAI-Modell für Anrufe überschreiben (Deep-Merge-Beispiel):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Eingehende Anrufe

Die Standardrichtlinie für eingehende Anrufe ist `disabled`. Um eingehende Anrufe zu aktivieren, setzen Sie:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Wie kann ich helfen?",
}
```

`inboundPolicy: "allowlist"` ist nur eine Caller-ID-Prüfung mit geringer Sicherheit. Das Plugin
normalisiert den vom Provider gelieferten Wert `From` und vergleicht ihn mit `allowFrom`.
Webhook-Verifizierung authentifiziert die Zustellung durch den Provider und die Integrität der Payload, aber
sie beweist nicht die Eigentümerschaft an der PSTN-/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Filterung nach Caller-ID, nicht als starke Anruferidentität.

Automatische Antworten verwenden das Agent-System. Abstimmung über:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call einen strikten Vertrag für gesprochene Ausgabe an den System-Prompt an:

- `{"spoken":"..."}`

Voice Call extrahiert dann gesprochene Texte defensiv:

- Ignoriert Payloads, die als Reasoning-/Error-Inhalt markiert sind.
- Parst direktes JSON, JSON in Fences oder Inline-Schlüssel `"spoken"`.
- Fällt auf Plain Text zurück und entfernt wahrscheinlich führende Absätze mit Planung/Meta.

Dadurch bleibt die gesprochene Wiedergabe auf anrufergerichteten Text fokussiert und es wird vermieden, Planungstext in Audio auszugeben.

### Verhalten beim Start von Konversationen

Bei ausgehenden `conversation`-Anrufen ist die Behandlung der ersten Nachricht an den Status der Live-Wiedergabe gekoppelt:

- Barge-in-Queue-Clear und automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf in den Status `listening` zurück und die anfängliche Nachricht bleibt zur Wiederholung in der Queue.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei Stream-Verbindung ohne zusätzliche Verzögerung.

### Grace-Periode bei Twilio-Stream-Disconnect

Wenn ein Twilio-Media-Stream die Verbindung verliert, wartet Voice Call `2000ms`, bevor der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Fensters erneut verbunden wird, wird die automatische Beendigung abgebrochen.
- Wenn nach der Grace-Periode kein Stream erneut registriert wurde, wird der Anruf beendet, um festhängende aktive Anrufe zu verhindern.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # Turn-Latenz aus Logs zusammenfassen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem Standard-Speicherpfad von voice-call. Verwenden Sie
`--file <path>`, um auf ein anderes Log zu zeigen, und `--last <n>`, um die Analyse
auf die letzten N Einträge zu begrenzen (Standard 200). Die Ausgabe enthält p50/p90/p99 für Turn-
Latenz und Listen-Wait-Zeiten.

## Agent-Tool

Tool-Name: `voice_call`

Aktionen:

- `initiate_call` (`message`, `to?`, `mode?`)
- `continue_call` (`callId`, `message`)
- `speak_to_user` (`callId`, `message`)
- `send_dtmf` (`callId`, `digits`)
- `end_call` (`callId`)
- `get_status` (`callId`)

Dieses Repo enthält ein passendes Skill-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway-RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Verwandt

- [Text-to-speech](/de/tools/tts)
- [Talk mode](/de/nodes/talk)
- [Voice wake](/de/nodes/voicewake)
