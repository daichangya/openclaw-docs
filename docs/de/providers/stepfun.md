---
read_when:
    - Sie möchten StepFun-Modelle in OpenClaw verwenden
    - Sie benötigen eine Anleitung zur Einrichtung von StepFun
summary: StepFun-Modelle mit OpenClaw verwenden
title: StepFun
x-i18n:
    generated_at: "2026-04-12T23:33:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a463bed0951d33802dcdb3a7784406272ee206b731e9864ea020323e67b4d159
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw enthält ein gebündeltes StepFun-Provider-Plugin mit zwei Provider-IDs:

- `stepfun` für den Standard-Endpunkt
- `stepfun-plan` für den Step-Plan-Endpunkt

<Warning>
Standard und Step Plan sind **getrennte Provider** mit unterschiedlichen Endpunkten und Modell-Ref-Präfixen (`stepfun/...` vs. `stepfun-plan/...`). Verwenden Sie für die `.com`-Endpunkte einen China-Schlüssel und für die `.ai`-Endpunkte einen globalen Schlüssel.
</Warning>

## Überblick über Regionen und Endpunkte

| Endpunkt | China (`.com`)                         | Global (`.ai`)                        |
| -------- | -------------------------------------- | ------------------------------------- |
| Standard | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Auth-Umgebungsvariable: `STEPFUN_API_KEY`

## Integrierte Kataloge

Standard (`stepfun`):

| Modell-Ref               | Kontext | Max. Ausgabe | Hinweise               |
| ------------------------ | ------- | ------------ | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Standard-Standardmodell |

Step Plan (`stepfun-plan`):

| Modell-Ref                         | Kontext | Max. Ausgabe | Hinweise                  |
| ---------------------------------- | ------- | ------------ | ------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Standard-Step-Plan-Modell |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Zusätzliches Step-Plan-Modell |

## Erste Schritte

Wählen Sie Ihre Provider-Oberfläche und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Standard">
    **Am besten für:** allgemeine Nutzung über den Standard-Endpunkt von StepFun.

    <Steps>
      <Step title="Region des Endpunkts auswählen">
        | Auth-Auswahl                     | Endpunkt                        | Region        |
        | -------------------------------- | ------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | International |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Oder für den China-Endpunkt:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Nicht interaktive Alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle prüfen">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Modell-Refs

    - Standardmodell: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Am besten für:** den Reasoning-Endpunkt von Step Plan.

    <Steps>
      <Step title="Region des Endpunkts auswählen">
        | Auth-Auswahl                 | Endpunkt                               | Region        |
        | ---------------------------- | -------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | International |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | China         |
      </Step>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Oder für den China-Endpunkt:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Nicht interaktive Alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verfügbarkeit der Modelle prüfen">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Modell-Refs

    - Standardmodell: `stepfun-plan/step-3.5-flash`
    - Alternatives Modell: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Erweitert

<AccordionGroup>
  <Accordion title="Vollständige Konfiguration: Standard-Provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Vollständige Konfiguration: Step-Plan-Provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Hinweise">
    - Der Provider ist in OpenClaw gebündelt, daher ist kein separater Schritt zur Plugin-Installation erforderlich.
    - `step-3.5-flash-2603` ist derzeit nur unter `stepfun-plan` verfügbar.
    - Ein einzelner Auth-Flow schreibt regionsbezogen passende Profile für sowohl `stepfun` als auch `stepfun-plan`, sodass beide Oberflächen gemeinsam erkannt werden können.
    - Verwenden Sie `openclaw models list` und `openclaw models set <provider/model>`, um Modelle zu prüfen oder zu wechseln.
  </Accordion>
</AccordionGroup>

<Note>
Einen umfassenderen Überblick über Provider finden Sie unter [Modellanbieter](/de/concepts/model-providers).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellanbieter" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und das Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema für Provider, Modelle und Plugins.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Verwaltung von API-Schlüsseln und Dokumentation für StepFun.
  </Card>
</CardGroup>
