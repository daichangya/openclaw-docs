---
read_when:
    - Sie möchten eine Terminal-UI für das Gateway (remote-freundlich)
    - Sie möchten URL/Token/Sitzung aus Skripten übergeben
summary: CLI-Referenz für `openclaw tui` (mit dem Gateway verbundene Terminal-UI)
title: tui
x-i18n:
    generated_at: "2026-04-05T12:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e35062c0551f85ce0da604a915b3e1ca2514d00d840afe3b94c529304c2c1a
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Die mit dem Gateway verbundene Terminal-UI öffnen.

Verwandt:

- TUI-Anleitung: [TUI](/web/tui)

Hinweise:

- `tui` löst konfigurierte Gateway-Auth-SecretRefs für die Token-/Passwortauthentifizierung auf, wenn möglich (`env`-/`file`-/`exec`-Provider).
- Wenn TUI aus einem konfigurierten Agent-Workspace-Verzeichnis gestartet wird, wählt es diesen Agent automatisch für den Standardsitzungsschlüssel aus (es sei denn, `--session` ist explizit `agent:<id>:...`).

## Beispiele

```bash
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```
