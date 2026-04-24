---
read_when:
    - choix du bon sous-chemin plugin-sdk pour un import de plugin
    - audit des sous-chemins de plugins intégrés et des surfaces de helpers
summary: 'catalogue des sous-chemins du SDK de plugin : où vivent les imports, groupés par domaine'
title: sous-chemins du SDK de plugin
x-i18n:
    generated_at: "2026-04-24T07:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff4b934501a3163e36b402db72dd75a260fe9f849b3823a7a05e4867a1a5e655
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Le SDK de plugin est exposé comme un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page catalogue les sous-chemins les plus courants, groupés par usage. La
  liste complète générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins réservés de helpers pour plugins intégrés y apparaissent mais restent des
  détails d’implémentation sauf si une page de documentation les promeut explicitement.

  Pour le guide de création de plugins, voir [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview).

  ## Entrée de plugin

  | Sous-chemin                 | Exports clés                                                                                                                           |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers multi-comptes de configuration/barrière d’action, helpers de repli du compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’id de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte + repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste d’actions/de comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec repli vers contrat intégré |
    | `plugin-sdk/command-gating` | Helpers étroits de barrière d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de cycle de vie/finalisation de flux de brouillon |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de route entrante + construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et de répartition entrante |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/mise en correspondance des cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Helpers d’identité sortante, de délégation d’envoi et de planification de charge utile |
    | `plugin-sdk/poll-runtime` | Helpers étroits de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie d’association de fil et d’adaptateur |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de liaison conversation/fil, d’association et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers runtime de résolution de politique de groupe |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitifs étroits de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation des écritures de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés pour plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/édition de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/protection des DM directs |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique de message, livraison et helpers hérités de réponse interactive. Voir [Présentation de message](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance de mentions, les helpers de politique de mention et les helpers d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Helpers étroits d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Helpers étroits de politique de mention et de texte de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-envelope` | Helpers étroits de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage de localisation de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour suppressions entrantes et échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultats de réponse |
    | `plugin-sdk/channel-actions` | Helpers d’actions de message de canal, plus helpers de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/mise en correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types de cibles de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers soignés de configuration de fournisseur local/auto-hébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur auto-hébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut de backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers runtime de résolution de clé API pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration par clé API/écriture de profil tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers interactifs partagés de connexion pour les plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d’environnement d’authentification du fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers de point de terminaison fournisseur et helpers de normalisation d’id de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques HTTP/capacité de point de terminaison fournisseur, y compris les helpers de formulaires multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers étroits de contrat config/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache des fournisseurs web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits config/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat config/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants limités par portée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/runtime des fournisseurs de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics de schéma Gemini, et helpers de compat xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et helpers partagés de wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport fournisseur natif tels que fetch protégé, transformations de message de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Helpers étroits de mode d’activation de groupe et d’analyse de commande |
  </Accordion>

  <Accordion title="Sous-chemins auth et sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution d’approbateur et helpers d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs de capacité/livraison d’approbation native |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal rapides |
    | `plugin-sdk/approval-handler-runtime` | Helpers runtime plus larges de gestionnaire d’approbation ; préférez les coutures plus étroites adapter/gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charge utile de réponse d’approbation exec/plugin |
    | `plugin-sdk/reply-dedupe` | Helpers étroits de réinitialisation de déduplication de réponse entrante |
    | `plugin-sdk/channel-contract-testing` | Helpers étroits de test de contrat de canal sans le barrel de test large |
    | `plugin-sdk/command-auth-native` | Helpers d’authentification de commande native + cible de session native |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commande |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers sur le texte de commande pour chemins de canal rapides |
    | `plugin-sdk/command-surface` | Helpers de normalisation de corps de commande et surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrat de secret pour surfaces de secret de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse contrat de secret/configuration |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôte et de politique SSRF réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la surface runtime d’infrastructure large |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher épinglé, fetch protégé contre SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille de corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges de runtime/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime, logger, délai, retry et backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commande/hook/http/interaction de plugin |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de hook Webhook/interne |
    | `plugin-sdk/lazy-runtime` | Helpers de chargement/liaison runtime paresseux tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod`, et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers de formatage CLI, attente et version |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de patch d’état de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de configuration et de recherche de configuration de plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation nom/description de commande Telegram et vérifications de doublon/conflit, même lorsque la surface de contrat Telegram intégrée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autoliens de références de fichiers sans le barrel text-runtime large |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation exec/plugin, constructeurs de capacité d’approbation, helpers auth/profil, helpers natifs de routage/runtime |
    | `plugin-sdk/reply-runtime` | Helpers runtime partagés d’entrée/réponse, découpage, répartition, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de répartition/finalisation de réponse |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse sur courte fenêtre tels que `buildHistoryContext`, `recordPendingHistoryEntry`, et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de découpage texte/markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin du magasin de sessions + updated-at |
    | `plugin-sdk/state-paths` | Helpers de chemins de répertoire state/OAuth |
    | `plugin-sdk/routing` | Helpers de liaison route/clé de session/compte tels que `resolveAgentRoute`, `buildAgentSessionKey`, et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé d’état canal/compte, valeurs par défaut d’état runtime et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extrait des URL chaîne à partir d’entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres communs outil/CLI |
    | `plugin-sdk/tool-payload` | Extrait des charges utiles normalisées à partir d’objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extrait les champs de cible d’envoi canoniques à partir des arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Helpers de logger de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode/conversion de tableaux Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/session ACP et de répartition de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule de liaison ACP sans imports de démarrage de cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitifs étroits de schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de nom dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap d’appareil et de jeton d’association |
    | `plugin-sdk/extension-shared` | Primitifs partagés de canal passif, statut et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listing de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de construction/sérialisation du registre de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour harnais d’agent bas niveau : types de harnais, helpers de steer/abort d’exécution active, helpers de pont d’outil OpenClaw, helpers de formatage/détail de progression d’outil, et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.AI |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers de drapeau/événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreur, formatage, helpers partagés de classification d’erreur, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch enveloppé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime conscient du dispatcher sans imports proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface runtime média large |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configurée ni magasins d’association |
    | `plugin-sdk/session-store-runtime` | Helpers de lecture du magasin de sessions sans imports larges d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité de contexte et filtrage de contexte supplémentaire sans imports larges de config/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers étroits de coercition et normalisation de chaîne/enregistrement primitif sans imports markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte hostname et SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration et d’exécuteur retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication d’annuaire adossé à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias plus constructeurs de charge utile média |
    | `plugin-sdk/media-store` | Helpers étroits de magasin média tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de repli pour génération de médias, sélection de candidats et messagerie de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension média plus exports d’helpers image/audio côté fournisseur |
    | `plugin-sdk/text-runtime` | Helpers partagés texte/markdown/journalisation tels que suppression de texte visible par l’assistant, helpers de rendu/découpage/tableaux markdown, helpers de masquage, helpers de balises de directives, et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs de parole plus helpers côté fournisseur de directive, registre et validation |
    | `plugin-sdk/speech-core` | Types, registre, directive et helpers de normalisation partagés pour fournisseurs de parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre, et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs de voix en temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, repli, authentification et helpers de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de repli, recherche de fournisseur et analyse de model-ref |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de repli, recherche de fournisseur et analyse de model-ref |
    | `plugin-sdk/webhook-targets` | Helpers de registre de cibles Webhook et d’installation de route |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK de plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface de helpers memory-core intégrée pour les helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’index/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local, et helpers génériques batch/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers runtime CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers runtime du cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les helpers runtime du cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les helpers d’état de l’hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface de helpers memory-lancedb intégrée |
  </Accordion>

  <Accordion title="Sous-chemins réservés de helpers intégrés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de prise en charge du plugin browser intégré (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface intégrée de helper/runtime Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface intégrée de helper/runtime LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface intégrée de helper IRC |
    | Helpers spécifiques au canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Coutures de compatibilité/helper de canaux intégrés |
    | Helpers spécifiques auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Coutures de helper de fonctionnalité/plugin intégrées ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Liens associés

- [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
