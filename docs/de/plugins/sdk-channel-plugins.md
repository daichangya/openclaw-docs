---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin.
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden.
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen.
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugin für OpenClaw
title: Erstellen von Channel-Plugins
x-i18n:
    generated_at: "2026-04-15T19:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Erstellen von Channel-Plugins

Diese Anleitung führt Sie durch das Erstellen eines Channel-Plugin, das OpenClaw mit einer Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Channel mit DM-Sicherheit, Pairing, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie noch nie zuvor ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Senden-/Bearbeiten-/Reagieren-Tools. OpenClaw verwaltet ein gemeinsames `message`-Tool im Core. Ihr Plugin ist verantwortlich für:

- **Konfiguration** — Kontenauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Zulassungslisten
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie anbieterspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core verwaltet das gemeinsame Message-Tool, die Prompt-Verdrahtung, die äußere Sitzungs-Schlüsselstruktur, generisches `:thread:`-Bookkeeping und die Verteilung.

Wenn Ihr Channel Message-Tool-Parameter hinzufügt, die Medienquellen transportieren, stellen Sie diese Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Core verwendet diese explizite Liste für die Sandbox-Pfad-Normalisierung und die Richtlinie für ausgehenden Medienzugriff, sodass Plugins keine Shared-Core-Sonderfälle für anbieterspezifische Avatar-, Anhangs- oder Titelbild-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer aktionsbezogenen Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht verwandte Aktionen nicht die Medienargumente einer anderen Aktion übernehmen. Ein flaches Array funktioniert weiterhin für Parameter, die absichtlich über alle bereitgestellten Aktionen hinweg gemeinsam genutzt werden.

Wenn Ihre Plattform zusätzlichen Geltungsbereich innerhalb von Konversations-IDs speichert, behalten Sie dieses Parsing im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der kanonische Hook für das Mapping von `rawId` auf die Basis-Konversations-ID, optionale Thread-ID, explizite `baseConversationId` und beliebige `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie in der Reihenfolge vom engsten Parent bis zur breitesten/Basis-Konversation.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry startet, können außerdem eine Datei `session-key-api.ts` auf oberster Ebene mit einem passenden Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur generischen/rohen ID benötigt. Wenn beide Hooks vorhanden sind, verwendet der Core zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook diese auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen Genehmigungs-spezifischen Code.

- Der Core verwaltet `/approve` im selben Chat, gemeinsame Payloads für Genehmigungs-Schaltflächen und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Channel-Plugin, wenn der Channel Genehmigungs-spezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativem Rendering/Auth unter `approvalCapability` ab.
- `plugin.auth` ist nur für Login/Logout; der Core liest aus diesem Objekt keine Auth-Hooks für Genehmigungen mehr.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Nahtstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit der Genehmigungs-Auth im selben Chat.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Status der auslösenden Oberfläche/des nativen Clients, wenn dieser sich von der Genehmigungs-Auth im selben Chat unterscheidet. Der Core verwendet diesen Exec-spezifischen Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Channel native Exec-Genehmigungen unterstützt, und den Channel in die Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für Channel-spezifisches Payload-Lifecycle-Verhalten, etwa das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungs-Routing oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für Channel-eigene Fakten zu nativen Genehmigungen. Halten Sie dies auf heißen Channel-Einstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Runtime-Modul bei Bedarf importieren kann, während der Core weiterhin den Genehmigungs-Lifecycle zusammenstellen kann.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Channel wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel in der Antwort auf den deaktivierten Pfad die genauen Konfigurationsschalter erläutern soll, die zum Aktivieren nativer Exec-Genehmigungen erforderlich sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten konto-spezifische Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` anstelle von Standardwerten auf oberster Ebene rendern.
- Wenn ein Channel stabile DM-Identitäten mit owner-ähnlichem Charakter aus der vorhandenen Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne Genehmigungs-spezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Genehmigungszustellung benötigt, halten Sie den Channel-Code auf Ziel-Normalisierung plus Transport-/Präsentationsfakten fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die Channel-spezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sodass der Core den Handler zusammenstellen und Anforderungsfilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf anderweitiges Routing verwalten kann. `nativeRuntime` ist in einige kleinere Nahtstellen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anforderung verarbeitet werden soll
- `presentation` — das gemeinsame Genehmigungs-View-Model in ausstehende/aufgelöste/abgelaufene native Payloads oder abschließende Aktionen abbilden
- `transport` — Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Schaltflächen oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Channel Runtime-eigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie sie über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry erlaubt es dem Core, fähigkeitsgesteuerte Handler aus dem Startzustand des Channels zu bootstrappen, ohne Genehmigungs-spezifischen Wrapper-Kleber hinzuzufügen.
- Greifen Sie nur dann zu den Low-Level-Funktionen `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime`, wenn die fähigkeitsgesteuerte Nahtstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Hilfsfunktionen routen. `accountId` hält die Multi-Account-Genehmigungsrichtlinie auf das richtige Bot-Konto beschränkt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen für den Channel verfügbar, ohne fest codierte Verzweigungen im Core.
- Der Core verwaltet jetzt auch Hinweise zur Umleitung von Genehmigungen. Channel-Plugins sollten keine eigenen Folge-Nachrichten wie „Genehmigung ging an DMs / einen anderen Channel“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie korrektes Ursprungs- und Approver-DM-Routing über die gemeinsamen Hilfsfunktionen für Genehmigungsfähigkeiten bereitstellen und den Core tatsächliche Zustellungen aggregieren lassen, bevor ein Hinweis zurück in den auslösenden Chat gesendet wird.
- Behalten Sie die Art der zugestellten Genehmigungs-ID durchgängig bei. Native Clients sollten Exec- vs. Plugin-Genehmigungsrouting nicht anhand Channel-lokalen Zustands erraten oder umschreiben.
- Unterschiedliche Genehmigungsarten können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Channel-Routing und dieselbe Reaktions-UX für Exec- und Plugin-Genehmigungen bei, während Auth je nach Genehmigungsart trotzdem unterschiedlich sein darf.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für heiße Channel-Einstiegspunkte bevorzugen Sie die schmaleren Runtime-Subpaths, wenn Sie nur einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Bevorzugen Sie ebenso `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere übergreifende Oberfläche nicht benötigen.

Speziell für das Setup:

- `openclaw/plugin-sdk/setup-runtime` umfasst die runtime-sicheren Setup-Hilfsfunktionen:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-Nahtstelle für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` umfasst die Builder für optionales Setup bei Installation plus einige setup-sichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurationsabläufe diese env-Namen vor dem Laden der Runtime kennen sollen, deklarieren Sie sie im Plugin-Manifest mit `channelEnvVars`. Behalten Sie Channel-Runtime-`envVars` oder lokale Konstanten nur für operatorseitige Texte bei.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Nahtstelle `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die schwergewichtigeren gemeinsamen Setup-/Konfigurationshilfen benötigen, etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel in Setup-Oberflächen nur „Dieses Plugin zuerst installieren“ bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung geschlossen fehl und verwendet dieselbe Meldung zur erforderlichen Installation über Validierung, Finalisierung und Docs-Link-Text hinweg wieder.

Für andere heiße Channel-Pfade bevorzugen Sie die schmalen Hilfsfunktionen gegenüber breiteren Legacy-Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Default-Account-Fallback
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehendes Routing/Umschlagformat und
  Wiring für Aufzeichnen und Verteilen
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Identitäts-/Sende-Delegates
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lifecycle von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Agent-/Medien-
  Payload-Feldlayout erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Benutzerdefinierte-Befehls-
  Normalisierung, Validierung von Duplikaten/Konflikten und einen fallback-stabilen
  Command-Konfigurationsvertrag

Auth-only-Channels können in der Regel beim Standardpfad aufhören: Der Core verwaltet Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Genehmigungs-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Hilfsfunktionen verwenden, anstatt ihren eigenen Genehmigungs-Lifecycle zu implementieren.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Verarbeitung eingehender Erwähnungen in zwei Ebenen getrennt:

- Plugin-eigene Faktenermittlung
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-inbound` für die gemeinsame Ebene.

Gut geeignet für Plugin-lokale Logik:

- Erkennung von Antworten auf den Bot
- Erkennung von Zitaten des Bots
- Prüfungen zur Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die benötigt werden, um die Beteiligung des Bots nachzuweisen

Gut geeignet für die gemeinsame Hilfsfunktion:

- `requireMention`
- explizites Erwähnungsergebnis
- Zulassungsliste für implizite Erwähnungen
- Command-Bypass
- endgültige Entscheidung zum Überspringen

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Hilfsfunktionen für Erwähnungen für gebündelte Channel-Plugins bereit, die bereits von Runtime-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Die älteren Hilfsfunktionen `resolveMentionGating*` bleiben auf
`openclaw/plugin-sdk/channel-inbound` nur als Kompatibilitäts-Exporte erhalten. Neuer Code sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json`
    macht dies zu einem Channel-Plugin. Die vollständige Oberfläche für
    Paketmetadaten finden Sie unter
    [Plugin-Setup und Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Das Channel-Plugin-Objekt erstellen">
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und fügen Sie nach Bedarf Adapter hinzu.

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

    <Accordion title="Was createChatChannelPlugin für Sie übernimmt">
      Statt Low-Level-Adapter-Schnittstellen manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Scoped-DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Codeaustausch |
      | `threading` | Resolver für Reply-to-Modus (fest, konto-spezifisch oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

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

    Legen Sie Channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)` ab, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Command-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für reine Runtime-Arbeiten.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    Plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Einstiegspunkte](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Eintrag hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Setup-Abläufen schweren Runtime-Code zu laden.
    Details finden Sie unter [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry).

    Gebündelte Workspace-Channels, die setup-sichere Exporte in Sidecar-
    Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus
    `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie zusätzlich einen
    expliziten Runtime-Setter zur Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Channels verteilt:

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
      Die Verarbeitung eingehender Nachrichten ist Channel-spezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Schauen Sie sich gebündelte Channel-Plugins an
      (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket) für echte Muster.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    Für gemeinsame Test-Hilfsfunktionen siehe [Testing](/de/plugins/sdk-testing).

  </Step>
</Steps>

## Dateistruktur

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel-Metadaten
├── openclaw.plugin.json      # Manifest mit Konfigurationsschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Öffentliche Exporte (optional)
├── runtime-api.ts            # Interne Runtime-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Runtime-Store (falls erforderlich)
```

## Fortgeschrittene Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, konto-spezifische oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Erkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Nahtstellen existieren weiterhin für die Wartung und
Kompatibilität gebündelter Plugins. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Reply-/Runtime-Subpaths aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten direkt diese gebündelte Plugin-Familie.
</Note>

## Nächste Schritte

- [Provider-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
