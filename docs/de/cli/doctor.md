---
read_when:
    - Sie Verbindungs-/Authentifizierungsprobleme haben und geführte Korrekturen möchten
    - Sie ein Update durchgeführt haben und eine Plausibilitätsprüfung möchten
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: doctor
x-i18n:
    generated_at: "2026-04-05T12:38:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d257a9e2797b4b0b50c1020165c8a1cd6a2342381bf9c351645ca37494c881e1
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Integritätsprüfungen + schnelle Korrekturen für das Gateway und die Kanäle.

Verwandt:

- Fehlerbehebung: [Fehlerbehebung](/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/gateway/security)

## Beispiele

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Optionen

- `--no-workspace-suggestions`: Workspace-Speicher-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Rückfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Rückfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich des Überschreibens benutzerdefinierter Dienstkonfigurationen bei Bedarf
- `--non-interactive`: ohne Rückfragen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen

Hinweise:

- Interaktive Abfragen (wie Korrekturen für Keychain/OAuth) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (cron, Telegram, kein Terminal) überspringen Abfragen.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Integritätsprüfungen des Status erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis und können sie als `.deleted.<timestamp>` archivieren, um sicher Speicherplatz freizugeben.
- Doctor prüft auch `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Formen und kann sie direkt dort umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor migriert die veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und verwandte Felder) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte Ausführungen von `doctor --fix` melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Anmeldedaten fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine deutliche Warnung mit Abhilfe (`install Docker` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` von SecretRef verwaltet werden und im aktuellen Befehlspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine Fallback-Anmeldedaten im Klartext.
- Wenn die SecretRef-Prüfung eines Kanals in einem Fix-Pfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt vorzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlspfad. Wenn die Token-Prüfung nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung in diesem Durchlauf.

## macOS: `launchctl`-Umgebungsüberschreibungen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann zu dauerhaften „unauthorized“-Fehlern führen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
