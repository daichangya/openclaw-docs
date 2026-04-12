---
read_when:
    - Ви хочете використовувати Chutes з OpenClaw
    - Вам потрібен шлях налаштування OAuth або API-ключа
    - Ви хочете дізнатися про типову модель, псевдоніми або поведінку виявлення моделей
summary: Налаштування Chutes (OAuth або API-ключ, виявлення моделей, псевдоніми)
title: Chutes
x-i18n:
    generated_at: "2026-04-12T10:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) надає каталоги моделей з відкритим кодом через
OpenAI-сумісний API. OpenClaw підтримує як OAuth через браузер, так і пряму
автентифікацію за API-ключем для вбудованого провайдера `chutes`.

| Властивість | Значення                    |
| ----------- | --------------------------- |
| Провайдер   | `chutes`                    |
| API         | OpenAI-сумісний             |
| Базова URL  | `https://llm.chutes.ai/v1`  |
| Автентифікація | OAuth або API-ключ (див. нижче) |

## Початок роботи

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустіть процес початкового налаштування OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw локально запускає процес у браузері або показує URL + процес
        вставлення перенаправлення на віддалених/безголових хостах. OAuth-токени
        автоматично оновлюються через профілі автентифікації OpenClaw.
      </Step>
      <Step title="Перевірте типову модель">
        Після початкового налаштування типовою моделлю встановлюється
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть ключ на
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Запустіть процес початкового налаштування API-ключа">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Перевірте типову модель">
        Після початкового налаштування типовою моделлю встановлюється
        `chutes/zai-org/GLM-4.7-TEE`, а вбудований каталог Chutes
        реєструється.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Обидва шляхи автентифікації реєструють вбудований каталог Chutes і
встановлюють типову модель `chutes/zai-org/GLM-4.7-TEE`. Змінні середовища
для середовища виконання: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## Поведінка виявлення моделей

Коли автентифікація Chutes доступна, OpenClaw виконує запит до каталогу Chutes
з цими обліковими даними та використовує виявлені моделі. Якщо виявлення
не вдається, OpenClaw повертається до вбудованого статичного каталогу, щоб
початкове налаштування та запуск усе одно працювали.

## Типові псевдоніми

OpenClaw реєструє три зручні псевдоніми для вбудованого каталогу Chutes:

| Псевдонім      | Цільова модель                                      |
| -------------- | --------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                         |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`               |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Вбудований стартовий каталог

Вбудований резервний каталог містить поточні посилання Chutes:

| Посилання моделі                                    |
| --------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                        |
| `chutes/zai-org/GLM-5-TEE`                          |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`              |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`           |
| `chutes/moonshotai/Kimi-K2.5-TEE`                   |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                  |
| `chutes/openai/gpt-oss-120b-TEE`                    |

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

<AccordionGroup>
  <Accordion title="Перевизначення OAuth">
    Ви можете налаштувати процес OAuth за допомогою необов’язкових змінних середовища:

    | Змінна | Призначення |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Власний ідентифікатор клієнта OAuth |
    | `CHUTES_CLIENT_SECRET` | Власний секрет клієнта OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | Власний URI перенаправлення |
    | `CHUTES_OAUTH_SCOPES` | Власні області доступу OAuth |

    Див. [документацію Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    щодо вимог до застосунків перенаправлення та додаткової довідки.

  </Accordion>

  <Accordion title="Примітки">
    - Виявлення через API-ключ і OAuth використовує той самий ідентифікатор провайдера `chutes`.
    - Моделі Chutes реєструються як `chutes/<model-id>`.
    - Якщо виявлення не вдається під час запуску, вбудований статичний каталог використовується автоматично.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, посилання моделей і поведінка відмовостійкості.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдерів.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель керування Chutes і документація API.
  </Card>
  <Card title="API keys Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Створення та керування API-ключами Chutes.
  </Card>
</CardGroup>
