---
read_when:
    - Beim Implementieren des Talk-Modus auf macOS/iOS/Android
    - Beim Ändern von Stimme/TTS/Interrupt-Verhalten
summary: 'Talk-Modus: kontinuierliche Sprachgespräche mit ElevenLabs-TTS'
title: Talk-Modus
x-i18n:
    generated_at: "2026-04-05T12:48:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Talk-Modus

Der Talk-Modus ist eine kontinuierliche Sprachkonversationsschleife:

1. Auf Sprache hören
2. Transkript an das Modell senden (Hauptsitzung, `chat.send`)
3. Auf die Antwort warten
4. Sie über den konfigurierten Talk-Provider sprechen (`talk.speak`)

## Verhalten (macOS)

- **Immer aktive Überlagerung**, solange der Talk-Modus aktiviert ist.
- Phasenübergänge **Listening → Thinking → Speaking**.
- Bei einer **kurzen Pause** (Stillefenster) wird das aktuelle Transkript gesendet.
- Antworten werden **in WebChat geschrieben** (wie beim Tippen).
- **Unterbrechen bei Sprache** (standardmäßig aktiviert): Wenn der Benutzer zu sprechen beginnt, während der Assistent spricht, stoppen wir die Wiedergabe und notieren den Zeitstempel der Unterbrechung für den nächsten Prompt.

## Sprachdirektiven in Antworten

Der Assistent kann seiner Antwort eine **einzelne JSON-Zeile** voranstellen, um die Stimme zu steuern:

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

Standards:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: wenn nicht gesetzt, verwendet Talk das plattformspezifische Standard-Pausenfenster vor dem Senden des Transkripts (`700 ms auf macOS und Android, 900 ms auf iOS`)
- `voiceId`: greift auf `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` zurück (oder auf die erste ElevenLabs-Stimme, wenn ein API-Schlüssel verfügbar ist)
- `modelId`: standardmäßig `eleven_v3`, wenn nicht gesetzt
- `apiKey`: greift auf `ELEVENLABS_API_KEY` zurück (oder auf das Gateway-Shell-Profil, falls verfügbar)
- `outputFormat`: standardmäßig `pcm_44100` auf macOS/iOS und `pcm_24000` auf Android (setzen Sie `mp3_*`, um MP3-Streaming zu erzwingen)

## macOS-UI

- Menüleisten-Umschalter: **Talk**
- Konfigurations-Tab: Gruppe **Talk Mode** (Stimm-ID + Interrupt-Umschalter)
- Overlay:
  - **Listening**: Wolke pulsiert mit Mikrofonpegel
  - **Thinking**: sinkende Animation
  - **Speaking**: ausstrahlende Ringe
  - Auf Wolke klicken: Sprechen stoppen
  - Auf X klicken: Talk-Modus beenden

## Hinweise

- Erfordert Berechtigungen für Speech + Mikrofon.
- Verwendet `chat.send` gegen den Sitzungsschlüssel `main`.
- Das Gateway löst die Wiedergabe im Talk-Modus über `talk.speak` mit dem aktiven Talk-Provider auf. Android greift nur dann auf lokales System-TTS zurück, wenn dieses RPC nicht verfügbar ist.
- `stability` für `eleven_v3` wird auf `0.0`, `0.5` oder `1.0` validiert; andere Modelle akzeptieren `0..1`.
- `latency_tier` wird, wenn gesetzt, auf `0..4` validiert.
- Android unterstützt die Ausgabeformate `pcm_16000`, `pcm_22050`, `pcm_24000` und `pcm_44100` für latenzarmes AudioTrack-Streaming.
