---
read_when:
    - Arbeiten am Verhalten des WhatsApp-/Web-Kanals oder am Inbox-Routing
summary: Unterstützung des WhatsApp-Kanals, Zugriffskontrollen, Zustellverhalten und Betrieb
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T13:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web-Kanal)

Status: produktionsreif über WhatsApp Web (Baileys). Das Gateway verwaltet verknüpfte Sitzung(en).

## Installation (bei Bedarf)

- Onboarding (`openclaw onboard`) und `openclaw channels add --channel whatsapp`
  fordern zur Installation des WhatsApp-Plugins auf, wenn Sie es zum ersten Mal auswählen.
- `openclaw channels login --channel whatsapp` bietet den Installationsablauf ebenfalls an, wenn
  das Plugin noch nicht vorhanden ist.
- Dev-Kanal + Git-Checkout: standardmäßig wird der lokale Plugin-Pfad verwendet.
- Stable/Beta: standardmäßig wird das npm-Paket `@openclaw/whatsapp` verwendet.

Die manuelle Installation bleibt verfügbar:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Standardmäßige DM-Richtlinie für unbekannte Absender ist Pairing.
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

  </Step>

  <Step title="Gateway starten">

```bash
openclaw gateway
```

  </Step>

  <Step title="Erste Pairing-Anfrage genehmigen (bei Verwendung des Pairing-Modus)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Pairing-Anfragen laufen nach 1 Stunde ab. Ausstehende Anfragen sind auf 3 pro Kanal begrenzt.

  </Step>
</Steps>

<Note>
OpenClaw empfiehlt, WhatsApp wenn möglich mit einer separaten Nummer zu betreiben. (Die Kanalmetadaten und der Einrichtungsablauf sind für dieses Setup optimiert, aber Setups mit persönlicher Nummer werden ebenfalls unterstützt.)
</Note>

## Bereitstellungsmuster

<AccordionGroup>
  <Accordion title="Separate Nummer (empfohlen)">
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
    Das Onboarding unterstützt den Modus mit persönlicher Nummer und schreibt eine selbstchatfreundliche Basiskonfiguration:

    - `dmPolicy: "allowlist"`
    - `allowFrom` enthält Ihre persönliche Nummer
    - `selfChatMode: true`

    Zur Laufzeit basieren Selbstchat-Schutzmechanismen auf der verknüpften eigenen Nummer und `allowFrom`.

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
- Direktchats verwenden DM-Sitzungsregeln (`session.dmScope`; Standard `main` fasst DMs in der Hauptsitzung des Agents zusammen).
- Gruppensitzungen sind isoliert (`agent:<agentId>:whatsapp:group:<jid>`).
- Der WhatsApp-Web-Transport berücksichtigt Standard-Proxy-Umgebungsvariablen auf dem Gateway-Host (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / Varianten in Kleinbuchstaben). Bevorzugen Sie eine Proxy-Konfiguration auf Host-Ebene gegenüber kanalspezifischen WhatsApp-Proxy-Einstellungen.

## Zugriffskontrolle und Aktivierung

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.whatsapp.dmPolicy` steuert den Zugriff auf Direktchats:

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `allowFrom` `"*"` enthält)
    - `disabled`

    `allowFrom` akzeptiert Nummern im E.164-Stil (intern normalisiert).

    Multi-Konto-Überschreibung: `channels.whatsapp.accounts.<id>.dmPolicy` (und `allowFrom`) haben für dieses Konto Vorrang vor Standardwerten auf Kanalebene.

    Details zum Laufzeitverhalten:

    - Pairings werden im Kanal-Allow-Store gespeichert und mit dem konfigurierten `allowFrom` zusammengeführt
    - wenn keine Allowlist konfiguriert ist, ist die verknüpfte eigene Nummer standardmäßig erlaubt
    - ausgehende `fromMe`-DMs werden nie automatisch gepairt

  </Tab>

  <Tab title="Gruppenrichtlinie + Allowlists">
    Der Gruppenzugriff hat zwei Ebenen:

    1. **Allowlist für Gruppenmitgliedschaft** (`channels.whatsapp.groups`)
       - wenn `groups` weggelassen wird, kommen alle Gruppen infrage
       - wenn `groups` vorhanden ist, fungiert es als Gruppen-Allowlist (`"*"` erlaubt)

    2. **Richtlinie für Gruppenabsender** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: Absender-Allowlist wird umgangen
       - `allowlist`: Absender muss `groupAllowFrom` entsprechen (oder `*`)
       - `disabled`: alle eingehenden Gruppennachrichten blockieren

    Fallback für die Absender-Allowlist:

    - wenn `groupAllowFrom` nicht gesetzt ist, greift die Laufzeit auf `allowFrom` zurück, sofern verfügbar
    - Absender-Allowlists werden vor Aktivierung über Erwähnung/Antwort ausgewertet

    Hinweis: Wenn überhaupt kein `channels.whatsapp`-Block existiert, ist der Laufzeit-Fallback für die Gruppenrichtlinie `allowlist` (mit einer Warnung im Log), selbst wenn `channels.defaults.groupPolicy` gesetzt ist.

  </Tab>

  <Tab title="Erwähnungen + /activation">
    Antworten in Gruppen erfordern standardmäßig eine Erwähnung.

    Die Erkennung von Erwähnungen umfasst:

    - explizite WhatsApp-Erwähnungen der Bot-Identität
    - konfigurierte Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizite Antwort-an-Bot-Erkennung (Absender der Antwort entspricht der Bot-Identität)

    Sicherheitshinweis:

    - Zitieren/Antworten erfüllt nur die Aktivierungsschranke für Erwähnungen; es gewährt **keine** Absenderautorisierung
    - bei `groupPolicy: "allowlist"` werden nicht allowlistete Absender weiterhin blockiert, selbst wenn sie auf die Nachricht eines allowlisteten Absenders antworten

    Sitzungsbezogener Aktivierungsbefehl:

    - `/activation mention`
    - `/activation always`

    `activation` aktualisiert den Sitzungsstatus (nicht die globale Konfiguration). Es ist auf Eigentümer beschränkt.

  </Tab>
</Tabs>

## Verhalten mit persönlicher Nummer und Selbstchat

Wenn die verknüpfte eigene Nummer auch in `allowFrom` vorhanden ist, werden WhatsApp-Schutzmechanismen für Selbstchats aktiviert:

- Lesebestätigungen für Selbstchat-Züge überspringen
- automatisches Triggerverhalten durch Erwähnungs-JID ignorieren, das andernfalls Sie selbst anpingen würde
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

    Metadatenfelder zur Antwort werden ebenfalls befüllt, wenn verfügbar (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, Absender-JID/E.164).

  </Accordion>

  <Accordion title="Medienplatzhalter und Extraktion von Standort/Kontakt">
    Eingehende Nachrichten nur mit Medien werden mit Platzhaltern wie diesen normalisiert:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Standort- und Kontakt-Payloads werden vor dem Routing in textuellen Kontext normalisiert.

  </Accordion>

  <Accordion title="Einschleusen ausstehender Gruppenhistorie">
    Für Gruppen können unverarbeitete Nachrichten gepuffert und als Kontext eingeschleust werden, wenn der Bot schließlich ausgelöst wird.

    - Standardlimit: `50`
    - Konfiguration: `channels.whatsapp.historyLimit`
    - Fallback: `messages.groupChat.historyLimit`
    - `0` deaktiviert

    Markierungen für das Einschleusen:

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

    Selbstchat-Züge überspringen Lesebestätigungen auch dann, wenn sie global aktiviert sind.

  </Accordion>
</AccordionGroup>

## Zustellung, Chunking und Medien

<AccordionGroup>
  <Accordion title="Text-Chunking">
    - Standardlimit für Chunks: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - der Modus `newline` bevorzugt Absatzgrenzen (Leerzeilen) und greift dann auf längensicheres Chunking zurück
  </Accordion>

  <Accordion title="Verhalten bei ausgehenden Medien">
    - unterstützt Payloads für Bilder, Videos, Audio (PTT-Sprachnotiz) und Dokumente
    - `audio/ogg` wird für Kompatibilität mit Sprachnotizen in `audio/ogg; codecs=opus` umgeschrieben
    - die Wiedergabe animierter GIFs wird über `gifPlayback: true` bei Videosendungen unterstützt
    - Beschriftungen werden beim Senden von Antwort-Payloads mit mehreren Medien auf das erste Medienelement angewendet
    - Medienquelle kann HTTP(S), `file://` oder ein lokaler Pfad sein
  </Accordion>

  <Accordion title="Grenzwerte für Mediengröße und Fallback-Verhalten">
    - Speichergrenze für eingehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Sendegrenze für ausgehende Medien: `channels.whatsapp.mediaMaxMb` (Standard `50`)
    - Überschreibungen pro Konto verwenden `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - Bilder werden automatisch optimiert (Größen-/Qualitätssuche), um in die Limits zu passen
    - bei Fehlern beim Senden von Medien sendet der Fallback für das erste Element eine Textwarnung, statt die Antwort stillschweigend zu verwerfen
  </Accordion>
</AccordionGroup>

## Antwortzitate

WhatsApp unterstützt natives Antwortzitieren, bei dem ausgehende Antworten die eingehende Nachricht sichtbar zitieren. Steuern Sie dies mit `channels.whatsapp.replyToMode`.

| Value    | Verhalten                                                                         |
| -------- | --------------------------------------------------------------------------------- |
| `"auto"` | Die eingehende Nachricht zitieren, wenn der Provider dies unterstützt; andernfalls Zitieren überspringen |
| `"on"`   | Die eingehende Nachricht immer zitieren; bei Ablehnung des Zitierens auf normales Senden zurückfallen |
| `"off"`  | Niemals zitieren; als normale Nachricht senden                                    |

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

`channels.whatsapp.reactionLevel` steuert, wie umfassend der Agent Emoji-Reaktionen auf WhatsApp verwendet:

| Level         | Bestätigungsreaktionen | Vom Agent initiierte Reaktionen | Beschreibung                                     |
| ------------- | ---------------------- | ------------------------------- | ------------------------------------------------ |
| `"off"`       | Nein                   | Nein                            | Überhaupt keine Reaktionen                       |
| `"ack"`       | Ja                     | Nein                            | Nur Bestätigungsreaktionen (Empfang vor Antwort) |
| `"minimal"`   | Ja                     | Ja (zurückhaltend)              | Bestätigung + Agent-Reaktionen mit zurückhaltender Leitlinie |
| `"extensive"` | Ja                     | Ja (empfohlen)                  | Bestätigung + Agent-Reaktionen mit empfohlener Leitlinie |

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

- wird sofort gesendet, nachdem die eingehende Nachricht akzeptiert wurde (vor der Antwort)
- Fehler werden protokolliert, blockieren aber nicht die normale Antwortzustellung
- Gruppenmodus `mentions` reagiert bei durch Erwähnung ausgelösten Zügen; Gruppenaktivierung `always` wirkt als Umgehung für diese Prüfung
- WhatsApp verwendet `channels.whatsapp.ackReaction` (das veraltete `messages.ackReaction` wird hier nicht verwendet)

## Mehrere Konten und Anmeldedaten

<AccordionGroup>
  <Accordion title="Kontenauswahl und Standardwerte">
    - Konto-IDs stammen aus `channels.whatsapp.accounts`
    - Standardkontenauswahl: `default`, falls vorhanden, andernfalls die erste konfigurierte Konto-ID (sortiert)
    - Konto-IDs werden intern für das Nachschlagen normalisiert
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

- Die Tool-Unterstützung für Agents umfasst die WhatsApp-Reaktionsaktion (`react`).
- Aktionssperren:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Vom Kanal initiierte Konfigurationsschreibvorgänge sind standardmäßig aktiviert (deaktivieren mit `channels.whatsapp.configWrites=false`).

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

  <Accordion title="Verknüpft, aber getrennt / Wiederverbindungsschleife">
    Symptom: verknüpftes Konto mit wiederholten Trennungen oder Wiederverbindungsversuchen.

    Behebung:

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
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups`-Allowlist-Einträge
    - Steuerung über Erwähnungen (`requireMention` + Erwähnungsmuster)
    - doppelte Schlüssel in `openclaw.json` (JSON5): spätere Einträge überschreiben frühere, halten Sie also pro Geltungsbereich nur ein einziges `groupPolicy`

  </Accordion>

  <Accordion title="Bun-Laufzeitwarnung">
    Die WhatsApp-Gateway-Laufzeit sollte Node verwenden. Bun ist für einen stabilen Betrieb des WhatsApp-/Telegram-Gateways als inkompatibel markiert.
  </Accordion>
</AccordionGroup>

## System-Prompts

WhatsApp unterstützt System-Prompts im Telegram-Stil für Gruppen und Direktchats über die Maps `groups` und `direct`.

Auflösungshierarchie für Gruppennachrichten:

Die effektive `groups`-Map wird zuerst bestimmt: Wenn das Konto eigene `groups` definiert, ersetzt diese die `groups`-Map auf Root-Ebene vollständig (kein Deep Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Gruppenspezifischer System-Prompt** (`groups["<groupId>"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für Gruppen** (`groups["*"].systemPrompt`): wird verwendet, wenn der spezifische Gruppeneintrag fehlt oder keinen `systemPrompt` definiert.

Auflösungshierarchie für Direktnachrichten:

Die effektive `direct`-Map wird zuerst bestimmt: Wenn das Konto eigene `direct` definiert, ersetzt diese die `direct`-Map auf Root-Ebene vollständig (kein Deep Merge). Die Prompt-Auflösung läuft dann auf der resultierenden einzelnen Map:

1. **Direktspezifischer System-Prompt** (`direct["<peerId>"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag einen `systemPrompt` definiert.
2. **Wildcard-System-Prompt für Direktnachrichten** (`direct["*"].systemPrompt`): wird verwendet, wenn der spezifische Peer-Eintrag fehlt oder keinen `systemPrompt` definiert.

Hinweis: `dms` bleibt der leichtgewichtige Bucket für verlaufsbezogene Überschreibungen pro DM (`dms.<id>.historyLimit`); Prompt-Überschreibungen liegen unter `direct`.

**Unterschied zum Telegram-Mehrkontenverhalten:** In Telegram wird `groups` auf Root-Ebene in einem Multi-Konto-Setup absichtlich für alle Konten unterdrückt — auch für Konten, die selbst keine `groups` definieren — damit ein Bot keine Gruppennachrichten für Gruppen empfängt, zu denen er nicht gehört. WhatsApp wendet diese Schutzmaßnahme nicht an: `groups` und `direct` auf Root-Ebene werden immer an Konten vererbt, die keine Überschreibung auf Kontoebene definieren, unabhängig davon, wie viele Konten konfiguriert sind. Wenn Sie in einem Multi-Konto-WhatsApp-Setup gruppen- oder direktnachrichtenspezifische Prompts pro Konto möchten, definieren Sie die vollständige Map explizit unter jedem Konto, anstatt sich auf Standardwerte auf Root-Ebene zu verlassen.

Wichtiges Verhalten:

- `channels.whatsapp.groups` ist sowohl eine gruppenspezifische Konfigurations-Map als auch die Gruppen-Allowlist auf Chat-Ebene. Auf Root- oder Kontenebene bedeutet `groups["*"]`, dass für diesen Geltungsbereich „alle Gruppen zugelassen“ sind.
- Fügen Sie einen Wildcard-System-Prompt für Gruppen nur hinzu, wenn Sie bereits möchten, dass in diesem Geltungsbereich alle Gruppen zugelassen sind. Wenn weiterhin nur ein fester Satz von Gruppen-IDs infrage kommen soll, verwenden Sie `groups["*"]` nicht als Prompt-Standard. Wiederholen Sie stattdessen den Prompt in jedem explizit allowlisteten Gruppeneintrag.
- Gruppenzulassung und Absenderautorisierung sind getrennte Prüfungen. `groups["*"]` erweitert die Menge der Gruppen, die die Gruppenbehandlung erreichen können, autorisiert aber nicht automatisch jeden Absender in diesen Gruppen. Der Absenderzugriff wird weiterhin separat über `channels.whatsapp.groupPolicy` und `channels.whatsapp.groupAllowFrom` gesteuert.
- `channels.whatsapp.direct` hat nicht dieselbe Nebenwirkung für DMs. `direct["*"]` liefert nur dann eine Standardkonfiguration für Direktchats, nachdem eine DM bereits durch `dmPolicy` plus `allowFrom` oder Regeln des Pairing-Stores zugelassen wurde.

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
        "*": { systemPrompt: "Standard-Prompt für alle Direktchats." },
      },
      accounts: {
        work: {
          groups: {
            // Dieses Konto definiert eigene groups, daher werden groups auf Root-Ebene
            // vollständig ersetzt. Um einen Wildcard-Eintrag beizubehalten, definieren
            // Sie "*" auch hier explizit.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus auf Projektmanagement.",
            },
            // Nur verwenden, wenn in diesem Konto alle Gruppen zugelassen sein sollen.
            "*": { systemPrompt: "Standard-Prompt für Arbeitsgruppen." },
          },
          direct: {
            // Dieses Konto definiert eine eigene direct-Map, daher werden direct-Einträge
            // auf Root-Ebene vollständig ersetzt. Um einen Wildcard-Eintrag beizubehalten,
            // definieren Sie "*" auch hier explizit.
            "+15551234567": { systemPrompt: "Prompt für einen bestimmten geschäftlichen Direktchat." },
            "*": { systemPrompt: "Standard-Prompt für geschäftliche Direktchats." },
          },
        },
      },
    },
  },
}
```

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - WhatsApp](/de/gateway/configuration-reference#whatsapp)

Wichtige WhatsApp-Felder:

- Zugriff: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- Mehrere Konten: `accounts.<id>.enabled`, `accounts.<id>.authDir`, Überschreibungen auf Kontoebene
- Betrieb: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- Sitzungsverhalten: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- Prompts: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Verwandt

- [Pairing](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Fehlerbehebung](/de/channels/troubleshooting)
