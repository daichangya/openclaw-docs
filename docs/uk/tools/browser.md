---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-22T20:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Браузер (керований openclaw)

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої реальної сесії Chrome, у якій виконано вхід, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (натискання/введення/перетягування/вибір), знімки, скриншоти, PDF.
- Необов’язкову підтримку кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для вашого щоденного використання. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` узагалі відсутня або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда браузера або інструмент](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` тепер є вбудованим Plugin, який постачається
увімкненим за замовчуванням. Це означає, що ви можете вимкнути або замінити його, не видаляючи решту
системи Plugin OpenClaw:

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

Вимкніть вбудований Plugin перед встановленням іншого Plugin, який надає
те саме ім’я інструмента `browser`. Типовий режим роботи браузера потребує обох умов:

- `plugins.entries.browser.enabled` не вимкнено
- `browser.enabled=true`

Якщо ви вимкнете лише Plugin, вбудований CLI браузера (`openclaw browser`),
метод gateway (`browser.request`), інструмент агента та типовий сервіс керування браузером
зникнуть одночасно. Ваш конфіг `browser.*` залишиться недоторканим, щоб його міг повторно використати
Plugin-замінник.

Вбудований Plugin браузера тепер також володіє реалізацією середовища виконання браузера.
У core залишаються лише спільні допоміжні засоби Plugin SDK плюс сумісні повторні експорти для
старих внутрішніх шляхів імпорту. На практиці видалення або заміна пакета Plugin браузера
прибирає набір можливостей браузера замість того, щоб залишати позаду друге середовище виконання,
яким володіє core.

Зміни конфігурації браузера все ще потребують перезапуску Gateway, щоб вбудований Plugin
міг повторно зареєструвати свій сервіс браузера з новими налаштуваннями.

## Відсутня команда браузера або інструмент

Якщо після оновлення `openclaw browser` раптово стала невідомою командою або
агент повідомляє, що інструмент браузера відсутній, найпоширенішою причиною є
обмежувальний список `plugins.allow`, який не містить `browser`.

Приклад некоректної конфігурації:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Виправте це, додавши `browser` до списку дозволених Plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Важливі примітки:

- `browser.enabled=true` саме по собі недостатньо, коли встановлено `plugins.allow`.
- `plugins.entries.browser.enabled=true` саме по собі також недостатньо, коли встановлено `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **не** завантажує вбудований Plugin браузера. Це лише коригує політику інструментів після того, як Plugin уже завантажено.
- Якщо вам не потрібен обмежувальний список дозволених Plugin, видалення `plugins.allow` також відновлює типову поведінку вбудованого браузера.

Типові симптоми:

- `openclaw browser` є невідомою командою.
- `browser.request` відсутній.
- Агент повідомляє, що інструмент браузера недоступний або відсутній.

## Профілі: `openclaw` і `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **реальної сесії Chrome**
  із виконаним входом.

Для викликів інструмента браузера агентом:

- Типово: використовувати ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` є явним перевизначенням, коли ви хочете конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

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

- Сервіс керування браузером прив’язується до loopback на порті, похідному від `gateway.port`
  (типово: `18791`, тобто gateway + 2).
- Якщо ви перевизначаєте порт Gateway (`gateway.port` або `OPENCLAW_GATEWAY_PORT`),
  похідні порти браузера зміщуються, щоб залишатися в тій самій «родині».
- Якщо `cdpUrl` не задано, типово використовується керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності віддаленого (не-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` застосовується до перевірок доступності рукостискання WebSocket віддаленого CDP.
- Навігація/відкриття вкладок у браузері захищені від SSRF перед навігацією та повторно перевіряються за принципом best-effort на фінальному `http(s)` URL після навігації.
- У строгому режимі SSRF також перевіряються виявлення/проби віддалених кінцевих точок CDP (`cdpUrl`, включно з пошуками `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено. Установлюйте `true` лише тоді, коли ви свідомо довіряєте доступу браузера до приватної мережі.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім для сумісності.
- `attachOnly: true` означає «ніколи не запускати локальний браузер; лише підключатися, якщо він уже працює».
- `color` і `color` для окремого профілю тонують інтерфейс браузера, щоб ви могли бачити, який профіль активний.
- Типовим профілем є `openclaw` (окремий браузер, яким керує OpenClaw). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер користувача з виконаним входом.
- Порядок автовиявлення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- Локальним профілям `openclaw` автоматично призначаються `cdpPort`/`cdpUrl` — задавайте їх лише для віддаленого CDP.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не
  задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session
  має підключатися до нетипового профілю користувача Chromium, наприклад Brave або Edge.

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
- **Віддалене керування (хост Node):** запустіть хост Node на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише для підключення та профілі віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в параметрах запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
а не зберігати їх у файлах конфігурації.

## Проксі браузера Node (типовий режим без конфігурації)

Якщо ви запускаєте **хост Node** на машині, де знаходиться ваш браузер, OpenClaw може
автоматично спрямовувати виклики інструмента браузера до цього node без будь-якої додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Хост Node надає свій локальний сервер керування браузером через **проксі-команду**.
- Профілі беруться з власного конфігу `browser.profiles` node (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви встановлюєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу принципу найменших привілеїв: лише профілі зі списку дозволених можуть бути цільовими, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо не хочете використовувати:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
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

- Замініть `<BROWSERLESS_API_KEY>` на ваш реальний токен Browserless.
- Виберіть регіональну кінцеву точку, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі розміщені сервіси браузера надають **пряму кінцеву точку WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL налагоджувача WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі адреси WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP
  виявлення через `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на корені без шляху. Це покриває
  як віддалені порти налагодження у стилі Chrome, так і провайдерів лише з WebSocket.

Звичайні `ws://host:port` / `wss://host:port` без шляху `/devtools/...`,
спрямовані на локальний екземпляр Chrome, підтримуються через резервну схему
«спочатку виявлення» — Chrome приймає WebSocket upgrades лише на конкретному шляху
для браузера або цілі, який повертає `/json/version`, тому одного лише рукостискання
на корені без шляху буде недостатньо.

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
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API key Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  ручний етап створення сесії не потрібен.
- Безкоштовний рівень дозволяє одну одночасну сесію та одну браузерну годину на місяць.
  Обмеження платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API,
  посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairинг node.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію через shared secret**:
  bearer auth із токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено й не налаштовано жодної shared-secret автентифікації, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости node у приватній мережі (Tailscale); уникайте публічної доступності.
- Ставтеся до URL/токенів віддаленого CDP як до секретів; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості використовуйте зашифровані кінцеві точки (HTTPS або WSS) і короткоживучі токени.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **openclaw-managed**: окремий екземпляр браузера на базі Chromium із власним каталогом користувацьких даних і портом CDP
- **remote**: явний URL CDP (браузер на базі Chromium, запущений деінде)
- **existing session**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для existing-session підключення Chrome MCP.
- Профілі existing-session, окрім `user`, є добровільними; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та інструкції з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний custom existing-session профіль, якщо вам потрібні
інша назва, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автопідключення Chrome MCP, яке спрямоване на
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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live attach smoke test:

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
- `tabs` перелічує вже відкриті у вас вкладки браузера
- `snapshot` повертає refs із вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- на сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на згоду на підключення, і ви його підтвердили
- `openclaw doctor` переносить старий конфіг браузера на основі розширення та перевіряє, що
  Chrome встановлено локально для типових профілів автопідключення, але не може
  увімкнути віддалене налагодження на стороні браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте custom existing-session профіль, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або хост node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях є ризикованішим, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої сесії браузера, у якій виконано вхід.
- OpenClaw не запускає браузер для цього драйвера; він підключається лише до
  наявної сесії.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  встановлено `userDataDir`, OpenClaw передає його далі, щоб націлитися на цей явний
  каталог користувацьких даних Chromium.
- Скріншоти existing-session підтримують знімки сторінки та знімки елементів через `--ref`
  зі snapshot, але не CSS-селектори `--element`.
- Скріншоти сторінок existing-session працюють без Playwright через Chrome MCP.
  Скріншоти елементів за ref (`--ref`) там також працюють, але `--full-page`
  не можна поєднувати з `--ref` або `--element`.
- Дії existing-session усе ще більш обмежені, ніж у режимі керованого браузера:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують
    snapshot refs замість CSS-селекторів
  - `click` підтримує лише ліву кнопку миші (без перевизначення кнопки або модифікаторів)
  - `type` не підтримує `slowly=true`; використовуйте `fill` або `press`
  - `press` не підтримує `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не
    підтримують перевизначення timeout для окремого виклику
  - `select` наразі підтримує лише одне значення
- Existing-session `wait --url` підтримує точні, часткові та glob-шаблони,
  як і інші драйвери браузера. `wait --load networkidle` поки не підтримується.
- Хуки завантаження файлів existing-session вимагають `ref` або `inputRef`, підтримують по одному файлу за раз і не підтримують націлювання через CSS `element`.
- Хуки діалогів existing-session не підтримують перевизначення timeout.
- Деякі можливості все ще потребують режиму керованого браузера, зокрема пакетні
  дії, експорт PDF, перехоплення завантажень і `responsebody`.
- Existing-session може підключатися на вибраному хості або через підключений
  browser node. Якщо Chrome працює деінде й browser node не підключено, використовуйте
  віддалений CDP або хост node.

## Гарантії ізоляції

- **Окремий каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
- **Детерміноване керування вкладками**: націлювання на вкладки за `targetId`, а не за принципом «остання вкладка».

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
- Windows: перевіряються типові місця встановлення.

## API керування (необов’язково)

Лише для локальних інтеграцій Gateway надає невеликий loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Вкладки: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Дії: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Завантаження: `POST /download`, `POST /wait/download`
- Налагодження: `GET /console`, `POST /pdf`
- Налагодження: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Мережа: `POST /response/body`
- Стан: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Стан: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Налаштування: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Усі кінцеві точки приймають `?profile=<name>`.

Якщо налаштовано shared-secret автентифікацію gateway, маршрути HTTP браузера також вимагають автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth із цим паролем

Примітки:

- Цей окремий loopback API браузера **не** використовує trusted-proxy або
  заголовки ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Контракт помилок `/act`

`POST /act` використовує структуровану відповідь про помилку для валідації на рівні маршруту та
збоїв політики:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Поточні значення `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` відсутній або не розпізнаний.
- `ACT_INVALID_REQUEST` (HTTP 400): нормалізація або валідація payload дії не пройшла.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` використано з непідтримуваним видом дії.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (або `wait --fn`) вимкнено конфігурацією.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): верхньорівневий або пакетний `targetId` конфліктує з ціллю запиту.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): дія не підтримується для профілів existing-session.

Інші збої під час виконання все ще можуть повертати `{ "error": "<message>" }` без
поля `code`.

### Вимога Playwright

Деякі можливості (navigate/act/AI snapshot/role snapshot, скриншоти елементів,
PDF) потребують Playwright. Якщо Playwright не встановлено, ці кінцеві точки повертають
зрозумілу помилку 501.

Що все ще працює без Playwright:

- ARIA snapshot
- Скриншоти сторінки для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Скриншоти сторінки для профілів `existing-session` / Chrome MCP
- Скриншоти existing-session за ref (`--ref`) з виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Скриншоти елементів за CSS-селектором (`--element`)
- повний експорт PDF браузера

Скриншоти елементів також не приймають `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, відновіть залежності середовища виконання
вбудованого Plugin браузера, щоб було встановлено `playwright-core`,
а потім перезапустіть gateway. Для пакетних установок виконайте `openclaw doctor --fix`.
Для Docker також установіть двійкові файли браузера Chromium, як показано нижче.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Натомість використовуйте вбудований CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантажені браузери, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Потік на високому рівні:

- Невеликий **сервер керування** приймає HTTP-запити.
- Він підключається до браузерів на базі Chromium (Chrome/Brave/Edge/Chromium) через **CDP**.
- Для розширених дій (click/type/snapshot/PDF) він використовує **Playwright** поверх
  CDP.
- Якщо Playwright відсутній, доступні лише операції без Playwright.

Такий дизайн зберігає для агента стабільний, детермінований інтерфейс і водночас дає
змогу змінювати локальні/віддалені браузери та профілі.

## Швидкий довідник CLI

Усі команди приймають `--browser-profile <name>` для націлювання на конкретний профіль.
Усі команди також приймають `--json` для машиночитного виводу (стабільні payload).

Основне:

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

Перевірка:

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

Примітка про життєвий цикл:

- Для профілів лише для підключення та профілів віддаленого CDP `openclaw browser stop` усе ще є
  правильною командою очищення після тестів. Вона закриває активну сесію керування та
  прибирає тимчасові перевизначення емуляції замість завершення базового
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

- `upload` і `dialog` — це виклики **підготовки**; запускайте їх перед click/press,
  що відкриває file chooser/діалог.
- Шляхи виводу download і trace обмежені тимчасовими коренями OpenClaw:
  - traces: `/tmp/openclaw` (резервний варіант: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (резервний варіант: `${os.tmpdir()}/openclaw/downloads`)
- Шляхи upload обмежені тимчасовим коренем upload OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (резервний варіант: `${os.tmpdir()}/openclaw/uploads`)
- `upload` також може безпосередньо задавати file input через `--input-ref` або `--element`.
- `snapshot`:
  - `--format ai` (типово, коли встановлено Playwright): повертає AI snapshot із числовими refs (`aria-ref="<n>"`).
  - `--format aria`: повертає дерево доступності (без refs; лише для перевірки).
  - `--efficient` (або `--mode efficient`): компактний preset role snapshot (interactive + compact + depth + нижчий maxChars).
  - Типове значення конфігурації (лише tool/CLI): установіть `browser.snapshotDefaults.mode: "efficient"`, щоб використовувати efficient snapshot, коли викликач не передає режим (див. [Конфігурація Gateway](/uk/gateway/configuration-reference#browser)).
  - Параметри role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) примусово вмикають snapshot на основі ролей із refs на зразок `ref=e12`.
  - `--frame "<iframe selector>"` обмежує role snapshot конкретним iframe (поєднується з role refs на зразок `e12`).
  - `--interactive` виводить плоский, зручний для вибору список інтерактивних елементів (найкраще для запуску дій).
  - `--labels` додає скриншот лише області перегляду з накладеними мітками ref (виводить `MEDIA:<path>`).
- `click`/`type`/тощо потребують `ref` зі `snapshot` (або числовий `12`, або role ref `e12`).
  CSS-селектори навмисно не підтримуються для дій.

## Snapshot і refs

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові refs)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, який містить числові refs.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref визначається через `aria-ref` Playwright.

- **Role snapshot (role refs на зразок `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язково `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref визначається через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити скриншот області перегляду з накладеними мітками `e12`.

Поведінка ref:

- Refs **не є стабільними між навігаціями**; якщо щось не спрацювало, повторно запустіть `snapshot` і використайте новий ref.
- Якщо role snapshot було зроблено з `--frame`, role refs обмежуються цим iframe до наступного role snapshot.

## Додаткові можливості wait

Ви можете чекати не лише час/текст:

- Очікування URL (glob підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування, доки селектор стане видимим:
  - `openclaw browser wait "#main"`

Їх можна поєднувати:

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
2. Використовуйте `click <ref>` / `type <ref>` (у режимі interactive надавайте перевагу role refs)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що саме націлюється Playwright
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

Role snapshot у JSON включають `refs` плюс невеликий блок `stats` (lines/chars/refs/interactive), щоб інструменти могли оцінювати розмір і щільність payload.

## Параметри стану та середовища

Вони корисні для сценаріїв «змусити сайт поводитися як X»:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий варіант `set headers --json '{"X-Debug":"1"}'` усе ще підтримується)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / локаль: `set timezone ...`, `set locale ...`
- Пристрій / область перегляду:
  - `set device "iPhone 14"` (preset пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека й приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямувати це. Вимкніть через `browser.evaluateEnabled=false`, якщо вам це не потрібно.
- Для входів у систему та приміток щодо anti-bot (X/Twitter тощо) див. [Вхід у браузері + публікація в X/Twitter](/uk/tools/browser-login).
- Тримайте Gateway/хост node приватним (лише loopback або tailnet).
- Кінцеві точки віддаленого CDP мають широкі можливості; тунелюйте й захищайте їх.

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

## Усунення проблем

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення проблем браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення проблем WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи в коді.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхиляється політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спершу усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінкою.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфіг браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають застосування політики доступності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

Приклад: навігацію заблоковано, площина керування справна

- `start` успішний
- `tabs` успішний
- `open http://internal.example` завершується помилкою

Зазвичай це означає, що запуск браузера працює нормально, а ціль навігації потребує перегляду політики.

Приклад: запуск заблоковано до того, як навігація стає важливою

- `start` завершується помилкою `not reachable after start`
- `tabs` також завершується помилкою або не може бути виконаний

Це вказує на запуск браузера або доступність CDP, а не на проблему списку дозволених URL сторінок.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (всю сторінку або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або remote CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де знаходиться браузер.
  - У sandbox-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandbox-сесії типово використовують `sandbox`, не-sandbox сесії — `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента й дає змогу уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
