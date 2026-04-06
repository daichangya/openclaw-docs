---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous voulez connecter OpenClaw à une plateforme de messagerie
    - Vous avez besoin de comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide pas à pas pour créer un plugin de canal de messagerie pour OpenClaw
title: Créer des plugins de canal
x-i18n:
    generated_at: "2026-04-06T03:09:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66b52c10945a8243d803af3bf7e1ea0051869ee92eda2af5718d9bb24fbb8552
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Créer des plugins de canal

Ce guide explique comment créer un plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité DM,
association, fils de réponse et messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Getting Started](/fr/plugins/building-plugins) pour la structure de package
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre plugin possède :

- **Configuration** — résolution de compte et assistant de configuration
- **Sécurité** — politique DM et listes d’autorisation
- **Association** — flux d’approbation DM
- **Grammaire de session** — comment les identifiants de conversation spécifiques au fournisseur sont mappés vers les discussions de base, les identifiants de fil et les replis parent
- **Sortie** — envoi de texte, de médias et de sondages vers la plateforme
- **Fils** — comment les réponses sont placées dans des fils

Le cœur possède l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session,
la gestion générique `:thread:` et la répartition.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, conservez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. C’est le hook canonique pour mapper
`rawId` vers l’identifiant de conversation de base, l’identifiant de fil facultatif,
`baseConversationId` explicite et d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, conservez-les ordonnés du
parent le plus étroit vers la conversation la plus large/de base.

Les plugins groupés qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour l’amorçage
uniquement lorsque le registre de plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme solution de repli
de compatibilité héritée lorsqu’un plugin n’a besoin que de replis parent par-dessus l’identifiant générique/brut.
Si les deux hooks existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates`, puis ne revient à
`resolveParentConversationCandidates(...)` que lorsque le hook canonique
les omet.

## Approbations et capacités de canal

La plupart des plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur possède `/approve` dans la même discussion, les charges utiles partagées des boutons d’approbation et la livraison générique de repli.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont l’interface canonique d’authentification des approbations.
- Si votre canal expose des approbations d’exécution natives, implémentez `approvalCapability.getActionAvailabilityState` même lorsque le transport natif vit entièrement sous `approvalCapability.native`. Le cœur utilise ce hook de disponibilité pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations natives et inclure le canal dans les conseils de repli pour client natif.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal lié au cycle de vie de la charge utile, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage natif des approbations ou la suppression du repli.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les paramètres de configuration exacts nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à compte nommé doivent afficher des chemins à portée de compte comme `channels.<channel>.accounts.<id>.execApprovals.*` plutôt que des valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans la même discussion sans ajouter de logique du cœur spécifique aux approbations.
- Si un canal a besoin de la livraison d’approbations natives, gardez le code du canal centré sur la normalisation de la cible et les hooks de transport. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` et `createChannelNativeApprovalRuntime` depuis `openclaw/plugin-sdk/approval-runtime` afin que le cœur possède le filtrage des requêtes, le routage, la déduplication, l’expiration et l’abonnement à la passerelle.
- Les canaux d’approbation natifs doivent acheminer à la fois `accountId` et `approvalKind` à travers ces assistants. `accountId` maintient la portée de la politique d’approbation multi-comptes sur le bon compte de bot, et `approvalKind` conserve le comportement d’approbation d’exécution vs plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Préservez de bout en bout le type d’identifiant d’approbation livré. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation d’exécution vs plugin à partir de l’état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation natif disponible pour les identifiants d’exécution et de plugin.
  - Matrix conserve le routage DM/canal natif pour les approbations d’exécution uniquement et laisse
    les approbations de plugin sur le chemin partagé `/approve` dans la même discussion.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée de canal à chaud, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin que d’une partie de cette famille :

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

De même, préférez `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la
surface parapluie plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs à l’exécution :
  adaptateurs de correctif de configuration sûrs à l’importation (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les constructeurs
  de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est l’interface d’adaptateur étroite sensible à l’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration avec installation facultative
  plus quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, et
  `splitSetupEntries`
- utilisez la surface plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  assistants partagés plus lourds de configuration/config comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/l’assistant généré échoue de manière fermée sur les écritures de configuration et la finalisation, et il réutilise le même message d’installation requise pour la validation, la finalisation et le texte du lien vers la documentation.

Pour les autres chemins de canal à chaud, préférez les assistants étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli sur le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le câblage route/enveloppe entrante et
  enregistrement-et-répartition
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse/la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias plus les délégués d’identité/envoi sortants
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement d’adaptateur
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition héritée des champs de charge utile agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram, la validation des doublons/conflits et un contrat de configuration de commande stable comme solution de repli

Les canaux d’authentification seule peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose simplement des capacités sortantes/d’authentification. Les canaux d’approbation natifs comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les assistants natifs partagés au lieu d’implémenter eux-mêmes leur cycle de vie d’approbation.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers standard du plugin. Le champ `channel` dans `package.json` est
    ce qui fait de ceci un plugin de canal. Pour la surface complète des métadonnées du package,
    consultez [Plugin Setup and Config](/fr/plugins/sdk-setup#openclawchannel) :

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
      "description": "Plugin de canal Acme Chat",
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

  <Step title="Créer l’objet plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptation facultatives. Commencez par
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

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

    <Accordion title="Ce que createChatChannelPlugin fait pour vous">
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous transmettez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée de configuration à partir des champs de config |
      | `pairing.text` | Flux d’association DM basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode reply-to (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts à la place des options déclaratives
      si vous avez besoin d’un contrôle total.
    </Accordion>

  </Step>

  <Step title="Câbler le point d’entrée">
    Créez `index.ts` :

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin de canal Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestion d’Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestion d’Acme Chat",
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

    Placez les descripteurs CLI détenus par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’exécution complète du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour un réel enregistrement
    des commandes. Conservez `registerFull(...)` pour le travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC de passerelle, utilisez un
    préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et sont toujours
    résolus vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Consultez
    [Entry Points](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter une entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci au lieu de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration.
    Consultez [Setup and Config](/fr/plugins/sdk-setup#setup-entry) pour les détails.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir des messages depuis la plateforme et les transférer vers
    OpenClaw. Le schéma habituel est un webhook qui vérifie la requête et
    la répartit via le gestionnaire entrant de votre canal :

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
      La gestion des messages entrants est spécifique au canal. Chaque plugin de canal possède
      son propre pipeline entrant. Regardez les plugins de canal groupés
      (par exemple le package plugin Microsoft Teams ou Google Chat) pour voir des schémas réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("résout le compte à partir de la configuration", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspecte le compte sans matérialiser les secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("signale une configuration manquante", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Pour les assistants de test partagés, consultez [Testing](/fr/plugins/sdk-testing).

  </Step>
</Steps>

## Structure des fichiers

```
<bundled-plugin-root>/acme-chat/
├── package.json              # métadonnées openclaw.channel
├── openclaw.plugin.json      # Manifeste avec schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports publics (facultatif)
├── runtime-api.ts            # Exports d’exécution internes (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de la plateforme
    └── runtime.ts            # Magasin d’exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fils" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines interfaces d’assistants groupés existent encore pour la maintenance des plugins groupés et la
compatibilité. Ce n’est pas le schéma recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface SDK
commune, sauf si vous maintenez directement cette famille de plugins groupés.
</Note>

## Prochaines étapes

- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [SDK Testing](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Plugin Manifest](/fr/plugins/manifest) — schéma complet du manifeste
