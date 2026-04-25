---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous utilisiez `api.registerEmbeddedExtensionFactory` avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture moderne des Plugin
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de l’ancienne couche de rétrocompatibilité vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture moderne de Plugin avec des imports ciblés et documentés. Si votre Plugin a été construit avant la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines d’assistants. Il a été introduit pour conserver le fonctionnement des anciens Plugins fondés sur des hooks pendant la mise en place de la nouvelle architecture de Plugin.
- **`openclaw/extension-api`** — un pont qui donnait aux Plugins un accès direct aux assistants côté hôte comme l’exécuteur d’agent embarqué.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook d’extension intégrée uniquement Pi, supprimé, qui pouvait observer des événements de l’exécuteur embarqué comme `tool_result`.

Les surfaces d’import larges sont désormais **dépréciées**. Elles fonctionnent encore au runtime, mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants doivent migrer avant que la prochaine version majeure ne les supprime. L’API d’enregistrement de fabrique d’extension intégrée uniquement Pi a été supprimée ; utilisez à la place un middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans la même modification que celle qui introduit un remplacement. Les changements de contrat avec rupture doivent d’abord passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports du SDK, aux champs du manifeste, aux API d’installation, aux hooks et au comportement d’enregistrement au runtime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner lorsque cela se produira.
  Les enregistrements de fabrique d’extension intégrée uniquement Pi ne se chargent déjà plus.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — importer un assistant chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de distinguer les exports stables des exports internes

Le SDK Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`) est un petit module autonome avec un objectif clair et un contrat documenté.

Les points d’entrée pratiques historiques de fournisseur pour les canaux intégrés ont également disparu. Des imports tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les points d’entrée d’assistants marqués au nom du canal et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-dépôt, pas des contrats de Plugin stables. Utilisez à la place des sous-chemins génériques étroits du SDK. À l’intérieur de l’espace de travail du Plugin intégré, conservez les assistants détenus par le fournisseur dans le propre `api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les assistants de streaming spécifiques à Claude dans son propre point d’entrée `api.ts` / `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les assistants de modèle par défaut et les builders de fournisseur temps réel dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les assistants d’onboarding/configuration dans son propre `api.ts`

## Politique de compatibilité

Pour les Plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. conserver l’ancien comportement branché via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et le remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. ne supprimer qu’après la fenêtre de migration annoncée, généralement dans une version majeure

Si un champ de manifeste est encore accepté, les auteurs de Plugin peuvent continuer à l’utiliser tant que la documentation et les diagnostics n’indiquent pas le contraire. Le nouveau code doit préférer le remplacement documenté, mais les Plugins existants ne doivent pas casser pendant des versions mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les extensions Pi de résultat d’outil vers un middleware">
    Les Plugins intégrés doivent remplacer les gestionnaires de résultat d’outil uniquement Pi
    `api.registerEmbeddedExtensionFactory(...)` par un middleware neutre vis-à-vis du runtime.

    ```typescript
    // Outils dynamiques runtime Pi et Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Mettez aussi à jour le manifeste du Plugin au même moment :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Les Plugins externes ne peuvent pas enregistrer de middleware de résultat d’outil, car il peut réécrire une sortie d’outil à haute confiance avant que le modèle ne la voie.

  </Step>

  <Step title="Migrer les gestionnaires natifs d’approbation vers des faits de capacité">
    Les Plugins de canal capables de gérer des approbations exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte de runtime.

    Principaux changements :

    - Remplacer `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacer l’authentification/la livraison spécifiques à l’approbation hors du câblage historique `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public des Plugins de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion du canal uniquement ; les hooks d’authentification d’approbation qui s’y trouvent ne sont plus lus par le core
    - Enregistrez les objets de runtime détenus par le canal comme les clients, les jetons ou les applications Bolt via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de redirection détenus par le Plugin depuis des gestionnaires d’approbation natifs ; le core possède désormais les avis de routage ailleurs à partir des résultats réels de livraison
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une vraie surface `createPluginRuntime().channel`. Les stubs partiels sont refusés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de fallback du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows `.cmd`/`.bat` non résolus échouent désormais en fermeture stricte sauf si vous passez explicitement `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définissez ceci que pour les appelants de compatibilité de confiance
      // qui acceptent intentionnellement un fallback médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du fallback shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports dépréciés">
    Recherchez dans votre Plugin les imports provenant de l’une des surfaces dépréciées :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité dépréciée)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Après (imports ciblés modernes)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les assistants côté hôte, utilisez le runtime de Plugin injecté au lieu d’importer directement :

    ```typescript
    // Avant (pont extension-api déprécié)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres assistants historiques du pont :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | assistants du magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Tableau courant des chemins d’import">
  | Chemin d’import | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant d’entrée canonique de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie historique pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders d’entrée de canal ciblés | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés d’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants de runtime au moment de la configuration | Adaptateurs de correctif de configuration sûrs à l’import, assistants de note de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Assistants d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multi-comptes | Assistants de liste de comptes/configuration/porte d’actions |
  | `plugin-sdk/account-id` | Assistants d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + fallback par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte étroits | Assistants de liste de comptes/actions de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitifs d’association MP | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Primitifs partagés de schéma de configuration de canal ; les exports de schéma nommés de canal intégré sont réservés à la compatibilité historique |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation du nom de commande, réduction de description, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politiques groupe/MP | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants de cycle de vie de l’état du compte et du flux de brouillon | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de routage + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/de correspondance des cibles |
  | `plugin-sdk/outbound-media` | Assistants de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Assistants de runtime sortant | Assistants de livraison sortante, délégué identité/envoi, session, mise en forme et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaisons de fil | Assistants de cycle de vie et d’adaptateur des liaisons de fil |
  | `plugin-sdk/agent-media-payload` | Assistants historiques de charge utile média | Builder de charge utile média agent pour les dispositions de champs historiques |
  | `plugin-sdk/channel-runtime` | shim de compatibilité déprécié | Utilitaires historiques de runtime de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant du Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants larges de runtime | Assistants de runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Assistants étroits d’environnement de runtime | Assistants de logger/environnement de runtime, délai, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Assistants partagés de runtime de Plugin | Assistants de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hook | Assistants partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Assistants de runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Assistants de runtime CLI | Mise en forme de commandes, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway et assistants de correctif d’état de canal |
  | `plugin-sdk/config-runtime` | Assistants de configuration | Assistants de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Assistants de commandes Telegram | Assistants de validation de commandes Telegram stables en fallback lorsque la surface de contrat du Telegram intégré n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Assistants de prompt d’approbation | Charge utile d’approbation exec/Plugin, assistants de capacité/profil d’approbation, assistants de routage/runtime d’approbation native et mise en forme structurée du chemin d’affichage d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’authentification d’approbation | Résolution de l’approbateur, authentification d’action dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Assistants client d’approbation | Assistants de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour points d’entrée chauds de canal |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants plus larges de runtime de gestionnaire d’approbation ; préférez les points d’entrée plus étroits d’adaptateur/Gateway lorsqu’ils suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte de runtime de canal | Assistants génériques d’enregistrement/obtention/surveillance du contexte de runtime de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, filtrage des MP, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF | Assistants de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants de runtime SSRF | Assistants de répartiteur épinglé, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de filtrage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de mise en forme des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants de fetch/proxy encapsulés | `resolveFetch`, assistants de proxy |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Mise en forme de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d’entrées de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage des commandes et assistants de surface de commande | `resolveControlCommandGate`, assistants d’autorisation de l’expéditeur, assistants de registre de commandes incluant la mise en forme de menu dynamique d’arguments |
  | `plugin-sdk/command-status` | Renderers d’état/d’aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Assistants d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Assistants de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde du corps de requête Webhook | Assistants de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Répartition entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de répartition des réponses | Finalisation, répartition du fournisseur et assistants d’étiquette de conversation |
  | `plugin-sdk/reply-history` | Assistants d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage des réponses | Assistants de découpage texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de magasin de session | Assistants de chemin de magasin + `updated-at` |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Builders de résumé d’état de canal/compte, valeurs par défaut d’état de runtime, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolution de cible | Assistants partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaîne | Assistants de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs courants de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées d’objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire des champs de cible d’envoi canoniques depuis des arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemin temporaire | Assistants partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Logger de sous-système et assistants de masquage |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableau Markdown | Assistants de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Assistants de configuration sélectionnés pour fournisseurs locaux/autohébergés | Assistants de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes assistants de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Assistants d’authentification runtime de fournisseur | Assistants de résolution de clé API au runtime |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clé API de fournisseur | Assistants d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’authentification de fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive de fournisseur | Assistants partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Assistants de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion brute de configuration fournisseur |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement de fournisseur | Assistants de recherche de variables d’environnement d’authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de relecture, assistants de point de terminaison fournisseur et assistants de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’onboarding de fournisseur | Assistants de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Assistants HTTP de fournisseur | Assistants génériques de capacité HTTP/point de terminaison de fournisseur, y compris les assistants de formulaire multipart de transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants web-fetch de fournisseur | Assistants d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration de recherche web de fournisseur | Assistants étroits de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat de recherche web de fournisseur | Assistants étroits de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/scetteurs d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Assistants de recherche web de fournisseur | Assistants d’enregistrement/cache/runtime de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité outils/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Assistants d’utilisation de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres assistants d’utilisation de fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et assistants partagés d’enveloppe Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur | Assistants de transport natif de fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants médias partagés | Assistants de récupération/transformation/stockage de médias ainsi que builders de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération de médias | Assistants partagés de basculement, sélection de candidat et messagerie de modèle manquant pour la génération d’images/vidéo/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension des médias | Types de fournisseur de compréhension des médias ainsi qu’exports d’assistants image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Assistants texte partagés | Suppression du texte visible par l’assistant, assistants de rendu/découpage/tableau Markdown, assistants de masquage, assistants de balises de directive, utilitaires de texte sûr et assistants texte/journalisation associés |
  | `plugin-sdk/text-chunking` | Assistants de découpage de texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants de parole | Types de fournisseur de parole ainsi qu’assistants de directives, registre et validation destinés aux fournisseurs |
  | `plugin-sdk/speech-core` | Noyau partagé de parole | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription temps réel | Types de fournisseur, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants de voix temps réel | Types de fournisseur, assistants de registre/résolution et assistants de session bridge |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types de génération d’images, basculement, authentification et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitifs de configuration de canal | Primitifs étroits de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude partagé de canal | Exports partagés de prélude de Plugin de canal |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés de capture instantanée/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants de lecture/modification de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de MP direct | Assistants partagés d’authentification/garde pour MP direct |
  | `plugin-sdk/extension-shared` | Assistants d’extension partagés | Primitifs d’assistants de canal passif/état et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cibles Webhook | Registre de cibles Webhook et assistants d’installation de routes |
  | `plugin-sdk/webhook-path` | Assistants de chemin Webhook | Assistants de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Assistants partagés de médias web | Assistants de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du SDK Plugin |
  | `plugin-sdk/memory-core` | Assistants intégrés memory-core | Surface d’assistants de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade de runtime du moteur de mémoire | Façade de runtime d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation de l’hôte mémoire | Exports du moteur fondation de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte mémoire | Contrats d’embeddings mémoire, accès au registre, fournisseur local et assistants génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte mémoire | Exports du moteur QMD de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte mémoire | Exports du moteur de stockage de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire | Assistants multimodaux de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire | Assistants de requête de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte mémoire | Assistants de secret de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire | Assistants de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire | Assistants d’état de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI de l’hôte mémoire | Assistants de runtime CLI de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core de l’hôte mémoire | Assistants de runtime core de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichier/runtime de l’hôte mémoire | Assistants de fichier/runtime de l’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias de runtime core de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les assistants de runtime core de l’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichier/runtime de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les assistants de fichier/runtime de l’hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Assistants Markdown gérés | Assistants partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade de runtime paresseux du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les assistants d’état de l’hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Assistants intégrés memory-lancedb | Surface d’assistants memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Assistants de test et mocks |
</Accordion>

Ce tableau est intentionnellement le sous-ensemble de migration courant, pas la surface complète du SDK. La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certains points d’entrée d’assistants de Plugins intégrés tels que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ils restent exportés pour la maintenance et la compatibilité des Plugins intégrés, mais ils sont volontairement omis du tableau de migration courant et ne constituent pas la cible recommandée pour le nouveau code de Plugin.

La même règle s’applique à d’autres familles d’assistants intégrés telles que :

- assistants de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces d’assistants/Plugins intégrés comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite d’assistant de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit qui correspond au besoin. Si vous ne trouvez pas un export, consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Dépréciations actives

Dépréciations plus ciblées qui s’appliquent à l’ensemble du SDK Plugin, au contrat fournisseur, à la surface runtime et au manifeste. Chacune fonctionne encore aujourd’hui mais sera supprimée dans une future version majeure. L’entrée sous chaque élément fait correspondre l’ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="builders d’aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports — simplement importés depuis le sous-chemin plus étroit. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Avant
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Après
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="assistants de filtrage par mention → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` — renvoie un
    objet de décision unique au lieu de deux appels séparés.

    Les Plugins de canal en aval (Slack, Discord, Matrix, Microsoft Teams) ont déjà basculé.

  </Accordion>

  <Accordion title="shim de runtime de canal et assistants d’actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    Plugins de canal. Ne l’importez pas depuis du nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer les objets de runtime.

    Les assistants `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    dépréciés en même temps que les exports bruts de canal « actions ». Exposez plutôt les capacités
    via la surface sémantique `presentation` : les Plugins de canal déclarent ce qu’ils rendent
    (cartes, boutons, sélections) plutôt que les noms d’actions bruts qu’ils acceptent.

  </Accordion>

  <Accordion title="assistant tool() de fournisseur de recherche web → createTool() sur le Plugin">
    **Ancien** : fabrique `tool()` depuis `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémenter `createTool(...)` directement sur le Plugin fournisseur.
    OpenClaw n’a plus besoin de l’assistant SDK pour enregistrer l’enveloppe de l’outil.

  </Accordion>

  <Accordion title="enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe de prompt plate en texte brut
    à partir de messages entrants de canal.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur.
    Les Plugins de canal attachent les métadonnées de routage (fil, sujet, reply-to, réactions) sous forme de
    champs typés au lieu de les concaténer dans une chaîne de prompt. L’assistant
    `formatAgentEnvelope(...)` reste pris en charge pour les enveloppes synthétisées orientées assistant,
    mais les enveloppes entrantes en texte brut sont en voie de disparition.

    Zones concernées : `inbound_claim`, `message_received` et tout Plugin de
    canal personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="types de découverte de fournisseur → types de catalogue de fournisseur">
    Quatre alias de type de découverte sont maintenant de fines enveloppes autour des
    types de l’ère catalogue :

    | Ancien alias                 | Nouveau type              |
    | ---------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`     | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`   | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`    | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`    | `ProviderPluginCatalog`   |

    Plus l’ancien sac statique `ProviderCapabilities` — les Plugins fournisseurs
    doivent attacher les faits de capacité via le contrat de runtime fournisseur
    plutôt qu’un objet statique.

  </Accordion>

  <Accordion title="hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks séparés sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l’`id` canonique, un `label` optionnel et
    une liste de niveaux classés. OpenClaw rétrograde automatiquement les anciennes
    valeurs stockées selon le rang du profil.

    Implémentez un seul hook au lieu de trois. Les hooks historiques continuent de fonctionner pendant
    la fenêtre de dépréciation mais ne sont pas composés avec le résultat du profil.

  </Accordion>

  <Accordion title="fallback OAuth de fournisseur externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans
    déclarer le fournisseur dans le manifeste du Plugin.

    **Nouveau** : déclarer `contracts.externalAuthProviders` dans le manifeste du Plugin
    **et** implémenter `resolveExternalAuthProfiles(...)`. L’ancien chemin de
    « fallback auth » émet un avertissement au runtime et sera supprimé.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="recherche de variables d’environnement de fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : répliquez la même recherche de variable d’environnement dans `setup.providers[].envVars`
    du manifeste. Cela consolide les métadonnées d’environnement setup/status en un
    seul endroit et évite de démarrer le runtime du Plugin uniquement pour répondre aux
    recherches de variables d’environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu’à la fin de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="enregistrement de Plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels séparés —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un seul appel sur l’API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, appel d’enregistrement unique. Les assistants mémoire additifs
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas concernés.

  </Accordion>

  <Accordion title="types de messages de session de sous-agent renommés">
    Deux alias de type historiques sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                        | Nouveau                           |
    | ----------------------------- | --------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    La méthode runtime `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l’ancienne méthode appelle la
    nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur TaskFlow actif.

    **Nouveau** : `runtime.tasks.flows` (pluriel) renvoie un accès TaskFlow fondé sur des DTO,
    sûr à l’import et qui ne nécessite pas le chargement du runtime complet des tâches.

    ```typescript
    // Avant
    const flow = api.runtime.tasks.flow(ctx);
    // Après
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="fabriques d’extension intégrée → middleware de résultat d’outil agent">
    Couvert ci-dessus dans « Comment migrer → Migrer les extensions Pi de résultat d’outil vers un middleware ». Inclus ici pour exhaustivité : l’ancien chemin uniquement Pi
    `api.registerEmbeddedExtensionFactory(...)`, désormais supprimé, est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste explicite de runtimes dans
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est désormais un
    alias d’une ligne pour `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Avant
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Après
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations au niveau extension (à l’intérieur des Plugins de canal/fournisseur intégrés sous
`extensions/`) sont suivies dans leurs propres barrels `api.ts` et `runtime-api.ts`.
Elles n’affectent pas les contrats des Plugins tiers et ne sont pas listées
ici. Si vous consommez directement le barrel local d’un Plugin intégré, lisez les
commentaires de dépréciation dans ce barrel avant de mettre à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe |
| ---------------------- | --------------- |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements au runtime |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins core ont déjà été migrés. Les Plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Lié

- [Premiers pas](/fr/plugins/building-plugins) — créer votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des Plugins de canal
- [Plugins fournisseurs](/fr/plugins/sdk-provider-plugins) — créer des Plugins fournisseurs
- [Internes des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) — référence du schéma de manifeste
