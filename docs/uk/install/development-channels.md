---
read_when:
    - Ви хочете перемикатися між stable/beta/dev
    - Ви хочете зафіксувати конкретну версію, тег або SHA
    - Ви виконуєте тегування або публікацію prerelease
sidebarTitle: Release Channels
summary: 'Стабільний, beta та dev канали: семантика, перемикання, фіксація версії та тегування'
title: Канали релізів
x-i18n:
    generated_at: "2026-04-05T18:06:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Канали розробки

OpenClaw постачається з трьома каналами оновлень:

- **stable**: npm dist-tag `latest`. Рекомендовано для більшості користувачів.
- **beta**: npm dist-tag `beta`, коли він актуальний; якщо beta відсутній або старіший за
  найновіший stable-реліз, потік оновлення повертається до `latest`.
- **dev**: рухома вершина `main` (git). npm dist-tag: `dev` (коли опубліковано).
  Гілка `main` призначена для експериментів і активної розробки. Вона може містити
  незавершені функції або несумісні зміни. Не використовуйте її для production gateway.

Зазвичай ми спочатку випускаємо stable-збірки в **beta**, тестуємо їх там, а потім виконуємо
явний крок просування, який переміщує перевірену збірку до `latest` без
зміни номера версії. За потреби maintainers також можуть опублікувати stable-реліз
безпосередньо в `latest`. Dist-tags є джерелом істини для встановлень через npm.

## Перемикання каналів

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` зберігає ваш вибір у конфігурації (`update.channel`) і узгоджує
метод встановлення:

- **`stable`** (package-встановлення): оновлення через npm dist-tag `latest`.
- **`beta`** (package-встановлення): надає перевагу npm dist-tag `beta`, але повертається до
  `latest`, коли `beta` відсутній або старіший за поточний stable-тег.
- **`stable`** (git-встановлення): виконує checkout найновішого stable git-тега.
- **`beta`** (git-встановлення): надає перевагу найновішому beta git-тегу, але повертається до
  найновішого stable git-тега, коли beta відсутній або старіший.
- **`dev`**: забезпечує git checkout (типово `~/openclaw`, перевизначається через
  `OPENCLAW_GIT_DIR`), перемикається на `main`, виконує rebase на upstream, збирає й
  встановлює глобальний CLI із цього checkout.

Порада: якщо ви хочете stable + dev паралельно, тримайте два clones і вкажіть
вашому gateway використовувати stable.

## Одноразове націлення на версію або тег

Використовуйте `--tag`, щоб націлитися на конкретний dist-tag, версію або package spec для одного
оновлення **без** зміни вашого збереженого каналу:

```bash
# Встановити конкретну версію
openclaw update --tag 2026.4.1-beta.1

# Встановити з beta dist-tag (одноразово, не зберігається)
openclaw update --tag beta

# Встановити з GitHub main branch (npm tarball)
openclaw update --tag main

# Встановити конкретний npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Примітки:

- `--tag` застосовується **лише до package-встановлень (npm)**. Git-встановлення його ігнорують.
- Тег не зберігається. Ваш наступний `openclaw update` використовуватиме
  налаштований канал, як зазвичай.
- Захист від downgrade: якщо цільова версія старіша за поточну версію,
  OpenClaw попросить підтвердження (пропустити можна через `--yes`).
- `--channel beta` відрізняється від `--tag beta`: потік каналу може повернутися
  до stable/latest, коли beta відсутній або старіший, тоді як `--tag beta` націлюється на
  сирий `beta` dist-tag лише для цього одного запуску.

## Сухий запуск

Перегляньте, що зробить `openclaw update`, не вносячи змін:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Сухий запуск показує ефективний канал, цільову версію, заплановані дії та
чи буде потрібне підтвердження downgrade.

## Plugins і канали

Коли ви перемикаєте канали через `openclaw update`, OpenClaw також синхронізує джерела
plugins:

- `dev` надає перевагу вбудованим plugins із git checkout.
- `stable` і `beta` відновлюють package plugins, встановлені через npm.
- Plugins, установлені через npm, оновлюються після завершення оновлення core.

## Перевірка поточного стану

```bash
openclaw update status
```

Показує активний канал, тип встановлення (git або package), поточну версію та
джерело (config, git tag, git branch або значення за замовчуванням).

## Найкращі практики тегування

- Тегуйте релізи, на які мають потрапляти git checkout (`vYYYY.M.D` для stable,
  `vYYYY.M.D-beta.N` для beta).
- `vYYYY.M.D.beta.N` також розпізнається для сумісності, але надавайте перевагу `-beta.N`.
- Застарілі теги `vYYYY.M.D-<patch>` усе ще розпізнаються як stable (не-beta).
- Зберігайте теги незмінними: ніколи не переміщуйте й не використовуйте тег повторно.
- npm dist-tags залишаються джерелом істини для встановлень через npm:
  - `latest` -> stable
  - `beta` -> кандидат у збірку або stable-збірка, спочатку випущена в beta
  - `dev` -> snapshot `main` (необов’язково)

## Доступність macOS app

Збірки beta та dev можуть **не** містити релізу macOS app. Це нормально:

- Git-тег і npm dist-tag усе одно можуть бути опубліковані.
- Зазначайте "no macOS build for this beta" у примітках до релізу або changelog.
