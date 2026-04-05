---
read_when:
    - Ви хочете запускати або писати робочі процеси .prose
    - Ви хочете ввімкнути plugin OpenProse
    - Вам потрібно зрозуміти зберігання стану
summary: 'OpenProse: робочі процеси .prose, slash-команди та стан в OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T18:13:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse — це портативний формат робочих процесів markdown-first для оркестрації AI-сесій. В OpenClaw він постачається як plugin, що встановлює набір Skills OpenProse і slash-команду `/prose`. Програми зберігаються у файлах `.prose` і можуть запускати кілька субагентів із явним керуванням потоком.

Офіційний сайт: [https://www.prose.md](https://www.prose.md)

## Що він може робити

- Дослідження та синтез із кількома агентами з явним паралелізмом.
- Повторювані робочі процеси, безпечні щодо підтверджень (рев’ю коду, тріаж інцидентів, контент-пайплайни).
- Повторно використовувані програми `.prose`, які можна запускати в підтримуваних рантаймах агентів.

## Встановлення й увімкнення

Bundled plugin вимкнені за замовчуванням. Увімкніть OpenProse:

```bash
openclaw plugins enable open-prose
```

Після ввімкнення plugin перезапустіть Gateway.

Dev/локальний checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Пов’язані документи: [Plugins](/tools/plugin), [Plugin manifest](/plugins/manifest), [Skills](/tools/skills).

## Slash-команда

OpenProse реєструє `/prose` як викликану користувачем команду Skills. Вона маршрутизується до інструкцій VM OpenProse і під капотом використовує інструменти OpenClaw.

Поширені команди:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Приклад: простий файл `.prose`

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Розташування файлів

OpenProse зберігає стан у `.prose/` у вашому workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Постійні агенти на рівні користувача розміщуються тут:

```
~/.prose/agents/
```

## Режими стану

OpenProse підтримує кілька бекендів стану:

- **filesystem** (за замовчуванням): `.prose/runs/...`
- **in-context**: тимчасовий режим для невеликих програм
- **sqlite** (експериментально): потрібен бінарний файл `sqlite3`
- **postgres** (експериментально): потрібні `psql` і рядок підключення

Примітки:

- sqlite/postgres є опційними й експериментальними.
- Облікові дані postgres потрапляють у логи субагентів; використовуйте окрему БД із мінімально необхідними привілеями.

## Віддалені програми

`/prose run <handle/slug>` зіставляється з `https://p.prose.md/<handle>/<slug>`.
Прямі URL отримуються як є. Для цього використовується інструмент `web_fetch` (або `exec` для POST).

## Відповідність рантайму OpenClaw

Програми OpenProse зіставляються з примітивами OpenClaw:

| Концепт OpenProse          | Інструмент OpenClaw |
| -------------------------- | ------------------- |
| Запуск сесії / інструмент Task | `sessions_spawn` |
| Читання/запис файлів       | `read` / `write`    |
| Отримання з вебу           | `web_fetch`         |

Якщо ваш allowlist інструментів блокує ці інструменти, програми OpenProse не працюватимуть. Див. [Skills config](/tools/skills-config).

## Безпека та підтвердження

Ставтеся до файлів `.prose` як до коду. Перевіряйте їх перед запуском. Використовуйте allowlist інструментів OpenClaw і механізми підтвердження, щоб контролювати побічні ефекти.

Для детермінованих робочих процесів із підтвердженням на кожному кроці порівняйте з [Lobster](/tools/lobster).
