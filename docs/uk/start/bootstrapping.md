---
read_when:
    - Розуміння того, що відбувається під час першого запуску агента
    - Пояснення, де зберігаються файли bootstrap
    - Налагодження налаштування ідентичності під час онбордингу
sidebarTitle: Bootstrapping
summary: Ритуал bootstrap агента, який ініціалізує workspace і файли ідентичності
title: Bootstrap агента
x-i18n:
    generated_at: "2026-04-05T18:17:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a08b5102f25c6c4bcdbbdd44384252a9e537b245a7b070c4961a72b4c6c6601
    source_path: start/bootstrapping.md
    workflow: 15
---

# Bootstrap агента

Bootstrap — це ритуал **першого запуску**, який готує workspace агента та
збирає дані ідентичності. Він відбувається після онбордингу, коли агент
запускається вперше.

## Що робить bootstrap

Під час першого запуску агента OpenClaw виконує bootstrap workspace (типово
`~/.openclaw/workspace`):

- Ініціалізує `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`.
- Запускає короткий ритуал запитань і відповідей (по одному запитанню за раз).
- Записує ідентичність + налаштування в `IDENTITY.md`, `USER.md`, `SOUL.md`.
- Видаляє `BOOTSTRAP.md` після завершення, щоб він запускався лише один раз.

## Де це виконується

Bootstrap завжди виконується на **хості gateway**. Якщо застосунок macOS підключається до
віддаленого Gateway, workspace і файли bootstrap зберігаються на цій віддаленій
машині.

<Note>
Коли Gateway працює на іншій машині, редагуйте файли workspace на хості gateway
(наприклад, `user@gateway-host:~/.openclaw/workspace`).
</Note>

## Пов’язані документи

- Онбординг у застосунку macOS: [Onboarding](/start/onboarding)
- Структура workspace: [Agent workspace](/uk/concepts/agent-workspace)
