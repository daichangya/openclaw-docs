---
read_when:
    - Sie möchten ein erstklassiges Backup-Archiv für den lokalen OpenClaw-Status
    - Sie möchten vor `reset` oder einer Deinstallation anzeigen, welche Pfade enthalten wären
summary: CLI-Referenz für `openclaw backup` (lokale Backup-Archive erstellen)
title: backup
x-i18n:
    generated_at: "2026-04-05T12:37:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Erstellen Sie ein lokales Backup-Archiv für den OpenClaw-Status, die Konfiguration, Auth-Profile, Kanal-/Provider-Anmeldeinformationen, Sitzungen und optional Workspaces.

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
- Wenn sich das aktuelle Arbeitsverzeichnis innerhalb eines gesicherten Quellbaums befindet, verwendet OpenClaw Ihr Home-Verzeichnis als Fallback für den Standard-Ablageort des Archivs.
- Vorhandene Archivdateien werden niemals überschrieben.
- Ausgabepfade innerhalb der Quell-Status-/Workspace-Bäume werden abgelehnt, um Selbstaufnahme zu vermeiden.
- `openclaw backup verify <archive>` validiert, dass das Archiv genau ein Root-Manifest enthält, lehnt Archivpfade im Traversal-Stil ab und prüft, dass jede im Manifest deklarierte Payload im Tarball vorhanden ist.
- `openclaw backup create --verify` führt diese Validierung unmittelbar nach dem Schreiben des Archivs aus.
- `openclaw backup create --only-config` sichert nur die aktive JSON-Konfigurationsdatei.

## Was gesichert wird

`openclaw backup create` plant Backup-Quellen aus Ihrer lokalen OpenClaw-Installation:

- Das vom lokalen Status-Resolver von OpenClaw zurückgegebene Statusverzeichnis, normalerweise `~/.openclaw`
- Den aktiven Konfigurationsdateipfad
- Das aufgelöste Verzeichnis `credentials/`, wenn es außerhalb des Statusverzeichnisses existiert
- Workspace-Verzeichnisse, die aus der aktuellen Konfiguration erkannt werden, sofern Sie nicht `--no-include-workspace` übergeben

Modell-Auth-Profile sind bereits Teil des Statusverzeichnisses unter
`agents/<agentId>/agent/auth-profiles.json`, daher werden sie normalerweise durch den
Backup-Eintrag für den Status abgedeckt.

Wenn Sie `--only-config` verwenden, überspringt OpenClaw die Erkennung von Status-, Anmeldeinformationsverzeichnis- und Workspace-Verzeichnissen und archiviert nur den aktiven Konfigurationsdateipfad.

OpenClaw kanonisiert Pfade, bevor das Archiv erstellt wird. Wenn sich Konfiguration, das
Anmeldeinformationsverzeichnis oder ein Workspace bereits innerhalb des Statusverzeichnisses befinden,
werden sie nicht als separate Top-Level-Backup-Quellen dupliziert. Fehlende Pfade werden
übersprungen.

Die Archiv-Payload speichert Dateiinhalte aus diesen Quellbäumen, und die eingebettete `manifest.json` dokumentiert die aufgelösten absoluten Quellpfade sowie das für jedes Asset verwendete Archivlayout.

## Verhalten bei ungültiger Konfiguration

`openclaw backup` umgeht absichtlich die normale Vorabprüfung der Konfiguration, damit es auch bei der Wiederherstellung helfen kann. Da die Workspace-Erkennung von einer gültigen Konfiguration abhängt, schlägt `openclaw backup create` jetzt sofort fehl, wenn die Konfigurationsdatei zwar existiert, aber ungültig ist und das Workspace-Backup weiterhin aktiviert ist.

Wenn Sie in dieser Situation trotzdem ein partielles Backup möchten, führen Sie stattdessen Folgendes erneut aus:

```bash
openclaw backup create --no-include-workspace
```

Dadurch bleiben Status, Konfiguration und das externe Anmeldeinformationsverzeichnis im Umfang enthalten, während
die Workspace-Erkennung vollständig übersprungen wird.

Wenn Sie nur eine Kopie der Konfigurationsdatei selbst benötigen, funktioniert `--only-config` auch dann, wenn die Konfiguration fehlerhaft ist, da es nicht auf das Parsen der Konfiguration zur Workspace-Erkennung angewiesen ist.

## Größe und Performance

OpenClaw erzwingt keine integrierte maximale Backup-Größe und kein Limit pro Datei.

Praktische Grenzen ergeben sich aus dem lokalen Rechner und dem Zieldateisystem:

- Verfügbarer Speicherplatz für den temporären Archivschreibvorgang plus das endgültige Archiv
- Zeit zum Durchlaufen großer Workspace-Bäume und zum Komprimieren in ein `.tar.gz`
- Zeit zum erneuten Scannen des Archivs, wenn Sie `openclaw backup create --verify` verwenden oder `openclaw backup verify` ausführen
- Verhalten des Dateisystems am Zielpfad. OpenClaw bevorzugt einen Veröffentlichungs-Schritt per Hardlink ohne Überschreiben und greift auf exklusives Kopieren zurück, wenn Hardlinks nicht unterstützt werden

Große Workspaces sind normalerweise der Hauptfaktor für die Archivgröße. Wenn Sie ein kleineres oder schnelleres Backup möchten, verwenden Sie `--no-include-workspace`.

Für das kleinste Archiv verwenden Sie `--only-config`.
