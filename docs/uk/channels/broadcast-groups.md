---
read_when:
    - Налаштування груп розсилки
    - Налагодження відповідей кількох агентів у WhatsApp
status: experimental
summary: Надіслати повідомлення WhatsApp кільком агентам
title: Групи розсилки
x-i18n:
    generated_at: "2026-04-23T22:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 687c6e608901c84b215ada096c40e603c1cde360b4d9ebcf4426ca3bdbd50ae4
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Статус:** Експериментально  
**Версія:** Додано в 2026.1.9

## Огляд

Групи розсилки дають змогу кільком агентам одночасно обробляти те саме повідомлення і відповідати на нього. Це дозволяє створювати спеціалізовані команди агентів, які працюють разом в одній групі WhatsApp або в DM — і все це з використанням одного номера телефону.

Поточна сфера дії: **лише WhatsApp** (вебканал).

Групи розсилки оцінюються після allowlist каналу та правил активації груп. У групах WhatsApp це означає, що розсилка відбувається тоді, коли OpenClaw зазвичай відповів би (наприклад, при згадуванні, залежно від ваших налаштувань групи).

## Варіанти використання

### 1. Спеціалізовані команди агентів

Розгорніть кількох агентів з атомарними, вузькоспрямованими обов’язками:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Кожен агент обробляє те саме повідомлення і надає свою спеціалізовану перспективу.

### 2. Багатомовна підтримка

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Робочі процеси забезпечення якості

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Автоматизація завдань

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Налаштування

### Базове налаштування

Додайте розділ верхнього рівня `broadcast` (поруч із `bindings`). Ключі — це peer id WhatsApp:

- групові чати: JID групи (наприклад, `120363403215116621@g.us`)
- DM: номер телефону у форматі E.164 (наприклад, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** коли OpenClaw мав би відповісти в цьому чаті, він запустить усіх трьох агентів.

### Стратегія обробки

Керуйте тим, як агенти обробляють повідомлення:

#### Паралельно (типово)

Усі агенти обробляють повідомлення одночасно:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Послідовно

Агенти обробляють повідомлення по черзі (кожен чекає завершення попереднього):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Повний приклад

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Як це працює

### Потік повідомлень

1. **Вхідне повідомлення** надходить у групу WhatsApp
2. **Перевірка розсилки**: система перевіряє, чи є peer ID у `broadcast`
3. **Якщо є в списку розсилки**:
   - Усі зазначені агенти обробляють повідомлення
   - Кожен агент має власний ключ сесії та ізольований контекст
   - Агенти працюють паралельно (типово) або послідовно
4. **Якщо немає в списку розсилки**:
   - Застосовується звичайна маршрутизація (перше binding, що збіглося)

Примітка: групи розсилки не обходять allowlist каналу або правила активації груп (згадки/команди/тощо). Вони змінюють лише _які агенти запускаються_, коли повідомлення відповідає умовам для обробки.

### Ізоляція сесій

Кожен агент у групі розсилки підтримує повністю окремі:

- **Ключі сесій** (`agent:alfred:whatsapp:group:120363...` проти `agent:baerbel:whatsapp:group:120363...`)
- **Історію розмови** (агент не бачить повідомлень інших агентів)
- **Робочий простір** (окремі sandbox, якщо налаштовано)
- **Доступ до інструментів** (різні списки дозволів/заборон)
- **Пам’ять/контекст** (окремі `IDENTITY.md`, `SOUL.md` тощо)
- **Буфер контексту групи** (нещодавні повідомлення групи, що використовуються як контекст) є спільним для peer, тому всі агенти розсилки бачать той самий контекст під час спрацювання

Це дозволяє кожному агенту мати:

- Різні особистості
- Різний доступ до інструментів (наприклад, лише читання або читання-запис)
- Різні моделі (наприклад, opus або sonnet)
- Різні встановлені Skills

### Приклад: ізольовані сесії

У групі `120363403215116621@g.us` з агентами `["alfred", "baerbel"]`:

**Контекст Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Контекст Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Рекомендовані практики

### 1. Нехай агенти будуть сфокусованими

Проєктуйте кожного агента з однією чіткою відповідальністю:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Добре:** кожен агент має одну задачу  
❌ **Погано:** один універсальний агент "dev-helper"

### 2. Використовуйте зрозумілі назви

Має бути очевидно, що робить кожен агент:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Налаштуйте різний доступ до інструментів

Надавайте агентам лише ті інструменти, які їм потрібні:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Лише читання
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Читання-запис
    }
  }
}
```

### 4. Відстежуйте продуктивність

Якщо агентів багато, врахуйте таке:

- Використовуйте `"strategy": "parallel"` (типово) для швидкості
- Обмежуйте групи розсилки до 5–10 агентів
- Використовуйте швидші моделі для простіших агентів

### 5. Коректно обробляйте збої

Агенти завершуються з помилками незалежно один від одного. Помилка одного агента не блокує інших:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Сумісність

### Провайдери

Наразі групи розсилки працюють із:

- ✅ WhatsApp (реалізовано)
- 🚧 Telegram (заплановано)
- 🚧 Discord (заплановано)
- 🚧 Slack (заплановано)

### Маршрутизація

Групи розсилки працюють разом з наявною маршрутизацією:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: відповідає лише alfred (звичайна маршрутизація)
- `GROUP_B`: відповідають agent1 І agent2 (розсилка)

**Пріоритет:** `broadcast` має вищий пріоритет, ніж `bindings`.

## Усунення неполадок

### Агенти не відповідають

**Перевірте:**

1. ID агентів існують у `agents.list`
2. Формат peer ID правильний (наприклад, `120363403215116621@g.us`)
3. Агенти не перебувають у списках заборони

**Налагодження:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Відповідає лише один агент

**Причина:** peer ID може бути в `bindings`, але не в `broadcast`.

**Виправлення:** додайте його до конфігурації розсилки або видаліть із bindings.

### Проблеми з продуктивністю

**Якщо повільно при великій кількості агентів:**

- Зменште кількість агентів у групі
- Використовуйте легші моделі (sonnet замість opus)
- Перевірте час запуску sandbox

## Приклади

### Приклад 1: команда для перевірки коду

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Користувач надсилає:** фрагмент коду  
**Відповіді:**

- code-formatter: "Виправлено відступи та додано підказки типів"
- security-scanner: "⚠️ Уразливість SQL injection у рядку 12"
- test-coverage: "Покриття становить 45%, бракує тестів для випадків помилок"
- docs-checker: "Відсутній docstring для функції `process_data`"

### Приклад 2: багатомовна підтримка

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Довідник API

### Схема конфігурації

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Поля

- `strategy` (необов’язково): як обробляти агентів
  - `"parallel"` (типово): усі агенти обробляють повідомлення одночасно
  - `"sequential"`: агенти обробляють повідомлення в порядку масиву
- `[peerId]`: JID групи WhatsApp, номер E.164 або інший peer ID
  - Значення: масив ID агентів, які мають обробляти повідомлення

## Обмеження

1. **Максимальна кількість агентів:** жорсткого обмеження немає, але 10+ агентів можуть працювати повільно
2. **Спільний контекст:** агенти не бачать відповіді один одного (за задумом)
3. **Порядок повідомлень:** паралельні відповіді можуть надходити в будь-якому порядку
4. **Ліміти частоти:** усі агенти враховуються в лімітах частоти WhatsApp

## Майбутні покращення

Заплановані можливості:

- [ ] Режим спільного контексту (агенти бачать відповіді один одного)
- [ ] Координація агентів (агенти можуть подавати сигнали один одному)
- [ ] Динамічний вибір агентів (вибір агентів на основі вмісту повідомлення)
- [ ] Пріоритети агентів (деякі агенти відповідають раніше за інших)

## Див. також

- [Конфігурація кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [Конфігурація маршрутизації](/uk/channels/channel-routing)
- [Керування сесіями](/uk/concepts/session)

## Пов’язане

- [Групи](/uk/channels/groups)
- [Маршрутизація каналу](/uk/channels/channel-routing)
- [Сполучення](/uk/channels/pairing)
