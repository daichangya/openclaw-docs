---
read_when:
    - Вибір шляху онбордингу
    - Налаштування нового середовища
sidebarTitle: Onboarding Overview
summary: Огляд варіантів і процесів онбордингу OpenClaw
title: Огляд онбордингу
x-i18n:
    generated_at: "2026-04-24T04:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw має два шляхи онбордингу. Обидва налаштовують автентифікацію, Gateway і
необов’язкові chat channels — вони відрізняються лише тим, як ви взаємодієте з налаштуванням.

## Який шлях варто вибрати?

|                | Онбординг CLI                          | Онбординг застосунку macOS |
| -------------- | -------------------------------------- | -------------------------- |
| **Платформи**  | macOS, Linux, Windows (нативно або WSL2) | лише macOS               |
| **Інтерфейс**  | Майстер у терміналі                    | Керований UI у застосунку  |
| **Найкраще для** | Серверів, headless, повного контролю | Настільного Mac, візуального налаштування |
| **Автоматизація** | `--non-interactive` для скриптів    | Лише вручну                |
| **Команда**    | `openclaw onboard`                     | Запустіть застосунок       |

Більшості користувачів варто починати з **онбордингу CLI** — він працює всюди й дає
вам найбільший контроль.

## Що налаштовує онбординг

Незалежно від того, який шлях ви виберете, онбординг налаштовує:

1. **Провайдер моделі та автентифікацію** — ключ API, OAuth або setup token для вибраного провайдера
2. **Workspace** — каталог для файлів agent, bootstrap templates і пам’яті
3. **Gateway** — порт, адреса bind, режим автентифікації
4. **Channels** (необов’язково) — вбудовані й bundled chat channels, такі як
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp та інші
5. **Daemon** (необов’язково) — фоновий сервіс, щоб Gateway запускався автоматично

## Онбординг CLI

Запустіть у будь-якому терміналі:

```bash
openclaw onboard
```

Додайте `--install-daemon`, щоб також установити фоновий сервіс за один крок.

Повна довідка: [Onboarding (CLI)](/uk/start/wizard)
Документація команди CLI: [`openclaw onboard`](/uk/cli/onboard)

## Онбординг застосунку macOS

Відкрийте застосунок OpenClaw. Майстер першого запуску проведе вас через ті самі кроки
у візуальному інтерфейсі.

Повна довідка: [Onboarding (macOS App)](/uk/start/onboarding)

## Власні або неперелічені провайдери

Якщо вашого провайдера немає в списку онбордингу, виберіть **Custom Provider** і
введіть:

- Режим сумісності API (OpenAI-compatible, Anthropic-compatible або auto-detect)
- Base URL і ключ API
- ID моделі та необов’язковий alias

Кілька власних endpoint можуть співіснувати — кожен отримає власний endpoint ID.

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [Довідка з налаштування CLI](/uk/start/wizard-cli-reference)
