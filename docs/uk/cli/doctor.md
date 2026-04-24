---
read_when:
    - У вас є проблеми з підключенням/автентифікацією, і ви хочете покрокові виправлення
    - Ви оновилися й хочете базову перевірку справності
summary: Довідка CLI для `openclaw doctor` (перевірки стану + покрокові виправлення)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T04:12:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Перевірки стану + швидкі виправлення для gateway і каналів.

Пов’язане:

- Усунення несправностей: [Усунення несправностей](/uk/gateway/troubleshooting)
- Аудит безпеки: [Безпека](/uk/gateway/security)

## Приклади

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Параметри

- `--no-workspace-suggestions`: вимкнути підказки щодо пам’яті/пошуку робочого простору
- `--yes`: приймати типові значення без запитів
- `--repair`: застосувати рекомендовані виправлення без запитів
- `--fix`: псевдонім для `--repair`
- `--force`: застосувати агресивні виправлення, зокрема перезаписати власну конфігурацію сервісу за потреби
- `--non-interactive`: запуск без запитів; лише безпечні міграції
- `--generate-gateway-token`: згенерувати й налаштувати токен gateway
- `--deep`: сканувати системні сервіси на наявність додаткових установок gateway

Примітки:

- Інтерактивні запити (як-от виправлення keychain/OAuth) виконуються лише тоді, коли stdin є TTY і **не** встановлено `--non-interactive`. У безголових запусках (Cron, Telegram, без термінала) запити буде пропущено.
- Продуктивність: неінтерактивні запуски `doctor` пропускають завчасне завантаження Plugin, щоб безголові перевірки стану залишалися швидкими. Інтерактивні сесії, як і раніше, повністю завантажують Plugin, коли перевірці потрібен їхній внесок.
- `--fix` (псевдонім для `--repair`) записує резервну копію в `~/.openclaw/openclaw.json.bak` і видаляє невідомі ключі конфігурації, перелічуючи кожне видалення.
- Перевірки цілісності стану тепер виявляють осиротілі файли транскриптів у каталозі сесій і можуть архівувати їх як `.deleted.<timestamp>`, щоб безпечно звільнити місце.
- Doctor також сканує `~/.openclaw/cron/jobs.json` (або `cron.store`) на наявність застарілих форм завдань Cron і може переписати їх на місці до того, як планувальнику доведеться автоматично нормалізувати їх під час виконання.
- Doctor виправляє відсутні залежності часу виконання для вбудованих Plugin без потреби в доступі на запис до встановленого пакета OpenClaw. Для npm-установок, що належать root, або жорстко налаштованих модулів systemd встановіть `OPENCLAW_PLUGIN_STAGE_DIR` у каталог із доступом на запис, наприклад `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor автоматично мігрує застарілу пласку конфігурацію Talk (`talk.voiceId`, `talk.modelId` та подібні) у `talk.provider` + `talk.providers.<provider>`.
- Повторні запуски `doctor --fix` більше не повідомляють/не застосовують нормалізацію Talk, якщо єдина відмінність — це порядок ключів об’єкта.
- Doctor містить перевірку готовності пошуку в пам’яті й може рекомендувати `openclaw configure --section model`, коли відсутні облікові дані embedding.
- Якщо режим sandbox увімкнено, але Docker недоступний, doctor повідомляє чітке попередження з виправленням (`install Docker` або `openclaw config set agents.defaults.sandbox.mode off`).
- Якщо `gateway.auth.token`/`gateway.auth.password` керуються через SecretRef і недоступні в поточному шляху команди, doctor повідомляє попередження лише для читання і не записує резервні відкриті облікові дані.
- Якщо перевірка SecretRef каналу завершується невдачею під час шляху виправлення, doctor продовжує роботу й повідомляє попередження замість передчасного завершення.
- Автоматичне визначення імен користувачів Telegram для `allowFrom` (`doctor --fix`) вимагає токена Telegram, який можна визначити в поточному шляху команди. Якщо перевірка токена недоступна, doctor повідомляє попередження і пропускає автоматичне визначення під час цього проходу.

## macOS: перевизначення середовища `launchctl`

Якщо ви раніше виконували `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (або `...PASSWORD`), це значення перевизначає ваш файл конфігурації та може спричиняти постійні помилки “unauthorized”.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Doctor gateway](/uk/gateway/doctor)
