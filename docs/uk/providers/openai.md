---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію через підписку Codex замість API-ключів
    - Вам потрібні суворіші правила виконання агентів GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T03:55:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac4a3c2c915c4e35b76b37ddccc49a6e37bcd55c8c41eb487ed788cac7d77156
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI надає API для розробників для моделей GPT, а Codex також доступний як агент для програмування в плані ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці поверхні окремо, щоб конфігурація залишалася передбачуваною.

  OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає
  маршрут провайдера/автентифікації; окремий параметр runtime визначає, хто виконує
  вбудований цикл агента:

  - **API key** — прямий доступ до OpenAI Platform з тарифікацією за використання (`openai/*` models)
  - **Codex subscription through PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` models)
  - **Codex app-server harness** — нативне виконання через app-server Codex (`openai/*` models плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

  OpenAI явно підтримує використання OAuth за підпискою у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

  Провайдер, модель, runtime і канал — це окремі шари. Якщо ці позначення
  плутаються, прочитайте [Agent runtimes](/uk/concepts/agent-runtimes) перед
  зміною конфігурації.

  ## Швидкий вибір

  | Мета                                          | Використовуйте                                         | Примітки                                                                     |
  | --------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- |
  | Пряма тарифікація через API key               | `openai/gpt-5.5`                                       | Установіть `OPENAI_API_KEY` або запустіть онбординг OpenAI API-key.          |
  | GPT-5.5 з автентифікацією через підписку ChatGPT/Codex | `openai-codex/gpt-5.5`                         | Маршрут PI за замовчуванням для Codex OAuth. Найкращий перший вибір для налаштувань із підпискою. |
  | GPT-5.5 з нативною поведінкою app-server Codex | `openai/gpt-5.5` плюс `embeddedHarness.runtime: "codex"` | Примусово використовує harness app-server Codex для цього посилання моделі. |
  | Генерація або редагування зображень           | `openai/gpt-image-2`                                   | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |
  | Зображення з прозорим фоном                   | `openai/gpt-image-1.5`                                 | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

  ## Карта назв

  Назви схожі, але не взаємозамінні:

  | Назва, яку ви бачите               | Шар               | Значення                                                                                           |
  | ---------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
  | `openai`                           | Префікс провайдера | Прямий маршрут API OpenAI Platform.                                                                |
  | `openai-codex`                     | Префікс провайдера | Маршрут OpenAI Codex OAuth/підписки через звичайний runner PI OpenClaw.                           |
  | `codex` plugin                     | Plugin            | Вбудований Plugin OpenClaw, який надає нативний runtime app-server Codex і елементи керування чатом `/codex`. |
  | `embeddedHarness.runtime: codex`   | Runtime агента    | Примусово використовує нативний harness app-server Codex для вбудованих ходів.                    |
  | `/codex ...`                       | Набір команд чату | Прив’язка/керування потоками app-server Codex із розмови.                                          |
  | `runtime: "acp", agentId: "codex"` | Маршрут сесії ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

  Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
  plugin `codex`. Це коректно, коли ви хочете Codex OAuth через PI, а також хочете,
  щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor`
  попереджає про таку комбінацію, щоб ви могли підтвердити, що вона навмисна; він її не переписує.

  <Note>
  GPT-5.5 доступний як через прямий доступ до API OpenAI Platform за API key, так і
  через маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку
  через `OPENAI_API_KEY`, `openai-codex/gpt-5.5` для Codex OAuth через PI або
  `openai/gpt-5.5` з `embeddedHarness.runtime: "codex"` для нативного harness
  app-server Codex.
  </Note>

  <Note>
  Увімкнення plugin OpenAI або вибір моделі `openai-codex/*` не
  вмикає вбудований plugin app-server Codex. OpenClaw вмикає цей plugin лише
  тоді, коли ви явно вибираєте нативний harness Codex через
  `embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання моделі `codex/*`.
  Якщо вбудований plugin `codex` увімкнено, але `openai-codex/*` усе ще резолвиться
  через PI, `openclaw doctor` попереджає та залишає маршрут без змін.
  </Note>

  ## Покриття можливостей OpenClaw

  | Можливість OpenAI         | Поверхня OpenClaw                                         | Стан                                                   |
  | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | Провайдер моделі `openai/<model>`                         | Так                                                    |
  | Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
  | Harness app-server Codex  | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
  | Пошук у вебі на сервері   | Нативний інструмент OpenAI Responses                      | Так, коли вебпошук увімкнено і провайдера не закріплено |
  | Зображення                | `image_generate`                                          | Так                                                    |
  | Відео                     | `video_generate`                                          | Так                                                    |
  | Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`           | Так                                                    |
  | Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа        | Так                                                    |
  | Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`     | Так                                                    |
  | Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
  | Embeddings                | провайдер embedding для пам’яті                           | Так                                                    |

  ## Початок роботи

  Виберіть бажаний метод автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API і тарифікації за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [панелі OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте key безпосередньо:

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

    ### Зведення маршрутів

    | Model ref             | Конфігурація runtime        | Маршрут                    | Автентифікація   |
    | --------------------- | --------------------------- | -------------------------- | ---------------- |
    | `openai/gpt-5.5`      | пропущено / `runtime: "pi"` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | пропущено / `runtime: "pi"` | Прямий API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`      | `runtime: "codex"`          | Harness app-server Codex   | Codex app-server |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API-key, якщо ви явно не примусите
    використання harness app-server Codex. Використовуйте `openai-codex/*` для Codex OAuth через
    runner PI за замовчуванням або використовуйте `openai/gpt-5.5` з
    `embeddedHarness.runtime: "codex"` для нативного виконання через app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Живі запити до API OpenAI відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud вимагає входу через ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth безпосередньо:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або несумісних із callback середовищ додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість callback браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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

    ### Зведення маршрутів

    | Model ref | Конфігурація runtime | Маршрут | Автентифікація |
    |-----------|----------------------|---------|----------------|
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе ще PI, якщо якийсь plugin явно не заявляє `openai-codex` | вхід Codex |
    | `openai/gpt-5.5` | `embeddedHarness.runtime: "codex"` | Harness app-server Codex | автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор провайдера `openai-codex` для команд автентифікації/профілю. Префікс моделі `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не вмикає автоматично вбудований harness app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth з `~/.codex`. Увійдіть через OAuth у браузері (за замовчуванням) або через наведений вище потік device-code — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор стану

    У чаті `/status` показує, який runtime моделі активний для поточної сесії.
    Harness PI за замовчуванням відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований harness app-server Codex, `/status` показує
    `Runtime: OpenAI Codex`. Існуючі сесії зберігають записаний для них ідентифікатор harness, тож використайте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований plugin `codex` увімкнено, поки вибрано маршрут
    `openai-codex/*` з цієї вкладки, `openclaw doctor` попереджає, що модель
    усе ще резолвиться через PI. Залиште конфігурацію без змін, якщо це і є
    бажаний маршрут автентифікації через підписку. Перемикайтеся на `openai/<model>` плюс
    `embeddedHarness.runtime: "codex"` лише тоді, коли вам потрібне нативне виконання через
    app-server Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Обмеження `contextTokens` runtime за замовчуванням: `272000`

    Менше обмеження за замовчуванням на практиці забезпечує кращі характеристики затримки та якості. Перевизначте його за допомогою `contextTokens`:

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
Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту runtime.
</Note>

### Відновлення каталогу

OpenClaw використовує метадані каталогу Codex з upstream для `gpt-5.5`, коли вони
наявні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, тоді як
обліковий запис автентифіковано, OpenClaw синтезує цей рядок OAuth-моделі, щоб
запуски Cron, субагентів і налаштованої моделі за замовчуванням не завершувалися з
`Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI за API key, так і генерацію зображень
через Codex OAuth з тим самим посиланням моделі `openai/gpt-image-2`.

| Можливість               | OpenAI API key                      | Codex OAuth                         |
| ------------------------ | ----------------------------------- | ----------------------------------- |
| Посилання моделі         | `openai/gpt-image-2`                | `openai/gpt-image-2`                |
| Автентифікація           | `OPENAI_API_KEY`                    | вхід через OpenAI Codex OAuth       |
| Транспорт                | OpenAI Images API                   | бекенд Codex Responses              |
| Макс. зображень на запит | 4                                   | 4                                   |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до OpenAI Images API | Відображається у підтримуваний розмір, коли це безпечно |

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
Див. [Image Generation](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку failover.
</Note>

`gpt-image-2` — це модель за замовчуванням як для генерації зображень з тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються
доступними як явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу
PNG/WebP із прозорим фоном; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим фоном агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіший параметр провайдера `openai.background`
усе ще приймається. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи прозорі запити за замовчуванням для `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні endpoints зберігають
свої налаштовані назви deployment/model.

Той самий параметр доступний для headless-запусків CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Використовуйте ті самі прапорці `--output-format` і `--background` з
`openclaw infer image edit`, коли починаєте з вхідного файлу.
`--openai-background` залишається доступним як OpenAI-специфічний псевдонім.

Для інсталяцій із Codex OAuth зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw резолвить збережений OAuth-токен
доступу й надсилає запити на зображення через бекенд Codex Responses. Він
не намагається спочатку використати `OPENAI_API_KEY` і не переходить беззвучно до API key для цього
запиту. Налаштуйте `models.providers.openai` явно з API key,
користувацьким base URL або endpoint Azure, якщо хочете використовувати прямий маршрут
OpenAI Images API.
Якщо цей користувацький endpoint зображень розташований у довіреній LAN/приватній адресі, також установіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і далі
блокує приватні/внутрішні OpenAI-сумісні endpoints зображень, якщо цей opt-in
не задано.

Згенерувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Згенерувати прозорий PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Редагувати:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Текст у відео, зображення у відео, редагування одного відео                       |
| Вхідні еталони   | 1 зображення або 1 відео                                                          |
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
Див. [Video Generation](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір провайдера та поведінку failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 у різних провайдерів. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x цього не отримують.

Вбудований нативний harness Codex використовує ту саму поведінку GPT-5 і overlay Heartbeat через інструкції розробника app-server Codex, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення виконання до кінця й проактивного Heartbeat, навіть якщо рештою prompt harness керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналів поведінка відповіді та тихих повідомлень залишається у спільному системному prompt OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Рівень дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                          |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (default) | Увімкнути рівень дружнього стилю взаємодії     |
| `"on"`                 | Псевдонім для `"friendly"`                     |
| `"off"`                | Вимкнути лише рівень дружнього стилю           |

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
Значення нечутливі до регістру під час виконання, тож і `"Off"`, і `"off"` вимикають рівень дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще зчитується як резервна сумісна опція, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Резервне значення з `OPENAI_API_KEY` |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS, не впливаючи на endpoint API чату.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрипції розуміння медіа в OpenClaw.

    - Модель за замовчуванням: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях вхідних даних: multipart-вивантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де транскрипція вхідного аудіо використовує
      `tools.media.audio`, зокрема в сегментах голосових каналів Discord і
      аудіовкладеннях каналів

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

    Підказки щодо мови та prompt передаються до OpenAI, коли їх надає
    спільна конфігурація аудіомедіа або запит транскрипції для окремого виклику.

  </Accordion>

  <Accordion title="Транскрипція в реальному часі">
    Вбудований plugin `openai` реєструє транскрипцію в реальному часі для plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Prompt | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Резервне значення з `OPENAI_API_KEY` |

    <Note>
    Використовує підключення WebSocket до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей потоковий провайдер призначений для шляху транскрипції в реальному часі у Voice Call; голос у Discord наразі записує короткі сегменти й замість цього використовує пакетний шлях транскрипції `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований plugin `openai` реєструє голос у реальному часі для plugin Voice Call.

    | Налаштування | Шлях конфігурації | За замовчуванням |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Резервне значення з `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints Azure OpenAI

Вбудований провайдер `openai` може спрямовувати запити до ресурсу Azure OpenAI для
генерації зображень через перевизначення base URL. На шляху генерації зображень OpenClaw
автоматично визначає хости Azure у `models.providers.openai.baseUrl` і перемикається
на формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) щодо його параметрів Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібне регіональне зберігання даних або засоби відповідності вимогам, які надає Azure
- Ви хочете залишити трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого провайдера `openai` задайте
в `models.providers.openai.baseUrl` ваш ресурс Azure і встановіть `apiKey` як
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
- Використовує шляхи на рівні deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує тайм-аут запиту 600 с за замовчуванням для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремого виклику все одно перевизначають це значення за замовчуванням.

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту до OpenAI для зображень.

<Note>
Маршрутизація Azure для шляху генерації зображень провайдера `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії розглядають будь-який користувацький
`openai.baseUrl` як публічний endpoint OpenAI і завершаться помилкою при роботі з deployment зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Значення за замовчуванням — `2024-12-01-preview`, якщо змінну не задано.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment. Для запитів генерації зображень Azure,
маршрутизованих через вбудований провайдер `openai`, поле `model` в OpenClaw
має бути **назвою deployment Azure**, яку ви налаштували в порталі Azure, а не
публічним ідентифікатором моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований провайдер `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в частині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
deployment і підтвердьте, що потрібна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які публічний OpenAI дозволяє (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для конкретних версій
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, які підтримує ваш конкретний deployment і версія API, у
порталі Azure.

<Note>
Azure OpenAI використовує нативну транспортну та сумісну поведінку, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні маршрути й OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses в Azure (окрім генерації зображень) використовуйте
потік онбордингу або окрему конфігурацію провайдера Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати формат API/автентифікації Azure. Існує окремий
провайдер `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує режим WebSocket-first із резервним переходом на SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (default) | Спочатку WebSocket, потім резервний перехід на SSE |
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
    OpenClaw вмикає прогрів WebSocket за замовчуванням для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

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
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw відображає швидкий режим у пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, і швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення на рівні сесії мають вищий пріоритет за конфігурацію. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого значення за замовчуванням.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Задайте його для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних endpoints OpenAI (`api.openai.com`) і нативних endpoints Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих провайдерів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) stream-wrapper Pi harness у plugin OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо сумісність моделі не задає `supportsStore: false`)
    - Впроваджує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` за замовчуванням: 70% від `contextWindow` (або `80000`, якщо значення недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків провайдера OpenAI, які використовуються вбудованими запусками. Нативний harness app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явне ввімкнення">
        Корисно для сумісних endpoints, таких як Azure OpenAI Responses:

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
      <Tab title="Користувацький поріг">
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
      <Tab title="Вимкнення">
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
    `responsesServerCompaction` керує лише впровадженням `context_management`. Прямі моделі OpenAI Responses усе одно примусово задають `store: true`, якщо сумісність не встановлює `supportsStore: false`.
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

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним поступом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний стан блокування, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками сімейства OpenAI і Codex GPT-5. Інші провайдери й старіші сімейства моделей зберігають поведінку за замовчуванням.
    </Note>

  </Accordion>

  <Accordion title="Нативні маршрути й OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі endpoints OpenAI, Codex і Azure OpenAI та загальні OpenAI-сумісні проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнене reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують strict mode для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають форматування запитів, властиве лише OpenAI (`service_tier`, `store`, сумісність reasoning, підказки кешу prompt)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу сумісну поведінку
    - Видаляють Completions `store` із ненативних payload `openai-completions`
    - Приймають JSON pass-through для розширених `params.extra_body`/`params.extraBody` для OpenAI-сумісних проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-сумісних проксі Completions, таких як vLLM
    - Не примушують strict-схеми інструментів або заголовки лише для нативних маршрутів

    Azure OpenAI використовує нативну транспортну та сумісну поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео й вибір провайдера.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
