---
read_when:
    - Ви хочете запускати OpenClaw із локальним сервером inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: Inferrs
x-i18n:
    generated_at: "2026-04-23T23:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі через
сумісний з OpenAI API `/v1`. OpenClaw працює з `inferrs` через загальний шлях
`openai-completions`.

Наразі `inferrs` найкраще розглядати як користувацький self-hosted
backend, сумісний з OpenAI, а не як окремий Plugin провайдера OpenClaw.

## Початок роботи

<Steps>
  <Step title="Запустіть inferrs із моделлю">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Переконайтеся, що сервер доступний">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Додайте запис провайдера OpenClaw">
    Додайте явний запис провайдера й спрямуйте на нього вашу типову модель. Повний приклад config див. нижче.
  </Step>
</Steps>

## Повний приклад config

У цьому прикладі використовується Gemma 4 на локальному сервері `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Чому важливий requiresStringContent">
    Деякі маршрути Chat Completions в `inferrs` приймають лише рядковий
    `messages[].content`, а не структуровані масиви частин вмісту.

    <Warning>
    Якщо виконання OpenClaw завершується помилкою на кшталт:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    установіть `compat.requiresStringContent: true` у записі моделі.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw перетворюватиме чисто текстові частини вмісту на звичайні рядки перед
    надсиланням запиту.

  </Accordion>

  <Accordion title="Особливість Gemma і schema інструментів">
    Деякі поточні комбінації `inferrs` + Gemma приймають невеликі прямі
    запити до `/v1/chat/completions`, але все одно не справляються з повними ходами
    runtime агента OpenClaw.

    Якщо це трапляється, спершу спробуйте так:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Це вимикає поверхню schema інструментів OpenClaw для моделі й може зменшити
    тиск prompt на суворіші локальні backend.

    Якщо малі прямі запити все ще працюють, але звичайні ходи агента OpenClaw і далі
    аварійно завершуються всередині `inferrs`, то решта проблеми зазвичай пов’язана з
    поведінкою моделі/сервера вище за потоком, а не з transport layer OpenClaw.

  </Accordion>

  <Accordion title="Ручний smoke test">
    Після налаштування перевірте обидва шари:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Якщо перша команда працює, а друга — ні, перевірте розділ усунення проблем нижче.

  </Accordion>

  <Accordion title="Поведінка в стилі proxy">
    `inferrs` розглядається як backend `/v1`, сумісний з OpenAI, у стилі proxy, а не як
    власний endpoint OpenAI.

    - Формування запитів, призначене лише для власного OpenAI, тут не застосовується
    - Немає `service_tier`, немає `store` Responses, немає підказок кешу prompt і немає
      формування корисного навантаження reasoning-compat для OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються до користувацьких `baseUrl` inferrs

  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="curl /v1/models не працює">
    `inferrs` не запущено, він недоступний або не прив’язаний до очікуваного
    host/port. Переконайтеся, що сервер запущено й він слухає на адресі, яку ви
    налаштували.
  </Accordion>

  <Accordion title="messages[].content очікувався як рядок">
    Установіть `compat.requiresStringContent: true` у записі моделі. Докладніше див.
    у розділі `requiresStringContent` вище.
  </Accordion>

  <Accordion title="Прямі виклики /v1/chat/completions проходять, але openclaw infer model run не працює">
    Спробуйте встановити `compat.supportsTools: false`, щоб вимкнути поверхню schema інструментів.
    Див. особливість Gemma щодо schema інструментів вище.
  </Accordion>

  <Accordion title="inferrs і далі аварійно завершується на більших ходах агента">
    Якщо OpenClaw більше не отримує помилок schema, але `inferrs` усе одно аварійно завершується на більших
    ходах агента, вважайте це обмеженням `inferrs` або моделі вище за потоком. Зменште
    тиск prompt або перейдіть на інший локальний backend чи модель.
  </Accordion>
</AccordionGroup>

<Tip>
Для загальної допомоги див. [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Запуск OpenClaw із локальними серверами моделей.
  </Card>
  <Card title="Усунення проблем Gateway" href="/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Налагодження локальних backend, сумісних з OpenAI, які проходять probes, але не працюють під час запусків агента.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>
