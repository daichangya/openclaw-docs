---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними параметрами realtime voice'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T23:07:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c12bc2abf8a9bddc56f1fc281e1f7d628ff10d1bcfc99541cd7a085eac017544
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin навмисно є явним за дизайном:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненим URL.
- Голосовий режим `realtime` є режимом за замовчуванням.
- Realtime voice може повертатися до повноцінного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без мосту realtime voice.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на з’єднаному вузлі.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв телеконференцій агентів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте бекенд-провайдер realtime voice.
OpenAI використовується за замовчуванням; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew вимагає перезавантаження, перш ніж macOS покаже цей пристрій:

```bash
sudo reboot
```

Після перезавантаження перевірте обидва компоненти:

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

Вивід setup призначений для читання агентом. Він повідомляє про профіль Chrome,
аудіоміст, закріплення вузла, відкладений вступ realtime, а також, коли налаштовано
делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio.
Будь-яку перевірку з `ok: false` слід вважати блокувальною, перш ніж просити агента приєднатися.
Використовуйте `openclaw googlemeet setup --json` для сценаріїв або машиночитного виводу.

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
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на справжній URL з кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб профіль Chrome OpenClaw на вузлі вже мав виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на використання мікрофона; цей запит не вважається помилкою входу в Google.

Вивід команди містить поле `source` (`api` або `browser`), щоб агенти могли
пояснити, який шлях було використано.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з realtime voice і надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"`, скопіювати
повернений `meetingUri`, а потім викликати `google_meet` з `action: "join"` і
цим URL.

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

Для приєднання лише зі спостереженням/керуванням браузером встановіть `"mode": "transcribe"`. Це
не запускає двосторонній міст моделі realtime, тому він не буде відповідати
голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двостороннього аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole
достатньо для першого димового тесту, але може виникати ехо.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім
запустіть хост вузла у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол
рекламував команду Chrome:

Що і де запускається:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, realtime
  провайдер і конфігурація Plugin Google Meet.
- macOS VM у Parallels: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування
  провайдера моделі.

Установіть залежності VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS показала `BlackHole 2ch`:

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

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхиляє
незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час установлення вузла як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не
параметр `openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли він присутній у команді встановлення.

Схваліть вузол з хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує як `googlemeet.chrome`,
так і можливість браузера/`browser.proxy`:

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

Для однокомандного димового тесту, який створює або повторно використовує сеанс,
вимовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask
to join і приймає початковий вибір Meet «Use microphone», коли цей запит з’являється.
Під час створення зустрічі лише через браузер вона також може продовжити після
того самого запиту без мікрофона, якщо Meet не показує кнопку use-microphone.
Якщо в профілі браузера не виконано вхід, Meet чекає на
допуск від організатора, Chrome потребує дозволу на мікрофон/камеру або Meet завис
на запиті, який автоматизація не змогла вирішити, результат join/test-speech повідомляє
`manualActionRequired: true` разом із `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання,
повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle`
і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає вузол лише тоді, коли
рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька сумісних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть з’єднання та переконайтеся, що у VM були виконані
  `openclaw plugins enable google-meet` і `openclaw plugins enable browser`.
  Також підтвердьте, що хост Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у профіль браузера всередині VM або
  залиште `chrome.guestName` встановленим для гостьового приєднання. Гостьове auto-join використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а
  створення зустрічі через браузер повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google, перш ніж відкривати ще одну.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двостороннього аудіо.

## Примітки щодо встановлення

Стандартний режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play`
  для стандартного аудіомосту 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який можуть маршрутизуватися Chrome/Meet.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. Документація просить користувачів
установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви створюєте
інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте
вихідні умови ліцензування BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome,
у якому виконано вхід. У macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском.
Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на з’єднаному вузлі, наприклад у Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуку телефонних номерів.

Використовуйте його, коли участь через Chrome недоступна або коли потрібен резервний
варіант дозвону телефоном. Google Meet має показувати номер для телефонного дозвону та PIN для
зустрічі; OpenClaw не виявляє їх зі сторінки Meet.

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
          // або встановіть "twilio", якщо Twilio має бути транспортом за замовчуванням
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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище дає змогу
не зберігати секрети в `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з’являються в уже запущеному процесі Gateway, доки він не буде перезавантажений.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні перевірки
`twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

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

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API,
розв’язання простору або попередні перевірки Meet Media API.

Доступ до Google Meet API спочатку використовує персональний OAuth-клієнт. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE,
localhost callback на `http://localhost:8085/oauth2callback` і ручний
процес копіювання/вставлення з `--manual`.

OAuth consent включає створення просторів Meet, доступ на читання просторів Meet і
доступ на читання медіаданих конференцій Meet. Якщо ви проходили автентифікацію до появи
підтримки створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh
token мав область дії `meetings.space.created`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
береться із профілю Chrome, у якому виконано вхід, на вибраному вузлі, а не з конфігурації
OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть URL Meet, код або `spaces/{id}` через `spaces.get`:

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

Команда виводить новий `meeting uri` і джерело. За наявності облікових даних OAuth вона
використовує офіційний Google Meet API. Без облікових даних OAuth вона використовує
профіль браузера з виконаним входом на закріпленому вузлі Chrome як резервний варіант. Агенти можуть використовувати
інструмент `google_meet` з `action: "create"` для створення зустрічі, а потім викликати
`action: "join"` з поверненим `meetingUri`.

Приклад JSON-виводу з резервного варіанта через браузер:

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

Приклад JSON-виводу зі створення через API:

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

Створення Meet лише створює або знаходить URL зустрічі. Транспорт Chrome або
Chrome-node усе одно потребує профілю Google Chrome з виконаним входом, щоб приєднатися
через браузер. Якщо в профілі виконано вихід, OpenClaw повідомляє
`manualActionRequired: true` або помилку резервного варіанта браузера й просить оператора
завершити вхід у Google перед повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширений шлях Chrome realtime потребує лише ввімкненого Plugin, BlackHole, SoX
і ключа бекенд-провайдера realtime voice. OpenAI використовується за замовчуванням; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# або
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

Значення за замовчуванням:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet
  без виконаного входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now у режимі best-effort
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call
  перед запуском вступу realtime
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо 8 кГц G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо 8 кГц G.711 mu-law
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі голосові відповіді з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка голосова перевірка готовності, коли realtime bridge
  підключається; встановіть `""`, щоб приєднуватися беззвучно

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
    introMessage: "Скажи точно: Я тут.",
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
фактичний PSTN-виклик і DTMF до Plugin Voice Call. Якщо `voice-call` не ввімкнено,
Google Meet все ще може перевіряти та записувати план набору, але не може
здійснювати виклик Twilio.

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
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити realtime-агента
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу та повернути стан `inCall`, коли хост Chrome може його повідомити. Використовуйте
`action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet у режимі best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск організатора Meet, дозволи або відновлення
  керування браузером, перш ніж запрацює мовлення
- `providerConnected` / `realtimeReady`: стан моста realtime voice
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи точно: Я тут і слухаю."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Провайдер realtime voice
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом
нещодавньої транскрипції зустрічі та повертає стислу голосову відповідь до сеансу
realtime voice. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надавати інструмент консультації та обмежувати звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надавати інструмент консультації та дозволяти звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надавати інструмент консультації моделі realtime voice.

Ключ сеансу консультації має область дії в межах окремого сеансу Meet, тому подальші
виклики консультації можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

Щоб примусово виконати голосову перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Скажи точно: Я тут і слухаю."
```

Для повного димового тесту приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Скажи точно: Я тут і слухаю."
```

## Контрольний список живого тесту

Використовуйте цю послідовність перед передаванням зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Скажи точно: Тест мовлення Google Meet завершено."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для димового тесту Twilio використовуйте зустріч, яка показує деталі телефонного дозвону:

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
- Повернений сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin ввімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
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

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису організатора Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит
  дозволів Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте «не виконано вхід» лише тому, що Meet показує «Do you want people to
hear you in the meeting?». Це проміжний екран вибору аудіо Meet; OpenClaw натискає **Use microphone**
через автоматизацію браузера, коли це можливо, і продовжує чекати на справжній стан зустрічі.
Для резервного варіанта браузера лише для створення OpenClaw може натиснути **Continue without microphone**,
оскільки для створення URL шлях realtime audio не потрібен.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує ендпоінт Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить
до резервного варіанта через браузер закріпленого вузла Chrome. Переконайтеся:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було видано після додавання підтримки
  створення. Старіші токени можуть не мати області дії `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` та
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль Chrome OpenClaw на цьому вузлі має виконаний вхід
  у Google і може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку
  `https://meet.google.com/new` або вкладку запиту облікового запису Google, перш ніж відкривати нову вкладку.
  Якщо агент завершує роботу за тайм-аутом, повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо Meet показує «Do you want people to hear you in the
  meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через автоматизацію
  браузера та продовжити очікування згенерованого URL Meet. Якщо це неможливо, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає двосторонній міст realtime voice.

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

`twilio-voice-call-credentials` не проходить, коли у бекенда Twilio немає account
SID, auth token або номера виклику. Установіть це на хості Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Виклик Twilio починається, але ніколи не входить до зустрічі

Переконайтеся, що подія Meet показує деталі телефонного дозвону. Передайте точний номер
для дозвону та PIN або спеціальну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на прийом, тому для мовлення в
дзвінок Meet усе одно потрібен шлях учасника. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режим Chrome realtime потребує одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним провайдером realtime voice.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати аудіо інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
