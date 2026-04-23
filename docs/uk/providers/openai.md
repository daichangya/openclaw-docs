---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість API keys
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API keys або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T06:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3d847e53c2faee5363071dfdcb1f4150b64577674161e000844f579482198d1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два способи автентифікації:

  - **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
  - **Підписка Codex** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)

  OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

  ## Покриття можливостей OpenClaw

  | Можливість OpenAI        | Поверхня OpenClaw                          | Статус                                                 |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | Провайдер моделей `openai/<model>`        | Так                                                    |
  | Моделі підписки Codex    | Провайдер моделей `openai-codex/<model>`  | Так                                                    |
  | Server-side web search   | Власний tool Responses від OpenAI         | Так, коли web search увімкнено і не закріплено провайдера |
  | Зображення               | `image_generate`                          | Так                                                    |
  | Відео                    | `video_generate`                          | Так                                                    |
  | Text-to-speech           | `messages.tts.provider: "openai"` / `tts` | Так                                                    |
  | Batch speech-to-text     | `tools.media.audio` / розуміння media     | Так                                                    |
  | Streaming speech-to-text | Voice Call `streaming.provider: "openai"` | Так                                                    |
  | Realtime voice           | Voice Call `realtime.provider: "openai"`  | Так                                                    |
  | Embeddings               | Провайдер embedding для memory            | Так                                                    |

  ## Початок роботи

  Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Get your API key">
        Створіть або скопіюйте API key на [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Вхід через ChatGPT/Codex маршрутизується через `openai-codex/*`, а не `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на прямому шляху API. Реальні запити до OpenAI API відхиляють цю модель. Spark доступний лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback налаштувань додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Set the default model">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.4` | OAuth ChatGPT/Codex | Вхід Codex |
    | `openai-codex/gpt-5.3-codex-spark` | OAuth ChatGPT/Codex | Вхід Codex (залежить від прав доступу) |

    <Note>
    Цей маршрут навмисно відокремлений від `openai/gpt-5.4`. Використовуйте `openai/*` з API key для прямого доступу до Platform і `openai-codex/*` для доступу за підпискою Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Обмеження вікна context

    OpenClaw розглядає metadata моделі та обмеження context у runtime як окремі значення.

    Для `openai-codex/gpt-5.4`:

    - Власний `contextWindow`: `1050000`
    - Типове обмеження `contextTokens` у runtime: `272000`

    Менше типове обмеження на практиці дає кращу затримку й якість. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити власні metadata моделі. Використовуйте `contextTokens`, щоб обмежити бюджет context у runtime.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через tool `image_generate`.

| Можливість              | Значення                              |
| ----------------------- | ------------------------------------- |
| Типова модель           | `openai/gpt-image-2`                  |
| Макс. кількість зображень на запит | 4                           |
| Режим редагування       | Увімкнено (до 5 еталонних зображень)  |
| Перевизначення розміру  | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передаються до OpenAI Images API |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Спільні параметри tool, вибір провайдера й поведінку failover див. у [Генерація зображень](/uk/tools/image-generation).
</Note>

`gpt-image-2` є типовим для генерації текст-у-зображення в OpenAI і для
редагування зображень. `gpt-image-1` і далі можна використовувати як явне
перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований plugin `openai` реєструє генерацію відео через tool `video_generate`.

| Можливість       | Значення                                                                             |
| ---------------- | ------------------------------------------------------------------------------------ |
| Типова модель    | `openai/sora-2`                                                                      |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                          |
| Еталонні входи   | 1 зображення або 1 відео                                                             |
| Перевизначення розміру | Підтримується                                                                  |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням tool |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Спільні параметри tool, вибір провайдера й поведінку failover див. у [Генерація відео](/uk/tools/video-generation).
</Note>

## Внесок prompt GPT-5

OpenClaw додає спільний внесок prompt GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тож `openai/gpt-5.4`, `openai-codex/gpt-5.4`, `openrouter/openai/gpt-5.4`, `opencode/gpt-5.4` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x цього не отримують.

Вбудований провайдер native Codex harness (`codex/*`) використовує ту саму поведінку GPT-5 і overlay Heartbeat через developer instructions app-server Codex, тож сесії `codex/gpt-5.x` зберігають ту саму послідовність виконання та проактивні вказівки Heartbeat, навіть попри те, що рештою prompt harness керує Codex.

Внесок GPT-5 додає позначений контракт поведінки для збереження persona, безпеки виконання, дисципліни tool, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповіді й тихих повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди увімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише шар дружнього стилю          |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Під час runtime значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застарілий параметр `plugins.entries.openai.config.personality` і далі зчитується як сумісний fallback, коли не задано спільний параметр `agents.defaults.promptOverlays.gpt5.personality`.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для voice notes, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на endpoint API чату.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрибування media understanding в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях входу: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрибування вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Підказки щодо мови й prompt передаються в OpenAI, якщо вони задані через
    спільну конфігурацію audio media або в запиті транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Realtime transcription">
    Вбудований plugin `openai` реєструє realtime transcription для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Використовує з’єднання WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначений для шляху realtime transcription у Voice Call; Discord voice наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Вбудований plugin `openai` реєструє realtime voice для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямний виклик tool. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first з fallback до SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як degraded приблизно на 60 секунд і використовує SSE під час cooldown
    - Додає стабільні заголовки ідентичності сесії й ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами transport

    | Значення | Поведінка |
    |----------|-----------|
    | `"auto"` (типово) | Спочатку WebSocket, fallback до SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClaw типово вмикає WebSocket warm-up для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

<a id="openai-fast-mode"></a>

  <Accordion title="Fast mode">
    OpenClaw надає спільний перемикач fast mode для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли режим увімкнено, OpenClaw перетворює fast mode на пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і fast mode не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення на рівні сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до типового значення з конфігурації.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Задайте її для конкретної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до native endpoint OpenAI (`api.openai.com`) і native endpoint Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через proxy, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає server-side Compaction:

    - Примусово задає `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    <Tabs>
      <Tab title="Enable explicitly">
        Корисно для сумісних endpoint, таких як Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Custom threshold">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Disable">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses все одно примусово використовують `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    Для запусків сімейства GPT-5 на `openai/*` і `openai-codex/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, якщо доступна дія через tool
    - Повторює хід зі спрямуванням діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель і далі планує без дії

    <Note>
    Застосовується лише до запусків сімейства GPT-5 OpenAI і Codex. Для інших провайдерів і старіших сімейств моделей зберігається типова поведінка.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI порівняно з універсальними OpenAI-сумісними proxy `/v1`:

    **Native маршрути** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, що підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або proxy, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим для схем tool
    - Додають приховані заголовки атрибуції лише на перевірених native хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу prompt)

    **Proxy/сумісні маршрути:**
    - Використовують більш м’яку compat-поведінку
    - Не примушують до суворих схем tool або native-специфічних заголовків

    Azure OpenAI використовує native transport і compat-поведінку, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Image generation" href="/uk/tools/image-generation" icon="image">
    Спільні параметри tool для зображень і вибір провайдера.
  </Card>
  <Card title="Video generation" href="/uk/tools/video-generation" icon="video">
    Спільні параметри tool для відео і вибір провайдера.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
