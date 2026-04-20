---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Плагіни OpenClaw, які підтримує спільнота: переглядайте, встановлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-20T19:54:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Плагіни спільноти

Плагіни спільноти — це сторонні пакунки, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та
підтримує спільнота, вони публікуються на [ClawHub](/uk/tools/clawhub) або в npm і
можуть бути встановлені однією командою.

ClawHub — це канонічна поверхня для пошуку плагінів спільноти. Не відкривайте
PR лише до документації тільки для того, щоб додати тут свій Plugin задля
зручності пошуку; натомість опублікуйте його на ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і автоматично повертається до npm.

## Перелічені плагіни

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових
скрейперів. Дозвольте вашому агенту витягувати дані з Instagram, Facebook,
TikTok, YouTube, Google Maps, Google Search, сайтів електронної комерції тощо —
лише за запитом.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до потоку
Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою
притаманних чату команд для відновлення, планування, перевірки, вибору моделі,
Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує
текстові повідомлення, зображення та файлові повідомлення через будь-який
клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management для OpenClaw. Підсумовування розмов на основі
DAG з інкрементним Compaction — зберігає повну цілісність контексту, одночасно
зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний Plugin, який експортує трасування агентів до Opik. Відстежуйте
поведінку агентів, вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Надайте вашому агенту OpenClaw аватар Live2D із синхронізацією губ у реальному
часі, емоційними виразами та функцією перетворення тексту на мовлення. Містить
інструменти для авторів для генерації AI-ресурсів і розгортання в один клік у
Prometheus Marketplace. Наразі в alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Підключіть OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, згадки в
групах, повідомлення каналів і мультимедіа, зокрема голосові повідомлення,
зображення, відео та файли.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Канальний Plugin WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
постійних WebSocket-з’єднань WeCom Bot і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів,
форматування Markdown, вбудований контроль доступу та Skills для документів,
зустрічей і обміну повідомленнями.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Надішліть свій Plugin

Ми вітаємо плагіни спільноти, які є корисними, задокументованими та безпечними в
експлуатації.

<Steps>
  <Step title="Опублікуйте на ClawHub або в npm">
    Ваш Plugin має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його на [ClawHub](/uk/tools/clawhub) (бажано) або в npm.
    Повний посібник дивіться в [Building Plugins](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з
    налаштування та трекером проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін вихідної документації">
    Вам не потрібен PR до документації лише для того, щоб ваш Plugin можна було знайти. Натомість опублікуйте його
    на ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація
    OpenClaw справді потребує зміни вмісту, наприклад виправлення вказівок щодо
    встановлення або додавання міжрепозиторної документації, яка має належати до
    основного набору документації.

  </Step>
</Steps>

## Вимоги до якості

| Вимога                    | Чому                                          |
| ------------------------- | --------------------------------------------- |
| Опубліковано на ClawHub або в npm | Користувачам потрібно, щоб `openclaw plugins install` працювало |
| Публічний репозиторій GitHub | Перевірка вихідного коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати |
| Активна підтримка         | Нещодавні оновлення або оперативне опрацювання проблем |

Малоцінні обгортки, незрозуміле володіння або пакунки без підтримки можуть бути відхилені.

## Пов’язане

- [Install and Configure Plugins](/uk/tools/plugin) — як встановити будь-який Plugin
- [Building Plugins](/uk/plugins/building-plugins) — створіть власний
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
