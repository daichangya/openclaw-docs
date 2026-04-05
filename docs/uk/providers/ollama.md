---
read_when:
    - Ви хочете запускати OpenClaw із хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
summary: Запускайте OpenClaw з Ollama (хмарні й локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-05T18:15:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 337b8ec3a7756e591e6d6f82e8ad13417f0f20c394ec540e8fc5756e0fc13c29
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama — це локальне середовище виконання LLM, яке спрощує запуск open-source моделей на вашій машині. OpenClaw інтегрується з нативним API Ollama (`/api/chat`), підтримує потокову передачу та виклик інструментів і може автоматично виявляти локальні моделі Ollama, якщо ви явно ввімкнете це через `OLLAMA_API_KEY` (або профіль автентифікації) і не визначите явний запис `models.providers.ollama`.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте сумісну з OpenAI URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте нативну URL-адресу API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

## Швидкий старт

### Онбординг (рекомендовано)

Найшвидший спосіб налаштувати Ollama — через онбординг:

```bash
openclaw onboard
```

Виберіть **Ollama** зі списку провайдерів. Онбординг:

1. Запитає базову URL-адресу Ollama, за якою доступний ваш екземпляр (типово `http://127.0.0.1:11434`).
2. Дозволить вибрати **Cloud + Local** (хмарні моделі та локальні моделі) або **Local** (лише локальні моделі).
3. Відкриє в браузері процес входу, якщо ви виберете **Cloud + Local** і не ввійшли на ollama.com.
4. Виявить доступні моделі та запропонує типові значення.
5. Автоматично завантажить вибрану модель, якщо вона недоступна локально.

Також підтримується неінтерактивний режим:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

За потреби вкажіть власну base URL або модель:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### Ручне налаштування

1. Установіть Ollama: [https://ollama.com/download](https://ollama.com/download)

2. Завантажте локальну модель, якщо хочете локальну інференцію:

```bash
ollama pull glm-4.7-flash
# or
ollama pull gpt-oss:20b
# or
ollama pull llama3.3
```

3. Якщо вам також потрібні хмарні моделі, увійдіть:

```bash
ollama signin
```

4. Запустіть онбординг і виберіть `Ollama`:

```bash
openclaw onboard
```

- `Local`: лише локальні моделі
- `Cloud + Local`: локальні моделі плюс хмарні моделі
- Хмарні моделі, такі як `kimi-k2.5:cloud`, `minimax-m2.5:cloud` і `glm-5:cloud`, **не** потребують локального `ollama pull`

Зараз OpenClaw пропонує:

- типова локальна модель: `glm-4.7-flash`
- типові хмарні моделі: `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`

5. Якщо ви віддаєте перевагу ручному налаштуванню, увімкніть Ollama для OpenClaw безпосередньо (підійде будь-яке значення; Ollama не вимагає справжнього ключа):

```bash
# Set environment variable
export OLLAMA_API_KEY="ollama-local"

# Or configure in your config file
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. Перегляньте моделі або перемкніться між ними:

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. Або встановіть типову модель у конфігурації:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`:

- Виконує запит до `/api/tags`
- Використовує best-effort звернення до `/api/show`, щоб зчитати `contextWindow`, коли це можливо
- Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)
- Установлює `maxTokens` на типове обмеження максимальної кількості токенів Ollama, яке використовує OpenClaw
- Установлює всі вартості в `0`

Це дає змогу уникнути ручного опису моделей, зберігаючи каталог синхронізованим із локальним екземпляром Ollama.

Щоб подивитися, які моделі доступні:

```bash
ollama list
openclaw models list
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й стане доступною для використання.

Якщо ви явно задаєте `models.providers.ollama`, автоматичне виявлення пропускається, і вам потрібно вручну визначити моделі (див. нижче).

## Конфігурація

### Базове налаштування (неявне виявлення)

Найпростіший спосіб увімкнути Ollama — через змінну середовища:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### Явне налаштування (ручні моделі)

Використовуйте явну конфігурацію, коли:

- Ollama працює на іншому хості або порту.
- Ви хочете примусово задати конкретні `contextWindow` або списки моделей.
- Вам потрібні повністю ручні визначення моделей.

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
        apiKey: "ollama-local",
        api: "ollama",
        models: [
          {
            id: "gpt-oss:20b",
            name: "GPT-OSS 20B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 8192 * 10
          }
        ]
      }
    }
  }
}
```

Якщо задано `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.

### Власна base URL (явна конфігурація)

Якщо Ollama працює на іншому хості чи порту (явна конфігурація вимикає автоматичне виявлення, тому моделі потрібно визначити вручну):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
        api: "ollama", // Set explicitly to guarantee native tool-calling behavior
      },
    },
  },
}
```

<Warning>
Не додавайте `/v1` до URL-адреси. Шлях `/v1` використовує режим сумісності з OpenAI, у якому виклик інструментів працює ненадійно. Використовуйте базову URL-адресу Ollama без суфікса шляху.
</Warning>

### Вибір моделі

Після налаштування всі ваші моделі Ollama стають доступними:

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

## Хмарні моделі

Хмарні моделі дають змогу запускати розміщені в хмарі моделі (наприклад, `kimi-k2.5:cloud`, `minimax-m2.5:cloud`, `glm-5:cloud`) разом із локальними моделями.

Щоб використовувати хмарні моделі, виберіть режим **Cloud + Local** під час налаштування. Майстер перевіряє, чи ви ввійшли, і за потреби відкриває в браузері процес входу. Якщо автентифікацію не вдається підтвердити, майстер повертається до типових локальних моделей.

Ви також можете ввійти безпосередньо на [ollama.com/signin](https://ollama.com/signin).

## Ollama Web Search

OpenClaw також підтримує **Ollama Web Search** як bundled-провайдера `web_search`.

- Він використовує налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо
  задано, інакше `http://127.0.0.1:11434`).
- Він не потребує ключа.
- Для нього потрібно, щоб Ollama працював і щоб ви ввійшли через `ollama signin`.

Виберіть **Ollama Web Search** під час `openclaw onboard` або
`openclaw configure --section web`, або задайте:

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

Повні відомості про налаштування та поведінку див. у [Ollama Web Search](/tools/ollama-search).

## Додатково

### Моделі з reasoning

OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` такими, що підтримують reasoning:

```bash
ollama pull deepseek-r1:32b
```

### Вартість моделей

Ollama безкоштовний і працює локально, тому для всіх моделей вартість установлено в $0.

### Конфігурація потокової передачі

Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу й виклик інструментів. Жодної спеціальної конфігурації не потрібно.

#### Застарілий режим сумісності з OpenAI

<Warning>
**Виклик інструментів у режимі сумісності з OpenAI працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
</Warning>

Якщо вам усе ж потрібно використовувати кінцеву точку сумісності з OpenAI (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // default: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

Цей режим може не підтримувати одночасно потокову передачу й виклик інструментів. Може знадобитися вимкнути потокову передачу через `params: { streaming: false }` у конфігурації моделі.

Коли з Ollama використовується `api: "openai-completions"`, OpenClaw типово додає `options.num_ctx`, щоб Ollama не переходив непомітно до контекстного вікна 4096. Якщо ваш проксі/вищестоячий сервіс відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

### Контекстні вікна

Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, повідомлене Ollama, коли воно доступне, а інакше повертається до типового контекстного вікна Ollama, яке використовує OpenClaw. Ви можете перевизначити `contextWindow` і `maxTokens` у явній конфігурації провайдера.

## Усунення несправностей

### Ollama не виявляється

Переконайтеся, що Ollama запущено, що ви задали `OLLAMA_API_KEY` (або профіль автентифікації) і що ви **не** визначили явний запис `models.providers.ollama`:

```bash
ollama serve
```

Також переконайтеся, що API доступний:

```bash
curl http://localhost:11434/api/tags
```

### Немає доступних моделей

Якщо вашу модель не видно в списку, зробіть одне з такого:

- Завантажте модель локально, або
- Явно визначте модель у `models.providers.ollama`.

Щоб додати моделі:

```bash
ollama list  # See what's installed
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # Or another model
```

### Відмовлено в підключенні

Переконайтеся, що Ollama працює на правильному порту:

```bash
# Check if Ollama is running
ps aux | grep ollama

# Or restart Ollama
ollama serve
```

## Див. також

- [Model Providers](/uk/concepts/model-providers) - огляд усіх провайдерів
- [Model Selection](/uk/concepts/models) - як вибирати моделі
- [Configuration](/uk/gateway/configuration) - повний довідник із конфігурації
