---
read_when:
    - Vous voyez l'avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l'avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l'architecture de plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez de la couche héritée de rétrocompatibilité vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b71ce69b30c3bb02da1b263b1d11dc3214deae5f6fc708515e23b5a1c7bb7c8f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d'une large couche de rétrocompatibilité à une architecture
de plugin moderne avec des imports ciblés et documentés. Si votre plugin a été créé avant
la nouvelle architecture, ce guide vous aidera à migrer.

## Ce qui change

L'ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d'importer
tout ce dont ils avaient besoin depuis un point d'entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour permettre aux anciens plugins basés sur des hooks de continuer à fonctionner pendant la construction de la
  nouvelle architecture de plugins.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme l'exécuteur d'agent intégré.

Ces deux surfaces sont désormais **dépréciées**. Elles fonctionnent encore à l'exécution, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L'ancienne approche causait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d'import
- **Surface d'API peu claire** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le Plugin SDK moderne corrige cela : chaque chemin d'import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les interfaces de commodité héritées des fournisseurs pour les canaux intégrés ont également disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les interfaces helper marquées au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats de plugin stables. Utilisez à la place des sous-chemins génériques étroits du SDK. Dans le
workspace des plugins intégrés, gardez les helpers appartenant au fournisseur dans le propre
`api.ts` ou `runtime-api.ts` de ce plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre interface `api.ts` /
  `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseurs, les helpers de modèle par défaut et les constructeurs de fournisseurs
  temps réel dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les helpers d'onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
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
      // Ne le définissez que pour des appelants de compatibilité de confiance qui
      // acceptent intentionnellement le repli médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli shell, ne définissez pas
    `allowShellFallback` et gérez l'erreur levée à la place.

  </Step>

  <Step title="Trouver les imports dépréciés">
    Recherchez dans votre plugin les imports provenant de l'une ou l'autre surface dépréciée :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque exportation de l'ancienne surface correspond à un chemin d'import moderne spécifique :

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

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d'importer
    directement :

    ```typescript
    // Avant (pont extension-api déprécié)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s'applique aux autres helpers de pont hérités :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de magasin de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d'import

<Accordion title="Tableau des chemins d'import courants">
  | Chemin d'import | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonique de point d'entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/builders d'entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de point d'entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés pour les entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés de l'assistant de configuration | Invites d'allowlist, builders d'état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à importer, helpers de note de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d'adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d'outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste de comptes/configuration/action-gate |
  | `plugin-sdk/account-id` | Helpers d'ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation d'ID de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte étroits | Helpers de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d'assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitifs d'appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse + câblage de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d'adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration de commande Telegram | Normalisation de noms de commande, réduction de descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi d'état de compte | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d'enveloppe entrante | Helpers partagés de route + builder d'enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d'enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d'analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers runtime sortants | Helpers d'identité sortante/délégué d'envoi |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Cycle de vie des liaisons de fil et helpers d'adaptateur |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de payload média | Builder de payload média agent pour les anciennes dispositions de champs |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité déprécié | Utilitaires hérités du runtime de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d'envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant des plugins | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers runtime larges | Helpers de runtime/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers étroits d'environnement runtime | Logger/env runtime, timeout, retry et helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers runtime partagés de plugin | Helpers de plugin pour commandes/hooks/http/interaction |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers partagés de pipeline de hooks webhook/internes |
  | `plugin-sdk/lazy-runtime` | Helpers runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d'exécution |
  | `plugin-sdk/cli-runtime` | Helpers runtime CLI | Formatage de commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers de passerelle | Client passerelle et helpers de patch d'état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commande Telegram avec repli stable lorsque la surface de contrat Telegram intégrée est indisponible |
  | `plugin-sdk/approval-runtime` | Helpers d'invite d'approbation | Payload d'approbation exec/plugin, helpers de capacité/profil d'approbation, helpers runtime/routage d'approbation natifs |
  | `plugin-sdk/approval-auth-runtime` | Helpers d'authentification d'approbation | Résolution d'approbateur, auth d'action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d'approbation | Helpers de profil/filtre d'approbation exec natifs |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d'approbation | Adaptateurs de capacité/livraison d'approbation natifs |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d'approbation | Helpers natifs de cible d'approbation/liaison de compte |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d'approbation | Helpers de payload de réponse d'approbation exec/plugin |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers d'allowlist d'hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Dispatcher épinglé, fetch protégé, helpers de politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage des diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d'erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d'erreur |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d'hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage d'allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d'entrée d'allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de filtrage de commandes et de surface de commande | `resolveControlCommandGate`, helpers d'autorisation d'expéditeur, helpers de registre de commandes |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d'entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime de réponse partagé | Distribution entrante, heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de distribution de réponse | Helpers de finalisation + distribution fournisseur |
  | `plugin-sdk/reply-history` | Helpers d'historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage de réponse | Helpers de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d'état | Helpers de répertoires d'état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d'état de canal | Builders de résumé d'état de canal/compte, valeurs par défaut d'état runtime, helpers de métadonnées d'incident |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaînes | Helpers de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d'URL de requête | Extraire des URL chaîne à partir d'entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres courants d'outil/CLI |
  | `plugin-sdk/tool-send` | Extraction d'envoi d'outil | Extraire les champs de cible d'envoi canoniques à partir d'arguments d'outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de payload de réponse |
  | `plugin-sdk/provider-setup` | Helpers ciblés de configuration de fournisseur local/auto-hébergé | Helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur auto-hébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d'authentification runtime de fournisseur | Helpers runtime de résolution de clé API |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API fournisseur | Helpers d'onboarding/écriture de profil pour clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d'authentification fournisseur | Builder standard de résultat d'authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive de fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d'environnement de fournisseur | Helpers de recherche de variables d'environnement d'authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de relecture, helpers d'endpoint fournisseur, et helpers de normalisation d'ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d'onboarding fournisseur | Helpers de configuration d'onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP de fournisseur | Helpers génériques de capacité HTTP/endpoint fournisseur |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch fournisseur | Helpers d'enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search` | Helpers web-search fournisseur | Helpers d'enregistrement/cache/configuration de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d'utilisation fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d'utilisation fournisseur |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de flux fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrapper de flux, et helpers partagés de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers médias partagés | Helpers de récupération/transformation/stockage de médias plus builders de payload média |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de fournisseur de compréhension des médias plus exportations helper d'image/audio orientées fournisseur |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression de texte visible par l'assistant, helpers de rendu/découpage/tableau markdown, helpers de rédaction, helpers de balise de directive, utilitaires de texte sûr, et helpers liés au texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de découpage de texte | Helper de découpage de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de fournisseur de parole plus helpers orientés fournisseur pour directives, registre et validation |
  | `plugin-sdk/speech-core` | Cœur partagé de parole | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d'image | Types, bascule, auth et helpers de registre pour génération d'image |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types de fournisseur/demande/résultat pour génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, helpers de bascule, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/demande/résultat pour génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de bascule, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de payload de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitifs de configuration de canal | Primitifs étroits de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d'écriture de configuration de canal | Helpers d'autorisation d'écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exportations de prélude partagé pour plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d'état de canal | Helpers partagés d'instantané/résumé d'état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration d'allowlist | Helpers d'édition/lecture de configuration d'allowlist |
  | `plugin-sdk/group-access` | Helpers d'accès de groupe | Helpers partagés de décision d'accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d'authentification/garde pour DM direct |
  | `plugin-sdk/extension-shared` | Helpers partagés d'extension | Primitifs helper de canal passif/état |
  | `plugin-sdk/webhook-targets` | Helpers de cible webhook | Registre de cibles webhook et helpers d'installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
  | `plugin-sdk/web-media` | Helpers médias web partagés | Helpers de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface helper memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur mémoire | Façade runtime d'index/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation hôte mémoire | Exportations du moteur de fondation hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d'embeddings hôte mémoire | Exportations du moteur d'embeddings hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte mémoire | Exportations du moteur QMD hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte mémoire | Exportations du moteur de stockage hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire | Helpers multimodaux hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire | Helpers de requête hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte mémoire | Helpers de secret hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d'état hôte mémoire | Helpers d'état hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte mémoire | Helpers runtime CLI hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur hôte mémoire | Helpers runtime cœur hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime hôte mémoire | Helpers de fichier/runtime hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau correspond intentionnellement au sous-ensemble courant de migration, et non à la surface complète du SDK.
La liste complète des plus de 200 points d'entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines interfaces helper de plugins intégrés telles que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Elles restent exportées pour
la maintenance et la compatibilité des plugins intégrés, mais elles sont volontairement
omises du tableau de migration courant et ne sont pas la cible recommandée pour
le nouveau code de plugin.

La même règle s'applique aux autres familles de helpers intégrés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces helper/plugin intégrées comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken`.

Utilisez l'import le plus étroit correspondant au besoin. Si vous ne trouvez pas une exportation,
vérifiez la source dans `src/plugin-sdk/` ou posez la question sur Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces dépréciées émettent des avertissements à l'exécution |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d'environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s'agit d'une échappatoire temporaire, pas d'une solution permanente.

## Connexe

- [Getting Started](/fr/plugins/building-plugins) — créez votre premier plugin
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
- [Plugin Internals](/fr/plugins/architecture) — analyse approfondie de l'architecture
- [Plugin Manifest](/fr/plugins/manifest) — référence du schéma de manifeste
