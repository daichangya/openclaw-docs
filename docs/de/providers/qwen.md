---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über OpenClaws gebündelten Qwen-Provider verwenden
title: Qwen
x-i18n:
    generated_at: "2026-04-12T23:33:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth wurde entfernt.** Die Free-Tier-OAuth-Integration
(`qwen-portal`), die `portal.qwen.ai`-Endpunkte verwendete, ist nicht mehr verfügbar.
Hintergrundinformationen finden Sie unter [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpunkte von Qwen Cloud / Alibaba DashScope und
Coding Plan und hält ältere `modelstudio`-IDs als
Kompatibilitätsalias funktionsfähig.

- Provider: `qwen`
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Aus Kompatibilitätsgründen ebenfalls akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

<Tip>
Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpunkt **Standard (pay-as-you-go)**.
Die Unterstützung im Coding Plan kann dem öffentlichen Katalog hinterherhinken.
</Tip>

## Erste Schritte

Wählen Sie Ihren Tariftyp und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Am besten geeignet für:** abonnementbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Erstellen Sie einen API-Schlüssel oder kopieren Sie ihn von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Für den Endpunkt **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den Endpunkt **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-`auth-choice`-IDs und `modelstudio/...`-Modell-Refs funktionieren weiterhin
    als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-`auth-choice`-IDs und `qwen/...`-Modell-Refs bevorzugen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Am besten geeignet für:** nutzungsbasierten Zugriff über den Standard-Model-Studio-Endpunkt, einschließlich Modellen wie `qwen3.6-plus`, die im Coding Plan möglicherweise nicht verfügbar sind.

    <Steps>
      <Step title="Get your API key">
        Erstellen Sie einen API-Schlüssel oder kopieren Sie ihn von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Für den Endpunkt **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den Endpunkt **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-`auth-choice`-IDs und `modelstudio/...`-Modell-Refs funktionieren weiterhin
    als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-`auth-choice`-IDs und `qwen/...`-Modell-Refs bevorzugen.
    </Note>

  </Tab>
</Tabs>

## Tariftypen und Endpunkte

| Tarif                      | Region | Auth choice                | Endpunkt                                        |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Der Provider wählt den Endpunkt automatisch anhand Ihrer `auth-choice` aus. Kanonische
Optionen verwenden die Familie `qwen-*`; `modelstudio-*` ist nur noch Kompatibilität.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Qwen-Katalog mit aus. Der konfigurierte Katalog ist
endpunktabhängig: Coding-Plan-Konfigurationen lassen Modelle aus, von denen nur bekannt ist, dass sie am
Standard-Endpunkt funktionieren.

| Modell-Ref                  | Eingabe     | Kontext   | Hinweise                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                                     |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Bevorzugen Sie Standard-Endpunkte, wenn Sie dieses Modell benötigen |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Linie                                     |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Thinking aktiviert                                 |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba                           |

<Note>
Die Verfügbarkeit kann weiterhin je nach Endpunkt und Abrechnungstarif variieren, auch wenn ein Modell im
gebündelten Katalog vorhanden ist.
</Note>

## Multimodale Erweiterungen

Die Erweiterung `qwen` stellt auch multimodale Fähigkeiten an den **Standard**-
DashScope-Endpunkten bereit (nicht an den Coding-Plan-Endpunkten):

- **Video Understanding** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

So verwenden Sie Qwen als Standard-Video-Provider:

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
    Das gebündelte Qwen-Plugin registriert Media Understanding für Bilder und Video
    an den **Standard**-DashScope-Endpunkten (nicht an den Coding-Plan-Endpunkten).

    | Eigenschaft     | Wert                |
    | ------------- | --------------------- |
    | Modell        | `qwen-vl-max-latest`  |
    | Unterstützte Eingabe | Bilder, Video   |

    Media Understanding wird automatisch aus der konfigurierten Qwen-Authentifizierung aufgelöst — es ist
    keine zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie einen Standard-Endpunkt (pay-as-you-go)
    für die Unterstützung von Media Understanding verwenden.

  </Accordion>

  <Accordion title="Verfügbarkeit von Qwen 3.6 Plus">
    `qwen3.6-plus` ist an den Standard-Model-Studio-Endpunkten (pay-as-you-go)
    verfügbar:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Wenn die Coding-Plan-Endpunkte für
    `qwen3.6-plus` einen Fehler „unsupported model“ zurückgeben, wechseln Sie zu Standard (pay-as-you-go) statt zum
    Endpunkt-/Schlüsselpaar des Coding Plan.

  </Accordion>

  <Accordion title="Capability-Plan">
    Die Erweiterung `qwen` wird als Anbieter-Heimat für die vollständige Qwen-
    Cloud-Oberfläche positioniert, nicht nur für Coding-/Text-Modelle.

    - **Text-/Chat-Modelle:** jetzt gebündelt
    - **Tool Calling, strukturierte Ausgabe, Thinking:** vom OpenAI-kompatiblen Transport geerbt
    - **Bildgenerierung:** auf der Ebene des Provider-Plugins geplant
    - **Bild-/Videoverständnis:** jetzt am Standard-Endpunkt gebündelt
    - **Sprache/Audio:** auf der Ebene des Provider-Plugins geplant
    - **Memory-Embeddings/Reranking:** über die Oberfläche des Embedding-Adapters geplant
    - **Videogenerierung:** jetzt über die gemeinsame Video-Generation-Capability gebündelt

  </Accordion>

  <Accordion title="Details zur Videogenerierung">
    Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
    DashScope-AIGC-Host zu, bevor der Auftrag übermittelt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die auf einen der
    Coding-Plan- oder Standard-Qwen-Hosts zeigt, die Videogenerierung weiterhin auf dem korrekten
    regionalen DashScope-Video-Endpunkt hält.

    Aktuelle gebündelte Qwen-Grenzwerte für die Videogenerierung:

    - Bis zu **1** Ausgabevideo pro Anfrage
    - Bis zu **1** Eingabebild
    - Bis zu **4** Eingabevideos
    - Bis zu **10 Sekunden** Dauer
    - Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
    - Der Referenzbild-/Videomodus erfordert derzeit **entfernte http(s)-URLs**. Lokale
      Dateipfade werden sofort abgelehnt, weil der DashScope-Video-Endpunkt keine hochgeladenen lokalen Buffer für diese Referenzen akzeptiert.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Model-Studio-Endpunkte melden Streaming-Nutzungskompatibilität für den
    gemeinsamen Transport `openai-completions`. OpenClaw richtet sich jetzt nach den Endpunkt-Capabilities, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen Hosts zielen, dasselbe Streaming-Nutzungsverhalten erben, statt
    ausdrücklich die integrierte Provider-ID `qwen` zu erfordern.

    Native Streaming-Nutzungskompatibilität gilt sowohl für die Coding-Plan-Hosts als auch
    für die Standard-DashScope-kompatiblen Hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Multimodale Endpunkt-Regionen">
    Multimodale Oberflächen (Video Understanding und Wan-Videogenerierung) verwenden die
    **Standard**-DashScope-Endpunkte, nicht die Coding-Plan-Endpunkte:

    - Global/Intl Standard-Basis-URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard-Basis-URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `QWEN_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Video Generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/de/providers/alibaba" icon="cloud">
    Älterer ModelStudio-Provider und Migrationshinweise.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
