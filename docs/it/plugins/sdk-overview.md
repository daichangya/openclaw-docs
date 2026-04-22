---
read_when:
    - Devi sapere da quale sottopercorso dell'SDK importare
    - Vuoi un riferimento per tutti i metodi di registrazione su OpenClawPluginApi
    - Stai cercando una specifica esportazione dell'SDK
sidebarTitle: SDK Overview
summary: Mappa di importazione, riferimento API di registrazione e architettura SDK
title: Panoramica dell'SDK del Plugin
x-i18n:
    generated_at: "2026-04-22T08:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57019e6f9a7fed7842ac575e025b6db41d125f5fa9d0d1de03923fdb1f6bcc3
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Panoramica dell'SDK del Plugin

L'SDK del Plugin è il contratto tipizzato tra i plugin e il core. Questa pagina è il
riferimento per **cosa importare** e **cosa puoi registrare**.

<Tip>
  **Cerchi una guida pratica?**
  - Primo Plugin? Inizia con [Getting Started](/it/plugins/building-plugins)
  - Plugin di canale? Vedi [Channel Plugins](/it/plugins/sdk-channel-plugins)
  - Plugin provider? Vedi [Provider Plugins](/it/plugins/sdk-provider-plugins)
</Tip>

## Convenzione di importazione

Importa sempre da uno specifico sottopercorso:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Ogni sottopercorso è un modulo piccolo e autosufficiente. Questo mantiene veloce l'avvio e
previene problemi di dipendenze circolari. Per gli helper di entry/build specifici del canale,
preferisci `openclaw/plugin-sdk/channel-core`; mantieni `openclaw/plugin-sdk/core` per
la surface ombrello più ampia e gli helper condivisi come
`buildChannelConfigSchema`.

Non aggiungere né dipendere da seam di convenienza con nome del provider come
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, o
seam helper con brand del canale. I plugin inclusi dovrebbero comporre sottopercorsi
SDK generici all'interno dei propri barrel `api.ts` o `runtime-api.ts`, e il core
dovrebbe usare tali barrel locali al plugin oppure aggiungere un contratto SDK generico e ristretto
quando l'esigenza è davvero cross-channel.

La mappa di esportazione generata contiene ancora un piccolo insieme di seam helper
dei plugin inclusi come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi
sottopercorsi esistono solo per manutenzione e compatibilità dei plugin inclusi; sono
intenzionalmente omessi dalla tabella comune qui sotto e non sono il percorso di
importazione consigliato per nuovi plugin di terze parti.

## Riferimento dei sottopercorsi

I sottopercorsi usati più comunemente, raggruppati per scopo. L'elenco completo generato di
oltre 200 sottopercorsi si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

I sottopercorsi helper riservati ai plugin inclusi compaiono ancora in quell'elenco generato.
Trattali come dettagli di implementazione/surface di compatibilità, a meno che una pagina della documentazione
non ne promuova esplicitamente uno come pubblico.

### Entry del Plugin

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
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per setup wizard, prompt allowlist, builder di stato del setup |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per config/gate di azione multi-account, helper di fallback per account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'account-id |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azione account |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Tipi di schema della configurazione del canale |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helper di lifecycle/finalizzazione per draft stream |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper condivisi per registrazione e dispatch inbound |
    | `plugin-sdk/messaging-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media outbound |
    | `plugin-sdk/outbound-runtime` | Helper per identità outbound, delegato di invio e pianificazione del payload |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper di lifecycle e adapter per thread-binding |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper di snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione delle group policy runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette di schema configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni di preambolo condivise del plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di lettura/modifica della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi per auth/guard dei messaggi diretti |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Vedi [Message Presentation](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce inbound, matching delle menzioni, helper di mention-policy ed envelope |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti di mention-policy senza la più ampia surface runtime inbound |
    | `plugin-sdk/channel-location` | Helper di contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per scarti inbound e errori di typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi del canale, più helper di schema nativo deprecati mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-targets` | Helper di parsing/matching dei target |
    | `plugin-sdk/channel-contract` | Tipi di contratto del canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti del contratto dei secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi target dei secret |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helper curati di setup per provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati di setup per provider self-hosted compatibili OpenAI |
    | `plugin-sdk/cli-backend` | Valori predefiniti del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime di risoluzione delle API key per plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura del profilo API key come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-auth-login` | Helper condivisi di login interattivo per plugin provider |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle env var di autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper di endpoint provider e helper di normalizzazione dell'id modello come `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici di capacità HTTP/endpoint del provider |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti del contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali web-search per provider che non necessitano del wiring di abilitazione del plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica, e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi dei wrapper stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto nativo del provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper di singleton/map/cache locali al processo |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro dei comandi, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi di comando/help come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper di risoluzione dell'approvatore e di autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi di profilo/filtro per approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adapter nativi di capability/consegna dell'approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento dell'adapter di approvazione nativo per entrypoint hot dei canali |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per il gestore di approvazione; preferisci i seam più ristretti adapter/gateway quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione + binding dell'account |
    | `plugin-sdk/approval-reply-runtime` | Helper del payload di risposta per approvazione exec/plugin |
    | `plugin-sdk/command-auth-native` | Helper nativi per autenticazione dei comandi + target di sessione nativo |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo dei comandi e helper della surface dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta del contratto dei secret per surface di secret di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e di tipizzazione SecretRef per parsing di contratto/configurazione dei secret |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, contenuto esterno e raccolta dei secret |
    | `plugin-sdk/ssrf-policy` | Helper di policy SSRF per allowlist host e rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti di dispatcher fissato senza la più ampia surface runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Helper per dispatcher fissato, fetch protetto da SSRF e policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input dei secret |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione del body della richiesta/timeout |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e storage">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione plugin |
    | `plugin-sdk/runtime-env` | Helper ristretti per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comando/hook/http/interattività del plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi della pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper di importazione/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione dei processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa e versione |
    | `plugin-sdk/gateway-runtime` | Helper per client Gateway e patch dello stato del canale |
    | `plugin-sdk/config-runtime` | Helper di caricamento/scrittura della configurazione |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la surface del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento dell'autolink di riferimenti a file senza il più ampio barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativo |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposta, chunking, dispatch, Heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch/finalizzazione delle risposte |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte a finestra breve come `buildHistoryContext`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper ristretti per chunking di testo/Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store delle sessioni + `updated-at` |
    | `plugin-sdk/state-paths` | Helper di percorso per directory di stato/OAuth |
    | `plugin-sdk/routing` | Helper per route/session-key/binding dell'account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo di stato canale/account, valori predefiniti dello stato runtime e helper di metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione per slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Esecutore di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri per tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti dei tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temporanei di download |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura dello stato JSON |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe persistente su disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch delle risposte |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione read-only del binding ACP senza importazioni di avvio del lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive ristrette di schema configurazione runtime dell'agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta per comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Surface sperimentale per plugin attendibili per harness di agenti di basso livello: tipi di harness, helper di steering/abort dei run attivi, helper di bridge degli strumenti OpenClaw e utility per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Helper di rilevamento degli endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Helper per eventi di sistema/Heartbeat |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag ed eventi diagnostici |
    | `plugin-sdk/error-runtime` | Grafo degli errori, formattazione, helper condivisi di classificazione degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrapper, proxy e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza importazioni di proxy/fetch protetto |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del body della risposta senza la più ampia surface runtime dei media |
    | `plugin-sdk/session-binding-runtime` | Stato corrente del binding della conversazione senza routing di binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper di lettura dello store delle sessioni senza importazioni ampie di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza importazioni ampie di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper ristretti di coercizione e normalizzazione di record/stringhe primitive senza importazioni di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione per hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione ed esecuzione dei retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace dell'agente |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory supportata dalla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capability e testing">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per fetch/trasformazione/store dei media più builder del payload dei media |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione media, selezione dei candidati e messaggistica per modello mancante |
    | `plugin-sdk/media-understanding` | Tipi di provider per comprensione dei media più esportazioni helper lato provider per immagini/audio |
    | `plugin-sdk/text-runtime` | Helper condivisi per testo/Markdown/logging come rimozione del testo visibile all'assistente, helper di render/chunking/tabella Markdown, helper di redazione, helper per tag di direttiva e utility di testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per chunking del testo outbound |
    | `plugin-sdk/speech` | Tipi di provider speech più helper lato provider per direttive, registro e validazione |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider speech, helper per registro, direttive e normalizzazione |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale e helper di registro |
    | `plugin-sdk/realtime-voice` | Tipi di provider voce in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, helper per failover, autenticazione e registro |
    | `plugin-sdk/music-generation` | Tipi provider/request/result per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper per failover, lookup del provider e parsing del riferimento modello |
    | `plugin-sdk/video-generation` | Tipi provider/request/result per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper per failover, lookup del provider e parsing del riferimento modello |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Helper di normalizzazione del percorso Webhook |
    | `plugin-sdk/web-media` | Helper condivisi per caricamento di media remoti/locali |
    | `plugin-sdk/zod` | `zod` riesportato per i consumer dell'SDK del Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface helper `memory-core` inclusa per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage dell'host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei secret dell'host della memoria |
    | `plugin-sdk/memory-core-host-events` | Helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-core` | Alias neutrale rispetto al vendor per gli helper runtime core dell'host della memoria |
    | `plugin-sdk/memory-host-events` | Alias neutrale rispetto al vendor per gli helper del journal eventi dell'host della memoria |
    | `plugin-sdk/memory-host-files` | Alias neutrale rispetto al vendor per gli helper file/runtime dell'host della memoria |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime di Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias neutrale rispetto al vendor per gli helper di stato dell'host della memoria |
    | `plugin-sdk/memory-lancedb` | Surface helper `memory-lancedb` inclusa |
  </Accordion>

  <Accordion title="Sottopercorsi helper inclusi riservati">
    | Famiglia | Sottopercorsi attuali | Uso previsto |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helper di supporto del Plugin browser incluso (`browser-support` resta il barrel di compatibilità) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface helper/runtime Matrix inclusa |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface helper/runtime LINE inclusa |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface helper IRC inclusa |
    | Helper specifici del canale | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seam helper/di compatibilità dei canali inclusi |
    | Helper specifici di auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seam helper di feature/plugin inclusi; `plugin-sdk/github-copilot-token` attualmente esporta `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API di registrazione

La callback `register(api)` riceve un oggetto `OpenClawPluginApi` con questi
metodi:

### Registrazione delle capability

| Metodo                                           | Cosa registra                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferenza di testo (LLM)               |
| `api.registerAgentHarness(...)`                  | Esecutore sperimentale di agenti di basso livello |
| `api.registerCliBackend(...)`                    | Backend di inferenza CLI locale        |
| `api.registerChannel(...)`                       | Canale di messaggistica                |
| `api.registerSpeechProvider(...)`                | Sintesi text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Trascrizione realtime in streaming     |
| `api.registerRealtimeVoiceProvider(...)`         | Sessioni vocali realtime duplex        |
| `api.registerMediaUnderstandingProvider(...)`    | Analisi di immagini/audio/video        |
| `api.registerImageGenerationProvider(...)`       | Generazione di immagini                |
| `api.registerMusicGenerationProvider(...)`       | Generazione musicale                   |
| `api.registerVideoGenerationProvider(...)`       | Generazione video                      |
| `api.registerWebFetchProvider(...)`              | Provider di web fetch / scraping       |
| `api.registerWebSearchProvider(...)`             | Ricerca web                            |

### Strumenti e comandi

| Metodo                          | Cosa registra                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Strumento agente (obbligatorio o `{ optional: true }`) |
| `api.registerCommand(def)`      | Comando personalizzato (bypassa l'LLM)       |

### Infrastruttura

| Metodo                                          | Cosa registra                            |
| ----------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook evento                              |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                    |
| `api.registerGatewayMethod(name, handler)`      | Metodo RPC Gateway                       |
| `api.registerCli(registrar, opts?)`             | Sottocomando CLI                         |
| `api.registerService(service)`                  | Servizio in background                   |
| `api.registerInteractiveHandler(registration)`  | Gestore interattivo                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Factory di estensione embedded-runner Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Sezione di prompt additiva adiacente alla memoria |
| `api.registerMemoryCorpusSupplement(adapter)`   | Corpus additivo di ricerca/lettura della memoria |

I namespace admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) restano sempre `operator.admin`, anche se un plugin prova ad assegnare uno
scope di metodo gateway più ristretto. Preferisci prefissi specifici del plugin per
i metodi gestiti dal plugin.

Usa `api.registerEmbeddedExtensionFactory(...)` quando un plugin richiede timing di eventi
nativo Pi durante esecuzioni embedded di OpenClaw, per esempio riscritture asincrone di
`tool_result` che devono avvenire prima che venga emesso il messaggio finale del risultato del tool.
Oggi questo è un seam dei plugin inclusi: solo i plugin inclusi possono registrarne uno, e
devono dichiarare `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json`. Mantieni i normali hook dei plugin OpenClaw per tutto ciò
che non richiede quel seam di livello più basso.

### Metadati di registrazione CLI

`api.registerCli(registrar, opts?)` accetta due tipi di metadati di primo livello:

- `commands`: root di comando esplicite gestite dal registrar
- `descriptors`: descrittori di comando a tempo di parsing usati per help della CLI root,
  instradamento e registrazione lazy della CLI del plugin

Se vuoi che un comando del plugin resti lazy-loaded nel normale percorso della CLI root,
fornisci `descriptors` che coprano ogni root di comando di primo livello esposta da quel
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

`api.registerCliBackend(...)` permette a un plugin di gestire la configurazione predefinita per un
backend CLI AI locale come `codex-cli`.

- L'`id` del backend diventa il prefisso provider nei riferimenti modello come `codex-cli/gpt-5`.
- La `config` del backend usa la stessa forma di `agents.defaults.cliBackends.<id>`.
- La configurazione utente continua ad avere la precedenza. OpenClaw unisce `agents.defaults.cliBackends.<id>` sopra il
  valore predefinito del plugin prima di eseguire la CLI.
- Usa `normalizeConfig` quando un backend richiede riscritture di compatibilità dopo il merge
  (per esempio per normalizzare vecchie forme di flag).

### Slot esclusivi

| Metodo                                     | Cosa registra                                                                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Motore di contesto (uno attivo alla volta). La callback `assemble()` riceve `availableTools` e `citationsMode` così il motore può adattare le aggiunte al prompt. |
| `api.registerMemoryCapability(capability)` | Capability di memoria unificata                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Builder della sezione di prompt della memoria                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver del piano di flush della memoria                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime della memoria                                                                                                                                |

### Adapter di embedding della memoria

| Metodo                                         | Cosa registra                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter di embedding della memoria per il plugin attivo |

- `registerMemoryCapability` è l'API preferita del plugin di memoria esclusivo.
- `registerMemoryCapability` può anche esporre `publicArtifacts.listArtifacts(...)`
  così i plugin companion possono consumare gli artifact di memoria esportati tramite
  `openclaw/plugin-sdk/memory-host-core` invece di entrare nel layout privato
  di uno specifico plugin di memoria.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` e
  `registerMemoryRuntime` sono API legacy-compatibili del plugin di memoria esclusivo.
- `registerMemoryEmbeddingProvider` permette al plugin di memoria attivo di registrare uno
  o più id adapter di embedding (per esempio `openai`, `gemini` o un id personalizzato definito dal plugin).
- La configurazione utente come `agents.defaults.memorySearch.provider` e
  `agents.defaults.memorySearch.fallback` viene risolta rispetto a quegli id adapter registrati.

### Eventi e lifecycle

| Metodo                                       | Cosa fa                      |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook di lifecycle tipizzato  |
| `api.onConversationBindingResolved(handler)` | Callback di binding della conversazione |

### Semantica delle decisioni degli hook

- `before_tool_call`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_tool_call`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `before_install`: restituire `{ block: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `before_install`: restituire `{ block: false }` viene trattato come nessuna decisione (come omettere `block`), non come override.
- `reply_dispatch`: restituire `{ handled: true, ... }` è terminale. Una volta che un handler rivendica il dispatch, gli handler con priorità inferiore e il percorso predefinito di dispatch del modello vengono saltati.
- `message_sending`: restituire `{ cancel: true }` è terminale. Una volta che un handler lo imposta, gli handler con priorità inferiore vengono saltati.
- `message_sending`: restituire `{ cancel: false }` viene trattato come nessuna decisione (come omettere `cancel`), non come override.

### Campi dell'oggetto API

| Campo                    | Tipo                      | Descrizione                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id del Plugin                                                                              |
| `api.name`               | `string`                  | Nome visualizzato                                                                          |
| `api.version`            | `string?`                 | Versione del Plugin (facoltativa)                                                          |
| `api.description`        | `string?`                 | Descrizione del Plugin (facoltativa)                                                       |
| `api.source`             | `string`                  | Percorso sorgente del Plugin                                                               |
| `api.rootDir`            | `string?`                 | Directory radice del Plugin (facoltativa)                                                  |
| `api.config`             | `OpenClawConfig`          | Snapshot della configurazione corrente (snapshot runtime in memoria attivo quando disponibile) |
| `api.pluginConfig`       | `Record<string, unknown>` | Configurazione specifica del Plugin da `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/it/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger con scope (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/setup pre-entry completa |
| `api.resolvePath(input)` | `(string) => string`      | Risolve un percorso relativo alla radice del Plugin                                        |

## Convenzione dei moduli interni

All'interno del tuo Plugin, usa file barrel locali per le importazioni interne:

```
my-plugin/
  api.ts            # Esportazioni pubbliche per consumer esterni
  runtime-api.ts    # Esportazioni runtime solo interne
  index.ts          # Entry point del Plugin
  setup-entry.ts    # Entry leggera solo per setup (facoltativa)
```

<Warning>
  Non importare mai il tuo stesso Plugin tramite `openclaw/plugin-sdk/<your-plugin>`
  dal codice di produzione. Instrada le importazioni interne tramite `./api.ts` o
  `./runtime-api.ts`. Il percorso SDK è solo il contratto esterno.
</Warning>

Le surface pubbliche dei plugin inclusi caricate tramite facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` e file di entry pubblici simili) ora preferiscono lo
snapshot della configurazione runtime attiva quando OpenClaw è già in esecuzione. Se non esiste ancora
uno snapshot runtime, usano come fallback il file di configurazione risolto su disco.

I plugin provider possono anche esporre un barrel di contratto locale al plugin e ristretto quando un
helper è intenzionalmente specifico del provider e non appartiene ancora a un sottopercorso SDK
generico. Esempio incluso attuale: il provider Anthropic mantiene i propri helper di stream Claude
nel proprio seam pubblico `api.ts` / `contract-api.ts` invece di
promuovere la logica di header beta Anthropic e `service_tier` in un contratto
generico `plugin-sdk/*`.

Altri esempi inclusi attuali:

- `@openclaw/openai-provider`: `api.ts` esporta builder del provider,
  helper per modelli predefiniti e builder di provider realtime
- `@openclaw/openrouter-provider`: `api.ts` esporta il builder del provider più
  helper di onboarding/configurazione

<Warning>
  Il codice di produzione delle estensioni dovrebbe evitare anche importazioni da `openclaw/plugin-sdk/<other-plugin>`.
  Se un helper è davvero condiviso, promuovilo a un sottopercorso SDK neutrale
  come `openclaw/plugin-sdk/speech`, `.../provider-model-shared` o un'altra
  surface orientata alle capability invece di accoppiare due plugin tra loro.
</Warning>

## Correlati

- [Entry Points](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry` e `defineChannelPluginEntry`
- [Runtime Helpers](/it/plugins/sdk-runtime) — riferimento completo del namespace `api.runtime`
- [Setup and Config](/it/plugins/sdk-setup) — packaging, manifest, schemi di configurazione
- [Testing](/it/plugins/sdk-testing) — utility di test e regole di lint
- [SDK Migration](/it/plugins/sdk-migration) — migrazione dalle surface deprecate
- [Plugin Internals](/it/plugins/architecture) — architettura approfondita e modello delle capability
