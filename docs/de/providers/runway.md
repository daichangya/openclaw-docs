---
read_when:
    - Sie möchten die Runway-Videogenerierung in OpenClaw verwenden
    - Sie benötigen die Einrichtung von Runway-API-Schlüssel/Umgebungsvariablen
    - Sie möchten Runway zum Standard-Video-Provider machen
summary: Runway-Videogenerierung in OpenClaw einrichten
title: Runway
x-i18n:
    generated_at: "2026-04-12T23:33:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw liefert einen gebündelten `runway`-Provider für gehostete Videogenerierung mit.

| Eigenschaft | Wert                                                              |
| ----------- | ----------------------------------------------------------------- |
| Provider-ID | `runway`                                                          |
| Auth        | `RUNWAYML_API_SECRET` (kanonisch) oder `RUNWAY_API_KEY`           |
| API         | Aufgabenbasierte Runway-Videogenerierung (`GET /v1/tasks/{id}`-Polling) |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel setzen">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Runway als Standard-Video-Provider festlegen">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Ein Video generieren">
    Bitten Sie den Agenten, ein Video zu generieren. Runway wird automatisch verwendet.
  </Step>
</Steps>

## Unterstützte Modi

| Modus          | Modell            | Referenzeingabe          |
| -------------- | ----------------- | ------------------------ |
| Text-zu-Video  | `gen4.5` (Standard) | Keine                  |
| Bild-zu-Video  | `gen4.5`          | 1 lokales oder Remote-Bild |
| Video-zu-Video | `gen4_aleph`      | 1 lokales oder Remote-Video |

<Note>
Lokale Bild- und Video-Referenzen werden über Daten-URIs unterstützt. Reine Textläufe
bieten derzeit die Seitenverhältnisse `16:9` und `9:16`.
</Note>

<Warning>
Video-zu-Video erfordert derzeit ausdrücklich `runway/gen4_aleph`.
</Warning>

## Konfiguration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Aliasse für Umgebungsvariablen">
    OpenClaw erkennt sowohl `RUNWAYML_API_SECRET` (kanonisch) als auch `RUNWAY_API_KEY`.
    Beide Variablen authentifizieren den Runway-Provider.
  </Accordion>

  <Accordion title="Task-Polling">
    Runway verwendet eine aufgabenbasierte API. Nach dem Absenden einer Generierungsanfrage führt OpenClaw
    Polling auf `GET /v1/tasks/{id}` durch, bis das Video bereit ist. Für das Polling-Verhalten ist
    keine zusätzliche Konfiguration erforderlich.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter, Providerauswahl und asynchrones Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference#agent-defaults" icon="gear">
    Standard-Agent-Einstellungen einschließlich des Modells für Videogenerierung.
  </Card>
</CardGroup>
