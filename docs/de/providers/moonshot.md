---
read_when:
    - Sie möchten die Einrichtung von Moonshot K2 (Moonshot Open Platform) im Vergleich zu Kimi Coding
    - Sie müssen separate Endpunkte, Schlüssel und Model-Refs verstehen
    - Sie möchten eine Copy-paste-Konfiguration für einen der beiden Provider
summary: Moonshot K2 vs. Kimi Coding konfigurieren (separate Provider + Schlüssel)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T14:06:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot bietet die Kimi-API mit OpenAI-kompatiblen Endpunkten an. Konfigurieren Sie den
Provider und setzen Sie das Standardmodell auf `moonshot/kimi-k2.6`, oder verwenden Sie
Kimi Coding mit `kimi/kimi-code`.

<Warning>
Moonshot und Kimi Coding sind **separate Provider**. Schlüssel sind nicht austauschbar, Endpunkte unterscheiden sich und auch die Model-Refs unterscheiden sich (`moonshot/...` vs. `kimi/...`).
</Warning>

## Integrierter Modellkatalog

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Gebündelte Kostenschätzungen für aktuelle von Moonshot gehostete K2-Modelle verwenden die
veröffentlichten Pay-as-you-go-Preise von Moonshot: Kimi K2.6 kostet 0,16 $/MTok Cache-Treffer,
0,95 $/MTok Eingabe und 4,00 $/MTok Ausgabe; Kimi K2.5 kostet 0,10 $/MTok Cache-Treffer,
0,60 $/MTok Eingabe und 3,00 $/MTok Ausgabe. Andere ältere Katalogeinträge behalten
Kostenplatzhalter mit Nullwerten, sofern Sie sie nicht in der Konfiguration überschreiben.

## Erste Schritte

Wählen Sie Ihren Provider und befolgen Sie die Einrichtungsschritte.

<Tabs>
  <Tab title="Moonshot API">
    **Am besten geeignet für:** Kimi-K2-Modelle über die Moonshot Open Platform.

    <Steps>
      <Step title="Ihre Endpunktregion auswählen">
        | Auth choice            | Endpoint                       | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
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
              model: { primary: "moonshot/kimi-k2.6" },
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
      <Step title="Einen Live-Smoke-Test ausführen">
        Verwenden Sie ein isoliertes Statusverzeichnis, wenn Sie Modellzugriff und Kostenverfolgung
        prüfen möchten, ohne Ihre normalen Sitzungen zu berühren:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Die JSON-Antwort sollte `provider: "moonshot"` und
        `model: "kimi-k2.6"` melden. Der Assistenten-Transkripteintrag speichert normalisierte
        Tokennutzung plus geschätzte Kosten unter `usage.cost`, wenn Moonshot Nutzungsmetadaten zurückgibt.
      </Step>
    </Steps>

    ### Konfigurationsbeispiel

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
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
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
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
    Kimi Coding verwendet einen anderen API-Schlüssel und ein anderes Provider-Präfix (`kimi/...`) als Moonshot (`moonshot/...`). Die ältere Model-Ref `kimi/k2p5` wird weiterhin als Kompatibilitäts-ID akzeptiert.
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

OpenClaw liefert außerdem **Kimi** als `web_search`-Provider aus, unterstützt durch die Moonshot-Websuche.

<Steps>
  <Step title="Interaktive Einrichtung der Websuche ausführen">
    ```bash
    openclaw configure --section web
    ```

    Wählen Sie im Abschnitt zur Websuche **Kimi**, um
    `plugins.entries.moonshot.config.webSearch.*` zu speichern.

  </Step>
  <Step title="Region und Modell der Websuche konfigurieren">
    Die interaktive Einrichtung fragt nach Folgendem:

    | Setting             | Options                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API region          | `https://api.moonshot.ai/v1` (international) oder `https://api.moonshot.cn/v1` (China) |
    | Web search model    | Standard ist `kimi-k2.6`                                             |

  </Step>
</Steps>

Die Konfiguration liegt unter `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // oder KIMI_API_KEY / MOONSHOT_API_KEY verwenden
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
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

    Konfigurieren Sie dies pro Modell über `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw ordnet für Moonshot außerdem Laufzeitstufen von `/think` zu:

    | `/think` level       | Moonshot behavior          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Jeder andere Nicht-off-Wert | `thinking.type=enabled`    |

    <Warning>
    Wenn Moonshot-Thinking aktiviert ist, muss `tool_choice` `auto` oder `none` sein. OpenClaw normalisiert inkompatible `tool_choice`-Werte zur Kompatibilität auf `auto`.
    </Warning>

    Kimi K2.6 akzeptiert außerdem ein optionales Feld `thinking.keep`, das die
    turnübergreifende Aufbewahrung von `reasoning_content` steuert. Setzen Sie es auf `"all"`, um vollständiges
    Reasoning über mehrere Züge hinweg zu behalten; lassen Sie es weg (oder setzen Sie es auf `null`), um die
    Standardstrategie des Servers zu verwenden. OpenClaw leitet `thinking.keep` nur für
    `moonshot/kimi-k2.6` weiter und entfernt es bei anderen Modellen.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Bereinigung von Tool-Call-IDs">
    Moonshot Kimi liefert `tool_call`-IDs in der Form `functions.<name>:<index>`. OpenClaw lässt sie unverändert, damit turnübergreifende Tool-Calls weiter funktionieren.

    Um bei einem benutzerdefinierten OpenAI-kompatiblen Provider eine strikte Bereinigung zu erzwingen, setzen Sie `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Kompatibilität mit Streaming-Nutzung">
    Native Moonshot-Endpunkte (`https://api.moonshot.ai/v1` und
    `https://api.moonshot.cn/v1`) melden Kompatibilität mit Streaming-Nutzung auf dem
    gemeinsamen Transport `openai-completions`. OpenClaw leitet dies aus den Endpunktfähigkeiten ab, sodass
    kompatible benutzerdefinierte Provider-IDs, die dieselben nativen
    Moonshot-Hosts ansprechen, dasselbe Verhalten bei Streaming-Nutzung erben.

    Mit den gebündelten K2.6-Preisen wird gestreamte Nutzung, die Eingabe-, Ausgabe-
    und Cache-Read-Tokens enthält, außerdem in lokal geschätzte USD-Kosten für
    `/status`, `/usage full`, `/usage cost` und transkriptgestützte Sitzungs-
    Abrechnung umgerechnet.

  </Accordion>

  <Accordion title="Referenz für Endpunkte und Model-Refs">
    | Provider    | Model-Ref-Präfix | Endpunkt                      | Auth-Umgebungsvariable |
    | ----------- | ---------------- | ----------------------------- | ---------------------- |
    | Moonshot    | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`     |
    | Moonshot CN | `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`     |
    | Kimi Coding | `kimi/`          | Kimi-Coding-Endpunkt          | `KIMI_API_KEY`         |
    | Websuche    | N/A              | Wie die Moonshot-API-Region   | `KIMI_API_KEY` oder `MOONSHOT_API_KEY` |

    - Die Kimi-Websuche verwendet `KIMI_API_KEY` oder `MOONSHOT_API_KEY` und verwendet standardmäßig `https://api.moonshot.ai/v1` mit dem Modell `kimi-k2.6`.
    - Überschreiben Sie bei Bedarf Preis- und Kontextmetadaten in `models.providers`.
    - Wenn Moonshot für ein Modell andere Kontextlimits veröffentlicht, passen Sie `contextWindow` entsprechend an.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Model-Refs und Failover-Verhalten.
  </Card>
  <Card title="Websuche" href="/de/tools/web" icon="magnifying-glass">
    Konfiguration von Websuch-Providern einschließlich Kimi.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Verwaltung von Moonshot-API-Schlüsseln und Dokumentation.
  </Card>
</CardGroup>
