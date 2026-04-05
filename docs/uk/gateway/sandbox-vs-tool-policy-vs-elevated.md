---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому інструмент заблоковано: runtime sandbox, політика allow/deny інструментів і механізми elevated для exec'
title: Sandbox vs Tool Policy vs Elevated
x-i18n:
    generated_at: "2026-04-05T18:04:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 331f5b2f0d5effa1320125d9f29948e16d0deaffa59eb1e4f25a63481cbe22d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs Tool Policy vs Elevated

OpenClaw має три пов’язані (але різні) механізми керування:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) визначає, **де запускаються інструменти** (Docker чи хост).
2. **Політика інструментів** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) визначає, **які інструменти доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **лише для exec механізм обходу**, щоб запускати поза sandbox, коли ви перебуваєте в sandbox (`gateway` типово або `node`, коли exec target налаштовано як `node`).

## Швидке налагодження

Використовуйте inspector, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він показує:

- ефективний режим/scope/workspace access sandbox
- чи сесія зараз працює в sandbox (main чи non-main)
- ефективний allow/deny інструментів sandbox (і чи походить він від agent/global/default)
- механізми elevated і ключі шляхів fix-it

## Sandbox: де запускаються інструменти

Sandboxing керується через `agents.defaults.sandbox.mode`:

- `"off"`: усе запускається на хості.
- `"non-main"`: у sandbox працюють лише не-main сесії (поширений “сюрприз” для groups/channels).
- `"all"`: усе працює в sandbox.

Повну матрицю (scope, монтування workspace, images) див. у [Sandboxing](/gateway/sandboxing).

### Bind mounts (швидка перевірка безпеки)

- `docker.binds` _пробиває_ файлову систему sandbox: усе, що ви монтуєте, стає видимим усередині контейнера з указаним режимом (`:ro` або `:rw`).
- Якщо не вказати режим, типово використовується read-write; для source/secrets віддавайте перевагу `:ro`.
- `scope: "shared"` ігнорує bind для кожного агента окремо (застосовуються лише глобальні bind).
- OpenClaw двічі перевіряє джерела bind: спочатку на нормалізованому шляху джерела, потім ще раз після визначення через найглибший наявний батьківський каталог. Вихід через symlink-батьківський шлях не обходить перевірки blocked-path або allowed-root.
- Неіснуючі leaf-шляхи все одно безпечно перевіряються. Якщо `/workspace/alias-out/new-file` визначається через symlink-батьківський каталог у заблокований шлях або поза межами налаштованих allowed roots, bind буде відхилено.
- Монтування `/var/run/docker.sock` фактично передає контроль над хостом у sandbox; робіть це лише свідомо.
- Доступ до workspace (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind.

## Політика інструментів: які інструменти існують/можна викликати

Важливі два рівні:

- **Профіль інструментів**: `tools.profile` і `agents.list[].tools.profile` (базовий allowlist)
- **Профіль інструментів провайдера**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/для кожного агента окремо політика інструментів**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика інструментів провайдера**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика інструментів sandbox** (застосовується лише в sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Основні правила:

- `deny` завжди має перевагу.
- Якщо `allow` не порожній, усе інше вважається заблокованим.
- Політика інструментів — це жорстке обмеження: `/exec` не може перевизначити заборонений інструмент `exec`.
- `/exec` лише змінює типові значення сесії для авторизованих відправників; він не надає доступ до інструментів.
  Ключі інструментів провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

### Групи інструментів (скорочення)

Політики інструментів (глобальні, для агента, для sandbox) підтримують записи `group:*`, які розгортаються в кілька інструментів:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)
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

## Elevated: механізм "запустити на хості" лише для exec

Elevated **не** надає додаткових інструментів; він впливає лише на `exec`.

- Якщо ви в sandbox, `/elevated on` (або `exec` з `elevated: true`) запускається поза sandbox (при цьому підтвердження можуть усе ще застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити підтвердження exec для сесії.
- Якщо ви вже працюєте напряму, elevated фактично нічого не змінює (але все одно керується механізмами доступу).
- Elevated **не** обмежується Skills і **не** перевизначає allow/deny інструментів.
- Elevated не надає довільних міжхостових перевизначень із `host=auto`; він дотримується звичайних правил exec target і зберігає `node` лише тоді, коли налаштований/сесійний target уже дорівнює `node`.
- `/exec` — це окремий механізм від elevated. Він лише налаштовує типові параметри exec для сесії для авторизованих відправників.

Механізми доступу:

- Увімкнення: `tools.elevated.enabled` (і, за потреби, `agents.list[].tools.elevated.enabled`)
- Allowlist відправників: `tools.elevated.allowFrom.<provider>` (і, за потреби, `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Elevated Mode](/tools/elevated).

## Типові виправлення "sandbox jail"

### "Tool X blocked by sandbox tool policy"

Ключі fix-it (виберіть один):

- Вимкнути sandbox: `agents.defaults.sandbox.mode=off` (або для конкретного агента `agents.list[].sandbox.mode=off`)
- Дозволити інструмент усередині sandbox:
  - прибрати його з `tools.sandbox.tools.deny` (або для конкретного агента `agents.list[].tools.sandbox.tools.deny`)
  - або додати його до `tools.sandbox.tools.allow` (або до allow для агента)

### "I thought this was main, why is it sandboxed?"

У режимі `"non-main"` ключі group/channel _не_ є main. Використовуйте ключ main session (його показує `sandbox explain`) або змініть режим на `"off"`.

## Див. також

- [Sandboxing](/gateway/sandboxing) -- повний довідник із sandbox (режими, scope, backend, images)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- перевизначення для кожного агента окремо та пріоритетність
- [Elevated Mode](/tools/elevated)
