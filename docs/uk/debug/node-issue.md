---
read_when:
    - Налагодження збоїв скриптів розробки лише для Node або режиму спостереження
    - Розслідування збоїв завантажувача tsx/esbuild в OpenClaw
summary: Нотатки про аварійне завершення `Node + tsx "__name is not a function"` і способи обходу
title: Аварійне завершення Node + tsx
x-i18n:
    generated_at: "2026-04-24T04:13:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Аварійне завершення `Node + tsx "\_\_name is not a function"`

## Підсумок

Під час запуску OpenClaw через Node з `tsx` збій відбувається на старті з таким повідомленням:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Це почалося після переходу скриптів розробки з Bun на `tsx` (коміт `2871657e`, 2026-01-06). Той самий шлях виконання раніше працював із Bun.

## Середовище

- Node: v25.x (спостерігалося на v25.3.0)
- tsx: 4.21.0
- ОС: macOS (імовірно, відтворюється також на інших платформах, де запускається Node 25)

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

- `tsx` використовує esbuild для перетворення TS/ESM. `keepNames` в esbuild створює допоміжну функцію `__name` і обгортає визначення функцій через `__name(...)`.
- Збій означає, що `__name` існує, але під час виконання не є функцією, а це вказує на те, що допоміжна функція відсутня або перевизначена для цього модуля в шляху завантажувача Node 25.
- Подібні проблеми з допоміжною функцією `__name` уже повідомлялися в інших споживачів esbuild, коли ця функція відсутня або переписана.

## Історія регресії

- `2871657e` (2026-01-06): скрипти змінено з Bun на tsx, щоб зробити Bun необов’язковим.
- До цього (шлях Bun) `openclaw status` і `gateway:watch` працювали.

## Способи обходу

- Використовуйте Bun для скриптів розробки (поточне тимчасове повернення).
- Використовуйте `tsgo` для перевірки типів у репозиторії, а потім запускайте зібраний вивід:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Історична примітка: `tsc` використовувався тут під час налагодження цієї проблеми Node/tsx, але тепер у репозиторії для перевірки типів використовуються шляхи `tsgo`.
- За можливості вимкніть `keepNames` esbuild у завантажувачі TS (це запобігає вставці допоміжної функції `__name`); наразі tsx не надає такого параметра.
- Перевірте Node LTS (22/24) із `tsx`, щоб з’ясувати, чи проблема специфічна для Node 25.

## Посилання

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Наступні кроки

- Відтворити на Node 22/24, щоб підтвердити регресію в Node 25.
- Перевірити `tsx` nightly або зафіксувати попередню версію, якщо відома конкретна регресія.
- Якщо відтворюється на Node LTS, подати мінімальний приклад для відтворення upstream із трасуванням стека `__name`.

## Пов’язане

- [Встановлення Node.js](/uk/install/node)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
