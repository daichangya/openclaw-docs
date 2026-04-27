---
read_when:
    - Оновлення OpenClaw
    - Щось ламається після оновлення
summary: Безпечне оновлення OpenClaw (глобальне встановлення або з вихідного коду), а також стратегія відкату
title: Оновлення
x-i18n:
    generated_at: "2026-04-27T09:03:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f0ab7bf825068a5e2590011faab637d3ffe8d475f1737051d1726c93316af2a
    source_path: install/updating.md
    workflow: 15
---

Підтримуйте OpenClaw в актуальному стані.

## Рекомендовано: `openclaw update`

Найшвидший спосіб оновлення. Команда визначає ваш тип встановлення (npm або git), отримує найновішу версію, запускає `openclaw doctor` і перезапускає Gateway.

```bash
openclaw update
```

Щоб перемкнути канали або вибрати конкретну версію:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # попередній перегляд без застосування
```

`--channel beta` надає перевагу beta, але середовище виконання повертається до stable/latest, якщо тег beta відсутній або старіший за найновіший stable-реліз. Використовуйте `--tag beta`, якщо вам потрібен сирий npm dist-tag beta для одноразового оновлення пакета.

Перегляньте [Канали розробки](/uk/install/development-channels), щоб дізнатися про семантику каналів.

## Перемикання між встановленнями npm і git

Використовуйте канали, якщо хочете змінити тип встановлення. Засіб оновлення зберігає ваш стан, конфігурацію, облікові дані та робочий простір у `~/.openclaw`; він змінює лише те, яку інсталяцію коду OpenClaw використовують CLI і Gateway.

```bash
# встановлення пакета npm -> редагований git checkout
openclaw update --channel dev

# git checkout -> встановлення пакета npm
openclaw update --channel stable
```

Спочатку запустіть із `--dry-run`, щоб переглянути точне перемикання режиму встановлення:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Канал `dev` забезпечує git checkout, збирає його та встановлює глобальний CLI з цього checkout. Канали `stable` і `beta` використовують встановлення пакетів. Якщо Gateway уже встановлено, `openclaw update` оновлює метадані служби та перезапускає її, якщо ви не передасте `--no-restart`.

## Альтернатива: повторно запустити інсталятор

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Додайте `--no-onboard`, щоб пропустити онбординг. Щоб примусово вибрати конкретний тип встановлення через інсталятор, передайте `--install-method git --no-onboard` або `--install-method npm --no-onboard`.

Якщо `openclaw update` завершується з помилкою після етапу встановлення npm-пакета, повторно запустіть інсталятор. Інсталятор не викликає старий засіб оновлення; він напряму виконує глобальне встановлення пакета й може відновити частково оновлене npm-встановлення.

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

Коли `openclaw update` керує глобальним npm-встановленням, спочатку він запускає звичайну команду глобального встановлення. Якщо ця команда завершується помилкою, OpenClaw повторює спробу один раз із `--omit=optional`. Така повторна спроба допомагає на хостах, де нативні optional-залежності не можуть бути скомпільовані, водночас зберігаючи видимість початкової помилки, якщо запасний варіант теж завершується невдачею.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Розширені теми встановлення npm

<AccordionGroup>
  <Accordion title="Дерево пакетів лише для читання">
    OpenClaw розглядає глобальні встановлення з пакета як доступні лише для читання під час виконання, навіть якщо каталог глобального пакета доступний на запис для поточного користувача. Вбудовані залежності часу виконання Plugin розміщуються в доступному для запису каталозі часу виконання замість зміни дерева пакетів. Це запобігає конфлікту `openclaw update` із запущеним Gateway або локальним агентом, який відновлює залежності Plugin під час того самого встановлення.

    У деяких конфігураціях npm на Linux глобальні пакети встановлюються в каталоги, що належать root, наприклад `/usr/lib/node_modules/openclaw`. OpenClaw підтримує таку структуру за допомогою того самого зовнішнього шляху розміщення.

  </Accordion>
  <Accordion title="Захищені systemd units">
    Вкажіть доступний для запису каталог stage, який включено до `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` також приймає список шляхів. OpenClaw визначає вбудовані залежності часу виконання Plugin зліва направо за вказаними кореневими каталогами, розглядає попередні корені як попередньо встановлені шари лише для читання та встановлює або відновлює щось лише в останній кореневий каталог, доступний для запису:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Якщо `OPENCLAW_PLUGIN_STAGE_DIR` не задано, OpenClaw використовує `$STATE_DIRECTORY`, коли його надає systemd, а потім повертається до `~/.openclaw/plugin-runtime-deps`. Крок відновлення розглядає цей stage як локальний корінь пакетів, яким керує OpenClaw, і ігнорує користувацькі налаштування npm prefix та global, тому конфігурація npm для глобального встановлення не перенаправляє вбудовані залежності Plugin до `~/node_modules` або дерева глобальних пакетів.

  </Accordion>
  <Accordion title="Попередня перевірка дискового простору">
    Перед оновленням пакетів і відновленням вбудованих залежностей часу виконання OpenClaw намагається виконати перевірку дискового простору для цільового тому в режимі best-effort. Нестача місця призводить до попередження з перевіреним шляхом, але не блокує оновлення, оскільки квоти файлової системи, знімки та мережеві томи можуть змінитися після перевірки. Фактичні кроки встановлення npm, копіювання та перевірки після встановлення залишаються визначальними.
  </Accordion>
  <Accordion title="Вбудовані залежності часу виконання Plugin">
    У встановленнях із пакета вбудовані залежності часу виконання Plugin зберігаються поза деревом пакетів лише для читання. Під час запуску та під час `openclaw doctor --fix` OpenClaw відновлює залежності часу виконання лише для тих вбудованих Plugin, які активні в конфігурації, активні через застарілу конфігурацію каналу або ввімкнені типовим значенням у їхньому вбудованому маніфесті. Сам по собі збережений стан автентифікації каналу не запускає відновлення залежностей часу виконання під час старту Gateway.

    Явне вимкнення має пріоритет. Вимкнений Plugin або канал не отримує відновлення залежностей часу виконання лише тому, що він існує в пакеті. Зовнішні Plugin і власні шляхи завантаження, як і раніше, використовують `openclaw plugins install` або `openclaw plugins update`.

  </Accordion>
</AccordionGroup>

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

| Канал | Поведінка |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Очікує `stableDelayHours`, а потім застосовує з детермінованим jitter у межах `stableJitterHours` (поступове розгортання). |
| `beta`   | Перевіряє кожні `betaCheckIntervalHours` (типово: щогодини) і застосовує негайно. |
| `dev`    | Автоматичне застосування відсутнє. Використовуйте `openclaw update` вручну. |

Gateway також записує підказку про оновлення під час запуску (вимикається через `update.checkOnStart: false`).
Для пониження версії або відновлення після інциденту встановіть `OPENCLAW_NO_AUTO_UPDATE=1` у середовищі Gateway, щоб заблокувати автоматичне застосування, навіть якщо налаштовано `update.auto.enabled`. Підказки про оновлення під час запуску все одно можуть виконуватися, якщо також не вимкнено `update.checkOnStart`.

## Після оновлення

<Steps>

### Запустіть doctor

```bash
openclaw doctor
```

Мігрує конфігурацію, перевіряє політики DM та стан Gateway. Докладніше: [Doctor](/uk/gateway/doctor)

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

Щоб повернутися до найновішої версії: `git checkout main && git pull`.

## Якщо ви застрягли

- Знову запустіть `openclaw doctor` і уважно прочитайте вивід.
- Для `openclaw update --channel dev` на checkout із вихідним кодом засіб оновлення автоматично завантажує `pnpm`, якщо це потрібно. Якщо ви бачите помилку початкового налаштування pnpm/corepack, установіть `pnpm` вручну (або знову ввімкніть `corepack`) і повторно запустіть оновлення.
- Перевірте: [Усунення несправностей](/uk/gateway/troubleshooting)
- Запитайте в Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Пов’язане

- [Огляд встановлення](/uk/install): усі способи встановлення.
- [Doctor](/uk/gateway/doctor): перевірки стану після оновлень.
- [Міграція](/uk/install/migrating): посібники з міграції між основними версіями.
