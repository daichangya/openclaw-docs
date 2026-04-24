---
read_when:
    - Arbeiten an Tlon/Urbit-Kanalfunktionen
summary: Supportstatus, Fähigkeiten und Konfiguration für Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-24T06:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon ist ein dezentraler Messenger, der auf Urbit basiert. OpenClaw verbindet sich mit Ihrem Urbit-Schiff und kann
auf DMs und Gruppenchats antworten. Gruppenantworten erfordern standardmäßig eine @-Erwähnung und können
zusätzlich über Allowlists eingeschränkt werden.

Status: gebündeltes Plugin. DMs, Gruppenerwähnungen, Thread-Antworten, Rich-Text-Formatierung und
Bild-Uploads werden unterstützt. Reaktionen und Umfragen werden derzeit noch nicht unterstützt.

## Gebündeltes Plugin

Tlon wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale paketierte
Builds keine separate Installation.

Wenn Sie eine ältere Version oder eine benutzerdefinierte Installation verwenden, die Tlon ausschließt, installieren Sie es
manuell:

Installation per CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/tlon
```

Lokaler Checkout (bei Ausführung aus einem Git-Repository):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/de/tools/plugin)

## Einrichtung

1. Stellen Sie sicher, dass das Tlon-Plugin verfügbar ist.
   - Aktuelle paketierte OpenClaw-Releases enthalten es bereits.
   - Ältere/benutzerdefinierte Installationen können es mit den oben genannten Befehlen manuell hinzufügen.
2. Erfassen Sie Ihre Schiff-URL und Ihren Login-Code.
3. Konfigurieren Sie `channels.tlon`.
4. Starten Sie das Gateway neu.
5. Senden Sie dem Bot eine DM oder erwähnen Sie ihn in einem Gruppenkanal.

Minimale Konfiguration (einzelnes Konto):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // empfohlen: Ihr Schiff, immer erlaubt
    },
  },
}
```

## Private/LAN-Schiffe

Standardmäßig blockiert OpenClaw private/interne Hostnamen und IP-Bereiche zum Schutz vor SSRF.
Wenn Ihr Schiff in einem privaten Netzwerk läuft (localhost, LAN-IP oder interner Hostname),
müssen Sie dies ausdrücklich aktivieren:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Dies gilt für URLs wie:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Aktivieren Sie dies nur, wenn Sie Ihrem lokalen Netzwerk vertrauen. Diese Einstellung deaktiviert den SSRF-Schutz
für Anfragen an die URL Ihres Schiffs.

## Gruppenkanäle

Die automatische Erkennung ist standardmäßig aktiviert. Sie können Kanäle auch manuell anheften:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Automatische Erkennung deaktivieren:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Zugriffskontrolle

DM-Allowlist (leer = keine DMs erlaubt, verwenden Sie `ownerShip` für den Genehmigungsablauf):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Gruppenautorisierung (standardmäßig eingeschränkt):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Eigentümer- und Genehmigungssystem

Setzen Sie ein Eigentümer-Schiff, um Genehmigungsanfragen zu erhalten, wenn nicht autorisierte Benutzer versuchen zu interagieren:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Das Eigentümer-Schiff ist **überall automatisch autorisiert** — DM-Einladungen werden automatisch angenommen und
Kanalnachrichten sind immer erlaubt. Sie müssen den Eigentümer nicht zu `dmAllowlist` oder
`defaultAuthorizedShips` hinzufügen.

Wenn gesetzt, erhält das Eigentümer-Schiff DM-Benachrichtigungen für:

- DM-Anfragen von Schiffen, die nicht in der Allowlist stehen
- Erwähnungen in Kanälen ohne Autorisierung
- Gruppeneinladungsanfragen

## Einstellungen für automatische Annahme

DM-Einladungen automatisch annehmen (für Schiffe in `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Gruppeneinladungen automatisch annehmen:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Zustellungsziele (CLI/Cron)

Verwenden Sie diese mit `openclaw message send` oder Cron-Zustellung:

- DM: `~sampel-palnet` oder `dm/~sampel-palnet`
- Gruppe: `chat/~host-ship/channel` oder `group:~host-ship/channel`

## Gebündeltes Skill

Das Tlon-Plugin enthält ein gebündeltes Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
das CLI-Zugriff auf Tlon-Operationen bereitstellt:

- **Kontakte**: Profile abrufen/aktualisieren, Kontakte auflisten
- **Kanäle**: auflisten, erstellen, Nachrichten posten, Verlauf abrufen
- **Gruppen**: auflisten, erstellen, Mitglieder verwalten
- **DMs**: Nachrichten senden, auf Nachrichten reagieren
- **Reaktionen**: Emoji-Reaktionen zu Beiträgen und DMs hinzufügen/entfernen
- **Einstellungen**: Plugin-Berechtigungen über Slash-Befehle verwalten

Das Skill ist automatisch verfügbar, wenn das Plugin installiert ist.

## Fähigkeiten

| Funktion        | Status                                      |
| --------------- | ------------------------------------------- |
| Direktnachrichten | ✅ Unterstützt                            |
| Gruppen/Kanäle  | ✅ Unterstützt (standardmäßig an Erwähnungen gebunden) |
| Threads         | ✅ Unterstützt (automatische Antworten im Thread) |
| Rich Text       | ✅ Markdown wird in das Tlon-Format konvertiert |
| Bilder          | ✅ In den Tlon-Speicher hochgeladen         |
| Reaktionen      | ✅ Über [gebündeltes Skill](#gebündeltes-skill) |
| Umfragen        | ❌ Noch nicht unterstützt                   |
| Native Befehle  | ✅ Unterstützt (standardmäßig nur für Eigentümer) |

## Fehlerbehebung

Führen Sie zuerst diese Abfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Häufige Fehler:

- **DMs werden ignoriert**: Absender nicht in `dmAllowlist` und kein `ownerShip` für den Genehmigungsablauf konfiguriert.
- **Gruppennachrichten werden ignoriert**: Kanal nicht erkannt oder Absender nicht autorisiert.
- **Verbindungsfehler**: prüfen Sie, ob die Schiff-URL erreichbar ist; aktivieren Sie `allowPrivateNetwork` für lokale Schiffe.
- **Authentifizierungsfehler**: prüfen Sie, ob der Login-Code aktuell ist (Codes rotieren).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/de/gateway/configuration)

Provider-Optionen:

- `channels.tlon.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.tlon.ship`: Urbit-Schiffsname des Bots (z. B. `~sampel-palnet`).
- `channels.tlon.url`: Schiff-URL (z. B. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: Schiff-Login-Code.
- `channels.tlon.allowPrivateNetwork`: localhost-/LAN-URLs erlauben (SSRF-Umgehung).
- `channels.tlon.ownerShip`: Eigentümer-Schiff für das Genehmigungssystem (immer autorisiert).
- `channels.tlon.dmAllowlist`: Schiffe, die DMs senden dürfen (leer = keine).
- `channels.tlon.autoAcceptDmInvites`: DMs von allowlisteten Schiffen automatisch annehmen.
- `channels.tlon.autoAcceptGroupInvites`: alle Gruppeneinladungen automatisch annehmen.
- `channels.tlon.autoDiscoverChannels`: Gruppenkanäle automatisch erkennen (Standard: true).
- `channels.tlon.groupChannels`: manuell angeheftete Kanal-Nests.
- `channels.tlon.defaultAuthorizedShips`: für alle Kanäle autorisierte Schiffe.
- `channels.tlon.authorization.channelRules`: kanalbezogene Authentifizierungsregeln.
- `channels.tlon.showModelSignature`: Modellnamen an Nachrichten anhängen.

## Hinweise

- Gruppenantworten erfordern eine Erwähnung (z. B. `~your-bot-ship`), damit geantwortet wird.
- Thread-Antworten: Wenn die eingehende Nachricht in einem Thread ist, antwortet OpenClaw im Thread.
- Rich Text: Markdown-Formatierung (fett, kursiv, Code, Überschriften, Listen) wird in Tlons natives Format konvertiert.
- Bilder: URLs werden in den Tlon-Speicher hochgeladen und als Bildblöcke eingebettet.

## Verwandt

- [Kanalübersicht](/de/channels) — alle unterstützten Kanäle
- [Kopplung](/de/channels/pairing) — DM-Authentifizierung und Kopplungsablauf
- [Gruppen](/de/channels/groups) — Gruppenchats, Verhalten und Erwähnungsbindung
- [Kanal-Routing](/de/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/de/gateway/security) — Zugriffsmodell und Härtung
