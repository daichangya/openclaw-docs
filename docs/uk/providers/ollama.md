---
read_when:
    - Ви хочете запустити OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Вам потрібні моделі бачення Ollama для розуміння зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T02:11:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: dea13f69d9304cb4aa50b786dabf689fea19fba293846a2cf3d188d923b49a91
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` напряму до `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте OpenAI-сумісний URL `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Найкраще для:** найшвидшого шляху до робочого налаштування Ollama cloud або local.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Select a model">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для доступу до хмари.
      </Step>
      <Step title="Verify the model is available">
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

    За потреби вкажіть власний базовий URL або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: встановіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій із хостом підійде будь-яке значення-заглушка:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише локально
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму файлі конфігурації
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
    `Cloud + Local` використовує доступний хост Ollama як точку керування і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний сценарій.

    Під час налаштування використовуйте **Cloud + Local**. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи виконано вхід на хості для хмарного доступу через `ollama signin`. Якщо вхід на хості виконано, OpenClaw також пропонує типові розміщені хмарні значення за замовчуванням, як-от `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо вхід на хості ще не виконано, OpenClaw зберігає налаштування в режимі лише локально, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Під час налаштування використовуйте **Cloud only**. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags` і обмежується 500 записами, тому засіб вибору відображає актуальний розміщений каталог, а не статичний набір. Якщо `ollama.com` недоступний або не повертає жодних моделей під час налаштування, OpenClaw повертається до попередніх жорстко заданих рекомендацій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальне значення за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Виконує запит до `/api/tags`                                                                                                                                         |
| Виявлення можливостей | Використовує найкращу доступну спробу запитів `/api/show`, щоб зчитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools |
| Моделі vision        | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Виявлення reasoning  | Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)                                                                                       |
| Ліміти токенів       | Встановлює `maxTokens` на типовий максимальний ліміт токенів Ollama, який використовує OpenClaw                                                                    |
| Вартість             | Встановлює всі значення вартості в `0`                                                                                                                              |

Це дозволяє уникнути ручного додавання моделей, водночас зберігаючи каталог узгодженим із локальним екземпляром Ollama.

```bash
# Подивитися, які моделі доступні
ollama list
openclaw models list
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено, і вона стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автовиявлення пропускається, і вам потрібно визначити моделі вручну. Див. розділ про явну конфігурацію нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, здатного працювати із зображеннями. Це дає змогу OpenClaw спрямовувати явні запити на опис зображень і налаштовані значення за замовчуванням для моделей зображень через локальні або розміщені vision-моделі Ollama.

Для локальної vision завантажте модель, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте через infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням `<provider/model>`. Якщо його задано, `openclaw infer image describe` запускає цю модель напряму замість пропуску опису, оскільки модель підтримує нативну vision.

Щоб зробити Ollama моделлю розуміння зображень за замовчуванням для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

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

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі підтримкою введення зображень:

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
  <Tab title="Basic (implicit discovery)">
    Найпростіший шлях увімкнення режиму лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Використовуйте явну конфігурацію, якщо вам потрібне налаштування hosted cloud, Ollama працює на іншому хості/порті, ви хочете примусово задати конкретні контекстні вікна або списки моделей, або вам потрібні повністю ручні визначення моделей.

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

  <Tab title="Custom base URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 - використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, де виклик інструментів працює ненадійно. Використовуйте базовий URL Ollama без суфікса шляху.
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

Також підтримуються власні ідентифікатори провайдера Ollama. Коли посилання на модель використовує префікс активного провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw відкидає лише цей префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

## Вебпошук Ollama

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Деталі                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` напряму використовує розміщений API |
| Автентифікація | Без ключа для локальних хостів Ollama, у яких виконано вхід; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/self-hosted хости мають бути запущені, і на них має бути виконано вхід через `ollama signin`; прямий hosted-пошук потребує `baseUrl: "https://ollama.com"` плюс справжній ключ API Ollama |

Виберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

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
Повні відомості про налаштування та поведінку див. в [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Виклик інструментів у OpenAI-сумісному режимі працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі і ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно натомість використовувати OpenAI-сумісну кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // typical: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі потокова передача та виклик інструментів можуть не підтримуватися одночасно. Можливо, вам доведеться вимкнути потокову передачу через `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama не повертався мовчки до контекстного вікна 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Context windows">
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, яке повідомляє Ollama, якщо воно доступне, зокрема більші значення `PARAMETER num_ctx` із користувацьких Modelfile. В іншому разі використовується типове контекстне вікно Ollama, яке застосовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` у явній конфігурації провайдера. Щоб обмежити контекст виконання Ollama для одного запиту без перебудови Modelfile, задайте `params.num_ctx`; OpenClaw надсилає його як `options.num_ctx` як для нативного Ollama, так і для OpenAI-сумісного адаптера Ollama. Некоректні, нульові, від’ємні та нескінченні значення ігноруються, і використовується `contextWindow`.

    Записи нативних моделей Ollama також приймають поширені параметри виконання Ollama в `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тому параметри виконання OpenClaw, як-от `streaming`, не потрапляють до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати верхньорівневий параметр Ollama `think`; `false` вимикає мислення на рівні API для thinking-моделей у стилі Qwen.

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

    Також працює `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над значенням за замовчуванням для агента.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` такими, що підтримують reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна — OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Model costs">
    Ollama є безкоштовним і працює локально, тому вартість усіх моделей встановлена на рівні $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Memory embeddings">
    Вбудований Plugin Ollama реєструє провайдера embedding для пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базовий URL
    і ключ API Ollama, звертається до поточної кінцевої точки Ollama `/api/embed` і, коли можливо,
    об’єднує кілька фрагментів пам’яті в один запит `input`.

    | Властивість        | Значення            |
    | ------------- | ------------------- |
    | Типова модель | `nomic-embed-text`  |
    | Автозавантаження | Так — модель embedding автоматично завантажується локально, якщо її ще немає |

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

  <Accordion title="Streaming configuration">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу та виклик інструментів. Жодна спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування мисленням до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, а `/think low|medium|high` надсилають відповідний рядок верхнього рівня `think` із рівнем зусилля. `/think max` відображається на найвищий нативний рівень зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ "Legacy OpenAI-compatible mode" вище. У цьому режимі потокова передача та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Ollama not detected">
    Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації) і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Якщо вашої моделі немає в списку, або завантажте модель локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # Подивитися, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки перемикання при збої.
  </Card>
  <Card title="Model selection" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на базі Ollama.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
