---
read_when:
    - Налагодження dev-скриптів лише для Node або збоїв у режимі watch
    - Дослідження збоїв loader tsx/esbuild в OpenClaw
summary: Нотатки про збій Node + tsx "__name is not a function" і способи обходу
title: Збій Node + tsx
x-i18n:
    generated_at: "2026-04-05T18:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Збій Node + tsx "\_\_name is not a function"

## Підсумок

Запуск OpenClaw через Node з `tsx` завершується помилкою під час старту:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Це почалося після переходу dev-скриптів з Bun на `tsx` (коміт `2871657e`, 2026-01-06). Той самий шлях runtime працював із Bun.

## Середовище

- Node: v25.x (спостерігалося на v25.3.0)
- tsx: 4.21.0
- OS: macOS (відтворення також імовірне на інших платформах, де запускається Node 25)

## Відтворення (лише Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Мінімальне відтворення в репозиторії

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Перевірка версії Node

- Node 25.3.0: збій
- Node 22.22.0 (Homebrew `node@22`): збій
- Node 24: тут ще не встановлено; потребує перевірки

## Нотатки / гіпотеза

- `tsx` використовує esbuild для перетворення TS/ESM. `keepNames` в esbuild генерує допоміжну функцію `__name` і обгортає визначення функцій у `__name(...)`.
- Збій вказує, що `__name` існує, але не є функцією під час runtime, що означає, що допоміжна функція відсутня або перезаписана для цього модуля в шляху loader Node 25.
- Подібні проблеми з допоміжною функцією `__name` уже повідомлялися в інших споживачах esbuild, коли ця допоміжна функція відсутня або переписана.

## Історія регресії

- `2871657e` (2026-01-06): скрипти змінено з Bun на tsx, щоб зробити Bun необов’язковим.
- До цього (шлях Bun) `openclaw status` і `gateway:watch` працювали.

## Способи обходу

- Використовувати Bun для dev-скриптів (поточне тимчасове повернення).
- Використовувати Node + tsc watch, а потім запускати скомпільований вивід:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Локально підтверджено: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` працює на Node 25.
- Вимкнути `keepNames` esbuild у TS loader, якщо це можливо (це запобігає вставленню допоміжної функції `__name`); наразі tsx цього не надає.
- Перевірити Node LTS (22/24) з `tsx`, щоб з’ясувати, чи проблема є специфічною для Node 25.

## Посилання

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Наступні кроки

- Відтворити на Node 22/24, щоб підтвердити регресію Node 25.
- Перевірити `tsx` nightly або закріпити раннішу версію, якщо існує відома регресія.
- Якщо відтворюється на Node LTS, подати мінімальний приклад відтворення upstream зі stack trace `__name`.
