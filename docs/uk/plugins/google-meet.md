---
read_when:
    - Ви хочете, щоб агент OpenClaw приєднався до дзвінка Google Meet
    - Ви налаштовуєте Chrome або Twilio як транспорт Google Meet
summary: 'Плагін Google Meet: приєднання за явними URL-адресами Meet через Chrome або Twilio із типовими налаштуваннями голосу в реальному часі'
title: Плагін Google Meet
x-i18n:
    generated_at: "2026-04-24T01:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab22760314dd48f5392b3bbd1dba1a11ea2dae530f5e0a1255e6c47cb077042a
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (плагін)

Підтримка учасника Google Meet для OpenClaw.

Плагін є навмисно явним за дизайном:

- Він приєднується лише за явною URL-адресою `https://meet.google.com/...`.
- Голос `realtime` є типовим режимом.
- Автентифікація починається з особистого Google OAuth або вже виконаного входу в профіль Chrome.
- Автоматичного оголошення про згоду немає.
- Типовим аудіобекендом Chrome є `BlackHole 2ch`.
- Twilio приймає номер для дозвону та необов’язковий PIN-код або послідовність DTMF.
- Командою CLI є `googlemeet`; `meet` зарезервовано для ширших сценаріїв телеконференцій агентів.

## Транспорти

### Chrome

Транспорт Chrome відкриває URL-адресу Meet у Google Chrome і приєднується як профіль Chrome, у якому виконано вхід. На macOS плагін перевіряє наявність `BlackHole 2ch` перед запуском. Якщо це налаштовано, він також запускає команду перевірки працездатності аудіомоста та команду запуску перед відкриттям Chrome.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

Спрямуйте аудіо мікрофона та динаміків Chrome через локальний аудіоміст OpenClaw. Якщо `BlackHole 2ch` не встановлено, приєднання завершується помилкою налаштування замість того, щоб тихо приєднатися без аудіошляху.

### Twilio

Транспорт Twilio — це суворий план набору, делегований плагіну Voice Call. Він не аналізує сторінки Meet для пошуку телефонних номерів.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Використовуйте `--dtmf-sequence`, коли для зустрічі потрібна спеціальна послідовність:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth і попередня перевірка

Доступ до Google Meet Media API спочатку використовує особистий клієнт OAuth. Налаштуйте `oauth.clientId` і, за потреби, `oauth.clientSecret`, а потім виконайте:

```bash
openclaw googlemeet auth login --json
```

Команда виводить блок конфігурації `oauth` з токеном оновлення. Вона використовує PKCE, callback localhost на `http://localhost:8085/oauth2callback` і ручний потік копіювання/вставлення з `--manual`.

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

Запустіть попередню перевірку перед роботою з медіа:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Установлюйте `preview.enrollmentAcknowledged: true` лише після підтвердження, що ваш Cloud project, OAuth principal і учасники зустрічі зареєстровані в Google Workspace Developer Preview Program для медіа-API Meet.

## Конфігурація

Установіть конфігурацію в `plugins.entries.google-meet.config`:

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
            // Парний міст команд: вхід записує 8 кГц аудіо G.711 mu-law у stdout.
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
            // Вихід читає 8 кГц аудіо G.711 mu-law зі stdin.
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
            instructions: "Ви приєднуєтеся до приватної зустрічі Google Meet як агент OpenClaw Пітера. Відповідайте стисло, якщо не попросять про інше.",
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

Використовуйте `action: "status"`, щоб переглянути активні сесії або перевірити ідентифікатор сесії. Використовуйте `action: "leave"`, щоб позначити сесію як завершену.

## Примітки

Офіційний медіа-API Google Meet орієнтований на приймання, тому для мовлення в дзвінок Meet усе ще потрібен шлях учасника. Цей плагін робить цю межу видимою: Chrome обробляє участь через браузер і локальну маршрутизацію аудіо; Twilio обробляє участь через телефонний дозвін.

Режиму realtime у Chrome потрібне одне з такого:

- `chrome.audioInputCommand` плюс `chrome.audioOutputCommand`: OpenClaw керує мостом моделі realtime і передає 8 кГц аудіо G.711 mu-law між цими командами та вибраним постачальником голосу realtime.
- `chrome.audioBridgeCommand`: зовнішня команда моста керує всім локальним аудіошляхом і має завершитися після запуску або перевірки свого демона.

Для чистого двостороннього аудіо спрямовуйте вихід Meet і мікрофон Meet через окремі віртуальні пристрої або граф віртуальних пристроїв у стилі Loopback. Один спільний пристрій BlackHole може повертати голоси інших учасників назад у дзвінок.
