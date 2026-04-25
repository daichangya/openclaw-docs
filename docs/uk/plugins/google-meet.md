---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio зі стандартними параметрами голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-25T04:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57162f6a4de4ccbbfd6ec61c91e33c1aed1c9c523e30415ccf6c54dca1563aac
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin є навмисно явним за дизайном:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися до повернутого URL.
- Голос `realtime` є режимом за замовчуванням.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без мосту голосу в реальному часі.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Стандартний аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону плюс необов’язковий PIN-код або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів агентської телеконференції.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте постачальника голосу в реальному часі для бекенда. OpenAI використовується за замовчуванням; Google Gemini Live також працює з `realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew потребує перезавантаження, перш ніж macOS покаже цей пристрій:

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

Вивід налаштування призначений для читання агентом. У ньому повідомляється про профіль Chrome, аудіоміст, прив’язку до вузла, відкладений вступ у `realtime` і, коли налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio. Будь-яку перевірку з `ok: false` слід вважати блокером перед тим, як просити агента приєднатися.
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

Створіть нову зустріч і приєднайтеся до неї:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Створіть лише URL без приєднання:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` має два шляхи:

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це найбільш детермінований шлях, який не залежить від стану інтерфейсу браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google перенаправить на реальний URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає, щоб у профілі Chrome OpenClaw на вузлі вже було виконано вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит не вважається помилкою входу в Google.
  Потоки приєднання і створення також намагаються повторно використати наявну вкладку Meet перед відкриттям нової. Під час зіставлення ігноруються нешкідливі рядки параметрів URL, такі як `authuser`, тому повторна спроба агента має сфокусувати вже відкриту зустріч, а не створювати другу вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти могли пояснити, який шлях було використано. `create` за замовчуванням приєднується до нової зустрічі та повертає `joined: true` разом із сеансом приєднання. Щоб лише створити URL, використовуйте `create --no-join` у CLI або передайте `"join": false` в інструмент.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з голосом у режимі реального часу та надішли мені посилання». Агент має викликати `google_meet` з `action: "create"`, а потім поділитися повернутим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це не запускає дуплексний міст моделі в реальному часі, тому він не відповідатиме голосом у зустрічі.

Під час сеансів у режимі реального часу статус `google_meet` містить інформацію про стан браузера й аудіомоста, як-от `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього входу/виходу, лічильники байтів і стан закриття моста. Якщо з’являється безпечний запит сторінки Meet, автоматизація браузера обробляє його, коли може. Запити на вхід, допуск від хоста та дозволи браузера/ОС повідомляються як ручна дія з причиною та повідомленням для передавання агентом.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо для першого димового тесту, але може виникати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запускайте Gateway й агента локально, а потім запустіть вузол у VM. Увімкніть вбудований Plugin у VM один раз, щоб вузол рекламував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник `realtime` і конфігурація Plugin Google Meet.
- macOS VM у Parallels: CLI OpenClaw/вузол, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібні у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

Установіть залежності у VM:

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

Запустіть вузол у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує як `googlemeet.chrome`, так і можливість браузера/`browser.proxy`:

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

або попросіть агента використати інструмент `google_meet` із `transport: "chrome-node"`.

Для димового тесту однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask to join і приймає початковий вибір Meet «Use microphone», коли з’являється цей запит. Під час створення зустрічі лише через браузер вона також може пройти повз той самий запит без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо у профілі браузера не виконано вхід, Meet очікує допуску від хоста, Chrome потребує дозволу на мікрофон/камеру або Meet завис на запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` з `manualActionReason` і
`manualActionMessage`. Агенти мають припинити повторні спроби приєднання, передати саме це повідомлення разом із поточними `browserUrl`/`browserTitle` і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на ідентифікатор вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що хост Gateway дозволяє обидві команди вузла за допомогою
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у профіль браузера всередині VM або залиште встановленим `chrome.guestName` для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште увімкненим `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової, а створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new`, що вже в процесі, або вкладку запиту облікового запису Google перед відкриттям ще однієї.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback.

## Примітки щодо встановлення

Стандартний режим `realtime` для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play` для стандартного аудіомоста G.711 mu-law на 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який можуть маршрутизуватися Chrome/Meet.

OpenClaw не включає до комплекту та не розповсюджує жоден із цих пакетів. Документація просить користувачів установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте інсталятор або appliance, який включає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole в оригінальному джерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також виконує команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у macOS VM Parallels.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet для пошуку телефонних номерів.

Використовуйте його, коли участь через Chrome недоступна або коли вам потрібен
резервний варіант із телефонним дозвоном. Google Meet має показувати номер для
телефонного дозвону та PIN для зустрічі; OpenClaw не визначає їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище
дозволяє не зберігати секрети в `openclaw.json`:

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

Коли делегування Twilio налаштовано, `googlemeet setup` включає успішні
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
використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, якщо вам потрібні офіційне створення через API,
визначення простору або перевірки перед запуском Meet Media API.

Доступ до Google Meet API спочатку використовує персональний клієнт OAuth. Налаштуйте
`oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

Згода OAuth включає створення простору Meet, доступ на читання простору Meet і доступ
на читання медіаданих конференції Meet. Якщо ви виконували автентифікацію до того, як з’явилася
підтримка створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб refresh token мав область дії `meetings.space.created`.

Для резервного варіанту через браузер облікові дані OAuth не потрібні. У цьому режимі Google
автентифікація береться зі профілю Chrome із виконаним входом на вибраному вузлі, а не з
конфігурації OpenClaw.

Ці змінні середовища приймаються як резервні:

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

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності
облікових даних OAuth вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера із виконаним входом на закріпленому вузлі Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Щоб лише створити URL, передайте `"join": false`.

Приклад виводу JSON для резервного варіанта через браузер:

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

Якщо резервний варіант через браузер натрапляє на вхід у Google або блокування дозволів Meet до того,
як може створити URL, метод Gateway повертає відповідь із помилкою, а
інструмент `google_meet` повертає структуровані деталі замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має передати
`manualActionMessage` разом із контекстом вузла/вкладки браузера та припинити відкривати нові
вкладки Meet, доки оператор не завершить крок у браузері.

Приклад виводу JSON для створення через API:

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

Створення Meet за замовчуванням також приєднує до нього. Транспорт Chrome або Chrome-node однаково
потребує профілю Google Chrome із виконаним входом, щоб приєднатися через браузер. Якщо
у профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанта браузера та просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, принципал OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для поширеного шляху `realtime` через Chrome потрібно лише ввімкнути Plugin, установити BlackHole, SoX
та ключ постачальника голосу в реальному часі для бекенда. OpenAI — стандартний варіант; установіть
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

Значення за замовчуванням:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: необов’язковий ідентифікатор/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet
  без входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now у режимі best-effort
  через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: очікувати, поки вкладка Meet повідомить про перебування у виклику,
  перш ніж буде запущено вступ у `realtime`
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо G.711 mu-law 8 кГц
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо G.711 mu-law 8 кГц
  із stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст `realtime`
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
фактичний PSTN-виклик і DTMF Plugin Voice Call. Якщо `voice-call` не
увімкнено, Google Meet усе ще може перевіряти та записувати план набору, але не може
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
VM. В обох випадках модель `realtime` і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або переглянути ідентифікатор сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб агент `realtime`
негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу та повернути стан `inCall`, коли хост Chrome може про це повідомити. Використовуйте
`action: "leave"`, щоб позначити сеанс як завершений.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, схоже, перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet у режимі best-effort
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібен ручний вхід, допуск від хоста Meet, дозволи або відновлення
  керування браузером, перш ніж запрацює мовлення
- `providerConnected` / `realtimeReady`: стан мосту голосу `realtime`
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в режимі реального часу

Режим `realtime` для Chrome оптимізовано для живого голосового циклу. Постачальник голосу
в реальному часі чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі `realtime` потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом
недавньої транскрипції зустрічі та повертає стислу усну відповідь до голосового сеансу `realtime`. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації в реальному часі, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показати інструмент консультації та обмежити звичайного агента
  до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показати інструмент консультації та дозволити звичайному агенту використовувати
  стандартну політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу `realtime`.

Ключ сеансу консультації обмежується окремим сеансом Meet, тому наступні виклики консультації
можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного димового тесту приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список живого тестування

Використовуйте цю послідовність перед передаванням зустрічі агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` включає `chrome-node-connected`, коли Chrome-node є
  стандартним транспортом або коли вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, наприклад macOS VM у Parallels, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це доводить, що Plugin Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

Для димового тесту Twilio використовуйте зустріч, яка показує дані для телефонного дозвону:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Очікуваний стан Twilio:

- `googlemeet setup` включає зелені перевірки `twilio-voice-call-plugin` і
  `twilio-voice-call-credentials`.
- `voicecall` доступний у CLI після перезавантаження Gateway.
- Повернутий сеанс має `transport: "twilio"` і `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення неполадок

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

Вузол має бути підключений і містити `googlemeet.chrome` плюс `browser.proxy`.
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

Якщо `googlemeet setup` не проходить перевірку `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, повторно встановіть або перезапустіть вузол із поточним токеном Gateway.
Для Gateway у LAN це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернутий стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит
  дозволу Chrome.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

Не повідомляйте «не виконано вхід» лише тому, що Meet показує «Do you want people to
hear you in the meeting?». Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує
очікувати на реальний стан зустрічі. Для резервного варіанта браузера лише зі створенням OpenClaw
може натиснути **Continue without microphone**, оскільки створення URL не потребує
аудіошляху `realtime`.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує ендпоінт Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до
резервного варіанта через браузер закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання
  підтримки створення. У старіших токенах може бракувати області дії `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: у профілі Chrome OpenClaw на цьому вузлі виконано вхід
  у Google, і він може відкрити `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо в агента стався тайм-аут,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернуті `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб спрямувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанта через браузер: якщо Meet показує «Do you want people to hear you in the
  meeting?», залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише зі створенням, **Continue without microphone** через автоматизацію
  браузера й продовжити очікувати на згенерований URL Meet. Якщо це неможливо, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях `realtime`:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст `realtime`.

Також перевірте:

- На хості Gateway доступний ключ постачальника `realtime`, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через шлях віртуального аудіо, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан перебування у виклику,
причину ручної дії, підключення постачальника `realtime`, `realtimeReady`, активність
аудіовходу/виходу, часові мітки останнього аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли вам потрібен сирий JSON.

Якщо в агента стався тайм-аут і ви бачите вже відкриту вкладку Meet, перевірте цю вкладку
без відкриття ще однієї:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує та перевіряє
наявну вкладку Meet на налаштованому вузлі Chrome. Вона не відкриває нову вкладку і не
створює новий сеанс; вона повідомляє про поточний блокер, наприклад вхід, допуск,
дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого
Gateway, тому Gateway має працювати, а вузол Chrome має бути підключений.

### Не проходять перевірки налаштування Twilio

`twilio-voice-call-plugin` не проходить, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` не проходить, коли в бекенді Twilio відсутні account
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

Підтвердьте, що подія Meet показує дані телефонного дозвону. Передайте точний номер
для дозвону та PIN або спеціальну послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо постачальнику потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому мовлення у виклику Meet
все одно потребує шляху участі. Цей Plugin залишає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режим `realtime` для Chrome потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі `realtime` і передає аудіо G.711 mu-law 8 кГц між цими
  командами та вибраним постачальником голосу `realtime`.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст `realtime` для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call,
`leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
