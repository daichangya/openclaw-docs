---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Sandbox та обмеження інструментів для окремого агента, пріоритетність і приклади»
title: Sandbox і Tools для кількох агентів
x-i18n:
    generated_at: "2026-04-24T03:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація Sandbox і Tools для кількох агентів

Кожен агент у конфігурації з кількома агентами може перевизначати глобальні
policy sandbox і tools. На цій сторінці описано конфігурацію для окремого агента, правила
пріоритетності та приклади.

- **Backend і режими sandbox**: див. [Ізоляція](/uk/gateway/sandboxing).
- **Діагностика заблокованих інструментів**: див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Elevated exec**: див. [Режим Elevated](/uk/tools/elevated).

Автентифікація є окремою для кожного агента: кожен агент читає зі свого сховища auth у `agentDir`
за шляхом `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте той самий `agentDir` для кількох агентів.
Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` в `agentDir` іншого агента.

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

- Агент `main`: працює на хості, повний доступ до інструментів
- Агент `family`: працює в Docker (один контейнер на агента), лише інструмент `read`

---

### Приклад 2: робочий агент зі спільним sandbox

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

### Приклад 2b: глобальний профіль coding + агент лише для messaging

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
- агент `support` працює лише з messaging (+ інструмент Slack)

---

### Приклад 3: різні режими sandbox для різних агентів

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

## Пріоритетність конфігурації

Коли одночасно існують глобальні (`agents.defaults.*`) і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація Sandbox

Налаштування для окремого агента мають пріоритет над глобальними:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область sandbox розв’язується як `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів provider** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна policy інструментів** (`tools.allow` / `tools.deny`)
4. **Policy інструментів provider** (`tools.byProvider[provider].allow/deny`)
5. **Policy інструментів для окремого агента** (`agents.list[].tools.allow/deny`)
6. **Policy provider для агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Policy інструментів sandbox** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Policy інструментів субагента** (`tools.subagents.tools`, якщо застосовується)

Кожен рівень може додатково обмежувати інструменти, але не може знову дозволити інструменти, заборонені на попередніх рівнях.
Якщо задано `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо задано `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів provider приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

Policy інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення elevated для окремого агента (`agents.list[].tools.elevated`) можуть додатково обмежувати elevated exec для конкретних агентів. Докладніше див. [Режим Elevated](/uk/tools/elevated).

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

Застарілі конфігурації `agent.*` мігруються через `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.

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

` sessions_history` у цьому профілі все одно повертає обмежений, санітизований вигляд
відновлення, а не необроблений дамп транскрипту. Відновлення асистента прибирає теги thinking,
структуру `<relevant-memories>`, XML-payload викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижену структуру викликів інструментів, витоки ASCII/повноширинних токенів керування моделлю
та некоректний XML викликів інструментів MiniMax до редагування/обрізання.

---

## Поширена пастка: "non-main"

`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типово `"main"`),
а не на id агента. Сесії груп/каналів завжди отримують власні ключі, тому
вважаються неосновними й працюватимуть у sandbox. Якщо ви хочете, щоб агент ніколи не працював у
sandbox, задайте `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування sandbox і tools для кількох агентів:

1. **Перевірте розв’язання агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Перевірте sandbox контейнери:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Перевірте обмеження інструментів:**
   - Надішліть повідомлення, яке потребує обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Слідкуйте за логами:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Діагностика

### Агент не працює в sandbox попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація для окремого агента має пріоритет, тому задайте `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри список deny

- Перевірте порядок фільтрації інструментів: global → agent → sandbox → subagent
- Кожен рівень може лише додатково обмежувати, а не повертати дозвіл
- Перевірте через логи: `[tools] filtering tools for agent:${agentId}`

### Контейнер не ізольований на рівні агента

- Задайте `scope: "agent"` у конфігурації sandbox для окремого агента
- Типове значення — `"session"`, що створює один контейнер на сесію

---

## Пов’язане

- [Ізоляція](/uk/gateway/sandboxing) -- повний довідник sandbox (режими, області, backend, image)
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- діагностика «чому це заблоковано?»
- [Режим Elevated](/uk/tools/elevated)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Конфігурація Sandbox](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Керування сесіями](/uk/concepts/session)
