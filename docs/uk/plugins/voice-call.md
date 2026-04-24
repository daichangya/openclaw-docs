---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + налаштування + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-24T00:54:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові дзвінки для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатоходові розмови з політиками вхідних викликів.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Швидка ментальна модель:

- Встановіть плагін
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де він працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте плагін на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Встановлення

### Варіант A: встановлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної папки (розробка, без копіювання)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Налаштування

Задайте конфігурацію в `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // або "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // або TWILIO_FROM_NUMBER для Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Публічний ключ webhook Telnyx з Telnyx Mission Control Portal
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

          // Публічна експозиція (оберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; якщо не задано, використовується перший зареєстрований провайдер транскрипції в реальному часі
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
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо старіші конфігурації все ще використовують `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, запустіть `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` точно як URL ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook-и Twilio з невалідними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-и безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не проходитимуть перевірку. Для продакшну віддавайте перевагу стабільному домену або воронці Tailscale.
- Типові параметри безпеки Streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають валідний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту на одну вихідну IP-адресу.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікуваних + активних).
- Резервний механізм під час виконання поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Streaming transcription

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо викликів наживо.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує
  першого зареєстрованого провайдера транскрипції в реальному часі.
- До вбудованих провайдерів транскрипції в реальному часі входять Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) та xAI
  (`xai`), які реєструються їхніми плагінами провайдерів.
- Необроблена конфігурація, якою володіє провайдер, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера, або якщо взагалі не зареєстровано жодного
  провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і
  пропускає медіа-Streaming замість того, щоб зірвати роботу всього плагіна.

Типові параметри транскрипції Streaming OpenAI:

- Ключ API: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові параметри транскрипції Streaming xAI:

- Ключ API: `streaming.providers.xai.apiKey` або `XAI_API_KEY`
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

Натомість використовуйте xAI:

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

## Очищення застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінальний webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли
  завершитися. Хороша початкова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли перед Gateway стоїть проксі або тунель, плагін реконструює
публічний URL для перевірки підпису. Ці параметри визначають, яким
переспрямованим заголовкам довіряти.

`webhookSecurity.allowedHosts` формує allowlist хостів із заголовків переспрямування.

`webhookSecurity.trustForwardingHeaders` довіряє переспрямованим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє переспрямованим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio та Plivo. Повторно відтворені валідні webhook-
запити підтверджуються, але їхні побічні ефекти пропускаються.

Ходи розмови Twilio включають окремий токен для кожного ходу в callback-ах `<Gather>`, тому
застарілі/повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний хід транскрипції.

Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд)
разом з обмеженням одночасних запитів на IP перед перевіркою підпису.

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

## TTS для викликів

Voice Call використовує основну конфігурацію `messages.tts` для
Streaming мовлення у викликах. Ви можете перевизначити її в конфігурації плагіна з
**тією самою структурою** — вона виконує deep merge з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються до `tts.providers.<provider>` під час завантаження. У збереженій конфігурації віддавайте перевагу структурі `providers`.
- **Microsoft speech ігнорується для голосових викликів** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає телекомунікаційний PCM-вивід).
- Основний TTS використовується, коли ввімкнено Twilio media streaming; інакше виклики повертаються до рідних голосів провайдера.
- Якщо потік медіа Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо телекомунікаційний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телекомунікаційний TTS повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

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

Перевизначити на ElevenLabs лише для викликів (зберегти основне значення за замовчуванням деінде):

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

Перевизначити лише модель OpenAI для викликів (приклад deep merge):

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

## Вхідні виклики

Типова політика вхідних викликів — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це низьконадійний фільтр caller ID. Плагін
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку від провайдера та цілісність payload, але
вона не доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як надійну ідентифікацію абонента.

Автовідповіді використовують систему агентів. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає суворий контракт озвученого виводу до system prompt:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци з плануванням/метакоментарями.

Це дозволяє зосередити озвучене відтворення на тексті, призначеному для абонента, і уникнути потрапляння тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до стану відтворення наживо:

- Очищення черги barge-in і автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для Twilio streaming запускається при підключенні потоку без додаткової затримки.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms`, перш ніж автоматично завершити виклик:

- Якщо потік перепідключається протягом цього вікна, авто-завершення скасовується.
- Якщо після завершення пільгового періоду потік не реєструється знову, виклик завершується, щоб запобігти завислим активним викликам.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # підсумувати затримку ходів із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки
ходів і часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій містить відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язане

- [Text-to-speech](/uk/tools/tts)
- [Режим розмови](/uk/nodes/talk)
- [Голосова активація](/uk/nodes/voicewake)
