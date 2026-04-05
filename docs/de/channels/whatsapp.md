---
read_when:
    - Bei Arbeiten am Verhalten des WhatsApp/Web-Kanals oder am Inbox-Routing
summary: Unterstützung des WhatsApp-Kanals, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T12:37:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web-Kanal)

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway besitzt verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern beim ersten Auswählen von WhatsApp zur Installation des WhatsApp-Plugins auf.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: standardmäßig der lokale Plugin-Pfad.
- Stable/Beta: standardmäßig das npm-Paket `@openclaw/whatsapp`.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/channels/pairing">
    Die Standard-DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/gateway/configuration">
    Vollständige Kanal-Konfigurationsmuster und Beispiele.
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

  </Step>

  <Step title="Gateway starten">

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
OpenClaw empfiehlt, WhatsApp möglichst mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Dedizierte Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwirrung durch Selbst-Chats

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
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basis:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit orientieren sich die Schutzmechanismen für Selbst-Chats an der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Messaging-Plattform-Kanal basiert in der aktuellen Kanalarchitektur von OpenClaw auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway besitzt den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ausgehendes Senden erfordert einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; der Standard `main` führt DMs in die Hauptsitzung des Agent zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direktchats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Multi-Account-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor kanalweiten Standards.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im kanalbezogenen Allow-Store persistiert und mit konfiguriertem `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - ausgehende `fromMe`-DMs werden nie automatisch gekoppelt

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` ausgelassen wird, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, wirkt es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppensender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Sender-Allowlist wird umgangen
       - `allowlist`: Sender muss `groupAllowFrom` entsprechen (oder `*`)
       - `disabled`: blockiert alle eingehenden Gruppennachrichten

    Fallback für die Sender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, falls verfügbar
    - Sender-Allowlists werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block vorhanden ist, ist der Laufzeit-Fallback für die Gruppenrichtlinie `allowlist` (mit einer Warnung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-an-Bot-Erkennung (Antwortabsender entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitieren/Antworten erfüllt nur das Mention-Gating; es **erteilt keine** Senderautorisierung
    - bei `groupPolicy: "allowlist"` bleiben nicht allowlistete Absender blockiert, selbst wenn sie auf die Nachricht eines allowlisteten Benutzers antworten

    Sitzungsbezogener Aktivierungsbefehl:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungszustand (nicht die globale Konfiguration). Es ist eigentümergeschützt.

  </Tab>
</Tabs>

## Persönliche Nummer und Selbst-Chat-Verhalten

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden Schutzmechanismen für WhatsApp-Selbst-Chats aktiviert:

- Lesebestätigungen für Selbst-Chat-Durchläufe überspringen
- Auto-Trigger-Verhalten für Erwähnungs-JIDs ignorieren, das Sie sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Antworten in Selbst-Chats standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichtennormalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Envelope + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Envelope verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadatenfelder für Antworten werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Sender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nachrichten nur mit Medien werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standort- und Kontakt-Nutzlasten werden vor dem Routing in textuellen Kontext normalisiert.

  </Accordion>

  <Accordion title="Einfügung ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einfügungsmarkierungen:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Lesebestätigungen">
    Lesebestätigungen sind standardmäßig für akzeptierte eingehende WhatsApp-Nachrichten aktiviert.

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

    Durchläufe in Selbst-Chats überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standard-Chunk-Limit: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensicheres Chunking zurück
  </Accordion>

  <Accordion title="Verhalten ausgehender Medien">
    - unterstützt Nutzlasten für Bild, Video, Audio (PTT-Sprachnachricht) und Dokument
    - `audio/ogg` wird für die Kompatibilität mit Sprachnachrichten zu `audio/ogg; codecs=opus` umgeschrieben
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Video-Sendungen unterstützt
    - Bildunterschriften werden beim Senden von Antwortnutzlasten mit mehreren Medien auf das erste Medienelement angewendet
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Größenlimits für Medien und Fallback-Verhalten">
    - Speicherlimit für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendelimit für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenänderung/Qualitätsdurchlauf), um die Limits einzuhalten
    - bei Fehlern beim Mediensenden sendet der Fallback für das erste Element eine Textwarnung, anstatt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Bestätigungsreaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                      |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------- |
| `"off"`       | Nein                   | Nein                            | Überhaupt keine Reaktionen                        |
| `"ack"`       | Ja                     | Nein                            | Nur Bestätigungsreaktionen (Empfang vor Antwort)  |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)              | Bestätigung + Agent-Reaktionen mit zurückhaltender Anleitung |
| `"extensive"` | Ja                     | Ja (empfohlen)                  | Bestätigung + Agent-Reaktionen mit empfohlener Anleitung |

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

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim eingehenden Empfang über `channels.whatsapp.ackReaction`.
Bestätigungsreaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` `"off"` ist.

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

Verhaltenshinweise:

- werden sofort gesendet, nachdem eingehende Nachrichten akzeptiert wurden (vor der Antwort)
- Fehler werden protokolliert, blockieren aber die normale Antwortzustellung nicht
- im Gruppenmodus `mentions` wird bei durch Erwähnung ausgelösten Durchläufen reagiert; die Gruppenaktivierung `always` wirkt dabei als Umgehung dieser Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Multi-Account und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standards">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, wenn vorhanden, sonst die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert
  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - veraltete Standard-Authentifizierung unter `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungszustand für dieses Konto.

    In veralteten Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Agent-Tool-Unterstützung umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktions-Gates:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Kanalinitiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet nicht verknüpft.

    Korrektur:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Verknüpftes Konto mit wiederholten Verbindungsabbrüchen oder Wiederverbindungsversuchen.

    Korrektur:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn für das Zielkonto kein aktiver Gateway-Listener vorhanden ist.

    Stellen Sie sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    In dieser Reihenfolge prüfen:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Allowlist-Einträge in `groups`
    - Mention-Gating (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, daher pro Scope nur ein `groupPolicy`

  </Accordion>

  <Accordion title="Warnung zur Bun-Laufzeit">
    Die Gateway-Laufzeit für WhatsApp sollte Node verwenden. Bun ist als inkompatibel für einen stabilen Gateway-Betrieb von WhatsApp/Telegram gekennzeichnet.
  </Accordion>
</AccordionGroup>

## Hinweise zur Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/gateway/configuration-reference#whatsapp)

Signalstarke WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Verwandt

- [Kopplung](/channels/pairing)
- [Gruppen](/channels/groups)
- [Security](/gateway/security)
- [Kanal-Routing](/channels/channel-routing)
- [Multi-Agent-Routing](/concepts/multi-agent)
- [Fehlerbehebung](/channels/troubleshooting)
