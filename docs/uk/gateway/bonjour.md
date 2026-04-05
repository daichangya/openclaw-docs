---
read_when:
    - Налагодження проблем із виявленням Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, TXT-записів або UX виявлення
summary: Виявлення Bonjour/mDNS + налагодження (beacon Gateway, клієнти та поширені режими збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-05T18:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f5a7f3211c74d4d10fdc570fc102b3c949c0ded9409c54995ab8820e5787f02
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (endpoint WebSocket).
Багатоадресний перегляд `local.` — це **зручність лише для LAN**. Для виявлення між мережами
той самий beacon також може публікуватися через налаштований wide-area домен DNS-SD. Виявлення
усе ще працює за принципом best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо вузол і шлюз перебувають у різних мережах, багатоадресний mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Кроки на високому рівні:

1. Запустіть DNS-сервер на хості шлюзу (доступний через Tailnet).
2. Опублікуйте DNS‑SD-записи для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale так, щоб вибраний домен визначався через цей
   DNS-сервер для клієнтів (включно з iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Вузли iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Одноразове налаштування DNS-сервера (хост шлюзу)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на інтерфейсах Tailscale шлюзу
- обслуговував вибраний домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірка з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP шлюзу (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS tailnet, вузли iOS і виявлення через CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без багатоадресності.

### Безпека прослуховувача Gateway (рекомендовано)

Порт WS шлюзу (типово `18789`) типово прив’язується до loopback. Для доступу через LAN/tailnet
явно задайте bind і залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS у рядку меню).

## Що оголошується

Лише Gateway оголошує `_openclaw-gw._tcp`.

## Типи сервісів

- `_openclaw-gw._tcp` — beacon транспорту шлюзу (використовується вузлами macOS/iOS/Android).

## TXT-ключі (не секретні підказки)

Gateway оголошує невеликі несекретні підказки, щоб зробити потоки UI зручнішими:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено хост canvas; наразі це той самий `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (необов’язкова підказка, коли доступний Tailnet)
- `sshPort=<port>` (лише в повному режимі mDNS; wide-area DNS-SD може його не містити)
- `cliPath=<path>` (лише в повному режимі mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки з безпеки:

- TXT-записи Bonjour/mDNS **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетною маршрутизацією.
- Клієнти мають маршрутизувати за допомогою визначеного endpoint сервісу (SRV + A/AAAA). Розглядайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само має використовувати визначений хост сервісу, а не лише TXT-підказки.
- TLS pinning ніколи не повинен дозволяти оголошеному `gatewayTlsSha256` перевизначати раніше збережений pin.
- Вузли iOS/Android мають розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка, побаченого вперше.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Перегляд екземплярів:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Визначення одного екземпляра (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, але визначення не працює, зазвичай ви натрапили на політику LAN або
проблему з mDNS-резолвером.

## Налагодження в журналах Gateway

Gateway записує журнал із циклічним перезаписом (його шлях виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Налагодження на вузлі iOS

Вузол iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Журнал містить переходи станів браузера та зміни набору результатів.

## Поширені режими збоїв

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Багатоадресність заблоковано**: деякі Wi‑Fi-мережі вимикають mDNS.
- **Сон / зміна інтерфейсів**: macOS може тимчасово втрачати результати mDNS; спробуйте знову.
- **Перегляд працює, але визначення — ні**: робіть імена машин простими (уникайте emoji або
  пунктуації), а потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть плутати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісів як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI має декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `OPENCLAW_DISABLE_BONJOUR=1` вимикає оголошення (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом bind Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли оголошується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає оголошений шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/gateway/discovery)
- Pairing вузлів + схвалення: [Pairing шлюзу](/gateway/pairing)
