---
read_when:
    - Sie möchten eine TUI für das Gateway (remote-freundlich)
    - Sie möchten `url`/`token`/`session` aus Skripten übergeben
    - Sie möchten die TUI im lokal eingebetteten Modus ohne Gateway ausführen
    - Sie möchten `openclaw chat` oder `openclaw tui --local` verwenden
summary: CLI-Referenz für `openclaw tui` (Gateway-gestützte oder lokal eingebettete Terminal-Benutzeroberfläche)
title: TUI
x-i18n:
    generated_at: "2026-04-23T14:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4fca025a15f5e985ca6f2eaf39fcbe784bd716f24841f43450b71936db26d141
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Öffnen Sie die TUI, die mit dem Gateway verbunden ist, oder führen Sie sie im lokal eingebetteten
Modus aus.

Verwandt:

- TUI-Leitfaden: [TUI](/de/web/tui)

Hinweise:

- `chat` und `terminal` sind Aliasse für `openclaw tui --local`.
- `--local` kann nicht mit `--url`, `--token` oder `--password` kombiniert werden.
- `tui` löst konfigurierte Gateway-Authentifizierungs-SecretRefs für Token-/Passwortauthentifizierung nach Möglichkeit auf (`env`-/`file`-/`exec`-Provider).
- Wenn TUI innerhalb eines konfigurierten Agent-Workspace-Verzeichnisses gestartet wird, wählt es diesen Agenten automatisch als Standard für den Sitzungsschlüssel aus (es sei denn, `--session` ist ausdrücklich `agent:<id>:...`).
- Der lokale Modus verwendet die eingebettete Agent-Laufzeit direkt. Die meisten lokalen Tools funktionieren, aber Funktionen, die nur im Gateway verfügbar sind, sind nicht verfügbar.
- Der lokale Modus fügt `/auth [provider]` innerhalb der TUI-Befehlsoberfläche hinzu.
- Plugin-Freigabe-Gates gelten auch im lokalen Modus. Tools, die eine Freigabe erfordern, fordern im Terminal eine Entscheidung an; nichts wird stillschweigend automatisch freigegeben, nur weil das Gateway nicht beteiligt ist.

## Beispiele

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

## Konfigurations-Reparaturschleife

Verwenden Sie den lokalen Modus, wenn die aktuelle Konfiguration bereits gültig ist und Sie möchten, dass der
eingebettete Agent sie prüft, mit der Dokumentation vergleicht und bei der Reparatur
im selben Terminal hilft:

Wenn `openclaw config validate` bereits fehlschlägt, verwenden Sie zuerst `openclaw configure` oder
`openclaw doctor --fix`. `openclaw chat` umgeht die Schutzvorrichtung gegen ungültige
Konfiguration nicht.

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
führen Sie dann `openclaw config validate` erneut aus. Siehe [TUI](/de/web/tui) und [Config](/de/cli/config).
