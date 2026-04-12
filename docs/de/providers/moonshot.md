---
read_when:
    - Sie möchten Moonshot K2 (Moonshot Open Platform) im Vergleich zu Kimi Coding einrichten.
    - Sie müssen separate Endpunkte, Schlüssel und Modell-Refs verstehen.
    - Sie möchten eine Konfiguration zum Kopieren/Einfügen für beide Provider.
summary: Moonshot K2 vs. Kimi Coding konfigurieren (separate Provider + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-12T23:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f261f83a9b37e4fffb0cd0803e0c64f27eae8bae91b91d8a781a030663076f8
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot stellt die Kimi-API mit OpenAI-kompatiblen Endpunkten bereit. Konfigurieren Sie den
Provider und setzen Sie das Standardmodell auf `moonshot/kimi-k2.5`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-code`.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich und Modell-Refs unterscheiden sich ebenfalls (`moonshot/...` vs. `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Modell-Ref                       | Name                   | Reasoning | Eingabe     | Kontext | Maximale Ausgabe |
| -------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------------- |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | Nein      | text, image | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | Ja        | text        | 262,144 | 262,144          |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Ja        | text        | 262,144 | 262,144          |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | Nein      | text        | 256,000 | 16,384           |

[//]: # "moonshot-kimi-k2-ids:end"

## Erste Schritte

Wählen Sie Ihren Provider und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Ihre Endpunkt-Region auswählen">
        | Auth-Auswahl           | Endpunkt                       | Region         |
        | ---------------------- | ------------------------------ | -------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International  |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China          |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Oder für den China-Endpunkt:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.5" },
            },
          },
        }
        ```
      </Step>
      <Step title="Prüfen, ob Modelle verfügbar sind">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.5" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Am besten geeignet für:** codefokussierte Aufgaben über den Kimi-Coding-Endpunkt.

    <Note>
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die ältere Modell-Ref `kimi/k2p5` bleibt als Kompatibilitäts-ID weiterhin akzeptiert.
    </Note>

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Prüfen, ob das Modell verfügbar ist">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi-Websuche

OpenClaw enthält außerdem **Kimi** als `web_search`-Provider, unterstützt durch die Moonshot-Websuche.

<Steps>
  <Step title="Interaktive Einrichtung der Websuche ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Abschnitt zur Websuche **Kimi**, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Region und Modell für die Websuche konfigurieren">
    Bei der interaktiven Einrichtung werden Sie nach Folgendem gefragt:

    | Einstellung         | Optionen                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | API-Region          | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Websuchmodell       | Standardmäßig `kimi-k2.5`                                            |

  </Step>
</Steps>

Die Konfiguration befindet sich unter `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oder KIMI_API_KEY / MOONSHOT_API_KEY verwenden
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Erweitert

<AccordionGroup>
  <Accordion title="Nativer Thinking-Modus">
    Moonshot Kimi unterstützt binäres natives Thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Konfigurieren Sie es pro Modell über `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.5": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw bildet auch Laufzeit-`/think`-Stufen für Moonshot ab:

    | Stufe von `/think`   | Moonshot-Verhalten         |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Jede Stufe außer `off` | `thinking.type=enabled`  |

    <Warning>
    Wenn Moonshot-Thinking aktiviert ist, muss `tool_choice` auf `auto` oder `none` gesetzt sein. OpenClaw normalisiert nicht kompatible `tool_choice`-Werte aus Kompatibilitätsgründen auf `auto`.
    </Warning>

  </Accordion>

  <Accordion title="Streaming-Nutzungskompatibilität">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) deklarieren Streaming-Nutzungskompatibilität auf dem
    gemeinsamen Transport `openai-completions`. OpenClaw leitet dies aus den Endpunkt-
    Fähigkeiten ab, daher übernehmen kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen
    Moonshot-Hosts zielen, dasselbe Verhalten für Streaming-Nutzung.
  </Accordion>

  <Accordion title="Referenz für Endpunkte und Modell-Refs">
    | Provider     | Präfix für Modell-Refs | Endpunkt                      | Auth-Umgebungsvariable |
    | ------------ | ---------------------- | ----------------------------- | ---------------------- |
    | Moonshot     | `moonshot/`            | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`     |
    | Moonshot CN  | `moonshot/`            | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`     |
    | Kimi Coding  | `kimi/`                | Kimi-Coding-Endpunkt          | `KIMI_API_KEY`         |
    | Websuche     | N/A                    | Wie die Moonshot-API-Region   | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und nutzt standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.5`.
    - Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.
    - Wenn Moonshot für ein Modell andere Kontextlimits veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Websuche" href="/tools/web-search" icon="magnifying-glass">
    Konfigurieren von Websuch-Providern einschließlich Kimi.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Verwaltung von Moonshot-API-Schlüsseln und Dokumentation.
  </Card>
</CardGroup>
