---
read_when:
    - Ви хочете використовувати Volcano Engine або моделі Doubao з OpenClaw
    - Вам потрібне налаштування API key для Volcengine
summary: Налаштування Volcengine (моделі Doubao, загальні та coding endpoint-и)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T18:15:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Provider Volcengine надає доступ до моделей Doubao і сторонніх моделей,
розміщених на Volcano Engine, з окремими endpoint-ами для загальних і coding
навантажень.

- Providers: `volcengine` (загальний) + `volcengine-plan` (coding)
- Auth: `VOLCANO_ENGINE_API_KEY`
- API: сумісний з OpenAI

## Швидкий старт

1. Установіть API key:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Установіть модель за замовчуванням:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providers і endpoint-и

| Provider          | Endpoint                                  | Випадок використання |
| ----------------- | ----------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-моделі        |

Обидва providers налаштовуються з одного API key. Налаштування реєструє обидва
автоматично.

## Доступні моделі

Загальний provider (`volcengine`):

| Посилання на модель                           | Назва                           | Вхід        | Контекст |
| --------------------------------------------- | ------------------------------- | ----------- | -------- |
| `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | text, image | 256,000  |
| `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | text, image | 256,000  |
| `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | text, image | 256,000  |
| `volcengine/glm-4-7-251222`                   | GLM 4.7                         | text, image | 200,000  |
| `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | text, image | 128,000  |

Coding provider (`volcengine-plan`):

| Посилання на модель                                | Назва                    | Вхід | Контекст |
| -------------------------------------------------- | ------------------------ | ---- | -------- |
| `volcengine-plan/ark-code-latest`                  | Ark Coding Plan          | text | 256,000  |
| `volcengine-plan/doubao-seed-code`                 | Doubao Seed Code         | text | 256,000  |
| `volcengine-plan/glm-4.7`                          | GLM 4.7 Coding           | text | 200,000  |
| `volcengine-plan/kimi-k2-thinking`                 | Kimi K2 Thinking         | text | 256,000  |
| `volcengine-plan/kimi-k2.5`                        | Kimi K2.5 Coding         | text | 256,000  |
| `volcengine-plan/doubao-seed-code-preview-251028`  | Doubao Seed Code Preview | text | 256,000  |

`openclaw onboard --auth-choice volcengine-api-key` наразі встановлює
`volcengine-plan/ark-code-latest` як модель за замовчуванням, одночасно реєструючи
загальний каталог `volcengine`.

Під час вибору моделі в onboarding/configure варіант auth Volcengine віддає перевагу
рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажені,
OpenClaw повертається до нефільтрованого каталогу замість показу
порожнього вибору, обмеженого provider.

## Примітка щодо середовища

Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що
`VOLCANO_ENGINE_API_KEY` доступний для цього процесу (наприклад, у
`~/.openclaw/.env` або через `env.shellEnv`).
