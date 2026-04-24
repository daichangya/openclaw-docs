---
read_when:
    - Сполучення або повторне підключення Android node
    - Налагодження виявлення gateway або автентифікації Android
    - Перевірка паритету історії чату між клієнтами
summary: 'Застосунок Android (node): інструкція з підключення + поверхня команд Connect/Chat/Voice/Canvas'
title: Застосунок Android
x-i18n:
    generated_at: "2026-04-24T03:19:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Примітка:** Застосунок Android ще не був публічно випущений. Вихідний код доступний у [репозиторії OpenClaw](https://github.com/openclaw/openclaw) у `apps/android`. Ви можете зібрати його самостійно за допомогою Java 17 та Android SDK (`./gradlew :app:assemblePlayDebug`). Дивіться [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) для інструкцій зі збирання.

## Знімок підтримки

- Роль: застосунок-супутник node (Android не розміщує Gateway).
- Gateway потрібен: так (запускайте його на macOS, Linux або Windows через WSL2).
- Установлення: [Початок роботи](/uk/start/getting-started) + [Сполучення](/uk/channels/pairing).
- Gateway: [Інструкція з експлуатації](/uk/gateway) + [Конфігурація](/uk/gateway/configuration).
  - Протоколи: [Протокол Gateway](/uk/gateway/protocol) (nodes + control plane).

## Керування системою

Керування системою (launchd/systemd) знаходиться на хості Gateway. Дивіться [Gateway](/uk/gateway).

## Інструкція з підключення

Застосунок Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android підключається безпосередньо до WebSocket Gateway і використовує сполучення пристрою (`role: node`).

Для Tailscale або публічних хостів Android потребує захищеного ендпойнта:

- Бажано: Tailscale Serve / Funnel з `https://<magicdns>` / `wss://<magicdns>`
- Також підтримується: будь-який інший URL Gateway `wss://` із реальним TLS-ендпойнтом
- Незашифрований `ws://` усе ще підтримується на приватних LAN-адресах / хостах `.local`, а також для `localhost`, `127.0.0.1` і мосту емулятора Android (`10.0.2.2`)

### Передумови

- Ви можете запустити Gateway на «головній» машині.
- Пристрій/емулятор Android може досягти WebSocket gateway:
  - У тій самій LAN з mDNS/NSD, **або**
  - У тій самій мережі Tailscale через Wide-Area Bonjour / unicast DNS-SD (див. нижче), **або**
  - Ручне введення хоста/порту gateway (резервний варіант)
- Сполучення мобільного пристрою через tailnet/публічну мережу **не** використовує сирі ендпойнти tailnet IP `ws://`. Натомість використовуйте Tailscale Serve або інший URL `wss://`.
- Ви можете запускати CLI (`openclaw`) на машині gateway (або через SSH).

### 1) Запустіть Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Підтвердьте в журналах, що ви бачите щось на кшталт:

- `listening on ws://0.0.0.0:18789`

Для віддаленого доступу Android через Tailscale віддавайте перевагу Serve/Funnel замість сирого bind до tailnet:

```bash
openclaw gateway --tailscale serve
```

Це дає Android захищений ендпойнт `wss://` / `https://`. Простого налаштування `gateway.bind: "tailnet"` недостатньо для першого віддаленого сполучення Android, якщо ви також окремо не завершуєте TLS.

### 2) Перевірте виявлення (необов’язково)

З машини gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Більше приміток щодо налагодження: [Bonjour](/uk/gateway/bonjour).

Якщо ви також налаштували wide-area discovery domain, порівняйте з:

```bash
openclaw gateway discover --json
```

Це показує `local.` разом із налаштованим wide-area domain за один прохід і використовує визначений
service endpoint замість лише підказок TXT.

#### Виявлення tailnet (Відень ⇄ Лондон) через unicast DNS-SD

Виявлення Android NSD/mDNS не проходить між мережами. Якщо ваш Android node і gateway знаходяться в різних мережах, але з’єднані через Tailscale, використовуйте Wide-Area Bonjour / unicast DNS-SD.

Самого виявлення недостатньо для tailnet/публічного сполучення Android. Виявлений маршрут усе одно потребує захищеного ендпойнта (`wss://` або Tailscale Serve):

1. Налаштуйте зону DNS-SD (наприклад, `openclaw.internal.`) на хості gateway і опублікуйте записи `_openclaw-gw._tcp`.
2. Налаштуйте Tailscale split DNS для вибраного домену, вказавши цей DNS-сервер.

Подробиці й приклад конфігурації CoreDNS: [Bonjour](/uk/gateway/bonjour).

### 3) Підключіться з Android

У застосунку Android:

- Застосунок підтримує з’єднання з gateway через **foreground service** (постійне сповіщення).
- Відкрийте вкладку **Connect**.
- Використовуйте режим **Setup Code** або **Manual**.
- Якщо виявлення заблоковано, використовуйте ручне введення хоста/порту в **Advanced controls**. Для приватних хостів LAN `ws://` усе ще працює. Для Tailscale/публічних хостів увімкніть TLS і використовуйте ендпойнт `wss://` / Tailscale Serve.

Після першого успішного сполучення Android автоматично перепідключається під час запуску:

- до ручного ендпойнта (якщо ввімкнено), інакше
- до останнього виявленого gateway (best-effort).

### 4) Підтвердьте сполучення (CLI)

На машині gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Подробиці сполучення: [Сполучення](/uk/channels/pairing).

### 5) Перевірте, що node підключений

- Через статус nodes:

  ```bash
  openclaw nodes status
  ```

- Через Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Чат + історія

Вкладка Chat в Android підтримує вибір сесії (типово `main`, а також інші наявні сесії):

- Історія: `chat.history` (нормалізована для відображення; вбудовані теги директив
  прибираються з видимого тексту, XML-payload викликів інструментів у звичайному тексті (включно з
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` та
  обрізаними блоками викликів інструментів) і витеклі ASCII/повноширинні токени керування моделлю
  видаляються, чисті рядки асистента з тихими токенами, як-от точний `NO_REPLY` /
  `no_reply`, пропускаються, а надто великі рядки можуть замінюватися заповнювачами)
- Надсилання: `chat.send`
- Push-оновлення (best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + камера

#### Gateway Canvas Host (рекомендовано для вебвмісту)

Якщо ви хочете, щоб node показував реальні HTML/CSS/JS, які агент може редагувати на диску, вкажіть node на canvas host Gateway.

Примітка: nodes завантажують canvas з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, типово `18789`).

1. Створіть `~/.openclaw/workspace/canvas/index.html` на хості gateway.

2. Перейдіть до нього на node (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (необов’язково): якщо обидва пристрої в Tailscale, використовуйте ім’я MagicDNS або tailnet IP замість `.local`, наприклад `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Цей сервер вбудовує клієнт live-reload у HTML і перезавантажує сторінку при зміні файлів.
Хост A2UI знаходиться за адресою `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Команди Canvas (лише у foreground):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (використовуйте `{"url":""}` або `{"url":"/"}`, щоб повернутися до типового scaffold). `canvas.snapshot` повертає `{ format, base64 }` (типово `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (застарілий псевдонім `canvas.a2ui.pushJSONL`)

Команди камери (лише у foreground; керуються дозволами):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Дивіться [Камера node](/uk/nodes/camera) для параметрів і допоміжних команд CLI.

### 8) Voice + розширена поверхня команд Android

- Voice: Android використовує єдиний потік увімкнення/вимкнення мікрофона у вкладці Voice із захопленням транскрипту та відтворенням `talk.speak`. Локальний системний TTS використовується лише тоді, коли `talk.speak` недоступний. Voice зупиняється, коли застосунок залишає foreground.
- Перемикачі Voice wake/talk mode наразі прибрані з UX/runtime Android.
- Додаткові сімейства команд Android (доступність залежить від пристрою та дозволів):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (див. [Пересилання сповіщень](#notification-forwarding) нижче)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Точки входу асистента

Android підтримує запуск OpenClaw через системний тригер асистента (Google
Assistant). Якщо це налаштовано, утримання кнопки «Додому» або фраза "Hey Google, ask
OpenClaw..." відкриває застосунок і передає запит у поле введення чату.

Це використовує метадані Android **App Actions**, оголошені в маніфесті застосунку. Жодної
додаткової конфігурації на боці gateway не потрібно — intent асистента
повністю обробляється застосунком Android і пересилається як звичайне повідомлення чату.

<Note>
Доступність App Actions залежить від пристрою, версії Google Play Services
та від того, чи встановив користувач OpenClaw як типовий застосунок асистента.
</Note>

## Пересилання сповіщень

Android може пересилати сповіщення пристрою до gateway як події. Кілька елементів керування дають змогу обмежити, які сповіщення пересилаються і коли.

| Ключ                             | Тип            | Опис                                                                                               |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Пересилати сповіщення лише з цих назв пакетів. Якщо задано, всі інші пакети ігноруються.          |
| `notifications.denyPackages`     | string[]       | Ніколи не пересилати сповіщення з цих назв пакетів. Застосовується після `allowPackages`.         |
| `notifications.quietHours.start` | string (HH:mm) | Початок вікна тихих годин (локальний час пристрою). Сповіщення приглушуються впродовж цього вікна. |
| `notifications.quietHours.end`   | string (HH:mm) | Кінець вікна тихих годин.                                                                          |
| `notifications.rateLimit`        | number         | Максимум пересланих сповіщень на пакет за хвилину. Надлишкові сповіщення відкидаються.            |

Засіб вибору сповіщень також використовує безпечнішу поведінку для пересланих подій сповіщень, запобігаючи випадковому пересиланню чутливих системних сповіщень.

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
Пересилання сповіщень потребує дозволу Android Notification Listener. Під час налаштування застосунок запропонує його надати.
</Note>

## Пов’язано

- [Застосунок iOS](/uk/platforms/ios)
- [Nodes](/uk/nodes)
- [Усунення проблем Android node](/uk/nodes/troubleshooting)
