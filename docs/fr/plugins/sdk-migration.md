---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l’architecture de plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche de rétrocompatibilité héritée vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-21T07:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugin moderne
avec des imports ciblés et documentés. Si votre plugin a été construit avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer
tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour maintenir le fonctionnement des anciens plugins à hooks pendant que la
  nouvelle architecture de plugin était en cours de construction.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme le runner d’agent embarqué.

Ces deux surfaces sont maintenant **dépréciées**. Elles fonctionnent encore au runtime, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait problème :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules non liés
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le Plugin SDK moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les seams de commodité hérités pour les fournisseurs des canaux intégrés ont également disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les seams de helpers marqués au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, et non
des contrats stables de plugin. Utilisez à la place des sous-chemins étroits et génériques du SDK. Dans
l’espace de travail du plugin intégré, conservez les helpers gérés par le fournisseur dans le
`api.ts` ou `runtime-api.ts` propre à ce plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans son propre seam `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les helpers de modèle par défaut et les builders de fournisseur temps réel
  dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les helpers d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires natifs d’approbation vers les faits de capacité">
    Les plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte runtime.

    Principaux changements :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison spécifiques aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public du plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste pour les flux de connexion/déconnexion des canaux uniquement ; les hooks
      d’authentification d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets runtime gérés par le canal tels que clients, jetons ou applications Bolt
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage gérés par le plugin depuis les gestionnaires d’approbation natifs ;
      le cœur gère désormais les avis routés ailleurs à partir des résultats réels de livraison
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais en mode fermé sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définir cela que pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement un repli médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement d’un repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports dépréciés">
    Recherchez dans votre plugin les imports depuis l’une ou l’autre surface dépréciée :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité dépréciée)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Après (imports modernes ciblés)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api déprécié)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers hérités du pont :

    | Old import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers du magasin de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Tableau des chemins d’import courants">
  | Import path | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonique de point d’entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation globale héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de point d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à importer, helpers de note de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/actions de comptes |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation des identifiants de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes/actions de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + indicateur de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation des noms de commande, réduction des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi d’état des comptes | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + de construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Helpers de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers runtime sortants | Helpers d’identité/délégation d’envoi sortant et de planification de payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de threads | Helpers de cycle de vie et d’adaptateur des liaisons de threads |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de payload média | Builder de payload média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité déprécié | Utilitaires runtime de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers runtime larges | Helpers runtime/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement runtime | Helpers de logger/environnement runtime, timeout, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers runtime partagés de plugin | Helpers de commandes/hooks/http/interactif de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers partagés de pipeline Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers runtime CLI | Formatage des commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helpers de client Gateway et de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commandes Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram intégrée est indisponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompts d’approbation | Helpers de payload d’approbation exec/plugin, helpers de capacité/profil d’approbation, helpers runtime/de routage d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution des approbateurs, authentification d’action dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Helpers client d’approbation | Helpers de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Helpers de gestionnaire d’approbation | Helpers runtime plus larges de gestionnaire d’approbation ; préférez les seams plus étroits d’adaptateur/Gateway lorsqu’ils suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de payload de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte runtime de canal | Helpers génériques d’enregistrement/récupération/surveillance de contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, de gate DM, de contenu externe et de collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d’autorisation d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Helpers de répartiteur épinglé, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gate de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage des entrées de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gate de commandes et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation de l’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/d’aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requêtes Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête Webhook | Helpers de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Répartition entrante, Heartbeat, planificateur de réponse, découpage en blocs |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de répartition de réponse | Helpers de finalisation + répartition fournisseur |
  | `plugin-sdk/reply-history` | Helpers d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage de réponse | Helpers de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Builders de résumé d’état canal/compte, valeurs par défaut d’état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaînes | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de payload d’outil | Extraire des payloads normalisés depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs cibles canoniques d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de payload de réponse |
  | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseur local/autohébergé | Helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification runtime de fournisseur | Helpers de résolution de clé API runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API de fournisseur | Helpers d’onboarding/écriture de profil pour clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification de fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive de fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement de fournisseur | Helpers de recherche des variables d’environnement d’authentification de fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/rejeu de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de rejeu, helpers de point de terminaison de fournisseur et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’onboarding de fournisseur | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de fournisseur | Helpers génériques HTTP/de capacité de point de terminaison de fournisseur |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch de fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche Web de fournisseur | Helpers ciblés de configuration/identifiants de recherche Web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche Web de fournisseur | Helpers ciblés de contrat de configuration/identifiants de recherche Web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche Web de fournisseur | Helpers d’enregistrement/cache/runtime de fournisseur de recherche Web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité d’outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics des schémas Gemini, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d’usage de fournisseur |
  | `plugin-sdk/provider-stream` | Helpers d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et helpers d’enveloppe partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport de fournisseur | Helpers de transport natif de fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage média plus builders de payload média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération média | Helpers partagés de repli, sélection de candidats et messages de modèle manquant pour la génération d’images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension média | Types de fournisseurs de compréhension média plus exportations de helpers image/audio destinées aux fournisseurs |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression du texte visible par l’assistant, helpers de rendu/découpage/tableau Markdown, helpers de rédaction, helpers de balises de directive, utilitaires de texte sûr et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de découpage de texte | Helper de découpage de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de fournisseurs de parole plus helpers de directive, registre et validation destinés aux fournisseurs |
  | `plugin-sdk/speech-core` | Cœur partagé de la parole | Types de fournisseurs de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Types de fournisseurs et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Types de fournisseurs et helpers de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, helpers de repli, d’authentification et de registre |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types fournisseur/requête/résultat pour la génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, helpers de repli, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types fournisseur/requête/résultat pour la génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de repli, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de payload de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude partagé de canal | Exportations de prélude partagées de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d’autorisation | Helpers d’édition/lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/garde pour DM direct |
  | `plugin-sdk/extension-shared` | Helpers d’extension partagés | Primitives de canal/statut passif et helpers de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible Webhook | Helpers de registre de cible Webhook et d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin Webhook | Helpers de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Helpers média Web partagés | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers intégrés de memory-core | Surface de helpers du gestionnaire/configuration/fichier/CLI Memory |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur Memory | Façade runtime de l’index/de la recherche Memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation hôte Memory | Exportations du moteur fondation hôte Memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embedding hôte Memory | Contrats d’embedding Memory, accès au registre, fournisseur local et helpers génériques batch/distants ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte Memory | Exportations du moteur QMD hôte Memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte Memory | Exportations du moteur de stockage hôte Memory |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte Memory | Helpers multimodaux hôte Memory |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte Memory | Helpers de requête hôte Memory |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte Memory | Helpers de secret hôte Memory |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte Memory | Helpers de journal d’événements hôte Memory |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état hôte Memory | Helpers d’état hôte Memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte Memory | Helpers runtime CLI hôte Memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur hôte Memory | Helpers runtime cœur hôte Memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers fichier/runtime hôte Memory | Helpers fichier/runtime hôte Memory |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur hôte Memory | Alias neutre vis-à-vis du fournisseur pour les helpers runtime cœur hôte Memory |
  | `plugin-sdk/memory-host-events` | Alias journal d’événements hôte Memory | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte Memory |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime hôte Memory | Alias neutre vis-à-vis du fournisseur pour les helpers fichier/runtime hôte Memory |
  | `plugin-sdk/memory-host-markdown` | Helpers Markdown gérés | Helpers partagés de managed-markdown pour les plugins adjacents à Memory |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade runtime paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état hôte Memory | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte Memory |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés de memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers de test et mocks |
</Accordion>

Ce tableau correspond intentionnellement au sous-ensemble de migration courant, et non à la surface
complète du SDK. La liste complète de plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certains seams de helpers de plugins intégrés tels que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ils restent exportés pour la
maintenance et la compatibilité des plugins intégrés, mais sont volontairement
omis du tableau de migration courant et ne sont pas la cible recommandée pour
du nouveau code de plugin.

La même règle s’applique à d’autres familles de helpers intégrés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helper/plugin intégrées comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface ciblée de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit qui correspond à la tâche. Si vous ne trouvez pas une exportation,
vérifiez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements au runtime          |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Liens associés

- [Getting Started](/fr/plugins/building-plugins) — créer votre premier plugin
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
- [Plugin Internals](/fr/plugins/architecture) — plongée approfondie dans l’architecture
- [Plugin Manifest](/fr/plugins/manifest) — référence du schéma de manifeste
