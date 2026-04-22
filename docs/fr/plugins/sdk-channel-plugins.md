---
read_when:
    - Vous créez un nouveau Plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation de `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un Plugin de canal de messagerie pour OpenClaw
title: Créer des Plugins de canal
x-i18n:
    generated_at: "2026-04-22T06:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Créer des Plugins de canal

Ce guide explique étape par étape comment créer un Plugin de canal qui connecte OpenClaw à une plateforme de messagerie. À la fin, vous aurez un canal fonctionnel avec sécurité des DM, appairage, fil de réponses et messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun Plugin OpenClaw, lisez d’abord
  [Pour commencer](/fr/plugins/building-plugins) pour comprendre la structure de package
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des Plugins de canal

Les Plugins de canal n’ont pas besoin de leurs propres outils d’envoi/édition/réaction. OpenClaw conserve un outil `message` partagé dans le cœur. Votre plugin gère :

- **Configuration** — résolution de compte et assistant de configuration
- **Sécurité** — politique de DM et listes d’autorisation
- **Appairage** — flux d’approbation en DM
- **Grammaire de session** — manière dont les identifiants de conversation spécifiques au fournisseur sont mappés vers les chats de base, les identifiants de fil et les replis parent
- **Sortant** — envoi de texte, de médias et de sondages vers la plateforme
- **Gestion des fils** — manière dont les réponses sont organisées en fil
- **Saisie Heartbeat** — signaux optionnels de saisie/occupation pour les cibles de livraison Heartbeat

Le cœur gère l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session, la gestion générique de `:thread:` et la distribution.

Si votre canal prend en charge les indicateurs de saisie en dehors des réponses entrantes, exposez
`heartbeat.sendTyping(...)` sur le plugin de canal. Le cœur l’appelle avec la
cible de livraison Heartbeat résolue avant le début de l’exécution du modèle Heartbeat et
utilise le cycle de vie partagé de maintien/cleanup de saisie. Ajoutez `heartbeat.clearTyping(...)`
lorsque la plateforme nécessite un signal d’arrêt explicite.

Si votre canal ajoute des paramètres d’outil de message qui transportent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins du sandbox et la politique
d’accès aux médias sortants, afin que les plugins n’aient pas besoin de cas particuliers
dans le cœur partagé pour les paramètres spécifiques au fournisseur comme les
avatars, pièces jointes ou images de couverture.
Préférez renvoyer une map indexée par action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que des actions non liées n’héritent pas
des arguments média d’une autre action. Un tableau plat fonctionne toujours pour des paramètres
qui sont intentionnellement partagés par chaque action exposée.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, gardez cette logique d’analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. C’est le point d’extension canonique
pour mapper `rawId` vers l’identifiant de conversation de base, un identifiant de fil optionnel,
un `baseConversationId` explicite et d’éventuels `parentConversationCandidates`.
Lorsque vous renvoyez `parentConversationCandidates`, conservez-les ordonnés du parent
le plus spécifique au plus large / à la conversation de base.

Les Plugins intégrés qui ont besoin de la même logique d’analyse avant le démarrage du registre de canaux
peuvent aussi exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour le bootstrap
uniquement lorsque le registre de plugins d’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme repli de compatibilité hérité lorsqu’un plugin n’a besoin
que de replis parent au-dessus de l’identifiant générique / brut. Si les deux points d’extension existent, le cœur utilise
d’abord `resolveSessionConversation(...).parentConversationCandidates` et
ne revient à `resolveParentConversationCandidates(...)` que lorsque le point d’extension canonique
les omet.

## Approbations et capacités du canal

La plupart des Plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur gère `/approve` dans le même chat, les payloads de bouton d’approbation partagés et la livraison générique de repli.
- Préférez un seul objet `approvalCapability` sur le plugin de canal lorsque le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les faits de livraison/rendu/auth natifs des approbations dans `approvalCapability`.
- `plugin.auth` est réservé à login/logout ; le cœur ne lit plus les hooks d’auth d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` sont la surface canonique pour l’auth des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’auth d’approbation dans le même chat.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état surface initiatrice / client natif lorsqu’il diffère de l’auth d’approbation dans le même chat. Le cœur utilise ce hook spécifique à exec pour distinguer `enabled` et `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives et inclure le canal dans les indications de repli du client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour le comportement spécifique au canal dans le cycle de vie des payloads, par exemple masquer des prompts locaux d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les faits d’approbation natifs possédés par le canal. Gardez-le lazy sur les points d’entrée de canal chauds avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module d’exécution à la demande tout en laissant le cœur assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de payloads d’approbation personnalisés au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal veut que la réponse du chemin désactivé explique les paramètres de configuration exacts requis pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent afficher des chemins avec portée de compte tels que `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de niveau supérieur.
- Si un canal peut inférer des identités de DM stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique spécifique aux approbations dans le cœur.
- Si un canal a besoin d’une livraison d’approbation native, faites en sorte que le code du canal reste centré sur la normalisation de cible ainsi que sur les faits de transport/présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les faits spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et gérer lui-même le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement à la passerelle et les notifications « traité ailleurs ». `nativeRuntime` est divisé en quelques surfaces plus petites :
- `availability` — indique si le compte est configuré et si une requête doit être traitée
- `presentation` — mappe le modèle de vue d’approbation partagé vers des payloads natifs en attente / résolus / expirés ou vers des actions finales
- `transport` — prépare les cibles puis envoie / met à jour / supprime les messages d’approbation natifs
- `interactions` — hooks facultatifs de bind / unbind / clear-action pour les boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostic de livraison
- Si le canal a besoin d’objets possédés par l’exécution comme un client, un jeton, une app Bolt ou un récepteur de Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte d’exécution permet au cœur d’initialiser des gestionnaires pilotés par capacité à partir de l’état de démarrage du canal sans ajouter de glue spécifique aux approbations.
- N’utilisez les surfaces de plus bas niveau `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` que lorsque la surface pilotée par capacité n’est pas encore assez expressive.
- Les canaux d’approbation native doivent faire transiter à la fois `accountId` et `approvalKind` via ces helpers. `accountId` maintient la portée de la politique d’approbation multicomptes sur le bon compte bot, et `approvalKind` conserve le comportement d’approbation exec vs plugin disponible pour le canal sans branches codées en dur dans le cœur.
- Le cœur gère désormais aussi les notifications de reroutage d’approbation. Les Plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation a été envoyée en DM / dans un autre canal » depuis `createChannelNativeApprovalRuntime` ; exposez plutôt un routage précis origine + DM de l’approbateur via les helpers partagés de capacité d’approbation et laissez le cœur agréger les livraisons réelles avant de publier toute notification dans le chat initiateur.
- Préservez le type d’identifiant d’approbation livré de bout en bout. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation exec vs plugin à partir d’un état local au canal.
- Différents types d’approbation peuvent intentionnellement exposer différentes surfaces natives.
  Exemples intégrés actuels :
  - Slack garde le routage d’approbation native disponible à la fois pour les identifiants exec et plugin.
  - Matrix garde le même routage natif DM/canal et la même UX à réactions pour les approbations exec
    et plugin, tout en permettant à l’auth de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le constructeur de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée de canal chauds, préférez les sous-chemins d’exécution plus étroits lorsque vous n’avez besoin
que d’une seule partie de cette famille :

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
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
plus large fournie par l’ombrelle.

Pour la configuration en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration sûrs à l’exécution :
  adaptateurs de patch de configuration sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie des notes de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries` et les constructeurs
  de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est la surface d’adaptation étroite, consciente de l’environnement,
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les constructeurs de configuration à installation optionnelle
  ainsi que quelques primitives sûres pour la configuration :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration ou une auth pilotée par l’environnement et que les flux génériques de démarrage/configuration
doivent connaître ces noms de variables d’environnement avant le chargement de l’exécution, déclarez-les dans le
manifeste du plugin avec `channelEnvVars`. Gardez `envVars` dans l’exécution du canal ou des constantes locales
uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status` ou dans les analyses SecretRef avant le démarrage de l’exécution du plugin, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé en toute sécurité dans des chemins de commande en lecture seule
et doit renvoyer les métadonnées du canal, l’adaptateur de configuration sûr pour setup, l’adaptateur de statut
et les métadonnées de cible de secret du canal nécessaires à ces résumés. Ne démarrez pas de clients, d’écouteurs
ni de runtimes de transport depuis le point d’entrée setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` et
`splitSetupEntries`

- utilisez la surface plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez également besoin des
  helpers partagés plus lourds de configuration/config tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement indiquer « installez d’abord ce plugin » dans les
surfaces de configuration, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur / l’assistant
générés échouent de manière fermée sur les écritures de config et la finalisation, et ils réutilisent
le même message d’installation requise dans la validation, la finalisation et le texte avec lien vers la documentation.

Pour les autres chemins de canal chauds, préférez les helpers étroits aux surfaces
héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multicomptes et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour la route / l’enveloppe entrante et
  le câblage enregistrement-et-dispatch
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse / la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les délégués
  d’identité / d’envoi sortants et la planification des payloads
- `buildThreadAwareOutboundSessionRoute(...)` depuis
  `openclaw/plugin-sdk/channel-core` lorsqu’une route sortante doit préserver un
  `replyToId` / `threadId` explicite ou récupérer la session `:thread:` courante
  après que la clé de session de base corresponde encore. Les Plugins de fournisseur peuvent remplacer
  la précédence, le comportement des suffixes et la normalisation des identifiants de fil lorsque leur plateforme
  possède une sémantique native de livraison en fil.
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition de champ
  héritée d’agent / payload média reste nécessaire
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons / conflits et un contrat de configuration de commande
  stable en repli

Les canaux avec auth uniquement peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose simplement les capacités sortantes / d’auth. Les canaux d’approbation native tels que Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés au lieu de créer leur propre cycle de vie d’approbation.

## Politique des mentions entrantes

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte des preuves gérée par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin de la surface
plus large des helpers entrants.

Bon cas d’usage pour la logique locale au plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions de messages de service / système
- caches natifs à la plateforme nécessaires pour prouver la participation du bot

Bon cas d’usage pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement par commande
- décision finale d’ignorer

Flux recommandé :

1. Calculez les faits de mention locaux.
2. Transmettez ces faits à `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour les
Plugins de canal intégrés qui dépendent déjà de l’injection d’exécution :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous n’avez besoin que de `implicitMentionKindWhen` et de
`resolveInboundMentionDecision`, importez-les depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers d’exécution
entrants non liés.

Les anciens helpers `resolveMentionGating*` restent présents dans
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Guide pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json` est
    ce qui fait de ceci un Plugin de canal. Pour la surface complète des métadonnées
    de package, voir [Configuration et setup des Plugins](/fr/plugins/sdk-setup#openclaw-channel) :

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
    L’interface `ChannelPlugin` possède de nombreuses surfaces d’adaptation facultatives. Commencez par
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

    <Accordion title="Ce que `createChatChannelPlugin` fait pour vous">
      Au lieu d’implémenter manuellement des interfaces d’adaptation de bas niveau, vous transmettez
      des options déclaratives et le constructeur les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité DM à portée limitée à partir des champs de configuration |
      | `pairing.text` | Flux d’appairage DM basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode reply-to (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

      Vous pouvez également transmettre des objets d’adaptateur bruts au lieu des options déclaratives
      si vous avez besoin d’un contrôle total.
    </Accordion>

  </Step>

  <Step title="Connecter le point d’entrée">
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

    Placez les descripteurs CLI possédés par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer l’exécution complète du canal,
    tandis que les chargements complets normaux récupèrent toujours les mêmes descripteurs pour le véritable enregistrement
    des commandes. Gardez `registerFull(...)` pour le travail réservé à l’exécution.
    Si `registerFull(...)` enregistre des méthodes RPC de passerelle, utilisez un
    préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et se
    résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Voir
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter une entrée de setup">
    Créez `setup-entry.ts` pour un chargement léger pendant l’onboarding :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci au lieu du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code d’exécution lourd pendant les flux de configuration.
    Voir [Setup et configuration](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux d’espace de travail intégrés qui répartissent les exports sûrs pour setup dans des modules
    sidecar peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter d’exécution explicite au moment du setup.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages de la plateforme et les transférer vers
    OpenClaw. Le modèle typique est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant distribue le message à OpenClaw.
          // Le câblage exact dépend du SDK de votre plateforme —
          // voir un exemple réel dans le package de plugin Microsoft Teams ou Google Chat intégré.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestion des messages entrants est spécifique au canal. Chaque Plugin de canal gère
      son propre pipeline entrant. Consultez les Plugins de canal intégrés
      (par exemple le package de plugin Microsoft Teams ou Google Chat) pour voir des modèles réels.
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
├── api.ts                    # Exports publics (facultatif)
├── runtime-api.ts            # Exports internes d’exécution (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de la plateforme
    └── runtime.ts            # Store d’exécution (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de gestion des fils" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool et découverte d’actions
  </Card>
  <Card title="Résolution de cible" icon="crosshair" href="/fr/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helpers d’exécution" icon="settings" href="/fr/plugins/sdk-runtime">
    TTS, STT, média, sous-agent via api.runtime
  </Card>
</CardGroup>

<Note>
Certaines surfaces helper intégrées existent encore pour la maintenance et la
compatibilité des Plugins intégrés. Ce n’est pas le modèle recommandé pour les nouveaux Plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface SDK
commune, sauf si vous maintenez directement cette famille de Plugins intégrés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Tests du SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste de plugin](/fr/plugins/manifest) — schéma complet du manifeste
