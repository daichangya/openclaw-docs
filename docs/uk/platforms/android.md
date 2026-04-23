---
read_when:
    - Сполучення або повторне підключення Node Android
    - Налагодження виявлення gateway або автентифікації на Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Android app (Node): runbook підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Застосунок Android
x-i18n:
    generated_at: "2026-04-23T23:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 386aafd0d23a5c1c1a9e67236b222527e7860cd855474d187354567c6c80f50e
    source_path: platforms/android.md
    workflow: 15
---

> **Примітка:** Застосунок Android ще не було публічно випущено. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 і Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збирання див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Знімок підтримки

- Роль: супутній застосунок Node (Android не розміщує Gateway).
- Gateway потрібен: так (запускається на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/uk/start/getting-started) + [Сполучення](/uk/channels/pairing).
- Gateway: [Runbook](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (Node + control plane).

## Керування системою

Керування системою (launchd/systemd) розміщується на хості Gateway. Див. [Gateway](/uk/gateway).

## Runbook підключення

Застосунок Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до Gateway WebSocket і використовує сполучення пристроїв (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеного endpoint-а:

- Рекомендовано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` зі справжнім TLS-endpoint-ом
- Незашифрований `ws://` і далі підтримується для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і мосту Android emulator (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на “головній” машині.
- Пристрій/emulator Android може досягати Gateway WebSocket:
  - у тій самій LAN з mDNS/NSD, **або**
  - у тій самій tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - через ручне задання хоста/порту gateway (резервний варіант)
- Сполучення Android через tailnet/публічну мережу **не** використовує сирі endpoint-и tailnet IP `ws://`. Замість цього використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в журналах, що ви бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale надавайте перевагу Serve/Funnel замість сирого bind tailnet:

```bash
openclaw gateway --tailscale serve
```

Це надає Android захищений endpoint `wss://` / `https://`. Звичайного налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте discovery (необов’язково)

На машині gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові примітки з налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували wide-area discovery domain, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` плюс налаштований wide-area domain за один прохід і використовує визначений
service endpoint замість підказок лише з TXT.

#### Discovery через tailnet (Відень ⇄ Лондон) за допомогою unicast DNS-SD

Discovery Android через NSD/mDNS не проходить між мережами. Якщо ваш Android Node і gateway перебувають у різних мережах, але підключені через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого discovery недостатньо для сполучення Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує захищеного endpoint-а (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте split DNS у Tailscale для вибраного домену з вказівкою на цей DNS-сервер.

Докладніше та приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з gateway активним за допомогою **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо discovery заблоковано, використовуйте ручне задання хоста/порту в **Advanced controls**. Для приватних LAN-хостів `ws://` і далі працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте endpoint `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- до manual endpoint-а (якщо ввімкнено), інакше
- до останнього виявленого gateway (best-effort).

### 4) Підтвердьте сполучення (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Подробиці сполучення: [Сполучення](/uk/channels/pairing).

### 5) Перевірте, що Node підключено

- Через стан Node:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Вкладка Chat на Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- History: `chat.history` (нормалізована для відображення; inline directive tags
  прибираються з видимого тексту, XML payload-и викликів інструментів у plain-text (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів) і витіклі ASCII/full-width токени керування моделлю
  прибираються, рядки помічника, що містять лише silent-token, як-от точний `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть бути замінені placeholder-ами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Хост Canvas Gateway (рекомендовано для вебвмісту)

Якщо ви хочете, щоб Node показував справжній HTML/CSS/JS, який агент може редагувати на диску, вкажіть для Node хост canvas Gateway.

Примітка: Node завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть Node на нього (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або tailnet IP замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер інжектує клієнт live-reload у HTML і перезавантажує сторінку при зміні файлів.
Хост A2UI розміщено за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише в foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` — legacy-псевдонім)

Команди camera (лише в foreground; залежать від дозволів):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри та helper-команди CLI див. у [Camera node](/uk/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Voice: Android використовує єдиний потік увімкнення/вимкнення мікрофона у вкладці Voice із захопленням транскрипту та відтворенням `talk.speak`. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний. Voice зупиняється, коли застосунок виходить із foreground.
- Перемикачі voice wake/talk-mode наразі прибрано з UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою та дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Переадресація сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу помічника

Android підтримує запуск OpenClaw із системного тригера помічника (Google
Assistant). Якщо це налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає prompt у composer чату.

Для цього використовується метадані Android **App Actions**, оголошені в маніфесті застосунку. Жодної
додаткової конфігурації на боці gateway не потрібно — intent помічника
повністю обробляється застосунком Android і передається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи вибрав користувач OpenClaw як типовий застосунок помічника.
</Note>

## Переадресація сповіщень

Android може пересилати сповіщення пристрою до gateway як події. Кілька елементів керування дають змогу обмежувати, які сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                                  |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати лише сповіщення з цих назв пакетів. Якщо задано, усі інші пакети ігноруються.             |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення з цих назв пакетів. Застосовується після `allowPackages`.            |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Під час цього вікна сповіщення пригнічуються.    |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                              |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються. |

Вибірник сповіщень також використовує безпечнішу поведінку для подій пересланих сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

Приклад конфігурації:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
Для переадресації сповіщень потрібен дозвіл Android Notification Listener. Під час налаштування застосунок запропонує його надати.
</Note>
