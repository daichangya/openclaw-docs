---
read_when:
    - Скриптування або налагодження браузера агента через локальний API керування
    - Шукаєте довідник CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та посиланнями refs
summary: API керування браузером OpenClaw, довідник CLI та дії для скриптів
title: API керування браузером
x-i18n:
    generated_at: "2026-04-26T03:56:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Налаштування, конфігурацію та усунення несправностей див. у [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
і шаблонів скриптування (знімки, refs, очікування, потоки налагодження).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/скриншот: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі endpoint-и приймають `?profile=<name>`. `POST /start?headless=true` запитує
одноразовий запуск headless для локально керованих профілів без зміни збереженої
конфігурації браузера; профілі лише з attach, віддаленого CDP та наявної сесії
відхиляють це перевизначення, оскільки OpenClaw не запускає ці процеси браузера.

Якщо налаштовано автентифікацію gateway зі спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує заголовки trusted-proxy або
  ідентифікації Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентифікацією; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для перевірки на рівні маршруту та
збоїв політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або перевірку.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з цільовим target запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів наявної сесії.

Інші збої часу виконання можуть, як і раніше, повертати `{ "error": "<message>" }` без поля
`code`.

### Вимога Playwright

Для деяких функцій (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці endpoint-и повертають
чітку помилку 501.

Що все ще працює без Playwright:

- Знімки ARIA
- Знімки доступності у стилі ролей (`--interactive`, `--compact`,
  `--depth`, `--efficient`), коли доступний WebSocket CDP для окремої вкладки. Це
  резервний варіант для перевірки та виявлення ref; Playwright залишається основним рушієм дій.
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket CDP
  для окремої вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти за ref для `existing-session` (`--ref`) із виводу знімка

Що все ще потребує Playwright:

- `navigate`
- `act`
- Знімки AI, що залежать від нативного формату знімків AI у Playwright
- Скриншоти елементів за CSS-селекторами (`--element`)
- повний експорт PDF браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, виправте
залежності runtime комплектного plugin браузера, щоб було встановлено `playwright-core`,
а потім перезапустіть gateway. Для пакетних інсталяцій виконайте `openclaw doctor --fix`.
Для Docker також установіть бінарні файли браузера Chromium, як показано нижче.

#### Встановлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначень npm).
Використовуйте комплектний CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити й підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери й профілі можуть вільно змінюватися під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлення на конкретний профіль і `--json` для машинозчитуваного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, відкриття/фокус/закриття">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # одноразовий локальний керований headless-запуск
openclaw browser stop            # також очищає емуляцію для attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # скорочення для поточної вкладки
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Перевірка: скриншот, знімок, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # або --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Дії: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # або e12 для role refs
openclaw browser click-coords 120 340        # координати в області перегляду
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Стан: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear для видалення
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` — це виклики **підготовки**; запускайте їх перед click/press, який викликає chooser/dialog.
- `click`/`type`/тощо вимагають `ref` із `snapshot` (числовий `12`, role ref `e12` або дієвий ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли єдиною надійною ціллю є видима позиція в області перегляду.
- Шляхи download, trace і upload обмежені тимчасовими кореневими каталогами OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму встановлювати file input через `--input-ref` або `--element`.

Стабільні id вкладок і мітки зберігаються попри заміну сирого target Chromium, коли OpenClaw
може довести, що це вкладка-замінник, наприклад та сама URL-адреса або одна стара вкладка, що стала однією новою після надсилання форми. Сирі id target усе ще нестабільні; у скриптах надавайте перевагу `suggestedTargetId` із `tabs`.

Прапорці знімків коротко:

- `--format ai` (типове значення з Playwright): знімок AI з числовими ref (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з ref `axN`. Коли Playwright доступний, OpenClaw прив’язує refs із backend DOM id до живої сторінки, щоб подальші дії могли їх використовувати; інакше сприймайте вивід лише як засіб перевірки.
- `--efficient` (або `--mode efficient`): компактний пресет role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим значенням (див. [Gateway configuration](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово використовують role snapshot із ref `ref=e12`. `--frame "<iframe>"` обмежує role snapshot iframe.
- `--labels` додає скриншот лише області перегляду з накладеними мітками ref (виводить `MEDIA:<path>`).
- `--urls` додає виявлені адреси посилань до знімків AI.

## Знімки та refs

OpenClaw підтримує два стилі “snapshot”:

- **Знімок AI (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий знімок, що містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через `aria-ref` Playwright.

- **Role snapshot (role refs, такі як `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот області перегляду з накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **Знімок ARIA (ARIA refs, такі як `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях знімка може прив’язати
    ref через Playwright і Chrome backend DOM id.
- Якщо Playwright недоступний, знімки ARIA все одно можуть бути корисними для
  перевірки, але refs можуть не бути придатними для дій. Створіть знімок повторно з `--format ai`
  або `--interactive`, коли вам потрібні refs для дій.
- Доказ для Docker для резервного шляху raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  запускає Chromium із CDP, виконує `browser doctor --deep` і перевіряє, що role
  snapshots включають URL-адреси посилань, клікабельні елементи з просуванням курсора та метадані iframe.

Поведінка ref:

- Refs **не є стабільними між переходами**; якщо щось не спрацювало, знову виконайте `snapshot` і використайте новий ref.
- `/act` повертає поточний сирий `targetId` після заміни, спричиненої дією,
  коли може довести, що це вкладка-замінник. Для наступних команд продовжуйте використовувати
  стабільні id/мітки вкладок.
- Якщо role snapshot було зроблено з `--frame`, role refs обмежуються цим iframe до наступного role snapshot.
- Невідомі або застарілі refs `axN` завершуються швидкою помилкою замість переходу до
  селектора `aria-ref` у Playwright. Коли це трапляється, виконайте новий snapshot на тій самій вкладці.

## Розширені можливості wait

Можна очікувати не лише час/текст:

- Очікування URL (globs підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування предиката JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, поки selector стане видимим:
  - `openclaw browser wait "#main"`

Їх можна поєднувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Потоки налагодження

Коли дія завершується помилкою (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (у інтерактивному режимі віддавайте перевагу role refs)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначений для скриптування та структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для сценаріїв «змусити сайт поводитися як X»:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Ін’єкція в prompt може
  спрямовувати це. Вимкніть це через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Для входу на сайти та приміток щодо anti-bot (X/Twitter тощо) див. [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або тільки tailnet).
- Віддалені endpoint-и CDP мають широкі можливості; використовуйте тунель і захищайте їх.

Приклад strict mode (типово блокувати приватні/внутрішні призначення):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // необов’язковий точний дозвіл
    },
  },
}
```

## Пов’язане

- [Browser](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Browser login](/uk/tools/browser-login) — вхід на сайти
- [Browser Linux troubleshooting](/uk/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
