---
read_when:
    - Vous voyez l’avertissement `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Vous voyez l’avertissement `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez de la couche de rétrocompatibilité héritée vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-19T01:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0df202ed35b3e72bfec1d23201d0e83294fe09cec2caf6e276835098491a899
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de Plugin moderne avec des imports ciblés et documentés. Si votre Plugin a été créé avant la nouvelle architecture, ce guide vous aide à le migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de helpers. Il a été introduit pour que les anciens Plugins basés sur des hooks continuent de fonctionner pendant la construction de la nouvelle architecture de Plugin.
- **`openclaw/extension-api`** — un pont qui donnait aux Plugins un accès direct à des helpers côté hôte, comme l’exécuteur d’agent embarqué.

Ces deux surfaces sont maintenant **dépréciées**. Elles fonctionnent encore à l’exécution, mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants doivent migrer avant que la prochaine version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules non liés
- **Dépendances circulaires** — de larges réexportations facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le Plugin SDK moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les points d’entrée pratiques hérités des fournisseurs pour les canaux intégrés ont également disparu. Des imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les points d’entrée de helpers associés à une marque de canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, et non
des contrats de Plugin stables. Utilisez à la place des sous-chemins étroits et génériques du SDK. À l’intérieur de l’espace de travail des Plugins intégrés, conservez les helpers propres au fournisseur dans le `api.ts` ou le `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans son propre point d’entrée `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les helpers de modèle par défaut et les builders de fournisseur en temps réel
  dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les helpers d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les handlers natifs d’approbation vers des faits de capacité">
    Les Plugins de canal capables de gérer des approbations exposent désormais le comportement natif d’approbation via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte d’exécution.

    Principaux changements :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison spécifiques aux approbations hors de l’ancien câblage `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public des Plugins de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste utilisé uniquement pour les flux de connexion/déconnexion du canal ; les hooks
      d’authentification d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets d’exécution possédés par le canal, comme les clients, tokens ou applications Bolt,
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de redirection possédés par le Plugin depuis les handlers natifs d’approbation ;
      le cœur gère désormais les avis redirigés ailleurs à partir des résultats réels de livraison
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      véritable surface `createPluginRuntime().channel`. Les stubs partiels sont refusés.

    Consultez `/plugins/sdk-channel-plugins` pour la structure actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais en mode fermé, sauf si vous passez explicitement `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Définissez ceci uniquement pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement un repli médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement d’un repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Rechercher les imports dépréciés">
    Recherchez dans votre Plugin les imports provenant de l’une ou l’autre surface dépréciée :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque exportation de l’ancienne surface correspond à un chemin d’import moderne spécifique :

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

    Pour les helpers côté hôte, utilisez l’exécution de Plugin injectée au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api déprécié)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers hérités du pont :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers du magasin de sessions | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’importation

  <Accordion title="Tableau courant des chemins d’importation">
  | Chemin d’importation | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonique de point d’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation omnibus héritée pour les définitions/builders de points d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de point d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés de points d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers de runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à importer, helpers de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste de comptes/configuration/contrôle d’actions |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de résolution de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes/actions de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse + câblage de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation de nom de commande, rognage de description, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi de l’état du compte | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de dispatch |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance de cibles |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers de runtime sortant | Helpers de délégation d’identité/d’envoi sortants |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de thread | Helpers de cycle de vie et d’adaptateur de liaison de thread |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de payload média | Builder de payload média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité déprécié | Utilitaires hérités de runtime de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers généraux de runtime | Helpers de runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement de runtime | Helpers de logger/environnement de runtime, temporisation, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés de runtime de Plugin | Helpers de commandes/hooks/http/interactif de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers de runtime CLI | Helpers de formatage de commandes, attentes, versions |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helpers de client Gateway et de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commandes Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Helpers de payload d’approbation exec/Plugin, de capacité/profil d’approbation, de routage/runtime natifs d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution d’approbateur, authentification d’action dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur natif d’approbation pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler d’approbation | Helpers plus larges de runtime de handler d’approbation ; préférez les points d’entrée plus ciblés d’adaptateur/Gateway lorsqu’ils suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de payload de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte de runtime de canal | Helpers génériques d’enregistrement/récupération/surveillance du contexte de runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, contrôle DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers de runtime SSRF | Helpers de dispatcher épinglé, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de contrôle diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d’entrée de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Contrôle des commandes et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation de l’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Renderers d’état/d’aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête Webhook | Helpers de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé des réponses | Dispatch entrant, Heartbeat, planificateur de réponse, segmentation |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de dispatch des réponses | Helpers de finalisation + dispatch fournisseur |
  | `plugin-sdk/reply-history` | Helpers d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de segmentation des réponses | Helpers de segmentation texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de stockage + date de mise à jour |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Builders de résumé d’état de canal/compte, valeurs par défaut d’état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaînes | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL de chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de payload d’outil | Extraire des payloads normalisés depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de masquage |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de payload de réponse |
  | `plugin-sdk/provider-setup` | Helpers organisés de configuration de fournisseur local/autohébergé | Helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification runtime de fournisseur | Helpers de résolution runtime de clé API |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API de fournisseur | Helpers d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification de fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive de fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement de fournisseur | Helpers de recherche de variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/rejeu de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de rejeu, helpers de point d’entrée de fournisseur et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’onboarding de fournisseur | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de fournisseur | Helpers génériques HTTP/capacités de point d’entrée de fournisseur |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch de fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web de fournisseur | Helpers ciblés de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web de fournisseur | Helpers ciblés de contrat de configuration/identifiants de recherche web, comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web de fournisseur | Helpers d’enregistrement/cache/runtime de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres helpers d’usage de fournisseur |
  | `plugin-sdk/provider-stream` | Helpers d’encapsulation de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’encapsulation de flux, et helpers partagés d’encapsulation Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport de fournisseur | Helpers natifs de transport de fournisseur, comme fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage de médias ainsi que builders de payload média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de médias | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de fournisseur de compréhension des médias ainsi qu’exportations de helpers image/audio orientées fournisseur |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression du texte visible par l’assistant, helpers de rendu/segmentation/tableau Markdown, helpers de masquage, helpers de balises de directive, utilitaires de texte sûr et autres helpers liés au texte/à la journalisation |
  | `plugin-sdk/text-chunking` | Helpers de segmentation de texte | Helper de segmentation de texte sortant |
  | `plugin-sdk/speech` | Helpers Speech | Types de fournisseur Speech ainsi que helpers orientés fournisseur pour directives, registre et validation |
  | `plugin-sdk/speech-core` | Cœur Speech partagé | Types de fournisseur Speech, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’images | Types de génération d’images, helpers de basculement, d’authentification et de registre |
  | `plugin-sdk/music-generation` | Helpers de génération de musique | Types de fournisseur/requête/résultat de génération de musique |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération de musique | Types de génération de musique, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération de vidéo | Types de fournisseur/requête/résultat de génération de vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération de vidéo | Types de génération de vidéo, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de payload de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Préambule partagé de canal | Exportations partagées du préambule de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés de snapshot/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d’autorisation | Helpers de lecture/édition de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/garde de DM direct |
  | `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitives de helpers de canal passif/état et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible Webhook | Helpers de registre de cible Webhook et d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin Webhook | Helpers de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Helpers web média partagés | Helpers de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface de helpers du gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur de mémoire | Façade runtime d’indexation/recherche de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation hôte de mémoire | Exportations du moteur fondation hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings hôte de mémoire | Contrats d’embeddings de mémoire, accès au registre, fournisseur local et helpers génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte de mémoire | Exportations du moteur QMD hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte de mémoire | Exportations du moteur de stockage hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôtes de mémoire | Helpers multimodaux hôtes de mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte de mémoire | Helpers de requête hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte de mémoire | Helpers de secret hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte de mémoire | Helpers de journal d’événements hôte de mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état hôte de mémoire | Helpers d’état hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte de mémoire | Helpers de runtime CLI hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur hôte de mémoire | Helpers de runtime cœur hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers fichier/runtime hôte de mémoire | Helpers fichier/runtime hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de runtime cœur hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias journal d’événements hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers fichier/runtime hôte de mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers Markdown gérés | Helpers partagés de Markdown géré pour les Plugins proches de la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade runtime paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte de mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers de test et mocks |
</Accordion>

Ce tableau correspond intentionnellement au sous-ensemble courant de migration, et non à la
surface complète du SDK. La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certains points d’entrée de helpers de Plugins intégrés, tels que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ils restent exportés pour la
maintenance et la compatibilité des Plugins intégrés, mais ils sont volontairement
omis du tableau courant de migration et ne constituent pas la cible recommandée pour
le nouveau code de Plugin.

La même règle s’applique à d’autres familles de helpers intégrés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helpers/Plugins intégrés comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus ciblé qui correspond au besoin. Si vous ne trouvez pas une exportation,
consultez le code source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces dépréciées émettent des avertissements à l’exécution |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins du cœur ont déjà été migrés. Les Plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, et non d’une solution permanente.

## Voir aussi

- [Premiers pas](/fr/plugins/building-plugins) — créez votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de Plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de Plugins de fournisseur
- [Internes des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) — référence du schéma du manifeste
