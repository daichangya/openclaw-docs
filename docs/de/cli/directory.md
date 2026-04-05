---
read_when:
    - Sie möchten Kontakt-/Gruppen-/eigene IDs für einen Kanal nachschlagen
    - Sie entwickeln einen Channel-Directory-Adapter
summary: CLI-Referenz für `openclaw directory` (self, peers, groups)
title: directory
x-i18n:
    generated_at: "2026-04-05T12:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Directory-Lookups für Channels, die dies unterstützen (Kontakte/Peers, Gruppen und „ich“).

## Allgemeine Flags

- `--channel <name>`: Channel-ID/-Alias (erforderlich, wenn mehrere Channels konfiguriert sind; automatisch, wenn nur einer konfiguriert ist)
- `--account <id>`: Konto-ID (Standard: Channel-Standardkonto)
- `--json`: JSON ausgeben

## Hinweise

- `directory` soll Ihnen helfen, IDs zu finden, die Sie in andere Befehle einfügen können (insbesondere `openclaw message send --target ...`).
- Bei vielen Channels sind die Ergebnisse konfigurationsbasiert (Allowlists / konfigurierte Gruppen) und kein Live-Provider-Directory.
- Die Standardausgabe ist `id` (und manchmal `name`), getrennt durch einen Tabulator; verwenden Sie `--json` für Skripting.

## Ergebnisse mit `message send` verwenden

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID-Formate (nach Channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (Gruppe)
- Telegram: `@username` oder numerische Chat-ID; Gruppen sind numerische IDs
- Slack: `user:U…` und `channel:C…`
- Discord: `user:<id>` und `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server` oder `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` und `conversation:<id>`
- Zalo (Plugin): Benutzer-ID (Bot API)
- Zalo Personal / `zalouser` (Plugin): Thread-ID (DM/Gruppe) aus `zca` (`me`, `friend list`, `group list`)

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
