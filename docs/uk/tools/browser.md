---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження того, чому openclaw втручається у роботу вашого власного Chrome
    - Реалізація налаштувань браузера та життєвого циклу в програмі для macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (під керуванням OpenClaw)
x-i18n:
    generated_at: "2026-04-25T00:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9870292f4205b01a072af10c989e8815f448a8f51c8863692fa5d1ba134bd0ee
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, клацати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашого реального сеансу Chrome із виконаним входом через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (перелік/відкриття/фокусування/закриття).
- Дії агента (`click`/`type`/`drag`/`select`), знімки, скриншоти, PDF.
- Вбудовану skill `browser-automation`, яка навчає агентів циклу відновлення
  snapshot, stable-tab, stale-ref і manual-blocker, коли увімкнено
  Plugin браузера.
- Необов’язкову підтримку кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим основним щоденним браузером. Це безпечна, ізольована поверхня для
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

Якщо `openclaw browser` повністю відсутня або агент каже, що інструмент браузера
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

Для типових налаштувань потрібні і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Вимкнення лише Plugin прибирає CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента й сервіс керування як єдине ціле; ваша конфігурація `browser.*` лишається недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агентів

Plugin браузера постачається з двома рівнями вказівок для агентів:

- Опис інструмента `browser` містить компактний, завжди активний контракт: вибирати
  правильний профіль, зберігати ref в межах тієї самої вкладки, використовувати `tabId`/мітки для
  націлювання на вкладки та завантажувати skill браузера для багатокрокової роботи.
- Вбудована skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряти status/tabs, позначати робочі вкладки мітками, робити snapshot перед дією,
  повторно робити snapshot після змін UI, один раз відновлювати stale ref та
  повідомляти про вхід/2FA/captcha або блокування camera/microphone як ручну дію замість здогадок.

Skills, вбудовані в Plugin, відображаються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не оплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідома, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів запускається лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль під’єднання Chrome MCP до вашого **реального Chrome із виконаним входом**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сеанси з виконаним входом і користувач
  перебуває за комп’ютером, щоб клацнути/підтвердити будь-який запит на під’єднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете типово використовувати керований режим.

## Конфігурація

Налаштування браузера розміщені в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // типово: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // вмикайте лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення одного профілю
    remoteCdpTimeoutMs: 1500, // тайм-аут HTTP віддаленого CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // тайм-аут рукостискання WebSocket віддаленого CDP (мс)
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

<AccordionGroup>

<Accordion title="Порти та доступність">

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій групі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, він типово вказує на локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок доступності HTTP віддаленого CDP (не-loopback); `remoteCdpHandshakeTimeoutMs` застосовується до рукостискань WebSocket віддаленого CDP.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені SSRF-перевіркою перед навігацією та повторно перевіряються з найкращим зусиллям на фінальному URL `http(s)` після неї.
- У строгому режимі SSRF відкриття віддалених кінцевих точок CDP і перевірки `/json/version` (`cdpUrl`) теж перевіряються.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже працює.
- `color` (верхнього рівня та для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер користувача з виконаним входом.
- Порядок автовизначення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має під’єднуватися до нетипового профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування та може запускати локальний браузер.
- **Віддалене керування (вузол-хост):** запустіть вузол-хост на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** установіть `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на базі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активний
  сеанс керування та скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, locale, timezone, offline mode та подібний стан), навіть
  якщо OpenClaw не запускав жодного процесу браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час виклику кінцевих точок `/json/*` і під час підключення
до WebSocket CDP. Віддавайте перевагу змінним середовища або менеджерам секретів для
токенів замість комітування їх у файли конфігурації.

## Проксі браузера вузла (типово без конфігурації)

Якщо ви запускаєте **вузол-хост** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Вузол-хост надає свій локальний сервер керування браузером через **команду проксі**.
- Профілі надходять із власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу найменших привілеїв: можна націлюватися лише на профілі з allowlist, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостингова служба Chromium, яка надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку форму, але
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

- Замініть `<BROWSERLESS_API_KEY>` на ваш реальний токен Browserless.
- Виберіть кінцеву точку регіону, яка відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS, а OpenClaw
  сам виконає виявлення `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостингові служби браузерів надають **пряму кінцеву точку WebSocket** замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три форми
URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S) виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  під’єднується. Резервного переходу на WebSocket немає.
- **Прямі кінцеві точки WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw під’єднується напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку намагається виконати HTTP
  виявлення `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на корені без шляху. Це дає змогу
  голому `ws://`, спрямованому на локальний Chrome, усе одно під’єднатися, оскільки Chrome
  приймає WebSocket upgrades лише на конкретному шляху для цілі з
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
безголових браузерів із вбудованим розв’язанням CAPTCHA, stealth mode та residential
proxies.

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
- Замініть `<BROWSERBASE_API_KEY>` на свій справжній API key Browserbase.
- Browserbase автоматично створює сеанс браузера під час підключення WebSocket, тому
  ручний крок створення сеансу не потрібен.
- Безкоштовний тариф дозволяє один одночасний сеанс і одну годину браузера на місяць.
  Обмеження платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Дивіться [документацію Browserbase](https://docs.browserbase.com) для повної
  довідки API, посібників із SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairing вузла.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено й не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` вже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли-хости в приватній мережі (Tailscale); уникайте публічної доступності.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу env vars або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим кінцевим точкам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **під керуванням openclaw**: виділений екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює деінде)
- **наявний сеанс**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` вбудований для під’єднання existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються за бажанням; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переносить його локальний каталог даних до Trash.

Усі кінцеві точки керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Existing-session через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний custom existing-session profile, якщо хочете
іншу назву, колір або каталог даних браузера.

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

1. Відкрийте inspect page цього браузера для віддаленого налагодження.
2. Увімкніть remote debugging.
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw під’єднається.

Поширені inspect pages:

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

Як виглядає успіх:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` показує список уже відкритих вкладок браузера
- `snapshot` повертає ref із вибраної live вкладки

Що перевірити, якщо під’єднання не працює:

- цільовий браузер на базі Chromium має версію `144+`
- remote debugging увімкнено на inspect page цього браузера
- браузер показав запит на згоду на під’єднання, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів auto-connect, але він не може
  увімкнути browser-side remote debugging за вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте custom existing-session profile, передайте явну назву цього профілю.
- Вибирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на під’єднання.
- Gateway або вузол-хост може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашому браузері із виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише під’єднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі, щоб націлитися на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному хості або через підключений
  browser node. Якщо Chrome працює деінде й browser node не підключено, використовуйте
  віддалений CDP або вузол-хост.

<Accordion title="Обмеження функцій existing-session">

Порівняно з профілем `openclaw` під керуванням, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки або елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують ref зі snapshot (без CSS-селекторів). `click` підтримує лише ліву кнопку. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Wait / upload / dialog** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Hooks завантаження потребують `ref` або `inputRef`, один файл за раз, без CSS `element`. Hooks діалогів не підтримують перевизначення тайм-ауту.
- **Лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог даних користувача**: ніколи не торкається профілю вашого особистого браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, а потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти повинні повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
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

Для написання сценаріїв і налагодження Gateway надає невеликий **HTTP
API керування лише для loopback** плюс відповідний CLI `openclaw browser` (знімки, ref, розширені можливості wait,
JSON-вивід, робочі процеси налагодження). Повну довідку див. в
[Browser control API](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для сценаріїв із розділеними хостами WSL2 Gateway + Windows Chrome див.
[WSL2 + Windows + усунення несправностей віддаленого Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску CDP або перевірки готовності** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **Блокування SSRF навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхиляється політикою.

Поширені приклади:

- Збій запуску CDP або перевірки готовності:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою browser/network policy, тоді як `start` і `tabs` усе ще працюють

Використайте цю мінімальну послідовність, щоб відрізнити одне від іншого:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не як проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а проблема в політиці навігації або в цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального профілю `openclaw` під керуванням через loopback перевірки справності CDP навмисно пропускають застосування SSRF-досяжності браузера до власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Вказівки з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і був перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (всю сторінку, елемент або ref з мітками).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де працює браузер.
  - У sandbox-сеансах `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: sandbox-сеанси типово використовують `sandbox`, а не-sandbox-сеанси — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксували `target="host"` або `target="node"`.

Це зберігає детермінованість агента й допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
