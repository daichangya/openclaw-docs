---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über OpenClaws gebündelten qwen-Provider verwenden
title: Qwen
x-i18n:
    generated_at: "2026-04-23T14:06:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70726b64202d8167f7879320281bde86d69ffa4c40117a53352922eb65d66400
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth wurde entfernt.** Die Free-Tier-OAuth-Integration
(`qwen-portal`), die `portal.qwen.ai`-Endpoints verwendete, ist nicht mehr verfügbar.
Siehe [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) für
Hintergrundinformationen.

</Warning>

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpoints von Qwen Cloud / Alibaba DashScope und
Coding Plan und hält veraltete `modelstudio`-IDs als
Kompatibilitätsalias funktionsfähig.

- Provider: `qwen`
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Aus Kompatibilitätsgründen ebenfalls akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

<Tip>
Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpoint **Standard (pay-as-you-go)**.
Die Unterstützung des Coding Plan kann hinter dem öffentlichen Katalog zurückbleiben.
</Tip>

## Erste Schritte

Wählen Sie Ihren Plantyp und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Am besten geeignet für:** abonnementsbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den Endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den Endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Veraltete Auth-Choice-IDs vom Typ `modelstudio-*` und Modell-Referenzen vom Typ `modelstudio/...` funktionieren weiterhin
    als Kompatibilitätsaliase, aber neue Setup-Abläufe sollten die kanonischen
    Auth-Choice-IDs `qwen-*` und Modell-Referenzen `qwen/...` bevorzugen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Am besten geeignet für:** nutzungsbasierten Zugriff über den Standard-Model-Studio-Endpoint, einschließlich Modellen wie `qwen3.6-plus`, die im Coding Plan möglicherweise nicht verfügbar sind.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den Endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den Endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifizieren, dass das Modell verfügbar ist">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Veraltete Auth-Choice-IDs vom Typ `modelstudio-*` und Modell-Referenzen vom Typ `modelstudio/...` funktionieren weiterhin
    als Kompatibilitätsaliase, aber neue Setup-Abläufe sollten die kanonischen
    Auth-Choice-IDs `qwen-*` und Modell-Referenzen `qwen/...` bevorzugen.
    </Note>

  </Tab>
</Tabs>

## Plantypen und Endpoints

| Plan                       | Region | Auth-Choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Der Provider wählt den Endpoint automatisch anhand Ihrer Auth-Choice aus. Kanonische
Auswahlen verwenden die Familie `qwen-*`; `modelstudio-*` bleibt nur für Kompatibilität erhalten.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Qwen-Katalog aus. Der konfigurierte Katalog ist
endpointabhängig: Konfigurationen für den Coding Plan lassen Modelle weg, von denen nur bekannt ist, dass sie auf
dem Standard-Endpoint funktionieren.

| Modell-Referenz              | Eingabe     | Kontext   | Hinweise                                           |
| ---------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                                     |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Bei Bedarf dieses Modells Standard-Endpoints bevorzugen |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Reihe                                     |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Thinking aktiviert                                 |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba                           |

<Note>
Die Verfügbarkeit kann je nach Endpoint und Abrechnungsplan weiterhin variieren, auch wenn ein Modell im
gebündelten Katalog vorhanden ist.
</Note>

## Multimodale Add-ons

Das Plugin `qwen` stellt multimodale Fähigkeiten auch auf den **Standard**-
DashScope-Endpoints bereit (nicht auf den Coding-Plan-Endpoints):

- **Videoverständnis** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Um Qwen als Standard-Video-Provider zu verwenden:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Erweitert

<AccordionGroup>
  <Accordion title="Bild- und Videoverständnis">
    Das gebündelte Qwen-Plugin registriert Medienverständnis für Bilder und Video
    auf den **Standard**-DashScope-Endpoints (nicht auf den Coding-Plan-Endpoints).

    | Eigenschaft      | Wert                  |
    | ---------------- | --------------------- |
    | Modell           | `qwen-vl-max-latest`  |
    | Unterstützte Eingabe | Bilder, Video     |

    Medienverständnis wird automatisch aus der konfigurierten Qwen-Authentifizierung aufgelöst — keine
    zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie für Medienverständnis-Unterstützung einen
    Standard-Endpoint (pay-as-you-go) verwenden.

  </Accordion>

  <Accordion title="Verfügbarkeit von Qwen 3.6 Plus">
    `qwen3.6-plus` ist auf den Standard-Model-Studio-Endpoints (pay-as-you-go)
    verfügbar:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Wenn die Coding-Plan-Endpoints für
    `qwen3.6-plus` einen Fehler „unsupported model“ zurückgeben, wechseln Sie zu Standard (pay-as-you-go) statt zum Endpoint-/Schlüsselpaar des Coding Plan.

  </Accordion>

  <Accordion title="Capability-Plan">
    Das Plugin `qwen` wird als Vendor-Home für die gesamte Qwen-
    Cloud-Oberfläche positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chat-Modelle:** jetzt gebündelt
    - **Tool Calling, strukturierte Ausgabe, Thinking:** geerbt vom OpenAI-kompatiblen Transport
    - **Bildgenerierung:** auf der Ebene des Provider-Plugins geplant
    - **Bild-/Videoverständnis:** jetzt auf dem Standard-Endpoint gebündelt
    - **Speech/Audio:** auf der Ebene des Provider-Plugins geplant
    - **Memory Embeddings/Reranking:** über die Oberfläche des Embedding-Adapters geplant
    - **Videogenerierung:** jetzt über die gemeinsame Fähigkeit zur Videogenerierung gebündelt

  </Accordion>

  <Accordion title="Details zur Videogenerierung">
    Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
    DashScope-AIGC-Host zu, bevor der Job abgeschickt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die entweder auf die
    Coding-Plan- oder Standard-Qwen-Hosts zeigt, die Videogenerierung weiterhin auf dem korrekten
    regionalen DashScope-Video-Endpoint hält.

    Aktuelle Limits der gebündelten Qwen-Videogenerierung:

    - Bis zu **1** Ausgabevideo pro Anfrage
    - Bis zu **1** Eingabebild
    - Bis zu **4** Eingabevideos
    - Bis zu **10 Sekunden** Dauer
    - Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
    - Der Referenzbild-/Video-Modus erfordert derzeit **Remote-URLs mit http(s)**. Lokale
      Dateipfade werden im Voraus abgelehnt, weil der DashScope-Video-Endpoint für diese Referenzen keine hochgeladenen lokalen Buffer akzeptiert.

  </Accordion>

  <Accordion title="Streaming-Nutzungskompatibilität">
    Native Model-Studio-Endpoints signalisieren Kompatibilität mit Streaming-Nutzung auf dem
    gemeinsamen Transport `openai-completions`. OpenClaw koppelt dies jetzt an Endpoint-
    Fähigkeiten, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen Hosts zielen,
    dasselbe Streaming-Nutzungsverhalten übernehmen, anstatt
    speziell die integrierte Provider-ID `qwen` zu erfordern.

    Die native Kompatibilität mit Streaming-Nutzung gilt sowohl für die Hosts des Coding Plan als auch
    für die Standard-DashScope-kompatiblen Hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodale Endpoint-Regionen">
    Multimodale Oberflächen (Videoverständnis und Wan-Videogenerierung) verwenden die
    **Standard**-DashScope-Endpoints, nicht die Coding-Plan-Endpoints:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Einrichtung von Umgebung und Daemon">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `QWEN_API_KEY`
    diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/de/providers/alibaba" icon="cloud">
    Veralteter ModelStudio-Provider und Hinweise zur Migration.
  </Card>
  <Card title="Troubleshooting" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
