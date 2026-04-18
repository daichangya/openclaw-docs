---
read_when:
    - Ви хочете підключити OpenClaw до WeChat або Weixin
    - Ви встановлюєте або усуваєте неполадки плагіна каналу openclaw-weixin
    - Вам потрібно зрозуміти, як зовнішні плагіни каналів працюють поруч із Gateway
summary: Налаштування каналу WeChat через зовнішній Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-18T17:28:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw підключається до WeChat через зовнішній Plugin каналу Tencent
`@tencent-weixin/openclaw-weixin`.

Статус: зовнішній Plugin. Підтримуються особисті чати та медіа. Групові чати не
заявлені в поточних метаданих можливостей Plugin.

## Назви

- **WeChat** — це назва для користувачів у цій документації.
- **Weixin** — це назва, яку використовує пакет Tencent і id Plugin.
- `openclaw-weixin` — це id каналу OpenClaw.
- `@tencent-weixin/openclaw-weixin` — це пакет npm.

Використовуйте `openclaw-weixin` у командах CLI і шляхах конфігурації.

## Як це працює

Код WeChat не міститься в основному репозиторії OpenClaw. OpenClaw надає
загальний контракт Plugin каналу, а зовнішній Plugin надає
специфічне для WeChat середовище виконання:

1. `openclaw plugins install` встановлює `@tencent-weixin/openclaw-weixin`.
2. Gateway виявляє маніфест Plugin і завантажує точку входу Plugin.
3. Plugin реєструє id каналу `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускає вхід за QR-кодом.
5. Plugin зберігає облікові дані акаунта в каталозі стану OpenClaw.
6. Коли Gateway запускається, Plugin запускає свій монітор Weixin для кожного
   налаштованого акаунта.
7. Вхідні повідомлення WeChat нормалізуються через контракт каналу, спрямовуються
   до вибраного агента OpenClaw і надсилаються назад через вихідний шлях Plugin.

Це розділення має значення: ядро OpenClaw має залишатися незалежним від каналів. Вхід у WeChat,
виклики Tencent iLink API, завантаження й вивантаження медіа, токени контексту та
моніторинг акаунтів належать зовнішньому Plugin.

## Встановлення

Швидке встановлення:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Ручне встановлення:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Після встановлення перезапустіть Gateway:

```bash
openclaw gateway restart
```

## Вхід

Запустіть вхід за QR-кодом на тій самій машині, де працює Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Відскануйте QR-код у WeChat на своєму телефоні та підтвердьте вхід. Після успішного
сканування Plugin локально зберігає токен акаунта.

Щоб додати ще один акаунт WeChat, знову виконайте ту саму команду входу. Для кількох
акаунтів ізолюйте сесії особистих повідомлень за акаунтом, каналом і відправником:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Керування доступом

Особисті повідомлення використовують стандартну модель сполучення та списку дозволів OpenClaw для
Plugin каналів.

Схваліть нових відправників:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Повну модель керування доступом див. у [Pairing](/uk/channels/pairing).

## Сумісність

Plugin перевіряє версію OpenClaw хоста під час запуску.

| Лінійка Plugin | Версія OpenClaw         | Тег npm  |
| -------------- | ----------------------- | -------- |
| `2.x`          | `>=2026.3.22`           | `latest` |
| `1.x`          | `>=2026.1.0 <2026.3.22` | `legacy` |

Якщо Plugin повідомляє, що ваша версія OpenClaw застаріла, або оновіть
OpenClaw, або встановіть застарілу лінійку Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-процес

Plugin WeChat може запускати допоміжну роботу поруч із Gateway, поки він відстежує
Tencent iLink API. У задачі #68451 цей допоміжний шлях виявив помилку в загальному
очищенні застарілого Gateway в OpenClaw: дочірній процес міг спробувати очистити
батьківський процес Gateway, спричиняючи цикли перезапуску в менеджерах процесів, таких як systemd.

Поточне очищення під час запуску OpenClaw виключає поточний процес і його предків,
тому допоміжний процес каналу не повинен завершувати Gateway, який його запустив. Це виправлення
є загальним; це не специфічний для WeChat шлях у ядрі.

## Усунення неполадок

Перевірте встановлення та статус:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Якщо канал показується як встановлений, але не підключається, переконайтеся, що Plugin
увімкнено, і перезапустіть:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Якщо Gateway неодноразово перезапускається після ввімкнення WeChat, оновіть і OpenClaw, і
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Тимчасове вимкнення:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Пов’язана документація

- Огляд каналів: [Chat Channels](/uk/channels)
- Сполучення: [Pairing](/uk/channels/pairing)
- Маршрутизація каналів: [Channel Routing](/uk/channels/channel-routing)
- Архітектура Plugin: [Plugin Architecture](/uk/plugins/architecture)
- SDK Plugin каналів: [Channel Plugin SDK](/uk/plugins/sdk-channel-plugins)
- Зовнішній пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
