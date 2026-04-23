---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому інструмент заблоковано: середовище виконання sandbox, політика дозволу/заборони інструментів і шлюзи elevated exec'
title: Sandbox проти політики інструментів проти elevated
x-i18n:
    generated_at: "2026-04-23T19:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfc54cdb1adbe37a2cfa837560d3d3862c1aa2732dcb8a73377114d4b873e569
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox проти політики інструментів проти elevated

В OpenClaw є три пов’язані (але різні) механізми керування:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) визначає, **де виконуються інструменти** (бекенд sandbox чи хост).
2. **Політика інструментів** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) визначає, **які інструменти доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **escape hatch лише для exec**, щоб запускати поза sandbox, коли ви працюєте в sandbox (`gateway` типово або `node`, якщо ціль exec налаштована як `node`).

## Швидке налагодження

Використовуйте inspector, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він виводить:

- ефективний режим/область sandbox/доступ до workspace
- чи перебуває сесія зараз у sandbox (main чи non-main)
- ефективний allow/deny інструментів у sandbox (і чи це походить від agent/global/default)
- шлюзи elevated і шляхи ключів для виправлення

## Sandbox: де виконуються інструменти

Sandboxing керується через `agents.defaults.sandbox.mode`:

- `"off"`: усе виконується на хості.
- `"non-main"`: у sandbox працюють лише non-main сесії (типовий «сюрприз» для груп/каналів).
- `"all"`: усе працює в sandbox.

Див. [Sandboxing](/uk/gateway/sandboxing) для повної матриці (область, монтування workspace, зображення).

### Bind mounts (швидка перевірка безпеки)

- `docker.binds` _прорізає_ файлову систему sandbox: усе, що ви монтуєте, видно всередині контейнера з указаним режимом (`:ro` або `:rw`).
- Типове значення — read-write, якщо ви не вказали режим; для source/secrets краще `:ro`.
- `scope: "shared"` ігнорує bind-и для окремих агентів (застосовуються лише глобальні bind-и).
- OpenClaw двічі перевіряє джерела bind: спочатку за нормалізованим шляхом джерела, а потім ще раз після розв’язання через найглибшого наявного предка. Виходи через symlink-parent не обходять перевірки blocked-path або allowed-root.
- Неіснуючі leaf-шляхи також усе одно безпечно перевіряються. Якщо `/workspace/alias-out/new-file` розв’язується через symlinked parent до заблокованого шляху або за межі налаштованих allowed roots, bind буде відхилено.
- Монтування `/var/run/docker.sock` фактично передає sandbox керування хостом; робіть це лише навмисно.
- Доступ до workspace (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind.

## Політика інструментів: які інструменти існують/можна викликати

Важливі два рівні:

- **Профіль інструментів**: `tools.profile` і `agents.list[].tools.profile` (базовий allowlist)
- **Профіль інструментів провайдера**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/поагентна політика інструментів**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика інструментів провайдера**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика інструментів sandbox** (застосовується лише в sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Основні правила:

- `deny` завжди має пріоритет.
- Якщо `allow` непорожній, усе інше вважається заблокованим.
- Політика інструментів — це жорстка межа: `/exec` не може перевизначити заборонений інструмент `exec`.
- `/exec` лише змінює типові параметри сесії для авторизованих відправників; він не надає доступ до інструментів.
  Ключі інструментів провайдера можуть приймати або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.5`).

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` приймається як
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
- `group:openclaw`: усі вбудовані інструменти OpenClaw (без provider plugins)

## Elevated: exec-only «запуск на хості»

Elevated **не** надає додаткових інструментів; він впливає лише на `exec`.

- Якщо ви в sandbox, `/elevated on` (або `exec` з `elevated: true`) запускає поза sandbox (схвалення все одно можуть застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити схвалення exec для сесії.
- Якщо ви вже працюєте напряму, elevated фактично нічого не змінює (але все одно проходить через шлюзи).
- Elevated **не** обмежується Skills і **не** перевизначає allow/deny інструментів.
- Elevated не надає довільних міжхостових перевизначень із `host=auto`; він дотримується звичайних правил цілі exec і лише зберігає `node`, коли налаштована/сесійна ціль уже є `node`.
- `/exec` окремий від elevated. Він лише коригує параметри exec для конкретної сесії для авторизованих відправників.

Шлюзи:

- Увімкнення: `tools.elevated.enabled` (і за потреби `agents.list[].tools.elevated.enabled`)
- Allowlist-и відправників: `tools.elevated.allowFrom.<provider>` (і за потреби `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Elevated Mode](/uk/tools/elevated).

## Типові виправлення «sandbox jail»

### «Інструмент X заблоковано політикою інструментів sandbox»

Ключі для виправлення (виберіть один):

- Вимкнути sandbox: `agents.defaults.sandbox.mode=off` (або для окремого агента `agents.list[].sandbox.mode=off`)
- Дозволити інструмент усередині sandbox:
  - видалити його з `tools.sandbox.tools.deny` (або з `agents.list[].tools.sandbox.tools.deny` для агента)
  - або додати його до `tools.sandbox.tools.allow` (або до allow для агента)

### «Я думав, що це main, чому воно в sandbox?»

У режимі `"non-main"` ключі group/channel _не_ є main. Використовуйте ключ main-сесії (показується в `sandbox explain`) або перемкніть режим на `"off"`.

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник по sandbox (режими, області, бекенди, зображення)
- [Sandbox і інструменти для кількох агентів](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для окремих агентів і пріоритетність
- [Elevated Mode](/uk/tools/elevated)
