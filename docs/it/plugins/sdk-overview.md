---
read_when:
    - Hai bisogno di sapere da quale subpath dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione in OpenClawPluginApi
    - Stai cercando una specifica esportazione dell'SDK
sidebarTitle: SDK Overview
summary: Mappa degli import, riferimento dell'API di registrazione e architettura dell'SDK
title: Panoramica dell'SDK Plugin
x-i18n:
    generated_at: "2026-04-22T04:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica dell'SDK Plugin

L'SDK Plugin è il contratto tipizzato tra Plugin e core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo Plugin? Inizia con [Per iniziare](/it/plugins/building-plugins)
  - Plugin di canale? Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Plugin provider](/it/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di import

Importa sempre da un subpath specifico:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni subpath è un modulo piccolo e autosufficiente. Questo mantiene veloce l'avvio e
previene problemi di dipendenze circolari. Per helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la superficie umbrella più ampia e helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da seam di convenienza con nomi di provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` o
seam helper con branding del canale. I Plugin bundled dovrebbero comporre subpath
generici dell'SDK all'interno dei propri barrel `api.ts` o `runtime-api.ts`, e il core
dovrebbe usare quei barrel locali al Plugin oppure aggiungere un contratto SDK
generico e ristretto quando l'esigenza è davvero cross-channel.

La export map generata contiene ancora un piccolo insieme di seam helper per Plugin bundled
come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi
subpath esistono solo per manutenzione e compatibilità dei Plugin bundled; sono
intenzionalmente omessi dalla tabella comune qui sotto e non sono il percorso di
import consigliato per nuovi Plugin di terze parti.

## Riferimento dei subpath

I subpath usati più comunemente, raggruppati per scopo. L'elenco completo generato di
oltre 200 subpath si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I subpath helper riservati ai Plugin bundled compaiono ancora in quell'elenco generato.
Trattali come superfici di dettaglio implementativo/compatibilità, a meno che una pagina della documentazione
non ne promuova esplicitamente uno come pubblico.

### Entry del Plugin

| Subpath                     | Key exports                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Subpath dei canali">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod root `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup, prompt allowlist, builder dello stato di setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per config/action-gate multi-account, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'account-id |
    | `plugin-sdk/account-resolution` | Ricerca account + helper di fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azioni account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema config del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback al contratto bundled |
    | `plugin-sdk/command-gating` | Helper ristretti per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper di ciclo di vita/finalizzazione per draft stream |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder dell'envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound, delega di invio e pianificazione dei payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti per la normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper di ciclo di vita e adapter per i thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/thread binding, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della config runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per la risoluzione della group-policy runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette per lo schema config del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per le scritture di configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise del Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della config allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per le decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard dei DM diretti |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di mention-policy e helper envelope |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per mention-policy senza la più ampia superficie runtime inbound |
    | `plugin-sdk/channel-location` | Helper per contesto di posizione e formattazione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per inbound scartati e errori typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativo deprecati mantenuti per compatibilità del Plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi di contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target secret |
  </Accordion>

  <Accordion title="Subpath dei provider">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati per il setup di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per il setup di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle API key dei Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profili per API key come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per Plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle env var auth del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint provider e helper di normalizzazione model-id come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti per il contratto di config/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di config/credenziali web-search per provider che non hanno bisogno del wiring di abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti per il contratto di config/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica dello schema Gemini e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di stream wrapper e helper condivisi per wrapper Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativo come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
  </Accordion>

  <Accordion title="Subpath di auth e sicurezza">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di comandi/messaggi di aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per la risoluzione degli approvatori e auth delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profili/filtri di approvazione exec nativi |
    | `plugin-sdk/approval-delivery-runtime` | Adapter di capacità/consegna per approvazioni native |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adapter di approvazione nativa per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per l'handler di approvazione; preferisci i seam più ristretti adapter/gateway quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativa + binding account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta delle approvazioni exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper di auth dei comandi nativi + target di sessione nativa |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo del comando e command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto secret per superfici secret di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di typing SecretRef per parsing di contratto secret/config |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuto esterno e raccolta dei secret |
    | `plugin-sdk/ssrf-policy` | Helper di policy SSRF per allowlist host e rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di pinned-dispatcher senza l'ampia superficie infra runtime |
    | `plugin-sdk/ssrf-runtime` | Helper per pinned-dispatcher, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input secret |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body e timeout della richiesta |
  </Accordion>

  <Accordion title="Subpath di runtime e storage">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività del Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per la pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper exec di processo |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Helper per il client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper per caricamento/scrittura della configurazione |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram bundled non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti ai file senza l'ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper per approvazioni exec/plugin, builder di capacità di approvazione, helper auth/profilo, helper di routing/runtime nativi |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime inbound/risposta, chunking, dispatch, Heartbeat, reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione delle risposte |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per il chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store di sessione + updated-at |
    | `plugin-sdk/state-paths` | Helper per i percorsi delle directory state/OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo dello stato di canale/account, valori predefiniti dello stato runtime e helper per metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per la risoluzione dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/string |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti del tool |
    | `plugin-sdk/temp-path` | Helper condivisi per i percorsi di download temporanei |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per la modalità tabella Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper re-entrant per file-lock |
    | `plugin-sdk/persistent-dedupe` | Helper per cache dedupe persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessione ACP e reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only dei binding ACP senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette di schema config runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per le risposte del comando `/models` / provider |
    | `plugin-sdk/skill-commands-runtime` | Helper per l'elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale trusted-plugin per harness di agente di basso livello: tipi di harness, helper per steer/abort delle esecuzioni attive, helper per il bridge dei tool OpenClaw e utility per i risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.AI |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache bounded |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrapped, proxy e lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore bounded del body della risposta senza l'ampia superficie media runtime |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza routing dei binding configurati o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dello session-store senza import ampi di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza import ampi di config/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione e normalizzazione di record/string primitive senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione per hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per dir/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory supportate da config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpath di capacità e test">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/transform/store dei media più builder di payload media |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi di provider per media understanding più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/markdown/logging come rimozione del testo visibile all'assistant, helper per rendering/chunking/tabella Markdown, helper di redazione, helper per directive-tag e utility per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per il chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi di provider speech più helper lato provider per directive, registry e validazione |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider speech, registry, directive e helper di normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione realtime e helper di registry |
    | `plugin-sdk/realtime-voice` | Tipi di provider per voce realtime e helper di registry |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, helper per failover, auth e registry |
    | `plugin-sdk/music-generation` | Tipi di provider/request/result per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, lookup provider e parsing di model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/request/result per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, lookup provider e parsing di model-ref |
    | `plugin-sdk/webhook-targets` | Registry dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer dell'SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpath Memory">
    | Subpath | Key exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper bundled memory-core per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime per indice/ricerca Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del foundation engine dell'host Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti embedding dell'host Memory, accesso al registry, provider locale e helper batch/remoti generici |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage dell'host Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host Memory |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host Memory |
    | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host Memory |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host Memory |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host Memory |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core dell'host Memory |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal eventi dell'host Memory |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime dell'host Memory |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per Plugin adiacenti a Memory |
    | `plugin-sdk/memory-host-search` | Facade runtime di Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato dell'host Memory |
    | `plugin-sdk/memory-lancedb` | Superficie helper bundled memory-lancedb |
  </Accordion>

  <Accordion title="Subpath helper bundled riservati">
    | Family | Current subpaths | Intended use |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser bundled (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Superficie helper/runtime Matrix bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Superficie helper/runtime LINE bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Superficie helper IRC bundled |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam di compatibilità/helper dei canali bundled |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di funzionalità/plugin bundled; `plugin-sdk/github-copilot-token` esporta attualmente `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capacità

| Method                                           | What it registers                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza testuale (LLM)                  |
| `api.registerAgentHarness(...)`                  | Esecutore sperimentale di agente di basso livello |
| `api.registerCliBackend(...)`                    | Backend CLI locale per inferenza           |
| `api.registerChannel(...)`                       | Canale di messaggistica                     |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming      |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex        |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini                      |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                      |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                      |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping           |
| `api.registerWebSearchProvider(...)`             | Ricerca web                            |

### Tool e comandi

| Method                          | What it registers                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Tool agente (obbligatorio oppure `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)             |

### Infrastruttura

| Method                                         | What it registers                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook evento                              |
| `api.registerHttpRoute(params)`                | Endpoint HTTP del Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metodo RPC del Gateway                      |
| `api.registerCli(registrar, opts?)`            | Sottocomando CLI                          |
| `api.registerService(service)`                 | Servizio in background                      |
| `api.registerInteractiveHandler(registration)` | Handler interattivo                     |
| `api.registerMemoryPromptSupplement(builder)`  | Sezione prompt additiva adiacente a Memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Corpus additivo per ricerca/lettura Memory      |

I namespace admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un Plugin prova ad assegnare
uno scope più ristretto a un metodo gateway. Preferisci prefissi specifici del Plugin per
i metodi posseduti dal Plugin.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: root di comandi espliciti posseduti dal registrar
- `descriptors`: descrittori di comandi a tempo di parsing usati per help della CLI root,
  instradamento e registrazione CLI lazy del Plugin

Se vuoi che un comando Plugin resti caricato lazy nel normale percorso della CLI root,
fornisci `descriptors` che coprano ogni root di comando di primo livello esposto da quel
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
        description: "Gestisci account Matrix, verifica, dispositivi e stato del profilo",
        hasSubcommands: true,
      },
    ],
  },
);
```

Usa `commands` da solo solo quando non hai bisogno della registrazione lazy della CLI root.
Questo percorso di compatibilità eager resta supportato, ma non installa
placeholder supportati da descriptor per il caricamento lazy a tempo di parsing.

### Registrazione del backend CLI

`api.registerCliBackend(...)` permette a un Plugin di possedere la configurazione predefinita per un
backend CLI AI locale come `codex-cli`.

- Il backend `id` diventa il prefisso provider nei riferimenti ai modelli come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente continua ad avere priorità. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del Plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio la normalizzazione di vecchie forme di flag).

### Slot esclusivi

| Method                                     | What it registers                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capacità Memory unificata                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione prompt Memory                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush Memory                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime Memory                                                                                                                                    |

### Adapter di embedding Memory

| Method                                         | What it registers                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding Memory per il Plugin attivo |

- `registerMemoryCapability` è l'API preferita del Plugin Memory esclusivo.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i Plugin companion possono consumare artifact Memory esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di entrare nel layout privato
  di uno specifico Plugin Memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API legacy-compatibili del Plugin Memory esclusivo.
- `registerMemoryEmbeddingProvider` permette al Plugin Memory attivo di registrare uno
  o più id di adapter embedding (per esempio `openai`, `gemini` o un id personalizzato definito dal Plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a questi id di adapter registrati.

### Eventi e ciclo di vita

| Method                                       | What it does                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di ciclo di vita tipizzato          |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica decisionale degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (uguale a omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (uguale a omettere `cancel`), non come override.

### Campi dell'oggetto API

| Field                    | Type                      | Description                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID del Plugin                                                                                   |
| `api.name`               | `string`                  | Nome visualizzato                                                                                |
| `api.version`            | `string?`                 | Versione del Plugin (facoltativa)                                                                   |
| `api.description`        | `string?`                 | Descrizione del Plugin (facoltativa)                                                               |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Directory root del Plugin (facoltativa)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime in-memory attivo quando disponibile)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger con ambito (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve il percorso relativo alla root del Plugin                                                        |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per gli import interni:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumer esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Punto di ingresso del Plugin
  setup-entry.ts    # Entry leggera solo setup (facoltativa)
```

<Warning>
  Non importare mai il tuo stesso Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada gli import interni tramite `./api.ts` oppure
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le superfici pubbliche dei Plugin bundled caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) ora preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
uno snapshot runtime, usano come fallback il file di configurazione risolto su disco.

I Plugin provider possono anche esporre un barrel di contratto locale al Plugin quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un subpath SDK generico.
Esempio bundled attuale: il provider Anthropic mantiene i suoi helper di stream Claude
nel proprio seam pubblico `api.ts` / `contract-api.ts` invece di
promuovere la logica Anthropic beta-header e `service_tier` in un contratto generico
`plugin-sdk/*`.

Altri esempi bundled attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder di provider,
  helper di modelli predefiniti e builder di provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper di onboarding/configurazione

<Warning>
  Il codice di produzione delle estensioni dovrebbe anche evitare import `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un subpath SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  superficie orientata alla capacità invece di accoppiare due Plugin.
</Warning>

## Correlati

- [Punti di ingresso](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry` e `defineChannelPluginEntry`
- [Helper runtime](/it/plugins/sdk-runtime) — riferimento completo dello spazio dei nomi `api.runtime`
- [Setup e configurazione](/it/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Testing](/it/plugins/sdk-testing) — utility di test e regole lint
- [Migrazione SDK](/it/plugins/sdk-migration) — migrazione dalle superfici deprecate
- [Interni del Plugin](/it/plugins/architecture) — architettura approfondita e modello di capacità
