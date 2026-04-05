---
read_when:
    - Вам потрібні відтворювані інсталяції з можливістю rollback
    - Ви вже використовуєте Nix/NixOS/Home Manager
    - Ви хочете, щоб усе було закріплено та керувалося декларативно
summary: Декларативне встановлення OpenClaw за допомогою Nix
title: Nix
x-i18n:
    generated_at: "2026-04-05T18:08:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e1e73533db1350d82d3a786092b4328121a082dfeeedee7c7574021dada546
    source_path: install/nix.md
    workflow: 15
---

# Встановлення через Nix

Установіть OpenClaw декларативно за допомогою **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — Home Manager module з усім необхідним у комплекті.

<Info>
Репозиторій [nix-openclaw](https://github.com/openclaw/nix-openclaw) є джерелом істини для встановлення через Nix. Ця сторінка — короткий огляд.
</Info>

## Що ви отримаєте

- Gateway + застосунок macOS + інструменти (whisper, spotify, cameras) — усе зафіксовано
- Сервіс launchd, який переживає перезавантаження
- Система plugins з декларативною конфігурацією
- Миттєвий rollback: `home-manager switch --rollback`

## Швидкий старт

<Steps>
  <Step title="Установіть Determinate Nix">
    Якщо Nix ще не встановлено, дотримуйтеся інструкцій [інсталятора Determinate Nix](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Створіть локальний flake">
    Використовуйте шаблон agent-first з репозиторію nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Скопіюйте templates/agent-first/flake.nix з репозиторію nix-openclaw
    ```
  </Step>
  <Step title="Налаштуйте секрети">
    Налаштуйте токен вашого бота повідомлень і API-ключ провайдера моделей. Звичайні файли в `~/.secrets/` цілком підходять.
  </Step>
  <Step title="Заповніть шаблонні placeholder і застосуйте конфігурацію">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Перевірте">
    Переконайтеся, що сервіс launchd працює і ваш бот відповідає на повідомлення.
  </Step>
</Steps>

Повні параметри module і приклади див. в [README nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Поведінка runtime в режимі Nix

Коли задано `OPENCLAW_NIX_MODE=1` (автоматично з nix-openclaw), OpenClaw переходить у детермінований режим, який вимикає сценарії auto-install.

Ви також можете задати це вручну:

```bash
export OPENCLAW_NIX_MODE=1
```

У macOS GUI-застосунок не успадковує змінні середовища shell автоматично. Натомість увімкніть режим Nix через defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Що змінюється в режимі Nix

- Сценарії auto-install і self-mutation вимкнені
- Відсутні залежності показують повідомлення про виправлення, специфічні для Nix
- UI показує банер режиму Nix лише для читання

### Шляхи до конфігурації та state

OpenClaw читає конфігурацію JSON5 з `OPENCLAW_CONFIG_PATH` і зберігає змінні дані в `OPENCLAW_STATE_DIR`. Під час роботи під Nix задавайте їх явно на розташування, якими керує Nix, щоб runtime state і конфігурація не потрапляли до незмінного store.

| Змінна                | Типове значення                         |
| --------------------- | --------------------------------------- |
| `OPENCLAW_HOME`       | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                          |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`    |

## Пов’язане

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- повний посібник із налаштування
- [Wizard](/start/wizard) -- налаштування CLI без Nix
- [Docker](/install/docker) -- налаштування в контейнері
