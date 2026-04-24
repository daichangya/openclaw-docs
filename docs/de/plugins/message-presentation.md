---
read_when:
    - Darstellung von Nachrichtenkarten, Buttons oder Auswahlen hinzufügen oder ändern
    - Ein Kanal-Plugin erstellen, das Rich-Outbound-Nachrichten unterstützt
    - Darstellung oder Zustellfunktionen des Nachrichtentools ändern
    - Providerspezifische Regressionsfehler bei Karten-/Block-/Komponenten-Rendering debuggen
summary: Semantische Nachrichtenkarten, Buttons, Auswahlen, Fallback-Text und Zustellhinweise für Kanal-Plugins
title: Nachrichtendarstellung
x-i18n:
    generated_at: "2026-04-24T06:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

Die Nachrichtendarstellung ist OpenClaws gemeinsamer Vertrag für Rich-Outbound-Chat-UI.
Damit können Agenten, CLI-Befehle, Genehmigungsabläufe und Plugins die Nachrichten-
Absicht einmal beschreiben, während jedes Kanal-Plugin die bestmögliche native Form rendert.

Verwenden Sie Presentation für portable Nachrichten-UI:

- Textabschnitte
- kleinen Kontext-/Footer-Text
- Trenner
- Buttons
- Auswahlmenüs
- Kartentitel und Tonalität

Fügen Sie dem gemeinsamen Nachrichtentool keine neuen providernativen Felder wie Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` oder Feishu `card` hinzu. Diese sind Renderer-Ausgaben im Besitz des Kanal-Plugins.

## Vertrag

Plugin-Autoren importieren den öffentlichen Vertrag aus:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Form:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantik von Buttons:

- `value` ist ein Aktionswert der Anwendung, der über den vorhandenen
  Interaktionspfad des Kanals zurückgeleitet wird, wenn der Kanal anklickbare Controls unterstützt.
- `url` ist ein Link-Button. Er kann ohne `value` existieren.
- `label` ist erforderlich und wird auch im Text-Fallback verwendet.
- `style` ist hinweisend. Renderer sollten nicht unterstützte Styles auf einen sicheren
  Standard abbilden und das Senden nicht fehlschlagen lassen.

Semantik von Auswahlmenüs:

- `options[].value` ist der ausgewählte Anwendungswert.
- `placeholder` ist hinweisend und kann von Kanälen ohne native Unterstützung für Auswahlmenüs ignoriert werden.
- Wenn ein Kanal Auswahlmenüs nicht unterstützt, listet der Fallback-Text die Labels auf.

## Beispiele für Producer

Einfache Karte:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Reiner URL-Link-Button:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Auswahlmenü:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

CLI-Send:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Angeheftete Zustellung:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Angeheftete Zustellung mit explizitem JSON:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Renderer-Vertrag

Kanal-Plugins deklarieren Render-Unterstützung auf ihrem Outbound-Adapter:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

Capability-Felder sind absichtlich einfache Booleans. Sie beschreiben, was der
Renderer interaktiv machen kann, nicht jedes native Plattformlimit. Renderer bleiben weiterhin
verantwortlich für plattformspezifische Grenzen wie maximale Anzahl von Buttons, Blöcken und
Kartengröße.

## Core-Render-Fluss

Wenn ein `ReplyPayload` oder eine Nachrichtenaktion `presentation` enthält, führt Core Folgendes aus:

1. Die Nutzlast von Presentation normalisieren.
2. Den Outbound-Adapter des Zielkanals auflösen.
3. `presentationCapabilities` lesen.
4. `renderPresentation` aufrufen, wenn der Adapter die Nutzlast rendern kann.
5. Auf konservativen Text zurückfallen, wenn der Adapter fehlt oder nicht rendern kann.
6. Die resultierende Nutzlast über den normalen Kanalzustellpfad senden.
7. Zustellmetadaten wie `delivery.pin` nach der ersten erfolgreichen
   gesendeten Nachricht anwenden.

Core besitzt das Fallback-Verhalten, damit Producer kanalagnostisch bleiben können. Kanal-
Plugins besitzen das native Rendering und das Interaktions-Handling.

## Regeln für Degradation

Presentation muss sicher auf eingeschränkten Kanälen gesendet werden können.

Fallback-Text enthält:

- `title` als erste Zeile
- Blöcke `text` als normale Absätze
- Blöcke `context` als kompakte Kontextzeilen
- Blöcke `divider` als visuelle Trennung
- Button-Labels, einschließlich URLs für Link-Buttons
- Labels von Auswahloptionen

Nicht unterstützte native Controls sollten degradieren, statt den gesamten Versand fehlschlagen zu lassen.
Beispiele:

- Telegram mit deaktivierten Inline-Buttons sendet Text-Fallback.
- Ein Kanal ohne Unterstützung für Auswahlmenüs listet Auswahloptionen als Text auf.
- Ein reiner URL-Button wird entweder zu einem nativen Link-Button oder zu einer Fallback-URL-Zeile.
- Optionale Fehler beim Anheften lassen die gesendete Nachricht nicht fehlschlagen.

Die wichtigste Ausnahme ist `delivery.pin.required: true`; wenn Anheften als
erforderlich angefordert wird und der Kanal die gesendete Nachricht nicht anheften kann, meldet die Zustellung einen Fehler.

## Provider-Zuordnung

Aktuelle gebündelte Renderer:

| Kanal           | Ziel für natives Rendering          | Hinweise                                                                                                                                           |
| --------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components und Component-Container  | Bewahrt das ältere `channelData.discord.components` für bestehende Producer providernativer Nutzlasten, aber neue gemeinsame Sends sollten `presentation` verwenden. |
| Slack           | Block Kit                           | Bewahrt das ältere `channelData.slack.blocks` für bestehende Producer providernativer Nutzlasten, aber neue gemeinsame Sends sollten `presentation` verwenden. |
| Telegram        | Text plus Inline-Keyboards          | Buttons/Auswahlmenüs erfordern Inline-Button-Fähigkeit für die Zieloberfläche; andernfalls wird Text-Fallback verwendet.                          |
| Mattermost      | Text plus interaktive Props         | Andere Blöcke degradieren zu Text.                                                                                                                 |
| Microsoft Teams | Adaptive Cards                      | Einfacher `message`-Text wird zusammen mit der Karte eingeschlossen, wenn beides bereitgestellt wird.                                             |
| Feishu          | Interaktive Karten                  | Der Karten-Header kann `title` verwenden; der Body vermeidet die doppelte Verwendung dieses Titels.                                               |
| Plain channels  | Text-Fallback                       | Auch Kanäle ohne Renderer erhalten weiterhin lesbare Ausgabe.                                                                                      |

Kompatibilität mit providernativen Nutzlasten ist eine Übergangshilfe für bestehende
Reply-Producer. Sie ist kein Grund, neue gemeinsame native Felder hinzuzufügen.

## Presentation vs InteractiveReply

`InteractiveReply` ist die ältere interne Teilmenge, die von Genehmigungs- und Interaktions-
Helpern verwendet wird. Sie unterstützt:

- Text
- Buttons
- Auswahlmenüs

`MessagePresentation` ist der kanonische gemeinsame Send-Vertrag. Sie fügt hinzu:

- Titel
- Tonalität
- Kontext
- Trenner
- reine URL-Buttons
- generische Zustellmetadaten über `ReplyPayload.delivery`

Verwenden Sie Helper aus `openclaw/plugin-sdk/interactive-runtime`, wenn Sie älteren
Code überbrücken:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Neuer Code sollte `MessagePresentation` direkt akzeptieren oder erzeugen.

## Zustellung mit Anheften

Anheften ist Zustellverhalten, nicht Presentation. Verwenden Sie `delivery.pin` statt
providernativer Felder wie `channelData.telegram.pin`.

Semantik:

- `pin: true` heftet die erste erfolgreich zugestellte Nachricht an.
- `pin.notify` ist standardmäßig `false`.
- `pin.required` ist standardmäßig `false`.
- Optionale Fehler beim Anheften degradieren und lassen die gesendete Nachricht intakt.
- Erforderliche Fehler beim Anheften lassen die Zustellung fehlschlagen.
- Bei gechunkten Nachrichten wird der erste zugestellte Chunk angeheftet, nicht der letzte Chunk.

Manuelle Nachrichtenaktionen `pin`, `unpin` und `pins` existieren weiterhin für bestehende
Nachrichten, bei denen der Provider diese Operationen unterstützt.

## Checkliste für Plugin-Autoren

- Deklarieren Sie `presentation` aus `describeMessageTool(...)`, wenn der Kanal
  semantische Presentation rendern oder sicher degradieren kann.
- Fügen Sie `presentationCapabilities` zum Runtime-Outbound-Adapter hinzu.
- Implementieren Sie `renderPresentation` in Runtime-Code, nicht in Control-Plane-Plugin-
  Setup-Code.
- Halten Sie native UI-Bibliotheken aus heißen Setup-/Katalogpfaden heraus.
- Bewahren Sie Plattformgrenzen im Renderer und in Tests.
- Fügen Sie Fallback-Tests für nicht unterstützte Buttons, Auswahlmenüs, URL-Buttons, Doppelung von Titel/Text und gemischte Sends mit `message` plus `presentation` hinzu.
- Fügen Sie Unterstützung für Anheften über `deliveryCapabilities.pin` und
  `pinDeliveredMessage` nur hinzu, wenn der Provider die gesendete Nachrichten-ID anheften kann.
- Stellen Sie keine neuen providernativen Felder für Karten/Blöcke/Komponenten/Buttons über das
  gemeinsame Schema der Nachrichtenaktion bereit.

## Verwandte Dokumentation

- [Message CLI](/de/cli/message)
- [Plugin SDK Overview](/de/plugins/sdk-overview)
- [Plugin Architecture](/de/plugins/architecture-internals#message-tool-schemas)
- [Channel Presentation Refactor Plan](/de/plan/ui-channels)
