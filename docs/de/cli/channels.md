---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanalprotokolle live verfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Anmelden/Abmelden, Protokolle)
title: Kanäle
x-i18n:
    generated_at: "2026-04-26T12:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73c44ccac8996d2700d8c912d29e1ea08898128427ae10ff2e35b6ed422e45d1
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Verwalten Sie Chat-Kanalkonten und deren Laufzeitstatus auf dem Gateway.

Zugehörige Dokumentation:

- Kanalleitfäden: [Kanäle](/de/channels/index)
- Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)

## Häufige Befehle

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / Fähigkeiten / Auflösen / Protokolle

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (nur mit `--channel`), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` ist der Live-Pfad: Bei einem erreichbaren Gateway führt es pro Konto
`probeAccount`- und optionale `auditAccount`-Prüfungen aus, sodass die Ausgabe den Transportzustand
sowie Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn das Gateway nicht erreichbar ist, greift `channels status` auf rein konfigurationsbasierte Zusammenfassungen
anstelle der Live-Prüfausgabe zurück.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tipp: `openclaw channels add --help` zeigt kanalspezifische Flags an (Token, privater Schlüssel, App-Token, `signal-cli`-Pfade usw.).

Häufige nicht interaktive Oberflächen zum Hinzufügen sind:

- Kanäle mit Bot-Token: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal-/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für umgebungsvariablenbasierte Authentifizierung des Standardkontos, sofern unterstützt

Wenn ein Kanal-Plugin während eines flaggesteuerten `add`-Befehls installiert werden muss, verwendet OpenClaw die Standard-Installationsquelle des Kanals, ohne die interaktive Plugin-Installationsaufforderung zu öffnen.

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie das sofortige Binden bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanalkonto besitzen soll, und schreibt kontoabhängige Routing-Bindungen.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [agents](/de/cli/agents)).

Wenn Sie einem Kanal, der noch einstufige Einstellungen für ein einzelnes Konto verwendet, ein nicht standardmäßiges Konto hinzufügen, verschiebt OpenClaw kontoabhängige Werte der obersten Ebene in die Kontozuordnung des Kanals, bevor das neue Konto geschrieben wird. Bei den meisten Kanälen landen diese Werte in `channels.<channel>.accounts.default`, gebündelte Kanäle können jedoch stattdessen ein vorhandenes passendes hochgestuftes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto zeigt, behält die Hochstufung dieses Konto bei, anstatt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende rein kanalbezogene Bindungen (ohne `accountId`) passen weiterhin auf das Standardkonto.
- `channels add` erstellt oder überschreibt im nicht interaktiven Modus nicht automatisch Bindungen.
- Die interaktive Einrichtung kann optional kontoabhängige Bindungen hinzufügen.

Wenn sich Ihre Konfiguration bereits in einem gemischten Zustand befand (benannte Konten vorhanden und einstufige Einzelkonto-Werte noch gesetzt), führen Sie `openclaw doctor --fix` aus, um kontoabhängige Werte in das für diesen Kanal ausgewählte hochgestufte Konto zu verschieben. Die meisten Kanäle stufen auf `accounts.default` hoch; Matrix kann ein vorhandenes benanntes oder Standardziel beibehalten.

## Anmelden / Abmelden (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Hinweise:

- `channels login` unterstützt `--verbose`.
- `channels login` / `logout` können den Kanal ableiten, wenn nur ein unterstütztes Anmeldeziel konfiguriert ist.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Korrekturen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → Die Nutzungsaufnahme benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, geben Sie einen claude.ai-Sitzungsschlüssel an (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) oder authentifizieren Sie sich erneut über die Claude CLI.
- `openclaw channels status` greift auf rein konfigurationsbasierte Zusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn ein unterstütigtes Kanal-Anmeldedatum über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet es dieses Konto als konfiguriert mit eingeschränkten Hinweisen, anstatt es als nicht konfiguriert anzuzeigen.

## Fähigkeiten-Prüfung

Rufen Sie Hinweise auf Provider-Fähigkeiten ab (Intents/Scopes, sofern verfügbar) sowie Unterstützung statischer Funktionen:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Erweiterungen).
- `--account` ist nur mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord.
- Prüfungen sind providerspezifisch: Discord-Intents + optionale Kanalberechtigungen; Slack-Bot- und Benutzer-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft Teams-App-Token + Graph-Rollen/-Scopes (soweit bekannt kommentiert). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen haben.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, diese Anmeldedaten jedoch im aktuellen Befehlspfad nicht verfügbar sind, gibt der Befehl eingeschränkte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, anstatt den gesamten Lauf abzubrechen.

## Zugehörig

- [CLI-Referenz](/de/cli)
- [Kanäle – Überblick](/de/channels)
