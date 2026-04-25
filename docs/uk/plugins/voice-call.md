---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-25T04:07:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4615dd2c4e8431ebdff7d79a5323951fec7a9e14947260ef741adeef0907002
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

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте плагін на
**машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

## Встановлення

### Варіант A: встановити з npm (рекомендовано)

```bash
openclaw plugins install @openclaw/voice-call
```

Після цього перезапустіть Gateway.

### Варіант B: встановити з локальної папки (розробка, без копіювання)

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

          // Публічний доступ (оберіть один)
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

Перевірте налаштування перед тестуванням із реальним провайдером:

```bash
openclaw voicecall setup
```

Типовий вивід зручно читати в журналах чату та сесіях термінала. Він перевіряє,
чи увімкнено плагін, чи присутні провайдер і облікові дані, чи налаштовано
публічний доступ до webhook, і чи активний лише один аудіорежим. Для скриптів
використовуйте `openclaw voicecall setup --json`.

Для простого smoke-тесту без сюрпризів виконайте:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Друга команда все ще є сухим запуском. Додайте `--yes`, щоб здійснити короткий
вихідний дзвінок у режимі notify:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Примітки:

- Twilio/Telnyx вимагають **публічно доступної** URL-адреси webhook.
- Plivo вимагає **публічно доступної** URL-адреси webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо у старих конфігураціях досі використовується `provider: "log"`, `twilio.from` або застарілі ключі OpenAI в `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx вимагає `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначений лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, задайте `publicUrl` як точну URL-адресу ngrok; перевірка підпису завжди примусово увімкнена.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook-и Twilio з невалідними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL-адреси ngrok на безкоштовному тарифі можуть змінюватися або додавати проміжну сторінку; якщо `publicUrl` зміниться, підписи Twilio не проходитимуть перевірку. Для production краще використовувати стабільний домен або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його разом із `streaming.enabled`.
- Типові налаштування безпеки для streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають валідний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до початку.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих сокетів до початку для кожної вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).
- Резервний шлях під час виконання поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а шар сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексний голосовий провайдер реального часу для живого аудіо дзвінка.
Він відокремлений від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

Поточна поведінка під час виконання:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує перший
  зареєстрований голосовий провайдер реального часу.
- Вбудовані голосові провайдери реального часу включають Google Gemini Live (`google`) і
  OpenAI (`openai`), які реєструються їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, знаходиться в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`.
  Модель реального часу може викликати його, коли абонент просить глибше
  міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: надає інструмент consult і обмежує звичайного агента
    інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
    `memory_get`.
  - `owner`: надає інструмент consult і дозволяє звичайному агенту використовувати
    звичайну політику інструментів агента.
  - `none`: не надавати інструмент consult. Користувацькі `realtime.tools` все одно
    передаються провайдеру реального часу.
- Ключі сесії consult повторно використовують наявну голосову сесію, коли це можливо, а потім
  резервно використовують номер телефону абонента/одержувача, щоб подальші виклики consult зберігали
  контекст під час дзвінка.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного
  голосового провайдера реального часу, Voice Call записує попередження в журнал і пропускає
  медіа реального часу замість того, щоб ламати весь плагін.

Типові параметри Google Gemini Live realtime:

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
            instructions: "Говори коротко. Викликай openclaw_agent_consult перед використанням складніших інструментів.",
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

Використати OpenAI натомість:

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
для параметрів голосу реального часу, специфічних для провайдера.

## Транскрипція streaming

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо дзвінка.

Поточна поведінка під час виконання:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує перший
  зареєстрований провайдер транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), які реєструються їхніми плагінами провайдерів.
- Необроблена конфігурація, що належить провайдеру, знаходиться в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо жодного провайдера
  транскрипції в реальному часі взагалі не зареєстровано, Voice Call записує попередження в журнал і
  пропускає потокову передачу медіа замість того, щоб ламати весь плагін.

Типові параметри транскрипції OpenAI streaming:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові параметри транскрипції xAI streaming:

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

Використати xAI натомість:

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

## Очищення застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують
термінальний webhook (наприклад, дзвінки в режимі notify, які ніколи не завершуються).
Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Зберігайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
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

Коли перед Gateway стоїть проксі або тунель, плагін відновлює
публічну URL-адресу для перевірки підпису. Ці параметри керують тим,
яким пересланим заголовкам довіряти.

`webhookSecurity.allowedHosts` дозволяє хости зі списку дозволених із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без списку дозволених.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнений для Twilio і Plivo. Повторно відтворені валідні webhook-запити
підтверджуються, але пропускаються без побічних ефектів.

Повороти розмови Twilio включають токен для кожного ходу в callback-ах `<Gather>`, тому
застарілі або повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний хід транскрипції.

Неавтентифіковані webhook-запити відхиляються ще до читання тіла, якщо відсутні
обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла до автентифікації (64 KB / 5 секунд)
плюс обмеження кількості одночасних запитів з однієї IP-адреси до перевірки підпису.

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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `tts.providers.<provider>`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонне аудіо потребує PCM; поточний транспорт Microsoft не надає вихідний PCM для телефонії).
- Базовий TTS використовується, коли увімкнено потокове передавання медіа Twilio; інакше дзвінки повертаються до рідних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS для телефонії недоступний у такому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS для телефонії повертається до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

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

Перевизначити на ElevenLabs лише для дзвінків (залишити типове базове значення в інших місцях):

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

Типове значення політики вхідних дзвінків — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Привіт! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це перевірка caller ID з низьким рівнем гарантії. Плагін
нормалізує значення `From`, надане провайдером, і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку провайдером і цілісність payload, але
не доводить право власності на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентифікацію абонента.

Автовідповіді використовують систему агента. Налаштовуйте через:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає суворий контракт озвученого виводу до system prompt:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує payload-и, позначені як вміст міркувань/помилок.
- Розбирає прямий JSON, JSON в огороджених блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту та видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це допомагає зосередити озвучене відтворення на тексті для абонента та уникнути витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення прив’язана до стану відтворення наживо:

- Очищення черги barge-in та автовідповідь пригнічуються лише поки початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для Twilio streaming починається під час підключення потоку без додаткової затримки.
- Голосові розмови realtime використовують власний початковий хід потоку realtime. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тому вихідні сесії `<Connect><Stream>` залишаються приєднаними.

### Пільговий період відключення потоку Twilio

Коли медіапотік Twilio відключається, Voice Call чекає `2000ms` перед автоматичним завершенням дзвінка:

- Якщо потік повторно підключається протягом цього вікна, автоматичне завершення скасовується.
- Якщо після завершення пільгового періоду потік не зареєстровано повторно, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

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
openclaw voicecall latency                     # підсумувати затримку ходів за журналами
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call. Використовуйте
`--file <path>`, щоб вказати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід включає p50/p90/p99 для
затримки ходу та часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій постачає відповідний документ Skills у `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язане

- [Text-to-speech](/uk/tools/tts)
- [Talk mode](/uk/nodes/talk)
- [Voice wake](/uk/nodes/voicewake)
