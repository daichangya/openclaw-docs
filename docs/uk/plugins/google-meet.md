---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome, Node Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосового зв’язку в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-24T19:55:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08d1bc95465cc1a6063d5ef6707babf69d16f7f244bd4a9e88a28e3f7a62b2f9
    source_path: plugins/google-meet.md
    workflow: 15
---

Підтримка учасника Google Meet для OpenClaw — Plugin є навмисно явним за дизайном:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голосовий режим `realtime` є типовим режимом.
- Голосовий режим у реальному часі може звертатися назад до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Агенти вибирають поведінку приєднання за допомогою `mode`: використовуйте `realtime` для живого прослуховування/відповіді голосом або `transcribe`, щоб приєднатися/керувати браузером без голосового мосту реального часу.
- Автентифікація починається з персонального Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Chrome може працювати локально або на підключеному вузлі host.
- Twilio приймає номер для дзвінка плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентської телеконференції.

## Швидкий старт

Установіть локальні аудіозалежності та налаштуйте постачальника голосу в реальному часі для бекенда. OpenAI є типовим; Google Gemini Live також працює з `realtime.provider: "google"`:

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

Вивід налаштування призначений для читання агентом. Він повідомляє про профіль Chrome, аудіоміст, прив’язку до Node, відкладений вступ у режимі реального часу, а також, коли налаштовано делегування Twilio, чи готові Plugin `voice-call` і облікові дані Twilio. Будь-яку перевірку `ok: false` слід вважати блокувальним фактором перед тим, як просити агента приєднатися. Використовуйте `openclaw googlemeet setup --json` для скриптів або машинозчитуваного виводу.

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

Для приєднання лише для спостереження/керування браузером установіть `"mode": "transcribe"`. Це не запускає двонапрямний міст моделі реального часу, тому він не відповідатиме голосом у зустрічі.

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двобічного аудіо використовуйте окремі віртуальні пристрої або граф типу Loopback; одного пристрою BlackHole достатньо для першого smoke test, але може бути луна.

### Локальний Gateway + Parallels Chrome

Вам **не** потрібен повний OpenClaw Gateway або ключ API моделі всередині macOS VM лише для того, щоб VM володіла Chrome. Запустіть Gateway і агента локально, а потім запустіть вузол host у VM. Один раз увімкніть у VM вбудований Plugin, щоб вузол рекламував команду Chrome:

Що де працює:

- Host Gateway: OpenClaw Gateway, робочий простір агента, ключі моделі/API, постачальник реального часу та конфігурація Plugin Google Meet.
- Parallels macOS VM: CLI/вузол host OpenClaw, Google Chrome, SoX, BlackHole 2ch і профіль Chrome з виконаним входом у Google.
- Не потрібно у VM: служба Gateway, конфігурація агента, ключ OpenAI/GPT або налаштування постачальника моделі.

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

Запустіть вузол host у VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Якщо `<gateway-host>` — це IP-адреса LAN і ви не використовуєте TLS, вузол відхилить незашифрований WebSocket, якщо ви явно не дозволите це для цієї довіреної приватної мережі:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — це змінна середовища процесу, а не параметр `openclaw.json`. `openclaw node install` зберігає її в середовищі LaunchAgent, якщо вона присутня в команді встановлення.

Схваліть вузол з host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Підтвердьте, що Gateway бачить вузол і що він рекламує і `googlemeet.chrome`, і можливість браузера/`browser.proxy`:

```bash
openclaw nodes status
```

Маршрутизуйте Meet через цей вузол на host Gateway:

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

Тепер приєднуйтесь звичайним способом з host Gateway:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

або попросіть агента використати інструмент `google_meet` з `transport: "chrome-node"`.

Для smoke test однією командою, який створює або повторно використовує сеанс, промовляє відому фразу та виводить стан сеансу:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Якщо профіль браузера не має виконаного входу, Meet очікує допуску від host або Chrome потребує дозволу на мікрофон/камеру, результат join/test-speech повідомляє `manualActionRequired: true` з `manualActionReason` і `manualActionMessage`. Агенти мають припинити повторні спроби приєднання, повідомити оператору це повідомлення й повторити спробу лише після завершення ручної дії в браузері.

Якщо `chromeNode.node` пропущено, OpenClaw автоматично вибирає вузол лише тоді, коли рівно один підключений вузол рекламує і `googlemeet.chrome`, і керування браузером. Якщо підключено кілька сумісних вузлів, установіть `chromeNode.node` на id вузла, display name або віддалену IP-адресу.

Поширені перевірки збоїв:

- `No connected Google Meet-capable node`: запустіть `openclaw node run` у VM, схваліть pairing і переконайтеся, що у VM було виконано `openclaw plugins enable google-meet` і `openclaw plugins enable browser`. Також підтвердьте, що host Gateway дозволяє обидві команди вузла через `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: установіть `blackhole-2ch` у VM і перезавантажте VM.
- Chrome відкривається, але не може приєднатися: увійдіть у профіль браузера всередині VM або залиште встановленим `chrome.guestName` для гостьового приєднання. Автоматичне гостьове приєднання використовує автоматизацію браузера OpenClaw через browser proxy вузла; переконайтеся, що конфігурація браузера вузла вказує на потрібний профіль, наприклад `browser.defaultProfile: "user"` або іменований профіль наявної сесії.
- Дубльовані вкладки Meet: залиште увімкненим `chrome.reuseExistingTab: true`. OpenClaw активує наявну вкладку для тієї самої URL-адреси Meet перед відкриттям нової.
- Немає аудіо: у Meet маршрутизуйте мікрофон/динамік через шлях віртуального аудіопристрою, який використовує OpenClaw; для чистого двобічного аудіо використовуйте окремі віртуальні пристрої або маршрутизацію типу Loopback.

## Примітки щодо встановлення

Типовий режим реального часу Chrome використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомосту G.711 mu-law 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який можуть маршрутизуватися Chrome/Meet.

OpenClaw не постачає та не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановлювати їх як залежності host через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole — GPL-3.0. Якщо ви збираєте інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте умови ліцензування BlackHole від upstream або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також виконує команду перевірки стану аудіомосту та команду запуску перед відкриттям Chrome. Використовуйте `chrome`, коли Chrome/аудіо працюють на host Gateway; використовуйте `chrome-node`, коли Chrome/аудіо працюють на підключеному Node, наприклад у Parallels macOS VM.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Маршрутизуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet у пошуку номерів телефону.

Використовуйте його, коли участь через Chrome недоступна або коли вам потрібен резервний варіант телефонного набору. Google Meet має надавати номер для підключення телефоном і PIN для зустрічі; OpenClaw не знаходить їх на сторінці Meet.

Увімкніть Plugin Voice Call на host Gateway, а не на Chrome node:

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

Використовуйте `--dtmf-sequence`, коли зустріч вимагає користувацької послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує персональний OAuth client. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з refresh token. Вона використовує PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, принципал OAuth і учасники зустрічі зареєстровані в програмі Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Поширений шлях Chrome у режимі реального часу потребує лише увімкненого Plugin, BlackHole, SoX і ключа постачальника голосу в реальному часі для бекенда. OpenAI є типовим; установіть `realtime.provider: "google"`, щоб використовувати Google Gemini Live:

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
- `chrome.guestName: "OpenClaw Agent"`: ім’я, що використовується на екрані гостьового входу Meet без входу в систему
- `chrome.autoJoin: true`: заповнення імені гостя та натискання Join Now з найкращим зусиллям через автоматизацію браузера OpenClaw на `chrome-node`
- `chrome.reuseExistingTab: true`: активувати наявну вкладку Meet замість відкриття дублікатів
- `chrome.waitForInCallMs: 20000`: чекати, поки вкладка Meet повідомить про перебування в дзвінку, перш ніж буде запущено вступ у режимі реального часу
- `chrome.audioInputCommand`: команда SoX `rec`, яка записує аудіо 8 кГц G.711 mu-law у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, яка читає аудіо 8 кГц G.711 mu-law зі stdin
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: короткі усні відповіді, з `openclaw_agent_consult` для глибших відповідей
- `realtime.introMessage`: коротка усна перевірка готовності під час підключення мосту реального часу; установіть `""`, щоб приєднатися беззвучно

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

`voiceCall.enabled` типово має значення `true`; із транспортом Twilio він делегує фактичний PSTN-дзвінок і DTMF до Plugin Voice Call. Якщо `voice-call` не увімкнено, Google Meet усе ще може перевіряти й записувати план набору, але не може здійснити дзвінок Twilio.

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

Використовуйте `transport: "chrome"`, коли Chrome працює на host Gateway. Використовуйте `transport: "chrome-node"`, коли Chrome працює на підключеному Node, наприклад у Parallels VM. В обох випадках модель реального часу та `openclaw_agent_consult` працюють на host Gateway, тому облікові дані моделі залишаються там.

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити id сеансу. Використовуйте `action: "speak"` з `sessionId` і `message`, щоб агент реального часу негайно заговорив. Використовуйте `action: "test_speech"`, щоб створити або повторно використати сеанс, запустити відому фразу й повернути стан `inCall`, коли host Chrome може його повідомити. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

`status` містить стан Chrome, коли він доступний:

- `inCall`: Chrome, імовірно, перебуває всередині дзвінка Meet
- `micMuted`: стан мікрофона Meet з найкращим зусиллям
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: профілю браузера потрібен ручний вхід, допуск host Meet, дозволи, або виправлення керування браузером, перш ніж мовлення зможе працювати
- `providerConnected` / `realtimeReady`: стан голосового мосту реального часу
- `lastInputAt` / `lastOutputAt`: останнє аудіо, отримане мостом або надіслане до нього

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Консультація агента в режимі реального часу

Режим реального часу Chrome оптимізовано для живого голосового циклу. Постачальник голосу в реальному часі чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом нещодавнього транскрипту зустрічі та повертає стислу усну відповідь до голосового сеансу реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: надавати інструмент консультації та обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: надавати інструмент консультації та дозволяти звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не надавати інструмент консультації голосовій моделі реального часу.

Ключ сеансу консультації має область дії в межах кожного сеансу Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

Щоб примусово виконати усну перевірку готовності після того, як Chrome повністю приєднався до дзвінка:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Для повного smoke test приєднання та мовлення:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Контрольний список live test

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
- `nodes status` показує, що вибраний вузол підключено.
- Вибраний вузол рекламує і `googlemeet.chrome`, і `browser.proxy`.
- Вкладка Meet приєднується до дзвінка, а `test-speech` повертає стан Chrome з `inCall: true`.

Для smoke test Twilio використовуйте зустріч, яка надає деталі телефонного підключення:

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
- `googlemeet leave <sessionId>` завершує делегований голосовий дзвінок.

## Усунення несправностей

### Агент не бачить інструмент Google Meet

Підтвердьте, що Plugin увімкнено в конфігурації Gateway, і перезавантажте Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Якщо ви щойно змінили `plugins.entries.google-meet`, перезапустіть або перезавантажте Gateway. Запущений агент бачить лише ті інструменти Plugin, які зареєстровані поточним процесом Gateway.

### Немає підключеного вузла з підтримкою Google Meet

На host вузла виконайте:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

На host Gateway схваліть вузол і перевірте команди:

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

Запустіть `googlemeet test-speech` і перевірте повернений стан Chrome. Якщо він повідомляє `manualActionRequired: true`, покажіть оператору `manualActionMessage` і припиніть повторні спроби, доки дію в браузері не буде завершено.

Поширені ручні дії:

- Увійти в профіль Chrome.
- Допустити гостя з облікового запису host Meet.
- Надати Chrome дозволи на мікрофон/камеру.
- Закрити або виправити зависле діалогове вікно дозволів Meet.

### Агент приєднується, але не говорить

Перевірте шлях реального часу:

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

Використовуйте `mode: "realtime"` для прослуховування/відповіді голосом. `mode: "transcribe"` навмисно не запускає двонапрямний голосовий міст реального часу.

Також перевірте:

- На host Gateway доступний ключ постачальника реального часу, наприклад `OPENAI_API_KEY` або `GEMINI_API_KEY`.
- `BlackHole 2ch` видно на host Chrome.
- `rec` і `play` існують на host Chrome.
- Мікрофон і динамік Meet маршрутизуються через віртуальний аудіошлях, який використовує OpenClaw.

### Перевірки налаштування Twilio завершуються невдачею

`twilio-voice-call-plugin` завершується невдачею, коли `voice-call` не дозволено або не увімкнено. Додайте його до `plugins.allow`, увімкніть `plugins.entries.voice-call` і перезавантажте Gateway.

`twilio-voice-call-credentials` завершується невдачею, коли в бекенді Twilio відсутні account SID, auth token або номер абонента. Установіть їх на host Gateway:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Потім перезапустіть або перезавантажте Gateway і виконайте:

```bash
openclaw googlemeet setup
```

### Дзвінок Twilio починається, але так і не входить у зустріч

Підтвердьте, що подія Meet надає деталі телефонного підключення. Передайте точний номер для підключення та PIN або користувацьку послідовність DTMF:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Використовуйте початковий `w` або коми в `--dtmf-sequence`, якщо постачальнику потрібна пауза перед введенням PIN.

## Примітки

Офіційний медіа-API Google Meet орієнтований на отримання, тому для мовлення в дзвінок Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою: Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонне підключення.

Режиму реального часу Chrome потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі реального часу та передає аудіо 8 кГц G.711 mu-law між цими командами та вибраним постачальником голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двобічного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв типу Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників луною назад у дзвінок.

`googlemeet speak` запускає активний аудіоміст реального часу для сеансу Chrome.
`googlemeet leave` зупиняє цей міст. Для сеансів Twilio, делегованих через Plugin Voice Call, `leave` також завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим розмови](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
