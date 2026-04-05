---
read_when:
    - Ви хочете один API-ключ для багатьох LLM
    - Вам потрібні вказівки з налаштування Baidu Qianfan
summary: Використання уніфікованого API Qianfan для доступу до багатьох моделей в OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T18:14:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Посібник з провайдера Qianfan

Qianfan — це платформа MaaS від Baidu, яка надає **уніфікований API**, що маршрутизує запити до багатьох моделей через єдиний endpoint і API-ключ. Вона сумісна з OpenAI, тому більшість SDK OpenAI працюють після зміни base URL.

## Передумови

1. Обліковий запис Baidu Cloud з доступом до API Qianfan
2. API-ключ із консолі Qianfan
3. OpenClaw, установлений у вашій системі

## Отримання API-ключа

1. Перейдіть до [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Створіть новий застосунок або виберіть наявний
3. Згенеруйте API-ключ (формат: `bce-v3/ALTAK-...`)
4. Скопіюйте API-ключ для використання з OpenClaw

## Налаштування CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Фрагмент конфігурації

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Примітки

- Типове посилання на вбудовану модель: `qianfan/deepseek-v3.2`
- Типова base URL: `https://qianfan.baidubce.com/v2`
- Вбудований каталог наразі містить `deepseek-v3.2` і `ernie-5.0-thinking-preview`
- Додавайте або перевизначайте `models.providers.qianfan` лише тоді, коли вам потрібні власна base URL або метадані моделі
- Qianfan працює через сумісний з OpenAI транспортний шлях, а не через нативне формування запитів OpenAI

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Налаштування агента](/uk/concepts/agent)
- [Документація API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
