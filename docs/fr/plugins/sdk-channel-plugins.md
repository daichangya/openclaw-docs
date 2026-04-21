---
read_when:
    - Vous créez un nouveau plugin de canal de messagerie
    - Vous souhaitez connecter OpenClaw à une plateforme de messagerie
    - Vous devez comprendre la surface d’adaptation `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guide étape par étape pour créer un plugin de canal de messagerie pour OpenClaw
title: Création de plugins de canal
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Création de plugins de canal

Ce guide explique pas à pas comment créer un plugin de canal qui connecte OpenClaw à une
plateforme de messagerie. À la fin, vous disposerez d’un canal fonctionnel avec la sécurité des MP,
l’appairage, le fil de réponses et la messagerie sortante.

<Info>
  Si vous n’avez encore créé aucun plugin OpenClaw, lisez d’abord
  [Prise en main](/fr/plugins/building-plugins) pour comprendre la structure de package
  de base et la configuration du manifeste.
</Info>

## Fonctionnement des plugins de canal

Les plugins de canal n’ont pas besoin de leurs propres outils send/edit/react. OpenClaw conserve un
outil `message` partagé dans le cœur. Votre plugin gère :

- **Configuration** — résolution de compte et assistant de configuration
- **Sécurité** — politique des MP et listes d’autorisation
- **Appairage** — flux d’approbation en MP
- **Grammaire de session** — comment les identifiants de conversation spécifiques au fournisseur sont mappés aux conversations de base, aux identifiants de fil et aux replis parent
- **Sortant** — envoi de texte, médias et sondages vers la plateforme
- **Fil de discussion** — comment les réponses sont organisées en fil

Le cœur gère l’outil de message partagé, le câblage des prompts, la forme externe de la clé de session,
la gestion générique de `:thread:` et la distribution.

Si votre canal ajoute des paramètres à l’outil de message qui transportent des sources média, exposez ces
noms de paramètres via `describeMessageTool(...).mediaSourceParams`. Le cœur utilise
cette liste explicite pour la normalisation des chemins sandbox et la politique d’accès aux médias sortants,
afin que les plugins n’aient pas besoin de cas particuliers dans le cœur partagé pour les paramètres
spécifiques au fournisseur comme les avatars, pièces jointes ou images de couverture.
Préférez renvoyer une map indexée par action telle que
`{ "set-profile": ["avatarUrl", "avatarPath"] }` afin que les actions non liées n’héritent pas des arguments média d’une autre action. Un tableau plat fonctionne aussi pour les paramètres volontairement partagés par chaque action exposée.

Si votre plateforme stocke une portée supplémentaire dans les identifiants de conversation, gardez cette logique d’analyse
dans le plugin avec `messaging.resolveSessionConversation(...)`. Il s’agit du hook canonique pour mapper
`rawId` vers l’identifiant de conversation de base, l’identifiant de fil facultatif,
`baseConversationId` explicite, et d’éventuels `parentConversationCandidates`.
Quand vous renvoyez `parentConversationCandidates`, conservez leur ordre du
parent le plus spécifique au plus large / à la conversation de base.

Les plugins intégrés qui ont besoin de la même analyse avant que le registre de canaux ne démarre
peuvent aussi exposer un fichier `session-key-api.ts` de niveau supérieur avec un export
`resolveSessionConversation(...)` correspondant. Le cœur utilise cette surface sûre pour l’amorçage
uniquement lorsque le registre de plugins à l’exécution n’est pas encore disponible.

`messaging.resolveParentConversationCandidates(...)` reste disponible comme solution de compatibilité héritée lorsqu’un plugin n’a besoin que
de replis parent au-dessus de l’identifiant générique / brut. Si les deux hooks existent, le cœur utilise
d’abord `resolveSessionConversation(...).parentConversationCandidates` et ne
revient à `resolveParentConversationCandidates(...)` que si le hook canonique
ne les fournit pas.

## Approbations et capacités de canal

La plupart des plugins de canal n’ont pas besoin de code spécifique aux approbations.

- Le cœur gère `/approve` dans le même chat, les charges utiles de bouton d’approbation partagées, et la distribution de secours générique.
- Préférez un seul objet `approvalCapability` sur le plugin de canal quand le canal a besoin d’un comportement spécifique aux approbations.
- `ChannelPlugin.approvals` est supprimé. Placez les informations de distribution / natif / rendu / authentification des approbations sur `approvalCapability`.
- `plugin.auth` sert uniquement à login/logout ; le cœur ne lit plus les hooks d’authentification d’approbation depuis cet objet.
- `approvalCapability.authorizeActorAction` et `approvalCapability.getActionAvailabilityState` constituent la jonction canonique pour l’authentification des approbations.
- Utilisez `approvalCapability.getActionAvailabilityState` pour la disponibilité de l’authentification d’approbation dans le même chat.
- Si votre canal expose des approbations d’exécution natives, utilisez `approvalCapability.getExecInitiatingSurfaceState` pour l’état de la surface d’initiation / du client natif lorsqu’il diffère de l’authentification d’approbation dans le même chat. Le cœur utilise ce hook spécifique à l’exécution pour distinguer `enabled` de `disabled`, décider si le canal initiateur prend en charge les approbations d’exécution natives, et inclure le canal dans les indications de repli pour client natif. `createApproverRestrictedNativeApprovalCapability(...)` remplit cela pour le cas courant.
- Utilisez `outbound.shouldSuppressLocalPayloadPrompt` ou `outbound.beforeDeliverPayload` pour les comportements spécifiques au canal dans le cycle de vie des charges utiles, par exemple masquer les prompts locaux d’approbation en double ou envoyer des indicateurs de saisie avant la livraison.
- Utilisez `approvalCapability.delivery` uniquement pour le routage d’approbation natif ou la suppression du repli.
- Utilisez `approvalCapability.nativeRuntime` pour les informations d’approbation natives gérées par le canal. Gardez-le paresseux sur les points d’entrée de canal sensibles avec `createLazyChannelApprovalNativeRuntimeAdapter(...)`, qui peut importer votre module runtime à la demande tout en laissant le cœur assembler le cycle de vie des approbations.
- Utilisez `approvalCapability.render` uniquement lorsqu’un canal a réellement besoin de charges utiles d’approbation personnalisées au lieu du moteur de rendu partagé.
- Utilisez `approvalCapability.describeExecApprovalSetup` lorsque le canal souhaite que la réponse sur le chemin désactivé explique les paramètres exacts nécessaires pour activer les approbations d’exécution natives. Le hook reçoit `{ channel, channelLabel, accountId }` ; les canaux à comptes nommés doivent rendre des chemins à portée de compte comme `channels.<channel>.accounts.<id>.execApprovals.*` au lieu de valeurs par défaut de niveau supérieur.
- Si un canal peut déduire des identités de MP stables de type propriétaire à partir de la configuration existante, utilisez `createResolvedApproverActionAuthAdapter` depuis `openclaw/plugin-sdk/approval-runtime` pour restreindre `/approve` dans le même chat sans ajouter de logique spécifique aux approbations dans le cœur.
- Si un canal a besoin d’une distribution d’approbation native, faites en sorte que le code du canal reste centré sur la normalisation des cibles ainsi que sur les informations de transport / présentation. Utilisez `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, et `createApproverRestrictedNativeApprovalCapability` depuis `openclaw/plugin-sdk/approval-runtime`. Placez les informations spécifiques au canal derrière `approvalCapability.nativeRuntime`, idéalement via `createChannelApprovalNativeRuntimeAdapter(...)` ou `createLazyChannelApprovalNativeRuntimeAdapter(...)`, afin que le cœur puisse assembler le gestionnaire et gérer le filtrage des requêtes, le routage, la déduplication, l’expiration, l’abonnement Gateway et les avis de routage ailleurs. `nativeRuntime` est divisé en quelques jonctions plus petites :
- `availability` — si le compte est configuré et si une requête doit être traitée
- `presentation` — mappe le modèle de vue d’approbation partagé vers des charges utiles natives en attente / résolues / expirées ou des actions finales
- `transport` — prépare les cibles puis envoie / met à jour / supprime les messages d’approbation natifs
- `interactions` — hooks facultatifs bind / unbind / clear-action pour les boutons ou réactions natifs
- `observe` — hooks facultatifs de diagnostic de distribution
- Si le canal a besoin d’objets gérés à l’exécution tels qu’un client, un jeton, une application Bolt ou un récepteur Webhook, enregistrez-les via `openclaw/plugin-sdk/channel-runtime-context`. Le registre générique de contexte runtime permet au cœur d’amorcer des gestionnaires pilotés par les capacités à partir de l’état de démarrage du canal sans ajouter de glue d’encapsulation spécifique aux approbations.
- Recourez à plus bas niveau à `createChannelApprovalHandler` ou `createChannelNativeApprovalRuntime` uniquement lorsque la jonction pilotée par les capacités n’est pas encore suffisamment expressive.
- Les canaux d’approbation native doivent faire transiter à la fois `accountId` et `approvalKind` par ces helpers. `accountId` maintient la portée correcte de la politique d’approbation multi-comptes pour le bon compte bot, et `approvalKind` maintient disponible au canal le comportement d’approbation d’exécution ou de plugin sans branches codées en dur dans le cœur.
- Le cœur gère désormais aussi les avis de reroutage d’approbation. Les plugins de canal ne doivent pas envoyer leurs propres messages de suivi « l’approbation est allée en MP / vers un autre canal » depuis `createChannelNativeApprovalRuntime` ; à la place, exposez un routage précis de l’origine + des MP de l’approbateur via les helpers partagés des capacités d’approbation et laissez le cœur agréger les distributions réelles avant de publier un éventuel avis dans le chat initiateur.
- Préservez de bout en bout le type d’identifiant d’approbation distribué. Les clients natifs ne doivent pas
  deviner ni réécrire le routage d’approbation d’exécution ou de plugin à partir de l’état local du canal.
- Différents types d’approbation peuvent volontairement exposer des surfaces natives différentes.
  Exemples intégrés actuels :
  - Slack maintient disponible le routage d’approbation natif à la fois pour les identifiants d’exécution et de plugin.
  - Matrix conserve le même routage natif en MP / canal et la même UX par réaction pour les approbations d’exécution
    et de plugin, tout en permettant quand même à l’authentification de différer selon le type d’approbation.
- `createApproverRestrictedNativeApprovalAdapter` existe toujours comme wrapper de compatibilité, mais le nouveau code doit préférer le builder de capacité et exposer `approvalCapability` sur le plugin.

Pour les points d’entrée de canal sensibles, préférez les sous-chemins runtime plus étroits lorsque vous n’avez besoin
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
`openclaw/plugin-sdk/reply-reference`, et
`openclaw/plugin-sdk/reply-chunking` lorsque vous n’avez pas besoin de la surface
ombrelle plus large.

Pour la configuration initiale en particulier :

- `openclaw/plugin-sdk/setup-runtime` couvre les helpers de configuration initiale sûrs à l’exécution :
  adaptateurs de patch de configuration initiale sûrs à l’import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), sortie de note de recherche,
  `promptResolvedAllowFrom`, `splitSetupEntries`, et les builders
  de proxy de configuration déléguée
- `openclaw/plugin-sdk/setup-adapter-runtime` est la jonction d’adaptateur étroite sensible aux variables d’environnement
  pour `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` couvre les builders de configuration initiale avec installation optionnelle
  ainsi que quelques primitives sûres pour la configuration initiale :
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Si votre canal prend en charge une configuration initiale ou une authentification pilotée par variables d’environnement et que les flux génériques de démarrage / configuration
doivent connaître ces noms de variables d’environnement avant le chargement du runtime, déclarez-les dans le
manifeste du plugin avec `channelEnvVars`. Conservez les `envVars` du runtime de canal ou les constantes locales uniquement pour le texte destiné aux opérateurs.

Si votre canal peut apparaître dans `status`, `channels list`, `channels status`, ou dans les analyses SecretRef avant que le runtime du plugin ne démarre, ajoutez `openclaw.setupEntry` dans
`package.json`. Ce point d’entrée doit pouvoir être importé sans risque dans des chemins de commande en lecture seule et doit renvoyer les métadonnées du canal, l’adaptateur de configuration sûr pour la configuration initiale, l’adaptateur de statut, et les métadonnées de cible secrète du canal nécessaires à ces résumés. Ne démarrez pas de clients, d’écouteurs ou de runtimes de transport depuis le point d’entrée de configuration initiale.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, et
`splitSetupEntries`

- utilisez la jonction plus large `openclaw/plugin-sdk/setup` uniquement lorsque vous avez aussi besoin des
  helpers partagés plus lourds de configuration initiale / configuration tels que
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Si votre canal veut seulement annoncer « installez d’abord ce plugin » dans les surfaces de configuration initiale, préférez `createOptionalChannelSetupSurface(...)`. L’adaptateur / assistant généré échoue de manière fermée sur les écritures de configuration et la finalisation, et réutilise le même message exigeant l’installation dans la validation, la finalisation et le texte du lien vers la documentation.

Pour les autres chemins de canal sensibles, préférez les helpers étroits aux surfaces héritées plus larges :

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, et
  `openclaw/plugin-sdk/account-helpers` pour la configuration multi-comptes et
  le repli vers le compte par défaut
- `openclaw/plugin-sdk/inbound-envelope` et
  `openclaw/plugin-sdk/inbound-reply-dispatch` pour le câblage des routes / enveloppes entrantes et
  l’enregistrement-et-distribution
- `openclaw/plugin-sdk/messaging-targets` pour l’analyse et la correspondance des cibles
- `openclaw/plugin-sdk/outbound-media` et
  `openclaw/plugin-sdk/outbound-runtime` pour le chargement des médias ainsi que les
  délégations d’identité / d’envoi sortants et la planification des charges utiles
- `openclaw/plugin-sdk/thread-bindings-runtime` pour le cycle de vie des liaisons de fil
  et l’enregistrement des adaptateurs
- `openclaw/plugin-sdk/agent-media-payload` uniquement lorsqu’une disposition de champ héritée
  pour les charges utiles agent / média est encore requise
- `openclaw/plugin-sdk/telegram-command-config` pour la normalisation des commandes personnalisées Telegram,
  la validation des doublons / conflits, et un contrat de configuration de commandes
  stable en repli

Les canaux uniquement basés sur l’authentification peuvent généralement s’arrêter au chemin par défaut : le cœur gère les approbations et le plugin expose simplement les capacités sortantes / d’authentification. Les canaux d’approbation native comme Matrix, Slack, Telegram et les transports de chat personnalisés doivent utiliser les helpers natifs partagés plutôt que d’implémenter leur propre cycle de vie d’approbation.

## Politique de mention entrante

Gardez la gestion des mentions entrantes séparée en deux couches :

- collecte d’éléments probants gérée par le plugin
- évaluation de politique partagée

Utilisez `openclaw/plugin-sdk/channel-mention-gating` pour les décisions de politique de mention.
Utilisez `openclaw/plugin-sdk/channel-inbound` uniquement lorsque vous avez besoin de la barrique
plus large des helpers entrants.

Bon cas d’usage pour la logique locale au plugin :

- détection de réponse au bot
- détection de citation du bot
- vérifications de participation au fil
- exclusions de messages de service / système
- caches natifs de plateforme nécessaires pour prouver la participation du bot

Bon cas d’usage pour le helper partagé :

- `requireMention`
- résultat de mention explicite
- liste d’autorisation de mention implicite
- contournement des commandes
- décision finale de saut

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

`api.runtime.channel.mentions` expose les mêmes helpers de mention partagés pour
les plugins de canal intégrés qui dépendent déjà de l’injection runtime :

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Si vous n’avez besoin que de `implicitMentionKindWhen` et
`resolveInboundMentionDecision`, importez-les depuis
`openclaw/plugin-sdk/channel-mention-gating` pour éviter de charger des helpers runtime
entrants non liés.

Les anciens helpers `resolveMentionGating*` restent présents sur
`openclaw/plugin-sdk/channel-inbound` uniquement comme exports de compatibilité. Le nouveau code
doit utiliser `resolveInboundMentionDecision({ facts, policy })`.

## Procédure pas à pas

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package et manifeste">
    Créez les fichiers de plugin standard. Le champ `channel` dans `package.json`
    est ce qui fait de ceci un plugin de canal. Pour la surface complète des métadonnées de package,
    voir [Configuration initiale et configuration des plugins](/fr/plugins/sdk-setup#openclaw-channel) :

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

      // Sécurité des MP : qui peut envoyer des messages au bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Appairage : flux d’approbation pour les nouveaux contacts en MP
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Fil de discussion : comment les réponses sont distribuées
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
      Au lieu d’implémenter manuellement des interfaces d’adaptateur de bas niveau, vous transmettez
      des options déclaratives et le builder les compose :

      | Option | Ce qu’elle câble |
      | --- | --- |
      | `security.dm` | Résolveur de sécurité MP à portée limitée à partir des champs de configuration |
      | `pairing.text` | Flux d’appairage MP basé sur du texte avec échange de code |
      | `threading` | Résolveur de mode reply-to (fixe, à portée de compte ou personnalisé) |
      | `outbound.attachedResults` | Fonctions d’envoi qui renvoient des métadonnées de résultat (identifiants de message) |

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

    Placez les descripteurs CLI gérés par le canal dans `registerCliMetadata(...)` afin qu’OpenClaw
    puisse les afficher dans l’aide racine sans activer le runtime complet du canal,
    tandis que les chargements complets normaux récupèrent quand même les mêmes descripteurs pour le véritable enregistrement
    des commandes. Conservez `registerFull(...)` pour le travail uniquement runtime.
    Si `registerFull(...)` enregistre des méthodes RPC Gateway, utilisez un
    préfixe spécifique au plugin. Les espaces de noms d’administration du cœur (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restent réservés et
    se résolvent toujours vers `operator.admin`.
    `defineChannelPluginEntry` gère automatiquement la séparation des modes d’enregistrement. Voir
    [Points d’entrée](/fr/plugins/sdk-entrypoints#definechannelpluginentry) pour toutes les
    options.

  </Step>

  <Step title="Ajouter un point d’entrée de configuration initiale">
    Créez `setup-entry.ts` pour un chargement léger pendant l’intégration :

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw charge ceci à la place du point d’entrée complet lorsque le canal est désactivé
    ou non configuré. Cela évite de charger du code runtime lourd pendant les flux de configuration initiale.
    Voir [Configuration initiale et configuration](/fr/plugins/sdk-setup#setup-entry) pour plus de détails.

    Les canaux intégrés de l’espace de travail qui séparent les exports sûrs pour la configuration initiale dans des modules
    compagnons peuvent utiliser `defineBundledChannelSetupEntry(...)` depuis
    `openclaw/plugin-sdk/channel-entry-contract` lorsqu’ils ont aussi besoin d’un
    setter runtime explicite au moment de la configuration initiale.

  </Step>

  <Step title="Gérer les messages entrants">
    Votre plugin doit recevoir les messages depuis la plateforme et les transmettre à
    OpenClaw. Le schéma habituel est un Webhook qui vérifie la requête et
    la distribue via le gestionnaire entrant de votre canal :

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // authentification gérée par le plugin (vérifiez vous-même les signatures)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Votre gestionnaire entrant distribue le message vers OpenClaw.
          // Le câblage exact dépend de votre SDK de plateforme —
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
      La gestion des messages entrants est spécifique au canal. Chaque plugin de canal gère
      son propre pipeline entrant. Regardez les plugins de canal intégrés
      (par exemple le package de plugin Microsoft Teams ou Google Chat) pour voir des schémas réels.
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
├── runtime-api.ts            # Exports runtime internes (facultatif)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Client API de plateforme
    └── runtime.ts            # Store runtime (si nécessaire)
```

## Sujets avancés

<CardGroup cols={2}>
  <Card title="Options de fil de discussion" icon="git-branch" href="/fr/plugins/sdk-entrypoints#registration-mode">
    Modes de réponse fixes, à portée de compte ou personnalisés
  </Card>
  <Card title="Intégration de l’outil de message" icon="puzzle" href="/fr/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
Certaines jonctions helper intégrées existent encore pour la maintenance et la
compatibilité des plugins intégrés. Ce n’est pas le schéma recommandé pour les nouveaux plugins de canal ;
préférez les sous-chemins génériques channel/setup/reply/runtime de la surface
SDK commune, sauf si vous maintenez directement cette famille de plugins intégrés.
</Note>

## Étapes suivantes

- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — si votre plugin fournit aussi des modèles
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Tests SDK](/fr/plugins/sdk-testing) — utilitaires de test et tests de contrat
- [Manifeste du plugin](/fr/plugins/manifest) — schéma complet du manifeste
