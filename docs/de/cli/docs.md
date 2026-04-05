---
read_when:
    - Sie die Live-OpenClaw-Dokumentation im Terminal durchsuchen möchten
summary: CLI-Referenz für `openclaw docs` (den Live-Dokumentationsindex durchsuchen)
title: docs
x-i18n:
    generated_at: "2026-04-05T12:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
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

- Ohne Abfrage öffnet `openclaw docs` den Einstiegspunkt für die Live-Dokumentationssuche.
- Abfragen mit mehreren Wörtern werden als eine Suchanfrage weitergegeben.
