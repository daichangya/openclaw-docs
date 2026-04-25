---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-25T03:16:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f185428fb096ef42aa0ccb0058784d02f0f097fcd253abdbf9897f5f9b527d
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — Plugin навмисно є явним за своєю логікою:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненою URL-адресою.
- Голосовий режим `realtime` є типовим режимом.
- Голосовий режим реального часу може повертатися до повноцінного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного голосового зв’язку або `transcribe`, щоб приєднатися/керувати браузером без мосту голосу реального часу.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Швидкий початок

Установіть локальні аудіозалежності та налаштуйте постачальника голосу реального часу для бекенда. OpenAI використовується типово; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew вимагає перезавантаження, перш ніж macOS зробить пристрій доступним:

```bash
sudo reboot
```

Після перезавантаження перевірте обидві складові:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Увімкніть Plugin:

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

Вивід налаштування призначений для читання агентом. У ньому повідомляється про профіль Chrome, аудіоміст, прив’язку до вузла, відкладений вступ `realtime`, а також, коли налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio. Будь-яку перевірку з `ok: false` слід вважати блокером, перш ніж просити агента приєднатися. Для сценаріїв або машиночитаного виводу використовуйте `openclaw googlemeet setup --json`.

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

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найбільш детермінований шлях, і він не залежить від стану інтерфейсу браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на справжню URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Для цього шляху потрібно, щоб у профілі OpenClaw Chrome на вузлі вже було виконано вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит не вважається помилкою входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям нової. Під час зіставлення ігноруються нешкідливі рядки запиту URL, як-от `authuser`, тому повторна спроба агента має перевести фокус на вже відкриту зустріч, а не створити другу вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та повертає `joined: true` разом із сеансом приєднання. Щоб лише створити URL, використовуйте `create --no-join` у CLI або передайте `"join": false` до інструмента.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом у режимі realtime і надішли мені посилання." Агент має викликати `google_meet` з `action: "create"`, а потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не запускає дуплексний міст моделі реального часу, тому він не говоритиме назад у зустріч.

Під час сеансів `realtime` статус `google_meet` включає стан браузера та аудіомоста, зокрема `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, часові позначки останнього входу/виходу, лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet, автоматизація браузера обробляє його, коли це можливо. Запити на вхід, допуск від хоста та дозволи браузера/ОС повідомляються як ручна дія з причиною та повідомленням, яке агент має передати.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть вузол у VM. Один раз увімкніть у VM вбудований Plugin, щоб вузол рекламував команду Chrome:

Що запускається де:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник `realtime` і конфігурація Plugin Google Meet.
- macOS VM у Parallels: OpenClaw CLI/вузол, Google Chrome, SoX, BlackHole 2ch і профіль Chrome, у якому виконано вхід у Google.
- Не потрібні у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузол у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса в LAN і ви не використовуєте TLS, вузол відхиляє відкритий WebSocket, якщо ви явно не дозволите це для довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, коли вона присутня в команді встановлення.

Підтвердьте вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей вузол на хості Gateway:

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

Тепер приєднуйтеся як зазвичай із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит. Під час створення зустрічі лише через браузер вона також може пройти далі через той самий запит без мікрофона, якщо Meet не показує кнопку використання мікрофона. Якщо в профілі браузера не виконано вхід, Meet очікує допуску від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet завис на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторні спроби приєднання, передати саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли підключено рівно один вузол, який рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте сполучення і переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у профіль браузера всередині VM або залиште `chrome.guestName` встановленим для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште ввімкненим `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new`, що вже виконується, або вкладку запиту облікового запису Google перед відкриттям ще однієї.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback.

## Примітки щодо встановлення

Типовий режим realtime у Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомоста 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакунків. У документації користувачам пропонується встановити їх як залежності хоста через Homebrew. SoX ліцензується як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви створюєте інсталятор або appliance, що містить BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole у першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у macOS VM у Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування, а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план дозвону, делегований Plugin Voice Call. Він не аналізує сторінки Meet, щоб знайти телефонні номери.

Використовуйте це, коли участь через Chrome недоступна або коли вам потрібен резервний варіант дозвону телефоном. Google Meet має надавати номер для телефонного дозвону та PIN для зустрічі; OpenClaw не виявляє їх на сторінці Meet.

Увімкніть Plugin Voice Call на хості Gateway, а не на вузлі Chrome:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище дозволяє не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки його не буде перезавантажено.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth не є обов’язковим для створення посилання Meet, оскільки `googlemeet create` може використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API, визначення простору або перевірки попереднього запуску Meet Media API.

Доступ до Google Meet API спочатку використовує персональний клієнт OAuth. Налаштуйте `oauth.clientId` і, за бажанням, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, локальний callback за адресою `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Згода OAuth включає створення просторів Meet, доступ на читання простору Meet і доступ на читання медіаданих конференцій Meet. Якщо ви проходили автентифікацію до появи підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб токен оновлення мав область дії `meetings.space.created`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google походить із профілю Chrome, у якому виконано вхід, на вибраному вузлі, а не з конфігурації OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності облікових даних OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує профіль браузера, у якому виконано вхід, на закріпленому вузлі Chrome як резервний варіант. Агенти можуть використовувати інструмент `google_meet` з `action: "create"`, щоб створити та приєднатися за один крок. Для створення лише URL передайте `"join": false`.

Приклад JSON-виводу для резервного варіанта через браузер:

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

Приклад JSON-виводу для створення через API:

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

Створення Meet типово також приєднує до нього. Транспорт Chrome або Chrome-node усе одно потребує профілю Google Chrome, у якому виконано вхід, щоб приєднатися через браузер. Якщо в профілі не виконано вхід, OpenClaw повідомляє `manualActionRequired: true` або помилку резервного варіанта браузера й просить оператора завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширеному шляху realtime через Chrome потрібні лише ввімкнений Plugin, BlackHole, SoX і ключ постачальника голосу реального часу для бекенда. OpenAI використовується типово; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Установіть конфігурацію Plugin у `plugins.entries.google-meet.config`:

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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet, коли вхід не виконано
- `chrome.autoJoin: true`: best-effort заповнення імені гостя та натискання Join Now через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про перебування у виклику, перш ніж буде активовано вступ `realtime`
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо 8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо 8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для складніших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст realtime; установіть `""`, щоб приєднатися беззвучно

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
    introMessage: "Say exactly: I'm here.",
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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує фактичний PSTN-виклик і DTMF Plugin Voice Call. Якщо `voice-call` не ввімкнено, Google Meet все одно може перевірити та зафіксувати план дозвону, але не може виконати виклик Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у VM Parallels. В обох випадках модель realtime і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити id сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime негайно заговорити. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, відтворити відому фразу та повернути стан `inCall`, якщо хост Chrome може його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, якщо він доступний:

- `inCall`: схоже, що Chrome перебуває всередині виклику Meet
- `micMuted`: best-effort стан мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю браузера потрібен ручний вхід, допуск від хоста Meet, дозволи або відновлення керування браузером, перш ніж запрацює мовлення
- `providerConnected` / `realtimeReady`: стан голосового моста realtime
- `lastInputAt` / `lastOutputAt`: коли востаннє аудіо надходило до моста або надсилалося з нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація з агентом realtime

Режим realtime для Chrome оптимізований для живого голосового циклу. Постачальник голосу реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі realtime потрібні глибші міркування, поточна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом недавньої розшифровки зустрічі й повертає стислу усну відповідь у голосовий сеанс realtime. Потім голосова модель може озвучити цю відповідь назад у зустріч. Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: відкривати інструмент consult і обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: відкривати інструмент consult і дозволяти звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не відкривати інструмент consult для голосової моделі realtime.

Ключ сеансу consult має область дії на рівні сеансу Meet, тому подальші виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднається до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke-тесту приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live-тесту

Використовуйте цю послідовність, перш ніж передати зустріч агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є типовим транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з `inCall: true`.

Для віддаленого хоста Chrome, такого як macOS VM у Parallels, це найкоротша безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з поточним токеном, а аудіоміст Meet доступний ще до того, як агент відкриє справжню вкладку зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка надає дані для телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` містить зелені перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише ті інструменти Plugin, які зареєстровані поточним процесом Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На хості вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На хості Gateway підтвердьте вузол і перевірте команди:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Вузол має бути підключений і містити `googlemeet.chrome` та `browser.proxy`.
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

Якщо `googlemeet setup` не проходить перевірку `chrome-node-connected` або в журналі Gateway повідомляється про `gateway token mismatch`, перевстановіть або перезапустіть вузол із поточним токеном Gateway. Для Gateway у LAN це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу вузла і знову виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо там указано `manualActionRequired: true`, покажіть оператору `manualActionMessage` і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Виконати вхід у профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється нативний запит дозволів Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте "вхід не виконано" лише тому, що Meet показує "Do you want people to hear you in the meeting?". Це проміжний екран вибору аудіо в Meet; OpenClaw натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує чекати на справжній стан зустрічі. Для резервного варіанта створення лише через браузер OpenClaw може натиснути **Continue without microphone**, оскільки для створення URL аудіошлях realtime не потрібен.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує кінцеву точку Google Meet API `spaces.create`, коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного варіанта через браузер закріпленого вузла Chrome. Підтвердьте таке:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`, або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: токен оновлення було створено після додавання підтримки створення. У старих токенах може бракувати області дії `meetings.space.created`; повторно виконайте `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і `chromeNode.node` вказують на підключений вузол із `browser.proxy` і `googlemeet.chrome`.
- Для резервного варіанта через браузер: у профілі OpenClaw Chrome на цьому вузлі виконано вхід у Google, і він може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new` або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищив час очікування, повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для резервного варіанта лише створення, **Continue without microphone** через автоматизацію браузера і продовжити очікування згенерованої URL-адреси Meet. Якщо це неможливо, у помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно не запускає дуплексний голосовий міст realtime.

Також перевірте:

- На хості Gateway доступний ключ постачальника realtime, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через шлях віртуального аудіо, який використовує OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан перебування у виклику, причину ручної дії, підключення постачальника realtime, `realtimeReady`, активність аудіовходу/аудіовиходу, часові позначки останнього аудіо, лічильники байтів і URL браузера. Використовуйте `googlemeet status [session-id]`, коли вам потрібен сирий JSON.

Якщо в агента перевищився час очікування і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку, не відкриваючи нову:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона переводить фокус на наявну вкладку Meet на налаштованому вузлі Chrome і перевіряє її. Вона не відкриває нову вкладку і не створює новий сеанс; вона повідомляє про поточний блокер, наприклад вхід, допуск, дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого Gateway, тому Gateway має бути запущений, а вузол Chrome — підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить перевірку, коли `voice-call` не дозволено або не ввімкнено. Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` не проходить перевірку, коли в бекенді Twilio відсутні account SID, auth token або номер абонента. Установіть їх на хості Gateway:

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

`voicecall smoke` типово перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви свідомо хочете виконати реальний вихідний сповіщувальний виклик:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet надає дані для телефонного дозвону. Передайте точний номер дозвону та PIN або спеціальну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо постачальнику потрібна пауза перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення у виклику Meet усе одно потрібен шлях через учасника. Цей Plugin зберігає цю межу видимою: Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за участь через телефонний дозвін.

Режиму realtime для Chrome потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими командами та вибраним постачальником голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста повністю керує локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
