---
read_when:
    - Використання або змінення інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента exec, режими stdin і підтримка TTY
title: Інструмент exec
x-i18n:
    generated_at: "2026-04-21T06:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Інструмент exec

Запускає shell-команди в робочому просторі. Підтримує виконання на передньому плані й у фоновому режимі через `process`.
Якщо `process` заборонено, `exec` працює синхронно та ігнорує `yieldMs`/`background`.
Фонові сесії прив’язані до кожного агента; `process` бачить лише сесії того самого агента.

## Параметри

- `command` (обов’язковий)
- `workdir` (типово: cwd)
- `env` (перевизначення key/value)
- `yieldMs` (типово 10000): автоматично переводить у фон після затримки
- `background` (bool): негайно запускати у фоновому режимі
- `timeout` (секунди, типово 1800): примусово завершує після спливу часу
- `pty` (bool): запуск у псевдотерміналі, якщо доступно (CLI лише з TTY, coding agents, terminal UI)
- `host` (`auto | sandbox | gateway | node`): де виконувати
- `security` (`deny | allowlist | full`): режим застосування політик для `gateway`/`node`
- `ask` (`off | on-miss | always`): запити на схвалення для `gateway`/`node`
- `node` (string): id/ім’я вузла для `host=node`
- `elevated` (bool): запросити підвищений режим (вихід із sandbox на налаштований шлях хоста); `security=full` примусово вмикається лише тоді, коли `elevated` розв’язується як `full`

Примітки:

- `host` типово має значення `auto`: sandbox, якщо для сесії активне sandbox-середовище, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не wildcard. Для окремого виклику дозволено `host=node` з `auto`; `host=gateway` для окремого виклику дозволено лише тоді, коли sandbox-середовище не активне.
- Без додаткового налаштування `host=auto` все одно «просто працює»: без sandbox він розв’язується в `gateway`; за активного sandbox залишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, якщо `tools.exec.host=node` (або типовим для сесії є `host=node`). Доступно лише тоді, коли для поточної сесії/провайдера ввімкнено elevated access.
- Схвалення для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- Для `node` потрібен спарений вузол (companion app або headless node host).
- Якщо доступно кілька вузлів, укажіть `exec.node` або `tools.exec.node`, щоб вибрати один.
- `exec host=node` — єдиний шлях виконання shell-команд для вузлів; застарілу обгортку `nodes.run` видалено.
- На хостах, відмінних від Windows, exec використовує `SHELL`, якщо його задано; якщо `SHELL` — це `fish`, він віддає перевагу `bash` (або `sh`) з `PATH`, щоб уникнути несумісних із fish скриптів, і лише потім повертається до `SHELL`, якщо жодного з них немає.
- На хостах Windows exec спочатку намагається знайти PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH), а потім переходить до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення завантажувача (`LD_*`/`DYLD_*`), щоб запобігти підміні бінарних файлів або ін’єкції коду.
- OpenClaw установлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (зокрема для PTY та виконання в sandbox), щоб правила shell/profile могли визначати контекст exec tool.
- Важливо: sandboxing **типово вимкнено**. Якщо sandboxing вимкнено, неявний `host=auto` розв’язується в `gateway`. Явний `host=sandbox` у такому разі все одно завершується без виконання, а не тихо запускається на gateway host. Увімкніть sandboxing або використовуйте `host=gateway` зі схваленнями.
- Перевірки preflight для скриптів (щодо поширених синтаксичних помилок Python/Node у shell) аналізують лише файли в межах ефективної межі `workdir`. Якщо шлях до скрипта розв’язується поза `workdir`, preflight для цього файла пропускається.
- Для довготривалої роботи, яку потрібно почати зараз, запускайте її один раз і покладайтеся на автоматичне пробудження після завершення, якщо його ввімкнено і команда виводить результат або завершується з помилкою.
  Використовуйте `process` для логів, статусу, введення або втручання; не імітуйте планування через цикли sleep, цикли timeout або повторне опитування.
- Для роботи, яка має виконатися пізніше або за розкладом, використовуйте cron, а не шаблони sleep/delay в `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (типово: true): якщо true, фонові сесії exec ставлять системну подію в чергу та запитують Heartbeat після завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): надсилає одне сповіщення «running», якщо exec, що потребує схвалення, виконується довше за цей час (0 вимикає).
- `tools.exec.host` (типово: `auto`; розв’язується в `sandbox`, якщо sandbox-середовище активне, і в `gateway` інакше)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway і node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання на хості без схвалення — типовий режим для gateway і node. Якщо вам потрібні схвалення/поведінка allowlist, посильте налаштування і в `tools.exec.*`, і в `~/.openclaw/exec-approvals.json` на хості; див. [Схвалення exec](/uk/tools/exec-approvals#no-approval-yolo-mode).
- Режим YOLO походить із типових налаштувань політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо потрібно примусово використовувати gateway або node, задайте `tools.exec.host` або використовуйте `/exec host=...`.
- У режимі `security=full` разом із `ask=off` виконання на хості безпосередньо дотримується налаштованої політики; додаткового евристичного попереднього фільтра для обфускації команд або шару відхилення script-preflight немає.
- `tools.exec.node` (типово: не задано)
- `tools.exec.strictInlineEval` (типово: false): якщо true, вбудовані форми eval інтерпретаторів, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди потребують явного схвалення. `allow-always` усе ще може зберігати довіру до безпечних викликів інтерпретатора/скрипта, але форми inline-eval все одно запитуватимуть схвалення щоразу.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише для stdin, які можуть запускатися без явних записів у allowlist. Докладніше див. у [Safe bins](/uk/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явно довірені каталоги для перевірок шляхів виконуваних файлів із `safeBins`. Записи `PATH` ніколи не вважаються довіреними автоматично. Вбудовані типові значення: `/bin` і `/usr/bin`.
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

- `host=gateway`: об’єднує `PATH` вашої login-shell із середовищем exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам daemon при цьому все одно працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скидати `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження profile через внутрішню змінну середовища (без shell-інтерполяції);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до вузла надсилаються лише не заблоковані перевизначення середовища, які ви передали. Перевизначення `env.PATH`
  відхиляються для виконання на хості та ігноруються вузловими хостами. Якщо вам потрібні додаткові записи PATH на вузлі,
  налаштуйте середовище служби вузлового хоста (systemd/launchd) або встановлюйте інструменти у стандартні розташування.

Прив’язка вузла до агента (використовуйте індекс у списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель «Exec node binding» для тих самих налаштувань.

## Перевизначення для сесії (`/exec`)

Використовуйте `/exec`, щоб задати **типові значення для поточної сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` обробляється лише для **авторизованих відправників** (allowlist каналів/спарювання плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через
політику інструментів (`tools.deny: ["exec"]` або на рівні агента). Схвалення хоста все одно застосовуються, якщо ви явно не встановите
`security=full` і `ask=off`.

## Схвалення exec (companion app / node host)

Агенти в sandbox можуть вимагати схвалення для кожного запиту перед тим, як `exec` запуститься на хості gateway або node.
Докладніше про політику, allowlist і UI-потік див. у [Схвалення exec](/uk/tools/exec-approvals).

Коли потрібні схвалення, інструмент exec повертається негайно зі
`status: "approval-pending"` та id схвалення. Після схвалення (або відхилення / спливу часу очікування)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, надсилається одне сповіщення `Exec running`.
У каналах із нативними картками/кнопками схвалення агент повинен насамперед покладатися на цей
нативний UI і додавати ручну команду `/approve` лише тоді, коли в результаті інструмента
явно сказано, що схвалення через чат недоступні або ручне схвалення —
єдиний шлях.

## Allowlist + safe bins

Ручне застосування allowlist зіставляє **лише розв’язані шляхи до бінарних файлів** (без зіставлення за basename). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент конвеєра
є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення відхиляються в
режимі allowlist, якщо не кожен top-level сегмент задовольняє allowlist (включно з safe bins).
Перенаправлення все ще не підтримуються.
Тривала довіра `allow-always` не обходить це правило: ланцюжкова команда все одно вимагає, щоб кожен
top-level сегмент відповідав умовам.

`autoAllowSkills` — це окремий зручний шлях у механізмі схвалень exec. Це не те саме, що
ручні записи allowlist за шляхом. Для строгої явної довіри залишайте `autoAllowSkills` вимкненим.

Використовуйте ці два механізми для різних завдань:

- `tools.exec.safeBins`: невеликі потокові фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bins.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не використовуйте `safeBins` як універсальний allowlist і не додавайте туди бінарні файли інтерпретаторів/середовищ виконання (наприклад `python3`, `node`, `ruby`, `bash`). Якщо вони потрібні, використовуйте явні записи allowlist і залишайте запити на схвалення ввімкненими.
`openclaw security audit` попереджає, коли в записах `safeBins` для інтерпретаторів/середовищ виконання бракує явних профілів, а `openclaw doctor --fix` може створити відсутні записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно знову додаєте до `safeBins` бінарні файли з широкою поведінкою, такі як `jq`.
Якщо ви явно додаєте інтерпретатори в allowlist, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе одно вимагали нового схвалення.

Повні подробиці політики та приклади див. у [Схвалення exec](/uk/tools/exec-approvals#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals#safe-bins-versus-allowlist).

## Приклади

Передній план:

```json
{ "tool": "exec", "command": "ls -la" }
```

Фоновий режим + опитування:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Опитування використовується для статусу на вимогу, а не для циклів очікування. Якщо автоматичне пробудження після завершення
увімкнено, команда може пробудити сесію, коли виведе результат або завершиться з помилкою.

Надсилання клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (надсилає лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (типово з bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованих багатофайлових редагувань.
Він типово ввімкнений для моделей OpenAI та OpenAI Codex. Використовуйте конфігурацію лише
тоді, коли хочете вимкнути його або обмежити певними моделями:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Примітки:

- Доступно лише для моделей OpenAI/OpenAI Codex.
- Політика інструментів усе одно застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Конфігурація розташована в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово має значення `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (обмежено робочим простором). Установлюйте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.

## Пов’язане

- [Схвалення exec](/uk/tools/exec-approvals) — шлюзи схвалення для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — запуск команд у sandbox-середовищах
- [Фоновий процес](/uk/gateway/background-process) — довготривалий exec та інструмент process
- [Безпека](/uk/gateway/security) — політика інструментів і elevated access
