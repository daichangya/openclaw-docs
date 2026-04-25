---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий дзвінок Google Meet
    - Ви налаштовуєте Chrome, Node Chrome або Twilio як транспорт для Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-25T07:02:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c632ec97b38c6b21ed1ea9d748f8ade94a6ad0921bd13c0d22134ae679ed9cc
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin за задумом є явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за
  поверненим URL.
- `realtime` voice є режимом за замовчуванням.
- Голос у реальному часі може повертатися до повного агента OpenClaw, коли потрібні
  глибше міркування або інструменти.
- Агенти обирають поведінку приєднання через `mode`: використовуйте `realtime` для живого
  прослуховування/зворотної розмови або `transcribe`, щоб приєднатися/керувати браузером без
  мосту голосу в реальному часі.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на прив’язаному вузлі.
- Twilio приймає номер для дозвону, а також необов’язкову послідовність PIN або DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  робочих процесів телеконференцій агентів.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте провайдера голосу в реальному часі для бекенда.
OpenAI є типовим варіантом; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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

Вивід налаштування призначено для читання агентом. Він повідомляє про профіль Chrome,
аудіоміст, прив’язку вузла, відкладений вступ у реальному часі та, коли налаштовано делегування Twilio,
чи готові Plugin `voice-call` і облікові дані Twilio.
Розглядайте будь-яку перевірку `ok: false` як блокер, перш ніж просити агента приєднатися.
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

- Створення через API: використовується, коли налаштовано облікові дані Google Meet OAuth. Це
  найдетермінованіший шлях, який не залежить від стану UI браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений вузол Chrome, відкриває `https://meet.google.com/new`, чекає, поки Google
  перенаправить на реальний URL із кодом зустрічі, а потім повертає цей URL. Цей шлях вимагає,
  щоб профіль Chrome OpenClaw на вузлі вже мав виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит Meet на доступ до мікрофона; цей запит
  не вважається збоєм входу Google.
  Потоки приєднання та створення також намагаються повторно використовувати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, такі як `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч, а не створювати другу
  вкладку Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` разом із сеансом приєднання. Щоб лише згенерувати URL, використовуйте
`create --no-join` у CLI або передайте `"join": false` до інструмента.

Або скажіть агенту: «Створи Google Meet, приєднайся до нього з голосом у реальному часі та надішли
мені посилання». Агент має викликати `google_meet` з `action: "create"` і
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це
не запускає двобічний міст моделі в реальному часі, тож він не відповідатиме голосом у
зустрічі.

Під час сеансів у реальному часі статус `google_meet` містить стан браузера та аудіомосту,
наприклад `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього входу/виходу,
лічильники байтів і стан закриття мосту. Якщо з’являється безпечний запит сторінки Meet,
автоматизація браузера обробляє його, коли це можливо. Вхід, допуск хостом, а також запити
дозволів браузера/ОС повідомляються як ручна дія з причиною та повідомленням,
яке агент має передати.

Chrome приєднується як профіль Chrome з уже виконаним входом. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо
для першого smoke-тесту, але може бути луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний Gateway OpenClaw або ключ API моделі всередині macOS VM
лише для того, щоб Chrome працював у VM. Запустіть Gateway і агента локально, а потім запустіть
хост вузла у VM. Увімкніть у комплекті Plugin у VM один раз, щоб вузол
рекламував команду Chrome:

Що де працює:

- Хост Gateway: Gateway OpenClaw, робоча область агента, ключі моделей/API, провайдер
  реального часу та конфігурація Plugin Google Meet.
- Parallels macOS VM: CLI/хост вузла OpenClaw, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або
  налаштування провайдера моделі.

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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там Plugin з комплекту:

```bash
openclaw plugins enable google-meet
```

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` є LAN IP і ви не використовуєте TLS, вузол відхиляє
WebSocket у відкритому тексті, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Використовуйте ту саму змінну середовища під час встановлення вузла як LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це середовище процесу, а не
параметр `openclaw.json`. `openclaw node install` зберігає його в середовищі LaunchAgent,
коли воно присутнє в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує і `googlemeet.chrome`,
і можливість браузера/`browser.proxy`:

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

Тепер приєднуйтесь звичайним способом із хоста Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, вимовляє відому
фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask
to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит.
Під час створення зустрічі лише через браузер вона також може продовжити після
того самого запиту без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо у профілі браузера не виконано вхід, Meet очікує на
допуск хостом, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на
запиті, який автоматизація не змогла обробити, результат join/test-speech повідомляє
`manualActionRequired: true` разом із `manualActionReason` і
`manualActionMessage`. Агенти повинні припинити повторні спроби приєднання,
повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle`
і повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один
підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що у VM виконано `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` установленим для гостьового приєднання. Автоматичне приєднання гостя використовує
  автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залишайте `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для того самого URL Meet перед відкриттям нової, а
  створення зустрічі через браузер повторно використовує поточну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям іншої.
- Немає аудіо: у Meet спрямовуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію в стилі Loopback
  для чистого двобічного аудіо.

## Примітки щодо встановлення

Типовий режим Chrome у реальному часі використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомосту G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер для macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам
пропонується встановити їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви збираєте інсталятор або
пристрій, який постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole в першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome
з уже виконаним входом. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на прив’язаному вузлі, такому як Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямовуйте звук мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуках телефонних номерів.

Використовуйте це, коли участь через Chrome недоступна або коли вам потрібен резервний
варіант із телефонним дозвоном. Google Meet має показувати телефонний номер для дозвону та PIN для
зустрічі; OpenClaw не визначає їх зі сторінки Meet.

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

Надайте облікові дані Twilio через середовище або конфігурацію. Середовище зберігає
секрети поза `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації Plugin
не з’являються в уже запущеному процесі Gateway, доки його не буде перезавантажено.

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

Використовуйте `--dtmf-sequence`, коли зустріч потребує власної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

OAuth є необов’язковим для створення посилання Meet, оскільки `googlemeet create` може
використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, коли вам потрібні офіційне створення через API,
визначення простору або попередні перевірки Meet Media API.

Доступ до Google Meet API використовує OAuth користувача: створіть клієнт Google Cloud OAuth,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий refresh token у конфігурації Plugin Google Meet або надайте змінні середовища
`OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
усе одно приєднуються через профіль Chrome з виконаним входом, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного
шляху Google Meet API: створення просторів зустрічей, визначення просторів і запуску
попередніх перевірок Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** є найпростішим варіантом для організації Google Workspace.
   - **External** працює для особистих/тестових налаштувань; поки застосунок у стані Testing,
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

`meetings.space.created` потрібен для Google Meet `spaces.create`.
`meetings.space.readonly` дозволяє OpenClaw визначати простори для URL/кодів Meet.
`meetings.conference.media.readonly` призначено для попередніх перевірок Meet Media API і роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Створення refresh token

Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE,
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

Вивід JSON містить:

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

Збережіть об’єкт `oauth` у конфігурації Plugin Google Meet:

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
Якщо присутні і значення конфігурації, і значення середовища, Plugin спочатку визначає конфігурацію,
а потім використовує резервний варіант із середовища.

Згода OAuth охоплює створення простору Meet, доступ до читання простору Meet і доступ до читання
медіа конференції Meet. Якщо ви автентифікувалися до появи підтримки
створення зустрічей, повторно запустіть `openclaw googlemeet auth login --json`, щоб refresh
token мав область доступу `meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запускайте doctor для OAuth, коли вам потрібна швидка перевірка стану без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує середовище виконання Chrome і не потребує підключеного вузла Chrome. Команда
перевіряє, що конфігурація OAuth існує і що refresh token може створити access
token. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірок; він не виводить access
token, refresh token або client secret.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Присутні `oauth.clientId` плюс `oauth.refreshToken`, або кешований access token.        |
| `oauth-token`        | Кешований access token усе ще чинний, або refresh token створив новий access token.     |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                     |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                   |

Щоб також підтвердити ввімкнення Google Meet API та область доступу `spaces.create`, запустіть
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасовий URL Meet. Використовуйте його, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання для наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, у refresh token,
на який надано згоду, відсутня потрібна область доступу, або обліковий запис Google не має доступу до цього
простору Meet. Помилка refresh token означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі автентифікація Google
надходить із профілю Chrome з виконаним входом на вибраному вузлі, а не з
конфігурації OpenClaw.

Як резервні варіанти приймаються такі змінні середовища:

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

Покажіть артефакти зустрічі та відвідуваність після того, як Meet створить записи конференції:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
```

Якщо ви вже знаєте id запису конференції, звертайтеся до нього безпосередньо:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Запишіть зручний для читання звіт:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
```

`artifacts` повертає метадані запису конференції, а також метадані ресурсів
учасників, записів, транскрипту, структурованих записів транскрипту та smart-note,
коли Google надає їх для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у рядки
сеансів учасників із часовими мітками входу/виходу. Ці команди використовують лише Meet
REST API; завантаження вмісту документів Google Docs/Drive навмисно виходить за межі
області дії, оскільки для цього потрібен окремий доступ до Google Docs/Drive.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності облікових даних OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера з виконаним входом на закріпленому вузлі Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL передайте `"join": false`.

Приклад виводу JSON із резервного варіанта через браузер:

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

Якщо резервний варіант через браузер стикається з входом Google або блокером дозволів Meet до того,
як може створити URL, метод Gateway повертає відповідь із помилкою, а інструмент
`google_meet` повертає структуровані подробиці замість звичайного рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть спробу створення зустрічі.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Увійдіть у Google в профілі браузера OpenClaw, а потім повторіть спробу створення зустрічі.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Вхід — Облікові записи Google"
  }
}
```

Коли агент бачить `manualActionRequired: true`, він має повідомити
`manualActionMessage` разом із контекстом вузла/вкладки браузера та припинити відкривати нові
вкладки Meet, доки оператор не виконає крок у браузері.

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

Створення Meet типово також виконує приєднання. Транспорт Chrome або Chrome-node усе одно
потребує профілю Google Chrome з виконаним входом, щоб приєднатися через браузер. Якщо
у профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або помилку
резервного варіанта через браузер і просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud-
проєкт, суб’єкт OAuth і учасники зустрічі зареєстровані в програмі Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширений шлях Chrome у реальному часі потребує лише ввімкненого Plugin, BlackHole, SoX
та ключа провайдера голосу в реальному часі для бекенда. OpenAI є типовим варіантом; установіть
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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet
  без входу
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now у
  міру можливості через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call,
  перш ніж буде запущено вступ у реальному часі
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law
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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує
фактичний PSTN-дзвінок і DTMF Plugin Voice Call. Якщо `voice-call` не ввімкнено,
Google Meet усе одно може перевіряти й записувати план набору, але не може
виконати дзвінок Twilio.

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
`transport: "chrome-node"`, коли Chrome працює на прив’язаному вузлі, такому як Parallels
VM. В обох випадках модель реального часу і `openclaw_agent_consult` працюють на
хості Gateway, тож облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб показати активні сеанси або перевірити id сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити агента реального часу
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу й повернути стан `inCall`, коли хост Chrome може
його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині дзвінка Meet
- `micMuted`: найкраща доступна оцінка стану мікрофона Meet
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю
  браузера потрібні ручний вхід, допуск хостом у Meet, дозволи або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан мосту голосу реального часу
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи точно: Я тут і слухаю."
}
```

## Консультація агента в реальному часі

Режим Chrome у реальному часі оптимізовано для живого голосового циклу. Провайдер голосу
реального часу чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавнього транскрипту зустрічі й повертає стислу усну відповідь до сеансу
голосу реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації реального часу, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показувати інструмент консультації та обмежувати звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показувати інструмент консультації та дозволяти звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу реального часу.

Ключ сеансу консультації обмежено кожним сеансом Meet, тож наступні виклики консультації
можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Скажи точно: Я тут і слухаю."
```

Для повного smoke-тесту приєднання й мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Скажи точно: Тест мовлення Google Meet завершено."
```

## Контрольний список живого тесту

Використовуйте цю послідовність перед тим, як передати зустріч агенту без нагляду:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Скажи точно: Тест мовлення Google Meet завершено."
```

Очікуваний стан Chrome-node:

- `googlemeet setup` повністю зелений.
- `googlemeet setup` містить `chrome-node-connected`, коли Chrome-node є
  транспортом за замовчуванням або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з
  `inCall: true`.

Для віддаленого хоста Chrome, такого як Parallels macOS VM, це найкоротша
безпечна перевірка після оновлення Gateway або VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Це підтверджує, що Plugin Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний, перш ніж агент відкриє реальну
вкладку зустрічі.

Для smoke-тесту Twilio використовуйте зустріч, яка показує дані для телефонного дозвону:

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
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти Plugin, зареєстровані поточним процесом
Gateway.

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

Якщо `googlemeet setup` завершується помилкою `chrome-node-connected` або в журналі Gateway повідомляється
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

Потім перезавантажте службу вузла й повторно виконайте:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Браузер відкривається, але агент не може приєднатися

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він
повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage`
і припиніть повторні спроби, доки дія в браузері не буде завершена.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Дозволити гостя з облікового запису хоста Meet.
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит
  дозволів Chrome.
- Закрити або відновити завислий діалог дозволів Meet.

Не повідомляйте «вхід не виконано» лише тому, що Meet показує «Do you want people to
hear you in the meeting?». Це проміжний екран вибору аудіо Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує
чекати на справжній стан зустрічі. Для резервного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL не потрібен
аудіошлях реального часу.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує endpoint Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth команда використовує резервний варіант
через браузер закріпленого вузла Chrome. Підтвердьте:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: refresh token було створено після додавання
  підтримки створення. У старих токенів може бути відсутня область доступу `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію Plugin.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль Chrome OpenClaw на цьому вузлі має виконаний вхід
  у Google і може відкривати `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо в агента стався тайм-аут,
  повторіть виклик інструмента замість ручного відкриття ще однієї вкладки Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб спрямувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через
  автоматизацію браузера та продовжити очікування згенерованого URL Meet. Якщо це не вдається, у
  помилці має згадуватися `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотної розмови. `mode: "transcribe"` навмисно
не запускає двобічний міст голосу реального часу.

Також перевірте:

- На хості Gateway доступний ключ провайдера реального часу, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через віртуальний аудіошлях, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан in-call,
причину ручної дії, підключення провайдера реального часу, `realtimeReady`, активність аудіовходу/виходу,
часові мітки останнього аудіо, лічильники байтів і URL браузера.
Використовуйте `googlemeet status [session-id]`, коли вам потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth
без показу токенів; додайте `--meeting` або `--create-space`, коли також потрібне підтвердження через Google Meet API.

Якщо в агента стався тайм-аут і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує й перевіряє
наявну вкладку Meet на налаштованому вузлі Chrome. Вона не відкриває нову вкладку і не
створює новий сеанс; натомість повідомляє про поточний блокер, наприклад вхід, допуск,
дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого
Gateway, тому Gateway має бути запущений, а вузол Chrome — підключений.

### Перевірки налаштування Twilio завершуються помилкою

`twilio-voice-call-plugin` завершується помилкою, коли `voice-call` не дозволено або не ввімкнено.
Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте
Gateway.

`twilio-voice-call-credentials` завершується помилкою, коли в бекенді Twilio відсутні account
SID, auth token або номер абонента. Установіть це на хості Gateway:

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

`voicecall smoke` типово призначений лише для перевірки готовності. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли навмисно хочете виконати реальний вихідний
дзвінок-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Дзвінок Twilio починається, але ніколи не входить у зустріч

Підтвердьте, що подія Meet показує деталі телефонного дозвону. Передайте точний номер
для дозвону та PIN або власну DTMF-послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо провайдеру потрібна пауза
перед введенням PIN.

## Примітки

Офіційний media API Google Meet орієнтовано на прийом, тож для мовлення в дзвінок Meet
усе одно потрібен шлях участі. Цей Plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режим Chrome у реальному часі потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі реального часу й передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним провайдером голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу
Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
