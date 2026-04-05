---
read_when:
    - Sie möchten den Gateway-Dienst und/oder den lokalen Status entfernen
    - Sie möchten zuerst einen Dry-Run durchführen
summary: CLI-Referenz für `openclaw uninstall` (Gateway-Dienst + lokale Daten entfernen)
title: uninstall
x-i18n:
    generated_at: "2026-04-05T12:39:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2123a4f9c7a070ef7e13c60dafc189053ef61ce189fa4f29449dd50987c1894c
    source_path: cli/uninstall.md
    workflow: 15
---

# `openclaw uninstall`

Deinstallieren Sie den Gateway-Dienst + lokale Daten (die CLI bleibt erhalten).

Optionen:

- `--service`: Gateway-Dienst entfernen
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

- Führen Sie zuerst `openclaw backup create` aus, wenn Sie vor dem Entfernen von Status oder Workspaces einen wiederherstellbaren Snapshot möchten.
- `--all` ist eine Kurzform dafür, Dienst, Status, Workspace und App gemeinsam zu entfernen.
- `--non-interactive` erfordert `--yes`.
