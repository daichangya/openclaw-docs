---
read_when:
    - Ви хочете запускати або писати робочі процеси .prose
    - Ви хочете увімкнути Plugin OpenProse
    - Вам потрібно зрозуміти зберігання стану
summary: 'OpenProse: робочі процеси .prose, slash-команди та стан в OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-24T04:17:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 15
---

OpenProse — це переносний markdown-first формат робочих процесів для оркестрації AI-сесій. В OpenClaw він постачається як Plugin, який встановлює набір Skills OpenProse і slash-команду `/prose`. Програми живуть у файлах `.prose` і можуть запускати кількох субагентів із явним керуванням потоком.

Офіційний сайт: [https://www.prose.md](https://www.prose.md)

## Що це вміє

- Дослідження + синтез із кількома агентами та явним паралелізмом.
- Повторювані безпечні щодо схвалення робочі процеси (перевірка коду, тріаж інцидентів, конвеєри контенту).
- Багаторазово використовувані програми `.prose`, які можна запускати в підтримуваних середовищах виконання агентів.

## Встановлення й увімкнення

Вбудовані Plugins типово вимкнені. Увімкніть OpenProse:

```bash
openclaw plugins enable open-prose
```

Після увімкнення Plugin перезапустіть Gateway.

Розробка/локальний checkout: `openclaw plugins install ./path/to/local/open-prose-plugin`

Пов’язана документація: [Plugins](/uk/tools/plugin), [Маніфест Plugin](/uk/plugins/manifest), [Skills](/uk/tools/skills).

## Slash-команда

OpenProse реєструє `/prose` як користувацьку команду Skill. Вона маршрутизується до інструкцій VM OpenProse і під капотом використовує інструменти OpenClaw.

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

OpenProse зберігає стан у `.prose/` у вашому робочому просторі:

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

- **filesystem** (типово): `.prose/runs/...`
- **in-context**: тимчасовий режим для невеликих програм
- **sqlite** (експериментально): потребує бінарного файла `sqlite3`
- **postgres** (експериментально): потребує `psql` і рядка підключення

Примітки:

- sqlite/postgres є opt-in і експериментальними.
- Облікові дані postgres потрапляють у журнали субагентів; використовуйте окрему БД із мінімально необхідними привілеями.

## Віддалені програми

`/prose run <handle/slug>` розв’язується в `https://p.prose.md/<handle>/<slug>`.
Прямі URL отримуються як є. Для цього використовується інструмент `web_fetch` (або `exec` для POST).

## Відображення середовища виконання OpenClaw

Програми OpenProse відображаються на примітиви OpenClaw:

| Поняття OpenProse           | Інструмент OpenClaw |
| --------------------------- | ------------------- |
| Spawn сесії / інструмент Task | `sessions_spawn`  |
| Читання/запис файлів        | `read` / `write`    |
| Отримання з вебу            | `web_fetch`         |

Якщо ваш allowlist інструментів блокує ці інструменти, програми OpenProse зазнаватимуть невдачі. Див. [Конфігурація Skills](/uk/tools/skills-config).

## Безпека й схвалення

Ставтеся до файлів `.prose` як до коду. Перевіряйте їх перед запуском. Використовуйте allowlist інструментів OpenClaw і шлюзи схвалення, щоб контролювати побічні ефекти.

Для детермінованих робочих процесів із керуванням через схвалення порівняйте з [Lobster](/uk/tools/lobster).

## Пов’язане

- [Text-to-speech](/uk/tools/tts)
- [Форматування Markdown](/uk/concepts/markdown-formatting)
