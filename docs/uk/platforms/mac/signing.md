---
read_when:
    - Збирання або підписування debug-збірок mac
summary: Кроки підписування для debug-збірок macOS, створених скриптами пакування
title: Підписування macOS
x-i18n:
    generated_at: "2026-04-24T04:17:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# Підписування mac (debug-збірки)

Цей застосунок зазвичай збирається за допомогою [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), який тепер:

- встановлює стабільний ідентифікатор пакета debug: `ai.openclaw.mac.debug`
- записує Info.plist із цим ідентифікатором пакета (перевизначення через `BUNDLE_ID=...`)
- викликає [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh), щоб підписати основний бінарний файл і пакет застосунку, аби macOS розглядала кожну перебудову як той самий підписаний пакет і зберігала дозволи TCC (сповіщення, accessibility, screen recording, мікрофон, мовлення). Для стабільних дозволів використовуйте справжню ідентичність підписування; ad-hoc є необов’язковим і крихким (див. [дозволи macOS](/uk/platforms/mac/permissions)).
- типово використовує `CODESIGN_TIMESTAMP=auto`; це вмикає довірені позначки часу для підписів Developer ID. Установіть `CODESIGN_TIMESTAMP=off`, щоб пропустити позначки часу (офлайнові debug-збірки).
- вбудовує метадані збірки в Info.plist: `OpenClawBuildTimestamp` (UTC) і `OpenClawGitCommit` (короткий хеш), щоб панель About могла показувати збірку, git і канал debug/release.
- **Пакування типово використовує Node 24**: скрипт запускає TS-збірки та збірку Control UI. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
- читає `SIGN_IDENTITY` із середовища. Додайте `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (або ваш сертифікат Developer ID Application) до конфігурації shell, щоб завжди підписувати своїм сертифікатом. Підписування ad-hoc вимагає явного ввімкнення через `ALLOW_ADHOC_SIGNING=1` або `SIGN_IDENTITY="-"` (не рекомендується для тестування дозволів).
- запускає аудит Team ID після підписування й завершується з помилкою, якщо будь-який Mach-O всередині пакета застосунку підписано іншим Team ID. Установіть `SKIP_TEAM_ID_CHECK=1`, щоб обійти це.

## Використання

```bash
# from repo root
scripts/package-mac-app.sh               # автоматично вибирає ідентичність; помилка, якщо нічого не знайдено
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # справжній сертифікат
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (дозволи не зберігатимуться)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # явний ad-hoc (те саме застереження)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # лише для dev: обхід невідповідності Team ID Sparkle
```

### Примітка щодо ad-hoc підписування

Під час підписування з `SIGN_IDENTITY="-"` (ad-hoc) скрипт автоматично вимикає **Hardened Runtime** (`--options runtime`). Це необхідно, щоб запобігти збоям, коли застосунок намагається завантажити вбудовані фреймворки (наприклад, Sparkle), які не мають того самого Team ID. Підписи ad-hoc також порушують збереження дозволів TCC; див. [дозволи macOS](/uk/platforms/mac/permissions), щоб дізнатися про кроки відновлення.

## Метадані збірки для About

`package-mac-app.sh` проставляє в пакеті такі значення:

- `OpenClawBuildTimestamp`: ISO8601 UTC на момент пакування
- `OpenClawGitCommit`: короткий git-хеш (або `unknown`, якщо недоступно)

Вкладка About читає ці ключі, щоб показувати версію, дату збірки, git-коміт і те, чи це debug-збірка (через `#if DEBUG`). Запускайте пакувальник, щоб оновити ці значення після змін коду.

## Чому

Дозволи TCC прив’язані до ідентифікатора пакета _і_ підпису коду. Непідписані debug-збірки зі змінними UUID призводили до того, що macOS забувала надані дозволи після кожної перебудови. Підписування бінарних файлів (типово ad‑hoc) і збереження фіксованого ідентифікатора/шляху пакета (`dist/OpenClaw.app`) зберігає дозволи між збірками, повторюючи підхід VibeTunnel.

## Пов’язане

- [Застосунок macOS](/uk/platforms/macos)
- [Дозволи macOS](/uk/platforms/mac/permissions)
