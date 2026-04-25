---
read_when:
    - Scelta del sottopercorso plugin-sdk corretto per un import del Plugin
    - Verifica dei sottopercorsi dei Plugin inclusi e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: dove si trovano gli import, raggruppati per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:54:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Il plugin SDK è esposto come un insieme di sottopercorsi ristretti sotto `openclaw/plugin-sdk/`.
  Questa pagina cataloga i sottopercorsi di uso comune raggruppati per scopo. L'elenco completo
  generato di oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`;
  i sottopercorsi helper riservati dei Plugin inclusi compaiono lì ma sono un dettaglio
  di implementazione a meno che una pagina di documentazione non li promuova esplicitamente.

  Per la guida alla creazione dei Plugin, vedi [Panoramica del Plugin SDK](/it/plugins/sdk-overview).

  ## Entry del Plugin

  | Sottopercorso               | Export principali                                                                                                                      |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export dello schema Zod root di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt di allowlist, builder di stato del setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione/gate delle azioni multi-account, helper di fallback per l'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'account-id |
    | `plugin-sdk/account-resolution` | Helper di lookup dell'account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema della configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper di ciclo di vita/finalizzazione dello stream draft |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per record-and-dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching delle destinazioni |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media in uscita |
    | `plugin-sdk/outbound-runtime` | Helper per consegna in uscita, identità, delegate di invio, sessione, formattazione e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper di ciclo di vita e adapter per l'associazione dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per associazione conversazione/thread, associazione e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per lo snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione del criterio di gruppo runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette di schema della configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scritture di configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Export preludio condivisi del Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione della allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di auth/guard per DM diretti |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di criterio delle menzioni e helper dell'envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per il debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per criterio delle menzioni e testo delle menzioni senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-envelope` | Helper ristretti di formattazione dell'envelope inbound |
    | `plugin-sdk/channel-location` | Helper di contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per drop inbound e errori di typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni dei messaggi del canale, più helper di schema nativi deprecati mantenuti per compatibilità con i Plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching delle destinazioni |
    | `plugin-sdk/channel-contract` | Tipi del contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target dei segreti |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati di setup per provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati di setup per provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione della chiave API nei Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura del profilo della chiave API come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per i Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di lookup delle variabili env per l'autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi del criterio di replay, helper degli endpoint provider e helper di normalizzazione dell'id modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, errori HTTP del provider e helper multipart form per la trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti del contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali per la ricerca web per provider che non hanno bisogno del wiring di abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti del contratto di configurazione/credenziali per la ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider di ricerca web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica dello schema Gemini e helper xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e helper wrapper condivisi Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativo come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper di singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione del gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi inclusa la formattazione dinamica dei menu argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione degli approvatori e helper di auth delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro per approvazioni exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adapter per funzionalità/consegna di approvazione nativa |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del gateway per le approvazioni |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adapter di approvazione nativa per entrypoint hot di canale |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per la gestione delle approvazioni; preferisci le seam più ristrette adapter/gateway quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper di target di approvazione nativa + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper del payload di risposta per approvazioni exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper del payload di approvazione exec/plugin, helper di instradamento/runtime per approvazioni native e helper di visualizzazione strutturata delle approvazioni come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti di reset del dedupe delle risposte inbound |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per i test del contratto del canale senza il barrel di test più ampio |
    | `plugin-sdk/command-auth-native` | Auth dei comandi nativi, formattazione dinamica del menu argomenti e helper di target della sessione nativa |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri del testo dei comandi per percorsi hot di canale |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo dei comandi e della superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei segreti per superfici segrete di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per il parsing del contratto dei segreti/configurazione |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating dei DM, contenuto esterno e raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e criterio SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti del dispatcher fissato senza la più ampia superficie runtime infra |
    | `plugin-sdk/ssrf-runtime` | Helper per dispatcher fissato, fetch protetto da SSRF e criterio SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing degli input segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e storage">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Ampi helper di runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di Webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, wait, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch di stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione e helper di lookup della configurazione del Plugin |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nomi/descrizioni dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink dei riferimenti ai file senza il barrel `text-runtime` più ampio |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/plugin, builder delle funzionalità di approvazione, helper auth/profilo, helper di instradamento/runtime nativi e formattazione strutturata del percorso di visualizzazione delle approvazioni |
    | `plugin-sdk/reply-runtime` | Helper condivisi runtime inbound/reply, chunking, dispatch, Heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione della risposta e label della conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a breve finestra come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti di chunking per testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store di sessione + updated-at |
    | `plugin-sdk/state-paths` | Helper di percorso per directory stato/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave di sessione/associazione account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo di stato del canale/account, valori predefiniti dello stato runtime e helper di metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi di risoluzione della destinazione |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/string |
    | `plugin-sdk/request-url` | Estrae URL stringa da input di tipo fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrae campi canonici della destinazione di invio dagli argomenti dello strumento |
    | `plugin-sdk/temp-path` | Helper condivisi di percorso per download temporanei |
    | `plugin-sdk/logging-core` | Helper di logger del sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione delle tabelle Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe supportata da disco |
    | `plugin-sdk/acp-runtime` | Helper di runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only del binding ACP senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette di schema della configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore tollerante di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione del matching dei nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di associazione |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta di comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skills |
    | `plugin-sdk/native-command-registry` | Helper di registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin fidati per harness agente di basso livello: tipi di harness, helper di steer/abort delle esecuzioni attive, helper bridge degli strumenti OpenClaw, helper di formattazione/dettaglio dell'avanzamento degli strumenti e utility del risultato del tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del corpo della risposta senza la più ampia superficie runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza instradamento del binding configurato o store di associazione |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dello store di sessione senza import di scritture/manutenzione di configurazione più ampie |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione e normalizzazione di record/stringhe primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione del nome host e dell'host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione e runner del retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup della directory basata sulla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e testing">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder del payload media |
    | `plugin-sdk/media-store` | Helper ristretti per lo store dei media come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi di failover per la generazione media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi del provider di media understanding più export helper rivolti ai provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/Markdown/logging come rimozione del testo visibile all'assistente, helper di render/chunking/tabella Markdown, helper di redazione, helper di directive-tag e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper di chunking del testo in uscita |
    | `plugin-sdk/speech` | Tipi del provider speech più export helper rivolti ai provider per directive, registro, validazione e speech |
    | `plugin-sdk/speech-core` | Export condivisi per tipi del provider speech, registro, directive, normalizzazione e helper speech |
    | `plugin-sdk/realtime-transcription` | Tipi del provider di trascrizione realtime, helper del registro e helper condiviso di sessione WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi del provider di voce realtime e helper del registro |
    | `plugin-sdk/image-generation` | Tipi del provider di generazione immagini |
    | `plugin-sdk/image-generation-core` | Helper condivisi di tipi, failover, auth e registro per la generazione immagini |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato della generazione musicale |
    | `plugin-sdk/music-generation-core` | Helper condivisi di tipi, failover, lookup del provider e parsing del model-ref per la generazione musicale |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato della generazione video |
    | `plugin-sdk/video-generation-core` | Helper condivisi di tipi, failover, lookup del provider e parsing del model-ref per la generazione video |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer del plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper `memory-core` inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime dell'indice/ricerca di memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Export del motore foundation dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host di memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Export del motore QMD dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Export del motore di storage dell'host di memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host di memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei segreti dell'host di memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host di memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per helper del journal eventi dell'host di memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per helper file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per helper di stato dell'host di memoria |
    | `plugin-sdk/memory-lancedb` | Superficie helper `memory-lancedb` inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi correnti | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser incluso. `browser-profiles` esporta `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` e `ResolvedBrowserTabCleanupConfig` per la forma normalizzata `browser.tabCleanup`. `browser-support` resta il barrel di compatibilità. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam di compatibilità/helper dei canali inclusi |
    | Helper specifici di auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/Plugin inclusi; `plugin-sdk/github-copilot-token` esporta attualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Setup del Plugin SDK](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
