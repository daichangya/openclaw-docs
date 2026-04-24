---
read_when:
    - Sie möchten eine TUI für das Gateway (remote-freundlich)
    - Sie möchten url/token/session aus Skripten übergeben
    - Sie möchten die TUI im lokal eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete TUI)
title: TUI
x-i18n:
    generated_at: "2026-04-24T06:33:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3b3d337c55411fbcbae3bda85d9ca8d0f1b2a4224b5d4c9bbc5f96c41c5363c
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Die TUI öffnen, die mit dem Gateway verbunden ist, oder sie im lokal eingebetteten
Modus ausführen.

Verwandt:

- TUI-Leitfaden: [TUI](/de/web/tui)

Hinweise:

- `chat` und `terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- `tui` löst konfigurierte SecretRefs für die Gateway-Authentifizierung bei Token-/Passwort-Authentifizierung nach Möglichkeit auf (`env`-/`file`-/`exec`-Provider).
- Wenn die TUI aus einem konfigurierten Agent-Workspace-Verzeichnis gestartet wird, wählt sie diesen Agenten automatisch als Standard für den Sitzungsschlüssel aus (es sei denn, `--session` ist explizit `agent:<id>:...`).
- Der lokale Modus verwendet direkt die eingebettete Agent-Laufzeit. Die meisten lokalen Tools funktionieren, aber nur-Gateway-Funktionen sind nicht verfügbar.
- Der lokale Modus fügt `/auth [provider]` innerhalb der TUI-Befehlsoberfläche hinzu.
- Plugin-Genehmigungsgates gelten auch im lokalen Modus. Tools, die eine Genehmigung erfordern, fordern im Terminal eine Entscheidung an; nichts wird stillschweigend automatisch genehmigt, da das Gateway nicht beteiligt ist.

## Beispiele

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# wenn innerhalb eines Agent-Workspace ausgeführt, wird dieser Agent automatisch abgeleitet
openclaw tui --session bugfix
```

## Schleife zur Konfigurationsreparatur

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits gültig ist und Sie möchten, dass die
eingebettete Agent-Laufzeit sie prüft, mit der Dokumentation vergleicht und bei der Reparatur
im selben Terminal hilft:

Wenn `openclaw config validate` bereits fehlschlägt, verwenden Sie zuerst `openclaw configure` oder
`openclaw doctor --fix`. `openclaw chat` umgeht den Guard für ungültige Konfigurationen nicht.

```bash
openclaw chat
```

Dann innerhalb der TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Wenden Sie gezielte Korrekturen mit `openclaw config set` oder `openclaw configure` an und
führen Sie dann `openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und [Konfiguration](/de/cli/config).

## Verwandt

- [CLI-Referenz](/de/cli)
- [TUI](/de/web/tui)
