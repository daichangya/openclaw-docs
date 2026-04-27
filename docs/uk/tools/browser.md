---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та його життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (під керуванням OpenClaw)
x-i18n:
    generated_at: "2026-04-27T08:45:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65397ea2405aeb34d4e08c8968f3dc15ab8ed446c69d77274f069fc72f90c59a
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований навик `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено браузерний Plugin.
- Необов’язкову підтримку кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим основним щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації агентом і перевірки.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви бачите повідомлення “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що браузерний інструмент
недоступний, перейдіть до [Відсутня команда або інструмент browser](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент із назвою `browser`:

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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише Plugin, це як єдиний блок прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера вимагають перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Рекомендації для агента

Примітка про профіль інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
породжений підагент має використовувати автоматизацію браузера, додайте browser на етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного лише `tools.subagents.tools.allow: ["browser"]` недостатньо, оскільки політика підагента
застосовується після фільтрації профілю.

Browser Plugin постачається з двома рівнями рекомендацій для агента:

- Опис інструмента `browser` містить компактний, завжди активний контракт: обирайте
  правильний профіль, тримайте ref у межах однієї вкладки, використовуйте `tabId`/мітки для
  вибору вкладки та завантажуйте browser skill для багатокрокових завдань.
- Вбудований навик `browser-automation` містить довший робочий цикл:
  спочатку перевіряйте status/tabs, позначайте вкладки завдання, робіть snapshot перед дією,
  повторно знімайте snapshot після змін UI, один раз відновлюйте stale refs і повідомляйте про
  login/2FA/captcha або блокування camera/microphone як про ручну дію, а не вгадуйте.

Навички, вбудовані в Plugin, перелічуються серед доступних навичок агента, коли
Plugin увімкнено. Повні інструкції навички завантажуються на вимогу, тому звичайні
звернення не оплачують повну вартість у токенах.

## Відсутня команда або інструмент browser

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент browser недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`, і відсутній кореневий блок конфігурації `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Явний кореневий блок `browser`, наприклад `browser.enabled=true` або `browser.profiles.<name>`, активує вбудований browser Plugin навіть за обмежувального `plugins.allow`, що відповідає поведінці конфігурації каналів. `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` самі по собі не замінюють членство у списку дозволених. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої авторизованої сесії Chrome**.

Для викликів браузерного інструмента агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії, а користувач
  перебуває за комп’ютером і може натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера зберігаються у `~/.openclaw/openclaw.json`.

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

<Accordion title="Порти та доступність">

- Сервіс керування прив’язується до local loopback на порті, похідному від `gateway.port` (типово `18791` = Gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP для віддалених і `attachOnly` CDP, а також до HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до їхніх WebSocket-handshake CDP.
- `localLaunchTimeoutMs` — це бюджет часу, протягом якого локально запущений керований процес Chrome
  має відкрити свій CDP HTTP endpoint. `localCdpReadyTimeoutMs` — це
  наступний бюджет часу для готовності CDP websocket після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, малопотужних VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; некоректні
  значення конфігурації відхиляються.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли виклик не передає `timeoutMs`. Транспорт клієнта додає невелике запасне вікно, щоб довгі очікування могли завершитися, а не обривалися на межі HTTP-таймауту.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сесіями browser агента. Очищення життєвого циклу підагента, Cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені SSRF-перевіркою перед переходом і повторно best-effort перевіряються на фінальній URL-адресі `http(s)` після цього.
- У строгому режимі SSRF також перевіряються виявлення віддаленого CDP endpoint і зондування `/json/version` (`cdpUrl`).
- Змінні середовища `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` для Gateway/provider не проксіюють автоматично браузер під керуванням OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування проксі provider не послаблювали SSRF-перевірки браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не був навмисно увімкнений.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте його лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, тому що OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у режим headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирають режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає запуск локальних керованих браузерів у режимі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає придатну до дії помилку на хостах Linux без display server;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення на рівні профілю перевизначають `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми підтримують `~` для домашнього каталогу вашої ОС.
- `color` (верхній рівень і рівень профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб типово перейти на авторизований браузер користувача.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також підтримує `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave або іншого браузера на базі Chromium

Якщо ваш **системний браузер за замовчуванням** побудований на Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. Значення `executablePath` на верхньому рівні й рівні профілю підтримують `~`
для домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації, окремо для кожної платформи:

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

`executablePath` на рівні профілю впливає лише на локальні керовані профілі, які
запускає OpenClaw. Натомість профілі `existing-session` підключаються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (хост Node):** запустіть хост Node на машині, де є браузер; Gateway проксіюватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`) також установіть `attachOnly: true`. CDP на loopback
  без `attachOnly` розглядається як локальний профіль браузера під керуванням OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддалені браузери CDP.
- `executablePath` дотримується того самого правила для локальних керованих профілів. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені профілі CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав процес браузера

URL-адреси віддаленого CDP можуть містити автентифікацію:

- Токени в параметрах запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає ці дані автентифікації під час виклику endpoint-ів `/json/*` і при підключенні
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не комітити їх у файли конфігурації.

## Проксі браузера Node (типовий режим без конфігурації)

Якщо ви запускаєте **хост Node** на машині, де є ваш браузер, OpenClaw може
автоматично спрямовувати виклики браузерного інструмента на цей вузол без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Хост Node надає свій локальний сервер керування браузером через **проксі-команду**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядатиме його як межу мінімальних привілеїв: можна буде націлюватися лише на профілі зі списку дозволених, а маршрути створення/видалення постійних профілів будуть заблоковані на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL-адреси підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку з форм, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
із документації Browserless про підключення.

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
- Якщо Browserless надає вам базову URL-адресу HTTPS, ви можете або перетворити її на
  `wss://` для прямого підключення CDP, або залишити HTTPS URL і дозволити OpenClaw
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
OpenClaw. Browserless також має оголошувати відповідний досяжний endpoint; установіть Browserless `EXTERNAL` на ту саму доступну OpenClaw публічну WebSocket-базу, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну адресу мережі Docker.
Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на адресу, недосяжну для OpenClaw,
HTTP CDP може виглядати справним, тоді як підключення WebSocket усе одно не вдасться.

Не залишайте `attachOnly` незаданим для профілю Browserless на loopback. Без
`attachOnly` OpenClaw розглядає loopback-порт як локальний керований профіль браузера
і може повідомляти, що порт використовується, але не належить OpenClaw.

## Прямі провайдери WebSocket CDP

Деякі розміщені браузерні сервіси надають **прямий endpoint WebSocket**, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми
URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Без запасного варіанта WebSocket.
- **Прямі endpoint-и WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на голому корені. Якщо оголошений
  endpoint WebSocket відхиляє handshake CDP, але налаштований голий корінь
  його приймає, OpenClaw також повертається до цього кореня. Це дає змогу голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome приймає оновлення WebSocket
  лише на конкретному шляху для цілі з `/json/version`, тоді як розміщені
  провайдери все ще можуть використовувати свій кореневий endpoint WebSocket, коли їхній endpoint виявлення
  оголошує короткоживучу URL-адресу, непридатну для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та резидентними
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
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Обмеження платних тарифів дивіться в розділі [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спаровування вузлів.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічної доступності.
- Вважайте URL-адреси/токени віддаленого CDP секретами; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint-ам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **під керуванням OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явна URL-адреса CDP (браузер на базі Chromium працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для підключення до existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до кошика.

Усі endpoint-и керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це дає змогу повторно використовувати вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Використання Chrome DevTools MCP із сесією вашого браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний кастомний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome.
`~` розгортається до домашнього каталогу вашої ОС:

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
3. Не закривайте браузер і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Живий smoke-тест підключення:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успішного підключення:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome встановлено локально для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером і може підтвердити
  запит на підключення.
- Gateway або хост Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього драйвера; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі для націлювання на цей каталог
  користувацьких даних.
- Existing-session може підключатися на вибраному хості або через підключений
  браузерний вузол. Якщо Chrome розміщено деінде і жоден браузерний вузол не підключено, використовуйте
  віддалений CDP або хост Node.

### Користувацький запуск Chrome MCP

Перевизначте запущений сервер Chrome DevTools MCP для кожного профілю, якщо типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, вендорні бінарні файли):

| Поле        | Що воно робить                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який потрібно запустити замість `npx`. Визначається як є; абсолютні шляхи підтримуються.                                          |
| `mcpArgs`    | Масив аргументів, який безпосередньо передається до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли для профілю existing-session встановлено `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (HTTP endpoint виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці endpoint-ів і `userDataDir` не можна поєднувати: коли встановлено `cdpUrl`,
`userDataDir` ігнорується під час запуску Chrome MCP, оскільки Chrome MCP підключається до
вже запущеного браузера за endpoint-ом, а не відкриває каталог
профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки або елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` натискає у видимих координатах viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують таймаути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження файлів / діалоги** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення таймаутів.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб не конфліктувати з робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі ідентифікатори залишаються доступними для
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

- macOS: перевіряються `/Applications` і `~/Applications`.
- Linux: перевіряються поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряються типові місця встановлення.

## API керування (необов’язково)

Для сценаріїв автоматизації та налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
разом із відповідним CLI `openclaw browser` (snapshots, refs, розширення wait,
вивід JSON, робочі процеси налагодження). Повний довідник дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome дивіться
[Усунення несправностей WSL2 + Windows + віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи в коді.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль переходу на сторінку відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішній сервіс CDP на loopback налаштовано без `attachOnly: true`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а проблема полягає в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` на loopback перевірки справності CDP навмисно пропускають застосування політики досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і пройшов перевірку.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ідентифікатори `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де розташований браузер.
  - У sandboxed-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed-сесії типово використовують `sandbox`, несandboxed-сесії — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
