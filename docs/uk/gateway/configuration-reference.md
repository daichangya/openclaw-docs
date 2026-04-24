---
read_when:
    - Вам потрібні точні семантики полів конфігурації або типові значення
    - Ви перевіряєте блоки конфігурації каналу, моделі, Gateway або інструмента
summary: Довідник конфігурації Gateway для основних ключів OpenClaw, типових значень і посилань на окремі довідники підсистем
title: Довідник конфігурації
x-i18n:
    generated_at: "2026-04-24T03:44:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dc3b920ada38951086908713e9347141d8b11faa007df23a90a2532ac6f3bb2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Основний довідник конфігурації для `~/.openclaw/openclaw.json`. Для огляду, орієнтованого на завдання, див. [Конфігурація](/uk/gateway/configuration).

Ця сторінка охоплює основні поверхні конфігурації OpenClaw і містить посилання назовні, коли підсистема має власний, глибший довідник. Вона **не** намагається вбудувати на одній сторінці кожен каталог команд, що належить каналу/Plugin, або кожен глибокий параметр пам’яті/QMD.

Джерело істини в коді:

- `openclaw config schema` виводить актуальну JSON Schema, яка використовується для валідації й UI керування, з об’єднаними метаданими bundled/Plugin/channel, якщо вони доступні
- `config.schema.lookup` повертає один вузол схеми з областю шляху для інструментів деталізації
- `pnpm config:docs:check` / `pnpm config:docs:gen` перевіряють хеш базової лінії документації конфігурації щодо поточної поверхні схеми

Окремі глибокі довідники:

- [Довідник конфігурації пам’яті](/uk/reference/memory-config) для `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` і конфігурації dreaming у `plugins.entries.memory-core.config.dreaming`
- [Слеш-команди](/uk/tools/slash-commands) для поточного вбудованого + bundled каталогу команд
- сторінки каналу/Plugin-власника для поверхонь команд, специфічних для каналу

Формат конфігурації — **JSON5** (дозволені коментарі + кінцеві коми). Усі поля необов’язкові — OpenClaw використовує безпечні типові значення, якщо їх пропущено.

---

## Канали

Ключі конфігурації для кожного каналу перенесено на окрему сторінку — див.
[Конфігурація — канали](/uk/gateway/config-channels) для `channels.*`,
включно зі Slack, Discord, Telegram, WhatsApp, Matrix, iMessage та іншими
bundled каналами (автентифікація, контроль доступу, багатообліковість, обмеження за згадками).

## Типові значення агента, багатоагентність, сесії та повідомлення

Перенесено на окрему сторінку — див.
[Конфігурація — агенти](/uk/gateway/config-agents) для:

- `agents.defaults.*` (робочий простір, модель, thinking, Heartbeat, пам’ять, медіа, Skills, sandbox)
- `multiAgent.*` (багатоагентна маршрутизація та bindings)
- `session.*` (життєвий цикл сесії, Compaction, обрізання)
- `messages.*` (доставка повідомлень, TTS, рендеринг markdown)
- `talk.*` (режим Talk)
  - `talk.silenceTimeoutMs`: якщо не задано, Talk зберігає типове для платформи вікно паузи перед надсиланням транскрипту (`700 ms на macOS і Android, 900 ms на iOS`)

## Інструменти та користувацькі провайдери

Політика інструментів, експериментальні перемикачі, конфігурація інструментів із підтримкою провайдерів і налаштування
користувацьких провайдерів / base-URL перенесені на окрему сторінку — див.
[Конфігурація — інструменти та користувацькі провайдери](/uk/gateway/config-tools).

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: необов’язковий allowlist лише для bundled Skills (керовані/workspace Skills не зачіпаються).
- `load.extraDirs`: додаткові спільні корені Skills (найнижчий пріоритет).
- `install.preferBrew`: якщо true, надавати перевагу інсталяторам Homebrew, коли `brew`
  доступний, перш ніж переходити до інших типів інсталяторів.
- `install.nodeManager`: пріоритет node-інсталятора для специфікацій `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` вимикає Skill, навіть якщо він bundled/встановлений.
- `entries.<skillKey>.apiKey`: зручне поле для Skills, які оголошують основну env-змінну (рядок відкритим текстом або об’єкт SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Завантажуються з `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, а також `plugins.load.paths`.
- Виявлення приймає нативні Plugins OpenClaw, а також сумісні пакети Codex і Claude, включно з пакетами Claude типового макета без маніфесту.
- **Зміни конфігурації потребують перезапуску Gateway.**
- `allow`: необов’язковий allowlist (завантажуються лише перелічені Plugins). `deny` має пріоритет.
- `plugins.entries.<id>.apiKey`: зручне поле API-ключа на рівні Plugin (коли підтримується Plugin).
- `plugins.entries.<id>.env`: карта env-змінних у межах Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: коли `false`, ядро блокує `before_prompt_build` та ігнорує поля legacy `before_agent_start`, що змінюють prompt, зберігаючи legacy `modelOverride` і `providerOverride`. Застосовується до нативних hooks Plugin і підтримуваних каталогів hooks, наданих пакетом.
- `plugins.entries.<id>.subagent.allowModelOverride`: явно довіряти цьому Plugin запитувати перевизначення `provider` і `model` для окремих запусків фонових субагентів.
- `plugins.entries.<id>.subagent.allowedModels`: необов’язковий allowlist канонічних цілей `provider/model` для довірених перевизначень субагента. Використовуйте `"*"`, лише якщо навмисно хочете дозволити будь-яку модель.
- `plugins.entries.<id>.config`: об’єкт конфігурації, визначений Plugin (перевіряється за схемою нативного Plugin OpenClaw, якщо вона доступна).
- `plugins.entries.firecrawl.config.webFetch`: параметри провайдера web-fetch Firecrawl.
  - `apiKey`: API-ключ Firecrawl (приймає SecretRef). Використовує резервне значення з `plugins.entries.firecrawl.config.webSearch.apiKey`, legacy `tools.web.fetch.firecrawl.apiKey` або env-змінної `FIRECRAWL_API_KEY`.
  - `baseUrl`: базова URL-адреса API Firecrawl (типово: `https://api.firecrawl.dev`).
  - `onlyMainContent`: витягувати лише основний вміст зі сторінок (типово: `true`).
  - `maxAgeMs`: максимальний вік кешу в мілісекундах (типово: `172800000` / 2 дні).
  - `timeoutSeconds`: тайм-аут запиту scrape у секундах (типово: `60`).
- `plugins.entries.xai.config.xSearch`: параметри xAI X Search (вебпошук Grok).
  - `enabled`: увімкнути провайдер X Search.
  - `model`: модель Grok для пошуку (наприклад, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: параметри dreaming пам’яті. Див. [Dreaming](/uk/concepts/dreaming) для фаз і порогів.
  - `enabled`: головний перемикач dreaming (типово `false`).
  - `frequency`: Cron-розклад для кожного повного циклу dreaming (типово `"0 3 * * *"`).
  - політика фаз і пороги є деталями реалізації (не ключами конфігурації для користувача).
- Повна конфігурація пам’яті міститься в [Довіднику конфігурації пам’яті](/uk/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Увімкнені Claude bundle Plugins також можуть додавати вбудовані типові значення Pi з `settings.json`; OpenClaw застосовує їх як очищені налаштування агента, а не як сирі патчі конфігурації OpenClaw.
- `plugins.slots.memory`: вибрати id активного Plugin пам’яті або `"none"`, щоб вимкнути Plugins пам’яті.
- `plugins.slots.contextEngine`: вибрати id активного Plugin механізму контексту; типово `"legacy"`, якщо ви не встановите й не виберете інший механізм.
- `plugins.installs`: метадані інсталяцій, керовані CLI, які використовує `openclaw plugins update`.
  - Містять `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Розглядайте `plugins.installs.*` як керований стан; надавайте перевагу командам CLI, а не ручному редагуванню.

Див. [Plugins](/uk/tools/plugin).

---

## Браузер

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` вимикає `act:evaluate` і `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` вимкнено, якщо не задано, тому браузерна навігація типово залишається суворою.
- Установлюйте `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` лише тоді, коли ви свідомо довіряєте браузерній навігації в приватній мережі.
- У суворому режимі віддалені кінцеві точки профілю CDP (`profiles.*.cdpUrl`) підпадають під те саме блокування приватної мережі під час перевірок доступності/виявлення.
- `ssrfPolicy.allowPrivateNetwork` залишається підтримуваним як legacy-псевдонім.
- У суворому режимі використовуйте `ssrfPolicy.hostnameAllowlist` і `ssrfPolicy.allowedHostnames` для явних винятків.
- Віддалені профілі працюють лише в режимі attach-only (start/stop/reset вимкнені).
- `profiles.*.cdpUrl` приймає `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S), коли хочете, щоб OpenClaw виявив `/json/version`; використовуйте WS(S),
  коли ваш провайдер надає пряму URL-адресу DevTools WebSocket.
- Профілі `existing-session` використовують Chrome MCP замість CDP і можуть підключатися на
  вибраному хості або через підключений браузерний Node.
- Профілі `existing-session` можуть задавати `userDataDir`, щоб націлитися на конкретний
  профіль браузера на основі Chromium, наприклад Brave або Edge.
- Профілі `existing-session` зберігають поточні обмеження маршруту Chrome MCP:
  дії на основі snapshot/ref замість націлення на CSS-selector, hooks
  завантаження одного файла, відсутність перевизначення тайм-ауту діалогів, відсутність `wait --load networkidle`, а також
  `responsebody`, експорту PDF, перехоплення завантажень або пакетних дій.
- Локальні керовані профілі `openclaw` автоматично призначають `cdpPort` і `cdpUrl`; явно
  задавайте `cdpUrl` лише для віддаленого CDP.
- Порядок автовиявлення: типовий браузер, якщо він на основі Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Сервіс керування: лише local loopback (порт похідний від `gateway.port`, типово `18791`).
- `extraArgs` додає додаткові launch-прапорці до локального запуску Chromium (наприклад,
  `--disable-gpu`, розмір вікна або налагоджувальні прапорці).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: акцентний колір для chrome нативного UI застосунку (відтінок бульбашки режиму Talk тощо).
- `assistant`: перевизначення ідентичності UI керування. Використовує резервне значення з ідентичності активного агента.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Необов’язково. Типове значення false.
    allowRealIpFallback: false,
    tools: {
      // Додаткові HTTP deny для /tools/invoke
      deny: ["browser"],
      // Видалити інструменти з типового HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Деталі полів Gateway">

- `mode`: `local` (запустити Gateway) або `remote` (підключитися до віддаленого Gateway). Gateway відмовиться запускатися, якщо не `local`.
- `port`: єдиний мультиплексований порт для WS + HTTP. Пріоритет: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (типово), `lan` (`0.0.0.0`), `tailnet` (лише IP Tailscale) або `custom`.
- **Застарілі псевдоніми bind**: використовуйте значення режиму bind у `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), а не псевдоніми хостів (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Примітка щодо Docker**: типовий bind `loopback` слухає на `127.0.0.1` усередині контейнера. За мережевої конфігурації Docker bridge (`-p 18789:18789`) трафік надходить на `eth0`, тому Gateway недосяжний. Використовуйте `--network host` або встановіть `bind: "lan"` (або `bind: "custom"` з `customBindHost: "0.0.0.0"`), щоб слухати на всіх інтерфейсах.
- **Автентифікація**: типово обов’язкова. Bind-и, відмінні від loopback, потребують автентифікації Gateway. На практиці це означає спільний token/password або reverse proxy з урахуванням ідентичності з `gateway.auth.mode: "trusted-proxy"`. Майстер початкового налаштування типово генерує token.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password` (включно з SecretRef), явно задайте `gateway.auth.mode` як `token` або `password`. Під час запуску та в потоках встановлення/відновлення служби буде помилка, якщо налаштовано обидва, а режим не задано.
- `gateway.auth.mode: "none"`: явний режим без автентифікації. Використовуйте лише для довірених налаштувань local loopback; цей варіант навмисно не пропонується під час початкового налаштування.
- `gateway.auth.mode: "trusted-proxy"`: делегувати автентифікацію reverse proxy з урахуванням ідентичності й довіряти заголовкам ідентичності від `gateway.trustedProxies` (див. [Автентифікація через Trusted Proxy](/uk/gateway/trusted-proxy-auth)). Цей режим очікує **не-loopback** джерело proxy; reverse proxy loopback на тому самому хості не задовольняють автентифікацію trusted-proxy.
- `gateway.auth.allowTailscale`: коли `true`, заголовки ідентичності Tailscale Serve можуть задовольняти автентифікацію UI керування/WebSocket (перевіряється через `tailscale whois`). Кінцеві точки HTTP API **не** використовують цю автентифікацію заголовком Tailscale; натомість вони дотримуються звичайного режиму HTTP-автентифікації Gateway. Цей потік без token припускає, що хост Gateway є довіреним. Типове значення — `true`, коли `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: необов’язковий лімітатор невдалих спроб автентифікації. Застосовується для кожного IP клієнта й для кожної області автентифікації (спільний секрет і token пристрою відстежуються незалежно). Заблоковані спроби повертають `429` + `Retry-After`.
  - У асинхронному шляху UI керування Tailscale Serve невдалі спроби для того самого `{scope, clientIp}` серіалізуються перед записом невдачі. Тому паралельні хибні спроби від одного клієнта можуть активувати лімітатор уже на другому запиті, а не пройти обидві як звичайні невідповідності.
  - `gateway.auth.rateLimit.exemptLoopback` типово має значення `true`; установіть `false`, якщо ви навмисно хочете також обмежувати трафік localhost (для тестових налаштувань або суворих proxy-розгортань).
- Спроби WS-автентифікації з browser-origin завжди обмежуються, і для них вимкнено виняток loopback (додатковий захист від brute force localhost із браузера).
- У loopback такі блокування для browser-origin ізолюються за нормалізованим значенням `Origin`,
  тому повторні невдачі з одного localhost-origin не призводять автоматично
  до блокування іншого origin.
- `tailscale.mode`: `serve` (лише tailnet, bind loopback) або `funnel` (публічний, потребує автентифікації).
- `controlUi.allowedOrigins`: явний allowlist browser-origin для підключень Gateway WebSocket. Потрібний, коли браузерні клієнти очікуються з origin, відмінних від loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: небезпечний режим, який вмикає резервне визначення origin за заголовком Host для розгортань, що навмисно покладаються на політику origin за заголовком Host.
- `remote.transport`: `ssh` (типово) або `direct` (ws/wss). Для `direct` значення `remote.url` має бути `ws://` або `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: аварійне перевизначення на боці клієнта, яке дозволяє відкритий `ws://` до довірених IP приватної мережі; типовим лишається дозвіл відкритого трафіку лише для loopback.
- `gateway.remote.token` / `.password` — це поля облікових даних віддаленого клієнта. Вони самі по собі не налаштовують автентифікацію Gateway.
- `gateway.push.apns.relay.baseUrl`: базова HTTPS URL-адреса для зовнішнього APNs relay, який використовується офіційними/TestFlight збірками iOS після того, як вони публікують реєстрації на основі relay до Gateway. Ця URL-адреса має збігатися з URL relay, скомпільованою в збірку iOS.
- `gateway.push.apns.relay.timeoutMs`: тайм-аут надсилання від Gateway до relay у мілісекундах. Типове значення: `10000`.
- Реєстрації на основі relay делегуються конкретній ідентичності Gateway. Зіставлений застосунок iOS отримує `gateway.identity.get`, включає цю ідентичність у реєстрацію relay і передає Gateway право надсилання в межах реєстрації. Інший Gateway не може повторно використати цю збережену реєстрацію.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: тимчасові env-перевизначення для наведеної вище конфігурації relay.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: аварійний варіант лише для розробки для loopback HTTP URL-адрес relay. У продакшені URL-адреси relay мають залишатися на HTTPS.
- `gateway.channelHealthCheckMinutes`: інтервал монітора стану каналів у хвилинах. Установіть `0`, щоб глобально вимкнути перезапуски монітора стану. Типове значення: `5`.
- `gateway.channelStaleEventThresholdMinutes`: поріг застарілого сокета в хвилинах. Тримайте його більшим або рівним `gateway.channelHealthCheckMinutes`. Типове значення: `30`.
- `gateway.channelMaxRestartsPerHour`: максимальна кількість перезапусків монітора стану для кожного каналу/облікового запису за ковзну годину. Типове значення: `10`.
- `channels.<provider>.healthMonitor.enabled`: вимкнення перезапусків монітора стану для окремого каналу при збереженні глобального монітора увімкненим.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: перевизначення для окремого облікового запису в каналах з багатьма обліковими записами. Якщо задано, має пріоритет над перевизначенням на рівні каналу.
- Локальні шляхи виклику Gateway можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
- Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не визначено, визначення завершується fail closed (без маскування через резервний remote-варіант).
- `trustedProxies`: IP reverse proxy, які завершують TLS або вставляють заголовки forwarded-client. Перелічуйте лише proxy, які ви контролюєте. Записи loopback все ще валідні для налаштувань proxy на тому самому хості/локального виявлення (наприклад, Tailscale Serve або локальний reverse proxy), але вони **не** роблять loopback-запити придатними для `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: коли `true`, Gateway приймає `X-Real-IP`, якщо відсутній `X-Forwarded-For`. Типове значення `false` для fail-closed поведінки.
- `gateway.tools.deny`: додаткові назви інструментів, заблоковані для HTTP `POST /tools/invoke` (розширює типовий deny list).
- `gateway.tools.allow`: видалити назви інструментів із типового HTTP deny list.

</Accordion>

### OpenAI-compatible endpoints

- Chat Completions: типово вимкнені. Увімкніть через `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Посилення безпеки URL-вводу Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Порожні allowlist трактуються як незадані; використовуйте `gateway.http.endpoints.responses.files.allowUrl=false`
    і/або `gateway.http.endpoints.responses.images.allowUrl=false`, щоб вимкнути отримання за URL.
- Необов’язковий заголовок посилення безпеки відповіді:
  - `gateway.http.securityHeaders.strictTransportSecurity` (установлюйте лише для HTTPS-origin, які ви контролюєте; див. [Автентифікація через Trusted Proxy](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Ізоляція кількох екземплярів

Запускайте кілька Gateway на одному хості з унікальними портами та каталогами стану:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Зручні прапорці: `--dev` (використовує `~/.openclaw-dev` + порт `19001`), `--profile <name>` (використовує `~/.openclaw-<name>`).

Див. [Кілька Gateway](/uk/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: вмикає завершення TLS на слухачі Gateway (HTTPS/WSS) (типово: `false`).
- `autoGenerate`: автоматично генерує локальну самопідписану пару cert/key, коли явні файли не налаштовано; лише для local/dev використання.
- `certPath`: шлях у файловій системі до файла сертифіката TLS.
- `keyPath`: шлях у файловій системі до приватного ключа TLS; обмежте доступ до нього дозволами.
- `caPath`: необов’язковий шлях до набору CA для перевірки клієнта або користувацьких ланцюжків довіри.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: керує тим, як зміни конфігурації застосовуються під час runtime.
  - `"off"`: ігнорувати зміни наживо; зміни потребують явного перезапуску.
  - `"restart"`: завжди перезапускати процес Gateway після зміни конфігурації.
  - `"hot"`: застосовувати зміни в процесі без перезапуску.
  - `"hybrid"` (типово): спочатку спробувати hot reload; якщо потрібно, перейти до перезапуску.
- `debounceMs`: вікно debounce у мс перед застосуванням змін конфігурації (невід’ємне ціле число).
- `deferralTimeoutMs`: максимальний час очікування в мс для операцій, що виконуються, перед примусовим перезапуском (типово: `300000` = 5 хвилин).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Автентифікація: `Authorization: Bearer <token>` або `x-openclaw-token: <token>`.
Токени hook у рядку запиту відхиляються.

Примітки щодо валідації та безпеки:

- `hooks.enabled=true` потребує непорожнього `hooks.token`.
- `hooks.token` має **відрізнятися** від `gateway.auth.token`; повторне використання токена Gateway відхиляється.
- `hooks.path` не може бути `/`; використовуйте окремий підшлях, наприклад `/hooks`.
- Якщо `hooks.allowRequestSessionKey=true`, обмежте `hooks.allowedSessionKeyPrefixes` (наприклад `["hook:"]`).
- Якщо mapping або preset використовує шаблонізований `sessionKey`, установіть `hooks.allowedSessionKeyPrefixes` і `hooks.allowRequestSessionKey=true`. Статичні ключі mapping цього opt-in не потребують.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` з payload запиту приймається лише коли `hooks.allowRequestSessionKey=true` (типово: `false`).
- `POST /hooks/<name>` → визначається через `hooks.mappings`
  - Значення `sessionKey` у mapping, згенеровані шаблоном, розглядаються як зовнішньо надані й також потребують `hooks.allowRequestSessionKey=true`.

<Accordion title="Деталі mapping">

- `match.path` зіставляє підшлях після `/hooks` (наприклад `/hooks/gmail` → `gmail`).
- `match.source` зіставляє поле payload для загальних шляхів.
- Шаблони на кшталт `{{messages[0].subject}}` читають дані з payload.
- `transform` може вказувати на модуль JS/TS, який повертає дію hook.
  - `transform.module` має бути відносним шляхом і залишатися в межах `hooks.transformsDir` (абсолютні шляхи та traversal відхиляються).
- `agentId` маршрутизує до конкретного агента; невідомі ID використовують резервне значення за замовчуванням.
- `allowedAgentIds`: обмежує явну маршрутизацію (`*` або пропущено = дозволити все, `[]` = заборонити все).
- `defaultSessionKey`: необов’язковий фіксований ключ сесії для запусків hook-агента без явного `sessionKey`.
- `allowRequestSessionKey`: дозволити викликам `/hooks/agent` і ключам сесій mapping, що керуються шаблонами, задавати `sessionKey` (типово: `false`).
- `allowedSessionKeyPrefixes`: необов’язковий allowlist префіксів для явних значень `sessionKey` (запит + mapping), наприклад `["hook:"]`. Він стає обов’язковим, коли будь-який mapping або preset використовує шаблонізований `sessionKey`.
- `deliver: true` надсилає фінальну відповідь у канал; типове значення `channel` — `last`.
- `model` перевизначає LLM для цього запуску hook (має бути дозволено, якщо каталог моделей задано).

</Accordion>

### Інтеграція Gmail

- Вбудований preset Gmail використовує `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Якщо ви зберігаєте цю маршрутизацію для кожного повідомлення, установіть `hooks.allowRequestSessionKey: true` і обмежте `hooks.allowedSessionKeyPrefixes` відповідно до простору імен Gmail, наприклад `["hook:", "hook:gmail:"]`.
- Якщо вам потрібно `hooks.allowRequestSessionKey: false`, перевизначте preset статичним `sessionKey` замість шаблонізованого типового значення.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway автоматично запускає `gog gmail watch serve` під час завантаження, якщо це налаштовано. Установіть `OPENCLAW_SKIP_GMAIL_WATCHER=1`, щоб вимкнути.
- Не запускайте окремий `gog gmail watch serve` паралельно з Gateway.

---

## Хост canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Обслуговує редаговані агентом HTML/CSS/JS та A2UI через HTTP під портом Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Лише локально: залишайте `gateway.bind: "loopback"` (типово).
- Для bind, відмінних від loopback: маршрути canvas потребують автентифікації Gateway (token/password/trusted-proxy), так само як і інші HTTP-поверхні Gateway.
- Node WebView зазвичай не надсилають заголовки автентифікації; після сполучення й підключення node Gateway рекламує URL-адреси можливостей з областю node для доступу до canvas/A2UI.
- URL-адреси можливостей прив’язані до активної WS-сесії node і швидко спливають. Резервний варіант на основі IP не використовується.
- Вставляє клієнт live-reload у HTML, що обслуговується.
- Автоматично створює початковий `index.html`, якщо каталог порожній.
- Також обслуговує A2UI за адресою `/__openclaw__/a2ui/`.
- Зміни потребують перезапуску Gateway.
- Вимкніть live reload для великих каталогів або при помилках `EMFILE`.

---

## Виявлення

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (типово): не включає `cliPath` + `sshPort` із TXT-записів.
- `full`: включає `cliPath` + `sshPort`.
- Типове ім’я хоста — `openclaw`. Перевизначається через `OPENCLAW_MDNS_HOSTNAME`.

### Глобальна область (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Записує unicast DNS-SD zone у `~/.openclaw/dns/`. Для міжмережевого виявлення поєднуйте з DNS-сервером (рекомендовано CoreDNS) + Tailscale split DNS.

Налаштування: `openclaw dns setup --apply`.

---

## Середовище

### `env` (вбудовані env-змінні)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Вбудовані env-змінні застосовуються, лише якщо в env процесу відсутній ключ.
- Файли `.env`: `.env` поточного робочого каталогу + `~/.openclaw/.env` (жоден не перевизначає наявні змінні).
- `shellEnv`: імпортує відсутні очікувані ключі з профілю вашої оболонки входу.
- Див. [Середовище](/uk/help/environment) для повної пріоритетності.

### Підстановка env-змінних

Посилайтеся на env-змінні в будь-якому рядку конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`.
- Відсутні/порожні змінні викликають помилку під час завантаження конфігурації.
- Екрануйте як `$${VAR}` для літерального `${VAR}`.
- Працює з `$include`.

---

## Секрети

Посилання на секрети є адитивними: значення відкритим текстом усе ще працюють.

### `SecretRef`

Використовуйте одну форму об’єкта:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Валідація:

- шаблон `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- шаблон id для `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: абсолютний JSON pointer (наприклад `"/providers/openai/apiKey"`)
- шаблон id для `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- id для `source: "exec"` не мають містити сегменти шляху `.` або `..`, розділені `/` (наприклад `a/../b` відхиляється)

### Підтримувана поверхня облікових даних

- Канонічна матриця: [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface)
- `secrets apply` націлюється на підтримувані шляхи облікових даних у `openclaw.json`.
- Посилання з `auth-profiles.json` включені в runtime-визначення та покриття аудиту.

### Конфігурація провайдерів секретів

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Примітки:

- Провайдер `file` підтримує `mode: "json"` і `mode: "singleValue"` (`id` має бути `"value"` у режимі singleValue).
- Шляхи провайдерів file та exec завершуються fail closed, коли перевірка ACL Windows недоступна. Установлюйте `allowInsecurePath: true` лише для довірених шляхів, які неможливо перевірити.
- Провайдер `exec` потребує абсолютного шляху `command` і використовує protocol payload у stdin/stdout.
- Типово шляхи команд-символьних посилань відхиляються. Установіть `allowSymlinkCommand: true`, щоб дозволити шляхи-символьні посилання з перевіркою шляху до визначеної цілі.
- Якщо налаштовано `trustedDirs`, перевірка довірених каталогів застосовується до шляху визначеної цілі.
- Середовище дочірнього процесу `exec` типово мінімальне; явно передавайте потрібні змінні через `passEnv`.
- Посилання на секрети визначаються під час активації у внутрішньопам’ятний знімок, а потім шляхи запитів читають лише цей знімок.
- Фільтрація активної поверхні застосовується під час активації: невизначені посилання на увімкнених поверхнях призводять до помилки запуску/перезавантаження, а неактивні поверхні пропускаються з діагностикою.

---

## Сховище автентифікації

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Профілі для кожного агента зберігаються в `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` підтримує посилання на рівні значень (`keyRef` для `api_key`, `tokenRef` для `token`) для статичних режимів облікових даних.
- Профілі в режимі OAuth (`auth.profiles.<id>.mode = "oauth"`) не підтримують облікові дані профілю автентифікації на основі SecretRef.
- Статичні runtime-облікові дані беруться з визначених внутрішньопам’ятних знімків; legacy-записи `auth.json` очищаються, коли їх виявлено.
- Legacy-імпорти OAuth беруться з `~/.openclaw/credentials/oauth.json`.
- Див. [OAuth](/uk/concepts/oauth).
- Runtime-поведінка секретів і інструменти `audit/configure/apply`: [Керування секретами](/uk/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: базовий backoff у годинах, коли профіль завершується помилкою через справжні
  помилки білінгу/недостатнього кредиту (типово: `5`). Явний текст про білінг
  усе ще може потрапити сюди навіть для відповідей `401`/`403`, але
  зіставлення тексту, специфічні для провайдера, залишаються в межах провайдера,
  якому вони належать (наприклад, OpenRouter
  `Key limit exceeded`). Повідомлення про вікно використання або
  ліміт витрат організації/робочого простору для повторюваних HTTP `402`
  натомість залишаються в шляху `rate_limit`.
- `billingBackoffHoursByProvider`: необов’язкові перевизначення годин backoff для білінгу для кожного провайдера.
- `billingMaxHours`: обмеження в годинах для експоненційного зростання backoff білінгу (типово: `24`).
- `authPermanentBackoffMinutes`: базовий backoff у хвилинах для збоїв `auth_permanent` з високою впевненістю (типово: `10`).
- `authPermanentMaxMinutes`: обмеження в хвилинах для зростання backoff `auth_permanent` (типово: `60`).
- `failureWindowHours`: ковзне вікно в годинах, яке використовується для лічильників backoff (типово: `24`).
- `overloadedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для перевантажених помилок перед переходом до резервної моделі (типово: `1`). Форми зайнятості провайдера, такі як `ModelNotReadyException`, потрапляють сюди.
- `overloadedBackoffMs`: фіксована затримка перед повторною спробою ротації перевантаженого провайдера/профілю (типово: `0`).
- `rateLimitedProfileRotations`: максимальна кількість ротацій auth-профілю в межах того самого провайдера для помилок rate-limit перед переходом до резервної моделі (типово: `1`). Цей кошик rate-limit включає текст, характерний для провайдерів, такий як `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` і `resource exhausted`.

---

## Журналювання

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Типовий файл журналу: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Установіть `logging.file` для стабільного шляху.
- `consoleLevel` підвищується до `debug` при `--verbose`.
- `maxFileBytes`: максимальний розмір файла журналу в байтах, після якого запис пригнічується (додатне ціле число; типово: `524288000` = 500 MB). Для продакшен-розгортань використовуйте зовнішню ротацію журналів.

---

## Діагностика

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: головний перемикач для виводу інструментування (типово: `true`).
- `flags`: масив рядків-прапорців, які вмикають цільовий вивід журналу (підтримує шаблони на кшталт `"telegram.*"` або `"*"`).
- `stuckSessionWarnMs`: поріг віку в мс для видачі попереджень про завислі сесії, поки сесія залишається в стані обробки.
- `otel.enabled`: вмикає конвеєр експорту OpenTelemetry (типово: `false`).
- `otel.endpoint`: URL колектора для експорту OTel.
- `otel.protocol`: `"http/protobuf"` (типово) або `"grpc"`.
- `otel.headers`: додаткові заголовки метаданих HTTP/gRPC, які надсилаються із запитами експорту OTel.
- `otel.serviceName`: назва сервісу для атрибутів ресурсу.
- `otel.traces` / `otel.metrics` / `otel.logs`: увімкнути експорт trace, metrics або log.
- `otel.sampleRate`: частота вибірки trace `0`–`1`.
- `otel.flushIntervalMs`: інтервал періодичного скидання телеметрії в мс.
- `cacheTrace.enabled`: журналювати знімки трасування кешу для вбудованих запусків (типово: `false`).
- `cacheTrace.filePath`: шлях виводу для JSONL трасування кешу (типово: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: керують тим, що включається у вивід трасування кешу (усі типово: `true`).

---

## Оновлення

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: канал релізів для npm/git-інсталяцій — `"stable"`, `"beta"` або `"dev"`.
- `checkOnStart`: перевіряти оновлення npm під час запуску Gateway (типово: `true`).
- `auto.enabled`: увімкнути фонове автооновлення для пакетних інсталяцій (типово: `false`).
- `auto.stableDelayHours`: мінімальна затримка в годинах перед автозастосуванням stable-каналу (типово: `6`; макс.: `168`).
- `auto.stableJitterHours`: додаткове вікно розподілу розгортання stable-каналу в годинах (типово: `12`; макс.: `168`).
- `auto.betaCheckIntervalHours`: як часто виконуються перевірки beta-каналу в годинах (типово: `1`; макс.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: глобальний прапорець можливості ACP (типово: `false`).
- `dispatch.enabled`: незалежний прапорець для диспетчеризації ходів сесій ACP (типово: `true`). Установіть `false`, щоб зберегти доступність команд ACP, але заблокувати виконання.
- `backend`: id типового runtime-бекенду ACP (має збігатися із зареєстрованим ACP runtime Plugin).
- `defaultAgent`: резервний id цільового агента ACP, коли spawn не задає явну ціль.
- `allowedAgents`: allowlist id агентів, дозволених для runtime-сесій ACP; порожнє значення означає відсутність додаткових обмежень.
- `maxConcurrentSessions`: максимальна кількість одночасно активних сесій ACP.
- `stream.coalesceIdleMs`: вікно idle-flush у мс для потокового тексту.
- `stream.maxChunkChars`: максимальний розмір частини перед розбиттям проєкції потокового блока.
- `stream.repeatSuppression`: пригнічувати повторювані рядки стану/інструментів у межах ходу (типово: `true`).
- `stream.deliveryMode`: `"live"` передає потік поступово; `"final_only"` буферизує до термінальних подій ходу.
- `stream.hiddenBoundarySeparator`: роздільник перед видимим текстом після прихованих подій інструментів (типово: `"paragraph"`).
- `stream.maxOutputChars`: максимальна кількість символів виводу асистента, що проєктується на один хід ACP.
- `stream.maxSessionUpdateChars`: максимальна кількість символів для проєктованих рядків стану/оновлення ACP.
- `stream.tagVisibility`: запис імен тегів у булеві перевизначення видимості для потокових подій.
- `runtime.ttlMinutes`: idle TTL у хвилинах для воркерів сесій ACP до того, як вони стануть придатними для очищення.
- `runtime.installCommand`: необов’язкова команда встановлення, яку слід виконати під час початкового налаштування runtime-середовища ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` керує стилем слогана банера:
  - `"random"` (типово): ротаційні кумедні/сезонні слогани.
  - `"default"`: фіксований нейтральний слоган (`All your chats, one OpenClaw.`).
  - `"off"`: без тексту слогана (заголовок/версія банера все одно показуються).
- Щоб приховати весь банер (а не лише слогани), установіть env `OPENCLAW_HIDE_BANNER=1`.

---

## Майстер

Метадані, які записуються керованими потоками налаштування CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Ідентичність

Див. поля ідентичності `agents.list` у розділі [Типові значення агента](/uk/gateway/config-agents#agent-defaults).

---

## Bridge (застарілий, видалений)

Поточні збірки більше не містять TCP bridge. Node підключаються через WebSocket Gateway. Ключі `bridge.*` більше не є частиною схеми конфігурації (валідація завершується помилкою, доки їх не буде видалено; `openclaw doctor --fix` може прибрати невідомі ключі).

<Accordion title="Застаріла конфігурація bridge (історична довідка)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: як довго зберігати завершені ізольовані сесії запусків Cron перед їхнім очищенням із `sessions.json`. Також керує очищенням архівованих видалених транскриптів Cron. Типове значення: `24h`; установіть `false`, щоб вимкнути.
- `runLog.maxBytes`: максимальний розмір файла журналу одного запуску (`cron/runs/<jobId>.jsonl`) перед очищенням. Типове значення: `2_000_000` байтів.
- `runLog.keepLines`: кількість найновіших рядків, які зберігаються, коли запускається очищення журналу запусків. Типове значення: `2000`.
- `webhookToken`: bearer token, що використовується для доставки POST у Cron Webhook (`delivery.mode = "webhook"`); якщо не задано, заголовок автентифікації не надсилається.
- `webhook`: застаріла резервна URL-адреса legacy Webhook (http/https), що використовується лише для збережених завдань, у яких досі є `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: максимальна кількість повторних спроб для одноразових завдань при тимчасових помилках (типово: `3`; діапазон: `0`–`10`).
- `backoffMs`: масив затримок backoff у мс для кожної повторної спроби (типово: `[30000, 60000, 300000]`; 1–10 записів).
- `retryOn`: типи помилок, які запускають повторні спроби — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Пропустіть, щоб повторювати всі тимчасові типи.

Застосовується лише до одноразових завдань Cron. Для повторюваних завдань використовується окрема обробка збоїв.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: увімкнути сповіщення про збої для завдань Cron (типово: `false`).
- `after`: кількість послідовних збоїв перед спрацюванням сповіщення (додатне ціле число, мін.: `1`).
- `cooldownMs`: мінімальна кількість мілісекунд між повторними сповіщеннями для того самого завдання (невід’ємне ціле число).
- `mode`: режим доставки — `"announce"` надсилає через повідомлення каналу; `"webhook"` виконує POST на налаштований Webhook.
- `accountId`: необов’язковий id облікового запису або каналу для обмеження області доставки сповіщення.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Типова ціль призначення для сповіщень про збої Cron для всіх завдань.
- `mode`: `"announce"` або `"webhook"`; типове значення — `"announce"`, коли є достатньо даних про ціль.
- `channel`: перевизначення каналу для доставки announce. `"last"` повторно використовує останній відомий канал доставки.
- `to`: явна ціль announce або URL-адреса Webhook. Обов’язкове для режиму webhook.
- `accountId`: необов’язкове перевизначення облікового запису для доставки.
- `delivery.failureDestination` для окремого завдання перевизначає це глобальне типове значення.
- Коли не задано ані глобальну, ані окрему ціль призначення для збоїв, завдання, які вже доставляють через `announce`, у разі збою використовують свою основну ціль announce як резервний варіант.
- `delivery.failureDestination` підтримується лише для завдань `sessionTarget="isolated"`, якщо тільки основний `delivery.mode` завдання не має значення `"webhook"`.

Див. [Завдання Cron](/uk/automation/cron-jobs). Ізольовані виконання Cron відстежуються як [фонові завдання](/uk/automation/tasks).

---

## Змінні шаблону моделі медіа

Заповнювачі шаблонів, що розгортаються в `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Повне тіло вхідного повідомлення                  |
| `{{RawBody}}`      | Сире тіло (без обгорток історії/відправника)      |
| `{{BodyStripped}}` | Тіло з видаленими згадками груп                   |
| `{{From}}`         | Ідентифікатор відправника                         |
| `{{To}}`           | Ідентифікатор призначення                         |
| `{{MessageSid}}`   | id повідомлення каналу                            |
| `{{SessionId}}`    | UUID поточної сесії                               |
| `{{IsNewSession}}` | `"true"`, коли створено нову сесію                |
| `{{MediaUrl}}`     | Псевдо-URL вхідного медіа                         |
| `{{MediaPath}}`    | Локальний шлях до медіа                           |
| `{{MediaType}}`    | Тип медіа (image/audio/document/…)                |
| `{{Transcript}}`   | Транскрипт аудіо                                  |
| `{{Prompt}}`       | Визначений media prompt для записів CLI           |
| `{{MaxChars}}`     | Визначений максимум символів виводу для записів CLI |
| `{{ChatType}}`     | `"direct"` або `"group"`                          |
| `{{GroupSubject}}` | Тема групи (best effort)                          |
| `{{GroupMembers}}` | Попередній перегляд учасників групи (best effort) |
| `{{SenderName}}`   | Відображуване ім’я відправника (best effort)      |
| `{{SenderE164}}`   | Номер телефону відправника (best effort)          |
| `{{Provider}}`     | Підказка провайдера (whatsapp, telegram, discord тощо) |

---

## Include конфігурації (`$include`)

Розділіть конфігурацію на кілька файлів:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Поведінка злиття:**

- Один файл: замінює об’єкт-контейнер.
- Масив файлів: глибоко зливається в заданому порядку (пізніші перевизначають попередні).
- Сусідні ключі: зливаються після include (перевизначають включені значення).
- Вкладені include: до 10 рівнів глибини.
- Шляхи: визначаються відносно файла, що включає, але мають залишатися в межах каталогу конфігурації верхнього рівня (`dirname` від `openclaw.json`). Абсолютні форми/форми `../` дозволені лише тоді, коли вони все одно визначаються в межах цієї границі.
- Записи, що належать OpenClaw і змінюють лише один розділ верхнього рівня, підкріплений include одного файла, записуються безпосередньо в цей включений файл. Наприклад, `plugins install` оновлює `plugins: { $include: "./plugins.json5" }` у `plugins.json5` і залишає `openclaw.json` без змін.
- Кореневі include, масиви include та include із сусідніми перевизначеннями доступні лише для читання для записів, що належать OpenClaw; такі записи завершуються fail closed замість сплощення конфігурації.
- Помилки: зрозумілі повідомлення для відсутніх файлів, помилок парсингу та циклічних include.

---

_Пов’язане: [Конфігурація](/uk/gateway/configuration) · [Приклади конфігурації](/uk/gateway/configuration-examples) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Конфігурація](/uk/gateway/configuration)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
