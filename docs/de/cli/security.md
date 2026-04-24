---
read_when:
    - Sie möchten eine schnelle Sicherheitsprüfung für Konfiguration/Status ausführen
    - Sie möchten sichere „Fix“-Vorschläge anwenden (Berechtigungen, Defaults verschärfen)
summary: CLI-Referenz für `openclaw security` (häufige Sicherheits-Footguns prüfen und beheben)
title: Sicherheit
x-i18n:
    generated_at: "2026-04-24T06:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Sicherheitstools (Audit + optionale Fixes).

Verwandt:

- Sicherheitsleitfaden: [Sicherheit](/de/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Das Audit warnt, wenn mehrere DM-Absender die Hauptsitzung gemeinsam nutzen, und empfiehlt den **sicheren DM-Modus**: `session.dmScope="per-channel-peer"` (oder `per-account-channel-peer` für Multi-Account-Kanäle) für gemeinsam genutzte Posteingänge.
Dies dient der Härtung kooperativer/gemeinsam genutzter Posteingänge. Ein einzelnes Gateway, das von gegenseitig nicht vertrauenden/gegensätzlichen Operatoren gemeinsam genutzt wird, ist kein empfohlenes Setup; trennen Sie Vertrauensgrenzen mit separaten Gateways (oder separaten OS-Benutzern/Hosts).
Es gibt außerdem `security.trust_model.multi_user_heuristic` aus, wenn die Konfiguration wahrscheinlich auf gemeinsam genutzten Benutzereingang hindeutet (zum Beispiel offene DM-/Gruppenrichtlinie, konfigurierte Gruppenziele oder Wildcard-Absenderregeln), und erinnert daran, dass OpenClaw standardmäßig ein Vertrauensmodell als persönlicher Assistent ist.
Für absichtliche Setups mit gemeinsam genutzten Benutzern empfiehlt die Audit-Anleitung, alle Sitzungen zu sandboxen, Dateisystemzugriff auf den Workspace zu beschränken und persönliche/private Identitäten oder Anmeldedaten von dieser Laufzeit fernzuhalten.
Es warnt außerdem, wenn kleine Modelle (`<=300B`) ohne Sandboxing und mit aktivierten Web-/Browser-Tools verwendet werden.
Für Webhook-Eingang warnt es, wenn `hooks.token` das Gateway-Token wiederverwendet, wenn `hooks.token` kurz ist, wenn `hooks.path="/"`, wenn `hooks.defaultSessionKey` nicht gesetzt ist, wenn `hooks.allowedAgentIds` uneingeschränkt ist, wenn Request-`sessionKey`-Überschreibungen aktiviert sind und wenn Überschreibungen ohne `hooks.allowedSessionKeyPrefixes` aktiviert sind.
Es warnt außerdem, wenn Sandbox-Docker-Einstellungen konfiguriert sind, während der Sandbox-Modus deaktiviert ist, wenn `gateway.nodes.denyCommands` unwirksame musterartige/unbekannte Einträge verwendet (nur exaktes Matching von Node-Befehlsnamen, keine Shell-Text-Filterung), wenn `gateway.nodes.allowCommands` gefährliche Node-Befehle explizit aktiviert, wenn global `tools.profile="minimal"` durch Agent-Tool-Profile überschrieben wird, wenn offene Gruppen Laufzeit-/Dateisystem-Tools ohne Sandbox-/Workspace-Schutz verfügbar machen und wenn installierte Plugin-Tools unter einer permissiven Tool-Richtlinie erreichbar sein könnten.
Es markiert außerdem `gateway.allowRealIpFallback=true` (Risiko von Header-Spoofing bei falsch konfigurierten Proxys) und `discovery.mdns.mode="full"` (Leckage von Metadaten über mDNS-TXT-Records).
Es warnt außerdem, wenn der Sandbox-Browser das Docker-Netzwerk `bridge` ohne `sandbox.browser.cdpSourceRange` verwendet.
Es markiert außerdem gefährliche Netzwerkmodi für Sandbox-Docker (einschließlich `host` und `container:*`-Namespace-Joins).
Es warnt außerdem, wenn bestehende Sandbox-Browser-Docker-Container fehlende/veraltete Hash-Labels haben (zum Beispiel Container vor einer Migration ohne `openclaw.browserConfigEpoch`) und empfiehlt `openclaw sandbox recreate --browser --all`.
Es warnt außerdem, wenn npm-basierte Installationsdatensätze für Plugins/Hooks nicht angeheftet sind, Integritätsmetadaten fehlen oder von den aktuell installierten Paketversionen abweichen.
Es warnt, wenn Kanal-Allowlists auf veränderlichen Namen/E-Mails/Tags statt auf stabilen IDs basieren (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-Scopes, wo anwendbar).
Es warnt, wenn `gateway.auth.mode="none"` Gateway-HTTP-APIs ohne gemeinsames Secret erreichbar lässt (`/tools/invoke` plus jeder aktivierte `/v1/*`-Endpunkt).
Einstellungen mit dem Präfix `dangerous`/`dangerously` sind explizite Break-Glass-Operator-Overrides; das Aktivieren einer solchen Einstellung ist für sich genommen kein Sicherheitslückenbericht.
Das vollständige Inventar gefährlicher Parameter finden Sie im Abschnitt „Insecure or dangerous flags summary“ in [Sicherheit](/de/gateway/security).

SecretRef-Verhalten:

- `security audit` löst unterstützte SecretRefs für seine Zielpfade im schreibgeschützten Modus auf.
- Wenn ein SecretRef im aktuellen Befehlspfad nicht verfügbar ist, läuft das Audit weiter und meldet `secretDiagnostics` (anstatt abzustürzen).
- `--token` und `--password` überschreiben nur die Deep-Probe-Authentifizierung für diese Befehlsausführung; sie schreiben weder Konfiguration noch SecretRef-Zuordnungen um.

## JSON-Ausgabe

Verwenden Sie `--json` für CI-/Richtlinienprüfungen:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Wenn `--fix` und `--json` kombiniert werden, enthält die Ausgabe sowohl Fix-Aktionen als auch den Abschlussbericht:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Was `--fix` ändert

`--fix` wendet sichere, deterministische Behebungen an:

- setzt häufige `groupPolicy="open"` auf `groupPolicy="allowlist"` um (einschließlich Konto-Varianten in unterstützten Kanälen)
- wenn die WhatsApp-Gruppenrichtlinie auf `allowlist` umgestellt wird, wird `groupAllowFrom` aus
  der gespeicherten Datei `allowFrom` übernommen, wenn diese Liste existiert und die Konfiguration `allowFrom`
  nicht bereits definiert
- setzt `logging.redactSensitive` von `"off"` auf `"tools"`
- verschärft Berechtigungen für Status-/Konfigurations- und gängige sensible Dateien
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, Sitzung-
  `*.jsonl`)
- verschärft außerdem Konfigurations-Include-Dateien, auf die aus `openclaw.json` verwiesen wird
- verwendet `chmod` auf POSIX-Hosts und `icacls`-Resets unter Windows

`--fix` macht **nicht** Folgendes:

- Tokens/Passwörter/API-Schlüssel rotieren
- Tools deaktivieren (`gateway`, `cron`, `exec` usw.)
- Bind-/Auth-/Netzwerk-Expositionsentscheidungen des Gateways ändern
- Plugins/Skills entfernen oder umschreiben

## Verwandt

- [CLI-Referenz](/de/cli)
- [Sicherheitsaudit](/de/gateway/security)
