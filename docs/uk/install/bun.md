---
read_when:
    - Вам потрібен найшвидший локальний цикл розробки (bun + watch)
    - Ви зіткнулися з проблемами Bun під час встановлення/patch/lifecycle scripts
summary: 'Робочий процес Bun (експериментально): встановлення та підводні камені порівняно з pnpm'
title: Bun (експериментально)
x-i18n:
    generated_at: "2026-04-05T18:06:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (експериментально)

<Warning>
Bun **не рекомендовано для runtime gateway** (відомі проблеми з WhatsApp і Telegram). Для production використовуйте Node.
</Warning>

Bun — це необов’язкове локальне runtime-середовище для безпосереднього запуску TypeScript (`bun run ...`, `bun --watch ...`). Типовим менеджером пакетів і далі залишається `pnpm`, який повністю підтримується й використовується інструментами документації. Bun не може використовувати `pnpm-lock.yaml` і буде його ігнорувати.

## Встановлення

<Steps>
  <Step title="Установіть залежності">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` додано до gitignore, тому це не створює зайвих змін у репозиторії. Щоб повністю пропустити запис lockfile:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Збірка та тестування">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Lifecycle Scripts

Bun блокує dependency lifecycle scripts, якщо їм явно не довірено. Для цього репозиторію зазвичай заблоковані scripts не є потрібними:

- `@whiskeysockets/baileys` `preinstall` -- перевіряє, що основна версія Node >= 20 (OpenClaw типово використовує Node 24 і далі підтримує Node 22 LTS, наразі `22.14+`)
- `protobufjs` `postinstall` -- виводить попередження про несумісні схеми версій (без артефактів збірки)

Якщо ви зіткнулися з runtime-проблемою, яка потребує цих scripts, явно позначте їх як довірені:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Застереження

Деякі scripts усе ще жорстко прив’язані до pnpm (наприклад, `docs:build`, `ui:*`, `protocol:check`). Поки що запускайте їх через pnpm.
