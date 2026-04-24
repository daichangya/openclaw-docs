---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw.
    - Sie benötigen eine Anleitung zur Einrichtung des Vydra-API keys.
summary: Vydra-Bild, -Video und -Sprache in OpenClaw verwenden
title: Vydra
x-i18n:
    generated_at: "2026-04-24T06:56:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

Das gebündelte Vydra-Plugin fügt Folgendes hinzu:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über die ElevenLabs-gestützte TTS-Route von Vydra

OpenClaw verwendet für alle drei Fähigkeiten denselben `VYDRA_API_KEY`.

<Warning>
Verwenden Sie `https://www.vydra.ai/api/v1` als Base-URL.

Der Apex-Host von Vydra (`https://vydra.ai/api/v1`) leitet derzeit zu `www` weiter. Manche HTTP-Clients verwerfen `Authorization` bei diesem hostübergreifenden Redirect, wodurch ein gültiger API key wie ein irreführender Auth-Fehler aussieht. Das gebündelte Plugin verwendet direkt die Base-URL mit `www`, um das zu vermeiden.
</Warning>

## Einrichtung

<Steps>
  <Step title="Interaktives Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oder die Env-Variable direkt setzen:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Eine Standard-Fähigkeit wählen">
    Wählen Sie eine oder mehrere der folgenden Fähigkeiten aus (Bild, Video oder Sprache) und wenden Sie die passende Konfiguration an.
  </Step>
</Steps>

## Fähigkeiten

<AccordionGroup>
  <Accordion title="Bildgenerierung">
    Standard-Bildmodell:

    - `vydra/grok-imagine`

    Als Standard-Provider für Bilder setzen:

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

    Die aktuelle gebündelte Unterstützung ist nur Text-zu-Bild. Die gehosteten Edit-Routen von Vydra erwarten entfernte Bild-URLs, und OpenClaw fügt im gebündelten Plugin bisher noch keine Vydra-spezifische Upload-Bridge hinzu.

    <Note>
    Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Videogenerierung">
    Registrierte Videomodelle:

    - `vydra/veo3` für Text-zu-Video
    - `vydra/kling` für Bild-zu-Video

    Vydra als Standard-Provider für Video setzen:

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

    - `vydra/veo3` ist gebündelt nur als Text-zu-Video.
    - `vydra/kling` erfordert derzeit eine Referenz auf eine entfernte Bild-URL. Lokale Datei-Uploads werden direkt abgelehnt.
    - Die aktuelle `kling`-HTTP-Route von Vydra war uneinheitlich darin, ob sie `image_url` oder `video_url` verlangt; der gebündelte Provider mappt dieselbe entfernte Bild-URL auf beide Felder.
    - Das gebündelte Plugin bleibt konservativ und leitet keine undokumentierten Stilparameter wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio weiter.

    <Note>
    Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Live-Tests für Video">
    Provider-spezifische Live-Abdeckung:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Die gebündelte Vydra-Live-Datei deckt jetzt ab:

    - `vydra/veo3` Text-zu-Video
    - `vydra/kling` Bild-zu-Video mit einer entfernten Bild-URL

    Überschreiben Sie bei Bedarf das Fixture für die entfernte Bildreferenz:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sprachsynthese">
    Vydra als Sprach-Provider setzen:

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

    Das gebündelte Plugin stellt derzeit eine bekannte funktionierende Standardstimme bereit und gibt MP3-Audiodateien zurück.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Provider directory" href="/de/providers/index" icon="list">
    Alle verfügbaren Provider durchsuchen.
  </Card>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standards und Modellkonfiguration.
  </Card>
</CardGroup>
