---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Пісочниця та обмеження інструментів для кожного агента, пріоритетність і приклади»
title: Пісочниця багатьох агентів і інструменти
x-i18n:
    generated_at: "2026-04-25T00:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація пісочниці та інструментів для багатьох агентів

Кожен агент у конфігурації з багатьма агентами може перевизначати глобальну політику пісочниці та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила пріоритетності та приклади.

- **Бекенди та режими пісочниці**: див. [Пісочниця](/uk/gateway/sandboxing).
- **Налагодження заблокованих інструментів**: див. [Пісочниця vs політика інструментів vs підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Підвищене виконання**: див. [Підвищений режим](/uk/tools/elevated).

Auth є окремою для кожного агента: кожен агент читає зі свого сховища auth у `agentDir` за адресою
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте один `agentDir` повторно для кількох агентів.
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

- агент `main`: працює на хості, має повний доступ до інструментів
- агент `family`: працює в Docker (один контейнер на агента), лише інструмент `read`

---

### Приклад 2: робочий агент зі спільною пісочницею

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
- агент `support` призначений лише для повідомлень (+ інструмент Slack)

---

### Приклад 3: різні режими пісочниці для різних агентів

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
          "mode": "off" // Перевизначення: main ніколи не в пісочниці
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Перевизначення: public завжди в пісочниці
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

Коли існують і глобальні (`agents.defaults.*`), і агент-специфічні (`agents.list[].*`) конфігурації:

### Конфігурація пісочниці

Налаштування окремого агента перевизначають глобальні:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область дії пісочниці зводиться до `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів провайдера** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна політика інструментів** (`tools.allow` / `tools.deny`)
4. **Політика інструментів провайдера** (`tools.byProvider[provider].allow/deny`)
5. **Політика інструментів для окремого агента** (`agents.list[].tools.allow/deny`)
6. **Політика провайдера для агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Політика інструментів пісочниці** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Політика інструментів субагента** (`tools.subagents.tools`, якщо застосовується)

Кожен рівень може додатково обмежувати інструменти, але не може повернути інструменти, заборонені на попередніх рівнях.
Якщо задано `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо задано `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

Якщо будь-який явний список дозволів у цьому ланцюжку призводить до того, що для запуску не лишається жодного викликного інструмента,
OpenClaw зупиняється до надсилання запиту моделі. Це зроблено навмисно:
агент, налаштований із відсутнім інструментом на кшталт
`agents.list[].tools.allow: ["query_db"]`, має завершуватися з явною помилкою, доки не буде ввімкнено Plugin,
який реєструє `query_db`, а не продовжувати працювати як агент лише з текстом.

Політики інструментів підтримують скорочення `group:*`, які розгортаються у кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення підвищеного режиму для окремого агента (`agents.list[].tools.elevated`) можуть додатково обмежувати підвищене виконання для конкретних агентів. Докладніше див. у [Підвищений режим](/uk/tools/elevated).

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

**Після (багато агентів із різними профілями):**

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

Застарілі конфігурації `agent.*` мігруються командою `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.

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

`sessions_history` у цьому профілі все одно повертає обмежене, очищене представлення згадування, а не сирий дамп транскрипту. Згадування помічника прибирає thinking-теги,
каркас `<relevant-memories>`,
простотекстові XML-пейлоади викликів інструментів
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, а також обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витоки ASCII/повноширинних
керувальних токенів моделі та некоректний MiniMax XML викликів інструментів перед редагуванням/обрізанням.

---

## Поширена помилка: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типово `"main"`),
а не на id агента. Сесії груп/каналів завжди отримують власні ключі, тому
вони вважаються не-main і будуть запускатися в пісочниці. Якщо ви хочете, щоб агент ніколи не використовував пісочницю, встановіть `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування пісочниці та інструментів для багатьох агентів:

1. **Перевірте визначення агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Переконайтеся в наявності контейнерів пісочниці:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Перевірте обмеження інструментів:**
   - Надішліть повідомлення, яке потребує обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Відстежуйте логи:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Усунення несправностей

### Агент не запускається в пісочниці попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація окремого агента має вищий пріоритет, тож встановіть `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри список заборон

- Перевірте порядок фільтрації інструментів: глобальний → агент → пісочниця → субагент
- Кожен рівень може лише додатково обмежувати, а не повертати дозволи
- Перевірте в логах: `[tools] filtering tools for agent:${agentId}`

### Контейнер не ізольований для кожного агента

- Встановіть `scope: "agent"` в агент-специфічній конфігурації пісочниці
- Типове значення — `"session"`, яке створює один контейнер на сесію

---

## Пов’язане

- [Пісочниця](/uk/gateway/sandboxing) -- повний довідник щодо пісочниці (режими, області, бекенди, образи)
- [Пісочниця vs політика інструментів vs підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження питання «чому це заблоковано?»
- [Підвищений режим](/uk/tools/elevated)
- [Маршрутизація багатьох агентів](/uk/concepts/multi-agent)
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Керування сесіями](/uk/concepts/session)
