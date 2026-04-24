---
read_when:
    - Ви хочете відкрити Control UI з вашим поточним токеном
    - Ви хочете вивести URL без запуску браузера
summary: Довідка CLI для `openclaw dashboard` (відкрити Control UI)
title: Панель керування
x-i18n:
    generated_at: "2026-04-24T04:12:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Відкрийте Control UI, використовуючи вашу поточну автентифікацію.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Примітки:

- `dashboard` визначає налаштовані SecretRef для `gateway.auth.token`, коли це можливо.
- Для токенів під керуванням SecretRef (визначених або невизначених) `dashboard` виводить/копіює/відкриває URL без токена, щоб уникнути розкриття зовнішніх секретів у виводі термінала, історії буфера обміну або аргументах запуску браузера.
- Якщо `gateway.auth.token` керується через SecretRef, але не може бути визначений у цьому шляху команди, команда виводить URL без токена та явні вказівки щодо усунення проблеми замість вбудовування недійсного заповнювача токена.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Панель керування](/uk/web/dashboard)
