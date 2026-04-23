---
read_when:
    - Розміщення PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
summary: Інтеграція PeekabooBridge для автоматизації UI на macOS
title: Міст Peekaboo
x-i18n:
    generated_at: "2026-04-23T23:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 638f7a0e8d85d0cfcade259a934108e9ec7a1ccc894c9db0d1bd3cf1de99441d
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

OpenClaw може розміщувати **PeekabooBridge** як локальний брокер автоматизації UI з урахуванням дозволів.
Це дає змогу CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи
дозволи TCC застосунку macOS.

## Що це таке (і чим не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (окремої поверхні `openclaw ui ...` немає).
- **UI**: візуальні накладки залишаються в Peekaboo.app; OpenClaw — це тонкий хост-брокер.

## Увімкнення моста

У застосунку macOS:

- Settings → **Enable Peekaboo Bridge**

Коли ввімкнено, OpenClaw запускає локальний сервер UNIX socket. Якщо вимкнено, хост
зупиняється, а `peekaboo` повертається до інших доступних хостів.

## Порядок виявлення клієнтом

Клієнти Peekaboo зазвичай намагаються знайти хости в такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який
шлях socket використовується. Ви можете перевизначити його так:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Міст перевіряє **підписи коду викликача**; застосовується allowlist TeamID
  (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо потрібні дозволи відсутні, міст повертає чітке повідомлення про помилку,
  а не запускає System Settings.

## Поведінка snapshot (автоматизація)

Snapshot зберігаються в пам’яті й автоматично зникають після короткого проміжку часу.
Якщо вам потрібне довше зберігання, повторно захопіть їх із клієнта.

## Усунення проблем

- Якщо `peekaboo` повідомляє “bridge client is not authorized”, переконайтеся, що клієнт
  належним чином підписаний, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  лише в режимі **debug**.
- Якщо хости не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app)
  і переконайтеся, що дозволи надано.
