---
read_when:
    - Sie möchten, dass OpenClaw DMs über Nostr empfängt
    - Sie richten dezentrales Messaging ein
summary: Nostr-DM-Kanal über mit NIP-04 verschlüsselte Nachrichten
title: Nostr
x-i18n:
    generated_at: "2026-04-05T12:35:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Status:** Optionales gebündeltes Plugin (standardmäßig deaktiviert, bis es konfiguriert wird).

Nostr ist ein dezentrales Protokoll für soziale Netzwerke. Dieser Kanal ermöglicht es OpenClaw, verschlüsselte Direktnachrichten (DMs) über NIP-04 zu empfangen und darauf zu antworten.

## Gebündeltes Plugin

Aktuelle OpenClaw-Versionen enthalten Nostr als gebündeltes Plugin, daher ist bei normalen paketierten Builds keine separate Installation erforderlich.

### Ältere/benutzerdefinierte Installationen

- Onboarding (`openclaw onboard`) und `openclaw channels add` zeigen
  Nostr weiterhin aus dem gemeinsamen Kanalkatalog an.
- Wenn Ihr Build das gebündelte Nostr ausschließt, installieren Sie es manuell.

```bash
openclaw plugins install @openclaw/nostr
```

Verwenden Sie einen lokalen Checkout (Entwicklungs-Workflows):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Starten Sie das Gateway nach dem Installieren oder Aktivieren von Plugins neu.

### Nicht-interaktive Einrichtung

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Verwenden Sie `--use-env`, um `NOSTR_PRIVATE_KEY` in der Umgebung zu behalten, statt den Schlüssel in der Konfiguration zu speichern.

## Schnelleinrichtung

1. Erzeugen Sie ein Nostr-Schlüsselpaar (falls erforderlich):

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

3. Den Schlüssel exportieren:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Starten Sie das Gateway neu.

## Konfigurationsreferenz

| Schlüssel    | Typ      | Standard                                    | Beschreibung                          |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | erforderlich                                | Privater Schlüssel im Format `nsec` oder hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay-URLs (WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                   | DM-Zugriffsrichtlinie                 |
| `allowFrom`  | string[] | `[]`                                        | Erlaubte Sender-Pubkeys               |
| `enabled`    | boolean  | `true`                                      | Kanal aktivieren/deaktivieren         |
| `name`       | string   | -                                           | Anzeigename                           |
| `profile`    | object   | -                                           | NIP-01-Profilmetadaten                |

## Profilmetadaten

Profildaten werden als NIP-01-`kind:0`-Ereignis veröffentlicht. Sie können sie über die Control UI verwalten (Channels -> Nostr -> Profile) oder direkt in der Konfiguration festlegen.

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

- **pairing** (Standard): unbekannte Absender erhalten einen Pairing-Code.
- **allowlist**: Nur Pubkeys in `allowFrom` können DMs senden.
- **open**: öffentliche eingehende DMs (erfordert `allowFrom: ["*"]`).
- **disabled**: eingehende DMs ignorieren.

Hinweise zur Durchsetzung:

- Signaturen eingehender Ereignisse werden vor der Absenderrichtlinie und der NIP-04-Entschlüsselung verifiziert, sodass gefälschte Ereignisse früh abgelehnt werden.
- Pairing-Antworten werden gesendet, ohne den ursprünglichen DM-Inhalt zu verarbeiten.
- Eingehende DMs werden rate-limitiert und übergroße Nutzdaten werden vor der Entschlüsselung verworfen.

### Allowlist-Beispiel

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

Standardeinstellung: `relay.damus.io` und `nos.lol`.

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

- Verwenden Sie 2-3 Relays für Redundanz.
- Vermeiden Sie zu viele Relays (Latenz, Duplikate).
- Kostenpflichtige Relays können die Zuverlässigkeit verbessern.
- Lokale Relays sind zum Testen in Ordnung (`ws://localhost:7777`).

## Protokollunterstützung

| NIP    | Status       | Beschreibung                         |
| ------ | ------------ | ------------------------------------ |
| NIP-01 | Unterstützt  | Grundlegendes Ereignisformat + Profilmetadaten |
| NIP-04 | Unterstützt  | Verschlüsselte DMs (`kind:4`)        |
| NIP-17 | Geplant      | Gift-wrapped DMs                     |
| NIP-44 | Geplant      | Versionierte Verschlüsselung         |

## Tests

### Lokales Relay

```bash
# Starten Sie strfry
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

1. Notieren Sie den Bot-Pubkey (npub) aus den Protokollen.
2. Öffnen Sie einen Nostr-Client (Damus, Amethyst usw.).
3. Senden Sie eine DM an den Bot-Pubkey.
4. Verifizieren Sie die Antwort.

## Fehlerbehebung

### Es werden keine Nachrichten empfangen

- Verifizieren Sie, dass der private Schlüssel gültig ist.
- Stellen Sie sicher, dass die Relay-URLs erreichbar sind und `wss://` verwenden (oder `ws://` für lokal).
- Bestätigen Sie, dass `enabled` nicht `false` ist.
- Prüfen Sie die Gateway-Protokolle auf Fehler bei Relay-Verbindungen.

### Es werden keine Antworten gesendet

- Prüfen Sie, ob das Relay Schreibzugriffe akzeptiert.
- Verifizieren Sie ausgehende Konnektivität.
- Achten Sie auf Relay-Rate-Limits.

### Doppelte Antworten

- Bei Verwendung mehrerer Relays ist das zu erwarten.
- Nachrichten werden anhand der Ereignis-ID dedupliziert; nur die erste Zustellung löst eine Antwort aus.

## Sicherheit

- Committen Sie niemals private Schlüssel.
- Verwenden Sie Umgebungsvariablen für Schlüssel.
- Erwägen Sie `allowlist` für Produktions-Bots.
- Signaturen werden vor der Absenderrichtlinie verifiziert, und die Absenderrichtlinie wird vor der Entschlüsselung durchgesetzt, sodass gefälschte Ereignisse früh abgelehnt werden und unbekannte Absender keine vollständige Kryptoverarbeitung erzwingen können.

## Einschränkungen (MVP)

- Nur Direktnachrichten (keine Gruppenchats).
- Keine Medienanhänge.
- Nur NIP-04 (NIP-17 Gift-wrap ist geplant).

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
