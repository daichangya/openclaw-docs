---
read_when:
    - Sie möchten die Alibaba-Wan-Videogenerierung in OpenClaw verwenden.
    - Sie benötigen die Einrichtung eines Model-Studio- oder DashScope-API-Schlüssels für die Videogenerierung.
summary: Alibaba Model Studio Wan-Videogenerierung in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw enthält einen gebündelten `alibaba`-Provider für die Wan-Videogenerierung auf
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Bevorzugte Authentifizierung: `MODELSTUDIO_API_KEY`
- Ebenfalls akzeptiert: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: asynchrone Videogenerierung über DashScope / Model Studio

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Ein Standard-Videomodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Prüfen, ob der Provider verfügbar ist">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Jeder der akzeptierten Authentifizierungsschlüssel (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funktioniert. Die Onboarding-Option `qwen-standard-api-key` konfiguriert die gemeinsam genutzten DashScope-Anmeldedaten.
</Note>

## Integrierte Wan-Modelle

Der gebündelte `alibaba`-Provider registriert derzeit:

| Modell-Ref                 | Modus                     |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Text-zu-Video             |
| `alibaba/wan2.6-i2v`       | Bild-zu-Video             |
| `alibaba/wan2.6-r2v`       | Referenz-zu-Video         |
| `alibaba/wan2.6-r2v-flash` | Referenz-zu-Video (schnell) |
| `alibaba/wan2.7-r2v`       | Referenz-zu-Video         |

## Aktuelle Limits

| Parameter             | Limit                                                     |
| --------------------- | --------------------------------------------------------- |
| Ausgabevideos         | Bis zu **1** pro Anfrage                                  |
| Eingabebilder         | Bis zu **1**                                              |
| Eingabevideos         | Bis zu **4**                                              |
| Dauer                 | Bis zu **10 Sekunden**                                    |
| Unterstützte Steuerungen | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referenzbild/-video   | Nur Remote-`http(s)`-URLs                                 |

<Warning>
Der Referenzbild/-video-Modus erfordert derzeit **Remote-`http(s)`-URLs**. Lokale Dateipfade werden für Referenzeingaben nicht unterstützt.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Beziehung zu Qwen">
    Der gebündelte `qwen`-Provider verwendet für die
    Wan-Videogenerierung ebenfalls von Alibaba gehostete DashScope-Endpunkte. Verwenden Sie:

    - `qwen/...`, wenn Sie die kanonische Qwen-Provider-Oberfläche möchten
    - `alibaba/...`, wenn Sie die direkte, anbieter-eigene Wan-Video-Oberfläche möchten

    Weitere Details finden Sie in der [Qwen-Provider-Dokumentation](/de/providers/qwen).

  </Accordion>

  <Accordion title="Priorität der Authentifizierungsschlüssel">
    OpenClaw prüft Authentifizierungsschlüssel in dieser Reihenfolge:

    1. `MODELSTUDIO_API_KEY` (bevorzugt)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Jeder dieser Schlüssel authentifiziert den `alibaba`-Provider.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Qwen" href="/de/providers/qwen" icon="microchip">
    Qwen-Provider-Einrichtung und DashScope-Integration.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference#agent-defaults" icon="gear">
    Agent-Standardeinstellungen und Modellkonfiguration.
  </Card>
</CardGroup>
