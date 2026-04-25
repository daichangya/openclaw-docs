---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour un import de Plugin
    - Audit des sous-chemins de plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-04-25T18:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: b143fcc177c4d0d03fbcb4058291c99a7bb9f1f7fd04cca3916a7dbb4c22fd14
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Le SDK Plugin est exposé sous la forme d’un ensemble de sous-chemins ciblés sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins les plus courants, regroupés par usage. La liste complète
  générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins d’assistance réservés aux plugins intégrés y apparaissent, mais relèvent du détail
  d’implémentation sauf lorsqu’une page de documentation les met explicitement en avant.

  Pour le guide d’écriture de Plugin, voir [Plugin SDK overview](/fr/plugins/sdk-overview).

  ## Entrée de Plugin

  | Sous-chemin                | Exports clés                                                                                                                           |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-comptes/de gate d’action, assistants de repli sur le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation des ids de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + assistants de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés pour la liste des comptes/les actions sur les comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation des commandes personnalisées Telegram avec repli sur le contrat intégré |
    | `plugin-sdk/command-gating` | Assistants ciblés de gate d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, assistants de cycle de vie/finalisation des flux de brouillon |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de routage entrant + de construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et de distribution des réponses entrantes |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-runtime` | Assistants de livraison sortante, identité, délégation d’envoi, session, formatage et planification de payload |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation des polls |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptation des associations de fils |
    | `plugin-sdk/agent-media-payload` | Générateur hérité de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants d’association conversation/fil, de pairing et d’association configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe au runtime |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées du schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés pour les plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture/modification de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/protection des messages directs |
    | `plugin-sdk/interactive-runtime` | Assistants de présentation sémantique des messages, de livraison et de réponse interactive héritée. Voir [Message Presentation](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour le debounce entrant, la correspondance de mention, les assistants de politique de mention et les assistants d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés de debounce entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés de politique de mention et de texte de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-envelope` | Assistants ciblés de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Assistants de contexte et de formatage d’emplacement de canal |
    | `plugin-sdk/channel-logging` | Assistants de journalisation de canal pour les abandons entrants et les échecs de saisie/ack |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’actions de message de canal, ainsi que les assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de feedback/réaction |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés du contrat des secrets tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ainsi que les types de cibles de secret |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs autohébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Assistants runtime de résolution de clé API pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration par clé API/d’écriture de profil tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour les plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche des variables d’environnement d’authentification fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politique de rejeu, assistants d’endpoint fournisseur et assistants de normalisation d’id de modèle comme `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/endpoint fournisseur, erreurs HTTP fournisseur et assistants de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants ciblés du contrat de configuration/sélection de web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache du fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants ciblés de configuration/identifiants pour la recherche web, pour les fournisseurs qui n’ont pas besoin du câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants ciblés du contrat de configuration/identifiants pour la recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et les setters/getters d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/runtime du fournisseur de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et assistants de wrapper partagés pour Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants natifs de transport fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de patch de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants ciblés de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes, y compris le formatage dynamique des menus d’arguments, assistants d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et assistants d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal sensibles à la latence |
    | `plugin-sdk/approval-handler-runtime` | Assistants runtime plus larges de gestionnaire d’approbation ; préférez les jonctions plus ciblées adapter/gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants natifs de cible d’approbation + d’association de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de payload de réponse d’approbation exécution/plugin |
    | `plugin-sdk/approval-runtime` | Assistants de payload d’approbation exécution/plugin, assistants natifs de routage/runtime d’approbation, et assistants structurés d’affichage d’approbation tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants ciblés de test de contrat de canal sans le barrel de test plus large |
    | `plugin-sdk/command-auth-native` | Authentification native de commande, formatage dynamique des menus d’arguments, et assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canal sensibles à la latence |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et assistants de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de collecte du contrat de secret pour les surfaces de secret de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants ciblés `coerceSecretRef` et de typage SecretRef pour l’analyse du contrat/configuration de secret |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, de gate DM, de contenu externe et de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’autorisation d’hôtes et de politique SSRF sur réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants ciblés de dispatcher épinglé sans la large surface runtime infra |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, fetch protégé contre SSRF, et assistants de politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille de corps de requête/délai d’attente |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants larges de runtime/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Assistants ciblés d’environnement runtime, de logger, de délai d’attente, de nouvelle tentative et de backoff |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche du contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commande/hook/http/interaction de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’import/association lazy du runtime tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod`, et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants CLI de formatage, d’attente, de version, d’invocation avec arguments, et de groupe de commandes lazy |
    | `plugin-sdk/gateway-runtime` | Assistants de client Gateway et de patch de statut de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement/écriture de configuration et de recherche de configuration de plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications des doublons/conflits, même quand la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques de référence de fichier sans le barrel text-runtime plus large |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exécution/plugin, générateurs de capacités d’approbation, assistants auth/profil, assistants natifs de routage/runtime, et formatage structuré des chemins d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Assistants partagés de runtime entrant/réponse, découpage, distribution, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de distribution/finalisation des réponses et de libellé de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique des réponses sur fenêtre courte tels que `buildHistoryContext`, `recordPendingHistoryEntry`, et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin du magasin de session + de date de mise à jour |
    | `plugin-sdk/state-paths` | Assistants de chemin d’état/répertoire OAuth |
    | `plugin-sdk/routing` | Assistants de route/clé de session/association de compte tels que `resolveAgentRoute`, `buildAgentSessionKey`, et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé de statut de canal/compte, valeurs par défaut d’état runtime, et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne à partir d’entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des payloads normalisés à partir d’objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire des champs canoniques de cible d’envoi à partir d’arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins temporaires de téléchargement |
    | `plugin-sdk/logging-core` | Logger de sous-système et assistants de rédaction |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication sur disque |
    | `plugin-sdk/acp-runtime` | Assistants ACP de runtime/session et de distribution de réponses |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des associations ACP sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées du schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants de bootstrap de périphérique et de jeton de pairing |
    | `plugin-sdk/extension-shared` | Primitives d’assistance partagées pour canaux passifs, statut et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de commande `/models`/fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Assistants de liste de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Assistants natifs de registre/construction/sérialisation de commandes |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agent bas niveau : types de harnais, assistants de pilotage/abandon d’exécution active, assistants de pont d’outils OpenClaw, assistants de formatage/détail de progression d’outil, et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection d’endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Assistants d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime conscient du dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface media runtime |
    | `plugin-sdk/session-binding-runtime` | État actuel d’association de conversation sans routage d’association configurée ni magasins de pairing |
    | `plugin-sdk/session-store-runtime` | Assistants de lecture du magasin de session sans imports larges d’écriture/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité de contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition/normalisation de chaînes et d’enregistrements primitifs sans imports de markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de nouvelle tentative et d’exécuteur de nouvelle tentative |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de média ainsi que générateurs de payload média |
    | `plugin-sdk/media-store` | Assistants ciblés de stockage média tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de failover de génération de média, sélection de candidats, et messagerie de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média ainsi qu’exports d’assistants image/audio orientés fournisseur |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/Markdown/journalisation tels que la suppression de texte visible par l’assistant, les assistants de rendu/découpage/tableau Markdown, les assistants de rédaction, les assistants de balises de directive, et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de découpage de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole ainsi qu’exports d’assistants orientés fournisseur pour directives, registre, validation et parole |
    | `plugin-sdk/speech-core` | Exports partagés de types de fournisseur de parole, registre, directive, normalisation et assistants de parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel, assistants de registre, et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’images |
    | `plugin-sdk/image-generation-core` | Assistants partagés de types, failover, authentification et registre pour la génération d’images |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat pour la génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de failover, recherche de fournisseur, et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat pour la génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de failover, recherche de fournisseur, et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre des cibles Webhook et assistants d’installation de route |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de média distant/local |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins Memory">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistance memory-core intégrée pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte Memory, accès au registre, fournisseur local, et assistants génériques de lot/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte Memory |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte Memory |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte Memory |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte Memory |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants runtime CLI de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants runtime cœur de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichier/runtime de l’hôte Memory |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les assistants runtime cœur de l’hôte Memory |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements de l’hôte Memory |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les assistants de fichier/runtime de l’hôte Memory |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les plugins adjacents à Memory |
    | `plugin-sdk/memory-host-search` | Façade runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les assistants d’état de l’hôte Memory |
    | `plugin-sdk/memory-lancedb` | Surface d’assistance memory-lancedb intégrée |
  </Accordion>

  <Accordion title="Sous-chemins réservés d’assistance intégrée">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Assistants de prise en charge du plugin Browser intégré. `browser-profiles` exporte `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile`, et `ResolvedBrowserTabCleanupConfig` pour la forme normalisée `browser.tabCleanup`. `browser-support` reste le barrel de compatibilité. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d’assistance/runtime Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d’assistance/runtime LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d’assistance IRC intégrée |
    | Assistants spécifiques aux canaux | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Jonctions de compatibilité/d’assistance de canaux intégrés |
    | Assistants spécifiques à l’authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Jonctions d’assistance de fonctionnalité/plugin intégrées ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Liens associés

- [Plugin SDK overview](/fr/plugins/sdk-overview)
- [Plugin SDK setup](/fr/plugins/sdk-setup)
- [Building plugins](/fr/plugins/building-plugins)
