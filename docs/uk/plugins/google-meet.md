---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T08:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є навмисно явним:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос realtime може повертатися до повного агента OpenClaw, коли потрібні глибші
  міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язкову PIN-код або DTMF-послідовність.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших
  телекомунікаційних робочих процесів агента.

## Швидкий старт

Установіть локальні аудіозалежності й переконайтеся, що провайдер realtime може використовувати
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` установлює віртуальний аудіопристрій `BlackHole 2ch`. Інсталятор
Homebrew потребує перезавантаження, перш ніж macOS покаже цей пристрій:

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

Приєднайтеся до зустрічі:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Або дозвольте агенту приєднатися через інструмент `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole
достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM
лише для того, щоб Chrome працював у VM. Запустіть Gateway і агента локально, а потім запустіть
вузол-хост у VM. Один раз увімкніть вбудований Plugin у VM, щоб вузол
рекламував команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, realtime
  провайдер і конфігурація Plugin Google Meet.
- Parallels macOS VM: CLI/node host OpenClaw, Google Chrome, SoX, BlackHole 2ch
  і профіль Chrome із виконаним входом у Google.
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

Запустіть вузол-хост у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхиляє
простий WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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
коли він присутній у команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує `googlemeet.chrome`:

```bash
openclaw nodes status
```

Спрямуйте Meet через цей вузол на хості Gateway:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
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

Якщо `chromeNode.node` не вказано, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один
підключений вузол рекламує `googlemeet.chrome`. Якщо підключено кілька
придатних вузлів, установіть `chromeNode.node` на id вузла, видиме ім’я або віддалену IP-адресу.

Типові перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM,
  схваліть сполучення та переконайтеся, що `openclaw plugins enable google-meet` було виконано
  у VM. Також підтвердьте, що хост Gateway дозволяє команду вузла через
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch`
  у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: виконайте вхід у Chrome всередині VM і підтвердьте, що
  цей профіль може приєднатися до URL Meet вручну.
- Немає аудіо: у Meet направте мікрофон/динамік через шлях віртуального аудіопристрою,
  який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію у стилі Loopback
  для чистого двобічного аудіо.

## Примітки щодо встановлення

Типовий шлях Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомоста 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet може маршрутизувати аудіо.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. Документація просить користувачів
установлювати їх як залежності хоста через Homebrew. SoX ліцензовано як
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте
інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте умови
ліцензування BlackHole у першоджерелі або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід.
У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо це налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску
перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway;
використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels
macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування,
а не тихим приєднанням без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план дозвону, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуку телефонних номерів.

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

Доступ Google Meet Media API спочатку використовує особистий OAuth client. Налаштуйте
`oauth.clientId` і, за бажанням, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE,
локальний callback на `http://localhost:8085/oauth2callback` і ручний
потік копіювання/вставлення з `--manual`.

Ці змінні середовища підтримуються як резервні варіанти:

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

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud
project, OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Поширеному шляху Chrome realtime потрібні лише ввімкнений Plugin, BlackHole, SoX
і ключ OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law
  у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law
  зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли realtime-міст
  підключається; установіть `""`, щоб приєднуватися беззвучно

Необов’язкові перевизначення:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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
`action: "speak"` із `sessionId` і `message`, щоб змусити агента realtime
говорити негайно. Використовуйте `action: "leave"`, щоб позначити сесію як завершену.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента realtime

Режим Chrome realtime оптимізований для живого голосового циклу. Провайдер голосу realtime
чує аудіо зустрічі та говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибші міркування, актуальна інформація або звичайні
інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult непомітно запускає звичайного агента OpenClaw з контекстом
нещодавньої стенограми зустрічі й повертає стислу усну відповідь до голосової
сесії realtime. Потім голосова модель може озвучити цю відповідь назад у зустрічі.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: показувати інструмент consult і обмежувати звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: показувати інструмент consult і дозволяти звичайному агенту використовувати
  стандартну політику інструментів агента.
- `none`: не показувати інструмент consult моделі голосу realtime.

Ключ сесії consult має область дії на рівні окремої сесії Meet, тому наступні виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому для мовлення в дзвінок Meet
усе ще потрібен шлях учасника. Цей plugin зберігає цю межу видимою:
Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє
участь через телефонний дозвін.

Режиму Chrome realtime потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими
  командами та вибраним провайдером голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст realtime для сесії
Chrome. `googlemeet leave` зупиняє цей міст. Для сесій Twilio, делегованих
через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice call](/uk/plugins/voice-call)
- [Режим talk](/uk/nodes/talk)
- [Створення плагінів](/uk/plugins/building-plugins)
