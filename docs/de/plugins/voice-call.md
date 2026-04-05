---
read_when:
    - Sie möchten einen ausgehenden Sprachanruf aus OpenClaw heraus tätigen
    - Sie konfigurieren oder entwickeln das Voice Call-Plugin
summary: 'Voice Call-Plugin: ausgehende + eingehende Anrufe über Twilio/Telnyx/Plivo (Plugin-Installation + Konfiguration + CLI)'
title: Voice Call-Plugin
x-i18n:
    generated_at: "2026-04-05T12:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Sprachanrufe für OpenClaw über ein Plugin. Unterstützt ausgehende Benachrichtigungen und
mehrstufige Unterhaltungen mit Richtlinien für eingehende Anrufe.

Aktuelle Provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML-Transfer + GetInput speech)
- `mock` (Entwicklung/kein Netzwerk)

Kurzes mentales Modell:

- Plugin installieren
- Gateway neu starten
- Unter `plugins.entries.voice-call.config` konfigurieren
- `openclaw voicecall ...` oder das Tool `voice_call` verwenden

## Wo es läuft (local vs remote)

Das Voice Call-Plugin läuft **innerhalb des Gateway-Prozesses**.

Wenn Sie ein Remote-Gateway verwenden, installieren/konfigurieren Sie das Plugin auf dem **Rechner, auf dem das Gateway läuft**, und starten Sie dann das Gateway neu, damit es geladen wird.

## Installation

### Option A: aus npm installieren (empfohlen)

```bash
openclaw plugins install @openclaw/voice-call
```

Starten Sie das Gateway anschließend neu.

### Option B: aus einem lokalen Ordner installieren (Entwicklung, ohne Kopieren)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Starten Sie das Gateway anschließend neu.

## Konfiguration

Legen Sie die Konfiguration unter `plugins.entries.voice-call.config` fest:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // oder "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Öffentlicher Webhook-Schlüssel von Telnyx aus dem Telnyx Mission Control Portal
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

          // Öffentliche Bereitstellung (wählen Sie eine)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; erster registrierter Echtzeit-Transkriptions-Provider, wenn nicht gesetzt
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
- Telnyx erfordert `telnyx.publicKey` (oder `TELNYX_PUBLIC_KEY`), sofern `skipSignatureVerification` nicht auf true gesetzt ist.
- `skipSignatureVerification` ist nur für lokale Tests gedacht.
- Wenn Sie die kostenlose Stufe von ngrok verwenden, setzen Sie `publicUrl` auf die exakte ngrok-URL; die Signaturprüfung wird immer erzwungen.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` erlaubt Twilio-Webhooks mit ungültigen Signaturen **nur**, wenn `tunnel.provider="ngrok"` und `serve.bind` loopback ist (lokaler ngrok-Agent). Nur für lokale Entwicklung verwenden.
- URLs der kostenlosen ngrok-Stufe können sich ändern oder Interstitial-Verhalten hinzufügen; wenn `publicUrl` abweicht, schlagen Twilio-Signaturen fehl. Für die Produktion sollten Sie eine stabile Domain oder Tailscale funnel bevorzugen.
- Standardwerte für Streaming-Sicherheit:
  - `streaming.preStartTimeoutMs` schließt Sockets, die niemals einen gültigen `start`-Frame senden.
- `streaming.maxPendingConnections` begrenzt die Gesamtzahl nicht authentifizierter Sockets vor dem Start.
- `streaming.maxPendingConnectionsPerIp` begrenzt nicht authentifizierte Sockets vor dem Start pro Quell-IP.
- `streaming.maxConnections` begrenzt die Gesamtzahl offener Media-Stream-Sockets (ausstehend + aktiv).
- Das Runtime-Fallback akzeptiert diese alten `voice-call`-Schlüssel vorerst weiterhin, aber der Umschreibpfad ist `openclaw doctor --fix`, und der Kompatibilitäts-Shim ist nur vorübergehend.

## Streaming-Transkription

`streaming` wählt einen Echtzeit-Transkriptions-Provider für Live-Audio von Anrufen aus.

Aktuelles Runtime-Verhalten:

- `streaming.provider` ist optional. Wenn es nicht gesetzt ist, verwendet Voice Call den ersten
  registrierten Echtzeit-Transkriptions-Provider.
- Derzeit ist der gebündelte Provider OpenAI, registriert durch das gebündelte `openai`-
  Plugin.
- Rohkonfiguration im Besitz des Providers liegt unter `streaming.providers.<providerId>`.
- Wenn `streaming.provider` auf einen nicht registrierten Provider zeigt oder überhaupt kein Echtzeit-
  Transkriptions-Provider registriert ist, protokolliert Voice Call eine Warnung und
  überspringt Media-Streaming, statt das gesamte Plugin fehlschlagen zu lassen.

Standardwerte für OpenAI-Streaming-Transkription:

- API-Schlüssel: `streaming.providers.openai.apiKey` oder `OPENAI_API_KEY`
- Modell: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

Alte Schlüssel werden weiterhin automatisch durch `openclaw doctor --fix` migriert:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Bereinigung veralteter Anrufe

Verwenden Sie `staleCallReaperSeconds`, um Anrufe zu beenden, die nie einen abschließenden Webhook erhalten
(zum Beispiel Anrufe im Benachrichtigungsmodus, die nie abgeschlossen werden). Der Standardwert ist `0`
(deaktiviert).

Empfohlene Bereiche:

- **Produktion:** `120`–`300` Sekunden für Benachrichtigungsabläufe.
- Halten Sie diesen Wert **höher als `maxDurationSeconds`**, damit normale Anrufe
  beendet werden können. Ein guter Ausgangswert ist `maxDurationSeconds + 30–60` Sekunden.

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

`webhookSecurity.allowedHosts` setzt eine Allowlist für Hosts aus Weiterleitungs-Headern.

`webhookSecurity.trustForwardingHeaders` vertraut weitergeleiteten Headern ohne Allowlist.

`webhookSecurity.trustedProxyIPs` vertraut weitergeleiteten Headern nur dann, wenn die
Remote-IP der Anfrage mit der Liste übereinstimmt.

Der Schutz vor Webhook-Replay ist für Twilio und Plivo aktiviert. Wiederholte gültige Webhook-
Anfragen werden bestätigt, aber bei Seiteneffekten übersprungen.

Twilio-Gesprächszüge enthalten ein Token pro Zug in `<Gather>`-Callbacks, sodass
veraltete/wiederholte Sprach-Callbacks keinen neueren ausstehenden Transkriptionszug erfüllen können.

Nicht authentifizierte Webhook-Anfragen werden vor dem Lesen des Bodys abgelehnt, wenn die
erforderlichen Signatur-Header des Providers fehlen.

Der `voice-call`-Webhook verwendet das gemeinsame Body-Profil vor der Authentifizierung (64 KB / 5 Sekunden)
plus eine In-Flight-Begrenzung pro IP vor der Signaturprüfung.

Beispiel mit einem stabilen öffentlichen Host:

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

Voice Call verwendet die Kernkonfiguration `messages.tts` für
Streaming-Sprachausgabe bei Anrufen. Sie können sie unter der Plugin-Konfiguration mit derselben
**Struktur** überschreiben — sie wird per Deep-Merge mit `messages.tts` zusammengeführt.

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

- Alte `tts.<provider>`-Schlüssel innerhalb der Plugin-Konfiguration (`openai`, `elevenlabs`, `microsoft`, `edge`) werden beim Laden automatisch nach `tts.providers.<provider>` migriert. Bevorzugen Sie die Struktur `providers` in eingecheckter Konfiguration.
- **Microsoft speech wird für Sprachanrufe ignoriert** (Telefonie-Audio benötigt PCM; der aktuelle Microsoft-Transport stellt keine PCM-Ausgabe für Telefonie bereit).
- Kern-TTS wird verwendet, wenn Twilio-Media-Streaming aktiviert ist; andernfalls fallen Anrufe auf providernative Stimmen zurück.
- Wenn bereits ein Twilio-Media-Stream aktiv ist, fällt Voice Call nicht auf TwiML `<Say>` zurück. Wenn Telefonie-TTS in diesem Zustand nicht verfügbar ist, schlägt die Wiedergabeanfrage fehl, statt zwei Wiedergabepfade zu mischen.
- Wenn Telefonie-TTS auf einen sekundären Provider zurückfällt, protokolliert Voice Call zur Fehlerdiagnose eine Warnung mit der Provider-Kette (`from`, `to`, `attempts`).

### Weitere Beispiele

Nur Kern-TTS verwenden (ohne Überschreibung):

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

Nur für Anrufe auf ElevenLabs überschreiben (Kernstandard an anderer Stelle beibehalten):

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
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` ist eine Prüfung der Anrufer-ID mit geringer Sicherheit. Das Plugin
normalisiert den vom Provider gelieferten Wert `From` und vergleicht ihn mit `allowFrom`.
Die Webhook-Prüfung authentifiziert die Zustellung durch den Provider und die Integrität der Nutzlast,
aber sie beweist nicht den Besitz der PSTN-/VoIP-Anrufernummer. Behandeln Sie `allowFrom` als
Filterung nach Anrufer-ID, nicht als starke Anruferidentität.

Automatische Antworten verwenden das Agent-System. Abstimmen können Sie es mit:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Vertrag für gesprochene Ausgabe

Für automatische Antworten hängt Voice Call an den System-Prompt einen strengen Vertrag für gesprochene Ausgabe an:

- `{"spoken":"..."}`

Voice Call extrahiert den Sprechtext dann defensiv:

- Ignoriert Nutzlasten, die als Reasoning-/Fehlerinhalte markiert sind.
- Parst direktes JSON, JSON in Fences oder Inline-Schlüssel `"spoken"`.
- Fällt auf Klartext zurück und entfernt wahrscheinliche einleitende Absätze für Planung/Meta.

Dadurch bleibt die gesprochene Wiedergabe auf anruferseitigen Text fokussiert, und es wird vermieden, Planungstext in Audio auszugeben.

### Verhalten beim Start von Gesprächen

Bei ausgehenden Anrufen im Modus `conversation` ist die Behandlung der ersten Nachricht an den Status der Live-Wiedergabe gebunden:

- Leeren der Barge-in-Warteschlange und automatische Antwort werden nur unterdrückt, während die anfängliche Begrüßung aktiv gesprochen wird.
- Wenn die anfängliche Wiedergabe fehlschlägt, kehrt der Anruf zu `listening` zurück, und die erste Nachricht bleibt zur erneuten Ausführung in der Warteschlange.
- Die anfängliche Wiedergabe für Twilio-Streaming startet bei Stream-Verbindung ohne zusätzliche Verzögerung.

### Kulanzzeit bei Twilio-Stream-Trennung

Wenn eine Twilio-Media-Stream-Verbindung getrennt wird, wartet Voice Call `2000ms`, bevor der Anruf automatisch beendet wird:

- Wenn der Stream innerhalb dieses Zeitfensters erneut verbunden wird, wird die automatische Beendigung abgebrochen.
- Wenn nach der Kulanzzeit kein Stream erneut registriert wird, wird der Anruf beendet, um hängende aktive Anrufe zu verhindern.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # Alias für call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # Zuglatenz aus Logs zusammenfassen
openclaw voicecall expose --mode funnel
```

`latency` liest `calls.jsonl` aus dem Standard-Speicherpfad für `voice-call`. Verwenden Sie
`--file <path>`, um auf ein anderes Log zu verweisen, und `--last <n>`, um die Analyse
auf die letzten N Datensätze zu beschränken (Standard 200). Die Ausgabe enthält p50/p90/p99 für Zug-
Latenz und Wartezeiten im Listening-Zustand.

## Agent-Tool

Tool-Name: `voice_call`

Aktionen:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Dieses Repository enthält ein passendes Skills-Dokument unter `skills/voice-call/SKILL.md`.

## Gateway-RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
