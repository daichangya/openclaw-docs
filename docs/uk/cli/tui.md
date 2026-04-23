---
read_when:
    - Вам потрібен terminal UI для Gateway (зручний для віддаленої роботи)
    - Ви хочете передавати url/token/session зі скриптів
    - Ви хочете запустити TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідка CLI для `openclaw tui` (terminal UI на базі Gateway або локально вбудований)
title: tui
x-i18n:
    generated_at: "2026-04-23T07:12:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Відкрийте terminal UI, підключений до Gateway, або запустіть його в локальному вбудованому
режимі.

Пов’язано:

- Посібник TUI: [TUI](/uk/web/tui)

Примітки:

- `chat` і `terminal` — це псевдоніми для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` за можливості розв’язує налаштовані SecretRef автентифікації gateway для автентифікації токеном/паролем (`env`/`file`/`exec` providers).
- Якщо запуск відбувається зсередини каталогу налаштованого робочого простору агента, TUI автоматично вибирає цього агента як значення за замовчуванням для ключа сесії (якщо тільки `--session` явно не має вигляду `agent:<id>:...`).
- Локальний режим напряму використовує вбудоване середовище виконання агента. Більшість локальних інструментів працюють, але функції лише для Gateway недоступні.
- Локальний режим додає `/auth [provider]` усередині поверхні команд TUI.
- Обмеження погодження Plugin діють і в локальному режимі. Інструменти, які потребують погодження, запитують рішення в terminal; нічого не погоджується автоматично, оскільки Gateway не бере участі.

## Приклади

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Цикл виправлення конфігурації

Використовуйте локальний режим, коли поточна конфігурація вже проходить валідацію і ви хочете, щоб
вбудований агент перевірив її, порівняв із документацією та допоміг виправити
з того самого terminal:

Якщо `openclaw config validate` вже завершується помилкою, спочатку скористайтеся `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної
конфігурації.

```bash
openclaw chat
```

Потім усередині TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Застосуйте цільові виправлення за допомогою `openclaw config set` або `openclaw configure`, а потім
повторно запустіть `openclaw config validate`. Див. [TUI](/uk/web/tui) і [Config](/uk/cli/config).
