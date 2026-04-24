---
read_when:
    - Додавання або зміна інтеграцій із зовнішніми CLI
    - Налагодження RPC-адаптерів (`signal-cli`, `imsg`)
summary: RPC-адаптери для зовнішніх CLI (`signal-cli`, застарілий `imsg`) і шаблони Gateway
title: RPC-адаптери
x-i18n:
    generated_at: "2026-04-24T03:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: e35a08831db5317071aea6fc39dbf2407a7254710b2d1b751a9cc8dc4cc0d307
    source_path: reference/rpc.md
    workflow: 15
---

OpenClaw інтегрує зовнішні CLI через JSON-RPC. Наразі використовуються два шаблони.

## Шаблон A: HTTP-демон (`signal-cli`)

- `signal-cli` працює як демон із JSON-RPC через HTTP.
- Потік подій — SSE (`/api/v1/events`).
- Перевірка стану: `/api/v1/check`.
- OpenClaw керує життєвим циклом, коли `channels.signal.autoStart=true`.

Див. [Signal](/uk/channels/signal) для налаштування та ендпоїнтів.

## Шаблон B: дочірній процес stdio (застарілий: `imsg`)

> **Примітка:** Для нових налаштувань iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles).

- OpenClaw запускає `imsg rpc` як дочірній процес (застаріла інтеграція iMessage).
- JSON-RPC передається построково через stdin/stdout (один JSON-об’єкт на рядок).
- TCP-порт і демон не потрібні.

Основні використовувані методи:

- `watch.subscribe` → сповіщення (`method: "message"`)
- `watch.unsubscribe`
- `send`
- `chats.list` (перевірка/діагностика)

Див. [iMessage](/uk/channels/imessage) для застарілого налаштування та адресації (перевага надається `chat_id`).

## Рекомендації для адаптерів

- Gateway керує процесом (запуск/зупинка прив’язані до життєвого циклу провайдера).
- RPC-клієнти мають бути стійкими: таймаути, перезапуск після завершення процесу.
- Віддавайте перевагу стабільним ID (наприклад, `chat_id`) замість рядків відображення.

## Пов’язане

- [Протокол Gateway](/uk/gateway/protocol)
