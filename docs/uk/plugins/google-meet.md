---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T22:14:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2438d52c6a3c98e9d2aa345790b72475bc26c3497580d6af15b6df221705864a
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно зроблено явним:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненим URL.
- Голос `realtime` є режимом за замовчуванням.
- Голос realtime може викликати назад повноцінного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Агенти вибирають поведінку приєднання через `mode`: використовуйте `realtime` для живого прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без мосту голосу realtime.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдера голосу realtime. OpenAI є типовим варіантом; Google Gemini Live також працює з `realtime.provider: "google"`:

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

Після перезавантаження перевірте обидві частини:

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

Вивід налаштування призначено для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, прив’язку до вузла, відкладений вступ realtime, а також, коли налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio. Будь-яку перевірку `ok: false` слід вважати блокувальним фактором, перш ніж просити агента приєднатися.
Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного виводу.

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

Створіть нову зустріч, а потім приєднайтеся до неї:

```bash
openclaw googlemeet create
openclaw googlemeet join https://meet.google.com/new-abcd-xyz --transport chrome-node
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найдетермінованіший шлях, який не залежить від стану інтерфейсу браузера.
- Запасний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на справжній URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб у профілі OpenClaw Chrome на вузлі вже був виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на мікрофон; цей запит не вважається помилкою входу в Google.

Вивід команди містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом realtime і надішли мені посилання." Агент має викликати `google_meet` з `action: "create"`, скопіювати повернений `meetingUri`, потім викликати `google_meet` з `action: "join"` і цим URL.

```json
{
  "action": "create"
}
```

```json
{
  "action": "join",
  "url": "https://meet.google.com/new-abcd-xyz",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це не запускає двобічний міст моделі realtime, тому він не відповідатиме голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може бути відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть вузол на хості у VM. Один раз увімкніть у VM вбудований Plugin, щоб вузол рекламував команду Chrome:

Що і де запускається:

- Хост Gateway: Gateway OpenClaw, робочий простір агента, ключі моделі/API, провайдер realtime і конфігурація Plugin Google Meet.
- Parallels macOS VM: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch і профіль Chrome із виконаним входом у Google.
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там вбудований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть вузол у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхилить plaintext WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent, коли воно присутнє в команді встановлення.

Схваліть вузол із хоста Gateway:

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

Тепер приєднуйтеся звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сесію, вимовляє відому фразу та виводить стан сесії:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит. Під час створення зустрічі лише через браузер вона також може продовжити після того самого запиту без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо в профілі браузера не виконано вхід, Meet очікує допуску від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на запиті, який автоматизація не змогла вирішити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити саме це повідомлення плюс поточні `browserUrl`/`browserTitle`, і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на ідентифікатор вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення та переконайтеся, що у VM виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште ввімкненим `chrome.guestName` для гостьового приєднання. Автоматичне приєднання гостя використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або профіль named existing-session.
- Дубльовані вкладки Meet: залиште ввімкненим `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямовуйте мікрофон і динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; для чистого двобічного аудіо використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback.

## Примітки щодо встановлення

Типовий режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомосту G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів у комплекті. Документація просить користувачів установити їх як залежності хоста через Homebrew. SoX ліцензується як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole від першоджерела або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування, а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet, щоб знайти номери телефонів.

Використовуйте його, коли участь через Chrome недоступна або коли вам потрібен резервний варіант через телефонний дозвін. Google Meet має надавати номер для дозвону та PIN для зустрічі;
OpenClaw не виявляє їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище не дає
секретам потрапити до `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни
конфігурації Plugin не з’являються в уже запущеному процесі Gateway, доки він не перезавантажиться.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio налаштоване, `googlemeet setup` містить успішні
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
використовувати запасний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API,
визначення простору або перевірки preflight Meet Media API.

Доступ до API Google Meet спочатку використовує особистий клієнт OAuth. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
зворотний виклик localhost на `http://localhost:8085/oauth2callback` і ручний
процес копіювання/вставлення з `--manual`.

Згода OAuth включає створення просторів Meet, доступ на читання просторів Meet і доступ
на читання медіаданих конференцій Meet. Якщо ви автентифікувалися до появи
підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав область `meetings.space.created`.

Для запасного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться з профілю Chrome із виконаним входом на вибраному вузлі, а не з
конфігурації OpenClaw.

Як запасні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте URL Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть preflight перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri` і джерело. За наявності облікових даних OAuth вона
використовує офіційний API Google Meet. Без облікових даних OAuth вона використовує
профіль браузера із виконаним входом на закріпленому вузлі Chrome як запасний варіант. Агенти можуть використовувати
інструмент `google_meet` з `action: "create"` для створення зустрічі, а потім викликати
`action: "join"` з поверненим `meetingUri`.

Приклад JSON-виводу для запасного варіанта через браузер:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  }
}
```

Приклад JSON-виводу для створення через API:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  }
}
```

Створення Meet лише створює або виявляє URL зустрічі. Транспорт Chrome або
Chrome-node все одно потребує профілю Google Chrome із виконаним входом, щоб приєднатися
через браузер. Якщо з профілю виконано вихід, OpenClaw повідомляє
`manualActionRequired: true` або помилку запасного варіанта через браузер і просить оператора
завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Для типового шляху Chrome realtime достатньо ввімкненого Plugin, BlackHole, SoX
і ключа бекенд-провайдера голосу realtime. OpenAI використовується за замовчуванням; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet без виконаного входу
- `chrome.autoJoin: true`: спроба заповнення імені гостя та натискання Join Now через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, доки вкладка Meet не повідомить, що перебуває в дзвінку,
  перед запуском вступу realtime
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law 8 кГц
  до stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо G.711 mu-law 8 кГц
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст realtime;
  установіть `""`, щоб приєднатися беззвучно

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

`voiceCall.enabled` за замовчуванням має значення `true`; з транспортом Twilio він делегує
фактичний PSTN-дзвінок і DTMF Plugin Voice Call. Якщо `voice-call` не ввімкнено,
Google Meet усе одно може перевірити й записати план набору, але не може
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
`transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у Parallels
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте
`action: "speak"` з `sessionId` і `message`, щоб змусити агента realtime
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сесію,
запустити відому фразу та повернути стан `inCall`, коли хост Chrome може
його повідомити. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet за найкращою спробою
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю браузера потрібен ручний вхід, допуск хостом Meet, дозволи або виправлення керування браузером, перш ніж зможе працювати мовлення
- `providerConnected` / `realtimeReady`: стан моста голосу realtime
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Провайдер голосу realtime
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибше міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації непомітно запускає звичайного агента OpenClaw з недавнім контекстом
транскрипту зустрічі та повертає стислу усну відповідь до голосової сесії realtime. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: відкрити інструмент консультації та обмежити звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: відкрити інструмент консультації та дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не відкривати інструмент консультації для голосової моделі realtime.

Ключ сесії консультації має область дії на кожну сесію Meet, тож наступні виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

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

Використовуйте цю послідовність перед передачею зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для smoke-тесту Twilio використовуйте зустріч, яка надає дані телефонного дозвону:

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
- Повернена сесія має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом Gateway.

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

Вузол має бути підключений і показувати `googlemeet.chrome` разом із `browser.proxy`.
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

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний
  системний запит дозволу Chrome.
- Закрити або виправити завислий діалог дозволів Meet.

Не повідомляйте "вхід не виконано" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це доступно, і продовжує
очікувати справжнього стану зустрічі. Для запасного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
аудіошляху realtime.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint `spaces.create` API Google Meet,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до запасного варіанта через браузер закріпленого вузла Chrome. Переконайтеся:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання
  підтримки create. Старіші токени можуть не мати області `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для запасного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для запасного варіанта через браузер: профіль OpenClaw Chrome на цьому вузлі має виконаний вхід
  у Google і може відкривати `https://meet.google.com/new`.
- Для запасного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  запасного варіанта лише створення, **Continue without microphone** через автоматизацію
  браузера і продовжити очікування згенерованого URL Meet. Якщо це не вдається, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає двобічний міст голосу realtime.

Також перевірте:

- На хості Gateway доступний ключ провайдера realtime, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли у бекенда Twilio відсутні account
SID, auth token або номер абонента. Установіть це на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Виклик Twilio починається, але ніколи не входить у зустріч

Переконайтеся, що подія Meet надає деталі телефонного дозвону. Передайте точний номер
для дозвону та PIN або спеціальну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тож для мовлення в дзвінку
Meet усе одно потрібен шлях участі. Цей Plugin зберігає цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio — за
участь через телефонний дозвін.

Режим Chrome realtime потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо G.711 mu-law 8 кГц між цими
  командами та вибраним провайдером голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet speak` запускає активний міст аудіо realtime для сесії Chrome.
`googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих через Plugin
Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
