---
read_when:
    - Спарювання або повторне підключення Android node
    - Налагодження виявлення gateway або auth на Android
    - Перевірка однаковості історії chat між клієнтами
summary: 'Застосунок Android (node): runbook підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Застосунок Android
x-i18n:
    generated_at: "2026-04-05T18:09:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2223891afc3aa34af4aaf5410b4f1c6aebcf24bab68a6c47dd9832882d5260db
    source_path: platforms/android.md
    workflow: 15
---

# Застосунок Android (Node)

> **Примітка:** Застосунок Android ще не був публічно випущений. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно, використовуючи Java 17 і Android SDK (`./gradlew :app:assemblePlayDebug`). Інструкції зі збирання див. у [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md).

## Знімок підтримки

- Роль: допоміжний застосунок node (Android не хостить Gateway).
- Потрібен Gateway: так (запускається на macOS, Linux або Windows через WSL2).
- Встановлення: [Початок роботи](/start/getting-started) + [Pairing](/channels/pairing).
- Gateway: [Runbook](/gateway) + [Конфігурація](/gateway/configuration).
  - Протоколи: [Протокол Gateway](/gateway/protocol) (nodes + control plane).

## Керування системою

Керування системою (launchd/systemd) живе на хості Gateway. Див. [Gateway](/gateway).

## Runbook підключення

Застосунок Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до Gateway WebSocket і використовує pairing пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує безпечного ендпоїнта:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` зі справжнім TLS-ендпоїнтом
- Незашифрований `ws://` як і раніше підтримується для приватних LAN-адрес / хостів `.local`, а також `localhost`, `127.0.0.1` і bridge Android emulator (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на “головній” машині.
- Пристрій/emulator Android може досягати gateway WebSocket:
  - У тій самій LAN з mDNS/NSD, **або**
  - У тому самому tailnet Tailscale з Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Через ручне задання хоста/порту gateway (резервний варіант)
- Спарювання Android через tailnet/публічну мережу **не** використовує сирі ендпоїнти tailnet IP `ws://`. Натомість використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в логах, що бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale віддавайте перевагу Serve/Funnel замість сирого bind tailnet:

```bash
openclaw gateway --tailscale serve
```

Це дає Android безпечний ендпоїнт `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого pairing Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте discovery (необов’язково)

На машині gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Додаткові примітки щодо налагодження: [Bonjour](/gateway/bonjour).

Якщо ви також налаштували wide-area домен discovery, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` плюс налаштований wide-area домен за один прохід і використовує визначений
service endpoint замість підказок лише з TXT.

#### Discovery через unicast DNS-SD у tailnet (Відень ⇄ Лондон)

NSD/mDNS discovery на Android не працює між різними мережами. Якщо ваш Android node і gateway знаходяться в різних мережах, але підключені через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Одного discovery недостатньо для pairing Android через tailnet/публічну мережу. Виявлений маршрут усе одно потребує безпечного ендпоїнта (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте Tailscale split DNS для вибраного домену, який вказує на цей DNS-сервер.

Подробиці та приклад конфігурації CoreDNS: [Bonjour](/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо discovery заблоковане, використовуйте ручне задання хоста/порту в **Advanced controls**. Для приватних LAN-хостів `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте ендпоїнт `wss://` / Tailscale Serve.

Після першого успішного pairing Android автоматично перепідключається під час запуску:

- До ручного ендпоїнта (якщо його ввімкнено), інакше
- До останнього виявленого gateway (best-effort).

### 4) Схваліть pairing (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Докладніше про pairing: [Pairing](/channels/pairing).

### 5) Перевірте, що node підключено

- Через статус nodes:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + history

Вкладка Chat у Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; inline directive tags
  прибираються з видимого тексту, plain-text XML payload викликів інструментів (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і
  обрізаними блоками викликів інструментів) та витоки ASCII/full-width керівних токенів моделі
  прибираються, чисті рядки асистента з тихими токенами, як-от точні `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть замінюватися placeholder)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + camera

#### Gateway Canvas Host (рекомендовано для web-контенту)

Якщо ви хочете, щоб node показував справжній HTML/CSS/JS, який агент може редагувати на диску, спрямуйте node на canvas host Gateway.

Примітка: nodes завантажують canvas із HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть до нього на node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої працюють через Tailscale, використовуйте ім’я MagicDNS або IP tailnet замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер інʼєктує в HTML клієнт live-reload і перезавантажує сторінку при зміні файлів.
A2UI host знаходиться за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише на передньому плані):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (застарілий псевдонім `canvas.a2ui.pushJSONL`)

Команди camera (лише на передньому плані; керуються дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Параметри й helper-команди CLI див. у [Camera node](/nodes/camera).

### 8) Voice + розширена поверхня команд Android

- Voice: Android використовує єдиний потік mic on/off у вкладці Voice із захопленням transcript і відтворенням `talk.speak`. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний. Voice зупиняється, коли застосунок іде з переднього плану.
- Перемикачі voice wake/talk mode наразі прибрано з UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою + дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Forwarding сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу асистента

Android підтримує запуск OpenClaw із системного тригера асистента (Google
Assistant). Якщо це налаштовано, утримання кнопки home або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає prompt у composer чату.

Для цього використовуються метадані Android **App Actions**, оголошені в маніфесті застосунку. Жодної
додаткової конфігурації на боці gateway не потрібно — intent асистента
повністю обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
і від того, чи встановив користувач OpenClaw як типовий застосунок асистента.
</Note>

## Forwarding сповіщень

Android може пересилати сповіщення пристрою до gateway як events. Кілька елементів керування дозволяють обмежити, які саме сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                               |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати сповіщення лише з цих назв пакетів. Якщо задано, усі інші пакети ігноруються.          |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення з цих назв пакетів. Застосовується після `allowPackages`.          |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). У цей час сповіщення пригнічуються.           |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                          |
| `notifications.rateLimit`        | number         | Максимальна кількість пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються. |

Picker сповіщень також використовує безпечнішу поведінку для пересланих event сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Forwarding сповіщень вимагає дозволу Android Notification Listener. Під час налаштування застосунок запросить його.
</Note>
