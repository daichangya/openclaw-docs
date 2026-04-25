---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає роботі вашого власного Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T02:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34b51f5d57a3a8092d2082efd9131933f4ae5777173143b521946edaf005b589
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** взаємодіє з профілем вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої реальної сесії Chrome, у якій ви ввійшли, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/сфокусувати/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований навик `browser-automation`, який навчає агентів циклу відновлення `snapshot`,
  `stable-tab`, `stale-ref` і `manual-blocker`, коли увімкнено плагін браузера.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** призначений для вашого щоденного використання. Це безпечне, ізольоване середовище для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте повідомлення “Browser disabled”, увімкніть його в config (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент повідомляє, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє ту саму назву інструмента `browser`:

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

Для значень за замовчуванням потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдиний модуль; ваш config `browser.*` залишиться без змін для заміни.

Зміни config браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Плагін браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний, завжди активний контракт: вибирати
  правильний профіль, тримати посилання в межах тієї самої вкладки, використовувати `tabId`/мітки для націлювання на вкладки
  і завантажувати навик браузера для багатокрокової роботи.
- Вбудований навик `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити знімок стану перед дією, повторно зробити знімок
  після змін в інтерфейсі, один раз відновити застарілі посилання та повідомляти про блокування через login/2FA/captcha або
  камеру/мікрофон як про ручну дію, а не вгадувати.

Навики, вбудовані в Plugin, відображаються у списку доступних навиків агента, коли
Plugin увімкнено. Повні інструкції навику завантажуються за потреби, тож звичайні
цикли не оплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідомий, відсутній `browser.request` або агент повідомляє, що інструмент браузера недоступний, типовою причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в списку дозволів — список дозволів контролює завантаження Plugin, а політика інструментів виконується лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **реальної сесії Chrome**
  із виконаним входом.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на підключення.
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
      work: { cdpPort: 18801, color: "#0066CC", headless: true },
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
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, він типово вказує на локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності CDP HTTP для віддалених (не-loopback) адрес; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сесіями браузера агента. Підлеглі агенти, Cron і очищення життєвого циклу ACP однаково закривають свої явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними для повторного використання, а потім закривають неактивні або надлишкові відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF до навігації, а після неї за можливості повторно перевіряються на фінальному URL `http(s)`.
- У строгому режимі SSRF також перевіряються виявлення віддалених кінцевих точок CDP і запити `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, яким керує OpenClaw. Керований Chrome типово запускається напряму, тому налаштування проксі provider не послаблюють перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не увімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі свідомо вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і надалі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже працює.
- `headless` можна задавати глобально або для кожного локального керованого профілю. Значення на рівні профілю перевизначають `browser.headless`, тож один локально запущений профіль може залишатися headless, поки інший залишається видимим.
- `color` (на верхньому рівні та для кожного профілю) тонує інтерфейс браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер користувача з виконаним входом.
- Порядок автовизначення: системний браузер за замовчуванням, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього driver.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на основі Chromium)

Якщо ваш **системний браузер за замовчуванням** заснований на Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
автовизначення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Або задайте це в config, для кожної платформи:

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

## Локальне та віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає сервіс керування loopback і може запускати локальний браузер.
- **Віддалене керування (хост node):** запустіть хост node на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на основі Chromium. У цьому випадку OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддаленого CDP.

Поведінка під час зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та знімає перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо жоден процес браузера не був запущений OpenClaw

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Віддавайте перевагу змінним середовища або менеджерам секретів для
токенів замість збереження їх у config-файлах.

## Node browser proxy (нульова конфігурація за замовчуванням)

Якщо ви запускаєте **хост node** на машині, де є ваш браузер, OpenClaw може
автоматично спрямовувати виклики інструмента браузера до цього node без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Хост node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власного config `browser.profiles` цього node (так само, як і локально).
- `nodeHost.browserProxy.allowProfiles` — необов’язковий параметр. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw сприймає це як межу найменших привілеїв: націлюватися можна лише на профілі зі списку дозволів, а маршрути створення/видалення постійних профілів блокуються на поверхні proxy.
- Вимкніть це, якщо воно вам не потрібне:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (розміщений віддалений CDP)

[Browserless](https://browserless.io) — це розміщений сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку з цих форм, але
для профілю віддаленого браузера найпростішим варіантом є прямий URL WebSocket
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
- Виберіть кінцеву точку регіону, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі розміщені сервіси браузерів надають **пряму кінцеву точку WebSocket**, а не
стандартне виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL налагоджувача WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі адреси bare WebSocket** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує
  виявлення HTTP `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на bare-корені. Це дозволяє
  bare `ws://`, спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome
  приймає оновлення WebSocket лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
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
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тож
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Обмеження платних тарифів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники зі SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання node.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію shared-secret**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної shared-secret автентифікації, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску та зберігає його в config.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode`
  уже має значення `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости node у приватній мережі (Tailscale); уникайте публічної доступності.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу шифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у config-файли.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на основі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на основі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Значення за замовчуванням:

- Профіль `openclaw` автоматично створюється, якщо відсутній.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session є opt-in понад `user`; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це дозволяє повторно використовувати вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Використання Chrome DevTools MCP із сесією вашого браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний користувацький профіль existing-session, якщо вам потрібна
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

1. Відкрийте в цьому браузері сторінку inspect для віддаленого налагодження.
2. Увімкніть віддалене налагодження.
3. Залиште браузер запущеним і схваліть запит на підключення, коли OpenClaw підключатиметься.

Поширені сторінки inspect:

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

Ознаки успішної роботи:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає посилання з вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на основі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на згоду на підключення, і ви його прийняли
- `openclaw doctor` переносить стару конфігурацію браузера на основі розширення й перевіряє, що
  Chrome локально встановлений для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження в браузері замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте користувацький профіль existing-session, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на підключення.
- Gateway або хост node можуть запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього driver; він лише підключається.
- Тут OpenClaw використовує офіційний механізм Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному хості або через підключений
  browser node. Якщо Chrome знаходиться в іншому місці і жоден browser node не підключений, використовуйте
  віддалений CDP або хост node.

<Accordion title="Обмеження функцій existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — підтримуються знімки сторінки та знімки елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для знімків екрана сторінки чи елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують посилань зі snapshot (без CSS-селекторів). `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Wait / upload / dialog** — `wait --url` підтримує точні, часткові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-аутів.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` і далі потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, як-от `t1`, необов’язкові мітки та сирий `targetId`.
  Агентам слід повторно використовувати `suggestedTargetId`; сирі ідентифікатори залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити це за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє поширені розташування встановлення.

## API керування (необов’язково)

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування
лише для loopback**, а також відповідний CLI `openclaw browser` (snapshot, refs, wait
power-ups, вивід JSON, сценарії налагодження). Повний довідник дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome дивіться
[Усунення несправностей WSL2 + Windows + віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти блокування SSRF під час навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером працездатна.
- **Блокування SSRF під час навігації** означає, що площина керування браузером працездатна, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблеми з готовністю CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще нездорова. Розглядайте це як проблему досяжності CDP, а не як проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершуються помилкою, площина керування браузером працює, а помилка пов’язана з політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером працює справно.

Важливі деталі поведінки:

- Config браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають примусову перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і пройшов перевірку.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево інтерфейсу (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця розташування браузера.
  - У sandbox-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` пропущено: sandbox-сесії за замовчуванням використовують `sandbox`, сесії без sandbox — `host`.
  - Якщо підключено node з підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксували `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
