---
read_when:
    - Ви хочете запускати виконання агента зі скриптів або з командного рядка
    - Вам потрібно програмно доставляти відповіді агента до каналу чату
summary: Запускайте ходи агента з CLI та за потреби доставляйте відповіді в канали
title: Надсилання агента
x-i18n:
    generated_at: "2026-04-21T08:24:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Надсилання агента

`openclaw agent` запускає один хід агента з командного рядка без потреби у вхідному повідомленні чату. Використовуйте це для сценаріїв, тестування та програмної доставки.

## Швидкий старт

<Steps>
  <Step title="Запустіть простий хід агента">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Виберіть конкретного агента або сесію">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Доставте відповідь у канал">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Прапорці

| Прапорець                     | Опис                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Повідомлення для надсилання (обов’язково)                   |
| `--to \<dest\>`               | Вивести ключ сесії з цілі (телефон, id чату)                |
| `--agent \<id\>`              | Вибрати налаштованого агента (використовує його сесію `main`) |
| `--session-id \<id\>`         | Повторно використати наявну сесію за id                     |
| `--local`                     | Примусово використовувати вбудоване локальне середовище виконання (пропустити Gateway) |
| `--deliver`                   | Надіслати відповідь у канал чату                            |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack тощо)   |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                                |
| `--reply-channel \<name\>`    | Перевизначення каналу доставки                              |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки                |
| `--thinking \<level\>`        | Установити рівень thinking для вибраного профілю моделі     |
| `--verbose \<on\|full\|off\>` | Установити рівень докладності                               |
| `--timeout \<seconds\>`       | Перевизначити тайм-аут агента                               |
| `--json`                      | Виводити структурований JSON                                |

## Поведінка

- За замовчуванням CLI працює **через Gateway**. Додайте `--local`, щоб примусово використовувати вбудоване середовище виконання на поточній машині.
- Якщо Gateway недоступний, CLI **перемикається** на локальний вбудований запуск.
- Вибір сесії: `--to` виводить ключ сесії (цілі груп/каналів зберігають ізоляцію; прямі чати зводяться до `main`).
- Прапорці thinking і verbose зберігаються у сховищі сесії.
- Вивід: звичайний текст за замовчуванням або `--json` для структурованого payload + метаданих.

## Приклади

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Пов’язане

- [Довідка CLI агента](/cli/agent)
- [Підагенти](/uk/tools/subagents) — запуск фонових підагентів
- [Сесії](/uk/concepts/session) — як працюють ключі сесій
