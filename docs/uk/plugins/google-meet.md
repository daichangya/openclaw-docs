---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими параметрами голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T02:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b874c1da9c7cd8ba2eec019e33d8ef9ba56045910c65f1de43b008e0ceef045f
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасників Google Meet для OpenClaw.

Plugin навмисно зроблено явним:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голосовий режим `realtime` є типовим режимом.
- Голосовий режим реального часу може звертатися назад до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається як особистий Google OAuth або вже виконаний вхід у профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Twilio приймає номер для дозвону, а також необов’язковий PIN-код або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших робочих процесів агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та переконайтеся, що постачальник `realtime` може використовувати OpenAI:

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

Chrome приєднується як профіль Chrome, у якому вже виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого двостороннього аудіо використовуйте окремі віртуальні пристрої або граф на кшталт Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але він може створювати луну.

## Примітки щодо встановлення

Типовий режим Chrome realtime використовує два зовнішні інструменти:

- `sox`: утиліта командного рядка для аудіо. Plugin використовує її команди `rec` і `play` для типового аудіомосту G.711 mu-law на 8 кГц.
- `blackhole-2ch`: віртуальний аудіодрайвер macOS. Він створює аудіопристрій `BlackHole 2ch`, через який Chrome/Meet можуть маршрутизувати аудіо.

OpenClaw не постачає й не розповсюджує жоден із цих пакетів. У документації користувачам пропонується встановлювати їх як залежності хоста через Homebrew. SoX ліцензовано як `LGPL-2.0-only AND GPL-2.0-only`; BlackHole має ліцензію GPL-3.0. Якщо ви збираєте інсталятор або appliance, який містить BlackHole разом з OpenClaw, перегляньте умови вихідної ліцензії BlackHole або отримайте окрему ліцензію від Existential Audio.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому вже виконано вхід. У macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо це налаштовано, він також запускає команду перевірки стану аудіомосту та команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Маршрутизуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого підключення без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet, щоб отримати номери телефону.

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

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Як резервні варіанти підтримуються такі змінні середовища:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` або `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` або `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` або `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` або `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` або
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` або `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` або `GOOGLE_MEET_PREVIEW_ACK`

Перетворіть URL-адресу Meet, код або `spaces/{id}` через `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для поширеного шляху Chrome realtime достатньо лише ввімкненого Plugin, BlackHole, SoX і ключа OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Укажіть конфігурацію Plugin у `plugins.entries.google-meet.config`:

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
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: команда SoX `rec`, що записує аудіо G.711 mu-law 8 кГц у stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає аудіо G.711 mu-law 8 кГц зі stdin
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

Використовуйте `action: "status"`, щоб переглянути активні сеанси або перевірити ідентифікатор сеансу. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

## Консультація агента в реальному часі

Режим Chrome realtime оптимізовано для живого голосового циклу. Постачальник голосу реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw у фоновому режимі з контекстом недавньої стенограми зустрічі та повертає стислу усну відповідь до голосового сеансу реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показує інструмент консультації та обмежує звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: показує інструмент консультації та дозволяє звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не показує інструмент консультації моделі голосу реального часу.

Ключ сеансу консультації має область дії в межах кожного сеансу Meet, тому подальші виклики консультації можуть повторно використовувати попередній контекст консультацій під час тієї самої зустрічі.

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому для мовлення в дзвінок Meet усе ще потрібен шлях участі. Цей Plugin залишає цю межу видимою: Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонний дозвін.

Режиму Chrome realtime потрібен один із таких варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі реального часу та передає аудіо G.711 mu-law 8 кГц між цими командами й вибраним постачальником голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда мосту керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв на кшталт Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet leave` зупиняє аудіоміст реального часу з парою команд для сеансів Chrome. Для сеансів Twilio, делегованих через Plugin Voice Call, він також завершує базовий голосовий виклик.
