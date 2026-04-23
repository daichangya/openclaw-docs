---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Чому інструмент заблоковано: sandbox runtime, політика allow/deny для інструментів і запобіжники підвищеного exec'
title: Sandbox vs політика інструментів vs підвищений доступ
x-i18n:
    generated_at: "2026-04-23T23:00:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw має три пов’язані (але різні) механізми контролю:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) визначає, **де виконуються інструменти** (sandbox backend чи host).
2. **Політика інструментів** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) визначає, **які інструменти доступні/дозволені**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) — це **exec-only запасний вихід**, щоб виконувати поза sandbox, коли ви працюєте в sandbox (`gateway` за замовчуванням або `node`, коли exec target налаштовано на `node`).

## Швидка діагностика

Використовуйте inspector, щоб побачити, що OpenClaw _насправді_ робить:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Він виводить:

- ефективний sandbox mode/scope/workspace access
- чи сесія зараз працює в sandbox (main чи non-main)
- ефективні allow/deny sandbox-інструментів (і чи це походить від agent/global/default)
- запобіжники elevated і ключові шляхи для виправлення

## Sandbox: де виконуються інструменти

Sandboxing контролюється через `agents.defaults.sandbox.mode`:

- `"off"`: усе виконується на host.
- `"non-main"`: у sandbox працюють лише non-main сесії (типовий “сюрприз” для groups/channels).
- `"all"`: у sandbox працює все.

Див. [Sandboxing](/uk/gateway/sandboxing) для повної матриці (scope, монтування workspace, images).

### Bind mounts (швидка перевірка безпеки)

- `docker.binds` _пробиває_ файлову систему sandbox: усе, що ви монтуєте, буде видно всередині контейнера з указаним режимом (`:ro` або `:rw`).
- За замовчуванням використовується читання-запис, якщо режим не вказано; для коду/секретів надавайте перевагу `:ro`.
- `scope: "shared"` ігнорує bind для кожного агента (застосовуються лише глобальні bind).
- OpenClaw двічі перевіряє джерела bind: спочатку за нормалізованим шляхом джерела, потім ще раз після розв’язання через найглибший наявний батьківський елемент. Виходи через символічні посилання в батьківських каталогах не обходять перевірки blocked-path або allowed-root.
- Неіснуючі кінцеві шляхи теж перевіряються безпечно. Якщо `/workspace/alias-out/new-file` розв’язується через батьківський symlink до заблокованого шляху або за межі налаштованих allowed root, bind буде відхилено.
- Прив’язування `/var/run/docker.sock` фактично передає контроль над host у sandbox; робіть це лише свідомо.
- Доступ до workspace (`workspaceAccess: "ro"`/`"rw"`) не залежить від режимів bind.

## Політика інструментів: які інструменти існують/можна викликати

Мають значення два шари:

- **Профіль інструментів**: `tools.profile` і `agents.list[].tools.profile` (базовий allowlist)
- **Профіль інструментів provider**: `tools.byProvider[provider].profile` і `agents.list[].tools.byProvider[provider].profile`
- **Глобальна/агентська політика інструментів**: `tools.allow`/`tools.deny` і `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Політика інструментів provider**: `tools.byProvider[provider].allow/deny` і `agents.list[].tools.byProvider[provider].allow/deny`
- **Політика sandbox-інструментів** (застосовується лише в sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` і `agents.list[].tools.sandbox.tools.*`

Основні правила:

- `deny` завжди має пріоритет.
- Якщо `allow` не порожній, усе інше вважається заблокованим.
- Політика інструментів — це жорстке обмеження: `/exec` не може перевизначити заборонений інструмент `exec`.
- `/exec` змінює типові значення сесії лише для авторизованих відправників; він не надає доступу до інструментів.
  Ключі інструментів provider приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

### Групи інструментів (скорочення)

Політики інструментів (глобальна, агентська, sandbox) підтримують записи `group:*`, які розгортаються в кілька інструментів:

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

## Elevated: exec-only “виконання на host”

Elevated **не** надає додаткових інструментів; він впливає лише на `exec`.

- Якщо ви в sandbox, `/elevated on` (або `exec` з `elevated: true`) виконується поза sandbox (погодження все ще можуть застосовуватися).
- Використовуйте `/elevated full`, щоб пропустити погодження exec для сесії.
- Якщо ви вже працюєте напряму, elevated фактично нічого не змінює (але все одно контролюється запобіжниками).
- Elevated **не** має scope Skills і **не** перевизначає allow/deny інструментів.
- Elevated не надає довільних міжhostових перевизначень із `host=auto`; він дотримується звичайних правил exec target і лише зберігає `node`, коли налаштована/сесійна ціль уже є `node`.
- `/exec` відокремлений від elevated. Він лише змінює типові exec-параметри для сесії для авторизованих відправників.

Запобіжники:

- Увімкнення: `tools.elevated.enabled` (і за бажанням `agents.list[].tools.elevated.enabled`)
- Allowlist відправників: `tools.elevated.allowFrom.<provider>` (і за бажанням `agents.list[].tools.elevated.allowFrom.<provider>`)

Див. [Режим Elevated](/uk/tools/elevated).

## Типові виправлення “sandbox jail”

### “Tool X blocked by sandbox tool policy”

Ключі для виправлення (виберіть один):

- Вимкнути sandbox: `agents.defaults.sandbox.mode=off` (або для окремого агента `agents.list[].sandbox.mode=off`)
- Дозволити інструмент усередині sandbox:
  - вилучити його з `tools.sandbox.tools.deny` (або з `agents.list[].tools.sandbox.tools.deny` для агента)
  - або додати його до `tools.sandbox.tools.allow` (або до allow для агента)

### “I thought this was main, why is it sandboxed?”

У режимі `"non-main"` ключі group/channel _не_ є main. Використовуйте ключ main-сесії (його показує `sandbox explain`) або перемкніть режим на `"off"`.

## Пов’язане

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник із sandbox (режими, scope, backends, images)
- [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools) -- перевизначення для кожного агента та пріоритети
- [Режим Elevated](/uk/tools/elevated)
