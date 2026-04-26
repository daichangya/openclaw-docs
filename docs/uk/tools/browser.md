---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження того, чому openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера та життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-26T03:56:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **виділений профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера та керується через невеликий локальний
сервіс керування всередині Gateway (лише local loopback).

Погляд для початківців:

- Думайте про це як про **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати та вводити текст** у безпечному середовищі.
- Вбудований профіль `user` під’єднується до вашої реальної сесії Chrome, у якій уже виконано вхід, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки, знімки екрана, PDF.
- Вбудований skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено browser Plugin.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим щоденним основним браузером. Це безпечна, ізольована поверхня для
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

Якщо ви отримуєте “Browser disabled”, увімкніть це в конфігурації (див. нижче) і перезапустіть
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

Типові налаштування потребують і `plugins.entries.browser.enabled`, і `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдиний модуль; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера вимагають перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` містить `web_search` і
`web_fetch`, але не містить повний інструмент `browser`. Якщо агент або
породжений субагент має використовувати автоматизацію браузера, додайте browser на етапі профілю:

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

Browser Plugin постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: оберіть
  правильний профіль, тримайте refs на тій самій вкладці, використовуйте `tabId`/labels для націлювання на вкладки та завантажуйте browser skill для багатокрокової роботи.
- Вбудований skill `browser-automation` містить довший робочий цикл:
  спочатку перевіряйте status/tabs, позначайте вкладки завдання, робіть snapshot перед дією,
  повторно робіть snapshot після змін UI, один раз відновлюйте stale refs і повідомляйте про перешкоди login/2FA/captcha або
  camera/microphone як про ручну дію замість здогадок.

Вбудовані в Plugin Skills перелічуються в доступних Skills агента, коли
Plugin увімкнено. Повні інструкції skill завантажуються на вимогу, тому звичайні
ходи не оплачують повну вартість токенів.

## Відсутня команда або інструмент браузера

Якщо після оновлення `openclaw browser` невідома, `browser.request` відсутній або агент повідомляє, що інструмент браузера недоступний, звичайна причина — список `plugins.allow`, у якому відсутній `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в allowlist — allowlist керує завантаженням Plugin, а політика інструментів запускається лише після завантаження. Повне видалення `plugins.allow` також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль приєднання Chrome MCP до вашої **реальної сесії Chrome**
  з виконаним входом.

Для викликів інструмента браузера агентом:

- Типово: використовуйте ізольований браузер `openclaw`.
- Віддавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на приєднання.
- `profile` — це явне перевизначення, коли вам потрібен конкретний режим браузера.

Установіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера зберігаються в `~/.openclaw/openclaw.json`.

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
    localLaunchTimeoutMs: 15000, // тайм-аут виявлення локального керованого Chrome після запуску (мс)
    localCdpReadyTimeoutMs: 8000, // тайм-аут готовності локального керованого CDP після запуску (мс)
    actionTimeoutMs: 60000, // типовий тайм-аут дії браузера (мс)
    tabCleanup: {
      enabled: true, // типово: true
      idleMinutes: 120, // установіть 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // установіть 0, щоб вимкнути обмеження на сесію
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

- Сервіс керування прив’язується до local loopback на порту, похідному від `gateway.port` (типово `18791` = gateway + 2). Перевизначення `gateway.port` або `OPENCLAW_GATEWAY_PORT` зсуває похідні порти в тій самій сім’ї.
- Локальним профілям `openclaw` автоматично призначаються `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не задано, типово використовується локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого й `attachOnly` CDP, а також до HTTP-запитів відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  рукостискань їхнього CDP WebSocket.
- `localLaunchTimeoutMs` — це бюджет часу, за який локально запущений керований процес Chrome
  має відкрити свій HTTP endpoint CDP. `localCdpReadyTimeoutMs` — це
  подальший бюджет для готовності websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, малопотужних VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; некоректні
  значення конфігурації відхиляються.
- `actionTimeoutMs` — це типовий бюджет для запитів browser `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике вікно запасу, щоб тривалі очікування могли завершитися, а не завершувалися через тайм-аут на межі HTTP.
- `tabCleanup` — це найкраще можливе очищення вкладок, відкритих основними browser-сесіями агента. Очищення життєвого циклу субагента, Cron і ACP усе ще закриває явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними для повторного використання, а потім у фоновому режимі закривають неактивні або надлишкові відстежувані вкладки.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед навігацією, а потім повторно перевіряються за найкращої можливості на кінцевому `http(s)` URL.
- У строгому режимі SSRF також перевіряються виявлення endpoint віддаленого CDP і зондування `/json/version` (`cdpUrl`).
- Змінні середовища Gateway/provider `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` не проксіюють автоматично браузер, керований OpenClaw. Керований Chrome типово запускається напряму, щоб налаштування проксі провайдера не послаблювали перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передавайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не ввімкнено навмисно.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнено; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` і далі підтримується як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілю">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише приєднуватися, якщо він уже запущений.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають пріоритет над `browser.headless`, тож один локально запущений профіль може залишатися headless, а інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск headless для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  віддаленого CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  автоматично типово переходять у headless, коли ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не вибирає режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово запускає локальні керовані браузери в режимі headless для
  поточного процесу. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає придатну до дії помилку на хостах Linux без сервера дисплея;
  явний запит `start --headless` все одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають пріоритет над `browser.executablePath`, тож різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхнього рівня і для кожного профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований окремий). Використовуйте `defaultProfile: "user"`, щоб за замовчуванням перейти до браузера користувача з виконаним входом.
- Порядок автовизначення: системний типовий браузер, якщо він базується на Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не задавайте `cdpUrl` для цього драйвера.
- Установіть `browser.profiles.<name>.userDataDir`, коли профіль existing-session має приєднуватися до нестандартного профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Установіть `browser.executablePath`, щоб перевизначити
автовизначення. Значення `executablePath` верхнього рівня та для окремого профілю приймають `~`
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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість приєднуються до вже запущеного браузера,
а профілі віддаленого CDP використовують браузер за `cdpUrl`.

## Локальне та віддалене керування

- **Локальне керування (типово):** Gateway запускає сервіс керування на local loopback і може запускати локальний браузер.
- **Віддалене керування (хост Node):** запустіть хост Node на машині, де є браузер; Gateway проксуватиме до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  приєднатися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад, Browserless у
  Docker, опублікований на `127.0.0.1`), також задайте `attachOnly: true`. CDP на loopback
  без `attachOnly` вважається локальним профілем браузера, керованим OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддаленого CDP.
- `executablePath` дотримується того самого правила локального керованого профілю. Зміна його для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використовував новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only та віддаленого CDP: `openclaw browser stop` закриває активну
  сесію керування і звільняє перевизначення емуляції Playwright/CDP (viewport,
  color scheme, locale, timezone, offline mode та подібний стан), навіть
  якщо жоден процес браузера не був запущений OpenClaw

URL віддаленого CDP можуть містити автентифікацію:

- Токени запиту (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає цю автентифікацію під час виклику endpoint `/json/*` і під час підключення
до WebSocket CDP. Віддавайте перевагу змінним середовища або менеджерам секретів для
токенів замість їх коміту до файлів конфігурації.

## Проксі браузера Node (типово без конфігурації)

Якщо ви запускаєте **хост Node** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без жодної додаткової конфігурації браузера.
Це типовий шлях для віддалених Gateway.

Примітки:

- Хост Node експонує свій локальний сервер керування браузером через **proxy command**.
- Профілі надходять із власної конфігурації `browser.profiles` вузла (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` необов’язковий. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw розглядає це як межу найменших привілеїв: лише профілі з allowlist можна націлювати, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть, якщо це вам не потрібно:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати обидві форми, але
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

- Замініть `<BROWSERLESS_API_KEY>` на свій справжній токен Browserless.
- Виберіть endpoint регіону, що відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або зберегти URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless самостійно розміщено в Docker, а OpenClaw працює на хості, розглядайте
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

Адреса в `browser.profiles.browserless.cdpUrl` має бути доступною для процесу
OpenClaw. Browserless також має оголошувати відповідний доступний endpoint;
задайте Browserless `EXTERNAL` на той самий базовий WebSocket, доступний для OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільну приватну Docker-адресу
мережі. Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на
адресу, недоступну OpenClaw, HTTP CDP може виглядати справним, тоді як приєднання WebSocket
все одно не спрацює.

Не залишайте `attachOnly` незаданим для профілю Browserless на loopback. Без
`attachOnly` OpenClaw розглядає порт loopback як локальний профіль браузера,
керований OpenClaw, і може повідомити, що порт використовується, але не належить OpenClaw.

## Провайдери прямого WebSocket CDP

Деякі хостингові сервіси браузерів надають **прямий endpoint WebSocket** замість
стандартного виявлення CDP на основі HTTP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію з’єднання:

- **Виявлення HTTP(S)** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL відлагоджувача WebSocket, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі endpoint WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається безпосередньо через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку намагається виконати HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на корені. Якщо оголошений
  endpoint WebSocket відхиляє рукостискання CDP, але налаштований корінь без шляху
  його приймає, OpenClaw також переходить до цього кореня. Це дає змогу голому `ws://`,
  спрямованому на локальний Chrome, усе одно підключатися, оскільки Chrome приймає оновлення
  WebSocket лише на конкретному шляху на ціль із `/json/version`, тоді як хостингові
  провайдери все ще можуть використовувати свій кореневий endpoint WebSocket, коли їхній endpoint виявлення
  оголошує короткоживучий URL, непридатний для Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) — це хмарна платформа для запуску
headless-браузерів із вбудованим розв’язанням CAPTCHA, stealth mode і residential
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
- Browserbase автоматично створює сесію браузера під час підключення WebSocket, тож
  крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну браузерну годину на місяць.
  Див. [pricing](https://www.browserbase.com/pricing) щодо обмежень платних тарифів.
- Див. [документацію Browserbase](https://docs.browserbase.com) для повного
  довідника API, посібників SDK та прикладів інтеграції.

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або pairинг вузла.
- Окремий loopback HTTP API браузера використовує **лише автентифікацію спільним секретом**:
  bearer auth токена gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентифікації Tailscale Serve і `gateway.auth.mode: "trusted-proxy"` **не**
  автентифікують цей окремий loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode`
  уже має значення `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічного доступу.
- Розглядайте URL/токени віддаленого CDP як секрети; віддавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості віддавайте перевагу зашифрованим endpoint (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: виділений екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium працює в іншому місці)
- **наявна сесія**: ваш наявний профіль Chrome через автопідключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо відсутній.
- Профіль `user` вбудований для приєднання existing-session через Chrome MCP.
- Профілі existing-session, крім `user`, вмикаються явно; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до Кошика.

Усі endpoint керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може приєднуватися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні довідкові матеріали та посилання з налаштування:

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
3. Тримайте браузер запущеним і схваліть запит на підключення, коли OpenClaw приєднається.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Live attach smoke-тест:

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
- `snapshot` повертає refs із вибраної live-вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на приєднання, і ви його схвалили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але не може
  увімкнути для вас віддалене налагодження з боку браузера

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний профіль existing-session, передавайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером, щоб схвалити
  запит на приєднання.
- Gateway або хост Node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях є ризикованішим, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії всередині вашої сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього драйвера; він лише приєднується.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, його буде передано далі для націлювання на цей каталог даних користувача.
- Existing-session може приєднуватися на вибраному хості або через підключений
  вузол браузера. Якщо Chrome розташований деінде і вузол браузера не підключено, використовуйте
  віддалений CDP або хост Node.

### Власний запуск Chrome MCP

Перевизначте запущений сервер Chrome DevTools MCP для кожного профілю, коли типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
закріплені версії, вендоровані бінарні файли):

| Поле        | Що воно робить                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який слід запускати замість `npx`. Визначається як є; абсолютні шляхи підтримуються.                    |
| `mcpArgs`    | Масив аргументів, який передається дослівно в `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли на профілі existing-session задано `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає endpoint у Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (HTTP endpoint виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий WebSocket CDP).

Прапорці endpoint і `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP приєднується до
запущеного браузера за endpoint, а не відкриває каталог
профілю.

<Accordion title="Обмеження можливостей existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Знімки екрана** — працюють захоплення сторінки та захоплення елементів через `--ref`; селектори CSS `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для знімків екрана сторінки або елемента на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують snapshot refs (без селекторів CSS). `click-coords` натискає видимі координати viewport і не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / upload / dialog** — `wait --url` підтримує точні, підрядкові та glob-патерни; `wait --load networkidle` не підтримується. Hooks завантаження потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Hooks dialog не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Виділений каталог даних користувача**: ніколи не торкається профілю вашого особистого браузера.
- **Виділені порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, потім
  стабільні дескриптори `tabId`, як-от `t1`, необов’язкові labels і сирий `targetId`.
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

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для скриптів і налагодження Gateway надає невеликий **HTTP API керування лише через loopback**
разом із відповідним CLI `openclaw browser` (snapshot, refs, посилення wait,
вивід JSON, робочі процеси налагодження). Повний довідник див. у
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій із розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Збій запуску CDP проти SSRF-блокування навігації

Це різні класи збоїв, і вони вказують на різні шляхи коду.

- **Збій запуску або готовності CDP** означає, що OpenClaw не може підтвердити справність площини керування браузером.
- **SSRF-блокування навігації** означає, що площина керування браузером справна, але ціль навігації сторінки відхилено політикою.

Поширені приклади:

- Збій запуску або готовності CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, коли
    зовнішній сервіс CDP на loopback налаштовано без `attachOnly: true`
- SSRF-блокування навігації:
  - потоки `open`, `navigate`, snapshot або відкриття вкладок завершуються з помилкою політики браузера/мережі, тоді як `start` і `tabs` усе ще працюють

Використовуйте цю мінімальну послідовність, щоб розрізнити ці два випадки:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Як читати результати:

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблему готовності CDP.
- Якщо `start` успішний, але `tabs` не працює, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` не працює, площина керування браузером уже запущена, а збій пов’язаний із політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Конфігурація браузера типово використовує fail-closed об’єкт політики SSRF, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` на loopback перевірки справності CDP навмисно пропускають перевірку досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації є окремим. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Вказівки щодо безпеки:

- **Не** послаблюйте типову політику SSRF браузера.
- Віддавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і пройшов перевірку.

## Інструменти агента та принцип роботи керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це зіставляється:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує ID `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (ціла сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де розташований браузер.
  - У sandboxed-сесіях `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не задано: sandboxed-сесії типово використовують `sandbox`, несandbox-сесії типово використовують `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизуватися до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це зберігає детермінованість агента та дає змогу уникати крихких селекторів.

## Пов’язані матеріали

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція](/uk/gateway/sandboxing) — керування браузером в ізольованих середовищах
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
