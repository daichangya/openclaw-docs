---
read_when:
    - Scegliere il sottopercorso corretto di plugin-sdk per un import del Plugin
    - Verifica dei sottopercorsi dei Plugin inclusi e delle superfici helper
summary: 'Catalogo dei sottopercorsi dell’SDK Plugin: quali import si trovano dove, raggruppati per area'
title: Sottopercorsi dell’SDK Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  L’SDK Plugin è esposto come insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi più usati raggruppati per scopo. L’elenco completo
  generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati dei Plugin inclusi compaiono lì, ma sono un dettaglio
  di implementazione a meno che una pagina della documentazione non li promuova esplicitamente.

  Per la guida alla creazione di Plugin, consulta [Panoramica SDK Plugin](/it/plugins/sdk-overview).

  ## Entry del Plugin

  | Sottopercorso                | Export chiave                                                                                                                           |
  | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`    | `definePluginEntry`                                                                                                                     |
  | `plugin-sdk/core`            | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`   | `OpenClawSchema`                                                                                                                        |
  | `plugin-sdk/provider-entry`  | `defineSingleProviderPluginEntry`                                                                                                       |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export dello schema Zod root di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder di stato del setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per config multi-account/action-gate, helper di fallback per account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell’account-id |
    | `plugin-sdk/account-resolution` | Helper di lookup account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi dello schema di config del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione per comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper per ciclo di vita/finalizzazione di draft stream |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder dell’envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper per parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media in uscita |
    | `plugin-sdk/outbound-send-deps` | Lookup leggero delle dipendenze di invio in uscita per gli adapter di canale |
    | `plugin-sdk/outbound-runtime` | Helper per recapito in uscita, identità, delega di invio, sessione, formattazione e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti per la normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell’agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/binding del thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime per la risoluzione della policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di config del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della config del canale |
    | `plugin-sdk/channel-plugin-common` | Export prelude condivisi del Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della config allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard dei DM diretti |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, recapito e helper legacy per risposte interattive. Consulta [Message Presentation](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper mention-policy ed envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per mention-policy e testo della menzione senza la superficie runtime inbound più ampia |
    | `plugin-sdk/channel-envelope` | Helper ristretti per la formattazione dell’envelope inbound |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e fallimenti typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativo deprecati mantenuti per compatibilità dei Plugin |
    | `plugin-sdk/channel-targets` | Helper per parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring per feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target dei segreti |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per il setup di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per il setup di provider self-hosted compatibili OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i provider Plugin |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura del profilo della chiave API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per i provider Plugin |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle variabili env auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper endpoint provider e helper di normalizzazione model-id come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, errori HTTP del provider e helper multipart form per trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti del contratto di config/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di config/credenziali per la ricerca web per provider che non richiedono wiring di abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti del contratto di config/credenziali per la ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider di ricerca web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia + diagnostica dello schema Gemini e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper nativi di transport del provider come fetch protetta, trasformazioni dei messaggi del transport e stream di eventi del transport scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della config di onboarding |
    | `plugin-sdk/global-singleton` | Helper di singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per la modalità di attivazione del gruppo e il parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi auth e sicurezza">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi inclusa la formattazione dinamica del menu argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder per messaggi di comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione dell’approvatore e action-auth nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profilo/filtro di approvazione exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adapter per capability/recapito delle approvazioni native |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento dell’adapter di approvazione nativa per entrypoint di canali hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per l’handler di approvazione; preferisci le seam più ristrette adapter/gateway quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativa + binding account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/Plugin, helper runtime/routing delle approvazioni native e helper strutturati per la visualizzazione delle approvazioni come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti di reset del dedupe delle risposte inbound |
    | `plugin-sdk/channel-contract-testing` | Helper di test ristretti per il contratto del canale senza l’ampio barrel di testing |
    | `plugin-sdk/command-auth-native` | Auth nativa dei comandi, formattazione dinamica del menu argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi hot dei canali |
    | `plugin-sdk/command-surface` | Helper per normalizzazione del corpo del comando e superficie del comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei segreti per superfici di segreti di canale/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e helper di typing SecretRef per parsing di contratto dei segreti/config |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e policy SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di pinned-dispatcher senza l’ampia superficie infra runtime |
    | `plugin-sdk/ssrf-runtime` | Helper per pinned-dispatcher, fetch protetta da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing per input segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body/timeout della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi runtime e storage">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del runtime-context del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi del Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper per caricamento/scrittura della config e lookup della config del Plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie contrattuale Telegram inclusa non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento degli autolink di riferimenti a file senza l’ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/Plugin, builder di capability di approvazione, helper auth/profilo, helper runtime/routing nativi e formattazione strutturata del percorso di visualizzazione dell’approvazione |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposta, chunking, dispatch, heartbeat, planner della risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione della risposta ed etichette di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per chunking di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store di sessione + updated-at |
    | `plugin-sdk/state-paths` | Helper per percorsi di directory state/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave di sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo di stato canale/account, valori predefiniti dello stato runtime e metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per il resolver dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/string |
    | `plugin-sdk/request-url` | Estrai URL stringa da input di tipo fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrai payload normalizzati dagli oggetti risultato tool |
    | `plugin-sdk/tool-send` | Estrai campi target di invio canonici dagli argomenti tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione di tabelle Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe su disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione in sola lettura del binding ACP senza import di startup del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di config del runtime agente |
    | `plugin-sdk/boolean-param` | Reader permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per `/models` e risposte provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale trusted-Plugin per harness agente a basso livello: tipi di harness, helper steer/abort delle esecuzioni attive, helper del bridge strumenti OpenClaw, helper di policy degli strumenti nel piano runtime, classificazione degli esiti terminali, helper per formattazione/dettaglio del progresso degli strumenti e utility per i risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappata, proxy e lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del body della risposta senza l’ampia superficie media runtime |
    | `plugin-sdk/session-binding-runtime` | Stato attuale del binding della conversazione senza routing di binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dello store di sessione senza ampi import di scrittura/manutenzione della config |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza ampi import di config/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti per coercizione e normalizzazione di record/string primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione per hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di config retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell’agente |
    | `plugin-sdk/directory-runtime` | Query/dedup delle directory basata sulla config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi capability e testing">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder del payload media |
    | `plugin-sdk/media-store` | Helper ristretti dello store media come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggi di modello mancante |
    | `plugin-sdk/media-understanding` | Tipi del provider per comprensione media più export helper orientati al provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/Markdown/logging come rimozione del testo visibile all’assistente, helper per render/chunking/tabelle Markdown, helper di redazione, helper per directive-tag e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi del provider speech più export helper orientati al provider per directive, registry, validation e speech |
    | `plugin-sdk/speech-core` | Tipi condivisi del provider speech, registry, directive, normalizzazione ed export helper speech |
    | `plugin-sdk/realtime-transcription` | Tipi del provider per trascrizione realtime, helper di registry e helper condiviso per sessione WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi del provider voce realtime e helper di registry |
    | `plugin-sdk/image-generation` | Tipi del provider per generazione immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione immagini, failover, auth e helper di registry |
    | `plugin-sdk/music-generation` | Tipi di provider/request/result per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup provider e parsing del model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/request/result per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup provider e parsing del model-ref |
    | `plugin-sdk/webhook-targets` | Helper per registro dei target Webhook e installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer dell’SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Export chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper `memory-core` inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indicizzazione/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export del motore foundation dell’host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti embedding dell’host memoria, accesso al registry, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export del motore QMD dell’host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Export del motore storage dell’host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell’host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell’host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei segreti dell’host memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell’host memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell’host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell’host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell’host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell’host memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per gli helper runtime core dell’host memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per gli helper del journal eventi dell’host memoria |
    | `plugin-sdk/memory-host-files` | Alias vendor-neutral per gli helper file/runtime dell’host memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per managed-markdown per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias vendor-neutral per gli helper di stato dell’host memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper `memory-lancedb` inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi correnti | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser incluso. `browser-profiles` esporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` e `ResolvedBrowserTabCleanupConfig` per la forma normalizzata di `browser.tabCleanup`. `browser-support` resta il barrel di compatibilità. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam di compatibilità/helper dei canali inclusi |
    | Helper specifici di auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/Plugin inclusi; `plugin-sdk/github-copilot-token` attualmente esporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica SDK Plugin](/it/plugins/sdk-overview)
- [Setup SDK Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
