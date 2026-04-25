---
read_when:
    - Оновлення OpenClaw
    - Після оновлення щось ламається
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-25T20:13:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: edb0fb8514130fbac2d5300dbfef85b8cfea8fafb80cc644eb9054f94131a6d4
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає тип встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб переключити канал або вказати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` віддає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший стабільний реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Семантику каналів дивіться в [Канали розробки](/uk/install/development-channels).

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити онбординг. Для встановлень із вихідного коду передайте `--install-method git --no-onboard`.

## Альтернатива: вручну через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Глобальні встановлення npm і залежності середовища виконання

OpenClaw розглядає пакетні глобальні встановлення як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний на запис для поточного користувача. Залежності середовища виконання для вбудованих Plugin розміщуються у доступному для запису каталозі середовища виконання замість зміни дерева пакета. Це запобігає ситуації, коли `openclaw update` конфліктує з уже запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

У деяких конфігураціях Linux npm глобальні пакети встановлюються в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему через той самий зовнішній шлях розміщення.

Для захищених модулів systemd задайте каталог розміщення з доступом на запис, який включено до `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, якщо його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`.
Під час відновлення цей каталог розміщення розглядається як локальний кореневий каталог пакета, керований OpenClaw, і ігноруються користувацькі налаштування npm prefix/global, тому конфігурація npm для глобального встановлення не перенаправляє залежності середовища виконання вбудованих Plugin до `~/node_modules` або дерева глобального пакета.

### Залежності середовища виконання вбудованих Plugin

У пакетних встановленнях залежності середовища виконання вбудованих Plugin зберігаються поза деревом пакета, доступним лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або увімкнені типовим значенням у своєму вбудованому маніфесті.

Явне вимкнення має пріоритет. Для вимкненого Plugin або каналу залежності середовища виконання не відновлюються лише тому, що він існує в пакеті. Зовнішні Plugin і власні шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

## Автооновлювач

Автооновлювач за замовчуванням вимкнено. Увімкніть його в `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Канал    | Поведінка                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Чекає `stableDelayHours`, а потім застосовує з детермінованим зміщенням у межах `stableJitterHours` (поступове розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                            |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну.                                  |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і стан Gateway. Подробиці: [Doctor](/uk/gateway/doctor)

### Перезапустіть Gateway

```bash
openclaw gateway restart
```

### Перевірте

```bash
openclaw health
```

</Steps>

## Відкат

### Зафіксуйте версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Порада: `npm view openclaw version` показує поточну опубліковану версію.

### Зафіксуйте коміт (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви не можете просунутися далі

- Ще раз запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у checkout із вихідного коду засіб оновлення автоматично завантажує `pnpm`, коли це потрібно. Якщо з’являється помилка початкового налаштування pnpm/corepack, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Дивіться: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Doctor](/uk/gateway/doctor) — перевірки стану після оновлень
- [Міграція](/uk/install/migrating) — посібники з міграції між основними версіями
