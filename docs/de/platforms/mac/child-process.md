---
read_when:
    - Die Mac-App in den Gateway-Lebenszyklus integrieren
summary: Gateway-Lebenszyklus auf macOS (launchd)
title: Gateway-Lebenszyklus
x-i18n:
    generated_at: "2026-04-24T06:47:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# Gateway-Lebenszyklus auf macOS

Die macOS-App **verwaltet das Gateway standardmäßig über launchd** und startet
das Gateway nicht als Kindprozess. Sie versucht zuerst, sich mit einem bereits laufenden
Gateway auf dem konfigurierten Port zu verbinden; wenn keines erreichbar ist,
aktiviert sie den launchd-Dienst über die externe `openclaw` CLI (keine eingebettete Runtime). Dies bietet Ihnen
zuverlässigen automatischen Start bei der Anmeldung und Neustart bei Abstürzen.

Der Modus mit Kindprozess (Gateway wird direkt von der App gestartet) wird **heute nicht verwendet**.
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

## Nicht signierte Dev-Builds

`scripts/restart-mac.sh --no-sign` ist für schnelle lokale Builds gedacht, wenn Sie keine
Signaturschlüssel haben. Damit launchd nicht auf eine nicht signierte Relay-Binärdatei zeigt, wird:

- `~/.openclaw/disable-launchagent` geschrieben.

Signierte Ausführungen von `scripts/restart-mac.sh` löschen diese Überschreibung, wenn die Markierung
vorhanden ist. Zum manuellen Zurücksetzen:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modus „nur anhängen“

Um die macOS-App dazu zu zwingen, launchd **niemals zu installieren oder zu verwalten**, starten Sie
sie mit `--attach-only` (oder `--no-launchd`). Dadurch wird `~/.openclaw/disable-launchagent` gesetzt,
sodass sich die App nur an ein bereits laufendes Gateway anhängt. Dasselbe
Verhalten können Sie in den Debug Settings umschalten.

## Remote-Modus

Der Remote-Modus startet niemals ein lokales Gateway. Die App verwendet einen SSH-Tunnel zum
entfernten Host und verbindet sich über diesen Tunnel.

## Warum wir launchd bevorzugen

- Automatischer Start bei der Anmeldung.
- Integrierte Neustart-/KeepAlive-Semantik.
- Vorhersehbare Logs und Überwachung.

Wenn ein echter Kindprozessmodus jemals wieder benötigt wird, sollte er als
separater, expliziter Nur-Dev-Modus dokumentiert werden.

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Gateway-Runbook](/de/gateway)
