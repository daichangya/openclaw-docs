---
read_when:
    - Ви хочете використовувати попередній перегляд Tencent Hy3 з OpenClaw
    - Вам потрібно налаштувати API-ключ TokenHub
summary: Налаштування Tencent Cloud TokenHub для попереднього перегляду Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T15:31:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77ad001f0bbdf2cfe2e0e9b01a89bd9d190deb558a0478a08d3ac62995d2a9f1
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud TokenHub

Tencent Cloud постачається як **вбудований plugin провайдера** в OpenClaw. Він надає доступ до попереднього перегляду Tencent Hy3 через endpoint TokenHub (`tencent-tokenhub`).

Провайдер використовує API, сумісний з OpenAI.

| Властивість   | Значення                                   |
| ------------- | ------------------------------------------ |
| Провайдер     | `tencent-tokenhub`                         |
| Модель за замовчуванням | `tencent-tokenhub/hy3-preview`   |
| Автентифікація | `TOKENHUB_API_KEY`                        |
| API           | чат-completions, сумісні з OpenAI          |
| Базовий URL   | `https://tokenhub.tencentmaas.com/v1`      |
| Глобальний URL | `https://tokenhub-intl.tencentmaas.com/v1` |

## Швидкий старт

<Steps>
  <Step title="Створіть API-ключ TokenHub">
    Створіть API-ключ у Tencent Cloud TokenHub. Якщо ви вибираєте для ключа обмежену область доступу, включіть **Hy3 preview** до дозволених моделей.
  </Step>
  <Step title="Запустіть онбординг">
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

## Каталог моделей

| Посилання на модель            | Назва                  | Вхід | Контекст | Макс. вивід | Примітки                   |
| ------------------------------ | ---------------------- | ---- | -------- | ----------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text | 256,000  | 64,000      | За замовчуванням; із підтримкою міркування |

Hy3 preview — це велика мовна MoE-модель Tencent Hunyuan для міркування, виконання інструкцій у довгому контексті, коду та агентних робочих процесів. У прикладах Tencent для API, сумісного з OpenAI, як ідентифікатор моделі використовується `hy3-preview` і підтримується стандартний виклик інструментів chat-completions, а також `reasoning_effort`.

<Tip>
Ідентифікатор моделі — `hy3-preview`. Не плутайте його з моделями Tencent `HY-3D-*`, які є API для 3D-генерації та не є chat-моделлю OpenClaw, налаштованою цим провайдером.
</Tip>

## Перевизначення endpoint

За замовчуванням OpenClaw використовує endpoint Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent також документує міжнародний endpoint TokenHub:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Перевизначайте endpoint лише тоді, коли цього вимагає ваш обліковий запис TokenHub або регіон.

## Примітки

- Посилання на моделі TokenHub використовують формат `tencent-tokenhub/<modelId>`.
- Вбудований каталог наразі містить `hy3-preview`.
- Plugin позначає Hy3 preview як модель із підтримкою міркування та підтримкою streaming-usage.
- Plugin постачається з метаданими багаторівневого ціноутворення для Hy3, тож оцінки вартості заповнюються без ручного перевизначення цін.
- Перевизначайте метадані ціни, контексту або endpoint у `models.providers` лише за потреби.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Сторінка продукту Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Генерація тексту Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Налаштування Tencent TokenHub Cline для Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Картка моделі Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
