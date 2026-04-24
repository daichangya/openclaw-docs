---
read_when:
    - Додавання або зміна інтеграцій із зовнішніми CLI
    - Налагодження RPC-адаптерів (`signal-cli`, `imsg`)
summary: RPC-адаптери для зовнішніх CLI (signal-cli, legacy imsg) і шаблони Gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-04-24T03:20:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c62e8a175b5b847d7367920bd71eb0c7f5b99e9310738606ef282138cd868446
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Сьогодні використовуються два шаблони.

## Шаблон A: HTTP daemon (`signal-cli`)

- `signal-cli` працює як daemon із JSON-RPC через HTTP.
- Потік подій — SSE (`/api/v1/events`).
- Перевірка стану: `/api/v1/check`.
- OpenClaw керує життєвим циклом, коли `channels.signal.autoStart=true`.

Налаштування та кінцеві точки див. у [Signal](/uk/channels/signal).

## Шаблон B: дочірній процес stdio (legacy: `imsg`)

> **Примітка:** Для нових налаштувань iMessage натомість використовуйте [BlueBubbles](/uk/channels/bluebubbles).

- OpenClaw запускає `imsg rpc` як дочірній процес (legacy-інтеграція iMessage).
- JSON-RPC передається stdin/stdout з розділенням на рядки (один об’єкт JSON на рядок).
- Ні TCP-порт, ні daemon не потрібні.

Основні використовувані методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (перевірка/діагностика)

Legacy-налаштування й адресацію iMessage (бажано `chat_id`) див. у [iMessage](/uk/channels/imessage).

## Рекомендації для адаптерів

- Gateway керує процесом (запуск/зупинка прив’язані до життєвого циклу провайдера).
- Підтримуйте стійкість RPC-клієнтів: тайм-аути, перезапуск після завершення.
- Надавайте перевагу стабільним ID (наприклад, `chat_id`) замість рядків відображення.

## Пов’язано

- [RPC-адаптери](/reference/rpc-adapters)
- [Протокол Gateway](/uk/gateway/protocol)
