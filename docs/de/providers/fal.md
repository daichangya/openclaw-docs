---
read_when:
    - Sie möchten die Bildgenerierung mit fal in OpenClaw verwenden
    - Sie benötigen den Auth-Ablauf mit `FAL_KEY`
    - Sie möchten fal-Standardeinstellungen für `image_generate` oder `video_generate`
summary: Einrichtung der Bild- und Videogenerierung mit fal in OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-12T23:30:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff275233179b4808d625383efe04189ad9e92af09944ba39f1e953e77378e347
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw enthält einen gebündelten `fal`-Provider für gehostete Bild- und Videogenerierung.

| Eigenschaft | Wert                                                          |
| ----------- | ------------------------------------------------------------- |
| Provider    | `fal`                                                         |
| Auth        | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert ebenfalls als Fallback) |
| API         | fal-Modellendpunkte                                           |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Ein Standard-Bildmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Bildgenerierung

Der gebündelte `fal`-Provider für Bildgenerierung verwendet standardmäßig
`fal/fal-ai/flux/dev`.

| Capability      | Wert                       |
| --------------- | -------------------------- |
| Maximale Bilder | 4 pro Anfrage              |
| Bearbeitungsmodus | Aktiviert, 1 Referenzbild |
| Größenüberschreibungen | Unterstützt          |
| Seitenverhältnis | Unterstützt               |
| Auflösung       | Unterstützt                |

<Warning>
Der fal-Endpunkt zur Bildbearbeitung unterstützt **keine** Überschreibungen von `aspectRatio`.
</Warning>

So verwenden Sie fal als Standard-Provider für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Videogenerierung

Der gebündelte `fal`-Provider für Videogenerierung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

| Capability | Wert                                                         |
| ---------- | ------------------------------------------------------------ |
| Modi       | Text-zu-Video, Einzelbild-Referenz                           |
| Laufzeit   | Queue-gestützter Senden-/Status-/Ergebnis-Ablauf für lang laufende Jobs |

<AccordionGroup>
  <Accordion title="Verfügbare Videomodelle">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Konfigurationsbeispiel für Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfigurationsbeispiel für HeyGen video-agent">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
Verwenden Sie `openclaw models list --provider fal`, um die vollständige Liste verfügbarer fal-
Modelle zu sehen, einschließlich kürzlich hinzugefügter Einträge.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Providerauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference#agent-defaults" icon="gear">
    Agent-Standards einschließlich Bild- und Videomodellauswahl.
  </Card>
</CardGroup>
