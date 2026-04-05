---
read_when:
    - Потрібно запускати хід агента зі сценаріїв або з командного рядка
    - Потрібно програмно доставляти відповіді агента в чат-канал
summary: Запускайте ходи агента з CLI та за потреби доставляйте відповіді в канали
title: Надсилання агенту
x-i18n:
    generated_at: "2026-04-05T18:18:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Надсилання агенту

`openclaw agent` виконує один хід агента з командного рядка без потреби
в отриманні вхідного повідомлення з чату. Використовуйте це для автоматизованих процесів, тестування та
програмної доставки.

## Швидкий старт

<Steps>
  <Step title="Виконайте простий хід агента">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Це надсилає повідомлення через Gateway і виводить відповідь.

  </Step>

  <Step title="Вкажіть конкретного агента або сесію">
    ```bash
    # Вказати конкретного агента
    openclaw agent --agent ops --message "Summarize logs"

    # Вказати номер телефону (виводить ключ сесії)
    openclaw agent --to +15555550123 --message "Status update"

    # Повторно використати наявну сесію
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Доставте відповідь у канал">
    ```bash
    # Доставити в WhatsApp (типовий канал)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Доставити в Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Прапорці

| Прапорець                     | Опис                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Повідомлення для надсилання (обов’язково)                   |
| `--to \<dest\>`               | Виводить ключ сесії з цілі (телефон, id чату)               |
| `--agent \<id\>`              | Націлює на налаштованого агента (використовує його сесію `main`) |
| `--session-id \<id\>`         | Повторно використовує наявну сесію за id                    |
| `--local`                     | Примусово використовує локальне вбудоване середовище виконання (без Gateway) |
| `--deliver`                   | Надсилає відповідь у чат-канал                              |
| `--channel \<name\>`          | Канал доставки (whatsapp, telegram, discord, slack тощо)   |
| `--reply-to \<target\>`       | Перевизначення цілі доставки                                |
| `--reply-channel \<name\>`    | Перевизначення каналу доставки                              |
| `--reply-account \<id\>`      | Перевизначення id облікового запису доставки                |
| `--thinking \<level\>`        | Установлює рівень thinking (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Установлює рівень verbose                                   |
| `--timeout \<seconds\>`       | Перевизначає тайм-аут агента                                |
| `--json`                      | Виводить структурований JSON                                |

## Поведінка

- Типово CLI працює **через Gateway**. Додайте `--local`, щоб примусово
  використовувати вбудоване локальне середовище виконання на поточній машині.
- Якщо Gateway недоступний, CLI **повертається** до локального вбудованого запуску.
- Вибір сесії: `--to` виводить ключ сесії (цілі груп/каналів
  зберігають ізоляцію; прямі чати зводяться до `main`).
- Прапорці thinking і verbose зберігаються у сховищі сесій.
- Вивід: типово простий текст, або `--json` для структурованого payload + metadata.

## Приклади

```bash
# Простий хід із виводом JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Хід із рівнем thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Доставка в інший канал, ніж у сесії
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Пов’язане

- [Довідник CLI агента](/cli/agent)
- [Sub-agents](/tools/subagents) — запуск фонових субагентів
- [Sessions](/uk/concepts/session) — як працюють ключі сесій
