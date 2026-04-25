---
read_when:
    - Hai bisogno della semantica esatta a livello di campo o dei valori predefiniti della configurazione
    - Stai convalidando blocchi di configurazione di canale, modello, Gateway o strumento
summary: Riferimento della configurazione del Gateway per le chiavi core di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-25T13:46:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Riferimento della configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configuration](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda altrove quando un sottosistema ha un proprio riferimento più approfondito. I cataloghi dei comandi gestiti da canali e plugin e i controlli avanzati di memoria/QMD si trovano nelle rispettive pagine dedicate invece che qui.

Fonte del codice:

- `openclaw config schema` stampa il JSON Schema live usato per la validazione e la Control UI, con i metadati bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo dello schema limitato a un percorso per gli strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` validano l'hash di baseline della documentazione di configurazione rispetto alla superficie attuale dello schema

Riferimenti dedicati approfonditi:

- [Memory configuration reference](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Slash commands](/it/tools/slash-commands) per il catalogo corrente dei comandi integrati + bundled
- le pagine del canale/plugin proprietario per le superfici dei comandi specifiche del canale

Il formato di configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi: OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata — vedi
[Configuration — channels](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (auth, controllo degli accessi, multi-account, controllo delle menzioni).

## Valori predefiniti dell'agente, multi-agent, sessioni e messaggi

Spostati in una pagina dedicata — vedi
[Configuration — agents](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, thinking, Heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (instradamento e binding multi-agent)
- `session.*` (ciclo di vita della sessione, Compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering markdown)
- `talk.*` (modalità Talk)
  - `talk.silenceTimeoutMs`: quando non è impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms su macOS e Android, 900 ms su iOS`)

## Strumenti e provider personalizzati

I criteri degli strumenti, le opzioni sperimentali, la configurazione degli strumenti supportati da provider e la configurazione
di provider personalizzati / base-URL sono stati spostati in una pagina dedicata — vedi
[Configuration — tools and custom providers](/it/gateway/config-tools).

## MCP

Le definizioni dei server MCP gestiti da OpenClaw si trovano sotto `mcp.servers` e sono
utilizzate da Pi incorporato e da altri adapter runtime. I comandi `openclaw mcp list`,
`show`, `set` e `unset` gestiscono questo blocco senza connettersi al
server di destinazione durante le modifiche di configurazione.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: definizioni nominate di server MCP stdio o remoti per i runtime che
  espongono gli strumenti MCP configurati.
- `mcp.sessionIdleTtlMs`: TTL di inattività per i runtime MCP bundled con ambito di sessione.
  Le esecuzioni incorporate one-shot richiedono la pulizia a fine esecuzione; questo TTL è la protezione di riserva per
  sessioni di lunga durata e futuri chiamanti.
- Le modifiche sotto `mcp.*` si applicano a caldo eliminando i runtime MCP di sessione in cache.
  Il successivo rilevamento/uso degli strumenti li ricrea dalla nuova configurazione, così le voci
  `mcp.servers` rimosse vengono eliminate immediatamente invece di attendere il TTL di inattività.

Vedi [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
[CLI backends](/it/gateway/cli-backends#bundle-mcp-overlays) per il comportamento runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per le skill bundled (le Skills gestite/del workspace non sono interessate).
- `load.extraDirs`: root condivise aggiuntive per le skill (precedenza più bassa).
- `install.preferBrew`: quando è true, preferisce gli installer Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installer.
- `install.nodeManager`: preferenza del gestore node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una skill anche se è bundled/installata.
- `entries.<skillKey>.apiKey`: campo pratico per le skill che dichiarano una variabile env primaria (stringa in chiaro o oggetto SecretRef).

---

## Plugin

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Caricati da `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, più `plugins.load.paths`.
- Il rilevamento accetta Plugin OpenClaw nativi più bundle Codex compatibili e bundle Claude, inclusi i bundle Claude con layout predefinito senza manifest.
- **Le modifiche di configurazione richiedono un riavvio del gateway.**
- `allow`: allowlist facoltativa (vengono caricati solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo pratico per la chiave API a livello di plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito del plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando è `false`, il core blocca `before_prompt_build` e ignora i campi che modificano il prompt da `before_agent_start` legacy, preservando però `modelOverride` e `providerOverride` legacy. Si applica ai plugin hook nativi e alle directory di hook fornite da bundle supportate.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando è `true`, i plugin attendibili non bundled possono leggere il contenuto grezzo della conversazione dagli hook tipizzati come `llm_input`, `llm_output` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente attendibile questo plugin per richiedere override per-esecuzione di `provider` e `model` per esecuzioni di subagent in background.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di destinazioni canoniche `provider/model` per override attendibili dei subagent. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema nativo del Plugin OpenClaw quando disponibile).
- Le impostazioni di account/runtime del plugin di canale si trovano sotto `channels.<id>` e dovrebbero essere descritte dai metadati `channelConfigs` del manifest del plugin proprietario, non da un registro centrale delle opzioni di OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: chiave API Firecrawl (accetta SecretRef). Usa come fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, la legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta scrape in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad esempio `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale di Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completo di Dreaming (predefinito `"0 3 * * *"`).
  - i criteri di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione rivolte all'utente).
- La configurazione completa della memoria si trova in [Memory configuration reference](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti di Pi incorporato da `settings.json`; OpenClaw li applica come impostazioni dell'agente sanificate, non come patch grezze della configurazione OpenClaw.
- `plugins.slots.memory`: seleziona l'id del plugin di memoria attivo oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: seleziona l'id del plugin motore di contesto attivo; per impostazione predefinita è `"legacy"` a meno che tu non installi e selezioni un altro motore.
- `plugins.installs`: metadati di installazione gestiti dalla CLI usati da `openclaw plugins update`.
  - Include `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Tratta `plugins.installs.*` come stato gestito; preferisci i comandi CLI alle modifiche manuali.

Vedi [Plugins](/it/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` disabilita `act:evaluate` e `wait --fn`.
- `tabCleanup` recupera le tab tracciate dell'agente principale dopo un periodo di inattività o quando una
  sessione supera il proprio limite. Imposta `idleMinutes: 0` o `maxTabsPerSession: 0` per
  disabilitare quelle singole modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non è impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando ti fidi intenzionalmente della navigazione del browser sulla rete privata.
- In modalità rigorosa, gli endpoint dei profili CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco della rete privata durante i controlli di raggiungibilità/rilevamento.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (start/stop/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw rilevi `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi
  sull'host selezionato o tramite un browser Node connesso.
- I profili `existing-session` possono impostare `userDataDir` per selezionare uno specifico
  profilo di browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di instradamento Chrome MCP:
  azioni guidate da snapshot/ref invece del targeting tramite selettore CSS, hook di upload
  di un solo file, nessun override del timeout delle finestre di dialogo, nessun
  `wait --load networkidle` e nessun `responsebody`, esportazione PDF, intercettazione dei download o azioni batch.
- I profili `openclaw` gestiti localmente assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  esplicitamente `cdpUrl` solo per CDP remoti.
- I profili gestiti localmente possono impostare `executablePath` per sostituire il
  `browser.executablePath` globale per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili gestiti localmente usano `browser.localLaunchTimeoutMs` per il rilevamento HTTP Chrome CDP locale
  dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs` per la readiness del websocket CDP
  dopo l'avvio. Aumentali su host più lenti dove Chrome si avvia correttamente ma i controlli di readiness anticipano l'avvio.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` accetta `~` per la directory home del tuo OS.
- Servizio di controllo: solo loopback locale (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (per esempio
  `--disable-gpu`, dimensionamento della finestra o flag di debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: colore di accento per il chrome della UI dell'app nativa (tinta della bolla in modalità Talk, ecc.).
- `assistant`: override dell'identità della Control UI. Usa come fallback l'identità dell'agente attivo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Dettagli dei campi del Gateway">

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexata per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind predefinito `loopback` ascolta su `127.0.0.1` all'interno del container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non loopback richiedono l'auth del gateway. In pratica questo significa un token/password condiviso oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` o `password`. L'avvio e i flussi di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza auth. Usala solo per configurazioni locali attendibili con local loopback; questa opzione intenzionalmente non viene proposta nelle richieste di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'auth a un reverse proxy identity-aware e si fida degli header di identità da `gateway.trustedProxies` (vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta un'origine proxy **non loopback**; i reverse proxy loopback sullo stesso host non soddisfano l'auth trusted-proxy.
- `gateway.auth.allowTailscale`: quando è `true`, gli header di identità Tailscale Serve possono soddisfare l'auth di Control UI/WebSocket (verificati tramite `tailscale whois`). Gli endpoint HTTP API **non** usano questa auth tramite header Tailscale; seguono invece la normale modalità auth HTTP del gateway. Questo flusso senza token presuppone che l'host del gateway sia attendibile. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitatore facoltativo dei tentativi di auth falliti. Si applica per IP client e per ambito auth (il secret condiviso e il token del dispositivo vengono tracciati separatamente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Nel percorso asincrono di Tailscale Serve Control UI, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura dell'errore. Tentativi errati concorrenti dallo stesso client possono quindi attivare il limitatore sulla seconda richiesta invece di superarlo entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha valore predefinito `true`; impostalo su `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per setup di test o distribuzioni proxy rigorose).
- I tentativi di auth WS con origine browser sono sempre soggetti a throttling con l'esenzione loopback disabilitata (difesa in profondità contro attacchi brute force localhost dal browser).
- Su loopback, quei lockout da origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano automaticamente
  un'altra origine.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket al Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback di origine basato su header Host per distribuzioni che si basano intenzionalmente su una policy di origine via header Host.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client nel process-environment
  che consente `ws://` in chiaro verso IP attendibili di rete privata; il comportamento predefinito resta limitato al loopback per il traffico in chiaro. Non esiste un equivalente in `openclaw.json`,
  e la configurazione browser per rete privata come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` non influisce sui client WebSocket del Gateway.
- `gateway.remote.token` / `.password` sono campi di credenziali del client remoto. Da soli non configurano l'auth del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base per il relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano nel gateway registrazioni supportate da relay. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout in millisecondi per l'invio dal gateway al relay. Il valore predefinito è `10000`.
- Le registrazioni supportate da relay vengono delegate a una specifica identità del gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione del relay e inoltra al gateway una grant di invio con ambito di registrazione. Un altro gateway non può riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra indicata.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo per sviluppo per URL relay HTTP in loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo del monitoraggio dello stato dei canali in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitoraggio stato. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket obsoleta in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitoraggio stato per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dei riavvii del monitoraggio stato mantenendo attivo il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per i canali multi-account. Quando impostato, ha la precedenza sull'override a livello di canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP dei reverse proxy che terminano TLS o iniettano header del client inoltrato. Elenca solo proxy che controlli. Le voci loopback sono comunque valide per setup di proxy sullo stesso host/rilevamento locale (per esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono idonee le richieste loopback a `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando è `true`, il gateway accetta `X-Real-IP` se `X-Forwarded-For` manca. Valore predefinito `false` per comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist facoltativa CIDR/IP per approvare automaticamente il primo pairing del dispositivo Node senza scope richiesti. È disabilitata quando non è impostata. Questo non approva automaticamente pairing operator/browser/Control UI/WebChat, né approva automaticamente aggiornamenti di ruolo, scope, metadata o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellazione globale allow/deny per i comandi dichiarati dei Node dopo la valutazione di pairing e allowlist.
- `gateway.tools.deny`: nomi di strumenti aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi di strumenti dalla deny list HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Hardening degli input URL di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero degli URL.
- Header facoltativo di hardening delle risposte:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origini HTTPS che controlli; vedi [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multiistanza

Esegui più gateway su un solo host con porte e directory di stato uniche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag pratici: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Multiple Gateways](/it/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: abilita la terminazione TLS sul listener del gateway (HTTPS/WSS) (predefinito: `false`).
- `autoGenerate`: genera automaticamente una coppia locale certificato/chiave autofirmata quando i file espliciti non sono configurati; solo per uso locale/dev.
- `certPath`: percorso del file system al file del certificato TLS.
- `keyPath`: percorso del file system alla chiave privata TLS; mantieni i permessi limitati.
- `caPath`: percorso facoltativo del bundle CA per la verifica del client o catene di trust personalizzate.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`: controlla come le modifiche di configurazione vengono applicate a runtime.
  - `"off"`: ignora le modifiche live; le modifiche richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo del gateway al cambio di configurazione.
  - `"hot"`: applica le modifiche in-process senza riavviare.
  - `"hybrid"` (predefinito): prova prima il reload a caldo; usa il riavvio come fallback se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche di configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo facoltativo in ms per attendere il completamento delle operazioni in corso prima di forzare un riavvio. Omettilo o impostalo a `0` per attendere indefinitamente e registrare avvisi periodici sulle operazioni ancora pendenti.

---

## Hook

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` oppure `x-openclaw-token: <token>`.
I token hook nella query string vengono rifiutati.

Note di validazione e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riutilizzo del token del Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, limita `hooks.allowedSessionKeyPrefixes` (per esempio `["hook:"]`).
- Se una mapping o un preset usa un `sessionKey` con template, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi statiche delle mapping non richiedono questo opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` delle mapping renderizzati tramite template vengono trattati come forniti esternamente e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli delle mapping">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad esempio `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per i percorsi generici.
- I template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e restare all'interno di `hooks.transformsDir` (i percorsi assoluti e il traversal vengono rifiutati).
- `agentId` instrada verso un agente specifico; gli ID sconosciuti usano come fallback il predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` o omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per le esecuzioni degli agenti hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mapping guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per valori `sessionKey` espliciti (richiesta + mapping), ad esempio `["hook:"]`. Diventa obbligatoria quando una mapping o un preset usa un `sessionKey` con template.
- `deliver: true` invia la risposta finale a un canale; `channel` usa come predefinito `last`.
- `model` sostituisce l'LLM per questa esecuzione hook (deve essere consentito se il catalogo dei modelli è impostato).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni questo instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrispondano allo spazio dei nomi Gmail, per esempio `["hook:", "hook:gmail:"]`.
- Se hai bisogno di `hooks.allowRequestSessionKey: false`, sostituisci il preset con un `sessionKey` statico invece del valore predefinito con template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Il Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Host Canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Pubblica HTML/CSS/JS modificabili dall'agente e A2UI tramite HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le route canvas richiedono l'auth del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- I WebView Node in genere non inviano header auth; dopo che un node è associato e connesso, il Gateway pubblicizza URL di capacità con ambito node per l'accesso a canvas/A2UI.
- Gli URL di capacità sono legati alla sessione WS del node attiva e scadono rapidamente. Non viene usato il fallback basato su IP.
- Inietta un client live-reload nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Pubblica anche A2UI su `/__openclaw__/a2ui/`.
- Le modifiche richiedono un riavvio del gateway.
- Disabilita il live reload per directory grandi o errori `EMFILE`.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (predefinito): omette `cliPath` + `sshPort` dai record TXT.
- `full`: include `cliPath` + `sshPort`.
- L'hostname predefinito è `openclaw`. Sostituiscilo con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per il discovery cross-network, abbinala a un server DNS (CoreDNS consigliato) + split DNS Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Environment

### `env` (variabili env inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Le variabili env inline vengono applicate solo se manca la chiave nel process env.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sostituisce le variabili esistenti).
- `shellEnv`: importa le chiavi previste mancanti dal profilo della tua shell di login.
- Vedi [Environment](/it/help/environment) per la precedenza completa.

### Sostituzione delle variabili env

Riferisci variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Vengono corrisposti solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Usa l'escape con `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori in chiaro continuano a funzionare.

### `SecretRef`

Usa una sola forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- pattern `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern `source: "env"` id: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: puntatore JSON assoluto (per esempio `"/providers/openai/apiKey"`)
- pattern `source: "exec"` id: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- gli id `source: "exec"` non devono contenere segmenti di percorso delimitati da slash `.` o `..` (per esempio `a/../b` viene rifiutato)

### Superficie credenziali supportata

- Matrice canonica: [SecretRef Credential Surface](/it/reference/secretref-credential-surface)
- `secrets apply` ha come destinazione i percorsi delle credenziali supportati in `openclaw.json`.
- I ref in `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura di audit.

### Configurazione dei provider di segreti

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Note:

- Il provider `file` supporta `mode: "json"` e `mode: "singleValue"` (`id` deve essere `"value"` in modalità singleValue).
- I percorsi dei provider file ed exec falliscono in modalità fail-closed quando la verifica ACL Windows non è disponibile. Imposta `allowInsecurePath: true` solo per percorsi attendibili che non possono essere verificati.
- Il provider `exec` richiede un percorso `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi di comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink validando il percorso della destinazione risolta.
- Se `trustedDirs` è configurato, il controllo delle directory attendibili si applica al percorso della destinazione risolta.
- L'environment del child `exec` è minimo per impostazione predefinita; passa esplicitamente le variabili necessarie con `passEnv`.
- I ref ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo dallo snapshot.
- Il filtraggio della superficie attiva si applica durante l'attivazione: i ref non risolti sulle superfici abilitate fanno fallire avvio/reload, mentre le superfici inattive vengono saltate con diagnostica.

---

## Archiviazione auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- I profili per agente vengono archiviati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta ref a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per le modalità di credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile supportate da SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando rilevate.
- Le importazioni OAuth legacy provengono da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei segreti e strumenti `audit/configure/apply`: [Secrets Management](/it/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff base in ore quando un profilo fallisce per veri errori di
  fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito di fatturazione può
  comunque finire qui anche su risposte `401`/`403`, ma i matcher di testo
  specifici del provider restano limitati al provider che li gestisce (per esempio OpenRouter
  `Key limit exceeded`). I messaggi HTTP `402` retryable di finestra d'uso o
  di limite di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per provider per le ore di backoff di fatturazione.
- `billingMaxHours`: limite massimo in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff base in minuti per errori `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite massimo in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni auth-profile dello stesso provider per errori di overload prima di passare al fallback del modello (predefinito: `1`). Le forme di provider occupato come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di ritentare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni auth-profile dello stesso provider per errori di rate limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket di rate limit include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- File di log predefinito: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Imposta `logging.file` per un percorso stabile.
- `consoleLevel` passa a `debug` con `--verbose`.
- `maxFileBytes`: dimensione massima del file di log in byte prima che le scritture vengano soppresse (intero positivo; predefinito: `524288000` = 500 MB). Usa una rotazione dei log esterna per le distribuzioni di produzione.

---

## Diagnostica

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: interruttore principale per l'output di strumentazione (predefinito: `true`).
- `flags`: array di stringhe flag che abilita output di log mirato (supporta wildcard come `"telegram.*"` o `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta in stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di trace, metriche o log.
- `otel.sampleRate`: tasso di campionamento delle trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione raw dei contenuti opt-in per gli attributi span OTEL. Disattivata per impostazione predefinita. Il booleano `true` acquisisce contenuto non-system di messaggi/strumenti; la forma oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore env per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw allora salta l'avvio/arresto dell'SDK posseduto dal plugin mantenendo attivi i listener diagnostici.
- `cacheTrace.enabled`: registra snapshot della cache trace per le esecuzioni incorporate (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL della cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output della cache trace (tutti predefiniti: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canale di rilascio per installazioni npm/git — `"stable"`, `"beta"` oppure `"dev"`.
- `checkOnStart`: controlla gli aggiornamenti npm quando il gateway si avvia (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per le installazioni package (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stable (predefinito: `6`; massimo: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva di distribuzione graduale per il canale stable in ore (predefinito: `12`; massimo: `168`).
- `auto.betaCheckIntervalHours`: frequenza in ore dei controlli del canale beta (predefinito: `1`; massimo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: gate globale della funzionalità ACP (predefinito: `false`).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Impostalo su `false` per mantenere disponibili i comandi ACP bloccandone però l'esecuzione.
- `backend`: id del backend runtime ACP predefinito (deve corrispondere a un plugin runtime ACP registrato).
- `defaultAgent`: id dell'agente ACP di destinazione usato come fallback quando gli spawn non specificano una destinazione esplicita.
- `allowedAgents`: allowlist degli id agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush idle in ms per il testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima della suddivisione della proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime le righe di stato/strumenti ripetute per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` trasmette incrementi progressivi; `"final_only"` bufferizza fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi di strumenti nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri dell'output assistant proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per le righe di stato/aggiornamento ACP proiettate.
- `stream.tagVisibility`: record di nomi di tag con override booleani di visibilità per gli eventi in streaming.
- `runtime.ttlMinutes`: TTL di inattività in minuti per i worker di sessione ACP prima che siano idonei alla pulizia.
- `runtime.installCommand`: comando di installazione facoltativo da eseguire durante il bootstrap di un ambiente runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controlla lo stile della tagline del banner:
  - `"random"` (predefinito): tagline rotanti divertenti/stagionali.
  - `"default"`: tagline neutra fissa (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo tagline (titolo/versione del banner comunque mostrati).
- Per nascondere l'intero banner (non solo le tagline), imposta la variabile env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadati scritti dai flussi di configurazione guidata della CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

Vedi i campi identity di `agents.list` sotto [Agent defaults](/it/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build attuali non includono più il bridge TCP. I Node si connettono tramite il WebSocket del Gateway. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può eliminare le chiavi sconosciute).

<Accordion title="Configurazione legacy del bridge (riferimento storico)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni completate delle esecuzioni Cron isolate prima del pruning da `sessions.json`. Controlla anche la pulizia delle trascrizioni Cron eliminate archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima del pruning. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti conservate quando si attiva il pruning del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: token bearer usato per la consegna POST del Webhook Cron (`delivery.mode = "webhook"`); se omesso non viene inviato alcun header auth.
- `webhook`: URL Webhook fallback legacy deprecato (http/https) usato solo per i job memorizzati che hanno ancora `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: numero massimo di tentativi ripetuti per job one-shot su errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo ripetuto (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i tentativi ripetuti — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai job Cron one-shot. I job ricorrenti usano una gestione dei guasti separata.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: abilita gli avvisi di errore per i job Cron (predefinito: `false`).
- `after`: numero di errori consecutivi prima che venga inviato un avviso (intero positivo, minimo: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso job (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul Webhook configurato.
- `accountId`: id facoltativo di account o canale per limitare la consegna degli avvisi.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destinazione predefinita per le notifiche di errore Cron in tutti i job.
- `mode`: `"announce"` o `"webhook"`; usa `"announce"` come predefinito quando esistono dati di destinazione sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riutilizza l'ultimo canale di consegna noto.
- `to`: destinazione announce esplicita o URL Webhook. Richiesto per la modalità webhook.
- `accountId`: override facoltativo dell'account per la consegna.
- `delivery.failureDestination` per job sostituisce questo valore predefinito globale.
- Quando non è impostata né una destinazione di errore globale né una per job, i job che già consegnano tramite `announce` usano come fallback quella destinazione primaria announce in caso di errore.
- `delivery.failureDestination` è supportato solo per i job `sessionTarget="isolated"` a meno che `delivery.mode` primaria del job non sia `"webhook"`.

Vedi [Cron Jobs](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [attività in background](/it/automation/tasks).

---

## Variabili template del modello media

Segnaposto template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in ingresso          |
| `{{RawBody}}`      | Corpo raw (senza wrapper cronologia/mittente)     |
| `{{BodyStripped}}` | Corpo con le menzioni di gruppo rimosse           |
| `{{From}}`         | Identificatore del mittente                       |
| `{{To}}`           | Identificatore della destinazione                 |
| `{{MessageSid}}`   | ID del messaggio del canale                       |
| `{{SessionId}}`    | UUID della sessione corrente                      |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione   |
| `{{MediaUrl}}`     | Pseudo-URL del media in ingresso                  |
| `{{MediaPath}}`    | Percorso locale del media                         |
| `{{MediaType}}`    | Tipo di media (image/audio/document/…)            |
| `{{Transcript}}`   | Trascrizione audio                                |
| `{{Prompt}}`       | Prompt media risolto per le voci CLI              |
| `{{MaxChars}}`     | Numero massimo di caratteri risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                       |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                  |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)     |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)      |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)     |
| `{{Provider}}`     | Suggerimento provider (whatsapp, telegram, discord, ecc.) |

---

## Include di configurazione (`$include`)

Suddividi la configurazione in più file:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento di merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: deep-merge in ordine (quelli successivi sovrascrivono i precedenti).
- Chiavi sibling: vengono unite dopo gli include (sovrascrivono i valori inclusi).
- Include annidati: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono restare all'interno della directory di configurazione di primo livello (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo se si risolvono comunque all'interno di quel confine.
- Le scritture gestite da OpenClaw che modificano una sola sezione di primo livello supportata da un include a file singolo vengono propagate a quel file incluso. Per esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia intatto `openclaw.json`.
- Gli include root, gli array di include e gli include con override sibling sono di sola lettura per le scritture gestite da OpenClaw; tali scritture falliscono in modalità fail-closed invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configuration](/it/gateway/configuration) · [Configuration Examples](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configuration](/it/gateway/configuration)
- [Configuration examples](/it/gateway/configuration-examples)
