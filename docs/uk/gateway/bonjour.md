---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, TXT-записів або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та поширені режими відмов)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-26T23:10:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: abaec96c53233e697155fd62a2fa6af972ab039cb480af8246f96359b5036e1f
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Багатоадресний перегляд `local.` — це **зручність лише для LAN**. Вбудований plugin `bonjour`
відповідає за рекламу в LAN і ввімкнений за замовчуванням. Для виявлення між мережами
той самий маяк також можна опублікувати через налаштований домен wide-area DNS-SD.
Виявлення все одно залишається best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і gateway перебувають у різних мережах, багатоадресний mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Кроки високого рівня:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте в Tailscale **split DNS**, щоб вибраний вами домен резолвився через цей
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

- слухав порт 53 лише на інтерфейсах Tailscale gateway
- обслуговував вибраний вами домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS tailnet, node на iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без багатоадресності.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу через LAN/tailnet
явно задайте прив’язку та залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS у рядку меню).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`. Реклама багатоадресності в LAN
забезпечується вбудованим plugin `bonjour`; публікація wide-area DNS-SD і надалі
належить Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — транспортний маяк gateway (використовується node на macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway рекламує невеликі несекретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<дружня назва>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли ввімкнено TLS)
- `gatewayTlsSha256=<sha256>` (лише коли ввімкнено TLS і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено хост canvas; наразі збігається з `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише в режимі mDNS full; необов’язкова підказка, коли доступний Tailnet)
- `sshPort=<port>` (лише в режимі mDNS full; wide-area DNS-SD може його не включати)
- `cliPath=<path>` (лише в режимі mDNS full; wide-area DNS-SD усе одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS є **неавтентифікованими**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнтам слід маршрутизувати через резолвлену кінцеву точку сервісу (SRV + A/AAAA). Сприймайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само має використовувати резолвлений хост сервісу, а не підказки лише з TXT.
- Закріплення TLS ніколи не повинно дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- Node на iOS/Android повинні розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка, побаченого вперше.

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

Якщо перегляд працює, але резолв — ні, зазвичай це означає проблему з політикою LAN або
резолвером mDNS.

## Налагодження в логах Gateway

Gateway записує циклічний лог-файл (виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Налагодження на node iOS

Node iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Лог містить переходи стану браузера та зміни набору результатів.

## Коли вимикати Bonjour

Вимикайте Bonjour лише тоді, коли реклама багатоадресності в LAN недоступна або шкідлива.
Поширений випадок — Gateway, який працює за Docker bridge networking, WSL або
мережевою політикою, що відкидає багатоадресний трафік mDNS. У таких середовищах Gateway
усе ще доступний через опублікований URL, SSH, Tailnet або wide-area DNS-SD,
але автоматичне виявлення в LAN ненадійне.

Віддавайте перевагу наявному перевизначенню через змінну середовища, коли проблема обмежена конкретним розгортанням:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає рекламу багатоадресності в LAN без зміни конфігурації plugin.
Це безпечно для Docker-образів, service-файлів, скриптів запуску та одноразового
налагодження, оскільки налаштування зникає разом зі змінною середовища.

Використовуйте конфігурацію plugin лише тоді, коли ви свідомо хочете вимкнути
вбудований plugin виявлення LAN для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особливості Docker

Вбудований plugin Bonjour автоматично вимикає рекламу багатоадресності в LAN у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не встановлено. Мережі Docker bridge
зазвичай не пересилають багатоадресний трафік mDNS (`224.0.0.251:5353`) між контейнером
та LAN, тому реклама з контейнера рідко робить виявлення працездатним.

Важливі особливості:

- Вимкнення Bonjour не зупиняє Gateway. Воно лише зупиняє рекламу багатоадресності в LAN.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker і далі за замовчуванням використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area виявлення
  або Tailnet, коли Gateway і node не перебувають в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автоматичного вимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де відомо, що багатоадресний mDNS проходить; установлюйте `1`, щоб примусово вимкнути.

## Усунення проблем із вимкненим Bonjour

Якщо node більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, у якому режимі працює Gateway: автоматичному, примусово ввімкненому чи примусово вимкненому:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Підтвердьте, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте пряму ціль, коли Bonjour вимкнено:
   - UI керування або локальні інструменти: `http://127.0.0.1:18789`
   - Клієнти LAN: `http://<gateway-host>:18789`
   - Клієнти з інших мереж: Tailnet MagicDNS, Tailnet IP, SSH-тунель або
     wide-area DNS-SD

4. Якщо ви свідомо ввімкнули Bonjour у Docker за допомогою
   `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте багатоадресність із хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або логи Gateway показують повторні скасування watchdog
   ciao, поверніть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий маршрут або
   маршрут через Tailnet.

## Поширені режими відмов

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Багатоадресність заблокована**: деякі мережі Wi‑Fi вимикають mDNS.
- **Рекламодавець застряг у probing/announcing**: хости із заблокованою багатоадресністю,
  container bridge, WSL або зміна інтерфейсів можуть залишити рекламодавець ciao у
  стані без анонсу. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість безкінечного перезапуску рекламодавця.
- **Docker bridge networking**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  mDNS-сумісної мережі.
- **Сон / зміна інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але резолв — ні**: використовуйте прості назви машин (уникайте емодзі або
  пунктуації), потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні назви можуть плутати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісу як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI повинні декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає рекламу багатоадресності в LAN, вимикаючи вбудований plugin.
- `openclaw plugins enable bonjour` відновлює типовий plugin виявлення LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає рекламу багатоадресності в LAN без зміни конфігурації plugin; допустимі truthy-значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає рекламу багатоадресності в LAN, зокрема всередині виявлених контейнерів; допустимі falsy-значення: `0`, `false`, `no` і `off`.
- Коли `OPENCLAW_DISABLE_BONJOUR` не встановлено, Bonjour рекламується на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено режим mDNS full (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Discovery](/uk/gateway/discovery)
- Сполучення node + підтвердження: [Gateway pairing](/uk/gateway/pairing)
