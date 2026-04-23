---
read_when:
    - Napotykasz openclaw flows w starszej dokumentacji lub informacjach o wydaniu
summary: 'Przekierowanie: polecenia przepływu znajdują się w `openclaw tasks flow`'
title: przepływy (przekierowanie)
x-i18n:
    generated_at: "2026-04-23T09:58:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99377cf58ae17262291218639c4425abcec4efbd0405cf05b6df0d2e5b7f20bb
    source_path: cli/flows.md
    workflow: 15
---

# `openclaw tasks flow`

Polecenia Flow są podpoleceniami `openclaw tasks`, a nie osobnym poleceniem `flows`.

```bash
openclaw tasks flow list [--json]
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

Pełną dokumentację znajdziesz w [TaskFlow](/pl/automation/taskflow) oraz w [dokumentacji CLI tasks](/pl/cli/tasks).
