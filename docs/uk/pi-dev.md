---
read_when:
    - Робота над кодом або тестами інтеграції Pi
    - Запуск специфічних для Pi потоків lint, typecheck і live test
summary: 'Робочий процес розробника для інтеграції Pi: збірка, тестування та перевірка в реальному середовищі'
title: Робочий процес розробки Pi
x-i18n:
    generated_at: "2026-04-05T18:09:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Робочий процес розробки Pi

Цей посібник підсумовує розумний робочий процес для роботи над інтеграцією pi в OpenClaw.

## Перевірка типів і lint

- Типова локальна перевірка: `pnpm check`
- Перевірка збірки: `pnpm build`, якщо зміна може вплинути на результат збірки, пакування або межі lazy-loading/module
- Повна перевірка перед злиттям для значних змін у Pi: `pnpm check && pnpm test`

## Запуск тестів Pi

Запускайте набір тестів, зосереджений на Pi, безпосередньо через Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Щоб включити перевірку live provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Це охоплює основні набори unit-тестів Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Ручне тестування

Рекомендований потік:

- Запустіть gateway у dev mode:
  - `pnpm gateway:dev`
- Викличте агента безпосередньо:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Використовуйте TUI для інтерактивного налагодження:
  - `pnpm tui`

Щоб перевірити поведінку викликів інструментів, дайте запит на дію `read` або `exec`, щоб побачити потокове передавання інструментів і обробку payload.

## Скидання до чистого стану

Стан зберігається в каталозі стану OpenClaw. Типове значення — `~/.openclaw`. Якщо задано `OPENCLAW_STATE_DIR`, використовуйте натомість цей каталог.

Щоб скинути все:

- `openclaw.json` для конфігурації
- `agents/<agentId>/agent/auth-profiles.json` для профілів автентифікації моделей (API keys + OAuth)
- `credentials/` для стану провайдера/каналу, який усе ще живе поза сховищем профілів автентифікації
- `agents/<agentId>/sessions/` для історії сесій агента
- `agents/<agentId>/sessions/sessions.json` для індексу сесій
- `sessions/`, якщо існують застарілі шляхи
- `workspace/`, якщо вам потрібен порожній робочий простір

Якщо ви хочете скинути лише сесії, видаліть `agents/<agentId>/sessions/` для цього агента. Якщо ви хочете зберегти автентифікацію, залиште `agents/<agentId>/agent/auth-profiles.json` і весь стан провайдера в `credentials/` без змін.

## Посилання

- [Testing](/help/testing)
- [Getting Started](/start/getting-started)
