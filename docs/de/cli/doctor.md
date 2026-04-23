---
read_when:
    - Sie haben Verbindungs-/Authentifizierungsprobleme und möchten geführte Fehlerbehebungen.
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung.
summary: CLI-Referenz für `openclaw doctor` (Health-Checks + geführte Reparaturen)
title: doctor
x-i18n:
    generated_at: "2026-04-23T13:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4b858e8726094c950edcde1e3bdff05d03ae2bd216c3519bbee4805955cf851
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Health-Checks + Schnellreparaturen für das Gateway und die Kanäle.

Verwandt:

- Fehlerbehebung: [Fehlerbehebung](/de/gateway/troubleshooting)
- Sicherheitsaudit: [Sicherheit](/de/gateway/security)

## Beispiele

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## Optionen

- `--no-workspace-suggestions`: Workspace-Memory-/Suchvorschläge deaktivieren
- `--yes`: Standardwerte ohne Nachfrage akzeptieren
- `--repair`: Empfohlene Reparaturen ohne Nachfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: Aggressive Reparaturen anwenden, einschließlich des Überschreibens benutzerdefinierter Service-Konfigurationen, wenn nötig
- `--non-interactive`: Ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: Ein Gateway-Token erzeugen und konfigurieren
- `--deep`: Systemdienste auf zusätzliche Gateway-Installationen prüfen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Reparaturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Performance: Nicht interaktive `doctor`-Ausführungen überspringen das eager loading von Plugins, damit Headless-Health-Checks schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn ein Check ihren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt ein Backup nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Prüfungen der Zustandsintegrität erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis und können sie als `.deleted.<timestamp>` archivieren, um sicher Speicherplatz freizugeben.
- Doctor prüft außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf ältere Cron-Job-Formen und kann sie direkt umschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne Schreibzugriff auf das installierte OpenClaw-Paket zu benötigen. Für root-eigene npm-Installationen oder gehärtete systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migriert ältere flache Talk-Konfigurationen (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte `doctor --fix`-Ausführungen melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Credentials für Embeddings fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet doctor eine gut erkennbare Warnung mit Abhilfe (`Docker installieren` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` per SecretRef verwaltet werden und im aktuellen Befehlsausführungspfad nicht verfügbar sind, meldet doctor eine schreibgeschützte Warnung und schreibt keine unverschlüsselten Fallback-Credentials.
- Wenn die SecretRef-Inspektion eines Kanals in einem Reparaturpfad fehlschlägt, fährt doctor fort und meldet eine Warnung, statt vorzeitig zu beenden.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlsausführungspfad. Wenn die Token-Inspektion nicht verfügbar ist, meldet doctor eine Warnung und überspringt die automatische Auflösung in diesem Durchlauf.

## macOS: `launchctl`-Env-Overrides

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann zu dauerhaften „unauthorized“-Fehlern führen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
