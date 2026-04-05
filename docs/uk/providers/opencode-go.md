---
read_when:
    - Ви хочете каталог OpenCode Go
    - Вам потрібні посилання на runtime-моделі для моделей, розміщених у Go
summary: Використовуйте каталог OpenCode Go зі спільним налаштуванням OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T18:14:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go — це каталог Go у [OpenCode](/providers/opencode).
Він використовує той самий `OPENCODE_API_KEY`, що й каталог Zen, але зберігає
id runtime-провайдера `opencode-go`, щоб маршрутизація за окремими моделями у верхньому рівні залишалася коректною.

## Підтримувані моделі

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Налаштування CLI

```bash
openclaw onboard --auth-choice opencode-go
# or non-interactive
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Фрагмент конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Поведінка маршрутизації

OpenClaw автоматично обробляє маршрутизацію за окремими моделями, коли посилання на модель використовує `opencode-go/...`.

## Примітки

- Використовуйте [OpenCode](/providers/opencode) для спільного онбордингу та огляду каталогу.
- Посилання runtime залишаються явними: `opencode/...` для Zen, `opencode-go/...` для Go.
