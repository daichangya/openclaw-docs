---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт Google Meet
summary: 'Plugin Google Meet: приєднання до явних URL-адрес Meet через Chrome або Twilio з типовими налаштуваннями голосу в реальному часі'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T01:59:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92e61135fc2b767f26b17628a9cdf699015114ddb6cf8313510bd8c3298a908c
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

Підтримка учасника Google Meet для OpenClaw.

Plugin є явно керованим за задумом:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голос `realtime` є режимом за замовчуванням.
- Голос у режимі realtime може звертатися назад до повного агента OpenClaw, коли потрібні глибші міркування або інструменти.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення згоди немає.
- Типовий аудіобекенд Chrome — `BlackHole 2ch`.
- Twilio приймає номер для дозвону та необов’язковий PIN або послідовність DTMF.
- Команда CLI — `googlemeet`; `meet` зарезервовано для ширших сценаріїв агентських телеконференцій.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS Plugin перед запуском перевіряє наявність `BlackHole 2ch`. Якщо це налаштовано, він також запускає команду перевірки стану аудіомоста та команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Спрямуйте аудіо мікрофона та динаміка Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість того, щоб мовчки приєднатися без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований Plugin Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли для зустрічі потрібна власна послідовність:

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

Ці змінні середовища приймаються як резервні:

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

Запускайте попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Встановлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш проєкт Cloud, принципал OAuth і учасники зустрічі зареєстровані в програмі Google Workspace Developer Preview Program для Meet media APIs.

## Конфігурація

Задавайте конфігурацію в `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome",
          defaultMode: "realtime",
          defaults: {
            meeting: "https://meet.google.com/abc-defg-hij",
          },
          preview: {
            enrollmentAcknowledged: false,
          },
          chrome: {
            audioBackend: "blackhole-2ch",
            launch: true,
            browserProfile: "Default",
            // Command-pair bridge: input writes 8 kHz G.711 mu-law audio to stdout.
            audioInputCommand: [
              "rec",
              "-q",
              "-t",
              "raw",
              "-r",
              "8000",
              "-c",
              "1",
              "-e",
              "mu-law",
              "-b",
              "8",
              "-",
            ],
            // Output reads 8 kHz G.711 mu-law audio from stdin.
            audioOutputCommand: [
              "play",
              "-q",
              "-t",
              "raw",
              "-r",
              "8000",
              "-c",
              "1",
              "-e",
              "mu-law",
              "-b",
              "8",
              "-",
            ],
          },
          twilio: {
            defaultDialInNumber: "+15551234567",
            defaultPin: "123456",
          },
          voiceCall: {
            enabled: true,
            gatewayUrl: "ws://127.0.0.1:18789",
            dtmfDelayMs: 2500,
          },
          realtime: {
            provider: "openai",
            model: "gpt-realtime",
            instructions: "You are joining a private Google Meet as Peter's OpenClaw agent. Keep replies brief unless asked.",
            toolPolicy: "safe-read-only",
            providers: {
              openai: {
                apiKey: { env: "OPENAI_API_KEY" },
              },
            },
          },
          auth: {
            provider: "google-oauth",
          },
          oauth: {
            clientId: "your-google-oauth-client-id.apps.googleusercontent.com",
            refreshToken: "stored-refresh-token",
          },
        },
      },
    },
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

Використовуйте `action: "status"`, щоб перелічити активні сеанси або перевірити ідентифікатор сеансу. Використовуйте `action: "leave"`, щоб позначити сеанс як завершений.

## Примітки

Офіційний media API Google Meet орієнтований на отримання, тому для розмови в дзвінку Meet усе ще потрібен шлях участі як учасника. Цей Plugin зберігає цю межу видимою: Chrome відповідає за участь через браузер і локальне маршрутизування аудіо; Twilio відповідає за участь через телефонний дозвін.

Режим Realtime надає голосовій моделі один інструмент, `openclaw_agent_consult`, якщо тільки `realtime.toolPolicy` не має значення `none`. Цей інструмент звертається до звичайного агента OpenClaw по стислу усну відповідь, використовуючи нещодавню стенограму зустрічі як контекст. Із `safe-read-only` запуск consult обмежується інструментами читання/пошуку/пам’яті. Із `owner` він успадковує звичайну політику інструментів агента.

Режим Chrome realtime потребує одного з варіантів:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає аудіо 8 kHz G.711 mu-law між цими командами та вибраним провайдером голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого дуплексного аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.
