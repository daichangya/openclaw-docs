---
read_when:
    - Sie möchten Arcee AI mit OpenClaw verwenden.
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption.
summary: Einrichtung von Arcee AI (Authentifizierung + Modellauswahl)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T06:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) bietet Zugriff auf die Trinity-Familie von Mixture-of-Experts-Modellen über eine OpenAI-kompatible API. Alle Trinity-Modelle sind unter Apache 2.0 lizenziert.

Auf Modelle von Arcee AI kann direkt über die Arcee-Plattform oder über [OpenRouter](/de/providers/openrouter) zugegriffen werden.

| Eigenschaft | Wert                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Provider    | `arcee`                                                                               |
| Auth        | `ARCEEAI_API_KEY` (direkt) oder `OPENROUTER_API_KEY` (über OpenRouter)                |
| API         | OpenAI-kompatibel                                                                     |
| Base URL    | `https://api.arcee.ai/api/v1` (direkt) oder `https://openrouter.ai/api/v1` (OpenRouter) |

## Erste Schritte

<Tabs>
  <Tab title="Direkt (Arcee-Plattform)">
    <Steps>
      <Step title="API-Key abrufen">
        Erstellen Sie einen API-Key bei [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Über OpenRouter">
    <Steps>
      <Step title="API-Key abrufen">
        Erstellen Sie einen API-Key bei [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Ein Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Dieselben Modellreferenzen funktionieren sowohl für direkte Setups als auch über OpenRouter (zum Beispiel `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Nicht interaktives Setup

<Tabs>
  <Tab title="Direkt (Arcee-Plattform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Über OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Eingebauter Katalog

OpenClaw wird derzeit mit diesem gebündelten Arcee-Katalog ausgeliefert:

| Modellreferenz                 | Name                   | Eingabe | Kontext | Kosten (In/Out pro 1M) | Hinweise                                    |
| ----------------------------- | ---------------------- | ------- | ------- | ---------------------- | ------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | Text    | 256K    | $0.25 / $0.90          | Standardmodell; Reasoning aktiviert         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | Text    | 128K    | $0.25 / $1.00          | Allgemeiner Zweck; 400B Parameter, 13B aktiv |
| `arcee/trinity-mini`           | Trinity Mini 26B       | Text    | 128K    | $0.045 / $0.15         | Schnell und kosteneffizient; Function Calling |

<Tip>
Das Onboarding-Preset setzt `arcee/trinity-large-thinking` als Standardmodell.
</Tip>

## Unterstützte Funktionen

| Funktion                                      | Unterstützt                   |
| --------------------------------------------- | ----------------------------- |
| Streaming                                     | Ja                            |
| Tool-Nutzung / Function Calling               | Ja                            |
| Strukturierte Ausgabe (JSON-Modus und JSON-Schema) | Ja                       |
| Erweitertes Thinking                          | Ja (Trinity Large Thinking)   |

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `ARCEEAI_API_KEY`
    (oder `OPENROUTER_API_KEY`) diesem Prozess zur Verfügung steht (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-Routing">
    Wenn Sie Arcee-Modelle über OpenRouter verwenden, gelten dieselben Modellreferenzen `arcee/*`.
    OpenClaw übernimmt das Routing transparent basierend auf Ihrer Authentifizierungswahl. Siehe die
    [OpenRouter-Provider-Dokumentation](/de/providers/openrouter) für OpenRouter-spezifische
    Konfigurationsdetails.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/de/providers/openrouter" icon="shuffle">
    Zugriff auf Arcee-Modelle und viele andere über einen einzigen API-Key.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
