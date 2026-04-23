---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте plugin voice-call
summary: 'Plugin Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (установлення plugin + конфігурація + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-23T23:03:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27287618216afc61290182cc1b9117d2a8672f6686911a7e0ca5bad8f5ddd6ab
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

Голосові дзвінки для OpenClaw через plugin. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних викликів.

Поточні provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (dev/без мережі)

Швидка ментальна модель:

- Установіть plugin
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Plugin Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте plugin на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Установлення

### Варіант A: установлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (dev, без копіювання)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Конфігурація

Задайте конфігурацію в `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // або "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Публічний ключ Webhook Telnyx з Telnyx Mission Control Portal
            // (рядок Base64; також можна задати через TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Сервер Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Безпека Webhook (рекомендовано для тунелів/проксі)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Публічне відкриття (виберіть одне)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; перший зареєстрований provider транскрибування в реальному часі, якщо не задано
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // необов’язково, якщо задано OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Примітки:

- Twilio/Telnyx потребують **публічно доступного** URL Webhook.
- Plivo потребує **публічно доступного** URL Webhook.
- `mock` — це локальний dev-provider (без мережевих викликів).
- Якщо у старіших конфігураціях досі використовуються `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусово застосовується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не проходитимуть перевірку. Для production віддавайте перевагу стабільному домену або funnel Tailscale.
- Значення безпеки streaming за замовчуванням:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для однієї вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).
- Runtime fallback поки що все ще приймає старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Потокове транскрибування

`streaming` вибирає provider транскрибування в реальному часі для живого аудіо дзвінка.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого provider транскрибування в реальному часі.
- До комплектних provider транскрибування в реальному часі входять Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), які реєструються їхніми plugin provider.
- Необроблена конфігурація provider розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого provider або якщо взагалі не зареєстровано
  жодного provider транскрибування в реальному часі, Voice Call записує попередження й
  пропускає медіапотік замість збою всього plugin.

Значення транскрибування OpenAI за замовчуванням:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Значення транскрибування xAI за замовчуванням:

- API-ключ: `streaming.providers.xai.apiKey` або `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // необов’язково, якщо задано OPENAI_API_KEY
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Натомість використати xAI:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // необов’язково, якщо задано XAI_API_KEY
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Застарілі ключі все ще автоматично мігруються через `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Очищувач застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують фінальний Webhook
(наприклад, дзвінки в режимі notify, які ніколи не завершуються). Значення за замовчуванням — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
  завершитися. Хороша стартова точка — `maxDurationSeconds + 30–60` секунд.

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Безпека Webhook

Коли перед Gateway стоїть проксі або тунель, plugin відновлює
публічний URL для перевірки підпису. Ці параметри визначають, яким пересланим
заголовкам довіряти.

`webhookSecurity.allowedHosts` створює allowlist хостів із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні запити Webhook
підтверджуються, але пропускаються для побічних ефектів.

Ходи розмови Twilio включають токен для кожного ходу в callback ` <Gather>`, тож
застарілі/повторно відтворені callback мовлення не можуть задовольнити новіший очікуваний хід транскрипції.

Неавтентифіковані запити Webhook відхиляються до читання тіла, якщо відсутні
обов’язкові заголовки підпису provider.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд)
плюс обмеження кількості одночасних запитів з однієї IP до перевірки підпису.

Приклад зі стабільним публічним хостом:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS для дзвінків

Voice Call використовує основну конфігурацію `messages.tts` для
потокового мовлення в дзвінках. Ви можете перевизначити її в конфігурації plugin з
**тією самою формою** — вона глибоко зливається з `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Примітки:

- Застарілі ключі `tts.<provider>` всередині конфігурації plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються в `tts.providers.<provider>` під час завантаження. У конфігурації, що комітиться, віддавайте перевагу формі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонне аудіо потребує PCM; поточний транспорт Microsoft не надає телефонний PCM-вивід).
- Основний TTS використовується, коли ввімкнено медіапотік Twilio; інакше дзвінки повертаються до нативних голосів provider.
- Якщо медіапотік Twilio уже активний, Voice Call не повертається до TwiML `<Say>`. Якщо в такому стані телефонний TTS недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS повертається до вторинного provider, Voice Call записує попередження з ланцюжком provider (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише основний TTS (без перевизначення):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Перевизначити на ElevenLabs лише для дзвінків (залишити основне значення за замовчуванням деінде):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Перевизначити лише модель OpenAI для дзвінків (приклад глибокого злиття):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Вхідні дзвінки

Політика вхідних викликів за замовчуванням має значення `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це фільтр caller ID з низьким рівнем гарантії. Plugin
нормалізує значення `From`, надане provider, і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку provider і цілісність payload, але
не доводить право власності на номер викликача в PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентичність викликача.

Автовідповіді використовують систему агента. Налаштовується через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до system prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначений як content міркування/помилки.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це допомагає зосередити озвучене відтворення на тексті для викликача й уникнути витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги через barge-in і автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокового Twilio починається після підключення потоку без додаткової затримки.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms`, перш ніж автоматично завершити дзвінок:

- Якщо потік перепідключається впродовж цього вікна, авто-завершення скасовується.
- Якщо після завершення пільгового періоду потік не реєструється знову, дзвінок завершується, щоб уникнути завислих активних дзвінків.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # підсумувати затримку ходу з журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки
ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

У цьому репозиторії є відповідний документ Skills за адресою `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язано

- [Text-to-speech](/uk/tools/tts)
- [Режим Talk](/uk/nodes/talk)
- [Голосова активація](/uk/nodes/voicewake)
