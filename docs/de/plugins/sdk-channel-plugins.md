---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-04-07T06:17:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ac0591d9b0ba401925b29ae4b9572f18b2cbffc2b6ca6ed5252740e7cf97e9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Channel-Plugins erstellen

Diese Anleitung führt Sie durch das Erstellen eines Channel-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende verfügen Sie über einen funktionierenden Channel mit DM-Sicherheit,
Pairing, Antwort-Threading und ausgehenden Nachrichten.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paket-
  Struktur und die Manifest-Einrichtung.
</Info>

## Wie Channel-Plugins funktionieren

Channel-Plugins benötigen keine eigenen Sende-/Bearbeitungs-/Reaktions-Tools. OpenClaw behält ein
gemeinsam genutztes `message`-Tool im Core. Ihr Plugin besitzt:

- **Konfiguration** — Kontenauflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Pairing** — DM-Genehmigungsablauf
- **Sitzungsgrammatik** — wie providerspezifische Gesprächs-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core besitzt das gemeinsam genutzte Message-Tool, Prompt-Verkabelung, die äußere Form des Sitzungs-
Schlüssels, generische `:thread:`-Buchführung und Dispatch.

Wenn Ihre Plattform zusätzlichen Scope in Gesprächs-IDs speichert, halten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook zum Zuordnen von `rawId` zur Basis-Gesprächs-ID, optionalen Thread-
ID, expliziten `baseConversationId` und beliebigen `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, halten Sie deren Reihenfolge von
dem engsten Parent bis zum breitesten/Basis-Gespräch ein.

Gebündelte Plugins, die dasselbe Parsing benötigen, bevor die Channel-Registry gebootet ist,
können auch eine Top-Level-Datei `session-key-api.ts` mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese bootstrap-sichere Oberfläche
nur, wenn die Plugin-Registry zur Laufzeit noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich zur
generischen/rohen ID benötigt. Wenn beide Hooks existieren, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und fällt nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
diese auslässt.

## Genehmigungen und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen Genehmigungs-spezifischen Code.

- Der Core besitzt `/approve` im selben Chat, gemeinsam genutzte Payloads für Genehmigungsbuttons und generische Fallback-Auslieferung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt auf dem Channel-Plugin, wenn der Channel genehmigungsspezifisches Verhalten benötigt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind der kanonische Auth-Seam für Genehmigungen.
- Wenn Ihr Channel native Exec-Genehmigungen bereitstellt, implementieren Sie `approvalCapability.getActionAvailabilityState` auch dann, wenn der native Transport vollständig unter `approvalCapability.native` lebt. Der Core verwendet diesen Availability-Hook, um zwischen `enabled` und `disabled` zu unterscheiden, zu entscheiden, ob der initiierende Channel native Genehmigungen unterstützt, und den Channel in Fallback-Hinweise für native Clients einzubeziehen.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für channelspezifisches Payload-Lebenszyklusverhalten wie das Ausblenden doppelter lokaler Genehmigungs-Prompts oder das Senden von Schreibindikatoren vor der Auslieferung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Genehmigungs-Routing oder Unterdrückung von Fallbacks.
- Verwenden Sie `approvalCapability.render` nur, wenn ein Channel wirklich benutzerdefinierte Genehmigungs-Payloads statt des gemeinsam genutzten Renderers benötigt.
- Verwenden Sie `approvalCapability.describeExecApprovalSetup`, wenn der Channel im deaktivierten Pfad in der Antwort die genauen Konfigurationsschalter erklären soll, die zum Aktivieren nativer Exec-Genehmigungen nötig sind. Der Hook erhält `{ channel, channelLabel, accountId }`; Channels mit benannten Konten sollten kontobezogene Pfade wie `channels.<channel>.accounts.<id>.execApprovals.*` statt Top-Level-Standards rendern.
- Wenn ein Channel stabile eigentümerähnliche DM-Identitäten aus vorhandener Konfiguration ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne Genehmigungs-spezifische Core-Logik hinzuzufügen.
- Wenn ein Channel native Genehmigungs-Auslieferung benötigt, halten Sie den Channel-Code auf Zielnormalisierung und Transport-Hooks fokussiert. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` und `createChannelNativeApprovalRuntime` aus `openclaw/plugin-sdk/approval-runtime`, sodass der Core Request-Filterung, Routing, Dedupe, Ablauf und Gateway-Abonnement besitzt.
- Native Genehmigungs-Channels müssen sowohl `accountId` als auch `approvalKind` durch diese Helper leiten. `accountId` hält die Genehmigungsrichtlinie in Multi-Account-Setups auf das richtige Bot-Konto begrenzt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Genehmigungen im Channel verfügbar, ohne hartcodierte Verzweigungen im Core.
- Bewahren Sie die Art der ausgelieferten Genehmigungs-ID Ende-zu-Ende. Native Clients sollten
  das Routing von Exec- vs. Plugin-Genehmigungen nicht aus kanal-lokalem Zustand erraten oder umschreiben.
- Unterschiedliche Arten von Genehmigungen können absichtlich unterschiedliche native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack hält natives Genehmigungs-Routing sowohl für Exec- als auch für Plugin-IDs verfügbar.
  - Matrix hält natives DM-/Channel-Routing nur für Exec-Genehmigungen verfügbar und belässt
    Plugin-Genehmigungen auf dem gemeinsam genutzten Pfad `/approve` im selben Chat.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` auf dem Plugin bereitstellen.

Für häufig geladene Channel-Entry-Points bevorzugen Sie die engeren Runtime-Subpfade, wenn Sie nur
einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Ebenso bevorzugen Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking`, wenn Sie die breitere übergreifende
Oberfläche nicht benötigen.

Speziell für Setup:

- `openclaw/plugin-sdk/setup-runtime` deckt die laufzeitsicheren Setup-Helper ab:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die Builder für delegierte
  Setup-Proxys
- `openclaw/plugin-sdk/setup-adapter-runtime` ist der enge umgebungsbewusste Adapter-
  Seam für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` deckt die Setup-Builder für optionale Installation
  plus einige setup-sichere Primitive ab:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Wenn Ihr Channel umgebungsgetriebenes Setup oder Auth unterstützt und generische Start-/Konfigurations-
Flows diese Umgebungsnamen vor dem Laden der Laufzeit kennen sollen, deklarieren Sie sie im
Plugin-Manifest mit `channelEnvVars`. Behalten Sie Runtime-`envVars` des Channels oder lokale
Konstanten nur für operatorseitige Texte.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
`splitSetupEntries`

- Verwenden Sie den breiteren Seam `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die
  schwergewichtigeren gemeinsam genutzten Setup-/Konfigurations-Helper benötigen, wie etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Channel in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ bewerben möchte, bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt fail-closed bei Konfigurationsschreibvorgängen und Finalisierung fehl und verwendet
dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und Dokumentations-Link-
Texte erneut.

Für andere häufig geladene Channel-Pfade bevorzugen Sie enge Helper gegenüber breiteren Legacy-
Oberflächen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Multi-Account-Konfiguration und
  Fallback auf das Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Verkabelung für Aufzeichnung und Dispatch
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Abgleich
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen plus ausgehende
  Identitäts-/Sende-Delegates
- `openclaw/plugin-sdk/thread-bindings-runtime` für den Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Agent/Medien-
  Payload-Feldlayout erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für die Normalisierung benutzerdefinierter Telegram-Befehle, Validierung von Duplikaten/Konflikten und einen Fallback-stabilen
  Vertrag für Befehlskonfiguration

Channels, die nur Auth benötigen, können meist beim Standardpfad bleiben: Der Core behandelt Genehmigungen und das Plugin stellt nur Outbound-/Auth-Fähigkeiten bereit. Native Genehmigungs-Channels wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsam genutzten nativen Helper verwenden, statt ihren eigenen Genehmigungs-Lebenszyklus zu implementieren.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json`
    macht dies zu einem Channel-Plugin. Die vollständige Oberfläche der Paketmetadaten
    finden Sie unter [Plugin-Setup und -Konfiguration](/de/plugins/sdk-setup#openclawchannel):

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
    Das Interface `ChannelPlugin` hat viele optionale Adapter-Oberflächen. Beginnen Sie mit
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

    <Accordion title="Was createChatChannelPlugin für Sie übernimmt">
      Statt Low-Level-Adapter-Interfaces manuell zu implementieren, übergeben Sie
      deklarative Optionen und der Builder setzt sie zusammen:

      | Option | Was sie verdrahtet |
      | --- | --- |
      | `security.dm` | Scoped-DM-Sicherheits-Resolver aus Konfigurationsfeldern |
      | `pairing.text` | Textbasierter DM-Pairing-Ablauf mit Code-Austausch |
      | `threading` | Resolver für Reply-to-Modi (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sende-Funktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapter-Objekte statt der deklarativen Optionen übergeben,
      wenn Sie vollständige Kontrolle benötigen.
    </Accordion>

  </Step>

  <Step title="Den Entry-Point verdrahten">
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

    Platzieren Sie Channel-eigene CLI-Deskriptoren in `registerCliMetadata(...)`, damit OpenClaw
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Laufzeit zu aktivieren,
    während normale vollständige Ladevorgänge weiterhin dieselben Deskriptoren für die echte Befehls-
    Registrierung übernehmen. Behalten Sie `registerFull(...)` für rein laufzeitbezogene Arbeit.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    pluginspezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und
    werden immer zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung nach Registrierungsmodus automatisch. Siehe
    [Entry Points](/de/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Entry hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Entry-Points, wenn der Channel deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Setup-Flows schwergewichtigen Laufzeitcode zu laden.
    Siehe [Setup und Konfiguration](/de/plugins/sdk-setup#setup-entry) für Details.

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage überprüft und
    sie über den Inbound-Handler Ihres Channels dispatcht:

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
      Die Verarbeitung eingehender Nachrichten ist channelspezifisch. Jedes Channel-Plugin besitzt
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      (zum Beispiel das Plugin-Paket für Microsoft Teams oder Google Chat) für reale Muster an.
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

    Gemeinsam genutzte Test-Helper finden Sie unter [Testing](/de/plugins/sdk-testing).

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
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Plattform-API-Client
    └── runtime.ts            # Laufzeitspeicher (falls erforderlich)
```

## Erweiterte Themen

<CardGroup cols={2}>
  <Card title="Threading-Optionen" icon="git-branch" href="/de/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/de/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Discovery
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/de/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helper" icon="settings" href="/de/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Seams existieren weiterhin für die Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die generischen Channel-/Setup-/Reply-/Runtime-Subpfade aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten direkt diese gebündelte Plugin-Familie.
</Note>

## Nächste Schritte

- [Provider Plugins](/de/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [SDK-Testing](/de/plugins/sdk-testing) — Test-Utilities und Vertrags-Tests
- [Plugin-Manifest](/de/plugins/manifest) — vollständiges Manifest-Schema
