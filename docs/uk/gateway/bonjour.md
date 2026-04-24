---
read_when:
    - Налагодження проблем із виявленням Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, записів TXT або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та типові режими збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-24T06:33:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62961714a0c9880be457c254e1cfc1701020ea51b89f2582757cddc8b3dd2113
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Браузинг multicast `local.` — це **лише зручність у межах LAN**. Вбудований Plugin `bonjour`
відповідає за рекламу в LAN і ввімкнений за замовчуванням. Для виявлення між різними мережами
той самий маяк також може бути опублікований через налаштований домен wide-area DNS-SD.
Виявлення все одно залишається best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і gateway перебувають у різних мережах, multicast mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Кроки на високому рівні:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у межах виділеної зони
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale, щоб вибраний вами домен резолвився через цей
   DNS-сервер для клієнтів (зокрема iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node на iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // лише tailnet (рекомендовано)
  discovery: { wideArea: { enabled: true } }, // вмикає публікацію wide-area DNS-SD
}
```

### Одноразове налаштування DNS-сервера (хост gateway)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на Tailscale-інтерфейсах gateway
- обслуговував вибраний вами домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністрування Tailscale:

- Додайте nameserver, що вказує на tailnet IP gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS tailnet, node на iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу з LAN/tailnet
явно задайте bind і залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Встановіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок menubar на macOS).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`. Рекламу через multicast у LAN
забезпечує вбудований Plugin `bonjour`; публікація wide-area DNS-SD і надалі
належить Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — транспортний маяк gateway (використовується node на macOS/iOS/Android).

## Ключі TXT (не секретні підказки)

Gateway рекламує невеликі не секретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<дружня назва>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і відбиток доступний)
- `canvasPort=<port>` (лише коли хост canvas увімкнено; наразі той самий, що й `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише в режимі mDNS full; необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише в режимі mDNS full; wide-area DNS-SD може його не містити)
- `cliPath=<path>` (лише в режимі mDNS full; wide-area DNS-SD усе одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- Записи Bonjour/mDNS TXT **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнтам слід маршрутизувати, використовуючи резолвлену кінцеву точку сервісу (SRV + A/AAAA). Сприймайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне визначення цілі для SSH так само має використовувати резолвлений хост сервісу, а не лише підказки з TXT.
- TLS pinning ніколи не повинен дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- Node на iOS/Android повинні розглядати прямі підключення, засновані на виявленні, як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка при першому підключенні.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Перегляд екземплярів:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Резолв одного екземпляра (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, а резолв — ні, зазвичай це означає проблему політики LAN або
резолвера mDNS.

## Налагодження в логах Gateway

Gateway записує ротаційний лог-файл (виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Налагодження на iOS node

Node на iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Лог містить переходи стану браузера та зміни набору результатів.

## Типові режими збоїв

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi‑Fi-мережі вимикають mDNS.
- **Сон / зміна інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але резолв — ні**: використовуйте прості назви машин (уникайте emoji або
  розділових знаків), потім перезапустіть Gateway. Назва екземпляра сервісу походить від
  імені хоста, тому надто складні назви можуть збивати з пантелику деякі резолвери.

## Екрановані назви екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в назвах екземплярів сервісів як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає рекламу multicast у LAN шляхом вимкнення вбудованого plugin.
- `openclaw plugins enable bonjour` відновлює типовий plugin для виявлення в LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає рекламу multicast у LAN без зміни конфігурації plugin; приймаються такі truthy-значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом bind для Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено режим mDNS full (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Discovery](/uk/gateway/discovery)
- Спарювання Node + схвалення: [Gateway pairing](/uk/gateway/pairing)
