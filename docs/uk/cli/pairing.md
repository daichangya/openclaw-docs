---
read_when:
    - Ви використовуєте приватні повідомлення в режимі сполучення й вам потрібно підтверджувати відправників
summary: Довідник CLI для `openclaw pairing` (підтвердження/перегляд запитів на сполучення)
title: Сполучення
x-i18n:
    generated_at: "2026-04-24T03:15:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Підтверджуйте або переглядайте запити на сполучення в приватних повідомленнях (для каналів, які підтримують сполучення).

Пов’язано:

- Потік сполучення: [Сполучення](/uk/channels/pairing)

## Команди

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Показати список очікуваних запитів на сполучення для одного каналу.

Параметри:

- `[channel]`: позиційний id каналу
- `--channel <channel>`: явний id каналу
- `--account <accountId>`: id облікового запису для каналів із кількома обліковими записами
- `--json`: машиночитний вивід

Примітки:

- Якщо налаштовано кілька каналів, що підтримують сполучення, потрібно вказати канал або позиційно, або через `--channel`.
- Канали розширень дозволені, якщо id каналу є дійсним.

## `pairing approve`

Підтвердити очікуваний код сполучення й дозволити цього відправника.

Використання:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, якщо налаштовано рівно один канал, що підтримує сполучення

Параметри:

- `--channel <channel>`: явний id каналу
- `--account <accountId>`: id облікового запису для каналів із кількома обліковими записами
- `--notify`: надіслати підтвердження у відповідь запитувачу в тому самому каналі

## Примітки

- Вхідне значення каналу: передавайте його позиційно (`pairing list telegram`) або через `--channel <channel>`.
- `pairing list` підтримує `--account <accountId>` для каналів із кількома обліковими записами.
- `pairing approve` підтримує `--account <accountId>` і `--notify`.
- Якщо налаштовано лише один канал, що підтримує сполучення, дозволено `pairing approve <code>`.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Сполучення каналу](/uk/channels/pairing)
