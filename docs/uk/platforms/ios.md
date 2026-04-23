---
read_when:
    - Pairing або повторне підключення Node iOS
    - Запуск застосунку iOS з вихідного коду
    - Налагодження виявлення gateway або команд canvas
summary: 'Застосунок Node для iOS: підключення до Gateway, pairing, canvas і усунення проблем'
title: Застосунок iOS
x-i18n:
    generated_at: "2026-04-23T23:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Доступність: внутрішній preview. Застосунок iOS поки що не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості Node: Canvas, знімок екрана, захоплення з камери, геолокація, режим Talk, пробудження голосом.
- Отримує команди `node.invoke` і повідомляє про події стану Node.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручне введення host/port (запасний варіант).

## Швидкий старт (pair + connect)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть знайдений gateway (або ввімкніть Manual Host і введіть host/port).

3. Підтвердьте запит pairing на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює pairing зі зміненими даними автентифікації (role/scopes/public key),
попередній запит у стані очікування замінюється, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого APNs
токена в gateway.

Вимога на боці Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Як працює цей потік:

- Застосунок iOS реєструється в relay за допомогою App Attest і app receipt.
- Relay повертає непрозорий relay handle разом із send grant, прив’язаним до області реєстрації.
- Застосунок iOS отримує ідентичність прив’язаного gateway і включає її в реєстрацію relay, щоб реєстрація через relay була делегована саме цьому gateway.
- Застосунок пересилає цю реєстрацію через relay прив’язаному gateway за допомогою `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і сигналів пробудження.
- Base URL relay у gateway має збігатися з URL relay, вбудованим в офіційну/TestFlight збірку iOS.
- Якщо згодом застосунок підключається до іншого gateway або до збірки з іншим base URL relay, він оновлює реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потрібно для цього шляху:

- Жоден relay token для всього розгортання.
- Жоден прямий APNs key для надсилань офіційних/TestFlight збірок через relay.

Очікуваний робочий процес оператора:

1. Установіть офіційну/TestFlight збірку iOS.
2. Установіть `gateway.push.apns.relay.baseUrl` у gateway.
3. Виконайте pairing застосунку з gateway і дайте йому завершити підключення.
4. Застосунок автоматично публікує `push.apns.register` після отримання APNs token, підключення сесії оператора й успішної реєстрації relay.
5. Після цього `push.test`, повторні пробудження під час перепідключення і сигнали пробудження можуть використовувати збережену реєстрацію через relay.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` усе ще працює як тимчасове перевизначення env для gateway.

## Потік автентифікації та довіри

Relay існує, щоб забезпечити два обмеження, яких не може надати прямий APNs-на-gateway для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які виконали pairing саме з цим
  gateway.

Покроково:

1. `iOS app -> gateway`
   - Спочатку застосунок виконує pairing з gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифіковану сесію node і автентифіковану сесію оператора.
   - Сесія оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає endpoint реєстрації relay через HTTPS.
   - Реєстрація включає підтвердження App Attest і app receipt.
   - Relay перевіряє bundle ID, підтвердження App Attest і Apple receipt та вимагає
     офіційний/production шлях розповсюдження.
   - Саме це не дозволяє локальним Xcode/dev-збіркам використовувати розміщений relay. Локальна збірка може бути
     підписаною, але вона не відповідає вимогам офіційного підтвердження розповсюдження через Apple, якого очікує relay.

3. `делегування ідентичності gateway`
   - Перед реєстрацією relay застосунок отримує ідентичність прив’язаного gateway через
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway у корисне навантаження реєстрації relay.
   - Relay повертає relay handle і send grant, прив’язаний до області реєстрації, делегований
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant із `push.apns.register`.
   - Під час `push.test`, повторних пробуджень під час перепідключення та сигналів пробудження gateway підписує запит надсилання своєю
     власною ідентичністю пристрою.
   - Relay перевіряє і збережений send grant, і підпис gateway відносно делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим APNs token для офіційної збірки.
   - Gateway ніколи не зберігає сирий APNs token для офіційних збірок через relay.
   - Relay надсилає фінальний push у APNs від імені прив’язаного gateway.

Чому створено саме такий дизайн:

- Щоб production-облікові дані APNs не зберігалися в gateway користувачів.
- Щоб уникнути зберігання сирих APNs token офіційних збірок у gateway.
- Щоб дозволити використання розміщеного relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб один gateway не міг надсилати push-повідомлення пробудження на пристрої iOS, які належать іншому gateway.

Локальні/ручні збірки, як і раніше, працюють через прямий APNs. Якщо ви тестуєте такі збірки без relay, то
gateway усе ще потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це змінні середовища runtime на хості gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
автентифікацію App Store Connect / TestFlight, таку як `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

Рекомендоване зберігання на хості gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Не комітьте файл `.p8` і не розміщуйте його в checkout репозиторію.

## Шляхи виявлення

### Bonjour (LAN)

Застосунок iOS переглядає `_openclaw-gw._tcp` на `local.` і, якщо налаштовано, той самий
домен виявлення wide-area DNS-SD. Gateway в тій самій LAN автоматично з’являються з `local.`; для
виявлення між мережами можна використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (між мережами)

Якщо mDNS заблоковано, використайте зону unicast DNS-SD (оберіть домен; приклад:
`openclaw.internal.`) і split DNS у Tailscale.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть host gateway + port (типово `18789`).

## Canvas + A2UI

Node iOS рендерить canvas у WKWebView. Використовуйте `node.invoke` для керування ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост canvas Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він працює з HTTP-сервера Gateway (той самий port, що й `gateway.port`, типово `18789`).
- Після підключення Node iOS автоматично переходить до A2UI, коли рекламується URL хоста canvas.
- Повернутися до вбудованого scaffold можна через `canvas.navigate` і `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Пробудження голосом + режим Talk

- Пробудження голосом і режим Talk доступні в Settings.
- iOS може призупиняти фонове аудіо; розглядайте голосові можливості як best-effort, коли застосунок неактивний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не рекламував URL хоста canvas; перевірте `canvasHost` у [Конфігурації Gateway](/uk/gateway/configuration).
- Запит pairing ніколи не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен pairing у Keychain було очищено; виконайте pairing Node повторно.

## Пов’язані документи

- [Pairing](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
