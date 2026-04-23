---
read_when:
    - Використання або змінення інструмента Exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента Exec, режими stdin і підтримка TTY
title: Інструмент Exec
x-i18n:
    generated_at: "2026-04-23T23:07:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e2a7fc3b0570d59a6694d0a4ff9def1a5721c8a3d13abf7f947e7ea835535b3
    source_path: tools/exec.md
    workflow: 15
---

Запускає shell-команди у workspace. Підтримує виконання у foreground + background через `process`.
Якщо `process` заборонено, `exec` виконується синхронно й ігнорує `yieldMs`/`background`.
Background-сесії мають область дії в межах агента; `process` бачить лише сесії того самого агента.

## Параметри

<ParamField path="command" type="string" required>
Команда shell для запуску.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Робочий каталог для команди.
</ParamField>

<ParamField path="env" type="object">
Перевизначення середовища у форматі ключ/значення, об’єднані поверх успадкованого середовища.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Автоматично переводить команду в background після цієї затримки (мс).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Негайно переводить команду в background замість очікування `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Завершити команду після такої кількості секунд.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Запускати в псевдотерміналі, якщо доступно. Використовуйте для CLI, що працюють лише з TTY, coding-агентів і terminal UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Де виконувати. `auto` перетворюється на `sandbox`, коли активний runtime sandbox, і на `gateway` в іншому разі.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Режим примусового застосування для виконання `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Поведінка запиту погодження для виконання `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/назва Node, коли `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Запитати elevated mode — вийти із sandbox на налаштований шлях хоста. `security=full` примусово застосовується лише тоді, коли elevated перетворюється на `full`.
</ParamField>

Примітки:

- `host` типово дорівнює `auto`: sandbox, коли runtime sandbox активний для сесії, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не wildcard. Виклик `host=node` для окремого запиту дозволено з `auto`; виклик `host=gateway` для окремого запиту дозволено лише тоді, коли runtime sandbox неактивний.
- Без додаткового config `host=auto` усе одно «просто працює»: без sandbox він перетворюється на `gateway`; з активним sandbox залишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, коли `tools.exec.host=node` (або типовим значенням сесії є `host=node`). Це доступно лише тоді, коли для поточної сесії/провайдера ввімкнено elevated access.
- Погодження `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- `node` потребує pairied Node (companion app або headless-хост Node).
- Якщо доступно кілька Node, задайте `exec.node` або `tools.exec.node`, щоб вибрати одну.
- `exec host=node` — це єдиний шлях виконання shell для Node; застарілу обгортку `nodes.run` видалено.
- На хостах не з Windows exec використовує `SHELL`, якщо його задано; якщо `SHELL` — це `fish`, він надає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникнути несумісних із fish скриптів, а потім повертається до `SHELL`, якщо жодного з них немає.
- На хостах Windows exec надає перевагу пошуку PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім повертається до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення loader (`LD_*`/`DYLD_*`), щоб
  запобігти підміні бінарних файлів або ін’єкції коду.
- OpenClaw задає `OPENCLAW_SHELL=exec` у середовищі запущеної команди (включно з PTY і виконанням у sandbox), щоб правила shell/profile могли визначати контекст exec-tool.
- Важливо: sandboxing **вимкнений типово**. Якщо sandboxing вимкнено, неявний `host=auto`
  перетворюється на `gateway`. Явний `host=sandbox` усе одно завершується в режимі fail-closed замість тихого
  виконання на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` з погодженнями.
- Preflight-перевірки скриптів (для типових помилок синтаксису shell у Python/Node) перевіряють лише файли в межах
  ефективної межі `workdir`. Якщо шлях до скрипта перетворюється на такий, що виходить за межі `workdir`, preflight для
  цього файла пропускається.
- Для довготривалої роботи, яка починається зараз, запустіть її один раз і покладайтеся на автоматичне
  пробудження після завершення, коли воно ввімкнене і команда виводить щось або завершується помилкою.
  Використовуйте `process` для журналів, статусу, введення або втручання; не імітуйте
  планування через цикли sleep, цикли timeout або повторне polling.
- Для роботи, яка має відбутися пізніше або за розкладом, використовуйте cron замість
  шаблонів sleep/delay через `exec`.

## Config

- `tools.exec.notifyOnExit` (типово: true): якщо true, переведені в background exec-сесії ставлять у чергу system event і запитують Heartbeat під час завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): видає одне сповіщення “running”, коли exec із погодженням виконується довше за цей час (0 вимикає).
- `tools.exec.host` (типово: `auto`; перетворюється на `sandbox`, коли runtime sandbox активний, інакше на `gateway`)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway + node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання host exec без погодження є типовим для gateway + node. Якщо вам потрібна поведінка з погодженнями/allowlist, посильте і `tools.exec.*`, і політику хоста `~/.openclaw/exec-approvals.json`; див. [Погодження Exec](/uk/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із типових значень політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо хочете примусово використовувати маршрутизацію gateway або node, задайте `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` host exec напряму дотримується налаштованої policy; немає додаткового евристичного prefilter заплутування команд або шару відхилення script-preflight.
- `tools.exec.node` (типово: не задано)
- `tools.exec.strictInlineEval` (типово: false): якщо true, форми inline eval інтерпретаторів, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди потребують явного погодження. `allow-always` усе ще може зберігати довіру для безпечних викликів інтерпретатора/скрипта, але форми inline-eval усе одно запитують щоразу.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише для stdin, які можуть працювати без явних записів у allowlist. Докладніше про поведінку див. в [Safe bins](/uk/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів safeBins. Записи `PATH` ніколи не вважаються надійними автоматично. Вбудовані типові значення — `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова власна policy argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Приклад:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Обробка PATH

- `host=gateway`: об’єднує `PATH` вашого login-shell із середовищем exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам daemon усе одно працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) всередині контейнера, тому `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження profile через внутрішню env var (без shell-інтерполяції);
  `tools.exec.pathPrepend` теж застосовується тут.
- `host=node`: на Node надсилаються лише не заблоковані перевизначення env, які ви передаєте. Перевизначення `env.PATH`
  відхиляються для виконання на хості й ігноруються Node-хостами. Якщо вам потрібні додаткові записи PATH на Node,
  налаштуйте середовище служби хоста Node (systemd/launchd) або встановіть інструменти в стандартні місця.

Прив’язка Node для окремого агента (використовуйте індекс списку агентів у config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб задати **типові значення для поточної сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` обробляється лише для **авторизованих відправників** (allowlist/pairing каналу плюс `commands.useAccessGroups`).
Вона оновлює **лише стан сесії** і не записує config. Щоб жорстко вимкнути exec, забороніть його через tool
policy (`tools.deny: ["exec"]` або для окремого агента). Погодження хоста все одно застосовуються, якщо ви явно не задали
`security=full` і `ask=off`.

## Погодження Exec (companion app / host Node)

Sandboxed-агенти можуть вимагати погодження для кожного запиту, перш ніж `exec` виконуватиметься на хості gateway або node.
Див. [Погодження Exec](/uk/tools/exec-approvals) для policy, allowlist і потоку UI.

Коли потрібні погодження, інструмент exec одразу повертає
`status: "approval-pending"` та id погодження. Після погодження (або відхилення / завершення за тайм-аутом)
Gateway видає system events (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, видається одне сповіщення `Exec running`.
На каналах із власними картками/кнопками погодження агент має спочатку покладатися
саме на цей native UI й додавати ручну команду `/approve` лише тоді, коли результат
інструмента прямо каже, що погодження в чаті недоступні або ручне погодження є
єдиним шляхом.

## Allowlist + safe bins

Ручне застосування allowlist зіставляється **лише з перетвореними шляхами до бінарних файлів** (без зіставлення за basename). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент pipeline є
в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і редиректи відхиляються в
режимі allowlist, якщо тільки кожен сегмент верхнього рівня не відповідає allowlist (включно з safe bins).
Редиректи все ще не підтримуються.
Довготривала довіра `allow-always` не обходить це правило: ланцюжкова команда все одно потребує, щоб кожен
сегмент верхнього рівня відповідав.

`autoAllowSkills` — це окремий зручний шлях у погодженнях exec. Це не те саме, що
ручні записи шляхів в allowlist. Для суворої явної довіри тримайте `autoAllowSkills` вимкненим.

Використовуйте ці два механізми для різних завдань:

- `tools.exec.safeBins`: малі stream-фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові надійні каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна policy argv для власних safe bin.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не використовуйте `safeBins` як загальний allowlist і не додавайте бінарні файли інтерпретаторів/runtime (наприклад `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте ввімкненими запити погодження.
`openclaw security audit` попереджає, коли записи `safeBins` для інтерпретаторів/runtime не мають явних профілів, а `openclaw doctor --fix` може згенерувати відсутні записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно додаєте назад у `safeBins` бінарні файли з широкою поведінкою, такі як `jq`.
Якщо ви явно додаєте інтерпретатори в allowlist, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе одно вимагали нового погодження.

Повні подробиці policy й приклади див. в [Погодженнях Exec](/uk/tools/exec-approvals#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals#safe-bins-versus-allowlist).

## Приклади

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling призначене для статусу на вимогу, а не для циклів очікування. Якщо автоматичне пробудження
після завершення ввімкнене, команда може пробудити сесію, коли виведе щось або завершиться помилкою.

Надсилання клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Надіслати (лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Вставити (типово з bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## `apply_patch`

`apply_patch` — це підінструмент `exec` для структурованих багатофайлових редагувань.
Він типово ввімкнений для моделей OpenAI і OpenAI Codex. Використовуйте config лише
тоді, коли хочете вимкнути його або обмежити певними моделями:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Примітки:

- Доступний лише для моделей OpenAI/OpenAI Codex.
- Tool policy усе одно застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Config розташований у `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово дорівнює `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово дорівнює `true` (обмеження workspace). Установлюйте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом workspace.

## Пов’язане

- [Погодження Exec](/uk/tools/exec-approvals) — бар’єри погодження для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — запуск команд у sandboxed-середовищах
- [Background Process](/uk/gateway/background-process) — довготривалий exec та інструмент process
- [Безпека](/uk/gateway/security) — tool policy та elevated access
