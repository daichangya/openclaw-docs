---
read_when:
    - Використання або змінення інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента exec, режими stdin і підтримка TTY
title: Інструмент exec
x-i18n:
    generated_at: "2026-04-23T19:28:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: f191380330a86f8f0c291cde65062fe4146f20e6a6bd2169e1439f2518cd5194
    source_path: tools/exec.md
    workflow: 15
---

# Інструмент exec

Запускає shell-команди в workspace. Підтримує виконання на передньому плані й у фоні через `process`.
Якщо `process` заборонено, `exec` запускається синхронно й ігнорує `yieldMs`/`background`.
Фонові сесії мають область видимості в межах агента; `process` бачить лише сесії того самого агента.

## Параметри

- `command` (обов’язково)
- `workdir` (типово `cwd`)
- `env` (перевизначення key/value)
- `yieldMs` (типово 10000): автоматичний перехід у фон після затримки
- `background` (bool): негайно перевести у фон
- `timeout` (секунди, типово 1800): примусово завершити після спливу часу
- `pty` (bool): запускати в псевдотерміналі, коли доступно (CLI лише з TTY, агенти для кодування, terminal UI)
- `host` (`auto | sandbox | gateway | node`): де виконувати
- `security` (`deny | allowlist | full`): режим примусового застосування для `gateway`/`node`
- `ask` (`off | on-miss | always`): запити на схвалення для `gateway`/`node`
- `node` (string): id/ім’я node для `host=node`
- `elevated` (bool): запитати підвищений режим (вийти із sandbox на налаштований шлях хоста); `security=full` примусово встановлюється лише тоді, коли `elevated` розв’язується до `full`

Примітки:

- `host` типово дорівнює `auto`: sandbox, коли для сесії активний runtime sandbox, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не wildcard. Виклик `host=node` на рівні окремого запиту дозволено з `auto`; виклик `host=gateway` на рівні окремого запиту дозволено лише тоді, коли runtime sandbox не активний.
- Без додаткової конфігурації `host=auto` усе одно “просто працює”: без sandbox він розв’язується до `gateway`; з активним sandbox лишається в sandbox.
- `elevated` виводить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, коли `tools.exec.host=node` (або типове значення сесії — `host=node`). Воно доступне лише тоді, коли підвищений доступ увімкнено для поточної сесії/провайдера.
- Схвалення для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- `node` вимагає сполученої node (companion app або headless node host).
- Якщо доступно кілька node, установіть `exec.node` або `tools.exec.node`, щоб вибрати одну.
- `exec host=node` — єдиний шлях виконання shell-команд для node; застарілу обгортку `nodes.run` вилучено.
- На хостах не-Windows exec використовує `SHELL`, якщо його встановлено; якщо `SHELL` — це `fish`, він віддає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникати несумісних із fish скриптів, а потім повертається до `SHELL`, якщо жодного з них не існує.
- На хостах Windows exec спочатку намагається знайти PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім повертається до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення loader (`LD_*`/`DYLD_*`), щоб
  запобігти викраденню бінарників або впровадженню коду.
- OpenClaw установлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (включно з PTY та виконанням у sandbox), щоб правила shell/profile могли визначати контекст інструмента exec.
- Важливо: sandboxing **вимкнено за замовчуванням**. Якщо sandboxing вимкнено, неявний `host=auto`
  розв’язується до `gateway`. Явний `host=sandbox` усе одно аварійно завершується замість того, щоб мовчки
  запускатися на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` зі схваленнями.
- Попередні перевірки скриптів (для типових помилок shell-синтаксису Python/Node) перевіряють лише файли в межах
  ефективної межі `workdir`. Якщо шлях до скрипта розв’язується поза `workdir`, попередня перевірка для
  цього файла пропускається.
- Для довготривалої роботи, яка стартує зараз, запускайте її один раз і покладайтеся на автоматичне
  пробудження після завершення, коли його ввімкнено і команда виводить щось у stdout або завершується з помилкою.
  Використовуйте `process` для журналів, стану, введення або втручання; не імітуйте
  планування через sleep-цикли, timeout-цикли або повторне опитування.
- Для роботи, яка має відбутися пізніше або за розкладом, використовуйте Cron замість
  шаблонів sleep/delay через `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (типово: true): коли true, фонові сесії exec ставлять у чергу системну подію та запитують Heartbeat після завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): надсилає одне сповіщення “running”, коли exec із контролем схвалення працює довше за цей час (0 вимикає).
- `tools.exec.host` (типово: `auto`; розв’язується до `sandbox`, коли активний runtime sandbox, інакше до `gateway`)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway + node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання на хості без схвалення — типова поведінка для gateway + node. Якщо ви хочете схвалення/поведінку allowlist, посильте і `tools.exec.*`, і політику хоста в `~/.openclaw/exec-approvals.json`; див. [Схвалення exec](/uk/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із типових значень політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо ви хочете примусово маршрутизувати на gateway або node, установіть `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` exec на хості безпосередньо дотримується налаштованої політики; немає додаткового евристичного prefilter для обфускації команд чи шару відхилення script-preflight.
- `tools.exec.node` (типово: не встановлено)
- `tools.exec.strictInlineEval` (типово: false): коли true, inline-форми eval інтерпретаторів, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди вимагають явного схвалення. `allow-always` усе ще може зберігати довіру для безпечних викликів інтерпретатора/скрипта, але inline-eval форми все одно щоразу запитують підтвердження.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарники лише для stdin, які можуть працювати без явних записів у allowlist. Докладніше див. в [Safe bins](/uk/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірки шляхів виконуваних файлів safeBins. Записи `PATH` ніколи не стають довіреними автоматично. Вбудовані типові значення — `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова користувацька політика argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: об’єднує `PATH` вашої login-shell із середовищем exec. Перевизначення через `env.PATH`
  для виконання на хості відхиляються. Сам демон усе одно працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тож `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження profile через внутрішню env var (без shell-інтерполяції);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до node передаються лише ті перевизначення env, які ви передали й які не заблоковані. Перевизначення `env.PATH`
  для виконання на хості відхиляються й ігноруються на хостах node. Якщо вам потрібні додаткові записи PATH на node,
  налаштуйте середовище служби хоста node (systemd/launchd) або встановлюйте інструменти в стандартні розташування.

Прив’язка node для конкретного агента (використовуйте індекс у списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих параметрів.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб задати **типові значення для сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` враховується лише для **авторизованих відправників** (allowlist/pairing каналів плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через політику
інструментів (`tools.deny: ["exec"]` або для конкретного агента). Схвалення хоста все одно застосовуються, якщо ви явно не встановите
`security=full` і `ask=off`.

## Схвалення exec (companion app / node host)

Агенти в sandbox можуть вимагати схвалення для кожного запиту перед тим, як `exec` запуститься на gateway або хості node.
Дивіться [Схвалення exec](/uk/tools/exec-approvals) для політики, allowlist і потоку UI.

Коли потрібні схвалення, інструмент exec одразу повертається зі
`status: "approval-pending"` і id схвалення. Після схвалення (або відмови / спливу часу)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
працює після `tools.exec.approvalRunningNoticeMs`, надсилається одне сповіщення `Exec running`.
На каналах із нативними картками/кнопками схвалення агент повинен спочатку покладатися
на цей нативний UI і додавати ручну команду `/approve` лише тоді, коли результат
інструмента явно каже, що схвалення в чаті недоступні або ручне схвалення —
єдиний шлях.

## Allowlist + safe bins

Ручне примусове застосування allowlist зіставляє **лише розв’язані шляхи до бінарників** (без зіставлення за basename). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент pipeline
є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення відхиляються в
режимі allowlist, якщо кожен сегмент верхнього рівня не задовольняє allowlist (включно з safe bins).
Перенаправлення все ще не підтримуються.
Довготривала довіра `allow-always` не обходить це правило: команда-ланцюжок усе одно вимагає, щоб кожен
сегмент верхнього рівня збігався.

`autoAllowSkills` — це окремий допоміжний шлях у схваленнях exec. Це не те саме, що
ручні записи шляху в allowlist. Для суворої явної довіри тримайте `autoAllowSkills` вимкненим.

Використовуйте ці два механізми для різних завдань:

- `tools.exec.safeBins`: малі потокові фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bin.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не сприймайте `safeBins` як загальний allowlist і не додавайте туди бінарники інтерпретаторів/runtime (наприклад, `python3`, `node`, `ruby`, `bash`). Якщо вони потрібні, використовуйте явні записи allowlist і тримайте запити на схвалення ввімкненими.
`openclaw security audit` попереджає, коли записи `safeBins` для інтерпретаторів/runtime не мають явних профілів, а `openclaw doctor --fix` може створити шаблони відсутніх користувацьких записів `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно додаєте назад у `safeBins` бінарники з надто широкою поведінкою, як-от `jq`.
Якщо ви явно додаєте інтерпретатори в allowlist, увімкніть `tools.exec.strictInlineEval`, щоб inline-форми виконання коду все одно вимагали нового схвалення.

Повні подробиці політики та приклади дивіться в [Схвалення exec](/uk/tools/exec-approvals#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals#safe-bins-versus-allowlist).

## Приклади

Передній план:

```json
{ "tool": "exec", "command": "ls -la" }
```

Фон + опитування:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Опитування призначене для статусу на вимогу, а не для циклів очікування. Якщо автоматичне пробудження після завершення
увімкнено, команда може пробудити сесію, коли вона виводить щось або завершується з помилкою.

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

Вставити (типово в дужках):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованого редагування кількох файлів.
Його типово ввімкнено для моделей OpenAI і OpenAI Codex. Використовуйте конфігурацію лише
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
- Політика інструментів усе одно застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Конфігурація розміщується в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово має значення `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (у межах workspace). Установлюйте `false` лише тоді, коли ви навмисно хочете, щоб `apply_patch` записував/видаляв файли поза каталогом workspace.

## Пов’язане

- [Схвалення exec](/uk/tools/exec-approvals) — шлюзи схвалення для shell-команд
- [Ізоляція](/uk/gateway/sandboxing) — запуск команд в ізольованих середовищах
- [Фоновий процес](/uk/gateway/background-process) — довготривалі exec і інструмент process
- [Безпека](/uk/gateway/security) — політика інструментів і підвищений доступ
