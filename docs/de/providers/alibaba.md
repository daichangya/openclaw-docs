---
read_when:
    - Sie möchten die Alibaba-Wan-Videogenerierung in OpenClaw verwenden
    - Sie benötigen die Einrichtung eines Model-Studio- oder DashScope-API-Schlüssels für die Videogenerierung
summary: Alibaba Model Studio Wan-Videogenerierung in OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T06:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw liefert einen gebündelten Video-Generierungs-Provider `alibaba` für Wan-Modelle auf
Alibaba Model Studio / DashScope mit.

- Provider: `alibaba`
- Bevorzugte Authentifizierung: `MODELSTUDIO_API_KEY`
- Ebenfalls akzeptiert: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: asynchrone DashScope-/Model-Studio-Videogenerierung

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel setzen">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Ein Standard-Videomodell setzen">
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
Jeder der akzeptierten Auth-Schlüssel (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funktioniert. Die Onboarding-Auswahl `qwen-standard-api-key` konfiguriert die gemeinsame DashScope-Anmeldedatei.
</Note>

## Integrierte Wan-Modelle

Der gebündelte Provider `alibaba` registriert derzeit:

| Modell-Ref                 | Modus                        |
| -------------------------- | ---------------------------- |
| `alibaba/wan2.6-t2v`       | Text-zu-Video                |
| `alibaba/wan2.6-i2v`       | Bild-zu-Video                |
| `alibaba/wan2.6-r2v`       | Referenz-zu-Video            |
| `alibaba/wan2.6-r2v-flash` | Referenz-zu-Video (schnell)  |
| `alibaba/wan2.7-r2v`       | Referenz-zu-Video            |

## Aktuelle Limits

| Parameter             | Limit                                                      |
| --------------------- | ---------------------------------------------------------- |
| Ausgabevideos         | Bis zu **1** pro Anfrage                                   |
| Eingabebilder         | Bis zu **1**                                               |
| Eingabevideos         | Bis zu **4**                                               |
| Dauer                 | Bis zu **10 Sekunden**                                     |
| Unterstützte Steuerungen | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referenzbild/-video   | Nur entfernte `http(s)`-URLs                               |

<Warning>
Der Modus mit Referenzbild/-video erfordert derzeit **entfernte `http(s)`-URLs**. Lokale Dateipfade werden für Referenzeingaben nicht unterstützt.
</Warning>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Beziehung zu Qwen">
    Der gebündelte Provider `qwen` verwendet ebenfalls von Alibaba gehostete DashScope-Endpunkte für
    die Wan-Videogenerierung. Verwenden Sie:

    - `qwen/...`, wenn Sie die kanonische Provider-Oberfläche von Qwen möchten
    - `alibaba/...`, wenn Sie die direkte, vom Anbieter selbst verwaltete Wan-Video-Oberfläche möchten

    Weitere Details finden Sie in der [Qwen-Provider-Dokumentation](/de/providers/qwen).

  </Accordion>

  <Accordion title="Priorität der Auth-Schlüssel">
    OpenClaw prüft Auth-Schlüssel in dieser Reihenfolge:

    1. `MODELSTUDIO_API_KEY` (bevorzugt)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Jeder dieser Schlüssel authentifiziert den Provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Qwen" href="/de/providers/qwen" icon="microchip">
    Einrichtung des Qwen-Providers und DashScope-Integration.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standards und Modellkonfiguration.
  </Card>
</CardGroup>
