---
read_when:
    - Ви запускаєте openclaw без команди та хочете зрозуміти, що таке Crestodian
    - Вам потрібен безконфігураційно-безпечний спосіб перевірити або відновити OpenClaw
    - Ви проєктуєте або вмикаєте режим відновлення для каналу повідомлень
summary: Довідка CLI та модель безпеки для Crestodian, безконфігураційно-безпечного інструмента налаштування та відновлення
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T12:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian — це локальний помічник OpenClaw для налаштування, відновлення та конфігурації. Його
спроєктовано так, щоб він залишався доступним, коли звичайний шлях агента зламано.

Запуск `openclaw` без команди відкриває Crestodian в інтерактивному терміналі.
Запуск `openclaw crestodian` явно запускає того самого помічника.

## Що показує Crestodian

Під час запуску інтерактивний Crestodian відкриває ту саму оболонку TUI, що використовується в
`openclaw tui`, але з чат-бекендом Crestodian. Журнал чату починається з короткого
привітання:

- коли слід запускати Crestodian
- яку модель або шлях детерміністичного планувальника Crestodian фактично використовує
- валідність конфігурації та агента за замовчуванням
- доступність Gateway із першої перевірки під час запуску
- наступну дію з налагодження, яку Crestodian може виконати

Він не виводить секрети й не завантажує CLI-команди Plugin лише для запуску. TUI
усе ще надає звичайний заголовок, журнал чату, рядок стану, нижній колонтитул, автодоповнення
та елементи керування редактором.

Використовуйте `status` для детального переліку з шляхом до конфігурації, шляхами до docs/source,
локальними CLI-перевірками, наявністю API-ключів, агентами, моделлю та відомостями про Gateway.

Crestodian використовує той самий механізм виявлення довідкових матеріалів OpenClaw, що й звичайні агенти. У Git checkout
він спрямовує себе на локальні `docs/` і локальне дерево вихідного коду. У разі встановлення npm package він
використовує docs із комплекту пакета та посилається на
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), з явною
рекомендацією переглянути вихідний код, якщо docs недостатньо.

## Приклади

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Усередині Crestodian TUI:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Безпечний запуск

Шлях запуску Crestodian навмисно мінімальний. Він може працювати, коли:

- `openclaw.json` відсутній
- `openclaw.json` невалідний
- Gateway не працює
- реєстрація команд Plugin недоступна
- ще не налаштовано жодного агента

`openclaw --help` і `openclaw --version` усе ще використовують звичайні швидкі шляхи.
Неінтерактивний `openclaw` завершується коротким повідомленням замість виведення довідки
верхнього рівня, оскільки продуктом без команди є Crestodian.

## Операції та підтвердження

Crestodian використовує типізовані операції замість довільного редагування конфігурації.

Операції лише для читання можуть виконуватися негайно:

- показати огляд
- перелічити агентів
- показати стан моделі/бекенда
- запустити перевірки status або health
- перевірити доступність Gateway
- запустити doctor без інтерактивних виправлень
- validate config
- показати шлях до журналу аудиту

Постійні операції потребують підтвердження в розмові в інтерактивному режимі, якщо
ви не передасте `--yes` для прямої команди:

- записати конфігурацію
- запустити `config set`
- задати підтримувані значення SecretRef через `config set-ref`
- запустити bootstrap налаштування/onboarding
- змінити модель за замовчуванням
- запустити, зупинити або перезапустити Gateway
- створити агентів
- запустити виправлення doctor, які переписують конфігурацію або стан

Застосовані записи фіксуються в:

```text
~/.openclaw/audit/crestodian.jsonl
```

Виявлення не аудитується. Журналюються лише застосовані операції та записи.

`openclaw onboard --modern` запускає Crestodian як modern preview для onboarding.
Звичайний `openclaw onboard` усе ще запускає classic onboarding.

## Bootstrap налаштування

`setup` — це bootstrap onboarding у стилі чату. Він записує дані лише через типізовані
операції конфігурації та спочатку запитує підтвердження.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Якщо модель не налаштована, setup вибирає перший придатний бекенд у такому
порядку й повідомляє, що саме він вибрав:

- наявна явно задана модель, якщо її вже налаштовано
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Якщо жоден варіант недоступний, setup усе одно записує workspace за замовчуванням і залишає
модель незаданою. Установіть або виконайте вхід у Codex/Claude Code, або зробіть
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` доступними, а потім знову запустіть setup.

## Планувальник із підтримкою моделі

Crestodian завжди запускається в детерміністичному режимі. Для нечітких команд, які
детерміністичний парсер не розуміє, локальний Crestodian може виконати один обмежений
хід планувальника через звичайні шляхи виконання OpenClaw. Спочатку він використовує
налаштовану модель OpenClaw. Якщо жодна налаштована модель ще не придатна до використання,
він може повернутися до локальних середовищ виконання, які вже наявні на машині:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` з `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Планувальник із підтримкою моделі не може безпосередньо змінювати конфігурацію. Він має
перекласти запит в одну з типізованих команд Crestodian, після чого застосовуються
звичайні правила підтвердження й аудиту. Crestodian виводить модель, яку він використав,
і інтерпретовану команду перед виконанням будь-яких дій. Резервні ходи планувальника
в безконфігураційному режимі є тимчасовими, без інструментів там, де це підтримує середовище виконання,
і використовують тимчасовий workspace/session.

Режим відновлення каналу повідомлень не використовує планувальник із підтримкою моделі. Віддалене
відновлення залишається детерміністичним, щоб зламаний або скомпрометований звичайний шлях агента
не можна було використати як редактор конфігурації.

## Перемикання на агента

Використовуйте селектор природною мовою, щоб вийти з Crestodian і відкрити звичайний TUI:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` і `openclaw terminal` усе ще безпосередньо відкривають звичайний
TUI агента. Вони не запускають Crestodian.

Після перемикання до звичайного TUI використайте `/crestodian`, щоб повернутися до Crestodian.
Ви можете додати наступний запит:

```text
/crestodian
/crestodian restart gateway
```

Перемикання агентів у межах TUI залишає підказку, що `/crestodian` доступний.

## Режим відновлення повідомлень

Режим відновлення повідомлень — це точка входу до Crestodian через канал повідомлень. Він призначений для
випадку, коли ваш звичайний агент не працює, але довірений канал, такий як WhatsApp,
усе ще отримує команди.

Підтримувана текстова команда:

- `/crestodian <request>`

Потік для оператора:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Створення агента також можна поставити в чергу з локального запиту або режиму відновлення:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Віддалений режим відновлення — це поверхня адміністрування. До нього слід ставитися як до
віддаленого відновлення конфігурації, а не як до звичайного чату.

Контракт безпеки для віддаленого відновлення:

- Вимкнено, коли активне sandboxing. Якщо агент/session працює в sandbox,
  Crestodian має відмовити у віддаленому відновленні й пояснити, що потрібне локальне відновлення через CLI.
- Ефективний стан за замовчуванням — `auto`: дозволяти віддалене відновлення лише в довіреному режимі YOLO,
  де середовище виконання вже має локальні повноваження без sandbox.
- Вимагати явної identity власника. Відновлення не повинно приймати правила відправника з wildcard, відкриту політику group,
  неавтентифіковані Webhook або анонімні канали.
- Лише owner DM за замовчуванням. Відновлення в group/channel потребує явного opt-in і
  все одно має маршрутизувати запити на підтвердження до owner DM.
- Віддалене відновлення не може відкрити локальний TUI або перемкнутися в інтерактивну сесію агента.
  Для передачі агенту використовуйте локальний `openclaw`.
- Постійні записи все одно потребують підтвердження, навіть у режимі відновлення.
- Аудитуйте кожну застосовану операцію відновлення, включно з channel, account, sender,
  ключем session, операцією, хешем конфігурації до та хешем конфігурації після.
- Ніколи не віддзеркалюйте секрети. Перевірка SecretRef має повідомляти про доступність, а не
  про значення.
- Якщо Gateway працює, надавайте перевагу типізованим операціям Gateway. Якщо Gateway
  не працює, використовуйте лише мінімальну локальну поверхню відновлення, яка не залежить
  від звичайного циклу агента.

Форма конфігурації:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` має приймати:

- `"auto"`: значення за замовчуванням. Дозволяти лише тоді, коли ефективне середовище виконання — YOLO, а
  sandboxing вимкнено.
- `false`: ніколи не дозволяти відновлення через канал повідомлень.
- `true`: явно дозволяти відновлення, коли перевірки owner/channel пройдено. Це
  все одно не повинно обходити заборону sandboxing.

Поведінка YOLO за замовчуванням для `"auto"`:

- режим sandbox має значення `off`
- `tools.exec.security` має значення `full`
- `tools.exec.ask` має значення `off`

Віддалене відновлення покривається Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

Резервний локальний планувальник у безконфігураційному режимі покривається:

```bash
pnpm test:docker:crestodian-planner
```

Opt-in live smoke-перевірка поверхні команд каналу перевіряє `/crestodian status`, а також
цикл постійного підтвердження через обробник відновлення:

```bash
pnpm test:live:crestodian-rescue-channel
```

Нове безконфігураційне налаштування через Crestodian покривається:

```bash
pnpm test:docker:crestodian-first-run
```

Ця lane починається з порожнього каталогу стану, спрямовує `openclaw` без аргументів до Crestodian,
установлює модель за замовчуванням, створює додаткового агента, налаштовує Discord через
увімкнення Plugin та token SecretRef, виконує validate config і перевіряє журнал
аудиту. QA Lab також має сценарій із підтримкою repo для того самого потоку Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Doctor](/uk/cli/doctor)
- [TUI](/uk/cli/tui)
- [Sandbox](/uk/cli/sandbox)
- [Безпека](/uk/cli/security)
