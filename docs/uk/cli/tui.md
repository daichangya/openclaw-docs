---
read_when:
    - Вам потрібен термінальний UI для Gateway (зручний для віддаленої роботи)
    - Ви хочете передавати url/token/session зі скриптів
    - Ви хочете запускати TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідник CLI для `openclaw tui` (термінальний UI на базі Gateway або локально вбудований)
title: TUI
x-i18n:
    generated_at: "2026-04-24T04:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Відкрити термінальний UI, підключений до Gateway, або запустити його в локальному вбудованому
режимі.

Пов’язане:

- Посібник TUI: [TUI](/uk/web/tui)

Примітки:

- `chat` і `terminal` є псевдонімами для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` розв’язує налаштовані SecretRef автентифікації Gateway для автентифікації токеном/паролем, коли це можливо (провайдери `env`/`file`/`exec`).
- Під час запуску зсередини каталогу робочого простору налаштованого агента TUI автоматично вибирає цього агента як типове значення ключа сесії (якщо тільки `--session` явно не має вигляду `agent:<id>:...`).
- Локальний режим безпосередньо використовує вбудоване середовище виконання агента. Більшість локальних інструментів працює, але функції лише для Gateway недоступні.
- Локальний режим додає `/auth [provider]` до поверхні команд усередині TUI.
- Обмеження на підтвердження Plugin усе одно діють у локальному режимі. Інструменти, які потребують підтвердження, запитують рішення в терміналі; нічого не схвалюється автоматично без повідомлення лише тому, що Gateway не бере участі.

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

Використовуйте локальний режим, коли поточна конфігурація вже проходить
перевірку, а ви хочете, щоб вбудований агент перевірив її, порівняв із документацією та допоміг виправити її
з того самого термінала:

Якщо `openclaw config validate` уже завершується помилкою, спочатку скористайтеся `openclaw configure` або
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

## Пов’язане

- [Довідник CLI](/uk/cli)
- [TUI](/uk/web/tui)
