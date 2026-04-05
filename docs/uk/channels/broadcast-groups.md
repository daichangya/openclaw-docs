---
read_when:
    - Налаштування груп трансляції
    - Налагодження відповідей кількох агентів у WhatsApp
status: experimental
summary: Транслювання повідомлення WhatsApp кільком агентам
title: Групи трансляції
x-i18n:
    generated_at: "2026-04-05T17:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# Групи трансляції

**Статус:** Експериментально  
**Версія:** Додано у 2026.1.9

## Огляд

Групи трансляції дають змогу кільком агентам одночасно обробляти те саме повідомлення й відповідати на нього. Це дає змогу створювати спеціалізовані команди агентів, які працюють разом в одній групі або DM WhatsApp — і все це з використанням одного номера телефону.

Поточна сфера дії: **лише WhatsApp** (вебканал).

Групи трансляції оцінюються після списків дозволу каналу та правил активації групи. У групах WhatsApp це означає, що трансляції відбуваються тоді, коли OpenClaw зазвичай відповів би (наприклад, на згадування, залежно від ваших налаштувань групи).

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

Кожен агент обробляє те саме повідомлення й надає свою спеціалізовану перспективу.

### 2. Підтримка кількох мов

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

## Конфігурація

### Базове налаштування

Додайте верхньорівневий розділ `broadcast` (поруч із `bindings`). Ключами є peer ID WhatsApp:

- групові чати: JID групи (наприклад, `120363403215116621@g.us`)
- DM: номер телефону у форматі E.164 (наприклад, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** Коли OpenClaw мав би відповісти в цьому чаті, він запустить усіх трьох агентів.

### Стратегія обробки

Керуйте тим, як агенти обробляють повідомлення:

#### Паралельно (типово)

Усі агенти обробляють одночасно:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Послідовно

Агенти обробляють по черзі (кожен чекає, поки завершиться попередній):

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
2. **Перевірка трансляції**: система перевіряє, чи є peer ID у `broadcast`
3. **Якщо є у списку трансляції**:
   - Усі перелічені агенти обробляють повідомлення
   - Кожен агент має власний ключ сесії та ізольований контекст
   - Агенти обробляють паралельно (типово) або послідовно
4. **Якщо немає у списку трансляції**:
   - Застосовується звичайна маршрутизація (перше binding, що збіглося)

Примітка: групи трансляції не обходять списки дозволу каналу або правила активації групи (згадування/команди тощо). Вони змінюють лише _які агенти запускаються_, коли повідомлення відповідає умовам для обробки.

### Ізоляція сесій

Кожен агент у групі трансляції підтримує повністю окремі:

- **Ключі сесій** (`agent:alfred:whatsapp:group:120363...` проти `agent:baerbel:whatsapp:group:120363...`)
- **Історію розмови** (агент не бачить повідомлень інших агентів)
- **Робочий простір** (окремі ізольовані середовища, якщо налаштовано)
- **Доступ до інструментів** (різні списки allow/deny)
- **Пам’ять/контекст** (окремі IDENTITY.md, SOUL.md тощо)
- **Буфер контексту групи** (останні групові повідомлення, що використовуються для контексту) є спільним для кожного peer, тож усі агенти трансляції бачать однаковий контекст під час запуску

Це дає змогу кожному агенту мати:

- Різні особистості
- Різний доступ до інструментів (наприклад, лише читання чи читання-запис)
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

### 1. Зберігайте вузьку спеціалізацію агентів

Проєктуйте кожного агента з одним чітким обов’язком:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Добре:** Кожен агент має одне завдання  
❌ **Погано:** Один універсальний агент "dev-helper"

### 2. Використовуйте зрозумілі назви

Назва має чітко вказувати, що робить кожен агент:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Налаштовуйте різний доступ до інструментів

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

За великої кількості агентів враховуйте таке:

- Використовуйте `"strategy": "parallel"` (типово) для швидкості
- Обмежуйте групи трансляції до 5–10 агентів
- Використовуйте швидші моделі для простіших агентів

### 5. Коректно обробляйте збої

Агенти збоять незалежно один від одного. Помилка одного агента не блокує інших:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Сумісність

### Провайдери

Групи трансляції наразі працюють із:

- ✅ WhatsApp (реалізовано)
- 🚧 Telegram (заплановано)
- 🚧 Discord (заплановано)
- 🚧 Slack (заплановано)

### Маршрутизація

Групи трансляції працюють разом з наявною маршрутизацією:

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
- `GROUP_B`: відповідають agent1 І agent2 (трансляція)

**Пріоритет:** `broadcast` має вищий пріоритет за `bindings`.

## Усунення несправностей

### Агенти не відповідають

**Перевірте:**

1. Ідентифікатори агентів існують у `agents.list`
2. Формат peer ID правильний (наприклад, `120363403215116621@g.us`)
3. Агенти не перебувають у списках deny

**Налагодження:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Відповідає лише один агент

**Причина:** peer ID може бути в `bindings`, але не в `broadcast`.

**Виправлення:** Додайте його до конфігурації трансляції або видаліть із bindings.

### Проблеми з продуктивністю

**Якщо повільно за великої кількості агентів:**

- Зменште кількість агентів на групу
- Використовуйте легші моделі (sonnet замість opus)
- Перевірте час запуску ізольованого середовища

## Приклади

### Приклад 1: Команда перевірки коду

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
- security-scanner: "⚠️ Уразливість SQL-ін’єкції в рядку 12"
- test-coverage: "Покриття становить 45%, бракує тестів для випадків помилок"
- docs-checker: "Бракує docstring для функції `process_data`"

### Приклад 2: Підтримка кількох мов

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
  - `"parallel"` (типово): усі агенти обробляють одночасно
  - `"sequential"`: агенти обробляють у порядку масиву
- `[peerId]`: JID групи WhatsApp, номер E.164 або інший peer ID
  - Значення: масив ідентифікаторів агентів, які мають обробляти повідомлення

## Обмеження

1. **Максимальна кількість агентів:** жорсткого обмеження немає, але 10+ агентів можуть працювати повільно
2. **Спільний контекст:** агенти не бачать відповіді один одного (за задумом)
3. **Порядок повідомлень:** паралельні відповіді можуть надходити в будь-якому порядку
4. **Обмеження швидкості:** усі агенти враховуються в обмеженнях швидкості WhatsApp

## Майбутні покращення

Заплановані можливості:

- [ ] Режим спільного контексту (агенти бачать відповіді один одного)
- [ ] Координація агентів (агенти можуть подавати сигнали один одному)
- [ ] Динамічний вибір агентів (вибір агентів на основі вмісту повідомлення)
- [ ] Пріоритети агентів (деякі агенти відповідають раніше за інших)

## Див. також

- [Конфігурація кількох агентів](/tools/multi-agent-sandbox-tools)
- [Конфігурація маршрутизації](/channels/channel-routing)
- [Керування сесіями](/concepts/session)
