---
read_when:
    - Додавання автоматизації браузера, керованої агентом
    - Налагодження причин, через які openclaw заважає вашому власному Chrome
    - Реалізація налаштувань браузера + життєвого циклу в застосунку macOS
summary: Інтегрований сервіс керування браузером + команди дій
title: Браузер (керований OpenClaw)
x-i18n:
    generated_at: "2026-04-25T19:09:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e6ac9318b8051e7890671544376dbfeba97b3f9617ace9f2cdbbf70c6da6e7c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw може запускати **окремий профіль Chrome/Brave/Edge/Chromium**, яким керує агент.
Він ізольований від вашого особистого браузера й керується через невеликий локальний
сервіс керування всередині Gateway (лише loopback).

Пояснення для початківців:

- Сприймайте це як **окремий браузер лише для агента**.
- Профіль `openclaw` **не** торкається профілю вашого особистого браузера.
- Агент може **відкривати вкладки, читати сторінки, натискати й вводити текст** у безпечному середовищі.
- Вбудований профіль `user` підключається до вашої справжньої сесії Chrome, у якій ви вже виконали вхід, через Chrome MCP.

## Що ви отримуєте

- Окремий профіль браузера з назвою **openclaw** (типово з помаранчевим акцентом).
- Детерміноване керування вкладками (список/відкрити/фокус/закрити).
- Дії агента (натискання/введення/перетягування/вибір), знімки стану, скриншоти, PDF.
- Вбудований Skill `browser-automation`, який навчає агентів циклу відновлення snapshot,
  stable-tab, stale-ref і manual-blocker, коли увімкнено Plugin браузера.
- Необов’язкова підтримка кількох профілів (`openclaw`, `work`, `remote`, ...).

Цей браузер **не** є вашим основним для щоденного використання. Це безпечна, ізольована поверхня для
автоматизації агентом і перевірки.

## Швидкий старт

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Якщо ви отримуєте “Browser disabled”, увімкніть його в конфігурації (див. нижче) і перезапустіть
Gateway.

Якщо `openclaw browser` повністю відсутній або агент каже, що інструмент браузера
недоступний, перейдіть до [Відсутня команда або інструмент браузера](/uk/tools/browser#missing-browser-command-or-tool).

## Керування Plugin

Типовий інструмент `browser` — це вбудований Plugin. Вимкніть його, щоб замінити іншим Plugin, який реєструє той самий інструмент з назвою `browser`:

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

Для типових значень потрібні і `plugins.entries.browser.enabled`, **і** `browser.enabled=true`. Якщо вимкнути лише Plugin, це прибере CLI `openclaw browser`, метод Gateway `browser.request`, інструмент агента та сервіс керування як єдине ціле; ваша конфігурація `browser.*` залишиться недоторканою для заміни.

Зміни конфігурації браузера потребують перезапуску Gateway, щоб Plugin міг повторно зареєструвати свій сервіс.

## Вказівки для агента

Примітка щодо профілю інструментів: `tools.profile: "coding"` включає `web_search` і
`web_fetch`, але не включає повний інструмент `browser`. Якщо агент або
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
Самого `tools.subagents.tools.allow: ["browser"]` недостатньо, тому що політика субагента
застосовується після фільтрації профілю.

Plugin браузера постачається з двома рівнями вказівок для агента:

- Опис інструмента `browser` містить компактний завжди активний контракт: обрати
  правильний профіль, зберігати refs у межах тієї самої вкладки, використовувати `tabId`/мітки для націлювання на вкладки та завантажувати Skill браузера для багатокрокової роботи.
- Вбудований Skill `browser-automation` містить довший робочий цикл:
  спочатку перевірити статус/вкладки, позначити вкладки завдання, зробити snapshot перед дією,
  повторно зробити snapshot після змін UI, один раз відновити stale refs і повідомляти про блокування входом/2FA/captcha або
  камерою/мікрофоном як про ручну дію, замість того щоб вгадувати.

Skills, вбудовані в Plugin, перелічуються серед доступних Skills агента, коли
Plugin увімкнено. Повні інструкції Skill завантажуються за потреби, тому звичайні
звернення не оплачують повну вартість токенів.

## Відсутня команда або інструмент браузера

Якщо `openclaw browser` невідомий після оновлення, відсутній `browser.request` або агент повідомляє, що інструмент браузера недоступний, звичайною причиною є список `plugins.allow`, у якому немає `browser`. Додайте його:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` і `tools.alsoAllow: ["browser"]` не замінюють членство в списку allowlist — allowlist керує завантаженням Plugin, а політика інструментів застосовується лише після завантаження. Видалення `plugins.allow` повністю також відновлює типову поведінку.

## Профілі: `openclaw` проти `user`

- `openclaw`: керований, ізольований браузер (розширення не потрібне).
- `user`: вбудований профіль підключення Chrome MCP до вашої **справжньої сесії Chrome**
  з виконаним входом.

Для викликів інструмента браузера агентом:

- Типово: використовується ізольований браузер `openclaw`.
- Надавайте перевагу `profile="user"`, коли важливі наявні сесії з виконаним входом і користувач
  перебуває за комп’ютером, щоб натиснути/схвалити будь-який запит на підключення.
- `profile` — це явне перевизначення, коли ви хочете конкретний режим браузера.

Встановіть `browser.defaultProfile: "openclaw"`, якщо хочете, щоб керований режим був типовим.

## Конфігурація

Налаштування браузера зберігаються в `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // типово: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // вмикати лише для довіреного доступу до приватної мережі
      // allowPrivateNetwork: true, // застарілий псевдонім
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // застаріле перевизначення одного профілю
    remoteCdpTimeoutMs: 1500, // HTTP-тайм-аут віддаленого CDP (мс)
    remoteCdpHandshakeTimeoutMs: 3000, // тайм-аут рукостискання WebSocket віддаленого CDP (мс)
    localLaunchTimeoutMs: 15000, // тайм-аут виявлення локального керованого Chrome (мс)
    localCdpReadyTimeoutMs: 8000, // тайм-аут готовності локального керованого CDP після запуску (мс)
    actionTimeoutMs: 60000, // типовий тайм-аут дій браузера act (мс)
    tabCleanup: {
      enabled: true, // типово: true
      idleMinutes: 120, // встановіть 0, щоб вимкнути очищення неактивних вкладок
      maxTabsPerSession: 8, // встановіть 0, щоб вимкнути обмеження на сесію
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
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP. Якщо `cdpUrl` не вказано, типовим буде локальний керований порт CDP.
- `remoteCdpTimeoutMs` застосовується до перевірок HTTP-доступності віддаленого та `attachOnly` CDP, а також до HTTP-запитів на відкриття вкладок; `remoteCdpHandshakeTimeoutMs` застосовується до
  їхніх рукостискань CDP WebSocket.
- `localLaunchTimeoutMs` — це бюджет часу, за який локально запущений керований процес Chrome
  має відкрити свій кінцевий пункт CDP HTTP. `localCdpReadyTimeoutMs` — це
  наступний бюджет часу для готовності websocket CDP після виявлення процесу.
  Збільшуйте ці значення на Raspberry Pi, слабких VPS або старішому обладнанні, де Chromium
  запускається повільно. Значення мають бути додатними цілими числами до `120000` мс; некоректні
  значення конфігурації відхиляються.
- `actionTimeoutMs` — це типовий бюджет часу для запитів браузера `act`, коли викликач не передає `timeoutMs`. Клієнтський транспорт додає невелике додаткове вікно, щоб довгі очікування могли завершитися, а не завершувалися за тайм-аутом на межі HTTP.
- `tabCleanup` — це очищення за принципом best-effort для вкладок, відкритих основними сесіями браузера агента. Очищення життєвого циклу субагентів, Cron і ACP все одно закриває їхні явно відстежувані вкладки наприкінці сесії; основні сесії зберігають активні вкладки придатними до повторного використання, а потім закривають неактивні або зайві відстежувані вкладки у фоновому режимі.

</Accordion>

<Accordion title="Політика SSRF">

- Навігація браузера та open-tab захищені від SSRF перед навігацією, а потім повторно перевіряються в режимі best-effort за фінальним URL `http(s)`.
- У строгому режимі SSRF перевіряються також виявлення віддаленого кінцевого пункту CDP і probes `/json/version` (`cdpUrl`).
- Змінні середовища `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` і `NO_PROXY` для Gateway/provider не проксуюють автоматично браузер, керований OpenClaw. Керований Chrome типово запускається напряму, тому налаштування проксі provider не послаблюють перевірки SSRF браузера.
- Щоб проксіювати сам керований браузер, передайте явні прапорці проксі Chrome через `browser.extraArgs`, наприклад `--proxy-server=...` або `--proxy-pac-url=...`. Строгий режим SSRF блокує явну маршрутизацію браузерного проксі, якщо доступ браузера до приватної мережі не був навмисно ввімкнений.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` типово вимкнений; вмикайте лише тоді, коли доступ браузера до приватної мережі навмисно вважається довіреним.
- `browser.ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як застарілий псевдонім.

</Accordion>

<Accordion title="Поведінка профілів">

- `attachOnly: true` означає ніколи не запускати локальний браузер; лише підключатися, якщо він уже запущений.
- `headless` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають пріоритет над `browser.headless`, тому один локально запущений профіль може залишатися headless, тоді як інший — видимим.
- `POST /start?headless=true` і `openclaw browser start --headless` запитують
  одноразовий запуск у режимі headless для локальних керованих профілів без перезапису
  `browser.headless` або конфігурації профілю. Профілі existing-session, attach-only і
  remote CDP відхиляють це перевизначення, оскільки OpenClaw не запускає ці
  процеси браузера.
- На хостах Linux без `DISPLAY` або `WAYLAND_DISPLAY` локальні керовані профілі
  типово автоматично переходять у headless, якщо ні середовище, ні конфігурація профілю/глобальна
  конфігурація явно не обирають режим із вікном. `openclaw browser status --json`
  повідомляє `headlessSource` як `env`, `profile`, `config`,
  `request`, `linux-display-fallback` або `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` примусово вмикає headless для локальних керованих запусків у
  поточному процесі. `OPENCLAW_BROWSER_HEADLESS=0` примусово вмикає режим із вікном для звичайних
  запусків і повертає придатну до дії помилку на хостах Linux без сервера відображення;
  явний запит `start --headless` все одно має пріоритет для цього одного запуску.
- `executablePath` можна задавати глобально або для окремого локального керованого профілю. Значення для профілю мають пріоритет над `browser.executablePath`, тому різні керовані профілі можуть запускати різні браузери на базі Chromium. Обидві форми приймають `~` для домашнього каталогу вашої ОС.
- `color` (верхній рівень і для профілю) тонує UI браузера, щоб ви могли бачити, який профіль активний.
- Типовий профіль — `openclaw` (керований автономний). Використовуйте `defaultProfile: "user"`, щоб увімкнути браузер користувача з виконаним входом.
- Порядок автовизначення: системний типовий браузер, якщо він на базі Chromium; інакше Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` використовує Chrome DevTools MCP замість сирого CDP. Не встановлюйте `cdpUrl` для цього driver.
- Встановіть `browser.profiles.<name>.userDataDir`, якщо профіль existing-session має підключатися до нетипового профілю користувача Chromium (Brave, Edge тощо). Цей шлях також приймає `~` для домашнього каталогу вашої ОС.

</Accordion>

</AccordionGroup>

## Використання Brave (або іншого браузера на базі Chromium)

Якщо вашим **системним типовим** браузером є браузер на базі Chromium (Chrome/Brave/Edge тощо),
OpenClaw використовує його автоматично. Встановіть `browser.executablePath`, щоб перевизначити
автовизначення. Значення `executablePath` верхнього рівня та для профілів приймають `~`
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

`executablePath` для окремого профілю впливає лише на локальні керовані профілі, які запускає OpenClaw.
Профілі `existing-session` натомість підключаються до вже запущеного браузера,
а віддалені профілі CDP використовують браузер за `cdpUrl`.

## Локальне чи віддалене керування

- **Локальне керування (типово):** Gateway запускає loopback-сервіс керування і може запускати локальний браузер.
- **Віддалене керування (вузол node):** запустіть хост вузла на машині, де є браузер; Gateway проксіює до нього дії браузера.
- **Віддалений CDP:** задайте `browser.profiles.<name>.cdpUrl` (або `browser.cdpUrl`), щоб
  підключитися до віддаленого браузера на базі Chromium. У такому разі OpenClaw не запускатиме локальний браузер.
- Для зовнішньо керованих сервісів CDP на loopback (наприклад Browserless у
  Docker, опублікований на `127.0.0.1`), також задайте `attachOnly: true`. CDP на loopback
  без `attachOnly` розглядається як локальний профіль браузера, керований OpenClaw.
- `headless` впливає лише на локальні керовані профілі, які запускає OpenClaw. Він не перезапускає і не змінює браузери existing-session або віддалені CDP.
- `executablePath` підпорядковується тому самому правилу локального керованого профілю. Зміна його для
  запущеного локального керованого профілю позначає цей профіль для перезапуску/узгодження, щоб
  наступний запуск використав новий бінарний файл.

Поведінка зупинки відрізняється залежно від режиму профілю:

- локальні керовані профілі: `openclaw browser stop` зупиняє процес браузера, який
  запустив OpenClaw
- профілі attach-only і віддалені CDP: `openclaw browser stop` закриває активну
  сесію керування та звільняє перевизначення емуляції Playwright/CDP (viewport,
  колірну схему, локаль, часовий пояс, офлайн-режим та подібний стан), навіть
  якщо жоден процес браузера не був запущений OpenClaw

Віддалені URL CDP можуть містити автентифікацію:

- Query-токени (наприклад, `https://provider.example?token=<token>`)
- HTTP Basic auth (наприклад, `https://user:pass@provider.example`)

OpenClaw зберігає автентифікацію під час викликів кінцевих пунктів `/json/*` і під час підключення
до CDP WebSocket. Для токенів надавайте перевагу змінним середовища або менеджерам секретів,
а не збереженню їх у файлах конфігурації.

## Node browser proxy (типово без додаткової конфігурації)

Якщо ви запускаєте **хост вузла** на машині, де є ваш браузер, OpenClaw може
автоматично маршрутизувати виклики інструмента браузера до цього вузла без будь-якої додаткової конфігурації браузера.
Це типовий шлях для віддалених gateway.

Примітки:

- Хост вузла надає доступ до свого локального сервера керування браузером через **команду проксі**.
- Профілі походять із власної конфігурації вузла `browser.profiles` (так само, як локально).
- `nodeHost.browserProxy.allowProfiles` є необов’язковим. Залиште його порожнім для застарілої/типової поведінки: усі налаштовані профілі залишаються доступними через проксі, включно з маршрутами створення/видалення профілів.
- Якщо ви задаєте `nodeHost.browserProxy.allowProfiles`, OpenClaw сприймає це як межу мінімальних привілеїв: націлюватися можна лише на профілі зі списку дозволених, а маршрути створення/видалення постійних профілів блокуються на поверхні проксі.
- Вимкніть, якщо не хочете цього:
  - На вузлі: `nodeHost.browserProxy.enabled=false`
  - На gateway: `gateway.nodes.browser.mode="off"`

## Browserless (хостинговий віддалений CDP)

[Browserless](https://browserless.io) — це хостинговий сервіс Chromium, який надає
URL підключення CDP через HTTPS і WebSocket. OpenClaw може використовувати будь-яку з цих форм, але
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
- Виберіть регіональний кінцевий пункт, який відповідає вашому обліковому запису Browserless (див. їхню документацію).
- Якщо Browserless надає вам базовий URL HTTPS, ви можете або перетворити його на
  `wss://` для прямого підключення CDP, або залишити URL HTTPS і дозволити OpenClaw
  виявити `/json/version`.

### Browserless Docker на тому самому хості

Коли Browserless розміщено самостійно в Docker, а OpenClaw працює на хості, розглядайте
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
OpenClaw. Browserless також має оголошувати відповідний досяжний кінцевий пункт;
задайте для Browserless `EXTERNAL` рівним тій самій базі WebSocket, публічній для OpenClaw, наприклад
`ws://127.0.0.1:3000`, `ws://browserless:3000` або стабільній приватній адресі мережі Docker.
Якщо `/json/version` повертає `webSocketDebuggerUrl`, що вказує на адресу, якої OpenClaw не може досягти,
HTTP CDP може виглядати справним, тоді як підключення WebSocket все одно не вдасться.

Не залишайте `attachOnly` незаданим для профілю Browserless на loopback. Без
`attachOnly` OpenClaw розглядає порт loopback як локальний керований профіль браузера
і може повідомити, що порт використовується, але не належить OpenClaw.

## Прямі провайдери WebSocket CDP

Деякі хостингові сервіси браузера надають **прямий кінцевий пункт WebSocket**, а не
стандартне HTTP-виявлення CDP (`/json/version`). OpenClaw приймає три
форми URL CDP і автоматично вибирає правильну стратегію підключення:

- **HTTP(S)-виявлення** — `http://host[:port]` або `https://host[:port]`.
  OpenClaw викликає `/json/version`, щоб виявити URL WebSocket debugger, а потім
  підключається. Резервного переходу на WebSocket немає.
- **Прямі кінцеві пункти WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` або
  `wss://...` зі шляхом `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw підключається напряму через рукостискання WebSocket і повністю пропускає
  `/json/version`.
- **Кореневі WebSocket без шляху** — `ws://host[:port]` або `wss://host[:port]` без
  шляху `/devtools/...` (наприклад [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw спочатку пробує HTTP-виявлення
  `/json/version` (нормалізуючи схему до `http`/`https`);
  якщо виявлення повертає `webSocketDebuggerUrl`, він використовується, інакше OpenClaw
  переходить до прямого рукостискання WebSocket на корені. Якщо оголошений
  кінцевий пункт WebSocket відхиляє рукостискання CDP, але налаштований кореневий URL
  його приймає, OpenClaw також повертається до цього кореня. Це дає змогу простому `ws://`,
  що вказує на локальний Chrome, усе ж підключитися, оскільки Chrome приймає оновлення WebSocket
  лише на конкретному шляху до цілі з `/json/version`, тоді як хостингові
  провайдери все одно можуть використовувати свій кореневий кінцевий пункт WebSocket, коли їхній кінцевий пункт виявлення
  оголошує короткоживучий URL, який не підходить для Playwright CDP.

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
  окремий крок ручного створення сесії не потрібен.
- Безкоштовний тариф дозволяє одну одночасну сесію та одну браузерну годину на місяць.
  Обмеження платних тарифів дивіться в [цінах](https://www.browserbase.com/pricing).
- Повний довідник API,
  посібники SDK та приклади інтеграції дивіться в [документації Browserbase](https://docs.browserbase.com).

## Безпека

Ключові ідеї:

- Керування браузером доступне лише через loopback; доступ проходить через автентифікацію Gateway або спарювання вузлів.
- Автономний loopback HTTP API браузера використовує **лише автентифікацію зі спільним секретом**:
  bearer auth через токен gateway, `x-openclaw-password` або HTTP Basic auth із
  налаштованим паролем gateway.
- Заголовки ідентичності Tailscale Serve і `gateway.auth.mode: "trusted-proxy"`
  **не** автентифікують цей автономний loopback API браузера.
- Якщо керування браузером увімкнено і не налаштовано жодної автентифікації зі спільним секретом, OpenClaw
  автоматично генерує `gateway.auth.token` під час запуску й зберігає його в конфігурації.
- OpenClaw **не** генерує цей токен автоматично, коли `gateway.auth.mode` уже має значення
  `password`, `none` або `trusted-proxy`.
- Тримайте Gateway і будь-які хости вузлів у приватній мережі (Tailscale); уникайте публічної доступності.
- Розглядайте URL/токени віддаленого CDP як секрети; надавайте перевагу змінним середовища або менеджеру секретів.

Поради щодо віддаленого CDP:

- За можливості надавайте перевагу зашифрованим кінцевим пунктам (HTTPS або WSS) і короткоживучим токенам.
- Уникайте вбудовування довгоживучих токенів безпосередньо у файли конфігурації.

## Профілі (кілька браузерів)

OpenClaw підтримує кілька іменованих профілів (конфігурацій маршрутизації). Профілі можуть бути:

- **керовані OpenClaw**: окремий екземпляр браузера на базі Chromium із власним каталогом даних користувача + портом CDP
- **віддалені**: явний URL CDP (браузер на базі Chromium, що працює в іншому місці)
- **наявна сесія**: ваш наявний профіль Chrome через автоматичне підключення Chrome DevTools MCP

Типові значення:

- Профіль `openclaw` створюється автоматично, якщо його немає.
- Профіль `user` є вбудованим для підключення existing-session через Chrome MCP.
- Профілі existing-session є opt-in окрім `user`; створюйте їх за допомогою `--driver existing-session`.
- Локальні порти CDP типово виділяються з діапазону **18800–18899**.
- Видалення профілю переміщує його локальний каталог даних до кошика.

Усі кінцеві пункти керування приймають `?profile=<name>`; CLI використовує `--browser-profile`.

## Наявна сесія через Chrome DevTools MCP

OpenClaw також може підключатися до запущеного профілю браузера на базі Chromium через
офіційний сервер Chrome DevTools MCP. Це повторно використовує вкладки та стан входу,
які вже відкриті в цьому профілі браузера.

Офіційні матеріали та посилання на налаштування:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Вбудований профіль:

- `user`

Необов’язково: створіть власний профіль existing-session, якщо вам потрібна
інша назва, колір або каталог даних браузера.

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
3. Залиште браузер запущеним і підтвердьте запит на підключення, коли OpenClaw підключатиметься.

Поширені сторінки inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Тестове smoke-підключення в реальному часі:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Ознаки успіху:

- `status` показує `driver: existing-session`
- `status` показує `transport: chrome-mcp`
- `status` показує `running: true`
- `tabs` перелічує вже відкриті вкладки вашого браузера
- `snapshot` повертає refs з вибраної активної вкладки

Що перевірити, якщо підключення не працює:

- цільовий браузер на базі Chromium має версію `144+`
- у сторінці inspect цього браузера ввімкнено віддалене налагодження
- браузер показав запит на згоду для підключення, і ви його підтвердили
- `openclaw doctor` мігрує стару конфігурацію браузера на основі розширення та перевіряє,
  що Chrome локально встановлено для типових профілів автопідключення, але він не може
  увімкнути віддалене налагодження на боці браузера за вас

Використання агентом:

- Використовуйте `profile="user"`, коли потрібен стан браузера користувача з виконаним входом.
- Якщо ви використовуєте власний профіль existing-session, передайте явну назву цього профілю.
- Обирайте цей режим лише тоді, коли користувач перебуває за комп’ютером і може підтвердити запит
  на підключення.
- Gateway або хост node може запускати `npx chrome-devtools-mcp@latest --autoConnect`

Примітки:

- Цей шлях має вищий ризик, ніж ізольований профіль `openclaw`, оскільки він може
  виконувати дії у вашій сесії браузера з виконаним входом.
- OpenClaw не запускає браузер для цього driver; він лише підключається.
- Тут OpenClaw використовує офіційний потік Chrome DevTools MCP `--autoConnect`. Якщо
  задано `userDataDir`, він передається далі для націлювання на цей каталог даних користувача.
- Existing-session може підключатися на вибраному хості або через підключений
  browser node. Якщо Chrome знаходиться в іншому місці й жоден browser node не підключений, використовуйте
  віддалений CDP або хост node.

### Власний запуск Chrome MCP

Перевизначте сервер Chrome DevTools MCP, який запускається для профілю, якщо типовий
потік `npx chrome-devtools-mcp@latest` вам не підходить (офлайн-хости,
зафіксовані версії, вендорні бінарні файли):

| Поле        | Що воно робить                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Виконуваний файл, який слід запускати замість `npx`. Визначається як є; абсолютні шляхи підтримуються.                                          |
| `mcpArgs`    | Масив аргументів, який передається дослівно до `mcpCommand`. Замінює типові аргументи `chrome-devtools-mcp@latest --autoConnect`. |

Коли на профілі existing-session задано `cdpUrl`, OpenClaw пропускає
`--autoConnect` і автоматично передає кінцевий пункт до Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (кінцевий пункт HTTP-виявлення DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (прямий CDP WebSocket).

Прапорці кінцевого пункту та `userDataDir` не можна поєднувати: коли задано `cdpUrl`,
`userDataDir` ігнорується для запуску Chrome MCP, оскільки Chrome MCP підключається до
вже запущеного браузера за цим кінцевим пунктом, а не відкриває каталог
профілю.

<Accordion title="Обмеження функцій existing-session">

Порівняно з керованим профілем `openclaw`, драйвери existing-session мають більше обмежень:

- **Скриншоти** — працюють захоплення сторінки та захоплення елементів через `--ref`; CSS-селектори `--element` не підтримуються. `--full-page` не можна поєднувати з `--ref` або `--element`. Для скриншотів сторінки чи елементів на основі ref Playwright не потрібен.
- **Дії** — `click`, `type`, `hover`, `scrollIntoView`, `drag` і `select` потребують refs зі snapshot (без CSS-селекторів). `click-coords` натискає за координатами видимої області перегляду й не потребує snapshot ref. `click` підтримує лише ліву кнопку миші. `type` не підтримує `slowly=true`; використовуйте `fill` або `press`. `press` не підтримує `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` і `evaluate` не підтримують тайм-аути для окремих викликів. `select` приймає одне значення.
- **Очікування / завантаження / діалог** — `wait --url` підтримує точні, часткові та glob-шаблони; `wait --load networkidle` не підтримується. Хуки завантаження файлів потребують `ref` або `inputRef`, по одному файлу за раз, без CSS `element`. Хуки діалогів не підтримують перевизначення тайм-ауту.
- **Функції лише для керованого режиму** — пакетні дії, експорт PDF, перехоплення завантажень і `responsebody` усе ще потребують шляху керованого браузера.

</Accordion>

## Гарантії ізоляції

- **Окремий каталог даних користувача**: ніколи не торкається профілю вашого особистого браузера.
- **Окремі порти**: уникає `9222`, щоб запобігти конфліктам із робочими процесами розробки.
- **Детерміноване керування вкладками**: `tabs` спочатку повертає `suggestedTargetId`, а потім
  стабільні дескриптори `tabId`, такі як `t1`, необов’язкові мітки та сирий `targetId`.
  Агенти мають повторно використовувати `suggestedTargetId`; сирі id залишаються доступними для
  налагодження та сумісності.

## Вибір браузера

Під час локального запуску OpenClaw вибирає перший доступний:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Ви можете перевизначити вибір за допомогою `browser.executablePath`.

Платформи:

- macOS: перевіряє `/Applications` і `~/Applications`.
- Linux: перевіряє поширені розташування Chrome/Brave/Edge/Chromium у `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` і
  `/usr/lib/chromium-browser`.
- Windows: перевіряє поширені місця встановлення.

## API керування (необов’язково)

Для сценаріїв і налагодження Gateway надає невеликий **HTTP API керування
лише через loopback**, а також відповідний CLI `openclaw browser` (snapshots, refs, посилені можливості wait,
вивід JSON, робочі процеси налагодження). Повну довідку дивіться в
[API керування браузером](/uk/tools/browser-control).

## Усунення несправностей

Для проблем, специфічних для Linux (особливо snap Chromium), див.
[Усунення несправностей браузера](/uk/tools/browser-linux-troubleshooting).

Для конфігурацій з розділеними хостами WSL2 Gateway + Windows Chrome див.
[Усунення несправностей WSL2 + Windows + remote Chrome CDP](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Помилка запуску CDP проти SSRF-блокування навігації

Це різні класи помилок, і вони вказують на різні шляхи коду.

- **Помилка запуску або готовності CDP** означає, що OpenClaw не може підтвердити, що площина керування браузером справна.
- **SSRF-блокування навігації** означає, що площина керування браузером справна, але ціль переходу сторінки відхиляється політикою.

Поширені приклади:

- Помилка запуску або готовності CDP:
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

- Якщо `start` завершується помилкою `not reachable after start`, спочатку усувайте проблеми з готовністю CDP.
- Якщо `start` успішний, але `tabs` завершується помилкою, площина керування все ще несправна. Розглядайте це як проблему досяжності CDP, а не проблему навігації сторінки.
- Якщо `start` і `tabs` успішні, але `open` або `navigate` завершується помилкою, площина керування браузером працює, а помилка пов’язана з політикою навігації або цільовою сторінкою.
- Якщо `start`, `tabs` і `open` усі успішні, базовий шлях керування керованим браузером справний.

Важливі деталі поведінки:

- Типова конфігурація браузера використовує об’єкт політики SSRF у режимі fail-closed, навіть якщо ви не налаштовуєте `browser.ssrfPolicy`.
- Для локального керованого профілю `openclaw` на loopback перевірки справності CDP навмисно пропускають застосування перевірки досяжності SSRF браузера для власної локальної площини керування OpenClaw.
- Захист навігації відокремлений. Успішний результат `start` або `tabs` не означає, що пізніша ціль `open` або `navigate` буде дозволена.

Рекомендації щодо безпеки:

- **Не** послаблюйте політику SSRF браузера типово.
- Надавайте перевагу вузьким виняткам для хостів, таким як `hostnameAllowlist` або `allowedHostnames`, замість широкого доступу до приватної мережі.
- Використовуйте `dangerouslyAllowPrivateNetwork: true` лише в навмисно довірених середовищах, де доступ браузера до приватної мережі потрібен і перевірений.

## Інструменти агента + як працює керування

Агент отримує **один інструмент** для автоматизації браузера:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Як це відображається:

- `browser snapshot` повертає стабільне дерево UI (AI або ARIA).
- `browser act` використовує id `ref` зі snapshot для click/type/drag/select.
- `browser screenshot` захоплює пікселі (повна сторінка, елемент або позначені refs).
- `browser doctor` перевіряє готовність Gateway, Plugin, профілю, браузера та вкладок.
- `browser` приймає:
  - `profile` для вибору іменованого профілю браузера (openclaw, chrome або віддалений CDP).
  - `target` (`sandbox` | `host` | `node`) для вибору місця, де знаходиться браузер.
  - У сесіях із sandbox `target: "host"` потребує `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Якщо `target` не вказано: у sandbox-сесіях типовим є `sandbox`, у сесіях без sandbox — `host`.
  - Якщо підключено вузол із підтримкою браузера, інструмент може автоматично маршрутизувати виклики до нього, якщо ви не зафіксуєте `target="host"` або `target="node"`.

Це робить роботу агента детермінованою та допомагає уникати крихких селекторів.

## Пов’язане

- [Огляд інструментів](/uk/tools) — усі доступні інструменти агента
- [Ізоляція sandbox](/uk/gateway/sandboxing) — керування браузером у середовищах із sandbox
- [Безпека](/uk/gateway/security) — ризики керування браузером і посилення захисту
