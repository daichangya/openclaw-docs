---
read_when:
    - Ви хочете використовувати Hugging Face Inference з OpenClaw
    - Вам потрібна env var токена HF або варіант auth для CLI
summary: Налаштування Hugging Face Inference (auth + вибір моделі)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T18:14:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) пропонують сумісні з OpenAI chat completions через єдиний router API. Ви отримуєте доступ до багатьох моделей (DeepSeek, Llama та інших) з одним токеном. OpenClaw використовує **сумісний з OpenAI endpoint** (лише chat completions); для text-to-image, embeddings або speech використовуйте [клієнти HF inference](https://huggingface.co/docs/api-inference/quicktour) напряму.

- Провайдер: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN` (fine-grained token з дозволом **Make calls to Inference Providers**)
- API: сумісний з OpenAI (`https://router.huggingface.co/v1`)
- Оплата: один токен HF; [тарифи](https://huggingface.co/docs/inference-providers/pricing) відповідають тарифам провайдерів із безкоштовним рівнем.

## Швидкий початок

1. Створіть fine-grained token у [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) з дозволом **Make calls to Inference Providers**.
2. Запустіть onboarding і виберіть **Hugging Face** у випадному списку провайдерів, а потім введіть свій API-ключ, коли з’явиться запит:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. У випадному списку **Default Hugging Face model** виберіть потрібну модель (список завантажується з Inference API, коли у вас є дійсний токен; інакше показується вбудований список). Ваш вибір зберігається як типова модель.
4. Ви також можете встановити або змінити типову модель пізніше в конфігурації:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Це встановить `huggingface/deepseek-ai/DeepSeek-R1` як типову модель.

## Примітка щодо середовища

Якщо Gateway працює як служба (launchd/systemd), переконайтеся, що `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Виявлення моделей і випадний список onboarding

OpenClaw виявляє моделі, викликаючи **Inference endpoint напряму**:

```bash
GET https://router.huggingface.co/v1/models
```

(Необов’язково: надішліть `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` або `$HF_TOKEN`, щоб отримати повний список; деякі endpoint повертають підмножину без auth.) Відповідь має формат OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Коли ви налаштовуєте API-ключ Hugging Face (через onboarding, `HUGGINGFACE_HUB_TOKEN` або `HF_TOKEN`), OpenClaw використовує цей GET для виявлення доступних моделей chat completion. Під час **інтерактивного налаштування**, після введення токена, ви побачите випадний список **Default Hugging Face model**, заповнений з цього списку (або з вбудованого каталогу, якщо запит не вдався). Під час runtime (наприклад, під час запуску Gateway), коли ключ присутній, OpenClaw знову викликає **GET** `https://router.huggingface.co/v1/models`, щоб оновити каталог. Список об’єднується з вбудованим каталогом (для метаданих, як-от контекстне вікно і вартість). Якщо запит не вдається або ключ не задано, використовується лише вбудований каталог.

## Назви моделей і редаговані параметри

- **Назва з API:** Відображувана назва моделі **гідратується з GET /v1/models**, коли API повертає `name`, `title` або `display_name`; інакше вона виводиться з id моделі (наприклад, `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **Перевизначення відображуваної назви:** Ви можете встановити власну мітку для кожної моделі в конфігурації, щоб вона відображалася у CLI та UI так, як вам потрібно:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **Суфікси політик:** Вбудована документація й допоміжні функції OpenClaw для Hugging Face наразі розглядають ці два суфікси як вбудовані варіанти політик:
  - **`:fastest`** — найвища пропускна здатність.
  - **`:cheapest`** — найнижча вартість за вихідний токен.

  Ви можете додати їх як окремі записи в `models.providers.huggingface.models` або встановити `model.primary` із цим суфіксом. Ви також можете задати типовий порядок провайдерів у [Inference Provider settings](https://hf.co/settings/inference-providers) (без суфікса = використовувати цей порядок).

- **Об’єднання конфігурації:** Наявні записи в `models.providers.huggingface.models` (наприклад, у `models.json`) зберігаються під час об’єднання конфігурації. Тому будь-які власні `name`, `alias` або параметри моделі, які ви там задасте, буде збережено.

## Ідентифікатори моделей і приклади конфігурації

Посилання на моделі використовують формат `huggingface/<org>/<model>` (id у стилі Hub). Наведений нижче список узято з **GET** `https://router.huggingface.co/v1/models`; ваш каталог може містити більше.

**Приклади id (з inference endpoint):**

| Модель                  | Ref (з префіксом `huggingface/`)    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

Ви можете додати `:fastest` або `:cheapest` до id моделі. Задайте типовий порядок у [Inference Provider settings](https://hf.co/settings/inference-providers); див. [Inference Providers](https://huggingface.co/docs/inference-providers) і **GET** `https://router.huggingface.co/v1/models` для повного списку.

### Повні приклади конфігурації

**Основна DeepSeek R1 із резервною Qwen:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**Qwen як типова, з варіантами `:cheapest` і `:fastest`:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS з alias:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**Кілька моделей Qwen і DeepSeek із суфіксами політик:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
