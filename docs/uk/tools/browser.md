---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-10T18:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6fed36a6f40a50e825f90e5616778954545bd7e52397f7e088b85251ee024f
    source_path: tools/browser.md
    workflow: 15
---

# Браузер (керований openclaw)

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** взаємодіє з профілем вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої сеансу Chrome з виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для вашого щоденного використання. Це безпечна, ізольована поверхня для
автоматизації агентом і перевірки.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви бачите “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент повідомляє, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування plugin

Типовий інструмент `browser` тепер є вбудованим plugin, який постачається увімкненим
типово. Це означає, що ви можете вимкнути або замінити його, не видаляючи решту
системи plugin у OpenClaw:

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

Вимкніть вбудований plugin перед встановленням іншого plugin, який надає
те саме ім’я інструмента `browser`. Типова робота браузера потребує обох умов:

- `plugins.entries.browser.enabled` не вимкнено
- `browser.enabled=true`

Якщо ви вимкнете лише plugin, вбудований CLI браузера (`openclaw browser`),
метод gateway (`browser.request`), інструмент агента та типовий сервіс керування браузером
усі зникнуть одночасно. Ваша конфігурація `browser.*` залишиться недоторканою, щоб
її міг повторно використати plugin-замінник.

Вбудований plugin браузера тепер також володіє реалізацією середовища виконання браузера.
Core зберігає лише спільні допоміжні засоби Plugin SDK плюс сумісні повторні експорти для
старих внутрішніх шляхів імпорту. На практиці видалення або заміна пакета plugin браузера
прибирає набір функцій браузера, а не залишає друге середовище виконання, яким володіє core.

Зміни конфігурації браузера, як і раніше, потребують перезапуску Gateway, щоб вбудований plugin
міг повторно зареєструвати свій сервіс браузера з новими налаштуваннями.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` раптово став невідомою командою або
агент повідомляє, що інструмент браузера відсутній, найпоширенішою причиною є
обмежувальний список `plugins.allow`, у якому немає `browser`.

Приклад некоректної конфігурації:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Виправте це, додавши `browser` до списку дозволених plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Важливі примітки:

- `browser.enabled=true` сам по собі недостатній, коли задано `plugins.allow`.
- `plugins.entries.browser.enabled=true` також сам по собі недостатній, коли задано `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **не** завантажує вбудований plugin браузера. Він лише коригує політику інструментів після того, як plugin уже завантажено.
- Якщо вам не потрібен обмежувальний список дозволених plugin, видалення `plugins.allow` також відновить типову поведінку вбудованого браузера.

Типові симптоми:

- `openclaw browser` є невідомою командою.
- `browser.request` відсутній.
- Агент повідомляє, що інструмент браузера недоступний або відсутній.

## Профілі: `openclaw` та `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашого **справжнього Chrome із виконаним входом**.

Для викликів інструмента браузера агентом:

- Типово: використовується ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сеанси з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим використовувався типово.

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
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

Примітки:

- Сервіс керування браузером прив’язується до loopback на порту, похідному від `gateway.port`
  (типово: `18791`, тобто gateway + 2).
- Якщо ви перевизначаєте порт Gateway (`gateway.port` або `OPENCLAW_GATEWAY_PORT`),
  похідні порти браузера зміщуються, щоб залишатися в тій самій “сім’ї”.
- `cdpUrl` типово використовує керований локальний порт CDP, якщо не задано.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності віддаленого (не-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` застосовується до перевірок доступності handshake WebSocket для віддаленого CDP.
- Навігація браузера/відкриття вкладки захищені від SSRF перед переходом і повторно перевіряються в режимі best-effort для фінального URL `http(s)` після переходу.
- У строгому режимі SSRF перевіряються також виявлення/перевірки кінцевої точки віддаленого CDP (`cdpUrl`, включно з пошуками `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено. Установлюйте `true` лише тоді, коли ви свідомо довіряєте доступу браузера до приватної мережі.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім для сумісності.
- `attachOnly: true` означає “ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.”
- `color` + `color` для кожного профілю додають відтінок до UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (окремий браузер, керований OpenClaw). Використовуйте `defaultProfile: "user"`, щоб типово вибрати браузер користувача з виконаним входом.
- Порядок автовиявлення: системний браузер типово, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl` — задавайте їх лише для віддаленого CDP.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не
  задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, якщо профіль existing-session
  має під’єднуватися до нестандартного профілю користувача Chromium, такого як Brave або Edge.

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовиявлення:

Приклад CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (хост вузла):** запустіть хост вузла на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише для під’єднання та профілі віддаленого CDP: `openclaw browser stop` закриває активний
  сеанс керування і скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, автономний режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в параметрах запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час під’єднання
до WebSocket CDP. Надавайте перевагу змінним середовища або менеджерам секретів для
токенів замість коміту їх у файли конфігурації.

## Проксі браузера вузла (типовий режим без конфігурації)

Якщо ви запускаєте **хост вузла** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера на цей вузол без додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Хост вузла надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: можна використовувати лише профілі зі списку дозволених, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкнення, якщо це не потрібно:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостований віддалений CDP)

[Browserless](https://browserless.io) — це хостований сервіс Chromium, який надає
URL під’єднання CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
з документації Browserless щодо під’єднання.

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
- Виберіть регіональну кінцеву точку, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого під’єднання CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостовані сервіси браузера надають **пряму кінцеву точку WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw підтримує обидва варіанти:

- **Кінцеві точки HTTP(S)** — OpenClaw викликає `/json/version`, щоб виявити
  URL WebSocket debugger, а потім під’єднується.
- **Кінцеві точки WebSocket** (`ws://` / `wss://`) — OpenClaw під’єднується напряму,
  пропускаючи `/json/version`. Використовуйте це для сервісів на кшталт
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) або будь-якого провайдера, який надає вам
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
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
- Browserbase автоматично створює сеанс браузера під час під’єднання WebSocket, тому
  крок ручного створення сеансу не потрібен.
- Безкоштовний тариф дозволяє один одночасний сеанс і одну годину браузера на місяць.
  Обмеження платних тарифів дивіться в розділі [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через auth Gateway або спарювання вузлів.
- Окремий loopback HTTP API браузера використовує **лише auth зі спільним секретом**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнене й auth зі спільним секретом не налаштовано, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і всі хости вузлів у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте URL/токени віддаленого CDP як секрети; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і токенам із коротким строком дії.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані openclaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявний сеанс**: ваш наявний профіль Chrome через автопід’єднання Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для під’єднання existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може під’єднуватися до вже запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це дає змогу повторно використовувати вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та інструкції з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний existing-session профіль, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопід’єднання Chrome MCP, яке націлюється на
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
3. Залиште браузер запущеним і схваліть запит на підключення, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Швидка перевірка live attach:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успішного під’єднання:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs із вибраної live-вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на під’єднання, і ви його схвалили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення і перевіряє,
  що Chrome встановлено локально для типових профілів автопід’єднання, але він не може
  увімкнути віддалене налагодження на стороні браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний existing-session профіль, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на під’єднання.
- Gateway або хост вузла може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії всередині вашого браузера із виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він під’єднується лише до
  уже наявного сеансу.
- OpenClaw використовує тут офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, OpenClaw передає його далі, щоб націлитися на цей явний
  каталог даних користувача Chromium.
- Знімки екрана для existing-session підтримують знімки сторінки та знімки елементів через `--ref`
  зі виводу snapshot, але не підтримують селектори CSS `--element`.
- Знімки екрана сторінок existing-session працюють без Playwright через Chrome MCP.
  Знімки елементів на основі ref (`--ref`) там також працюють, але `--full-page`
  не можна поєднувати з `--ref` або `--element`.
- Дії existing-session усе ще більш обмежені, ніж у керованому браузері:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують
    refs зі snapshot замість селекторів CSS
  - `click` підтримує лише ліву кнопку миші (без перевизначення кнопок або модифікаторів)
  - `type` не підтримує `slowly=true`; використовуйте `fill` або `press`
  - `press` не підтримує `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не
    підтримують перевизначення timeout для окремого виклику
  - `select` наразі підтримує лише одне значення
- `wait --url` для existing-session підтримує точний збіг, підрядок і glob-шаблони,
  як і інші драйвери браузера. `wait --load networkidle` поки не підтримується.
- Хуки завантаження файлів для existing-session потребують `ref` або `inputRef`, підтримують по одному файлу за раз і не підтримують націлювання через CSS `element`.
- Хуки діалогів existing-session не підтримують перевизначення timeout.
- Деякі можливості все ще потребують шляху керованого браузера, зокрема пакетні
  дії, експорт PDF, перехоплення завантажень і `responsebody`.
- Existing-session є локальним для хоста. Якщо Chrome працює на іншій машині або в
  іншому мережевому просторі імен, використовуйте віддалений CDP або хост вузла.

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не взаємодіє з профілем вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: націлювання на вкладки за `targetId`, а не за “останньою вкладкою”.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний варіант:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряються `/Applications` і `~/Applications`.
- Linux: пошук `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряються поширені каталоги встановлення.

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Стан/запуск/зупинка: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/знімок екрана: `GET /snapshot`, `POST /screenshot`
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

Якщо налаштовано auth gateway зі спільним секретом, HTTP-маршрути браузера також потребують auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з ідентичністю; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь помилки для валідації на рівні маршруту та
збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): payload дії не пройшов нормалізацію або валідацію.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним типом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено в конфігурації.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` верхнього рівня або пакетний `targetId` конфліктує з цільовим target запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Для деяких можливостей (navigate/act/AI snapshot/role snapshot, знімки елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
чітку помилку 501.

Що все ще працює без Playwright:

- ARIA snapshots
- Знімки екрана сторінок для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Знімки екрана сторінок для профілів `existing-session` / Chrome MCP
- Знімки `--ref` для existing-session на основі виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Знімки елементів за CSS-селектором (`--element`)
- Повний експорт PDF браузера

Знімки елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, установіть повний
пакет Playwright (не `playwright-core`) і перезапустіть gateway або перевстановіть
OpenClaw із підтримкою браузера.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти перевизначень npm).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Потік високого рівня:

- Невеликий **сервер керування** приймає HTTP-запити.
- Він під’єднується до браузерів на базі Chromium (Chrome/Brave/Edge/Chromium) через **CDP**.
- Для розширених дій (click/type/snapshot/PDF) він використовує **Playwright** поверх
  CDP.
- Якщо Playwright відсутній, доступні лише операції без Playwright.

Така архітектура забезпечує для агента стабільний, детермінований інтерфейс і водночас дає змогу
вам змінювати локальні/віддалені браузери та профілі.

## Короткий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль.
Усі команди також приймають `--json` для машинозчитуваного виводу (стабільні payload).

Основи:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Інспектування:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Примітка щодо життєвого циклу:

- Для профілів лише для під’єднання та профілів віддаленого CDP `openclaw browser stop` усе ще є
  правильною командою очищення після тестів. Вона закриває активний сеанс керування та
  очищає тимчасові перевизначення емуляції замість завершення базового
  браузера.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Дії:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Стан:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Примітки:

- `upload` і `dialog` — це виклики **попереднього озброєння**; запускайте їх перед click/press,
  що викликає file chooser/діалог.
- Шляхи виводу завантажень і trace обмежені тимчасовими коренями OpenClaw:
  - traces: `/tmp/openclaw` (резервний варіант: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (резервний варіант: `${os.tmpdir()}/openclaw/downloads`)
- Шляхи upload обмежені тимчасовим коренем upload OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (резервний варіант: `${os.tmpdir()}/openclaw/uploads`)
- `upload` також може напряму встановлювати file input через `--input-ref` або `--element`.
- `snapshot`:
  - `--format ai` (типово, коли встановлено Playwright): повертає AI snapshot із числовими ref (`aria-ref="<n>"`).
  - `--format aria`: повертає дерево доступності (без ref; лише для інспектування).
  - `--efficient` (або `--mode efficient`): компактний пресет role snapshot (interactive + compact + depth + нижчий maxChars).
  - Типове значення конфігурації (лише tool/CLI): установіть `browser.snapshotDefaults.mode: "efficient"`, щоб використовувати efficient snapshots, коли викликач не передає mode (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
  - Параметри role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) примусово використовують snapshot на основі role з ref на кшталт `ref=e12`.
  - `--frame "<iframe selector>"` обмежує role snapshots конкретним iframe (у парі з role refs на кшталт `e12`).
  - `--interactive` виводить плоский, зручний для вибору список інтерактивних елементів (найкраще для виконання дій).
  - `--labels` додає знімок екрана лише області перегляду з накладеними мітками ref (виводить `MEDIA:<path>`).
- `click`/`type`/тощо потребують `ref` із `snapshot` (або числовий `12`, або role ref `e12`).
  Селектори CSS навмисно не підтримуються для дій.

## Snapshots і refs

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через `aria-ref` у Playwright.

- **Role snapshot (role refs на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі role з `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити знімок екрана області перегляду з накладеними мітками `e12`.

Поведінка ref:

- Ref **не є стабільними між переходами**; якщо щось не працює, повторно запустіть `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role refs обмежуються цим iframe до наступного role snapshot.

## Розширені можливості wait

Ви можете чекати не лише на час/текст:

- Очікування URL (підтримуються glob через Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування предиката JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, доки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна комбінувати:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Робочі процеси налагодження

Коли дія не вдається (наприклад, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Використайте `click <ref>` / `type <ref>` (віддавайте перевагу role refs в interactive mode)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (виводить `TRACE:<path>`)

## Вивід JSON

`--json` призначений для сценаріїв і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots у JSON містять `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Вони корисні для сценаріїв “змусити сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (типові пристрої Playwright)
  - `set viewport 1280 720`

## Безпека та конфіденційність

- Профіль браузера openclaw може містити сеанси з виконаним входом; ставтеся до нього як до чутливих даних.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямовувати це. Вимкніть його через `browser.evaluateEnabled=false`, якщо він вам не потрібен.
- Відомості про входи та примітки щодо anti-bot (X/Twitter тощо) див. у [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте Gateway/хост вузла приватним (лише loopback або tailnet).
- Кінцеві точки віддаленого CDP мають широкі можливості; використовуйте тунелі та захист.

Приклад strict mode (типово блокує приватні/внутрішні призначення):

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

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій WSL2 Gateway + Windows Chrome на розділених хостах див.
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця розташування браузера.
  - У sandboxed sessions `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandboxed sessions типово використовують `sandbox`, а не-sandbox sessions — `host`.
  - Якщо під’єднано вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися на нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція середовища](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і заходи посилення захисту
