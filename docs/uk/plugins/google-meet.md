---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви хочете, щоб агент OpenClaw створив новий виклик Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio із типовими налаштуваннями голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-25T07:28:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e03741b598614233496d208b2fff85077f31a4c37814c1c915dc6d6fda32ef2e
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасників Google Meet для OpenClaw — плагін є навмисно явним за своєю конструкцією:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Він може створити новий простір Meet через API Google Meet, а потім приєднатися за поверненою URL-адресою.
- Голос `realtime` є типовим режимом.
- Голос у режимі realtime може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/зворотного мовлення або `transcribe`, щоб приєднатися/керувати браузером без голосового мосту realtime.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язкову послідовність PIN або DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте постачальника голосу realtime для бекенда.
OpenAI є типовим; Google Gemini Live також працює з
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор Homebrew потребує перезавантаження, перш ніж macOS зробить пристрій видимим:

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

Вивід налаштування призначено для читання агентом. Він повідомляє про профіль Chrome,
аудіоміст, закріплення за Node, відкладене представлення realtime, а також, коли делегування Twilio
налаштоване, чи готові плагін `voice-call` і облікові дані Twilio.
Розглядайте будь-яку перевірку `ok: false` як блокер перед тим, як просити агента приєднатися.
Для скриптів або машинозчитуваного виводу використовуйте `openclaw googlemeet setup --json`.

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

- Створення через API: використовується, коли налаштовано облікові дані OAuth Google Meet. Це
  найбільш детермінований шлях, який не залежить від стану UI браузера.
- Резервний варіант через браузер: використовується, коли облікові дані OAuth відсутні. OpenClaw використовує
  закріплений Node Chrome, відкриває `https://meet.google.com/new`, чекає, доки Google
  перенаправить на реальну URL-адресу з кодом зустрічі, а потім повертає цю URL-адресу. Цей шлях вимагає,
  щоб профіль OpenClaw Chrome на вузлі вже мав виконаний вхід у Google.
  Автоматизація браузера обробляє власний початковий запит дозволу на мікрофон від Meet; цей запит
  не вважається збоєм входу в Google.
  Потоки приєднання та створення також намагаються повторно використати наявну вкладку Meet перед відкриттям
  нової. Зіставлення ігнорує нешкідливі рядки запиту URL, як-от `authuser`, тому
  повторна спроба агента має сфокусувати вже відкриту зустріч замість створення другої
  вкладки Chrome.

Вивід команди/інструмента містить поле `source` (`api` або `browser`), щоб агенти
могли пояснити, який шлях було використано. `create` типово приєднується до нової зустрічі та
повертає `joined: true` разом із сеансом приєднання. Щоб лише згенерувати URL-адресу, використовуйте
`create --no-join` у CLI або передайте `"join": false` інструменту.

Або скажіть агенту: "Створи Google Meet, приєднайся до нього з голосом realtime і надішли
мені посилання." Агент має викликати `google_meet` з `action: "create"` і
потім поділитися поверненим `meetingUri`.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Для приєднання лише зі спостереженням/керуванням браузером установіть `"mode": "transcribe"`. Це
не запускає дуплексний міст моделі realtime, тож він не говоритиме назад у
зустріч.

Під час сеансів realtime статус `google_meet` містить стан браузера та працездатність
аудіомосту, такі як `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, часові мітки останнього введення/виведення, лічильники байтів і стан закриття моста. Якщо з’являється
безпечний запит сторінки Meet, автоматизація браузера обробляє його, коли це можливо. Вхід, допуск хостом і запити дозволів браузера/ОС повідомляються як ручна дія з причиною та
повідомленням, яке агент має передати.

Chrome приєднується як профіль Chrome з виконаним входом. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо
для першого smoke-тесту, але він може давати відлуння.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть
вузол у VM. Увімкніть вбудований плагін у VM один раз, щоб вузол
оголошував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робоча область агента, ключі моделі/API, постачальник realtime
  і конфігурація плагіна Google Meet.
- Parallels macOS VM: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch,
  і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` видимим:

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

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
простий WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр
`openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent,
коли вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він оголошує і `googlemeet.chrome`,
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

Для smoke-тесту однією командою, який створює або повторно використовує сеанс, промовляє відому
фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Під час приєднання автоматизація браузера OpenClaw заповнює ім’я гостя, натискає Join/Ask
to join і приймає початковий вибір Meet "Use microphone", коли з’являється цей запит.
Під час створення зустрічі лише через браузер вона також може продовжити повз той самий запит
без мікрофона, якщо Meet не показує кнопку використання мікрофона.
Якщо в профілі браузера не виконано вхід, Meet очікує
допуску хостом, Chrome потребує дозволу на мікрофон/камеру або Meet застряг на
запиті, який автоматизація не змогла розв’язати, результат join/test-speech повідомляє
`manualActionRequired: true` разом із `manualActionReason` і
`manualActionMessage`. Агенти повинні припинити повторювати спроби приєднання,
повідомити саме це повідомлення разом із поточними `browserUrl`/`browserTitle`,
і повторювати спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає лише тоді, коли рівно один
підключений вузол оголошує і `googlemeet.chrome`, і керування браузером. Якщо
підключено кілька сумісних вузлів, установіть `chromeNode.node` на id вузла,
відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що в VM виконано `openclaw plugins enable google-meet` і
  `openclaw plugins enable browser`. Також підтвердьте, що
  хост Gateway дозволяє обидві команди вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або
  залиште `chrome.guestName` установленим для приєднання як гість. Автоприєднання гостя використовує
  автоматизацію браузера OpenClaw через проксі браузера вузла; переконайтеся, що конфігурація браузера вузла
  вказує на потрібний профіль, наприклад
  `browser.defaultProfile: "user"` або іменований профіль наявного сеансу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw
  активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової, а
  створення зустрічі в браузері повторно використовує вкладку `https://meet.google.com/new`, що вже виконується,
  або вкладку запиту облікового запису Google, перш ніж відкрити іншу.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію
  у стилі Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типовий варіант realtime для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Плагін використовує її команди `rec` і `play`
  для типового аудіомосту 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює
  аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає в комплекті та не розповсюджує жоден із цих пакетів. Документація просить користувачів
установлювати їх як залежності хоста через Homebrew. SoX ліцензовано за
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте
інсталятор або appliance, який постачає BlackHole разом з OpenClaw, перегляньте
висхідні умови ліцензування BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome
з виконаним входом. У macOS плагін перевіряє наявність `BlackHole 2ch` перед запуском.
Якщо налаштовано, він також виконує команду перевірки працездатності аудіомосту та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування
замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований плагіну Voice Call. Він
не аналізує сторінки Meet, щоб знаходити телефонні номери.

Використовуйте це, коли участь через Chrome недоступна або коли вам потрібен резервний
варіант дозвону телефоном. Google Meet має показувати номер для дозвону та PIN для
зустрічі; OpenClaw не виявляє їх на сторінці Meet.

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

Перезапустіть або перезавантажте Gateway після ввімкнення `voice-call`; зміни конфігурації плагіна
не з’являються в уже запущеному процесі Gateway, доки він не буде перезавантажений.

Потім перевірте:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Коли делегування Twilio підключено, `googlemeet setup` містить успішні
перевірки `twilio-voice-call-plugin` і `twilio-voice-call-credentials`.

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
використовувати резервний варіант через автоматизацію браузера. Налаштуйте OAuth, коли вам потрібне офіційне створення через API,
визначення простору або перевірки попередньої готовності Meet Media API.

Доступ до API Google Meet використовує OAuth користувача: створіть OAuth-клієнт Google Cloud,
запросіть потрібні області доступу, авторизуйте обліковий запис Google, а потім збережіть
отриманий токен оновлення в конфігурації плагіна Google Meet або надайте
змінні середовища `OPENCLAW_GOOGLE_MEET_*`.

OAuth не замінює шлях приєднання через Chrome. Транспорти Chrome і Chrome-node
усе ще приєднуються через профіль Chrome з виконаним входом, BlackHole/SoX і підключений
вузол, коли ви використовуєте участь через браузер. OAuth призначений лише для офіційного шляху Google
Meet API: створення просторів зустрічей, визначення просторів і запуск перевірок попередньої готовності Meet Media API.

### Створення облікових даних Google

У Google Cloud Console:

1. Створіть або виберіть проєкт Google Cloud.
2. Увімкніть **Google Meet REST API** для цього проєкту.
3. Налаштуйте екран згоди OAuth.
   - **Internal** — найпростіший варіант для організації Google Workspace.
   - **External** підходить для персональних/тестових налаштувань; поки застосунок перебуває в стані Testing,
     додайте кожен обліковий запис Google, який авторизуватиме застосунок, як тестового користувача.
4. Додайте області доступу, які запитує OpenClaw:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Створіть ідентифікатор OAuth-клієнта.
   - Тип застосунку: **Web application**.
   - Авторизований URI перенаправлення:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Скопіюйте ідентифікатор клієнта та секрет клієнта.

`meetings.space.created` потрібен для Google Meet `spaces.create`.
`meetings.space.readonly` дозволяє OpenClaw визначати простори за URL-адресами/кодами Meet.
`meetings.conference.media.readonly` призначено для попередньої готовності Meet Media API і роботи з медіа;
Google може вимагати участі в Developer Preview для фактичного використання Media API.
Якщо вам потрібні лише приєднання через Chrome на основі браузера, повністю пропустіть OAuth.

### Створення токена оновлення

Налаштуйте `oauth.clientId` і, за бажанням, `oauth.clientSecret`, або передайте їх як
змінні середовища, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE,
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

Надавайте перевагу змінним середовища, коли не хочете зберігати токен оновлення в конфігурації.
Якщо присутні і значення конфігурації, і значення середовища, плагін спочатку використовує конфігурацію,
а потім резервний варіант із середовища.

Згода OAuth включає створення просторів Meet, доступ на читання до просторів Meet і доступ на читання до медіа
конференції Meet. Якщо ви проходили автентифікацію до того, як з’явилася підтримка
створення зустрічей, повторно виконайте `openclaw googlemeet auth login --json`, щоб токен оновлення
мав область доступу `meetings.space.created`.

### Перевірка OAuth за допомогою doctor

Запустіть doctor для OAuth, коли вам потрібна швидка перевірка працездатності без секретів:

```bash
openclaw googlemeet doctor --oauth --json
```

Це не завантажує середовище виконання Chrome і не потребує підключеного вузла Chrome. Воно
перевіряє, що конфігурація OAuth існує і що токен оновлення може створити токен доступу. Звіт JSON містить лише поля стану, такі як `ok`, `configured`,
`tokenSource`, `expiresAt` і повідомлення перевірки; він не виводить токен доступу, токен оновлення чи секрет клієнта.

Поширені результати:

| Перевірка            | Значення                                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | Наявні `oauth.clientId` плюс `oauth.refreshToken` або кешований токен доступу.         |
| `oauth-token`        | Кешований токен доступу все ще чинний, або токен оновлення створив новий токен доступу. |
| `meet-spaces-get`    | Необов’язкова перевірка `--meeting` визначила наявний простір Meet.                    |
| `meet-spaces-create` | Необов’язкова перевірка `--create-space` створила новий простір Meet.                  |

Щоб також підтвердити ввімкнення Google Meet API і область доступу `spaces.create`, виконайте
перевірку створення з побічним ефектом:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` створює тимчасову URL-адресу Meet. Використовуйте її, коли потрібно підтвердити,
що в проєкті Google Cloud увімкнено Meet API і що авторизований
обліковий запис має область доступу `meetings.space.created`.

Щоб підтвердити доступ на читання до наявного простору зустрічі:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` і `resolve-space` підтверджують доступ на читання до наявного
простору, до якого має доступ авторизований обліковий запис Google. `403` від цих перевірок
зазвичай означає, що Google Meet REST API вимкнено, токен оновлення з наданою згодою
не має потрібної області доступу, або обліковий запис Google не має доступу до цього простору Meet.
Помилка токена оновлення означає, що потрібно повторно виконати `openclaw googlemeet auth login
--json` і зберегти новий блок `oauth`.

Для резервного варіанта через браузер облікові дані OAuth не потрібні. У цьому режимі Google
auth надходить із профілю Chrome з виконаним входом на вибраному вузлі, а не з
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

Визначте URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

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

З `--meeting` команди `artifacts` і `attendance` типово використовують останній запис конференції.
Передайте `--all-conference-records`, якщо хочете отримати кожен збережений запис
для цієї зустрічі.

Пошук у Calendar може визначити URL-адресу зустрічі з Google Calendar перед читанням
артефактів Meet:

```bash
openclaw googlemeet latest --today
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` шукає в сьогоднішньому календарі `primary` подію Calendar із
посиланням Google Meet. Використовуйте `--event <query>` для пошуку за відповідним текстом події і
`--calendar <id>` для неосновного календаря. Пошук у Calendar потребує нового
входу OAuth, який включає область доступу лише для читання подій Calendar.

Якщо ви вже знаєте ідентифікатор запису конференції, звертайтеся до нього безпосередньо:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Запишіть зручний для читання звіт:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
```

`artifacts` повертає метадані запису конференції, а також метадані ресурсів учасників, записів,
транскриптів, структурованих записів транскрипту та smart-note, коли Google надає їх
для зустрічі. Використовуйте `--no-transcript-entries`, щоб пропустити
пошук записів для великих зустрічей. `attendance` розгортає учасників у
рядки сеансів учасників із часом першої/останньої появи, загальною тривалістю сеансу,
позначками запізнення/раннього виходу та об’єднанням дублікатів ресурсів учасників за
користувачем із виконаним входом або відображуваним ім’ям. Передайте `--no-merge-duplicates`, щоб залишити сирі
ресурси учасників окремими, `--late-after-minutes` для налаштування виявлення запізнення
і `--early-before-minutes` для налаштування виявлення раннього виходу.

`export` записує папку, що містить `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json` і `attendance.json`. Ці команди використовують
Meet REST API лише для ресурсів Meet; завантаження тіла документа Google Docs/Drive
навмисно не входить до сфери охоплення, оскільки для цього потрібен окремий доступ до Google Docs/Drive.

Створіть новий простір Meet:

```bash
openclaw googlemeet create
```

Команда виводить новий `meeting uri`, джерело та сеанс приєднання. За наявності облікових даних OAuth
вона використовує офіційний Google Meet API. Без облікових даних OAuth вона
використовує профіль браузера з виконаним входом на закріпленому вузлі Chrome як резервний варіант. Агенти можуть
використовувати інструмент `google_meet` з `action: "create"`, щоб створити й приєднатися за один
крок. Для створення лише URL-адреси передайте `"join": false`.

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

Якщо резервний варіант через браузер натрапляє на вхід у Google або блокування дозволів Meet, перш ніж
він зможе створити URL-адресу, метод Gateway повертає відповідь із помилкою, а
інструмент `google_meet` повертає структуровані дані замість простого рядка:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
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

Створення Meet типово також виконує приєднання. Транспорту Chrome або Chrome-node все ще
потрібен профіль Google Chrome з виконаним входом, щоб приєднатися через браузер. Якщо
в профілі виконано вихід, OpenClaw повідомляє `manualActionRequired: true` або
помилку резервного варіанта браузера й просить оператора завершити вхід у Google перед
повторною спробою.

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
проєкт, суб’єкт OAuth і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширеному шляху realtime через Chrome потрібні лише ввімкнений плагін, BlackHole, SoX
і ключ постачальника голосу realtime для бекенда. OpenAI є типовим; установіть
`realtime.provider: "google"`, щоб використовувати Google Gemini Live:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостя Meet
  без виконаного входу
- `chrome.autoJoin: true`: найкраща можлива спроба заповнення імені гостя та натискання Join Now
  через автоматизацію браузера OpenClaw у `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість
  відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про стан in-call,
  перш ніж буде запущено вступне повідомлення realtime
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли підключається міст realtime;
  установіть `""`, щоб приєднуватися беззвучно

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

Для `voiceCall.enabled` типовим є `true`; із транспортом Twilio він делегує
фактичний PSTN-виклик і DTMF плагіну Voice Call. Якщо `voice-call` не ввімкнено,
Google Meet усе ще може перевіряти та записувати план набору, але не може
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
`transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у Parallels
VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на
хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте
`action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime
говорити негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс,
запустити відому фразу та повернути стан `inCall`, коли хост Chrome може його повідомити. Використовуйте
`action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: схоже, що Chrome перебуває всередині виклику Meet
- `micMuted`: стан мікрофона Meet за найкращою можливою оцінкою
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профіль
  браузера потребує ручного входу, допуску хостом у Meet, дозволів або
  відновлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан голосового мосту realtime
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого від моста або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Постачальник голосу realtime
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом
нещодавньої транскрипції зустрічі та повертає стислу усну відповідь до голосового сеансу realtime.
Потім голосова модель може промовити цю відповідь назад у зустріч.
Він використовує той самий спільний інструмент консультації realtime, що й Voice Call.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показати інструмент консультації та обмежити звичайного агента
  до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показати інструмент консультації та дозволити звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу realtime.

Ключ сеансу консультації має область дії в межах кожного сеансу Meet, тож подальші виклики консультації
можуть повторно використовувати попередній контекст консультації протягом тієї самої зустрічі.

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

## Контрольний список живого тесту

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
- `googlemeet setup` містить `chrome-node-connected`, коли `chrome-node` є
  типовим транспортом або вузол закріплено.
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол оголошує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до виклику, а `test-speech` повертає стан Chrome з
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

Це доводить, що плагін Gateway завантажено, вузол VM підключено з
поточним токеном, а аудіоміст Meet доступний до того, як агент відкриє
справжню вкладку зустрічі.

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
- `googlemeet leave <sessionId>` завершує делегований голосовий виклик.

## Усунення неполадок

### Агент не бачить інструмент Google Meet

Підтвердьте, що плагін увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно редагували `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway.
Запущений агент бачить лише інструменти плагіна, зареєстровані поточним процесом
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

Якщо `googlemeet setup` не проходить `chrome-node-connected` або журнал Gateway повідомляє
`gateway token mismatch`, перевстановіть або перезапустіть вузол з поточним токеном Gateway.
Для LAN Gateway це зазвичай означає:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Потім перезавантажте службу вузла та повторно виконайте:

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
- Надати Chrome дозволи на мікрофон/камеру, коли з’являється власний запит дозволу Chrome.
- Закрити або відновити зависле діалогове вікно дозволів Meet.

Не повідомляйте "not signed in" лише тому, що Meet показує "Do you want people to
hear you in the meeting?" Це проміжний екран вибору аудіо в Meet; OpenClaw
натискає **Use microphone** через автоматизацію браузера, коли це можливо, і продовжує
чекати на реальний стан зустрічі. Для резервного варіанта створення лише через браузер OpenClaw
може натиснути **Continue without microphone**, оскільки для створення URL-адреси не потрібен
аудіошлях realtime.

### Не вдається створити зустріч

`googlemeet create` спочатку використовує кінцеву точку Google Meet API `spaces.create`,
коли налаштовано облікові дані OAuth. Без облікових даних OAuth він переходить до резервного
варіанта через браузер закріпленого вузла Chrome. Переконайтеся:

- Для створення через API: налаштовано `oauth.clientId` і `oauth.refreshToken`,
  або присутні відповідні змінні середовища `OPENCLAW_GOOGLE_MEET_*`.
- Для створення через API: токен оновлення було створено після додавання підтримки
  створення. У старіших токенах може бракувати області доступу `meetings.space.created`; повторно виконайте
  `openclaw googlemeet auth login --json` і оновіть конфігурацію плагіна.
- Для резервного варіанта через браузер: `defaultTransport: "chrome-node"` і
  `chromeNode.node` вказують на підключений вузол із `browser.proxy` і
  `googlemeet.chrome`.
- Для резервного варіанта через браузер: профіль OpenClaw Chrome на цьому вузлі має виконаний вхід
  у Google і може відкривати `https://meet.google.com/new`.
- Для резервного варіанта через браузер: повторні спроби повторно використовують наявну вкладку `https://meet.google.com/new`
  або вкладку запиту облікового запису Google перед відкриттям нової вкладки. Якщо агент перевищив час очікування,
  повторіть виклик інструмента, а не відкривайте вручну ще одну вкладку Meet.
- Для резервного варіанта через браузер: якщо інструмент повертає `manualActionRequired: true`, використовуйте
  повернені `browser.nodeId`, `browser.targetId`, `browserUrl` і
  `manualActionMessage`, щоб зорієнтувати оператора. Не повторюйте спроби в циклі, доки цю
  дію не буде завершено.
- Для резервного варіанта через браузер: якщо Meet показує "Do you want people to hear you in the
  meeting?", залиште вкладку відкритою. OpenClaw має натиснути **Use microphone** або, для
  резервного варіанта лише створення, **Continue without microphone** через автоматизацію
  браузера і продовжити очікування згенерованої URL-адреси Meet. Якщо це не вдається, помилка
  має згадувати `meet-audio-choice-required`, а не `google-login-required`.

### Агент приєднується, але не говорить

Перевірте шлях realtime:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Використовуйте `mode: "realtime"` для прослуховування/зворотного мовлення. `mode: "transcribe"` навмисно
не запускає дуплексний голосовий міст realtime.

Також перевірте:

- На хості Gateway доступний ключ постачальника realtime, наприклад
  `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видимий на хості Chrome.
- `rec` і `play` існують на хості Chrome.
- Мікрофон і динамік Meet спрямовано через шлях віртуального аудіо, який використовує
  OpenClaw.

`googlemeet doctor [session-id]` виводить сеанс, вузол, стан in-call,
причину ручної дії, підключення постачальника realtime, `realtimeReady`, активність
аудіовходу/аудіовиходу, часові мітки останнього аудіо, лічильники байтів і URL-адресу браузера.
Використовуйте `googlemeet status [session-id]`, коли потрібен сирий JSON. Використовуйте
`googlemeet doctor --oauth`, коли потрібно перевірити оновлення Google Meet OAuth
без розкриття токенів; додайте `--meeting` або `--create-space`, коли також потрібне підтвердження Google Meet API.

Якщо агент перевищив час очікування і ви бачите, що вкладка Meet уже відкрита, перевірте цю вкладку
без відкриття іншої:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

Еквівалентна дія інструмента — `recover_current_tab`. Вона фокусує і перевіряє
наявну вкладку Meet на налаштованому вузлі Chrome. Вона не відкриває нову вкладку і не
створює новий сеанс; вона повідомляє про поточне блокування, таке як вхід, допуск,
дозволи або стан вибору аудіо. Команда CLI звертається до налаштованого
Gateway, тому Gateway має бути запущений, а вузол Chrome має бути підключений.

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

`voicecall smoke` типово перевіряє лише готовність. Щоб виконати dry-run для конкретного номера:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Додавайте `--yes` лише тоді, коли ви навмисно хочете здійснити реальний вихідний
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

Використовуйте початкові `w` або коми в `--dtmf-sequence`, якщо постачальнику потрібна пауза
перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому для мовлення в
виклик Meet усе ще потрібен шлях учасника. Цей плагін зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режиму Chrome realtime потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw володіє
  мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним постачальником голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда мосту володіє всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати в дзвінок відлуння інших учасників.

`googlemeet speak` запускає активний аудіоміст realtime для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих
через плагін Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Плагін Voice call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
