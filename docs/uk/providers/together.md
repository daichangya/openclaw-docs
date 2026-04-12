---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Вам потрібна змінна середовища ключа API або варіант автентифікації CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T10:26:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) надає доступ до провідних моделей з відкритим кодом, зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.

| Властивість | Значення                     |
| ----------- | ---------------------------- |
| Провайдер   | `together`                   |
| Автентифікація | `TOGETHER_API_KEY`        |
| API         | Сумісний з OpenAI            |
| Базовий URL | `https://api.together.xyz/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на сторінці
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Встановіть модель за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Попереднє налаштування онбордингу встановлює `together/moonshotai/Kimi-K2.5` як модель за замовчуванням.
</Note>

## Вбудований каталог

OpenClaw постачається з цим вбудованим каталогом Together:

| Посилання на модель                                          | Назва                                  | Вхідні дані | Контекст   | Примітки                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | текст, зображення | 262,144    | Модель за замовчуванням; reasoning увімкнено |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | текст       | 202,752    | Універсальна текстова модель     |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | текст       | 131,072    | Швидка інструктивна модель       |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | текст, зображення | 10,000,000 | Мультимодальна                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | текст, зображення | 20,000,000 | Мультимодальна                   |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | текст       | 131,072    | Універсальна текстова модель     |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | текст       | 131,072    | Модель для reasoning             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | текст       | 262,144    | Додаткова текстова модель Kimi   |

## Генерація відео

Вбудований Plugin `together` також реєструє генерацію відео через спільний інструмент `video_generate`.

| Властивість          | Значення                            |
| -------------------- | ----------------------------------- |
| Відеомодель за замовчуванням | `together/Wan-AI/Wan2.2-T2V-A14B` |
| Режими               | text-to-video, посилання на одне зображення |
| Підтримувані параметри | `aspectRatio`, `resolution`       |

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

<Tip>
Дивіться [Генерація відео](/uk/tools/video-generation), щоб дізнатися про параметри спільного інструмента, вибір провайдера та поведінку failover.
</Tip>

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `TOGETHER_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, встановлені лише у вашій інтерактивній оболонці, недоступні для
    процесів Gateway, якими керує демон. Для постійної доступності використовуйте
    `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Перевірте, чи працює ваш ключ: `openclaw models list --provider together`
    - Якщо моделі не з’являються, переконайтеся, що API-ключ налаштований у правильному
      середовищі для вашого процесу Gateway.
    - Посилання на моделі мають формат `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, посилання на моделі та поведінка failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Параметри спільного інструмента генерації відео та вибір провайдера.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель керування Together AI, документація API та ціни.
  </Card>
</CardGroup>
