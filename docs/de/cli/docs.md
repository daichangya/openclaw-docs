---
read_when:
    - Sie möchten die Live-OpenClaw-Dokumentation vom Terminal aus durchsuchen.
summary: CLI-Referenz für `openclaw docs` (den Live-Dokumentationsindex durchsuchen)
title: Dokumentation
x-i18n:
    generated_at: "2026-04-24T06:31:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Den Live-Dokumentationsindex durchsuchen.

Argumente:

- `[query...]`: Suchbegriffe, die an den Live-Dokumentationsindex gesendet werden

Beispiele:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Hinweise:

- Ohne Suchanfrage öffnet `openclaw docs` den Einstiegspunkt für die Live-Dokumentationssuche.
- Mehrere Wörter werden als eine Suchanfrage weitergegeben.

## Verwandt

- [CLI-Referenz](/de/cli)
