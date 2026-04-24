---
read_when:
    - Ви використовуєте `openclaw browser` і хочете приклади для типових завдань
    - Ви хочете керувати браузером, що працює на іншій машині, через вузол-хост
    - Ви хочете підключитися до локального Chrome, у якому вже виконано вхід, через Chrome MCP
summary: Довідка CLI для `openclaw browser` (життєвий цикл, профілі, вкладки, дії, стан і налагодження)
title: Браузер
x-i18n:
    generated_at: "2026-04-24T04:11:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Керуйте поверхнею керування браузером OpenClaw і виконуйте дії в браузері (життєвий цикл, профілі, вкладки, знімки, знімки екрана, навігація, введення, емуляція стану та налагодження).

Пов’язане:

- Інструмент Browser + API: [Інструмент Browser](/uk/tools/browser)

## Поширені прапорці

- `--url <gatewayWsUrl>`: URL WebSocket Gateway (типово з конфігурації).
- `--token <token>`: токен Gateway (якщо потрібен).
- `--timeout <ms>`: тайм-аут запиту (мс).
- `--expect-final`: очікувати фінальну відповідь Gateway.
- `--browser-profile <name>`: вибрати профіль браузера (типовий береться з конфігурації).
- `--json`: машиночитаний вивід (де підтримується).

## Швидкий старт (локально)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Швидке усунення несправностей

Якщо `start` завершується помилкою `not reachable after start`, спочатку перевірте готовність CDP. Якщо `start` і `tabs` виконуються успішно, але `open` або `navigate` не працюють, площина керування браузером справна, і збій зазвичай спричинений політикою SSRF для навігації.

Мінімальна послідовність:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Докладні вказівки: [Усунення несправностей Browser](/uk/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Життєвий цикл

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Примітки:

- Для профілів `attachOnly` і віддалених CDP `openclaw browser stop` закриває
  активну сесію керування та очищає тимчасові перевизначення емуляції, навіть
  якщо OpenClaw сам не запускав процес браузера.
- Для локальних керованих профілів `openclaw browser stop` зупиняє запущений
  процес браузера.

## Якщо команда відсутня

Якщо `openclaw browser` — невідома команда, перевірте `plugins.allow` у
`~/.openclaw/openclaw.json`.

Коли `plugins.allow` присутній, вбудований Plugin браузера має бути вказаний
явно:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` не відновлює підкоманду CLI, якщо список дозволених Plugin
виключає `browser`.

Пов’язане: [Інструмент Browser](/uk/tools/browser#missing-browser-command-or-tool)

## Профілі

Профілі — це іменовані конфігурації маршрутизації браузера. На практиці:

- `openclaw`: запускає або підключається до окремого екземпляра Chrome, керованого OpenClaw (ізольований каталог користувацьких даних).
- `user`: керує вашою наявною сесією Chrome, у якій уже виконано вхід, через Chrome DevTools MCP.
- власні профілі CDP: вказують на локальну або віддалену кінцеву точку CDP.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Використання конкретного профілю:

```bash
openclaw browser --browser-profile work tabs
```

## Вкладки

```bash
openclaw browser tabs
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Знімок / знімок екрана / дії

Знімок:

```bash
openclaw browser snapshot
```

Знімок екрана:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Примітки:

- `--full-page` призначений лише для знімків сторінки; його не можна поєднувати з `--ref`
  або `--element`.
- Профілі `existing-session` / `user` підтримують знімки екрана сторінки та знімки
  екрана `--ref` із виводу snapshot, але не підтримують знімки екрана CSS `--element`.

Навігація/клік/введення (автоматизація інтерфейсу на основі ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

Допоміжні команди для файлів і діалогів:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

## Стан і сховище

Область перегляду + емуляція:

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

Файли cookie + сховище:

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

Цей шлях працює лише на хості. Для Docker, безголових серверів, Browserless або інших віддалених налаштувань замість цього використовуйте профіль CDP.

Поточні обмеження existing-session:

- дії на основі snapshot використовують ref, а не CSS-селектори
- `click` підтримує лише ліву кнопку миші
- `type` не підтримує `slowly=true`
- `press` не підтримує `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` і `evaluate` відхиляють
  перевизначення тайм-ауту для окремого виклику
- `select` підтримує лише одне значення
- `wait --load networkidle` не підтримується
- завантаження файлів вимагає `--ref` / `--input-ref`, не підтримує CSS
  `--element`, і наразі підтримує лише один файл за раз
- обробники діалогів не підтримують `--timeout`
- знімки екрана підтримують знімки сторінки та `--ref`, але не CSS `--element`
- `responsebody`, перехоплення завантажень, експорт PDF і пакетні дії досі
  вимагають керований браузер або сирий профіль CDP

## Віддалене керування браузером (проксі вузла-хоста)

Якщо Gateway працює на іншій машині, ніж браузер, запустіть **вузол-хост** на машині, де є Chrome/Brave/Edge/Chromium. Gateway проксіюватиме дії браузера до цього вузла (окремий сервер керування браузером не потрібен).

Використовуйте `gateway.nodes.browser.mode`, щоб керувати автоматичною маршрутизацією, і `gateway.nodes.browser.node`, щоб закріпити конкретний вузол, якщо підключено кілька вузлів.

Безпека + віддалене налаштування: [Інструмент Browser](/uk/tools/browser), [Віддалений доступ](/uk/gateway/remote), [Tailscale](/uk/gateway/tailscale), [Безпека](/uk/gateway/security)

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Browser](/uk/tools/browser)
