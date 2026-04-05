---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використання Anthropic Claude через API-ключі в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T18:13:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc6c4938674aedf20ff944bc04e742c9a7e77a5ff10ae4f95b5718504c57c2d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic створює сімейство моделей **Claude** і надає доступ через API.
У OpenClaw нове налаштування Anthropic має використовувати API-ключ. Наявні застарілі
профілі токенів Anthropic і далі враховуються під час виконання, якщо вони вже
налаштовані.

<Warning>
Для Anthropic в OpenClaw розподіл білінгу такий:

- **Anthropic API key**: звичайний білінг Anthropic API.
- **Claude subscription auth всередині OpenClaw**: Anthropic повідомила користувачам OpenClaw
  **4 квітня 2026 року о 12:00 PT / 8:00 PM BST**, що це вважається
  використанням стороннього harness і вимагає **Extra Usage** (pay-as-you-go,
  оплачується окремо від підписки).

Наші локальні відтворення підтверджують цей розподіл:

- прямий `claude -p` усе ще може працювати
- `claude -p --append-system-prompt ...` може активувати перевірку Extra Usage, коли
  prompt ідентифікує OpenClaw
- той самий system prompt у стилі OpenClaw **не** відтворює блокування на шляху
  Anthropic SDK + `ANTHROPIC_API_KEY`

Тож практичне правило таке: **Anthropic API key або Claude subscription з
Extra Usage**. Якщо вам потрібен найочевидніший production-шлях, використовуйте Anthropic API
key.

Поточна публічна документація Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Якщо вам потрібен найзрозуміліший шлях білінгу, натомість використовуйте Anthropic API key.
OpenClaw також підтримує інші варіанти у стилі підписки, зокрема [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) і [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Варіант A: Anthropic API key

**Найкраще для:** стандартного доступу до API та білінгу на основі використання.
Створіть свій API-ключ у Anthropic Console.

### Налаштування CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Фрагмент конфігурації Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Типові параметри thinking (Claude 4.6)

- Для моделей Anthropic Claude 4.6 в OpenClaw за замовчуванням використовується `adaptive` thinking, якщо не задано явний рівень thinking.
- Ви можете перевизначити це для окремого повідомлення (`/think:<level>`) або в параметрах моделі:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Пов’язана документація Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Швидкий режим (Anthropic API)

Спільний перемикач `/fast` в OpenClaw також підтримує прямий публічний трафік Anthropic, включно із запитами з auth через API-key та OAuth, надісланими до `api.anthropic.com`.

- `/fast on` відповідає `service_tier: "auto"`
- `/fast off` відповідає `service_tier: "standard_only"`
- Значення конфігурації за замовчуванням:

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
- Явні параметри моделі Anthropic `serviceTier` або `service_tier` мають пріоритет над типовим значенням `/fast`, якщо задано обидва.
- Anthropic повідомляє про фактичний рівень у відповіді в полі `usage.service_tier`. Для облікових записів без доступної місткості Priority Tier значення `service_tier: "auto"` усе одно може звестися до `standard`.

## Кешування prompt (Anthropic API)

OpenClaw підтримує можливість кешування prompt від Anthropic. Це **лише для API**; застаріла auth через токен Anthropic не враховує налаштування кешу.

### Конфігурація

Використовуйте параметр `cacheRetention` у конфігурації моделі:

| Значення | Тривалість кешу | Опис |
| ------- | --------------- | ---- |
| `none`  | Без кешування   | Вимкнути кешування prompt |
| `short` | 5 хвилин        | Значення за замовчуванням для auth через API Key |
| `long`  | 1 година        | Розширений кеш |

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

### Значення за замовчуванням

Під час використання автентифікації через Anthropic API Key OpenClaw автоматично застосовує `cacheRetention: "short"` (кеш на 5 хвилин) для всіх моделей Anthropic. Ви можете перевизначити це, явно задавши `cacheRetention` у своїй конфігурації.

### Перевизначення cacheRetention для окремих агентів

Використовуйте параметри на рівні моделі як базовий варіант, а потім перевизначайте конкретних агентів через `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // базове значення для більшості агентів
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // перевизначення лише для цього агента
    ],
  },
}
```

Порядок злиття конфігурації для параметрів, пов’язаних із кешем:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

Це дозволяє одному агенту зберігати довгоживучий кеш, тоді як інший агент на тій самій моделі вимикає кешування, щоб уникнути витрат на запис для імпульсного трафіку або трафіку з низьким повторним використанням.

### Примітки щодо Bedrock Claude

- Моделі Anthropic Claude у Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізну передачу `cacheRetention`, якщо її налаштовано.
- Для моделей Bedrock, які не є Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
- Розумні типові значення Anthropic API-key також задають `cacheRetention: "short"` для посилань на моделі Claude-on-Bedrock, якщо явне значення не встановлено.

## Вікно контексту 1M (бета Anthropic)

Вікно контексту 1M від Anthropic є бета-можливістю з обмеженим доступом. У OpenClaw увімкніть його для окремої моделі
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

OpenClaw зіставляє це з `anthropic-beta: context-1m-2025-08-07` у запитах
Anthropic.

Це активується лише тоді, коли `params.context1m` явно встановлено в `true` для
цієї моделі.

Вимога: Anthropic має дозволяти використання довгого контексту для цих облікових даних
(зазвичай білінг через API key або шлях Claude-login / застарілу auth через токен в OpenClaw
з увімкненим Extra Usage). Інакше Anthropic повертає:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Примітка: наразі Anthropic відхиляє бета-запити `context-1m-*` при використанні
застарілої auth через токен Anthropic (`sk-ant-oat-*`). Якщо ви налаштуєте
`context1m: true` з цим застарілим режимом auth, OpenClaw запише попередження в журнал і
повернеться до стандартного вікна контексту, пропустивши beta-заголовок context1m,
але зберігши потрібні beta-параметри OAuth.

## Видалено: бекенд Claude CLI

Вбудований бекенд Anthropic `claude-cli` було видалено.

- У повідомленні Anthropic від 4 квітня 2026 року сказано, що трафік Claude-login, ініційований OpenClaw,
  є використанням стороннього harness і вимагає **Extra Usage**.
- Наші локальні відтворення також показують, що прямий
  `claude -p --append-system-prompt ...` може натрапити на ту саму перевірку, коли
  доданий prompt ідентифікує OpenClaw.
- Та сама форма system prompt у стилі OpenClaw не викликає цю перевірку на
  шляху Anthropic SDK + `ANTHROPIC_API_KEY`.
- Для трафіку Anthropic в OpenClaw використовуйте API-ключі Anthropic.

## Примітки

- Публічна документація Anthropic для Claude Code усе ще описує пряме використання CLI, зокрема
  `claude -p`, але окреме повідомлення Anthropic для користувачів OpenClaw каже, що
  шлях Claude-login у **OpenClaw** є використанням стороннього harness і вимагає
  **Extra Usage** (pay-as-you-go, що оплачується окремо від підписки).
  Наші локальні відтворення також показують, що прямий
  `claude -p --append-system-prompt ...` може натрапити на ту саму перевірку, коли
  доданий prompt ідентифікує OpenClaw, тоді як та сама форма prompt не
  відтворює це на шляху Anthropic SDK + `ANTHROPIC_API_KEY`. Для production ми
  натомість рекомендуємо Anthropic API-ключі.
- Anthropic setup-token знову доступний в OpenClaw як застарілий/ручний шлях. Повідомлення Anthropic щодо білінгу для OpenClaw усе ще застосовується, тож використовуйте його з розумінням того, що Anthropic вимагає **Extra Usage** для цього шляху.
- Деталі auth і правила повторного використання наведено в [/concepts/oauth](/uk/concepts/oauth).

## Усунення несправностей

**Помилки 401 / токен раптово став недійсним**

- Застаріла auth через токен Anthropic може завершитися або бути відкликаною.
- Для нового налаштування перейдіть на Anthropic API key.

**Не знайдено API key для provider "anthropic"**

- Auth є **для кожного агента окремо**. Нові агенти не успадковують ключі головного агента.
- Повторно запустіть онбординг для цього агента або налаштуйте API key на host
  gateway, а потім перевірте через `openclaw models status`.

**Не знайдено облікові дані для профілю `anthropic:default`**

- Запустіть `openclaw models status`, щоб побачити, який профіль auth активний.
- Повторно запустіть онбординг або налаштуйте API key для цього шляху профілю.

**Немає доступного профілю auth (усі в cooldown/unavailable)**

- Перевірте `openclaw models status --json` для `auth.unusableProfiles`.
- Cooldown через обмеження швидкості Anthropic може бути прив’язаний до моделі, тож сусідня модель Anthropic
  все ще може бути придатною до використання, навіть якщо поточна перебуває в cooldown.
- Додайте ще один профіль Anthropic або дочекайтеся завершення cooldown.

Докладніше: [/gateway/troubleshooting](/uk/gateway/troubleshooting) і [/help/faq](/help/faq).
