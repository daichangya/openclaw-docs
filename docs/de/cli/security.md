---
read_when:
    - Sie eine schnelle Sicherheitsprüfung für Konfiguration/Status ausführen möchten
    - Sie sichere „Fix“-Vorschläge anwenden möchten (Berechtigungen, Standards verschärfen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheitsfallen prüfen und beheben)
title: security
x-i18n:
    generated_at: "2026-04-05T12:39:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Sicherheitswerkzeuge (Prüfung + optionale Korrekturen).

Verwandt:

- Sicherheitsleitfaden: [Sicherheit](/gateway/security)

## Prüfung

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Die Prüfung warnt, wenn mehrere DM-Absender sich die Hauptsitzung teilen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Kanäle mit mehreren Konten) für gemeinsam genutzte Posteingänge.
Dies dient der Härtung kooperativer/gemeinsam genutzter Posteingänge. Ein einzelnes Gateway, das von gegenseitig nicht vertrauenden/gegnerischen Betreibern gemeinsam genutzt wird, ist kein empfohlenes Setup; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten OS-Benutzern/Hosts).
Außerdem gibt es `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration auf wahrscheinlich von mehreren Benutzern genutzten Eingang hindeutet (zum Beispiel offene DM-/Gruppenrichtlinien, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert daran, dass OpenClaw standardmäßig ein Vertrauensmodell für persönliche Assistenten verwendet.
Für absichtlich von mehreren Benutzern genutzte Setups lautet die Empfehlung der Prüfung, alle Sitzungen in einer Sandbox auszuführen, den Dateisystemzugriff auf den Workspace zu begrenzen und persönliche/private Identitäten oder Anmeldedaten aus dieser Laufzeitumgebung herauszuhalten.
Außerdem wird gewarnt, wenn kleine Modelle (`<=300B`) ohne Sandbox und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Eingang wird gewarnt, wenn `hooks.token` das Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` nicht eingeschränkt ist, wenn Überschreibungen von Request-`sessionKey` aktiviert sind und wenn Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Außerdem wird gewarnt, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` unwirksame musterähnliche/unbekannte Einträge verwendet (nur exakter Abgleich des Knotebefehlsnamens, keine Filterung von Shell-Text), wenn `gateway.nodes.allowCommands` gefährliche Knotebefehle explizit aktiviert, wenn das globale `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn offene Gruppen Laufzeit-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutz bereitstellen und wenn installierte Erweiterungs-Plugin-Tools unter einer permissiven Tool-Richtlinie erreichbar sein könnten.
Außerdem wird `gateway.allowRealIpFallback=true` markiert (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Leck von Metadaten über mDNS-TXT-Records).
Außerdem wird gewarnt, wenn die Browser-Sandbox das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
Außerdem werden gefährliche Docker-Netzwerkmodi der Sandbox markiert (einschließlich `host` und `container:*`-Namespace-Verknüpfungen).
Außerdem wird gewarnt, wenn vorhandene Docker-Container der Browser-Sandbox fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor einer Migration ohne `openclaw.browserConfigEpoch`) und `openclaw sandbox recreate --browser --all` empfohlen.
Außerdem wird gewarnt, wenn npm-basierte Installationsdatensätze für Plugins/Hooks nicht angepinnt sind, Integritätsmetadaten fehlen oder von den aktuell installierten Paketversionen abweichen.
Es wird gewarnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs basieren (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Bereiche, wo zutreffend).
Es wird gewarnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Geheimnis erreichbar lässt (`/tools/invoke` plus jeder aktivierte `/v1/*`-Endpunkt).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Operator-Überschreibungen; das Aktivieren einer solchen Einstellung ist für sich genommen kein Sicherheitslückenbericht.
Eine vollständige Übersicht gefährlicher Parameter finden Sie im Abschnitt „Insecure or dangerous flags summary“ unter [Sicherheit](/gateway/security).

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs auf den gezielten Pfaden im schreibgeschützten Modus auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, wird die Prüfung fortgesetzt und `secretDiagnostics` gemeldet (anstatt abzustürzen).
- `--token` und `--password` überschreiben nur die Deep-Probe-Authentifizierung für diesen Befehlsaufruf; sie schreiben weder die Konfiguration noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Richtlinienprüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl Korrekturmaßnahmen als auch den abschließenden Bericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Korrekturen an:

- setzt häufiges `groupPolicy="open"` auf `groupPolicy="allowlist"` zurück (einschließlich Kontovarianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, wird `groupAllowFrom` aus
  der gespeicherten `allowFrom`-Datei übernommen, wenn diese Liste vorhanden ist und die Konfiguration nicht bereits
  `allowFrom` definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurationsdateien und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzung-
  `*.jsonl`)
- verschärft außerdem eingebundene Konfigurationsdateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Resets unter Windows

`--fix` tut **nicht**:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Bind/Auth/Netzwerk-Expositionsentscheidungen des Gateways ändern
- Plugins/Skills entfernen oder umschreiben
