---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex у OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T21:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cbe3f548cc53ca50c5e76dea0a940c4e0a807dce7f777cd1692280a820c1f29
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує два способи автентифікації за одними й тими самими канонічними посиланнями на моделі OpenAI:

- **API-ключ** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex** — вхід через ChatGPT/Codex із доступом за підпискою. Внутрішній ідентифікатор автентифікації/провайдера — `openai-codex`, але для нових посилань на моделі все одно слід використовувати `openai/*`.

OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

## Покриття можливостей OpenClaw

| Можливість OpenAI       | Поверхня OpenClaw                         | Статус                                                 |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | провайдер моделі `openai/<model>`        | Так                                                    |
| Моделі підписки Codex   | `openai/<model>` з автентифікацією `openai-codex` | Так                                                    |
| Пошук у вебі на боці сервера | Нативний інструмент OpenAI Responses | Так, якщо вебпошук увімкнено і провайдера не зафіксовано |
| Зображення              | `image_generate`                         | Так                                                    |
| Відео                   | `video_generate`                         | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts` | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"` | Так                                                    |
| Голос у реальному часі  | Voice Call `realtime.provider: "openai"` | Так                                                    |
| Embeddings              | провайдер embedding для пам’яті          | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть або скопіюйте API-ключ на [панелі керування OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

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

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.5` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5-pro` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |

    <Note>
    `openai-codex/*` і далі приймається як застарілий сумісний псевдонім, але в нових конфігураціях слід використовувати `openai/*`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або налаштувань, де callback працює ненадійно, додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.5` | ChatGPT/Codex OAuth | вхід Codex |

    <Note>
    Посилання на моделі `openai-codex/*` і `codex/*` — це застарілі сумісні псевдоніми. Для команд автентифікації/профілю продовжуйте використовувати ідентифікатор провайдера `openai-codex`.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через OAuth у браузері (типово) або через наведений вище потік коду пристрою — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, яка вбудована обв’язка активна для поточної
    сесії. Обв’язка PI за замовчуванням відображається як `Runner: pi (embedded)` і
    не додає окремого значка. Якщо вибрано вбудовану обв’язку app-server Codex,
    `/status` додає ідентифікатор не-PI обв’язки поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сесії зберігають записаний ідентифікатор обв’язки, тому використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
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

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію
зображень через Codex OAuth за тим самим посиланням на модель `openai/gpt-image-2`.

| Можливість              | API-ключ OpenAI                    | Codex OAuth                          |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| Model ref               | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація          | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт               | OpenAI Images API                  | бекенд Codex Responses               |
| Макс. зображень на запит | 4                                 | 4                                    |
| Режим редагування       | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру  | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільність | Не передається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Image Generation](/uk/tools/image-generation) для спільних параметрів інструмента, вибору провайдера та поведінки резервного перемикання.
</Note>

`gpt-image-2` — це модель за замовчуванням як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1` і далі можна використовувати як явне перевизначення моделі, але для нових
робочих процесів OpenAI із зображеннями слід використовувати `openai/gpt-image-2`.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Якщо
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен
доступу OAuth і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий перехід до API-ключа для цього
запиту. Явно налаштуйте `models.providers.openai` за допомогою API-ключа,
власного base URL або кінцевої точки Azure, якщо вам потрібен прямий маршрут через OpenAI Images API.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість      | Значення                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| Типова модель   | `openai/sora-2`                                                                   |
| Режими          | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні входи  | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                               |
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
Див. [Video Generation](/uk/tools/video-generation) для спільних параметрів інструмента, вибору провайдера та поведінки резервного перемикання.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однакове накладання. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і накладання Heartbeat через інструкції для розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення справ до кінця й проактивного Heartbeat, навіть якщо Codex керує рештою промпта обв’язки.

Внесок GPT-5 додає тегований поведінковий контракт для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Поведінка відповідей і тихих повідомлень, специфічна для каналу, залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії відокремлений і налаштовується.

| Значення              | Ефект                                        |
| --------------------- | -------------------------------------------- |
| `"friendly"` (типово) | Увімкнути рівень дружнього стилю взаємодії   |
| `"on"`                | Псевдонім для `"friendly"`                   |
| `"off"`               | Вимкнути лише рівень дружнього стилю         |

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
Під час виконання значення не чутливі до регістру, тож і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застарілий параметр `plugins.entries.openai.config.personality` усе ще зчитується як сумісний запасний варіант, якщо спільний параметр `agents.defaults.promptOverlays.gpt5.personality` не встановлено.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не встановлено) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не встановлено, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS без впливу на кінцеву точку chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування розуміння медіа OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях входу: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема для сегментів голосових каналів Discord і
      аудіовкладень каналів

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

    Підказки щодо мови та промпта передаються до OpenAI, коли вони задані у
    спільній конфігурації аудіомедіа або в запиті на транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не встановлено) |
    | Промпт | `...openai.prompt` | (не встановлено) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Використовує WebSocket-з’єднання до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує формат аудіо G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований провайдер `openai` може працювати з ресурсом Azure OpenAI для
генерації зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) для його параметрів Azure.
</Note>

Використовуйте Azure OpenAI, якщо:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або засоби відповідності вимогам, які надає Azure
- Ви хочете зберігати трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого провайдера `openai`, укажіть
`models.providers.openai.baseUrl` для вашого ресурсу Azure і встановіть `apiKey` як
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

Для запитів на генерацію зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, сумісні з OpenAI проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії обробляють будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть із deployment генерації
зображень Azure.
</Note>

  ### Версія API

  Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
  для шляху генерації зображень Azure:

  ```bash
  export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
  ```

  Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

  ### Назви моделей — це назви deployment

  Azure OpenAI прив’язує моделі до deployment. Для запитів на генерацію зображень Azure,
  маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
  має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
  публічним ідентифікатором моделі OpenAI.

  Якщо ви створили deployment під назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

  ```
  /tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
  ```

  Те саме правило назви deployment застосовується до викликів генерації зображень,
  маршрутизованих через вбудований провайдер `openai`.

  ### Регіональна доступність

  Генерація зображень Azure наразі доступна лише в обмеженій кількості регіонів
  (наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
  `uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
  deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

  ### Відмінності параметрів

  Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
  Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
  значення `background` для `gpt-image-2`) або надавати їх лише для певних версій
  моделі. Ці відмінності походять від Azure та базової моделі, а не від
  OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
  набір параметрів, які підтримує ваш конкретний deployment і версія API, у
  порталі Azure.

  <Note>
  Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
  приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути та маршрути, сумісні з OpenAI**
  в розділі [Розширена конфігурація](#advanced-configuration).

  Для трафіку chat або Responses на Azure (поза генерацією зображень) використовуйте
  потік онбордингу або окрему конфігурацію провайдера Azure — самого лише
  `openai.baseUrl` недостатньо, щоб застосувати форму API/автентифікації Azure. Існує окремий
  провайдер `azure-openai-responses/*`; див.
  акордеон Server-side Compaction нижче.
  </Note>

  ## Розширена конфігурація

  <AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує спочатку WebSocket із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і перепідключень
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
            "openai/gpt-5.5": {
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
    // Вимкнути прогрів
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
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` чи `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сесії мають вищий пріоритет за конфігурацію. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
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
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо лише сумісність моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо недоступно)

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses однаково примусово встановлюють `store: true`, якщо сумісність не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

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
    - Більше не вважає хід лише з планом успішним поступом, якщо доступна дія інструмента
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI і Codex. Інші провайдери та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та маршрути, сумісні з OpenAI">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI та загальні проксі `/v1`, сумісні з OpenAI:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI effort `none`
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово встановлюють суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів лише для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Не примушують суворі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
