---
read_when:
    - Ви хочете використовувати попередню версію Tencent Hy3 з OpenClaw
    - Вам потрібне налаштування API key TokenHub
summary: Налаштування Tencent Cloud TokenHub для попередньої версії Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T23:05:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud постачається як **вбудований provider plugin** в OpenClaw. Він надає доступ до попередньої версії Tencent Hy3 через endpoint TokenHub (`tencent-tokenhub`).

Провайдер використовує API, сумісний з OpenAI.

| Властивість  | Значення                                  |
| ------------ | ----------------------------------------- |
| Провайдер    | `tencent-tokenhub`                        |
| Стандартна модель | `tencent-tokenhub/hy3-preview`       |
| Auth         | `TOKENHUB_API_KEY`                        |
| API          | OpenAI-compatible chat completions        |
| Base URL     | `https://tokenhub.tencentmaas.com/v1`     |
| Global URL   | `https://tokenhub-intl.tencentmaas.com/v1` |

## Швидкий старт

<Steps>
  <Step title="Створіть API key TokenHub">
    Створіть API key у Tencent Cloud TokenHub. Якщо ви вибираєте для ключа обмежену область доступу, додайте **Hy3 preview** до списку дозволених моделей.
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Перевірте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Посилання на модель             | Назва                  | Вхідні дані | Контекст | Макс. вивід | Примітки                    |
| ------------------------------- | ---------------------- | ----------- | -------- | ----------- | --------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text        | 256,000  | 64,000      | Стандартна; reasoning увімкнено |

Hy3 preview — це велика мовна модель Tencent Hunyuan на базі MoE для reasoning, дотримання інструкцій у довгому контексті, коду та робочих процесів агентів. У прикладах Tencent для OpenAI-compatible використовується `hy3-preview` як id моделі й підтримується стандартний виклик інструментів chat-completions разом із `reasoning_effort`.

<Tip>
Id моделі — `hy3-preview`. Не плутайте його з моделями Tencent `HY-3D-*`, які є API для 3D-генерації й не є chat-моделлю OpenClaw, яку налаштовує цей провайдер.
</Tip>

## Перевизначення endpoint

За замовчуванням OpenClaw використовує endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent також документує міжнародний endpoint TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Перевизначайте endpoint лише тоді, коли цього вимагає ваш обліковий запис TokenHub або ваш регіон.

## Примітки

- Посилання на моделі TokenHub використовують формат `tencent-tokenhub/<modelId>`.
- Вбудований каталог наразі містить `hy3-preview`.
- Plugin позначає Hy3 preview як модель із підтримкою reasoning і streaming-usage.
- Plugin постачається з багаторівневими метаданими ціноутворення Hy3, тому оцінки вартості заповнюються без ручних перевизначень цін.
- Перевизначайте метадані цін, контексту або endpoint у `models.providers` лише за потреби.

## Примітка щодо environment

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY`
доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Сторінка продукту Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Генерація тексту Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Налаштування Tencent TokenHub Cline для Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Картка моделі Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
