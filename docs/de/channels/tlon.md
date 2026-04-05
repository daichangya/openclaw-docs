---
read_when:
    - Bei der Arbeit an Tlon/Urbit-Kanalfunktionen
summary: Tlon/Urbit-Unterstützungsstatus, Fähigkeiten und Konfiguration
title: Tlon
x-i18n:
    generated_at: "2026-04-05T12:36:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon ist ein dezentraler Messenger, der auf Urbit basiert. OpenClaw verbindet sich mit Ihrem Urbit-Ship und kann
auf DMs und Gruppenchats antworten. Gruppenantworten erfordern standardmäßig eine @Erwähnung und können
zusätzlich über Allowlists eingeschränkt werden.

Status: gebündeltes Plugin. DMs, Gruppenerwähnungen, Thread-Antworten, Rich-Text-Formatierung und
Bild-Uploads werden unterstützt. Reaktionen und Polls werden noch nicht unterstützt.

## Gebündeltes Plugin

Tlon wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert, daher benötigen normale
gepackte Builds keine separate Installation.

Wenn Sie einen älteren Build oder eine benutzerdefinierte Installation verwenden, die Tlon ausschließt,
installieren Sie es manuell:

Installation über die CLI (npm-Registry):

```bash
openclaw plugins install @openclaw/tlon
```

Lokaler Checkout (beim Ausführen aus einem Git-Repo):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Details: [Plugins](/tools/plugin)

## Einrichtung

1. Stellen Sie sicher, dass das Tlon-Plugin verfügbar ist.
   - Aktuelle gepackte OpenClaw-Releases enthalten es bereits gebündelt.
   - Ältere/benutzerdefinierte Installationen können es manuell mit den obigen Befehlen hinzufügen.
2. Erfassen Sie Ihre Ship-URL und Ihren Login-Code.
3. Konfigurieren Sie `channels.tlon`.
4. Starten Sie das Gateway neu.
5. Senden Sie dem Bot eine DM oder erwähnen Sie ihn in einem Gruppenkanal.

Minimale Konfiguration (einzelner Account):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // empfohlen: Ihr Ship, immer erlaubt
    },
  },
}
```

## Private/LAN-Ships

Standardmäßig blockiert OpenClaw private/interne Hostnamen und IP-Bereiche zum Schutz vor SSRF.
Wenn Ihr Ship in einem privaten Netzwerk läuft (localhost, LAN-IP oder interner Hostname),
müssen Sie dies explizit aktivieren:

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
für Anfragen an Ihre Ship-URL.

## Gruppenkanäle

Die Auto-Erkennung ist standardmäßig aktiviert. Sie können Kanäle auch manuell anheften:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Auto-Erkennung deaktivieren:

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

## Owner- und Genehmigungssystem

Legen Sie ein Owner-Ship fest, um Genehmigungsanfragen zu erhalten, wenn nicht autorisierte Benutzer versuchen zu interagieren:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Das Owner-Ship ist **überall automatisch autorisiert** — DM-Einladungen werden automatisch akzeptiert und
Kanalnachrichten sind immer erlaubt. Sie müssen den Owner weder zu `dmAllowlist` noch zu
`defaultAuthorizedShips` hinzufügen.

Wenn gesetzt, erhält der Owner DM-Benachrichtigungen für:

- DM-Anfragen von Ships, die nicht in der Allowlist stehen
- Erwähnungen in Kanälen ohne Autorisierung
- Anfragen für Gruppeneinladungen

## Einstellungen für automatische Annahme

DM-Einladungen automatisch akzeptieren (für Ships in `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Gruppeneinladungen automatisch akzeptieren:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Zustellziele (CLI/Cron)

Verwenden Sie diese mit `openclaw message send` oder Cron-Zustellung:

- DM: `~sampel-palnet` oder `dm/~sampel-palnet`
- Gruppe: `chat/~host-ship/channel` oder `group:~host-ship/channel`

## Gebündelte Skill

Das Tlon-Plugin enthält eine gebündelte Skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)),
die CLI-Zugriff auf Tlon-Operationen bereitstellt:

- **Kontakte**: Profile abrufen/aktualisieren, Kontakte auflisten
- **Kanäle**: auflisten, erstellen, Nachrichten posten, Verlauf abrufen
- **Gruppen**: auflisten, erstellen, Mitglieder verwalten
- **DMs**: Nachrichten senden, auf Nachrichten reagieren
- **Reaktionen**: Emoji-Reaktionen zu Beiträgen und DMs hinzufügen/entfernen
- **Einstellungen**: Plugin-Berechtigungen über Slash-Befehle verwalten

Die Skill ist automatisch verfügbar, wenn das Plugin installiert ist.

## Fähigkeiten

| Funktion        | Status                                  |
| --------------- | --------------------------------------- |
| Direktnachrichten | ✅ Unterstützt                         |
| Gruppen/Kanäle  | ✅ Unterstützt (standardmäßig Mention-Gating) |
| Threads         | ✅ Unterstützt (Auto-Antworten im Thread) |
| Rich-Text       | ✅ Markdown wird in das Tlon-Format konvertiert |
| Bilder          | ✅ In den Tlon-Speicher hochgeladen     |
| Reaktionen      | ✅ Über [gebündelte Skill](#gebundelte-skill) |
| Polls           | ❌ Noch nicht unterstützt               |
| Native Befehle  | ✅ Unterstützt (standardmäßig nur Owner) |

## Fehlerbehebung

Führen Sie zuerst diese Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Häufige Fehler:

- **DMs werden ignoriert**: Absender nicht in `dmAllowlist` und kein `ownerShip` für den Genehmigungsablauf konfiguriert.
- **Gruppennachrichten werden ignoriert**: Kanal nicht erkannt oder Absender nicht autorisiert.
- **Verbindungsfehler**: Prüfen Sie, ob die Ship-URL erreichbar ist; aktivieren Sie `allowPrivateNetwork` für lokale Ships.
- **Auth-Fehler**: Verifizieren Sie, dass der Login-Code aktuell ist (Codes rotieren).

## Konfigurationsreferenz

Vollständige Konfiguration: [Konfiguration](/gateway/configuration)

Provider-Optionen:

- `channels.tlon.enabled`: Kanalstart aktivieren/deaktivieren.
- `channels.tlon.ship`: Urbit-Ship-Name des Bots (z. B. `~sampel-palnet`).
- `channels.tlon.url`: Ship-URL (z. B. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: Ship-Login-Code.
- `channels.tlon.allowPrivateNetwork`: localhost-/LAN-URLs zulassen (SSRF-Bypass).
- `channels.tlon.ownerShip`: Owner-Ship für das Genehmigungssystem (immer autorisiert).
- `channels.tlon.dmAllowlist`: Ships, die DMs senden dürfen (leer = keine).
- `channels.tlon.autoAcceptDmInvites`: DMs von allowlisteten Ships automatisch akzeptieren.
- `channels.tlon.autoAcceptGroupInvites`: Alle Gruppeneinladungen automatisch akzeptieren.
- `channels.tlon.autoDiscoverChannels`: Gruppenkanäle automatisch erkennen (Standard: true).
- `channels.tlon.groupChannels`: manuell angeheftete Kanal-Nests.
- `channels.tlon.defaultAuthorizedShips`: Ships, die für alle Kanäle autorisiert sind.
- `channels.tlon.authorization.channelRules`: Auth-Regeln pro Kanal.
- `channels.tlon.showModelSignature`: Modellnamen an Nachrichten anhängen.

## Hinweise

- Gruppenantworten erfordern eine Erwähnung (z. B. `~your-bot-ship`), damit geantwortet wird.
- Thread-Antworten: Wenn die eingehende Nachricht in einem Thread ist, antwortet OpenClaw im Thread.
- Rich-Text: Markdown-Formatierung (fett, kursiv, Code, Überschriften, Listen) wird in Tlons natives Format konvertiert.
- Bilder: URLs werden in den Tlon-Speicher hochgeladen und als Bildblöcke eingebettet.

## Verwandt

- [Kanäle im Überblick](/channels) — alle unterstützten Kanäle
- [Pairing](/channels/pairing) — DM-Authentifizierung und Pairing-Ablauf
- [Gruppen](/channels/groups) — Verhalten von Gruppenchats und Mention-Gating
- [Kanal-Routing](/channels/channel-routing) — Sitzungsrouting für Nachrichten
- [Sicherheit](/gateway/security) — Zugriffsmodell und Härtung
