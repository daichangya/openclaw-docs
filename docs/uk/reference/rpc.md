---
read_when:
    - Додавання або зміна інтеграцій із зовнішніми CLI
    - Налагодження RPC-адаптерів (`signal-cli`, `imsg`)
summary: RPC-адаптери для зовнішніх CLI (`signal-cli`, застарілий `imsg`) і шаблони gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-04-05T18:15:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06dc6b97184cc704ba4ec4a9af90502f4316bcf717c3f4925676806d8b184c57
    source_path: reference/rpc.md
    workflow: 15
---

# RPC-адаптери

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Наразі використовуються два шаблони.

## Шаблон A: HTTP-daemon (`signal-cli`)

- `signal-cli` працює як daemon із JSON-RPC через HTTP.
- Потік подій — SSE (`/api/v1/events`).
- Перевірка стану: `/api/v1/check`.
- OpenClaw керує життєвим циклом, коли `channels.signal.autoStart=true`.

Див. [Signal](/uk/channels/signal) для налаштування та endpoint-ів.

## Шаблон B: дочірній процес stdio (застарілий: `imsg`)

> **Примітка:** Для нових налаштувань iMessage натомість використовуйте [BlueBubbles](/uk/channels/bluebubbles).

- OpenClaw запускає `imsg rpc` як дочірній процес (застаріла інтеграція iMessage).
- JSON-RPC передається рядками через stdin/stdout (один JSON-об’єкт на рядок).
- TCP-порт відсутній, daemon не потрібен.

Основні використовувані методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (probe/діагностика)

Див. [iMessage](/uk/channels/imessage) для застарілого налаштування та адресації (переважно `chat_id`).

## Рекомендації для адаптерів

- Gateway керує процесом (запуск/зупинка прив’язані до життєвого циклу provider).
- RPC-клієнти мають бути стійкими: timeout, перезапуск після завершення процесу.
- Віддавайте перевагу стабільним ID (наприклад, `chat_id`) замість рядків відображення.
