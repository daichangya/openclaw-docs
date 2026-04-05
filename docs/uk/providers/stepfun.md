---
read_when:
    - Ви хочете моделі StepFun в OpenClaw
    - Вам потрібні вказівки з налаштування StepFun
summary: Використання моделей StepFun з OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-05T18:15:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw містить вбудований plugin provider StepFun із двома ID provider:

- `stepfun` для стандартної кінцевої точки
- `stepfun-plan` для кінцевої точки Step Plan

Наразі вбудовані каталоги відрізняються за поверхнею:

- Standard: `step-3.5-flash`
- Step Plan: `step-3.5-flash`, `step-3.5-flash-2603`

## Огляд регіонів і кінцевих точок

- Стандартна кінцева точка China: `https://api.stepfun.com/v1`
- Стандартна кінцева точка Global: `https://api.stepfun.ai/v1`
- Кінцева точка China Step Plan: `https://api.stepfun.com/step_plan/v1`
- Кінцева точка Global Step Plan: `https://api.stepfun.ai/step_plan/v1`
- Змінна середовища auth: `STEPFUN_API_KEY`

Використовуйте ключ China з кінцевими точками `.com`, а global-ключ — з
кінцевими точками `.ai`.

## Налаштування CLI

Інтерактивне налаштування:

```bash
openclaw onboard
```

Виберіть один із цих варіантів auth:

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

Неінтерактивні приклади:

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## Посилання на моделі

- Стандартна модель за замовчуванням: `stepfun/step-3.5-flash`
- Модель Step Plan за замовчуванням: `stepfun-plan/step-3.5-flash`
- Альтернативна модель Step Plan: `stepfun-plan/step-3.5-flash-2603`

## Вбудовані каталоги

Standard (`stepfun`):

| Посилання на модель      | Контекст | Макс. вивід | Примітки                    |
| ------------------------ | -------- | ----------- | --------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536      | Стандартна модель за замовчуванням |

Step Plan (`stepfun-plan`):

| Посилання на модель                | Контекст | Макс. вивід | Примітки                      |
| ---------------------------------- | -------- | ----------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536      | Модель Step Plan за замовчуванням |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536      | Додаткова модель Step Plan    |

## Фрагменти конфігурації

Стандартний provider:

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

Provider Step Plan:

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

## Примітки

- Provider вбудований в OpenClaw, тому окремий крок встановлення plugin не потрібен.
- `step-3.5-flash-2603` наразі доступна лише в `stepfun-plan`.
- Один потік auth записує профілі для обох `stepfun` і `stepfun-plan`, що відповідають регіону, тому обидві поверхні можна виявити разом.
- Використовуйте `openclaw models list` і `openclaw models set <provider/model>`, щоб переглядати або перемикати моделі.
- Загальний огляд provider див. у [Model providers](/uk/concepts/model-providers).
