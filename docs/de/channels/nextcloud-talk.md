---
read_when:
    - Arbeiten an Nextcloud Talk-Kanalfunktionen
summary: Status, Fähigkeiten und Konfiguration der Nextcloud Talk-Unterstützung
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T06:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a3af391ffa445ef1ebc7877a1158c3c6aa7ecc71ceadcb0e783a80b040fe062
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Status: gebündeltes Plugin (Webhook-Bot). Direktnachrichten, Räume, Reaktionen und Markdown-Nachrichten werden unterstützt.

## Gebündeltes Plugin

Nextcloud Talk wird in aktuellen OpenClaw-Releases als gebündeltes Plugin mitgeliefert, daher
ist bei normalen paketierten Builds keine separate Installation erforderlich.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne Nextcloud Talk verwenden,
installieren Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelleinrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Nextcloud Talk-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erstellen Sie auf Ihrem Nextcloud-Server einen Bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Aktivieren Sie den Bot in den Einstellungen des Zielraums.
4. Konfigurieren Sie OpenClaw:
   - Konfiguration: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Oder Umgebungsvariable: `NEXTCLOUD_TALK_BOT_SECRET` (nur Standardkonto)

   CLI-Einrichtung:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Entsprechende explizite Felder:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Dateigestütztes Secret:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

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
- Die Webhook-Nutzlast unterscheidet nicht zwischen DMs und Räumen; setzen Sie `apiUser` + `apiPassword`, um Abfragen zum Raumtyp zu aktivieren (andernfalls werden DMs als Räume behandelt).

## Zugriffskontrolle (DMs)

- Standard: `channels.nextcloud-talk.dmPolicy = "pairing"`. Unbekannte Absender erhalten einen Pairing-Code.
- Freigabe über:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Öffentliche DMs: `channels.nextcloud-talk.dmPolicy="open"` plus `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` gleicht nur Nextcloud-Benutzer-IDs ab; Anzeigenamen werden ignoriert.

## Räume (Gruppen)

- Standard: `channels.nextcloud-talk.groupPolicy = "allowlist"` (Mention-Gating).
- Setzen Sie Räume mit `channels.nextcloud-talk.rooms` auf die Allowlist:

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

## Fähigkeiten

| Funktion        | Status             |
| --------------- | ------------------ |
| Direktnachrichten | Unterstützt      |
| Räume           | Unterstützt        |
| Threads         | Nicht unterstützt  |
| Medien          | Nur URL            |
| Reaktionen      | Unterstützt        |
| Native Befehle  | Nicht unterstützt  |

## Konfigurationsreferenz (Nextcloud Talk)

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.nextcloud-talk.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.nextcloud-talk.baseUrl`: URL der Nextcloud-Instanz.
- `channels.nextcloud-talk.botSecret`: Gemeinsames Secret des Bots.
- `channels.nextcloud-talk.botSecretFile`: Secret-Pfad zu regulärer Datei. Symlinks werden abgelehnt.
- `channels.nextcloud-talk.apiUser`: API-Benutzer für Raumabfragen (DM-Erkennung).
- `channels.nextcloud-talk.apiPassword`: API-/App-Passwort für Raumabfragen.
- `channels.nextcloud-talk.apiPasswordFile`: Dateipfad für API-Passwort.
- `channels.nextcloud-talk.webhookPort`: Port des Webhook-Listeners (Standard: 8788).
- `channels.nextcloud-talk.webhookHost`: Webhook-Host (Standard: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: Webhook-Pfad (Standard: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: Extern erreichbare Webhook-URL.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM-Allowlist (Benutzer-IDs). `open` erfordert `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: Gruppen-Allowlist (Benutzer-IDs).
- `channels.nextcloud-talk.rooms`: Einstellungen und Allowlist pro Raum.
- `channels.nextcloud-talk.historyLimit`: Verlaufslimit für Gruppen (0 deaktiviert).
- `channels.nextcloud-talk.dmHistoryLimit`: Verlaufslimit für DMs (0 deaktiviert).
- `channels.nextcloud-talk.dms`: Überschreibungen pro DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: Größe von ausgehendem Text-Chunking (Zeichen).
- `channels.nextcloud-talk.chunkMode`: `length` (Standard) oder `newline`, um vor dem Chunking nach Länge an Leerzeilen (Absatzgrenzen) zu trennen.
- `channels.nextcloud-talk.blockStreaming`: Block-Streaming für diesen Kanal deaktivieren.
- `channels.nextcloud-talk.blockStreamingCoalesce`: Tuning für Block-Streaming-Coalescing.
- `channels.nextcloud-talk.mediaMaxMb`: Obergrenze für eingehende Medien (MB).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Pairing](/de/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/de/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Kanalweiterleitung](/de/channels/channel-routing) — Sitzungsweiterleitung für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
