---
read_when:
    - Використання або змінення інструмента Exec
    - Налагодження поведінки stdin або TTY
summary: Використання інструмента Exec, режими stdin і підтримка TTY
title: інструмент Exec
x-i18n:
    generated_at: "2026-04-25T03:25:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Виконує shell-команди в робочому просторі. Підтримує виконання на передньому плані й у фоні через `process`.
Якщо `process` заборонено, `exec` працює синхронно та ігнорує `yieldMs`/`background`.
Фонові сесії ізольовані для кожного агента; `process` бачить лише сесії того самого агента.

## Параметри

<ParamField path="command" type="string" required>
Shell-команда для виконання.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Робочий каталог для команди.
</ParamField>

<ParamField path="env" type="object">
Перевизначення середовища у форматі ключ/значення, які об’єднуються поверх успадкованого середовища.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Автоматично переводить команду у фон після цієї затримки (мс).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Негайно переводить команду у фон замість очікування `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Завершує команду після вказаної кількості секунд.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Запускає в псевдотерміналі, коли це доступно. Використовуйте для CLI, що вимагають TTY, агентів кодування та термінальних UI.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Де виконувати. `auto` визначається як `sandbox`, коли для сесії активне sandbox-середовище, і як `gateway` — в іншому разі.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Режим застосування правил для виконання `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Поведінка запиту підтвердження для виконання `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Ідентифікатор/назва Node, коли `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Запитує підвищений режим — вихід із sandbox на налаштований шлях хоста. `security=full` примусово вмикається лише тоді, коли elevated визначається як `full`.
</ParamField>

Примітки:

- `host` типово має значення `auto`: sandbox, коли для сесії активне sandbox-середовище, інакше gateway.
- `auto` — це типова стратегія маршрутизації, а не шаблон. Виклик `host=node` для окремого запиту дозволений із `auto`; виклик `host=gateway` для окремого запиту дозволений лише тоді, коли sandbox-середовище не активне.
- Без додаткової конфігурації `host=auto` усе одно “просто працює”: без sandbox він визначається як `gateway`; з активним sandbox залишається в sandbox.
- `elevated` виходить із sandbox на налаштований шлях хоста: типово `gateway`, або `node`, коли `tools.exec.host=node` (або типове значення сесії — `host=node`). Він доступний лише тоді, коли для поточної сесії/провайдера ввімкнено elevated-доступ.
- Підтвердження для `gateway`/`node` керуються через `~/.openclaw/exec-approvals.json`.
- `node` потребує спареного Node (супутній застосунок або безголовий хост Node).
- Якщо доступно кілька Node, задайте `exec.node` або `tools.exec.node`, щоб вибрати один.
- `exec host=node` — єдиний шлях виконання shell-команд для Node; застарілу обгортку `nodes.run` видалено.
- На хостах не Windows exec використовує `SHELL`, якщо його встановлено; якщо `SHELL` — це `fish`, він надає перевагу `bash` (або `sh`)
  з `PATH`, щоб уникнути скриптів, несумісних із fish, а потім повертається до `SHELL`, якщо жодного з них немає.
- На хостах Windows exec надає перевагу пошуку PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, потім PATH),
  а потім повертається до Windows PowerShell 5.1.
- Виконання на хості (`gateway`/`node`) відхиляє `env.PATH` і перевизначення завантажувача (`LD_*`/`DYLD_*`), щоб
  запобігти підміні бінарних файлів або ін’єкції коду.
- OpenClaw встановлює `OPENCLAW_SHELL=exec` у середовищі запущеної команди (зокрема для PTY та виконання в sandbox), щоб правила shell/профілю могли виявляти контекст інструмента exec.
- Важливо: sandboxing **типово вимкнено**. Якщо sandboxing вимкнено, неявний `host=auto`
  визначається як `gateway`. Явний `host=sandbox` усе одно завершується відмовою замість того, щоб мовчки
  виконатися на хості gateway. Увімкніть sandboxing або використовуйте `host=gateway` із підтвердженнями.
- Попередні перевірки скриптів (для поширених помилок синтаксису shell у Python/Node) перевіряють лише файли всередині
  ефективної межі `workdir`. Якщо шлях до скрипту визначається поза `workdir`, попередню перевірку для
  цього файла пропускають.
- Для довготривалої роботи, яка має початися зараз, запустіть її один раз і покладайтеся на автоматичне
  пробудження після завершення, якщо його ввімкнено й команда виводить результат або завершується помилкою.
  Використовуйте `process` для журналів, стану, введення або втручання; не імітуйте
  планування через цикли сну, цикли timeout або повторне опитування.
- Для роботи, яка має виконатися пізніше або за розкладом, використовуйте Cron замість
  шаблонів сну/затримки з `exec`.

## Конфігурація

- `tools.exec.notifyOnExit` (типово: true): коли true, фонові сесії exec ставлять системну подію в чергу та запитують Heartbeat під час завершення.
- `tools.exec.approvalRunningNoticeMs` (типово: 10000): надсилає одне сповіщення “running”, коли exec із підтвердженням виконується довше за цей час (0 вимикає).
- `tools.exec.host` (типово: `auto`; визначається як `sandbox`, коли активне sandbox-середовище, інакше як `gateway`)
- `tools.exec.security` (типово: `deny` для sandbox, `full` для gateway + node, якщо не задано)
- `tools.exec.ask` (типово: `off`)
- Виконання host exec без підтвердження — типова поведінка для gateway + node. Якщо вам потрібні підтвердження/поведінка allowlist, посильте і `tools.exec.*`, і політику хоста в `~/.openclaw/exec-approvals.json`; див. [Exec approvals](/uk/tools/exec-approvals#no-approval-yolo-mode).
- YOLO походить із типових значень політики хоста (`security=full`, `ask=off`), а не з `host=auto`. Якщо ви хочете примусово використовувати маршрутизацію через gateway або node, задайте `tools.exec.host` або використайте `/exec host=...`.
- У режимі `security=full` плюс `ask=off` host exec дотримується налаштованої політики напряму; немає додаткового евристичного попереднього фільтра обфускації команд чи шару відхилення script-preflight.
- `tools.exec.node` (типово: не задано)
- `tools.exec.strictInlineEval` (типово: false): коли true, форми inline-eval для інтерпретаторів, такі як `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` і `osascript -e`, завжди вимагають явного підтвердження. `allow-always` усе ще може зберігати нешкідливі виклики інтерпретатора/скрипту, але форми inline-eval усе одно щоразу показують запит.
- `tools.exec.pathPrepend`: список каталогів, які потрібно додати на початок `PATH` для запусків exec (лише gateway + sandbox).
- `tools.exec.safeBins`: безпечні бінарні файли лише для stdin, які можуть виконуватися без явних записів allowlist. Докладніше див. у [Safe bins](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: додаткові явні каталоги, яким довіряють для перевірок шляхів виконуваних файлів safeBins. Записи `PATH` ніколи не вважаються автоматично довіреними. Вбудовані типові значення — `/bin` і `/usr/bin`.
- `tools.exec.safeBinProfiles`: необов’язкова власна політика argv для кожного safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: об’єднує `PATH` вашого login shell із середовищем exec. Перевизначення `env.PATH`
  відхиляються для виконання на хості. Сам демон і далі працює з мінімальним `PATH`:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: запускає `sh -lc` (login shell) усередині контейнера, тому `/etc/profile` може скинути `PATH`.
  OpenClaw додає `env.PATH` на початок після завантаження профілю через внутрішню змінну середовища (без інтерполяції shell);
  `tools.exec.pathPrepend` також застосовується тут.
- `host=node`: до Node надсилаються лише не заблоковані перевизначення середовища, які ви передаєте. Перевизначення `env.PATH`
  відхиляються для виконання на хості й ігноруються хостами Node. Якщо вам потрібні додаткові записи PATH на Node,
  налаштуйте середовище сервісу хоста Node (systemd/launchd) або встановлюйте інструменти у стандартні розташування.

Прив’язка Node для окремого агента (використовуйте індекс у списку агентів у конфігурації):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Інтерфейс керування: вкладка Nodes містить невелику панель “Exec node binding” для тих самих налаштувань.

## Перевизначення сесії (`/exec`)

Використовуйте `/exec`, щоб задати **для сесії** типові значення `host`, `security`, `ask` і `node`.
Надішліть `/exec` без аргументів, щоб показати поточні значення.

Приклад:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Модель авторизації

`/exec` враховується лише для **авторизованих відправників** (allowlist каналів/спарювання плюс `commands.useAccessGroups`).
Він оновлює **лише стан сесії** й не записує конфігурацію. Щоб повністю вимкнути exec, забороніть його через
політику інструментів (`tools.deny: ["exec"]` або для окремого агента). Підтвердження на хості все одно застосовуються, якщо ви явно не задали
`security=full` і `ask=off`.

## Exec approvals (супутній застосунок / хост Node)

Агенти в sandbox можуть вимагати підтвердження для кожного запиту перед тим, як `exec` виконається на gateway або хості node.
Див. [Exec approvals](/uk/tools/exec-approvals), щоб дізнатися про політику, allowlist і потік у UI.

Коли потрібні підтвердження, інструмент exec повертається негайно з
`status: "approval-pending"` та ідентифікатором підтвердження. Після підтвердження (або відхилення / завершення за timeout)
Gateway надсилає системні події (`Exec finished` / `Exec denied`). Якщо команда все ще
виконується після `tools.exec.approvalRunningNoticeMs`, надсилається одне сповіщення `Exec running`.
У каналах із нативними картками/кнопками підтвердження агент має насамперед покладатися на цей
нативний UI і додавати ручну команду `/approve` лише тоді, коли результат
інструмента явно вказує, що підтвердження в чаті недоступні або ручне підтвердження — єдиний варіант.

## Allowlist + safe bins

Ручна перевірка allowlist зіставляє glob-шаблони розв’язаних шляхів до бінарних файлів і прості glob-шаблони назв команд. Прості назви відповідають лише командам, викликаним через PATH, тому `rg` може відповідати
`/opt/homebrew/bin/rg`, коли команда — `rg`, але не `./rg` чи `/tmp/rg`.
Коли `security=allowlist`, shell-команди автоматично дозволяються лише тоді, коли кожен сегмент конвеєра є в allowlist або є safe bin. Ланцюжки (`;`, `&&`, `||`) і перенаправлення
відхиляються в режимі allowlist, якщо не кожен сегмент верхнього рівня відповідає
allowlist (зокрема safe bins). Перенаправлення й далі не підтримуються.
Тривала довіра `allow-always` не обходить це правило: команда-ланцюжок усе одно вимагає, щоб кожен
сегмент верхнього рівня відповідав правилам.

`autoAllowSkills` — це окремий зручний механізм у Exec approvals. Він не те саме, що
ручні записи allowlist для шляхів. Для суворої явної довіри тримайте `autoAllowSkills` вимкненим.

Використовуйте ці два елементи керування для різних завдань:

- `tools.exec.safeBins`: невеликі потокові фільтри лише для stdin.
- `tools.exec.safeBinTrustedDirs`: явні додаткові довірені каталоги для шляхів виконуваних файлів safe bin.
- `tools.exec.safeBinProfiles`: явна політика argv для власних safe bins.
- allowlist: явна довіра до шляхів виконуваних файлів.

Не використовуйте `safeBins` як загальний allowlist і не додавайте бінарні файли інтерпретаторів/середовищ виконання (наприклад `python3`, `node`, `ruby`, `bash`). Якщо вони вам потрібні, використовуйте явні записи allowlist і залишайте запити підтвердження ввімкненими.
`openclaw security audit` попереджає, коли для записів `safeBins` інтерпретаторів/середовищ виконання немає явних профілів, а `openclaw doctor --fix` може згенерувати відсутні записи `safeBinProfiles`.
`openclaw security audit` і `openclaw doctor` також попереджають, коли ви явно повертаєте до `safeBins` бінарні файли з широкою поведінкою, наприклад `jq`.
Якщо ви явно додаєте інтерпретатори до allowlist, увімкніть `tools.exec.strictInlineEval`, щоб форми inline code-eval усе одно вимагали нового підтвердження.

Повні відомості про політики та приклади див. у [Exec approvals](/uk/tools/exec-approvals-advanced#safe-bins-stdin-only) і [Safe bins versus allowlist](/uk/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Опитування призначене для отримання стану на вимогу, а не для циклів очікування. Якщо автоматичне пробудження
після завершення ввімкнено, команда може розбудити сесію, коли виведе результат або завершиться помилкою.

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

`apply_patch` — це підінструмент `exec` для структурованих багато-файлових змін.
Він типово ввімкнений для моделей OpenAI та OpenAI Codex. Використовуйте конфігурацію лише
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
- Політика інструментів і далі застосовується; `allow: ["write"]` неявно дозволяє `apply_patch`.
- Конфігурація розміщується в `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` типово має значення `true`; задайте `false`, щоб вимкнути інструмент для моделей OpenAI.
- `tools.exec.applyPatch.workspaceOnly` типово має значення `true` (обмежено робочим простором). Задавайте `false` лише тоді, коли ви свідомо хочете, щоб `apply_patch` записував/видаляв файли поза каталогом робочого простору.

## Пов’язане

- [Exec Approvals](/uk/tools/exec-approvals) — шлюзи підтвердження для shell-команд
- [Sandboxing](/uk/gateway/sandboxing) — виконання команд у sandbox-середовищах
- [Background Process](/uk/gateway/background-process) — довготривалий exec та інструмент process
- [Security](/uk/gateway/security) — політика інструментів і elevated-доступ
