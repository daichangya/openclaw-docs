---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Ізольоване середовище та обмеження інструментів на рівні агента, пріоритети та приклади»
title: Ізольоване середовище й інструменти для кількох агентів
x-i18n:
    generated_at: "2026-04-23T19:28:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: dff5be3e06ca4701adb078cd8ab2eb36a66b0c705e1ab34a4ae470399cde93e5
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація ізольованого середовища й інструментів для кількох агентів

Кожен агент у багатoагентній конфігурації може перевизначати глобальну політику
ізольованого середовища та інструментів. На цій сторінці описано конфігурацію для кожного агента, правила пріоритету та
приклади.

- **Бекенди та режими ізольованого середовища**: див. [Sandboxing](/uk/gateway/sandboxing).
- **Налагодження заблокованих інструментів**: див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Elevated exec**: див. [Elevated Mode](/uk/tools/elevated).

Автентифікація виконується для кожного агента окремо: кожен агент читає зі свого сховища auth в `agentDir` за адресою
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте один `agentDir` для кількох агентів.
Якщо ви хочете поділитися credentials, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

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
- агент `family`: працює в Docker (один контейнер на агента), лише інструмент `read`

---

### Приклад 2: робочий агент зі спільним ізольованим середовищем

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

### Приклад 2b: глобальний профіль coding + агент лише для повідомлень

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

- агенти за замовчуванням отримують інструменти coding
- агент `support` — лише для повідомлень (+ інструмент Slack)

---

### Приклад 3: різні режими ізольованого середовища для різних агентів

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Глобальне значення за замовчуванням
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Перевизначення: main ніколи не працює в ізольованому середовищі
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Перевизначення: public завжди працює в ізольованому середовищі
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

## Пріоритет конфігурації

Коли існують і глобальна (`agents.defaults.*`), і специфічна для агента (`agents.list[].*`) конфігурації:

### Конфігурація ізольованого середовища

Налаштування для агента перевизначають глобальні:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли scope ізольованого середовища зводиться до `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів провайдера** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна політика інструментів** (`tools.allow` / `tools.deny`)
4. **Політика інструментів провайдера** (`tools.byProvider[provider].allow/deny`)
5. **Політика інструментів для конкретного агента** (`agents.list[].tools.allow/deny`)
6. **Політика провайдера агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Політика інструментів ізольованого середовища** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Політика інструментів підагента** (`tools.subagents.tools`, якщо застосовно)

Кожен рівень може додатково обмежувати інструменти, але не може знову надати інструменти, заборонені на попередніх рівнях.
Якщо задано `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо задано `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.5`).

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Tool groups](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення elevated для конкретного агента (`agents.list[].tools.elevated`) можуть додатково обмежувати elevated exec для окремих агентів. Подробиці див. у [Elevated Mode](/uk/tools/elevated).

---

## Міграція з одного агента

**Було (один агент):**

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

**Стало (кілька агентів із різними профілями):**

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

Застарілі конфігурації `agent.*` мігруються за допомогою `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.

---

## Приклади обмеження інструментів

### Агент лише для читання

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Агент безпечного виконання (без змін файлів)

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

`session_history` у цьому профілі все одно повертає обмежене, санітизоване
представлення recall, а не необроблений дамп transcript. Recall асистента прибирає thinking tags,
каркас `<relevant-memories>`, XML-навантаження викликів інструментів у plain-text
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витоки ASCII/full-width токенів керування моделлю
та некоректний XML викликів інструментів MiniMax до редагування/обрізання.

---

## Поширена пастка: `non-main`

`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типове значення `"main"`),
а не на id агента. Сесії груп/каналів завжди отримують власні ключі, тому
вважаються не-main і працюватимуть в ізольованому середовищі. Якщо ви хочете, щоб агент ніколи не працював
в ізольованому середовищі, задайте `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування ізольованого середовища та інструментів для кількох агентів:

1. **Перевірте визначення агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Перевірте контейнери ізольованого середовища:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Протестуйте обмеження інструментів:**
   - Надішліть повідомлення, яке потребує обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Відстежуйте логи:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Усунення несправностей

### Агент не працює в ізольованому середовищі, попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація для конкретного агента має пріоритет, тому задайте `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри deny list

- Перевірте порядок фільтрації інструментів: global → agent → sandbox → subagent
- Кожен рівень може лише додатково обмежувати, а не повертати назад
- Перевірте за логами: `[tools] filtering tools for agent:${agentId}`

### Контейнер не ізольовано для кожного агента окремо

- Задайте `scope: "agent"` у конфігурації ізольованого середовища для конкретного агента
- Типове значення — `"session"`, що створює один контейнер на сесію

---

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник з ізольованого середовища (режими, scope, бекенди, образи)
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження «чому це заблоковано?»
- [Elevated Mode](/uk/tools/elevated)
- [Multi-Agent Routing](/uk/concepts/multi-agent)
- [Sandbox Configuration](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Session Management](/uk/concepts/session)
