---
read_when:
    - Sie möchten StepFun-Modelle in OpenClaw verwenden
    - Sie benötigen eine Einrichtungsanleitung für StepFun
summary: StepFun-Modelle mit OpenClaw verwenden
title: StepFun
x-i18n:
    generated_at: "2026-04-05T12:54:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw enthält ein gebündeltes StepFun-Provider-Plugin mit zwei Provider-IDs:

- `stepfun` für den Standardendpunkt
- `stepfun-plan` für den Step-Plan-Endpunkt

Die integrierten Kataloge unterscheiden sich derzeit nach Oberfläche:

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Übersicht über Region und Endpunkte

- Standardendpunkt China: `https://api.stepfun.com/v1`
- Globaler Standardendpunkt: `https://api.stepfun.ai/v1`
- Step-Plan-Endpunkt China: `https://api.stepfun.com/step_plan/v1`
- Globaler Step-Plan-Endpunkt: `https://api.stepfun.ai/step_plan/v1`
- env var für Authentifizierung: `STEPFUN_API_KEY`

Verwenden Sie einen China-Schlüssel mit den Endpunkten `.com` und einen globalen Schlüssel mit den
Endpunkten `.ai`.

## CLI-Einrichtung

Interaktive Einrichtung:

```bash
openclaw onboard
```

Wählen Sie eine dieser Authentifizierungsoptionen:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Nicht interaktive Beispiele:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Modellreferenzen

- Standard-Standardmodell: `stepfun/step-3.5-flash`
- Step-Plan-Standardmodell: `stepfun-plan/step-3.5-flash`
- Alternatives Step-Plan-Modell: `stepfun-plan/step-3.5-flash-2603`

## Integrierte Kataloge

Standard (`stepfun`):

| Modellreferenz           | Kontext | Max. Ausgabe | Hinweise               |
| ------------------------ | ------- | ------------ | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | Standardmäßiges Modell |

Step Plan (`stepfun-plan`):

| Modellreferenz                     | Kontext | Max. Ausgabe | Hinweise                    |
| ---------------------------------- | ------- | ------------ | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | Standardmäßiges Step-Plan-Modell |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | Zusätzliches Step-Plan-Modell |

## Konfigurations-Snippets

Standard-Provider:

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

Step-Plan-Provider:

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

## Hinweise

- Der Provider ist mit OpenClaw gebündelt, daher ist kein separater Plugin-Installationsschritt erforderlich.
- `step-3.5-flash-2603` wird derzeit nur unter `stepfun-plan` bereitgestellt.
- Ein einzelner Authentifizierungsablauf schreibt regionspassende Profile für `stepfun` und `stepfun-plan`, sodass beide Oberflächen gemeinsam erkannt werden können.
- Verwenden Sie `openclaw models list` und `openclaw models set <provider/model>`, um Modelle anzuzeigen oder zu wechseln.
- Einen umfassenderen Überblick über Provider finden Sie unter [Modell-Provider](/de/concepts/model-providers).
