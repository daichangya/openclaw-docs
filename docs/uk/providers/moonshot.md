---
read_when:
    - Ви хочете налаштувати Moonshot K2 (Moonshot Open Platform) або Kimi Coding
    - Вам потрібно зрозуміти окремі кінцеві точки, ключі та посилання на моделі
    - Ви хочете готову конфігурацію для копіювання для будь-якого з провайдерів
summary: Налаштування Moonshot K2 vs Kimi Coding (окремі провайдери + ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-05T18:14:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80c71ef432b778e296bd60b7d9ec7c72d025d13fd9bdae474b3d58436d15695
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot надає API Kimi з OpenAI-compatible кінцевими точками. Налаштуйте
провайдера й установіть типову модель `moonshot/kimi-k2.5`, або використовуйте
Kimi Coding з `kimi/kimi-code`.

Поточні ідентифікатори моделей Kimi K2:

[//]: # "moonshot-kimi-k2-ids:start"

- `kimi-k2.5`
- `kimi-k2-thinking`
- `kimi-k2-thinking-turbo`
- `kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-ids:end"

```bash
openclaw onboard --auth-choice moonshot-api-key
# or
openclaw onboard --auth-choice moonshot-api-key-cn
```

Kimi Coding:

```bash
openclaw onboard --auth-choice kimi-code-api-key
```

Примітка: Moonshot і Kimi Coding — це окремі провайдери. Ключі не є взаємозамінними, кінцеві точки відрізняються, як і посилання на моделі (Moonshot використовує `moonshot/...`, Kimi Coding використовує `kimi/...`).

Вебпошук Kimi також використовує плагін Moonshot:

```bash
openclaw configure --section web
```

Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
`plugins.entries.moonshot.config.webSearch.*`.

## Фрагмент конфігурації (Moonshot API)

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: {
        // moonshot-kimi-k2-aliases:start
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
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
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

## Kimi Coding

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

## Вебпошук Kimi

OpenClaw також постачається з **Kimi** як провайдером `web_search`, що працює на основі вебпошуку Moonshot.

Під час інтерактивного налаштування можуть запитуватися:

- регіон API Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- типова модель вебпошуку Kimi (типово `kimi-k2.5`)

Конфігурація зберігається в `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
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

## Примітки

- Посилання на моделі Moonshot використовують `moonshot/<modelId>`. Посилання на моделі Kimi Coding використовують `kimi/<modelId>`.
- Поточне типове посилання на модель Kimi Coding — `kimi/kimi-code`. Застарілий `kimi/k2p5` і далі приймається як сумісний ідентифікатор моделі.
- Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і типово працює з `https://api.moonshot.ai/v1` та моделлю `kimi-k2.5`.
- Нативні кінцеві точки Moonshot (`https://api.moonshot.ai/v1` і
  `https://api.moonshot.cn/v1`) оголошують сумісність із streaming usage на
  спільному транспорті `openai-completions`. OpenClaw тепер прив’язує це до можливостей кінцевої точки,
  тому сумісні власні ідентифікатори провайдерів, націлені на ті самі нативні
  хости Moonshot, успадковують ту саму поведінку streaming-usage.
- За потреби перевизначайте ціну та метадані контексту в `models.providers`.
- Якщо Moonshot публікує інші обмеження контексту для моделі, скоригуйте
  `contextWindow` відповідно.
- Використовуйте `https://api.moonshot.ai/v1` для міжнародної кінцевої точки, а `https://api.moonshot.cn/v1` — для кінцевої точки Китаю.
- Варіанти onboarding:
  - `moonshot-api-key` для `https://api.moonshot.ai/v1`
  - `moonshot-api-key-cn` для `https://api.moonshot.cn/v1`

## Нативний режим thinking (Moonshot)

Moonshot Kimi підтримує бінарний нативний thinking:

- `thinking: { type: "enabled" }`
- `thinking: { type: "disabled" }`

Налаштовуйте його для кожної моделі через `agents.defaults.models.<provider/model>.params`:

```json5
{
  agents: {
    defaults: {
      models: {
        "moonshot/kimi-k2.5": {
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

- `/think off` -> `thinking.type=disabled`
- будь-який рівень thinking, відмінний від off -> `thinking.type=enabled`

Коли в Moonshot увімкнено thinking, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення `tool_choice` до `auto` для сумісності.
