---
read_when:
    - Робота над кодом або тестами інтеграції Pi
    - Запуск специфічних для Pi процесів lint, typecheck і live test flows
summary: 'Робочий процес розробника для інтеграції Pi: збірка, тестування та перевірка в реальному середовищі'
title: Робочий процес розробки Pi
x-i18n:
    generated_at: "2026-04-24T04:15:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

Цей посібник підсумовує розумний робочий процес для роботи над інтеграцією Pi в OpenClaw.

## Перевірка типів і linting

- Типовий локальний бар’єр перевірки: `pnpm check`
- Бар’єр збірки: `pnpm build`, коли зміна може вплинути на результат збірки, пакування або межі lazy-loading/module
- Повний бар’єр перед внесенням змін для змін, що суттєво стосуються Pi: `pnpm check && pnpm test`

## Запуск тестів Pi

Запустіть набір тестів, орієнтований на Pi, безпосередньо через Vitest:

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

Щоб також включити перевірку live provider:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

Це охоплює основні модульні набори тестів Pi:

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## Ручне тестування

Рекомендований процес:

- Запустіть gateway у режимі dev:
  - `pnpm gateway:dev`
- Запустіть агента безпосередньо:
  - `pnpm openclaw agent --message "Hello" --thinking low`
- Використовуйте TUI для інтерактивного налагодження:
  - `pnpm tui`

Для поведінки викликів інструментів сформулюйте запит на дію `read` або `exec`, щоб бачити потокову передачу інструмента та обробку корисного навантаження.

## Скидання до чистого стану

Стан зберігається в каталозі стану OpenClaw. Типово це `~/.openclaw`. Якщо встановлено `OPENCLAW_STATE_DIR`, використовуйте замість нього цей каталог.

Щоб скинути все:

- `openclaw.json` для config
- `agents/<agentId>/agent/auth-profiles.json` для профілів автентифікації моделі (API-ключі + OAuth)
- `credentials/` для стану провайдера/каналу, який усе ще зберігається поза сховищем профілів автентифікації
- `agents/<agentId>/sessions/` для історії сесій агента
- `agents/<agentId>/sessions/sessions.json` для індексу сесій
- `sessions/`, якщо існують застарілі шляхи
- `workspace/`, якщо вам потрібен порожній workspace

Якщо ви хочете скинути лише сесії, видаліть `agents/<agentId>/sessions/` для цього агента. Якщо ви хочете зберегти автентифікацію, залиште `agents/<agentId>/agent/auth-profiles.json` і будь-який стан провайдера в `credentials/` без змін.

## Посилання

- [Тестування](/uk/help/testing)
- [Початок роботи](/uk/start/getting-started)

## Пов’язане

- [Архітектура інтеграції Pi](/uk/pi)
