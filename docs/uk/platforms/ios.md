---
read_when:
    - Сполучення або повторне підключення вузла iOS
    - Запуск застосунку iOS з вихідного коду
    - Налагодження виявлення gateway або команд canvas
summary: 'Застосунок вузла iOS: підключення до Gateway, сполучення, canvas і усунення несправностей'
title: Застосунок iOS
x-i18n:
    generated_at: "2026-04-05T18:10:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# Застосунок iOS (вузол)

Доступність: внутрішнє попереднє ознайомлення. Застосунок iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, захоплення з камери, геолокація, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє про події стану вузла.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручне введення host/port (резервний варіант).

## Швидкий старт (сполучення + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть знайдений gateway (або увімкніть Manual Host і введіть host/port).

3. Підтвердьте запит на сполучення на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює спробу сполучення зі зміненими даними автентифікації (роль/області доступу/публічний ключ),
попередній очікувальний запит замінюється, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації необробленого APNs-токена
до gateway.

Вимога на боці gateway:

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

Як працює цей процес:

- Застосунок iOS реєструється в relay за допомогою App Attest і квитанції застосунку.
- Relay повертає непрозорий relay handle разом із send grant у межах реєстрації.
- Застосунок iOS отримує ідентичність сполученого gateway і включає її до relay-реєстрації, щоб relay-backed реєстрація була делегована саме цьому gateway.
- Застосунок пересилає цю relay-backed реєстрацію до сполученого gateway через `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, пробудження у фоновому режимі та сигналів пробудження.
- Base URL relay на gateway має збігатися з URL relay, вбудованим в офіційну/TestFlight збірку iOS.
- Якщо згодом застосунок підключається до іншого gateway або до збірки з іншим relay base URL, він оновлює relay-реєстрацію замість повторного використання старої прив’язки.

Що **не** потрібно gateway для цього шляху:

- Жодного relay-токена на рівні розгортання.
- Жодного прямого APNs-ключа для relay-backed надсилань з офіційних/TestFlight збірок.

Очікуваний робочий процес оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Встановіть `gateway.push.apns.relay.baseUrl` на gateway.
3. Сполучіть застосунок із gateway і дочекайтеся завершення підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як має APNs-токен, сеанс оператора підключено, а relay-реєстрація успішна.
5. Після цього `push.test`, пробудження при повторному підключенні та сигнали пробудження можуть використовувати збережену relay-backed реєстрацію.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` усе ще працює як тимчасове перевизначення через змінну середовища для gateway.

## Потік автентифікації та довіри

Relay існує для забезпечення двох обмежень, які прямий APNs-на-gateway не може забезпечити для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати relay-backed push лише для пристроїв iOS, які були сполучені саме з цим
  gateway.

Поетапно:

1. `iOS app -> gateway`
   - Спочатку застосунок сполучається з gateway через звичайний потік автентифікації Gateway.
   - Це надає застосунку автентифікований сеанс вузла та автентифікований сеанс оператора.
   - Сеанс оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest і квитанцію застосунку.
   - Relay перевіряє bundle ID, доказ App Attest і квитанцію Apple та вимагає
     офіційного/продакшн-шляху розповсюдження.
   - Саме це не дозволяє локальним Xcode/dev збіркам використовувати розміщений relay. Локальна збірка може бути
     підписаною, але вона не задовольняє вимогу relay щодо офіційного підтвердження розповсюдження через Apple.

3. `gateway identity delegation`
   - Перед relay-реєстрацією застосунок отримує ідентичність сполученого gateway з
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway до payload relay-реєстрації.
   - Relay повертає relay handle і send grant у межах реєстрації, делеговані
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant із `push.apns.register`.
   - Для `push.test`, пробуджень при повторному підключенні та сигналів пробудження gateway підписує запит на надсилання
     власною ідентичністю пристрою.
   - Relay перевіряє і збережений send grant, і підпис gateway відносно делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє продакшн-обліковими даними APNs і необробленим APNs-токеном для офіційної збірки.
   - Gateway ніколи не зберігає необроблений APNs-токен для relay-backed офіційних збірок.
   - Relay надсилає фінальний push до APNs від імені сполученого gateway.

Чому було створено таку архітектуру:

- Щоб не зберігати продакшн-облікові дані APNs на gateway користувача.
- Щоб не зберігати на gateway необроблені APNs-токени офіційних збірок.
- Щоб дозволити використання розміщеного relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб один gateway не міг надсилати push-пробудження на пристрої iOS, що належать іншому gateway.

Локальні/ручні збірки й далі використовують прямий APNs. Якщо ви тестуєте такі збірки без relay,
gateway усе ще потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## Шляхи виявлення

### Bonjour (LAN)

Застосунок iOS переглядає `_openclaw-gw._tcp` у `local.` і, якщо налаштовано, той самий
домен wide-area DNS-SD. Gateway у тій самій LAN з’являються автоматично через `local.`;
міжмережеве виявлення може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (міжмережеве)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Приклад для CoreDNS див. у [Bonjour](/uk/gateway/bonjour).

### Ручне введення host/port

У Settings увімкніть **Manual Host** і введіть host gateway + port (типово `18789`).

## Canvas + A2UI

Вузол iOS відображає canvas у WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост canvas у Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується HTTP-сервером Gateway (той самий port, що й `gateway.port`, типово `18789`).
- Вузол iOS автоматично переходить до A2UI при підключенні, коли оголошено URL хоста canvas.
- Повернутися до вбудованого каркаса можна через `canvas.navigate` і `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження та режим розмови доступні в Settings.
- iOS може призупиняти фонове аудіо; вважайте голосові функції режимом best-effort, коли застосунок неактивний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть застосунок iOS на передній план (команди canvas/camera/screen цього вимагають).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не оголосив URL хоста canvas; перевірте `canvasHost` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит на сполучення так і не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен сполучення в Keychain було очищено; повторно сполучіть вузол.

## Пов’язана документація

- [Сполучення](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
