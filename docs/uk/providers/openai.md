---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете автентифікацію через підписку Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T07:51:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  OpenAI надає developer API для моделей GPT, а Codex також доступний як
  агент для кодування в межах планів ChatGPT через клієнти Codex від OpenAI. OpenClaw тримає ці
  поверхні окремими, щоб конфігурація залишалася передбачуваною.

  OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі вибирає
  маршрут provider/auth; окреме налаштування runtime вибирає, хто виконує
  вбудований цикл агента:

  - **API key** — прямий доступ до OpenAI Platform з білінгом на основі використання (`openai/*` моделі)
  - **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (`openai-codex/*` моделі)
  - **Codex app-server harness** — нативне виконання Codex app-server (`openai/*` моделі плюс `agents.defaults.agentRuntime.id: "codex"`)

  OpenAI явно підтримує використання subscription OAuth у зовнішніх інструментах і робочих процесах на кшталт OpenClaw.

  Provider, model, runtime і channel — це окремі шари. Якщо ці позначення
  починають змішуватися, прочитайте [Agent runtimes](/uk/concepts/agent-runtimes), перш ніж
  змінювати конфігурацію.

  ## Швидкий вибір

  | Ціль                                          | Використовуйте                                  | Примітки                                                                     |
  | --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
  | Прямий білінг через API key                   | `openai/gpt-5.5`                                | Задайте `OPENAI_API_KEY` або запустіть онбординг OpenAI API-key.             |
  | GPT-5.5 з auth через підписку ChatGPT/Codex   | `openai-codex/gpt-5.5`                          | Типовий маршрут PI для Codex OAuth. Найкращий перший вибір для конфігурацій із підпискою. |
  | GPT-5.5 з нативною поведінкою Codex app-server| `openai/gpt-5.5` плюс `agentRuntime.id: "codex"`| Примусово використовує Codex app-server harness для цього ref моделі.        |
  | Генерація або редагування зображень           | `openai/gpt-image-2`                            | Працює як з `OPENAI_API_KEY`, так і з OpenAI Codex OAuth.                    |
  | Зображення з прозорим тлом                    | `openai/gpt-image-1.5`                          | Використовуйте `outputFormat=png` або `webp` і `openai.background=transparent`. |

  ## Карта назв

  Назви схожі, але не є взаємозамінними:

  | Назва, яку ви бачите              | Шар               | Значення                                                                                           |
  | --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
  | `openai`                          | Префікс provider  | Прямий маршрут OpenAI Platform API.                                                                |
  | `openai-codex`                    | Префікс provider  | Маршрут OpenAI Codex OAuth/підписки через звичайний runner PI в OpenClaw.                          |
  | `codex` Plugin                    | Plugin            | Вбудований Plugin OpenClaw, який надає нативний runtime Codex app-server і елементи керування чатом `/codex`. |
  | `agentRuntime.id: codex`          | Agent runtime     | Примусово використовує нативний Codex app-server harness для вбудованих ходів.                     |
  | `/codex ...`                      | Набір чат-команд  | Прив’язка/керування тредами Codex app-server із розмови.                                            |
  | `runtime: "acp", agentId: "codex"`| Маршрут сесії ACP | Явний резервний шлях, який запускає Codex через ACP/acpx.                                          |

  Це означає, що конфігурація може навмисно містити і `openai-codex/*`, і
  Plugin `codex`. Це коректно, якщо ви хочете Codex OAuth через PI і водночас хочете,
  щоб були доступні нативні елементи керування чатом `/codex`. `openclaw doctor` попереджає про таку
  комбінацію, щоб ви могли підтвердити, що вона навмисна; він не переписує її.

  <Note>
  GPT-5.5 доступний як через прямий доступ до OpenAI Platform за API key, так і через
  маршрути підписки/OAuth. Використовуйте `openai/gpt-5.5` для прямого трафіку через `OPENAI_API_KEY`,
  `openai-codex/gpt-5.5` для Codex OAuth через PI, або
  `openai/gpt-5.5` з `agentRuntime.id: "codex"` для нативного Codex
  app-server harness.
  </Note>

  <Note>
  Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
  вмикає вбудований Plugin Codex app-server. OpenClaw вмикає цей Plugin лише
  коли ви явно вибираєте нативний Codex harness через
  `agentRuntime.id: "codex"` або використовуєте застарілий ref моделі `codex/*`.
  Якщо вбудований Plugin `codex` увімкнено, але `openai-codex/*` усе одно розв’язується
  через PI, `openclaw doctor` попереджає і залишає маршрут без змін.
  </Note>

  ## Покриття можливостей OpenClaw

  | Можливість OpenAI         | Поверхня OpenClaw                                         | Статус                                                 |
  | ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
  | Chat / Responses          | provider моделей `openai/<model>`                         | Так                                                    |
  | Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
  | Codex app-server harness  | `openai/<model>` з `agentRuntime.id: codex`               | Так                                                    |
  | Server-side web search    | Нативний інструмент OpenAI Responses                      | Так, коли web search увімкнено і provider не зафіксовано |
  | Зображення                | `image_generate`                                          | Так                                                    |
  | Відео                     | `video_generate`                                          | Так                                                    |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                 | Так                                                    |
  | Batch speech-to-text      | `tools.media.audio` / розуміння медіа                     | Так                                                    |
  | Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                 | Так                                                    |
  | Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
  | Embeddings                | provider embedding для пам’яті                            | Так                                                    |

  ## Початок роботи

  Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

  <Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Найкраще для:** прямого доступу до API та білінгу на основі використання.

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
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Ref моделі             | Конфігурація runtime         | Маршрут                    | Auth             |
    | ---------------------- | ---------------------------- | -------------------------- | ---------------- |
    | `openai/gpt-5.5`       | пропущено / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | пропущено / `agentRuntime.id: "pi"`    | Прямий OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`             | Codex app-server harness   | Codex app-server |

    <Note>
    `openai/*` — це прямий маршрут OpenAI API-key, якщо ви явно не примусите
    Codex app-server harness. Використовуйте `openai-codex/*` для Codex OAuth через
    типовий runner PI, або використовуйте `openai/gpt-5.5` з
    `agentRuntime.id: "codex"` для нативного виконання Codex app-server.
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
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу в ChatGPT.

    <Steps>
      <Step title="Запустіть Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для headless або конфігурацій, де callback працює незручно, додайте `--device-code`, щоб увійти через потік device-code ChatGPT замість браузерного callback на localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Встановіть типову модель">
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

    | Ref моделі | Конфігурація runtime | Маршрут | Auth |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | пропущено / `runtime: "pi"` | ChatGPT/Codex OAuth через PI | Вхід Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Усе одно PI, якщо якийсь Plugin явно не заявить `openai-codex` | Вхід Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server harness | Auth Codex app-server |

    <Note>
    Продовжуйте використовувати id provider `openai-codex` для команд auth/profile. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для Codex OAuth.
    Він не вибирає і не автовмикає вбудований Codex app-server harness.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Онбординг більше не імпортує матеріали OAuth із `~/.codex`. Увійдіть через OAuth у браузері (типово) або через потік device-code вище — OpenClaw керує отриманими обліковими даними у власному сховищі auth агентів.
    </Note>

    ### Індикатор статусу

    Чат `/status` показує, який runtime моделі активний для поточної сесії.
    Типовий harness PI відображається як `Runtime: OpenClaw Pi Default`. Коли
    вибрано вбудований Codex app-server harness, `/status` показує
    `Runtime: OpenAI Codex`. Наявні сесії зберігають свій записаний id harness, тож використовуйте
    `/new` або `/reset` після зміни `agentRuntime`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Попередження doctor

    Якщо вбудований Plugin `codex` увімкнено, поки вибрано маршрут цієї вкладки
    `openai-codex/*`, `openclaw doctor` попереджає, що модель
    усе ще розв’язується через PI. Залишайте конфігурацію без змін, якщо це
    і є бажаний маршрут auth через підписку. Переходьте на `openai/<model>` плюс
    `agentRuntime.id: "codex"` лише тоді, коли хочете нативне виконання Codex
    app-server.

    ### Обмеження вікна контексту

    OpenClaw трактує метадані моделі та обмеження контексту runtime як окремі значення.

    Для `openai-codex/gpt-5.5` через Codex OAuth:

    - Нативне `contextWindow`: `1000000`
    - Типове обмеження `contextTokens` для runtime: `272000`

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
    Використовуйте `contextWindow`, щоб оголошувати нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежувати бюджет контексту runtime.
    </Note>

    ### Відновлення каталогу

    OpenClaw використовує upstream-метадані каталогу Codex для `gpt-5.5`, коли вони
    доступні. Якщо live-виявлення Codex пропускає рядок `openai-codex/gpt-5.5`, хоча
    акаунт автентифікований, OpenClaw синтезує цей рядок OAuth-моделі, щоб
    запуски cron, субагента та налаштованої типової моделі не завершувалися помилкою
    `Unknown model`.

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує як генерацію зображень OpenAI через API key, так і генерацію
зображень через Codex OAuth через той самий ref моделі `openai/gpt-image-2`.

| Можливість               | API key OpenAI                     | Codex OAuth                          |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Ref моделі               | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                     | `OPENAI_API_KEY`                   | Вхід через OpenAI Codex OAuth        |
| Транспорт                | OpenAI Images API                  | Backend Codex Responses              |
| Макс. зображень на запит | 4                                  | 4                                    |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільність | Не передається в OpenAI Images API | Відображається в підтримуваний розмір, коли це безпечно |

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
Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

`gpt-image-2` — це типове значення як для генерації зображень із тексту OpenAI, так і для
редагування зображень. `gpt-image-1.5`, `gpt-image-1` і `gpt-image-1-mini` залишаються придатними
як явні перевизначення моделі. Використовуйте `openai/gpt-image-1.5` для виводу PNG/WebP
із прозорим тлом; поточний API `gpt-image-2` відхиляє
`background: "transparent"`.

Для запиту з прозорим тлом агенти мають викликати `image_generate` з
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` або `"webp"` і
`background: "transparent"`; старіша опція provider `openai.background`
усе ще підтримується. OpenClaw також захищає публічні маршрути OpenAI та
OpenAI Codex OAuth, переписуючи типові прозорі запити `openai/gpt-image-2`
на `gpt-image-1.5`; Azure і користувацькі OpenAI-сумісні endpoint-и зберігають
свої налаштовані назви deployment/model.

Те саме налаштування доступне для headless-запусків CLI:

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

Для інсталяцій із Codex OAuth зберігайте той самий ref `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен
доступу OAuth і надсилає запити на зображення через backend Codex Responses. Він
не спочатку пробує `OPENAI_API_KEY` і не виконує тихий fallback на API key для цього
запиту. Налаштуйте `models.providers.openai` явно з API key,
користувацьким base URL або endpoint Azure, якщо хочете використовувати прямий маршрут OpenAI Images API.
Якщо цей користувацький endpoint зображень розташовано в довіреній LAN/приватній адресі, також задайте
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw тримає
приватні/внутрішні OpenAI-сумісні endpoint-и зображень заблокованими, якщо цього opt-in немає.

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

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Типова модель    | `openai/sora-2`                                                                   |
| Режими           | Текст-у-відео, зображення-у-відео, редагування одного відео                       |
| Еталонні входи   | 1 зображення або 1 відео                                                          |
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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента, вибору provider і поведінки failover.
</Note>

## Внесок у prompt GPT-5

OpenClaw додає спільний внесок у prompt GPT-5 для запусків сімейства GPT-5 у різних provider-ів. Він застосовується за id моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні ref GPT-5 отримують той самий overlay. Старіші моделі GPT-4.x — ні.

Вбудований нативний Codex harness використовує ту саму поведінку GPT-5 і overlay Heartbeat через developer instructions Codex app-server, тому сесії `openai/gpt-5.x`, примусово спрямовані через `agentRuntime.id: "codex"`, зберігають ту саму послідовність виконання й проактивні настанови Heartbeat, навіть якщо рештою prompt harness керує Codex.

Внесок GPT-5 додає контракт поведінки з тегами для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для channel поведінка відповіді й тихих повідомлень залишається в спільному системному prompt OpenClaw і політиці вихідної доставки. Настанови GPT-5 завжди ввімкнені для відповідних моделей. Дружній стиль взаємодії є окремим і налаштовуваним.

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
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застарілий `plugins.entries.openai.config.personality` усе ще читається як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задано.
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
    | API key | `messages.tts.providers.openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |
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
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити base URL для TTS, не впливаючи на endpoint chat API.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Вбудований Plugin `openai` реєструє пакетне speech-to-text через
    поверхню транскрибування розуміння медіа OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-завантаження аудіофайлу
    - Підтримується в OpenClaw скрізь, де транскрибування вхідного аудіо використовує
      `tools.media.audio`, зокрема сегменти голосових каналів Discord і channel
      аудіовкладення

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

    Підказки мови та prompt-а передаються в OpenAI, коли їх задано
    через спільну конфігурацію аудіомедіа або для окремого запиту транскрибування.

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
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |

    <Note>
    Використовує WebSocket-з’єднання до `wss://api.openai.com/v1/realtime` з аудіо G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей streaming provider призначено для шляху транскрибування в реальному часі у Voice Call; голос Discord наразі записує короткі сегменти та замість цього використовує пакетний шлях транскрибування `tools.media.audio`.
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
    | API key | `...openai.apiKey` | Використовує `OPENAI_API_KEY` як резервний варіант |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двобічний виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoint-и Azure OpenAI

Вбудований provider `openai` може націлюватися на ресурс Azure OpenAI для генерації
зображень через перевизначення base URL. У шляху генерації зображень OpenClaw
визначає імена хостів Azure в `models.providers.openai.baseUrl` і автоматично перемикається на
форму запиту Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і на нього не впливає `models.providers.openai.baseUrl`. Див. акордеон **Голос
у реальному часі** в розділі [Голос і мовлення](#voice-and-speech) для його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, коли:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або засоби відповідності, які надає Azure
- Ви хочете тримати трафік у межах наявного tenancy Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого provider `openai` вкажіть
`models.providers.openai.baseUrl` на свій ресурс Azure і задайте `apiKey` як
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

OpenClaw розпізнає ці суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи з областю deployment (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту
- Використовує типовий тайм-аут запиту 600 с для викликів генерації зображень Azure.
  Значення `timeoutMs` для окремих викликів усе одно перевизначають це типове значення.

Інші base URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартну
форму запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень provider-а `openai` потребує
OpenClaw 2026.4.22 або новішої версії. Попередні версії трактують будь-який користувацький
`openai.baseUrl` як публічний endpoint OpenAI і завершуються помилкою при роботі з Azure
deployment-ами зображень.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, якщо змінну не задано.

### Назви моделей — це назви deployment

Azure OpenAI прив’язує моделі до deployment-ів. Для запитів генерації зображень Azure,
маршрутизованих через вбудований provider `openai`, поле `model` в OpenClaw
має бути **назвою deployment в Azure**, яку ви налаштували в порталі Azure, а не
публічним id моделі OpenAI.

Якщо ви створили deployment з назвою `gpt-image-2-prod`, який обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Те саме правило назв deployment застосовується до викликів генерації зображень,
маршрутизованих через вбудований provider `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перед створенням deployment перевірте актуальний список регіонів Microsoft
і підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`) або надавати їх лише в конкретних версіях
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримує ваш конкретний deployment і версія API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку compat, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні vs OpenAI-compatible
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку chat або Responses на Azure (поза генерацією зображень) використовуйте
потік онбордингу або окрему конфігурацію provider-а Azure — одного лише
`openai.baseUrl` недостатньо, щоб підхопити форму API/auth Azure. Існує окремий
provider `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket vs SSE)">
    OpenClaw використовує режим WebSocket-first із резервним SSE (`"auto"`) як для `openai/*`, так і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час cool-down
    - Додає стабільні заголовки ідентичності сесії та ходу для повторів і повторних підключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервно SSE |
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
    - [Realtime API з WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Потокові відповіді API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрів WebSocket">
    OpenClaw за замовчуванням вмикає прогрів WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

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

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли ввімкнено, OpenClaw відображає швидкий режим у пріоритетну обробку OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

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
    Перевизначення сесії мають пріоритет над конфігурацією. Очищення перевизначення сесії в UI Sessions повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Налаштуйте її для кожної моделі в OpenClaw:

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
    `serviceTier` передається лише до нативних endpoint-ів OpenAI (`api.openai.com`) і нативних endpoint-ів Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-який із цих provider-ів через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness у Plugin OpenAI автоматично вмикає server-side Compaction:

    - Примусово встановлює `store: true` (якщо compat моделі не задає `supportsStore: false`)
    - Інʼєктує `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типовий `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо недоступно)

    Це застосовується до вбудованого шляху Pi harness і до хуків provider-а OpenAI, які використовуються у вбудованих запусках. Нативний Codex app-server harness керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних endpoint-ів, таких як Azure OpenAI Responses:

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
    `responsesServerCompaction` керує лише інʼєкцією `context_management`. Прямі моделі OpenAI Responses все одно примусово встановлюють `store: true`, якщо compat не задає `supportsStore: false`.
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

    З `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти зараз
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний стан блокування, якщо модель продовжує планувати без дії

    <Note>
    Обмежено лише запусками OpenAI і Codex сімейства GPT-5. Інші provider-и та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні vs OpenAI-compatible маршрути">
    OpenClaw по-різному обробляє прямі endpoint-и OpenAI, Codex і Azure OpenAI та загальні OpenAI-compatible проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, що підтримують OpenAI effort `none`
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - За замовчуванням використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають OpenAI-специфічне формування запитів (`service_tier`, `store`, reasoning-compat, підказки кешу prompt-ів)

    **Проксі/compatible маршрути:**
    - Використовують м’якшу compat-поведінку
    - Видаляють Completions `store` з ненативних payload-ів `openai-completions`
    - Приймають наскрізний JSON `params.extra_body`/`params.extraBody` для OpenAI-compatible проксі Completions
    - Приймають `params.chat_template_kwargs` для OpenAI-compatible проксі Completions, таких як vLLM
    - Не примушують суворі схеми інструментів або нативні заголовки

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, ref моделей і поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір provider-а.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір provider-а.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці auth і правила повторного використання облікових даних.
  </Card>
</CardGroup>
