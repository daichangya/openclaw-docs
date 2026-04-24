---
read_when:
    - Sie möchten Bildgenerierung mit fal in OpenClaw verwenden
    - Sie benötigen den Authentifizierungsablauf mit FAL_KEY
    - Sie möchten fal-Standardwerte für `image_generate` oder `video_generate` ಬಳಸzen
summary: Einrichtung der Bild- und Videogenerierung mit fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-24T06:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: d23d2d0d27e5f60f9dacb4a6a7e4c07248cf45ccd80bfabaf6bb99f5f78946b2
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw enthält einen gebündelten Provider `fal` für gehostete Bild- und Videogenerierung.

| Eigenschaft | Wert                                                          |
| ----------- | ------------------------------------------------------------- |
| Provider    | `fal`                                                         |
| Auth        | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback) |
| API         | fal-Modellendpunkte                                           |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel setzen">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Standard-Bildmodell setzen">
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

Der gebündelte Provider `fal` für Bildgenerierung verwendet standardmäßig
`fal/fal-ai/flux/dev`.

| Fähigkeit      | Wert                       |
| --------------- | -------------------------- |
| Max. Bilder     | 4 pro Anfrage              |
| Bearbeitungsmodus | Aktiviert, 1 Referenzbild |
| Größenüberschreibungen | Unterstützt         |
| Seitenverhältnis | Unterstützt               |
| Auflösung       | Unterstützt                |

<Warning>
Der fal-Endpunkt für Bildbearbeitung unterstützt **keine** Überschreibungen von `aspectRatio`.
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

Der gebündelte Provider `fal` für Videogenerierung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

| Fähigkeit | Wert                                                         |
| --------- | ------------------------------------------------------------ |
| Modi      | Text-zu-Video, Referenz mit einem einzelnen Bild             |
| Laufzeit  | Warteschlangenbasierter Submit-/Status-/Ergebnis-Ablauf für lang laufende Jobs |

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

  <Accordion title="Beispielkonfiguration für Seedance 2.0">
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

  <Accordion title="Beispielkonfiguration für HeyGen video-agent">
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
Verwenden Sie `openclaw models list --provider fal`, um die vollständige Liste der verfügbaren fal-
Modelle zu sehen, einschließlich kürzlich hinzugefügter Einträge.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Providerauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen einschließlich Auswahl von Bild- und Videomodellen.
  </Card>
</CardGroup>
