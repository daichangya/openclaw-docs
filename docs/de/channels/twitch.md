---
read_when:
    - Einrichten der Twitch-Chat-Integration für OpenClaw
summary: Konfiguration und Einrichtung des Twitch-Chatbots
title: Twitch
x-i18n:
    generated_at: "2026-04-05T12:37:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Unterstützung für Twitch-Chat über eine IRC-Verbindung. OpenClaw verbindet sich als Twitch-Benutzer (Bot-Konto), um Nachrichten in Kanälen zu empfangen und zu senden.

## Gebündeltes Plugin

Twitch wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte Builds keine separate Installation.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation ohne Twitch verwenden, installieren Sie es manuell:

Installation per CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/twitch
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Details: [Plugins](/tools/plugin)

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Twitch-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den oben genannten Befehlen manuell hinzufügen.
2. Erstellen Sie ein dediziertes Twitch-Konto für den Bot (oder verwenden Sie ein vorhandenes Konto).
3. Erzeugen Sie Anmeldedaten: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Wählen Sie **Bot Token**
   - Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
   - Kopieren Sie die **Client ID** und das **Access Token**
4. Ermitteln Sie Ihre Twitch-Benutzer-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Konfigurieren Sie das Token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
   - Oder config: `channels.twitch.accessToken`
   - Wenn beides gesetzt ist, hat config Vorrang (Env-Fallback gilt nur für das Standardkonto).
6. Starten Sie das Gateway.

**⚠️ Wichtig:** Fügen Sie eine Zugriffskontrolle (`allowFrom` oder `allowedRoles`) hinzu, damit keine unbefugten Benutzer den Bot auslösen können. `requireMention` ist standardmäßig auf `true` gesetzt.

Minimale Konfiguration:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Twitch-Konto des Bots
      accessToken: "oauth:abc123...", // OAuth Access Token (oder OPENCLAW_TWITCH_ACCESS_TOKEN als Env var verwenden)
      clientId: "xyz789...", // Client ID vom Token Generator
      channel: "vevisk", // Welchem Twitch-Chat beigetreten werden soll (erforderlich)
      allowFrom: ["123456789"], // (empfohlen) nur Ihre Twitch-Benutzer-ID - abrufbar über https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Was es ist

- Ein Twitch-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen immer an Twitch zurück.
- Jedes Konto wird auf einen isolierten Sitzungsschlüssel `agent:<agentId>:twitch:<accountName>` abgebildet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` ist der Chatraum, dem beigetreten wird.

## Einrichtung (detailliert)

### Anmeldedaten erzeugen

Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wählen Sie **Bot Token**
- Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
- Kopieren Sie die **Client ID** und das **Access Token**

Es ist keine manuelle App-Registrierung erforderlich. Tokens laufen nach mehreren Stunden ab.

### Bot konfigurieren

**Env var (nur Standardkonto):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Oder config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Wenn sowohl Env als auch config gesetzt sind, hat config Vorrang.

### Zugriffskontrolle (empfohlen)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (empfohlen) nur Ihre Twitch-Benutzer-ID
    },
  },
}
```

Bevorzugen Sie `allowFrom` für eine harte Allowlist. Verwenden Sie stattdessen `allowedRoles`, wenn Sie rollenbasierten Zugriff möchten.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Warum Benutzer-IDs?** Benutzernamen können sich ändern, was Imitation ermöglicht. Benutzer-IDs sind dauerhaft.

Ermitteln Sie Ihre Twitch-Benutzer-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch-Benutzernamen in ID umwandeln)

## Token-Aktualisierung (optional)

Tokens vom [Twitch Token Generator](https://twitchtokengenerator.com/) können nicht automatisch aktualisiert werden - erzeugen Sie sie nach Ablauf erneut.

Für automatische Token-Aktualisierung erstellen Sie Ihre eigene Twitch-Anwendung in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Folgendes zur Konfiguration hinzu:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Der Bot aktualisiert Tokens vor dem Ablauf automatisch und protokolliert Aktualisierungsereignisse.

## Unterstützung mehrerer Konten

Verwenden Sie `channels.twitch.accounts` mit kontoabhängigen Tokens. Siehe [`gateway/configuration`](/gateway/configuration) für das gemeinsame Muster.

Beispiel (ein Bot-Konto in zwei Kanälen):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Hinweis:** Jedes Konto benötigt ein eigenes Token (ein Token pro Kanal).

## Zugriffskontrolle

### Rollenbasierte Einschränkungen

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist nach Benutzer-ID (am sichersten)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Rollenbasierter Zugriff (Alternative)

`allowFrom` ist eine harte Allowlist. Wenn gesetzt, sind nur diese Benutzer-IDs erlaubt.
Wenn Sie rollenbasierten Zugriff möchten, lassen Sie `allowFrom` ungesetzt und konfigurieren stattdessen `allowedRoles`:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### @mention-Anforderung deaktivieren

Standardmäßig ist `requireMention` auf `true` gesetzt. Um dies zu deaktivieren und auf alle Nachrichten zu antworten:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Fehlerbehebung

Führen Sie zuerst Diagnosebefehle aus:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot antwortet nicht auf Nachrichten

**Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie testweise `allowFrom` und setzen Sie `allowedRoles: ["all"]`.

**Prüfen, ob der Bot im Kanal ist:** Der Bot muss dem in `channel` angegebenen Kanal beitreten.

### Token-Probleme

**„Failed to connect“ oder Authentifizierungsfehler:**

- Stellen Sie sicher, dass `accessToken` der Wert des OAuth access token ist (beginnt typischerweise mit dem Präfix `oauth:`)
- Prüfen Sie, ob das Token die Scopes `chat:read` und `chat:write` hat
- Wenn Sie Token-Aktualisierung verwenden, stellen Sie sicher, dass `clientSecret` und `refreshToken` gesetzt sind

### Token-Aktualisierung funktioniert nicht

**Prüfen Sie die Logs auf Aktualisierungsereignisse:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Wenn Sie „token refresh disabled (no refresh token)“ sehen:

- Stellen Sie sicher, dass `clientSecret` angegeben ist
- Stellen Sie sicher, dass `refreshToken` angegeben ist

## Konfiguration

**Kontokonfiguration:**

- `username` - Bot-Benutzername
- `accessToken` - OAuth access token mit `chat:read` und `chat:write`
- `clientId` - Twitch Client ID (vom Token Generator oder Ihrer App)
- `channel` - Kanal, dem beigetreten werden soll (erforderlich)
- `enabled` - Dieses Konto aktivieren (Standard: `true`)
- `clientSecret` - Optional: Für automatische Token-Aktualisierung
- `refreshToken` - Optional: Für automatische Token-Aktualisierung
- `expiresIn` - Token-Ablauf in Sekunden
- `obtainmentTimestamp` - Zeitstempel des Token-Erhalts
- `allowFrom` - Benutzer-ID-Allowlist
- `allowedRoles` - Rollenbasierte Zugriffskontrolle (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @mention erforderlich (Standard: `true`)

**Provider-Optionen:**

- `channels.twitch.enabled` - Start des Kanals aktivieren/deaktivieren
- `channels.twitch.username` - Bot-Benutzername (vereinfachte Konfiguration für ein einzelnes Konto)
- `channels.twitch.accessToken` - OAuth access token (vereinfachte Konfiguration für ein einzelnes Konto)
- `channels.twitch.clientId` - Twitch Client ID (vereinfachte Konfiguration für ein einzelnes Konto)
- `channels.twitch.channel` - Kanal, dem beigetreten werden soll (vereinfachte Konfiguration für ein einzelnes Konto)
- `channels.twitch.accounts.<accountName>` - Multi-Account-Konfiguration (alle obigen Kontofelder)

Vollständiges Beispiel:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool-Aktionen

Der Agent kann `twitch` mit folgender Aktion aufrufen:

- `send` - Eine Nachricht an einen Kanal senden

Beispiel:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sicherheit & Betrieb

- **Behandeln Sie Tokens wie Passwörter** - Committen Sie niemals Tokens in Git
- **Verwenden Sie automatische Token-Aktualisierung** für langfristig laufende Bots
- **Verwenden Sie Benutzer-ID-Allowlists** statt Benutzernamen für die Zugriffskontrolle
- **Überwachen Sie Logs** auf Token-Aktualisierungsereignisse und Verbindungsstatus
- **Beschränken Sie Tokens auf das Nötigste** - Fordern Sie nur `chat:read` und `chat:write` an
- **Wenn Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie sichergestellt haben, dass kein anderer Prozess die Sitzung besitzt

## Limits

- **500 Zeichen** pro Nachricht (automatisch an Wortgrenzen gechunkt)
- Markdown wird vor dem Chunking entfernt
- Keine Ratenbegrenzung (verwendet die integrierten Ratenlimits von Twitch)

## Verwandt

- [Channels Overview](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Groups](/channels/groups) — Verhalten in Gruppenchats und Mention-Gating
- [Channel Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Security](/gateway/security) — Zugriffsmodell und Härtung
