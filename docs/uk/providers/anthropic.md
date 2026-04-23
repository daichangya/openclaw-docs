---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API keys або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T06:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e99e31bf58d08a18f526281b3bf5c3a5a96b2ff342adf3a6a193a076147a03
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **API key** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway ключі Anthropic API все одно залишаються
найбільш зрозумілим і передбачуваним шляхом для production.

Поточна публічна документація Anthropic:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API й оплати за використання.

    <Steps>
      <Step title="Get your API key">
        Створіть API key у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API key.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Перевірте командою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявить і повторно використає наявні облікові дані Claude CLI.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробиці налаштування й роботи backend Claude CLI див. у [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найпрозоріший шлях білінгу, замість цього використовуйте Anthropic API key. OpenClaw також підтримує варіанти на основі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові налаштування thinking (Claude 4.6)

Для моделей Claude 4.6 OpenClaw типово використовує thinking `adaptive`, якщо явний рівень thinking не задано.

Перевизначення для окремого повідомлення — через `/think:<level>` або в параметрах моделі:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Пов’язана документація Anthropic:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Кешування prompt

OpenClaw підтримує функцію кешування prompt від Anthropic для автентифікації через API key.

| Значення            | Тривалість кешу | Опис                                       |
| ------------------- | --------------- | ------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для auth через API key |
| `"long"`            | 1 година        | Розширений кеш                             |
| `"none"`            | Без кешування   | Вимкнути кешування prompt                  |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Використовуйте параметри на рівні моделі як базове значення, а потім перевизначайте їх для окремих агентів через `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Порядок злиття конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі може вимкнути кешування для трафіку зі сплесками або низьким повторним використанням.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний параметр `cacheRetention`, якщо його налаштовано.
    - Для не-Anthropic моделей Bedrock під час виконання примусово задається `cacheRetention: "none"`.
    - Розумні типові значення для auth через API key також встановлюють `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явне значення не задано.
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Fast mode">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API key і OAuth до `api.anthropic.com`).

    | Команда | Відповідає |
    |---------|------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Впроваджується лише для прямих запитів до `api.anthropic.com`. Маршрути через proxy залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо задано обидва.
    - Для облікових записів без capacity рівня Priority Tier значення `service_tier: "auto"` може перетворитися на `standard`.
    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Вбудований plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості media з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість       | Значення             |
    | ----------------- | -------------------- |
    | Типова модель     | `claude-opus-4-6`    |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли до розмови додається зображення або PDF, OpenClaw автоматично
    маршрутизує його через провайдера розуміння media Anthropic.

  </Accordion>

  <Accordion title="1M context window (beta)">
    Вікно context 1M від Anthropic доступне лише в beta. Увімкніть його для конкретної моделі:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw перетворює це на `anthropic-beta: context-1m-2025-08-07` у запитах.

    <Warning>
    Потрібен доступ до long-context для ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів 1M context — OpenClaw записує попередження в журнал і повертається до стандартного вікна context.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context normalization">
    Claude Opus 4.7 (`anthropic/claude-opus-4.7`) і його варіант `claude-cli` нормалізуються до вікна context 1M у визначених метаданих runtime та у звітах про статус/context активного агента. Вам не потрібен `params.context1m: true` для Opus 4.7; він більше не успадковує застарілий fallback на 200k.

    Compaction і обробка переповнення автоматично використовують вікно 1M. Інші моделі Anthropic зберігають свої опубліковані обмеження.

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Автентифікація токеном Anthropic може завершитися або бути відкликаною. Для нових налаштувань перейдіть на Anthropic API key.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Автентифікація виконується **для кожного агента окремо**. Нові агенти не успадковують ключі головного агента. Повторно запустіть onboarding для цього агента або налаштуйте API key на хості Gateway, а потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть onboarding або налаштуйте API key для шляху цього профілю.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. Періоди cooldown через обмеження швидкості Anthropic можуть бути прив’язані до моделі, тому споріднена модель Anthropic може все ще бути придатною до використання. Додайте ще один профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI backends" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування backend Claude CLI і подробиці runtime.
  </Card>
  <Card title="Prompt caching" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування prompt у різних провайдерів.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
