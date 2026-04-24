---
read_when:
    - Sie verwenden DMs im Kopplungsmodus und müssen Absender genehmigen
summary: CLI-Referenz für `openclaw pairing` (Kopplungsanfragen genehmigen/auflisten)
title: Kopplung
x-i18n:
    generated_at: "2026-04-24T06:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

DM-Kopplungsanfragen genehmigen oder prüfen (für Kanäle, die Kopplung unterstützen).

Verwandt:

- Kopplungsablauf: [Pairing](/de/channels/pairing)

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

Ausstehende Kopplungsanfragen für einen Kanal auflisten.

Optionen:

- `[channel]`: positionale Kanal-ID
- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Account-ID für Multi-Account-Kanäle
- `--json`: maschinenlesbare Ausgabe

Hinweise:

- Wenn mehrere kopplungsfähige Kanäle konfiguriert sind, müssen Sie einen Kanal entweder positional oder mit `--channel` angeben.
- Extension-Kanäle sind erlaubt, solange die Kanal-ID gültig ist.

## `pairing approve`

Einen ausstehenden Kopplungscode genehmigen und diesen Absender erlauben.

Verwendung:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, wenn genau ein kopplungsfähiger Kanal konfiguriert ist

Optionen:

- `--channel <channel>`: explizite Kanal-ID
- `--account <accountId>`: Account-ID für Multi-Account-Kanäle
- `--notify`: eine Bestätigung über denselben Kanal an den Anfragenden senden

## Hinweise

- Kanaleingabe: Geben Sie sie positional (`pairing list telegram`) oder mit `--channel <channel>` an.
- `pairing list` unterstützt `--account <accountId>` für Multi-Account-Kanäle.
- `pairing approve` unterstützt `--account <accountId>` und `--notify`.
- Wenn nur ein kopplungsfähiger Kanal konfiguriert ist, ist `pairing approve <code>` erlaubt.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Kanal-Kopplung](/de/channels/pairing)
