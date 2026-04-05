---
read_when:
    - Sie verwenden DMs im Pairing-Modus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Pairing-Anfragen genehmigen/auflisten)
title: pairing
x-i18n:
    generated_at: "2026-04-05T12:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DM-Pairing-Anfragen genehmigen oder prüfen (für Kanäle, die Pairing unterstützen).

Verwandt:

- Pairing-Ablauf: [Pairing](/channels/pairing)

## Befehle

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Ausstehende Pairing-Anfragen für einen Kanal auflisten.

Optionen:

- `[channel]`: positionale Kanal-ID
- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Kanäle mit mehreren Konten
- `--json`: maschinenlesbare Ausgabe

Hinweise:

- Wenn mehrere Pairing-fähige Kanäle konfiguriert sind, müssen Sie einen Kanal entweder positional oder mit `--channel` angeben.
- Erweiterungskanäle sind zulässig, solange die Kanal-ID gültig ist.

## `pairing approve`

Einen ausstehenden Pairing-Code genehmigen und diesen Absender zulassen.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein Pairing-fähiger Kanal konfiguriert ist

Optionen:

- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Konto-ID für Kanäle mit mehreren Konten
- `--notify`: eine Bestätigung über denselben Kanal an den Anfragenden senden

## Hinweise

- Kanaleingabe: Geben Sie sie positional an (`pairing list telegram`) oder mit `--channel <channel>`.
- `pairing list` unterstützt `--account <accountId>` für Kanäle mit mehreren Konten.
- `pairing approve` unterstützt `--account <accountId>` und `--notify`.
- Wenn nur ein Pairing-fähiger Kanal konfiguriert ist, ist `pairing approve <code>` zulässig.
