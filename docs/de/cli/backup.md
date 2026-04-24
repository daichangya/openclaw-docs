---
read_when:
    - Sie möchten ein erstklassiges Sicherungsarchiv für den lokalen OpenClaw-Status.
    - Sie möchten vor dem Zurücksetzen oder der Deinstallation eine Vorschau anzeigen, welche Pfade einbezogen würden.
summary: CLI-Referenz für `openclaw backup` (lokale Backup-Archive erstellen)
title: Sicherung
x-i18n:
    generated_at: "2026-04-24T06:30:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Erstellen Sie ein lokales Sicherungsarchiv für OpenClaw-Status, Konfiguration, Auth-Profile, Kanal-/Provider-Zugangsdaten, Sitzungen und optional Workspaces.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Hinweise

- Das Archiv enthält eine Datei `manifest.json` mit den aufgelösten Quellpfaden und dem Archivlayout.
- Die Standardausgabe ist ein mit Zeitstempel versehenes `.tar.gz`-Archiv im aktuellen Arbeitsverzeichnis.
- Wenn sich das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellbaums befindet, verwendet OpenClaw als Standardort für das Archiv stattdessen Ihr Home-Verzeichnis.
- Vorhandene Archivdateien werden niemals überschrieben.
- Ausgabepfade innerhalb der Quellbäume für Status/Workspace werden abgelehnt, um Selbsteinbeziehung zu vermeiden.
- `openclaw backup verify <archive>` validiert, dass das Archiv genau ein Root-Manifest enthält, lehnt Archivpfade im Traversal-Stil ab und prüft, dass jede im Manifest deklarierte Nutzlast im Tarball vorhanden ist.
- `openclaw backup create --verify` führt diese Validierung unmittelbar nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant Sicherungsquellen aus Ihrer lokalen OpenClaw-Installation:

- Das vom lokalen Status-Resolver von OpenClaw zurückgegebene Statusverzeichnis, normalerweise `~/.openclaw`
- Der aktive Pfad der Konfigurationsdatei
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des Statusverzeichnisses existiert
- Workspace-Verzeichnisse, die aus der aktuellen Konfiguration ermittelt werden, sofern Sie nicht `--no-include-workspace` übergeben

Modell-Auth-Profile sind bereits Teil des Statusverzeichnisses unter
`agents/<agentId>/agent/auth-profiles.json` und werden daher normalerweise vom
Sicherungseintrag für den Status abgedeckt.

Wenn Sie `--only-config` verwenden, überspringt OpenClaw die Ermittlung von Status, Zugangsdatenverzeichnis und Workspaces und archiviert nur den aktiven Pfad der Konfigurationsdatei.

OpenClaw kanonisiert Pfade, bevor das Archiv erstellt wird. Wenn Konfiguration, das
Zugangsdatenverzeichnis oder ein Workspace bereits innerhalb des Statusverzeichnisses liegen,
werden sie nicht als separate Sicherungsquellen auf oberster Ebene dupliziert. Fehlende Pfade werden
übersprungen.

Die Archivnutzlast speichert Dateiinhalte aus diesen Quellbäumen, und die eingebettete `manifest.json` zeichnet die aufgelösten absoluten Quellpfade sowie das für jedes Asset verwendete Archivlayout auf.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht absichtlich die normale Konfigurationsvorprüfung, damit es auch bei der Wiederherstellung noch helfen kann. Da die Workspace-Ermittlung von einer gültigen Konfiguration abhängt, schlägt `openclaw backup create` jetzt sofort fehl, wenn die Konfigurationsdatei existiert, aber ungültig ist und die Workspace-Sicherung weiterhin aktiviert ist.

Wenn Sie in dieser Situation dennoch eine teilweise Sicherung möchten, führen Sie stattdessen Folgendes aus:

```bash
openclaw backup create --no-include-workspace
```

Dadurch bleiben Status, Konfiguration und das externe Zugangsdatenverzeichnis im Umfang enthalten, während
die Workspace-Ermittlung vollständig übersprungen wird.

Wenn Sie nur eine Kopie der Konfigurationsdatei selbst benötigen, funktioniert `--only-config` auch dann, wenn die Konfiguration fehlerhaft ist, da dafür die Konfiguration nicht für die Workspace-Ermittlung geparst werden muss.

## Größe und Leistung

OpenClaw erzwingt keine integrierte maximale Sicherungsgröße und kein Größenlimit pro Datei.

Praktische Grenzen ergeben sich aus dem lokalen Rechner und dem Ziel-Dateisystem:

- Verfügbarer Speicherplatz für das temporäre Schreiben des Archivs plus das endgültige Archiv
- Zeit zum Durchlaufen großer Workspace-Bäume und zum Komprimieren in ein `.tar.gz`
- Zeit zum erneuten Scannen des Archivs, wenn Sie `openclaw backup create --verify` verwenden oder `openclaw backup verify` ausführen
- Verhalten des Dateisystems am Zielpfad. OpenClaw bevorzugt einen Veröffentlichungsschritt per Hardlink ohne Überschreiben und greift auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Workspaces sind normalerweise der Hauptfaktor für die Archivgröße. Wenn Sie eine kleinere oder schnellere Sicherung möchten, verwenden Sie `--no-include-workspace`.

Für das kleinste Archiv verwenden Sie `--only-config`.

## Verwandt

- [CLI-Referenz](/de/cli)
