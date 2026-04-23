---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Вам потрібна автентифікація через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T23:05:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d629ee780171675174fb50ae66b490d89916167fe3cbcc9c75d20d832c022e00
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає developer API для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з білінгом за використання (`openai/*` models)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` models)
- **Harness app-server Codex** — нативне виконання через Codex app-server (`openai/*` models плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth-підписки в зовнішніх інструментах і workflow, таких як OpenClaw.

<Note>
GPT-5.5 наразі доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з runner PI або `openai/gpt-5.5` з
harness app-server Codex. Прямий доступ через API key для `openai/gpt-5.5`
підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель з підтримкою API, наприклад `openai/gpt-5.4`, для конфігурацій з `OPENAI_API_KEY`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                      | Статус                                                 |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Chat / Responses          | Провайдер моделі `openai/<model>`                      | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`          | Так                                                    |
| Harness app-server Codex  | `openai/<model>` з `embeddedHarness.runtime: codex`    | Так                                                    |
| Server-side web search    | Нативний інструмент OpenAI Responses                   | Так, коли web search увімкнено і провайдер не зафіксовано |
| Зображення                | `image_generate`                                       | Так                                                    |
| Відео                     | `video_generate`                                       | Так                                                    |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`              | Так                                                    |
| Batch speech-to-text      | `tools.media.audio` / розуміння медіа                  | Так                                                    |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`              | Так                                                    |
| Realtime voice            | Voice Call `realtime.provider: "openai"`               | Так                                                    |
| Embeddings                | Провайдер embedding для пам’яті                        | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації й виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API і білінгу за використання.

    <Steps>
      <Step title="Отримайте API key">
        Створіть або скопіюйте API key з [OpenAI Platform dashboard](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте key напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API через API key, якщо ви явно
    не примусите harness app-server Codex. Сама GPT-5.5 наразі доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через типовий runner PI.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Live-запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не містить.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Для Codex cloud потрібен вхід у ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових або несумісних із callback-хостом налаштувань додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість localhost browser callback:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть типову модель">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness app-server Codex | Автентифікація app-server Codex |

    <Note>
    І далі використовуйте id провайдера `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через browser OAuth (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор статусу

    У чаті `/status` показує, який вбудований harness активний для поточного
    сеансу. Типовий harness PI відображається як `Runner: pi (embedded)` і
    не додає окремого бейджа. Коли вибрано bundled harness app-server Codex,
    `/status` додає id не-PI harness поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сеанси зберігають записаний id свого harness, тому використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі й runtime-обмеження контексту як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Типове runtime-обмеження `contextTokens`: `272000`

    Менше типове обмеження на практиці має кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити runtime-бюджет контексту.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Bundled plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI через API key, так і генерацію зображень
через Codex OAuth за тим самим model ref `openai/gpt-image-2`.

| Можливість               | API key OpenAI                    | Codex OAuth                          |
| ------------------------ | --------------------------------- | ------------------------------------ |
| Model ref                | `openai/gpt-image-2`              | `openai/gpt-image-2`                 |
| Auth                     | `OPENAI_API_KEY`                  | Вхід OpenAI Codex OAuth              |
| Transport                | OpenAI Images API                 | Backend Codex Responses              |
| Макс. зображень на запит | 4                                 | 4                                    |
| Режим edit               | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримуються, зокрема розміри 2K/4K | Підтримуються, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільність | Не передається в OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки резервного перемикання.
</Note>

`gpt-image-2` є типовим значенням як для генерації текст-у-зображення OpenAI, так і для редагування
зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але нові
workflow зображень OpenAI мають використовувати `openai/gpt-image-2`.

Для інсталяцій Codex OAuth використовуйте той самий ref `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений OAuth-
токен доступу й надсилає запити на зображення через backend Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихе резервне перемикання на API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним base URL або endpoint Azure, якщо хочете використовувати прямий маршрут OpenAI Images API.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Bundled plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість      | Значення                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| Типова модель   | `openai/sora-2`                                                                   |
| Режими          | Text-to-video, image-to-video, редагування одного відео                           |
| Вхідні еталони  | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримуються                                                                |
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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки резервного перемикання.
</Note>

## Внесок у prompt для GPT-5

OpenClaw додає спільний внесок у prompt для GPT-5 під час запусків сімейства GPT-5 у різних провайдерів. Він застосовується за id моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні ref GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Bundled нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через developer instructions app-server Codex, тому сеанси `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення дії до кінця та проактивного Heartbeat, навіть попри те, що рештою prompt harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповіді, специфічна для каналу, і поведінка тихих повідомлень залишаються у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення              | Ефект                                      |
| --------------------- | ------------------------------------------ |
| `"friendly"` (типово) | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                | Псевдонім для `"friendly"`                 |
| `"off"`               | Вимкнути лише шар дружнього стилю          |

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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають дружній стиль.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` і далі зчитується як сумісний резервний варіант, коли спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Bundled plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Переходить до `OPENAI_API_KEY` |
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
    Задайте `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Bundled plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і аудіовкладення каналів

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

    Підказки щодо мови та prompt передаються до OpenAI, коли вони задані
    у спільній конфігурації аудіомедіа або в запиті на транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Bundled plugin `openai` реєструє транскрибування в реальному часі для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Переходить до `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming-провайдер призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord наразі записує короткі сегменти і замість цього використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Bundled plugin `openai` реєструє голос у реальному часі для plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|-------------------|-----------------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Температура | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Переходить до `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двосторонній виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Bundled provider `openai` може звертатися до ресурсу Azure OpenAI для генерації
зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
визначає хости Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) для параметрів Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібна регіональна локалізація даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень через Azure із bundled provider `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure, а `apiKey` задайте як
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
- Використовує шляхи з прив’язкою до deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, сумісні з OpenAI proxy) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень provider `openai` потребує
OpenClaw 2026.4.22 або новішої версії. У попередніх версіях будь-який користувацький
`openai.baseUrl` обробляється як публічний endpoint OpenAI і завершиться помилкою для deployment зображень Azure.
</Note>

### Версія API

Задайте `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Імена моделей — це імена deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через bundled provider `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
публічним id моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імені deployment застосовується до викликів генерації зображень,
маршрутизованих через bundled provider `openai`.

### Регіональна доступність

Генерація зображень Azure зараз доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і переконайтеся, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які публічний OpenAI дозволяє (наприклад певні
значення `background` для `gpt-image-2`) або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує саме ваш deployment і версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативну транспортну й сумісну поведінку, але не отримує
приховані attribution-заголовки OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (поза генерацією зображень) використовуйте
потік onboarding або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб підхопити форму API/auth Azure. Існує окремий
provider `azure-openai-responses/*`; див.
акордеон Server-side compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сеансу й ходу для повторних спроб і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між різними варіантами транспорту

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
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
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

  <Accordion title="Прогрівання WebSocket">
    OpenClaw типово вмикає прогрівання WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Disable warm-up
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

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли цю функцію ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення на рівні сеансу мають пріоритет над конфігурацією. Очищення перевизначення сеансу в UI Sessions повертає сеанс до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Установіть її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних endpoint OpenAI (`api.openai.com`) і нативних endpoint Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через proxy, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає server-side Compaction:

    - Примусово задає `store: true` (якщо лише сумісність моделі не задає `supportsStore: false`)
    - Інжектує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо недоступно)

    <Tabs>
      <Tab title="Увімкнути явно">
        Корисно для сумісних endpoint, таких як Azure OpenAI Responses:

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
      <Tab title="Вимкнути">
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
    `responsesServerCompaction` керує лише інжекцією `context_management`. Прямі моделі OpenAI Responses і далі примусово задають `store: true`, якщо тільки сумісність не встановлює `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший контракт вбудованого виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із steer-вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Застосовується лише до запусків сімейства GPT-5 у OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-сумісними proxy `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, що підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або proxy, які відхиляють `reasoning.effort: "none"`
    - Типово задають суворий режим для схем інструментів
    - Додають приховані attribution-заголовки лише на перевірених нативних хостах
    - Зберігають формування запитів, властиве лише OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Proxy/сумісні маршрути:**
    - Використовують менш сувору поведінку compat
    - Не примушують суворі схеми інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує приховані attribution-заголовки.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
