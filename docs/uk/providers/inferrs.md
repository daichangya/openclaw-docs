---
read_when:
    - Ви хочете запускати OpenClaw із локальним сервером inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запускайте OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-07T14:58:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84f660d49a682d0c0878707eebe1bc1e83dd115850687076ea3938b9f9c86c6
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі через API `/v1`, сумісний з OpenAI. OpenClaw працює з `inferrs` через загальний шлях `openai-completions`.

Наразі `inferrs` найкраще розглядати як користувацький самостійно розміщений бекенд, сумісний з OpenAI, а не як окремий плагін провайдера OpenClaw.

## Швидкий старт

1. Запустіть `inferrs` із моделлю.

Приклад:

```bash
inferrs serve gg-hf-gg/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Переконайтеся, що сервер доступний.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Додайте явний запис провайдера OpenClaw і вкажіть на нього свою модель за замовчуванням.

## Повний приклад конфігурації

У цьому прикладі використовується Gemma 4 на локальному сервері `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/gg-hf-gg/gemma-4-E2B-it" },
      models: {
        "inferrs/gg-hf-gg/gemma-4-E2B-it": {
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
            id: "gg-hf-gg/gemma-4-E2B-it",
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

## Чому `requiresStringContent` має значення

Деякі маршрути Chat Completions в `inferrs` приймають лише рядковий `messages[].content`, а не структуровані масиви частин вмісту.

Якщо запуски OpenClaw завершуються помилкою на кшталт:

```text
messages[1].content: invalid type: sequence, expected a string
```

встановіть:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw перетворить частини вмісту, що складаються лише з тексту, на звичайні рядки перед надсиланням запиту.

## Застереження щодо Gemma і схеми інструментів

Деякі поточні комбінації `inferrs` + Gemma приймають невеликі прямі запити до `/v1/chat/completions`, але все одно не справляються з повними ходами середовища виконання агента OpenClaw.

Якщо це відбувається, спочатку спробуйте ось це:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

Це вимикає поверхню схеми інструментів OpenClaw для моделі й може зменшити навантаження від prompt на суворіших локальних бекендах.

Якщо маленькі прямі запити й далі працюють, але звичайні ходи агента OpenClaw продовжують аварійно завершуватися всередині `inferrs`, то решта проблеми зазвичай пов’язана з поведінкою моделі/сервера на стороні upstream, а не з транспортним шаром OpenClaw.

## Ручний smoke-тест

Після налаштування перевірте обидва шари:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gg-hf-gg/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/gg-hf-gg/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Якщо перша команда працює, а друга — ні, скористайтеся наведеними нижче примітками щодо усунення несправностей.

## Усунення несправностей

- `curl /v1/models` не працює: `inferrs` не запущено, він недоступний або не прив’язаний до очікуваного хоста/порту.
- `messages[].content ... expected a string`: установіть `compat.requiresStringContent: true`.
- Прямі маленькі виклики `/v1/chat/completions` проходять, але `openclaw infer model run` не працює: спробуйте `compat.supportsTools: false`.
- OpenClaw більше не отримує помилок схеми, але `inferrs` все одно аварійно завершується на більших ходах агента: вважайте це обмеженням `inferrs` або моделі на стороні upstream і зменште навантаження від prompt або змініть локальний бекенд/модель.

## Поведінка в стилі проксі

`inferrs` розглядається як бекенд `/v1`, сумісний з OpenAI, у стилі проксі, а не як нативна кінцева точка OpenAI.

- тут не застосовується формування запитів, призначене лише для нативного OpenAI
- немає `service_tier`, немає `store` у Responses, немає підказок кешу prompt і немає формування payload сумісності з reasoning OpenAI
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) не додаються для користувацьких `inferrs` base URL

## Див. також

- [Локальні моделі](/uk/gateway/local-models)
- [Усунення несправностей шлюзу](/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Провайдери моделей](/uk/concepts/model-providers)
