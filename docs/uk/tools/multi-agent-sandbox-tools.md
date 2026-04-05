---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Ізоляція та обмеження інструментів для окремих агентів, пріоритетність і приклади»
title: Ізоляція та інструменти для кількох агентів
x-i18n:
    generated_at: "2026-04-05T18:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація ізоляції та інструментів для кількох агентів

Кожен агент у конфігурації з кількома агентами може перевизначати глобальну
політику ізоляції та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила
пріоритетності та приклади.

- **Бекенди та режими ізоляції**: див. [Ізоляція](/uk/gateway/sandboxing).
- **Налагодження заблокованих інструментів**: див. [Ізоляція vs політика інструментів vs підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Підвищений exec**: див. [Підвищений режим](/tools/elevated).

Автентифікація прив’язана до агента: кожен агент читає зі свого сховища auth у `agentDir`
за шляхом `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте `agentDir` повторно для різних агентів.
Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

---

## Приклади конфігурації

### Приклад 1: особистий агент + обмежений сімейний агент

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Результат:**

- агент `main`: працює на хості, повний доступ до інструментів
- агент `family`: працює в Docker (один контейнер на кожного агента), лише інструмент `read`

---

### Приклад 2: робочий агент зі спільною ізоляцією

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Приклад 2b: глобальний профіль для кодування + агент лише для повідомлень

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Результат:**

- типові агенти отримують інструменти для кодування
- агент `support` призначений лише для обміну повідомленнями (+ інструмент Slack)

---

### Приклад 3: різні режими ізоляції для різних агентів

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Глобальне типове значення
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Перевизначення: main ніколи не ізолюється
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Перевизначення: public завжди ізолюється
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Пріоритетність конфігурації

Коли існують і глобальні (`agents.defaults.*`), і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація ізоляції

Налаштування конкретного агента перевизначають глобальні:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Примітки:**

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли scope ізоляції визначається як `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів провайдера** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна політика інструментів** (`tools.allow` / `tools.deny`)
4. **Політика інструментів провайдера** (`tools.byProvider[provider].allow/deny`)
5. **Політика інструментів конкретного агента** (`agents.list[].tools.allow/deny`)
6. **Політика провайдера для агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Політика інструментів ізоляції** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Політика інструментів субагента** (`tools.subagents.tools`, якщо застосовно)

Кожен рівень може додатково обмежувати інструменти, але не може повернути інструменти, заборонені на попередніх рівнях.
Якщо встановлено `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо встановлено `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів провайдера приймають або `provider` (наприклад `google-antigravity`), або `provider/model` (наприклад `openai/gpt-5.4`).

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення підвищеного режиму для окремих агентів (`agents.list[].tools.elevated`) можуть додатково обмежувати підвищений exec для конкретних агентів. Докладніше див. [Підвищений режим](/tools/elevated).

---

## Міграція з одного агента

**До (один агент):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Після (кілька агентів із різними профілями):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Застарілі конфігурації `agent.*` мігрує `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.

---

## Приклади обмежень інструментів

### Агент лише для читання

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Агент для безпечного виконання (без змін файлів)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Агент лише для комунікації

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

` sessions_history` у цьому профілі все одно повертає обмежене, санітизоване
представлення для згадування, а не сирий дамп транскрипту. Згадування відповідей помічника видаляє thinking-теги,
каркас `<relevant-memories>`, XML-корисне навантаження викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витоки ASCII/повноширинних токенів керування
моделлю та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.

---

## Поширена пастка: "non-main"

`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типове значення `"main"`),
а не на id агента. Сесії груп/каналів завжди отримують власні ключі, тож
вони вважаються non-main і будуть ізольовані. Якщо ви хочете, щоб агент ніколи
не використовував ізоляцію, установіть `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування ізоляції та інструментів для кількох агентів:

1. **Перевірте визначення агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Перевірте контейнери ізоляції:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Перевірте обмеження інструментів:**
   - Надішліть повідомлення, яке вимагає обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Відстежуйте журнали:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Усунення несправностей

### Агент не ізольований попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація конкретного агента має вищий пріоритет, тому встановіть `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри список заборон

- Перевірте порядок фільтрації інструментів: глобальний → агент → ізоляція → субагент
- Кожен рівень може лише додатково обмежувати, а не повертати назад
- Перевіряйте через журнали: `[tools] filtering tools for agent:${agentId}`

### Контейнер не ізольований на рівні агента

- Установіть `scope: "agent"` у конфігурації ізоляції для конкретного агента
- Типове значення — `"session"`, що створює один контейнер на сесію

---

## Див. також

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник з ізоляції (режими, області дії, бекенди, образи)
- [Ізоляція vs політика інструментів vs підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження «чому це заблоковано?»
- [Підвищений режим](/tools/elevated)
- [Маршрутизація з кількома агентами](/uk/concepts/multi-agent)
- [Конфігурація ізоляції](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Керування сесіями](/uk/concepts/session)
