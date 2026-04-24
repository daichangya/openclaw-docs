---
read_when:
    - Twitch-Chat-Integration für OpenClaw einrichten
summary: Twitch-Chatbot-Konfiguration und -Einrichtung
title: Twitch
x-i18n:
    generated_at: "2026-04-24T06:29:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Twitch-Chat-Unterstützung über eine IRC-Verbindung. OpenClaw verbindet sich als Twitch-Benutzer (Bot-Konto), um Nachrichten in Kanälen zu empfangen und zu senden.

## Gebündeltes Plugin

Twitch wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert, sodass normale
paketierte Builds keine separate Installation benötigen.

Wenn Sie eine ältere Build-Version oder eine benutzerdefinierte Installation verwenden, die Twitch ausschließt, installieren
Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/twitch
```

Lokaler Checkout (wenn aus einem Git-Repo ausgeführt wird):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Details: [Plugins](/de/tools/plugin)

## Schnelle Einrichtung (für Einsteiger)

1. Stellen Sie sicher, dass das Twitch-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Versionen enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es mit den obigen Befehlen manuell hinzufügen.
2. Erstellen Sie ein eigenes Twitch-Konto für den Bot (oder verwenden Sie ein bestehendes Konto).
3. Erzeugen Sie Anmeldedaten: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Wählen Sie **Bot Token**
   - Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
   - Kopieren Sie die **Client ID** und das **Access Token**
4. Ermitteln Sie Ihre Twitch-Benutzer-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Konfigurieren Sie das Token:
   - Umgebungsvariable: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (nur Standardkonto)
   - Oder Konfiguration: `channels.twitch.accessToken`
   - Wenn beides gesetzt ist, hat die Konfiguration Vorrang (der Umgebungsvariablen-Fallback gilt nur für das Standardkonto).
6. Starten Sie das Gateway.

**⚠️ Wichtig:** Fügen Sie eine Zugriffskontrolle hinzu (`allowFrom` oder `allowedRoles`), um zu verhindern, dass nicht autorisierte Benutzer den Bot auslösen. `requireMention` ist standardmäßig auf `true` gesetzt.

Minimale Konfiguration:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Twitch-Konto des Bots
      accessToken: "oauth:abc123...", // OAuth-Access-Token (oder OPENCLAW_TWITCH_ACCESS_TOKEN-Umgebungsvariable verwenden)
      clientId: "xyz789...", // Client ID aus dem Token Generator
      channel: "vevisk", // Welchem Twitch-Kanalchat beigetreten werden soll (erforderlich)
      allowFrom: ["123456789"], // (empfohlen) Nur Ihre Twitch-Benutzer-ID - ermitteln Sie sie unter https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Was es ist

- Ein Twitch-Kanal, der dem Gateway gehört.
- Deterministisches Routing: Antworten gehen immer zurück zu Twitch.
- Jedes Konto wird einem isolierten SessionKey `agent:<agentId>:twitch:<accountName>` zugeordnet.
- `username` ist das Konto des Bots (das sich authentifiziert), `channel` ist der Chatraum, dem beigetreten wird.

## Einrichtung (detailliert)

### Anmeldedaten erzeugen

Verwenden Sie den [Twitch Token Generator](https://twitchtokengenerator.com/):

- Wählen Sie **Bot Token**
- Stellen Sie sicher, dass die Scopes `chat:read` und `chat:write` ausgewählt sind
- Kopieren Sie die **Client ID** und das **Access Token**

Keine manuelle App-Registrierung erforderlich. Tokens laufen nach mehreren Stunden ab.

### Den Bot konfigurieren

**Umgebungsvariable (nur Standardkonto):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Oder Konfiguration:**

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

Wenn sowohl Umgebungsvariable als auch Konfiguration gesetzt sind, hat die Konfiguration Vorrang.

### Zugriffskontrolle (empfohlen)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (empfohlen) Nur Ihre Twitch-Benutzer-ID
    },
  },
}
```

Bevorzugen Sie `allowFrom` für eine harte Allowlist. Verwenden Sie stattdessen `allowedRoles`, wenn Sie rollenbasierten Zugriff möchten.

**Verfügbare Rollen:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Warum Benutzer-IDs?** Benutzernamen können sich ändern, was Identitätsbetrug ermöglicht. Benutzer-IDs sind dauerhaft.

Ermitteln Sie Ihre Twitch-Benutzer-ID: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Ihren Twitch-Benutzernamen in eine ID umwandeln)

## Token-Aktualisierung (optional)

Tokens aus dem [Twitch Token Generator](https://twitchtokengenerator.com/) können nicht automatisch aktualisiert werden – erzeugen Sie sie nach Ablauf erneut.

Für eine automatische Token-Aktualisierung erstellen Sie Ihre eigene Twitch-Anwendung in der [Twitch Developer Console](https://dev.twitch.tv/console) und fügen Sie der Konfiguration Folgendes hinzu:

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

Der Bot aktualisiert Tokens automatisch vor ihrem Ablauf und protokolliert Aktualisierungsereignisse.

## Multi-Account-Unterstützung

Verwenden Sie `channels.twitch.accounts` mit Tokens pro Konto. Siehe [`gateway/configuration`](/de/gateway/configuration) für das gemeinsame Muster.

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
Wenn Sie rollenbasierten Zugriff möchten, lassen Sie `allowFrom` ungesetzt und konfigurieren Sie stattdessen `allowedRoles`:

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

### @Erwähnungsanforderung deaktivieren

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

**Zugriffskontrolle prüfen:** Stellen Sie sicher, dass Ihre Benutzer-ID in `allowFrom` enthalten ist, oder entfernen Sie testweise
`allowFrom` vorübergehend und setzen Sie `allowedRoles: ["all"]`.

**Prüfen, ob der Bot im Kanal ist:** Der Bot muss dem in `channel` angegebenen Kanal beitreten.

### Token-Probleme

**„Failed to connect“ oder Authentifizierungsfehler:**

- Stellen Sie sicher, dass `accessToken` der OAuth-Access-Token-Wert ist (beginnt typischerweise mit dem Präfix `oauth:`)
- Prüfen Sie, dass das Token die Scopes `chat:read` und `chat:write` hat
- Wenn Sie Token-Aktualisierung verwenden, stellen Sie sicher, dass `clientSecret` und `refreshToken` gesetzt sind

### Token-Aktualisierung funktioniert nicht

**Logs auf Aktualisierungsereignisse prüfen:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Wenn Sie „token refresh disabled (no refresh token)“ sehen:

- Stellen Sie sicher, dass `clientSecret` angegeben ist
- Stellen Sie sicher, dass `refreshToken` angegeben ist

## Konfiguration

**Kontokonfiguration:**

- `username` - Benutzername des Bots
- `accessToken` - OAuth-Access-Token mit `chat:read` und `chat:write`
- `clientId` - Twitch-Client-ID (aus dem Token Generator oder Ihrer App)
- `channel` - Kanal, dem beigetreten werden soll (erforderlich)
- `enabled` - Dieses Konto aktivieren (Standard: `true`)
- `clientSecret` - Optional: Für automatische Token-Aktualisierung
- `refreshToken` - Optional: Für automatische Token-Aktualisierung
- `expiresIn` - Token-Ablauf in Sekunden
- `obtainmentTimestamp` - Zeitstempel des Token-Erhalts
- `allowFrom` - Benutzer-ID-Allowlist
- `allowedRoles` - Rollenbasierte Zugriffskontrolle (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - @Erwähnung erforderlich (Standard: `true`)

**Provider-Optionen:**

- `channels.twitch.enabled` - Kanalstart aktivieren/deaktivieren
- `channels.twitch.username` - Benutzername des Bots (vereinfachte Einzelkontokonfiguration)
- `channels.twitch.accessToken` - OAuth-Access-Token (vereinfachte Einzelkontokonfiguration)
- `channels.twitch.clientId` - Twitch-Client-ID (vereinfachte Einzelkontokonfiguration)
- `channels.twitch.channel` - Kanal, dem beigetreten werden soll (vereinfachte Einzelkontokonfiguration)
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

## Sicherheit und Betrieb

- **Behandeln Sie Tokens wie Passwörter** – Committen Sie Tokens niemals in Git
- **Verwenden Sie automatische Token-Aktualisierung** für langlaufende Bots
- **Verwenden Sie Benutzer-ID-Allowlists** statt Benutzernamen für die Zugriffskontrolle
- **Überwachen Sie Logs** auf Token-Aktualisierungsereignisse und Verbindungsstatus
- **Beschränken Sie Token-Scopes auf das Minimum** – fordern Sie nur `chat:read` und `chat:write` an
- **Wenn Sie nicht weiterkommen**: Starten Sie das Gateway neu, nachdem Sie sichergestellt haben, dass kein anderer Prozess die Sitzung besitzt

## Limits

- **500 Zeichen** pro Nachricht (automatisch an Wortgrenzen aufgeteilt)
- Markdown wird vor der Aufteilung entfernt
- Keine Rate-Begrenzung (verwendet die integrierten Rate-Limits von Twitch)

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Verhalten von Gruppenchats und Erwähnungs-Gating
- [Kanalrouting](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
