---
read_when:
    - Sie erstellen ein neues Messaging-Kanal-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-04-24T06:50:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie Schritt für Schritt durch das Erstellen eines Kanal-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Kopplung, Antwort-Threading und ausgehendem Messaging.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Einrichtung des Manifests.
</Info>

## Wie Kanal-Plugins funktionieren

Kanal-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw behält ein
gemeinsames `message`-Tool im Core. Ihr Plugin verwaltet:

- **Konfiguration** — Kontoauflösung und Setup-Assistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Kopplung** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie providerspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden
- **Heartbeat-Typing** — optionale Typing-/Busy-Signale für Heartbeat-Zustellungsziele

Der Core verwaltet das gemeinsame Message-Tool, Prompt-Wiring, die äußere Form des Sitzungsschlüssels,
generisches `:thread:`-Bookkeeping und Dispatch.

Wenn Ihr Kanal Typing-Indikatoren außerhalb eingehender Antworten unterstützt, stellen Sie
`heartbeat.sendTyping(...)` auf dem Kanal-Plugin bereit. Der Core ruft es mit dem
aufgelösten Heartbeat-Zustellungsziel auf, bevor der Heartbeat-Modelllauf beginnt, und
verwendet den gemeinsamen Typing-Keepalive-/Cleanup-Lebenszyklus. Fügen Sie `heartbeat.clearTyping(...)`
hinzu, wenn die Plattform ein explizites Stoppsignal benötigt.

Wenn Ihr Kanal Parameter zum Message-Tool hinzufügt, die Medienquellen tragen, stellen Sie diese
Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Core verwendet
diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff,
sodass Plugins keine Spezialfälle im gemeinsamen Core für providerspezifische
Avatar-, Anhangs- oder Cover-Image-Parameter benötigen.
Bevorzugen Sie dort die Rückgabe einer aktionsbezogenen Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht verwandte Aktionen nicht
die Medienargumente einer anderen Aktion erben. Ein flaches Array funktioniert weiterhin für Parameter, die
absichtlich über alle bereitgestellten Aktionen hinweg geteilt werden.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook für die Abbildung von `rawId` auf die Basis-Konversations-ID, eine optionale Thread-
ID, explizite `baseConversationId` und etwaige `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie diese von der
engsten Parent-Konversation bis zur breitesten/Basis-Konversation sortiert.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Kanal-Registry startet,
können außerdem eine Datei `session-key-api.ts` auf oberster Ebene mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als veralteter Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und fällt nur
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie weglässt.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code.

- Der Core verwaltet `/approve` im selben Chat, gemeinsame Payloads für Genehmigungsschaltflächen und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes Objekt `approvalCapability` auf dem Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativem Verhalten/Rendering/Auth unter `approvalCapability` ab.
- `plugin.auth` ist nur für login/logout; der Core liest daraus keine Genehmigungs-Auth-Hooks mehr.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Seam für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Auth im selben Chat.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den initiierenden Oberflächen-/Native-Client-Status, wenn er sich von der Genehmigungs-Auth im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Kanal native Exec-Genehmigungen unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Payload-Lebenszyklus, etwa das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Typing-Indikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanalbezogene native Genehmigungsfakten. Halten Sie sie auf heißen Kanaleinstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Runtime-Modul bei Bedarf importieren kann und dem Core dennoch erlaubt, den Genehmigungs-Lebenszyklus zusammenzusetzen.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal möchte, dass die Antwort im deaktivierten Pfad die genauen Konfigurationsschalter erklärt, die zum Aktivieren nativer Exec-Genehmigungen nötig sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Standardwerte auf oberster Ebene rendern.
- Wenn ein Kanal stabile eigentümerähnliche DM-Identitäten aus bestehender Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, konzentrieren Sie den Kanalcode auf Zielnormalisierung plus Fakten zu Transport/Präsentation. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime` ab, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den Handler zusammensetzen und Request-Filterung, Routing, Dedupe, Ablauf, Gateway-Subscription und Hinweise „anderswo geroutet“ verwalten kann. `nativeRuntime` ist in einige kleinere Seams aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob ein Request behandelt werden soll
- `presentation` — das gemeinsame Genehmigungs-View-Model auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` — Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Schaltflächen oder Reaktionen
- `observe` — optionale Hooks für Diagnosen bei der Zustellung
- Wenn der Kanal Runtime-eigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Receiver benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry ermöglicht dem Core, handler auf Basis von Fähigkeiten aus dem Startzustand des Kanals zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Funktionen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die capability-getriebene Seam noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helper routen. `accountId` hält die Richtlinie für Genehmigungen bei mehreren Konten auf das richtige Bot-Konto begrenzt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen für den Kanal verfügbar, ohne hart codierte Zweige im Core.
- Der Core verwaltet jetzt auch Hinweise zum Umleiten von Genehmigungen. Kanal-Plugins sollten keine eigenen Follow-up-Nachrichten wie „Genehmigung ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie über die gemeinsamen Helper für Genehmigungsfähigkeiten genaues Ursprungs- und Approver-DM-Routing bereitstellen und den Core tatsächliche Zustellungen aggregieren lassen, bevor eine eventuelle Nachricht an den initiierenden Chat gesendet wird.
- Behalten Sie die Art der zugestellten Genehmigungs-ID durchgehend bei. Native Clients sollten
  das Routing von Exec- vs. Plugin-Genehmigungen nicht aus kanalbezogenem Zustand erraten oder umschreiben.
- Unterschiedliche Arten von Genehmigungen können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Kanal-Routing und dieselbe Reaktions-UX für Exec-
    und Plugin-Genehmigungen bei, erlaubt aber dennoch, dass sich die Auth je nach Genehmigungsart unterscheidet.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Kanaleinstiegspunkte bevorzugen Sie die schmaleren Runtime-Subpaths, wenn Sie nur
einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Ebenso sollten Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking` bevorzugen, wenn Sie die breitere übergreifende
Oberfläche nicht benötigen.

Speziell für Setup gilt:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Helper ab:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-
  Seam für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die optionalen Setup-
  Builder plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurations-
Abläufe diese Env-Namen kennen sollen, bevor die Runtime lädt, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Kanals oder lokale
Konstanten nur für operatorseitige Texte bei.

Wenn Ihr Kanal in `status`, `channels list`, `channels status` oder SecretRef-Scans erscheinen kann, bevor die Plugin-Runtime startet, fügen Sie `openclaw.setupEntry` in
`package.json` hinzu. Dieser Einstiegspunkt sollte in schreibgeschützten Befehlswegen sicher importierbar sein und die Kanalmetadaten, einen setup-sicheren Konfigurationsadapter, einen Statusadapter und die Secret-Zielmetadaten des Kanals zurückgeben, die für diese Zusammenfassungen benötigt werden. Starten Sie keine Clients, Listener oder Transport-Runtimes über den Setup-Einstiegspunkt.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Seam `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die
  schwergewichtigeren gemeinsamen Setup-/Konfigurations-Helper benötigen wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal lediglich „dieses Plugin zuerst installieren“ in Setup-
Oberflächen bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der erzeugte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen fail-closed fehl und verwendet dieselbe Meldung „Installation erforderlich“ in Validierung, Finalisierung und Docs-Link-
Text wieder.

Für andere heiße Kanalpfade sollten Sie die schmalen Helper gegenüber breiteren veralteten Oberflächen bevorzugen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Standardkonto-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Record-and-Dispatch-Wiring
- `openclaw/plugin-sdk/messaging-targets` für Parsing/Matching von Zielen
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Delegates für Identität/Senden und Payload-Planung
- `buildThreadAwareOutboundSessionRoute(...)` aus
  `openclaw/plugin-sdk/channel-core`, wenn eine ausgehende Route ein explizites
  `replyToId`/`threadId` beibehalten oder die aktuelle `:thread:`-Sitzung
  wiederherstellen soll, nachdem der Basissitzungsschlüssel weiterhin passt.
  Provider-Plugins können Priorität, Suffix-Verhalten und Normalisierung der Thread-ID überschreiben, wenn ihre Plattform native Thread-Zustellungssemantik hat.
- `openclaw/plugin-sdk/thread-bindings-runtime` für Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn ein veraltetes Agent-/Media-
  Payload-Feldlayout weiterhin erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Normalisierung benutzerdefinierter Telegram-Befehle,
  Duplikat-/Konfliktvalidierung und einen fallback-stabilen Befehlskonfigurationsvertrag

Kanäle, die nur Auth benötigen, können in der Regel beim Standardpfad bleiben: Der Core verwaltet Genehmigungen und das Plugin stellt nur ausgehende/Auth-Fähigkeiten bereit. Kanäle mit nativen Genehmigungen wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helper verwenden, statt ihren eigenen Genehmigungs-Lebenszyklus zu entwickeln.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Behandlung eingehender Erwähnungen in zwei Schichten getrennt:

- pluginbezogene Beweissammlung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie das breitere
Hilfs-Barrel für Eingänge benötigen.

Geeignet für pluginlokale Logik:

- Erkennung „Antwort an Bot“
- Erkennung „Zitat des Bots“
- Prüfungen zur Thread-Teilnahme
- Ausschlüsse von Service-/Systemnachrichten
- plattformspezifische Caches, die nötig sind, um die Beteiligung des Bots zu belegen

Geeignet für den gemeinsamen Helper:

- `requireMention`
- explizites Erwähnungsergebnis
- Allowlist für implizite Erwähnungen
- Command-Bypass
- endgültige Skip-Entscheidung

Bevorzugter Ablauf:

1. Lokale Erwähnungsfakten berechnen.
2. Diese Fakten an `resolveInboundMentionDecision({ facts, policy })` übergeben.
3. `decision.effectiveWasMentioned`, `decision.shouldBypassMention` und `decision.shouldSkip` in Ihrem Inbound-Gate verwenden.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Helper für
gebündelte Kanal-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und
`resolveInboundMentionDecision` benötigen, importieren Sie aus
`openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht verwandter Inbound-
Runtime-Helper zu vermeiden.

Die älteren Helper `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitätsexporte erhalten. Neuer Code
sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien des Plugins. Das Feld `channel` in `package.json` ist
    das, was daraus ein Kanal-Plugin macht. Für die vollständige Oberfläche der Paketmetadaten
    siehe [Plugin Setup and Config](/de/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Das Kanal-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie Adapter nach Bedarf hinzu.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    <Accordion title="Was createChatChannelPlugin für Sie erledigt">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Scoped-DM-Sicherheitsauflöser aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Code-Austausch |
      | `threading` | Auflöser für den Antwortmodus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnismetadaten (Nachrichten-IDs) zurückgeben |

      Sie können statt der deklarativen Optionen auch rohe Adapter-Objekte übergeben,
      wenn Sie vollständige Kontrolle benötigen.
    </Accordion>

  </Step>

  <Step title="Den Einstiegspunkt verdrahten">
    Erstellen Sie `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Legen Sie kanalbezogene CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Kanal-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren für die echte Befehls-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für Runtime-exklusive Arbeit bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
    werden immer auf `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung der Registrierungsmodi automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Einstiegspunkt hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies statt des vollständigen Einstiegspunkts, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird verhindert, dass während Setup-Abläufen schwere Runtime-Codes geladen werden.
    Siehe [Setup and Config](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-
    Modulen aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen
    expliziten setupbezogenen Runtime-Setter benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der den Request verifiziert und
    ihn durch den Inbound-Handler Ihres Kanals dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Verarbeitung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin verwaltet
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Kanal-Plugins
      (zum Beispiel das Paket für Microsoft Teams oder Google Chat) für reale Muster an.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie colocated Tests in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Für gemeinsame Test-Helper siehe [Testing](/de/plugins/sdk-testing).

  </Step>
</Steps>

## Dateistruktur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Fortgeschrittene Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Aktions-Discovery
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Sub-Agent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Pflege gebündelter Plugins und
zur Kompatibilität. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins;
bevorzugen Sie die generischen Subpaths channel/setup/reply/runtime aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie pflegen diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Importreferenz der Subpaths
- [SDK-Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema

## Verwandt

- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
