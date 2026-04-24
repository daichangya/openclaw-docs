---
read_when:
    - Vedi l'avviso `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Vedi l'avviso `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Stai aggiornando un Plugin alla moderna architettura dei plugin
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di retrocompatibilità al moderno SDK dei plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:54:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw è passato da un ampio livello di retrocompatibilità a una moderna architettura dei plugin con import mirati e documentati. Se il tuo Plugin è stato creato prima della nuova architettura, questa guida ti aiuta a eseguire la migrazione.

## Cosa sta cambiando

Il vecchio sistema dei plugin forniva due superfici molto ampie che permettevano ai plugin di importare qualsiasi cosa servisse da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di helper. È stato introdotto per mantenere funzionanti i vecchi plugin basati su hook mentre veniva sviluppata la nuova architettura dei plugin.
- **`openclaw/extension-api`** — un ponte che dava ai plugin accesso diretto agli helper lato host, come l'embedded agent runner.

Entrambe le superfici sono ora **deprecate**. Continuano a funzionare a runtime, ma i nuovi plugin non devono usarle e i plugin esistenti dovrebbero migrare prima che la prossima major release le rimuova.

OpenClaw non rimuove né reinterpreta il comportamento dei plugin documentato nello stesso cambiamento che introduce una sostituzione. Le modifiche incompatibili al contratto devono prima passare attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione. Questo vale per gli import dell'SDK, i campi del manifest, le API di setup, gli hook e il comportamento di registrazione a runtime.

<Warning>
  Il livello di retrocompatibilità sarà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
</Warning>

## Perché questo è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno Plugin SDK risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`) è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Sono state rimosse anche le legacy provider convenience seams per i canali inclusi. Import come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, le helper seams brandizzate per canale e `openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non contratti stabili per i plugin. Usa invece subpath stretti e generici del SDK. All'interno del workspace del Plugin incluso, mantieni gli helper di proprietà del provider nel `api.ts` o `runtime-api.ts` del Plugin stesso.

Esempi attuali di provider inclusi:

- Anthropic mantiene gli helper di stream specifici per Claude nel proprio seam `api.ts` / `contract-api.ts`
- OpenAI mantiene i builder del provider, gli helper per i modelli predefiniti e i builder del provider realtime nel proprio `api.ts`
- OpenRouter mantiene il builder del provider e gli helper di onboarding/config nel proprio `api.ts`

## Policy di compatibilità

Per i plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adapter di compatibilità
3. emettere una diagnostica o un avviso che indichi il vecchio percorso e la sostituzione
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

Se un campo del manifest è ancora accettato, gli autori di plugin possono continuare a usarlo finché la documentazione e la diagnostica non indicano diversamente. Il nuovo codice dovrebbe preferire la sostituzione documentata, ma i plugin esistenti non dovrebbero smettere di funzionare durante normali minor release.

## Come eseguire la migrazione

<Steps>
  <Step title="Migra gli handler approval-native ai fatti di capability">
    I plugin di canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con `approvalCapability.nativeRuntime`
    - Sposta autenticazione/consegna specifiche dell'approvazione dal wiring legacy `plugin.auth` / `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei plugin di canale; sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` rimane solo per i flussi di login/logout del canale; gli hook di autenticazione per l'approvazione lì non vengono più letti dal core
    - Registra gli oggetti runtime di proprietà del canale, come client, token o app Bolt, tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di rerouting di proprietà del plugin dagli handler di approvazione nativi; il core ora gestisce gli avvisi instradati altrove in base ai risultati effettivi di consegna
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una vera superficie `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout attuale della capability di approvazione.

  </Step>

  <Step title="Verifica il comportamento di fallback del wrapper Windows">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non dipende intenzionalmente dal fallback della shell, non impostare `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo Plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import mirati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime del Plugin iniettato invece di importare direttamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica agli altri helper legacy del bridge:

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

  <Step title="Compila ed esegui i test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di importazione

  <Accordion title="Tabella comune dei percorsi di importazione">
  | Percorso di importazione | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di ingresso del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di ingresso del canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di ingresso per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per l'ingresso del canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup | Prompt allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime in fase di setup | Adapter di patch del setup sicuri per gli import, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper per gli strumenti di setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper per account multipli | Helper per elenco/configurazione/account action gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione di account-id |
  | `plugin-sdk/account-resolution` | Helper per il lookup degli account | Helper per lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper mirati per gli account | Helper per elenco account/account action |
  | `plugin-sdk/channel-setup` | Adapter per la procedura guidata di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita del flusso draft | `createAccountStatusSink`, helper per finalizzazione dell'anteprima draft |
  | `plugin-sdk/inbound-envelope` | Helper per inbound envelope | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in ingresso | Helper condivisi di registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper per parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime in uscita | Helper per identità/delegato di invio in uscita e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread-binding | Helper per ciclo di vita e adapter dei thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy per media payload | Builder di agent media payload per layout legacy dei campi |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy per channel runtime |
  | `plugin-sdk/channel-send-result` | Tipi di risultato di invio | Tipi di risultato della risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime | Logger/ambiente runtime, timeout, retry e helper di backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interattività del plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline di webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper per lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper per versioni |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway e helper per patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram stabili come fallback quando la superficie di contratto Telegram inclusa non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/plugin, helper per capability/profili di approvazione, helper runtime/routing per approvazioni native |
  | `plugin-sdk/approval-auth-runtime` | Helper di autenticazione per approvazioni | Risoluzione dell'approvatore, autenticazione di azioni nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per approvazioni | Helper per profili/filtri di approvazione exec nativi |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna per approvazioni | Adapter per capability/consegna di approvazioni native |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway per approvazioni | Helper condiviso per la risoluzione del gateway di approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper per adapter di approvazione | Helper leggeri di caricamento degli adapter di approvazione nativa per entrypoint di canale hot |
  | `plugin-sdk/approval-handler-runtime` | Helper per handler di approvazione | Helper runtime più ampi per gli handler di approvazione; preferisci i seam adapter/gateway più mirati quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione | Helper nativi per binding target/account di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper per risposte di approvazione | Helper per payload di risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per channel runtime-context | Helper generici per register/get/watch del channel runtime-context |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuto esterno e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper per policy SSRF | Helper per host allowlist e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per pinned-dispatcher, fetch protetto e policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper per formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafi di errore |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrapped | `resolveFetch`, helper per proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper per retry | `RetryConfig`, `retryAsync`, esecutori di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura dell'input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper per la superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper per il registro dei comandi |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input segreto | Helper per input segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guardia per il body delle richieste Webhook | Helper per lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso delle risposte | Dispatch in ingresso, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per il dispatch delle risposte | Helper per finalizzazione, provider dispatch ed etichette di conversazione |
  | `plugin-sdk/reply-history` | Helper per reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk di risposta | Helper per chunking di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper per session store | Helper per percorso dello store + updated-at |
  | `plugin-sdk/state-paths` | Helper per percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper per routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione di session-key |
  | `plugin-sdk/status-helpers` | Helper per stato del canale | Builder di riepilogo stato canale/account, default dello stato runtime, helper per metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per target resolver | Helper condivisi per target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione delle stringhe | Helper per normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper per URL di richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Esecutore di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload del tool | Estrai payload normalizzati da oggetti risultato del tool |
  | `plugin-sdk/tool-send` | Estrazione dell'invio del tool | Estrai campi target di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi temporanei di download |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per modalità tabelle Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta del messaggio | Tipi di payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati per setup di provider locali/self-hosted | Helper per discovery/configurazione di provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per setup di provider self-hosted compatibili con OpenAI | Gli stessi helper per discovery/configurazione di provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime del provider | Helper runtime per la risoluzione delle API key |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup per API key del provider | Helper per onboarding/scrittura profilo API key |
  | `plugin-sdk/provider-auth-result` | Helper per auth-result del provider | Builder standard per auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper per selezione del provider | Selezione del provider configurato o automatico e merge della configurazione raw del provider |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper per lookup delle env var di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi delle replay-policy, helper per endpoint del provider e helper di normalizzazione del model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione per l'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capacità degli endpoint del provider, inclusi helper per form multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper per registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search del provider | Helper mirati per configurazione/credenziali web-search per provider che non richiedono il wiring di abilitazione del plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper di contratto web-search del provider | Helper mirati per il contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper per registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità per tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup dello schema Gemini + diagnostica, e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di stream wrapper e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper di trasporto nativi del provider come fetch protetto, trasformazioni dei messaggi di trasporto e flussi di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper per fetch/trasformazione/store dei media più builder di media payload |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per la generazione di media | Helper condivisi per failover, selezione dei candidati e messaggi di modello mancante per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper per media-understanding | Tipi di provider per media understanding più export di helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper di testo condivisi | Rimozione del testo visibile all'assistente, helper per rendering/chunking/tabelle Markdown, helper di redazione, helper per directive tag, utility di testo sicuro e relativi helper di testo/logging |
  | `plugin-sdk/text-chunking` | Helper per chunking del testo | Helper per il chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper per speech | Tipi di provider speech più helper lato provider per directive, registry e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registry, directive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi di provider, helper di registry e helper condiviso per sessioni WebSocket |
  | `plugin-sdk/realtime-voice` | Helper per voce realtime | Tipi di provider, helper per registry/risoluzione e helper per sessioni bridge |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione immagini | Tipi per generazione immagini, helper per failover, autenticazione e registry |
  | `plugin-sdk/music-generation` | Helper per generazione musicale | Tipi di provider/richiesta/risultato per la generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per generazione musicale | Tipi per generazione musicale, helper per failover, lookup del provider e parsing di model-ref |
  | `plugin-sdk/video-generation` | Helper per generazione video | Tipi di provider/richiesta/risultato per la generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione video | Tipi per generazione video, helper per failover, lookup del provider e parsing di model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload delle risposte interattive |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive mirate di channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper per scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso del canale | Export condivisi del prelude del plugin di canale |
  | `plugin-sdk/channel-status` | Helper per stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper per modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm` | Helper per Direct-DM | Helper condivisi per autenticazione/guard di Direct-DM |
  | `plugin-sdk/extension-shared` | Helper condivisi dell'estensione | Primitive helper per passive-channel/status e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per target Webhook | Helper per registro dei target Webhook e installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per percorsi Webhook | Helper per normalizzazione del percorso Webhook |
  | `plugin-sdk/web-media` | Helper condivisi per media web | Helper per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumer del Plugin SDK |
  | `plugin-sdk/memory-core` | Helper `memory-core` inclusi | Superficie helper per memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime per indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore host embedding della memoria | Contratti per embedding di memoria, accesso al registry, provider locale e helper generici batch/remoti; i provider remoti concreti si trovano nei rispettivi plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Export del motore QMD host della memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Export del motore storage host della memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria | Helper di query host della memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper per segreti host della memoria | Helper per segreti host della memoria |
  | `plugin-sdk/memory-core-host-events` | Helper per event journal host della memoria | Helper per event journal host della memoria |
  | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria | Helper di stato host della memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias neutrale rispetto al vendor per gli helper runtime core host della memoria |
  | `plugin-sdk/memory-host-events` | Alias event journal host della memoria | Alias neutrale rispetto al vendor per gli helper event journal host della memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias neutrale rispetto al vendor per gli helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-markdown` | Helper per markdown gestito | Helper condivisi per markdown gestito per plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias di stato host della memoria | Alias neutrale rispetto al vendor per gli helper di stato host della memoria |
  | `plugin-sdk/memory-lancedb` | Helper `memory-lancedb` inclusi | Superficie helper di memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera superficie dell'SDK. L'elenco completo di oltre 200 entrypoint si trova in `scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcuni helper seam per plugin inclusi come `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Restano esportati per la manutenzione e la compatibilità dei plugin inclusi, ma sono intenzionalmente omessi dalla tabella comune di migrazione e non sono il target consigliato per nuovo codice di plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper per supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici di helper/plugin inclusi come `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` espone attualmente la superficie ristretta di helper per token `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al compito. Se non riesci a trovare un export, controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Timeline di rimozione

| Quando | Cosa succede |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora** | Le superfici deprecate emettono avvisi a runtime |
| **Prossima major release** | Le superfici deprecate saranno rimosse; i plugin che le usano ancora smetteranno di funzionare |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questo è un escape hatch temporaneo, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo plugin
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo degli import per subpath
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare plugin provider
- [Interni del plugin](/it/plugins/architecture) — approfondimento sull'architettura
- [Manifest del plugin](/it/plugins/manifest) — riferimento dello schema del manifest
