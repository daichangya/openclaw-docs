---
read_when:
    - Налаштування середовища розробки macOS
summary: Посібник із налаштування для розробників, які працюють над застосунком OpenClaw для macOS
title: Налаштування розробки для macOS
x-i18n:
    generated_at: "2026-04-24T04:16:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30f98b3249096fa1e125a7beb77562b7bd36e2c17f524f30a1c58de61bd04da0
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Налаштування розробки для macOS

Цей посібник охоплює необхідні кроки для збирання та запуску застосунку OpenClaw для macOS з початкового коду.

## Передумови

Перед збиранням застосунку переконайтеся, що у вас встановлено таке:

1. **Xcode 26.2+**: потрібен для розробки на Swift.
2. **Node.js 24 і pnpm**: рекомендовано для gateway, CLI та скриптів пакування. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.

## 1. Встановіть залежності

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати застосунок для macOS і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Режими запуску для розробки, прапорці підпису та усунення проблем із Team ID дивіться в README застосунку для macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Застосунки, підписані ad-hoc, можуть викликати запити безпеки. Якщо застосунок одразу аварійно завершується з "Abort trap 6", дивіться розділ [Усунення несправностей](#усунення-несправностей).

## 3. Встановіть CLI

Застосунок для macOS очікує глобально встановлений CLI `openclaw` для керування фоновими завданнями.

**Щоб установити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Альтернативно можна встановити його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для runtime Gateway шлях через Node і далі є рекомендованим.

## Усунення несправностей

### Збирання завершується помилкою: невідповідність toolchain або SDK

Збирання застосунку для macOS очікує найновіший SDK macOS і toolchain Swift 6.2.

**Системні залежності (обов’язкові):**

- **Остання версія macOS, доступна в Software Update** (потрібна для SDK Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторіть збирання.

### Застосунок аварійно завершується під час надання дозволу

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, причина може бути в пошкодженому кеші TCC або невідповідності підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб примусово створити для macOS "чистий аркуш".

### Gateway нескінченно перебуває в стані "Starting..."

Якщо статус gateway залишається "Starting...", перевірте, чи не утримує порт zombie-процес:

```bash
openclaw gateway status
openclaw gateway stop

# Якщо ви не використовуєте LaunchAgent (режим розробки / ручні запуски), знайдіть процес, що слухає порт:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримує ручний запуск, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.

## Пов’язане

- [Застосунок для macOS](/uk/platforms/macos)
- [Огляд встановлення](/uk/install)
