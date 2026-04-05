---
read_when:
    - Запуск або налаштування онбордингу CLI
    - Налаштування нової машини
sidebarTitle: 'Onboarding: CLI'
summary: 'Онбординг CLI: покрокове налаштування gateway, робочого простору, каналів і Skills'
title: Онбординг (CLI)
x-i18n:
    generated_at: "2026-04-05T18:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81e33fb4f8be30e7c2c6e0024bf9bdcf48583ca58eaf5fff5afd37a1cd628523
    source_path: start/wizard.md
    workflow: 15
---

# Онбординг (CLI)

Онбординг CLI — це **рекомендований** спосіб налаштування OpenClaw на macOS,
Linux або Windows (через WSL2; настійно рекомендується).
Він налаштовує локальний Gateway або підключення до віддаленого Gateway, а також канали, Skills
і типові параметри робочого простору в одному покроковому сценарії.

```bash
openclaw onboard
```

<Info>
Найшвидший перший чат: відкрийте Control UI (налаштування каналів не потрібне). Запустіть
`openclaw dashboard` і спілкуйтеся в браузері. Документація: [Dashboard](/web/dashboard).
</Info>

Щоб пізніше змінити налаштування:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>

<Tip>
Онбординг CLI містить крок вебпошуку, де ви можете вибрати провайдера,
наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG або Tavily. Деякі провайдери потребують
API key, а інші працюють без ключа. Ви також можете налаштувати це пізніше за допомогою
`openclaw configure --section web`. Документація: [Web tools](/tools/web).
</Tip>

## QuickStart проти Advanced

Онбординг починається з вибору **QuickStart** (типові параметри) або **Advanced** (повний контроль).

<Tabs>
  <Tab title="QuickStart (типові параметри)">
    - Локальний gateway (loopback)
    - Типовий робочий простір (або наявний робочий простір)
    - Порт gateway **18789**
    - Автентифікація gateway **Token** (генерується автоматично, навіть на loopback)
    - Типова політика інструментів для нових локальних налаштувань: `tools.profile: "coding"` (наявний явно заданий профіль зберігається)
    - Типова ізоляція DM: локальний онбординг записує `session.dmScope: "per-channel-peer"`, якщо значення не задано. Докладніше: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals)
    - Доступ через Tailscale **Вимкнено**
    - Для Telegram і WhatsApp DM за замовчуванням використовується **allowlist** (вам запропонують ввести свій номер телефону)
  </Tab>
  <Tab title="Advanced (повний контроль)">
    - Показує кожен крок (режим, робочий простір, gateway, канали, демон, Skills).
  </Tab>
</Tabs>

## Що налаштовує онбординг

**Локальний режим (типовий)** проводить вас через такі кроки:

1. **Model/Auth** — виберіть будь-який підтримуваний потік провайдера/автентифікації (API key, OAuth або специфічну для провайдера ручну автентифікацію), включно з Custom Provider
   (сумісний з OpenAI, сумісний з Anthropic або Unknown auto-detect). Виберіть типову модель.
   Примітка з безпеки: якщо цей агент запускатиме інструменти або оброблятиме вміст webhook/hooks, віддавайте перевагу найсильнішій доступній моделі останнього покоління та дотримуйтеся суворої політики інструментів. Слабші/старіші рівні легше піддаються prompt injection.
   Для неінтерактивних запусків `--secret-input-mode ref` зберігає env-backed ref у профілях автентифікації замість простих текстових значень API key.
   У неінтерактивному режимі `ref` env var провайдера має бути встановлено; передавання inline key flags без цього env var одразу завершується помилкою.
   В інтерактивних запусках вибір режиму secret reference дозволяє вказати або на environment variable, або на налаштований ref провайдера (`file` або `exec`), зі швидкою попередньою перевіркою перед збереженням.
   Для Anthropic інтерактивний onboarding/configure пропонує **Anthropic Claude CLI** як локальний резервний варіант і **Anthropic API key** як рекомендований шлях для production. Anthropic setup-token також знову доступний як застарілий/ручний шлях OpenClaw, з очікуванням специфічного для OpenClaw тарифікаційного режиму Anthropic **Extra Usage**.
2. **Workspace** — розташування для файлів агента (типово `~/.openclaw/workspace`). Ініціалізує bootstrap-файли.
3. **Gateway** — порт, bind address, режим автентифікації, доступ через Tailscale.
   В інтерактивному режимі token ви можете вибрати типове зберігання plaintext token або перейти на SecretRef.
   Шлях SecretRef token у неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
4. **Channels** — вбудовані та комплектні канали чату, такі як BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp та інші.
5. **Daemon** — установлює LaunchAgent (macOS), systemd user unit (Linux/WSL2) або нативне Windows Scheduled Task із резервним варіантом per-user Startup-folder.
   Якщо для token auth потрібен токен і `gateway.auth.token` керується через SecretRef, установлення демона перевіряє його, але не зберігає розв’язаний токен у метаданих середовища сервісу супервізора.
   Якщо для token auth потрібен токен, а налаштований token SecretRef не розв’язується, установлення демона блокується з практичними вказівками.
   Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення демона блокується, доки режим не буде явно встановлено.
6. **Health check** — запускає Gateway і перевіряє, що він працює.
7. **Skills** — установлює рекомендовані Skills і необов’язкові залежності.

<Note>
Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Reset** (або не передасте `--reset`).
Для CLI `--reset` за замовчуванням охоплює config, credentials і sessions; використовуйте `--reset-scope full`, щоб також включити workspace.
Якщо config недійсний або містить застарілі ключі, онбординг попросить вас спочатку запустити `openclaw doctor`.
</Note>

**Віддалений режим** лише налаштовує локальний клієнт для підключення до Gateway в іншому місці.
Він **не** встановлює і **не** змінює нічого на віддаленому хості.

## Додати ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власним робочим простором,
сесіями та профілями автентифікації. Запуск без `--workspace` запускає онбординг.

Що це встановлює:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Типові робочі простори мають формат `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (онбординг може це зробити).
- Прапори неінтерактивного режиму: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Повна довідка

Детальні покрокові описи та вихідні config дивіться в
[CLI Setup Reference](/start/wizard-cli-reference).
Неінтерактивні приклади дивіться в [CLI Automation](/start/wizard-cli-automation).
Глибшу технічну довідку, включно з деталями RPC, дивіться в
[Onboarding Reference](/reference/wizard).

## Пов’язана документація

- Довідка з команди CLI: [`openclaw onboard`](/cli/onboard)
- Огляд онбордингу: [Onboarding Overview](/start/onboarding-overview)
- Онбординг застосунку macOS: [Onboarding](/start/onboarding)
- Ритуал першого запуску агента: [Agent Bootstrapping](/start/bootstrapping)
