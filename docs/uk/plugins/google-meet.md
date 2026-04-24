---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до виклику Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт для Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Plugin Google Meet
x-i18n:
    generated_at: "2026-04-24T02:09:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 57a354040e81dc769f14927364c9fa6aebd95844c2e105badc70341a246fac29
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є явно керованим за задумом:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голосовий режим `realtime` є типовим режимом.
- Голосовий режим реального часу може повертатися до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається як персональний Google OAuth або вже виконаний вхід у профілі Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Twilio приймає номер для дозвону плюс необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Швидкий старт

Установіть локальні аудіозалежності та переконайтеся, що постачальник `realtime` може використовувати OpenAI:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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

Chrome приєднується як профіль Chrome, у якому виконано вхід. У Meet виберіть `BlackHole 2ch` для шляху мікрофона/динаміка, який використовує OpenClaw. Для чистого дуплексного аудіо використовуйте окремі віртуальні пристрої або граф у стилі Loopback; одного пристрою BlackHole достатньо для першого smoke-тесту, але може виникати луна.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перевіряє наявність `BlackHole 2ch` перед запуском. Якщо налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Спрямуйте аудіо мікрофона й динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість тихого приєднання без аудіошляху.

### Twilio

Транспорт Twilio — це строгий план дозвону, делегований Plugin Voice Call. Він не розбирає сторінки Meet для пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, якщо зустріч потребує спеціальної послідовності:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує персональний клієнт OAuth. Налаштуйте `oauth.clientId` і за потреби `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

Ці змінні середовища приймаються як резервні варіанти:

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

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, принципал OAuth і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Для поширеного шляху Chrome realtime потрібно лише ввімкнений Plugin, BlackHole, SoX і ключ OpenAI:

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
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: команда SoX `rec`, що записує 8 кГц G.711 mu-law аудіо в stdout
- `chrome.audioOutputCommand`: команда SoX `play`, що читає 8 кГц G.711 mu-law аудіо зі stdin
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

Використовуйте `action: "status"`, щоб перелічити активні сесії або перевірити ID сесії. Використовуйте `action: "leave"`, щоб позначити сесію завершеною.

## Консультація агента в реальному часі

Режим Chrome realtime оптимізований для живого голосового циклу. Постачальник голосу реального часу чує аудіо зустрічі й говорить через налаштований аудіоміст. Коли моделі реального часу потрібні глибші міркування, актуальна інформація або звичайні інструменти OpenClaw, вона може викликати `openclaw_agent_consult`.

Інструмент консультації запускає звичайного агента OpenClaw за лаштунками з контекстом недавньої стенограми зустрічі й повертає стислу усну відповідь до голосової сесії реального часу. Потім голосова модель може озвучити цю відповідь назад у зустріч.

`realtime.toolPolicy` керує запуском консультації:

- `safe-read-only`: показувати інструмент консультації й обмежувати звичайного агента інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і `memory_get`.
- `owner`: показувати інструмент консультації й дозволяти звичайному агенту використовувати звичайну політику інструментів агента.
- `none`: не показувати інструмент консультації моделі голосу реального часу.

Ключ сесії консультації має область дії на кожну сесію Meet, тож наступні виклики консультації можуть повторно використовувати попередній контекст консультації під час тієї самої зустрічі.

## Примітки

Офіційний media API Google Meet орієнтований на прийом, тому для мовлення в дзвінок Meet усе ще потрібен шлях учасника. Цей Plugin зберігає цю межу видимою: Chrome обробляє участь через браузер і локальне маршрутизування аудіо; Twilio обробляє участь через телефонний дозвін.

Для режиму Chrome realtime потрібен один із варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі реального часу та передає 8 кГц G.711 mu-law аудіо між цими командами й вибраним постачальником голосу реального часу.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо маршрутизуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.

`googlemeet leave` зупиняє аудіоміст реального часу на основі пари команд для сесій Chrome. Для сесій Twilio, делегованих через Plugin Voice Call, він також кладе слухавку в базовому голосовому дзвінку.
