---
read_when:
    - Ви хочете використовувати моделі GLM в OpenClaw
    - Вам потрібні правила найменування моделей і налаштування
summary: Огляд сімейства моделей GLM і як використовувати його в OpenClaw
title: Моделі GLM
x-i18n:
    generated_at: "2026-04-05T18:14:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Моделі GLM

GLM — це **сімейство моделей** (а не компанія), доступне через платформу Z.AI. В OpenClaw моделі GLM
доступні через провайдера `zai` та ідентифікатори моделей на кшталт `zai/glm-5`.

## Налаштування CLI

```bash
# Generic API-key setup with endpoint auto-detection
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China region), recommended for Coding Plan users
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (China region)
openclaw onboard --auth-choice zai-cn
```

## Фрагмент конфігурації

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` дає змогу OpenClaw визначити відповідну кінцеву точку Z.AI за ключем і
автоматично застосувати правильний base URL. Використовуйте явні регіональні варіанти, коли
хочете примусово вибрати певну поверхню Coding Plan або загального API.

## Поточні вбудовані моделі GLM

Наразі OpenClaw ініціалізує вбудованого провайдера `zai` такими посиланнями GLM:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Примітки

- Версії GLM і їх доступність можуть змінюватися; перевіряйте актуальні дані в документації Z.AI.
- Типове вбудоване посилання на модель — `zai/glm-5`.
- Докладніше про провайдера див. у [/providers/zai](/providers/zai).
