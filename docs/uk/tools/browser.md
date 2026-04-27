---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера + життєвого циклу в програмі macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-27T09:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено плагін браузера.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим основним щоденним браузером. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення “Browser disabled”, увімкніть браузер у конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Інструмент `browser` за замовчуванням — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Для типових значень потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` лишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
запущений субагент має використовувати автоматизацію браузера, додайте browser
на етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для окремого агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного лише `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що політика субагента
застосовується після фільтрації профілю.

Плагін браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: обрати
  правильний профіль, зберігати ref в межах тієї самої вкладки, використовувати `tabId`/мітки для націлювання на вкладки
  та завантажувати skill браузера для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряти статус/вкладки, позначати вкладки завдання, робити snapshot перед дією,
  повторно робити snapshot після змін UI, один раз відновлюватися після stale refs і повідомляти про
  блокування логіном/2FA/captcha або камерою/мікрофоном як про ручну дію замість здогадок.

Skills, вбудовані в Plugin, перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
цикли не сплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичною причиною є список `plugins.allow`, у якому немає `browser`, і відсутній кореневий блок конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований плагін браузера навіть за обмежувального `plugins.allow`, що відповідає поведінці конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі по собі не замінюють членство в allowlist. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії та користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли ви хочете певний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера знаходяться в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Порти й доступність">

- Сервіс керування прив’язується до local loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій сім’ї.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого й `attachOnly` CDP
  та HTTP-запитів на відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх CDP WebSocket handshakes.
- `localLaunchTimeoutMs` — це бюджет часу для локально запущеного керованого процесу Chrome,
  щоб відкрити свій CDP HTTP endpoint. `localCdpReadyTimeoutMs` — це
  наступний бюджет для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, дешевих VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; недійсні
  значення конфігурації відхиляються.
- Повторні збої запуску/готовності керованого Chrome мають circuit breaker для
  кожного профілю. Після кількох послідовних збоїв OpenClaw ненадовго призупиняє нові
  спроби запуску замість запуску Chromium під час кожного виклику інструмента браузера. Виправте
  проблему запуску, вимкніть браузер, якщо він не потрібен, або перезапустіть
  Gateway після виправлення.
- `actionTimeoutMs` — це типовий бюджет часу для запитів браузерного `act`, коли викликаюча сторона не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб довгі очікування могли завершитися, а не завершувалися тайм-аутом на межі HTTP.
- `tabCleanup` — це best-effort очищення для вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу субагента, Cron і ACP однаково закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або надлишкові відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед переходом і повторно перевіряються в режимі best-effort на фінальному `http(s)` URL після нього.
- У суворому режимі SSRF також перевіряються виявлення endpoint віддаленого CDP і перевірки `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють браузер, керований OpenClaw, автоматично. Керований Chrome типово запускається напряму, тому налаштування проксі provider не послаблюють перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Суворий режим SSRF блокує явну маршрутизацію браузера через проксі, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` лишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет над `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий headless-запуск для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  віддалені профілі CDP відхиляють це перевизначення, тому що OpenClaw не запускає
  ці процеси браузера.
- На Linux-хостах без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично переходять у headless-режим, коли ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирає режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає headless для локальних керованих запусків у
  поточному процесі. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає практичну помилку на Linux-хостах без сервера дисплея;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет над `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня і для окремого профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб перейти на авторизований браузер користувача.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на базі Chromium

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` верхнього рівня та для окремих профілів приймають `~`
для домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації для кожної платформи:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає
OpenClaw. Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне й віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (node host):** запустіть node host на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також установіть `attachOnly: true`. Loopback CDP
  без `attachOnly` вважається локальним профілем браузера, керованого OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Це не перезапускає і не змінює браузери existing-session або віддалені браузери CDP.
- `executablePath` дотримується того самого правила локальних керованих профілів. Зміна його для
  запущеного локального керованого профілю позначає цей профіль для restart/reconcile, щоб
  наступний запуск використав новий двійковий файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активну
  сесію керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим і подібний стан), навіть
  якщо жоден процес браузера не було запущено OpenClaw

URL віддаленого CDP можуть містити автентифікацію:

- Токени в query (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час викликів endpoint-ів `/json/*` і під час підключення
до CDP WebSocket. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не комітити їх у файли конфігурації.

## Проксі браузера Node (zero-config за замовчуванням)

Якщо ви запускаєте **node host** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього node без додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Node host надає свій локальний сервер керування браузером через **команду проксі**.
- Профілі беруться з власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає його як межу найменших привілеїв: націлюватися можна лише на профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостингований віддалений CDP)

[Browserless](https://browserless.io) — це хостингований сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
з документації підключення Browserless.

Приклад:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Примітки:

- Замініть `<BROWSERLESS_API_KEY>` на ваш справжній токен Browserless.
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщений у Docker, а OpenClaw працює на хості, розглядайте
Browserless як зовнішньо керований сервіс CDP:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Адреса в `browser.profiles.browserless.cdpUrl` має бути досяжною з процесу
OpenClaw. Browserless також має рекламувати відповідний досяжний endpoint;
установіть Browserless `EXTERNAL` на ту саму WebSocket-базу, доступну OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу Docker
мережі. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недосяжну для OpenClaw, CDP HTTP може виглядати справним, тоді як підключення WebSocket
усе одно не вдасться.

Не залишайте `attachOnly` незаданим для loopback-профілю Browserless. Без
`attachOnly` OpenClaw розглядає loopback-порт як локальний профіль браузера,
керований OpenClaw, і може повідомляти, що порт використовується, але не належить OpenClaw.

## Прямі постачальники WebSocket CDP

Деякі хостинговані сервіси браузерів надають **прямий endpoint WebSocket**, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми
URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відлагоджувача WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoint-и WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Корені WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить на прямий WebSocket handshake в корені без шляху. Якщо рекламований
  endpoint WebSocket відхиляє CDP handshake, але налаштований корінь без шляху
  його приймає, OpenClaw також переходить на цей корінь. Це дозволяє bare `ws://`,
  спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome приймає WebSocket
  upgrades лише на конкретному шляху для цілі з `/json/version`, тоді як хостинговані
  постачальники все одно можуть використовувати свій кореневий endpoint WebSocket, коли їхній endpoint
  виявлення рекламує короткоживучий URL, який не підходить для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
проксі.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Примітки:

- [Зареєструйтеся](https://www.browserbase.com/sign-up) і скопіюйте свій **API Key**
  з [панелі Overview](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тож
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію і одну годину браузера на місяць.
  Обмеження платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth із токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено, а автентифікацію спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які node hosts у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint-ам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом користувацьких даних + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типова поведінка:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, крім `user`, є opt-in; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до кошика.

Усі endpoint-и керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome.
`~` розгортається в домашній каталог вашої ОС:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Потім у відповідному браузері:

1. Відкрийте сторінку inspect цього браузера для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw підключатиметься.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test для live attach:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на підключення, і ви його підтвердили
- `openclaw doctor` переносить стару конфігурацію браузера на основі розширення і перевіряє, що
  Chrome локально встановлений для типових профілів автопідключення, але не може
  увімкнути віддалене налагодження в самому браузері замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або node host може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, тому що він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього драйвера; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному хості або через підключений
  browser node. Якщо Chrome працює деінде й жоден browser node не підключено, використовуйте
  віддалений CDP або node host.

### Власний запуск Chrome MCP

Перевизначайте сервер Chrome DevTools MCP, який запускається для профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
зафіксовані версії, vendored binaries):

| Field        | Що робить                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який запускається замість `npx`. Розв’язується як є; абсолютні шляхи підтримуються.                     |
| `mcpArgs`    | Масив аргументів, який буквально передається в `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли `cdpUrl` задано в профілі existing-session, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці endpoint-а й `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP підключається до
запущеного браузера за цим endpoint-ом, а не відкриває каталог
профілю.

<Accordion title="Обмеження функцій existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елемента через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків сторінки або елемента за ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують refs зі snapshot (без CSS-селекторів). `click-coords` натискає за видимими координатами viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження файлів / діалоги** — `wait --url` підтримує точні, часткові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-аутів.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб не створювати конфліктів із dev-робочими процесами.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агентам слід повторно використовувати `suggestedTargetId`; сирі id лишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **loopback-only HTTP
API керування** плюс відповідний CLI `openclaw browser` (snapshots, refs, wait
power-ups, вивід JSON, робочі процеси налагодження). Повний довідник дивіться в
[Browser control API](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome дивіться
[WSL2 + Windows + усунення несправностей віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування навігації SSRF

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює справно.
- **Блокування навігації SSRF** означає, що площина керування браузером працює справно, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішній loopback-сервіс CDP налаштовано без `attachOnly: true`
- Блокування навігації SSRF:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розділити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` не працює, площина керування все ще нездорова. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` не працює, площина керування браузером працює, а збій — у політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Конфігурація браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки стану CDP навмисно пропускають застосування досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, а не широкому доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує `ref` ID зі snapshot для натискання/введення/перетягування/вибору.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору, де саме працює браузер.
  - У sandboxed-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed-сесії за замовчуванням використовують `sandbox`, а не sandboxed-сесії — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
