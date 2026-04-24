---
read_when:
    - Ви хочете швидко перевірити стан здоров’я запущеного Gateway
summary: Довідка CLI для `openclaw health` (знімок стану Gateway через RPC)
title: Стан здоров’я
x-i18n:
    generated_at: "2026-04-24T04:12:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Отримати дані про стан здоров’я від запущеного Gateway.

Параметри:

- `--json`: машинозчитуваний вивід
- `--timeout <ms>`: час очікування з’єднання в мілісекундах (типово `10000`)
- `--verbose`: докладне журналювання
- `--debug`: псевдонім для `--verbose`

Приклади:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Примітки:

- Типовий `openclaw health` запитує знімок стану здоров’я у запущеного gateway. Коли gateway уже має свіжий кешований знімок, він може повернути цей кешований вміст і виконати оновлення у фоновому режимі.
- `--verbose` примусово запускає живу перевірку, виводить відомості про з’єднання з gateway і розгортає людиночитаний вивід для всіх налаштованих облікових записів і агентів.
- Вивід містить сховища сесій для кожного агента, коли налаштовано кілька агентів.

## Пов’язане

- [Довідка CLI](/uk/cli)
- [Стан здоров’я Gateway](/uk/gateway/health)
