---
read_when:
    - Налаштування середовища розробки для macOS
summary: Посібник із налаштування для розробників, які працюють над macOS-застосунком OpenClaw
title: Налаштування розробки для macOS
x-i18n:
    generated_at: "2026-04-05T18:10:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd13f17391bdd87ef59e4c575e5da3312c4066de00905731263bff655a5db357
    source_path: platforms/mac/dev-setup.md
    workflow: 15
---

# Налаштування для розробників macOS

У цьому посібнику описано необхідні кроки для збирання та запуску macOS-застосунку OpenClaw із вихідного коду.

## Передумови

Перш ніж збирати застосунок, переконайтеся, що у вас встановлено таке:

1. **Xcode 26.2+**: Потрібно для розробки на Swift.
2. **Node.js 24 & pnpm**: Рекомендовано для шлюзу, CLI і скриптів пакування. Node 22 LTS, наразі `22.14+`, також підтримується для сумісності.

## 1. Встановіть залежності

Встановіть залежності для всього проєкту:

```bash
pnpm install
```

## 2. Зберіть і запакуйте застосунок

Щоб зібрати macOS-застосунок і запакувати його в `dist/OpenClaw.app`, виконайте:

```bash
./scripts/package-mac-app.sh
```

Якщо у вас немає сертифіката Apple Developer ID, скрипт автоматично використає **ad-hoc signing** (`-`).

Інформацію про режими запуску для розробки, прапорці підписування та усунення проблем із Team ID дивіться в README macOS-застосунку:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Примітка**: Застосунки, підписані ad-hoc, можуть викликати системні запити безпеки. Якщо застосунок одразу аварійно завершується з повідомленням "Abort trap 6", дивіться розділ [Усунення проблем](#troubleshooting).

## 3. Встановіть CLI

macOS-застосунок очікує глобальне встановлення CLI `openclaw` для керування фоновими завданнями.

**Щоб встановити його (рекомендовано):**

1. Відкрийте застосунок OpenClaw.
2. Перейдіть на вкладку налаштувань **General**.
3. Натисніть **"Install CLI"**.

Або встановіть його вручну:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` і `bun add -g openclaw@<version>` також працюють.
Для середовища виконання Gateway Node залишається рекомендованим варіантом.

## Усунення проблем

### Збирання не вдається: невідповідність toolchain або SDK

Збирання macOS-застосунку очікує найновіший macOS SDK і toolchain Swift 6.2.

**Системні залежності (обов’язково):**

- **Остання версія macOS, доступна в Software Update** (потрібна для SDK у Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Перевірки:**

```bash
xcodebuild -version
xcrun swift --version
```

Якщо версії не збігаються, оновіть macOS/Xcode і повторно запустіть збирання.

### Застосунок аварійно завершується під час надання дозволу

Якщо застосунок аварійно завершується, коли ви намагаєтеся дозволити доступ до **Speech Recognition** або **Microphone**, це може бути пов’язано з пошкодженим кешем TCC або невідповідністю підпису.

**Виправлення:**

1. Скиньте дозволи TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Якщо це не допоможе, тимчасово змініть `BUNDLE_ID` у [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), щоб примусово створити "чистий аркуш" з боку macOS.

### Gateway "Starting..." безкінечно

Якщо статус шлюзу залишається на "Starting...", перевірте, чи не утримує порт зомбі-процес:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Якщо порт утримується ручним запуском, зупиніть цей процес (Ctrl+C). У крайньому разі завершіть PID, який ви знайшли вище.
