---
read_when:
    - Оновлення OpenClaw
    - Щось зламалося після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з джерел), а також стратегія rollback
title: Оновлення
x-i18n:
    generated_at: "2026-04-05T18:08:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Оновлення

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає тип встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає gateway.

```bash
openclaw update
```

Щоб змінити канал або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # перегляд без застосування
```

`--channel beta` віддає перевагу beta, але runtime повертається до stable/latest, якщо
тег beta відсутній або старіший за останній stable release. Використовуйте `--tag beta`,
якщо вам потрібен сирий npm beta dist-tag для одноразового оновлення пакета.

Семантику каналів див. в [Канали розробки](/install/development-channels).

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити onboarding. Для інсталяцій із вихідного коду передайте `--install-method git --no-onboard`.

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

## Auto-updater

Auto-updater типово вимкнено. Увімкніть його в `~/.openclaw/openclaw.json`:

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

| Канал    | Поведінка                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Чекає `stableDelayHours`, потім застосовує з детермінованим jitter у межах `stableJitterHours` (розподілене розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно.                              |
| `dev`    | Автоматичного застосування немає. Використовуйте `openclaw update` вручну.                                     |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики приватних повідомлень і стан gateway. Докладніше: [Doctor](/gateway/doctor)

### Перезапустіть gateway

```bash
openclaw gateway restart
```

### Перевірте

```bash
openclaw health
```

</Steps>

## Rollback

### Зафіксуйте версію (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Порада: `npm view openclaw version` показує поточну опубліковану версію.

### Зафіксуйте commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до latest: `git checkout main && git pull`.

## Якщо ви застрягли

- Ще раз запустіть `openclaw doctor` і уважно прочитайте вивід.
- Перевірте: [Усунення несправностей](/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/install) — усі способи встановлення
- [Doctor](/gateway/doctor) — перевірки стану після оновлень
- [Міграція](/install/migrating) — посібники з міграції між основними версіями
