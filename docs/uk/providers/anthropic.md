---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T03:28:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1ecd7846b8dd86cd7a722654042cd78e6c28fc2ae5aca43d967d19df337744
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два шляхи автентифікації:

- **API key** — прямий доступ до Anthropic API з тарифікацією за використання (`anthropic/*` моделі)
- **Claude CLI** — повторне використання наявного входу Claude CLI на тому самому хості

<Warning>
Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
OpenClaw вважає повторне використання Claude CLI і використання `claude -p` санкціонованими, якщо
Anthropic не опублікує нову політику.

Для довготривалих хостів Gateway API-ключі Anthropic усе ще залишаються найзрозумілішим і
найпередбачуванішим шляхом для production.

Поточна публічна документація Anthropic:

- [Довідник CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Огляд SDK агента Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще підходить для:** стандартного доступу до API і тарифікації за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть API key у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
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
    **Найкраще підходить для:** повторного використання наявного входу Claude CLI без окремого API key.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і в нього виконано вхід">
        Перевірте командою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявляє та повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Деталі налаштування і виконання для бекенда Claude CLI наведені в [CLI Backends](/uk/gateway/cli-backends).
    </Note>

    <Tip>
    Якщо вам потрібен найзрозуміліший шлях тарифікації, замість цього використовуйте API key Anthropic. OpenClaw також підтримує варіанти у стилі підписки від [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Типові значення thinking (Claude 4.6)

Для моделей Claude 4.6 у OpenClaw за замовчуванням використовується thinking `adaptive`, якщо явний рівень thinking не задано.

Перевизначайте для окремих повідомлень через `/think:<level>` або в параметрах моделі:

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

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації через API key.

| Value               | Тривалість кешу | Опис                                   |
| ------------------- | --------------- | -------------------------------------- |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації через API key |
| `"long"`            | 1 година        | Розширений кеш                         |
| `"none"`            | Без кешування   | Вимкнути кешування промптів            |

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
    Використовуйте параметри на рівні моделі як базову лінію, а потім перевизначайте їх для конкретних агентів через `agents.list[].params`:

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

    Це дозволяє одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для імпульсного трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Нотатки щодо Bedrock Claude">
    - Моделі Anthropic Claude у Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо це налаштовано.
    - Для не-Anthropic моделей Bedrock під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні типові значення для API key також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, коли явне значення не встановлено.
  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API key і OAuth до `api.anthropic.com`).

    | Command | Відповідає |
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
    - Впроваджується лише для прямих запитів до `api.anthropic.com`. Для проксі-маршрутів `service_tier` залишається без змін.
    - Явні параметри `serviceTier` або `service_tier` мають пріоритет над `/fast`, якщо встановлено обидва.
    - В облікових записах без доступної ємності Priority Tier значення `service_tier: "auto"` може вирішитися як `standard`.
    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості роботи з медіа на основі налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Property       | Value                |
    | -------------- | -------------------- |
    | Модель за замовчуванням  | `claude-opus-4-6`    |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли до розмови додається зображення або PDF, OpenClaw автоматично
    спрямовує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Вікно контексту 1M (бета)">
    Вікно контексту Anthropic 1M доступне через бета-доступ. Увімкніть його для окремої моделі:

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

    OpenClaw відображає це у `anthropic-beta: context-1m-2025-08-07` у запитах.

    `params.context1m: true` також застосовується до бекенда Claude CLI
    (`claude-cli/*`) для відповідних моделей Opus і Sonnet, розширюючи контекстне
    вікно під час виконання для цих CLI-сеансів відповідно до поведінки прямого API.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Застаріла автентифікація через токен (`sk-ant-oat-*`) відхиляється для запитів із контекстом 1M — OpenClaw записує попередження в лог і повертається до стандартного вікна контексту.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.7">
    `anthropic/claude-opus-4.7` та його варіант `claude-cli` мають вікно контексту 1M
    за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Токен-автентифікація Anthropic має строк дії та може бути відкликана. Для нових налаштувань замість цього використовуйте API key Anthropic.
  </Accordion>

  <Accordion title='API key не знайдено для провайдера "anthropic"'>
    Автентифікація Anthropic є **для кожного агента окремо** — нові агенти не успадковують ключі головного агента. Повторно запустіть онбординг для цього агента (або налаштуйте API key на хості Gateway), а потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Облікові дані не знайдено для профілю "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API key для шляху цього профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `openclaw models status --json` для `auth.unusableProfiles`. Cooldown обмеження швидкості Anthropic може бути прив’язаний до моделі, тому сусідня модель Anthropic все ще може бути придатною до використання. Додайте ще один профіль Anthropic або дочекайтеся завершення cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI-бекенди" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенда Claude CLI та деталі виконання.
  </Card>
  <Card title="Кешування промптів" href="/uk/reference/prompt-caching" icon="database">
    Як працює кешування промптів у різних провайдерів.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
