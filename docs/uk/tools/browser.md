---
read_when:
    - Додавання автоматизації браузера під керуванням агента
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера + життєвого циклу в програмі для macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T17:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0286c4e61da27b803311c966798b58918bbd9bc055feaba24e0858112baed16c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, клацати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої справжньої авторизованої сесії Chrome через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (клацання/введення/перетягування/вибір), знімки стану, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено browser
  Plugin.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним браузером. Це безпечна, ізольована поверхня для
автоматизації агентом і перевірки.

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

Якщо `openclaw browser` повністю відсутній або агент каже, що інструмент браузера
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

Для типових значень потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента й сервіс керування як єдине ціле; ваша config `browser.*` залишиться недоторканою для заміни.

Зміни config браузера вимагають перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повний інструмент `browser`. Якщо агент або
запущений субагент має використовувати автоматизацію браузера, додайте browser на
етапі профілю:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Для одного агента використовуйте `agents.list[].tools.alsoAllow: ["browser"]`.
Одного лише `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що політика субагента
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: обрати
  правильний профіль, зберігати ref у межах тієї самої вкладки, використовувати `tabId`/мітки для націлювання на вкладки та завантажувати browser skill для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити snapshot перед дією,
  повторно зробити snapshot після змін UI, один раз відновити stale ref та повідомляти про блокування входом/2FA/captcha або
  камерою/мікрофоном як про ручну дію замість здогадок.

Skills, що постачаються разом із Plugin, перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
кроки не оплачують повну вартість у токенах.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідомий, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство у списку дозволених — список дозволених керує завантаженням Plugin, а політика інструментів запускається лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP для вашої **справжньої авторизованої сесії Chrome**.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні авторизовані сесії й користувач
  перебуває за комп’ютером, щоб клацнути/схвалити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Встановіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

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

- Сервіс керування прив’язується до loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тому самому сімействі.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типовим є керований локальний порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок досяжності HTTP віддаленого (не-loopback) CDP; `remoteCdpHandshakeTimeoutMs` застосовується до handshake WebSocket віддаленого CDP.
- `localLaunchTimeoutMs` — це бюджет часу для того, щоб локально запущений керований процес Chrome
  відкрив свій HTTP endpoint CDP. `localCdpReadyTimeoutMs` — це
  наступний бюджет часу для готовності websocket CDP після виявлення процесу.
  Збільшіть ці значення на Raspberry Pi, недорогих VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення обмежуються 120000 ms.
- `actionTimeoutMs` — це типовий бюджет часу для запитів browser `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб довгі очікування могли завершитися замість тайм-ауту на межі HTTP.
- `tabCleanup` — це прибирання з найкращими зусиллями для вкладок, відкритих сесіями браузера основного агента. Прибирання життєвого циклу субагента, Cron і ACP однаково закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними для повторного використання, а потім у фоновому режимі закривають неактивні або надлишкові відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера й відкриття вкладок захищені від SSRF до навігації та повторно перевіряються з найкращими зусиллями на фінальному URL `http(s)` після неї.
- У суворому режимі SSRF також перевіряються виявлення endpoint віддаленого CDP і запити до `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, яким керує OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування proxy provider не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці Chrome proxy через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Суворий режим SSRF блокує явну маршрутизацію browser proxy, якщо доступ браузера до приватної мережі не був навмисно увімкнений.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно довірений.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише під’єднуватися, якщо він уже запущений.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет за `browser.headless`, тож один локально запущений профіль може лишатися headless, поки інший лишається видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск headless для локальних керованих профілів без перезапису
  `browser.headless` або config профілю. Профілі existing-session, attach-only і
  віддаленого CDP відхиляють це перевизначення, тому що OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у headless, коли ні середовище, ні профіль/глобальна
  config явно не задають режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані профілі в headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає придатну до дії помилку на хостах Linux без сервера дисплея;
  явний запит `start --headless` усе одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають вищий пріоритет за `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на основі Chromium.
- `color` (верхнього рівня та для профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб перейти на браузер авторизованого користувача.
- Порядок автоматичного виявлення: системний типовий браузер, якщо він на основі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього driver.
- Встановіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має підключатися до нестандартного профілю користувача Chromium (Brave, Edge тощо).

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на основі Chromium)

Якщо вашим **системним типовим** браузером є браузер на основі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Встановіть `browser.executablePath`, щоб перевизначити
автовиявлення. `~` розгортається до домашнього каталогу вашої ОС:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Або задайте це в config, окремо для кожної платформи:

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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість під’єднуються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер, що стоїть за `cdpUrl`.

## Локальне й віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (вузол-хост):** запустіть вузол-хост на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  під’єднатися до віддаленого браузера на основі Chromium. У цьому разі OpenClaw не запускатиме локальний браузер.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери `existing-session` або віддаленого CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Його зміна для
  активного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування й скидає перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо OpenClaw не запускав жоден процес браузера

URL віддаленого CDP можуть містити автентифікацію:

- Токени в query (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає ці дані автентифікації під час виклику endpoint `/json/*` і під час підключення
до WebSocket CDP. Для токенів краще використовувати змінні середовища або менеджери секретів,
замість коміту їх у файли config.

## Проксі браузера Node (типовий режим без конфігурації)

Якщо ви запускаєте **вузол-хост** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без жодної додаткової config браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Вузол-хост надає доступ до свого локального сервера керування браузером через **проксі-команду**.
- Профілі беруться з власної config вузла `browser.profiles` (так само, як і локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw трактує це як межу мінімальних привілеїв: націлюватися можна лише на профілі зі списку дозволених, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть це, якщо воно вам не потрібне:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
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
- Виберіть endpoint регіону, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дати OpenClaw
  виявити `/json/version`.

## Провайдери прямого WebSocket CDP

Деякі хостингові браузерні сервіси надають **прямий endpoint WebSocket** замість
стандартного HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного варіанта WebSocket немає.
- **Прямі endpoint WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` із шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через handshake WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого handshake WebSocket на корені без шляху. Це дає змогу
  підключитися навіть для `ws://`, що вказує на локальний Chrome, оскільки Chrome приймає
  оновлення WebSocket лише на конкретному шляху для цілі з
  `/json/version`.

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
  з [панелі огляду](https://www.browserbase.com/overview).
- Замініть `<BROWSERBASE_API_KEY>` на ваш справжній API-ключ Browserbase.
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тому
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію й одну годину браузера на місяць.
  Обмеження платних планів дивіться в [pricing](https://www.browserbase.com/pricing).
- Повний довідник API, посібники з SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання вузлів.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth за токеном gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено й не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в config.
- OpenClaw **не** генерує цей токен автоматично, якщо `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які вузли-хости в приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте URL/токени віддаленого CDP як секрети; краще використовувати змінні середовища або менеджер секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли config.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на основі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на основі Chromium працює в іншому місці)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` автоматично створюється, якщо його немає.
- Профіль `user` вбудований для підключення existing-session через Chrome MCP.
- Профілі existing-session, окрім `user`, вмикаються лише за бажанням; створюйте їх через `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може під’єднуватися до запущеного профілю браузера на основі Chromium через
офіційний сервер Chrome DevTools MCP. Це дає змогу повторно використовувати вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання на налаштування:

- [Chrome for Developers: Використання Chrome DevTools MCP із вашою сесією браузера](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо хочете
іншу назву, колір або каталог даних браузера.

Типова поведінка:

- Вбудований профіль `user` використовує автоматичне підключення Chrome MCP, яке націлюється на
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
3. Тримайте браузер запущеним і підтвердьте запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Жива smoke-перевірка підключення:

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
- `tabs` перелічує вже відкриті у вашому браузері вкладки
- `snapshot` повертає ref із вибраної живої вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на основі Chromium має версію `144+`
- у сторінці inspect цього браузера увімкнено віддалене налагодження
- браузер показав запит на приєднання, і ви його підтвердили
- `openclaw doctor` мігрує стару config браузера на основі розширення і перевіряє, що
  Chrome встановлено локально для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження в самому браузері замість вас

Використання агентом:

- Використовуйте `profile="user"`, коли вам потрібен стан авторизованого браузера користувача.
- Якщо ви використовуєте власний профіль existing-session, передайте його явну назву.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб підтвердити
  запит на підключення.
- Gateway або вузол-хост може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях ризикованіший, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій авторизованій сесії браузера.
- OpenClaw не запускає браузер для цього driver; він лише під’єднується.
- Тут OpenClaw використовує офіційний сценарій Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може під’єднуватися на вибраному хості або через підключений
  вузол браузера. Якщо Chrome розміщено в іншому місці й жоден вузол браузера не підключено, використовуйте
  віддалений CDP або вузол-хост.

### Власний запуск Chrome MCP

Перевизначайте сервер Chrome DevTools MCP, який запускається, для окремого профілю, коли типовий
сценарій `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, вендорні бінарні файли):

| Field        | Що робить                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який слід запускати замість `npx`. Обробляється як є; абсолютні шляхи підтримуються.                    |
| `mcpArgs`    | Масив аргументів, який без змін передається в `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли для профілю existing-session задано `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint у Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (endpoint HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці endpoint і `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP під’єднується до
вже запущеного браузера за цим endpoint, а не відкриває каталог профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — захоплення сторінки та захоплення елементів через `--ref` працюють; CSS-селектори `--element` не працюють. `--full-page` не можна поєднувати з `--ref` або `--element`. Playwright не потрібен для знімків екрана сторінки або елементів на основі ref.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують ref зі snapshot (без CSS-селекторів). `click-coords` клацає по видимих координатах viewport і не потребує ref зі snapshot. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремого виклику. `select` приймає одне значення.
- **Очікування / завантаження файлів / діалоги** — `wait --url` підтримує точні, підрядкові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Можливості лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще вимагають шляху з керованим браузером.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
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

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
разом із відповідним CLI `openclaw browser` (snapshot, ref, розширені можливості wait,
вивід JSON, робочі процеси налагодження). Повний довідник дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), дивіться
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome дивіться
[Усунення несправностей WSL2 + Windows + віддалений Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти блокування SSRF під час навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером є справною.
- **Блокування SSRF під час навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхилена політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Блокування SSRF під час навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються помилкою політики browser/network, тоді як `start` і `tabs` і далі працюють

Використовуйте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а збій у політиці навігації або цільовій сторінці.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером є справним.

Важливі деталі поведінки:

- Config браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю loopback `openclaw` перевірки справності CDP навмисно пропускають перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` дозволена.

Рекомендації з безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує id `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (усю сторінку, елемент або ref із мітками).
- `browser doctor` перевіряє Gateway, Plugin, профіль, браузер і готовність вкладки.
- `browser` приймає:
  - `profile`, щоб вибрати іменований профіль браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`), щоб вибрати, де знаходиться браузер.
  - У sandbox-сесіях `target: "host"` вимагає `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: sandbox-сесії типово використовують `sandbox`, сесії без sandbox типово використовують `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизувати запит до нього, якщо ви явно не зафіксуєте `target="host"` або `target="node"`.

Це робить поведінку агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Sandboxing](/uk/gateway/sandboxing) — керування браузером у середовищах sandbox
- [Безпека](/uk/gateway/security) — ризики керування браузером і його посилення
