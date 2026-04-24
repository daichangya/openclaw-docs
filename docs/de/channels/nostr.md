---
read_when:
    - Sie möchten, dass OpenClaw DMs über Nostr empfängt
    - Sie richten dezentrales Messaging ein
summary: Nostr-DM-Kanal über NIP-04-verschlüsselte Nachrichten
title: Nostr
x-i18n:
    generated_at: "2026-04-24T06:28:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Status:** Optionales gebündeltes Plugin (standardmäßig deaktiviert, bis es konfiguriert ist).

Nostr ist ein dezentrales Protokoll für soziale Netzwerke. Dieser Kanal ermöglicht es OpenClaw, verschlüsselte Direktnachrichten (DMs) über NIP-04 zu empfangen und darauf zu antworten.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen liefern Nostr als gebündeltes Plugin aus, daher
benötigen normale paketierte Builds keine separate Installation.

### Ältere/benutzerdefinierte Installationen

- Onboarding (`openclaw onboard`) und `openclaw channels add` zeigen
  Nostr weiterhin aus dem gemeinsamen Kanalkatalog an.
- Wenn Ihr Build das gebündelte Nostr ausschließt, installieren Sie es manuell.

```bash
openclaw plugins install @openclaw/nostr
```

Verwenden Sie einen lokalen Checkout (Dev-Workflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Starten Sie das Gateway nach der Installation oder Aktivierung von Plugins neu.

### Nicht-interaktive Einrichtung

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Verwenden Sie `--use-env`, um `NOSTR_PRIVATE_KEY` in der Umgebung zu behalten, statt den Schlüssel in der Konfiguration zu speichern.

## Schnelle Einrichtung

1. Erzeugen Sie ein Nostr-Schlüsselpaar (falls nötig):

```bash
# Mit nak
nak key generate
```

2. Zur Konfiguration hinzufügen:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exportieren Sie den Schlüssel:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Starten Sie das Gateway neu.

## Konfigurationsreferenz

| Schlüssel    | Typ      | Standard                                    | Beschreibung                         |
| ------------ | -------- | ------------------------------------------- | ------------------------------------ |
| `privateKey` | string   | erforderlich                                | Privater Schlüssel im Format `nsec` oder hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URLs (WebSocket)               |
| `dmPolicy`   | string   | `pairing`                                   | DM-Zugriffsrichtlinie                |
| `allowFrom`  | string[] | `[]`                                        | Erlaubte Absender-Pubkeys            |
| `enabled`    | boolean  | `true`                                      | Kanal aktivieren/deaktivieren        |
| `name`       | string   | -                                           | Anzeigename                          |
| `profile`    | object   | -                                           | NIP-01-Profilmetadaten               |

## Profilmetadaten

Profildaten werden als NIP-01-Ereignis `kind:0` veröffentlicht. Sie können sie über die Control UI verwalten (Channels -> Nostr -> Profile) oder direkt in der Konfiguration festlegen.

Beispiel:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Hinweise:

- Profil-URLs müssen `https://` verwenden.
- Das Importieren von Relays führt Felder zusammen und behält lokale Überschreibungen bei.

## Zugriffskontrolle

### DM-Richtlinien

- **pairing** (Standard): unbekannte Absender erhalten einen Kopplungscode.
- **allowlist**: Nur Pubkeys in `allowFrom` können DMs senden.
- **open**: öffentliche eingehende DMs (erfordert `allowFrom: ["*"]`).
- **disabled**: eingehende DMs ignorieren.

Hinweise zur Durchsetzung:

- Signaturen eingehender Ereignisse werden vor der Absenderrichtlinie und der NIP-04-Entschlüsselung verifiziert, sodass gefälschte Ereignisse früh abgewiesen werden.
- Kopplungsantworten werden gesendet, ohne den ursprünglichen DM-Text zu verarbeiten.
- Eingehende DMs sind rate-begrenzt, und übergroße Payloads werden vor der Entschlüsselung verworfen.

### Beispiel für eine Allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Schlüsselformate

Akzeptierte Formate:

- **Privater Schlüssel:** `nsec...` oder 64 Zeichen hex
- **Pubkeys (`allowFrom`):** `npub...` oder hex

## Relays

Standardwerte: `relay.damus.io` und `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Tipps:

- Verwenden Sie 2–3 Relays für Redundanz.
- Vermeiden Sie zu viele Relays (Latenz, Duplikate).
- Bezahlte Relays können die Zuverlässigkeit verbessern.
- Lokale Relays sind für Tests in Ordnung (`ws://localhost:7777`).

## Protokollunterstützung

| NIP    | Status      | Beschreibung                         |
| ------ | ----------- | ------------------------------------ |
| NIP-01 | Unterstützt | Grundlegendes Ereignisformat + Profilmetadaten |
| NIP-04 | Unterstützt | Verschlüsselte DMs (`kind:4`)        |
| NIP-17 | Geplant     | Gift-wrapped-DMs                     |
| NIP-44 | Geplant     | Versionierte Verschlüsselung         |

## Testen

### Lokales Relay

```bash
# strfry starten
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Manueller Test

1. Notieren Sie den Pubkey des Bots (npub) aus den Logs.
2. Öffnen Sie einen Nostr-Client (Damus, Amethyst usw.).
3. Senden Sie dem Pubkey des Bots eine DM.
4. Überprüfen Sie die Antwort.

## Fehlerbehebung

### Nachrichten werden nicht empfangen

- Vergewissern Sie sich, dass der private Schlüssel gültig ist.
- Stellen Sie sicher, dass die Relay-URLs erreichbar sind und `wss://` verwenden (oder `ws://` für lokal).
- Bestätigen Sie, dass `enabled` nicht auf `false` gesetzt ist.
- Prüfen Sie die Gateway-Logs auf Fehler bei der Relay-Verbindung.

### Antworten werden nicht gesendet

- Prüfen Sie, ob das Relay Schreibvorgänge akzeptiert.
- Vergewissern Sie sich, dass ausgehende Konnektivität vorhanden ist.
- Achten Sie auf Rate-Limits des Relays.

### Doppelte Antworten

- Bei Verwendung mehrerer Relays zu erwarten.
- Nachrichten werden anhand der Ereignis-ID dedupliziert; nur die erste Zustellung löst eine Antwort aus.

## Sicherheit

- Committen Sie niemals private Schlüssel.
- Verwenden Sie Umgebungsvariablen für Schlüssel.
- Ziehen Sie `allowlist` für produktive Bots in Betracht.
- Signaturen werden vor der Absenderrichtlinie verifiziert, und die Absenderrichtlinie wird vor der Entschlüsselung durchgesetzt, sodass gefälschte Ereignisse früh abgewiesen werden und unbekannte Absender keine vollständige Kryptografiearbeit erzwingen können.

## Einschränkungen (MVP)

- Nur Direktnachrichten (keine Gruppenchats).
- Keine Medienanhänge.
- Nur NIP-04 (NIP-17-Gift-Wrap ist geplant).

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchats und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
