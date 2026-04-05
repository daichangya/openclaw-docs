---
read_when:
    - Ви хочете, щоб OpenClaw отримував особисті повідомлення через Nostr
    - Ви налаштовуєте децентралізований обмін повідомленнями
summary: Канал особистих повідомлень Nostr через зашифровані повідомлення NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-05T17:58:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Статус:** необов’язковий вбудований plugin (типово вимкнений, доки не буде налаштований).

Nostr — це децентралізований протокол для соціальних мереж. Цей канал дає OpenClaw змогу отримувати та надсилати відповіді на зашифровані особисті повідомлення (DM) через NIP-04.

## Вбудований plugin

Поточні випуски OpenClaw постачаються з Nostr як вбудованим plugin, тому звичайні пакетні збірки не потребують окремого встановлення.

### Старіші/кастомні встановлення

- Onboarding (`openclaw onboard`) і `openclaw channels add` як і раніше показують
  Nostr зі спільного каталогу каналів.
- Якщо у вашій збірці немає вбудованого Nostr, встановіть його вручну.

```bash
openclaw plugins install @openclaw/nostr
```

Використання локального checkout (dev-процеси):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Перезапустіть Gateway після встановлення або ввімкнення plugins.

### Неінтерактивне налаштування

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Використовуйте `--use-env`, щоб зберегти `NOSTR_PRIVATE_KEY` у змінних середовища замість збереження ключа в конфігурації.

## Швидке налаштування

1. Згенеруйте пару ключів Nostr (якщо потрібно):

```bash
# Using nak
nak key generate
```

2. Додайте до конфігурації:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Експортуйте ключ:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Перезапустіть Gateway.

## Довідка з конфігурації

| Ключ         | Тип      | Типово                                      | Опис                                  |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | обов’язково                                 | Приватний ключ у форматі `nsec` або hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)                 |
| `dmPolicy`   | string   | `pairing`                                   | Політика доступу до DM                |
| `allowFrom`  | string[] | `[]`                                        | Дозволені pubkey відправників         |
| `enabled`    | boolean  | `true`                                      | Увімкнення/вимкнення каналу           |
| `name`       | string   | -                                           | Відображувана назва                   |
| `profile`    | object   | -                                           | Метадані профілю NIP-01               |

## Метадані профілю

Дані профілю публікуються як подія NIP-01 `kind:0`. Ними можна керувати з Control UI (Channels -> Nostr -> Profile) або задати їх безпосередньо в конфігурації.

Приклад:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Примітки:

- URL профілю мають використовувати `https://`.
- Імпорт із relay об’єднує поля та зберігає локальні перевизначення.

## Керування доступом

### Політики DM

- **pairing** (типово): невідомі відправники отримують код pairing.
- **allowlist**: надсилати DM можуть лише pubkey з `allowFrom`.
- **open**: публічні вхідні DM (потрібно `allowFrom: ["*"]`).
- **disabled**: ігнорувати вхідні DM.

Примітки щодо застосування:

- Підписи вхідних подій перевіряються до політики відправника та дешифрування NIP-04, тому підроблені події відхиляються на ранньому етапі.
- Відповіді для pairing надсилаються без обробки початкового тіла DM.
- Для вхідних DM застосовується rate limiting, а надто великі payload відкидаються до дешифрування.

### Приклад allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Формати ключів

Підтримувані формати:

- **Приватний ключ:** `nsec...` або 64-символьний hex
- **Pubkey (`allowFrom`):** `npub...` або hex

## Relay

Типові значення: `relay.damus.io` і `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Поради:

- Для резервування використовуйте 2–3 relay.
- Уникайте занадто великої кількості relay (затримка, дублювання).
- Платні relay можуть покращити надійність.
- Локальні relay добре підходять для тестування (`ws://localhost:7777`).

## Підтримка протоколу

| NIP    | Статус       | Опис                                  |
| ------ | ------------ | ------------------------------------- |
| NIP-01 | Підтримується | Базовий формат подій + метадані профілю |
| NIP-04 | Підтримується | Зашифровані DM (`kind:4`)             |
| NIP-17 | Заплановано  | DM в gift-wrap                        |
| NIP-44 | Заплановано  | Версійне шифрування                   |

## Тестування

### Локальний relay

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Ручне тестування

1. Подивіться pubkey бота (npub) у логах.
2. Відкрийте клієнт Nostr (Damus, Amethyst тощо).
3. Надішліть DM pubkey бота.
4. Перевірте відповідь.

## Усунення несправностей

### Повідомлення не надходять

- Переконайтеся, що приватний ключ дійсний.
- Переконайтеся, що URL relay доступні та використовують `wss://` (або `ws://` для локального середовища).
- Переконайтеся, що `enabled` не має значення `false`.
- Перевірте логи Gateway на наявність помилок підключення до relay.

### Відповіді не надсилаються

- Перевірте, чи relay приймає запис.
- Переконайтеся у наявності вихідного мережевого з’єднання.
- Слідкуйте за обмеженнями частоти від relay.

### Дубльовані відповіді

- Це очікувано при використанні кількох relay.
- Повідомлення дедуплікуються за ID події; відповідь викликає лише перша доставка.

## Безпека

- Ніколи не комітьте приватні ключі.
- Використовуйте змінні середовища для ключів.
- Для продакшн-ботів варто розглянути `allowlist`.
- Підписи перевіряються до політики відправника, а політика відправника застосовується до дешифрування, тому підроблені події відхиляються рано, а невідомі відправники не можуть змусити систему виконувати повну криптографічну обробку.

## Обмеження (MVP)

- Лише особисті повідомлення (без групових чатів).
- Без медіавкладень.
- Лише NIP-04 (gift-wrap NIP-17 заплановано).

## Пов’язане

- [Огляд каналів](/channels) — усі підтримувані канали
- [Pairing](/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/channels/groups) — поведінка групових чатів і gating згадувань
- [Маршрутизація каналів](/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/gateway/security) — модель доступу та посилення захисту
