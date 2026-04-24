---
read_when:
    - Sie möchten den Gateway-Dienst und/oder den lokalen Status entfernen
    - Sie möchten zuerst einen Dry-Run
summary: CLI-Referenz für `openclaw uninstall` (Gateway-Dienst und lokale Daten entfernen)
title: Deinstallation
x-i18n:
    generated_at: "2026-04-24T06:33:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Gateway-Dienst + lokale Daten deinstallieren (CLI bleibt erhalten).

Optionen:

- `--service`: den Gateway-Dienst entfernen
- `--state`: Status und Konfiguration entfernen
- `--workspace`: Workspace-Verzeichnisse entfernen
- `--app`: die macOS-App entfernen
- `--all`: Dienst, Status, Workspace und App entfernen
- `--yes`: Bestätigungsabfragen überspringen
- `--non-interactive`: Abfragen deaktivieren; erfordert `--yes`
- `--dry-run`: Aktionen ausgeben, ohne Dateien zu entfernen

Beispiele:

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

Hinweise:

- Führen Sie zuerst `openclaw backup create` aus, wenn Sie vor dem Entfernen von Status oder Workspaces einen wiederherstellbaren Snapshot erstellen möchten.
- `--all` ist eine Kurzform dafür, Dienst, Status, Workspace und App zusammen zu entfernen.
- `--non-interactive` erfordert `--yes`.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Deinstallation](/de/install/uninstall)
