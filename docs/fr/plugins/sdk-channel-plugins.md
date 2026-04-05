---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide pas à pas pour créer un plugin de canal de messagerie pour OpenClaw
title: Créer des plugins de canal
x-i18n:
    generated_at: "2026-04-05T12:50:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Créer des plugins de canal

Ce guide vous accompagne dans la création d’un plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec sécurité DM,
pairing, fils de réponse et messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de plugin OpenClaw, lisez d’abord
  [Getting Started](/plugins/building-plugins) pour la structure de paquet
  de base et la configuration du manifeste.
</Info>

## Comment fonctionnent les plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé unique dans le cœur. Votre plugin gère :

- **Config** — résolution de compte et assistant de configuration
- **Sécurité** — politique DM et listes d’autorisation
- **Pairing** — flux d’approbation DM
- **Grammaire de session** — manière dont les identifiants de conversation spécifiques au provider sont mappés vers les chats de base, les identifiants de fil et les replis parents
- **Sortant** — envoi de texte, de médias et de sondages vers la plateforme
- **Fils** — manière dont les réponses sont regroupées en fil

Le cœur gère l’outil message partagé, le câblage du prompt, la forme externe de la clé de session,
la gestion générique `:thread:`, et la répartition.

Si votre plateforme stocke une portée supplémentaire à l’intérieur des identifiants de conversation, conservez cette analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. Il s’agit du
hook canonique pour mapper `rawId` vers l’identifiant de conversation de base, un identifiant de fil
facultatif, un `baseConversationId` explicite, et d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du
parent le plus étroit au plus large / à la conversation de base.

Les plugins intégrés qui ont besoin de la même analyse avant le démarrage
du registre de canaux peuvent également exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour le bootstrap
uniquement lorsque le registre de plugins à l’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme solution de repli
historique de compatibilité lorsqu’un plugin n’a besoin que de replis parents en plus
de l’identifiant générique/brut. Si les deux hooks existent, le cœur utilise
d’abord `resolveSessionConversation(...).parentConversationCandidates` et ne
revient à `resolveParentConversationCandidates(...)` que lorsque le hook canonique
les omet.

## Approbations et capacités de canal

La plupart des plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur gère `/approve` dans le même chat, les charges utiles de boutons d’approbation partagées, et la livraison de repli générique.
- Préférez un unique objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` constituent le point d’entrée canonique pour l’authentification des approbations.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal du cycle de vie des charges utiles, comme masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage natif des approbations ou la suppression du repli.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique centrale spécifique aux approbations.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal centré sur la normalisation des cibles et les hooks de transport. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`, et `createChannelNativeApprovalRuntime` depuis `openclaw/plugin-sdk/approval-runtime` afin que le cœur gère le filtrage des requêtes, le routage, la déduplication, l’expiration et l’abonnement gateway.
- Les canaux d’approbation native doivent faire transiter `accountId` et `approvalKind` via ces assistants. `accountId` permet de limiter la politique d’approbation multi-compte au bon compte bot, et `approvalKind` permet au canal de disposer du comportement d’approbation exec vs plugin sans branches codées en dur dans le cœur.
- Préservez de bout en bout le type d’identifiant d’approbation livré. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation exec vs plugin à partir d’un état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples intégrés actuels :
  - Slack conserve le routage d’approbation natif disponible pour les identifiants exec et plugin.
  - Matrix conserve le routage DM/canal natif uniquement pour les approbations exec et laisse
    les approbations plugin sur le chemin `/approve` partagé dans le même chat.
- `createApproverRestrictedNativeApprovalAdapter` existe encore comme wrapper de compatibilité, mais le nouveau code devrait préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée de canal à chaud, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin
que d’une seule partie de cette famille :

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
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs à l’exécution :
  adaptateurs de patch de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les constructeurs de
  proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est la jonction étroite
  orientée environnement pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration
  à installation facultative ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, et
  `splitSetupEntries`
- utilisez la surface plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  assistants partagés plus lourds de configuration/setup comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement indiquer « installez d’abord ce plugin » dans les surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/l’assistant généré échoue en mode fermé sur les écritures de configuration et la finalisation, et ils réutilisent le même message d’installation requise dans la validation, la finalisation et le texte du lien vers la documentation.

Pour les autres chemins de canal à chaud, préférez les assistants étroits aux anciennes surfaces plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-compte et
  le repli du compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le câblage du routage/de l’enveloppe entrants et de l’enregistrement/répartition
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse/la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les délégués d’identité/envoi sortants
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement d’adaptateur
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une ancienne disposition de champ de charge utile agent/média est encore nécessaire
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits, et un contrat de configuration de commande stable en cas de repli

Les canaux d’authentification uniquement peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose simplement des capacités sortantes/d’authentification. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de chat personnalisés devraient utiliser les assistants natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquet et manifeste">
    Créez les fichiers standards du plugin. Le champ `channel` dans `package.json` est
    ce qui fait de ce plugin un plugin de canal. Pour la surface complète des métadonnées de paquet,
    voir [Plugin Setup and Config](/plugins/sdk-setup#openclawchannel) :

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

  <Step title="Créer l’objet plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptateur facultatives. Commencez par
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // votre client API de plateforme

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

      // Sécurité DM : qui peut envoyer des messages au bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing : flux d’approbation pour les nouveaux contacts DM
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Fils : comment les réponses sont livrées
      threading: { topLevelReplyToMode: "reply" },

      // Sortant : envoyer des messages vers la plateforme
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
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous passez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée limitée à partir des champs de configuration |
      | `pairing.text` | Flux de pairing DM basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode reply-to (fixe, à portée compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (ID de message) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts au lieu des options déclaratives
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

    Placez les descripteurs CLI propres au canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer le runtime complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes.
    Gardez `registerFull(...)` pour le travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC gateway, utilisez un
    préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Voir
    [Entry Points](/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes
    les options.

  </Step>

  <Step title="Ajouter une entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge cela au lieu du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger un code d’exécution lourd pendant les flux de configuration.
    Voir [Setup and Config](/plugins/sdk-setup#setup-entry) pour les détails.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle habituel est un webhook qui vérifie la requête puis
    la répartit via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant répartit le message vers OpenClaw.
          // Le câblage exact dépend du SDK de votre plateforme —
          // voir un exemple réel dans le paquet plugin Microsoft Teams ou Google Chat intégré.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestion des messages entrants est spécifique au canal. Chaque plugin de canal gère
      son propre pipeline entrant. Consultez les plugins de canal intégrés
      (par exemple le paquet plugin Microsoft Teams ou Google Chat) pour voir de vrais modèles.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

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

    Pour les assistants de test partagés, voir [Testing](/plugins/sdk-testing).

  </Step>
</Steps>

## Structure des fichiers

```
<bundled-plugin-root>/acme-chat/
├── package.json              # métadonnées openclaw.channel
├── openclaw.plugin.json      # manifeste avec schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # exports publics (facultatif)
├── runtime-api.ts            # exports d’exécution internes (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # tests
    ├── client.ts             # client API de plateforme
    └── runtime.ts            # stockage d’exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fil" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil message" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, médias, subagent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines jonctions d’assistants intégrés existent encore pour la maintenance et
la compatibilité des plugins intégrés. Ce n’est pas le modèle recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface SDK commune
sauf si vous maintenez directement cette famille de plugins intégrés.
</Note>

## Étapes suivantes

- [Provider Plugins](/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [SDK Overview](/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [SDK Testing](/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Plugin Manifest](/plugins/manifest) — schéma complet du manifeste
