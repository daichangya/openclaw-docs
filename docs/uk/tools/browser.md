---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження того, чому openclaw втручається у ваш власний Chrome
    - Реалізація налаштувань і життєвого циклу браузера в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Browser (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-05T18:20:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Browser (керований openclaw)

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про нього як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається вашого особистого профілю браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої реальної сесії Chrome з виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), snapshot, знімки екрана, PDF.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для щоденного використання. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення «Browser disabled», увімкніть його в config (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` взагалі відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Missing browser command or tool](/tools/browser#missing-browser-command-or-tool).

## Керування plugin

Типовий інструмент `browser` тепер є комплектним plugin, який постачається увімкненим
за замовчуванням. Це означає, що ви можете вимкнути або замінити його, не прибираючи решту
plugin-системи OpenClaw:

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

Вимкніть комплектний plugin перед установленням іншого plugin, який надає
те саме ім’я інструмента `browser`. Типова робота браузера вимагає обох умов:

- `plugins.entries.browser.enabled` не вимкнено
- `browser.enabled=true`

Якщо ви вимкнете лише plugin, комплектний CLI браузера (`openclaw browser`),
метод gateway (`browser.request`), інструмент агента та типовий сервіс керування браузером
зникнуть разом. Ваш config `browser.*` залишиться недоторканим, щоб його міг повторно використати
plugin-замінник.

Комплектний plugin браузера тепер також володіє реалізацією runtime браузера.
Core зберігає лише спільні helper-и Plugin SDK плюс compatibility re-export для
старіших внутрішніх шляхів імпорту. На практиці видалення або заміна пакета plugin браузера
прибирає набір можливостей браузера замість того, щоб залишити другий runtime під керуванням core.

Зміни config браузера все одно потребують перезапуску Gateway, щоб комплектний plugin
міг повторно зареєструвати свій сервіс браузера з новими налаштуваннями.

## Відсутня команда браузера або інструмент

Якщо `openclaw browser` раптом стає невідомою командою після оновлення або
агент повідомляє, що інструмент браузера відсутній, найпоширенішою причиною є
обмежувальний список `plugins.allow`, який не містить `browser`.

Приклад зламаного config:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Виправте це, додавши `browser` до allowlist plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Важливі примітки:

- Самого `browser.enabled=true` недостатньо, коли встановлено `plugins.allow`.
- Самого `plugins.entries.browser.enabled=true` також недостатньо, коли встановлено `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **не** завантажує комплектний plugin браузера. Він лише коригує політику інструментів після того, як plugin уже завантажено.
- Якщо вам не потрібен обмежувальний allowlist plugin, видалення `plugins.allow` також відновлює типову поведінку комплектного браузера.

Типові симптоми:

- `openclaw browser` є невідомою командою.
- Відсутній `browser.request`.
- Агент повідомляє, що інструмент браузера недоступний або відсутній.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **реальної сесії Chrome**
  з виконаним входом.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/підтвердити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб за замовчуванням використовувався керований режим.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
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
- Якщо ви перевизначите порт Gateway (`gateway.port` або `OPENCLAW_GATEWAY_PORT`),
  похідні порти браузера змістяться, щоб залишатися в тій самій «сім’ї».
- `cdpUrl` за замовчуванням використовує керований локальний порт CDP, якщо не задано.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності віддаленого (не-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` застосовується до перевірок доступності рукостискання WebSocket віддаленого CDP.
- Навігація браузера/відкриття вкладок захищені від SSRF перед навігацією та за можливості повторно перевіряються за фінальним `http(s)` URL після навігації.
- У строгому режимі SSRF також перевіряються виявлення/проби віддалених endpoint CDP (`cdpUrl`, включно з пошуками `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням дорівнює `true` (модель довіреної мережі). Установіть `false` для строгого перегляду лише публічних ресурсів.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім для compatibility.
- `attachOnly: true` означає «ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений».
- `color` + `color` для кожного профілю підфарбовують UI браузера, щоб ви бачили, який профіль активний.
- Типовий профіль — `openclaw` (автономний браузер під керуванням OpenClaw). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер користувача з виконаним входом.
- Порядок auto-detect: системний браузер за замовчуванням, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- Локальним профілям `openclaw` `cdpPort`/`cdpUrl` призначаються автоматично — задавайте їх лише для віддаленого CDP.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не
  встановлюйте `cdpUrl` для цього driver.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session
  має підключатися до нестандартного профілю користувача Chromium, такого як Brave або Edge.

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним браузером за замовчуванням** є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення:

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
- **Віддалене керування (host вузла):** запустіть host вузла на машині, де є браузер; Gateway проксуватиме дії браузера до нього.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключатися до віддаленого браузера на базі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі лише для підключення та віддалені CDP-профілі: `openclaw browser stop` закриває активну
  сесію керування і скидає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав процес браузера

Віддалені URL CDP можуть містити автентифікацію:

- Токени в query (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає цю автентифікацію під час виклику endpoint `/json/*` і під час підключення
до CDP WebSocket. Віддавайте перевагу environment variable або менеджерам секретів для
токенів замість коміту їх у config-файли.

## Node browser proxy (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **host вузла** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без додаткового config браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Host вузла надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власного config `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви встановите `nodeHost.browserProxy.allowProfiles`, OpenClaw трактуватиме це як межу найменших привілеїв: можна буде націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів будуть заблоковані на поверхні proxy.
- Вимкніть це, якщо воно не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
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
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless дає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі розміщені сервіси браузерів надають **прямий endpoint WebSocket** замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw підтримує обидва варіанти:

- **endpoint HTTP(S)** — OpenClaw викликає `/json/version`, щоб знайти
  URL WebSocket debugger, а потім підключається.
- **endpoint WebSocket** (`ws://` / `wss://`) — OpenClaw підключається напряму,
  пропускаючи `/json/version`. Використовуйте це для сервісів на кшталт
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) або будь-якого провайдера, який надає вам
  URL WebSocket.

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
  з [Overview dashboard](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш реальний API key Browserbase.
- Browserbase автоматично створює сесію браузера при підключенні WebSocket, тож
  ручний крок створення сесії не потрібен.
- Безкоштовний рівень дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Ліміти платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повну довідку API, посібники зі SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth токеном gateway, `x-openclaw-password` або HTTP Basic auth з
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve та `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнене і не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску і зберігає його в config.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які host вузлів у приватній мережі (Tailscale); уникайте публічного відкриття.
- Розглядайте віддалені URL/токени CDP як секрети; віддавайте перевагу env var або менеджеру секретів.

Поради щодо віддаленого CDP:

- Віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і, де можливо, короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо в config-файли.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (маршрутизувальних config). Профілі можуть бути:

- **керовані openclaw**: виділений браузер на базі Chromium із власним каталогом користувацьких даних + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium запущено деінде)
- **наявна сесія**: ваш наявний профіль Chrome через auto-connect Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються лише за запитом; створюйте їх із `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до вже запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання з налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний custom-профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує auto-connect Chrome MCP, який націлюється на
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

1. Відкрийте inspect-сторінку цього браузера для remote debugging.
2. Увімкніть remote debugging.
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Поширені inspect-сторінки:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test живого підключення:

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
- `tabs` перелічує ваші вже відкриті вкладки браузера
- `snapshot` повертає ref з вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- remote debugging увімкнено на inspect-сторінці цього браузера
- браузер показав запит на підключення, і ви його підтвердили
- `openclaw doctor` переносить старий config браузера на основі розширення і перевіряє, що
  Chrome встановлено локально для типових профілів auto-connect, але він не може
  увімкнути remote debugging у браузері за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте custom-профіль existing-session, передайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або host вузла може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього driver; він лише підключається до
  наявної сесії.
- OpenClaw використовує тут офіційний потік `--autoConnect` Chrome DevTools MCP. Якщо
  встановлено `userDataDir`, OpenClaw передає його далі, щоб націлитися на цей явний
  каталог користувацьких даних Chromium.
- Знімки екрана в режимі existing-session підтримують захоплення сторінки та захоплення елементів через `--ref`
  зі snapshot, але не CSS-селектори `--element`.
- Знімки екрана сторінки existing-session працюють без Playwright через Chrome MCP.
  Знімки екрана елементів за ref (`--ref`) там також працюють, але `--full-page`
  не можна поєднувати з `--ref` або `--element`.
- Дії existing-session усе ще більш обмежені, ніж шлях керованого браузера:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують
    ref зі snapshot замість CSS-селекторів
  - `click` підтримує лише ліву кнопку миші (без перевизначення кнопки або модифікаторів)
  - `type` не підтримує `slowly=true`; використовуйте `fill` або `press`
  - `press` не підтримує `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не
    підтримують перевизначення timeout для окремого виклику
  - `select` наразі підтримує лише одне значення
- Existing-session `wait --url` підтримує точні збіги, підрядки та glob-шаблони,
  як і інші driver браузера. `wait --load networkidle` поки не підтримується.
- Хуки завантаження файлів у existing-session потребують `ref` або `inputRef`, підтримують
  по одному файлу за раз і не підтримують націлювання через CSS `element`.
- Хуки діалогів existing-session не підтримують перевизначення timeout.
- Деякі можливості все ще потребують шляху керованого браузера, зокрема batch-дії,
  експорт PDF, перехоплення завантажень і `responsebody`.
- Existing-session є локальним для host. Якщо Chrome працює на іншій машині або
  в іншому мережевому namespace, використовуйте віддалений CDP або host вузла.

## Гарантії ізоляції

- **Виділений user data dir**: ніколи не торкається вашого особистого профілю браузера.
- **Виділені порти**: уникають `9222`, щоб не конфліктувати з робочими процесами розробки.
- **Детерміноване керування вкладками**: націлювання на вкладки за `targetId`, а не за «останньою вкладкою».

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний варіант:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це через `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє поширені місця встановлення.

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

Усі endpoint приймають `?profile=<name>`.

Якщо налаштовано автентифікацію gateway через спільний секрет, маршрути HTTP браузера також вимагають автентифікації:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` або HTTP Basic auth з цим паролем

Примітки:

- Цей автономний loopback API браузера **не** використовує заголовки `trusted-proxy` або
  ідентичності Tailscale Serve.
- Якщо `gateway.auth.mode` має значення `none` або `trusted-proxy`, ці loopback-маршрути браузера
  не успадковують ці режими з передаванням ідентичності; залишайте їх доступними лише через loopback.

### Вимога Playwright

Для деяких можливостей (navigate/act/AI snapshot/role snapshot, знімки екрана елементів,
PDF) потрібен Playwright. Якщо Playwright не встановлено, ці endpoint повертають
чітку помилку 501.

Що все ще працює без Playwright:

- ARIA snapshot
- Знімки екрана сторінок для керованого браузера `openclaw`, коли доступний WebSocket
  CDP для окремої вкладки
- Знімки екрана сторінок для профілів `existing-session` / Chrome MCP
- Знімки екрана за ref (`--ref`) в `existing-session` із виводу snapshot

Що все ще потребує Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Знімки екрана елементів через CSS-селектори (`--element`)
- Повний експорт PDF браузера

Знімки екрана елементів також відхиляють `--full-page`; маршрут повертає `fullPage is
not supported for element screenshots`.

Якщо ви бачите `Playwright is not available in this gateway build`, установіть повний
пакет Playwright (не `playwright-core`) і перезапустіть gateway, або перевстановіть
OpenClaw з підтримкою браузера.

#### Установлення Playwright у Docker

Якщо ваш Gateway працює в Docker, уникайте `npx playwright` (конфлікти npm override).
Натомість використовуйте комплектний CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Щоб зберігати завантаження браузера, установіть `PLAYWRIGHT_BROWSERS_PATH` (наприклад,
`/home/node/.cache/ms-playwright`) і переконайтеся, що `/home/node` зберігається через
`OPENCLAW_HOME_VOLUME` або bind mount. Див. [Docker](/uk/install/docker).

## Як це працює (внутрішньо)

Загальний потік:

- Невеликий **сервер керування** приймає HTTP-запити.
- Він підключається до браузерів на базі Chromium (Chrome/Brave/Edge/Chromium) через **CDP**.
- Для розширених дій (click/type/snapshot/PDF) він використовує **Playwright** поверх
  CDP.
- Коли Playwright відсутній, доступні лише операції без Playwright.

Такий дизайн забезпечує агенту стабільний, детермінований інтерфейс і водночас дозволяє
вам змінювати локальні/віддалені браузери та профілі.

## Коротка довідка CLI

Усі команди приймають `--browser-profile <name>`, щоб націлитися на конкретний профіль.
Усі команди також приймають `--json` для машиночитаного виводу (стабільні payload).

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

Інспекція:

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

- Для профілів лише для підключення та віддалених CDP-профілів `openclaw browser stop` усе ще є
  правильною командою очищення після тестів. Вона закриває активну сесію керування та
  очищує тимчасові перевизначення емуляції замість завершення базового
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
  що викликає chooser/dialog.
- Шляхи виводу завантажень і trace обмежені тимчасовими коренями OpenClaw:
  - traces: `/tmp/openclaw` (резервний варіант: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (резервний варіант: `${os.tmpdir()}/openclaw/downloads`)
- Шляхи upload обмежені тимчасовим коренем uploads OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (резервний варіант: `${os.tmpdir()}/openclaw/uploads`)
- `upload` також може напряму встановлювати file input через `--input-ref` або `--element`.
- `snapshot`:
  - `--format ai` (типово, коли встановлено Playwright): повертає AI snapshot із числовими ref (`aria-ref="<n>"`).
  - `--format aria`: повертає дерево accessibility (без ref; лише для інспекції).
  - `--efficient` (або `--mode efficient`): компактний пресет role snapshot (interactive + compact + depth + нижчий maxChars).
  - Типове значення config (лише для tool/CLI): установіть `browser.snapshotDefaults.mode: "efficient"`, щоб використовувати efficient snapshot, коли викликач не передає mode (див. [Gateway configuration](/uk/gateway/configuration-reference#browser)).
  - Опції role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) примусово використовують role-based snapshot з ref на кшталт `ref=e12`.
  - `--frame "<iframe selector>"` обмежує role snapshot конкретним iframe (поєднується з role ref на кшталт `e12`).
  - `--interactive` виводить плоский, зручний для вибору список інтерактивних елементів (найкраще для виконання дій).
  - `--labels` додає знімок екрана лише viewport з накладеними мітками ref (друкує `MEDIA:<path>`).
- `click`/`type`/тощо потребують `ref` зі `snapshot` (або числовий `12`, або role ref `e12`).
  CSS-селектори навмисно не підтримуються для дій.

## Snapshot і ref

OpenClaw підтримує два стилі “snapshot”:

- **AI snapshot (числові ref)**: `openclaw browser snapshot` (типово; `--format ai`)
  - Вивід: текстовий snapshot, що містить числові ref.
  - Дії: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Внутрішньо ref розв’язується через `aria-ref` Playwright.

- **Role snapshot (role ref на кшталт `e12`)**: `openclaw browser snapshot --interactive` (або `--compact`, `--depth`, `--selector`, `--frame`)
  - Вивід: список/дерево на основі ролей із `[ref=e12]` (і необов’язковим `[nth=1]`).
  - Дії: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Внутрішньо ref розв’язується через `getByRole(...)` (плюс `nth()` для дублікатів).
  - Додайте `--labels`, щоб включити знімок екрана viewport з накладеними мітками `e12`.

Поведінка ref:

- Ref **не** є стабільними між навігаціями; якщо щось не спрацювало, повторно виконайте `snapshot` і використайте свіжий ref.
- Якщо role snapshot було зроблено з `--frame`, role ref обмежуються цим iframe до наступного role snapshot.

## Додаткові можливості wait

Можна чекати не лише час/текст:

- Очікування URL (glob підтримуються Playwright):
  - `openclaw browser wait --url "**/dash"`
- Очікування стану завантаження:
  - `openclaw browser wait --load networkidle`
- Очікування JS-предиката:
  - `openclaw browser wait --fn "window.ready===true"`
- Очікування видимості селектора:
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
2. Використовуйте `click <ref>` / `type <ref>` (надавайте перевагу role ref в interactive mode)
3. Якщо все одно не працює: `openclaw browser highlight <ref>`, щоб побачити, на що націлюється Playwright
4. Якщо сторінка поводиться дивно:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Для глибокого налагодження: запишіть trace:
   - `openclaw browser trace start`
   - відтворіть проблему
   - `openclaw browser trace stop` (друкує `TRACE:<path>`)

## JSON-вивід

`--json` призначений для скриптів і структурованих інструментів.

Приклади:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshot у JSON містять `refs` плюс невеликий блок `stats` (рядки/символи/ref/interactive), щоб інструменти могли оцінювати розмір payload і щільність.

## Параметри стану та середовища

Вони корисні для сценаріїв “змусь сайт поводитися як X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (застарілий `set headers --json '{"X-Debug":"1"}'` залишається підтримуваним)
- HTTP basic auth: `set credentials user pass` (або `--clear`)
- Геолокація: `set geo <lat> <lon> --origin "https://example.com"` (або `--clear`)
- Media: `set media dark|light|no-preference|none`
- Часовий пояс / locale: `set timezone ...`, `set locale ...`
- Пристрій / viewport:
  - `set device "iPhone 14"` (пресети пристроїв Playwright)
  - `set viewport 1280 720`

## Безпека та приватність

- Профіль браузера openclaw може містити сесії з виконаним входом; вважайте його чутливим.
- `browser act kind=evaluate` / `openclaw browser evaluate` і `wait --fn`
  виконують довільний JavaScript у контексті сторінки. Prompt injection може
  спрямувати це. Вимкніть через `browser.evaluateEnabled=false`, якщо воно вам не потрібне.
- Для приміток щодо входу та anti-bot (X/Twitter тощо) див. [Browser login + X/Twitter posting](/tools/browser-login).
- Тримайте Gateway/host вузла приватним (лише loopback або tailnet).
- Віддалені endpoint CDP мають великі повноваження; використовуйте тунелі та захищайте їх.

Приклад строгого режиму (за замовчуванням блокує приватні/внутрішні призначення):

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
[Browser troubleshooting](/tools/browser-linux-troubleshooting).

Для конфігурацій WSL2 Gateway + Windows Chrome на розділених host див.
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку або елемент).
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця розташування браузера.
  - У sandbox-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: у sandbox-сесіях використовується `sandbox`, у не-sandbox-сесіях — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Tools Overview](/tools) — усі доступні інструменти агента
- [Sandboxing](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Security](/uk/gateway/security) — ризики керування браузером і посилення захисту
