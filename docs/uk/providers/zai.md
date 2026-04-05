---
read_when:
    - Ви хочете використовувати моделі Z.AI / GLM в OpenClaw
    - Вам потрібне просте налаштування `ZAI_API_KEY`
summary: Використання Z.AI (моделі GLM) з OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T18:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI — це API-платформа для моделей **GLM**. Вона надає REST API для GLM і використовує API-ключі
для автентифікації. Створіть свій API-ключ у консолі Z.AI. OpenClaw використовує провайдера `zai`
з API-ключем Z.AI.

## Налаштування CLI

```bash
# Загальне налаштування API-ключа з автовизначенням endpoint
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, рекомендовано для користувачів Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (регіон China), рекомендовано для користувачів Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# General API
openclaw onboard --auth-choice zai-global

# General API CN (регіон China)
openclaw onboard --auth-choice zai-cn
```

## Фрагмент конфігурації

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` дає OpenClaw змогу визначити відповідний endpoint Z.AI за ключем і
автоматично застосувати правильний base URL. Використовуйте явні регіональні варіанти,
коли хочете примусово задати певну поверхню Coding Plan або general API.

## Вбудований каталог GLM

Наразі OpenClaw ініціалізує вбудованого провайдера `zai` такими моделями:

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

- Моделі GLM доступні як `zai/<model>` (приклад: `zai/glm-5`).
- Типове посилання на вбудовану модель: `zai/glm-5`
- Невідомі id `glm-5*` усе ще проходять пряме визначення через шлях вбудованого провайдера
  шляхом синтезу метаданих провайдера-власника з шаблону `glm-4.7`, коли id
  відповідає поточній формі сімейства GLM-5.
- `tool_stream` типово ввімкнено для потокової передачі викликів інструментів Z.AI. Установіть
  `agents.defaults.models["zai/<model>"].params.tool_stream` у `false`, щоб вимкнути це.
- Огляд сімейства моделей див. у [/providers/glm](/providers/glm).
- Z.AI використовує Bearer-автентифікацію з вашим API-ключем.
