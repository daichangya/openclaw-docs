---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-25T01:02:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає тип вашого встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канали або вказати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший stable-реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Перегляньте [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

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

OpenClaw розглядає упаковані глобальні встановлення як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний на запис для поточного користувача. Залежності середовища виконання для вбудованих Plugin розміщуються в каталозі середовища виконання з правом запису замість зміни дерева пакетів. Це запобігає конфлікту `openclaw update` із запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

У деяких конфігураціях Linux npm глобальні пакети встановлюються в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему через той самий зовнішній шлях розміщення.

Для захищених модулів systemd задайте каталог розміщення з правом запису, який включено до `ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, якщо його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`.

### Залежності середовища виконання для вбудованих Plugin

Упаковані встановлення зберігають залежності середовища виконання для вбудованих Plugin поза деревом пакетів, доступним лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналів або увімкнені типовим значенням у своєму вбудованому маніфесті.

Явне вимкнення має пріоритет. Для вимкненого Plugin або каналу залежності середовища виконання не відновлюються лише тому, що він існує в пакеті. Зовнішні Plugin і користувацькі шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

## Автооновлювач

Автооновлювач вимкнено за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

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

| Канал | Поведінка |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Чекає `stableDelayHours`, а потім застосовує з детермінованим зміщенням у межах `stableJitterHours` (поступове розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно. |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну. |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM і перевіряє стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

### Зафіксувати версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Порада: `npm view openclaw version` показує поточну опубліковану версію.

### Зафіксувати коміт (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до latest: `git checkout main && git pull`.

## Якщо ви не можете просунутися далі

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у вихідних checkout-ах оновлювач автоматично завантажує `pnpm`, якщо потрібно. Якщо ви бачите помилку завантаження pnpm/corepack, установіть `pnpm` вручну (або знову увімкніть `corepack`) і повторно запустіть оновлення.
- Перегляньте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install) — усі способи встановлення
- [Doctor](/uk/gateway/doctor) — перевірки стану після оновлень
- [Міграція](/uk/install/migrating) — посібники з міграції між основними версіями
