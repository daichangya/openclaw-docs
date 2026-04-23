---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung für Konfiguration/Status ausführen
    - Sie möchten sichere „Fix“-Vorschläge anwenden (Berechtigungen, strengere Standardwerte)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheits-Footguns prüfen und beheben)
title: security
x-i18n:
    generated_at: "2026-04-23T14:01:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Sicherheitstools (Prüfung + optionale Korrekturen).

Verwandt:

- Sicherheitsleitfaden: [Sicherheit](/de/gateway/security)

## Prüfung

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Die Prüfung warnt, wenn mehrere DM-Absender dieselbe Hauptsitzung teilen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsame Posteingänge.
Dies dient der Härtung kooperativer/geteilter Posteingänge. Ein einzelnes Gateway, das von wechselseitig nicht vertrauenswürdigen/gegnerischen Operatoren gemeinsam genutzt wird, ist kein empfohlenes Setup; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten OS-Benutzern/Hosts).
Es gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf wahrscheinlich gemeinsam genutzten Benutzereingang hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert daran, dass OpenClaw standardmäßig ein Vertrauensmodell für persönliche Assistenten hat.
Für absichtlich gemeinsam genutzte Benutzersetups lautet die Empfehlung der Prüfung, alle Sitzungen zu sandboxen, den Dateisystemzugriff auf den Workspace zu begrenzen und persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fernzuhalten.
Sie warnt außerdem, wenn kleine models (`<=300B`) ohne Sandbox und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Eingang warnt sie, wenn `hooks.token` das Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` nicht eingeschränkt ist, wenn Request-`sessionKey`-Überschreibungen aktiviert sind und wenn Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Sie warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` unwirksame musterartige/unbekannte Einträge verwendet (nur exakter Abgleich von Node-Befehlsnamen, keine Filterung von Shell-Text), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn global `tools.profile="minimal"` durch Tool-Profile von Agents überschrieben wird, wenn offene Gruppen Laufzeit-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutz verfügbar machen und wenn installierte Plugin-Tools unter einer freizügigen Tool-Richtlinie erreichbar sein könnten.
Sie markiert außerdem `gateway.allowRealIpFallback=true` (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Metadatenleck über mDNS-TXT-Records).
Sie warnt außerdem, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
Sie markiert außerdem gefährliche Docker-Netzwerkmodi für die Sandbox (einschließlich `host` und `container:*`-Namespace-Joins).
Sie warnt außerdem, wenn vorhandene Docker-Container des Sandbox-Browsers fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor einer Migration ohne `openclaw.browserConfigEpoch`), und empfiehlt `openclaw sandbox recreate --browser --all`.
Sie warnt außerdem, wenn npm-basierte Installationsdatensätze für Plugin-/Hook-Installationen nicht angepinnt sind, Integritätsmetadaten fehlen oder von aktuell installierten Paketversionen abweichen.
Sie warnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs beruhen (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, wo anwendbar).
Sie warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Secret erreichbar lässt (`/tools/invoke` plus jeder aktivierte `/v1/*`-Endpunkt).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Überschreibungen für Operatoren; das Aktivieren einer solchen Einstellung ist für sich genommen kein Bericht über eine Sicherheitslücke.
Für das vollständige Inventar gefährlicher Parameter siehe den Abschnitt „Insecure or dangerous flags summary“ in [Sicherheit](/de/gateway/security).

Verhalten von SecretRef:

- `security audit` löst unterstützte SecretRefs für die betroffenen Pfade im schreibgeschützten Modus auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, läuft die Prüfung weiter und meldet `secretDiagnostics` (anstatt abzustürzen).
- `--token` und `--password` überschreiben nur die Authentifizierung für den Deep-Probe in diesem Befehlsaufruf; sie schreiben weder die Konfiguration noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Richtlinienprüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl die Korrekturaktionen als auch den abschließenden Bericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Korrekturen an:

- setzt häufiges `groupPolicy="open"` auf `groupPolicy="allowlist"` zurück (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, wird `groupAllowFrom` aus
  der gespeicherten `allowFrom`-Datei übernommen, sofern diese Liste existiert und die Konfiguration nicht bereits
  `allowFrom` definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurationsdaten und häufige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzung-
  `*.jsonl`)
- verschärft außerdem eingebundene Konfigurationsdateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Resets unter Windows

`--fix` macht **nicht** Folgendes:

- Tokens/Passwörter/API-Keys rotieren
- Tools deaktivieren (`gateway`, `Cron`, `exec` usw.)
- Bind-/Authentifizierungs-/Netzwerk-Expositionsentscheidungen des Gateways ändern
- Plugins/Skills entfernen oder umschreiben
