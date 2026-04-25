---
read_when:
    - Написання сценаріїв або налагодження браузера агента через локальний API керування
    - Шукаєте довідку CLI `openclaw browser`
    - Додавання власної автоматизації браузера зі знімками та посиланнями ref
summary: API керування браузером OpenClaw, довідка CLI та дії сценаріїв
title: API керування браузером
x-i18n:
    generated_at: "2026-04-25T08:55:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 179d2422fa5db219a81486ad6e0d34a79cfb08a3f827c69cba8f6578a00fb2c0
    source_path: tools/browser-control.md
    workflow: 15
---

Для налаштування, конфігурації та усунення несправностей див. [Browser](/uk/tools/browser).
Ця сторінка є довідником для локального HTTP API керування, CLI `openclaw browser`
та шаблонів написання сценаріїв (знімки, ref, очікування, потоки налагодження).

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Знімок/скриншот: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Хуки: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі кінцеві точки приймають `?profile=<name>`.

Якщо налаштовано автентифікацію gateway зі спільним секретом, HTTP-маршрути браузера також потребують автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує заголовки ідентифікації trusted-proxy або Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера не успадковують ці режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та збоїв політик:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнається.
- `ACT_INVALID_REQUEST` (HTTP 400): корисне навантаження дії не пройшло нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` було використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з цільовим об’єктом запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої виконання все ще можуть повертати `{ "error": "<message>" }` без поля `code`.

### Вимога Playwright

Деякі можливості (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA snapshots
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти на основі ref для `existing-session` (`--ref`) із виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Скриншоти елементів за CSS-селекторами (`--element`)
- Повний експорт PDF браузера

Скриншоти елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть
залежності середовища виконання вбудованого браузерного Plugin, щоб було встановлено `playwright-core`,
а потім перезапустіть Gateway. Для пакетних установок виконайте `openclaw doctor --fix`.
Для Docker також установіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначення npm).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Невеликий loopback-сервер керування приймає HTTP-запити й підключається до браузерів на базі Chromium через CDP. Розширені дії (click/type/snapshot/PDF) виконуються через Playwright поверх CDP; коли Playwright відсутній, доступні лише операції без Playwright. Агент бачить один стабільний інтерфейс, тоді як локальні/віддалені браузери та профілі вільно змінюються під ним.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на певний профіль і `--json` для машиночитаного виводу.

<AccordionGroup>

<Accordion title="Основи: стан, вкладки, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Інспекція: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
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
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
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
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Примітки:

- `upload` і `dialog` — це виклики **підготовки**; запускайте їх перед click/press, що ініціює вибір файлу/діалог.
- `click`/`type`/тощо потребують `ref` із `snapshot` (числовий `12`, role ref `e12` або actionable ARIA ref `ax12`). CSS-селектори навмисно не підтримуються для дій. Використовуйте `click-coords`, коли видима позиція у viewport є єдиною надійною ціллю.
- Шляхи для download, trace і upload обмежені тимчасовими кореневими каталогами OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (резервний варіант: `${os.tmpdir()}/openclaw/...`).
- `upload` також може напряму задавати file input через `--input-ref` або `--element`.

Прапорці snapshot коротко:

- `--format ai` (типово з Playwright): AI snapshot із числовими ref (`aria-ref="<n>"`).
- `--format aria`: дерево доступності з ref `axN`. Коли Playwright доступний, OpenClaw прив’язує ref через backend DOM id до живої сторінки, щоб наступні дії могли їх використовувати; інакше сприймайте вивід лише як інспекційний.
- `--efficient` (або `--mode efficient`): компактний preset role snapshot. Установіть `browser.snapshotDefaults.mode: "efficient"`, щоб зробити це типовим режимом (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` примусово вмикають role snapshot з ref `ref=e12`. `--frame "<iframe>"` обмежує role snapshot вказаним iframe.
- `--labels` додає скриншот лише viewport із накладеними мітками ref (виводить `MEDIA:<path>`).
- `--urls` додає знайдені адреси посилань до AI snapshots.

## Знімки та ref

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, що містить числові ref.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через `aria-ref` Playwright.

- **Role snapshot (role ref на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот viewport із накладеними мітками `e12`.
  - Додайте `--urls`, коли текст посилання неоднозначний і агенту потрібні конкретні
    цілі навігації.

- **ARIA snapshot (ARIA ref на кшталт `ax12`)**: `openclaw browser snapshot --format aria`
  - Вивід: дерево доступності як структуровані вузли.
  - Дії: `openclaw browser click ax12` працює, коли шлях snapshot може прив’язати
    ref через Playwright і backend DOM id Chrome.
  - Якщо Playwright недоступний, ARIA snapshots усе ще можуть бути корисними для
    інспекції, але ref можуть не бути придатними для дій. Повторно виконайте snapshot з `--format ai`
    або `--interactive`, коли вам потрібні ref для дій.

Поведінка ref:

- Ref **не є стабільними між навігаціями**; якщо щось не спрацьовує, повторно виконайте `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role ref обмежуються цим iframe до наступного role snapshot.
- Невідомі або застарілі ref `axN` завершуються швидкою помилкою замість переходу до
  селектора `aria-ref` Playwright. Коли це стається, виконайте новий snapshot на тій самій вкладці.

## Розширені можливості wait

Ви можете чекати не лише час/текст:

- Очікування URL (підтримуються glob-шаблони Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування видимості селектора:
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

Коли дія не виконується (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (в interactive mode надавайте перевагу role ref)
3. Якщо це все одно не спрацьовує: `openclaw browser highlight <ref>`, щоб побачити, на що саме націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначено для сценаріїв і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність корисного навантаження.

## Параметри стану та середовища

Вони корисні для сценаріїв “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий варіант `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP Basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Медіа: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (попередньо визначені пристрої Playwright)
  - `set viewport 1280 720`

## Безпека та конфіденційність

- Профіль браузера openclaw може містити сеанси з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  впливати на це. Вимкніть це через `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Про входи в систему та примітки щодо anti-bot (X/Twitter тощо) див. [Browser login + X/Twitter posting](/uk/tools/browser-login).
- Тримайте хост Gateway/node приватним (лише loopback або лише tailnet).
- Віддалені кінцеві точки CDP мають широкі можливості; використовуйте тунелювання та захищайте їх.

Приклад strict mode (типово блокувати приватні/внутрішні призначення):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Пов’язане

- [Browser](/uk/tools/browser) — огляд, конфігурація, профілі, безпека
- [Browser login](/uk/tools/browser-login) — вхід на сайти
- [Усунення несправностей Browser у Linux](/uk/tools/browser-linux-troubleshooting)
- [Усунення несправностей Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
