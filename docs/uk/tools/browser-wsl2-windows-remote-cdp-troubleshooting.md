---
read_when:
    - Запуск Gateway OpenClaw у WSL2, коли Chrome працює у Windows
    - Бачите накладені помилки браузера/Control UI у WSL2 та Windows
    - Вибір між локальним для хоста Chrome MCP і сирим віддаленим CDP у split-host налаштуваннях
summary: Усування неполадок Gateway у WSL2 + віддалений CDP Windows Chrome по шарах
title: WSL2 + Windows + усунення неполадок віддаленого Chrome CDP
x-i18n:
    generated_at: "2026-04-23T23:07:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30c8b94332e74704f85cbce5891b677b264fd155bc180c44044ab600e84018fd
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 15
---

Цей посібник охоплює поширене split-host налаштування, у якому:

- Gateway OpenClaw працює всередині WSL2
- Chrome працює у Windows
- керування браузером має перетинати межу WSL2/Windows

Він також охоплює багатошаровий шаблон збоїв з [issue #39369](https://github.com/openclaw/openclaw/issues/39369): кілька незалежних проблем можуть з’являтися одночасно, через що спочатку здається зламаним не той шар.

## Спочатку виберіть правильний режим браузера

У вас є два коректні варіанти:

### Варіант 1: сирий віддалений CDP з WSL2 до Windows

Використовуйте профіль віддаленого браузера, який вказує з WSL2 на endpoint CDP Chrome у Windows.

Обирайте цей варіант, коли:

- Gateway працює всередині WSL2
- Chrome працює у Windows
- вам потрібно, щоб керування браузером перетинало межу WSL2/Windows

### Варіант 2: локальний для хоста Chrome MCP

Використовуйте `existing-session` / `user` лише тоді, коли сам Gateway працює на тому самому хості, що й Chrome.

Обирайте цей варіант, коли:

- OpenClaw і Chrome працюють на одній машині
- ви хочете використовувати локальний стан браузера з виконаним входом
- вам не потрібен міжхостовий транспорт браузера
- вам не потрібні розширені маршрути лише для managed/raw-CDP, такі як `responsebody`, експорт PDF,
  перехоплення завантажень або пакетні дії

Для Gateway у WSL2 + Chrome у Windows віддавайте перевагу сирому віддаленому CDP. Chrome MCP є локальним для хоста, а не мостом WSL2-to-Windows.

## Робоча архітектура

Еталонна схема:

- WSL2 запускає Gateway на `127.0.0.1:18789`
- Windows відкриває Control UI у звичайному браузері за адресою `http://127.0.0.1:18789/`
- Chrome у Windows відкриває endpoint CDP на порту `9222`
- WSL2 може досягти цього endpoint CDP у Windows
- OpenClaw спрямовує профіль браузера на адресу, досяжну з WSL2

## Чому це налаштування заплутує

Кілька збоїв можуть накладатися:

- WSL2 не може досягти endpoint CDP у Windows
- Control UI відкрито з небезпечного джерела
- `gateway.controlUi.allowedOrigins` не збігається з походженням сторінки
- відсутній token або pairing
- профіль браузера вказує на неправильну адресу

Через це виправлення одного шару все одно може залишити видимою іншу помилку.

## Критичне правило для Control UI

Коли UI відкривається з Windows, використовуйте localhost Windows, якщо тільки у вас немає свідомо налаштованого HTTPS.

Використовуйте:

`http://127.0.0.1:18789/`

Не використовуйте LAN IP для Control UI за замовчуванням. Звичайний HTTP на адресі LAN або tailnet може спричиняти поведінку insecure-origin/device-auth, яка не пов’язана безпосередньо з CDP. Див. [Control UI](/uk/web/control-ui).

## Перевіряйте по шарах

Рухайтеся зверху вниз. Не перескакуйте вперед.

### Шар 1: перевірте, що Chrome віддає CDP у Windows

Запустіть Chrome у Windows з увімкненим remote debugging:

```powershell
chrome.exe --remote-debugging-port=9222
```

У Windows спочатку перевірте сам Chrome:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

Якщо це не працює у Windows, проблема ще не в OpenClaw.

### Шар 2: перевірте, що WSL2 може досягти цього endpoint Windows

У WSL2 перевірте точну адресу, яку ви плануєте використовувати в `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Хороший результат:

- `/json/version` повертає JSON з метаданими Browser / Protocol-Version
- `/json/list` повертає JSON (порожній масив — це нормально, якщо сторінки не відкрито)

Якщо це не працює:

- Windows ще не відкриває порт для WSL2
- адреса неправильна для боку WSL2
- і далі бракує firewall / port forwarding / локального proxying

Виправте це, перш ніж змінювати конфігурацію OpenClaw.

### Шар 3: налаштуйте правильний профіль браузера

Для сирого віддаленого CDP спрямуйте OpenClaw на адресу, досяжну з WSL2:

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

- використовуйте адресу, досяжну з WSL2, а не ту, що працює лише у Windows
- залишайте `attachOnly: true` для браузерів, керованих зовнішньо
- `cdpUrl` може бути `http://`, `https://`, `ws://` або `wss://`
- використовуйте HTTP(S), коли хочете, щоб OpenClaw виявляв `/json/version`
- використовуйте WS(S) лише тоді, коли провайдер браузера надає прямий URL сокета DevTools
- перевіряйте той самий URL через `curl`, перш ніж очікувати, що OpenClaw запрацює

### Шар 4: окремо перевірте шар Control UI

Відкрийте UI з Windows:

`http://127.0.0.1:18789/`

Потім перевірте:

- походження сторінки збігається з тим, що очікує `gateway.controlUi.allowedOrigins`
- правильно налаштовано token auth або pairing
- ви не налагоджуєте проблему автентифікації Control UI так, ніби це проблема браузера

Корисна сторінка:

- [Control UI](/uk/web/control-ui)

### Шар 5: перевірте наскрізне керування браузером

З WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Хороший результат:

- вкладка відкривається у Chrome для Windows
- `openclaw browser tabs` повертає ціль
- подальші дії (`snapshot`, `screenshot`, `navigate`) працюють з того самого профілю

## Поширені оманливі помилки

Сприймайте кожне повідомлення як підказку, специфічну для конкретного шару:

- `control-ui-insecure-auth`
  - проблема походження UI / secure-context, а не проблема транспорту CDP
- `token_missing`
  - проблема конфігурації автентифікації
- `pairing required`
  - проблема схвалення пристрою
- `Remote CDP for profile "remote" is not reachable`
  - WSL2 не може досягти налаштованого `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable`
  - HTTP endpoint відповів, але WebSocket DevTools усе одно не вдалося відкрити
- застарілі перевизначення viewport / dark-mode / locale / offline після віддаленого сеансу
  - виконайте `openclaw browser stop --browser-profile remote`
  - це закриває активний сеанс керування і звільняє стан емуляції Playwright/CDP без перезапуску gateway або зовнішнього браузера
- `gateway timeout after 1500ms`
  - часто це все ще проблема досяжності CDP або повільного/недосяжного віддаленого endpoint
- `No Chrome tabs found for profile="user"`
  - вибрано локальний для хоста профіль Chrome MCP там, де немає доступних локальних вкладок хоста

## Швидкий контрольний список для triage

1. Windows: чи працює `curl http://127.0.0.1:9222/json/version`?
2. WSL2: чи працює `curl http://WINDOWS_HOST_OR_IP:9222/json/version`?
3. Конфігурація OpenClaw: чи використовує `browser.profiles.<name>.cdpUrl` саме цю адресу, досяжну з WSL2?
4. Control UI: чи відкриваєте ви `http://127.0.0.1:18789/`, а не LAN IP?
5. Чи не намагаєтеся ви використовувати `existing-session` між WSL2 і Windows замість сирого віддаленого CDP?

## Практичний висновок

Таке налаштування зазвичай є життєздатним. Складність у тому, що транспорт браузера, безпека походження Control UI та token/pairing можуть виходити з ладу незалежно одне від одного, хоча з боку користувача виглядають схоже.

Якщо сумніваєтеся:

- спочатку перевірте endpoint Chrome у Windows локально
- потім перевірте той самий endpoint із WSL2
- і лише після цього налагоджуйте конфігурацію OpenClaw або автентифікацію Control UI

## Пов’язане

- [Браузер](/uk/tools/browser)
- [Вхід у браузер](/uk/tools/browser-login)
- [Усунення неполадок браузера в Linux](/uk/tools/browser-linux-troubleshooting)
