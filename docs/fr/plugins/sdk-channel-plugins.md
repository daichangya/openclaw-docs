---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous voulez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Créer des Plugins de canal
x-i18n:
    generated_at: "2026-04-21T07:02:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Créer des Plugins de canal

Ce guide explique étape par étape comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité DM,
appairage, fil de réponses et messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Prise en main](/fr/plugins/building-plugins) pour la structure de paquet
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre Plugin possède :

- **Config** — résolution de compte et assistant de configuration
- **Sécurité** — politique DM et listes d’autorisation
- **Appairage** — flux d’approbation DM
- **Grammaire de session** — comment les identifiants de conversation spécifiques au fournisseur se mappent aux chats de base, identifiants de fil et replis parents
- **Sortant** — envoi de texte, médias et sondages vers la plateforme
- **Fil de discussion** — comment les réponses sont enfilées

Le cœur possède l’outil message partagé, le câblage des prompts, la forme externe de la clé de session,
la gestion générique de `:thread:` et la répartition.

Si votre canal ajoute des paramètres d’outil message qui transportent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins du sandbox et la politique
d’accès média sortant, afin que les Plugins n’aient pas besoin de cas particuliers
dans le cœur partagé pour les paramètres spécifiques au fournisseur comme avatar, pièce jointe ou image de couverture.
Préférez renvoyer une map indexée par clé d’action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` pour que des actions sans rapport n’héritent pas des arguments média d’une autre action. Un tableau plat fonctionne toujours pour des paramètres qui sont intentionnellement partagés entre toutes les actions exposées.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, gardez cette analyse
dans le Plugin avec `messaging.resolveSessionConversation(...)`. C’est le hook canonique
pour mapper `rawId` vers l’identifiant de conversation de base, l’identifiant de fil optionnel,
`baseConversationId` explicite et d’éventuels `parentConversationCandidates`.
Quand vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du parent
le plus étroit au plus large / conversation de base.

Les Plugins fournis qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier de premier niveau `session-key-api.ts` avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour l’amorçage
uniquement lorsque le registre de Plugins runtime n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme repli de compatibilité hérité lorsqu’un Plugin n’a besoin que de replis parents au-dessus de l’identifiant générique/brut. Si les deux hooks existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne revient à `resolveParentConversationCandidates(...)` que lorsque le hook canonique
les omet.

## Approbations et capacités de canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur possède `/approve` dans le même chat, les charges utiles partagées des boutons d’approbation et la livraison de repli générique.
- Préférez un unique objet `approvalCapability` sur le Plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison / natifs / rendu / auth des approbations sur `approvalCapability`.
- `plugin.auth` ne sert qu’à login/logout ; le cœur ne lit plus les hooks d’auth d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` constituent la jonction canonique d’auth d’approbation.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’auth d’approbation dans le même chat.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état surface initiatrice / client natif lorsqu’il diffère de l’auth d’approbation dans le même chat. Le cœur utilise ce hook spécifique à exec pour distinguer `enabled` et `disabled`, décider si le canal initiateur prend en charge les approbations exec natives, et inclure le canal dans les indications de repli pour client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour un comportement spécifique au canal dans le cycle de vie des charges utiles, comme masquer des prompts locaux d’approbation en double ou envoyer des indicateurs de frappe avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native détenus par le canal. Gardez-le lazy sur les points d’entrée de canal chauds avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module runtime à la demande tout en permettant au cœur d’assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse de chemin désactivé explique les boutons de config exacts nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent rendre des chemins à portée de compte tels que `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de premier niveau.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique centrale spécifique aux approbations.
- Si un canal a besoin d’une livraison d’approbation native, gardez le code du canal concentré sur la normalisation de la cible ainsi que sur les faits de transport / présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les avis de routage externe. `nativeRuntime` est découpé en quelques jonctions plus petites :
- `availability` — si le compte est configuré et si une requête doit être gérée
- `presentation` — mapper le modèle de vue d’approbation partagé vers des charges utiles natives en attente / résolues / expirées ou des actions finales
- `transport` — préparer les cibles ainsi qu’envoyer / mettre à jour / supprimer les messages d’approbation natifs
- `interactions` — hooks facultatifs bind/unbind/clear-action pour les boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets détenus à l’exécution tels qu’un client, un jeton, une app Bolt ou un récepteur Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte runtime permet au cœur d’amorcer des gestionnaires pilotés par les capacités à partir de l’état de démarrage du canal sans ajouter de glue de wrapper spécifique aux approbations.
- N’utilisez `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` de plus bas niveau que lorsque la jonction pilotée par les capacités n’est pas encore assez expressive.
- Les canaux d’approbation native doivent acheminer à la fois `accountId` et `approvalKind` via ces helpers. `accountId` maintient la portée correcte de la politique d’approbation multi-comptes au bon compte bot, et `approvalKind` maintient le comportement d’approbation exec vs Plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur possède maintenant aussi les avis de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi « approval went to DMs / another channel » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis origine + DM d’approbateur via les helpers partagés de capacité d’approbation et laissez le cœur agréger les livraisons réelles avant de publier un éventuel avis dans le chat initiateur.
- Préservez le type d’identifiant d’approbation livré de bout en bout. Les clients natifs ne doivent pas
  deviner ou réécrire le routage d’approbation exec vs Plugin à partir de l’état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples fournis actuels :
  - Slack conserve le routage d’approbation native disponible pour les identifiants exec et Plugin.
  - Matrix conserve le même routage natif DM/canal et la même UX de réaction pour les approbations exec
    et Plugin, tout en laissant l’auth différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée de canal chauds, préférez les sous-chemins runtime plus étroits lorsque vous n’avez besoin
que d’une partie de cette famille :

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

De même, préférez `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la
surface parapluie plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration sûrs à l’exécution :
  adaptateurs de patch de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs
  délégués de proxy de configuration
- `openclaw/plugin-sdk/setup-adapter-runtime` est la jonction d’adaptateur étroite sensible à l’env
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration à installation facultative ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une auth pilotée par l’env et que les flux génériques de démarrage / config
doivent connaître ces noms d’env avant le chargement runtime, déclarez-les dans le manifeste du Plugin avec `channelEnvVars`. Gardez les `envVars` runtime du canal ou les constantes locales uniquement pour le texte orienté opérateur.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la jonction plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers partagés plus lourds de configuration / config comme
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « install this plugin first » dans les surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur / assistant générés échouent de façon sûre sur les écritures de configuration et la finalisation, et réutilisent le même message exigeant l’installation dans la validation, la finalisation et le texte de lien vers la documentation.

Pour les autres chemins de canal chauds, préférez les helpers étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli de compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le câblage de route / enveloppe entrante et
  l’enregistrement-et-répartition
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse / correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement média ainsi que les délégués d’identité / envoi sortants et la planification de charge utile
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement d’adaptateur
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition de champs héritée agent/média
  est encore nécessaire
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram, la validation des doublons / conflits et un contrat de configuration de commande stable en repli

Les canaux avec auth uniquement peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le Plugin expose simplement les capacités sortantes / auth. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés au lieu de développer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte de preuves détenue par le Plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel
plus large de helpers entrants.

Bon cas d’usage pour la logique locale au Plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions de messages de service / système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon cas d’usage pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement de commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les faits locaux de mention.
2. Passez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utilisez `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre garde entrante.

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

`api.runtime.channel.mentions` expose les mêmes helpers partagés de mention pour
les Plugins de canal fournis qui dépendent déjà de l’injection runtime :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous n’avez besoin que de `implicitMentionKindWhen` et
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers runtime
entrants sans rapport.

Les anciens helpers `resolveMentionGating*` restent sur
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paquet et manifeste">
    Créez les fichiers de Plugin standard. Le champ `channel` dans `package.json` est
    ce qui fait de ceci un Plugin de canal. Pour la surface complète des métadonnées de paquet,
    voir [Configuration et config de Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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

  <Step title="Construire l’objet Plugin de canal">
    L’interface `ChannelPlugin` comporte de nombreuses surfaces d’adaptation facultatives. Commencez avec
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

      // Appairage : flux d’approbation pour les nouveaux contacts DM
      pairing: {
        text: {
          idLabel: "nom d’utilisateur Acme Chat",
          message: "Envoyez ce code pour vérifier votre identité :",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Fil de discussion : comment les réponses sont livrées
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
      Au lieu d’implémenter manuellement des interfaces d’adaptation de bas niveau, vous passez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée depuis les champs de config |
      | `pairing.text` | Flux d’appairage DM fondé sur du texte avec échange de code |
      | `threading` | Résolveur de mode reply-to (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi passer des objets d’adaptateur bruts au lieu des options déclaratives
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
              .description("Gestion Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestion Acme Chat",
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
    puisse les afficher dans l’aide racine sans activer le runtime complet du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour l’enregistrement réel des commandes. Gardez `registerFull(...)` pour le travail runtime uniquement.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe spécifique au Plugin. Les espaces de noms admin du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation de mode d’enregistrement. Voir
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter un point d’entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci au lieu du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code runtime lourd pendant les flux de configuration.
    Voir [Configuration et config](/fr/plugins/sdk-setup#setup-entry) pour les détails.

    Les canaux fournis de l’espace de travail qui divisent les exports sûrs pour la configuration dans des modules auxiliaires
    peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter runtime explicite au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre Plugin doit recevoir des messages depuis la plateforme et les transmettre à
    OpenClaw. Le modèle habituel est un Webhook qui vérifie la requête et la
    répartit via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gérée par le Plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant répartit le message vers OpenClaw.
          // Le câblage exact dépend de votre SDK de plateforme —
          // voir un exemple réel dans le paquet de Plugin Microsoft Teams ou Google Chat fourni.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestion des messages entrants est spécifique au canal. Chaque Plugin de canal possède
      son propre pipeline entrant. Regardez les Plugins de canal fournis
      (par exemple le paquet de Plugin Microsoft Teams ou Google Chat) pour voir des modèles réels.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("résout le compte depuis la configuration", () => {
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

    Pour les helpers de test partagés, voir [Tests](/fr/plugins/sdk-testing).

  </Step>
</Steps>

## Structure des fichiers

```
<bundled-plugin-root>/acme-chat/
├── package.json              # métadonnées openclaw.channel
├── openclaw.plugin.json      # Manifeste avec schéma de configuration
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Exports publics (optionnel)
├── runtime-api.ts            # Exports runtime internes (optionnel)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de la plateforme
    └── runtime.ts            # Store runtime (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fil de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte des actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers runtime" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines jonctions de helpers fournies existent encore pour la maintenance et la
compatibilité des Plugins fournis. Elles ne constituent pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface commune du SDK
sauf si vous maintenez directement cette famille de Plugins fournis.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre Plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Tests du SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste de Plugin](/fr/plugins/manifest) — schéma complet du manifeste
