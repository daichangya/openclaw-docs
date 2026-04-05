---
read_when:
    - Ви хочете використовувати inference з акцентом на конфіденційність в OpenClaw
    - Вам потрібні вказівки з налаштування Venice AI
summary: Використовуйте орієнтовані на конфіденційність моделі Venice AI в OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T18:15:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI (огляд Venice)

**Venice** — це наш рекомендований варіант налаштування Venice для inference з пріоритетом конфіденційності та необов’язковим анонімізованим доступом до пропрієтарних моделей.

Venice AI надає AI-inference, орієнтований на конфіденційність, із підтримкою нецензурованих моделей і доступом до основних пропрієтарних моделей через свій анонімізований проксі. Увесь inference є приватним за замовчуванням — без навчання на ваших даних і без журналювання.

## Чому Venice в OpenClaw

- **Приватний inference** для open-source моделей (без журналювання).
- **Нецензуровані моделі**, коли вони вам потрібні.
- **Анонімізований доступ** до пропрієтарних моделей (Opus/GPT/Gemini), коли важлива якість.
- OpenAI-compatible кінцеві точки `/v1`.

## Режими конфіденційності

Venice пропонує два рівні конфіденційності — розуміння цього є ключовим для вибору моделі:

| Режим         | Опис                                                                                                                           | Моделі                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Private**   | Повністю приватний. Підказки/відповіді **ніколи не зберігаються і не журналюються**. Ефемерний режим.                         | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored тощо. |
| **Anonymized** | Проксіюється через Venice із видаленими метаданими. Базовий провайдер (OpenAI, Anthropic, Google, xAI) бачить анонімізовані запити. | Claude, GPT, Gemini, Grok                                     |

## Можливості

- **Орієнтація на конфіденційність**: вибір між режимами "private" (повністю приватний) і "anonymized" (через проксі)
- **Нецензуровані моделі**: доступ до моделей без обмежень контенту
- **Доступ до основних моделей**: використовуйте Claude, GPT, Gemini і Grok через анонімізований проксі Venice
- **OpenAI-compatible API**: стандартні кінцеві точки `/v1` для простої інтеграції
- **Streaming**: ✅ підтримується для всіх моделей
- **Function calling**: ✅ підтримується для вибраних моделей (перевіряйте можливості моделі)
- **Vision**: ✅ підтримується для моделей із можливістю vision
- **Без жорстких лімітів rate**: для екстремального використання може застосовуватися fair-use throttling

## Налаштування

### 1. Отримайте API key

1. Зареєструйтеся на [venice.ai](https://venice.ai)
2. Перейдіть до **Settings → API Keys → Create new key**
3. Скопіюйте свій API key (формат: `vapi_xxxxxxxxxxxx`)

### 2. Налаштуйте OpenClaw

**Варіант A: змінна середовища**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**Варіант B: інтерактивне налаштування (рекомендовано)**

```bash
openclaw onboard --auth-choice venice-api-key
```

Це:

1. Запитає ваш API key (або використає наявний `VENICE_API_KEY`)
2. Покажe всі доступні моделі Venice
3. Дозволить вибрати типову модель
4. Автоматично налаштує провайдера

**Варіант C: неінтерактивно**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. Перевірте налаштування

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## Вибір моделі

Після налаштування OpenClaw показує всі доступні моделі Venice. Вибирайте відповідно до своїх потреб:

- **Типова модель**: `venice/kimi-k2-5` для сильного приватного reasoning плюс vision.
- **Варіант із високими можливостями**: `venice/claude-opus-4-6` для найсильнішого анонімізованого шляху Venice.
- **Конфіденційність**: вибирайте моделі "private" для повністю приватного inference.
- **Можливості**: вибирайте моделі "anonymized", щоб отримати доступ до Claude, GPT, Gemini через проксі Venice.

Змінити типову модель можна будь-коли:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Список усіх доступних моделей:

```bash
openclaw models list | grep venice
```

## Налаштування через `openclaw configure`

1. Виконайте `openclaw configure`
2. Виберіть **Model/auth**
3. Виберіть **Venice AI**

## Яку модель мені використовувати?

| Випадок використання        | Рекомендована модель             | Чому                                         |
| --------------------------- | -------------------------------- | -------------------------------------------- |
| **Загальний чат (типово)**  | `kimi-k2-5`                      | Сильний приватний reasoning плюс vision      |
| **Найкраща загальна якість** | `claude-opus-4-6`                | Найсильніший анонімізований варіант Venice   |
| **Конфіденційність + кодування** | `qwen3-coder-480b-a35b-instruct` | Приватна модель для кодування з великим контекстом |
| **Приватний vision**        | `kimi-k2-5`                      | Підтримка vision без виходу з приватного режиму |
| **Швидко + дешево**         | `qwen3-4b`                       | Легка reasoning-модель                       |
| **Складні приватні завдання** | `deepseek-v3.2`                  | Сильний reasoning, але без підтримки інструментів Venice |
| **Нецензуровано**           | `venice-uncensored`              | Без обмежень контенту                        |

## Доступні моделі (усього 41)

### Приватні моделі (26) - повністю приватні, без журналювання

| Model ID                               | Назва                               | Контекст | Можливості                 |
| -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
| `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Типова, reasoning, vision  |
| `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Reasoning                  |
| `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Загальні                   |
| `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Загальні                   |
| `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Загальні, інструменти вимкнені |
| `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Reasoning                  |
| `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Загальні                   |
| `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Кодування                  |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Кодування                  |
| `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Reasoning, vision          |
| `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Загальні                   |
| `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
| `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Швидка, reasoning          |
| `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Reasoning, інструменти вимкнені |
| `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Нецензурована, інструменти вимкнені |
| `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
| `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
| `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Загальні                   |
| `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Загальні                   |
| `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Reasoning                  |
| `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Загальні                   |
| `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Reasoning                  |
| `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Reasoning                  |
| `zai-org-glm-5`                        | GLM 5                               | 198k     | Reasoning                  |
| `minimax-m21`                          | MiniMax M2.1                        | 198k     | Reasoning                  |
| `minimax-m25`                          | MiniMax M2.5                        | 198k     | Reasoning                  |

### Анонімізовані моделі (15) - через проксі Venice

| Model ID                        | Назва                          | Контекст | Можливості               |
| ------------------------------- | ------------------------------ | -------- | ------------------------ |
| `claude-opus-4-6`               | Claude Opus 4.6 (через Venice) | 1M       | Reasoning, vision        |
| `claude-opus-4-5`               | Claude Opus 4.5 (через Venice) | 198k     | Reasoning, vision        |
| `claude-sonnet-4-6`             | Claude Sonnet 4.6 (через Venice) | 1M     | Reasoning, vision        |
| `claude-sonnet-4-5`             | Claude Sonnet 4.5 (через Venice) | 198k   | Reasoning, vision        |
| `openai-gpt-54`                 | GPT-5.4 (через Venice)         | 1M       | Reasoning, vision        |
| `openai-gpt-53-codex`           | GPT-5.3 Codex (через Venice)   | 400k     | Reasoning, vision, кодування |
| `openai-gpt-52`                 | GPT-5.2 (через Venice)         | 256k     | Reasoning                |
| `openai-gpt-52-codex`           | GPT-5.2 Codex (через Venice)   | 256k     | Reasoning, vision, кодування |
| `openai-gpt-4o-2024-11-20`      | GPT-4o (через Venice)          | 128k     | Vision                   |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (через Venice)     | 128k     | Vision                   |
| `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (через Venice)  | 1M       | Reasoning, vision        |
| `gemini-3-pro-preview`          | Gemini 3 Pro (через Venice)    | 198k     | Reasoning, vision        |
| `gemini-3-flash-preview`        | Gemini 3 Flash (через Venice)  | 256k     | Reasoning, vision        |
| `grok-41-fast`                  | Grok 4.1 Fast (через Venice)   | 1M       | Reasoning, vision        |
| `grok-code-fast-1`              | Grok Code Fast 1 (через Venice) | 256k    | Reasoning, кодування     |

## Виявлення моделей

OpenClaw автоматично виявляє моделі з API Venice, коли встановлено `VENICE_API_KEY`. Якщо API недоступний, він переходить до статичного каталогу.

Кінцева точка `/models` є публічною (автентифікація не потрібна для перегляду списку), але для inference потрібен чинний API key.

## Підтримка streaming та інструментів

| Можливість           | Підтримка                                               |
| -------------------- | ------------------------------------------------------- |
| **Streaming**        | ✅ Усі моделі                                           |
| **Function calling** | ✅ Більшість моделей (перевіряйте `supportsFunctionCalling` в API) |
| **Vision/Images**    | ✅ Моделі, позначені можливістю "Vision"                |
| **JSON mode**        | ✅ Підтримується через `response_format`                |

## Ціни

Venice використовує систему на основі кредитів. Актуальні тарифи див. на [venice.ai/pricing](https://venice.ai/pricing):

- **Private models**: зазвичай нижча вартість
- **Anonymized models**: приблизно як пряме ціноутворення API + невелика комісія Venice

## Порівняння: Venice vs Direct API

| Аспект       | Venice (Anonymized)             | Direct API          |
| ------------ | ------------------------------- | ------------------- |
| **Конфіденційність** | Метадані видалено, анонімізовано | Ваш обліковий запис пов’язано |
| **Затримка** | +10-50 мс (проксі)              | Напряму             |
| **Можливості** | Підтримується більшість можливостей | Усі можливості      |
| **Білінг**   | Кредити Venice                  | Білінг провайдера   |

## Приклади використання

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Усунення несправностей

### API key не розпізнається

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

Переконайтеся, що ключ починається з `vapi_`.

### Модель недоступна

Каталог моделей Venice оновлюється динамічно. Виконайте `openclaw models list`, щоб побачити моделі, доступні зараз. Деякі моделі можуть бути тимчасово офлайн.

### Проблеми з підключенням

API Venice доступний за адресою `https://api.venice.ai/api/v1`. Переконайтеся, що ваша мережа дозволяє HTTPS-з’єднання.

## Приклад файла конфігурації

```json5
{
  env: { VENICE_API_KEY: "vapi_..." },
  agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
  models: {
    mode: "merge",
    providers: {
      venice: {
        baseUrl: "https://api.venice.ai/api/v1",
        apiKey: "${VENICE_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2-5",
            name: "Kimi K2.5",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Посилання

- [Venice AI](https://venice.ai)
- [Документація API](https://docs.venice.ai)
- [Ціни](https://venice.ai/pricing)
- [Статус](https://status.venice.ai)
