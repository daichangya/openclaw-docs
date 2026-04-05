---
read_when:
    - Збирання або підписування налагоджувальних збірок macOS
summary: Кроки підписування для налагоджувальних збірок macOS, створених скриптами пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-04-05T18:10:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Підписування mac (налагоджувальні збірки)

Цей застосунок зазвичай збирається за допомогою [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- встановлює стабільний ідентифікатор пакета для налагодження: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором пакета (перевизначення через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) для підписування основного бінарного файла та пакета застосунку, щоб macOS розпізнавала кожну перебудову як той самий підписаний пакет і зберігала дозволи TCC (сповіщення, спеціальні можливості, запис екрана, мікрофон, мовлення). Для стабільних дозволів використовуйте справжню ідентичність підписування; ad-hoc підписування вмикається лише явно й є крихким (див. [дозволи macOS](/platforms/mac/permissions)).
- за замовчуванням використовує `CODESIGN_TIMESTAMP=auto`; це вмикає довірені часові позначки для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити проставлення часових позначок (офлайнові налагоджувальні збірки).
- додає метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель About могла показувати збірку, git і канал debug/release.
- **Пакування за замовчуванням використовує Node 24**: скрипт запускає TS-збірки та збірку Control UI. Node 22 LTS, наразі `22.14+`, як і раніше підтримується для сумісності.
- читає `SIGN_IDENTITY` зі змінної середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або свій сертифікат Developer ID Application) до конфігурації оболонки, щоб завжди підписувати своїм сертифікатом. Ad-hoc підписування потребує явного ввімкнення через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендується для тестування дозволів).
- після підписування виконує перевірку Team ID і завершується з помилкою, якщо будь-який Mach-O всередині пакета застосунку підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти цю перевірку.

## Використання

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Примітка про ad-hoc підписування

Під час підписування з `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматично вимикає **Hardened Runtime** (`--options runtime`). Це потрібно, щоб запобігти збоям, коли застосунок намагається завантажити вбудовані фреймворки (наприклад, Sparkle), які не мають такого самого Team ID. Ad-hoc підписи також порушують збереження дозволів TCC; кроки відновлення див. у [дозволах macOS](/platforms/mac/permissions).

## Метадані збірки для About

`package-mac-app.sh` позначає пакет такими даними:

- `OpenClawBuildTimestamp`: ISO8601 UTC на момент пакування
- `OpenClawGitCommit`: короткий git-хеш (або `unknown`, якщо недоступний)

Вкладка About зчитує ці ключі, щоб показувати версію, дату збірки, git-коміт і те, чи це налагоджувальна збірка (через `#if DEBUG`). Запускайте пакувальник, щоб оновити ці значення після змін у коді.

## Чому

Дозволи TCC прив’язані до ідентифікатора пакета _та_ підпису коду. Непідписані налагоджувальні збірки зі змінними UUID призводили до того, що macOS забувала видані дозволи після кожної перебудови. Підписування бінарних файлів (ad‑hoc за замовчуванням) і збереження фіксованого ідентифікатора/шляху пакета (`dist/OpenClaw.app`) зберігає дозволи між збірками, повторюючи підхід VibeTunnel.
