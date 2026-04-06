---
read_when:
    - Vous devez savoir depuis quel sous-chemin du SDK importer
    - Vous voulez une référence pour toutes les méthodes d’enregistrement sur OpenClawPluginApi
    - Vous recherchez un export spécifique du SDK
sidebarTitle: SDK Overview
summary: Carte des imports, référence de l’API d’enregistrement et architecture du SDK
title: Vue d’ensemble du Plugin SDK
x-i18n:
    generated_at: "2026-04-06T03:10:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d801641f26f39dc21490d2a69a337ff1affb147141360916b8b58a267e9f822a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Vue d’ensemble du Plugin SDK

Le Plugin SDK est le contrat typé entre les plugins et le cœur. Cette page est la
référence pour **quoi importer** et **ce que vous pouvez enregistrer**.

<Tip>
  **Vous cherchez un guide pratique ?**
  - Premier plugin ? Commencez par [Prise en main](/fr/plugins/building-plugins)
  - Plugin de canal ? Voir [Plugins de canal](/fr/plugins/sdk-channel-plugins)
  - Plugin de fournisseur ? Voir [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins)
</Tip>

## Convention d’import

Importez toujours depuis un sous-chemin spécifique :

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Chaque sous-chemin est un petit module autonome. Cela maintient un démarrage rapide et
évite les problèmes de dépendances circulaires. Pour les helpers d’entrée/de build spécifiques aux canaux,
préférez `openclaw/plugin-sdk/channel-core` ; réservez `openclaw/plugin-sdk/core` à
la surface parapluie plus large et aux helpers partagés tels que
`buildChannelConfigSchema`.

N’ajoutez pas et ne dépendez pas de points d’accès pratiques nommés d’après des fournisseurs tels que
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ni de
points d’accès helpers associés à une marque de canal. Les plugins intégrés doivent composer des
sous-chemins SDK génériques dans leurs propres barils `api.ts` ou `runtime-api.ts`, et le cœur
doit soit utiliser ces barils locaux au plugin, soit ajouter un contrat SDK générique étroit
lorsque le besoin est réellement inter-canaux.

La carte d’exports générée contient encore un petit ensemble de points d’accès helpers pour plugins intégrés
tels que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Ces
sous-chemins existent uniquement pour la maintenance et la compatibilité des plugins intégrés ; ils sont
volontairement omis du tableau commun ci-dessous et ne constituent pas le chemin
d’import recommandé pour les nouveaux plugins tiers.

## Référence des sous-chemins

Les sous-chemins les plus couramment utilisés, regroupés par objectif. La liste complète générée de
plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Les sous-chemins helpers réservés aux plugins intégrés apparaissent toujours dans cette liste générée.
Traitez-les comme des surfaces de détail d’implémentation/de compatibilité, sauf si une page de documentation
en promeut explicitement un comme public.

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
    | `plugin-sdk/account-core` | Helpers de config multi-comptes/portes d’action, helpers de secours pour le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte + secours par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste d’actions/liste de comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de config de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec secours du contrat intégré |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de construction d’enveloppe + route entrante |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et de répartition des entrées |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/correspondance de cible |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de média sortant |
    | `plugin-sdk/outbound-runtime` | Helpers de délégation d’identité/envoi sortants |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur de liaison de fil |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de conversation/liaison de fil, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de config runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe runtime |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitifs étroits de schéma de config de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de config de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/édition de config de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/garde pour message privé direct |
    | `plugin-sdk/interactive-runtime` | Helpers de normalisation/réduction de charge utile de réponse interactive |
    | `plugin-sdk/channel-inbound` | Helpers de debounce, correspondance de mention, enveloppe |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/correspondance de cible |
    | `plugin-sdk/channel-contract` | Types du contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de configuration sélectionnés pour fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution runtime de clé API pour plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’onboarding/écriture de profil de clé API |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de replay, helpers d’endpoint fournisseur, et helpers de normalisation d’identifiant de modèle comme `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacité HTTP/endpoint de fournisseur |
    | `plugin-sdk/provider-web-fetch` | Helpers de registre/cache pour fournisseur de récupération web |
    | `plugin-sdk/provider-web-search` | Helpers de registre/cache/config pour fournisseur de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compat xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et helpers d’enveloppe partagés Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpers de correctif de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et helpers d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs de capacité/remise d’approbation native |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charge utile de réponse d’approbation exec/plugin |
    | `plugin-sdk/command-auth-native` | Authentification de commande native + helpers de cible de session native |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commande |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et helpers de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage de DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF pour liste d’autorisation d’hôte et réseau privé |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher épinglé, fetch protégé SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille/délai d’expiration du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins runtime et stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges de runtime/logging/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime, logger, délai d’expiration, retry et backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commandes/hooks/http/interactif pour plugin |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de hooks webhook/internes |
    | `plugin-sdk/lazy-runtime` | Helpers d’import/liaison runtime paresseux tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers CLI de formatage, attente et version |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de correctif d’état de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de config |
    | `plugin-sdk/telegram-command-config` | Normalisation nom/description de commande Telegram et vérifications de doublon/conflit, même lorsque la surface du contrat Telegram intégré n’est pas disponible |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation exec/plugin, constructeurs de capacité d’approbation, helpers d’authentification/profil, routage/runtime natifs |
    | `plugin-sdk/reply-runtime` | Helpers partagés runtime d’entrée/réponse, fragmentation, répartition, heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de répartition/finalisation de réponse |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse à fenêtre courte tels que `buildHistoryContext`, `recordPendingHistoryEntry`, et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de fragmentation texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de stockage de session + updated-at |
    | `plugin-sdk/state-paths` | Helpers de chemin d’état/répertoire OAuth |
    | `plugin-sdk/routing` | Helpers de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey`, et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé d’état canal/compte, valeurs par défaut d’état runtime, et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Logger de sous-système et helpers de masquage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode de tableau Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication persistant sur disque |
    | `plugin-sdk/acp-runtime` | Helpers runtime/session ACP et de répartition de réponse |
    | `plugin-sdk/agent-config-primitives` | Primitifs étroits de schéma de config runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur tolérant de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de nom dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitifs partagés de canal passif et helpers d’état |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande `/models`/fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Helpers de liste de commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registre/build/sérialisation de commandes natives |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection d’endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système/heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, helpers partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, et helpers de recherche épinglée |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de config de retry et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Interrogation/déduplication de répertoire adossée à la config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de média ainsi que constructeurs de charge utile média |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension des médias plus exports de helpers d’image/audio orientés fournisseur |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/Markdown/logging tels que suppression du texte visible par l’assistant, rendu/fragementation/tableau Markdown, masquage, balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de fragmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole plus helpers orientés fournisseur pour directive, registre et validation |
    | `plugin-sdk/speech-core` | Types partagés de fournisseur de parole, registre, directive et helpers de normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel et helpers de registre |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’image, basculement, authentification et helpers de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de basculement, recherche de fournisseur et analyse de model-ref |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de model-ref |
    | `plugin-sdk/webhook-targets` | Registre de cibles webhook et helpers d’installation de route |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de média distant/local |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins Memory">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper intégrée memory-core pour helpers de gestionnaire/config/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur foundation hôte Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Exports du moteur d’embeddings hôte Memory |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD hôte Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage hôte Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte Memory |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte Memory |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte Memory |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers runtime CLI de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers runtime cœur de l’hôte Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime de l’hôte Memory |
    | `plugin-sdk/memory-lancedb` | Surface helper intégrée memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins helpers intégrés réservés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de prise en charge du plugin Browser intégré (`browser-support` reste le baril de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix intégrée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE intégrée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC intégrée |
    | Helpers spécifiques au canal | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Points d’accès de compatibilité/helpers de canaux intégrés |
    | Helpers spécifiques à l’auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Points d’accès helpers de fonctionnalités/plugins intégrés ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API d’enregistrement

Le callback `register(api)` reçoit un objet `OpenClawPluginApi` avec ces
méthodes :

### Enregistrement des capacités

| Méthode                                          | Ce qu’elle enregistre            |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Inférence de texte (LLM)         |
| `api.registerChannel(...)`                       | Canal de messagerie              |
| `api.registerSpeechProvider(...)`                | Synthèse texte-parole / STT      |
| `api.registerRealtimeTranscriptionProvider(...)` | Transcription temps réel en flux |
| `api.registerRealtimeVoiceProvider(...)`         | Sessions vocales temps réel duplex |
| `api.registerMediaUnderstandingProvider(...)`    | Analyse image/audio/vidéo        |
| `api.registerImageGenerationProvider(...)`       | Génération d’image               |
| `api.registerMusicGenerationProvider(...)`       | Génération musicale              |
| `api.registerVideoGenerationProvider(...)`       | Génération vidéo                 |
| `api.registerWebFetchProvider(...)`              | Fournisseur de récupération / scraping web |
| `api.registerWebSearchProvider(...)`             | Recherche web                    |

### Outils et commandes

| Méthode                        | Ce qu’elle enregistre                         |
| ----------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Outil d’agent (obligatoire ou `{ optional: true }`) |
| `api.registerCommand(def)`      | Commande personnalisée (contourne le LLM)    |

### Infrastructure

| Méthode                                        | Ce qu’elle enregistre |
| --------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook d’événement      |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway |
| `api.registerGatewayMethod(name, handler)`     | Méthode RPC Gateway   |
| `api.registerCli(registrar, opts?)`            | Sous-commande CLI     |
| `api.registerService(service)`                 | Service en arrière-plan |
| `api.registerInteractiveHandler(registration)` | Gestionnaire interactif |

Les espaces de noms d’administration du cœur réservés (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restent toujours `operator.admin`, même si un plugin essaie d’attribuer une portée
plus étroite à une méthode Gateway. Préférez des préfixes spécifiques au plugin pour
les méthodes possédées par le plugin.

### Métadonnées d’enregistrement CLI

`api.registerCli(registrar, opts?)` accepte deux types de métadonnées de niveau supérieur :

- `commands` : racines de commande explicites possédées par le registrar
- `descriptors` : descripteurs de commande au moment de l’analyse, utilisés pour l’aide CLI racine,
  le routage et l’enregistrement paresseux de la CLI des plugins

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

Utilisez `commands` seul uniquement lorsque vous n’avez pas besoin d’un enregistrement
paresseux dans la CLI racine. Ce chemin de compatibilité eager reste pris en charge,
mais il n’installe pas d’emplacements réservés adossés à des descripteurs pour le chargement paresseux au moment de l’analyse.

### Emplacements exclusifs

| Méthode                                    | Ce qu’elle enregistre                 |
| ------------------------------------------ | ------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Moteur de contexte (un seul actif à la fois) |
| `api.registerMemoryPromptSection(builder)` | Constructeur de section de prompt Memory |
| `api.registerMemoryFlushPlan(resolver)`    | Résolveur de plan de vidage Memory    |
| `api.registerMemoryRuntime(runtime)`       | Adaptateur runtime Memory             |

### Adaptateurs d’embeddings Memory

| Méthode                                        | Ce qu’elle enregistre                             |
| --------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adaptateur d’embeddings Memory pour le plugin actif |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, et
  `registerMemoryRuntime` sont exclusifs aux plugins Memory.
- `registerMemoryEmbeddingProvider` permet au plugin Memory actif d’enregistrer un
  ou plusieurs identifiants d’adaptateur d’embeddings (par exemple `openai`, `gemini`, ou un identifiant personnalisé défini par le plugin).
- La configuration utilisateur telle que `agents.defaults.memorySearch.provider` et
  `agents.defaults.memorySearch.fallback` se résout par rapport à ces identifiants
  d’adaptateur enregistrés.

### Événements et cycle de vie

| Méthode                                      | Ce qu’elle fait             |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook de cycle de vie typé   |
| `api.onConversationBindingResolved(handler)` | Callback de liaison de conversation |

### Sémantique de décision des hooks

- `before_tool_call` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : renvoyer `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), pas comme une surcharge.
- `before_install` : renvoyer `{ block: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : renvoyer `{ block: false }` est traité comme l’absence de décision (identique à l’omission de `block`), pas comme une surcharge.
- `reply_dispatch` : renvoyer `{ handled: true, ... }` est terminal. Dès qu’un gestionnaire revendique la répartition, les gestionnaires de priorité inférieure et le chemin par défaut de répartition du modèle sont ignorés.
- `message_sending` : renvoyer `{ cancel: true }` est terminal. Dès qu’un gestionnaire le définit, les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : renvoyer `{ cancel: false }` est traité comme l’absence de décision (identique à l’omission de `cancel`), pas comme une surcharge.

### Champs de l’objet API

| Champ                   | Type                      | Description                                                                                 |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identifiant du plugin                                                                       |
| `api.name`               | `string`                  | Nom d’affichage                                                                             |
| `api.version`            | `string?`                 | Version du plugin (facultative)                                                             |
| `api.description`        | `string?`                 | Description du plugin (facultative)                                                         |
| `api.source`             | `string`                  | Chemin source du plugin                                                                     |
| `api.rootDir`            | `string?`                 | Répertoire racine du plugin (facultatif)                                                    |
| `api.config`             | `OpenClawConfig`          | Instantané de config courant (instantané runtime actif en mémoire quand disponible)         |
| `api.pluginConfig`       | `Record<string, unknown>` | Config spécifique au plugin depuis `plugins.entries.<id>.config`                            |
| `api.runtime`            | `PluginRuntime`           | [Helpers runtime](/fr/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger à portée (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode de chargement courant ; `"setup-runtime"` est la fenêtre légère de démarrage/configuration avant l’entrée complète |
| `api.resolvePath(input)` | `(string) => string`      | Résoudre le chemin par rapport à la racine du plugin                                        |

## Convention de module interne

Dans votre plugin, utilisez des barils locaux pour les imports internes :

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
  `./runtime-api.ts`. Le chemin SDK est uniquement le contrat externe.
</Warning>

Les surfaces publiques des plugins intégrés chargées par façade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, et fichiers d’entrée publics similaires) préfèrent désormais l’instantané
de config runtime actif quand OpenClaw est déjà en cours d’exécution. Si aucun instantané runtime
n’existe encore, elles reviennent à la config résolue sur disque.

Les plugins de fournisseur peuvent également exposer un baril de contrat local au plugin lorsqu’un
helper est intentionnellement spécifique au fournisseur et n’a pas encore sa place dans un sous-chemin SDK
générique. Exemple intégré actuel : le fournisseur Anthropic conserve ses helpers de flux Claude
dans son propre point d’accès public `api.ts` / `contract-api.ts` au lieu de
promouvoir la logique Anthropic d’en-tête bêta et `service_tier` dans un contrat
générique `plugin-sdk/*`.

Autres exemples intégrés actuels :

- `@openclaw/openai-provider` : `api.ts` exporte des constructeurs de fournisseur,
  des helpers de modèle par défaut et des constructeurs de fournisseur temps réel
- `@openclaw/openrouter-provider` : `api.ts` exporte le constructeur du fournisseur ainsi que
  des helpers d’onboarding/config

<Warning>
  Le code de production des extensions doit également éviter les imports `openclaw/plugin-sdk/<other-plugin>`.
  Si un helper est réellement partagé, promouvez-le vers un sous-chemin SDK neutre
  tel que `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, ou une autre
  surface orientée capacité au lieu de coupler deux plugins entre eux.
</Warning>

## Connexe

- [Points d’entrée](/fr/plugins/sdk-entrypoints) — options de `definePluginEntry` et `defineChannelPluginEntry`
- [Helpers runtime](/fr/plugins/sdk-runtime) — référence complète de l’espace de noms `api.runtime`
- [Configuration et config](/fr/plugins/sdk-setup) — packaging, manifestes, schémas de config
- [Tests](/fr/plugins/sdk-testing) — utilitaires de test et règles lint
- [Migration SDK](/fr/plugins/sdk-migration) — migration depuis des surfaces obsolètes
- [Internes des plugins](/fr/plugins/architecture) — architecture approfondie et modèle de capacités
