---
read_when:
    - Arbeiten an Nextcloud Talk-Kanalfunktionen
summary: Unterstützungsstatus, Funktionen und Konfiguration für Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-05T12:35:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 900402afe67cf3ce96103d55158eb28cffb29c9845b77248e70d7653b12ae810
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

# Nextcloud Talk

Status: gebündeltes Plugin (Webhook-Bot). Direct Messages, Räume, Reaktionen und Markdown-Nachrichten werden unterstützt.

## Gebündeltes Plugin

Nextcloud Talk wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne Nextcloud Talk verwenden, installieren Sie es manuell:

Installation per CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Details: [Plugins](/tools/plugin)

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Nextcloud Talk-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den oben genannten Befehlen manuell hinzufügen.
2. Erstellen Sie auf Ihrem Nextcloud-Server einen Bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Aktivieren Sie den Bot in den Einstellungen des Zielraums.
4. Konfigurieren Sie OpenClaw:
   - Konfiguration: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oder Env: `NEXTCLOUD_TALK_BOT_SECRET` (nur Standardkonto)
5. Starten Sie das Gateway neu (oder schließen Sie die Einrichtung ab).

Minimale Konfiguration:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Hinweise

- Bots können keine DMs initiieren. Der Benutzer muss dem Bot zuerst schreiben.
- Die Webhook-URL muss vom Gateway erreichbar sein; setzen Sie `webhookPublicUrl`, wenn Sie sich hinter einem Proxy befinden.
- Medien-Uploads werden von der Bot-API nicht unterstützt; Medien werden als URLs gesendet.
- Die Webhook-Payload unterscheidet nicht zwischen DMs und Räumen; setzen Sie `apiUser` + `apiPassword`, um Raumtyp-Lookups zu aktivieren (andernfalls werden DMs als Räume behandelt).

## Zugriffskontrolle (DMs)

- Standard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Pairing-Code.
- Freigabe über:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Öffentliche DMs: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` gleicht nur Nextcloud-Benutzer-IDs ab; Anzeigenamen werden ignoriert.

## Räume (Gruppen)

- Standard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (Mention-Gating).
- Setzen Sie Räume auf die Allowlist mit `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Um keine Räume zuzulassen, lassen Sie die Allowlist leer oder setzen Sie `channels.nextcloud-talk.groupPolicy="disabled"`.

## Funktionen

| Funktion        | Status            |
| --------------- | ----------------- |
| Direct Messages | Unterstützt       |
| Räume           | Unterstützt       |
| Threads         | Nicht unterstützt |
| Medien          | Nur URL           |
| Reaktionen      | Unterstützt       |
| Native Befehle  | Nicht unterstützt |

## Konfigurationsreferenz (Nextcloud Talk)

Vollständige Konfiguration: [Configuration](/gateway/configuration)

Provider-Optionen:

- `channels.nextcloud-talk.enabled`: Start des Kanals aktivieren/deaktivieren.
- `channels.nextcloud-talk.baseUrl`: URL der Nextcloud-Instanz.
- `channels.nextcloud-talk.botSecret`: gemeinsames Secret des Bots.
- `channels.nextcloud-talk.botSecretFile`: Secret-Pfad zu einer regulären Datei. Symlinks werden abgelehnt.
- `channels.nextcloud-talk.apiUser`: API-Benutzer für Raum-Lookups (DM-Erkennung).
- `channels.nextcloud-talk.apiPassword`: API-/App-Passwort für Raum-Lookups.
- `channels.nextcloud-talk.apiPasswordFile`: Dateipfad für das API-Passwort.
- `channels.nextcloud-talk.webhookPort`: Port des Webhook-Listeners (Standard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-Host (Standard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-Pfad (Standard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: extern erreichbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: Gruppen-Allowlist (Benutzer-IDs).
- `channels.nextcloud-talk.rooms`: Einstellungen und Allowlist pro Raum.
- `channels.nextcloud-talk.historyLimit`: Verlaufslimit für Gruppen (0 deaktiviert).
- `channels.nextcloud-talk.dmHistoryLimit`: Verlaufslimit für DMs (0 deaktiviert).
- `channels.nextcloud-talk.dms`: Überschreibungen pro DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: Chunk-Größe für ausgehenden Text (Zeichen).
- `channels.nextcloud-talk.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu teilen.
- `channels.nextcloud-talk.blockStreaming`: Block-Streaming für diesen Kanal deaktivieren.
- `channels.nextcloud-talk.blockStreamingCoalesce`: Feineinstellung für das Zusammenfassen von Block-Streaming.
- `channels.nextcloud-talk.mediaMaxMb`: Limit für eingehende Medien (MB).

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
