---
read_when:
    - Ви хочете використовувати моделі NVIDIA в OpenClaw
    - Вам потрібне налаштування `NVIDIA_API_KEY`
summary: Використання OpenAI-сумісного API NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T18:14:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA надає OpenAI-сумісний API за адресою `https://integrate.api.nvidia.com/v1` для моделей Nemotron і NeMo. Автентифікація виконується за допомогою API-ключа з [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Налаштування CLI

Експортуйте ключ один раз, потім запустіть онбординг і встановіть модель NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Якщо ви все ще передаєте `--token`, пам’ятайте, що він потрапляє в історію оболонки й вивід `ps`; за можливості віддавайте перевагу env-змінній.

## Фрагмент конфігурації

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## ID моделей

| Посилання на модель                                     | Назва                                    | Контекст | Макс. вивід |
| ------------------------------------------------------- | ---------------------------------------- | -------- | ----------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`         | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072  | 4,096       |
| `nvidia/meta/llama-3.3-70b-instruct`                    | Meta Llama 3.3 70B Instruct              | 131,072  | 4,096       |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct`    | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192    | 2,048       |

## Примітки

- OpenAI-сумісний endpoint `/v1`; використовуйте API-ключ із NVIDIA NGC.
- Провайдер автоматично вмикається, коли задано `NVIDIA_API_KEY`.
- Вбудований каталог є статичним; у вихідному коді вартість типово встановлена в `0`.
