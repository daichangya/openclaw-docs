---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T19:26:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c0492abf21cc2f0dfb83f32111b2b7e41cb85dd09ede6c1c45b18a135e46e1
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два варіанти автентифікації:

  - **API-ключ** — прямий доступ до OpenAI Platform з оплатою за використання (`openai/*` моделі)
  - **Підписка Codex** — вхід через ChatGPT/Codex з доступом за підпискою (`openai-codex/*` моделі)

  OpenAI явно підтримує використання subscription OAuth у зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

  ## Покриття можливостей OpenClaw

  | Можливість OpenAI        | Поверхня OpenClaw                         | Стан                                                   |
  | ------------------------ | ----------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses         | Провайдер моделей `openai/<model>`        | Так                                                    |
  | Моделі підписки Codex    | Провайдер моделей `openai-codex/<model>`  | Так                                                    |
  | Server-side web search   | Рідний інструмент OpenAI Responses        | Так, коли web search увімкнено й провайдер не закріплено |
  | Зображення               | `image_generate`                          | Так                                                    |
  | Відео                    | `video_generate`                          | Так                                                    |
  | Text-to-speech           | `messages.tts.provider: "openai"` / `tts` | Так                                                    |
  | Batch speech-to-text     | `tools.media.audio` / розуміння медіа     | Так                                                    |
  | Streaming speech-to-text | Voice Call `streaming.provider: "openai"` | Так                                                    |
  | Realtime voice           | Voice Call `realtime.provider: "openai"`  | Так                                                    |
  | Embeddings               | Провайдер embedding для пам’яті           | Так                                                    |

  ## Початок роботи

  Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та тарифікації за використання.

    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть або скопіюйте API-ключ з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ безпосередньо:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    Вхід через ChatGPT/Codex маршрутизується через `openai-codex/*`, а не `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark` на шляху прямого API. Реальні запити до OpenAI API відхиляють цю модель. Spark доступна лише в Codex.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або конфігурацій, несприятливих до callback, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback локального браузера:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Зведення маршрутів

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth | Вхід у Codex |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Вхід у Codex (залежить від entitlement) |

    <Note>
    Цей маршрут навмисно відокремлений від `openai/gpt-5.5`. Використовуйте `openai/*` з API-ключем для прямого доступу до Platform, а `openai-codex/*` — для доступу через підписку Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через browser OAuth (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.5`:

    - Нативне `contextWindow`: `1000000`
    - Типове обмеження `contextTokens` під час виконання: `272000`

    Менше типове обмеження на практиці дає кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту під час виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Убудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.

| Можливість               | Значення                           |
| ------------------------ | ---------------------------------- |
| Типова модель            | `openai/gpt-image-2`               |
| Макс. зображень на запит | 4                                  |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API |

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
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервування.
</Note>

`gpt-image-2` є типовим як для генерації зображень з тексту OpenAI, так і для
редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Убудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість      | Значення                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель   | `openai/sora-2`                                                                    |
| Режими          | Текст у відео, зображення у відео, редагування одного відео                         |
| Еталонні входи  | 1 зображення або 1 відео                                                           |
| Перевизначення розміру | Підтримується                                                                |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку резервування.
</Note>

## Внесок prompt для GPT-5

OpenClaw додає спільний внесок у prompt для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тому `openai/gpt-5.5`, `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий оверлей. Старіші моделі GPT-4.x — ні.

Убудований провайдер рідного harness Codex (`codex/*`) використовує ту саму поведінку GPT-5 і оверлей Heartbeat через інструкції розробника app-server Codex, тож сесії `codex/gpt-5.x` зберігають ту саму послідовність виконання та вказівки щодо проактивного Heartbeat, навіть попри те, що рештою prompt harness керує Codex.

Внесок GPT-5 додає контракт поведінки з тегами для збереження persona, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише шар дружнього стилю          |

<Tabs>
  <Tab title="Конфігурація">
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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще читається як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Убудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS, не впливаючи на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Убудований Plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрипції розуміння медіа OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Ендпоїнт: OpenAI REST `/v1/audio/transcriptions`
    - Вхідний шлях: multipart-вивантаження аудіофайла
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, включно із сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрипції вхідного аудіо:

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

    Підказки мови й prompt передаються до OpenAI, коли їх задано через
    спільну конфігурацію аудіомедіа або запит транскрипції для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Убудований Plugin `openai` реєструє транскрипцію в реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначений для шляху транскрипції в реальному часі Plugin Voice Call; голос у Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Убудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовує резервне значення `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двоспрямований виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Ендпоїнти Azure OpenAI

Убудований провайдер `openai` може спрямовувати генерацію зображень до ресурсу Azure OpenAI
шляхом перевизначення базової URL-адреси. На шляху генерації зображень OpenClaw
автоматично визначає імена хостів Azure в `models.providers.openai.baseUrl` і переключається на
формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) для налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібне регіональне зберігання даних або засоби відповідності вимогам, які надає Azure
- Ви хочете зберігати трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень через Azure із використанням убудованого провайдера `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` у
ключ Azure OpenAI (а не ключ OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, сумісні з OpenAI proxy) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії розглядають будь-який нетиповий
`openai.baseUrl` як публічний ендпоїнт OpenAI і завершуються помилкою при роботі з deployment зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через убудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним id моделі OpenAI.

  Якщо ви створите deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  Те саме правило назв deployment застосовується до викликів генерації зображень,
  маршрутизованих через убудований провайдер `openai`.

  ### Регіональна доступність

  Генерація зображень Azure наразі доступна лише в частині регіонів
  (наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
  `uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
  deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

  ### Відмінності параметрів

  Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
  Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
  значення `background` у `gpt-image-2`), або надавати їх лише для певних версій
  моделі. Ці відмінності походять від Azure і базової моделі, а не від
  OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
  набір параметрів, підтримуваний вашим конкретним deployment і версією API, у
  порталі Azure.

  <Note>
  Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
  прихованих заголовків attribution OpenClaw — див. акордеон **Нативні vs сумісні з OpenAI
  маршрути** у розділі [Розширена конфігурація](#advanced-configuration).

  Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
  потік onboarding або окрему конфігурацію провайдера Azure — одного лише
  `openai.baseUrl` недостатньо, щоб підхопити формат API/автентифікації Azure. Існує окремий
  провайдер `azure-openai-responses/*`; див.
  акордеон Server-side Compaction нижче.
  </Note>

  ## Розширена конфігурація

  <AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і повторних з’єднань
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний перехід на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язана документація OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму як для `openai/*`, так і для `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли цю функцію ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
            "openai-codex/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних ендпоїнтів OpenAI (`api.openai.com`) і нативних ендпоїнтів Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який із цих провайдерів через proxy, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    <Tabs>
      <Tab title="Увімкнути явно">
        Корисно для сумісних ендпоїнтів на кшталт Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Власний поріг">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
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
      <Tab title="Вимкнути">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses усе одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
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
    - Більше не вважає хід лише з планом успішним прогресом, якщо доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Поширюється лише на запуски сімейства GPT-5 OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні vs сумісні з OpenAI маршрути">
    OpenClaw обробляє прямі ендпоїнти OpenAI, Codex і Azure OpenAI інакше, ніж загальні сумісні з OpenAI proxy `/v1`:

    **Нативні маршрути** (`openai/*`, `openai-codex/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують значення OpenAI `none`
    - Не надсилають вимкнений reasoning для моделей або proxy, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим схем інструментів
    - Додають приховані заголовки attribution лише на перевірених нативних хостах
    - Зберігають форматування запитів, специфічне для OpenAI (`service_tier`, `store`, compat reasoning, підказки prompt-cache)

    **Маршрути proxy/compatible:**
    - Використовують м’якшу поведінку compat
    - Не примушують до строгих схем інструментів або заголовків лише для нативного режиму

    Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує прихованих заголовків attribution.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервування.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
