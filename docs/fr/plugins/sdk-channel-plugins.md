---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Créer des Plugins de canal
x-i18n:
    generated_at: "2026-04-24T07:23:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Ce guide explique pas à pas comment créer un Plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité DM,
appairage, threading des réponses et messagerie sortante.

<Info>
  Si vous n’avez encore jamais créé de Plugin OpenClaw, lisez d’abord
  [Premiers pas](/fr/plugins/building-plugins) pour la structure de package de base
  et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils envoyer/éditer/réagir. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre Plugin possède :

- **Config** — résolution des comptes et assistant de configuration
- **Security** — politique DM et listes d’autorisation
- **Pairing** — flux d’approbation DM
- **Session grammar** — comment les identifiants de conversation spécifiques au fournisseur se mappent aux chats de base, identifiants de fil et replis parents
- **Outbound** — envoi de texte, médias et sondages vers la plateforme
- **Threading** — comment les réponses sont mises en fil
- **Heartbeat typing** — signaux facultatifs de saisie/occupation pour les cibles de livraison Heartbeat

Le cœur possède l’outil de message partagé, le câblage du prompt, la forme externe de clé de session,
la gestion générique `:thread:` et le dispatch.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le Plugin de canal. Le cœur l’appelle avec la cible de livraison Heartbeat
résolue avant le démarrage de l’exécution du modèle Heartbeat et utilise le cycle de vie partagé de keepalive/nettoyage de saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme a besoin d’un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui transportent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise cette liste explicite pour la normalisation des chemins sandbox et la politique d’accès média sortant,
afin que les Plugins n’aient pas besoin de cas particuliers dans le cœur partagé pour les paramètres
spécifiques au fournisseur comme avatar, pièce jointe ou image de couverture.
Préférez renvoyer une map indexée par action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que les actions non liées n’héritent pas
des arguments média d’une autre action. Un tableau plat fonctionne encore pour des paramètres intentionnellement partagés entre toutes les actions exposées.

Si votre plateforme stocke une portée supplémentaire à l’intérieur des identifiants de conversation, gardez cette analyse
dans le Plugin avec `messaging.resolveSessionConversation(...)`. C’est le hook canonique
pour mapper `rawId` vers l’identifiant de conversation de base, l’identifiant de fil facultatif,
`baseConversationId` explicite et tout `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, gardez-les ordonnés du parent
le plus étroit vers la conversation parent/base la plus large.

Les Plugins groupés qui ont besoin de la même analyse avant le démarrage du registre de canaux
peuvent également exposer un fichier de niveau supérieur `session-key-api.ts` avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre au bootstrap
uniquement lorsque le registre Plugin d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme solution de secours
héritée lorsque un Plugin n’a besoin que de replis parents au-dessus
de l’identifiant générique/brut. Si les deux hooks existent, le cœur utilise d’abord
`resolveSessionConversation(...).parentConversationCandidates` et ne se replie sur `resolveParentConversationCandidates(...)` que lorsque le hook canonique les omet.

## Approbations et capacités du canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur possède `/approve` dans le même chat, les charges utiles de bouton d’approbation partagées et la livraison de secours générique.
- Préférez un seul objet `approvalCapability` sur le Plugin de canal lorsque le canal nécessite un comportement spécifique à l’approbation.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison/native/rendu/authentification des approbations dans `approvalCapability`.
- `plugin.auth` est réservé à login/logout ; le cœur ne lit plus les hooks d’authentification d’approbation à partir de cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont le point d’extension canonique d’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans le même chat.
- Si votre canal expose des approbations exec natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de surface initiatrice/client natif lorsqu’il diffère de l’authentification d’approbation du même chat. Le cœur utilise ce hook spécifique à exec pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations exec natives et inclure le canal dans les indications de secours du client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal dans le cycle de vie des charges utiles, tel que masquer les invites locales d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation native ou la suppression du secours.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation native appartenant au canal. Gardez-le paresseux sur les points d’entrée chauds du canal avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en permettant au cœur d’assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal souhaite que la réponse du chemin désactivé explique les paramètres exacts nécessaires pour activer les approbations exec natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent afficher des chemins ciblés par compte tels que `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique de cœur spécifique aux approbations.
- Si un canal a besoin de livraison d’approbation native, gardez le code du canal concentré sur la normalisation des cibles plus les faits de transport/de présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et posséder le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement gateway et les avis « routé ailleurs ». `nativeRuntime` est scindé en quelques points d’extension plus petits :
- `availability` — si le compte est configuré et si une requête doit être traitée
- `presentation` — mapper le modèle de vue d’approbation partagé en charges utiles natives pending/resolved/expired ou actions finales
- `transport` — préparer les cibles plus envoyer/mettre à jour/supprimer les messages d’approbation natives
- `interactions` — hooks facultatifs bind/unbind/clear-action pour les boutons ou réactions natives
- `observe` — hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets possédés par l’exécution tels qu’un client, un jeton, une app Bolt ou un récepteur Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au cœur de démarrer des gestionnaires guidés par des capacités à partir de l’état de démarrage du canal sans ajouter de colle wrapper spécifique aux approbations.
- Utilisez le niveau inférieur `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque le point d’extension guidé par capacité n’est pas encore assez expressif.
- Les canaux d’approbation native doivent router à la fois `accountId` et `approvalKind` à travers ces assistants. `accountId` garde la politique d’approbation multi-compte dans la portée du bon compte bot, et `approvalKind` garde le comportement d’approbation exec vs Plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur possède désormais aussi les avis de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi du type « approval went to DMs / another channel » depuis `createChannelNativeApprovalRuntime` ; à la place, exposez un routage précis de l’origine + des DM d’approbateur via les assistants partagés de capacité d’approbation et laissez le cœur agréger les livraisons réelles avant de publier un avis dans le chat initiateur.
- Préservez le type d’identifiant d’approbation livré de bout en bout. Les clients natifs ne doivent pas
  deviner ni réécrire le routage des approbations exec vs Plugin à partir de l’état local du canal.
- Différents types d’approbation peuvent intentionnellement exposer des surfaces natives différentes.
  Exemples groupés actuels :
  - Slack garde le routage d’approbation native disponible pour les identifiants exec et Plugin.
  - Matrix garde le même routage DM/canal natif et la même UX de réaction pour les approbations exec
    et Plugin, tout en laissant l’authentification différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le Plugin.

Pour les points d’entrée chauds du canal, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin que d’une seule partie de cette famille :

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
`openclaw/plugin-sdk/reply-reference`, et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface générale plus large.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les assistants de configuration sûrs à l’exécution :
  adaptateurs de patch de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les constructeurs
  de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est le point d’extension étroit sensible à l’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration à installation facultative plus quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une authentification pilotée par l’environnement et que les flux génériques de démarrage/configuration doivent connaître ces noms d’environnement avant le chargement de l’exécution, déclarez-les dans le manifeste du Plugin avec `channelEnvVars`. Gardez `envVars` d’exécution du canal ou les constantes locales uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status`, ou les scans SecretRef avant le démarrage de l’exécution du Plugin, ajoutez `openclaw.setupEntry` dans `package.json`. Ce point d’entrée doit être sûr à importer dans des chemins de commande en lecture seule et doit renvoyer les métadonnées de canal, l’adaptateur de configuration sûr, l’adaptateur de statut et les métadonnées de cible secrète du canal nécessaires à ces résumés. Ne démarrez pas de clients, d’écouteurs ou d’exécutions de transport depuis l’entrée de configuration.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, et
`splitSetupEntries`

- utilisez la surface plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des assistants partagés plus lourds de configuration/configuration tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce Plugin » dans les
surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur/l’assistant généré échoue de manière fermée sur les écritures de configuration et la finalisation, et réutilise le même message d’installation requise dans la validation, la finalisation et le texte de lien vers la documentation.

Pour les autres chemins chauds du canal, préférez les assistants étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et le
  repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le routage/l’enveloppe entrants et
  le câblage d’enregistrement et d’envoi
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse/correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les
  délégués d’identité/envoi sortants et la planification des charges utiles
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId`/`threadId` explicite ou récupérer la session courante `:thread:`
  après que la clé de session de base correspond encore. Les Plugins de fournisseur peuvent remplacer
  la priorité, le comportement de suffixe et la normalisation de l’identifiant de fil lorsque leur plateforme
  possède une sémantique native de livraison par fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une ancienne
  disposition de champ de charge utile agent/média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons/conflits et un contrat de configuration de commande stable en repli

Les canaux d’authentification uniquement peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le Plugin expose simplement les capacités sortantes/d’authentification. Les canaux d’approbation native tels que Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les assistants natifs partagés au lieu de développer leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte de preuves appartenant au Plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin du barrel d’assistants entrants plus large.

Bon candidat pour une logique locale au Plugin :

- détection de réponse-au-bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions de messages de service/système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon candidat pour l’assistant partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement de commande
- décision finale d’ignorer

Flux préféré :

1. Calculer les faits de mention locaux.
2. Transmettre ces faits à `resolveInboundMentionDecision({ facts, policy })`.
3. Utiliser `decision.effectiveWasMentioned`, `decision.shouldBypassMention` et `decision.shouldSkip` dans votre porte entrante.

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

`api.runtime.channel.mentions` expose les mêmes assistants de mention partagés pour
les Plugins de canal groupés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous n’avez besoin que de `implicitMentionKindWhen` et
`resolveInboundMentionDecision`, importez depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des assistants d’exécution entrants non liés.

Les anciens assistants `resolveMentionGating*` restent disponibles sur
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Parcours guidé

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers standard du Plugin. Le champ `channel` dans `package.json` est
    ce qui fait de ceci un Plugin de canal. Pour la surface complète des métadonnées du package,
    voir [Configuration et setup Plugin](/fr/plugins/sdk-setup#openclaw-channel) :

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

  <Step title="Construire l’objet Plugin de canal">
    L’interface `ChannelPlugin` possède de nombreuses surfaces d’adaptateur facultatives. Commencez par
    le minimum — `id` et `setup` — puis ajoutez des adaptateurs selon vos besoins.

    Créez `src/channel.ts` :

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
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle raccorde |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM ciblé à partir des champs de configuration |
      | `pairing.text` | Flux d’appairage DM basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode de réponse (fixe, ciblé par compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez aussi transmettre des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.
    </Accordion>

  </Step>

  <Step title="Raccorder le point d’entrée">
    Créez `index.ts` :

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

    Placez les descripteurs CLI appartenant au canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’exécution complète du canal,
    tandis que les chargements complets normaux récupèrent toujours ces mêmes descripteurs pour
    l’enregistrement réel de la commande. Gardez `registerFull(...)` pour le travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC gateway, utilisez un
    préfixe spécifique au Plugin. Les espaces de noms admin du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Voir
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter une entrée de configuration">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place de l’entrée complète lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration.
    Voir [Setup et configuration](/fr/plugins/sdk-setup#setup-entry) pour les détails.

    Les canaux d’espace de travail groupés qui séparent les exports sûrs pour la configuration dans des modules latéraux
    peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter d’exécution explicite au moment de la configuration.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre Plugin doit recevoir les messages de la plateforme et les transmettre à
    OpenClaw. Le modèle typique est un Webhook qui vérifie la requête et
    l’envoie via le gestionnaire entrant de votre canal :

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
      La gestion des messages entrants est spécifique au canal. Chaque Plugin de canal
      possède son propre pipeline entrant. Regardez les Plugins de canal groupés
      (par exemple le package Plugin Microsoft Teams ou Google Chat) pour voir de vrais modèles.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Tester">
Écrivez des tests colocalisés dans `src/channel.test.ts` :

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

    Pour les assistants de test partagés, voir [Tests](/fr/plugins/sdk-testing).

  </Step>
</Steps>

## Structure des fichiers

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

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de threading" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, ciblés par compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    `describeMessageTool` et découverte d’actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture-internals#channel-target-resolution">
    `inferTargetChatType`, `looksLikeId`, `resolveTarget`
  </Card>
  <Card title="Assistants d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, médias, sous-agent via `api.runtime`
  </Card>
</CardGroup>

<Note>
Certaines surfaces d’assistance groupées existent encore pour la maintenance des Plugins groupés et
la compatibilité. Ce n’est pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface SDK
commune sauf si vous maintenez directement cette famille de Plugins groupés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre Plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Tests SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste Plugin](/fr/plugins/manifest) — schéma complet du manifeste

## Voir aussi

- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
- [Plugins de harnais d’agent](/fr/plugins/sdk-agent-harness)
