---
read_when:
    - Integrieren der Mac-App in den Gateway-Lebenszyklus
summary: Gateway-Lebenszyklus unter macOS (launchd)
title: Gateway-Lebenszyklus
x-i18n:
    generated_at: "2026-04-05T12:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Gateway-Lebenszyklus unter macOS

Die macOS-App **verwaltet das Gateway standardmäßig über launchd** und startet
das Gateway nicht als untergeordneten Prozess. Sie versucht zunächst, sich an ein bereits laufendes
Gateway auf dem konfigurierten Port anzuhängen; wenn keines erreichbar ist, aktiviert sie den launchd-
Service über die externe CLI `openclaw` (keine eingebettete Laufzeit). Das sorgt für
zuverlässigen Auto-Start beim Anmelden und Neustarts bei Abstürzen.

Der Modus mit untergeordnetem Prozess (Gateway direkt von der App gestartet) wird heute **nicht verwendet**.
Wenn Sie eine engere Kopplung an die UI benötigen, führen Sie das Gateway manuell in einem Terminal aus.

## Standardverhalten (launchd)

- Die App installiert einen LaunchAgent pro Benutzer mit dem Label `ai.openclaw.gateway`
  (oder `ai.openclaw.<profile>` bei Verwendung von `--profile`/`OPENCLAW_PROFILE`; Legacy `com.openclaw.*` wird unterstützt).
- Wenn der lokale Modus aktiviert ist, stellt die App sicher, dass der LaunchAgent geladen ist, und
  startet das Gateway bei Bedarf.
- Logs werden in den launchd-Gateway-Logpfad geschrieben (sichtbar in den Debug Settings).

Häufige Befehle:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Ersetzen Sie das Label durch `ai.openclaw.<profile>`, wenn Sie ein benanntes Profil ausführen.

## Unsigned Dev Builds

`scripts/restart-mac.sh --no-sign` ist für schnelle lokale Builds gedacht, wenn Sie keine
Signaturschlüssel haben. Damit launchd nicht auf ein unsigniertes Relay-Binary zeigt, tut es Folgendes:

- Schreibt `~/.openclaw/disable-launchagent`.

Signierte Ausführungen von `scripts/restart-mac.sh` löschen diese Überschreibung, wenn der Marker
vorhanden ist. Zum manuellen Zurücksetzen:

```bash
rm ~/.openclaw/disable-launchagent
```

## Attach-only-Modus

Um die macOS-App zu zwingen, **niemals launchd zu installieren oder zu verwalten**, starten Sie sie mit
`--attach-only` (oder `--no-launchd`). Dadurch wird `~/.openclaw/disable-launchagent` gesetzt,
sodass sich die App nur an ein bereits laufendes Gateway anhängt. Dasselbe Verhalten können Sie in den Debug Settings umschalten.

## Remote-Modus

Der Remote-Modus startet niemals ein lokales Gateway. Die App verwendet einen SSH-Tunnel zum
Remote-Host und verbindet sich über diesen Tunnel.

## Warum wir launchd bevorzugen

- Auto-Start beim Anmelden.
- Eingebaute Semantik für Neustarts/KeepAlive.
- Vorhersagbare Logs und Überwachung.

Falls jemals wieder ein echter Modus mit untergeordnetem Prozess benötigt wird, sollte er als
separater, expliziter Nur-Dev-Modus dokumentiert werden.
