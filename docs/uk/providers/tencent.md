---
read_when:
    - Ви хочете використовувати моделі Tencent Hy з OpenClaw
    - Вам потрібне налаштування API key TokenHub
summary: Налаштування Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T06:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud постачається як **вбудований plugin провайдера** в OpenClaw. Він надає доступ до моделей Tencent Hy через endpoint TokenHub (`tencent-tokenhub`).

Провайдер використовує сумісний з OpenAI API.

## Швидкий старт

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Провайдери та endpoint

| Провайдер         | Endpoint                      | Випадок використання     |
| ----------------- | ----------------------------- | ------------------------ |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy через Tencent TokenHub |

## Доступні моделі

### tencent-tokenhub

- **hy3-preview** — попередня версія Hy3 (контекст 256K, reasoning, стандартна)

## Примітки

- Посилання на моделі TokenHub використовують `tencent-tokenhub/<modelId>`.
- Plugin постачається з вбудованими метаданими багаторівневого ціноутворення Hy3, тому оцінки вартості заповнюються без ручного перевизначення цін.
- За потреби перевизначайте ціни й метадані контексту в `models.providers`.

## Примітка щодо середовища

Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOKENHUB_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).

## Пов’язана документація

- [Конфігурація OpenClaw](/uk/gateway/configuration)
- [Провайдери моделей](/uk/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
