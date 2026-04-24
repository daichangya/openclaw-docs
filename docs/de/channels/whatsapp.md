---
read_when:
    - Arbeiten am Verhalten von WhatsApp/Web-Kanälen oder am Inbox-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellungsverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T06:29:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet die verknüpfte(n) Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern beim ersten Auswählen von WhatsApp zur Installation des WhatsApp-Plugin auf.
- `openclaw channels login --channel whatsapp` bietet ebenfalls den Installationsablauf an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: verwendet standardmäßig den lokalen Plugin-Pfad.
- Stable/Beta: verwendet standardmäßig das npm-Paket `@openclaw/whatsapp`.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie für unbekannte Absender ist Kopplung.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Muster und Beispiele für die Kanalkonfiguration.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Steps>
  <Step title="WhatsApp-Zugriffsrichtlinie konfigurieren">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="WhatsApp verknüpfen (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Für ein bestimmtes Konto:

```bash
openclaw channels login --channel whatsapp --account work
```

    Um vor der Anmeldung ein vorhandenes/benutzerdefiniertes WhatsApp-Web-Authentifizierungsverzeichnis anzuhängen:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Das Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Erste Kopplungsanfrage genehmigen (bei Verwendung des Kopplungsmodus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Kopplungsanfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp nach Möglichkeit mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwirrung durch Selbstchats

    Minimales Richtlinienmuster:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback mit persönlicher Nummer">
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basislinie:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren die Schutzmechanismen für Selbstchats auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Kanal der Messaging-Plattform basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Runtime-Modell

- Das Gateway besitzt den WhatsApp-Socket und die Reconnect-Schleife.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` reduziert DMs auf die Hauptsitzung des Agenten).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Überschreibung bei mehreren Konten: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im kanalbezogenen Allow-Store gespeichert und mit konfiguriertem `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - OpenClaw koppelt ausgehende `fromMe`-DMs niemals automatisch (Nachrichten, die Sie vom verknüpften Gerät an sich selbst senden)

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, sind alle Gruppen zulässig
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppensender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Sender-Allowlist wird umgangen
       - `allowlist`: Sender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: blockiert alle eingehenden Gruppennachrichten

    Fallback für Sender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Runtime, falls verfügbar, auf `allowFrom` zurück
    - Sender-Allowlists werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein Block `channels.whatsapp` existiert, ist der Laufzeit-Fallback für die Gruppenrichtlinie `allowlist` (mit einer Warnung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitat/Antwort erfüllt nur die Erwähnungsbindung; dadurch wird **keine** Autorisierung des Absenders erteilt
    - bei `groupPolicy: "allowlist"` werden nicht allowlistete Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines allowlisteten Benutzers antworten

    Sitzungsbezogener Aktivierungsbefehl:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist an den Eigentümer gebunden.

  </Tab>
</Tabs>

## Verhalten bei persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden die Schutzmechanismen für WhatsApp-Selbstchats aktiviert:

- Lesebestätigungen für Selbstchat-Turns überspringen
- Auto-Trigger-Verhalten für Erwähnungs-JIDs ignorieren, das sonst Sie selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbstchat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadatenfelder für Antworten werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Sender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nur-Medien-Nachrichten werden mit Platzhaltern wie den folgenden normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standorttexte verwenden knappe Koordinatenangaben. Standortbezeichnungen/-kommentare und Kontakt-/vCard-Details werden als eingefasste nicht vertrauenswürdige Metadaten dargestellt, nicht als Inline-Prompt-Text.

  </Accordion>

  <Accordion title="Einfügen ausstehender Gruppenhistorie">
    Für Gruppen können nicht verarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügemarkierungen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Lesebestätigungen sind für akzeptierte eingehende WhatsApp-Nachrichten standardmäßig aktiviert.

    Global deaktivieren:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Überschreibung pro Konto:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Selbstchat-Turns überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standardlimit für Chunks: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und fällt dann auf längensicheres Chunking zurück
  </Accordion>

  <Accordion title="Verhalten bei ausgehenden Medien">
    - unterstützt Payloads für Bild, Video, Audio (PTT-Sprachnotiz) und Dokumente
    - `audio/ogg` wird für die Kompatibilität mit Sprachnotizen zu `audio/ogg; codecs=opus` umgeschrieben
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Videosendungen unterstützt
    - Bildunterschriften werden auf das erste Medienelement angewendet, wenn Multi-Media-Antwort-Payloads gesendet werden
    - die Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Speicherobergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendeobergrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um die Limits einzuhalten
    - bei einem Fehler beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, anstatt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt native Antwortzitate, bei denen ausgehende Antworten sichtbar die eingehende Nachricht zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Value    | Verhalten                                                                           |
| -------- | ----------------------------------------------------------------------------------- |
| `"auto"` | Zitiert die eingehende Nachricht, wenn der Provider dies unterstützt; überspringt das Zitieren andernfalls |
| `"on"`   | Zitiert die eingehende Nachricht immer; fällt auf ein einfaches Senden zurück, wenn das Zitieren abgelehnt wird |
| `"off"`  | Zitiert nie; sendet als einfache Nachricht                                          |

Standard ist `"auto"`. Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Level         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                     |
| ------------- | ---------------------- | --------------------------------- | ------------------------------------------------ |
| `"off"`       | Nein                   | Nein                              | Überhaupt keine Reaktionen                       |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (Quittung vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)                | Bestätigung + Agent-Reaktionen mit zurückhaltender Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agent-Reaktionen mit empfohlener Anleitung |

Standard: `"minimal"`.

Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Bestätigungsreaktionen

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim Eingang über `channels.whatsapp.ackReaction`.
Bestätigungsreaktionen werden durch `reactionLevel` begrenzt — sie werden unterdrückt, wenn `reactionLevel` auf `"off"` gesetzt ist.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Hinweise zum Verhalten:

- werden sofort gesendet, nachdem der Eingang akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- der Gruppenmodus `mentions` reagiert bei durch Erwähnung ausgelösten Turns; die Gruppenaktivierung `always` wirkt als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Auflösung normalisiert
  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - Legacy-Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Logout-Verhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In Legacy-Authentifizierungsverzeichnissen bleibt `oauth.json` erhalten, während Baileys-Authentifizierungsdateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Unterstützung für Agent-Tools umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionsschranken:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Kanalstatus meldet nicht verknüpft.

    Behebung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Reconnect-Schleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Behebung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn kein aktiver Gateway-Listener für das Zielkonto vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Erwähnungsbindung (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, daher sollte es pro Geltungsbereich nur ein `groupPolicy` geben

  </Accordion>

  <Accordion title="Warnung zur Bun-Runtime">
    Die Gateway-Runtime für WhatsApp sollte Node verwenden. Bun ist als inkompatibel für den stabilen Betrieb des WhatsApp-/Telegram-Gateway markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt Telegram-ähnliche System-Prompts für Gruppen und direkte Chats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Zuerst wird die effektive Map `groups` bestimmt: Wenn das Konto seine eigene `groups` definiert, ersetzt sie die Root-Map `groups` vollständig (kein Deep-Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder keinen `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Zuerst wird die effektive Map `direct` bestimmt: Wenn das Konto seine eigene `direct` definiert, ersetzt sie die Root-Map `direct` vollständig (kein Deep-Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für direkte Chats** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag fehlt oder keinen `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichtgewichtige Bucket für Verlaufsüberschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen liegen unter `direct`.

**Unterschied zum Telegram-Verhalten mit mehreren Konten:** In Telegram wird `groups` auf Root-Ebene in einem Multi-Account-Setup absichtlich für alle Konten unterdrückt — selbst für Konten, die keine eigenen `groups` definieren — um zu verhindern, dass ein Bot Gruppennachrichten für Gruppen erhält, zu denen er nicht gehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer von Konten übernommen, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem WhatsApp-Setup mit mehreren Konten kontoabhängige Gruppen- oder Direkt-Prompts möchten, definieren Sie die vollständige Map explizit unter jedem Konto, anstatt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine Konfigurations-Map pro Gruppe als auch die Gruppen-Allowlist auf Chat-Ebene. Auf Root- oder Kontoebene bedeutet `groups["*"]`, dass „alle Gruppen zugelassen sind“ für diesen Geltungsbereich.
- Fügen Sie einen Wildcard-Gruppen-`systemPrompt` nur hinzu, wenn Sie für diesen Geltungsbereich ohnehin alle Gruppen zulassen möchten. Wenn weiterhin nur eine feste Menge von Gruppen-IDs zulässig sein soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie stattdessen den Prompt in jedem explizit allowlisteten Gruppeneintrag.
- Gruppenzulassung und Senderautorisierung sind separate Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenverarbeitung erreichen können, autorisiert aber nicht automatisch jeden Sender in diesen Gruppen. Der Senderzugriff wird weiterhin separat durch `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat für DMs nicht denselben Nebeneffekt. `direct["*"]` stellt nur eine Standardkonfiguration für direkte Chats bereit, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Kopplungsspeichers zugelassen wurde.

Beispiel:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Nur verwenden, wenn auf Root-Ebene alle Gruppen zugelassen sein sollen.
        // Gilt für alle Konten, die keine eigene groups-Map definieren.
        "*": { systemPrompt: "Standard-Prompt für alle Gruppen." },
      },
      direct: {
        // Gilt für alle Konten, die keine eigene direct-Map definieren.
        "*": { systemPrompt: "Standard-Prompt für alle direkten Chats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden Root-groups vollständig
            // ersetzt. Um eine Wildcard beizubehalten, definieren Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Auf Projektmanagement fokussieren.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen sein sollen.
            "*": { systemPrompt: "Standard-Prompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert seine eigene direct-Map, daher werden Root-direct-Einträge
            // vollständig ersetzt. Um eine Wildcard beizubehalten, definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten direkten Arbeitschat." },
            "*": { systemPrompt: "Standard-Prompt für direkte Arbeitschats." },
          },
        },
      },
    },
  },
}
```

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/config-channels#whatsapp)

Signalstarke WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
