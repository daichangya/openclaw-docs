---
read_when:
    - Запуск OpenClaw Gateway у WSL2, тоді як Chrome працює у Windows
    - Ви бачите пов’язані помилки browser/control-ui одночасно у WSL2 та Windows
    - Ви обираєте між host-local Chrome MCP і сирим віддаленим CDP у конфігураціях із розділеними хостами
summary: Поетапне усунення проблем із Gateway у WSL2 + віддаленим Chrome CDP у Windows
title: Усунення проблем WSL2 + Windows + віддаленого Chrome CDP
x-i18n:
    generated_at: "2026-04-05T18:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99df2988d3c6cf36a8c2124d5b724228d095a60b2d2b552f3810709b5086127d
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

# Усунення проблем WSL2 + Windows + віддаленого Chrome CDP

У цьому посібнику розглянуто типову конфігурацію з розділеними хостами, де:

- OpenClaw Gateway працює всередині WSL2
- Chrome працює у Windows
- керування браузером має проходити через межу між WSL2 і Windows

Також тут розглянуто шаблон багаторівневих збоїв з [issue #39369](https://github.com/openclaw/openclaw/issues/39369): одночасно може виникати кілька незалежних проблем, через що спочатку може здаватися зламаним не той рівень.

## Спочатку виберіть правильний режим браузера

У вас є два коректні варіанти:

### Варіант 1: Сирий віддалений CDP з WSL2 до Windows

Використовуйте профіль віддаленого браузера, який вказує з WSL2 на кінцеву точку Windows Chrome CDP.

Обирайте це, коли:

- Gateway залишається всередині WSL2
- Chrome працює у Windows
- вам потрібно, щоб керування браузером проходило через межу між WSL2 і Windows

### Варіант 2: Host-local Chrome MCP

Використовуйте `existing-session` / `user` лише тоді, коли сам Gateway працює на тому самому хості, що й Chrome.

Обирайте це, коли:

- OpenClaw і Chrome працюють на одній машині
- ви хочете використовувати локальний браузерний стан із входом у систему
- вам не потрібен крос-хостовий транспорт браузера
- вам не потрібні розширені маршрути лише для managed/raw-CDP, такі як `responsebody`, експорт PDF,
  перехоплення завантажень або пакетні дії

Для WSL2 Gateway + Windows Chrome віддавайте перевагу сирому віддаленому CDP. Chrome MCP є host-local, а не мостом між WSL2 і Windows.

## Робоча архітектура

Еталонна схема:

- WSL2 запускає Gateway на `127.0.0.1:18789`
- Windows відкриває Control UI у звичайному браузері за адресою `http://127.0.0.1:18789/`
- Windows Chrome надає кінцеву точку CDP на порту `9222`
- WSL2 може дістатися цієї кінцевої точки Windows CDP
- OpenClaw спрямовує профіль браузера на адресу, доступну з WSL2

## Чому ця конфігурація збиває з пантелику

Кілька збоїв можуть накладатися:

- WSL2 не може дістатися кінцевої точки Windows CDP
- Control UI відкрито з небезпечного джерела
- `gateway.controlUi.allowedOrigins` не збігається з джерелом сторінки
- відсутній token або pairing
- профіль браузера вказує на неправильну адресу

Через це виправлення одного рівня може все одно залишати видимою помилку на іншому рівні.

## Критичне правило для Control UI

Коли UI відкривається з Windows, використовуйте Windows localhost, якщо тільки у вас немає навмисно налаштованого HTTPS.

Використовуйте:

`http://127.0.0.1:18789/`

Не використовуйте LAN IP за замовчуванням для Control UI. Звичайний HTTP на LAN- або tailnet-адресі може викликати поведінку insecure-origin/device-auth, яка не пов’язана безпосередньо з CDP. Див. [Control UI](/web/control-ui).

## Перевіряйте по шарах

Рухайтеся зверху вниз. Не перескакуйте вперед.

### Рівень 1: Переконайтеся, що Chrome надає CDP у Windows

Запустіть Chrome у Windows з увімкненим віддаленим налагодженням:

```powershell
chrome.exe --remote-debugging-port=9222
```

У Windows спочатку перевірте сам Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Якщо це не працює у Windows, проблема поки що не в OpenClaw.

### Рівень 2: Переконайтеся, що WSL2 може дістатися цієї кінцевої точки Windows

У WSL2 перевірте точну адресу, яку плануєте використовувати в `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Хороший результат:

- `/json/version` повертає JSON з метаданими Browser / Protocol-Version
- `/json/list` повертає JSON (порожній масив — теж нормально, якщо немає відкритих сторінок)

Якщо це не працює:

- Windows ще не відкриває цей порт для WSL2
- адреса неправильна для боку WSL2
- ще бракує налаштування firewall / перенаправлення портів / локального проксі

Виправте це, перш ніж чіпати конфігурацію OpenClaw.

### Рівень 3: Налаштуйте правильний профіль браузера

Для сирого віддаленого CDP вкажіть в OpenClaw адресу, доступну з WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Примітки:

- використовуйте адресу, доступну з WSL2, а не ту, що працює лише у Windows
- залишайте `attachOnly: true` для браузерів, якими керує зовнішнє середовище
- `cdpUrl` може бути `http://`, `https://`, `ws://` або `wss://`
- використовуйте HTTP(S), якщо хочете, щоб OpenClaw виявляв `/json/version`
- використовуйте WS(S) лише тоді, коли провайдер браузера надає вам прямий URL сокета DevTools
- перевірте той самий URL через `curl`, перш ніж очікувати успіху від OpenClaw

### Рівень 4: Окремо перевірте шар Control UI

Відкрийте UI у Windows:

`http://127.0.0.1:18789/`

Потім перевірте:

- джерело сторінки збігається з тим, що очікує `gateway.controlUi.allowedOrigins`
- автентифікацію за token або pairing налаштовано правильно
- ви не налагоджуєте проблему автентифікації Control UI так, ніби це проблема браузера

Корисна сторінка:

- [Control UI](/web/control-ui)

### Рівень 5: Переконайтеся, що керування браузером працює наскрізно

З WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Хороший результат:

- вкладка відкривається у Windows Chrome
- `openclaw browser tabs` повертає ціль
- подальші дії (`snapshot`, `screenshot`, `navigate`) працюють із тим самим профілем

## Поширені помилки, що вводять в оману

Сприймайте кожне повідомлення як підказку для конкретного шару:

- `control-ui-insecure-auth`
  - проблема джерела UI / secure-context, а не проблема транспорту CDP
- `token_missing`
  - проблема конфігурації автентифікації
- `pairing required`
  - проблема схвалення пристрою
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 не може дістатися налаштованого `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP-кінцева точка відповіла, але WebSocket DevTools все одно не вдалося відкрити
- застарілі перевизначення viewport / dark-mode / locale / offline після віддаленої сесії
  - виконайте `openclaw browser stop --browser-profile remote`
  - це закриє активну сесію керування та звільнить стан емуляції Playwright/CDP без перезапуску gateway або зовнішнього браузера
- `gateway timeout after 1500ms`
  - часто це все ще проблема досяжності CDP або повільної/недоступної віддаленої кінцевої точки
- `No Chrome tabs found for profile="user"`
  - вибрано локальний профіль Chrome MCP, хоча локально на хості немає доступних вкладок

## Короткий список для швидкої діагностики

1. Windows: чи працює `curl http://127.0.0.1:9222/json/version`?
2. WSL2: чи працює `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Конфігурація OpenClaw: чи використовує `browser.profiles.<name>.cdpUrl` саме цю адресу, доступну з WSL2?
4. Control UI: чи відкриваєте ви `http://127.0.0.1:18789/`, а не LAN IP?
5. Чи не намагаєтеся ви використовувати `existing-session` між WSL2 і Windows замість сирого віддаленого CDP?

## Практичний висновок

Така конфігурація зазвичай є працездатною. Найскладніше те, що транспорт браузера, безпека джерела Control UI і token/pairing можуть виходити з ладу незалежно один від одного, водночас виглядаючи для користувача схожими.

Якщо сумніваєтеся:

- спочатку перевірте кінцеву точку Windows Chrome локально
- потім перевірте ту саму кінцеву точку з WSL2
- лише після цього налагоджуйте конфігурацію OpenClaw або автентифікацію Control UI
