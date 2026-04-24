---
read_when:
    - Refactoring von Nachrichten-UI für Kanäle, interaktiven Payloads oder nativen Kanal-Renderern
    - Tool-Fähigkeiten für Nachrichten, Zustellungshinweise oder kontextübergreifende Marker ändern
    - Import-Fanout von Discord Carbon oder Laufzeit-Lazy-Loading von Kanal-Plugins debuggen
summary: Semantische Nachrichtendarstellung von den nativen UI-Renderern der Kanäle entkoppeln.
title: Refactoring-Plan für die Kanaldarstellung
x-i18n:
    generated_at: "2026-04-24T06:47:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Status

Implementiert für die Oberflächen des gemeinsamen Agenten, der CLI, der Plugin-Fähigkeiten und der ausgehenden Zustellung:

- `ReplyPayload.presentation` trägt semantische Nachrichten-UI.
- `ReplyPayload.delivery.pin` trägt Pin-Anfragen für gesendete Nachrichten.
- Gemeinsame Nachrichtenaktionen stellen `presentation`, `delivery` und `pin` statt providernativer `components`, `blocks`, `buttons` oder `card` bereit.
- Der Core rendert oder degradiert die Darstellung automatisch über vom Plugin deklarierte ausgehende Fähigkeiten.
- Renderer für Discord, Slack, Telegram, Mattermost, MS Teams und Feishu nutzen den generischen Vertrag.
- Der Discord-Control-Plane-Code des Kanals importiert keine Carbon-gestützten UI-Container mehr.

Die maßgebliche Dokumentation liegt jetzt unter [Message Presentation](/de/plugins/message-presentation).
Behalten Sie diesen Plan als historischen Implementierungskontext bei; aktualisieren Sie die maßgebliche Anleitung
bei Änderungen an Vertrag, Renderer oder Fallback-Verhalten.

## Problem

Die Kanal-UI ist derzeit über mehrere inkompatible Oberflächen aufgeteilt:

- Der Core besitzt einen Discord-geprägten Renderer-Hook für kontextübergreifende Nutzung über `buildCrossContextComponents`.
- Discord `channel.ts` kann native Carbon-UI über `DiscordUiContainer` importieren, was Laufzeit-UI-Abhängigkeiten in die Control Plane des Kanal-Plugins zieht.
- Der Agent und die CLI stellen native Payload-Escape-Hatches wie Discord-`components`, Slack-`blocks`, Telegram- oder Mattermost-`buttons` sowie Teams- oder Feishu-`card` bereit.
- `ReplyPayload.channelData` trägt sowohl Transporthinweise als auch native UI-Hüllen.
- Das generische `interactive`-Modell existiert, ist aber schmaler als die reicheren Layouts, die bereits von Discord, Slack, Teams, Feishu, LINE, Telegram und Mattermost verwendet werden.

Dadurch kennt der Core native UI-Formen, die Laufzeit-Lazy-Loading von Plugins wird geschwächt, und Agenten erhalten zu viele providerspezifische Wege, dieselbe Nachrichtenabsicht auszudrücken.

## Ziele

- Der Core entscheidet anhand deklarierter Fähigkeiten über die beste semantische Darstellung für eine Nachricht.
- Extensions deklarieren Fähigkeiten und rendern semantische Darstellung in native Transport-Payloads.
- Die Web Control UI bleibt von nativer Chat-UI getrennt.
- Native Kanal-Payloads werden nicht über die gemeinsame Oberfläche von Agent oder CLI bereitgestellt.
- Nicht unterstützte Darstellungsmerkmale degradieren automatisch zur besten Textdarstellung.
- Zustellverhalten wie das Anheften einer gesendeten Nachricht ist generische Zustellmetadaten, keine Darstellung.

## Keine Ziele

- Kein Abwärtskompatibilitäts-Shim für `buildCrossContextComponents`.
- Keine öffentlichen nativen Escape-Hatches für `components`, `blocks`, `buttons` oder `card`.
- Keine Core-Importe von kanalnativen UI-Bibliotheken.
- Keine providerspezifischen SDK-Seams für gebündelte Kanäle.

## Zielmodell

Fügen Sie ein Core-eigenes Feld `presentation` zu `ReplyPayload` hinzu.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` wird während der Migration zu einer Teilmenge von `presentation`:

- Ein `interactive`-Textblock wird auf `presentation.blocks[].type = "text"` abgebildet.
- Ein `interactive`-Buttons-Block wird auf `presentation.blocks[].type = "buttons"` abgebildet.
- Ein `interactive`-Select-Block wird auf `presentation.blocks[].type = "select"` abgebildet.

Die externen Schemata für Agent und CLI verwenden jetzt `presentation`; `interactive` bleibt ein interner Legacy-Parser-/Rendering-Helfer für bestehende Reply-Erzeuger.

## Zustellmetadaten

Fügen Sie ein Core-eigenes Feld `delivery` für Sendeverhalten hinzu, das keine UI ist.

```ts
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

Semantik:

- `delivery.pin = true` bedeutet, die erste erfolgreich zugestellte Nachricht anzuheften.
- `notify` ist standardmäßig `false`.
- `required` ist standardmäßig `false`; nicht unterstützte Kanäle oder fehlgeschlagenes Pinning degradieren automatisch, indem die Zustellung fortgesetzt wird.
- Manuelle Nachrichtenaktionen `pin`, `unpin` und `list-pins` bleiben für bestehende Nachrichten erhalten.

Die aktuelle ACP-Themenbindung in Telegram sollte von `channelData.telegram.pin = true` auf `delivery.pin = true` verschoben werden.

## Vertrag für Laufzeit-Fähigkeiten

Fügen Sie Hooks für Darstellung und Zustell-Rendering zum ausgehenden Laufzeit-Adapter hinzu, nicht zum Kanal-Plugin der Control Plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
};

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Verhalten des Core:

- Zielkanal und Laufzeit-Adapter auflösen.
- Nach Darstellungsfähigkeiten fragen.
- Nicht unterstützte Blöcke vor dem Rendering degradieren.
- `renderPresentation` aufrufen.
- Wenn kein Renderer existiert, Darstellung in einen Text-Fallback umwandeln.
- Nach erfolgreichem Senden `pinDeliveredMessage` aufrufen, wenn `delivery.pin` angefordert und unterstützt wird.

## Kanalzuordnung

Discord:

- `presentation` in Components v2 und Carbon-Container in Modulen nur für die Laufzeit rendern.
- Helfer für Akzentfarben in leichten Modulen behalten.
- `DiscordUiContainer`-Importe aus dem Control-Plane-Code des Kanal-Plugins entfernen.

Slack:

- `presentation` in Block Kit rendern.
- `blocks`-Eingabe aus Agent und CLI entfernen.

Telegram:

- Text, Kontext und Divider als Text rendern.
- Aktionen und Select als Inline-Keyboards rendern, wenn sie konfiguriert und für die Zieloberfläche erlaubt sind.
- Text-Fallback verwenden, wenn Inline-Buttons deaktiviert sind.
- ACP-Themen-Pinning zu `delivery.pin` verschieben.

Mattermost:

- Aktionen, wo konfiguriert, als interaktive Buttons rendern.
- Andere Blöcke als Text-Fallback rendern.

MS Teams:

- `presentation` in Adaptive Cards rendern.
- Manuelle Aktionen `pin`/`unpin`/`list-pins` beibehalten.
- Optional `pinDeliveredMessage` implementieren, wenn Graph-Unterstützung für die Zielkonversation zuverlässig ist.

Feishu:

- `presentation` in interaktive Karten rendern.
- Manuelle Aktionen `pin`/`unpin`/`list-pins` beibehalten.
- Optional `pinDeliveredMessage` für Pinning gesendeter Nachrichten implementieren, wenn das API-Verhalten zuverlässig ist.

LINE:

- `presentation`, wo möglich, in Flex- oder Template-Nachrichten rendern.
- Für nicht unterstützte Blöcke auf Text zurückfallen.
- LINE-UI-Payloads aus `channelData` entfernen.

Einfache oder eingeschränkte Kanäle:

- Darstellung mit konservativer Formatierung in Text umwandeln.

## Refactoring-Schritte

1. Den Discord-Release-Fix erneut anwenden, der `ui-colors.ts` von Carbon-gestützter UI trennt und `DiscordUiContainer` aus `extensions/discord/src/channel.ts` entfernt.
2. `presentation` und `delivery` zu `ReplyPayload`, Normalisierung ausgehender Payloads, Zustellzusammenfassungen und Hook-Payloads hinzufügen.
3. Schema und Parser-Helfer für `MessagePresentation` in einem schmalen SDK-/Laufzeit-Unterpfad hinzufügen.
4. Nachrichtenfähigkeiten `buttons`, `cards`, `components` und `blocks` durch semantische Darstellungsfähigkeiten ersetzen.
5. Hooks im ausgehenden Laufzeit-Adapter für Darstellungs-Rendering und Zustell-Pinning hinzufügen.
6. Konstruktion kontextübergreifender Komponenten durch `buildCrossContextPresentation` ersetzen.
7. `src/infra/outbound/channel-adapters.ts` löschen und `buildCrossContextComponents` aus den Typen für Kanal-Plugins entfernen.
8. `maybeApplyCrossContextMarker` so ändern, dass `presentation` statt nativer Parameter angehängt wird.
9. Plugin-Dispatch-Sendepfade aktualisieren, damit sie nur semantische Darstellung und Zustellmetadaten nutzen.
10. Native Payload-Parameter aus Agent und CLI entfernen: `components`, `blocks`, `buttons` und `card`.
11. SDK-Helfer entfernen, die native Nachrichtentool-Schemata erzeugen, und durch Helfer für Darstellungsschemata ersetzen.
12. UI-/native Hüllen aus `channelData` entfernen; bis jedes verbleibende Feld geprüft wurde, nur Transportmetadaten behalten.
13. Renderer für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu und LINE migrieren.
14. Dokumentation für Message-CLI, Kanalseiten, Plugin-SDK und Capability-Cookbook aktualisieren.
15. Import-Fanout-Profiling für Discord und betroffene Kanal-Entry-Points ausführen.

Die Schritte 1–11 und 13–14 sind in diesem Refactoring für die Verträge von gemeinsamem Agenten, CLI, Plugin-Fähigkeiten und ausgehendem Adapter implementiert. Schritt 12 bleibt ein tieferer interner Cleanup-Durchlauf für providerprivate `channelData`-Transporthüllen. Schritt 15 bleibt eine nachgelagerte Validierung, falls wir quantifizierte Import-Fanout-Zahlen jenseits des Typ-/Test-Gates möchten.

## Tests

Hinzufügen oder aktualisieren:

- Tests zur Darstellungsnormalisierung.
- Tests zur automatischen Degradierung der Darstellung bei nicht unterstützten Blöcken.
- Tests für kontextübergreifende Marker bei Plugin-Dispatch und Core-Zustellpfaden.
- Kanal-Render-Matrix-Tests für Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE und Text-Fallback.
- Tests für Nachrichtentool-Schemata, die belegen, dass native Felder entfernt wurden.
- CLI-Tests, die belegen, dass native Flags entfernt wurden.
- Regression zur Import-Lazy-Loading-Eigenschaft des Discord-Entry-Points in Bezug auf Carbon.
- Delivery-Pin-Tests für Telegram und generischen Fallback.

## Offene Fragen

- Sollte `delivery.pin` im ersten Durchgang für Discord, Slack, MS Teams und Feishu implementiert werden, oder zunächst nur für Telegram?
- Sollte `delivery` letztlich bestehende Felder wie `replyToId`, `replyToCurrent`, `silent` und `audioAsVoice` aufnehmen oder auf Verhalten nach dem Senden fokussiert bleiben?
- Sollte die Darstellung direkt Bilder oder Dateireferenzen unterstützen, oder sollten Medien vorerst von der UI-Layoutlogik getrennt bleiben?

## Verwandt

- [Kanalübersicht](/de/channels)
- [Message Presentation](/de/plugins/message-presentation)
