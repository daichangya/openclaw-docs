---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (установлення плагіна + конфігурація + CLI)'
title: Плагін Voice Call
x-i18n:
    generated_at: "2026-04-05T18:13:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові дзвінки для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатоходові розмови з політиками для вхідних дзвінків.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Швидка ментальна модель:

- Установіть плагін
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **усередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте плагін на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Установлення

### Варіант A: установлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (розробка, без копіювання)

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
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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
- Якщо у старих конфігураціях досі використовується `provider: "log"`, `twilio.from` або застарілі ключі OpenAI в `streaming.*`, запустіть `openclaw doctor --fix`, щоб переписати їх.
- Для Telnyx потрібен `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний рівень ngrok, установіть `publicUrl` на точний URL ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook-виклики Twilio з невалідними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — це loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси ngrok на безкоштовному рівні можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio перестануть проходити перевірку. Для production краще використовувати стабільний домен або Tailscale funnel.
- Типові параметри безпеки streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають валідний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту для кожної IP-адреси джерела.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Транскрибування потоку

`streaming` вибирає провайдера транскрибування в реальному часі для аудіо живого дзвінка.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо його не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрибування в реальному часі.
- Наразі bundled-провайдером є OpenAI, зареєстрований bundled-плагіном `openai`.
- Сирий конфіг провайдера зберігається в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано
  жодного провайдера транскрибування в реальному часі, Voice Call записує попередження в журнал і
  пропускає потокову передачу медіа замість того, щоб аварійно завершити весь плагін.

Типові значення для потокового транскрибування OpenAI:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- модель: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

Застарілі ключі все ще автоматично мігруються за допомогою `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Очищення застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують термінальний webhook
(наприклад, дзвінки в режимі notify, які так і не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Зберігайте це значення **більшим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
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

## Безпека webhook

Коли перед Gateway стоїть проксі або тунель, плагін реконструює
публічний URL для перевірки підпису. Ці параметри керують тим,
яким пересланим заголовкам довіряти.

`webhookSecurity.allowedHosts` задає allowlist хостів із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` дає змогу довіряти пересланим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` дає змогу довіряти пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio і Plivo. Повторно відтворені валідні webhook-запити
підтверджуються, але пропускаються для побічних ефектів.

Ходи розмови Twilio містять токен для кожного ходу в callback-викликах `<Gather>`, тому
застарілі або повторно відтворені callback-виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипту.

Неавтентифіковані webhook-запити відхиляються ще до читання тіла, якщо
немає обов’язкових заголовків підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 КБ / 5 секунд),
а також обмеження кількості одночасних запитів на IP до перевірки підпису.

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

Voice Call використовує конфігурацію ядра `messages.tts` для
потокового відтворення мовлення під час дзвінків. Ви можете перевизначити її в конфігурації плагіна з
**тією самою структурою** — вона глибоко об’єднується з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються в `tts.providers.<provider>` під час завантаження. У конфігурації, що зберігається в репозиторії, віддавайте перевагу структурі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає телефонний вихід PCM).
- Під час увімкненого потокового медіа Twilio використовується ядровий TTS; інакше дзвінки переходять до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не переходить на TwiML `<Say>`. Якщо в цьому стані телефонний TTS недоступний, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS переходить на резервного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовуйте лише ядровий TTS (без перевизначення):

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

Перевизначте на ElevenLabs лише для дзвінків (залишивши типове ядро в інших місцях):

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

Перевизначте лише модель OpenAI для дзвінків (приклад глибокого об’єднання):

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

Типове значення політики для вхідних дзвінків — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` — це низькорівневий екран caller ID. Плагін
нормалізує значення `From`, надане провайдером, і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку від провайдера і цілісність корисного навантаження, але
не доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агента. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст для озвучення:

- Ігнорує payload, позначений як контент міркування/помилки.
- Аналізує прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє абзаци на початку, які ймовірно є плануванням/метатекстом.

Це дає змогу зосередити озвучення на тексті для абонента й уникнути потрапляння тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише поки активно озвучується початкове привітання.
- Якщо початкове відтворення не вдається, дзвінок повертається до стану `listening`, а початкове повідомлення лишається в черзі для повторної спроби.
- Початкове відтворення для потоків Twilio починається після підключення потоку без додаткової затримки.

### Пільговий період після від’єднання потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає `2000ms`, перш ніж автоматично завершити дзвінок:

- Якщо потік повторно підключиться протягом цього вікна, автоматичне завершення скасовується.
- Якщо після завершення пільгового періоду потік не буде повторно зареєстровано, дзвінок завершується, щоб запобігти зависанню активних дзвінків.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для
затримки ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

У цьому репозиторії є відповідний документ навички в `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
