---
read_when:
    - Ви хочете найшвидший локальний цикл розробки (bun + watch)
    - У вас виникли проблеми Bun із встановленням, патчами або скриптами життєвого циклу
summary: 'Робочий процес Bun (експериментальний): встановлення й підводні камені порівняно з pnpm'
title: Bun (експериментально)
x-i18n:
    generated_at: "2026-04-24T03:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun **не рекомендується для runtime Gateway** (відомі проблеми з WhatsApp і Telegram). Для production використовуйте Node.
</Warning>

Bun — це необов’язкове локальне runtime-середовище для безпосереднього запуску TypeScript (`bun run ...`, `bun --watch ...`). Типовим менеджером пакетів залишається `pnpm`, який повністю підтримується й використовується інструментами документації. Bun не може використовувати `pnpm-lock.yaml` і буде його ігнорувати.

## Встановлення

<Steps>
  <Step title="Встановити залежності">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` додано до gitignore, тому репозиторій не засмічується змінами. Щоб повністю пропустити запис lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Зібрати й протестувати">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Скрипти життєвого циклу

Bun блокує скрипти життєвого циклу залежностей, якщо їм явно не надано довіру. Для цього репозиторію найпоширеніші заблоковані скрипти не є обов’язковими:

- `@whiskeysockets/baileys` `preinstall` — перевіряє, що основна версія Node >= 20 (типово OpenClaw використовує Node 24 і досі підтримує Node 22 LTS, наразі `22.14+`)
- `protobufjs` `postinstall` — виводить попередження про несумісні схеми версій (без артефактів збірки)

Якщо ви зіткнулися з проблемою runtime, яка потребує цих скриптів, явно довірте їм:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Застереження

Деякі скрипти все ще жорстко прив’язані до pnpm (наприклад, `docs:build`, `ui:*`, `protocol:check`). Поки що запускайте їх через pnpm.

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Node.js](/uk/install/node)
- [Оновлення](/uk/install/updating)
