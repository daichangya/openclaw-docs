---
read_when:
    - Sie möchten Vydra-Mediengenerierung in OpenClaw verwenden.
    - Sie benötigen eine Anleitung zum Einrichten des Vydra-API-Schlüssels.
summary: Vydra-Bild, -Video und -Speech in OpenClaw verwenden
title: Vydra-Bild, -Video und -Speech in OpenClaw verwenden
x-i18n:
    generated_at: "2026-04-12T23:33:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

Das gebündelte Vydra-Plugin fügt Folgendes hinzu:

- Bildgenerierung über `vydra/grok-imagine`
- Videogenerierung über `vydra/veo3` und `vydra/kling`
- Sprachsynthese über Vydras ElevenLabs-gestützte TTS-Route

OpenClaw verwendet für alle drei Funktionen denselben `VYDRA_API_KEY`.

<Warning>
Verwenden Sie `https://www.vydra.ai/api/v1` als Base-URL.

Der Apex-Host von Vydra (`https://vydra.ai/api/v1`) leitet derzeit auf `www` um. Einige HTTP-Clients verwerfen `Authorization` bei dieser hostübergreifenden Weiterleitung, wodurch ein gültiger API-Schlüssel zu einem irreführenden Authentifizierungsfehler wird. Das gebündelte Plugin verwendet direkt die Base-URL mit `www`, um dies zu vermeiden.
</Warning>

## Einrichtung

<Steps>
  <Step title="Interaktives Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Oder die Umgebungsvariable direkt setzen:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Eine Standardfunktion auswählen">
    Wählen Sie eine oder mehrere der untenstehenden Funktionen aus (Bild, Video oder Speech) und übernehmen Sie die entsprechende Konfiguration.
  </Step>
</Steps>

## Funktionen

<AccordionGroup>
  <Accordion title="Bildgenerierung">
    Standard-Bildmodell:

    - `vydra/grok-imagine`

    Als Standard-Provider für Bilder festlegen:

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

    Die aktuelle gebündelte Unterstützung ist nur Text-zu-Bild. Die gehosteten Bearbeitungsrouten von Vydra erwarten Remote-Bild-URLs, und OpenClaw fügt im gebündelten Plugin bisher noch keine Vydra-spezifische Upload-Bridge hinzu.

    <Note>
    Siehe [Bildgenerierung](/de/tools/image-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Videogenerierung">
    Registrierte Videomodelle:

    - `vydra/veo3` für Text-zu-Video
    - `vydra/kling` für Bild-zu-Video

    Vydra als Standard-Provider für Video festlegen:

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

    - `vydra/veo3` ist im Bundle nur als Text-zu-Video enthalten.
    - `vydra/kling` erfordert derzeit eine Remote-Bild-URL als Referenz. Lokale Datei-Uploads werden im Vorfeld abgelehnt.
    - Vydras aktuelle `kling`-HTTP-Route ist uneinheitlich darin, ob sie `image_url` oder `video_url` verlangt; der gebündelte Provider ordnet dieselbe Remote-Bild-URL beiden Feldern zu.
    - Das gebündelte Plugin bleibt konservativ und leitet nicht dokumentierte Stilparameter wie Seitenverhältnis, Auflösung, Wasserzeichen oder generiertes Audio nicht weiter.

    <Note>
    Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
    </Note>

  </Accordion>

  <Accordion title="Video-Live-Tests">
    Provider-spezifische Live-Abdeckung:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    Die gebündelte Vydra-Live-Datei deckt jetzt Folgendes ab:

    - `vydra/veo3` Text-zu-Video
    - `vydra/kling` Bild-zu-Video unter Verwendung einer Remote-Bild-URL

    Überschreiben Sie bei Bedarf das Remote-Bild-Fixture:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Sprachsynthese">
    Vydra als Speech-Provider festlegen:

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

    Das gebündelte Plugin stellt derzeit eine bekannte, funktionierende Standardstimme bereit und gibt MP3-Audiodateien zurück.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="list">
    Alle verfügbaren Provider durchsuchen.
  </Card>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Providerauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
</CardGroup>
