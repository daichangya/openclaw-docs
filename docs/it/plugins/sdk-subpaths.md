---
read_when:
    - Scegliere il sottopercorso `plugin-sdk` giusto per un'importazione del Plugin
    - Verifica dei sottopercorsi dei plugin inclusi e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali importazioni si trovano dove, raggruppate per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Il Plugin SDK è esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi comunemente usati raggruppati per scopo. L'elenco completo generato
  di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati dei plugin inclusi compaiono lì ma sono un
  dettaglio di implementazione a meno che una pagina della documentazione non li promuova esplicitamente.

  Per la guida alla creazione di Plugin, vedi [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

  ## Entrata del Plugin

  | Sottopercorso              | Esportazioni chiave                                                                                                                    |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, prompt della allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback per l'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper per ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi dello schema di configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati di Telegram con fallback del contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper per ciclo di vita/finalizzazione del flusso di bozze |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per il routing inbound + builder di envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound, delega di invio e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita dei binding dei thread e adapter |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime per la risoluzione delle policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per la scrittura della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni di preambolo condivise per i Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della configurazione della allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per autenticazione/guard delle DM dirette |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di mention-policy e helper di envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per il debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per mention-policy e testo delle menzioni senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-envelope` | Helper ristretti per la formattazione dell'envelope inbound |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e errori di typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per le azioni sui messaggi del canale, più helper di schema nativi deprecati mantenuti per la compatibilità dei Plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi di contratto del canale |
    | `plugin-sdk/channel-feedback` | Collegamento di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per il contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target dei segreti |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle API key per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding API key/scrittura del profilo come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per i Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper per la ricerca delle variabili d'ambiente di autenticazione dei provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi delle replay-policy, helper per gli endpoint provider e helper di normalizzazione degli ID modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, inclusi helper per form multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti per il contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper per registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali per la ricerca web per provider che non richiedono wiring di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti per il contratto di configurazione/credenziali della ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
    | `plugin-sdk/provider-web-search` | Helper runtime per registrazione/cache del provider di ricerca web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper condivisi dei wrapper per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper nativi per il transport dei provider come fetch protetto, trasformazioni dei messaggi di transport e stream di eventi di transport scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione dei gruppi e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi di comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione dell'approvatore e helper di autorizzazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter nativi per capacità/consegna dell'approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento degli adapter nativi di approvazione per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per il gestore di approvazione; preferisci i seam più stretti adapter/gateway quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + binding account |
    | `plugin-sdk/approval-reply-runtime` | Helper per il payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/reply-dedupe` | Helper ristretti per il reset della deduplica delle risposte inbound |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per i test del contratto del canale senza l'ampio barrel di testing |
    | `plugin-sdk/command-auth-native` | Helper nativi per autenticazione dei comandi + target di sessione nativi |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri del testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo del comando e helper della superficie del comando |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei segreti per superfici di segreti di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per il parsing del contratto dei segreti/configurazione |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e policy SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti del dispatcher pinnato senza l'ampia superficie runtime infrastrutturale |
    | `plugin-sdk/ssrf-runtime` | Helper per dispatcher pinnato, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body della richiesta/timeout |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e storage">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper di runtime/logging/backup/installazione plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interactive del plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper per caricamento/scrittura della configurazione e helper di lookup della configurazione del plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie contrattuale di Telegram inclusa non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink di riferimenti a file senza l'ampio barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/plugin, builder delle capacità di approvazione, helper auth/profilo, helper nativi di routing/runtime |
    | `plugin-sdk/reply-runtime` | Helper condivisi per runtime inbound/risposta, chunking, dispatch, Heartbeat, planner della risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione della risposta e label della conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso del session store + updated-at |
    | `plugin-sdk/state-paths` | Helper di percorso per directory di stato/OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato di canale/account, valori predefiniti dello stato runtime e helper per metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per il risolutore di target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione di slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Esecutore di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti dei tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione delle tabelle markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di deduplica persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessione ACP e dispatch della risposta |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione in sola lettura del binding ACP senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette dello schema di configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Reader permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per la risoluzione del matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per comando `/models` e risposte del provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per l'elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper nativi per registro/build/serializzazione dei comandi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agent a basso livello: tipi harness, helper per steering/abort delle esecuzioni attive, helper per il bridge degli strumenti OpenClaw, helper per formattazione/dettagli del progresso degli strumenti e utility per i risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper per il rilevamento degli endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache con limiti |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione, classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch avvolto, proxy e lookup pinnato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del body della risposta senza l'ampia superficie runtime dei media |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza routing del binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura del session store senza ampi import di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza ampi import di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione e normalizzazione di record/stringhe primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione del nome host e dell'host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry ed esecutore di retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup delle directory basata sulla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e testing">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/trasformazione/store dei media più builder di payload media |
    | `plugin-sdk/media-store` | Helper ristretti per lo store dei media come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi dei provider di comprensione dei media più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come rimozione del testo visibile all'assistente, helper di rendering/chunking/tabella markdown, helper di redazione, helper per tag di direttiva e utility per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi dei provider speech più helper lato provider per direttive, registro e validazione |
    | `plugin-sdk/speech-core` | Helper condivisi per tipi, registro, direttive e normalizzazione dei provider speech |
    | `plugin-sdk/realtime-transcription` | Tipi dei provider di trascrizione realtime, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi dei provider voce realtime e helper di registro |
    | `plugin-sdk/image-generation` | Tipi dei provider di generazione immagini |
    | `plugin-sdk/image-generation-core` | Helper condivisi per tipi, failover, autenticazione e registro della generazione immagini |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato della generazione musicale |
    | `plugin-sdk/music-generation-core` | Helper condivisi per tipi, failover, lookup del provider e parsing di model-ref della generazione musicale |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato della generazione video |
    | `plugin-sdk/video-generation-core` | Helper condivisi per tipi, failover, lookup del provider e parsing di model-ref della generazione video |
    | `plugin-sdk/webhook-targets` | Helper per registro dei target Webhook e installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer del Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper `memory-core` inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime dell'indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei segreti host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core host della memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal eventi host della memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di markdown gestito per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime di Active Memory per l'accesso al search manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato host della memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper `memory-lancedb` inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto per il Plugin browser incluso (`browser-support` rimane il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam di compatibilità/helper per canali inclusi |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper per funzionalità/plugin inclusi; `plugin-sdk/github-copilot-token` attualmente esporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
