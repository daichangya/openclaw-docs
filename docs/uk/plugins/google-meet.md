---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL Google Meet через Chrome або Twilio з типовими налаштуваннями realtime voice'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T03:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ff8fa088d162e1d90e7f4cff9e72db485d6777f56086203d70d4c7071d70000
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin навмисно зроблено явним:

- Він приєднується лише до явного URL `https://meet.google.com/...`.
- `realtime` voice — режим за замовчуванням.
- Realtime voice може звертатися назад до повного агента OpenClaw, коли потрібні глибше
  міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Аудіобекенд Chrome за замовчуванням — `BlackHole 2ch`.
- Twilio приймає номер для дозвону та необов’язкову PIN-код або DTMF-послідовність.
- CLI-команда — `googlemeet`; `meet` зарезервовано для ширших
  teleconference-процесів агента.

## Швидкий старт

Установіть локальні аудіозалежності та переконайтеся, що провайдер realtime може використовувати
OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте
окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole
достатньо для першого smoke test, але він може давати відлуння.

## Примітки щодо встановлення

Типовий шлях Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для роботи з аудіо. Plugin використовує її команди `rec` і `play`
  для типового аудіомоста G.711 mu-law на 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`,
  через який Chrome/Meet можуть маршрутизувати звук.

OpenClaw не постачає і не розповсюджує жоден із цих пакетів. У документації користувачам пропонується
встановити їх як залежності хоста через Homebrew. Ліцензія SoX —
`LGPL-2.0-only AND GPL-2.0-only`; ліцензія BlackHole — GPL-3.0. Якщо ви збираєте
інсталятор або appliance, що постачає BlackHole разом з OpenClaw, перегляньте
умови ліцензування BlackHole від першоджерела або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід.
У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`.
Якщо це налаштовано, він також запускає команду перевірки стану аудіомоста й команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Маршрутизуйте звук мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw.
Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування,
а не тихо приєднується без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план дозвону, делегований Plugin Voice Call. Він
не аналізує сторінки Meet у пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли зустріч потребує користувацької послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і preflight

Доступ до Google Meet Media API спочатку використовує особистий OAuth-клієнт. Налаштуйте
`oauth.clientId` і, за бажання, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` із refresh token. Вона використовує PKCE,
localhost callback за адресою `http://localhost:8085/oauth2callback` і ручний
процес копіювання/вставлення з `--manual`.

Як запасні варіанти приймаються такі змінні середовища:

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

Запустіть preflight перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project,
OAuth principal і учасники зустрічі зареєстровані в Google
Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для типового шляху Chrome realtime потрібні лише ввімкнений Plugin, BlackHole, SoX
і ключ OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Задайте конфігурацію Plugin у `plugins.entries.google-meet.config`:

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
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law
  8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо G.711 mu-law
  8 кГц зі stdin
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
  "transport": "chrome",
  "mode": "realtime"
}
```

Використовуйте `action: "status"`, щоб переглянути активні сесії або перевірити ID сесії. Використовуйте
`action: "leave"`, щоб позначити сесію як завершену.

## Консультація агента в realtime

Режим Chrome realtime оптимізовано для живого голосового циклу. Провайдер
голосу realtime чує аудіо зустрічі й говорить через налаштований аудіоміст.
Коли моделі realtime потрібні глибші міркування, актуальна інформація
або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент consult запускає звичайного агента OpenClaw у фоновому режимі з недавнім
контекстом стенограми зустрічі й повертає коротку усну відповідь у сесію
голосу realtime. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском consult:

- `safe-read-only`: надає інструмент consult і обмежує звичайного агента
  інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
  `memory_get`.
- `owner`: надає інструмент consult і дозволяє звичайному агенту використовувати звичайну
  політику інструментів агента.
- `none`: не надає інструмент consult моделі голосу realtime.

Ключ сесії consult має область дії на рівні сесії Meet, тож наступні виклики consult
можуть повторно використовувати попередній контекст consult під час тієї самої зустрічі.

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому для мовлення в
дзвінок Meet усе ще потрібен шлях учасника. Цей Plugin робить цю межу видимою:
Chrome відповідає за участь через браузер і локальну маршрутизацію аудіо; Twilio відповідає за
участь через телефонний дозвін.

Режиму Chrome realtime потрібен один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує
  мостом моделі realtime і передає аудіо G.711 mu-law 8 кГц між цими
  командами та вибраним провайдером голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним
  аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі
віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний
пристрій BlackHole може повертати голоси інших учасників назад у дзвінок як відлуння.

`googlemeet leave` зупиняє realtime-аудіоміст із парою команд для сесій Chrome.
Для сесій Twilio, делегованих через Plugin Voice Call, він також
завершує базовий голосовий дзвінок.

## Пов’язане

- [Plugin Voice Call](/uk/plugins/voice-call)
- [Режим Talk](/uk/nodes/talk)
- [Створення Plugin](/uk/plugins/building-plugins)
