---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw verwenden
    - Sie benötigen Hinweise zur Einrichtung des Vydra-API-Schlüssels
summary: Vydra-Bild, -Video und -Sprache in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-04-07T06:18:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24006a687ed6f9792e7b2b10927cc7ad71c735462a92ce03d5fa7c2b2ee2fcc2
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Das gebündelte Vydra-Plugin fügt Folgendes hinzu:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über Vydras ElevenLabs-gestützte TTS-Route

OpenClaw verwendet für alle drei Funktionen denselben `VYDRA_API_KEY`.

## Wichtige Basis-URL

Verwenden Sie `https://www.vydra.ai/api/v1`.

Der Apex-Host von Vydra (`https://vydra.ai/api/v1`) leitet derzeit auf `www` um. Manche HTTP-Clients verwerfen `Authorization` bei dieser hostübergreifenden Umleitung, wodurch ein gültiger API-Schlüssel zu einem irreführenden Authentifizierungsfehler wird. Das gebündelte Plugin verwendet direkt die Basis-URL mit `www`, um dies zu vermeiden.

## Einrichtung

Interaktives Onboarding:

```bash
openclaw onboard --auth-choice vydra-api-key
```

Oder setzen Sie die Umgebungsvariable direkt:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Bildgenerierung

Standard-Bildmodell:

- `vydra/grok-imagine`

Als Standard-Bildprovider festlegen:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

Die aktuelle gebündelte Unterstützung umfasst nur Text-zu-Bild. Die gehosteten Bearbeitungsrouten von Vydra erwarten Remote-Bild-URLs, und OpenClaw fügt im gebündelten Plugin noch keine Vydra-spezifische Upload-Brücke hinzu.

Siehe [Image Generation](/de/tools/image-generation) für das gemeinsame Tool-Verhalten.

## Videogenerierung

Registrierte Videomodelle:

- `vydra/veo3` für Text-zu-Video
- `vydra/kling` für Bild-zu-Video

Vydra als Standard-Videoprovider festlegen:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Hinweise:

- `vydra/veo3` ist gebündelt nur als Text-zu-Video verfügbar.
- `vydra/kling` erfordert derzeit eine Remote-Bild-URL als Referenz. Uploads lokaler Dateien werden sofort abgelehnt.
- Die aktuelle HTTP-Route `kling` von Vydra ist uneinheitlich darin, ob sie `image_url` oder `video_url` erfordert; der gebündelte Provider ordnet dieselbe Remote-Bild-URL beiden Feldern zu.
- Das gebündelte Plugin bleibt konservativ und leitet keine undokumentierten Stilparameter wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio weiter.

Provider-spezifische Live-Abdeckung:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_VYDRA_VIDEO=1 \
pnpm test:live -- extensions/vydra/vydra.live.test.ts
```

Die gebündelte Vydra-Live-Datei deckt jetzt Folgendes ab:

- `vydra/veo3` Text-zu-Video
- `vydra/kling` Bild-zu-Video mit einer Remote-Bild-URL

Überschreiben Sie bei Bedarf die Remote-Bild-Fixture:

```bash
export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
```

Siehe [Video Generation](/de/tools/video-generation) für das gemeinsame Tool-Verhalten.

## Sprachsynthese

Vydra als Sprachprovider festlegen:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Standardwerte:

- Modell: `elevenlabs/tts`
- Voice-ID: `21m00Tcm4TlvDq8ikWAM`

Das gebündelte Plugin stellt derzeit eine bekannte, funktionierende Standardstimme bereit und liefert MP3-Audiodateien zurück.

## Verwandt

- [Provider Directory](/de/providers/index)
- [Image Generation](/de/tools/image-generation)
- [Video Generation](/de/tools/video-generation)
