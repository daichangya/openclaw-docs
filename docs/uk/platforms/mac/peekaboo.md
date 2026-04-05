---
read_when:
    - Розміщення PeekabooBridge в OpenClaw.app
    - Інтеграція Peekaboo через Swift Package Manager
    - Зміна протоколу/шляхів PeekabooBridge
summary: Інтеграція PeekabooBridge для автоматизації UI на macOS
title: Peekaboo Bridge
x-i18n:
    generated_at: "2026-04-05T18:10:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30961eb502eecd23c017b58b834bd8cb00cab8b17302617d541afdace3ad8dba
    source_path: platforms/mac/peekaboo.md
    workflow: 15
---

# Peekaboo Bridge (автоматизація UI на macOS)

OpenClaw може розміщувати **PeekabooBridge** як локальний, орієнтований на дозволи брокер автоматизації UI. Це дає змогу CLI `peekaboo` керувати автоматизацією UI, повторно використовуючи дозволи TCC застосунку macOS.

## Що це таке (і чим це не є)

- **Хост**: OpenClaw.app може діяти як хост PeekabooBridge.
- **Клієнт**: використовуйте CLI `peekaboo` (без окремої поверхні `openclaw ui ...`).
- **UI**: візуальні накладки залишаються в Peekaboo.app; OpenClaw — це тонкий брокер-хост.

## Увімкнення мосту

У застосунку macOS:

- Settings → **Enable Peekaboo Bridge**

Коли міст увімкнено, OpenClaw запускає локальний сервер UNIX-сокета. Якщо його вимкнено, хост зупиняється, і `peekaboo` переключиться на інші доступні хости.

## Порядок виявлення клієнтом

Клієнти Peekaboo зазвичай намагаються підключитися до хостів у такому порядку:

1. Peekaboo.app (повний UX)
2. Claude.app (якщо встановлено)
3. OpenClaw.app (тонкий брокер)

Використовуйте `peekaboo bridge status --verbose`, щоб побачити, який хост активний і який шлях сокета використовується. Ви можете перевизначити це так:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Безпека й дозволи

- Міст перевіряє **підписи коду викликача**; застосовується список дозволених TeamID (TeamID хоста Peekaboo + TeamID застосунку OpenClaw).
- Час очікування запитів спливає приблизно через 10 секунд.
- Якщо потрібних дозволів немає, міст повертає чітке повідомлення про помилку замість запуску System Settings.

## Поведінка знімків (автоматизація)

Знімки зберігаються в пам’яті й автоматично спливають після короткого проміжку часу. Якщо вам потрібне довше зберігання, повторно захопіть їх із клієнта.

## Усунення неполадок

- Якщо `peekaboo` повідомляє “bridge client is not authorized”, переконайтеся, що клієнт підписано належним чином, або запускайте хост із `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` лише в режимі **debug**.
- Якщо хости не знайдено, відкрийте один із застосунків-хостів (Peekaboo.app або OpenClaw.app) і підтвердьте, що дозволи надано.
