---
read_when:
    - Ви хочете доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використання каталогів OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T23:05:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode надає в OpenClaw два розміщені catalog:

| Catalog | Префікс          | Runtime-провайдер |
| ------- | ---------------- | ----------------- |
| **Zen** | `opencode/...`   | `opencode`        |
| **Go**  | `opencode-go/...`| `opencode-go`     |

Обидва catalog використовують той самий API key OpenCode. OpenClaw зберігає id runtime-провайдерів
розділеними, щоб маршрутизація по моделях вище за потоком залишалася коректною, але onboarding і docs
розглядають це як єдине налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Catalog Zen">
    **Найкраще підходить для:** куруваного багатомодельного proxy OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Зробіть модель Zen типовою">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalog Go">
    **Найкраще підходить для:** лінійки Kimi, GLM і MiniMax, розміщеної в OpenCode.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Зробіть модель Go типовою">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Приклад config

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Вбудовані catalog

### Zen

| Властивість      | Значення                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime-провайдер | `opencode`                                                             |
| Приклади моделей | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Властивість      | Значення                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime-провайдер | `opencode-go`                                                           |
| Приклади моделей | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Alias API key">
    `OPENCODE_ZEN_API_KEY` також підтримується як alias для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Введення одного ключа OpenCode під час setup зберігає облікові дані для обох runtime-
    провайдерів. Вам не потрібно окремо проходити onboarding для кожного catalog.
  </Accordion>

  <Accordion title="Білінг і dashboard">
    Ви входите в OpenCode, додаєте платіжні дані й копіюєте свій API key. Білінг
    і доступність catalog керуються з dashboard OpenCode.
  </Accordion>

  <Accordion title="Поведінка replay для Gemini">
    Посилання OpenCode на базі Gemini залишаються на шляху proxy-Gemini, тому OpenClaw зберігає
    там санітизацію thought-signature Gemini, не вмикаючи власну
    валідацію replay Gemini або bootstrap-перезапис.
  </Accordion>

  <Accordion title="Поведінка replay не для Gemini">
    Посилання OpenCode не на базі Gemini зберігають мінімальну політику replay, сумісну з OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Введення одного ключа OpenCode під час setup зберігає облікові дані для обох runtime-провайдерів Zen і
Go, тож onboarding потрібно пройти лише один раз.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник config для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
