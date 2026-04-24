---
read_when:
    - Sie haben Konnektivitäts-/Authentifizierungsprobleme und möchten geführte Korrekturen
    - Sie haben aktualisiert und möchten eine Plausibilitätsprüfung
summary: CLI-Referenz für `openclaw doctor` (Integritätsprüfungen + geführte Reparaturen)
title: Doctor
x-i18n:
    generated_at: "2026-04-24T06:31:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ea3f4992effe3d417f20427b3bdb9e47712816106b03bc27a415571cf88a7c
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

Integritätsprüfungen + schnelle Korrekturen für das Gateway und Kanäle.

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

- `--no-workspace-suggestions`: Vorschläge für Workspace-Speicher/Suche deaktivieren
- `--yes`: Standardwerte ohne Rückfrage akzeptieren
- `--repair`: empfohlene Reparaturen ohne Rückfrage anwenden
- `--fix`: Alias für `--repair`
- `--force`: aggressive Reparaturen anwenden, einschließlich des Überschreibens benutzerdefinierter Dienstkonfiguration bei Bedarf
- `--non-interactive`: ohne Eingabeaufforderungen ausführen; nur sichere Migrationen
- `--generate-gateway-token`: ein Gateway-Token generieren und konfigurieren
- `--deep`: Systemdienste nach zusätzlichen Gateway-Installationen durchsuchen

Hinweise:

- Interaktive Eingabeaufforderungen (wie Keychain-/OAuth-Korrekturen) werden nur ausgeführt, wenn stdin ein TTY ist und `--non-interactive` **nicht** gesetzt ist. Headless-Ausführungen (Cron, Telegram, kein Terminal) überspringen Eingabeaufforderungen.
- Leistung: Nicht interaktive `doctor`-Ausführungen überspringen das vorzeitige Laden von Plugins, damit headless Integritätsprüfungen schnell bleiben. Interaktive Sitzungen laden Plugins weiterhin vollständig, wenn eine Prüfung ihren Beitrag benötigt.
- `--fix` (Alias für `--repair`) schreibt eine Sicherung nach `~/.openclaw/openclaw.json.bak` und entfernt unbekannte Konfigurationsschlüssel, wobei jede Entfernung aufgelistet wird.
- Prüfungen der Statusintegrität erkennen jetzt verwaiste Transkriptdateien im Sitzungsverzeichnis und können sie als `.deleted.<timestamp>` archivieren, um sicher Speicherplatz freizugeben.
- Doctor scannt außerdem `~/.openclaw/cron/jobs.json` (oder `cron.store`) auf veraltete Cron-Job-Formen und kann sie direkt überschreiben, bevor der Scheduler sie zur Laufzeit automatisch normalisieren muss.
- Doctor repariert fehlende Laufzeitabhängigkeiten gebündelter Plugins, ohne Schreibzugriff auf das installierte OpenClaw-Paket zu benötigen. Bei npm-Installationen mit Root-Besitz oder gehärteten systemd-Units setzen Sie `OPENCLAW_PLUGIN_STAGE_DIR` auf ein beschreibbares Verzeichnis wie `/var/lib/openclaw/plugin-runtime-deps`.
- Doctor migriert veraltete flache Talk-Konfiguration (`talk.voiceId`, `talk.modelId` und ähnliche) automatisch nach `talk.provider` + `talk.providers.<provider>`.
- Wiederholte Ausführungen von `doctor --fix` melden/wenden keine Talk-Normalisierung mehr an, wenn der einzige Unterschied die Reihenfolge der Objektschlüssel ist.
- Doctor enthält eine Bereitschaftsprüfung für die Memory-Suche und kann `openclaw configure --section model` empfehlen, wenn Einbettungs-Zugangsdaten fehlen.
- Wenn der Sandbox-Modus aktiviert ist, Docker aber nicht verfügbar ist, meldet Doctor eine deutliche Warnung mit Abhilfe (`Docker installieren` oder `openclaw config set agents.defaults.sandbox.mode off`).
- Wenn `gateway.auth.token`/`gateway.auth.password` über SecretRef verwaltet werden und im aktuellen Befehlsablauf nicht verfügbar sind, meldet Doctor eine schreibgeschützte Warnung und schreibt keine Klartext-Fallback-Zugangsdaten.
- Wenn die SecretRef-Prüfung eines Kanals in einem Korrekturpfad fehlschlägt, macht Doctor weiter und meldet eine Warnung, statt vorzeitig abzubrechen.
- Die automatische Auflösung von Telegram-`allowFrom`-Benutzernamen (`doctor --fix`) erfordert ein auflösbares Telegram-Token im aktuellen Befehlsablauf. Wenn die Token-Prüfung nicht verfügbar ist, meldet Doctor eine Warnung und überspringt die automatische Auflösung in diesem Durchlauf.

## macOS: `launchctl`-Env-Überschreibungen

Wenn Sie zuvor `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (oder `...PASSWORD`) ausgeführt haben, überschreibt dieser Wert Ihre Konfigurationsdatei und kann zu anhaltenden „unauthorized“-Fehlern führen.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Gateway Doctor](/de/gateway/doctor)
