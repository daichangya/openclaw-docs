---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un Plugin vers l’architecture moderne de plugins
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche de compatibilité descendante héritée vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-04-24T07:23:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw est passé d’une couche large de compatibilité descendante à une architecture moderne de plugins
avec des imports ciblés et documentés. Si votre Plugin a été construit avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer
tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour garder les anciens plugins basés sur hooks fonctionnels pendant la construction de la
  nouvelle architecture de plugins.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme l’exécuteur d’agent embarqué.

Ces deux surfaces sont maintenant **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans le même
changement qui introduit un remplacement. Les changements de contrat cassants doivent d’abord passer
par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports SDK, champs de manifest, API de configuration, hooks et au comportement d’enregistrement à l’exécution.

<Warning>
  La couche de compatibilité descendante sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces casseront lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait problème :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface API floue** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le SDK Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les couches de commodité héritées des fournisseurs pour les canaux intégrés ont également disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les couches d’assistance marquées au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats stables de Plugin. Utilisez à la place des sous-chemins génériques étroits du SDK. À l’intérieur de
l’espace de travail du Plugin intégré, gardez les helpers détenus par le fournisseur dans le propre
`api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic garde les helpers de flux spécifiques à Claude dans sa propre couche `api.ts` /
  `contract-api.ts`
- OpenAI garde les constructeurs de fournisseur, les helpers de modèle par défaut, et les constructeurs
  de fournisseur temps réel dans son propre `api.ts`
- OpenRouter garde le constructeur de fournisseur et les helpers d’onboarding/configuration dans son propre
  `api.ts`

## Politique de compatibilité

Pour les plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. garder l’ancien comportement câblé via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer seulement après la fenêtre de migration annoncée, généralement dans une version majeure

Si un champ de manifest est encore accepté, les auteurs de plugins peuvent continuer à l’utiliser jusqu’à ce
que la documentation et les diagnostics indiquent le contraire. Le nouveau code doit préférer le remplacement documenté, mais les plugins existants ne doivent pas casser pendant les versions mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires approval-native vers des faits de capacité">
    Les plugins de canal capables d’approbation exposent maintenant le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte d’exécution.

    Changements clés :

    - Remplacer `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacer l’authentification/la livraison propres aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste pour les flux de connexion/déconnexion du canal uniquement ; les
      hooks d’authentification d’approbation à cet endroit ne sont plus lus par le cœur
    - Enregistrer les objets d’exécution détenus par le canal tels que clients, jetons ou apps
      Bolt via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage détenus par le Plugin depuis des gestionnaires d’approbation natifs ;
      le cœur possède maintenant les avis routés ailleurs issus des résultats réels de livraison
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      véritable surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la
    capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais en mode sécurisé par défaut, sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définissez ceci que pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement le repli médié par shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli shell, ne définissez pas
    `allowShellFallback` et gérez l’erreur levée à la place.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre Plugin les imports depuis l’une ou l’autre des surfaces obsolètes :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Avant (couche de compatibilité descendante obsolète)
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

    Pour les helpers côté hôte, utilisez le runtime de Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même motif s’applique aux autres helpers de pont hérités :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de stockage de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Table commune des chemins d’import">
  | Chemin d’import | But | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper d’entrée de Plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation globale héritée pour les définitions/constructeurs d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et constructeurs ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts de liste blanche, constructeurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers d’exécution au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-compte | Helpers de liste/configuration/action-gate de compte |
  | `plugin-sdk/account-id` | Helpers d’ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’ID de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte étroits | Helpers de liste de compte/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructeurs de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration de commande Telegram | Normalisation de nom de commande, troncature de description, validation de doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de cycle de vie d’état de compte et de flux draft | `createAccountStatusSink`, helpers de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de construction de route + enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de dispatch |
  | `plugin-sdk/messaging-targets` | Analyse de cible de messagerie | Helpers d’analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé de médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers d’exécution sortante | Helpers d’identité/de délégation d’envoi sortants et de planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Helpers de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Constructeur de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers larges d’exécution | Helpers d’exécution/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Helpers étroits d’environnement d’exécution | Helpers de logger/environnement d’exécution, délai d’expiration, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés d’exécution de Plugin | Helpers de commandes/hooks/http/interactif de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers d’exécution CLI | Formatage de commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Helpers de client gateway et de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commande Telegram à repli stable lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Charge utile d’approbation exec/plugin, helpers de capacité/profil d’approbation, helpers natifs de routage/exécution d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution des approbateurs, auth d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de gateway d’approbation | Helper partagé de résolution gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal chauds |
  | `plugin-sdk/approval-handler-runtime` | Helpers de gestionnaire d’approbation | Helpers plus larges d’exécution de gestionnaire d’approbation ; préférez les couches plus étroites adapter/gateway lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de cible d’approbation/liaison de compte |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte d’exécution de canal | Helpers génériques d’enregistrement/récupération/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste blanche d’hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers d’exécution SSRF | Helpers de pinned-dispatcher, récupération protégée, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreur |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste blanche | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping d’entrée de liste blanche | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage de commande et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation d’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide de commande | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse d’entrée secrète | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée de réponse | Dispatch entrant, Heartbeat, planificateur de réponse, segmentation |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de dispatch de réponse | Helpers de finalisation + dispatch fournisseur |
  | `plugin-sdk/reply-history` | Helpers d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de segmentation de réponse | Helpers de segmentation texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de stockage de session | Helpers de chemin de stockage + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et d’OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Constructeurs de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolveur de cible | Helpers partagés de résolveur de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne à partir d’entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées d’objets résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi à partir des arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de caviardage |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers ciblés de configuration de fournisseur local/auto-hébergé | Helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur auto-hébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification fournisseur à l’exécution | Helpers de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API fournisseur | Helpers d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification fournisseur | Constructeur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Helpers de sélection de fournisseur | Sélection de fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement fournisseur | Helpers de recherche de variables d’environnement d’authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers de point de terminaison fournisseur, et helpers de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patches d’onboarding fournisseur | Helpers de configuration d’onboarding |
| `plugin-sdk/provider-http` | Helpers HTTP fournisseur | Helpers génériques HTTP/capacités de point de terminaison fournisseur, y compris les helpers de formulaire multipart pour transcription audio |
| `plugin-sdk/provider-web-fetch` | Helpers web-fetch fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration web-search fournisseur | Helpers étroits de configuration/web-search/identifiants pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
| `plugin-sdk/provider-web-search-contract` | Helpers de contrat web-search fournisseur | Helpers étroits de contrat de configuration/web-search/identifiants tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants limités par périmètre |
| `plugin-sdk/provider-web-search` | Helpers web-search fournisseur | Helpers d’enregistrement/cache/exécution de fournisseur web-search |
| `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helpers d’utilisation fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d’utilisation fournisseur |
| `plugin-sdk/provider-stream` | Helpers d’enrobage de flux fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enrobage de flux, et helpers partagés d’enrobage Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helpers de transport fournisseur | Helpers natifs de transport fournisseur tels que récupération protégée, transformations de messages de transport, et flux d’événements de transport inscriptibles |
| `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage média plus constructeurs de charge utile média |
| `plugin-sdk/media-generation-runtime` | Helpers partagés de génération média | Helpers partagés de basculement, sélection de candidats, et messagerie de modèle manquant pour la génération d’image/vidéo/musique |
| `plugin-sdk/media-understanding` | Helpers de compréhension média | Types de fournisseur de compréhension média plus exportations d’helpers image/audio orientées fournisseur |
| `plugin-sdk/text-runtime` | Helpers texte partagés | Retrait du texte visible par l’assistant, helpers de rendu/segmentation/tableau Markdown, helpers de caviardage, helpers de balises de directive, utilitaires de texte sûr, et helpers associés de texte/journalisation |
| `plugin-sdk/text-chunking` | Helpers de segmentation de texte | Helper de segmentation de texte sortant |
| `plugin-sdk/speech` | Helpers de parole | Types de fournisseur de parole plus helpers orientés fournisseur pour directives, registre et validation |
| `plugin-sdk/speech-core` | Cœur partagé de parole | Types de fournisseur de parole, registre, directives, normalisation |
| `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Types de fournisseur, helpers de registre, et helper partagé de session WebSocket |
| `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Types de fournisseur, helpers de registre/résolution, et helpers de session bridge |
| `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, helpers de basculement, d’authentification et de registre |
| `plugin-sdk/music-generation` | Helpers de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
| `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
| `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
| `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
| `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
| `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives étroites de schéma de configuration de canal |
| `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
| `plugin-sdk/channel-plugin-common` | Prélude partagé de canal | Exportations de prélude partagé de plugin de canal |
| `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/résumé d’état de canal |
| `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste blanche | Helpers d’édition/lecture de configuration de liste blanche |
| `plugin-sdk/group-access` | Helpers d’accès groupe | Helpers partagés de décision d’accès groupe |
| `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/garde DM direct |
| `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitives passives d’aide de canal/état et de proxy ambiant |
| `plugin-sdk/webhook-targets` | Helpers de cible webhook | Registre de cible webhook et helpers d’installation de route |
| `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
| `plugin-sdk/web-media` | Helpers média web partagés | Helpers de chargement média distant/local |
| `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du SDK Plugin |
| `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface d’assistance memory manager/config/fichier/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur mémoire | Façade d’exécution index/search de mémoire |
| `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation hôte mémoire | Exportations du moteur fondation hôte mémoire |
| `plugin-sdk/memory-core-host-engine-embeddings` | Moteur embeddings hôte mémoire | Contrats d’embedding mémoire, accès registre, fournisseur local, et helpers génériques batch/distants ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
| `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte mémoire | Exportations du moteur QMD hôte mémoire |
| `plugin-sdk/memory-core-host-engine-storage` | Moteur stockage hôte mémoire | Exportations du moteur stockage hôte mémoire |
| `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire | Helpers multimodaux hôte mémoire |
| `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire | Helpers de requête hôte mémoire |
| `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte mémoire | Helpers de secret hôte mémoire |
| `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte mémoire | Helpers de journal d’événements hôte mémoire |
| `plugin-sdk/memory-core-host-status` | Helpers d’état hôte mémoire | Helpers d’état hôte mémoire |
| `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI hôte mémoire | Helpers d’exécution CLI hôte mémoire |
| `plugin-sdk/memory-core-host-runtime-core` | Exécution core hôte mémoire | Helpers d’exécution core hôte mémoire |
| `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/exécution hôte mémoire | Helpers de fichier/exécution hôte mémoire |
| `plugin-sdk/memory-host-core` | Alias d’exécution core hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’exécution core hôte mémoire |
| `plugin-sdk/memory-host-events` | Alias de journal d’événements hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte mémoire |
| `plugin-sdk/memory-host-files` | Alias de fichier/exécution hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/exécution hôte mémoire |
| `plugin-sdk/memory-host-markdown` | Helpers Markdown gérés | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
| `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche active-memory |
| `plugin-sdk/memory-host-status` | Alias d’état hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte mémoire |
| `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface d’assistance memory-lancedb |
| `plugin-sdk/testing` | Utilitaires de test | Helpers de test et mocks |
</Accordion>

Ce tableau est volontairement le sous-ensemble commun de migration, et non la surface complète du SDK.
La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines couches d’assistance pour plugins intégrés telles que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Elles restent exportées pour la
maintenance et la compatibilité des plugins intégrés, mais sont volontairement
omises du tableau commun de migration et ne constituent pas la cible recommandée pour
du nouveau code de Plugin.

La même règle s’applique aux autres familles de helpers intégrés telles que :

- helpers de prise en charge navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces d’assistance/plugin intégrées telles que `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite d’assistance de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit qui corresponde à la tâche. Si vous ne trouvez pas un export,
vérifiez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution       |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins core ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Lié

- [Prise en main](/fr/plugins/building-plugins) — créer votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins fournisseur](/fr/plugins/sdk-provider-plugins) — créer des plugins fournisseur
- [Internals des plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifest de Plugin](/fr/plugins/manifest) — référence du schéma de manifest
