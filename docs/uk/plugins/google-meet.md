---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явно вказаних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T04:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89587eeab8440b2ded2c352cc73209753fc4697d9fdf44cfe39de9d1d76b3f
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є навмисно явним за дизайном:

- Він приєднується лише до явно вказаної URL-адреси `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибше міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі.
- Twilio приймає номер для дозвону та необов’язкову PIN-код або DTMF-послідовність.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів телеконференцій агента.

## Швидкий старт

Установіть локальні аудіозалежності та переконайтеся, що постачальник realtime може використовувати OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двостороннього аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть хост вузла у VM. Один раз увімкніть вбудований Plugin на VM, щоб вузол рекламував команду Chrome:

Що і де запускається:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник realtime і конфігурація Plugin Google Meet.
- Parallels macOS VM: CLI/хост вузла OpenClaw, Google Chrome, SoX, BlackHole 2ch і профіль Chrome із виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

Установіть залежності у VM:

```bash
brew install blackhole-2ch sox
```

Перезавантажте VM після встановлення BlackHole, щоб macOS зробила `BlackHole 2ch` доступним:

```bash
sudo reboot
```

Після перезавантаження переконайтеся, що VM бачить аудіопристрій і команди SoX:

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

Підтвердьте вузол з хоста Gateway:

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

Якщо `chromeNode.node` не вказано, OpenClaw автоматично виконує вибір лише тоді, коли рівно один підключений вузол рекламує `googlemeet.chrome`. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Типові перевірки у разі збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, підтвердьте з’єднання та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у Chrome всередині VM і переконайтеся, що цей профіль може вручну приєднатися до URL-адреси Meet.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на кшталт Loopback для чистого двостороннього аудіо.

## Примітки щодо встановлення

Типовий режим realtime у Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомоста 8 кГц G.711 mu-law.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви збираєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте ліцензійні умови BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки працездатності аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується з помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet у пошуку телефонних номерів.

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

## OAuth і preflight

Доступ до Google Meet Media API спочатку використовує особистий OAuth-клієнт. Налаштуйте `oauth.clientId` і, за бажання, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Як резервні варіанти приймаються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Розв’яжіть URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть preflight перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program for Meet media APIs.

## Конфігурація

Типовий шлях realtime у Chrome потребує лише ввімкненого Plugin, BlackHole, SoX і ключа OpenAI:

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
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо 8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо 8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з
  `openclaw_agent_consult` для глибших відповідей

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у Parallels VM. В обох випадках модель realtime і `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб вивести список активних сесій або перевірити id сесії. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

## Консультація агента в режимі реального часу

Режим Chrome realtime оптимізовано для живого голосового циклу. Постачальник голосу realtime чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі realtime потрібні глибше міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої стенограми зустрічі та повертає стислу усну відповідь до голосової сесії realtime. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: показати інструмент consult і обмежити звичайного агента до
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, і
  `memory_get`.
- `owner`: показати інструмент consult і дозволити звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не показувати інструмент consult моделі голосу realtime.

Ключ сесії consult має область дії в межах сесії Meet, тому подальші виклики consult можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

## Примітки

Офіційний media API Google Meet орієнтований на прийом, тому для мовлення в дзвінок Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою: Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонний дозвін.

Режим Chrome realtime потребує одного з таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає аудіо 8 кГц G.711 mu-law між цими командами та вибраним постачальником голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet leave` зупиняє аудіоміст realtime на основі пари команд для сесій Chrome. Для сесій Twilio, делегованих через Plugin Voice Call, він також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
