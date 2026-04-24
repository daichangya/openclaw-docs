---
read_when:
    - Einrichten von leisem Matrix-Streaming für selbstgehostetes Synapse oder Tuwunel
    - Benutzer möchten Benachrichtigungen nur bei fertiggestellten Blöcken, nicht bei jeder Vorschau-Bearbeitung
summary: Matrix-Push-Regeln pro Empfänger für leise abgeschlossene Vorschau-Bearbeitungen
title: Matrix-Push-Regeln für leise Vorschauen
x-i18n:
    generated_at: "2026-04-24T06:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Wenn `channels.matrix.streaming` auf `"quiet"` gesetzt ist, bearbeitet OpenClaw ein einzelnes Vorschau-Ereignis direkt und markiert die abgeschlossene Bearbeitung mit einem benutzerdefinierten Content-Flag. Matrix-Clients benachrichtigen nur bei der finalen Bearbeitung, wenn eine Push-Regel pro Benutzer auf dieses Flag passt. Diese Seite richtet sich an Operatoren, die Matrix selbst hosten und diese Regel für jedes Empfängerkonto installieren möchten.

Wenn Sie nur das Standard-Benachrichtigungsverhalten von Matrix möchten, verwenden Sie `streaming: "partial"` oder lassen Sie Streaming deaktiviert. Siehe [Matrix-Channel-Einrichtung](/de/channels/matrix#streaming-previews).

## Voraussetzungen

- Empfängerbenutzer = die Person, die die Benachrichtigung erhalten soll
- Bot-Benutzer = das OpenClaw-Matrix-Konto, das die Antwort sendet
- verwenden Sie für die folgenden API-Aufrufe das Zugriffstoken des Empfängerbenutzers
- gleichen Sie `sender` in der Push-Regel mit der vollständigen MXID des Bot-Benutzers ab
- das Empfängerkonto muss bereits funktionierende Pusher haben — Regeln für leise Vorschauen funktionieren nur, wenn die normale Matrix-Push-Zustellung korrekt funktioniert

## Schritte

<Steps>
  <Step title="Leise Vorschauen konfigurieren">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Zugriffstoken des Empfängers abrufen">
    Verwenden Sie nach Möglichkeit ein vorhandenes Client-Sitzungstoken erneut. Um ein neues zu erstellen:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Prüfen, ob Pusher vorhanden sind">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Wenn keine Pusher zurückgegeben werden, beheben Sie zuerst die normale Matrix-Push-Zustellung für dieses Konto, bevor Sie fortfahren.

  </Step>

  <Step title="Die Push-Regel vom Typ override installieren">
    OpenClaw markiert abgeschlossene rein textbasierte Vorschau-Bearbeitungen mit `content["com.openclaw.finalized_preview"] = true`. Installieren Sie eine Regel, die auf diesen Marker plus die Bot-MXID als Absender passt:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Vor dem Ausführen ersetzen:

    - `https://matrix.example.org`: die Basis-URL Ihres Homeservers
    - `$USER_ACCESS_TOKEN`: das Zugriffstoken des Empfängerbenutzers
    - `openclaw-finalized-preview-botname`: eine Regel-ID, die pro Bot und Empfänger eindeutig ist (Muster: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: die MXID Ihres OpenClaw-Bots, nicht die des Empfängers

  </Step>

  <Step title="Überprüfen">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testen Sie dann eine gestreamte Antwort. Im leisen Modus zeigt der Raum eine leise Entwurfsvorschau an und benachrichtigt einmal, wenn der Block oder Turn abgeschlossen ist.

  </Step>
</Steps>

Um die Regel später zu entfernen, führen Sie mit dem Token des Empfängers `DELETE` auf dieselbe Regel-URL aus.

## Hinweise für mehrere Bots

Push-Regeln sind über `ruleId` verschlüsselt: Wenn `PUT` erneut mit derselben ID ausgeführt wird, wird eine einzelne Regel aktualisiert. Wenn mehrere OpenClaw-Bots denselben Empfänger benachrichtigen, erstellen Sie eine Regel pro Bot mit einer eigenen Absenderübereinstimmung.

Neue benutzerdefinierte `override`-Regeln werden vor den standardmäßigen Unterdrückungsregeln eingefügt, daher ist kein zusätzlicher Ordnungsparameter erforderlich. Die Regel wirkt sich nur auf rein textbasierte Vorschau-Bearbeitungen aus, die direkt abgeschlossen werden können; Media-Fallbacks und Stale-Preview-Fallbacks verwenden die normale Matrix-Zustellung.

## Hinweise zum Homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Es ist keine spezielle Änderung in `homeserver.yaml` erforderlich. Wenn normale Matrix-Benachrichtigungen diesen Benutzer bereits erreichen, sind das Empfängertoken und der obige `pushrules`-Aufruf der wichtigste Einrichtungsschritt.

    Wenn Sie Synapse hinter einem Reverse-Proxy oder mit Workers betreiben, stellen Sie sicher, dass `/_matrix/client/.../pushrules/` Synapse korrekt erreicht. Die Push-Zustellung wird vom Hauptprozess oder von `synapse.app.pusher` bzw. konfigurierten Pusher-Workers verarbeitet — stellen Sie sicher, dass diese fehlerfrei funktionieren.

  </Accordion>

  <Accordion title="Tuwunel">
    Derselbe Ablauf wie bei Synapse; für den Marker der abgeschlossenen Vorschau ist keine Tuwunel-spezifische Konfiguration erforderlich.

    Wenn Benachrichtigungen verschwinden, während der Benutzer auf einem anderen Gerät aktiv ist, prüfen Sie, ob `suppress_push_when_active` aktiviert ist. Tuwunel hat diese Option in 1.4.2 (September 2025) hinzugefügt, und sie kann Pushes an andere Geräte absichtlich unterdrücken, während ein Gerät aktiv ist.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Matrix-Channel-Einrichtung](/de/channels/matrix)
- [Streaming-Konzepte](/de/concepts/streaming)
