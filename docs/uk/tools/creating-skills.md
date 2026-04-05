---
read_when:
    - Ви створюєте нову власну Skill у своєму робочому просторі
    - Вам потрібен швидкий стартовий процес для Skills на основі SKILL.md
summary: Створюйте й тестуйте власні Skills робочого простору за допомогою SKILL.md
title: Створення Skills
x-i18n:
    generated_at: "2026-04-05T18:19:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# Створення Skills

Skills навчають агента, як і коли використовувати інструменти. Кожна Skill — це каталог,
що містить файл `SKILL.md` із YAML frontmatter та markdown-інструкціями.

Про те, як Skills завантажуються та пріоритизуються, див. [Skills](/tools/skills).

## Створіть свою першу Skill

<Steps>
  <Step title="Створіть каталог Skill">
    Skills живуть у вашому робочому просторі. Створіть нову папку:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Напишіть SKILL.md">
    Створіть `SKILL.md` усередині цього каталогу. Frontmatter визначає метадані,
    а markdown-тіло містить інструкції для агента.

    ```markdown
    ---
    name: hello_world
    description: Проста Skill, яка вітається.
    ---

    # Hello World Skill

    Коли користувач просить привітання, використайте інструмент `echo`, щоб сказати
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Додайте інструменти (необов’язково)">
    Ви можете визначати власні схеми інструментів у frontmatter або наказувати агенту
    використовувати наявні системні інструменти (наприклад, `exec` або `browser`). Skills також можуть
    постачатися всередині plugins разом з інструментами, які вони документують.

  </Step>

  <Step title="Завантажте Skill">
    Запустіть нову сесію, щоб OpenClaw підхопив Skill:

    ```bash
    # Із чату
    /new

    # Або перезапустіть gateway
    openclaw gateway restart
    ```

    Перевірте, що Skill завантажилася:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Протестуйте її">
    Надішліть повідомлення, яке має активувати Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Або просто поспілкуйтеся з агентом і попросіть привітання.

  </Step>
</Steps>

## Довідник метаданих Skill

YAML frontmatter підтримує такі поля:

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Yes      | Унікальний ідентифікатор (snake_case)       |
| `description`                       | Yes      | Однорядковий опис, який показується агенту  |
| `metadata.openclaw.os`              | No       | Фільтр ОС (`["darwin"]`, `["linux"]` тощо)  |
| `metadata.openclaw.requires.bins`   | No       | Потрібні бінарні файли в PATH               |
| `metadata.openclaw.requires.config` | No       | Потрібні ключі конфігурації                 |

## Найкращі практики

- **Будьте лаконічними** — інструктуйте модель, _що_ робити, а не як бути ШІ
- **Безпека понад усе** — якщо ваша Skill використовує `exec`, переконайтеся, що промпти не допускають довільного ін’єкування команд із ненадійного вводу
- **Тестуйте локально** — використовуйте `openclaw agent --message "..."` для тестування перед поширенням
- **Використовуйте ClawHub** — переглядайте та додавайте Skills на [ClawHub](https://clawhub.ai)

## Де знаходяться Skills

| Location                        | Precedence | Scope                  |
| ------------------------------- | ---------- | ---------------------- |
| `\<workspace\>/skills/`         | Найвищий   | Для конкретного агента |
| `\<workspace\>/.agents/skills/` | Високий    | Для агента workspace   |
| `~/.agents/skills/`             | Середній   | Спільний профіль агента |
| `~/.openclaw/skills/`           | Середній   | Спільно (усі агенти)   |
| Bundled (shipped with OpenClaw) | Низький    | Глобально              |
| `skills.load.extraDirs`         | Найнижчий  | Власні спільні папки   |

## Пов’язане

- [Довідник Skills](/tools/skills) — правила завантаження, пріоритету та gating
- [Конфігурація Skills](/tools/skills-config) — схема конфігурації `skills.*`
- [ClawHub](/tools/clawhub) — публічний реєстр Skills
- [Building Plugins](/uk/plugins/building-plugins) — plugins можуть постачати Skills
