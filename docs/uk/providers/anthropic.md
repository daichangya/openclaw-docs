---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T23:04:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два шляхи автентифікації:

- **API-ключ** — прямий доступ до API Anthropic з тарифікацією за використанням (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` дозволеними, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway API-ключі Anthropic усе ще є найяснішим і
найпередбачуванішим шляхом для production.

Поточна публічна документація Anthropic:

- [Довідка по CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Огляд Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з тарифом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з тарифом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API і тарифікації за використанням.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть API-ключ у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        # виберіть: Anthropic API key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
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
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API-ключа.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і вхід виконано">
        Перевірте командою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        # виберіть: Claude CLI
        ```

        OpenClaw виявляє та повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Докладно про налаштування і runtime backend Claude CLI див. у [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найпрозоріший шлях тарифікації, натомість використовуйте API-ключ Anthropic. OpenClaw також підтримує варіанти у стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Значення Thinking за замовчуванням (Claude 4.6)

Для моделей Claude 4.6 в OpenClaw за замовчуванням використовується `adaptive` thinking, якщо явно не задано рівень thinking.

Перевизначайте для кожного повідомлення через `/think:<level>` або в параметрах моделі:

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

OpenClaw підтримує функцію кешування prompt Anthropic для автентифікації через API-ключ.

| Значення            | Тривалість кешу | Опис                                        |
| ------------------- | --------------- | ------------------------------------------- |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації через API-ключ |
| `"long"`            | 1 година        | Розширений кеш                              |
| `"none"`            | Без кешування   | Вимкнути кешування prompt                   |

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
  <Accordion title="Перевизначення кешу для окремих агентів">
    Використовуйте параметри на рівні моделі як базу, а потім перевизначайте конкретних агентів через `agents.list[].params`:

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
    2. `agents.list[].params` (відповідний `id`, перевизначає за ключем)

    Це дає змогу одному агенту зберігати довгоживучий кеш, тоді як інший агент на тій самій моделі вимикає кешування для імпульсного трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Claude на Bedrock">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо це налаштовано.
    - Для моделей Bedrock, які не належать Anthropic, під час runtime примусово встановлюється `cacheRetention: "none"`.
    - Розумні значення за замовчуванням для API-ключів також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, якщо явне значення не задано.
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Режим Fast">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API-ключ і OAuth до `api.anthropic.com`).

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
    - Впроваджується лише для прямих запитів до `api.anthropic.com`. Маршрути через проксі залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо задано обидва.
    - Для облікових записів без місткості Priority Tier `service_tier: "auto"` може розв’язатися як `standard`.
    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення і PDF)">
    Комплектний plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості роботи з медіа з налаштованої автентифікації Anthropic — додаткова конфігурація не потрібна.

    | Властивість      | Значення             |
    | ---------------- | -------------------- |
    | Типова модель    | `claude-opus-4-6`    |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли до розмови додається зображення або PDF, OpenClaw автоматично
    маршрутизує його через provider розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M (beta)">
    Контекстне вікно Anthropic 1M доступне за beta-доступом. Увімкніть його для конкретної моделі:

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

    OpenClaw відображає це в `anthropic-beta: context-1m-2025-08-07` у запитах.

    <Warning>
    Потребує доступу до довгого контексту у ваших облікових даних Anthropic. Застаріла автентифікація токеном (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw записує попередження і повертається до стандартного контекстного вікна.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` та його варіант `claude-cli` мають контекстне
    вікно 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Токен-автентифікація Anthropic має строк дії та може бути відкликана. Для нових налаштувань натомість використовуйте API-ключ Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Автентифікація Anthropic є **для кожного агента окремо** — нові агенти не успадковують ключі головного агента. Повторно запустіть початкове налаштування для цього агента (або налаштуйте API-ключ на хості gateway), а потім перевірте через `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який auth profile активний. Повторно запустіть початкове налаштування або налаштуйте API-ключ для шляху цього профілю.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Перевірте `openclaw models status --json` на наявність `auth.unusableProfiles`. Обмеження частоти Anthropic із cooldown можуть бути прив’язані до моделі, тож споріднена модель Anthropic усе ще може бути доступною. Додайте інший профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язано

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI Backends" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування backend Claude CLI та подробиці runtime.
  </Card>
  <Card title="Кешування prompt" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування prompt між provider.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
