---
read_when:
    - Ви хочете налаштування Moonshot K2 (Moonshot Open Platform) і Kimi Coding
    - Вам потрібно зрозуміти окремі endpoint, ключі та посилання на моделі
    - Ви хочете готову конфігурацію для копіювання й вставлення для будь-якого провайдера
summary: Налаштуйте Moonshot K2 і Kimi Coding (окремі провайдери та ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T06:46:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a726df279bfc0351b8ab224e682b5c1e6e360440659e33e8568a94c351df51
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot надає API Kimi з OpenAI-сумісними endpoint. Налаштуйте
провайдера й установіть типову модель `moonshot/kimi-k2.6`, або використовуйте
Kimi Coding з `kimi/kimi-code`.

<Warning>
Moonshot і Kimi Coding — **окремі провайдери**. Ключі не є взаємозамінними, endpoint відрізняються, як і посилання на моделі (`moonshot/...` проти `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Посилання на модель               | Назва                  | Reasoning | Вхідні дані | Контекст | Макс. вивід |
| --------------------------------- | ---------------------- | --------- | ----------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Ні        | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Ні        | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Так       | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Так       | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Ні        | text        | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Вбудовані оцінки вартості для поточних моделей K2, розміщених у Moonshot, використовують
опубліковані Moonshot тарифи pay-as-you-go: Kimi K2.6 коштує $0.16/MTok за cache hit,
$0.95/MTok за вхід і $4.00/MTok за вивід; Kimi K2.5 — $0.10/MTok за cache hit,
$0.60/MTok за вхід і $3.00/MTok за вивід. Для інших застарілих записів каталогу
зберігаються нульові placeholder-значення вартості, якщо ви не перевизначите їх у конфігурації.

## Початок роботи

Виберіть свого провайдера й виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Виберіть регіон endpoint">
        | Варіант автентифікації   | Endpoint                       | Регіон          |
        | ------------------------ | ------------------------------ | --------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | Міжнародний     |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | Китай           |
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для endpoint у Китаї:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Запустіть live smoke test">
        Використовуйте ізольований каталог стану, якщо хочете перевірити доступ до моделі та
        відстеження вартості, не зачіпаючи звичайні сесії:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        У JSON-відповіді має бути `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис транскрипту помічника зберігає нормалізоване
        використання токенів, а також оцінену вартість у `usage.cost`, коли Moonshot повертає
        метадані використання.
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Найкраще для:** задач, орієнтованих на код, через endpoint Kimi Coding.

    <Note>
    Kimi Coding використовує інший API-ключ і префікс провайдера (`kimi/...`), ніж Moonshot (`moonshot/...`). Застаріле посилання на модель `kimi/k2p5` усе ще приймається як compatibility id.
    </Note>

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Вебпошук Kimi

OpenClaw також постачається з **Kimi** як провайдером `web_search`, що працює на основі
вебпошуку Moonshot.

<Steps>
  <Step title="Запустіть інтерактивне налаштування вебпошуку">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Налаштуйте регіон вебпошуку та модель">
    Інтерактивне налаштування запитує:

    | Налаштування        | Варіанти                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Регіон API          | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку    | Типово `kimi-k2.6`                                                   |

  </Step>
</Steps>

Конфігурація розміщується в `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // або використовуйте KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Додатково

<AccordionGroup>
  <Accordion title="Нативний режим thinking">
    Moonshot Kimi підтримує бінарний нативний thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Налаштовуйте це для конкретної моделі через `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw також зіставляє рівні runtime `/think` для Moonshot:

    | Рівень `/think`      | Поведінка Moonshot         |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Будь-який рівень, крім off | `thinking.type=enabled` |

    <Warning>
    Коли в Moonshot увімкнено thinking, `tool_choice` має бути `auto` або `none`. Для сумісності OpenClaw нормалізує несумісні значення `tool_choice` до `auto`.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    збереженням `reasoning_content` між кількома ходами. Установіть `"all"`, щоб зберігати повне
    reasoning між ходами; пропустіть це поле (або залиште `null`), щоб використовувати
    типову серверну стратегію. OpenClaw пересилає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і видаляє його для інших моделей.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Санітизація id викликів інструментів">
    Moonshot Kimi віддає нативні id `tool_call` у форматі `functions.<name>:<index>` через OpenAI-сумісний транспорт. OpenClaw більше не виконує сувору санітизацію цих id для Moonshot, тож багатоходові агентні сценарії через Kimi K2.6 продовжують працювати після 2–3 раундів викликів інструментів, коли сервінговий шар зіставляє змінені id з оригінальними визначеннями інструментів.

    Якщо власному OpenAI-сумісному провайдеру потрібна попередня поведінка, задайте `sanitizeToolCallIds: true` у записі провайдера. Цей прапорець розміщено в спільному сімействі повторного відтворення `openai-compatible`; для Moonshot типово підключено відмову від нього.

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Сумісність streaming usage">
    Нативні endpoint Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) оголошують сумісність streaming usage на
    спільному транспорті `openai-completions`. OpenClaw визначає це за можливостями endpoint, тож
    сумісні власні ідентифікатори провайдерів, націлені на ті самі нативні
    хости Moonshot, успадковують ту саму поведінку streaming-usage.

    З урахуванням вбудованих цін K2.6, потокове usage, яке включає токени входу, виходу
    і читання з кешу, також перетворюється на локально оцінену вартість у USD для
    `/status`, `/usage full`, `/usage cost` і обліку сесій на основі транскриптів.

  </Accordion>

  <Accordion title="Довідник endpoint і посилань на моделі">
    | Провайдер   | Префікс посилання на модель | Endpoint                      | Змінна середовища для автентифікації |
    | ----------- | --------------------------- | ----------------------------- | ------------------------------------ |
    | Moonshot    | `moonshot/`                 | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                   |
    | Moonshot CN | `moonshot/`                 | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                   |
    | Kimi Coding | `kimi/`                     | endpoint Kimi Coding          | `KIMI_API_KEY`                       |
    | Web search  | N/A                         | Такий самий, як регіон API Moonshot | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і типово працює з `https://api.moonshot.ai/v1` та моделлю `kimi-k2.6`.
    - За потреби перевизначайте метадані вартості й контексту в `models.providers`.
    - Якщо Moonshot публікує інші ліміти контексту для моделі, відповідно скоригуйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вебпошук" href="/uk/tools/web" icon="magnifying-glass">
    Налаштування провайдерів вебпошуку, включно з Kimi.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для провайдерів, моделей і plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Керування API-ключами Moonshot і документація.
  </Card>
</CardGroup>
