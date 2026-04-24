---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über den gebündelten Provider `qwen` von OpenClaw verwenden
title: Qwen
x-i18n:
    generated_at: "2026-04-24T06:55:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth wurde entfernt.** Die Free-Tier-OAuth-Integration
(`qwen-portal`), die Endpunkte von `portal.qwen.ai` verwendete, ist nicht mehr verfügbar.
Hintergrund finden Sie unter [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpunkte von Qwen Cloud / Alibaba DashScope und Coding Plan
und hält veraltete `modelstudio`-IDs als Kompatibilitätsalias funktionsfähig.

- Provider: `qwen`
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Ebenfalls aus Kompatibilitätsgründen akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

<Tip>
Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpunkt **Standard (pay-as-you-go)**.
Die Unterstützung im Coding Plan kann hinter dem öffentlichen Katalog zurückliegen.
</Tip>

## Erste Schritte

Wählen Sie Ihren Plantyp und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Coding Plan (Subscription)">
    **Am besten für:** abonnementsbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel oder kopieren Sie einen vorhandenen von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den Endpunkt **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den Endpunkt **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Ein Standardmodell setzen">
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
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Veraltete Auth-Choice-IDs vom Typ `modelstudio-*` und Modellreferenzen `modelstudio/...` funktionieren
    weiterhin als Kompatibilitätsalias, aber neue Setup-Abläufe sollten die kanonischen
    Auth-Choice-IDs `qwen-*` und Modellreferenzen `qwen/...` bevorzugen.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Am besten für:** Pay-as-you-go-Zugriff über den Standard-Model-Studio-Endpunkt, einschließlich Modellen wie `qwen3.6-plus`, die im Coding Plan möglicherweise nicht verfügbar sind.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen API-Schlüssel oder kopieren Sie einen vorhandenen von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den Endpunkt **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den Endpunkt **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Ein Standardmodell setzen">
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
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Veraltete Auth-Choice-IDs vom Typ `modelstudio-*` und Modellreferenzen `modelstudio/...` funktionieren
    weiterhin als Kompatibilitätsalias, aber neue Setup-Abläufe sollten die kanonischen
    Auth-Choice-IDs `qwen-*` und Modellreferenzen `qwen/...` bevorzugen.
    </Note>

  </Tab>
</Tabs>

## Plantypen und Endpunkte

| Plan                       | Region | Auth-Choice                 | Endpunkt                                         |
| -------------------------- | ------ | --------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (Subscription) | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (Subscription) | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`          |

Der Provider wählt den Endpunkt automatisch basierend auf Ihrer Auth-Choice aus. Kanonische
Auswahlen verwenden die Familie `qwen-*`; `modelstudio-*` bleibt nur für Kompatibilität bestehen.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Qwen-Katalog aus. Der konfigurierte Katalog ist
endpunktbewusst: Konfigurationen für Coding Plan lassen Modelle aus, die nur auf dem
Standard-Endpunkt bekanntlich funktionieren.

| Modellreferenz             | Eingabe     | Kontext   | Hinweise                                            |
| -------------------------- | ----------- | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`        | Text, Bild  | 1.000.000 | Standardmodell                                      |
| `qwen/qwen3.6-plus`        | Text, Bild  | 1.000.000 | Standard-Endpunkte bevorzugen, wenn Sie dieses Modell benötigen |
| `qwen/qwen3-max-2026-01-23` | Text       | 262.144   | Qwen-Max-Linie                                      |
| `qwen/qwen3-coder-next`    | Text        | 262.144   | Coding                                              |
| `qwen/qwen3-coder-plus`    | Text        | 1.000.000 | Coding                                              |
| `qwen/MiniMax-M2.5`        | Text        | 1.000.000 | Reasoning aktiviert                                 |
| `qwen/glm-5`               | Text        | 202.752   | GLM                                                 |
| `qwen/glm-4.7`             | Text        | 202.752   | GLM                                                 |
| `qwen/kimi-k2.5`           | Text, Bild  | 262.144   | Moonshot AI über Alibaba                            |

<Note>
Die Verfügbarkeit kann je nach Endpunkt und Abrechnungsplan weiterhin variieren, selbst wenn ein Modell
im gebündelten Katalog vorhanden ist.
</Note>

## Multimodale Erweiterungen

Das Plugin `qwen` stellt außerdem multimodale Fähigkeiten auf den **Standard**-
DashScope-Endpunkten bereit (nicht auf den Endpunkten des Coding Plan):

- **Video Understanding** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

So verwenden Sie Qwen als Standard-Provider für Video:

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
Siehe [Video Generation](/de/tools/video-generation) für gemeinsame Tool-Parameter, Providerauswahl und Failover-Verhalten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Bild- und Videoverständnis">
    Das gebündelte Plugin Qwen registriert Media Understanding für Bilder und Videos
    auf den **Standard**-DashScope-Endpunkten (nicht auf den Endpunkten des Coding Plan).

    | Eigenschaft      | Wert                  |
    | ---------------- | --------------------- |
    | Modell           | `qwen-vl-max-latest`  |
    | Unterstützte Eingabe | Bilder, Video      |

    Media Understanding wird automatisch aus der konfigurierten Qwen-Authentifizierung aufgelöst — keine
    zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie einen Standard-Endpunkt (pay-as-you-go)
    für Unterstützung von Media Understanding verwenden.

  </Accordion>

  <Accordion title="Verfügbarkeit von Qwen 3.6 Plus">
    `qwen3.6-plus` ist auf den Standard-Endpunkten (pay-as-you-go) von Model Studio
    verfügbar:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Wenn die Endpunkte des Coding Plan für
    `qwen3.6-plus` einen Fehler „unsupported model“ zurückgeben, wechseln Sie zu Standard (pay-as-you-go) statt zum Endpunkt-/Schlüsselpaar des Coding Plan.

  </Accordion>

  <Accordion title="Plan für Fähigkeiten">
    Das Plugin `qwen` wird als Anbieter-Heimat für die vollständige Oberfläche von Qwen
    Cloud positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chat-Modelle:** jetzt gebündelt
    - **Tool Calling, strukturierte Ausgabe, Thinking:** vom OpenAI-kompatiblen Transport geerbt
    - **Bildgenerierung:** geplant auf der Ebene des Provider-Plugins
    - **Bild-/Videoverständnis:** jetzt gebündelt auf dem Standard-Endpunkt
    - **Sprache/Audio:** geplant auf der Ebene des Provider-Plugins
    - **Memory Embeddings/Reranking:** geplant über die Oberfläche des Embedding-Adapters
    - **Videogenerierung:** jetzt gebündelt über die gemeinsame Fähigkeit zur Videogenerierung

  </Accordion>

  <Accordion title="Details zur Videogenerierung">
    Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
    DashScope-AIGC-Host zu, bevor der Job übermittelt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die auf einen der
    Hosts von Coding Plan oder Standard Qwen zeigt, die Videogenerierung weiterhin auf dem korrekten
    regionalen DashScope-Video-Endpunkt hält.

    Aktuelle gebündelte Limits für Qwen-Videogenerierung:

    - Bis zu **1** Ausgabevideo pro Anfrage
    - Bis zu **1** Eingabebild
    - Bis zu **4** Eingabevideos
    - Bis zu **10 Sekunden** Dauer
    - Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
    - Der Referenzmodus für Bild/Video erfordert derzeit **Remote-http(s)-URLs**. Lokale
      Dateipfade werden vorab abgelehnt, weil der DashScope-Video-Endpunkt keine hochgeladenen
      lokalen Buffer für diese Referenzen akzeptiert.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Model-Studio-Endpunkte kündigen Kompatibilität der Streaming-Nutzung auf dem
    gemeinsamen Transport `openai-completions` an. OpenClaw macht dies jetzt von den Fähigkeiten des Endpunkts abhängig, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen Hosts zielen, dasselbe Verhalten bei der Streaming-Nutzung erben, statt speziell die integrierte Provider-ID `qwen` zu erfordern.

    Kompatibilität der nativen Streaming-Nutzung gilt sowohl für die Hosts des Coding Plan als auch
    für die Standard-DashScope-kompatiblen Hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regionen für multimodale Endpunkte">
    Multimodale Oberflächen (Video Understanding und Wan-Videogenerierung) verwenden die
    **Standard**-DashScope-Endpunkte, nicht die Endpunkte des Coding Plan:

    - Global/Intl Standard base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China Standard base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Umgebung und Daemon-Setup">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `QWEN_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Providerauswahl.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/de/providers/alibaba" icon="cloud">
    Veralteter ModelStudio-Provider und Hinweise zur Migration.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
