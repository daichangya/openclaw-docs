---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T02:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9bb65b29be2b69a85663b17a68560c557ffb5303ac7afa2b27548a27397af46
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Codex subscription through PI** — вхід через ChatGPT/Codex з доступом за підпискою (моделі `openai-codex/*`)
- **Codex app-server harness** — нативне виконання через Codex app-server (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

<Note>
GPT-5.5 наразі доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` з виконавцем PI або `openai/gpt-5.5` з
Codex app-server harness. Прямий доступ за API key для `openai/gpt-5.5`
підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель з доступом через API, таку як `openai/gpt-5.4`, для конфігурацій `OPENAI_API_KEY`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI        | Поверхня OpenClaw                                     | Статус                                                 |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | постачальник моделей `openai/<model>`                 | Так                                                    |
| Моделі підписки Codex    | `openai-codex/<model>` з OAuth `openai-codex`         | Так                                                    |
| Codex app-server harness | `openai/<model>` з `embeddedHarness.runtime: codex`   | Так                                                    |
| Server-side web search   | нативний інструмент OpenAI Responses                  | Так, коли увімкнено web search і не закріплено постачальника |
| Images                   | `image_generate`                                      | Так                                                    |
| Videos                   | `video_generate`                                      | Так                                                    |
| Text-to-speech           | `messages.tts.provider: "openai"` / `tts`             | Так                                                    |
| Batch speech-to-text     | `tools.media.audio` / розуміння медіа                 | Так                                                    |
| Streaming speech-to-text | Voice Call `streaming.provider: "openai"`             | Так                                                    |
| Realtime voice           | Voice Call `realtime.provider: "openai"`              | Так                                                    |
| Embeddings               | постачальник embedding для пам’яті                    | Так                                                    |

## Початок роботи

Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
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
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.4` | прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API за API key, якщо ви явно не примусите
    Codex app-server harness. Сама GPT-5.5 наразі доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через стандартний виконавець PI.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Реальні запити до OpenAI API відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних зі зворотним викликом середовищ додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
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

    ### Підсумок маршрутів

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | автентифікація Codex app-server |

    <Note>
    Продовжуйте використовувати ідентифікатор постачальника `openai-codex` для команд
    auth/profile. Префікс моделі `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агента.
    </Note>

    ### Індикатор статусу

    Chat `/status` показує, який вбудований harness активний для поточної
    сесії. Стандартний harness PI відображається як `Runner: pi (embedded)` і не
    додає окремого значка. Коли вибрано вбудований Codex app-server harness,
    `/status` додає ідентифікатор не-PI harness поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сесії зберігають записаний ідентифікатор harness, тож використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та ліміт контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативний `contextWindow`: `1000000`
    - Стандартний ліміт `contextTokens` середовища виконання: `272000`

    Менший стандартний ліміт на практиці має кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

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
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API key, так і генерацію зображень
через Codex OAuth через той самий ідентифікатор моделі `openai/gpt-image-2`.

| Можливість               | API key OpenAI                     | Codex OAuth                         |
| ------------------------ | ---------------------------------- | ----------------------------------- |
| Model ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                |
| Автентифікація           | `OPENAI_API_KEY`                   | вхід через OpenAI Codex OAuth       |
| Транспорт                | OpenAI Images API                  | бекенд Codex Responses              |
| Максимум зображень на запит | 4                               | 4                                   |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільність | Не передається до OpenAI Images API | За потреби зіставляється з підтримуваним розміром |

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

`gpt-image-2` є стандартним для генерації тексту в зображення OpenAI та
редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для інсталяцій Codex OAuth зберігайте той самий ідентифікатор `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw знаходить цей збережений токен доступу OAuth
і надсилає запити на зображення через бекенд Codex Responses. Він
не спочатку пробує `OPENAI_API_KEY` і не виконує тихий відкат до API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним base URL або endpoint Azure, якщо вам потрібен прямий маршрут OpenAI Images API.
Якщо цей користувацький endpoint для зображень розташований у довіреній LAN/приватній адресі, також встановіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw зберігає
блокування приватних/внутрішніх OpenAI-сумісних endpoint для зображень, якщо не задано цей явний дозвіл.

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
| Стандартна модель | `openai/sora-2`                                                                 |
| Режими          | Текст у відео, зображення у відео, редагування одного відео                       |
| Еталонні входи  | 1 зображення або 1 відео                                                          |
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

## Внесок до підказки GPT-5

OpenClaw додає спільний внесок до підказки GPT-5 для запусків сімейства GPT-5 у всіх постачальників. Він застосовується за ідентифікатором моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні ідентифікатори GPT-5 отримують той самий шар. Старіші моделі GPT-4.x — ні.

Вбудований нативний Codex harness використовує ту саму поведінку GPT-5 і шар Heartbeat через інструкції розробника Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі настанови щодо доведення виконання до кінця та проактивного Heartbeat, хоча рештою підказки harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається в спільній системній підказці OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути рівень дружнього стилю взаємодії |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише рівень дружнього стилю       |

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
Значення нечутливі до регістру під час виконання, тому і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще читається як сумісний fallback, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
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
    Встановіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS без впливу на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Мовлення в текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрибування розуміння медіа OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайлу
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

    Підказки щодо мови та prompt передаються до OpenAI, коли їх задано у
    спільній конфігурації аудіомедіа або в запиті на транскрибування для конкретного виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначений для шляху транскрибування в реальному часі в Voice Call; голосові канали Discord наразі записують короткі сегменти та натомість використовують пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як fallback |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонаправлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint Azure OpenAI

Вбудований постачальник `openai` може звертатися до ресурсу Azure OpenAI для
генерації зображень шляхом перевизначення base URL. На шляху генерації
зображень OpenClaw виявляє імена хостів Azure у `models.providers.openai.baseUrl` і автоматично
перемикається на формат запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) для його налаштувань
Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або засоби контролю відповідності, які надає Azure
- Ви хочете зберігати трафік у межах наявного тенанта Azure

### Конфігурація

Для генерації зображень Azure через вбудований постачальник `openai`, вкажіть
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

OpenClaw розпізнає такі суфікси хостів Azure для маршруту Azure генерації
зображень:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи в межах deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який
власний `openai.baseUrl` як публічний endpoint OpenAI і завершуються помилкою при роботі з deployment
зображень Azure.
</Note>

### Версія API

Встановіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не встановлено.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований постачальник `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment під назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований постачальник `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти опції, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`) або надавати їх лише для конкретних
версій моделі. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваш конкретний deployment і версія API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses на Azure (окрім генерації зображень) використовуйте
процес онбордингу або окрему конфігурацію постачальника Azure — одного лише
`openai.baseUrl` недостатньо, щоб увімкнути форму API/автентифікації Azure. Існує окремий
постачальник `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує спочатку WebSocket з fallback на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, fallback на SSE |
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

  <Accordion title="Прогрів WebSocket">
    OpenClaw типово вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

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

  <Accordion title="Fast mode">
    OpenClaw надає спільний перемикач Fast mode для `openai/*` і `openai-codex/*`:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє fast mode з пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а fast mode не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Встановіть її для кожної моделі в OpenClaw:

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
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, коли значення недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків постачальника OpenAI, які використовуються вбудованими запусками. Нативний Codex app-server harness керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
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
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія з інструментом
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства GPT-5 OpenAI та Codex. Інші постачальники й старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі endpoint OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу prompt)

    **Маршрути проксі/сумісності:**
    - Використовують м’якшу сумісну поведінку
    - Не примушують строгі схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, ідентифікаторів моделей і поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір постачальника.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладніше про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
