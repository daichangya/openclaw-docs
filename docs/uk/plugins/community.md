---
read_when:
    - Ви хочете знайти сторонні плагіни OpenClaw
    - Ви хочете опублікувати або додати до списку власний плагін
summary: 'Плагіни OpenClaw, що підтримуються спільнотою: перегляд, встановлення та надсилання власного'
title: Плагіни спільноти
x-i18n:
    generated_at: "2026-04-05T18:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Плагіни спільноти

Плагіни спільноти — це сторонні пакунки, які розширюють OpenClaw новими
каналами, інструментами, провайдерами або іншими можливостями. Їх створює та підтримує
спільнота, вони публікуються в [ClawHub](/tools/clawhub) або npm і
встановлюються однією командою.

ClawHub — це канонічна поверхня виявлення для плагінів спільноти. Не відкривайте
PR лише до документації, щоб просто додати тут свій плагін для кращого виявлення; натомість опублікуйте його в
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw спочатку перевіряє ClawHub і автоматично переходить до npm, якщо потрібно.

## Плагіни у списку

### Codex App Server Bridge

Незалежний міст OpenClaw для розмов Codex App Server. Прив’яжіть чат до
потоку Codex, спілкуйтеся з ним звичайним текстом і керуйте ним за допомогою природних для чату
команд для відновлення, планування, рев’ю, вибору моделі, ущільнення та іншого.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Інтеграція корпоративного робота за допомогою режиму Stream. Підтримує текст,
зображення та файлові повідомлення через будь-який клієнт DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Плагін Lossless Context Management для OpenClaw. Підсумовування розмов
на основі DAG з інкрементальним ущільненням — зберігає повну точність контексту,
водночас зменшуючи використання токенів.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Офіційний плагін, який експортує трасування агентів до Opik. Відстежуйте поведінку агента,
вартість, токени, помилки та інше.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Підключіть OpenClaw до QQ через QQ Bot API. Підтримує приватні чати, згадки в групах,
повідомлення каналів і багатий медіаконтент, зокрема голосові повідомлення, зображення, відео
та файли.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Плагін каналу WeCom для OpenClaw від команди Tencent WeCom. Працює на основі
постійних WebSocket-з’єднань WeCom Bot і підтримує
прямі повідомлення та групові чати, потокові відповіді, проактивні повідомлення, обробку зображень/файлів,
форматування Markdown, вбудоване керування доступом і навички для документів/зустрічей/обміну повідомленнями.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Надішліть свій плагін

Ми вітаємо плагіни спільноти, які є корисними, документованими та безпечними в експлуатації.

<Steps>
  <Step title="Опублікуйте в ClawHub або npm">
    Ваш плагін має встановлюватися через `openclaw plugins install \<package-name\>`.
    Опублікуйте його в [ClawHub](/tools/clawhub) (бажано) або npm.
    Повний посібник див. у [Building Plugins](/plugins/building-plugins).

  </Step>

  <Step title="Розмістіть на GitHub">
    Вихідний код має бути в публічному репозиторії з документацією з налаштування та
    трекером issues.

  </Step>

  <Step title="Використовуйте PR до документації лише для змін у вихідній документації">
    Вам не потрібен PR до документації лише для того, щоб ваш плагін можна було знайти. Натомість опублікуйте його
    в ClawHub.

    Відкривайте PR до документації лише тоді, коли вихідна документація OpenClaw потребує реальної
    зміни вмісту, наприклад виправлення вказівок зі встановлення або додавання міжрепозиторної
    документації, яка має належати до основного набору документації.

  </Step>
</Steps>

## Вимоги до якості

| Вимога                    | Навіщо                                        |
| ------------------------- | --------------------------------------------- |
| Опубліковано в ClawHub або npm | Користувачам потрібно, щоб `openclaw plugins install` працювало |
| Публічний репозиторій GitHub | Перегляд коду, відстеження issues, прозорість |
| Документація з налаштування та використання | Користувачі мають знати, як це налаштувати |
| Активна підтримка         | Недавні оновлення або оперативна обробка issues |

Обгортки з мінімальними зусиллями, незрозуміле володіння або пакунки без підтримки можуть бути відхилені.

## Пов’язане

- [Встановлення та налаштування плагінів](/tools/plugin) — як встановити будь-який плагін
- [Building Plugins](/plugins/building-plugins) — створіть власний
- [Маніфест плагіна](/plugins/manifest) — схема маніфесту
