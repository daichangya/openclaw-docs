---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому інструмент заблоковано: середовище виконання sandbox, політика дозволу/заборони інструментів і шлюзи підвищеного виконання'
title: Sandbox проти політики інструментів проти підвищеного виконання
x-i18n:
    generated_at: "2026-04-20T18:29:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox проти політики інструментів проти підвищеного виконання

OpenClaw має три пов’язані (але різні) механізми керування:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) визначає, **де запускаються інструменти** (бекенд sandbox чи хост).
2. **Політика інструментів** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) визначає, **які інструменти доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **лише для exec аварійний обхід** для запуску поза sandbox, коли ви працюєте в sandbox (`gateway` за замовчуванням або `node`, якщо ціль exec налаштована на `node`).

## Швидка діагностика

Використовуйте інспектор, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він показує:

- ефективний режим/область sandbox/доступ до робочого простору
- чи сесія зараз працює в sandbox (main проти non-main)
- ефективні правила allow/deny для інструментів у sandbox (і чи вони надійшли від агента/глобально/за замовчуванням)
- шлюзи elevated і шляхи ключів для виправлення

## Sandbox: де запускаються інструменти

Робота sandbox керується через `agents.defaults.sandbox.mode`:

- `"off"`: усе запускається на хості.
- `"non-main"`: у sandbox запускаються лише non-main сесії (типовий «сюрприз» для груп/каналів).
- `"all"`: у sandbox запускається все.

Повну матрицю дивіться в [Sandboxing](/uk/gateway/sandboxing) (область, монтування робочого простору, образи).

### Bind mounts (швидка перевірка безпеки)

- `docker.binds` _прориває_ файлову систему sandbox: усе, що ви змонтуєте, буде видиме всередині контейнера з указаним режимом (`:ro` або `:rw`).
- За замовчуванням використовується читання-запис, якщо режим не вказано; для вихідного коду/секретів краще використовувати `:ro`.
- `scope: "shared"` ігнорує bind-монтування для окремих агентів (застосовуються лише глобальні bind-монтування).
- OpenClaw двічі перевіряє джерела bind-монтувань: спочатку на нормалізованому шляху джерела, а потім повторно після розв’язання через найглибший наявний батьківський каталог. Обхід через батьківські symlink не дозволяє обійти перевірки заблокованих шляхів або дозволених коренів.
- Навіть неіснуючі кінцеві шляхи все одно безпечно перевіряються. Якщо `/workspace/alias-out/new-file` розв’язується через symlink-батьківський каталог у заблокований шлях або за межі налаштованих дозволених коренів, bind-монтування буде відхилено.
- Монтування `/var/run/docker.sock` фактично передає керування хостом sandbox; робіть це лише свідомо.
- Доступ до робочого простору (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind-монтування.

## Політика інструментів: які інструменти існують/можуть викликатися

Важливі два рівні:

- **Профіль інструментів**: `tools.profile` і `agents.list[].tools.profile` (базовий список дозволених)
- **Профіль інструментів провайдера**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/персональна політика інструментів агента**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика інструментів провайдера**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика інструментів sandbox** (застосовується лише в sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Базові правила:

- `deny` завжди має пріоритет.
- Якщо `allow` не порожній, усе інше вважається заблокованим.
- Політика інструментів — це жорстке обмеження: `/exec` не може перевизначити заборонений інструмент `exec`.
- `/exec` лише змінює налаштування сесії за замовчуванням для авторизованих відправників; він не надає доступ до інструментів.
  Ключі інструментів провайдера можуть приймати або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

### Групи інструментів (скорочення)

Політики інструментів (глобальні, агентські, sandbox) підтримують записи `group:*`, які розгортаються в кілька інструментів:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Доступні групи:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` також приймається як
  псевдонім для `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: усі вбудовані інструменти OpenClaw (не включає Plugin провайдерів)

## Elevated: exec-only «запуск на хості»

Elevated **не** надає додаткових інструментів; він впливає лише на `exec`.

- Якщо ви в sandbox, `/elevated on` (або `exec` з `elevated: true`) запускає виконання поза sandbox (схвалення все одно можуть застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити схвалення exec для сесії.
- Якщо ви вже працюєте напряму, elevated фактично нічого не змінює (але все одно проходить через шлюзи).
- Elevated **не** має області дії Skills і **не** перевизначає правила allow/deny для інструментів.
- Elevated не надає довільних міжхостових перевизначень із `host=auto`; він дотримується звичайних правил цілі exec і лише зберігає `node`, якщо налаштована/сесійна ціль уже встановлена як `node`.
- `/exec` — це окремий механізм від elevated. Він лише коригує стандартні параметри exec для сесії для авторизованих відправників.

Шлюзи:

- Увімкнення: `tools.elevated.enabled` (і, за потреби, `agents.list[].tools.elevated.enabled`)
- Списки дозволених відправників: `tools.elevated.allowFrom.<provider>` (і, за потреби, `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Elevated Mode](/uk/tools/elevated).

## Типові виправлення «sandbox jail»

### «Інструмент X заблоковано політикою інструментів sandbox»

Ключі для виправлення (виберіть один):

- Вимкнути sandbox: `agents.defaults.sandbox.mode=off` (або для окремого агента `agents.list[].sandbox.mode=off`)
- Дозволити інструмент усередині sandbox:
  - видалити його з `tools.sandbox.tools.deny` (або для окремого агента `agents.list[].tools.sandbox.tools.deny`)
  - або додати його до `tools.sandbox.tools.allow` (або до allow для окремого агента)

### «Я думав, що це main, чому воно в sandbox?»

У режимі `"non-main"` ключі груп/каналів _не_ є main. Використовуйте ключ main-сесії (показується через `sandbox explain`) або перемкніть режим на `"off"`.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox (режими, області, бекенди, образи)
- [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів і пріоритетність
- [Elevated Mode](/uk/tools/elevated)
