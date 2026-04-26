---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin alla moderna architettura Plugin
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di retrocompatibilità al moderno SDK Plugin
title: Migrazione SDK Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura Plugin con import focalizzati e documentati. Se il tuo Plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema Plugin forniva due superfici molto ampie che permettevano ai Plugin di importare
qualsiasi cosa servisse da un unico punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un unico import che riesportava decine di
  helper. Era stato introdotto per mantenere funzionanti i vecchi Plugin basati su hook mentre veniva
  costruita la nuova architettura Plugin.
- **`openclaw/extension-api`** — un bridge che dava ai Plugin accesso diretto a
  helper host-side come l'embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook di estensione incluso
  solo-Pi rimosso che poteva osservare eventi dell'embedded runner come
  `tool_result`.

Le superfici di importazione ampie sono ora **deprecate**. Funzionano ancora a runtime,
ma i nuovi Plugin non devono usarle e i Plugin esistenti dovrebbero migrare prima che la prossima major release le rimuova. L'API di registrazione della embedded extension factory solo-Pi è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento Plugin documentato nello stesso
cambiamento che introduce una sostituzione. Le modifiche incompatibili al contratto devono prima
passare attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di setup, hook e comportamento di registrazione a runtime.

<Warning>
  Il layer di retrocompatibilità verrà rimosso in una futura major release.
  I Plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
  Le registrazioni della embedded extension factory solo-Pi già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava dozzine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di importazione
- **Superficie API poco chiara** — non c'era modo di distinguere quali export fossero stabili e quali interni

Il moderno SDK Plugin risolve il problema: ogni percorso di importazione (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche i seam di comodità legacy dei provider per i canali inclusi sono spariti. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper brandizzati per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti Plugin stabili. Usa invece subpath stretti e generici dell'SDK. All'interno del
workspace del Plugin incluso, mantieni gli helper posseduti dal provider nel proprio
`api.ts` o `runtime-api.ts` del Plugin.

Esempi attuali di provider inclusi:

- Anthropic mantiene gli helper di stream specifici di Claude nel proprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder del provider, helper del modello predefinito e builder del provider
  realtime nel proprio `api.ts`
- OpenRouter mantiene builder del provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Politica di compatibilità

Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adapter di compatibilità
3. emettere una diagnostica o un avviso che indichi il vecchio percorso e la sostituzione
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

Se un campo del manifest è ancora accettato, gli autori dei Plugin possono continuare a usarlo finché
la documentazione e la diagnostica non dicono il contrario. Il nuovo codice dovrebbe preferire la
sostituzione documentata, ma i Plugin esistenti non dovrebbero rompersi durante normali release minor.

## Come migrare

<Steps>
  <Step title="Migra le estensioni Pi tool-result al middleware">
    I Plugin inclusi devono sostituire gli handler tool-result
    `api.registerEmbeddedExtensionFactory(...)` solo-Pi con
    middleware neutrali rispetto al runtime.

    ```typescript
    // Strumenti dinamici runtime Pi e Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna contemporaneamente il manifest del Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    I Plugin esterni non possono registrare middleware di tool-result perché possono
    riscrivere output di strumenti ad alta fiducia prima che il modello li veda.

  </Step>

  <Step title="Migra gli handler approval-native ai capability fact">
    I Plugin di canale capaci di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registry condiviso del runtime-context.

    Cambiamenti principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta autenticazione/consegna specifiche delle approvazioni dal wiring legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei channel-plugin;
      sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` rimane solo per i flussi login/logout del canale; gli hook auth delle approvazioni
      lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute posseduti dal plugin dagli handler di approvazione nativi;
      il core ora gestisce gli avvisi instradato-altrove dai risultati di consegna effettivi
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      vera superficie `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della approval capability.

  </Step>

  <Step title="Controlla il comportamento di fallback del wrapper Windows">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Impostalo solo per chiamanti di compatibilità trusted che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non si basa intenzionalmente sul fallback shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo Plugin importazioni da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import focalizzati">
    Ogni export della vecchia superficie mappa a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer di retrocompatibilità deprecato)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni focalizzati)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper host-side, usa il runtime Plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Prima (bridge extension-api deprecato)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Dopo (runtime iniettato)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica agli altri helper del bridge legacy:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dell'archivio sessione | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di importazione

  <Accordion title="Tabella dei percorsi di importazione comuni">
  | Percorso di importazione | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di ingresso del Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry del canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per singolo provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder focalizzati di entry del canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi della procedura guidata di setup | Prompt di allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime per il tempo di setup | Adapter di patch di setup import-safe, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account ristretti | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adapter della procedura guidata di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di abbinamento DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring del prefisso di risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory per adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder dello schema di configurazione | Primitive condivise dello schema di configurazione del canale; gli export dello schema nominati per canale incluso sono solo compatibilità legacy |
  | `plugin-sdk/telegram-command-config` | Helper della configurazione dei comandi Telegram | Normalizzazione del nome comando, trim della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione del criterio di gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita del flusso draft | `createAccountStatusSink`, helper di finalizzazione dell'anteprima draft |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in ingresso | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposta in ingresso | Helper condivisi per record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper di parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Helper per dipendenze di invio in uscita | Lookup leggero `resolveOutboundSendDep` senza importare il runtime completo in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime per l'uscita | Helper per consegna in uscita, delegate identità/invio, sessione, formattazione e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread-binding | Helper per ciclo di vita e adapter del thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder del payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy per il runtime del canale |
  | `plugin-sdk/channel-send-result` | Tipi di risultato invio | Tipi di risultato della risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper ristretti per runtime env | Helper per logger/runtime env, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del Plugin | Helper per comandi/hook/http/interattivi del Plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione dei comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Client Gateway e helper di patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per load/write della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper dei comandi Telegram | Helper stabili di fallback per la validazione dei comandi Telegram quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper del prompt di approvazione | Payload di approvazione exec/plugin, helper di approval capability/profile, helper di runtime/instradamento di approvazione nativa e formattazione strutturata del percorso di visualizzazione dell'approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per approvazione | Risoluzione dell'approvatore, autenticazione dell'azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per approvazione | Helper di profilo/filtro di approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna per approvazione | Adapter di consegna/capability di approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway per approvazione | Helper condiviso di risoluzione del Gateway di approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper per adapter di approvazione | Helper leggeri di caricamento degli adapter di approvazione nativa per entrypoint hot di canale |
  | `plugin-sdk/approval-handler-runtime` | Helper per handler di approvazione | Helper runtime più ampi per handler di approvazione; preferisci i seam più ristretti adapter/gateway quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione | Helper di associazione target/account dell'approvazione nativa |
  | `plugin-sdk/approval-reply-runtime` | Helper di risposta per approvazione | Helper per payload di risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper del runtime-context del canale | Helper generici register/get/watch del runtime-context del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, controllo DM, contenuti esterni e raccolta secret |
  | `plugin-sdk/ssrf-policy` | Helper di criterio SSRF | Helper per allowlist host e criterio di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per pinned-dispatcher, fetch protetto, criterio SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper del grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrapped | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, esecutori di criterio |
  | `plugin-sdk/allow-from` | Formattazione della allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping dell'input della allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registry dei comandi inclusa la formattazione dinamica del menu degli argomenti |
  | `plugin-sdk/command-status` | Renderer dello stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input secret | Helper di input secret |
  | `plugin-sdk/webhook-ingress` | Helper delle richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guardia del body Webhook | Helper per read/limit del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch in ingresso, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti per reply dispatch | Helper per finalize, provider dispatch e conversation-label |
  | `plugin-sdk/reply-history` | Helper della cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per i blocchi di risposta | Helper di chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper dell'archivio sessione | Helper per percorso dell'archivio + updated-at |
  | `plugin-sdk/state-paths` | Helper dei percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper di instradamento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo dello stato canale/account, predefiniti dello stato runtime, helper di metadati issue |
  | `plugin-sdk/target-resolver-runtime` | Helper del target resolver | Helper condivisi del target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/string |
  | `plugin-sdk/request-url` | Helper dell'URL della richiesta | Estrae URL stringa da input simili a richiesta |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload dello strumento | Estrae payload normalizzati da oggetti di risultato dello strumento |
  | `plugin-sdk/tool-send` | Estrazione dell'invio dello strumento | Estrae campi canonici di send target dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper dei percorsi temporanei | Helper condivisi per i percorsi temporanei di download |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di reply del messaggio | Tipi del payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati di setup del provider locale/self-hosted | Helper di discovery/configurazione del provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati di setup del provider self-hosted compatibile con OpenAI | Gli stessi helper di discovery/configurazione del provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime del provider | Helper runtime per la risoluzione della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della chiave API del provider | Helper di onboarding/scrittura del profilo per la chiave API |
  | `plugin-sdk/provider-auth-result` | Helper del risultato auth del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi di login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione del provider | Selezione del provider configurato-o-automatico e merge della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper delle env var del provider | Helper di lookup delle env var di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi del criterio di replay, helper degli endpoint del provider e helper di normalizzazione dell'ID del modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi del catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici HTTP/capacità endpoint del provider, inclusi helper multipart form per la trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper di registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search del provider | Helper ristretti di configurazione/credenziali web-search per provider che non richiedono wiring di abilitazione del Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper di contratto web-search del provider | Helper ristretti di contratto per configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito definito |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper di registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostica dello schema Gemini e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper dello stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper dello stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper nativi di trasporto del provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper per fetch/transform/store dei media più builder del payload media |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione multimediale | Helper condivisi di failover, selezione dei candidati e messaggistica modello mancante per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi provider di comprensione dei media più export helper image/audio rivolti al provider |
  | `plugin-sdk/text-runtime` | Helper testuali condivisi | Rimozione del testo visibile all'assistente, helper di render/chunking/tabella markdown, helper di redazione, helper per directive-tag, utility di testo sicuro e relativi helper di testo/logging |
  | `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi del provider speech più helper rivolti al provider per direttive, registry e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi del provider speech, registry, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper di trascrizione realtime | Tipi del provider, helper del registry e helper condiviso della sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper voice realtime | Tipi del provider, helper di registry/risoluzione e helper della sessione bridge |
  | `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, helper di failover, autenticazione e registry |
  | `plugin-sdk/music-generation` | Helper di generazione musicale | Tipi provider/richiesta/risultato per la generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso di generazione musicale | Tipi di generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/video-generation` | Helper di generazione video | Tipi provider/richiesta/risultato per la generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive ristrette di channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Preludio condiviso del canale | Export di preludio condivisi del channel Plugin |
  | `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi di snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione della allowlist | Helper di modifica/lettura della configurazione della allowlist |
  | `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per le decisioni di accesso ai gruppi |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Helper condivisi di autenticazione/guardia Direct-DM |
  | `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive helper di canale/status passivo e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper dei target Webhook | Registry dei target Webhook e helper di installazione delle route |
  | `plugin-sdk/webhook-path` | Helper del percorso Webhook | Helper di normalizzazione del percorso Webhook |
  | `plugin-sdk/web-media` | Helper condivisi per web media | Helper di caricamento dei media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | Riesporta `zod` per i consumer del SDK Plugin |
  | `plugin-sdk/memory-core` | Helper memory-core inclusi | Superficie helper per gestore/config/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime per indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings host della memoria | Contratti embeddings della memoria, accesso al registry, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei rispettivi Plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Export del motore QMD host della memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Export del motore storage host della memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
  | `plugin-sdk/memory-core-host-query` | Helper query host della memoria | Helper query host della memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper secret host della memoria | Helper secret host della memoria |
  | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memoria | Helper del journal eventi host della memoria |
  | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria | Helper di stato host della memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias neutrale rispetto al vendor per gli helper runtime core host della memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host della memoria | Alias neutrale rispetto al vendor per gli helper del journal eventi host della memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias neutrale rispetto al vendor per gli helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-markdown` | Helper markdown gestito | Helper condivisi di managed-markdown per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del gestore di ricerca della memoria attiva |
  | `plugin-sdk/memory-host-status` | Alias stato host della memoria | Alias neutrale rispetto al vendor per gli helper di stato host della memoria |
  | `plugin-sdk/memory-lancedb` | Helper memory-lancedb inclusi | Superficie helper memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie dell'SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcuni seam helper di plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi restano esportati per
manutenzione e compatibilità dei plugin inclusi, ma sono intenzionalmente
omessi dalla tabella comune di migrazione e non sono il target consigliato per
nuovo codice Plugin.

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
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` attualmente espone la stretta
superficie helper per token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al lavoro da svolgere. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'SDK Plugin, al contratto provider,
alla superficie runtime e al manifest. Ognuna funziona ancora oggi ma verrà rimossa
in una futura major release. La voce sotto ogni elemento mappa la vecchia API alla
sua sostituzione canonica.

<AccordionGroup>
  <Accordion title="builder help command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export — solo importati dal sottopercorso più ristretto. `command-auth`
    li riesporta come stub di compatibilità.

    ```typescript
    // Prima
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Dopo
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper di controllo menzioni → resolveInboundMentionDecision">
    **Vecchio**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` oppure
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` — restituisce un
    unico oggetto decisione invece di due chiamate separate.

    I plugin di canale downstream (Slack, Discord, Matrix, Microsoft Teams) hanno già effettuato la migrazione.

  </Accordion>

  <Accordion title="Shim runtime del canale e helper delle azioni del canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per i
    vecchi plugin di canale. Non importarlo nel nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti
    runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export raw del canale "actions". Espone invece le
    capacità tramite la superficie semantica `presentation` — i plugin di canale
    dichiarano cosa rendono (card, pulsanti, select) invece di quali nomi di
    azioni raw accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider Web search → createTool() nel plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente nel plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="Envelope di canale plaintext → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope di prompt
    plaintext piatto dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I
    plugin di canale allegano i metadati di instradamento (thread, topic, reply-to, reazioni) come
    campi tipizzati invece di concatenarli in una stringa di prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati rivolti all'assistente, ma gli envelope plaintext in ingresso stanno venendo eliminati.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi
    plugin di canale personalizzato che post-processava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipi di discovery del provider → tipi di catalogo provider">
    Quattro alias di tipo di discovery ora sono wrapper sottili sui
    tipi dell'era catalogo:

    | Vecchio alias             | Nuovo tipo               |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    In più il legacy static bag `ProviderCapabilities` — i plugin provider
    dovrebbero allegare i capability fact tramite il contratto runtime del provider
    piuttosto che tramite un oggetto statico.

  </Accordion>

  <Accordion title="Hook del criterio thinking → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un unico `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con `id` canonico, `label` facoltativo e
    elenco ordinato dei livelli. OpenClaw degrada automaticamente i valori memorizzati obsoleti in base al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="Fallback del provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza
    dichiarare il provider nel manifest del plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del plugin
    **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio percorso di
    "fallback auth" emette un avviso a runtime e verrà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup env-var del provider → setup.providers[].envVars">
    **Vecchio** campo del manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup delle env-var in `setup.providers[].envVars`
    nel manifest. Questo consolida in un unico
    posto i metadati env di setup/stato ed evita di avviare il runtime del plugin solo per rispondere a lookup di env-var.

    `providerAuthEnvVars` resta supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione del plugin memory → registerMemoryCapability">
    **Vecchio**: tre chiamate separate —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata nell'API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, un'unica chiamata di registrazione. Gli helper additivi della memoria
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione sottoagente rinominati">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                              |
    | ----------------------------- | ---------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo richiama quello
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live di TaskFlow.

    **Nuovo**: `runtime.tasks.flows` (plurale) restituisce accesso TaskFlow basato su DTO,
    che è import-safe e non richiede il caricamento del runtime completo delle attività.

    ```typescript
    // Prima
    const flow = api.runtime.tasks.flow(ctx);
    // Dopo
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Factory di estensioni embedded → middleware dei risultati degli strumenti dell'agente">
    Trattato sopra in "Come migrare → Migra le estensioni Pi tool-result al
    middleware". Incluso qui per completezza: il percorso rimosso solo-Pi
    `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco esplicito di runtime
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` ora è un
    alias di una riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Prima
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Dopo
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di extension (dentro i plugin di canale/provider inclusi sotto
`extensions/`) sono tracciate dentro i rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influiscono sui contratti dei plugin di terze parti e non sono elencate
qui. Se consumi direttamente un barrel locale di un plugin incluso, leggi i
commenti di deprecazione in quel barrel prima di effettuare l'upgrade.
</Note>

## Timeline di rimozione

| Quando                 | Cosa succede                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Adesso**             | Le superfici deprecate emettono avvisi a runtime                      |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora falliranno |

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
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo degli import per sottopercorso
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare plugin provider
- [Interni dei plugin](/it/plugins/architecture) — approfondimento sull'architettura
- [Manifest del plugin](/it/plugins/manifest) — riferimento dello schema del manifest
