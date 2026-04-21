---
read_when:
    - Sie erstellen ein neues Messaging-Kanal-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapteroberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Kanal-Plugins für OpenClaw
title: Kanal-Plugins erstellen
x-i18n:
    generated_at: "2026-04-21T06:28:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Kanal-Plugins erstellen

Diese Anleitung führt Sie durch die Erstellung eines Kanal-Plugins, das OpenClaw mit einer Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit, Pairing, Antwort-Threading und ausgehendem Messaging.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## So funktionieren Kanal-Plugins

Kanal-Plugins benötigen keine eigenen Tools zum Senden/Bearbeiten/Reagieren. OpenClaw hält ein gemeinsames `message`-Tool im Core. Ihr Plugin besitzt:

- **Konfiguration** — Kontoauflösung und Setup-Assistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie anbieterspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core besitzt das gemeinsame Message-Tool, die Prompt-Anbindung, die äußere Form des Sitzungsschlüssels, generische `:thread:`-Buchführung und Dispatch.

Wenn Ihr Kanal Message-Tool-Parameter hinzufügt, die Medienquellen transportieren, stellen Sie diese Parameternamen über `describeMessageTool(...).mediaSourceParams` bereit. Der Core verwendet diese explizite Liste für die Normalisierung von Sandbox-Pfaden und die Richtlinie für ausgehenden Medienzugriff, sodass Plugins keine Spezialfälle im gemeinsamen Core für anbieterspezifische Avatar-, Anhangs- oder Cover-Image-Parameter benötigen.
Bevorzugen Sie die Rückgabe einer aktionsbezogenen Map wie
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, damit nicht zusammenhängende Aktionen nicht die Medienargumente anderer Aktionen erben. Ein flaches Array funktioniert weiterhin für Parameter, die absichtlich über jede bereitgestellte Aktion hinweg geteilt werden.

Wenn Ihre Plattform zusätzlichen Scope in Konversations-IDs speichert, halten Sie dieses Parsing mit `messaging.resolveSessionConversation(...)` im Plugin. Das ist der kanonische Hook, um `rawId` auf die Basis-Konversations-ID, optionale Thread-ID, explizite `baseConversationId` und etwaige `parentConversationCandidates` abzubilden.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie sie in der Reihenfolge vom engsten Parent bis zur breitesten/Basis-Konversation.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Kanal-Registry startet, können auch eine Top-Level-Datei `session-key-api.ts` mit einem passenden Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche nur dann, wenn die Laufzeit-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur generischen/raw ID benötigt. Wenn beide Hooks existieren, verwendet der Core zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook sie auslässt.

## Genehmigungen und Kanalfähigkeiten

Die meisten Kanal-Plugins benötigen keinen genehmigungsspezifischen Code.

- Der Core besitzt dasselbe Chat-`/approve`, gemeinsame Payloads für Genehmigungsbuttons und generische Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes Objekt `approvalCapability` auf dem Kanal-Plugin, wenn der Kanal genehmigungsspezifisches Verhalten benötigt.
- `ChannelPlugin.approvals` wurde entfernt. Legen Sie Fakten zu Genehmigungszustellung/nativem Verhalten/Rendering/Auth in `approvalCapability`.
- `plugin.auth` ist nur für Login/Logout; der Core liest keine Genehmigungs-Auth-Hooks mehr aus diesem Objekt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Nahtstelle für Genehmigungs-Auth.
- Verwenden Sie `approvalCapability.getActionAvailabilityState` für die Verfügbarkeit derselben Chat-Genehmigungs-Auth.
- Wenn Ihr Kanal native Exec-Genehmigungen bereitstellt, verwenden Sie `approvalCapability.getExecInitiatingSurfaceState` für den Zustand der auslösenden Oberfläche/des nativen Clients, wenn dieser sich von der Genehmigungs-Auth im selben Chat unterscheidet. Der Core verwendet diesen exec-spezifischen Hook, um `enabled` vs. `disabled` zu unterscheiden, zu entscheiden, ob der auslösende Kanal native Exec-Genehmigungen unterstützt, und den Kanal in Fallback-Hinweise für native Clients aufzunehmen. `createApproverRestrictedNativeApprovalCapability(...)` füllt dies für den häufigen Fall aus.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für kanalspezifisches Verhalten im Payload-Lebenszyklus, etwa das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungsrouting oder die Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.nativeRuntime` für kanal-eigene Fakten zu nativen Genehmigungen. Halten Sie es auf heißen Kanaleinstiegspunkten lazy mit `createLazyChannelApprovalNativeRuntimeAdapter(...)`, das Ihr Laufzeitmodul bei Bedarf importieren kann, während der Core weiterhin den Genehmigungslebenszyklus zusammensetzt.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsamen Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Kanal möchte, dass die Antwort für den deaktivierten Pfad die genauen Konfigurationsschalter erklärt, die zum Aktivieren nativer Exec-Genehmigungen nötig sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Kanäle mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Defaults auf oberster Ebene rendern.
- Wenn ein Kanal stabile, owner-ähnliche DM-Identitäten aus bestehender Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um dasselbe Chat-`/approve` einzuschränken, ohne genehmigungsspezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal native Genehmigungszustellung benötigt, halten Sie den Kanalcode auf Zielnormalisierung sowie Fakten zu Transport/Präsentation fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` und `createApproverRestrictedNativeApprovalCapability` aus `openclaw/plugin-sdk/approval-runtime`. Legen Sie die kanalspezifischen Fakten hinter `approvalCapability.nativeRuntime`, idealerweise über `createChannelApprovalNativeRuntimeAdapter(...)` oder `createLazyChannelApprovalNativeRuntimeAdapter(...)`, damit der Core den Handler zusammensetzen und Anfragefilterung, Routing, Deduplizierung, Ablauf, Gateway-Abonnement und Hinweise auf andere Routen besitzen kann. `nativeRuntime` ist in einige kleinere Nahtstellen aufgeteilt:
- `availability` — ob das Konto konfiguriert ist und ob eine Anfrage behandelt werden soll
- `presentation` — das gemeinsame Genehmigungs-View-Modell auf ausstehende/aufgelöste/abgelaufene native Payloads oder finale Aktionen abbilden
- `transport` — Ziele vorbereiten sowie native Genehmigungsnachrichten senden/aktualisieren/löschen
- `interactions` — optionale Hooks zum Binden/Entbinden/Löschen von Aktionen für native Buttons oder Reaktionen
- `observe` — optionale Hooks für Zustellungsdiagnostik
- Wenn der Kanal laufzeiteigene Objekte wie einen Client, Token, eine Bolt-App oder einen Webhook-Empfänger benötigt, registrieren Sie diese über `openclaw/plugin-sdk/channel-runtime-context`. Die generische Runtime-Context-Registry erlaubt dem Core, fähigkeitsgetriebene Handler aus dem Kanal-Startzustand zu bootstrappen, ohne genehmigungsspezifischen Wrapper-Glue hinzuzufügen.
- Greifen Sie nur zu `createChannelApprovalHandler` oder `createChannelNativeApprovalRuntime` auf niedrigerer Ebene, wenn die fähigkeitsgetriebene Nahtstelle noch nicht ausdrucksstark genug ist.
- Native Genehmigungskanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält die Richtlinie für Multi-Account-Genehmigungen auf das richtige Bot-Konto beschränkt, und `approvalKind` hält Verhalten für Exec- vs. Plugin-Genehmigungen für den Kanal verfügbar, ohne fest codierte Branches im Core.
- Der Core besitzt jetzt auch Hinweise auf umgeleitete Genehmigungen. Kanal-Plugins sollten keine eigenen Folgemeldungen wie „Genehmigung ging an DMs / einen anderen Kanal“ aus `createChannelNativeApprovalRuntime` senden; stattdessen sollten sie genaue Ursprung- und Approver-DM-Routen über die gemeinsamen Hilfen für Genehmigungsfähigkeiten verfügbar machen und den Core tatsächliche Zustellungen aggregieren lassen, bevor ein Hinweis zurück in den auslösenden Chat gepostet wird.
- Behalten Sie die Art der zugestellten Genehmigungs-ID Ende-zu-Ende bei. Native Clients sollten das Routing für Exec- vs. Plugin-Genehmigungen nicht aus kanal-lokalem Zustand erraten oder umschreiben.
- Verschiedene Arten von Genehmigungen können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungsrouting sowohl für Exec- als auch Plugin-IDs verfügbar.
  - Matrix behält dasselbe native DM-/Kanal-Routing und dieselbe Reaktions-UX für Exec- und Plugin-Genehmigungen bei, während Auth weiterhin je nach Genehmigungsart unterschiedlich sein darf.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für heiße Kanaleinstiegspunkte bevorzugen Sie die schmaleren Runtime-Unterpfade, wenn Sie nur einen Teil dieser Familie benötigen:

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
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere Umbrella-Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die runtime-sicheren Setup-Helfer ab:
  import-sichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die Builder für delegierte
  Setup-Proxys
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-Nahtstelle für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die optionalen Setup-Builder plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Kanal env-gesteuertes Setup oder Auth unterstützt und generische Start-/Konfigurationsabläufe diese Env-Namen kennen sollen, bevor die Laufzeit geladen wird, deklarieren Sie sie im Plugin-Manifest mit `channelEnvVars`. Halten Sie Runtime-`envVars` des Kanals oder lokale Konstanten nur für operatororientierte Texte.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- verwenden Sie die breitere Nahtstelle `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die schwereren gemeinsamen Setup-/Konfigurationshelfer wie
  `moveSingleAccountChannelSectionToDefaultAccount(...)` benötigen

Wenn Ihr Kanal nur „Installieren Sie dieses Plugin zuerst“ in Setup-Oberflächen bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der erzeugte Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung fail-closed fehl und verwendet dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und Docs-Link-Text wieder.

Für andere heiße Kanalpfade bevorzugen Sie die schmalen Helfer gegenüber breiteren Legacy-Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und Fallback auf Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für inbound Route/Envelope und Record-and-Dispatch-Anbindung
- `openclaw/plugin-sdk/messaging-targets` für Target-Parsing/-Matching
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus Delegates für ausgehende Identität/Senden und Payload-Planung
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Feldlayout für Agent-/Medien-Payload erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für die Normalisierung benutzerdefinierter Telegram-Befehle, Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag für die Befehlskonfiguration

Auth-only-Kanäle können normalerweise beim Standardpfad stehen bleiben: Der Core behandelt Genehmigungen, und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Kanäle mit nativen Genehmigungen wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsamen nativen Helfer verwenden, statt ihren eigenen Genehmigungslebenszyklus zu bauen.

## Richtlinie für eingehende Erwähnungen

Halten Sie die Behandlung eingehender Erwähnungen in zwei Ebenen getrennt:

- plugin-eigene Erfassung von Nachweisen
- gemeinsame Richtlinienauswertung

Verwenden Sie `openclaw/plugin-sdk/channel-mention-gating` für Entscheidungen zur Erwähnungsrichtlinie.
Verwenden Sie `openclaw/plugin-sdk/channel-inbound` nur dann, wenn Sie die breitere Helper-Barrel für eingehende Nachrichten benötigen.

Gute Kandidaten für plugin-lokale Logik:

- Erkennung von Antworten an den Bot
- Erkennung von Zitaten des Bots
- Prüfungen auf Thread-Beteiligung
- Ausschlüsse von Service-/Systemnachrichten
- plattformnative Caches, die nötig sind, um die Beteiligung des Bots nachzuweisen

Gute Kandidaten für den gemeinsamen Helper:

- `requireMention`
- explizites Erwähnungsergebnis
- implizite Erwähnungs-Allowlist
- Command-Bypass
- finale Skip-Entscheidung

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

`api.runtime.channel.mentions` stellt dieselben gemeinsamen Erwähnungs-Helper für gebündelte Kanal-Plugins bereit, die bereits von Laufzeit-Injection abhängen:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Wenn Sie nur `implicitMentionKindWhen` und `resolveInboundMentionDecision` benötigen, importieren Sie aus `openclaw/plugin-sdk/channel-mention-gating`, um das Laden nicht zusammenhängender Inbound-Runtime-Helper zu vermeiden.

Die älteren Helper `resolveMentionGating*` bleiben auf `openclaw/plugin-sdk/channel-inbound` nur noch als Kompatibilitäts-Exporte erhalten. Neuer Code sollte `resolveInboundMentionDecision({ facts, policy })` verwenden.

## Schritt-für-Schritt

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standarddateien des Plugins. Das Feld `channel` in `package.json` macht dieses Plugin zu einem Kanal-Plugin. Für die vollständige Oberfläche der Paketmetadaten siehe [Plugin-Setup und Konfiguration](/de/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Verbinden Sie OpenClaw mit Acme Chat."
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
      "description": "Acme-Chat-Kanal-Plugin",
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
    Die Schnittstelle `ChannelPlugin` hat viele optionale Adapteroberflächen. Beginnen Sie mit dem Minimum — `id` und `setup` — und fügen Sie Adapter hinzu, wenn Sie sie benötigen.

    Erstellen Sie `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // Ihr Plattform-API-Client

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

      // DM-Sicherheit: Wer dem Bot Nachrichten senden darf
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: Genehmigungsablauf für neue DM-Kontakte
      pairing: {
        text: {
          idLabel: "Acme-Chat-Benutzername",
          message: "Senden Sie diesen Code, um Ihre Identität zu verifizieren:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: Wie Antworten zugestellt werden
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: Nachrichten an die Plattform senden
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
      Statt Adapter-Schnittstellen auf niedriger Ebene manuell zu implementieren, übergeben Sie deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was damit verdrahtet wird |
      | --- | --- |
      | `security.dm` | Bereichsbezogener DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Code-Austausch |
      | `threading` | Resolver für Reply-to-Modi (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapterobjekte statt der deklarativen Optionen übergeben, wenn Sie vollständige Kontrolle benötigen.
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
              .description("Acme-Chat-Verwaltung");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme-Chat-Verwaltung",
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

    Legen Sie kanal-eigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw sie in der Root-Hilfe anzeigen kann, ohne die vollständige Kanal-Laufzeit zu aktivieren, während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehlsregistrierung aufgreifen. Verwenden Sie `registerFull(...)` für Arbeit nur zur Laufzeit.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein plugin-spezifisches Präfix. Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Trennung des Registrierungsmodus automatisch. Siehe [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle Optionen.

  </Step>

  <Step title="Einen Setup-Einstieg hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Einstiegspunkts, wenn der Kanal deaktiviert oder unkonfiguriert ist. So wird vermieden, während des Setups schwere Laufzeitlogik zu laden.
    Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

    Gebündelte Workspace-Kanäle, die setup-sichere Exporte in Sidecar-Module aufteilen, können `defineBundledChannelSetupEntry(...)` aus `openclaw/plugin-sdk/channel-entry-contract` verwenden, wenn sie außerdem einen expliziten Setter für die Laufzeit zur Setup-Zeit benötigen.

  </Step>

  <Step title="Eingehende Nachrichten behandeln">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und sie durch den Inbound-Handler Ihres Kanals dispatcht:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-verwaltete Auth (Signaturen selbst verifizieren)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Ihr Inbound-Handler dispatcht die Nachricht an OpenClaw.
          // Die genaue Verdrahtung hängt von Ihrem Plattform-SDK ab —
          // siehe ein echtes Beispiel im gebündelten Microsoft-Teams- oder Google-Chat-Plugin-Paket.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Die Behandlung eingehender Nachrichten ist kanalspezifisch. Jedes Kanal-Plugin besitzt seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Kanal-Plugins an
      (zum Beispiel das Microsoft-Teams- oder Google-Chat-Plugin-Paket) für echte Muster.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Testen">
Schreiben Sie colocated Tests in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("löst das Konto aus der Konfiguration auf", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("prüft das Konto, ohne Geheimnisse zu materialisieren", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("meldet fehlende Konfiguration", () => {
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
├── package.json              # openclaw.channel-Metadaten
├── openclaw.plugin.json      # Manifest mit Konfigurationsschema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Öffentliche Exporte (optional)
├── runtime-api.ts            # Interne Laufzeit-Exporte (optional)
└── src/
    ├── channel.ts            # ChannelPlugin über createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Laufzeitspeicher (falls nötig)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Erkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Laufzeit-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und aus Kompatibilitätsgründen. Sie sind nicht das empfohlene Muster für neue Kanal-Plugins; bevorzugen Sie die generischen Subpfade für Kanal/Setup/Antwort/Laufzeit aus der gemeinsamen SDK-Oberfläche, es sei denn, Sie warten direkt diese Familie gebündelter Plugins.
</Note>

## Nächste Schritte

- [Anbieter-Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [SDK Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
