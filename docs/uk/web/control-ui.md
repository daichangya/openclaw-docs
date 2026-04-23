---
read_when:
    - Ви хочете керувати Gateway з браузера
    - Ви хочете доступ через Tailnet без SSH-тунелів
summary: Браузерний Control UI для Gateway (чат, Node, конфігурація)
title: Control UI
x-i18n:
    generated_at: "2026-04-23T06:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05c5a1b9c0527d230b1657e15b1adf681817d279128af8197a14eb9bdde3d211
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (браузер)

Control UI — це невеликий односторінковий застосунок **Vite + Lit**, який обслуговується Gateway:

- типово: `http://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Він працює **безпосередньо з WebSocket Gateway** на тому самому порту.

## Швидке відкриття (локально)

Якщо Gateway працює на тому самому комп’ютері, відкрийте:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (або [http://localhost:18789/](http://localhost:18789/))

Якщо сторінка не завантажується, спочатку запустіть Gateway: `openclaw gateway`.

Автентифікація передається під час рукостискання WebSocket через:

- `connect.params.auth.token`
- `connect.params.auth.password`
- заголовки ідентичності Tailscale Serve, коли `gateway.auth.allowTailscale: true`
- заголовки ідентичності trusted-proxy, коли `gateway.auth.mode: "trusted-proxy"`

Панель налаштувань dashboard зберігає токен для поточної сесії вкладки браузера
та вибраний URL gateway; паролі не зберігаються. Onboarding зазвичай
генерує токен gateway для автентифікації через спільний секрет при першому підключенні, але
автентифікація паролем теж працює, коли `gateway.auth.mode` дорівнює `"password"`.

## Pairing пристрою (перше підключення)

Коли ви підключаєтеся до Control UI з нового браузера або пристрою, Gateway
потребує **одноразового схвалення pairing** — навіть якщо ви в тому самому Tailnet
з `gateway.auth.allowTailscale: true`. Це захід безпеки для запобігання
несанкціонованому доступу.

**Що ви побачите:** "disconnected (1008): pairing required"

**Щоб схвалити пристрій:**

```bash
# Переглянути очікувані запити
openclaw devices list

# Схвалити за ID запиту
openclaw devices approve <requestId>
```

Якщо браузер повторює pairing зі зміненими даними автентифікації (роль/scopes/public
key), попередній очікуваний запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Якщо браузер уже paired і ви змінюєте його з доступу на читання на
доступ на запис/admin, це розглядається як підвищення рівня схвалення, а не як тихе
повторне підключення. OpenClaw зберігає старе схвалення активним, блокує ширше повторне підключення
і просить вас явно схвалити новий набір scope.

Після схвалення пристрій запам’ятовується і не вимагатиме повторного схвалення,
доки ви не відкличете його через `openclaw devices revoke --device <id> --role <role>`. Див.
[Devices CLI](/uk/cli/devices) щодо ротації токенів і відкликання.

**Примітки:**

- Прямі локальні браузерні підключення через loopback (`127.0.0.1` / `localhost`)
  схвалюються автоматично.
- Підключення браузера через Tailnet і LAN усе одно потребують явного схвалення, навіть якщо
  вони походять з тієї самої машини.
- Кожен профіль браузера генерує унікальний ID пристрою, тому зміна браузера або
  очищення даних браузера потребуватиме повторного pairing.

## Підтримка мов

Control UI може локалізувати себе під час першого завантаження на основі локалі браузера.
Щоб перевизначити це пізніше, відкрийте **Overview -> Gateway Access -> Language**. Засіб вибору
локалі знаходиться в картці Gateway Access, а не в розділі Appearance.

- Підтримувані локалі: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Неангломовні переклади ліниво завантажуються в браузері.
- Вибрана локаль зберігається у сховищі браузера й повторно використовується при майбутніх відвідинах.
- Відсутні ключі перекладу повертаються до англійської.

## Що це вміє (сьогодні)

- Чат із моделлю через Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Потокове передавання викликів tool + картки живого виводу tool у Chat (події агента)
- Канали: вбудовані плюс bundled/external plugin-канали, статус, вхід через QR і конфігурація для кожного каналу (`channels.status`, `web.login.*`, `config.patch`)
- Інстанси: список присутності + оновлення (`system-presence`)
- Сесії: список + перевизначення model/thinking/fast/verbose/trace/reasoning для кожної сесії (`sessions.list`, `sessions.patch`)
- Dreams: статус Dreaming, перемикач увімкнення/вимкнення та читач Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Завдання Cron: список/додавання/редагування/запуск/увімкнення/вимкнення + історія запусків (`cron.*`)
- Skills: статус, увімкнення/вимкнення, встановлення, оновлення API key (`skills.*`)
- Nodes: список + caps (`node.list`)
- Схвалення exec: редагування allowlist для gateway або node + політика запитів для `exec host=gateway/node` (`exec.approvals.*`)
- Конфігурація: перегляд/редагування `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Конфігурація: застосування + перезапуск із валідацією (`config.apply`) і пробудження останньої активної сесії
- Записи конфігурації включають захист base-hash, щоб запобігти перезапису паралельних змін
- Записи конфігурації (`config.set`/`config.apply`/`config.patch`) також виконують попередню перевірку активного розв’язання SecretRef для ref у надісланому payload конфігурації; нерозв’язані активні надіслані ref відхиляються до запису
- Схема конфігурації + рендеринг форми (`config.schema` / `config.schema.lookup`,
  включно з полями `title` / `description`, відповідними UI-підказками, зведеннями
  безпосередніх дочірніх елементів, metadata документації на вузлах nested object/wildcard/array/composition,
  а також схемами plugin + channel, коли вони доступні); редактор Raw JSON
  доступний лише тоді, коли snapshot має безпечний raw round-trip
- Якщо snapshot не може безпечно пройти round-trip у raw text, Control UI примусово використовує режим Form і вимикає режим Raw для цього snapshot
- Структуровані значення об’єктів SecretRef відображаються лише для читання в текстових полях форми, щоб запобігти випадковому пошкодженню object-to-string
- Налагодження: snapshots status/health/models + журнал подій + ручні RPC-виклики (`status`, `health`, `models.list`)
- Журнали: live tail журналів файлів gateway з фільтром/експортом (`logs.tail`)
- Оновлення: запуск оновлення package/git + перезапуск (`update.run`) зі звітом про перезапуск

Примітки до панелі завдань Cron:

- Для ізольованих завдань типова доставка — оголошення зведення. Ви можете перемкнути на none, якщо хочете лише внутрішні запуски.
- Поля channel/target з’являються, коли вибрано announce.
- Режим Webhook використовує `delivery.mode = "webhook"` з `delivery.to`, заданим як коректний HTTP(S) Webhook URL.
- Для завдань main-session доступні режими доставки webhook і none.
- Розширені елементи редагування включають delete-after-run, очищення перевизначення агента, точні/stagger-варіанти Cron,
  перевизначення model/thinking агента та best-effort перемикачі доставки.
- Валідація форми є вбудованою з помилками на рівні полів; некоректні значення вимикають кнопку збереження, доки їх не буде виправлено.
- Задайте `cron.webhookToken`, щоб надсилати окремий bearer token; якщо його пропущено, webhook надсилається без заголовка auth.
- Застарілий fallback: збережені legacy-завдання з `notify: true` все ще можуть використовувати `cron.webhook`, доки їх не буде мігровано.

## Поведінка чату

- `chat.send` є **неблокувальним**: він одразу підтверджує отримання через `{ runId, status: "started" }`, а відповідь передається потоком через події `chat`.
- Повторне надсилання з тим самим `idempotencyKey` повертає `{ status: "in_flight" }` під час виконання і `{ status: "ok" }` після завершення.
- Відповіді `chat.history` обмежені за розміром для безпеки UI. Коли записи transcript надто великі, Gateway може обрізати довгі текстові поля, пропускати великі блоки metadata та замінювати надмірно великі повідомлення заповнювачем (`[chat.history omitted: message too large]`).
- `chat.history` також прибирає display-only вбудовані теги директив із видимого тексту асистента (наприклад, `[[reply_to_*]]` і `[[audio_as_voice]]`), plain-text XML payload викликів tool (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізаними блоками викликів tool), а також витеклі ASCII/full-width токени керування моделлю, і пропускає записи асистента, чий увесь видимий текст — це лише точний тихий токен `NO_REPLY` / `no_reply`.
- `chat.inject` додає примітку асистента до transcript сесії та транслює подію `chat` для оновлень лише в UI (без запуску агента, без доставки в канал).
- Вибір model і thinking у заголовку чату одразу patch-ить активну сесію через `sessions.patch`; це постійні перевизначення сесії, а не параметри надсилання лише на один хід.
- Зупинка:
  - Натисніть **Stop** (викликає `chat.abort`)
  - Введіть `/stop` (або окремі фрази переривання, як-от `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) для позасмугового переривання
  - `chat.abort` підтримує `{ sessionKey }` (без `runId`) для переривання всіх активних запусків цієї сесії
- Збереження часткового виводу після переривання:
  - Коли запуск переривається, частковий текст асистента все ще може відображатися в UI
  - Gateway зберігає частковий текст асистента після переривання в transcript history, якщо існує буферизований вивід
  - Збережені записи містять metadata переривання, щоб споживачі transcript могли відрізняти часткові записи після переривання від звичайного завершеного виводу

## Hosted embeds

Повідомлення асистента можуть вбудовано рендерити hosted web content за допомогою shortcode `[embed ...]`.
Політика sandbox iframe керується через
`gateway.controlUi.embedSandbox`:

- `strict`: вимикає виконання скриптів усередині hosted embeds
- `scripts`: дозволяє інтерактивні embeds, зберігаючи ізоляцію origin; це
  типове значення, якого зазвичай достатньо для самодостатніх браузерних ігор/віджетів
- `trusted`: додає `allow-same-origin` поверх `allow-scripts` для same-site
  документів, яким навмисно потрібні ширші привілеї

Приклад:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

Використовуйте `trusted` лише тоді, коли вбудованому документу справді потрібна same-origin
поведінка. Для більшості згенерованих агентом ігор та інтерактивних canvas `scripts` є
безпечнішим вибором.

Абсолютні зовнішні `http(s)` embed URL типово залишаються заблокованими. Якщо ви
свідомо хочете, щоб `[embed url="https://..."]` завантажував сторонні сторінки, задайте
`gateway.controlUi.allowExternalEmbedUrls: true`.

## Доступ через Tailnet (рекомендовано)

### Інтегрований Tailscale Serve (бажано)

Тримайте Gateway на loopback і дозвольте Tailscale Serve проксувати його через HTTPS:

```bash
openclaw gateway --tailscale serve
```

Відкрийте:

- `https://<magicdns>/` (або ваш налаштований `gateway.controlUi.basePath`)

Типово запити Serve до Control UI/WebSocket можуть проходити автентифікацію через заголовки ідентичності Tailscale
(`tailscale-user-login`), коли `gateway.auth.allowTailscale` дорівнює `true`. OpenClaw
перевіряє ідентичність, розв’язуючи адресу `x-forwarded-for` через
`tailscale whois` і зіставляючи її із заголовком, і приймає їх лише тоді, коли
запит потрапляє на loopback із заголовками `x-forwarded-*` від Tailscale. Задайте
`gateway.auth.allowTailscale: false`, якщо хочете вимагати явні облікові дані зі спільним секретом
навіть для трафіку Serve. Тоді використовуйте `gateway.auth.mode: "token"` або
`"password"`.
Для цього асинхронного шляху ідентичності Serve невдалі спроби автентифікації для тієї самої IP-адреси клієнта
та scope автентифікації серіалізуються перед записом обмеження частоти. Тому одночасні невдалі повтори
з того самого браузера можуть показати `retry later` у другому запиті замість двох звичайних невідповідностей, що змагаються паралельно.
Автентифікація Serve без токена припускає, що хост gateway є довіреним. Якщо на цьому хості
може виконуватися недовірений local code, вимагайте автентифікацію токеном/паролем.

### Прив’язка до tailnet + токен

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Потім відкрийте:

- `http://<tailscale-ip>:18789/` (або ваш налаштований `gateway.controlUi.basePath`)

Вставте відповідний спільний секрет у налаштування UI (він надсилається як
`connect.params.auth.token` або `connect.params.auth.password`).

## Незахищений HTTP

Якщо ви відкриваєте dashboard через звичайний HTTP (`http://<lan-ip>` або `http://<tailscale-ip>`),
браузер працює в **незахищеному контексті** і блокує WebCrypto. Типово
OpenClaw **блокує** підключення Control UI без ідентичності пристрою.

Задокументовані винятки:

- сумісність із незахищеним HTTP лише для localhost через `gateway.controlUi.allowInsecureAuth=true`
- успішна автентифікація оператора в Control UI через `gateway.auth.mode: "trusted-proxy"`
- аварійний варіант `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Рекомендоване виправлення:** використовуйте HTTPS (Tailscale Serve) або відкривайте UI локально:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (на хості gateway)

**Поведінка перемикача insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` — це лише локальний перемикач сумісності:

- Він дозволяє сесіям Control UI на localhost працювати без ідентичності пристрою в
  незахищених HTTP-контекстах.
- Він не обходить перевірки pairing.
- Він не послаблює вимоги до ідентичності віддалених (не localhost) пристроїв.

**Лише для аварійного використання:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` вимикає перевірки ідентичності пристрою в Control UI і є
серйозним погіршенням безпеки. Після аварійного використання швидко поверніть усе назад.

Примітка щодо trusted-proxy:

- успішна автентифікація trusted-proxy може допустити **operator**-сесії Control UI без
  ідентичності пристрою
- це **не** поширюється на node-role сесії Control UI
- reverse proxy на loopback того самого хоста все одно не задовольняють автентифікацію trusted-proxy; див.
  [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)

Докладніше про налаштування HTTPS див. у [Tailscale](/uk/gateway/tailscale).

## Політика безпеки вмісту

Control UI постачається зі суворою політикою `img-src`: дозволені лише ресурси **того самого origin** і URL `data:`. Віддалені URL з `http(s)` і protocol-relative image URL відхиляються браузером і не виконують мережевих запитів.

Що це означає на практиці:

- Аватари та зображення, що обслуговуються за відносними шляхами (наприклад, `/avatars/<id>`), як і раніше відображаються.
- Вбудовані URL `data:image/...` як і раніше відображаються (це корисно для payload у межах протоколу).
- Віддалені URL аватарів, які надходять із metadata каналу, прибираються в допоміжних функціях аватарів Control UI і замінюються вбудованими logo/badge, тож скомпрометований або зловмисний канал не може примусово змусити браузер оператора завантажувати довільні віддалені зображення.

Щоб отримати таку поведінку, нічого змінювати не потрібно — вона завжди ввімкнена й не налаштовується.

## Автентифікація маршруту аватарів

Коли налаштовано автентифікацію gateway, endpoint аватарів у Control UI потребує того самого токена gateway, що й решта API:

- `GET /avatar/<agentId>` повертає зображення аватара лише автентифікованим клієнтам. `GET /avatar/<agentId>?meta=1` повертає metadata аватара за тим самим правилом.
- Неавтентифіковані запити до обох маршрутів відхиляються (узгоджено із сусіднім маршрутом assistant-media). Це запобігає витоку ідентичності агента через маршрут аватара на хостах, які інакше захищені.
- Сам Control UI передає токен gateway як bearer-заголовок під час отримання аватарів і використовує автентифіковані blob URL, тож зображення все одно відображається в dashboard.

Якщо ви вимкнете автентифікацію gateway (не рекомендовано на спільних хостах), маршрут аватарів також стане неавтентифікованим, відповідно до решти gateway.

## Збірка UI

Gateway обслуговує статичні файли з `dist/control-ui`. Зберіть їх командою:

```bash
pnpm ui:build
```

Необов’язкова абсолютна база (коли потрібні фіксовані URL ресурсів):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Для локальної розробки (окремий dev server):

```bash
pnpm ui:dev
```

Потім спрямуйте UI на URL Gateway WS (наприклад, `ws://127.0.0.1:18789`).

## Налагодження/тестування: dev server + віддалений Gateway

Control UI — це статичні файли; target WebSocket налаштовується і може
відрізнятися від HTTP origin. Це зручно, коли ви хочете використовувати dev server Vite
локально, а Gateway працює деінде.

1. Запустіть dev server UI: `pnpm ui:dev`
2. Відкрийте URL на кшталт:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Необов’язкова одноразова автентифікація (за потреби):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Примітки:

- `gatewayUrl` зберігається в localStorage після завантаження і прибирається з URL.
- `token` слід передавати через фрагмент URL (`#token=...`), коли це можливо. Фрагменти не надсилаються на сервер, що запобігає витоку в журналах запитів і Referer. Застарілі query-параметри `?token=` усе ще одноразово імпортуються для сумісності, але лише як fallback, і негайно прибираються після bootstrap.
- `password` зберігається лише в пам’яті.
- Коли задано `gatewayUrl`, UI не повертається до облікових даних із конфігурації чи середовища.
  Передайте `token` (або `password`) явно. Відсутність явних облікових даних є помилкою.
- Використовуйте `wss://`, коли Gateway стоїть за TLS (Tailscale Serve, HTTPS proxy тощо).
- `gatewayUrl` приймається лише у вікні верхнього рівня (не у вбудованому), щоб запобігти clickjacking.
- Для розгортань Control UI не на loopback потрібно явно задавати `gateway.controlUi.allowedOrigins`
  (повні origin). Це також стосується віддалених dev-налаштувань.
- Не використовуйте `gateway.controlUi.allowedOrigins: ["*"]`, окрім як у жорстко контрольованому
  локальному тестуванні. Це означає дозволити будь-який browser origin, а не «підібрати будь-який host, який я
  використовую».
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає
  режим fallback origin за заголовком Host, але це небезпечний режим безпеки.

Приклад:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Докладніше про налаштування віддаленого доступу: [Віддалений доступ](/uk/gateway/remote).

## Пов’язане

- [Dashboard](/uk/web/dashboard) — dashboard gateway
- [WebChat](/uk/web/webchat) — браузерний інтерфейс чату
- [TUI](/uk/web/tui) — термінальний інтерфейс користувача
- [Health Checks](/uk/gateway/health) — моніторинг стану gateway
