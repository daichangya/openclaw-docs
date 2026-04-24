---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні та вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-24T22:14:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b033d9c46fa1af60c3ae2d22f8bad909ee179ef01926efca5b62b9f8a30375f
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

- Встановіть Plugin
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або інструмент `voice_call`

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **усередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте плагін на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Встановлення

### Варіант A: встановлення з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної теки (розробка, без копіювання)

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
          fromNumber: "+15550001234", // або TWILIO_FROM_NUMBER для Twilio
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

          // Публічна доступність (оберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; якщо не задано, використовується перший зареєстрований провайдер транскрибування в реальному часі
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

          realtime: {
            enabled: false,
            provider: "google", // необов’язково; якщо не задано, використовується перший зареєстрований голосовий провайдер реального часу
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Примітки:

- Twilio/Telnyx потребують **публічно доступної** URL-адреси Webhook.
- Plivo потребує **публічно доступної** URL-адреси Webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо в старих конфігураціях досі використовується `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx вимагає `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє Webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є local loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не пройдуть перевірку. Для production надавайте перевагу стабільному домену або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його разом із `streaming.enabled`.
- Типові значення безпеки для streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до старту на одну IP-адресу джерела.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).
- Під час виконання fallback наразі все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного голосового провайдера реального часу для аудіо живого виклику.
Це окремо від `streaming`, який лише передає аудіо провайдерам
транскрибування в реальному часі.

Поточна поведінка під час виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого голосового провайдера реального часу.
- До вбудованих голосових провайдерів реального часу належать Google Gemini Live (`google`) і
  OpenAI (`openai`), зареєстровані їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, розміщується в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`.
  Модель реального часу може викликати його, коли абонент просить про глибше
  міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: надає інструмент consult і обмежує звичайного агента
    до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
    `memory_get`.
  - `owner`: надає інструмент consult і дозволяє звичайному агенту використовувати звичайну
    політику інструментів агента.
  - `none`: не надає інструмент consult. Користувацькі `realtime.tools` усе ще
    передаються провайдеру реального часу.
- Ключі сесії consult повторно використовують наявну голосову сесію, коли це можливо, а потім
  переходять на номер телефону абонента/адресата, щоб подальші виклики consult
  зберігали контекст під час дзвінка.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано
  жодного голосового провайдера реального часу, Voice Call записує попередження в журнал і пропускає
  медіа реального часу замість того, щоб зупиняти весь плагін.

Типові значення Google Gemini Live realtime:

- API-ключ: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або
  `GOOGLE_GENERATIVE_AI_API_KEY`
- model: `gemini-2.5-flash-native-audio-preview-12-2025`
- voice: `Kore`

Приклад:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Говоріть коротко. Викликайте openclaw_agent_consult перед використанням глибших інструментів.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Використання OpenAI натомість:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Див. [Google provider](/uk/providers/google) і [OpenAI provider](/uk/providers/openai)
для параметрів голосового realtime, специфічних для провайдера.

## Транскрибування потоку

`streaming` вибирає провайдера транскрибування в реальному часі для аудіо живого виклику.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрибування в реальному часі.
- До вбудованих провайдерів транскрибування в реальному часі належать Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, розміщується в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або взагалі не зареєстровано
  жодного провайдера транскрибування в реальному часі, Voice Call записує попередження в журнал і
  пропускає медіапотік замість того, щоб зупиняти плагін.

Типові значення транскрибування OpenAI для streaming:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові значення транскрибування xAI для streaming:

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

Використання xAI натомість:

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

## Засіб очищення застарілих викликів

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують фінальний Webhook
(наприклад, виклики в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Зберігайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні виклики могли
  завершитися. Добра стартова точка — `maxDurationSeconds + 30–60` секунд.

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

Коли проксі або тунель розташовано перед Gateway, плагін реконструює
публічну URL-адресу для перевірки підпису. Ці параметри керують тим, яким
пересланим заголовкам довіряти.

`webhookSecurity.allowedHosts` формує allowlist хостів із заголовків переспрямування.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення Webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні Webhook-запити
підтверджуються, але пропускаються без побічних ефектів.

Ходи розмови Twilio включають токен на кожен хід у зворотних викликах `<Gather>`, тому
застарілі/повторно відтворені зворотні виклики мовлення не можуть задовольнити новіший очікуваний хід транскрипції.

Неавтентифіковані Webhook-запити відхиляються ще до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла pre-auth (64 KB / 5 секунд)
плюс обмеження кількості одночасних запитів на IP перед перевіркою підпису.

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
потокового мовлення в дзвінках. Ви можете перевизначити її в конфігурації плагіна з
**такою самою структурою** — вона глибоко об’єднується з `messages.tts`.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігруються в `tts.providers.<provider>` під час завантаження. У збереженій конфігурації надавайте перевагу структурі `providers`.
- **Microsoft speech ігнорується для голосових дзвінків** (аудіо телефонії потребує PCM; поточний транспорт Microsoft не надає вихід PCM для телефонії).
- Основний TTS використовується, коли увімкнено потокову передачу медіа Twilio; інакше дзвінки повертаються до вбудованих голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS телефонії недоступний у такому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS телефонії повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

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

Перевизначити на ElevenLabs лише для дзвінків (залишити основне типове значення деінде):

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

Перевизначити лише модель OpenAI для дзвінків (приклад глибокого об’єднання):

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

Типове значення політики вхідних викликів — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це фільтр caller ID з низьким рівнем довіри. Плагін
нормалізує значення `From`, надане провайдером, і порівнює його з `allowFrom`.
Перевірка Webhook автентифікує доставку провайдером і цілісність даних, але
не доводить право власності на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агента. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає строгий контракт озвученого виводу до системного prompt:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує payload, позначені як вміст міркувань/помилок.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту і видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це зберігає відтворення мовлення зосередженим на тексті для абонента та запобігає витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків у режимі `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише поки початкове привітання активно відтворюється.
- Якщо початкове відтворення не вдається, дзвінок повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio запускається при підключенні потоку без додаткової затримки.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються під’єднаними.

### Пільговий період після відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call очікує `2000ms` перед автоматичним завершенням дзвінка:

- Якщо потік перепідключається протягом цього вікна, авто-завершення скасовується.
- Якщо після завершення пільгового періоду потік не реєструється знову, дзвінок завершується, щоб запобігти зависанню активних дзвінків.

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
openclaw voicecall latency                     # зведення затримки ходів із журналів
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

У цьому репозиторії постачається відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язане

- [Синтез мовлення](/uk/tools/tts)
- [Режим розмови](/uk/nodes/talk)
- [Голосова активація](/uk/nodes/voicewake)
