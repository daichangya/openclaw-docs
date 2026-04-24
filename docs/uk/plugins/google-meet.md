---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome, вузол Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T15:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 920ed629e7089dd6576ca8aec31f48425b3abb3bf62ef90b00bb48bf72ef4262
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є навмисно явним:

- Він приєднується лише за явним URL `https://meet.google.com/...`.
- Голос `realtime` є типовим режимом.
- Голос у режимі реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі Node.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте голосового провайдера бекенда в реальному часі. OpenAI використовується типово; Google Gemini Live також працює з `realtime.provider: "google"`:

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

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф на зразок Loopback; одного пристрою BlackHole достатньо для першого smoke test, але може виникати луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб Chrome належав VM. Запустіть Gateway і агента локально, а потім запустіть хост вузла в VM. Один раз увімкніть укомплектований Plugin у VM, щоб вузол оголосив команду Chrome:

Що де працює:

- Хост Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, провайдер реального часу та конфігурація Plugin Google Meet.
- Parallels macOS VM: OpenClaw CLI/хост вузла, Google Chrome, SoX, BlackHole 2ch і профіль Chrome із входом у Google.
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

Установіть або оновіть OpenClaw у VM, а потім увімкніть там укомплектований Plugin:

```bash
openclaw plugins enable google-meet
```

Запустіть хост вузла у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це LAN IP і ви не використовуєте TLS, вузол відхилить відкритий WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, якщо вона присутня в команді встановлення.

Схваліть вузол із хоста Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він оголошує `googlemeet.chrome`:

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

або попросіть агента використати інструмент `google_meet` із `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо `chromeNode.node` не вказано, OpenClaw виконує автовибір лише тоді, коли рівно один підключений вузол оголошує `googlemeet.chrome`. Якщо підключено кілька придатних вузлів, установіть `chromeNode.node` на id вузла, відображуване ім’я або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть сполучення та переконайтеся, що у VM було виконано `openclaw plugins enable google-meet`. Також підтвердьте, що хост Gateway дозволяє команду вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у Chrome всередині VM або залиште `chrome.guestName` встановленим для гостьового входу. Автоприєднання гостя використовує Chrome Apple Events; якщо воно повідомляє про попередження автоматизації, увімкніть Chrome > View > Developer > Allow JavaScript from Apple Events, а потім повторіть спробу.
- Дубльовані вкладки Meet: залиште `chrome.reuseExistingTab: true` увімкненим. OpenClaw активує наявну вкладку для того самого URL Meet перед відкриттям нової.
- Немає аудіо: у Meet спрямуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; використовуйте окремі віртуальні пристрої або маршрутизацію на зразок Loopback для чистого дуплексного аудіо.

## Примітки щодо встановлення

Типове налаштування реального часу для Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомоста G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не комплектує та не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановити їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — за GPL-3.0. Якщо ви створюєте інсталятор або appliance, який комплектує BlackHole разом з OpenClaw, перегляньте умови вихідної ліцензії BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на хості Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному вузлі, наприклад у Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершиться помилкою налаштування, а не тихим підключенням без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

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

Доступ до Google Meet Media API спочатку використовує особистий OAuth-клієнт. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE, localhost callback на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Визначте Meet URL, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для типового шляху Chrome у режимі реального часу достатньо лише ввімкненого Plugin, BlackHole, SoX і ключа голосового провайдера бекенда в реальному часі. OpenAI використовується типово; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chromeNode.node`: необов’язкові id/ім’я/IP вузла для `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: ім’я, яке використовується на екрані гостя Meet без входу
- `chrome.autoJoin: true`: найкраща можлива спроба заповнити ім’я гостя та натиснути Join Now
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: очікувати, поки вкладка Meet повідомить про активний виклик, перш ніж запускати вступ у режимі реального часу
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law 8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо G.711 mu-law 8 кГц із stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності, коли міст реального часу підключається; установіть `""`, щоб приєднатися беззвучно

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

Використовуйте `transport: "chrome"`, коли Chrome працює на хості Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному вузлі, наприклад у Parallels VM. В обох випадках модель реального часу та `openclaw_agent_consult` працюють на хості Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ID сеансу. Використовуйте `action: "speak"` із `sessionId` і `message`, щоб агент реального часу заговорив негайно. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу та повернути стан `inCall`, якщо хост Chrome може його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` включає стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині виклику Meet
- `micMuted`: найкраща можлива оцінка стану мікрофона Meet
- `providerConnected` / `realtimeReady`: стан голосового моста реального часу
- `lastInputAt` / `lastOutputAt`: час останнього аудіо, отриманого мостом або надісланого до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Скажи дослівно: Я тут і слухаю."
}
```

## Консультація агента реального часу

Режим реального часу Chrome оптимізовано для живого голосового циклу. Голосовий провайдер реального часу чує аудіо зустрічі та говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавньої транскрипції зустрічі й повертає стислу усну відповідь до голосового сеансу реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надає доступ до інструмента консультації й обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надає доступ до інструмента консультації та дозволяє звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надає моделі голосу реального часу доступ до інструмента консультації.

Ключ сеансу консультації має область дії в межах сеансу Meet, тому наступні виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднається до виклику:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke test приєднання й озвучення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому для озвучення у виклику Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою: Chrome обробляє участь у браузері та локальну маршрутизацію аудіо; Twilio обробляє участь через телефонний дозвін.

Для режиму реального часу Chrome потрібно одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі реального часу та передає аудіо G.711 mu-law 8 кГц між цими командами та вибраним голосовим провайдером реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на зразок Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у виклик.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome. `googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий виклик.

## Пов’язане

- [Plugin голосових викликів](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
