---
read_when:
    - Пакування OpenClaw.app
    - Налагодження служби launchd gateway на macOS
    - Встановлення CLI gateway для macOS
summary: Середовище виконання Gateway на macOS (зовнішня служба launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-04-24T04:16:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app більше не постачається в комплекті з Node/Bun або середовищем виконання Gateway. Застосунок macOS
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує службою launchd для кожного користувача, щоб підтримувати Gateway
у запущеному стані (або підключається до наявного локального Gateway, якщо він уже працює).

## Встановіть CLI (обов’язково для локального режиму)

Node 24 є типовим середовищем виконання на Mac. Node 22 LTS, наразі `22.14+`, також працює для сумісності. Потім встановіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Кнопка **Install CLI** у застосунку macOS запускає той самий глобальний процес встановлення, який застосунок
використовує внутрішньо: спочатку надається перевага npm, потім pnpm, потім bun, якщо це єдиний
виявлений менеджер пакетів. Node залишається рекомендованим середовищем виконання Gateway.

## Launchd (Gateway як LaunchAgent)

Мітка:

- `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть залишатися)

Розташування plist (для кожного користувача):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (або `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Менеджер:

- Застосунок macOS керує встановленням/оновленням LaunchAgent у локальному режимі.
- CLI також може його встановити: `openclaw gateway install`.

Поведінка:

- “OpenClaw Active” вмикає/вимикає LaunchAgent.
- Вихід із застосунку **не** зупиняє gateway (launchd підтримує його в живому стані).
- Якщо Gateway уже працює на налаштованому порту, застосунок підключається
  до нього замість запуску нового.

Журналювання:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Сумісність версій

Застосунок macOS перевіряє версію gateway щодо власної версії. Якщо вони
несумісні, оновіть глобальний CLI так, щоб він відповідав версії застосунку.

## Smoke check

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Потім:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Runbook Gateway](/uk/gateway)
