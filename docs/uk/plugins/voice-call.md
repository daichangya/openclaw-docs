---
read_when:
    - Ви хочете здійснити вихідний голосовий виклик з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні та вхідні виклики через Twilio/Telnyx/Plivo (установлення плагіна + конфігурація + CLI)'
title: Плагін Voice Call
x-i18n:
    generated_at: "2026-04-25T02:41:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a498c1b34e8aa19a2a966560c95bf4593bbf844a6163831e933f33199ad848d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (плагін)

Голосові виклики для OpenClaw через плагін. Підтримує вихідні сповіщення та
багатоходові розмови з політиками вхідних викликів.

Поточні провайдери:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (розробка/без мережі)

Коротка ментальна модель:

- Установіть плагін
- Перезапустіть Gateway
- Налаштуйте в `plugins.entries.voice-call.config`
- Використовуйте `openclaw voicecall ...` або tool `voice_call`

## Де це працює (локально чи віддалено)

Плагін Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть і налаштуйте плагін на
**машині, де працює Gateway**, а потім перезапустіть Gateway, щоб завантажити його.

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

Установіть конфігурацію в `plugins.entries.voice-call.config`:

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
            // (рядок Base64; також можна встановити через TELNYX_PUBLIC_KEY).
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

          // Публічна доступність (виберіть один варіант)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // необов’язково; перший зареєстрований провайдер транскрипції в реальному часі, якщо не задано
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // необов’язково, якщо встановлено OPENAI_API_KEY
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
            provider: "google", // необов’язково; перший зареєстрований провайдер голосу в реальному часі, якщо не задано
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

Типовий вивід зручний для читання в журналах чату та сеансах термінала. Він перевіряє,
чи ввімкнено плагін, чи наявні провайдер і облікові дані, чи налаштовано
публічну доступність webhook, і чи активний лише один аудіорежим. Використовуйте
`openclaw voicecall setup --json` для скриптів.

Для передбачуваного smoke-тесту виконайте:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Друга команда все ще є dry run. Додайте `--yes`, щоб здійснити короткий
вихідний виклик-сповіщення:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Примітки:

- Twilio/Telnyx вимагають **публічно доступний** URL webhook.
- Plivo вимагає **публічно доступний** URL webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо старі конфігурації все ще використовують `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx вимагає `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо тільки `skipSignatureVerification` не дорівнює true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний тариф ngrok, установіть `publicUrl` точно на URL ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` — це loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL безкоштовного тарифу ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зіб’ється, підписи Twilio не пройдуть перевірку. Для production віддавайте перевагу стабільному домену або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голос-у-голос розмови; не вмикайте його разом із `streaming.enabled`.
- Типові параметри безпеки streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які ніколи не надсилають дійсний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих сокетів до старту.
- `streaming.maxPendingConnectionsPerIp` обмежує неавтентифіковані сокети до старту для кожної вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікування + активні).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для живого аудіо виклику.
Він відокремлений від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі включають Google Gemini Live (`google`) і
  OpenAI (`openai`), які реєструються їхніми плагінами провайдерів.
- Сирий конфіг, яким володіє провайдер, міститься в `realtime.providers.<providerId>`.
- Voice Call типово відкриває спільний tool реального часу `openclaw_agent_consult`.
  Модель реального часу може викликати його, коли абонент просить про глибше
  міркування, поточну інформацію або звичайні tools OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: відкривати tool consult і обмежувати звичайного агента
    до `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
    `memory_get`.
  - `owner`: відкривати tool consult і дозволяти звичайному агенту використовувати
    звичайну політику tools агента.
  - `none`: не відкривати tool consult. Користувацькі `realtime.tools` усе ще
    передаються провайдеру реального часу.
- Ключі сеансу consult повторно використовують наявний голосовий сеанс, коли це можливо, а потім
  переходять до номера телефону абонента/одержувача, щоб повторні виклики consult зберігали
  контекст під час виклику.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного провайдера голосу в реальному часі, Voice Call записує попередження в журнал і пропускає
  медіа реального часу замість того, щоб зламати весь плагін.

Типові параметри реального часу Google Gemini Live:

- API-ключ: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або
  `GOOGLE_GENERATIVE_AI_API_KEY`
- модель: `gemini-2.5-flash-native-audio-preview-12-2025`
- голос: `Kore`

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
            instructions: "Говори коротко. Викликай openclaw_agent_consult перед використанням складніших tools.",
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

Замість цього використайте OpenAI:

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

Див. [провайдер Google](/uk/providers/google) і [провайдер OpenAI](/uk/providers/openai)
для параметрів голосу в реальному часі, специфічних для провайдера.

## Потокова транскрипція

`streaming` вибирає провайдера транскрипції в реальному часі для живого аудіо виклику.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) та xAI
  (`xai`), які реєструються їхніми плагінами провайдерів.
- Сирий конфіг, яким володіє провайдер, міститься в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано жодного
  провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і
  пропускає потокову передачу медіа замість того, щоб зламати весь плагін.

Типові параметри потокової транскрипції OpenAI:

- API-ключ: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- модель: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові параметри потокової транскрипції xAI:

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
                apiKey: "sk-...", // необов’язково, якщо встановлено OPENAI_API_KEY
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

Замість цього використайте xAI:

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
                apiKey: "${XAI_API_KEY}", // необов’язково, якщо встановлено XAI_API_KEY
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

Використовуйте `staleCallReaperSeconds`, щоб завершувати виклики, які ніколи не отримують термінальний webhook
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

Коли перед Gateway стоїть проксі або тунель, плагін реконструює
публічний URL для перевірки підпису. Ці параметри визначають, яким пересланим
заголовкам довіряти.

`webhookSecurity.allowedHosts` задає allowlist хостів із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без allowlist.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам лише тоді, коли
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні webhook-
запити підтверджуються, але пропускаються для побічних ефектів.

Ходи розмови Twilio включають токен на кожен хід у зворотних викликах `<Gather>`, тож
застарілі/повторно відтворені голосові зворотні виклики не можуть задовольнити новіший
хід очікування транскрипту.

Неавтентифіковані webhook-запити відхиляються до зчитування тіла, якщо
відсутні обов’язкові заголовки підпису провайдера.

Webhook voice-call використовує спільний профіль тіла pre-auth (64 KB / 5 секунд)
разом з обмеженням кількості одночасних запитів на IP перед перевіркою підпису.

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

Voice Call використовує конфігурацію core `messages.tts` для
потокового мовлення у викликах. Ви можете перевизначити її в конфігурації плагіна з
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

- Застарілі ключі `tts.<provider>` у конфігурації плагіна (`openai`, `elevenlabs`, `microsoft`, `edge`) автоматично мігрують до `tts.providers.<provider>` під час завантаження. У збереженій конфігурації віддавайте перевагу формі `providers`.
- **Мовлення Microsoft ігнорується для голосових викликів** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає вихідний телефонний PCM).
- Core TTS використовується, коли ввімкнено потокову передачу медіа Twilio; інакше виклики переходять до нативних голосів провайдера.
- Якщо медіапотік Twilio уже активний, Voice Call не переходить до TwiML `<Say>`. Якщо телефонний TTS недоступний у цьому стані, запит відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли телефонний TTS переходить до вторинного провайдера, Voice Call записує попередження в журнал із ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.

### Більше прикладів

Використовувати лише core TTS (без перевизначення):

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

Перевизначити на ElevenLabs лише для викликів (залишити типове значення core в інших місцях):

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

Перевизначити лише модель OpenAI для викликів (приклад глибокого злиття):

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

Політика вхідних викликів типово має значення `disabled`. Щоб увімкнути вхідні виклики, установіть:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` — це фільтр caller ID з низьким рівнем достовірності. Плагін
нормалізує значення `From`, надане провайдером, і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку провайдером і цілісність payload, але
не доводить право власності на номер абонента PSTN/VoIP. Розглядайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентичність абонента.

Автовідповіді використовують систему агента. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call захисно витягує текст мовлення:

- Ігнорує payload, позначені як вміст міркувань/помилок.
- Розбирає прямий JSON, fenced JSON або вбудовані ключі `"spoken"`.
- Переходить до звичайного тексту та видаляє ймовірні вступні абзаци з плануванням/метаданими.

Це зберігає відтворення мовлення зосередженим на тексті для абонента й запобігає витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних викликів `conversation` обробка першого повідомлення прив’язана до стану живого відтворення:

- Очищення черги barge-in і автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, виклик повертається до стану `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio починається при підключенні потоку без додаткової затримки.
- Голосові розмови в реальному часі використовують власний початковий хід потоку реального часу. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сесії `<Connect><Stream>` залишаються підключеними.

### Пільговий період після від’єднання потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає `2000ms` перед автоматичним завершенням виклику:

- Якщо потік перепідключається протягом цього вікна, автозавершення скасовується.
- Якщо після пільгового періоду жоден потік не зареєстровано повторно, виклик завершується, щоб запобігти зависанню активних викликів.

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

`latency` зчитує `calls.jsonl` зі стандартного шляху зберігання voice-call. Використовуйте
`--file <path>`, щоб вказати на інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід містить p50/p90/p99 для затримки
ходів і часу очікування прослуховування.

## Tool агента

Назва tool: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій містить відповідний документ Skills за адресою `skills/voice-call/SKILL.md`.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Пов’язане

- [Перетворення тексту на мовлення](/uk/tools/tts)
- [Режим розмови](/uk/nodes/talk)
- [Голосове пробудження](/uk/nodes/voicewake)
