---
read_when:
    - Talk-Modus auf macOS/iOS/Android implementieren
    - Stimmen-/TTS-/Unterbrechungsverhalten ändern
summary: 'Talk-Modus: fortlaufende Sprachunterhaltungen mit ElevenLabs TTS'
title: Talk-Modus
x-i18n:
    generated_at: "2026-04-24T06:46:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Der Talk-Modus ist eine fortlaufende Sprachunterhaltungsschleife:

1. Auf Sprache hören
2. Das Transkript an das Modell senden (Hauptsitzung, `chat.send`)
3. Auf die Antwort warten
4. Sie über den konfigurierten Talk-Provider (`talk.speak`) aussprechen

## Verhalten (macOS)

- **Always-on-Overlay**, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Listening → Thinking → Speaking**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden in **WebChat geschrieben** (wie bei Eingabe per Tastatur).
- **Unterbrechen durch Sprache** (standardmäßig an): Wenn der Benutzer zu sprechen beginnt, während der Assistant spricht, stoppen wir die Wiedergabe und notieren den Zeitstempel der Unterbrechung für den nächsten Prompt.

## Sprachdirektiven in Antworten

Der Assistant kann seiner Antwort eine **einzelne JSON-Zeile** voranstellen, um die Stimme zu steuern:

```json
{ "voice": "<voice-id>", "once": true }
```

Regeln:

- Nur die erste nicht leere Zeile.
- Unbekannte Schlüssel werden ignoriert.
- `once: true` gilt nur für die aktuelle Antwort.
- Ohne `once` wird die Stimme zur neuen Standardstimme für den Talk-Modus.
- Die JSON-Zeile wird vor der TTS-Wiedergabe entfernt.

Unterstützte Schlüssel:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfiguration (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Standardwerte:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das Standard-Pausenfenster der Plattform vor dem Senden des Transkripts (`700 ms auf macOS und Android, 900 ms auf iOS`)
- `voiceId`: fällt auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Key verfügbar ist)
- `modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt
- `apiKey`: fällt auf `ELEVENLABS_API_KEY` zurück (oder auf das Shell-Profil des Gateways, falls verfügbar)
- `outputFormat`: standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-UI

- Umschalter in der Menüleiste: **Talk**
- Konfigurations-Tab: Gruppe **Talk Mode** (Voice-ID + Interrupt-Umschalter)
- Overlay:
  - **Listening**: Wolke pulsiert mit Mikrofonpegel
  - **Thinking**: sinkende Animation
  - **Speaking**: abstrahlende Ringe
  - Auf Wolke klicken: Sprechen stoppen
  - Auf X klicken: Talk-Modus beenden

## Hinweise

- Erfordert Berechtigungen für Speech + Mikrofon.
- Verwendet `chat.send` für den Sitzungsschlüssel `main`.
- Das Gateway löst die Wiedergabe im Talk-Modus über `talk.speak` mit dem aktiven Talk-Provider auf. Android fällt nur dann auf lokales System-TTS zurück, wenn dieses RPC nicht verfügbar ist.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird, wenn gesetzt, auf `0..4` validiert.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für AudioTrack-Streaming mit geringer Latenz.

## Verwandt

- [Voice wake](/de/nodes/voicewake)
- [Audio und Sprachnachrichten](/de/nodes/audio)
- [Medienverständnis](/de/nodes/media-understanding)
