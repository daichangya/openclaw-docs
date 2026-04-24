---
read_when:
    - Розміщення PeekabooBridge у OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
summary: Інтеграція PeekabooBridge для автоматизації UI у macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-04-24T04:17:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3646f66551645733292fb183e0ff2c56697e7b24248ff7c32a0dc925431f6ba7
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації UI з урахуванням дозволів. Це дає змогу CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи дозволи TCC застосунку macOS.

## Що це таке (і чим не є)

- **Хост**: OpenClaw.app може виступати хостом PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (окремої поверхні `openclaw ui ...` немає).
- **UI**: візуальні накладки залишаються в Peekaboo.app; OpenClaw є тонким хостом-брокером.

## Увімкнення bridge

У застосунку macOS:

- Settings → **Enable Peekaboo Bridge**

Коли bridge увімкнено, OpenClaw запускає локальний сервер UNIX socket. Якщо його вимкнено, хост
зупиняється, а `peekaboo` повертається до інших доступних хостів.

## Порядок виявлення клієнта

Клієнти Peekaboo зазвичай пробують хости в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який
шлях socket використовується. Ви можете перевизначити його так:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека та дозволи

- Bridge перевіряє **підписи коду клієнта**; застосовується allowlist TeamID
  (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо бракує потрібних дозволів, bridge повертає чітке повідомлення про помилку,
  а не запускає System Settings.

## Поведінка snapshot (автоматизація)

Snapshot зберігаються в пам’яті й автоматично зникають через короткий час.
Якщо вам потрібне довше зберігання, повторно захопіть їх із клієнта.

## Усунення несправностей

- Якщо `peekaboo` повідомляє “bridge client is not authorized”, переконайтеся, що клієнт
  належно підписано, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  лише в режимі **debug**.
- Якщо жодного хоста не знайдено, відкрийте один із хост-застосунків (Peekaboo.app або OpenClaw.app)
  і підтвердьте, що дозволи надано.

## Пов’язане

- [Застосунок для macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
