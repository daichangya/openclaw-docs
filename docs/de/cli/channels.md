---
read_when:
    - Sie möchten Channel-Konten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix).
    - Sie möchten den Channel-Status prüfen oder Channel-Logs mitverfolgen.
summary: CLI-Referenz für `openclaw channels` (`accounts`, `status`, `login`/`logout`, `logs`)
title: Channels
x-i18n:
    generated_at: "2026-04-24T06:30:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Verwalten von Chat-Channel-Konten und ihres Laufzeitstatus auf dem Gateway.

Verwandte Dokumentation:

- Channel-Anleitungen: [Channels](/de/channels/index)
- Gateway-Konfiguration: [Configuration](/de/gateway/configuration)

## Häufige Befehle

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Bei einem erreichbaren Gateway führt es pro Konto
`probeAccount`- und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportzustand
sowie Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn das Gateway nicht erreichbar ist, greift `channels status` auf reine Konfigurationszusammenfassungen
anstelle einer Live-Prüfausgabe zurück.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tipp: `openclaw channels add --help` zeigt Channel-spezifische Flags an (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).

Häufige nicht-interaktive Add-Oberflächen sind unter anderem:

- Bot-Token-Channels: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal-/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, wo unterstützt

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Channel
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie „jetzt binden“ bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Channel-Konto übernehmen soll, und schreibt kontobezogene Routing-Bindings.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [agents](/de/cli/agents)).

Wenn Sie einem Channel, der noch Single-Account-Einstellungen auf Top-Level verwendet, ein Nicht-Standardkonto hinzufügen, überführt OpenClaw kontoabhängige Top-Level-Werte in die Konten-Map des Channels, bevor das neue Konto geschrieben wird. Bei den meisten Channels landen diese Werte unter `channels.<channel>.accounts.default`, aber gebündelte Channels können stattdessen ein vorhandenes passendes migriertes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto zeigt, behält die Überführung dieses Konto bei, anstatt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende nur-Channel-Bindings (ohne `accountId`) passen weiterhin auf das Standardkonto.
- `channels add` erstellt oder überschreibt im nicht-interaktiven Modus keine Bindings automatisch.
- Die interaktive Einrichtung kann optional kontobezogene Bindings hinzufügen.

Wenn sich Ihre Konfiguration bereits in einem gemischten Zustand befand (benannte Konten vorhanden und kontoübergreifende Single-Account-Werte weiterhin auf Top-Level gesetzt), führen Sie `openclaw doctor --fix` aus, um kontoabhängige Werte in das für diesen Channel ausgewählte migrierte Konto zu verschieben. Bei den meisten Channels erfolgt die Überführung nach `accounts.default`; Matrix kann ein vorhandenes benanntes/Standard-Ziel beibehalten.

## Login / Logout (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Hinweise:

- `channels login` unterstützt `--verbose`.
- `channels login` / `logout` können den Channel ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → die Nutzungsübersicht benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, oder stellen Sie einen claude.ai-Session-Key bereit (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`), oder authentifizieren Sie sich erneut über Claude CLI.
- `openclaw channels status` greift auf reine Konfigurationszusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn ein unterstützter Channel-Zugangsnachweis über SecretRef konfiguriert, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet es dieses Konto als konfiguriert mit Hinweisen auf eingeschränkten Zustand, statt es als nicht konfiguriert anzuzeigen.

## Capabilities-Prüfung

Abrufen von Hinweisen zu Provider-Fähigkeiten (Intents/Scopes, sofern verfügbar) sowie statischer Feature-Unterstützung:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Channel aufzulisten (einschließlich Extensions).
- `--account` ist nur zusammen mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Channel-ID und gilt nur für Discord.
- Prüfungen sind providerspezifisch: Discord-Intents + optionale Channel-Berechtigungen; Slack-Bot- und Benutzer-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token + Graph-Rollen/-Scopes (wo bekannt entsprechend annotiert). Channels ohne Prüfungen melden `Probe: unavailable`.

## Namen zu IDs auflösen

Auflösen von Channel-/Benutzernamen in IDs mithilfe des Provider-Verzeichnisses:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen teilen.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, dieser Zugangsnachweis aber im aktuellen Befehlspfad nicht verfügbar ist, liefert der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, anstatt den gesamten Lauf abzubrechen.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Channels overview](/de/channels)
