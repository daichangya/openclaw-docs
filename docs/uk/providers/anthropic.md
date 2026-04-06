---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T12:45:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6af35571debf5889b63e3b4f6a05aa4e046f39740287e6e1c492916ca00df44b
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude** і надає доступ через API.
У OpenClaw для нового налаштування Anthropic слід використовувати API-ключ. Наявні legacy
профілі токенів Anthropic і далі підтримуються під час виконання, якщо вони вже
налаштовані.

<Warning>
Для Anthropic в OpenClaw розподіл оплати такий:

- **Anthropic API key**: звичайна оплата Anthropic API.
- **Claude subscription auth всередині OpenClaw**: Anthropic повідомила користувачам OpenClaw
  **4 квітня 2026 року о 12:00 PT / 20:00 BST**, що це вважається
  використанням стороннього harness і вимагає **Extra Usage** (оплата за фактом використання,
  виставляється окремо від підписки).

Наші локальні відтворення підтверджують цей поділ:

- прямий `claude -p` усе ще може працювати
- `claude -p --append-system-prompt ...` може активувати захист Extra Usage, коли
  prompt ідентифікує OpenClaw
- той самий системний prompt у стилі OpenClaw **не** відтворює блокування на
  шляху Anthropic SDK + `ANTHROPIC_API_KEY`

Тож практичне правило таке: **Anthropic API key або Claude subscription з
Extra Usage**. Якщо вам потрібен найзрозуміліший production-шлях, використовуйте Anthropic API
key.

Поточна публічна документація Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Якщо вам потрібен найзрозуміліший шлях оплати, натомість використовуйте Anthropic API
key.
OpenClaw також підтримує інші варіанти у стилі підписки, зокрема [OpenAI
Codex](/uk/providers/openai), [Qwen Cloud Coding Plan](/uk/providers/qwen),
[MiniMax Coding Plan](/uk/providers/minimax) і [Z.AI / GLM Coding
Plan](/uk/providers/glm).
</Warning>

## Варіант A: Anthropic API key

**Найкраще для:** стандартного доступу до API та оплати за використання.
Створіть свій API key у Anthropic Console.

### Налаштування CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Фрагмент config Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Типові параметри thinking (Claude 4.6)

- Для моделей Anthropic Claude 4.6 в OpenClaw за замовчуванням використовується `adaptive` thinking, якщо явно не задано рівень thinking.
- Ви можете перевизначити його для кожного повідомлення (`/think:<level>`) або в params моделі:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Пов’язана документація Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Fast mode (Anthropic API)

Спільний перемикач `/fast` в OpenClaw також підтримує прямий публічний трафік Anthropic, включно із запитами, автентифікованими через API key і OAuth, що надсилаються до `api.anthropic.com`.

- `/fast on` відповідає `service_tier: "auto"`
- `/fast off` відповідає `service_tier: "standard_only"`
- Типове значення в config:

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

Важливі обмеження:

- OpenClaw додає рівні сервісу Anthropic лише для прямих запитів до `api.anthropic.com`. Якщо ви маршрутизуєте `anthropic/*` через proxy або gateway, `/fast` не змінює `service_tier`.
- Явно задані params моделі Anthropic `serviceTier` або `service_tier` мають пріоритет над типовою поведінкою `/fast`, якщо задано обидва параметри.
- Anthropic повідомляє фактичний рівень у відповіді в полі `usage.service_tier`. Для облікових записів без доступної ємності Priority Tier значення `service_tier: "auto"` усе одно може зводитися до `standard`.

## Кешування prompt (Anthropic API)

OpenClaw підтримує функцію кешування prompt від Anthropic. Це **лише API**; legacy Anthropic token auth не враховує параметри кешу.

### Конфігурація

Використовуйте параметр `cacheRetention` у config моделі:

| Value   | Тривалість кешу | Опис                     |
| ------- | --------------- | ------------------------ |
| `none`  | Без кешування   | Вимкнути кешування prompt |
| `short` | 5 хвилин        | Типово для auth через API Key |
| `long`  | 1 година        | Розширений кеш           |

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

### Типові значення

Під час використання автентифікації через Anthropic API Key OpenClaw автоматично застосовує `cacheRetention: "short"` (5-хвилинний кеш) для всіх моделей Anthropic. Ви можете перевизначити це, явно задавши `cacheRetention` у своїй config.

### Перевизначення `cacheRetention` для окремого agent

Використовуйте params на рівні моделі як базовий рівень, а потім перевизначайте конкретних agent через `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Порядок злиття config для параметрів, пов’язаних із кешем:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

Це дає змогу одному agent зберігати довготривалий кеш, а іншому agent на тій самій моделі вимикати кешування, щоб уникнути витрат на запис для імпульсного трафіку або трафіку з низьким повторним використанням.

### Примітки щодо Bedrock Claude

- Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо це налаштовано.
- Для моделей Bedrock не від Anthropic під час виконання примусово встановлюється `cacheRetention: "none"`.
- Розумні типові значення Anthropic API-key також встановлюють `cacheRetention: "short"` для посилань на моделі Claude-on-Bedrock, якщо явне значення не задано.

## Вікно контексту 1M (бета Anthropic)

Вікно контексту Anthropic 1M доступне лише в beta. У OpenClaw його можна ввімкнути для кожної моделі окремо
через `params.context1m: true` для підтримуваних моделей Opus/Sonnet.

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

OpenClaw відображає це в `anthropic-beta: context-1m-2025-08-07` у запитах
Anthropic.

Це активується лише тоді, коли `params.context1m` явно встановлено в `true` для
цієї моделі.

Вимога: Anthropic має дозволяти використання довгого контексту для цих облікових даних
(зазвичай це оплата через API key або шлях Claude-login / legacy token auth у OpenClaw
з увімкненим Extra Usage). Інакше Anthropic повертає:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Примітка: наразі Anthropic відхиляє beta-запити `context-1m-*` під час використання
legacy Anthropic token auth (`sk-ant-oat-*`). Якщо ви налаштуєте
`context1m: true` з цим legacy режимом auth, OpenClaw запише попередження в журнал і
повернеться до стандартного вікна контексту, пропустивши beta-заголовок context1m,
зберігши при цьому обов’язкові OAuth beta.

## Видалено: backend Claude CLI

Вбудований backend Anthropic `claude-cli` було видалено.

- У повідомленні Anthropic від 4 квітня 2026 року сказано, що трафік Claude-login, ініційований OpenClaw,
  є використанням стороннього harness і вимагає **Extra Usage**.
- Наші локальні відтворення також показують, що прямий
  `claude -p --append-system-prompt ...` може наштовхуватися на той самий захист, коли
  доданий prompt ідентифікує OpenClaw.
- Той самий системний prompt у стилі OpenClaw не активує цей захист на
  шляху Anthropic SDK + `ANTHROPIC_API_KEY`.
- Для трафіку Anthropic в OpenClaw використовуйте Anthropic API keys.
- Якщо вам потрібен локальний резервний runtime на основі CLI, використовуйте інший підтримуваний CLI backend,
  наприклад Codex CLI. Див. [/gateway/cli-backends](/gateway/cli-backends).

## Примітки

- Публічна документація Anthropic для Claude Code усе ще описує пряме використання CLI, наприклад
  `claude -p`, але окреме повідомлення Anthropic для користувачів OpenClaw каже, що
  шлях Claude-login у **OpenClaw** є використанням стороннього harness і вимагає
  **Extra Usage** (оплата за фактом використання, окремо від підписки).
  Наші локальні відтворення також показують, що прямий
  `claude -p --append-system-prompt ...` може наштовхуватися на той самий захист, коли
  доданий prompt ідентифікує OpenClaw, тоді як той самий формат prompt не
  відтворюється на шляху Anthropic SDK + `ANTHROPIC_API_KEY`. Для production ми
  натомість рекомендуємо Anthropic API keys.
- setup-token Anthropic знову доступний в OpenClaw як legacy/manual шлях. Повідомлення Anthropic про оплату, специфічне для OpenClaw, і далі застосовується, тож використовуйте його з розумінням, що Anthropic вимагає **Extra Usage** для цього шляху.
- Подробиці auth і правила повторного використання наведені в [/concepts/oauth](/uk/concepts/oauth).

## Усунення проблем

**Помилки 401 / токен раптово став невалідним**

- Legacy Anthropic token auth може завершитися або бути відкликаним.
- Для нового налаштування перейдіть на Anthropic API key.

**Не знайдено API key для провайдера "anthropic"**

- Auth є **для кожного agent окремо**. Нові agent не успадковують ключі головного agent.
- Повторно запустіть onboarding для цього agent або налаштуйте API key на хості
  gateway, а потім перевірте через `openclaw models status`.

**Не знайдено облікових даних для profile `anthropic:default`**

- Запустіть `openclaw models status`, щоб побачити, який auth profile активний.
- Повторно запустіть onboarding або налаштуйте API key для цього шляху profile.

**Немає доступного auth profile (усі в cooldown/недоступні)**

- Перевірте `openclaw models status --json` на `auth.unusableProfiles`.
- Cooldown rate limit Anthropic може бути прив’язаним до моделі, тож споріднена модель Anthropic
  усе ще може бути придатною, навіть коли поточна перебуває в cooldown.
- Додайте ще один profile Anthropic або дочекайтеся завершення cooldown.

Більше: [/gateway/troubleshooting](/uk/gateway/troubleshooting) і [/help/faq](/uk/help/faq).
