---
read_when:
    - Sie erstellen ein neues Messaging-Channel-Plugin
    - Sie möchten OpenClaw mit einer Messaging-Plattform verbinden
    - Sie müssen die Adapter-Oberfläche von ChannelPlugin verstehen
sidebarTitle: Channel Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Messaging-Channel-Plugins für OpenClaw
title: Channel-Plugins erstellen
x-i18n:
    generated_at: "2026-04-05T12:51:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Channel-Plugins erstellen

Diese Anleitung führt Sie durch das Erstellen eines Channel-Plugins, das OpenClaw mit einer
Messaging-Plattform verbindet. Am Ende haben Sie einen funktionierenden Kanal mit DM-Sicherheit,
Kopplung, Antwort-Threading und ausgehender Nachrichtenübermittlung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/plugins/building-plugins), um die grundlegende Paket-
  struktur und die Manifest-Einrichtung kennenzulernen.
</Info>

## So funktionieren Channel-Plugins

Channel-Plugins benötigen keine eigenen Send/Edit/React-Tools. OpenClaw behält ein
gemeinsam genutztes `message`-Tool im Core. Ihr Plugin verwaltet:

- **Konfiguration** — Account-Auflösung und Einrichtungsassistent
- **Sicherheit** — DM-Richtlinie und Allowlists
- **Kopplung** — DM-Freigabeablauf
- **Sitzungsgrammatik** — wie providerspezifische Konversations-IDs auf Basis-Chats, Thread-IDs und Parent-Fallbacks abgebildet werden
- **Ausgehend** — Senden von Text, Medien und Umfragen an die Plattform
- **Threading** — wie Antworten in Threads organisiert werden

Der Core verwaltet das gemeinsam genutzte Message-Tool, die Prompt-Verdrahtung, die äußere Form des Sitzungsschlüssels,
allgemeines `:thread:`-Bookkeeping und die Verteilung.

Wenn Ihre Plattform zusätzlichen Geltungsbereich in Konversations-IDs speichert, behalten Sie dieses Parsing
im Plugin mit `messaging.resolveSessionConversation(...)`. Das ist der
kanonische Hook für die Abbildung von `rawId` auf die Basis-Konversations-ID, optionale Thread-
ID, explizite `baseConversationId` und alle `parentConversationCandidates`.
Wenn Sie `parentConversationCandidates` zurückgeben, behalten Sie deren Reihenfolge von der
engsten Parent-Ebene bis zur breitesten/Basis-Konversation bei.

Gebündelte Plugins, die dieselbe Analyse benötigen, bevor die Channel-Registry gestartet wird,
können außerdem eine Top-Level-Datei `session-key-api.ts` mit einem passenden
Export `resolveSessionConversation(...)` bereitstellen. Der Core verwendet diese Bootstrap-sichere Oberfläche
nur dann, wenn die Runtime-Plugin-Registry noch nicht verfügbar ist.

`messaging.resolveParentConversationCandidates(...)` bleibt als
Legacy-Kompatibilitäts-Fallback verfügbar, wenn ein Plugin nur Parent-Fallbacks zusätzlich
zur allgemeinen/raw ID benötigt. Wenn beide Hooks vorhanden sind, verwendet der Core
zuerst `resolveSessionConversation(...).parentConversationCandidates` und greift nur dann
auf `resolveParentConversationCandidates(...)` zurück, wenn der kanonische Hook
sie auslässt.

## Freigaben und Channel-Fähigkeiten

Die meisten Channel-Plugins benötigen keinen freigabespezifischen Code.

- Der Core verwaltet `/approve` im selben Chat, gemeinsam genutzte Payloads für Freigabe-Buttons und allgemeine Fallback-Zustellung.
- Bevorzugen Sie ein einzelnes `approvalCapability`-Objekt im Channel-Plugin, wenn der Kanal freigabespezifisches Verhalten benötigt.
- `approvalCapability.authorizeActorAction` und `approvalCapability.getActionAvailabilityState` sind die kanonische Auth-Oberfläche für Freigaben.
- Verwenden Sie `outbound.shouldSuppressLocalPayloadPrompt` oder `outbound.beforeDeliverPayload` für channelspezifisches Payload-Lebenszyklusverhalten wie das Ausblenden doppelter lokaler Freigabeaufforderungen oder das Senden von Tippindikatoren vor der Zustellung.
- Verwenden Sie `approvalCapability.delivery` nur für natives Freigabe-Routing oder Fallback-Unterdrückung.
- Verwenden Sie `approvalCapability.render` nur dann, wenn ein Kanal wirklich benutzerdefinierte Freigabe-Payloads anstelle des gemeinsam genutzten Renderers benötigt.
- Wenn ein Kanal aus bestehender Konfiguration stabile owner-ähnliche DM-Identitäten ableiten kann, verwenden Sie `createResolvedApproverActionAuthAdapter` aus `openclaw/plugin-sdk/approval-runtime`, um `/approve` im selben Chat einzuschränken, ohne freigabespezifische Core-Logik hinzuzufügen.
- Wenn ein Kanal eine native Freigabezustellung benötigt, konzentrieren Sie den Channel-Code auf Zielnormalisierung und Transport-Hooks. Verwenden Sie `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` und `createChannelNativeApprovalRuntime` aus `openclaw/plugin-sdk/approval-runtime`, damit der Core Anforderungsfilterung, Routing, Deduplizierung, Ablauf und Gateway-Abonnement verwaltet.
- Native Freigabekanäle müssen sowohl `accountId` als auch `approvalKind` durch diese Helfer routen. `accountId` hält mehrkontenbasierte Freigaberichtlinien auf das richtige Bot-Konto begrenzt, und `approvalKind` hält das Verhalten für Exec- vs. Plugin-Freigaben für den Kanal verfügbar, ohne fest codierte Verzweigungen im Core.
- Behalten Sie die Art der zugestellten Freigabe-ID über den gesamten Ablauf hinweg unverändert bei. Native Clients sollten das Routing von Exec- vs. Plugin-Freigaben nicht aus channelspezifischem Status erraten oder umschreiben.
- Unterschiedliche Freigabearten können absichtlich verschiedene native Oberflächen bereitstellen.
  Aktuelle gebündelte Beispiele:
  - Slack lässt natives Freigabe-Routing sowohl für Exec- als auch für Plugin-IDs zu.
  - Matrix behält natives DM-/Channel-Routing nur für Exec-Freigaben bei und belässt
    Plugin-Freigaben auf dem gemeinsam genutzten `/approve`-Pfad im selben Chat.
- `createApproverRestrictedNativeApprovalAdapter` existiert weiterhin als Kompatibilitäts-Wrapper, aber neuer Code sollte den Capability-Builder bevorzugen und `approvalCapability` im Plugin bereitstellen.

Für Hot-Channel-Entrypoints sollten Sie die schmaleren Runtime-Subpaths bevorzugen, wenn Sie nur
einen Teil dieser Familie benötigen:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Ebenso sollten Sie `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` und
`openclaw/plugin-sdk/reply-chunking` bevorzugen, wenn Sie die breitere Dach-
Oberfläche nicht benötigen.

Speziell für Setup gilt:

- `openclaw/plugin-sdk/setup-runtime` umfasst die Runtime-sicheren Setup-Helfer:
  importsichere Setup-Patch-Adapter (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), Ausgabe von Lookup-Hinweisen,
  `promptResolvedAllowFrom`, `splitSetupEntries` und die delegierten
  Setup-Proxy-Builder
- `openclaw/plugin-sdk/setup-adapter-runtime` ist die schmale env-bewusste Adapter-
  Oberfläche für `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` umfasst die optionalen Installations-Setup-
  Builder plus einige Setup-sichere Primitive:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` und
  `splitSetupEntries`
- verwenden Sie die breitere Oberfläche `openclaw/plugin-sdk/setup` nur dann, wenn Sie auch die
  schwergewichtigeren gemeinsam genutzten Setup-/Konfigurationshelfer benötigen, wie etwa
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Wenn Ihr Kanal in Setup-Oberflächen nur „installieren Sie zuerst dieses Plugin“ bewerben möchte,
bevorzugen Sie `createOptionalChannelSetupSurface(...)`. Der generierte
Adapter/Assistent schlägt bei Konfigurationsschreibvorgängen und Finalisierung sicher fehl und verwendet
dieselbe Meldung „Installation erforderlich“ für Validierung, Finalisierung und Text mit Docs-Link
erneut.

Für andere Hot-Channel-Pfade sollten Sie die schmalen Helfer gegenüber breiteren Legacy-
Oberflächen bevorzugen:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` und
  `openclaw/plugin-sdk/account-helpers` für Mehrkonten-Konfiguration und
  Fallback auf Standardkonto
- `openclaw/plugin-sdk/inbound-envelope` und
  `openclaw/plugin-sdk/inbound-reply-dispatch` für eingehende Route/Envelope und
  Verdrahtung für Aufzeichnen und Verteilen
- `openclaw/plugin-sdk/messaging-targets` für Ziel-Parsing/-Abgleich
- `openclaw/plugin-sdk/outbound-media` und
  `openclaw/plugin-sdk/outbound-runtime` für Medienladen sowie ausgehende
  Identitäts-/Sendedelegaten
- `openclaw/plugin-sdk/thread-bindings-runtime` für Lebenszyklus von Thread-Bindings
  und Adapter-Registrierung
- `openclaw/plugin-sdk/agent-media-payload` nur dann, wenn weiterhin ein Legacy-Layout
  für Agent-/Medien-Payload-Felder erforderlich ist
- `openclaw/plugin-sdk/telegram-command-config` für Telegram-Normalisierung von benutzerdefinierten Befehlen,
  Validierung von Duplikaten/Konflikten und einen fallback-stabilen Vertrag
  für die Befehls-Konfiguration

Kanäle, die nur Auth benötigen, können meist beim Standardpfad bleiben: Der Core verwaltet Freigaben und das Plugin stellt nur ausgehende/Auth-Fähigkeiten bereit. Native Freigabekanäle wie Matrix, Slack, Telegram und benutzerdefinierte Chat-Transporte sollten die gemeinsam genutzten nativen Helfer verwenden, statt ihren eigenen Freigabe-Lebenszyklus zu entwickeln.

## Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket und Manifest">
    Erstellen Sie die Standard-Plugin-Dateien. Das Feld `channel` in `package.json` ist
    das Merkmal, das dieses Plugin zu einem Channel-Plugin macht. Die vollständige Oberfläche für Paketmetadaten
    finden Sie unter [Plugin-Setup und -Konfiguration](/plugins/sdk-setup#openclawchannel):

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
    Das Interface `ChannelPlugin` verfügt über viele optionale Adapter-Oberflächen. Beginnen Sie mit
    dem Minimum — `id` und `setup` — und ergänzen Sie Adapter nach Bedarf.

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
      Statt Low-Level-Adapter-Interfaces manuell zu implementieren, übergeben Sie
      deklarative Optionen, und der Builder setzt sie zusammen:

      | Option | Was verdrahtet wird |
      | --- | --- |
      | `security.dm` | Auf Konfigurationsfeldern basierender, begrenzter DM-Sicherheits-Resolver |
      | `pairing.text` | Textbasierter DM-Kopplungsablauf mit Codeaustausch |
      | `threading` | Resolver für Reply-to-Modus (fest, kontobezogen oder benutzerdefiniert) |
      | `outbound.attachedResults` | Sendefunktionen, die Ergebnis-Metadaten zurückgeben (Nachrichten-IDs) |

      Sie können auch rohe Adapter-Objekte statt deklarativer Optionen übergeben,
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
    sie in der Root-Hilfe anzeigen kann, ohne die vollständige Channel-Runtime zu aktivieren,
    während normale vollständige Ladevorgänge dieselben Deskriptoren weiterhin für die echte Befehls-
    registrierung übernehmen. Behalten Sie `registerFull(...)` für nur zur Runtime gehörende Aufgaben bei.
    Wenn `registerFull(...)` Gateway-RPC-Methoden registriert, verwenden Sie ein
    pluginspezifisches Präfix. Core-Admin-Namespaces (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) bleiben reserviert und werden immer
    zu `operator.admin` aufgelöst.
    `defineChannelPluginEntry` übernimmt die Aufteilung des Registrierungsmodus automatisch. Siehe
    [Entry-Points](/plugins/sdk-entrypoints#definechannelpluginentry) für alle
    Optionen.

  </Step>

  <Step title="Einen Setup-Entry hinzufügen">
    Erstellen Sie `setup-entry.ts` für leichtgewichtiges Laden während des Onboardings:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw lädt dies anstelle des vollständigen Entry-Points, wenn der Kanal deaktiviert
    oder nicht konfiguriert ist. Dadurch wird vermieden, während Setup-Abläufen schweren Runtime-Code zu laden.
    Details finden Sie unter [Setup und Konfiguration](/plugins/sdk-setup#setup-entry).

  </Step>

  <Step title="Eingehende Nachrichten verarbeiten">
    Ihr Plugin muss Nachrichten von der Plattform empfangen und an
    OpenClaw weiterleiten. Das typische Muster ist ein Webhook, der die Anfrage verifiziert und
    sie über den Inbound-Handler Ihres Kanals verteilt:

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
      Die Verarbeitung eingehender Nachrichten ist channelspezifisch. Jedes Channel-Plugin verwaltet
      seine eigene Inbound-Pipeline. Sehen Sie sich gebündelte Channel-Plugins
      an (zum Beispiel das Microsoft Teams- oder Google Chat-Plugin-Paket), um echte Muster zu sehen.
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

    Gemeinsam genutzte Test-Helfer finden Sie unter [Testing](/plugins/sdk-testing).

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
  <Card title="Threading-Optionen" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Feste, kontobezogene oder benutzerdefinierte Antwortmodi
  </Card>
  <Card title="Integration des Message-Tools" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool und Action-Erkennung
  </Card>
  <Card title="Zielauflösung" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime-Helfer" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, Medien, Subagent über api.runtime
  </Card>
</CardGroup>

<Note>
Einige gebündelte Helper-Oberflächen existieren weiterhin für die Wartung gebündelter Plugins und
Kompatibilität. Sie sind nicht das empfohlene Muster für neue Channel-Plugins;
bevorzugen Sie die allgemeinen Channel-/Setup-/Reply-/Runtime-Subpaths aus der gemeinsamen SDK-
Oberfläche, es sei denn, Sie warten diese gebündelte Plugin-Familie direkt.
</Note>

## Nächste Schritte

- [Provider-Plugins](/plugins/sdk-provider-plugins) — wenn Ihr Plugin auch Modelle bereitstellt
- [SDK-Überblick](/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [SDK-Testing](/plugins/sdk-testing) — Test-Utilities und Vertragstests
- [Plugin-Manifest](/plugins/manifest) — vollständiges Manifest-Schema
