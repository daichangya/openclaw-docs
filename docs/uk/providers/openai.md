---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T02:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8337990d0de692b32746b05ab344695fc5a54ab3855993ac7795fabf38d4d19d
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API-ключ** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)
- **Codex app-server harness** — нативне виконання через Codex app-server (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth-підписки в зовнішніх інструментах і робочих процесах, таких як OpenClaw.

<Note>
GPT-5.5 наразі доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з PI runner або `openai/gpt-5.5` з
Codex app-server harness. Прямий доступ за API-ключем для `openai/gpt-5.5`
підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API; до того
часу використовуйте модель, доступну через API, наприклад `openai/gpt-5.4`, для конфігурацій
`OPENAI_API_KEY`.
</Note>

## Покриття функцій OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                        | Статус                                                  |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| Chat / Responses          | постачальник моделей `openai/<model>`                    | Так                                                     |
| Моделі за підпискою Codex | `openai-codex/<model>` з OAuth `openai-codex`            | Так                                                     |
| Codex app-server harness  | `openai/<model>` з `embeddedHarness.runtime: codex`      | Так                                                     |
| Пошук у вебі на боці сервера | нативний інструмент OpenAI Responses                  | Так, коли вебпошук увімкнено і постачальника не зафіксовано |
| Зображення                | `image_generate`                                         | Так                                                     |
| Відео                     | `video_generate`                                         | Так                                                     |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`         | Так                                                     |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа      | Так                                                     |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"` | Так                                                     |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Вбудовування              | постачальник вбудовувань пам’яті                         | Так                                                     |

## Початок роботи

Виберіть бажаний спосіб автентифікації й виконайте кроки налаштування.

<Tabs>
  <Tab title="API-ключ (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть або скопіюйте API-ключ з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
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

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI за API-ключем, якщо ви явно не примусите
    використання Codex app-server harness. Сама GPT-5.5 наразі доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через стандартний PI runner.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API-ключа. Codex cloud вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або конфігурацій, де незручно використовувати callback, додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість callback локального браузера:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Задайте модель за замовчуванням">
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

    ### Підсумок маршруту

    | Посилання на модель | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати ідентифікатор постачальника `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Початкове налаштування більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (типовий варіант) або через потік коду пристрою, вказаний вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор стану

    Chat `/status` показує, який вбудований harness активний для поточної
    сесії. Стандартний PI harness відображається як `Runner: pi (embedded)` і
    не додає окремий індикатор. Коли вибрано вбудований Codex app-server harness,
    `/status` додає ідентифікатор не-PI harness поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сесії зберігають записаний для них ідентифікатор harness, тому використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартне обмеження `contextTokens` під час виконання: `272000`

    Менше стандартне обмеження на практиці дає кращі характеристики затримки й якості. Перевизначте його через `contextTokens`:

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
Він підтримує як генерацію зображень OpenAI за API-ключем, так і генерацію зображень
через Codex OAuth, використовуючи те саме посилання на модель `openai/gpt-image-2`.

| Можливість                | API-ключ OpenAI                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Посилання на модель       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | бекенд Codex Responses               |
| Макс. кількість зображень на запит | 4                        | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | Зіставляється з підтримуваним розміром, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору постачальника та поведінки failover.
</Note>

`gpt-image-2` — це стандартне значення і для генерації зображень з тексту OpenAI, і для редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для установок із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен
доступу OAuth і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихий перехід на API-ключ для цього
запиту. Явно налаштуйте `models.providers.openai` з API-ключем,
власною базовою URL-адресою або Azure endpoint, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо цей власний endpoint зображень перебуває в довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і далі
блокує приватні/внутрішні OpenAI-сумісні endpoint зображень, якщо цей явний дозвіл
не задано.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Відредагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                  |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                       |
| Вхідні еталони   | 1 зображення або 1 відео                                                          |
| Перевизначення розміру | Підтримується                                                              |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору постачальника та поведінки failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний Codex harness використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення дій до завершення та проактивного Heartbeat, навіть попри те, що рештою prompt harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження persona, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналів поведінка відповіді та тихих повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише рівень дружнього стилю       |

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
Значення під час виконання не чутливі до регістру, тому і `"Off"`, і `"off"` вимикають дружній стиль.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` усе ще читається як сумісний запасний варіант, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API-ключ | `messages.tts.providers.openai.apiKey` | Використовується `OPENAI_API_KEY` як запасний варіант |
    | Базова URL-адреса | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базову URL-адресу TTS без впливу на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування розуміння медіа OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: multipart-вивантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема у сегментах голосових каналів Discord і
      аудіовкладеннях каналів

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
    у спільній конфігурації аудіомедіа або в запиті транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API-ключ | `...openai.apiKey` | Використовується `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей постачальник потокової обробки призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord наразі записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типове значення |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API-ключ | `...openai.apiKey` | Використовується `OPENAI_API_KEY` як запасний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлені виклики інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Вбудований постачальник `openai` може використовувати ресурс Azure OpenAI для
генерації зображень шляхом перевизначення базової URL-адреси. На шляху
генерації зображень OpenClaw автоматично виявляє хости Azure у `models.providers.openai.baseUrl` і перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) для налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка, квота або корпоративна угода Azure OpenAI
- Вам потрібні регіональне зберігання даних або засоби відповідності вимогам, які надає Azure
- Ви хочете, щоб трафік залишався в межах наявного орендаря Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого постачальника `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і задайте `apiKey` як
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

Інші базові URL-адреси (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який користувацький
`openai.baseUrl` як публічний endpoint OpenAI і завершуються помилкою при роботі з deployment зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не задано.

### Імена моделей — це імена deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований постачальник `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імен deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований постачальник `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в обмеженій кількості регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних версій
моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте набір
параметрів, який підтримує ваш конкретний deployment і версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses на Azure (поза генерацією зображень) використовуйте
потік початкового налаштування або окрему конфігурацію постачальника Azure — одного лише
`openai.baseUrl` недостатньо, щоб отримати форму API/автентифікації Azure. Існує окремий
постачальник `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket чи SSE)">
    OpenClaw використовує WebSocket-first із запасним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, потім запасний перехід на SSE |
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
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрів
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
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Якщо ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають вищий пріоритет за конфігурацію. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Задайте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних endpoint OpenAI (`api.openai.com`) і нативних endpoint Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих постачальників через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream wrapper Pi-harness Plugin `openai` автоматично вмикає Server-side Compaction:

    - Примусово задає `store: true` (якщо сумісність моделі не встановлює `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків постачальника OpenAI, які використовуються вбудованими запусками. Нативний Codex app-server harness керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явне ввімкнення">
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
      <Tab title="Вимкнення">
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
    `responsesServerCompaction` керує лише вставленням `context_management`. Прямі моделі OpenAI Responses все одно примусово використовують `store: true`, якщо compat не задає `supportsStore: false`.
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
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія через інструмент
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний стан блокування, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запуском OpenAI і Codex сімейства GPT-5. Інші постачальники й старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-сумісними проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, характерне лише для OpenAI (`service_tier`, `store`, reasoning-compat, підказки prompt-cache)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Не примушують строгі схеми інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує приховані заголовки атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладніше про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
