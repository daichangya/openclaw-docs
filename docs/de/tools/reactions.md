---
read_when:
    - Arbeiten an Reaktionen in einem beliebigen Channel
    - Verstehen, wie sich Emoji-Reaktionen zwischen Plattformen unterscheiden
summary: Semantik des Reaction-Tools über alle unterstützten Channels hinweg
title: Reaktionen
x-i18n:
    generated_at: "2026-04-05T12:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# Reaktionen

Der Agent kann Emoji-Reaktionen zu Nachrichten hinzufügen und entfernen, indem er das `message`
-Tool mit der Aktion `react` verwendet. Das Verhalten von Reaktionen variiert je nach Channel.

## So funktioniert es

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` ist erforderlich, wenn eine Reaktion hinzugefügt wird.
- Setzen Sie `emoji` auf eine leere Zeichenfolge (`""`), um die Reaktion(en) des Bots zu entfernen.
- Setzen Sie `remove: true`, um ein bestimmtes Emoji zu entfernen (erfordert ein nicht leeres `emoji`).

## Verhalten je Channel

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - Ein leeres `emoji` entfernt alle Reaktionen des Bots auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.
  </Accordion>

  <Accordion title="Google Chat">
    - Ein leeres `emoji` entfernt die Reaktionen der App auf die Nachricht.
    - `remove: true` entfernt nur das angegebene Emoji.
  </Accordion>

  <Accordion title="Telegram">
    - Ein leeres `emoji` entfernt die Reaktionen des Bots.
    - `remove: true` entfernt ebenfalls Reaktionen, erfordert für die Tool-Validierung aber weiterhin ein nicht leeres `emoji`.
  </Accordion>

  <Accordion title="WhatsApp">
    - Ein leeres `emoji` entfernt die Bot-Reaktion.
    - `remove: true` wird intern auf ein leeres Emoji abgebildet (erfordert im Tool-Aufruf weiterhin `emoji`).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Erfordert ein nicht leeres `emoji`.
    - `remove: true` entfernt diese bestimmte Emoji-Reaktion.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Verwenden Sie das Tool `feishu_reaction` mit den Aktionen `add`, `remove` und `list`.
    - Hinzufügen/Entfernen erfordert `emoji_type`; Entfernen erfordert zusätzlich `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Eingehende Benachrichtigungen über Reaktionen werden über `channels.signal.reactionNotifications` gesteuert: `"off"` deaktiviert sie, `"own"` (Standard) erzeugt Ereignisse, wenn Benutzer auf Bot-Nachrichten reagieren, und `"all"` erzeugt Ereignisse für alle Reaktionen.
  </Accordion>
</AccordionGroup>

## Reaktionsstufe

Die Konfiguration `reactionLevel` pro Channel steuert, wie umfassend der Agent Reaktionen verwendet. Typische Werte sind `off`, `ack`, `minimal` oder `extensive`.

- [Telegram reactionLevel](/de/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/de/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

Setzen Sie `reactionLevel` für einzelne Channels, um abzustimmen, wie aktiv der Agent auf Nachrichten auf jeder Plattform reagiert.

## Verwandt

- [Agent Send](/tools/agent-send) — das `message`-Tool, das `react` enthält
- [Channels](/de/channels) — channelspezifische Konfiguration
