---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-27T04:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed243fbe421d379ba9b9756b2c63736f70cb9ed20a57299ccbfb8d846611efaa
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає ваш тип встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб переключити канали або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший стабільний реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Дивіться [Канали розробки](/uk/install/development-channels) щодо семантики каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, якщо хочете змінити тип встановлення. Засіб оновлення зберігає ваш стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він змінює лише те, яку інсталяцію коду OpenClaw використовують CLI і Gateway.

```bash
# встановлення npm package -> редагований git checkout
openclaw update --channel dev

# git checkout -> встановлення npm package
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI з цього checkout. Канали `stable` і `beta` використовують встановлення пакетів. Якщо Gateway уже встановлено, `openclaw update` оновлює метадані сервісу та перезапускає його, якщо ви не передали `--no-restart`.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити онбординг. Щоб примусово вибрати конкретний тип встановлення через інсталятор, передайте `--install-method git --no-onboard` або `--install-method npm --no-onboard`.

Якщо `openclaw update` завершується з помилкою після етапу встановлення npm package, повторно запустіть інсталятор. Інсталятор не викликає старий засіб оновлення; він напряму запускає глобальне встановлення пакета і може відновити частково оновлене npm-встановлення.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Щоб зафіксувати відновлення на конкретній версії або dist-tag, додайте `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Альтернатива: вручну через npm, pnpm або bun

```bash
npm i -g openclaw@latest
```

Коли `openclaw update` керує глобальним npm-встановленням, спочатку виконується звичайна команда глобального встановлення. Якщо ця команда завершується з помилкою, OpenClaw повторює спробу один раз із `--omit=optional`. Це допомагає на хостах, де нативні optional-залежності не можуть бути скомпільовані, і при цьому початкова помилка залишається видимою, якщо резервна спроба теж завершується з помилкою.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакетів лише для читання">
    OpenClaw розглядає упаковані глобальні встановлення як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний для запису поточному користувачу. Залежності середовища виконання для вбудованих Plugin розміщуються в доступному для запису каталозі середовища виконання замість зміни дерева пакета. Це не дає `openclaw update` конфліктувати із запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

    Деякі конфігурації npm у Linux встановлюють глобальні пакети в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку схему за допомогою того самого зовнішнього шляху розміщення.
  </Accordion>
  <Accordion title="Посилені systemd unit">
    Укажіть доступний для запису каталог staging, який входить до `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не встановлено, OpenClaw використовує `$STATE_DIRECTORY`, коли його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`. Крок відновлення розглядає цей staging як локальний корінь пакетів, що належить OpenClaw, і ігнорує користувацький npm prefix та глобальні налаштування, тому конфігурація npm для глобального встановлення не перенаправляє залежності середовища виконання вбудованих Plugin у `~/node_modules` або дерево глобального пакета.
  </Accordion>
  <Accordion title="Попередня перевірка місця на диску">
    Перед оновленнями пакетів і відновленням вбудованих залежностей середовища виконання OpenClaw намагається виконати перевірку вільного місця для цільового тому в режимі best-effort. Нестача місця створює попередження з перевіреним шляхом, але не блокує оновлення, оскільки файлові квоти, знімки та мережеві томи можуть змінитися після перевірки. Фактичні встановлення npm, копіювання та перевірка після встановлення залишаються авторитетним джерелом істини.
  </Accordion>
  <Accordion title="Залежності середовища виконання вбудованих Plugin">
    Упаковані встановлення зберігають залежності середовища виконання вбудованих Plugin поза деревом пакета лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності середовища виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовим значенням у своєму вбудованому маніфесті. Сам по собі збережений стан автентифікації каналу не запускає відновлення залежностей середовища виконання під час запуску Gateway.

    Явне вимкнення має пріоритет. Вимкнений Plugin або канал не отримує відновлення залежностей середовища виконання лише тому, що він існує в пакеті. Зовнішні Plugin і власні шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.
  </Accordion>
</AccordionGroup>

## Автооновлювач

Автооновлювач вимкнений за замовчуванням. Увімкніть його в `~/.openclaw/openclaw.json`:

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
| `stable` | Очікує `stableDelayHours`, а потім застосовує з детермінованим jitter у межах `stableJitterHours` (поступове розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно. |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну. |

Gateway також записує підказку про оновлення під час запуску (вимкнути можна через `update.checkOnStart: false`).

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

<Tip>
`npm view openclaw version` показує поточну опубліковану версію.
</Tip>

### Зафіксувати commit (вихідний код)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Щоб повернутися до latest: `git checkout main && git pull`.

## Якщо ви застрягли

- Ще раз запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` у source checkout засіб оновлення автоматично завантажує `pnpm`, коли це потрібно. Якщо ви бачите помилку bootstrap `pnpm`/corepack, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Дивіться: [Усунення проблем](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі методи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції для основних версій.
