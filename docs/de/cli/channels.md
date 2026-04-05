---
read_when:
    - Sie möchten Kanalkonten hinzufügen/entfernen (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - Sie möchten den Kanalstatus prüfen oder Kanal-Logs mitverfolgen
summary: CLI-Referenz für `openclaw channels` (Konten, Status, Login/Logout, Logs)
title: channels
x-i18n:
    generated_at: "2026-04-05T12:37:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Verwalten Sie Chat-Kanalkonten und ihren Runtime-Status auf dem Gateway.

Verwandte Dokumentation:

- Kanalanleitungen: [Channels](/channels/index)
- Gateway-Konfiguration: [Configuration](/gateway/configuration)

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
Prüfungen mit `probeAccount` und optional `auditAccount` aus, sodass die Ausgabe den Transportzustand
sowie Prüfergebnisse wie `works`, `probe failed`, `audit ok` oder `audit failed` enthalten kann.
Wenn das Gateway nicht erreichbar ist, greift `channels status` stattdessen auf reine Konfigurationszusammenfassungen
zurück, anstatt eine Live-Prüfausgabe anzuzeigen.

## Konten hinzufügen / entfernen

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

Tipp: `openclaw channels add --help` zeigt kanalspezifische Flags an (Token, privater Schlüssel, App-Token, signal-cli-Pfade usw.).

Häufige nicht interaktive Oberflächen zum Hinzufügen umfassen:

- Bot-Token-Kanäle: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal-/iMessage-Transportfelder: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google-Chat-Felder: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix-Felder: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr-Felder: `--private-key`, `--relay-urls`
- Tlon-Felder: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- `--use-env` für env-gestützte Authentifizierung des Standardkontos, sofern unterstützt

Wenn Sie `openclaw channels add` ohne Flags ausführen, kann der interaktive Assistent Folgendes abfragen:

- Konto-IDs pro ausgewähltem Kanal
- optionale Anzeigenamen für diese Konten
- `Bind configured channel accounts to agents now?`

Wenn Sie das sofortige Binden bestätigen, fragt der Assistent, welcher Agent jedes konfigurierte Kanalkonto besitzen soll, und schreibt kontobezogene Routing-Bindings.

Sie können dieselben Routing-Regeln später auch mit `openclaw agents bindings`, `openclaw agents bind` und `openclaw agents unbind` verwalten (siehe [agents](/cli/agents)).

Wenn Sie einem Kanal ein Nicht-Standardkonto hinzufügen, der noch kanalweite Single-Account-Einstellungen auf oberster Ebene verwendet, verschiebt OpenClaw kontobezogene Werte auf oberster Ebene in die Kontenzuordnung des Kanals, bevor das neue Konto geschrieben wird. Die meisten Kanäle schreiben diese Werte nach `channels.<channel>.accounts.default`, aber gebündelte Kanäle können stattdessen ein bereits vorhandenes passendes migriertes Konto beibehalten. Matrix ist das aktuelle Beispiel: Wenn bereits ein benanntes Konto existiert oder `defaultAccount` auf ein vorhandenes benanntes Konto zeigt, behält die Migration dieses Konto bei, anstatt ein neues `accounts.default` zu erstellen.

Das Routing-Verhalten bleibt konsistent:

- Bestehende rein kanalbezogene Bindings (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein.
- `channels add` erstellt oder überschreibt im nicht interaktiven Modus keine Bindings automatisch.
- Die interaktive Einrichtung kann optional kontobezogene Bindings hinzufügen.

Wenn sich Ihre Konfiguration bereits in einem gemischten Zustand befand (benannte Konten vorhanden und dennoch Single-Account-Werte auf oberster Ebene gesetzt), führen Sie `openclaw doctor --fix` aus, um kontobezogene Werte in das für diesen Kanal gewählte migrierte Konto zu verschieben. Die meisten Kanäle migrieren nach `accounts.default`; Matrix kann ein vorhandenes benanntes/Standardziel stattdessen beibehalten.

## Login / Logout (interaktiv)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

Hinweise:

- `channels login` unterstützt `--verbose`.
- `channels login` / `logout` können den Kanal ableiten, wenn nur ein unterstütztes Login-Ziel konfiguriert ist.

## Fehlerbehebung

- Führen Sie `openclaw status --deep` für eine umfassende Prüfung aus.
- Verwenden Sie `openclaw doctor` für geführte Fehlerbehebungen.
- `openclaw channels list` gibt `Claude: HTTP 403 ... user:profile` aus → der Nutzungs-Snapshot benötigt den Scope `user:profile`. Verwenden Sie `--no-usage`, stellen Sie einen claude.ai-Sitzungsschlüssel bereit (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) oder authentifizieren Sie sich erneut über Claude CLI.
- `openclaw channels status` greift auf reine Konfigurationszusammenfassungen zurück, wenn das Gateway nicht erreichbar ist. Wenn eine unterstützte Kanalanmeldung über SecretRef konfiguriert ist, aber im aktuellen Befehlspfad nicht verfügbar ist, meldet es dieses Konto als konfiguriert mit verschlechterten Hinweisen, anstatt es als nicht konfiguriert anzuzeigen.

## Capabilities-Prüfung

Rufen Sie Provider-Fähigkeitshinweise (Intents/Scopes, sofern verfügbar) sowie statische Funktionsunterstützung ab:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

Hinweise:

- `--channel` ist optional; lassen Sie es weg, um jeden Kanal aufzulisten (einschließlich Erweiterungen).
- `--account` ist nur zusammen mit `--channel` gültig.
- `--target` akzeptiert `channel:<id>` oder eine rohe numerische Kanal-ID und gilt nur für Discord.
- Prüfungen sind providerspezifisch: Discord-Intents + optionale Kanalberechtigungen; Slack-Bot- + Benutzer-Scopes; Telegram-Bot-Flags + Webhook; Signal-Daemon-Version; Microsoft-Teams-App-Token + Graph-Rollen/-Scopes (wo bekannt entsprechend gekennzeichnet). Kanäle ohne Prüfungen melden `Probe: unavailable`.

## Namen in IDs auflösen

Lösen Sie Kanal-/Benutzernamen mithilfe des Provider-Verzeichnisses in IDs auf:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

Hinweise:

- Verwenden Sie `--kind user|group|auto`, um den Zieltyp zu erzwingen.
- Die Auflösung bevorzugt aktive Treffer, wenn mehrere Einträge denselben Namen teilen.
- `channels resolve` ist schreibgeschützt. Wenn ein ausgewähltes Konto über SecretRef konfiguriert ist, diese Anmeldeinformationen im aktuellen Befehlspfad jedoch nicht verfügbar sind, liefert der Befehl verschlechterte, nicht aufgelöste Ergebnisse mit Hinweisen zurück, anstatt den gesamten Lauf abzubrechen.
