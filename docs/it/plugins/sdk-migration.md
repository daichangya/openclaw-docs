---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin all'architettura Plugin moderna
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello legacy di retrocompatibilità al Plugin SDK moderno
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:53:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3a1410d9353156b4597d16a42a931f83189680f89c320a906aa8d2c8196792f
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw è passato da un ampio livello di retrocompatibilità a una moderna architettura Plugin
con import focalizzati e documentati. Se il tuo Plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema Plugin forniva due superfici molto aperte che permettevano ai Plugin di importare
qualsiasi cosa servisse da un unico entry point:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi Plugin basati su hook mentre
  veniva costruita la nuova architettura Plugin.
- **`openclaw/extension-api`** — un bridge che dava ai Plugin accesso diretto a
  helper lato host come l'embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook di estensione incluso solo Pi, rimosso,
  che poteva osservare eventi dell'embedded-runner come
  `tool_result`.

Le superfici di import ampie sono ora **deprecate**. Funzionano ancora a runtime,
ma i nuovi Plugin non devono usarle e quelli esistenti dovrebbero migrare prima che la
prossima major release le rimuova. L'API di registrazione embedded extension factory
solo Pi è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento Plugin documentato nello stesso
cambiamento che introduce un sostituto. Le modifiche breaking dei contratti devono prima
passare per un adattatore di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi manifest, API di setup, hook e comportamento di registrazione runtime.

<Warning>
  Il livello di retrocompatibilità verrà rimosso in una futura major release.
  I Plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
  Le registrazioni embedded extension factory solo Pi già non vengono più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali esportazioni fossero stabili rispetto a quelle interne

Il moderno Plugin SDK risolve questo: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo, autonomo, con uno scopo chiaro e un contratto documentato.

Anche le superfici legacy di convenienza per provider dei canali inclusi sono state rimosse. Gli import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
le superfici helper brandizzate per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti Plugin stabili. Usa invece sottopercorsi SDK generici e stretti. All'interno del
workspace del Plugin incluso, mantieni gli helper di proprietà del provider nel `api.ts` o
`runtime-api.ts` di quel Plugin.

Esempi attuali di provider inclusi:

- Anthropic mantiene gli helper di stream specifici di Claude nella propria superficie `api.ts` /
  `contract-api.ts`
- OpenAI mantiene i builder provider, gli helper per i modelli predefiniti e i builder dei provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene il builder provider e gli helper di onboarding/config nel proprio
  `api.ts`

## Policy di compatibilità

Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
3. emettere una diagnostica o un warning che nomini il vecchio percorso e il sostituto
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

Se un campo manifest è ancora accettato, gli autori di Plugin possono continuare a usarlo finché
documentazione e diagnostica non diranno altrimenti. Il nuovo codice dovrebbe preferire il
sostituto documentato, ma i Plugin esistenti non dovrebbero rompersi durante le normali
minor release.

## Come migrare

<Steps>
  <Step title="Migra le estensioni Pi tool-result al middleware">
    I Plugin inclusi devono sostituire i gestori `api.registerEmbeddedExtensionFactory(...)`
    di `tool_result` solo Pi con middleware neutrali rispetto al
    runtime.

    ```typescript
    // Strumenti dinamici runtime Pi e Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna contemporaneamente anche il manifest del Plugin:

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

  <Step title="Migra i gestori approval-native ai fatti di capacità">
    I Plugin canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registry condiviso del contesto runtime.

    Cambiamenti chiave:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifiche dell'approvazione fuori dal wiring legacy `plugin.auth` /
      `plugin.approvals` e dentro `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei Plugin canale;
      sposta i campi delivery/native/render dentro `approvalCapability`
    - `plugin.auth` resta per i flussi di login/logout del canale soltanto; gli hook auth
      di approvazione lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare notifiche di reroute possedute dal Plugin dai gestori di approvazione nativi;
      il core ora possiede le notifiche di instradamento-altrove derivate dai risultati effettivi di consegna
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      vera superficie `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per l'attuale
    layout di approval capability.

  </Step>

  <Step title="Controlla il comportamento di fallback del wrapper Windows">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modalità fail-closed a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Imposta questo solo per chiamanti di compatibilità attendibili che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non dipende intenzionalmente dal fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore lanciato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo Plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import focalizzati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (livello di retrocompatibilità deprecato)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni e focalizzati)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime Plugin iniettato invece di importarlo
    direttamente:

    ```typescript
    // Prima (bridge extension-api deprecato)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Dopo (runtime iniettato)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso pattern si applica ad altri helper legacy del bridge:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dell'archivio sessioni | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Tabella comune dei percorsi di import">
  | Percorso di import | Scopo | Export chiave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di entry del Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema config root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per singolo provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder focalizzati di entry canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per il wizard di setup | Prompt allowlist, builder di stato setup |
  | `plugin-sdk/setup-runtime` | Helper runtime per il setup | Adapter di patch setup sicuri per l'import, helper per lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per il setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione di account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper account ristretti | Helper per elenco account/account-action |
  | `plugin-sdk/channel-setup` | Adapter del wizard di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Primitive condivise di schema config del canale; gli export di schema nominati per canale incluso sono solo compatibilità legacy |
  | `plugin-sdk/telegram-command-config` | Helper config comandi Telegram | Normalizzazione del nome comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione della policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita draft stream | `createAccountStatusSink`, helper di finalizzazione dell'anteprima draft |
  | `plugin-sdk/inbound-envelope` | Helper del contenitore inbound | Helper condivisi per route + builder del contenitore |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte inbound | Helper condivisi di record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper di parsing/corrispondenza dei target |
  | `plugin-sdk/outbound-media` | Helper media outbound | Caricamento condiviso dei media outbound |
  | `plugin-sdk/outbound-runtime` | Helper runtime outbound | Helper di consegna outbound, delegate identità/invio, sessione, formattazione e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper thread-binding | Helper per ciclo di vita e adapter dei thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy del payload media | Builder del payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime legacy del canale |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato di risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper ristretti dell'ambiente runtime | Helper per logger/ambiente runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del Plugin | Helper per comandi/hook/http/interattivi del Plugin |
  | `plugin-sdk/hook-runtime` | Helper della pipeline di hook | Helper condivisi per pipeline di Webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Helper per formattazione comandi, attese, versioni |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Helper per client Gateway e patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura config |
  | `plugin-sdk/telegram-command-config` | Helper dei comandi Telegram | Helper stabili come fallback per la validazione dei comandi Telegram quando la superficie di contratto Telegram inclusa non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/plugin, helper per approval capability/profile, helper per routing/runtime di approvazione nativa e formattazione strutturata del percorso di visualizzazione delle approvazioni |
  | `plugin-sdk/approval-auth-runtime` | Helper auth di approvazione | Risoluzione degli approvatori, auth di azione same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper client di approvazione | Helper nativi per profilo/filtro di approvazione exec |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna approvazioni | Adapter nativi di approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helper gateway di approvazione | Helper condiviso per la risoluzione del gateway di approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter di approvazione | Helper leggeri per il caricamento di adapter nativi di approvazione per hot channel entrypoint |
  | `plugin-sdk/approval-handler-runtime` | Helper gestore di approvazione | Helper runtime più ampi per il gestore di approvazione; preferisci le superfici più ristrette adapter/gateway quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper target di approvazione | Helper nativi per binding target/account dell'approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper per risposte di approvazione | Helper per payload di risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per il contesto runtime del canale | Helper generici register/get/watch per il contesto runtime del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per pinned-dispatcher, guarded fetch, policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper di cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafi di errore |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy incapsulati | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione della allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della superficie dei comandi | `resolveControlCommandGate`, helper per autorizzazione del mittente, helper del registry dei comandi inclusa la formattazione del menu degli argomenti dinamici |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input segreto | Helper per input segreto |
  | `plugin-sdk/webhook-ingress` | Helper delle richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guardia del body Webhook | Helper di lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch inbound, Heartbeat, planner della risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper ristretti di dispatch della risposta | Helper di finalize, provider dispatch e conversation-label |
  | `plugin-sdk/reply-history` | Helper della cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper di chunk della risposta | Helper di chunking per testo/Markdown |
  | `plugin-sdk/session-store-runtime` | Helper dell'archivio sessioni | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper dei percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper di routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo dello stato di canale/account, valori predefiniti dello stato runtime, helper per metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper del resolver dei target | Helper condivisi del resolver dei target |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL della richiesta | Estrai URL stringa da input simili a request |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload del tool | Estrai payload normalizzati da oggetti risultato del tool |
  | `plugin-sdk/tool-send` | Estrazione di invio del tool | Estrai campi target di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper dei percorsi temporanei | Helper condivisi per percorsi temporanei di download |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per la modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta del messaggio | Tipi del payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati di setup provider locali/self-hosted | Helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati di setup provider self-hosted compatibili OpenAI | Gli stessi helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime del provider | Helper di runtime per la risoluzione della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della chiave API del provider | Helper di onboarding/scrittura profilo della chiave API |
  | `plugin-sdk/provider-auth-result` | Helper del risultato auth del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione del provider | Selezione del provider configurato-o-automatico e merge della config grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper delle variabili env del provider | Helper di lookup delle variabili env auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper degli endpoint provider e helper di normalizzazione dell'id modello |
| `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
| `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capacità endpoint del provider, inclusi helper multipart form per la trascrizione audio |
| `plugin-sdk/provider-web-fetch` | Helper di web-fetch del provider | Helper per registrazione/cache del provider web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione della ricerca web del provider | Helper ristretti di configurazione/credenziali per la ricerca web per provider che non necessitano del wiring di abilitazione del Plugin |
| `plugin-sdk/provider-web-search-contract` | Helper di contratto della ricerca web del provider | Helper ristretti di contratto config/credenziali per la ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
| `plugin-sdk/provider-web-search` | Helper di ricerca web del provider | Helper per registrazione/cache/runtime del provider di ricerca web |
| `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper compat xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
| `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper di trasporto nativo del provider come guarded fetch, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
| `plugin-sdk/keyed-async-queue` | Coda async ordinata | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Helper media condivisi | Helper per fetch/transform/store dei media più builder del payload media |
| `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione media | Helper condivisi di failover, selezione dei candidati e messaggistica dei modelli mancanti per generazione di immagini/video/musica |
| `plugin-sdk/media-understanding` | Helper di comprensione media | Tipi di provider di comprensione media più export di helper per immagini/audio rivolti al provider |
| `plugin-sdk/text-runtime` | Helper di testo condivisi | Rimozione del testo visibile all'assistente, helper per render/chunking/tabella Markdown, helper di redazione, helper di directive-tag, utility di testo sicuro e helper correlati di testo/logging |
| `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo outbound |
| `plugin-sdk/speech` | Helper di voce | Tipi di provider voce più export di helper rivolti al provider per direttive, registry e validazione |
| `plugin-sdk/speech-core` | Core voce condiviso | Tipi di provider voce, registry, direttive, normalizzazione |
| `plugin-sdk/realtime-transcription` | Helper di trascrizione realtime | Tipi di provider, helper di registry e helper condiviso di sessione WebSocket |
| `plugin-sdk/realtime-voice` | Helper di voce realtime | Tipi di provider, helper di registry/risoluzione e helper di sessione bridge |
| `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, auth e helper di registry |
| `plugin-sdk/music-generation` | Helper di generazione musicale | Tipi di provider/richiesta/risultato per la generazione musicale |
| `plugin-sdk/music-generation-core` | Core condiviso di generazione musicale | Tipi di generazione musicale, helper di failover, lookup del provider e parsing del riferimento al modello |
| `plugin-sdk/video-generation` | Helper di generazione video | Tipi di provider/richiesta/risultato per la generazione video |
| `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup del provider e parsing del riferimento al modello |
| `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload di risposta interattiva |
| `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive ristrette di channel config-schema |
| `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
| `plugin-sdk/channel-plugin-common` | Prelude condiviso del canale | Export condivisi del prelude del Plugin canale |
| `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
| `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura della configurazione allowlist |
| `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi per le decisioni di accesso ai gruppi |
| `plugin-sdk/direct-dm` | Helper DM diretti | Helper condivisi per auth/guard dei DM diretti |
| `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive helper per canale/stato passivo e proxy ambient |
| `plugin-sdk/webhook-targets` | Helper dei target Webhook | Registry dei target Webhook e helper di installazione delle route |
| `plugin-sdk/webhook-path` | Helper del percorso Webhook | Helper di normalizzazione del percorso Webhook |
| `plugin-sdk/web-media` | Helper condivisi per media web | Helper per caricamento di media remoti/locali |
| `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumer del Plugin SDK |
| `plugin-sdk/memory-core` | Helper inclusi di memory-core | Superficie helper per memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore di memoria | Facciata runtime per indice/ricerca della memoria |
| `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
| `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings host della memoria | Contratti per embedding della memoria, accesso al registry, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei Plugin che li possiedono |
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
| `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias vendor-neutral per gli helper runtime core host della memoria |
| `plugin-sdk/memory-host-events` | Alias del journal eventi host della memoria | Alias vendor-neutral per gli helper del journal eventi host della memoria |
| `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias vendor-neutral per gli helper file/runtime host della memoria |
| `plugin-sdk/memory-host-markdown` | Helper per markdown gestito | Helper condivisi per markdown gestito per Plugin adiacenti alla memoria |
| `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del search-manager di Active Memory |
| `plugin-sdk/memory-host-status` | Alias di stato host della memoria | Alias vendor-neutral per gli helper di stato host della memoria |
| `plugin-sdk/memory-lancedb` | Helper inclusi di memory-lancedb | Superficie helper di memory-lancedb |
| `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie dello SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune superfici helper dei Plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Restano esportate per
manutenzione e compatibilità dei Plugin inclusi, ma sono intenzionalmente
omesse dalla tabella comune di migrazione e non sono il target consigliato per
nuovo codice Plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/Plugin incluse come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` attualmente espone la stretta superficie helper per i token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al lavoro da svolgere. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all'intero Plugin SDK, al contratto provider,
alla superficie runtime e al manifest. Ognuna funziona ancora oggi ma verrà rimossa
in una futura major release. La voce sotto ogni elemento mappa la vecchia API al suo
sostituto canonico.

<AccordionGroup>
  <Accordion title="builder help di command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export — semplicemente importati dal sottopercorso più ristretto. `command-auth`
    li riesporta come stub di compatibilità.

    ```typescript
    // Prima
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Dopo
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper di gating delle menzioni → resolveInboundMentionDecision">
    **Vecchio**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` — restituisce un
    singolo oggetto decisione invece di due chiamate separate.

    I Plugin canale downstream (Slack, Discord, Matrix, MS Teams) hanno già
    effettuato il passaggio.

  </Accordion>

  <Accordion title="Shim runtime del canale e helper channel actions">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per Plugin
    canale più vecchi. Non importarlo da nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export grezzi del canale “actions”. Esponi le capacità
    tramite la superficie semantica `presentation` — i Plugin canale
    dichiarano ciò che renderizzano (card, pulsanti, select) invece dei nomi grezzi
    delle azioni che accettano.

  </Accordion>

  <Accordion title="Helper tool() del provider di ricerca web → createTool() sul plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul Plugin provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper dello strumento.

  </Accordion>

  <Accordion title="Contenitori di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un contenitore prompt
    piatto in testo semplice dai messaggi canale inbound.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I
    Plugin canale allegano metadati di instradamento (thread, topic, reply-to, reactions) come
    campi tipizzati invece di concatenarli in una stringa prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per contenitori sintetizzati
    rivolti all'assistente, ma i contenitori inbound in testo semplice sono in fase di eliminazione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi
    Plugin canale personalizzato che post-processava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipi di provider discovery → tipi di provider catalog">
    Quattro alias di tipo discovery sono ora wrapper sottili sopra i
    tipi dell'era catalog:

    | Vecchio alias            | Nuovo tipo               |
    | ------------------------ | ------------------------ |
    | `ProviderDiscoveryOrder` | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Più il legacy static bag `ProviderCapabilities` — i Plugin provider
    dovrebbero allegare i fatti di capacità tramite il contratto runtime del provider
    anziché tramite un oggetto statico.

  </Accordion>

  <Accordion title="Hook della policy thinking → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con `id` canonico, `label` facoltativa e
    elenco di livelli ordinati per rango. OpenClaw declassa automaticamente i
    valori memorizzati obsoleti in base al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="Fallback del provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza
    dichiarare il provider nel manifest del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del Plugin
    **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio percorso di “auth
    fallback” emette un warning a runtime e verrà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Lookup delle variabili env del provider → setup.providers[].envVars">
    **Vecchio** campo del manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia lo stesso lookup delle variabili env in `setup.providers[].envVars`
    nel manifest. Questo consolida in un unico posto i metadati env di setup/stato
    ed evita di avviare il runtime del Plugin solo per rispondere ai lookup di variabili env.

    `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="Registrazione del Plugin memory → registerMemoryCapability">
    **Vecchio**: tre chiamate separate —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API dello stato memory —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, un'unica chiamata di registrazione. Gli helper memory additivi
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="Tipi dei messaggi di sessione subagente rinominati">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                          |
    | ----------------------------- | ------------------------------ |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra al
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live di TaskFlow.

    **Nuovo**: `runtime.tasks.flows` (plurale) restituisce accesso TaskFlow basato su DTO,
    sicuro per l'import e che non richiede il caricamento del runtime completo delle task.

    ```typescript
    // Prima
    const flow = api.runtime.tasks.flow(ctx);
    // Dopo
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → middleware dei risultati degli strumenti">
    Trattato in "Come migrare → Migra le estensioni Pi tool-result al
    middleware" sopra. Incluso qui per completezza: il percorso rimosso solo Pi
    `api.registerEmbeddedExtensionFactory(...)` è sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco esplicito di runtime
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` è ora un
    alias su una sola riga di `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Prima
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Dopo
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (all'interno dei Plugin canale/provider inclusi sotto
`extensions/`) sono tracciate nei rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influenzano i contratti dei Plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un Plugin incluso, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Cronologia di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono warning a runtime                       |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i Plugin che le usano ancora falliranno |

Tutti i Plugin core sono già stati migrati. I Plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente i warning

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questo è un meccanismo di emergenza temporaneo, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo Plugin
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo degli import per sottopercorso
- [Plugin canale](/it/plugins/sdk-channel-plugins) — creare Plugin canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare Plugin provider
- [Interni dei Plugin](/it/plugins/architecture) — approfondimento architetturale
- [Manifest del Plugin](/it/plugins/manifest) — riferimento dello schema del manifest
