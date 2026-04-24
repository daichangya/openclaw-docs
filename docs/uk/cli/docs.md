---
read_when:
    - Ви хочете шукати в live-документації OpenClaw із термінала
summary: Довідник CLI для `openclaw docs` (пошук у live-індексі документації)
title: Документація
x-i18n:
    generated_at: "2026-04-24T04:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Пошук у live-індексі документації.

Аргументи:

- `[query...]`: пошукові терміни для надсилання до live-індексу документації

Приклади:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Примітки:

- Якщо запит не вказано, `openclaw docs` відкриває точку входу пошуку в live-документації.
- Багатослівні запити передаються як один пошуковий запит.

## Пов’язане

- [Довідник CLI](/uk/cli)
