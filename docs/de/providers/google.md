---
read_when:
    - Sie möchten Google-Gemini-Modelle mit OpenClaw verwenden.
    - Sie benötigen den Authentifizierungsablauf mit API key oder OAuth.
summary: Google-Gemini-Einrichtung (API key + OAuth, Bildgenerierung, Medienverarbeitung, TTS, Web-Suche)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T06:54:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Das Google-Plugin stellt Zugriff auf Gemini-Modelle über Google AI Studio bereit sowie
Bildgenerierung, Medienverarbeitung (Bild/Audio/Video), Text-to-Speech und Web-Suche über
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternativer Provider: `google-gemini-cli` (OAuth)

## Erste Schritte

Wählen Sie Ihre bevorzugte Authentifizierungsmethode und folgen Sie den Einrichtungs-Schritten.

<Tabs>
  <Tab title="API key">
    **Am besten geeignet für:** standardmäßigen Gemini-API-Zugriff über Google AI Studio.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oder den Schlüssel direkt übergeben:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Ein Standardmodell setzen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Die Umgebungsvariablen `GEMINI_API_KEY` und `GOOGLE_API_KEY` werden beide akzeptiert. Verwenden Sie diejenige, die Sie bereits konfiguriert haben.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Am besten geeignet für:** Wiederverwendung eines bestehenden Gemini-CLI-Logins über PKCE OAuth statt eines separaten API-Schlüssels.

    <Warning>
    Der Provider `google-gemini-cli` ist eine inoffizielle Integration. Einige Benutzer
    berichten von Kontobeschränkungen bei der Nutzung von OAuth auf diese Weise. Nutzung auf eigenes Risiko.
    </Warning>

    <Steps>
      <Step title="Die Gemini CLI installieren">
        Der lokale Befehl `gemini` muss in `PATH` verfügbar sein.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oder npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw unterstützt sowohl Homebrew-Installationen als auch globale npm-Installationen, einschließlich
        gängiger Windows-/npm-Layouts.
      </Step>
      <Step title="Über OAuth anmelden">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Umgebungsvariablen:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oder die Varianten `GEMINI_CLI_*`.)

    <Note>
    Wenn Gemini-CLI-OAuth-Requests nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder
    `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host und versuchen Sie es erneut.
    </Note>

    <Note>
    Wenn der Login fehlschlägt, bevor der Browser-Flow startet, stellen Sie sicher, dass der lokale Befehl `gemini`
    installiert ist und in `PATH` liegt.
    </Note>

    Der reine OAuth-Provider `google-gemini-cli` ist eine separate Oberfläche für Text-Inferenz.
    Bildgenerierung, Medienverarbeitung und Gemini Grounding bleiben auf
    der Provider-ID `google`.

  </Tab>
</Tabs>

## Fähigkeiten

| Fähigkeit              | Unterstützt                      |
| ---------------------- | -------------------------------- |
| Chat Completions       | Ja                               |
| Bildgenerierung        | Ja                               |
| Musikgenerierung       | Ja                               |
| Text-to-speech         | Ja                               |
| Bildverarbeitung       | Ja                               |
| Audio-Transkription    | Ja                               |
| Videoverarbeitung      | Ja                               |
| Web-Suche (Grounding)  | Ja                               |
| Thinking/Reasoning     | Ja (Gemini 2.5+ / Gemini 3+)     |
| Gemma-4-Modelle        | Ja                               |

<Tip>
Gemini-3-Modelle verwenden `thinkingLevel` statt `thinkingBudget`. OpenClaw mappt
Reasoning-Steuerungen für Gemini 3, Gemini 3.1 und Alias `gemini-*-latest` auf
`thinkingLevel`, damit Standardläufe/Läufe mit geringer Latenz keine deaktivierten
Werte für `thinkingBudget` senden.

Gemma-4-Modelle (zum Beispiel `gemma-4-26b-a4b-it`) unterstützen Thinking-Modus. OpenClaw
schreibt `thinkingBudget` auf ein unterstütztes Google-`thinkingLevel` für Gemma 4 um.
Wenn Thinking auf `off` gesetzt ist, bleibt Thinking deaktiviert, statt auf
`MINIMAL` gemappt zu werden.
</Tip>

## Bildgenerierung

Der gebündelte `google`-Provider für Bildgenerierung verwendet standardmäßig
`google/gemini-3.1-flash-image-preview`.

- Unterstützt auch `google/gemini-3-pro-image-preview`
- Generieren: bis zu 4 Bilder pro Request
- Edit-Modus: aktiviert, bis zu 5 Eingabebilder
- Geometrie-Steuerungen: `size`, `aspectRatio` und `resolution`

Um Google als Standard-Provider für Bilder zu verwenden:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Siehe [Image Generation](/de/tools/image-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Videogenerierung

Das gebündelte `google`-Plugin registriert auch Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `google/veo-3.1-fast-generate-preview`
- Modi: Text-zu-Video, Bild-zu-Video und Flows mit einzelner Video-Referenz
- Unterstützt `aspectRatio`, `resolution` und `audio`
- Aktuelle Dauerbegrenzung: **4 bis 8 Sekunden**

Um Google als Standard-Provider für Video zu verwenden:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Musikgenerierung

Das gebündelte `google`-Plugin registriert auch Musikgenerierung über das gemeinsame
Tool `music_generate`.

- Standard-Musikmodell: `google/lyria-3-clip-preview`
- Unterstützt auch `google/lyria-3-pro-preview`
- Prompt-Steuerungen: `lyrics` und `instrumental`
- Ausgabeformat: standardmäßig `mp3`, zusätzlich `wav` bei `google/lyria-3-pro-preview`
- Referenz-Inputs: bis zu 10 Bilder
- Sitzungsgebundene Läufe werden über den gemeinsamen Task-/Status-Flow entkoppelt, einschließlich `action: "status"`

Um Google als Standard-Provider für Musik zu verwenden:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Siehe [Music Generation](/de/tools/music-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Text-to-Speech

Der gebündelte Sprach-Provider `google` verwendet den Gemini-API-TTS-Pfad mit
`gemini-3.1-flash-tts-preview`.

- Standardstimme: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` oder `GOOGLE_API_KEY`
- Ausgabe: WAV für reguläre TTS-Anhänge, PCM für Talk/Telefonie
- Native Sprachnachrichten-Ausgabe: wird auf diesem Gemini-API-Pfad nicht unterstützt, weil die API PCM statt Opus zurückgibt

Um Google als Standard-TTS-Provider zu verwenden:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Gemini-API-TTS akzeptiert expressive Audio-Tags in eckigen Klammern im Text, etwa
`[whispers]` oder `[laughs]`. Um Tags aus der sichtbaren Chat-Antwort herauszuhalten, während
sie trotzdem an TTS gesendet werden, setzen Sie sie in einen Block `[[tts:text]]...[[/tts:text]]`:

```text
Hier ist der saubere Antworttext.

[[tts:text]][whispers] Hier ist die gesprochene Version.[[/tts:text]]
```

<Note>
Ein API-Schlüssel aus der Google Cloud Console, der auf die Gemini API beschränkt ist, ist für diesen
Provider gültig. Dies ist nicht der separate Pfad der Cloud Text-to-Speech API.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Direkte Wiederverwendung des Gemini-Cache">
    Für direkte Gemini-API-Läufe (`api: "google-generative-ai"`) übergibt OpenClaw
    einen konfigurierten Handle `cachedContent` an Gemini-Requests.

    - Konfigurieren Sie pro Modell oder global mit entweder
      `cachedContent` oder dem alten `cached_content`
    - Wenn beide vorhanden sind, gewinnt `cachedContent`
    - Beispielwert: `cachedContents/prebuilt-context`
    - Gemini-Cache-Hit-Nutzung wird in OpenClaw `cacheRead` normalisiert aus
      upstream `cachedContentTokenCount`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Hinweise zur JSON-Nutzung von Gemini CLI">
    Wenn der OAuth-Provider `google-gemini-cli` verwendet wird, normalisiert OpenClaw
    die JSON-Ausgabe der CLI wie folgt:

    - Antworttext kommt aus dem JSON-Feld `response` der CLI.
    - Nutzung fällt auf `stats` zurück, wenn die CLI `usage` leer lässt.
    - `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
    - Wenn `stats.input` fehlt, leitet OpenClaw Input-Tokens aus
      `stats.input_tokens - stats.cached` ab.

  </Accordion>

  <Accordion title="Umgebung und Daemon-Setup">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GEMINI_API_KEY`
    diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Provider-Auswahl.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Music generation" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musik-Tools und Provider-Auswahl.
  </Card>
</CardGroup>
