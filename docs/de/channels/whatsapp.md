---
read_when:
    - Arbeiten am Verhalten des WhatsApp/Web-Kanals oder am Posteingangs-Routing
summary: WhatsApp-Kanalunterstützung, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-07T06:14:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e2ce84d869ace6c0bebd9ec17bdbbef997a5c31e5da410b02a19a0f103f7359
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web-Kanal)

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern zur Installation des WhatsApp-Plugins auf, wenn du es zum ersten Mal auswählst.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: standardmäßig wird der lokale Plugin-Pfad verwendet.
- Stable/Beta: standardmäßig wird das npm-Paket `@openclaw/whatsapp` verwendet.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Die Standard-DM-Richtlinie ist Kopplung für unbekannte Absender.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
  <Card title="Gateway-Konfiguration" icon="settings" href="/de/gateway/configuration">
    Vollständige Konfigurationsmuster und Beispiele für Kanäle.
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
OpenClaw empfiehlt nach Möglichkeit, WhatsApp mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Eigene Nummer (empfohlen)">
    Dies ist der sauberste Betriebsmodus:

    - separate WhatsApp-Identität für OpenClaw
    - klarere DM-Allowlists und Routing-Grenzen
    - geringere Wahrscheinlichkeit von Verwechslungen im Selbst-Chat

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
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basiskonfiguration:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält deine persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbst-Chat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

  </Accordion>

  <Accordion title="Kanalumfang nur für WhatsApp Web">
    Der Kanal der Messaging-Plattform basiert in der aktuellen OpenClaw-Kanalarchitektur auf WhatsApp Web (`Baileys`).

    Es gibt keinen separaten Twilio-WhatsApp-Messaging-Kanal in der integrierten Chat-Kanal-Registry.

  </Accordion>
</AccordionGroup>

## Laufzeitmodell

- Das Gateway verwaltet den WhatsApp-Socket und die Wiederverbindungsschleife.
- Ausgehende Sendungen erfordern einen aktiven WhatsApp-Listener für das Zielkonto.
- Status- und Broadcast-Chats werden ignoriert (`@status`, `@broadcast`).
- Direkte Chats verwenden DM-Sitzungsregeln (`session.dmScope`; standardmäßig reduziert `main` DMs auf die Hauptsitzung des Agenten).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / kleingeschriebene Varianten). Bevorzuge eine Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf direkte Chats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im Stil von E.164 (intern normalisiert).

    Multi-Account-Override: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor den Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Kopplungen werden im kanalbezogenen Allow-Store gespeichert und mit dem konfigurierten `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - ausgehende `fromMe`-DMs werden nie automatisch gekoppelt

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` weggelassen wird, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, wirkt es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss mit `groupAllowFrom` (oder `*`) übereinstimmen
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor der Aktivierung durch Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein Block `channels.whatsapp` existiert, ist der Fallback der Laufzeit für die Gruppenrichtlinie `allowlist` (mit einer Warnprotokollmeldung), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Gruppenantworten erfordern standardmäßig eine Erwähnung.

    Die Erwähnungserkennung umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-auf-Bot-Erkennung (Antwortabsender stimmt mit der Bot-Identität überein)

    Sicherheitshinweis:

    - Zitieren/Antworten erfüllt nur die Erwähnungsbedingung; es gewährt **keine** Absenderautorisierung
    - bei `groupPolicy: "allowlist"` werden nicht auf der Allowlist stehende Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines auf der Allowlist stehenden Nutzers antworten

    Sitzungsbezogener Aktivierungsbefehl:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungszustand (nicht die globale Konfiguration). Es ist durch Eigentümerrechte geschützt.

  </Tab>
</Tabs>

## Persönliche Nummer und Selbst-Chat-Verhalten

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Schutzmechanismen für Selbst-Chats aktiviert:

- Lesebestätigungen für Selbst-Chat-Züge überspringen
- Auto-Trigger-Verhalten für Erwähnungs-JIDs ignorieren, das dich sonst selbst anpingen würde
- wenn `messages.responsePrefix` nicht gesetzt ist, verwenden Selbst-Chat-Antworten standardmäßig `[{identity.name}]` oder `[openclaw]`

## Nachrichten-Normalisierung und Kontext

<AccordionGroup>
  <Accordion title="Eingehender Umschlag + Antwortkontext">
    Eingehende WhatsApp-Nachrichten werden in den gemeinsamen eingehenden Umschlag verpackt.

    Wenn eine zitierte Antwort vorhanden ist, wird Kontext in dieser Form angehängt:

    ```text
    [Antwort auf <sender> id:<stanzaId>]
    <zitierter Text oder Medienplatzhalter>
    [/Antwort]
    ```

    Metadatenfelder für Antworten werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nachrichten, die nur Medien enthalten, werden mit Platzhaltern wie den folgenden normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standort- und Kontakt-Payloads werden vor dem Routing in textuellen Kontext normalisiert.

  </Accordion>

  <Accordion title="Einspeisung ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingefügt werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Einspeisemarkierungen:

    - `[Chat-Nachrichten seit deiner letzten Antwort - als Kontext]`
    - `[Aktuelle Nachricht - antworte auf diese]`

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

    Override pro Konto:

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

    Selbst-Chat-Züge überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Aufteilung und Medien

<AccordionGroup>
  <Accordion title="Textaufteilung">
    - Standardlimit pro Abschnitt: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensichere Aufteilung zurück
  </Accordion>

  <Accordion title="Verhalten bei ausgehenden Medien">
    - unterstützt Nutzlasten für Bilder, Videos, Audio (PTT-Sprachnotiz) und Dokumente
    - `audio/ogg` wird für Kompatibilität mit Sprachnotizen in `audio/ogg; codecs=opus` umgeschrieben
    - animierte GIF-Wiedergabe wird über `gifPlayback: true` bei Videosendungen unterstützt
    - Bildunterschriften werden auf das erste Medienelement angewendet, wenn Antwortnutzlasten mit mehreren Medien gesendet werden
    - Medienquelle kann HTTP(S), `file://` oder lokale Pfade sein
  </Accordion>

  <Accordion title="Mediengrößenlimits und Fallback-Verhalten">
    - Limit zum Speichern eingehender Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Limit zum Senden ausgehender Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Overrides pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größenanpassung/Qualitätsdurchlauf), um in die Limits zu passen
    - bei Fehlern beim Mediensenden sendet der Fallback für das erste Element stattdessen eine Textwarnung, anstatt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Reaktionsstufe

`channels.whatsapp.reactionLevel` steuert, wie breit der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Stufe         | Bestätigungsreaktionen | Vom Agenten initiierte Reaktionen | Beschreibung                                   |
| ------------- | ---------------------- | --------------------------------- | ---------------------------------------------- |
| `"off"`       | Nein                   | Nein                              | Überhaupt keine Reaktionen                     |
| `"ack"`       | Ja                     | Nein                              | Nur Bestätigungsreaktionen (vor Antwortempfang) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)                | Bestätigung + Agent-Reaktionen mit zurückhaltender Steuerung |
| `"extensive"` | Ja                     | Ja (empfohlen)                    | Bestätigung + Agent-Reaktionen mit empfohlener Steuerung |

Standard: `"minimal"`.

Overrides pro Konto verwenden `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp unterstützt sofortige Bestätigungsreaktionen beim Empfang eingehender Nachrichten über `channels.whatsapp.ackReaction`.
Bestätigungsreaktionen werden durch `reactionLevel` gesteuert — sie werden unterdrückt, wenn `reactionLevel` auf `"off"` gesetzt ist.

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

- werden sofort gesendet, nachdem eine eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- der Gruppenmodus `mentions` reagiert bei durch Erwähnung ausgelösten Zügen; die Gruppenaktivierung `always` wirkt als Umgehung dieser Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Multi-Account und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontoauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standard-Kontoauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für die Suche normalisiert
  </Accordion>

  <Accordion title="Pfade für Anmeldedaten und Legacy-Kompatibilität">
    - aktueller Auth-Pfad: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - Sicherungsdatei: `creds.json.bak`
    - veraltete Standardauthentifizierung in `~/.openclaw/credentials/` wird für Standardkonto-Abläufe weiterhin erkannt/migriert
  </Accordion>

  <Accordion title="Abmeldeverhalten">
    `openclaw channels logout --channel whatsapp [--account <id>]` löscht den WhatsApp-Authentifizierungsstatus für dieses Konto.

    In veralteten Auth-Verzeichnissen bleibt `oauth.json` erhalten, während Baileys-Auth-Dateien entfernt werden.

  </Accordion>
</AccordionGroup>

## Tools, Aktionen und Konfigurationsschreibvorgänge

- Die Tool-Unterstützung des Agenten umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionssperren:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivierbar über `channels.whatsapp.configWrites=false`).

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Nicht verknüpft (QR erforderlich)">
    Symptom: Der Kanalstatus meldet nicht verknüpft.

    Lösung:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: Verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Lösung:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Falls nötig, mit `channels login` erneut verknüpfen.

  </Accordion>

  <Accordion title="Kein aktiver Listener beim Senden">
    Ausgehende Sendungen schlagen sofort fehl, wenn kein aktiver Gateway-Listener für das Zielkonto vorhanden ist.

    Stelle sicher, dass das Gateway läuft und das Konto verknüpft ist.

  </Accordion>

  <Accordion title="Gruppennachrichten werden unerwartet ignoriert">
    In dieser Reihenfolge prüfen:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - Allowlist-Einträge in `groups`
    - Erwähnungssteuerung (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, daher pro Geltungsbereich nur ein einziges `groupPolicy` beibehalten

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun ist als inkompatibel für einen stabilen Betrieb des WhatsApp/Telegram-Gateways gekennzeichnet.
  </Accordion>
</AccordionGroup>

## Verweise zur Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/configuration-reference#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Multi-Account: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Overrides auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
