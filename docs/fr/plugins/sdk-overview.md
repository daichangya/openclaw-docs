---
read_when:
    - Vous devez savoir à partir de quel sous-chemin SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez une exportation SDK spécifique
sidebarTitle: SDK Overview
summary: Import map, référence de l’API d’enregistrement et architecture SDK
title: Aperçu du SDK Plugin
x-i18n:
    generated_at: "2026-04-21T07:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Aperçu du SDK Plugin

Le SDK Plugin est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Getting Started](/fr/plugins/building-plugins)
  - Plugin de canal ? Voir [Channel Plugins](/fr/plugins/sdk-channel-plugins)
  - Plugin de provider ? Voir [Provider Plugins](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un module petit et autonome. Cela maintient un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de construction propres aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; réservez `openclaw/plugin-sdk/core` à
la surface d’ensemble plus large et aux helpers partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de surfaces de commodité nommées d’après des providers telles que
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
surfaces helper marquées par un canal. Les plugins intégrés doivent composer des
sous-chemins SDK génériques dans leurs propres barrels `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barrels locaux au plugin, soit ajouter un contrat SDK générique étroit
lorsque le besoin est réellement transversal aux canaux.

La map d’exports générée contient encore un petit ensemble de surfaces helper de plugin intégré
comme `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins intégrés ; ils sont
volontairement omis du tableau courant ci-dessous et ne constituent pas le
chemin d’import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par usage. La liste complète générée de
plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins helper réservés aux plugins intégrés apparaissent toujours dans cette liste générée.
Considérez-les comme des surfaces de détail d’implémentation/de compatibilité, sauf si une page de documentation
en promeut explicitement une comme publique.

### Entrée de plugin

| Sous-chemin                | Exports clés                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
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
    | `plugin-sdk/account-core` | Helpers multi-comptes de configuration/contrôle d’action, helpers de fallback de compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’ID de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte + fallback par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste d’actions de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec fallback de contrat intégré |
    | `plugin-sdk/command-gating` | Helpers étroits de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de construction de route + enveloppe entrantes |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et d’envoi entrants |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/de correspondance des cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-runtime` | Helpers d’identité sortante, de délégué d’envoi et de planification de payload |
    | `plugin-sdk/poll-runtime` | Helpers étroits de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur des liaisons de thread |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de liaison conversation/thread, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe au runtime |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitifs étroits de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés pour plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/édition de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès aux groupes |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/de garde de DM directs |
    | `plugin-sdk/interactive-runtime` | Helpers de normalisation/réduction de payload de réponse interactive |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour debounce entrant, correspondance de mention, helpers de politique de mention et helpers d’enveloppe |
    | `plugin-sdk/channel-mention-gating` | Helpers étroits de politique de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage d’emplacement de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour abandons entrants et échecs de typing/ack |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/de correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage feedback/réaction |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de contrat de secrets tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types cibles de secrets |
  </Accordion>

  <Accordion title="Sous-chemins de provider">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers organisés de configuration de provider local/autohébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de provider autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers runtime de résolution de clé API pour les plugins de provider |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’onboarding/d’écriture de profil de clé API comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour les plugins de provider |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’authentification de provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de replay, helpers de point de terminaison provider et helpers de normalisation d’ID de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacité HTTP/point de terminaison de provider |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers étroits de contrat de configuration/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de configuration/d’identifiants web-search pour les providers qui n’ont pas besoin du câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat de configuration/d’identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants délimités |
    | `plugin-sdk/provider-web-search` | Helpers runtime/d’enregistrement/cache de provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics de schéma Gemini, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et helpers de wrappers partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport provider natif tels que guarded fetch, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution d’approbateur et d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs de capacité/livraison d’approbation native |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canaux à chaud |
    | `plugin-sdk/approval-handler-runtime` | Helpers runtime plus larges de gestionnaire d’approbation ; préférez les surfaces d’adaptateur/gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native + de liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de réponse d’approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Helpers d’authentification de commande native + de cible de session native |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commande |
    | `plugin-sdk/command-surface` | Helpers de normalisation de corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrat de secrets/configuration |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, de filtrage DM, de contenu externe et de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF pour réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la large surface runtime d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher épinglé, de fetch protégé par SSRF et de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille de corps de requête/timeout |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges de runtime/journalisation/sauvegarde/installation de plugins |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime, logger, timeout, retry et backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche de contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commandes/hooks/http/interactif de plugin |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Helpers d’import/liaison runtime paresseux tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers CLI de formatage, d’attente et de version |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de patch d’état de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de configuration |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autoliens de références de fichiers sans le large barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation exec/plugin, constructeurs de capacité d’approbation, helpers d’authentification/profil, helpers de routage/runtime natifs |
    | `plugin-sdk/reply-runtime` | Helpers runtime partagés d’entrée/réponse, découpage, envoi, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits d’envoi/finalisation de réponse |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse à fenêtre courte tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de découpage texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de magasin de sessions + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de chemin de répertoire d’état/OAuth |
    | `plugin-sdk/routing` | Helpers de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé d’état de canal/compte, valeurs par défaut d’état runtime et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne depuis des entrées de type fetch/requête |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des payloads normalisés à partir d’objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi à partir des arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Helpers de logger de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode de tableau Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Helpers ACP de runtime/session et d’envoi de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution ACP en lecture seule des liaisons sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitifs étroits de schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitifs helper partagés pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande `/models`/provider |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listage de commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour harnais d’agent bas niveau : types de harnais, helpers d’orientation/abandon d’exécution active, helpers de pont d’outil OpenClaw et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers d’indicateur et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, helpers partagés de classification des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime conscient du dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface runtime média |
    | `plugin-sdk/session-binding-runtime` | État de liaison de conversation courante sans routage de liaison configurée ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Helpers de lecture du magasin de sessions sans imports larges d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité de contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers étroits de coercition et de normalisation de chaînes/enregistrements primitifs sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration de retry et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage des médias ainsi que constructeurs de payload média |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement en cas d’échec de génération média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de provider de compréhension des médias ainsi qu’exports helper côté provider pour images/audio |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/Markdown/journalisation tels que suppression du texte visible par l’assistant, helpers de rendu/découpage/tableau Markdown, helpers de masquage, helpers de balises de directives et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage de texte sortant |
    | `plugin-sdk/speech` | Types de provider de parole ainsi qu’helpers côté provider pour directives, registre et validation |
    | `plugin-sdk/speech-core` | Helpers partagés de types de provider de parole, registre, directive et normalisation |
    | `plugin-sdk/realtime-transcription` | Types de provider de transcription temps réel et helpers de registre |
    | `plugin-sdk/realtime-voice` | Types de provider de voix temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de provider de génération d’images |
    | `plugin-sdk/image-generation-core` | Helpers partagés de types de génération d’images, failover, authentification et registre |
    | `plugin-sdk/music-generation` | Types de provider/de requête/de résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Helpers partagés de types de génération musicale, de failover, de recherche de provider et d’analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de provider/de requête/de résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Helpers partagés de types de génération vidéo, de failover, de recherche de provider et d’analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de route |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper `memory-core` intégrée pour helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings hôte mémoire, accès au registre, provider local et helpers génériques de lot/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secrets hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers runtime CLI hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers runtime cœur hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les helpers runtime du cœur hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/runtime hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins proches de la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface helper `memory-lancedb` intégrée |
  </Accordion>

  <Accordion title="Sous-chemins helper intégrés réservés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de prise en charge du plugin Browser intégré (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC intégrée |
    | Helpers propres à un canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Surfaces helper/de compatibilité de canaux intégrées |
    | Helpers propres à l’authentification/au plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Surfaces helper de fonctionnalité/plugin intégrées ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement de capacités

| Méthode                                          | Ce qu’elle enregistre                  |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inférence texte (LLM)                  |
| `api.registerAgentHarness(...)`                  | Exécuteur expérimental d’agent bas niveau |
| `api.registerCliBackend(...)`                    | Backend local d’inférence CLI          |
| `api.registerChannel(...)`                       | Canal de messagerie                    |
| `api.registerSpeechProvider(...)`                | Synthèse text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming  |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex     |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse d’images/audio/vidéo           |
| `api.registerImageGenerationProvider(...)`       | Génération d’images                    |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale                    |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                       |
| `api.registerWebFetchProvider(...)`              | Provider de récupération / scraping Web |
| `api.registerWebSearchProvider(...)`             | Recherche Web                          |

### Outils et commandes

| Méthode                         | Ce qu’elle enregistre                          |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)      |

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre                   |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement                        |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway       |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway                     |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI                       |
| `api.registerService(service)`                 | Service d’arrière-plan                  |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif                 |
| `api.registerMemoryPromptSupplement(builder)`  | Section additive de prompt proche de la mémoire |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additif de lecture/recherche mémoire |

Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin tente d’assigner une
portée de méthode gateway plus étroite. Préférez des préfixes propres au plugin pour les
méthodes appartenant au plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau racine :

- `commands` : racines de commande explicites possédées par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI racine,
  le routage et l’enregistrement CLI paresseux des plugins

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de niveau supérieur exposée par ce
registrar.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Gérer les comptes Matrix, la vérification, les appareils et l’état du profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
d’espaces réservés adossés aux descripteurs pour le chargement paresseux au moment de l’analyse.

### Enregistrement de backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un
backend CLI IA local tel que `codex-cli`.

- Le backend `id` devient le préfixe provider dans les références de modèle comme `codex-cli/gpt-5`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` par-dessus la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple pour normaliser d’anciennes formes de flags).

### Slots exclusifs

| Méthode                                    | Ce qu’elle enregistre                                                                                                                                      |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois). Le callback `assemble()` reçoit `availableTools` et `citationsMode` afin que le moteur puisse adapter les ajouts au prompt. |
| `api.registerMemoryCapability(capability)` | Capacité mémoire unifiée                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de flush mémoire                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime mémoire                                                                                                                                 |

### Adaptateurs d’embeddings mémoire

| Méthode                                        | Ce qu’elle enregistre                           |
| --------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings mémoire pour le plugin actif |

- `registerMemoryCapability` est l’API exclusive préférée pour les plugins mémoire.
- `registerMemoryCapability` peut aussi exposer `publicArtifacts.listArtifacts(...)`
  afin que les plugins compagnons puissent consommer les artefacts mémoire exportés via
  `openclaw/plugin-sdk/memory-host-core` au lieu d’atteindre la disposition privée
  d’un plugin mémoire spécifique.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont des API exclusives de plugin mémoire compatibles avec l’héritage.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d’enregistrer un
  ou plusieurs ID d’adaptateur d’embeddings (par exemple `openai`, `gemini`, ou un ID
  personnalisé défini par plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces ID d’adaptateur
  enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait                |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé      |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), et non comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme aucune décision (identique à l’omission de `block`), et non comme un remplacement.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire prend en charge l’envoi, les gestionnaires de priorité inférieure et le chemin d’envoi par défaut du modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme aucune décision (identique à l’omission de `cancel`), et non comme un remplacement.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration actuel (instantané runtime actif en mémoire lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration propre au plugin depuis `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Helpers runtime](/fr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger délimité (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement actuel ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Convention de module interne

Au sein de votre plugin, utilisez des fichiers barrel locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime internes uniquement
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Entrée légère réservée à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques de plugin intégré chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent désormais
l’instantané de configuration runtime actif lorsque OpenClaw est déjà en cours d’exécution. Si aucun instantané runtime
n’existe encore, elles reviennent à la configuration résolue sur disque.

Les plugins de provider peuvent également exposer un barrel de contrat local au plugin lorsque
un helper est intentionnellement propre au provider et n’a pas encore sa place dans un sous-chemin SDK générique.
Exemple intégré actuel : le provider Anthropic conserve ses helpers de flux Claude dans sa propre
surface publique `api.ts` / `contract-api.ts` au lieu de promouvoir la logique Anthropic d’en-tête bêta et
`service_tier` dans un contrat générique `plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de provider,
  des helpers de modèle par défaut et des constructeurs de provider temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de provider ainsi que
  des helpers d’onboarding/configuration

<Warning>
  Le code de production d’extension doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Liens associés

- [Points d’entrée](/fr/plugins/sdk-entrypoints) — options `definePluginEntry` et `defineChannelPluginEntry`
- [Helpers runtime](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Configuration et config](/fr/plugins/sdk-setup) — packaging, manifestes, schémas de configuration
- [Testing](/fr/plugins/sdk-testing) — utilitaires de test et règles lint
- [Migration SDK](/fr/plugins/sdk-migration) — migration depuis les surfaces obsolètes
- [Internals des plugins](/fr/plugins/architecture) — architecture détaillée et modèle de capacité
