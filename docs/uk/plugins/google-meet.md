---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio із типовими параметрами голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-25T19:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a33455733a0818145c6efdd6e739068652806f73a7e35c22430911f7d436f7fe
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — плагін навмисно зроблено явним:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненою URL-адресою.
- Голосовий режим `realtime` є типовим.
- Голос у режимі реального часу може повертатися до повноцінного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного голосового зв’язку або `transcribe`, щоб приєднатися/керувати браузером без голосового мосту реального часу.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на з’єднаному хості Node.
- Twilio приймає номер для дозвону та необов’язкову послідовність PIN або DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу реального часу. OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew потребує перезавантаження, перш ніж macOS зробить цей пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидва компоненти:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Увімкніть плагін:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Перевірте налаштування:

```bash
openclaw googlemeet setup
```

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, прив’язку до Node, відкладений вступ у режимі реального часу та, коли налаштовано делегування Twilio, чи готові плагін `voice-call` і облікові дані Twilio.
Уважайте будь-яку перевірку з `ok: false` блокувальною, перш ніж просити агента приєднатися.
Для сценаріїв або машиночитаного виводу використовуйте `openclaw googlemeet setup --json`.
Використовуйте `--transport chrome`, `--transport chrome-node` або `--transport twilio`, щоб попередньо перевірити конкретний транспорт, перш ніж агент спробує його використати.

Приєднайтеся до зустрічі:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Або дозвольте агенту приєднатися через інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створіть лише URL-адресу без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на реальну URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає, щоб у профілі Chrome OpenClaw на вузлі вже було виконано вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит не вважається збоєм входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям нової. Під час зіставлення ігноруються нешкідливі рядки параметрів URL, як-от `authuser`, тому повторна спроба агента має перевести фокус на вже відкриту зустріч замість створення другої вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та повертає `joined: true` разом із сеансом приєднання. Щоб лише згенерувати URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з голосом у режимі реального часу та надішли мені посилання». Агент має викликати `google_meet` з `action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером встановіть `"mode": "transcribe"`. Це не запускає дуплексний міст моделі реального часу, тож він не відповідатиме голосом у зустрічі.

Під час сеансів у режимі реального часу статус `google_meet` включає стан браузера та аудіомосту, як-от `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього входу/виходу, лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet, автоматизація браузера обробляє його, коли це можливо. Запити на вхід, допуск хостом і дозволи браузера/ОС повідомляються як ручна дія з причиною та повідомленням, яке агент має передати.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб Chrome працював у VM. Запустіть Gateway та агента локально, а потім запустіть хост Node у VM. Увімкніть у VM вбудований плагін один раз, щоб вузол рекламовував команду Chrome:

Що і де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер реального часу та конфігурація плагіна Google Meet.
- Parallels macOS VM: OpenClaw CLI/хост Node, Google Chrome, SoX, BlackHole 2ch і профіль Chrome, у якому виконано вхід у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування провайдера моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте, що VM бачить аудіопристрій і команди SoX:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований плагін:

```bash
openclaw plugins enable google-meet
```

Запустіть хост Node у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхиляє незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища, коли встановлюєте вузол як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр
`openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, якщо вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямовуйте Meet через цей вузол на хості Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Тепер приєднуйтеся звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, вимовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet «Use microphone», коли з’являється цей запит. Під час створення зустрічі лише через браузер вона також може продовжити після того самого запиту без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо в профілі браузера не виконано вхід, Meet очікує допуску хостом, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, задайте `chromeNode.node` як ідентифікатор вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `Configured Google Meet node ... is not usable: offline`: закріплений вузол відомий Gateway, але недоступний. Агенти мають розглядати цей вузол як діагностичний стан, а не як придатний хост Chrome, і повідомляти про блокувальну проблему налаштування замість переходу до іншого транспорту, якщо користувач не просив про це.
- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення й переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що хост
  Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: установіть `blackhole-2ch` на хості, який перевіряється, і перезавантажте його перед використанням локального аудіо Chrome.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште `chrome.guestName` заданим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через browser proxy вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує поточну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback для чистого дуплексу.

## Примітки щодо встановлення

Типовий режим реального часу в Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Плагін використовує її команди `rec` і `play` для типового аудіомосту G.711 mu-law 8 кГц.
- `blackhole-2ch`: драйвер віртуального аудіо для macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet може маршрутизувати звук.

OpenClaw не постачає й не розповсюджує жоден із цих пакунків. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензується як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви створюєте інсталятор або appliance, який постачає BlackHole разом із OpenClaw, перегляньте умови ліцензування BlackHole в оригінальному джерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS плагін перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на з’єднаному вузлі, наприклад у Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується з помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований плагіну Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте його, коли участь через Chrome недоступна або коли потрібен резервний варіант дозвону телефоном. Google Meet має надавати номер для
дозвону та PIN для зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

Увімкніть плагін Voice Call на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // або встановіть "twilio", якщо Twilio має бути типовим варіантом
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Надайте облікові дані Twilio через середовище або конфігурацію. Змінні середовища дозволяють
не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації плагіна
не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio налаштовано, `googlemeet setup` містить успішні
перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч вимагає спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
використати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібне офіційне створення через API,
розпізнавання просторів або перевірки перед запуском через Meet Media API.

Доступ до API Google Meet використовує OAuth користувача: створіть OAuth-клієнт Google Cloud,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації плагіна Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
усе одно приєднуються через профіль Chrome, у якому виконано вхід, BlackHole/SoX
і підключений вузол, коли ви використовуєте участь через браузер. OAuth потрібен лише для офіційного шляху Google
Meet API: створення просторів зустрічей, розпізнавання просторів і запуск попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** підходить для особистих/тестових налаштувань; поки застосунок перебуває в режимі Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть OAuth client ID.
   - Тип застосунку: **Web application**.
   - Дозволений URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте client ID і client secret.

`meetings.space.created` є обов’язковою областю доступу для Google Meet `spaces.create`.
`meetings.space.readonly` дозволяє OpenClaw розпізнавати URL-адреси/коди Meet як простори.
`meetings.conference.media.readonly` призначена для попередніх перевірок Meet Media API та роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і за потреби `oauth.clientSecret` або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

Приклади:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Використовуйте ручний режим, коли браузер не може досягти локального callback:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON-вивід містить:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Збережіть об’єкт `oauth` у конфігурації плагіна Google Meet:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Надавайте перевагу змінним середовища, якщо не хочете зберігати refresh token у конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, плагін спочатку використовує конфігурацію,
а потім резервні значення середовища.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ
на читання медіа конференцій Meet. Якщо ви проходили автентифікацію до появи підтримки
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав область доступу `meetings.space.created`.

### Перевірка OAuth через doctor

Запустіть doctor для OAuth, коли потрібна швидка, безпечна для секретів перевірка стану:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує середовище виконання Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує та що refresh token може створити access
token. JSON-звіт містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований access token.           |
| `oauth-token`        | Кешований access token усе ще чинний, або refresh token створив новий access token.     |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` розпізнала наявний простір Meet.                    |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API і область доступу `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте цю перевірку, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` у цих перевірках
зазвичай означає, що Google Meet REST API вимкнено, у refresh token, на який було надано згоду,
бракує потрібної області доступу або обліковий запис Google не має доступу до цього простору Meet. Помилка refresh token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі Google
auth походить із профілю Chrome, у якому виконано вхід, на вибраному вузлі, а не з
конфігурації OpenClaw.

Як резервні варіанти підтримуються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розпізнайте URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Перелічіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Із `--meeting` команди `artifacts` і `attendance` за замовчуванням використовують
останній запис конференції. Передайте `--all-conference-records`, якщо хочете отримати всі збережені записи
для цієї зустрічі.

Пошук у календарі може розпізнати URL-адресу зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar з
посиланням Google Meet. Використовуйте `--event <query>` для пошуку відповідного тексту події, а `--calendar <id>` — для календаря, відмінного від primary. Пошук у календарі вимагає
свіжого входу OAuth, що включає область доступу лише для читання подій Calendar.
`calendar-events` попередньо показує відповідні події Meet і позначає подію, яку
виберуть `latest`, `artifacts`, `attendance` або `export`.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього безпосередньо:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Запишіть зрозумілий звіт:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, запису, стенограми,
структурованих записів стенограми та smart-note, коли Google надає їх для
зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
прапорцями запізнення/раннього виходу та об’єднанням дублікатів ресурсів учасників за
користувачем, у якому виконано вхід, або відображуваним іменем. Передайте `--no-merge-duplicates`, щоб залишити сирі ресурси учасників
окремими, `--late-after-minutes` для налаштування виявлення запізнення та
`--early-before-minutes` для налаштування виявлення раннього виходу.

`export` записує теку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` і `manifest.json`.
`manifest.json` фіксує вибране джерело вводу, параметри експорту, записи конференції,
вихідні файли, лічильники, джерело токена, подію Calendar, коли вона використовувалася, а також
будь-які попередження про часткове отримання. Передайте `--zip`, щоб також записати переносний архів поруч із текою. Передайте `--include-doc-bodies`, щоб експортувати текст пов’язаних Google Docs стенограми та smart-note через Google Drive `files.export`; для цього потрібен
свіжий вхід OAuth, який включає область доступу лише для читання Drive Meet. Без
`--include-doc-bodies` експорти включають лише метадані Meet і структуровані
записи стенограми. Якщо Google повертає часткову помилку артефакту, наприклад помилку
списку smart-note, запису стенограми або тіла документа Drive, підсумок і
маніфест зберігають попередження замість зупинки всього експорту.
Використовуйте `--dry-run`, щоб отримати ті самі дані артефактів/відвідуваності та вивести
JSON-маніфест без створення теки чи ZIP. Це корисно перед записом
великого експорту або коли агенту потрібні лише лічильники, вибрані записи та
попередження.

Агенти також можуть створити той самий набір через інструмент `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Установіть `"dryRun": true`, щоб повернути лише маніфест експорту й пропустити запис файлів.

Запустіть захищений live smoke для реальної збереженої зустрічі:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Середовище live smoke:

- `OPENCLAW_LIVE_TEST=1` вмикає захищені live-тести.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` вказує на збережену URL-адресу Meet, код або
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID` надає OAuth
  client id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN` надає
  refresh token.
- Необов’язково: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` і
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` використовують ті самі резервні назви
  без префікса `OPENCLAW_`.

Базовий live smoke для артефактів/відвідуваності потребує
`https://www.googleapis.com/auth/meetings.space.readonly` і
`https://www.googleapis.com/auth/meetings.conference.media.readonly`. Пошук у Calendar
потребує `https://www.googleapis.com/auth/calendar.events.readonly`. Експорт
тіла документів Drive потребує
`https://www.googleapis.com/auth/drive.meet.readonly`.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності облікових даних OAuth
вона використовує офіційний API Google Meet. Без облікових даних OAuth вона
використовує як резервний варіант профіль браузера, у якому виконано вхід, на закріпленому вузлі Chrome. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

Приклад JSON-виводу з резервного варіанта через браузер:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Якщо резервний варіант через браузер натрапляє на вхід у Google або блокування дозволів Meet до того, як
він зможе створити URL-адресу, метод Gateway повертає невдалу відповідь, а
інструмент `google_meet` повертає структуровані дані замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google у профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google у профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Вхід — Google Accounts"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має повідомити
`manualActionMessage` разом із контекстом вузла/вкладки браузера й припинити відкривати нові
вкладки Meet, доки оператор не виконає крок у браузері.

Приклад JSON-виводу зі створення через API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Створення Meet за замовчуванням одразу приєднується. Транспорт Chrome або Chrome-node усе ще
потребує профілю Google Chrome, у якому виконано вхід, щоб приєднатися через браузер. Якщо
у профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанта браузера й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, OAuth-принципал і учасники зустрічі зареєстровані в програмі Google
Workspace Developer Preview Program для медіа API Meet.

## Конфігурація

Загальний шлях Chrome у режимі реального часу потребує лише ввімкненого плагіна, BlackHole, SoX
і ключа провайдера голосу реального часу в бекенді. OpenAI використовується за замовчуванням; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

Установіть конфігурацію плагіна в `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Типові значення:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на сторінці гостя Meet
  без входу
- `chrome.autoJoin: true`: найкраща спроба заповнити ім’я гостя та натиснути Join Now
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call
  перед запуском вступу в режимі реального часу
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law 8 кГц
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо G.711 mu-law 8 кГц
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу
  підключається; установіть `""`, щоб приєднуватися беззвучно

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Скажи дослівно: Я тут.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Конфігурація лише для Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` за замовчуванням має значення `true`; із транспортом Twilio він делегує
фактичний PSTN-виклик і DTMF плагіну Voice Call. Якщо `voice-call` не ввімкнено,
Google Meet все одно може перевіряти й записувати план набору, але не може
здійснити виклик Twilio.

## Інструмент

Агенти можуть використовувати інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте
`transport: "chrome-node"`, коли Chrome працює на з’єднаному вузлі, наприклад у Parallels
VM. В обох випадках модель реального часу та `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити id сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент реального часу
негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
його повідомити. Використовуйте `action: "leave"`, щоб позначити завершення сеансу.

`status` включає стан Chrome, коли він доступний:

- `inCall`: схоже, Chrome перебуває всередині виклику Meet
- `micMuted`: найкраща спроба визначити стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хостом Meet, дозволів або відновлення
  керування браузером, перш ніж мовлення запрацює
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого з мосту або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи дослівно: Я тут і слухаю."
}
```

## Консультація агента в режимі реального часу

Режим Chrome у реальному часі оптимізовано для живого голосового циклу. Провайдер голосу
реального часу чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі реального часу потрібні глибші міркування, поточна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавньої стенограми зустрічі та повертає стислу усну відповідь до сеансу
голосу реального часу. Потім голосова модель може озвучити цю відповідь у зустрічі.
Він використовує той самий спільний інструмент консультації реального часу, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показати інструмент консультації та обмежити звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показати інструмент консультації та дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу реального часу.

Ключ сеансу консультації має область дії для кожного сеансу Meet, тому подальші виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднається до виклику:

```bash
openclaw googlemeet speak meet_... "Скажи дослівно: Я тут і слухаю."
```

Для повного smoke-тесту приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність перед передаванням зустрічі автономному агенту:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- У `googlemeet setup` усе зелене.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  типовим транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад Parallels macOS VM, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що плагін Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
реальну вкладку зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка надає дані для телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin` і
  `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернутий сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що плагін увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти плагінів, зареєстровані поточним процесом Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway схваліть вузол і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Вузол має бути підключеним і містити `googlemeet.chrome` та `browser.proxy`.
Конфігурація Gateway має дозволяти ці команди вузла:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Якщо `googlemeet setup` завершується невдачею на `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway.
Для Gateway у LAN це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу вузла та знову виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть `manualActionMessage` оператору
й припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит
  дозволу Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте «вхід не виконано» лише тому, що Meet показує «Do you want people to
hear you in the meeting?» Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує
чекати реального стану зустрічі. Для резервного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL-адреси не потребує
аудіошляху реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує кінцеву точку Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до резервного варіанта через браузер закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання
  підтримки створення. Старим токенам може бракувати області доступу `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль Chrome OpenClaw на цьому вузлі має бути
  увійденим у Google і мати змогу відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищив час очікування,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб скерувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанта через браузер: якщо Meet показує «Do you want people to hear you in the
  meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через автоматизацію
  браузера і продовжити очікування згенерованої URL-адреси Meet. Якщо це не вдається, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст реального часу.

Також перевірте:

- На хості Gateway доступний ключ провайдера реального часу, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовані через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан in-call,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність
аудіовводу/виводу, часові мітки останнього аудіо, лічильники байтів і URL-адресу браузера.
Використовуйте `googlemeet status [session-id]`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення OAuth Google Meet
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне підтвердження через Google Meet API.

Якщо агент перевищив час очікування і ви вже бачите відкриту вкладку Meet, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона переводить фокус на
наявну вкладку Meet на налаштованому вузлі Chrome і перевіряє її. Вона не відкриває нову вкладку й не
створює новий сеанс; вона повідомляє про поточну перешкоду, наприклад вхід,
допуск, дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого
Gateway, тому Gateway має бути запущений, а вузол Chrome має бути підключений.

### Помилки перевірок налаштування Twilio

`twilio-voice-call-plugin` завершується невдачею, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується невдачею, коли в бекенді Twilio відсутні account
SID, auth token або номер абонента. Установіть їх на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` за замовчуванням перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви свідомо хочете здійснити реальний вихідний
виклик-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet надає дані для телефонного дозвону. Передайте точний номер
для дозвону та PIN або спеціальну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа API Google Meet орієнтований на прийом, тому для мовлення у виклику Meet
усе ще потрібен шлях участі як учасника. Цей плагін залишає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Для режиму Chrome у реальному часі потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі реального часу й передає аудіо G.711 mu-law 8 кГц між цими
  командами та вибраним провайдером голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вивід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через плагін Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Плагін Voice call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
