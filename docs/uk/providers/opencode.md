---
read_when:
    - Ви хочете отримати доступ до моделей, що розміщуються в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використання каталогів OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T18:14:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode надає два розміщені каталоги в OpenClaw:

- `opencode/...` для каталогу **Zen**
- `opencode-go/...` для каталогу **Go**

Обидва каталоги використовують той самий API-ключ OpenCode. OpenClaw зберігає ідентифікатори провайдерів runtime
розділеними, щоб маршрутизація окремих моделей на рівні джерела залишалася коректною, але onboarding і документація розглядають їх
як єдине налаштування OpenCode.

## Налаштування CLI

### Каталог Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Каталог Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Фрагмент конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Каталоги

### Zen

- Провайдер runtime: `opencode`
- Приклади моделей: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Найкраще підходить, коли вам потрібен курований багатомодельний проксі OpenCode

### Go

- Провайдер runtime: `opencode-go`
- Приклади моделей: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Найкраще підходить, коли вам потрібна лінійка Kimi/GLM/MiniMax, розміщена в OpenCode

## Примітки

- `OPENCODE_ZEN_API_KEY` також підтримується.
- Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох провайдерів runtime.
- Ви входите в OpenCode, додаєте платіжні дані та копіюєте свій API-ключ.
- Оплата й доступність каталогів керуються з панелі OpenCode.
- Посилання OpenCode на базі Gemini залишаються на шляху proxy-Gemini, тому OpenClaw зберігає
  там санітизацію thought-signature Gemini без увімкнення нативної перевірки replay Gemini
  або переписування bootstrap.
- Посилання OpenCode, не пов’язані з Gemini, зберігають мінімальну політику replay, сумісну з OpenAI.
