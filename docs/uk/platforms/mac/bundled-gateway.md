---
read_when:
    - Пакування OpenClaw.app
    - Налагодження сервісу gateway launchd на macOS
    - Установлення CLI gateway для macOS
summary: Runtime gateway на macOS (зовнішній сервіс launchd)
title: Gateway на macOS
x-i18n:
    generated_at: "2026-04-05T18:10:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Gateway на macOS (зовнішній launchd)

OpenClaw.app більше не постачається з Node/Bun або runtime Gateway. Застосунок macOS
очікує **зовнішнє** встановлення CLI `openclaw`, не запускає Gateway як
дочірній процес і керує сервісом launchd для кожного користувача, щоб підтримувати Gateway
у робочому стані (або підключається до наявного локального Gateway, якщо він уже працює).

## Установіть CLI (обов’язково для локального режиму)

Node 24 — типове runtime-середовище на Mac. Node 22 LTS, наразі `22.14+`, усе ще працює для сумісності. Потім установіть `openclaw` глобально:

```bash
npm install -g openclaw@<version>
```

Кнопка **Install CLI** в застосунку macOS запускає той самий глобальний сценарій встановлення, який
внутрішньо використовує застосунок: спочатку надається перевага npm, потім pnpm, потім bun, якщо це єдиний
виявлений менеджер пакетів. Node і далі залишається рекомендованим runtime-середовищем Gateway.

## Launchd (Gateway як LaunchAgent)

Мітка:

- `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть лишатися)

Розташування plist (для кожного користувача):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (або `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Керування:

- Застосунок macOS керує встановленням/оновленням LaunchAgent у локальному режимі.
- CLI також може встановити його: `openclaw gateway install`.

Поведінка:

- “OpenClaw Active” вмикає/вимикає LaunchAgent.
- Вихід із застосунку **не** зупиняє gateway (launchd підтримує його роботу).
- Якщо Gateway вже працює на налаштованому порту, застосунок підключається
  до нього замість запуску нового.

Журналювання:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Сумісність версій

Застосунок macOS перевіряє версію gateway щодо власної версії. Якщо вони
несумісні, оновіть глобальний CLI так, щоб він збігався з версією застосунку.

## Швидка перевірка

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
