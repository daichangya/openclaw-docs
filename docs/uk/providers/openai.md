---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T23:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3445cab47caa324314c115fb968f13c2910954b685b68a17ab9228e3184fa14
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до OpenAI Platform з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Обв’язка app-server Codex** — нативне виконання через app-server Codex (моделі `openai/*` плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

<Note>
GPT-5.5 наразі доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` із виконувачем PI або `openai/gpt-5.5` з
обв’язкою app-server Codex. Прямий доступ за API-ключем для `openai/gpt-5.5`
підтримуватиметься, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель з доступом через API, наприклад `openai/gpt-5.4`, для конфігурацій `OPENAI_API_KEY`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                      | Статус                                                 |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Чат / Responses           | постачальник моделей `openai/<model>`                  | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`          | Так                                                    |
| Обв’язка app-server Codex | `openai/<model>` з `embeddedHarness.runtime: codex`    | Так                                                    |
| Пошук у мережі на сервері | Нативний інструмент OpenAI Responses                   | Так, коли пошук у мережі ввімкнено і постачальника не зафіксовано |
| Зображення                | `image_generate`                                       | Так                                                    |
| Відео                     | `video_generate`                                       | Так                                                    |
| Перетворення тексту в мовлення | `messages.tts.provider: "openai"` / `tts`         | Так                                                    |
| Пакетне перетворення мовлення в текст | `tools.media.audio` / розуміння медіа      | Так                                                    |
| Потокове перетворення мовлення в текст | Voice Call `streaming.provider: "openai"` | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"`               | Так                                                    |
| Ембедінги                 | постачальник ембедінгів для пам’яті                    | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще підходить для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ безпосередньо:

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

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai/gpt-5.4` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, щойно OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут API-ключа OpenAI, якщо ви явно не примусите
    використовувати обв’язку app-server Codex. Сама GPT-5.5 наразі доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для Codex OAuth через стандартний виконувач PI.
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

  <Tab title="Підписка Codex">
    **Найкраще підходить для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless-середовищ або налаштувань, де колбек працює нестабільно, додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість колбеку браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть стандартну модель">
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

    | Model ref | Маршрут | Автентифікація |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | ChatGPT/Codex OAuth через PI | Вхід у Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Обв’язка app-server Codex | Автентифікація app-server Codex |

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
    Початкове налаштування більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через OAuth у браузері (типовий варіант) або через наведений вище потік коду пристрою — OpenClaw зберігає отримані облікові дані у власному сховищі автентифікації агентів.
    </Note>

    ### Індикатор стану

    У чаті `/status` показує, яка вбудована обв’язка активна для поточної
    сесії. Стандартна обв’язка PI відображається як `Runner: pi (embedded)` і
    не додає окремого значка. Коли вибрано вбудовану обв’язку app-server Codex,
    `/status` додає ідентифікатор не-PI обв’язки поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сесії зберігають записаний ідентифікатор своєї обв’язки, тому використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження контекстного вікна

    OpenClaw розглядає метадані моделі та обмеження контексту під час виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Стандартне обмеження `contextTokens` під час виконання: `272000`

    Менше стандартне обмеження на практиці дає кращу затримку та якість. Замініть його через `contextTokens`:

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
через Codex OAuth через той самий Model ref `openai/gpt-image-2`.

| Можливість                | API key OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Автентифікація            | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                 | OpenAI Images API                  | Бекенд Codex Responses               |
| Макс. зображень за запит  | 4                                  | 4                                    |
| Режим редагування         | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру    | Підтримується, зокрема розміри 2K/4K | Підтримується, зокрема розміри 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | За потреби зіставляється з підтримуваним розміром |

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
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання.
</Note>

`gpt-image-2` є стандартною моделлю як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для інсталяцій із Codex OAuth використовуйте той самий ref `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен
доступу OAuth і надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не виконує тихого резервного переходу на API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним base URL або кінцевою точкою Azure, якщо хочете використовувати
прямий маршрут OpenAI Images API.
Якщо ця власна кінцева точка зображень розташована у довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і надалі
блокує приватні/внутрішні OpenAI-сумісні кінцеві точки зображень, якщо цей явний дозвіл
не задано.

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

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Стандартна модель | `openai/sora-2`                                                                  |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                      |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                     |
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
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку резервного перемикання.
</Note>

## Внесок у підказку GPT-5

OpenClaw додає спільний внесок у підказку GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тож `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однакове накладання. Старіші моделі GPT-4.x — ні.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і накладання Heartbeat через інструкції розробника app-server Codex, тож сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі настанови щодо доведення справ до кінця та проактивного Heartbeat, навіть попри те, що рештою підказки обв’язки керує Codex.

Внесок GPT-5 додає позначений контракт поведінки для сталості персони, безпеки виконання, дисципліни використання інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналу поведінка відповідей і тихих повідомлень залишається у спільній системній підказці OpenClaw та політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (стандартно) | Увімкнути рівень дружнього стилю взаємодії |
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
Під час виконання значення нечутливі до регістру, тож і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще зчитується як сумісний резервний варіант, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задане.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення в текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення в текст через
    поверхню транскрибування для розуміння медіа в OpenClaw.

    - Стандартна модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: multipart-вивантаження аудіофайлу
    - Підтримується в OpenClaw усюди, де транскрибування вхідного аудіо використовує
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

    Підказки мови й prompt пересилаються до OpenAI, якщо вони задані
    спільною конфігурацією аудіомедіа або в запиті на транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей постачальник потокового режиму призначений для шляху транскрибування в реальному часі у Voice Call; голос у Discord зараз записує короткі сегменти й натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Параметр | Шлях конфігурації | Стандартно |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двоспрямований виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований постачальник `openai` може спрямовувати запити до ресурсу Azure OpenAI для
генерації зображень через перевизначення базового URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech), щоб переглянути налаштування Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або механізми відповідності вимогам, які надає Azure
- Ви хочете залишити трафік у межах наявного тенанту Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого постачальника `openai` вкажіть
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

Для запитів на генерацію зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи з областю deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту на зображення OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai`
потребує OpenClaw 2026.4.22 або новішої версії. Раніші версії обробляють будь-який власний
`openai.baseUrl` як публічну кінцеву точку OpenAI і не працюватимуть із deployment
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Якщо змінну не задано, стандартно використовується `2024-12-01-preview`.

### Імена моделей — це імена deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів на генерацію зображень Azure,
маршрутизованих через вбудованого постачальника `openai`, поле `model` в OpenClaw
має бути **іменем deployment Azure**, яке ви налаштували в порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило імен deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудованого постачальника `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в обмеженому наборі регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перед створенням deployment перевірте актуальний список регіонів Microsoft
і підтвердьте, що потрібна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` у `gpt-image-2`), або надавати їх лише в окремих версіях
моделей. Ці відмінності походять від Azure та базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте набір
параметрів, які підтримує ваш конкретний deployment і версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути проти OpenAI-сумісних**
у розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses на Azure (окрім генерації зображень) використовуйте
потік початкового налаштування або окрему конфігурацію постачальника Azure — одного лише `openai.baseUrl`
недостатньо, щоб застосувати форму API/автентифікації Azure. Існує окремий
постачальник `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує WebSocket-first із резервним переходом на SSE (`"auto"`) і для `openai/*`, і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як degraded приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (стандартно) | Спочатку WebSocket, резервно SSE |
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

  <Accordion title="Розігрів WebSocket">
    OpenClaw стандартно вмикає розігрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути розігрів
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

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI сесій повертає сесію до налаштованого стандартного значення.
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
    `serviceTier` пересилається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви спрямовуєте будь-якого з цих постачальників через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) OpenClaw автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Стандартний `compact_threshold`: 70% від `contextWindow` (або `80000`, коли значення недоступне)

    <Tabs>
      <Tab title="Явне ввімкнення">
        Корисно для сумісних кінцевих точок, як-от Azure OpenAI Responses:

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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses однаково примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
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
    - Показує явний заблокований стан, якщо модель продовжує планувати без дії

    <Note>
    Застосовується лише до запусків сімейства GPT-5 OpenAI і Codex. Інші постачальники та старіші сімейства моделей зберігають стандартну поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути проти OpenAI-сумісних">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-сумісними проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнене reasoning для моделей або проксі, що відхиляють `reasoning.effort: "none"`
    - Стандартно використовують строгий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форму запитів, властиву лише OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу prompt)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Не примушують строгі схеми інструментів або заголовки, доступні лише для нативних маршрутів

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір постачальника.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
