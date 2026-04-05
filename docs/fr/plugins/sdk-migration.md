---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l’architecture de plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-05T12:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugin
moderne avec des imports ciblés et documentés. Si votre plugin a été construit avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer
tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour que les anciens plugins basés sur des hooks continuent de fonctionner pendant que la
  nouvelle architecture de plugin était en cours de construction.
- **`openclaw/extension-api`** — un pont donnant aux plugins un accès direct à
  des helpers côté hôte comme le runner d’agent intégré.

Ces deux surfaces sont maintenant **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules non liés
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface API peu claire** — impossible de savoir quelles exportations étaient stables ou internes

Le Plugin SDK moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec une finalité claire et un contrat documenté.

Les coutures de commodité héritées pour les fournisseurs de canaux intégrés ont aussi disparu. Les imports
comme `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les coutures de helpers de canal marquées à leur nom, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats de plugin stables. Utilisez plutôt des sous-chemins SDK génériques et étroits. À l’intérieur de
l’espace de travail des plugins intégrés, gardez les helpers propres au fournisseur dans le
`api.ts` ou `runtime-api.ts` de ce plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre couture `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de fournisseurs, les helpers de modèle par défaut et les builders de fournisseur realtime
  dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les helpers d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent maintenant de manière fermée sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne repose pas intentionnellement sur le repli du shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre plugin les imports depuis l’une ou l’autre surface obsolète :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque exportation de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d’un import
    direct :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
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
    | helpers de magasin de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build et test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

<Accordion title="Tableau des chemins d’import courants">
  | Chemin d’import | Finalité | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper d’entrée canonique du plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation umbrella héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée mono-fournisseur | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts allowlist, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, helpers de lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration délégués |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/action-gate de compte |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de résolution de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte étroits | Helpers de liste de compte/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse + câblage typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration de commandes Telegram | Normalisation des noms de commande, trimming des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi de l’état des comptes | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + builder d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de dispatch |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance de cibles |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers runtime sortants | Helpers de délégation d’identité/envoi sortants |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Helpers de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Builder de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Uniquement utilitaires runtime de canal hérités |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant du plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers runtime larges | Helpers runtime/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime | Logger/env runtime, timeout, retry et helpers de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés du runtime de plugin | Helpers de commandes/hooks/http/interactive de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hooks | Helpers partagés de pipeline de webhook/hooks internes |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exec |
  | `plugin-sdk/cli-runtime` | Helpers runtime CLI | Formatage des commandes, waits, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Client Gateway et helpers de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commandes Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers d’invite d’approbation | Charge utile d’approbation exec/plugin, helpers de capacité/profil d’approbation, helpers de routage/runtime d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution des approbateurs, auth d’action same-chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helpers d’envoi d’approbation | Adaptateurs de capacité/envoi d’approbation native |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, gating DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers d’allowlist d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Helpers de pinned-dispatcher, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de gating diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreur |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy enveloppés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage d’allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping d’entrée d’allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating de commande et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation d’expéditeur, helpers de registre de commande |
  | `plugin-sdk/secret-input` | Analyse d’entrée de secret | Helpers d’entrée de secret |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde de corps webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Dispatch entrant, heartbeat, planificateur de réponse, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de dispatch de réponse | Helpers de finalisation + dispatch fournisseur |
  | `plugin-sdk/reply-history` | Helpers d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de chunk de réponse | Helpers de chunking texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemin d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Builders de résumé/instantané d’état de canal/compte, valeurs par défaut d’état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs d’outil/CLI |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les args d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers ciblés de configuration de fournisseur local/auto-hébergé | Helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur auto-hébergé compatible OpenAI | Mêmes helpers de découverte/configuration de fournisseur auto-hébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers runtime d’authentification fournisseur | Helpers runtime de résolution de clé API |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API fournisseur | Helpers d’onboarding/écriture de profil pour clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement fournisseur | Helpers de recherche de variables d’environnement d’authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/replay fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de replay, helpers de point de terminaison fournisseur et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’onboarding fournisseur | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP fournisseur | Helpers génériques de capacité HTTP/point de terminaison fournisseur |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search` | Helpers web-search fournisseur | Helpers d’enregistrement/cache/configuration de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité d’outil/schéma fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d’usage fournisseur |
  | `plugin-sdk/provider-stream` | Helpers de wrapper de flux fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrapper de flux, et helpers de wrapper partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | File async ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers partagés de média | Helpers de récupération/transformation/stockage média plus builders de charge utile média |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de fournisseur de compréhension des médias plus exportations de helpers image/audio côté fournisseur |
  | `plugin-sdk/text-runtime` | Helpers partagés de texte | Suppression de texte visible par l’assistant, helpers de rendu/chunking/table Markdown, helpers de rédaction, helpers de balise de directive, utilitaires de texte sûr et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de chunking de texte | Helper de chunking de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de fournisseur de parole plus helpers côté fournisseur pour directives, registre et validation |
  | `plugin-sdk/speech-core` | Cœur partagé de la parole | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, failover, auth et helpers de registre |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de failover, lookup fournisseur et parsing de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives étroites de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exportations de prélude partagées de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration d’allowlist | Helpers d’édition/lecture de configuration d’allowlist |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’auth/garde de DM direct |
  | `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitives de helper passif de canal/état |
  | `plugin-sdk/webhook-targets` | Helpers de cible webhook | Helpers de registre de cible webhook et d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
  | `plugin-sdk/web-media` | Helpers partagés de média web | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation zod | Réexportation de `zod` pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface helper de gestionnaire/configuration/fichier/CLI mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime de moteur de mémoire | Façade runtime d’index/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur foundation d’hôte mémoire | Exportations du moteur foundation d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings d’hôte mémoire | Exportations du moteur d’embeddings d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD d’hôte mémoire | Exportations du moteur QMD d’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage d’hôte mémoire | Exportations du moteur de stockage d’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux d’hôte mémoire | Helpers multimodaux d’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête d’hôte mémoire | Helpers de requête d’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret d’hôte mémoire | Helpers de secret d’hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état d’hôte mémoire | Helpers d’état d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI d’hôte mémoire | Helpers runtime CLI d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur d’hôte mémoire | Helpers runtime cœur d’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers fichier/runtime d’hôte mémoire | Helpers fichier/runtime d’hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface helper de memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau est volontairement le sous-ensemble courant pour la migration, et non la surface complète
du SDK. La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines coutures de helper de plugin intégré comme
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Elles restent exportées pour la
maintenance/compatibilité des plugins intégrés, mais elles sont volontairement
omises du tableau de migration courant et ne constituent pas la cible recommandée pour
le nouveau code de plugin.

La même règle s’applique à d’autres familles de helpers intégrés comme :

- helpers de support navigateur : `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit correspondant au besoin. Si vous ne trouvez pas une exportation,
consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution       |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes devraient migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

C’est une échappatoire temporaire, pas une solution permanente.

## Lié

- [Bien démarrer](/plugins/building-plugins) — créer votre premier plugin
- [Vue d’ensemble du SDK](/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins de fournisseur](/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
- [Internes des plugins](/plugins/architecture) — plongée en profondeur dans l’architecture
- [Manifest de plugin](/plugins/manifest) — référence du schéma de manifest
