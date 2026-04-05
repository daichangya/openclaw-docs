---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence de toutes les méthodes d’enregistrement sur `OpenClawPluginApi`
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK Overview
summary: Plan d’importation, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du SDK des plugins
x-i18n:
    generated_at: "2026-04-05T12:51:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du SDK des plugins

Le SDK des plugins est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Bien démarrer](/plugins/building-plugins)
  - Plugin de canal ? Voir [Plugins de canal](/plugins/sdk-channel-plugins)
  - Plugin de fournisseur ? Voir [Plugins de fournisseur](/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela garde un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les assistants d’entrée/de build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; gardez `openclaw/plugin-sdk/core` pour
la surface parapluie plus large et les assistants partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de coutures de commodité nommées d’après des fournisseurs telles que
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
coutures d’assistance marquées par canal. Les plugins intégrés doivent composer des
sous-chemins génériques du SDK à l’intérieur de leurs propres barils `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barils locaux au plugin, soit ajouter un contrat SDK générique étroit lorsque le besoin est réellement inter-canaux.

Le plan d’export généré contient encore un petit ensemble de coutures utilitaires pour plugins intégrés
telles que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins intégrés ; ils sont
intentionnellement omis du tableau courant ci-dessous et ne constituent pas le
chemin d’import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par usage. La liste complète générée de
plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins utilitaires réservés aux plugins intégrés apparaissent toujours dans cette liste générée.
Traitez-les comme des surfaces de détail d’implémentation/compatibilité sauf si une page de documentation
en promeut explicitement une comme publique.

### Entrée de plugin

| Sous-chemin                 | Exports clés                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                  |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                     |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-comptes/barrières d’action, assistants de solution de repli pour compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’ID de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + assistants de solution de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants étroits pour liste de comptes/actions de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types du schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec solution de repli vers le contrat intégré |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante + construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et de routage des entrées |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-runtime` | Assistants de délégation d’identité/d’envoi sortants |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur pour les liaisons de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de liaison conversation/fil, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitifs étroits du schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports prélude partagés des plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture/modification de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès aux groupes |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/garde-fou pour DM directs |
    | `plugin-sdk/interactive-runtime` | Assistants de normalisation/réduction des charges utiles de réponse interactive |
    | `plugin-sdk/channel-inbound` | Assistants de debounce, correspondance de mention, enveloppe |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types du contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage feedback/réaction |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants ciblés de configuration de fournisseur local/autohébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Assistants d’exécution de résolution de clé API pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’onboarding/écriture de profil pour clé API |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, assistants de point de terminaison de fournisseur et assistants de normalisation d’ID de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques HTTP/capacités de point de terminaison pour fournisseur |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache pour fournisseur de web fetch |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/configuration pour fournisseur de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants d’enveloppes partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Assistants de correctif de configuration pour l’onboarding |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et assistants d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs de capacité/livraison d’approbation native |
    | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charge utile de réponse pour approbations exec/plugin |
    | `plugin-sdk/command-auth-native` | Authentification de commande native + assistants de cible de session native |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commande |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF pour liste d’autorisation d’hôtes et réseau privé |
    | `plugin-sdk/ssrf-runtime` | Assistants de répartiteur épinglé, fetch protégé SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille de corps/délai pour requêtes |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants larges de runtime/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Assistants étroits pour env d’exécution, logger, timeout, retry et backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés pour commande/hook/http/interaction de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants de chargement paresseux/import runtime tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage CLI, attente et version |
    | `plugin-sdk/gateway-runtime` | Client Gateway et assistants de correctif d’état de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement/écriture de configuration |
    | `plugin-sdk/telegram-command-config` | Normalisation nom/description de commande Telegram et vérifications de doublons/conflits, même lorsque la surface du contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/approval-runtime` | Assistants exec/plugin d’approbation, constructeurs de capacité d’approbation, assistants auth/profil, assistants de routage/runtime natifs |
    | `plugin-sdk/reply-runtime` | Assistants partagés de runtime entrant/réponse, segmentation, routage, heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de routage/finalisation de réponse |
    | `plugin-sdk/reply-history` | Assistants partagés de court historique de réponse tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants étroits de segmentation texte/markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de magasin de session + updated-at |
    | `plugin-sdk/state-paths` | Assistants de chemin pour état/répertoire OAuth |
    | `plugin-sdk/routing` | Assistants de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-send` | Extraire les champs cibles canoniques d’envoi depuis les args d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemin temporaire de téléchargement |
    | `plugin-sdk/logging-core` | Logger de sous-système et assistants de masquage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode tableau Markdown |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants runtime/session ACP |
    | `plugin-sdk/agent-config-primitives` | Primitifs étroits du schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance sur noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants de bootstrap d’appareil et jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitifs partagés pour canaux passifs et état |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse commande `/models` / fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Assistants de liste de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection de point de terminaison Z.AI |
    | `plugin-sdk/infra-runtime` | Assistants d’événement système/heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreur, formatage, assistants partagés de classification d’erreur, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch enveloppé, proxy et recherche épinglée |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de retry et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossées à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage média ainsi que constructeurs de charge utile média |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média ainsi qu’exports d’assistants image/audio côté fournisseur |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/markdown/journalisation tels que suppression du texte visible par l’assistant, assistants de rendu/segmentation/tableau Markdown, assistants de masquage, assistants de balises de directives et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de segmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de synthèse vocale ainsi qu’assistants de directives, registre et validation côté fournisseur |
    | `plugin-sdk/speech-core` | Types partagés de fournisseur de parole, registre, directive et assistants de normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel et assistants de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’images |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, authentification et assistants de registre |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat pour génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles webhook et assistants d’installation de route |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement média distant/local |
    | `plugin-sdk/zod` | Réexport de `zod` pour les consommateurs du SDK de plugins |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface utilitaire intégrée memory-core pour assistants manager/config/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exports du moteur d’embeddings de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants runtime CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants runtime cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface utilitaire intégrée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins utilitaires intégrés réservés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Assistants de prise en charge du plugin navigateur intégré |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface utilitaire/runtime du Matrix intégré |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface utilitaire/runtime du LINE intégré |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface utilitaire de l’IRC intégré |
    | Assistants spécifiques au canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Coutures de compatibilité/utilitaires de canaux intégrés |
    | Assistants spécifiques auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Coutures utilitaires de fonctionnalité/plugin intégré ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre            |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)         |
| `api.registerCliBackend(...)`                    | Backend CLI local d’inférence    |
| `api.registerChannel(...)`                       | Canal de messagerie              |
| `api.registerSpeechProvider(...)`                | Synthèse texte-vers-parole / STT |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en streaming |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales duplex en temps réel |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse image/audio/vidéo        |
| `api.registerImageGenerationProvider(...)`       | Génération d’image               |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                 |
| `api.registerWebFetchProvider(...)`              | Fournisseur de web fetch / scraping |
| `api.registerWebSearchProvider(...)`             | Recherche web                    |

### Outils et commandes

| Méthode                        | Ce qu’elle enregistre                         |
| ----------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (requis ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)    |

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement      |
| `api.registerHttpRoute(params)`                | Point de terminaison HTTP Gateway |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway   |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI     |
| `api.registerService(service)`                 | Service en arrière-plan |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif |

Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin tente d’assigner une
portée de méthode gateway plus étroite. Préférez des préfixes spécifiques au plugin pour
les méthodes appartenant au plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de premier niveau :

- `commands` : racines de commande explicites possédées par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse utilisés pour l’aide CLI racine,
  le routage et l’enregistrement CLI paresseux du plugin

Si vous voulez qu’une commande de plugin reste chargée paresseusement dans le chemin CLI racine normal,
fournissez des `descriptors` qui couvrent chaque racine de commande de premier niveau exposée par ce
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement CLI racine paresseux.
Ce chemin de compatibilité eager reste pris en charge, mais il n’installe pas
d’espaces réservés adossés à des descripteurs pour le chargement paresseux lors de l’analyse.

### Enregistrement du backend CLI

`api.registerCliBackend(...)` permet à un plugin de posséder la configuration par défaut d’un
backend CLI IA local tel que `claude-cli` ou `codex-cli`.

- L’`id` du backend devient le préfixe fournisseur dans des références de modèle comme `claude-cli/opus`.
- La `config` du backend utilise la même forme que `agents.defaults.cliBackends.<id>`.
- La configuration utilisateur reste prioritaire. OpenClaw fusionne `agents.defaults.cliBackends.<id>` sur la
  valeur par défaut du plugin avant d’exécuter la CLI.
- Utilisez `normalizeConfig` lorsqu’un backend a besoin de réécritures de compatibilité après fusion
  (par exemple normaliser d’anciennes formes de drapeau).

### Slots exclusifs

| Méthode                                    | Ce qu’elle enregistre                 |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois) |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt mémoire |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de flush mémoire    |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime mémoire            |

### Adaptateurs d’embeddings mémoire

| Méthode                                        | Ce qu’elle enregistre                        |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings mémoire pour le plugin actif |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` et
  `registerMemoryRuntime` sont exclusifs aux plugins mémoire.
- `registerMemoryEmbeddingProvider` permet au plugin mémoire actif d’enregistrer un
  ou plusieurs IDs d’adaptateur (par exemple `openai`, `gemini`, ou un ID défini par un plugin personnalisé).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces IDs
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait             |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé   |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique des décisions de hook

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme absence de décision (comme si `block` était omis), pas comme un remplacement.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme absence de décision (comme si `block` était omis), pas comme un remplacement.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme absence de décision (comme si `cancel` était omis), pas comme un remplacement.

### Champs de l’objet API

| Champ                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID du plugin                                                                                |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultatif)                                                              |
| `api.description`        | `string?`                 | Description du plugin (facultatif)                                                          |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de configuration courant (instantané d’exécution en mémoire actif lorsqu’il est disponible) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configuration spécifique au plugin depuis `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Assistants runtime](/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger à portée (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement courant ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre un chemin relatif à la racine du plugin                                            |

## Convention des modules internes

À l’intérieur de votre plugin, utilisez des barils locaux pour les imports internes :

```
my-plugin/
  api.ts            # Exports publics pour les consommateurs externes
  runtime-api.ts    # Exports runtime internes uniquement
  index.ts          # Point d’entrée du plugin
  setup-entry.ts    # Entrée légère dédiée à la configuration (facultatif)
```

<Warning>
  N’importez jamais votre propre plugin via `openclaw/plugin-sdk/<your-plugin>`
  depuis le code de production. Faites passer les imports internes par `./api.ts` ou
  `./runtime-api.ts`. Le chemin SDK n’est que le contrat externe.
</Warning>

Les surfaces publiques des plugins intégrés chargées via façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` et fichiers d’entrée publics similaires) préfèrent désormais l’instantané de configuration d’exécution actif lorsque OpenClaw fonctionne déjà. Si aucun instantané d’exécution n’existe encore, elles reviennent au fichier de configuration résolu sur disque.

Les plugins de fournisseur peuvent aussi exposer un baril de contrat local étroit lorsqu’un
assistant est intentionnellement spécifique à ce fournisseur et n’a pas encore sa place dans un sous-chemin SDK générique. Exemple intégré actuel : le fournisseur Anthropic conserve ses
assistants de flux Claude dans sa propre couture publique `api.ts` / `contract-api.ts` au lieu
de promouvoir la logique d’en-têtes bêta Anthropic et `service_tier` vers un contrat
générique `plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
  des assistants de modèle par défaut et des constructeurs de fournisseur temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur de fournisseur ainsi que
  des assistants d’onboarding/configuration

<Warning>
  Le code de production des extensions doit aussi éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un assistant est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared` ou une autre
  surface orientée capacité au lieu de coupler deux plugins.
</Warning>

## Lié

- [Points d’entrée](/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Assistants runtime](/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Configuration et setup](/plugins/sdk-setup) — packaging, manifestes, schémas de configuration
- [Tests](/plugins/sdk-testing) — utilitaires de test et règles de lint
- [Migration SDK](/plugins/sdk-migration) — migration depuis des surfaces dépréciées
- [Internes des plugins](/plugins/architecture) — architecture approfondie et modèle de capacités
