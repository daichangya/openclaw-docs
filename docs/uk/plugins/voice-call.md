---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice Call
x-i18n:
    generated_at: "2026-04-23T00:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4106c156a52e06047d31a149b2944f50b38c41e5db664efa1f2a96b2b20fa88d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові дзвінки для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатокрокові розмови з політиками для вхідних викликів.

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

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте плагін на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб він завантажив плагін.

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
            // Публічний ключ webhook Telnyx з Telnyx Mission Control Portal
            // (рядок Base64; також можна задати через TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Сервер webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Безпека webhook (рекомендовано для тунелів/проксі)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Публічний доступ (виберіть один варіант)
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

- Для Twilio/Telnyx потрібен **публічно доступний** URL webhook.
- Для Plivo потрібен **публічно доступний** URL webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо у старіших конфігураціях досі використовуються `provider: "log"`, `twilio.from` або застарілі ключі OpenAI в `streaming.*`, запустіть `openclaw doctor --fix`, щоб переписати їх.
- Для Telnyx потрібен `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначений лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` як точний URL ngrok; перевірка підпису завжди примусово увімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Використовуйте тільки для локальної розробки.
- URL безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не проходитимуть перевірку. Для продакшну надавайте перевагу стабільному домену або Tailscale funnel.
- Типові параметри безпеки для streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для однієї вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- Під час виконання fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Транскрипція streaming

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо дзвінка.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми плагінами провайдерів.
- Сирий конфіг провайдера зберігається в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера, або якщо жодного провайдера
  транскрипції в реальному часі взагалі не зареєстровано, Voice Call записує попередження в лог і
  пропускає медіа streaming замість того, щоб завершити роботу всього плагіна з помилкою.

Типові параметри транскрипції OpenAI для streaming:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові параметри транскрипції xAI для streaming:

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

Використання xAI замість цього:

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

## Очищувач застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінальний webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Продакшн:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли
  завершитися. Хороша відправна точка — `maxDurationSeconds + 30–60` секунд.

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

## Безпека webhook

Коли перед Gateway стоїть проксі або тунель, плагін відновлює
публічний URL для перевірки підпису. Ці параметри керують тим,
яким переспрямованим заголовкам довіряти.

`webhookSecurity.allowedHosts` визначає дозволений список хостів із заголовків переспрямування.

`webhookSecurity.trustForwardingHeaders` дозволяє довіряти переспрямованим заголовкам без списку дозволених хостів.

`webhookSecurity.trustedProxyIPs` дозволяє довіряти переспрямованим заголовкам, лише якщо
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні webhook-
запити підтверджуються, але пропускаються без побічних ефектів.

Кроки розмови Twilio включають токен для кожного кроку в callback `\<Gather>`, тому
застарілі/повторно відтворені callback мовлення не можуть задовольнити новіший очікуваний крок транскрипції.

Неавтентифіковані webhook-запити відхиляються до читання тіла запиту, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 KB / 5 секунд)
разом з обмеженням кількості одночасних запитів на IP до перевірки підпису.

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

Voice Call використовує базову конфігурацію `messages.tts` для
streaming мовлення в дзвінках. Ви можете перевизначити її в конфігурації плагіна з
**тією самою структурою** — вона глибоко зливається з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються до `tts.providers.<provider>` під час завантаження. У збереженій конфігурації надавайте перевагу структурі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (для телеком-аудіо потрібен PCM; поточний транспорт Microsoft не надає вихід PCM для телефонії).
- Базовий TTS використовується, коли увімкнено медіа streaming Twilio; інакше дзвінки повертаються до рідних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS для телефонії в цьому стані недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії повертається до вторинного провайдера, Voice Call записує попередження в лог із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише базовий TTS (без перевизначення):

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

Перевизначити на ElevenLabs лише для дзвінків (залишити базове значення в інших місцях):

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

## Вхідні виклики

Типове значення політики вхідних викликів — `disabled`. Щоб увімкнути вхідні виклики, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це фільтр caller ID з низьким рівнем гарантії. Плагін
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку від провайдера та цілісність даних, але
вона не доводить право власності на номер викликача в PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію викликача.

Автовідповіді використовують систему агента. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає суворий контракт озвученого виводу до системного запиту:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст для озвучення:

- Ігнорує дані, позначені як reasoning/error content.
- Розбирає прямий JSON, JSON в огороджених блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та прибирає ймовірні вступні абзаци з плануванням/метаінформацією.

Це дозволяє зосередити озвучення на тексті, призначеному для абонента, і уникнути витоку тексту планування в аудіо.

### Поведінка під час запуску розмови

Для вихідних викликів у режимі `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення не вдається, виклик повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для Twilio streaming починається після підключення потоку без додаткової затримки.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call очікує `2000ms` перед автоматичним завершенням виклику:

- Якщо потік повторно підключається протягом цього вікна, автозавершення скасовується.
- Якщо після завершення пільгового періоду потік не реєструється повторно, виклик завершується, щоб не допустити завислих активних викликів.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # псевдонім для call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # звести затримку кроків із логів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід включає p50/p90/p99 для затримки кроків
і часу очікування в режимі прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій постачає відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
