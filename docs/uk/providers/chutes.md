---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен шлях налаштування OAuth або API key
    - Ви хочете дізнатися про типову модель, псевдоніми або поведінку виявлення
summary: Налаштування Chutes (OAuth або API key, виявлення моделей, псевдоніми)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T18:13:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) надає каталоги open-source моделей через
OpenAI-compatible API. OpenClaw підтримує як OAuth через браузер, так і пряму автентифікацію за API key для вбудованого провайдера `chutes`.

- Провайдер: `chutes`
- API: OpenAI-compatible
- Base URL: `https://llm.chutes.ai/v1`
- Автентифікація:
  - OAuth через `openclaw onboard --auth-choice chutes`
  - API key через `openclaw onboard --auth-choice chutes-api-key`
  - Runtime-змінні середовища: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Швидкий старт

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw запускає потік браузера локально або показує URL + потік вставлення redirect
на віддалених/безголових хостах. OAuth-токени автоматично оновлюються через профілі автентифікації OpenClaw.

Необов’язкові перевизначення OAuth:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API key

```bash
openclaw onboard --auth-choice chutes-api-key
```

Отримайте свій ключ на
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Обидва шляхи автентифікації реєструють вбудований каталог Chutes і встановлюють типову модель
`chutes/zai-org/GLM-4.7-TEE`.

## Поведінка виявлення

Коли автентифікація Chutes доступна, OpenClaw запитує каталог Chutes з цими
обліковими даними і використовує виявлені моделі. Якщо виявлення не вдається, OpenClaw переходить до вбудованого статичного каталогу, щоб onboarding і запуск усе одно працювали.

## Типові псевдоніми

OpenClaw також реєструє три зручні псевдоніми для вбудованого каталогу Chutes:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Вбудований стартовий каталог

Вбудований резервний каталог містить поточні посилання Chutes, зокрема:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Приклад конфігурації

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Примітки

- Довідка щодо OAuth і вимоги до redirect-застосунку: [документація Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
- Виявлення і для API key, і для OAuth використовує той самий ідентифікатор провайдера `chutes`.
- Моделі Chutes реєструються як `chutes/<model-id>`.
