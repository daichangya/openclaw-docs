---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T07:28:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f56eae24f9e247589037a00532c2066699ea7b8595bb18f9e756b4e6a5be2dc
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (клік/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли plugin браузера увімкнено.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим повсякденним браузером. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви бачите “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент повідомляє, що інструмент браузера
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє те саме ім’я інструмента `browser`:

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

Для типових значень потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише plugin прибирає CLI `openclaw browser`, метод gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: вибрати
  правильний профіль, тримати refs у межах тієї самої вкладки, використовувати `tabId`/labels для націлювання на вкладки та завантажувати skill браузера для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити status/вкладки, позначити вкладки завдання, зробити snapshot перед дією, повторно зробити snapshot
  після змін UI, один раз відновити stale refs і повідомляти про login/2FA/captcha або
  блокування camera/microphone як ручну дію замість здогадок.

Skills, що постачаються разом із plugin, перелічуються в доступних Skills агента, коли
plugin увімкнено. Повні інструкції skill завантажуються за потреби, тому звичайні
сесії не оплачують повну вартість у токенах.

## Відсутня команда браузера або інструмент

Якщо після оновлення `openclaw browser` невідомий, відсутній `browser.request`, або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням plugin, а політика інструментів застосовується лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP для вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- Типово: використовується ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера зберігаються в `~/.openclaw/openclaw.json`.

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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальним профілям `openclaw` автоматично призначаються `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується керований локальний CDP-порт.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до WebSocket-handshake віддаленого CDP.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике додаткове вікно, щоб довгі очікування могли завершитися замість тайм-ауту на межі HTTP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними browser-сесіями агента. Підлеглі агенти, Cron та очищення життєвого циклу ACP однаково закривають свої явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та відкриття вкладки захищені від SSRF перед навігацією і повторно перевіряються в режимі best-effort після цього на фінальному URL `http(s)`.
- У строгому режимі SSRF також перевіряються виявлення віддаленої CDP endpoint і probes `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome типово запускається напряму, тож налаштування proxy provider не послаблюють перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні Chrome proxy flags через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузера через proxy, якщо доступ браузера до приватної мережі не увімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже запущений.
- `headless` можна задавати глобально або для кожного локального керованого профілю. Значення для конкретного профілю перевизначають `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший — видимим.
- `executablePath` можна задавати глобально або для кожного локального керованого профілю. Значення для конкретного профілю перевизначають `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium.
- `color` (на верхньому рівні та для кожного профілю) тонує UI браузера, щоб ви бачили, який профіль активний.
- Типовий профіль — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб перейти на авторизований браузер користувача.
- Порядок автовиявлення: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, якщо профіль existing-session має під’єднуватися до нестандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в конфігурації, для кожної платформи:

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

`executablePath` для конкретного профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування та може запускати локальний браузер.
- **Віддалене керування (host Node):** запустіть host Node на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає та не змінює браузери existing-session або віддалені CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий двійковий файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише-підключення та віддалені профілі CDP: `openclaw browser stop` закриває активну
  сесію керування та знімає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику endpoint-ів `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не комітити їх у файли конфігурації.

## Node browser proxy (типова поведінка без додаткової конфігурації)

Якщо ви запускаєте **host Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики browser tool до цього node без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- host Node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw трактуватиме це як межу найменших привілеїв: можна буде націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів буде заблоковано на поверхні proxy.
- Вимкнення, якщо воно вам не потрібне:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
з документації Browserless щодо підключення.

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

## Провайдери прямого WebSocket CDP

Деякі розміщені сервіси браузерів надають **прямий endpoint WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoint-и WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через WebSocket handshake і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує
  виявлення HTTP `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого WebSocket handshake на корені без шляху. Це дозволяє
  голому `ws://`, спрямованому на локальний Chrome, усе ж підключатися, оскільки Chrome приймає
  оновлення до WebSocket лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
proxy.

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
- Browserbase автоматично створює сесію браузера при WebSocket-підключенні, тож
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Див. [тарифи](https://www.browserbase.com/pricing) щодо обмежень платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного
  довідника API, посібників із SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing node.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено і автентифікацію спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway та будь-які host Node у приватній мережі (Tailscale); уникайте публічної доступності.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- Якщо можливо, віддавайте перевагу зашифрованим endpoint-ам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + CDP-портом
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх за допомогою `--driver existing-session`.
- Локальні CDP-порти типово виділяються з діапазону **18800–18899**.
- Видалення профілю переносить його локальний каталог даних до Смітника.

Усі endpoint-и керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль existing-session, якщо вам потрібні
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке націлюється на
  типовий локальний профіль Google Chrome.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нетипового профілю Chrome:

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
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

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

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs з вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє, що
  Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження у браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте користувацький профіль existing-session, передайте явне ім’я цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або host Node можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях є ризикованішим, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього driver; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному host або через підключений
  browser node. Якщо Chrome працює в іншому місці й browser node не підключено, використовуйте
  віддалений CDP або host Node.

<Accordion title="Обмеження функціональності existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — знімки сторінки та знімки елементів через `--ref` працюють; селектори CSS `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для скриншотів сторінки або елементів на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без CSS-селекторів). `click-coords` натискає на видимі координати viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження файлів / діалоги** — `wait --url` підтримує точні, підрядкові та glob-патерни; `wait --load networkidle` не підтримується. Hooks завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається вашого особистого профілю браузера.
- **Окремі порти**: уникає `9222`, щоб не конфліктувати з робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні обробники `tabId`, такі як `t1`, необов’язкові labels і сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
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
- Linux: шукаються `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряються поширені місця встановлення.

## API керування (необов’язково)

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
разом із відповідним CLI `openclaw browser` (snapshot, refs, розширені можливості wait,
вивід JSON, робочі процеси налагодження). Повний довідник див. у
[Browser control API](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host, де Gateway працює у WSL2, а Chrome — у Windows, див.
[WSL2 + Windows + усунення несправностей віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти SSRF-блокування навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працює справно.
- **SSRF-блокування навігації** означає, що площина керування браузером працює справно, але ціль навігації сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-блокування навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а проблема в політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` через loopback перевірки справності CDP навмисно пропускають застосування перевірки досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (всю сторінку, елемент або refs із label).
- `browser doctor` перевіряє готовність Gateway, plugin, профілю, браузера та вкладки.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де працює браузер.
  - У sandboxed-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandboxed-сесії типово використовують `sandbox`, не-sandbox-сесії типово використовують `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента та дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером у sandboxed-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
