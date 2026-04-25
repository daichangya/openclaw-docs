---
read_when:
    - Вам потрібні відтворювані встановлення з можливістю відкату назад
    - Ви вже використовуєте Nix/NixOS/Home Manager
    - Ви хочете, щоб усе було зафіксовано та керувалося декларативно
summary: Встановіть OpenClaw декларативно за допомогою Nix
title: Nix
x-i18n:
    generated_at: "2026-04-25T06:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

Встановіть OpenClaw декларативно за допомогою **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — Home Manager module з усім необхідним у комплекті.

<Info>
Репозиторій [nix-openclaw](https://github.com/openclaw/nix-openclaw) є єдиним джерелом істини для встановлення через Nix. Ця сторінка — короткий огляд.
</Info>

## Що ви отримуєте

- Gateway + застосунок для macOS + інструменти (whisper, spotify, cameras) — усе зафіксовано
- Сервіс launchd, який переживає перезавантаження
- Система Plugin із декларативною конфігурацією
- Миттєвий відкат: `home-manager switch --rollback`

## Швидкий старт

<Steps>
  <Step title="Встановіть Determinate Nix">
    Якщо Nix ще не встановлено, дотримуйтесь інструкцій [інсталятора Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Створіть локальний flake">
    Використайте шаблон agent-first із репозиторію nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Налаштуйте секрети">
    Налаштуйте токен вашого бота для обміну повідомленнями та API-ключ постачальника моделей. Звичайні файли в `~/.secrets/` цілком підійдуть.
  </Step>
  <Step title="Заповніть заповнювачі шаблону та виконайте перемикання">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Перевірте">
    Переконайтеся, що сервіс launchd запущений і ваш бот відповідає на повідомлення.
  </Step>
</Steps>

Дивіться [README nix-openclaw](https://github.com/openclaw/nix-openclaw), щоб отримати повний список опцій модуля та приклади.

## Поведінка середовища виконання в режимі Nix

Коли встановлено `OPENCLAW_NIX_MODE=1` (автоматично з nix-openclaw), OpenClaw переходить у детермінований режим, який вимикає потоки автоматичного встановлення.

Ви також можете встановити це вручну:

```bash
export OPENCLAW_NIX_MODE=1
```

У macOS GUI-застосунок не успадковує автоматично змінні середовища оболонки. Натомість увімкніть режим Nix через defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Що змінюється в режимі Nix

- Потоки автоматичного встановлення та самозміни вимкнено
- Відсутні залежності показують повідомлення про виправлення саме для Nix
- В інтерфейсі відображається банер режиму Nix лише для читання

### Шляхи конфігурації та стану

OpenClaw читає конфігурацію JSON5 з `OPENCLAW_CONFIG_PATH` і зберігає змінні дані в `OPENCLAW_STATE_DIR`. Під час роботи під Nix установлюйте їх явно на керовані Nix розташування, щоб стан середовища виконання та конфігурація не зберігалися в незмінному сховищі.

| Змінна                | Типове значення                         |
| --------------------- | --------------------------------------- |
| `OPENCLAW_HOME`       | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`  | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH`| `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Виявлення PATH сервісу

Сервіс Gateway launchd/systemd автоматично виявляє двійкові файли профілю Nix, тож
Plugin та інструменти, які виконують виклики до виконуваних файлів, установлених через `nix`,
працюють без ручного налаштування PATH:

- Коли встановлено `NIX_PROFILES`, кожен запис додається до PATH сервісу з
  пріоритетом справа наліво (це відповідає пріоритету оболонки Nix — крайній праворуч має перевагу).
- Коли `NIX_PROFILES` не встановлено, як запасний варіант додається `~/.nix-profile/bin`.

Це застосовується як до середовищ сервісів launchd у macOS, так і до systemd у Linux.

## Пов’язане

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — повний посібник із налаштування
- [Wizard](/uk/start/wizard) — налаштування CLI без Nix
- [Docker](/uk/install/docker) — налаштування в контейнері
