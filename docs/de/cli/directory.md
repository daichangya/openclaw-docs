---
read_when:
    - Sie möchten Kontakt-/Gruppen-/Eigen-IDs für einen Kanal nachschlagen
    - Sie entwickeln einen Kanal-Directory-Adapter
summary: CLI-Referenz für `openclaw directory` (selbst, Peers, Gruppen)
title: Directory
x-i18n:
    generated_at: "2026-04-24T06:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Directory-Abfragen für Kanäle, die dies unterstützen (Kontakte/Peers, Gruppen und „ich“).

## Allgemeine Flags

- `--channel <name>`: Kanal-ID/-Alias (erforderlich, wenn mehrere Kanäle konfiguriert sind; automatisch, wenn nur einer konfiguriert ist)
- `--account <id>`: Konto-ID (Standard: Kanal-Standardkonto)
- `--json`: JSON ausgeben

## Hinweise

- `directory` soll Ihnen helfen, IDs zu finden, die Sie in andere Befehle einfügen können (insbesondere `openclaw message send --target ...`).
- Bei vielen Kanälen sind die Ergebnisse konfigurationsgestützt (Allowlists / konfigurierte Gruppen) und kein Live-Provider-Directory.
- Die Standardausgabe ist `id` (und manchmal `name`), getrennt durch einen Tabulator; verwenden Sie `--json` für Skripte.

## Ergebnisse mit `message send` verwenden

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-Formate (nach Kanal)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (Gruppe)
- Telegram: `@username` oder numerische Chat-ID; Gruppen sind numerische IDs
- Slack: `user:U…` und `channel:C…`
- Discord: `user:<id>` und `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` oder `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` und `conversation:<id>`
- Zalo (Plugin): Benutzer-ID (Bot API)
- Persönliches Zalo / `zalouser` (Plugin): Thread-ID (DM/Gruppe) von `zca` (`me`, `friend list`, `group list`)

## Ich selbst ("me")

```bash
openclaw directory self --channel zalouser
```

## Peers (Kontakte/Benutzer)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Gruppen

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Verwandt

- [CLI-Referenz](/de/cli)
