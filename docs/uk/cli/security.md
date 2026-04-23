---
read_when:
    - Ви хочете виконати швидкий аудит безпеки конфігурації/стану
    - Ви хочете застосувати безпечні пропозиції щодо «виправлення» (дозволи, жорсткіші типові налаштування)
summary: Довідка CLI для `openclaw security` (аудит і виправлення поширених проблемних місць безпеки)
title: security
x-i18n:
    generated_at: "2026-04-23T06:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Інструменти безпеки (аудит + необов’язкові виправлення).

Пов’язане:

- Посібник із безпеки: [Security](/uk/gateway/security)

## Аудит

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Аудит попереджає, коли кілька відправників приватних повідомлень використовують спільну основну сесію, і рекомендує **безпечний режим DM**: `session.dmScope="per-channel-peer"` (або `per-account-channel-peer` для багатокористувацьких каналів) для спільних inbox.
Це призначено для посилення захисту кооперативних/спільних inbox. Один Gateway, спільний для операторів, які не довіряють одне одному або є потенційно ворожими, не є рекомендованою конфігурацією; розділяйте межі довіри за допомогою окремих Gateway (або окремих користувачів ОС/хостів).
Він також виводить `security.trust_model.multi_user_heuristic`, коли конфігурація вказує на ймовірний спільний вхід від користувачів (наприклад, відкриту політику DM/груп, налаштовані групові цілі або wildcard-правила для відправників), і нагадує, що за замовчуванням OpenClaw використовує модель довіри персонального помічника.
Для навмисних конфігурацій зі спільним доступом користувачів рекомендації аудиту полягають у тому, щоб ізолювати всі сесії, обмежити доступ до файлової системи межами workspace і не використовувати в цьому runtime особисті/приватні ідентичності чи облікові дані.
Він також попереджає, коли малі моделі (`<=300B`) використовуються без sandbox і з увімкненими інструментами web/browser.
Для webhook-входу він попереджає, коли `hooks.token` повторно використовує токен Gateway, коли `hooks.token` закороткий, коли `hooks.path="/"`, коли `hooks.defaultSessionKey` не задано, коли `hooks.allowedAgentIds` не обмежено, коли ввімкнено перевизначення `sessionKey` із запиту, а також коли перевизначення ввімкнено без `hooks.allowedSessionKeyPrefixes`.
Він також попереджає, коли налаштовано параметри sandbox Docker, але режим sandbox вимкнено, коли `gateway.nodes.denyCommands` використовує неефективні pattern-подібні/невідомі записи (лише точне зіставлення імен команд node, а не фільтрація shell-тексту), коли `gateway.nodes.allowCommands` явно вмикає небезпечні команди node, коли глобальне `tools.profile="minimal"` перевизначається профілями інструментів агента, коли відкриті групи відкривають доступ до runtime/filesystem-інструментів без захисту sandbox/workspace і коли інструменти встановлених plugin можуть бути доступні за надто дозволяючої політики інструментів.
Він також позначає `gateway.allowRealIpFallback=true` (ризик підміни заголовків, якщо проксі налаштовано неправильно) і `discovery.mdns.mode="full"` (витік метаданих через записи mDNS TXT).
Він також попереджає, коли браузер sandbox використовує мережу Docker `bridge` без `sandbox.browser.cdpSourceRange`.
Він також позначає небезпечні режими мережі sandbox Docker (зокрема `host` і приєднання до просторів імен `container:*`).
Він також попереджає, коли наявні Docker-контейнери браузера sandbox мають відсутні/застарілі hash-мітки (наприклад, контейнери до міграції без `openclaw.browserConfigEpoch`) і рекомендує `openclaw sandbox recreate --browser --all`.
Він також попереджає, коли записи встановлення plugin/hook на основі npm не зафіксовані, не мають метаданих цілісності або розходяться з поточно встановленими версіями пакетів.
Він попереджає, коли allowlist каналів спираються на змінні імена/email/tag замість стабільних ID (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, області IRC, де застосовно).
Він попереджає, коли `gateway.auth.mode="none"` залишає HTTP API Gateway доступними без спільного секрету (`/tools/invoke` плюс будь-який увімкнений endpoint `/v1/*`).
Параметри з префіксами `dangerous`/`dangerously` — це явні операторські перевизначення break-glass; саме по собі ввімкнення такого параметра не є повідомленням про вразливість безпеки.
Повний перелік небезпечних параметрів див. в розділі "Insecure or dangerous flags summary" у [Security](/uk/gateway/security).

Поведінка SecretRef:

- `security audit` визначає підтримувані SecretRef у режимі лише читання для своїх цільових шляхів.
- Якщо SecretRef недоступний у поточному шляху команди, аудит триває і повідомляє `secretDiagnostics` (замість аварійного завершення).
- `--token` і `--password` перевизначають автентифікацію deep-probe лише для цього виклику команди; вони не переписують конфігурацію або зіставлення SecretRef.

## Вивід JSON

Використовуйте `--json` для перевірок CI/політик:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Якщо `--fix` і `--json` поєднано, вивід містить і дії виправлення, і фінальний звіт:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Що змінює `--fix`

`--fix` застосовує безпечні, детерміновані виправлення:

- змінює поширене `groupPolicy="open"` на `groupPolicy="allowlist"` (зокрема варіанти облікових записів у підтримуваних каналах)
- коли політика груп WhatsApp змінюється на `allowlist`, ініціалізує `groupAllowFrom` із
  збереженого файла `allowFrom`, якщо цей список існує і конфігурація ще не
  визначає `allowFrom`
- змінює `logging.redactSensitive` з `"off"` на `"tools"`
- посилює дозволи для стану/конфігурації та поширених чутливих файлів
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- також посилює дозволи для файлів include конфігурації, на які посилається `openclaw.json`
- використовує `chmod` на POSIX-хостах і скидання `icacls` у Windows

`--fix` **не**:

- змінює токени/паролі/API-ключі
- вимикає інструменти (`gateway`, `cron`, `exec` тощо)
- змінює параметри bind/auth/network exposure Gateway
- видаляє або переписує plugins/Skills
