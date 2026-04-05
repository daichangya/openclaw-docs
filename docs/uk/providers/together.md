---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Вам потрібна змінна середовища API-ключа або параметр автентифікації CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T22:23:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68fdc15bfcac8d59e3e0c06a39162abd48d9d41a9a64a0ac622cd8e3f80a595
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) надає доступ до провідних моделей з відкритим кодом, зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.

- Провайдер: `together`
- Автентифікація: `TOGETHER_API_KEY`
- API: сумісний з OpenAI
- Базова URL-адреса: `https://api.together.xyz/v1`

## Швидкий старт

1. Установіть API-ключ (рекомендовано: зберігайте його для Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Установіть модель за замовчуванням:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Це встановить `together/moonshotai/Kimi-K2.5` як модель за замовчуванням.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOGETHER_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Вбудований каталог

Наразі OpenClaw постачається з таким вбудованим каталогом Together:

| Посилання на модель                                         | Назва                                  | Вхідні дані | Контекст   | Примітки                        |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | text, image | 262,144    | Модель за замовчуванням; увімкнено міркування |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | text        | 202,752    | Текстова модель загального призначення |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Швидка інструкційна модель      |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Мультимодальна                  |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Мультимодальна                  |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | text        | 131,072    | Загальна текстова модель        |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | text        | 131,072    | Модель міркування               |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | text        | 262,144    | Додаткова текстова модель Kimi  |

Попереднє налаштування onboarding встановлює `together/moonshotai/Kimi-K2.5` як модель за замовчуванням.

## Генерація відео

Вбудований плагін `together` також реєструє генерацію відео через
спільний інструмент `video_generate`.

- Модель відео за замовчуванням: `together/Wan-AI/Wan2.2-T2V-A14B`
- Режими: text-to-video і потоки з одним еталонним зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати Together як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні
параметри інструмента, вибір провайдера та поведінку failover.
