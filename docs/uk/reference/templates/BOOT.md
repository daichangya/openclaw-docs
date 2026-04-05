---
read_when:
    - Додавання контрольного списку BOOT.md
summary: Шаблон робочого простору для BOOT.md
title: Шаблон BOOT.md
x-i18n:
    generated_at: "2026-04-05T18:15:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 694e836d2c4010bf723d0e64f40e98800d3c135ca4c4124d42f96f5e050936f8
    source_path: reference/templates/BOOT.md
    workflow: 15
---

# BOOT.md

Додайте короткі, явні інструкції про те, що OpenClaw має робити під час запуску (увімкніть `hooks.internal.enabled`).
Якщо завдання надсилає повідомлення, використовуйте message tool, а потім дайте відповідь точним
тихим токеном `NO_REPLY` / `no_reply`.
