---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Sandbox для кожного агента + обмеження інструментів, пріоритети та приклади»
title: Sandbox і інструменти для кількох агентів
x-i18n:
    generated_at: "2026-04-23T23:08:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5642914f663e4c6a2c7f822d093c2897dd8197d8ff8361cf6a2f4566a7740cda
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація Sandbox і інструментів для кількох агентів

Кожен агент у конфігурації з кількома агентами може перевизначати глобальний sandbox і
політику інструментів. На цій сторінці описано конфігурацію для кожного агента, правила
пріоритету та приклади.

- **Sandbox backends і режими**: див. [Sandboxing](/uk/gateway/sandboxing).
- **Налагодження заблокованих інструментів**: див. [Sandbox vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Підвищений exec**: див. [Режим Elevated](/uk/tools/elevated).

Auth прив’язано до агента: кожен агент читає зі свого власного сховища auth у `agentDir`
за адресою `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте один `agentDir` для кількох агентів.
Якщо ви хочете спільно використовувати облікові дані, скопіюйте `auth-profiles.json` в `agentDir` іншого агента.

---

## Приклади конфігурації

### Приклад 1: Особистий + обмежений сімейний агент

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

- агент `main`: працює на host, повний доступ до інструментів
- агент `family`: працює в Docker (один контейнер на агента), лише інструмент `read`

---

### Приклад 2: Робочий агент зі спільним sandbox

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

### Приклад 2b: Глобальний coding-профіль + агент лише для обміну повідомленнями

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

- типові агенти отримують інструменти coding
- агент `support` призначений лише для messaging (+ інструмент Slack)

---

### Приклад 3: Різні режими sandbox для кожного агента

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
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

Коли існують і глобальні (`agents.defaults.*`), і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація Sandbox

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

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли scope sandbox розв’язується як `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів provider** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна політика інструментів** (`tools.allow` / `tools.deny`)
4. **Політика інструментів provider** (`tools.byProvider[provider].allow/deny`)
5. **Політика інструментів для агента** (`agents.list[].tools.allow/deny`)
6. **Політика provider для агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Політика sandbox-інструментів** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Політика інструментів субагента** (`tools.subagents.tools`, якщо застосовно)

Кожен рівень може додатково обмежувати інструменти, але не може повернути інструменти, заборонені на попередніх рівнях.
Якщо встановлено `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо встановлено `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів provider приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення elevated для окремого агента (`agents.list[].tools.elevated`) можуть ще більше обмежити підвищений exec для конкретних агентів. Подробиці див. в [Режим Elevated](/uk/tools/elevated).

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

Застарілі конфігурації `agent.*` мігрує `openclaw doctor`; надалі надавайте перевагу `agents.defaults` + `agents.list`.

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

` sessions_history` у цьому профілі все одно повертає обмежене, санітизоване
подання recall, а не сирий дамп transcript. Recall асистента прибирає thinking tags,
каркас `<relevant-memories>`, plain-text XML-payload викликів інструментів
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витеклі ASCII/full-width токени керування моделлю
та некоректний XML викликів інструментів MiniMax до редагування/обрізання.

---

## Типова пастка: "non-main"

`agents.defaults.sandbox.mode: "non-main"` ґрунтується на `session.mainKey` (типово `"main"`),
а не на id агента. Сесії group/channel завжди отримують власні ключі, тому
вони вважаються non-main і будуть sandboxed. Якщо ви хочете, щоб агент ніколи не використовував
sandbox, установіть `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування sandbox і інструментів для кількох агентів:

1. **Перевірте розв’язання агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Перевірте контейнери sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Протестуйте обмеження інструментів:**
   - Надішліть повідомлення, яке вимагає обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Спостерігайте за журналами:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Усунення несправностей

### Агент не sandboxed, попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація для агента має пріоритет, тож установіть `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри список deny

- Перевірте порядок фільтрації інструментів: global → agent → sandbox → subagent
- Кожен рівень може лише додатково обмежувати, а не повертати назад
- Перевіряйте через журнали: `[tools] filtering tools for agent:${agentId}`

### Контейнер не ізольований для кожного агента

- Установіть `scope: "agent"` у конфігурації sandbox для агента
- Типове значення — `"session"`, що створює один контейнер на сесію

---

## Пов’язане

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox (режими, scope, backends, images)
- [Sandbox vs політика інструментів vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження “чому це заблоковано?”
- [Режим Elevated](/uk/tools/elevated)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Конфігурація Sandbox](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Керування сесіями](/uk/concepts/session)
