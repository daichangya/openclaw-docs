---
read_when:
    - Редагування контрактів IPC або IPC застосунку меню-бару
summary: Архітектура IPC macOS для застосунку OpenClaw, транспорту вузла gateway і PeekabooBridge
title: IPC macOS
x-i18n:
    generated_at: "2026-04-05T18:11:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0211c334a4a59b71afb29dd7b024778172e529fa618985632d3d11d795ced92
    source_path: platforms/mac/xpc.md
    workflow: 15
---

# Архітектура IPC OpenClaw для macOS

**Поточна модель:** локальний Unix-сокет з’єднує **службу хоста вузла** із **застосунком macOS** для погодження виконання + `system.run`. Для перевірок виявлення/підключення існує налагоджувальний CLI `openclaw-mac`; дії агентів, як і раніше, проходять через Gateway WebSocket і `node.invoke`. Автоматизація UI використовує PeekabooBridge.

## Цілі

- Єдиний екземпляр GUI-застосунку, який виконує всю роботу, пов’язану з TCC (сповіщення, запис екрана, мікрофон, мовлення, AppleScript).
- Невелика поверхня для автоматизації: Gateway + команди вузла, а також PeekabooBridge для автоматизації UI.
- Передбачувані дозволи: завжди той самий підписаний bundle ID, запуск через launchd, щоб дозволи TCC зберігалися.

## Як це працює

### Gateway + транспорт вузла

- Застосунок запускає Gateway (локальний режим) і підключається до нього як вузол.
- Дії агента виконуються через `node.invoke` (наприклад, `system.run`, `system.notify`, `canvas.*`).

### Служба вузла + IPC застосунку

- Безголова служба хоста вузла підключається до Gateway WebSocket.
- Запити `system.run` пересилаються до застосунку macOS через локальний Unix-сокет.
- Застосунок виконує команду в контексті UI, за потреби показує запит і повертає вивід.

Діаграма (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (автоматизація UI)

- Автоматизація UI використовує окремий UNIX-сокет із назвою `bridge.sock` і JSON-протокол PeekabooBridge.
- Порядок пріоритету хостів (на боці клієнта): Peekaboo.app → Claude.app → OpenClaw.app → локальне виконання.
- Безпека: для bridge-хостів потрібен дозволений TeamID; DEBUG-only запасний варіант для того самого UID захищено `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (угода Peekaboo).
- Див.: [використання PeekabooBridge](/platforms/mac/peekaboo) для подробиць.

## Операційні потоки

- Перезапуск/перебудова: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Завершує наявні екземпляри
  - Виконує Swift build + package
  - Записує/ініціалізує/запускає LaunchAgent
- Єдиний екземпляр: застосунок завершує роботу на ранньому етапі, якщо вже запущено інший екземпляр із тим самим bundle ID.

## Примітки щодо посилення захисту

- Бажано вимагати збіг TeamID для всіх привілейованих поверхонь.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (лише DEBUG) може дозволяти виклики від процесів із тим самим UID для локальної розробки.
- Уся взаємодія залишається лише локальною; жодні мережеві сокети не відкриваються.
- Запити TCC надходять лише від GUI-пакета застосунку; зберігайте стабільний підписаний bundle ID між перебудовами.
- Посилення захисту IPC: режим сокета `0600`, токен, перевірки peer-UID, challenge/response через HMAC, короткий TTL.
