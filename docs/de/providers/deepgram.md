---
read_when:
    - Sie möchten Deepgram Speech-to-Text für Audio-Anhänge.
    - Sie möchten Deepgram-Streaming-Transkription für Voice Call.
    - Sie benötigen ein schnelles Deepgram-Konfigurationsbeispiel.
summary: Deepgram-Transkription für eingehende Sprachnachrichten
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T14:04:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Audio-Transkription)

Deepgram ist eine Speech-to-Text-API. In OpenClaw wird sie für die Transkription eingehender
Audio-/Sprachnachrichten über `tools.media.audio` und für Streaming-STT in Voice Call
über `plugins.entries.voice-call.config.streaming` verwendet.

Für Batch-Transkription lädt OpenClaw die vollständige Audiodatei zu Deepgram hoch
und injiziert das Transkript in die Antwort-Pipeline (`{{Transcript}}` +
`[Audio]`-Block). Für Streaming in Voice Call leitet OpenClaw Live-G.711-
u-law-Frames über Deepgrams WebSocket-Endpunkt `listen` weiter und sendet partielle oder
finale Transkripte, sobald Deepgram sie zurückgibt.

| Detail        | Wert                                                        |
| ------------- | ----------------------------------------------------------- |
| Website       | [deepgram.com](https://deepgram.com)                        |
| Docs          | [developers.deepgram.com](https://developers.deepgram.com)  |
| Auth          | `DEEPGRAM_API_KEY`                                          |
| Standardmodell | `nova-3`                                                   |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel setzen">
    Fügen Sie Ihren Deepgram-API-Schlüssel zur Umgebung hinzu:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Den Audio-Provider aktivieren">
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
  <Step title="Eine Sprachnachricht senden">
    Senden Sie eine Audionachricht über einen beliebigen verbundenen Kanal. OpenClaw transkribiert sie
    über Deepgram und injiziert das Transkript in die Antwort-Pipeline.
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

## Voice Call Streaming-STT

Das gebündelte Plugin `deepgram` registriert außerdem einen Echtzeit-Transkriptions-Provider
für das Voice-Call-Plugin.

| Einstellung      | Konfigurationspfad                                                    | Standard                          |
| ---------------- | --------------------------------------------------------------------- | --------------------------------- |
| API-Schlüssel    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Fällt auf `DEEPGRAM_API_KEY` zurück |
| Modell           | `...deepgram.model`                                                   | `nova-3`                          |
| Sprache          | `...deepgram.language`                                                | (nicht gesetzt)                   |
| Encoding         | `...deepgram.encoding`                                                | `mulaw`                           |
| Sample Rate      | `...deepgram.sampleRate`                                              | `8000`                            |
| Endpointing      | `...deepgram.endpointingMs`                                           | `800`                             |
| Interim Results  | `...deepgram.interimResults`                                          | `true`                            |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call empfängt Telefonie-Audio als 8-kHz-G.711-u-law. Der Deepgram-
Streaming-Provider verwendet standardmäßig `encoding: "mulaw"` und `sampleRate: 8000`, sodass
Twilio-Media-Frames direkt weitergeleitet werden können.
</Note>

## Hinweise

<AccordionGroup>
  <Accordion title="Authentifizierung">
    Die Authentifizierung folgt der standardmäßigen Provider-Reihenfolge für Authentifizierung. `DEEPGRAM_API_KEY` ist
    der einfachste Weg.
  </Accordion>
  <Accordion title="Proxy und benutzerdefinierte Endpunkte">
    Überschreiben Sie Endpunkte oder Header mit `tools.media.audio.baseUrl` und
    `tools.media.audio.headers`, wenn Sie einen Proxy verwenden.
  </Accordion>
  <Accordion title="Ausgabeverhalten">
    Die Ausgabe folgt denselben Audio-Regeln wie bei anderen Providern (Größenlimits, Timeouts,
    Transkript-Injektion).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Media tools" href="/de/tools/media-overview" icon="photo-film">
    Überblick über die Verarbeitungs-Pipeline für Audio, Bilder und Video.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Einstellungen für Media-Tools.
  </Card>
  <Card title="Troubleshooting" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zum Debuggen.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
