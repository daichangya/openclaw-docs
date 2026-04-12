---
read_when:
    - Sie möchten Speech-to-Text von Deepgram für Audioanhänge verwenden
    - Sie benötigen ein kurzes Konfigurationsbeispiel für Deepgram
summary: Deepgram-Transkription für eingehende Sprachnotizen
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Audio-Transkription)

Deepgram ist eine Speech-to-Text-API. In OpenClaw wird sie für die **Transkription eingehender Audio-/Sprachnotizen**
über `tools.media.audio` verwendet.

Wenn aktiviert, lädt OpenClaw die Audiodatei zu Deepgram hoch und fügt das Transkript
in die Antwort-Pipeline ein (`{{Transcript}}` + `[Audio]`-Block). Dies ist **nicht Streaming**;
es verwendet den Endpunkt für vorab aufgezeichnete Transkription.

| Detail         | Wert                                                       |
| -------------- | ---------------------------------------------------------- |
| Website        | [deepgram.com](https://deepgram.com)                       |
| Docs           | [developers.deepgram.com](https://developers.deepgram.com) |
| Auth           | `DEEPGRAM_API_KEY`                                         |
| Standardmodell | `nova-3`                                                   |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Fügen Sie Ihren Deepgram-API-Schlüssel zur Umgebung hinzu:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Audio-Provider aktivieren">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Eine Sprachnotiz senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie
    über Deepgram und fügt das Transkript in die Antwort-Pipeline ein.
  </Step>
</Steps>

## Konfigurationsoptionen

| Option            | Pfad                                                         | Beschreibung                          |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram-Modell-ID (Standard: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Sprachhinweis (optional)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Spracherkennung aktivieren (optional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Zeichensetzung aktivieren (optional)  |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Smart Formatting aktivieren (optional) |

<Tabs>
  <Tab title="Mit Sprachhinweis">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Mit Deepgram-Optionen">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der Standardreihenfolge für Provider-Authentifizierung. `DEEPGRAM_API_KEY` ist
    der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie Endpunkte oder Header mit `tools.media.audio.baseUrl` und
    `tools.media.audio.headers`, wenn Sie einen Proxy verwenden.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audioregeln wie bei anderen Providern (Größenbeschränkungen, Timeouts,
    Einfügen des Transkripts).
  </Accordion>
</AccordionGroup>

<Note>
Deepgram-Transkription ist **nur für vorab aufgezeichnete Audioinhalte** verfügbar (kein Echtzeit-Streaming). OpenClaw
lädt die vollständige Audiodatei hoch und wartet auf das vollständige Transkript, bevor
es in die Konversation eingefügt wird.
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Media tools" href="/tools/media" icon="photo-film">
    Überblick über die Verarbeitungs-Pipeline für Audio, Bilder und Video.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Einstellungen für Media-Tools.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Debugging-Schritte.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zum OpenClaw-Setup.
  </Card>
</CardGroup>
