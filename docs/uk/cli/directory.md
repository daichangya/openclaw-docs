---
read_when:
    - Ви хочете знайти контакти, групи або ідентифікатори self для каналу
    - Ви розробляєте адаптер каталогу каналу
summary: Довідник CLI для `openclaw directory` (self, peers, groups)
title: Каталог
x-i18n:
    generated_at: "2026-04-24T04:12:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Пошук у каталозі для каналів, які це підтримують (контакти/peers, групи та “me”).

## Загальні прапорці

- `--channel <name>`: id/псевдонім каналу (обов’язково, якщо налаштовано кілька каналів; автоматично, якщо налаштовано лише один)
- `--account <id>`: id облікового запису (типово: типовий для каналу)
- `--json`: вивід JSON

## Примітки

- `directory` призначено для того, щоб допомогти вам знайти ID, які можна вставити в інші команди (особливо `openclaw message send --target ...`).
- Для багатьох каналів результати беруться з конфігурації (allowlist / налаштовані групи), а не з живого каталогу провайдера.
- Типовий вивід — це `id` (а іноді й `name`), розділені табуляцією; для сценаріїв використовуйте `--json`.

## Використання результатів із `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Формати ID (за каналами)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (група)
- Telegram: `@username` або числовий id чату; групи — це числові id
- Slack: `user:U…` і `channel:C…`
- Discord: `user:<id>` і `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` або `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` і `conversation:<id>`
- Zalo (Plugin): id користувача (Bot API)
- Zalo Personal / `zalouser` (Plugin): id потоку (DM/група) з `zca` (`me`, `friend list`, `group list`)

## Self ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (контакти/користувачі)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Групи

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Пов’язане

- [Довідник CLI](/uk/cli)
