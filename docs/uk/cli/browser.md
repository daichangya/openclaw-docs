---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для поширених завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через хост node
    - Ви хочете підключитися до свого локального Chrome, у якому вже виконано вхід, через Chrome MCP
summary: Довідник CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-26T03:54:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і виконуйте дії браузера (життєвий цикл, профілі, вкладки, знімки, знімки екрана, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент і API браузера: [Інструмент браузера](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL Gateway WebSocket (типово береться з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: чекати на фінальну відповідь Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий береться з конфігурації).
- `--json`: машинозчитуваний вивід (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Агенти можуть виконати таку саму перевірку готовності за допомогою `browser({ action: "doctor" })`.

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спочатку усуньте проблеми з готовністю CDP. Якщо `start` і `tabs` працюють, але `open` або `navigate` завершується помилкою, то площина керування браузером справна, а збій зазвичай пов’язаний із політикою SSRF навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [Усунення несправностей браузера](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- `doctor --deep` додає live-перевірку знімка. Це корисно, коли базова готовність CDP зелена, але вам потрібне підтвердження, що поточну вкладку можна інспектувати.
- Для профілів `attachOnly` і віддалених профілів CDP `openclaw browser stop` закриває активну сесію керування та скидає тимчасові перевизначення емуляції, навіть якщо OpenClaw не запускав процес браузера самостійно.
- Для локальних керованих профілів `openclaw browser stop` зупиняє запущений процес браузера.
- `openclaw browser start --headless` застосовується лише до цього запиту запуску і лише коли OpenClaw запускає локальний керований браузер. Це не переписує `browser.headless` або конфігурацію профілю й не має ефекту для вже запущеного браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі автоматично працюють у режимі headless, якщо тільки `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` або `browser.profiles.<name>.headless=false` явно не вимагає видимий браузер.

## Якщо команда відсутня

Якщо `openclaw browser` є невідомою командою, перевірте `plugins.allow` у `~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований Plugin браузера має бути явно вказаний у списку:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, коли список дозволених Plugin не містить `browser`.

Пов’язане: [Інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або підключається до окремого екземпляра Chrome під керуванням OpenClaw (ізольований каталог користувацьких даних).
- `user`: керує вашою наявною сесією Chrome, у якій уже виконано вхід, через Chrome DevTools MCP.
- власні профілі CDP: вказують на локальну або віддалену кінцеву точку CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Використати конкретний профіль:

```bash
openclaw browser --browser-profile work tabs
```

## Вкладки

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` спочатку повертає `suggestedTargetId`, потім стабільний `tabId`, наприклад `t1`, необов’язкову мітку та сирий `targetId`. Агенти мають передавати `suggestedTargetId` назад у `focus`, `close`, знімки та дії. Ви можете призначити мітку через `open --label`, `tab new --label` або `tab label`; підтримуються мітки, ідентифікатори вкладок, сирі ідентифікатори цілей і унікальні префікси target-id. Коли Chromium замінює базову сиру ціль під час навігації або надсилання форми, OpenClaw зберігає стабільний `tabId`/мітку, прив’язану до вкладки-замінника, коли може підтвердити відповідність. Сирі target-id залишаються нестабільними; надавайте перевагу `suggestedTargetId`.

## Знімок / знімок екрана / дії

Знімок:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Знімок екрана:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

Примітки:

- `--full-page` призначений лише для захоплення сторінки; його не можна поєднувати з `--ref` або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінки та знімки екрана з `--ref` із виводу знімка, але не підтримують знімки екрана CSS `--element`.
- `--labels` накладає поточні refs зі знімка на знімок екрана.
- `snapshot --urls` додає виявлені адреси посилань до AI-знімків, щоб агенти могли вибирати прямі цілі навігації замість припущень лише за текстом посилання.

Навігація/клік/введення (автоматизація UI на основі ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Відповіді на дії повертають поточний сирий `targetId` після заміни сторінки, спричиненої дією, коли OpenClaw може підтвердити вкладку-замінник. Скрипти все одно мають зберігати й передавати `suggestedTargetId`/мітки для довготривалих робочих процесів.

Допоміжні команди для файлів і діалогів:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

Керовані профілі Chrome зберігають звичайні завантаження, ініційовані кліком, до каталогу завантажень OpenClaw (`/tmp/openclaw/downloads` типово або налаштований тимчасовий корінь). Використовуйте `waitfordownload` або `download`, коли агенту потрібно дочекатися конкретного файла й повернути його шлях; ці явні очікувачі керують наступним завантаженням.

## Стан і сховище

Viewport + емуляція:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + сховище:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Налагодження

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Наявний Chrome через MCP

Використовуйте вбудований профіль `user` або створіть власний профіль `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Цей шлях працює лише на хості. Для Docker, headless-серверів, Browserless або інших віддалених налаштувань використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії на основі знімків використовують refs, а не селектори CSS
- `browser.actionTimeoutMs` встановлює типовий тайм-аут 60000 мс для підтримуваних запитів `act`, коли виклики не передають `timeoutMs`; `timeoutMs` для окремого виклику все одно має пріоритет.
- `click` підтримує лише клік лівою кнопкою
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють перевизначення тайм-ауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- завантаження файлів вимагає `--ref` / `--input-ref`, не підтримує CSS `--element` і наразі підтримує один файл за раз
- хуки діалогів не підтримують `--timeout`
- знімки екрана підтримують захоплення сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

## Віддалене керування браузером (проксі node host)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **node host** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксуватиме дії браузера до цього node (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode` для керування автоматичною маршрутизацією та `gateway.nodes.browser.node` для прив’язки до конкретного node, якщо підключено кілька.

Безпека та віддалене налаштування: [Інструмент браузера](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Браузер](/uk/tools/browser)
