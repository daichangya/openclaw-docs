---
read_when:
    - Ви хочете маршрутизувати OpenClaw через проксі LiteLLM
    - Вам потрібні відстеження витрат, журналювання або маршрутизація моделей через LiteLLM
summary: Запускайте OpenClaw через LiteLLM Proxy для уніфікованого доступу до моделей і відстеження витрат
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T18:14:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) — це open-source шлюз LLM, який надає уніфікований API для 100+ провайдерів моделей. Маршрутизуйте OpenClaw через LiteLLM, щоб отримати централізоване відстеження витрат, журналювання та гнучкість перемикання між бекендами без змін у конфігурації OpenClaw.

## Навіщо використовувати LiteLLM з OpenClaw?

- **Відстеження витрат** — бачте точні витрати OpenClaw на всі моделі
- **Маршрутизація моделей** — перемикайтеся між Claude, GPT-4, Gemini, Bedrock без змін у конфігурації
- **Віртуальні ключі** — створюйте ключі з лімітами витрат для OpenClaw
- **Журналювання** — повні журнали запитів/відповідей для налагодження
- **Резервні сценарії** — автоматичне перемикання у разі відмови, якщо ваш основний провайдер недоступний

## Швидкий старт

### Через онбординг

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Ручне налаштування

1. Запустіть LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Спрямуйте OpenClaw до LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Ось і все. Тепер OpenClaw маршрутизується через LiteLLM.

## Конфігурація

### Змінні середовища

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Файл конфігурації

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Віртуальні ключі

Створіть окремий ключ для OpenClaw із лімітами витрат:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Використовуйте згенерований ключ як `LITELLM_API_KEY`.

## Маршрутизація моделей

LiteLLM може маршрутизувати запити до моделей на різні бекенди. Налаштуйте це у вашому `config.yaml` LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw і далі запитує `claude-opus-4-6` — маршрутизацію виконує LiteLLM.

## Перегляд використання

Перевіряйте панель керування LiteLLM або API:

```bash
# Key info
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Spend logs
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Примітки

- LiteLLM за замовчуванням працює на `http://localhost:4000`
- OpenClaw підключається через сумісну з OpenAI кінцеву точку `/v1` у проксі-стилі LiteLLM
- Нативне формування запитів лише для OpenAI не застосовується через LiteLLM:
  немає `service_tier`, немає `store` для Responses, немає підказок кешу prompt, а також немає
  формування payload для сумісності з reasoning в OpenAI
- Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються для користувацьких base URL LiteLLM

## Див. також

- [LiteLLM Docs](https://docs.litellm.ai)
- [Model Providers](/uk/concepts/model-providers)
