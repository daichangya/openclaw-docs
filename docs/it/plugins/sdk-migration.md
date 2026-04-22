---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin all'architettura moderna dei plugin
    - Mantieni un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di compatibilità retroattiva al moderno Plugin SDK
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:25:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrazione del Plugin SDK

OpenClaw è passato da un ampio layer di compatibilità retroattiva a una moderna
architettura dei plugin con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema dei plugin forniva due superfici molto ampie che permettevano ai plugin di importare
qualsiasi cosa servisse da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i plugin hook-based meno recenti mentre veniva costruita la
  nuova architettura dei plugin.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto agli
  helper lato host come il runner dell'agente embedded.

Entrambe le superfici sono ora **deprecated**. Funzionano ancora a runtime, ma i nuovi
plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima che la prossima
major release le rimuova.

<Warning>
  Il layer di compatibilità retroattiva verrà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili rispetto a quelli interni

Il moderno Plugin SDK risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un piccolo modulo autonomo con uno scopo chiaro e un contratto documentato.

Anche le convenience seam legacy dei provider per i canali inclusi non esistono più. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper con branding del canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti stabili per i plugin. Usa invece subpath SDK generici e ristretti. All'interno dello
workspace del plugin incluso, mantieni gli helper posseduti dal provider nel `api.ts` o `runtime-api.ts`
del plugin stesso.

Esempi attuali di provider inclusi:

- Anthropic mantiene gli helper di stream specifici di Claude nelle proprie seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder provider, helper per i modelli predefiniti e builder provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene builder provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Come migrare

<Steps>
  <Step title="Migra gli handler approval-native ai capability fact">
    I plugin di canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Cambiamenti principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/delivery specifici dell'approvazione fuori dal wiring legacy `plugin.auth` /
      `plugin.approvals` e dentro `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei plugin di canale;
      sposta i campi delivery/native/render dentro `approvalCapability`
    - `plugin.auth` resta per i soli flussi login/logout del canale; gli hook auth di approvazione
      lì non vengono più letti dal core
    - Registra gli oggetti runtime posseduti dal canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute posseduti dal plugin dagli handler di approvazione nativi;
      il core ora possiede gli avvisi di instradamento-altrove dai risultati effettivi di delivery
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente delle approval capability.

  </Step>

  <Step title="Verifica il comportamento di fallback del wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modalità chiusa a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Imposta questo solo per chiamanti di compatibilità fidati che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il chiamante non dipende intenzionalmente dal fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecated">
    Cerca nel tuo plugin gli import da una delle due superfici deprecated:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer deprecated di compatibilità retroattiva)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni mirati)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime del plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Prima (bridge extension-api deprecated)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Dopo (runtime iniettato)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica ad altri helper bridge legacy:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper del session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Tabella dei percorsi di import comuni">
  | Percorso di import | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione umbrella legacy per definizioni/builder di entry di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati di entry di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per il setup wizard | Prompt allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime per il setup | Adapter di patch setup sicuri per l'import, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per il setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione di account-id |
  | `plugin-sdk/account-resolution` | Helper per il lookup degli account | Helper per lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper ristretti per account | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adapter del setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di abbinamento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome comando, trim della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione della policy gruppi/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita dello stream di bozza | `createAccountStatusSink`, helper di finalizzazione anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in ingresso | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in ingresso | Helper condivisi per record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper per parsing/corrispondenza dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime per l'uscita | Helper per identità/delega di invio in uscita e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread binding | Helper per ciclo di vita e adapter dei thread binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder di payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecated | Solo utility runtime legacy del canale |
  | `plugin-sdk/channel-send-result` | Tipi di risultato di invio | Tipi di risultato della risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper ristretti per l'ambiente runtime | Helper per logger/ambiente runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interactive del plugin |
  | `plugin-sdk/hook-runtime` | Helper per la pipeline degli hook | Helper condivisi per pipeline di webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper per processi | Helper condivisi di exec |
  | `plugin-sdk/cli-runtime` | Helper runtime della CLI | Formattazione comandi, attese, helper per versione |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Client Gateway e helper di patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram con fallback stabile quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/plugin, helper per capability/profile di approvazione, helper runtime/instradamento per approvazioni native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per approvazioni | Risoluzione degli approvatori, auth delle azioni nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per approvazioni | Helper per profilo/filtro delle exec approvals native |
  | `plugin-sdk/approval-delivery-runtime` | Helper di delivery per approvazioni | Adapter per capability/delivery delle approvazioni native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway per approvazioni | Helper condiviso di risoluzione Gateway delle approvazioni |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter per approvazioni | Helper leggeri di caricamento degli adapter di approvazione nativi per entrypoint hot di canale |
  | `plugin-sdk/approval-handler-runtime` | Helper handler per approvazioni | Helper runtime più ampi per gli handler di approvazione; preferisci le seam più ristrette adapter/gateway quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper target per approvazioni | Helper per target nativi di approvazione/binding account |
  | `plugin-sdk/approval-reply-runtime` | Helper di risposta per approvazioni | Helper per payload di risposta delle approvazioni exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per runtime-context di canale | Helper generici register/get/watch per il runtime-context del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta dei segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher pinned, fetch protetto, helper di policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per graph degli errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrapped | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper per retry | `RetryConfig`, `retryAsync`, esecutori di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping degli input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper per la superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registry dei comandi |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing degli input segreti | Helper per input segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste webhook | Utility per target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard per body webhook | Helper per lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso delle risposte | Dispatch in ingresso, Heartbeat, pianificatore di risposte, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per dispatch delle risposte | Helper per finalize + dispatch provider |
  | `plugin-sdk/reply-history` | Helper per cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk di risposta | Helper per chunking di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper per session store | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper per percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper per instradamento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo dello stato di canale/account, valori predefiniti dello stato runtime, helper per metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per risolutore di target | Helper condivisi per risolutore di target |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper per URL di richiesta | Estrai URL stringa da input tipo request |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload del tool | Estrai payload normalizzati da oggetti risultato tool |
  | `plugin-sdk/tool-send` | Estrazione dell'invio del tool | Estrai campi target di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Helper per logger di sottosistema e redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle markdown | Helper per modalità tabella markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta messaggio | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati di setup per provider locali/self-hosted | Helper di rilevamento/configurazione di provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati di setup per provider self-hosted compatibili con OpenAI | Gli stessi helper di rilevamento/configurazione di provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime per provider | Helper runtime di risoluzione della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della chiave API del provider | Helper per onboarding/scrittura profilo della chiave API |
  | `plugin-sdk/provider-auth-result` | Helper per auth-result del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper di lookup delle env var auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint del provider e helper di normalizzazione del model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capacità endpoint del provider |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper per registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search del provider | Helper ristretti per configurazione/credenziali web-search per provider che non richiedono il wiring di abilitazione del plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search del provider | Helper ristretti del contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper per registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica dello schema Gemini e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di usage del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di usage del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di transport del provider | Helper nativi di transport del provider come fetch protetto, trasformazioni dei messaggi di transport e stream di eventi di transport scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda async ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media condivisi | Helper per fetch/transform/store dei media più builder di payload media |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per generazione media | Helper condivisi per failover, selezione dei candidati e messaggi di modello mancante per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper per comprensione dei media | Tipi provider per comprensione dei media più export helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper testo condivisi | Rimozione del testo visibile all'assistente, helper di render/chunking/tabella markdown, helper di redazione, helper per directive-tag, utility di testo sicuro e relativi helper di testo/logging |
  | `plugin-sdk/text-chunking` | Helper per chunking del testo | Helper per chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi provider speech più helper lato provider per directive, registry e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi provider speech, registry, directive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi provider e helper registry |
  | `plugin-sdk/realtime-voice` | Helper per voce realtime | Tipi provider e helper registry |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione immagini | Tipi, failover, auth e helper registry per generazione immagini |
  | `plugin-sdk/music-generation` | Helper per generazione musicale | Tipi provider/richiesta/risultato per generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per generazione musicale | Tipi per generazione musicale, helper di failover, lookup provider e parsing del model-ref |
  | `plugin-sdk/video-generation` | Helper per generazione video | Tipi provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione video | Tipi per generazione video, helper di failover, lookup provider e parsing del model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload delle risposte interattive |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive ristrette di channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper per scritture di configurazione del canale | Helper di autorizzazione per scritture di configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso del canale | Export del prelude condiviso dei plugin di canale |
  | `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper per modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Helper condivisi per auth/guard dei DM diretti |
  | `plugin-sdk/extension-shared` | Helper condivisi dell'estensione | Primitive helper per canale passivo/stato e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per target webhook | Helper per registry dei target webhook e installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per path webhook | Helper di normalizzazione del path webhook |
  | `plugin-sdk/web-media` | Helper web media condivisi | Helper per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumer del Plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core inclusi | Superficie helper per memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime per index/search della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation dell'host di memoria | Export del motore foundation dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings dell'host di memoria | Contratti degli embeddings della memoria, accesso al registry, provider locale e helper generici batch/remoti; i provider remoti concreti si trovano nei plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD dell'host di memoria | Export del motore QMD dell'host di memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage dell'host di memoria | Export del motore storage dell'host di memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria | Helper multimodali dell'host di memoria |
  | `plugin-sdk/memory-core-host-query` | Helper query dell'host di memoria | Helper query dell'host di memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host di memoria | Helper secret dell'host di memoria |
  | `plugin-sdk/memory-core-host-events` | Helper journal eventi dell'host di memoria | Helper journal eventi dell'host di memoria |
  | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria | Helper di stato dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI dell'host di memoria | Helper runtime CLI dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core dell'host di memoria | Helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria | Helper file/runtime dell'host di memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core dell'host di memoria | Alias vendor-neutral per helper runtime core dell'host di memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi dell'host di memoria | Alias vendor-neutral per helper journal eventi dell'host di memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime dell'host di memoria | Alias vendor-neutral per helper file/runtime dell'host di memoria |
  | `plugin-sdk/memory-host-markdown` | Helper markdown gestito | Helper condivisi per managed-markdown per plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del search-manager di Active Memory |
  | `plugin-sdk/memory-host-status` | Alias di stato dell'host di memoria | Alias vendor-neutral per helper di stato dell'host di memoria |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb inclusi | Superficie helper di memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie del SDK. L'elenco completo degli oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune seam helper di plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi restano esportati per
manutenzione e compatibilità dei plugin inclusi, ma sono intenzionalmente
omessi dalla tabella comune di migrazione e non sono il target consigliato per
nuovo codice plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici di helper/plugin inclusi come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` attualmente espone la superficie ristretta degli helper token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al lavoro da svolgere. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Tempistiche di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecated emettono avvisi a runtime                       |
| **Prossima major release** | Le superfici deprecated verranno rimosse; i plugin che le usano ancora falliranno |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo plugin
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo degli import subpath
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
- [Interni dei plugin](/it/plugins/architecture) — approfondimento sull'architettura
- [Manifest del plugin](/it/plugins/manifest) — riferimento dello schema del manifest
