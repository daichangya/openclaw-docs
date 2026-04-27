---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
    - Ви хочете використовувати моделі бачення Ollama для розуміння зображень
summary: Запуск OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T04:34:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: afb9ecca376bb6522eacb195e6c0c590029e3deb9e2f673505008cdc86883800
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/власнорозгорнутих серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` напряму до `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте OpenAI-сумісний URL `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід віддавати перевагу `baseUrl`.

## Правила автентифікації

<AccordionGroup>
  <Accordion title="Локальні хости та хости LAN">
    Локальним хостам і хостам Ollama у LAN не потрібен справжній bearer-токен. OpenClaw використовує локальний маркер `ollama-local` лише для loopback, приватної мережі, `.local` і базових URL Ollama з простими іменами хостів.
  </Accordion>
  <Accordion title="Віддалені хости та Ollama Cloud">
    Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.
  </Accordion>
  <Accordion title="Власні id провайдерів">
    Власні id провайдерів, які задають `api: "ollama"`, дотримуються тих самих правил. Наприклад, провайдер `ollama-remote`, що вказує на приватний хост Ollama у LAN, може використовувати `apiKey: "ollama-local"`, і підлеглі агенти розв’яжуть цей маркер через хук провайдера Ollama, а не трактуватимуть його як відсутні облікові дані.
  </Accordion>
  <Accordion title="Область дії embedding для пам’яті">
    Коли Ollama використовується для embedding пам’яті, bearer-автентифікація обмежується тим хостом, де її було оголошено:

    - Ключ на рівні провайдера надсилається лише до хоста Ollama цього провайдера.
    - `agents.*.memorySearch.remote.apiKey` надсилається лише до його віддаленого хоста embedding.
    - Чисте значення змінної середовища `OLLAMA_API_KEY` вважається домовленістю для Ollama Cloud і типово не надсилається до локальних або власнорозгорнутих хостів.

  </Accordion>
</AccordionGroup>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Онбординг (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Виберіть свій режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, що маршрутизуються через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично виконують pull вибраної локальної моделі, якщо вона ще недоступна. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для доступу до хмари.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Неінтерактивний режим

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    За бажанням можна вказати власний базовий URL або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Ручне налаштування">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Виберіть хмару або локальний режим">
        - **Cloud + Local**: установіть Ollama, увійдіть за допомогою `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Виконайте pull локальної моделі (лише local only)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій, що спираються на хост, підійде будь-яке значення-заповнювач:

        ```bash
        # Хмара
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише локально
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму конфігураційному файлі
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та встановіть свою модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть значення за замовчуванням у конфігурації:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Хмарні моделі

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний потік.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі на цьому хості та перевіряє, чи виконано вхід на хості для доступу до хмари за допомогою `ollama signin`. Якщо на хості виконано вхід, OpenClaw також пропонує типові розміщені хмарні значення, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо на хості ще не виконано вхід, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, установлює `baseUrl: "https://ollama.com"` і ініціалізує список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags` з обмеженням до 500 записів, тому засіб вибору відображає поточний розміщений каталог, а не статичний початковий набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих підказок, щоб онбординг усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або власнорозгорнутих серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Докладно                                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Виконує запити до `/api/tags`                                                                                                                                          |
| Визначення можливостей | Використовує best-effort запити до `/api/show`, щоб зчитати `contextWindow`, розширені параметри Modelfile `num_ctx` та можливості, зокрема vision/tools            |
| Моделі vision        | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Визначення reasoning | Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)                                                                                           |
| Обмеження токенів    | Установлює `maxTokens` на типове максимальне обмеження токенів Ollama, яке використовує OpenClaw                                                                      |
| Вартість             | Установлює всі вартості в `0`                                                                                                                                          |

Це дає змогу уникнути ручного внесення моделей, зберігаючи при цьому узгодженість каталогу з локальним екземпляром Ollama.

```bash
# Переглянути, які моделі доступні
ollama list
openclaw models list
```

Щоб додати нову модель, просто виконайте її pull через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена та стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автовиявлення пропускається, і вам потрібно визначати моделі вручну. Див. розділ про явну конфігурацію нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, здатного працювати із зображеннями. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові моделі зображень через локальні або розміщені vision-моделі Ollama.

Для локального vision виконайте pull моделі, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте це через infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням формату `<provider/model>`. Якщо його задано, `openclaw infer image describe` запускає цю модель безпосередньо, а не пропускає опис через те, що модель підтримує нативний vision.

Щоб зробити Ollama типовою моделлю розуміння зображень для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі підтримкою зображень на вході:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший шлях увімкнення режиму лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, якщо вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати певні context window або списки моделей, або вам потрібні повністю ручні визначення моделей.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Власний базовий URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
            timeoutSeconds: 300, // Необов’язково: дайте холодним локальним моделям більше часу на підключення та потокову передачу
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Необов’язково: тримати модель завантаженою між запитами
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, у якому виклик інструментів працює ненадійно. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

### Вибір моделі

Після налаштування всі ваші моделі Ollama будуть доступні:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Також підтримуються власні id провайдерів Ollama. Коли посилання на модель використовує префікс активного
провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw відкидає лише цей
префікс перед викликом Ollama, тож сервер отримує `qwen3:32b`.

Для повільних локальних моделей віддавайте перевагу налаштуванню запитів на рівні провайдера, перш ніж збільшувати
тайм-аут усього середовища виконання агента:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` застосовується до HTTP-запиту моделі, включно з установленням з’єднання,
заголовками, потоковою передачею тіла та загальним аварійним перериванням guarded-fetch. `params.keep_alive`
передається до Ollama як верхньорівневий `keep_alive` у нативних запитах `/api/chat`;
задавайте його для кожної моделі, якщо вузьким місцем є час завантаження першого запиту.

## Вебпошук Ollama

OpenClaw підтримує **вебпошук Ollama** як вбудований провайдер `web_search`.

| Властивість | Докладно                                                                                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Хост        | Використовує налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` напряму використовує розміщений API |
| Автентифікація | Без ключа для локальних хостів Ollama з виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/власнорозгорнуті хости мають бути запущені, і на них має бути виконано вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` плюс справжній ключ API Ollama |

Виберіть **вебпошук Ollama** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Докладний опис налаштування та поведінки див. у [Вебпошук Ollama](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **Виклик інструментів в OpenAI-сумісному режимі працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам усе ж потрібно використовувати OpenAI-сумісну кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // типово: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі може не підтримуватися одночасно потокова передача та виклик інструментів. Можливо, вам доведеться вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw типово додає `options.num_ctx`, щоб Ollama не переходив мовчки до context window 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context window">
    Для автоматично виявлених моделей OpenClaw використовує context window, про яке повідомляє Ollama, якщо воно доступне, зокрема більші значення `PARAMETER num_ctx` із власних Modelfile. В іншому разі використовується типове context window Ollama, яке застосовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` у явній конфігурації провайдера. Щоб обмежити контекст виконання Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; OpenClaw надсилає його як `options.num_ctx` і для нативного Ollama, і для OpenAI-сумісного адаптера Ollama. Некоректні, нульові, від’ємні та нескінченні значення ігноруються, і використовується `contextWindow`.

    Записи нативних моделей Ollama також приймають поширені параметри виконання Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw передає лише ключі запиту Ollama, тому параметри виконання OpenClaw, такі як `streaming`, не витікають до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати верхньорівневий `think` Ollama; `false` вимикає thinking на рівні API для thinking-моделей у стилі Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Працює і `agents.defaults.models["ollama/<model>"].params.num_ctx` для кожної моделі. Якщо задано обидва варіанти, явний запис моделі провайдера має перевагу над типовым значенням агента.

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Жодна додаткова конфігурація не потрібна. OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому вартість усіх моделей встановлено на рівні $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Memory embedding">
    Вбудований Plugin Ollama реєструє провайдера embedding пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базовий URL
    і ключ API Ollama, викликає поточну кінцеву точку Ollama `/api/embed` і
    за можливості об’єднує кілька фрагментів пам’яті в один запит `input`.

    | Властивість       | Значення            |
    | ------------- | ------------------- |
    | Типова модель | `nomic-embed-text`  |
    | Auto-pull     | Так — модель embedding автоматично завантажується, якщо локально її немає |

    Щоб вибрати Ollama як провайдера embedding для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація потокової передачі">
    Інтеграція Ollama в OpenClaw типово використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу та виклик інструментів. Жодна спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, тоді як `/think low|medium|high` надсилають відповідний верхньорівневий рядок зусилля `think`. `/think max` зіставляється з найвищим нативним рівнем зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі потокова передача та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення проблем

<AccordionGroup>
  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашу модель не вказано у списку, або виконайте pull моделі локально, або визначте її явно в `models.providers.ollama`.

    ```bash
    ollama list  # Переглянути, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Холодна локальна модель перевищує тайм-аут">
    Великим локальним моделям може знадобитися тривале початкове завантаження перед початком потокової передачі. Залишайте тайм-аут обмеженим провайдером Ollama та, за бажання, попросіть Ollama тримати модель завантаженою між запитами:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Якщо сам хост повільно приймає з’єднання, `timeoutSeconds` також збільшує захищений тайм-аут підключення Undici для цього провайдера.

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення проблем](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки перемикання на резервні варіанти.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Вебпошук Ollama" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повний опис налаштування та поведінки вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повна довідка з конфігурації.
  </Card>
</CardGroup>
