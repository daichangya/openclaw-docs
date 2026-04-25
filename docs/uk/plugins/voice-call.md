---
read_when:
    - Ви хочете здійснити вихідний голосовий дзвінок з OpenClaw
    - Ви налаштовуєте або розробляєте плагін voice-call
summary: 'Плагін Voice Call: вихідні + вхідні дзвінки через Twilio/Telnyx/Plivo (встановлення плагіна + конфігурація + CLI)'
title: Плагін Voice call
x-i18n:
    generated_at: "2026-04-25T19:29:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f6cb9346b63751756b8c6744b56486d1856b2d0f3b94082ced42c7435595d6
    source_path: plugins/voice-call.md
    workflow: 15
---

Голосові дзвінки для OpenClaw через Plugin. Підтримує вихідні сповіщення та
багатоходові розмови з політиками вхідних дзвінків.

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

Plugin Voice Call працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть/налаштуйте Plugin на **машині, де працює Gateway**, а потім перезапустіть Gateway, щоб його завантажити.

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

Якщо `enabled` має значення true, але для вибраного провайдера відсутні облікові дані, під час запуску Gateway у журналах з’явиться попередження про незавершене налаштування з відсутніми ключами, і запуск runtime буде пропущено. Виконайте `openclaw voicecall setup`, щоб побачити ті самі відомості про готовність. Команди, RPC-виклики й інструменти агента все одно повертають точну інформацію про відсутню конфігурацію провайдера під час використання.

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
            // Публічний ключ webhook Telnyx з порталу Telnyx Mission Control
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

          // Публічний доступ (виберіть один варіант)
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

Перед тестуванням із реальним провайдером перевірте налаштування:

```bash
openclaw voicecall setup
```

Типовий вивід зручно читати в журналах чату та сеансах термінала. Він перевіряє,
чи увімкнено Plugin, чи наявні провайдер і облікові дані, чи налаштовано публічний доступ до webhook, і чи активний лише один аудіорежим. Для скриптів використовуйте
`openclaw voicecall setup --json`.

Для Twilio, Telnyx і Plivo налаштування має визначити публічний URL webhook. Якщо
налаштований `publicUrl`, URL тунелю, URL Tailscale або резервний `serve`
вказує на loopback чи простір приватної мережі, налаштування завершується помилкою замість запуску провайдера, який не може приймати реальні webhook від оператора.

Для простого smoke-тесту без сюрпризів виконайте:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

Друга команда все ще є dry run. Додайте `--yes`, щоб здійснити короткий вихідний
дзвінок у режимі notify:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Примітки:

- Twilio/Telnyx потребують **публічно доступного** URL webhook.
- Plivo потребує **публічно доступного** URL webhook.
- `mock` — це локальний провайдер для розробки (без мережевих викликів).
- Якщо в старих конфігураціях досі використовується `provider: "log"`, `twilio.from` або застарілі ключі OpenAI `streaming.*`, виконайте `openclaw doctor --fix`, щоб переписати їх.
- Telnyx потребує `telnyx.publicKey` (або `TELNYX_PUBLIC_KEY`), якщо лише `skipSignatureVerification` не має значення true.
- `skipSignatureVerification` призначено лише для локального тестування.
- Якщо ви використовуєте безкоштовний рівень ngrok, задайте `publicUrl` точно як URL ngrok; перевірка підпису завжди примусово виконується.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` дозволяє webhook Twilio з недійсними підписами **лише** коли `tunnel.provider="ngrok"` і `serve.bind` є loopback (локальний агент ngrok). Використовуйте лише для локальної розробки.
- URL безкоштовного рівня ngrok можуть змінюватися або додавати проміжну поведінку; якщо `publicUrl` зміниться, підписи Twilio не пройдуть перевірку. Для production краще використовувати стабільний домен або Tailscale funnel.
- `realtime.enabled` запускає повноцінні голосові розмови voice-to-voice; не вмикайте його разом із `streaming.enabled`.
- Типові параметри безпеки streaming:
  - `streaming.preStartTimeoutMs` закриває сокети, які так і не надсилають коректний кадр `start`.
- `streaming.maxPendingConnections` обмежує загальну кількість неавтентифікованих pre-start сокетів.
- `streaming.maxPendingConnectionsPerIp` обмежує кількість неавтентифікованих pre-start сокетів для кожної вихідної IP-адреси.
- `streaming.maxConnections` обмежує загальну кількість відкритих сокетів медіапотоку (очікувані + активні).
- Runtime fallback поки що все ще приймає ці старі ключі voice-call, але шлях переписування — це `openclaw doctor --fix`, а shim сумісності є тимчасовим.

## Голосові розмови в реальному часі

`realtime` вибирає повнодуплексного провайдера голосу в реальному часі для аудіо
живих дзвінків. Це окремо від `streaming`, який лише пересилає аудіо до
провайдерів транскрипції в реальному часі.

Поточна поведінка runtime:

- `realtime.enabled` підтримується для Twilio Media Streams.
- `realtime.enabled` не можна поєднувати з `streaming.enabled`.
- `realtime.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера голосу в реальному часі.
- Вбудовані провайдери голосу в реальному часі включають Google Gemini Live (`google`) і
  OpenAI (`openai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, якою керує провайдер, міститься в `realtime.providers.<providerId>`.
- Voice Call типово надає спільний інструмент реального часу `openclaw_agent_consult`.
  Модель реального часу може викликати його, коли абонент просить глибше
  міркування, актуальну інформацію або звичайні інструменти OpenClaw.
- `realtime.toolPolicy` керує запуском consult:
  - `safe-read-only`: надавати інструмент consult і обмежувати звичайного агента
    інструментами `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` і
    `memory_get`.
  - `owner`: надавати інструмент consult і дозволяти звичайному агенту використовувати звичайну
    політику інструментів агента.
  - `none`: не надавати інструмент consult. Користувацькі `realtime.tools` усе одно
    передаються провайдеру реального часу.
- Ключі сеансу consult повторно використовують наявний голосовий сеанс, коли це можливо, а потім
  переходять до номера телефону абонента/одержувача, щоб подальші виклики consult зберігали
  контекст під час дзвінка.
- Якщо `realtime.provider` вказує на незареєстрованого провайдера, або якщо взагалі не зареєстровано
  жодного провайдера голосу в реальному часі, Voice Call записує попередження в журнал і пропускає
  медіа реального часу замість того, щоб зламати весь Plugin.

Типові налаштування реального часу Google Gemini Live:

- API key: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` або
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
            instructions: "Говори коротко. Викликай openclaw_agent_consult перед використанням глибших інструментів.",
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

Замість цього використовуйте OpenAI:

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
для параметрів голосу в реальному часі, специфічних для провайдера.

## Транскрипція streaming

`streaming` вибирає провайдера транскрипції в реальному часі для аудіо живих дзвінків.

Поточна поведінка runtime:

- `streaming.provider` є необов’язковим. Якщо не задано, Voice Call використовує першого
  зареєстрованого провайдера транскрипції в реальному часі.
- Вбудовані провайдери транскрипції в реальному часі включають Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) і xAI
  (`xai`), зареєстровані їхніми Plugin провайдерів.
- Необроблена конфігурація, якою керує провайдер, міститься в `streaming.providers.<providerId>`.
- Якщо `streaming.provider` вказує на незареєстрованого провайдера або якщо взагалі не зареєстровано
  жодного провайдера транскрипції в реальному часі, Voice Call записує попередження в журнал і
  пропускає медіапотік замість того, щоб зламати весь Plugin.

Типові налаштування транскрипції streaming OpenAI:

- API key: `streaming.providers.openai.apiKey` або `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Типові налаштування транскрипції streaming xAI:

- API key: `streaming.providers.xai.apiKey` або `XAI_API_KEY`
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

Замість цього використовуйте xAI:

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

Застарілі ключі все ще автоматично мігруються за допомогою `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Очищувач застарілих дзвінків

Використовуйте `staleCallReaperSeconds`, щоб завершувати дзвінки, які ніколи не отримують термінальний webhook
(наприклад, дзвінки в режимі notify, які ніколи не завершуються). Типове значення — `0`
(вимкнено).

Рекомендовані діапазони:

- **Production:** `120`–`300` секунд для потоків у стилі notify.
- Тримайте це значення **вищим за `maxDurationSeconds`**, щоб звичайні дзвінки могли
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

Коли перед Gateway розташований проксі або тунель, Plugin відновлює
публічний URL для перевірки підпису. Ці параметри керують тим,
яким пересланим заголовкам довіряти.

`webhookSecurity.allowedHosts` задає список дозволених хостів із пересланих заголовків.

`webhookSecurity.trustForwardingHeaders` довіряє пересланим заголовкам без списку дозволених.

`webhookSecurity.trustedProxyIPs` довіряє пересланим заголовкам, лише якщо
віддалена IP-адреса запиту збігається зі списком.

Захист від повторного відтворення webhook увімкнено для Twilio і Plivo. Повторно відтворені коректні webhook-запити
підтверджуються, але пропускаються щодо побічних ефектів.

Повороти розмови Twilio включають токен на кожен поворот у зворотних викликах `<Gather>`, тож
застарілі/повторно відтворені callback-и мовлення не можуть задовольнити новіший очікуваний поворот транскрипту.

Неавтентифіковані webhook-запити відхиляються до читання тіла, якщо
відсутні обов’язкові заголовки підпису провайдера.

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
потокового мовлення під час дзвінків. Ви можете перевизначити її в конфігурації Plugin із
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

- Застарілі ключі `tts.<provider>` у конфігурації Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) виправляються через `openclaw doctor --fix`; у збереженій конфігурації слід використовувати `tts.providers.<provider>`.
- **Microsoft speech ігнорується для голосових дзвінків** (телефонному аудіо потрібен PCM; поточний транспорт Microsoft не надає вихід PCM для телефонії).
- Основний TTS використовується, коли увімкнено потокову передачу медіа Twilio; в іншому разі дзвінки повертаються до рідних голосів провайдера.
- Якщо медіапотік Twilio вже активний, Voice Call не повертається до TwiML `<Say>`. Якщо TTS телефонії недоступний у такому стані, запит на відтворення завершується помилкою замість змішування двох шляхів відтворення.
- Коли TTS телефонії повертається до вторинного провайдера, Voice Call записує попередження з ланцюжком провайдерів (`from`, `to`, `attempts`) для налагодження.
- Коли barge-in Twilio або завершення потоку очищає чергу очікування TTS, поставлені в чергу
  запити відтворення завершуються замість зависання абонентів, які очікують завершення
  відтворення.

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

Типове значення політики вхідних дзвінків — `disabled`. Щоб увімкнути вхідні дзвінки, задайте:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Вітаю! Чим я можу допомогти?",
}
```

`inboundPolicy: "allowlist"` — це екранування caller ID з низьким рівнем гарантії. Plugin
нормалізує надане провайдером значення `From` і порівнює його з `allowFrom`.
Перевірка webhook автентифікує доставку провайдера та цілісність навантаження, але
не доводить право власності на номер абонента PSTN/VoIP. Сприймайте `allowFrom` як
фільтрацію caller ID, а не як сильну ідентичність абонента.

Автовідповіді використовують систему агента. Налаштовуйте за допомогою:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Контракт озвученого виводу

Для автовідповідей Voice Call додає до системного prompt суворий контракт озвученого виводу:

- `{"spoken":"..."}`

Потім Voice Call обережно витягує текст мовлення:

- Ігнорує навантаження, позначені як вміст міркувань/помилок.
- Аналізує прямий JSON, JSON у fenced-блоках або вбудовані ключі `"spoken"`.
- Повертається до звичайного тексту й видаляє ймовірні вступні абзаци планування/мета.

Це допомагає зосередити озвучення на тексті для абонента й уникнути витоку тексту планування в аудіо.

### Поведінка запуску розмови

Для вихідних дзвінків `conversation` обробка першого повідомлення пов’язана зі станом відтворення в реальному часі:

- Очищення черги через barge-in й автовідповідь пригнічуються лише тоді, коли початкове привітання активно озвучується.
- Якщо початкове відтворення завершується помилкою, дзвінок повертається до `listening`, а початкове повідомлення залишається в черзі для повторної спроби.
- Початкове відтворення для потокової передачі Twilio починається після підключення потоку без додаткової затримки.
- Barge-in перериває активне відтворення й очищає записи TTS Twilio, що стоять у черзі, але ще не почали відтворюватися.
  Очищені записи завершуються як пропущені, тож подальша логіка відповіді
  може продовжитися без очікування аудіо, яке ніколи не буде відтворене.
- Голосові розмови в реальному часі використовують власний вступний поворот потоку реального часу. Voice Call не надсилає застаріле оновлення TwiML `<Say>` для цього початкового повідомлення, тож вихідні сеанси `<Connect><Stream>` залишаються підключеними.

### Пільговий період від’єднання потоку Twilio

Коли медіапотік Twilio від’єднується, Voice Call чекає `2000ms`, перш ніж автоматично завершити дзвінок:

- Якщо потік повторно підключається протягом цього вікна, автозавершення скасовується.
- Якщо після пільгового періоду потік не зареєстровано знову, дзвінок завершується, щоб запобігти завислим активним дзвінкам.

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
openclaw voicecall latency                     # узагальнює затримку поворотів із журналів
openclaw voicecall expose --mode funnel
```

`latency` читає `calls.jsonl` зі стандартного шляху сховища voice-call. Використовуйте
`--file <path>`, щоб указати інший журнал, і `--last <n>`, щоб обмежити аналіз
останніми N записами (типово 200). Вивід включає p50/p90/p99 для затримки
поворотів і часу очікування прослуховування.

## Інструмент агента

Назва інструмента: `voice_call`

Дії:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Цей репозиторій містить відповідний документ Skills за адресою `skills/voice-call/SKILL.md`.

## RPC Gateway

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
