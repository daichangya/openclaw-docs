---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний Plugin
summary: 'Плагіни OpenClaw, які підтримує спільнота: переглядайте, встановлюйте та надсилайте власні'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-20T19:24:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcf529e86df78d89afee29e50e5be9892a06d9317036cc98152843fa70415460
    source_path: plugins/community.md
    workflow: 15
---

# Плагіни спільноти

Плагіни спільноти — це сторонні пакунки, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, вони публікуються на [ClawHub](/uk/tools/clawhub) або в npm і
можуть бути встановлені однією командою.

ClawHub — це основна платформа для пошуку плагінів спільноти. Не відкривайте
PR лише до документації тільки для того, щоб додати сюди свій плагін для кращої видимості;
натомість опублікуйте його в ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і автоматично переходить до npm, якщо потрібно.

## Плагіни у списку

### Apify

Збирайте дані з будь-якого вебсайту за допомогою понад 20 000 готових скрейперів. Дозвольте своєму агенту
витягувати дані з Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, сайтів електронної комерції тощо — просто за запитом.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов через Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою вбудованих у чат
команд для відновлення, планування, рев’ю, вибору моделі, Compaction тощо.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота з використанням режиму Stream. Підтримує текстові повідомлення, зображення та
файли через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Плагін керування контекстом без втрат для OpenClaw. Підсумовування
розмов на основі DAG з інкрементальним Compaction — зберігає повну точність контексту
при зменшенні використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний Plugin, який експортує трейси агентів до Opik. Відстежуйте поведінку агентів,
вартість, токени, помилки тощо.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Підключіть OpenClaw до QQ через API QQ Bot. Підтримуються приватні чати, згадки в групах,
повідомлення в каналах і мультимедіа, зокрема голосові повідомлення, зображення, відео
та файли.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на базі
постійних WebSocket-з’єднань WeCom Bot і підтримує прямі повідомлення та групові
чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів, форматування Markdown,
вбудований контроль доступу, а також Skills для документів, зустрічей і повідомлень.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Надішліть свій плагін

Ми вітаємо плагіни спільноти, які є корисними, задокументованими й безпечними в експлуатації.

<Steps>
  <Step title="Опублікуйте в ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його в [ClawHub](/uk/tools/clawhub) (бажано) або npm.
    Повний посібник див. у [Building Plugins](/uk/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та
    трекером проблем.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб ваш плагін можна було знайти. Опублікуйте його
    натомість у ClawHub.

    Відкривайте PR до документації лише тоді, коли у вихідній документації OpenClaw потрібна реальна
    зміна вмісту, наприклад виправлення інструкцій з установлення або додавання міжрепозиторної
    документації, яка має бути в основному наборі документації.

  </Step>
</Steps>

## Вимоги до якості

| Вимога                    | Чому                                         |
| ------------------------- | -------------------------------------------- |
| Опубліковано в ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювало |
| Публічний GitHub-репозиторій | Перевірка вихідного коду, відстеження проблем, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати |
| Активна підтримка         | Нещодавні оновлення або оперативне опрацювання проблем |

Маловартісні обгортки, незрозуміле володіння або пакунки без підтримки можуть бути відхилені.

## Пов’язане

- [Install and Configure Plugins](/uk/tools/plugin) — як встановити будь-який плагін
- [Building Plugins](/uk/plugins/building-plugins) — створіть власний
- [Plugin Manifest](/uk/plugins/manifest) — схема маніфесту
