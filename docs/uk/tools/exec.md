---
read_when:
    - Використання або зміна інструмента exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента Exec, режими stdin і підтримка TTY
title: Інструмент Exec
x-i18n:
    generated_at: "2026-04-05T18:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28388971c627292dba9bf65ae38d7af8cde49a33bb3b5fc8b20da4f0e350bedd
    source_path: tools/exec.md
    workflow: 15
---

# Інструмент Exec

Запускає shell-команди в робочому просторі. Підтримує виконання на передньому плані й у фоні через `process`.
Якщо `process` заборонено, `exec` виконується синхронно та ігнорує `yieldMs`/`background`.
Фонові сесії прив’язані до конкретного агента; `process` бачить лише сесії того самого агента.

## Параметри

- `command` (обов’язково)
- `workdir` (типово cwd)
- `env` (перевизначення ключ/значення)
- `yieldMs` (типово 10000): автоматичний перехід у фон після затримки
- `background` (bool): негайно у фон
- `timeout` (секунди, типово 1800): завершити після спливу часу
- `pty` (bool): запускати в псевдотерміналі, коли доступно (CLI лише з TTY, coding agents, terminal UI)
- `host` (`auto | sandbox | gateway | node`): де виконувати
- `security` (`deny | allowlist | full`): режим застосування для `gateway`/`node`
- `ask` (`off | on-miss | always`): запити на погодження для `gateway`/`node`
- `node` (string): id/ім’я node для `host=node`
- `elevated` (bool): запитати режим elevated (вийти із sandbox на налаштований шлях хоста); `security=full` примусово вмикається лише тоді, коли elevated резолюється до `full`

Примітки:

- `host` типово дорівнює `auto`: sandbox, коли для сесії активне sandbox runtime, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не wildcard. `host=node` на рівні окремого виклику дозволено з `auto`; `host=gateway` на рівні окремого виклику дозволено лише тоді, коли sandbox runtime не активний.
- Без додаткового config `host=auto` все одно «просто працює»: без sandbox він резолюється до `gateway`; із активним sandbox він лишається в sandbox.
- `elevated` виводить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, коли `tools.exec.host=node` (або типове значення сесії — `host=node`). Він доступний лише тоді, коли elevated-доступ увімкнено для поточної сесії/провайдера.
- Погодження для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- `node` потребує сполученої node (супровідний застосунок або headless-хост node).
- Якщо доступно кілька node, задайте `exec.node` або `tools.exec.node`, щоб вибрати одну.
- `exec host=node` — це єдиний шлях виконання shell-команд для node; застарілу обгортку `nodes.run` видалено.
- На хостах не-Windows exec використовує `SHELL`, якщо його задано; якщо `SHELL` — це `fish`, він надає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникати скриптів, несумісних із fish, а потім повертається до `SHELL`, якщо жодного з них немає.
- На Windows-хостах exec надає перевагу виявленню PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім переходить до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення завантажувача (`LD_*`/`DYLD_*`), щоб
  запобігти перехопленню бінарних файлів або ін’єкції коду.
- OpenClaw установлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (включно з PTY і виконанням у sandbox), щоб правила shell/профілю могли виявляти контекст інструмента exec.
- Важливо: sandboxing **вимкнено типово**. Якщо sandboxing вимкнено, неявний `host=auto`
  резолюється до `gateway`. Явний `host=sandbox` усе одно завершується безпечною відмовою замість тихого
  запуску на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` із погодженнями.
- Попередні перевірки скриптів (для типових помилок shell-синтаксису в Python/Node) перевіряють лише файли всередині
  межі ефективного `workdir`. Якщо шлях до скрипта резолюється поза `workdir`, попередня перевірка для
  цього файлу пропускається.
- Для довготривалої роботи, що починається зараз, запустіть її один раз і покладайтеся на автоматичне
  пробудження після завершення, якщо воно увімкнене і команда виводить результат або завершується з помилкою.
  Використовуйте `process` для журналів, статусу, вводу або втручання; не імітуйте
  планування через цикли sleep, timeout або повторне опитування.
- Для роботи, яка має відбутися пізніше або за розкладом, використовуйте cron замість
  шаблонів sleep/delay в `exec`.

## Config

- `tools.exec.notifyOnExit` (типово: true): коли true, фонові сесії exec ставлять у чергу системну подію й запитують heartbeat після завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): виводити одне повідомлення «виконується», коли exec із погодженням працює довше за це значення (0 вимикає).
- `tools.exec.host` (типово: `auto`; резолюється в `sandbox`, коли активне sandbox runtime, і в `gateway` інакше)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway + node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання host exec без погодження є типовим для gateway + node. Якщо вам потрібна поведінка погоджень/allowlist, посильте і `tools.exec.*`, і host `~/.openclaw/exec-approvals.json`; див. [Exec approvals](/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із типових значень політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо хочете примусово маршрутизувати на gateway або node, задайте `tools.exec.host` або використайте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` host exec безпосередньо дотримується налаштованої політики; додаткового евристичного попереднього фільтра для обфускації команд немає.
- `tools.exec.node` (типово: не задано)
- `tools.exec.strictInlineEval` (типово: false): коли true, вбудовані форми eval інтерпретаторів, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди вимагають явного погодження. `allow-always` усе ще може постійно дозволяти нешкідливі виклики інтерпретаторів/скриптів, але inline-eval-форми все одно запитуватимуть погодження щоразу.
- `tools.exec.pathPrepend`: список каталогів, які слід додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише для stdin, які можуть запускатися без явних записів allowlist. Докладніше про поведінку див. у [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів у `safeBins`. Записи `PATH` ніколи не вважаються довіреними автоматично. Вбудовані типові значення — `/bin` і `/usr/bin`.
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

- `host=gateway`: зливає `PATH` вашого login-shell у середовище exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам демон усе ще працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тож `/etc/profile` може скинути `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження профілю через внутрішню env-змінну (без shell-інтерполяції);
  `tools.exec.pathPrepend` тут теж застосовується.
- `host=node`: до node надсилаються лише передані вами перевизначення env, які не заблоковано. Перевизначення `env.PATH`
  відхиляються для виконання на хості й ігноруються node-хостами. Якщо вам потрібні додаткові записи PATH на node,
  налаштуйте середовище служби хоста node (systemd/launchd) або встановіть інструменти у стандартні розташування.

Прив’язка node для окремого агента (використовуйте індекс списку агентів у config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб установлювати **типові значення для сесії** для `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб побачити поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` обробляється лише для **авторизованих відправників** (channel allowlists/pairing плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** і не записує config. Щоб жорстко вимкнути exec, забороніть його через політику
інструментів (`tools.deny: ["exec"]` або для окремого агента). Погодження хоста все ще застосовуються, якщо ви явно не задасте
`security=full` і `ask=off`.

## Exec approvals (супровідний застосунок / хост node)

Sandboxed-агенти можуть вимагати погодження для кожного запиту перед тим, як `exec` запуститься на хості gateway або node.
Див. [Exec approvals](/tools/exec-approvals), щоб дізнатися про політику, allowlist і потік UI.

Коли погодження потрібні, інструмент exec негайно повертається з
`status: "approval-pending"` та id погодження. Після погодження (або відхилення / тайм-ауту)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, надсилається одне повідомлення `Exec running`.
У каналах із нативними картками/кнопками погодження агент має насамперед покладатися на
цей нативний UI і включати ручну команду `/approve` лише тоді, коли результат
інструмента явно каже, що погодження в чаті недоступні або ручне погодження —
єдиний шлях.

## Allowlist + safe bins

Примусове застосування ручного allowlist зіставляє **лише резольвлені шляхи до бінарних файлів** (без збігів за basename). Коли
`security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент конвеєра
є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення відхиляються в
режимі allowlist, якщо не кожен сегмент верхнього рівня задовольняє allowlist (включно із safe bins).
Перенаправлення як і раніше не підтримуються.
Постійна довіра `allow-always` не обходить це правило: команда-ланцюжок усе одно вимагає, щоб кожен
сегмент верхнього рівня відповідав вимогам.

`autoAllowSkills` — це окремий зручний шлях в exec approvals. Це не те саме, що
ручні записи allowlist за шляхами. Для суворої явної довіри тримайте `autoAllowSkills` вимкненим.

Використовуйте ці два механізми для різних завдань:

- `tools.exec.safeBins`: малі потокові фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для користувацьких safe bins.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не сприймайте `safeBins` як універсальний allowlist і не додавайте бінарні файли інтерпретаторів/середовищ виконання (наприклад, `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте ввімкненими запити на погодження.
`openclaw security audit` попереджає, коли для записів `safeBins` інтерпретаторів/середовищ виконання бракує явних профілів, а `openclaw doctor --fix` може згенерувати відсутні користувацькі записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно знову додаєте до `safeBins` бінарні файли з широкою поведінкою, такі як `jq`.
Якщо ви явно додаєте інтерпретатори до allowlist, увімкніть `tools.exec.strictInlineEval`, щоб inline-форми eval коду все одно вимагали нового погодження.

Повні деталі політики та приклади див. у [Exec approvals](/tools/exec-approvals#safe-bins-stdin-only) і [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

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

Опитування призначене для статусу за запитом, а не для циклів очікування. Якщо автоматичне пробудження
після завершення увімкнене, команда може пробудити сесію, коли виведе результат або завершиться з помилкою.

Надсилання клавіш (у стилі tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Надсилання (лише CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Вставлення (типово в дужках):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` — це підінструмент `exec` для структурованого редагування кількох файлів.
Він увімкнений типово для моделей OpenAI і OpenAI Codex. Використовуйте config лише
коли хочете вимкнути його або обмежити певними моделями:

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

- Доступний лише для моделей OpenAI/OpenAI Codex.
- Політика інструментів усе ще застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Config знаходиться в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово дорівнює `true`; установіть `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово дорівнює `true` (обмеження робочим простором). Установлюйте `false` лише якщо ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.

## Пов’язане

- [Exec Approvals](/tools/exec-approvals) — етапи погодження для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — запуск команд у sandboxed-середовищах
- [Background Process](/uk/gateway/background-process) — довготривалий exec та інструмент process
- [Security](/uk/gateway/security) — політика інструментів і elevated-доступ
