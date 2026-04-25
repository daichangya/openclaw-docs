---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрована служба керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T02:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32d614f519ebe83421426abd86cae23857f5d9afb7500583658961c10eeb69c7
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої реальної сесії Chrome з входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (помаранчевий акцент за замовчуванням).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки, скриншоти, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли plugin браузера ввімкнено.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним робочим браузером. Це безпечна, ізольована поверхня для
автоматизації та перевірки агентом.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте “Browser disabled”, увімкніть його в config (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній, або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування plugin

Стандартний інструмент `browser` — це вбудований plugin. Вимкніть його, щоб замінити іншим plugin, який реєструє ту саму назву інструмента `browser`:

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

Для значень за замовчуванням потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише plugin, це прибере CLI `openclaw browser`, метод gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваш config `browser.*` залишиться недоторканим для заміни.

Зміни config браузера вимагають перезапуску Gateway, щоб plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: обрати
  правильний профіль, тримати ref в межах тієї самої вкладки, використовувати `tabId`/labels для
  націлювання на вкладки та завантажувати skill браузера для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити snapshot перед дією, зробити повторний snapshot
  після змін інтерфейсу, один раз відновити stale refs і повідомляти про входи в систему/2FA/captcha або
  блокувальники камери/мікрофона як ручну дію замість здогадок.

Skills, вбудовані в plugin, перелічуються в доступних skill агента, коли
plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
сеанси не несуть повної вартості токенів.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, зазвичай причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням plugin, а політика інструментів запускається лише після завантаження. Повне вилучення `plugins.allow` також відновлює поведінку за замовчуванням.

## Профілі: `openclaw` vs `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашої **реальної сесії Chrome**
  з входом.

Для викликів інструмента браузера агентом:

- За замовчуванням: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

Задайте `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим використовувався за замовчуванням.

## Конфігурація

Налаштування браузера містяться в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // за замовчуванням: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // вмикайте лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення одного профілю
    remoteCdpTimeoutMs: 1500, // таймаут HTTP віддаленого CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // таймаут рукостискання WebSocket віддаленого CDP (мс)
    tabCleanup: {
      enabled: true, // за замовчуванням: true
      idleMinutes: 120, // задайте 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // задайте 0, щоб вимкнути ліміт на сесію
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

- Сервіс керування прив’язується до loopback на порті, похідному від `gateway.port` (за замовчуванням `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зміщує похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, за замовчуванням використовується локальний CDP-порт під керуванням.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.
- `tabCleanup` — це best-effort очищення вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу subagent, Cron і ACP усе ще закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім у фоновому режимі закривають неактивні або зайві відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера й open-tab захищені SSRF-перевірками до навігації та, у режимі best-effort, повторно перевіряються після навігації на фінальний URL `http(s)`.
- У строгому режимі SSRF discovery віддаленої кінцевої точки CDP і перевірки `/json/version` (`cdpUrl`) також перевіряються.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` за замовчуванням вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають пріоритет над `browser.headless`, тому один локально запущений профіль може залишатися headless, а інший — видимим.
- `color` (верхній рівень і рівень профілю) тонує інтерфейс браузера, щоб ви могли бачити, який профіль активний.
- Профіль за замовчуванням — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер користувача з входом.
- Порядок автовизначення: системний браузер за замовчуванням, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Задайте `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нестандартного користувацького профілю Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо ваш **системний браузер за замовчуванням** базується на Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Задайте `browser.executablePath`, щоб перевизначити
автовизначення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Або задайте це в config для кожної платформи:

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

## Локальне vs віддалене керування

- **Локальне керування (за замовчуванням):** Gateway запускає сервіс керування loopback і може запускати локальний браузер.
- **Віддалене керування (host Node):** запустіть host Node на машині, де є браузер; Gateway проксуватиме дії браузера до нього.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає та не змінює браузери existing-session або віддаленого CDP.

Поведінка зупинки залежить від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірна схема, locale, timezone, offline mode та подібний стан), навіть
  якщо жоден процес браузера не був запущений OpenClaw

URL віддаленого CDP можуть містити автентифікацію:

- Query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час викликів кінцевих точок `/json/*` і під час під’єднання
до WebSocket CDP. Віддавайте перевагу змінним середовища або менеджерам секретів для
токенів замість збереження їх у файлах config.

## Node browser proxy (без конфігурації за замовчуванням)

Якщо ви запускаєте **host Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього Node без додаткової конфігурації браузера.
Це шлях за замовчуванням для віддалених gateway.

Примітки:

- Host Node надає свій локальний сервер керування браузером через **proxy command**.
- Профілі беруться з власного config `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/стандартної поведінки: усі налаштовані профілі залишаються доступними через proxy, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: націлювати можна лише профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні proxy.
- Вимкніть, якщо це не потрібно:
  - На node: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
URL під’єднання CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
для віддаленого профілю браузера найпростішим варіантом є прямий URL WebSocket
з документації під’єднання Browserless.

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
  `wss://` для прямого CDP-під’єднання, або залишити URL HTTPS і дозволити OpenClaw
  визначити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостингові сервіси браузерів надають **пряму кінцеву точку WebSocket** замість
стандартного визначення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію під’єднання:

- **Визначення через HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб визначити URL WebSocket debugger, а потім
  під’єднується. Резервного варіанту через WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw під’єднується напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі URL WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує визначення
  через HTTP `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо визначення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  повертається до прямого рукостискання WebSocket на корені без шляху. Це дозволяє
  кореневому `ws://`, спрямованому на локальний Chrome, усе одно під’єднатися, оскільки Chrome лише
  приймає WebSocket upgrade на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і резидентними
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
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює сесію браузера під час під’єднання WebSocket, тому
  ручний крок створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну годину браузера на місяць.
  Див. [pricing](https://www.browserbase.com/pricing) для лімітів платних планів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного
  довідника API, посібників SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або сполучення Node.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію через shared-secret**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано shared-secret auth, OpenClaw
  автоматично генерує `gateway.auth.token` під час startup і зберігає його в config.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які Node host у приватній мережі (Tailscale); уникайте публічної експозиції.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу env vars або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли config.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: виділений браузер на базі Chromium із власним каталогом користувацьких даних + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне під’єднання Chrome DevTools MCP

Значення за замовчуванням:

- Профіль `openclaw` створюється автоматично, якщо відсутній.
- Профіль `user` вбудований для під’єднання existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, є opt-in; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP за замовчуванням виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні посилання для контексту та налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Поведінка за замовчуванням:

- Вбудований профіль `user` використовує автопід’єднання Chrome MCP, яке націлюється на
  локальний профіль Google Chrome за замовчуванням.

Використовуйте `userDataDir` для Brave, Edge, Chromium або нестандартного профілю Chrome:

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
3. Тримайте браузер запущеним і схваліть запит на під’єднання, коли OpenClaw під’єднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Швидка перевірка живого під’єднання:

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
- `tabs` показує ваші вже відкриті вкладки браузера
- `snapshot` повертає refs із вибраної живої вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- віддалене налагодження ввімкнено на сторінці inspect цього браузера
- браузер показав запит на згоду під’єднання, і ви його прийняли
- `openclaw doctor` мігрує старий config браузера на основі розширення та перевіряє, що
  Chrome локально встановлено для профілів автопід’єднання за замовчуванням, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з входом.
- Якщо ви використовуєте власний профіль existing-session, передайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на під’єднання.
- Gateway або Node host може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях більш ризикований, ніж ізольований профіль `openclaw`, оскільки він може
  діяти всередині вашої сесії браузера з входом.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог користувацьких даних.
- Existing-session може під’єднуватися на вибраному host або через під’єднаний
  вузол браузера. Якщо Chrome знаходиться деінде й жоден вузол браузера не під’єднано, використовуйте
  віддалений CDP або Node host.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — захоплення сторінки та захоплення елементів через `--ref` працюють; CSS-селектори `--element` — ні. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для скриншотів сторінки або елементів за ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` вимагають snapshot refs (без CSS-селекторів). `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують таймаути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження / діалог** — `wait --url` підтримує точні, часткові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів вимагають `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення таймаутів.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще вимагають керований шлях браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог користувацьких даних**: ніколи не торкається профілю вашого особистого браузера.
- **Виділені порти**: уникає `9222`, щоб не створювати конфліктів із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові labels і сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі ID залишаються доступними для
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
- Linux: шукає `google-chrome`, `brave`, `microsoft-edge`, `chromium` тощо.
- Windows: перевіряє типові місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
плюс відповідний CLI `openclaw browser` (snapshot, refs, можливості wait,
вивід JSON, робочі процеси налагодження). Див.
[API керування браузером](/uk/tools/browser-control) для повного довідника.

## Усунення проблем

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення проблем браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними host WSL2 Gateway + Windows Chrome див.
[Усунення проблем WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій startup CDP vs SSRF-блокування навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій startup або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером є справною.
- **SSRF-блокування навігації** означає, що площина керування браузером є справною, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Збій startup або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- SSRF-блокування навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики browser/network, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему доступності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером є справним.

Важливі деталі поведінки:

- Config браузера за замовчуванням використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` через loopback перевірки справності CDP навмисно пропускають перевірку доступності браузера за SSRF для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера за замовчуванням.
- Віддавайте перевагу вузьким виняткам для host, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і був перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево інтерфейсу (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (вся сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де знаходиться браузер.
  - У sandbox-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: sandbox-сесії за замовчуванням використовують `sandbox`, не-sandbox сесії — `host`.
  - Якщо під’єднано вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Пісочниця](/uk/gateway/sandboxing) — керування браузером у sandbox-середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
