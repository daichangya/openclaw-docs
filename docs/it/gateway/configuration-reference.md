---
read_when:
    - Ti servono la semantica esatta a livello di campo o i valori predefiniti della configurazione
    - Stai validando blocchi di configurazione di canale, modello, gateway o tool
summary: Riferimento della configurazione del Gateway per le chiavi core di OpenClaw, i valori predefiniti e i link ai riferimenti dedicati dei sottosistemi
title: Riferimento della configurazione
x-i18n:
    generated_at: "2026-04-26T11:28:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6c6e12c328cfc3de71e401ae48b44343769c4f6b063479c8ffa4d0e690a2433
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Riferimento della configurazione core per `~/.openclaw/openclaw.json`. Per una panoramica orientata alle attività, vedi [Configurazione](/it/gateway/configuration).

Copre le principali superfici di configurazione di OpenClaw e rimanda altrove quando un sottosistema ha un proprio riferimento più approfondito. I cataloghi di comandi di proprietà di canali e plugin e le opzioni approfondite di memoria/QMD si trovano nelle rispettive pagine invece che qui.

Fonte di verità nel codice:

- `openclaw config schema` stampa lo schema JSON live usato per la validazione e per Control UI, con metadati inclusi di bundled/plugin/channel uniti quando disponibili
- `config.schema.lookup` restituisce un singolo nodo dello schema con ambito percorso per gli strumenti di drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` convalidano l'hash di baseline della documentazione di configurazione rispetto alla superficie dello schema corrente

Percorso di lookup dell'agente: usa l'azione dello strumento `gateway` `config.schema.lookup` per
documentazione e vincoli esatti a livello di campo prima delle modifiche. Usa
[Configurazione](/it/gateway/configuration) per una guida orientata alle attività e questa pagina
per la mappa più ampia dei campi, i valori predefiniti e i link ai riferimenti dei sottosistemi.

Riferimenti dedicati approfonditi:

- [Riferimento della configurazione della memoria](/it/reference/memory-config) per `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e la configurazione di Dreaming sotto `plugins.entries.memory-core.config.dreaming`
- [Comandi slash](/it/tools/slash-commands) per il catalogo corrente dei comandi integrati + bundled
- pagine del canale/plugin proprietario per le superfici di comando specifiche del canale

Il formato della configurazione è **JSON5** (commenti + virgole finali consentiti). Tutti i campi sono facoltativi — OpenClaw usa valori predefiniti sicuri quando vengono omessi.

---

## Canali

Le chiavi di configurazione per canale sono state spostate in una pagina dedicata — vedi
[Configurazione — canali](/it/gateway/config-channels) per `channels.*`,
inclusi Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e altri
canali bundled (auth, controllo degli accessi, multi-account, gating tramite menzione).

## Valori predefiniti dell'agente, multi-agent, sessioni e messaggi

Spostati in una pagina dedicata — vedi
[Configurazione — agenti](/it/gateway/config-agents) per:

- `agents.defaults.*` (workspace, modello, thinking, Heartbeat, memoria, media, Skills, sandbox)
- `multiAgent.*` (instradamento e binding multi-agent)
- `session.*` (ciclo di vita della sessione, Compaction, pruning)
- `messages.*` (consegna dei messaggi, TTS, rendering Markdown)
- `talk.*` (modalità Talk)
  - `talk.speechLocale`: ID locale BCP 47 facoltativo per il riconoscimento vocale di Talk su iOS/macOS
  - `talk.silenceTimeoutMs`: quando non impostato, Talk mantiene la finestra di pausa predefinita della piattaforma prima di inviare la trascrizione (`700 ms su macOS e Android, 900 ms su iOS`)

## Tool e provider personalizzati

La policy dei tool, gli interruttori sperimentali, la configurazione dei tool supportati dal provider e la configurazione dei provider personalizzati / `baseUrl` sono stati spostati in una pagina dedicata — vedi
[Configurazione — tool e provider personalizzati](/it/gateway/config-tools).

## MCP

Le definizioni dei server MCP gestite da OpenClaw si trovano sotto `mcp.servers` e sono
consumate da Pi incorporato e altri adapter runtime. I comandi `openclaw mcp list`,
`show`, `set` e `unset` gestiscono questo blocco senza connettersi al
server di destinazione durante le modifiche della configurazione.

```json5
{
  mcp: {
    // Facoltativo. Predefinito: 600000 ms (10 minuti). Imposta 0 per disabilitare l'espulsione per inattività.
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

- `mcp.servers`: definizioni con nome di server MCP stdio o remoti per runtime che
  espongono tool MCP configurati.
- `mcp.sessionIdleTtlMs`: TTL di inattività per i runtime MCP bundled con ambito sessione.
  Le esecuzioni embedded one-shot richiedono la pulizia alla fine dell'esecuzione; questo TTL è il ripiego per
  sessioni di lunga durata e chiamanti futuri.
- Le modifiche sotto `mcp.*` si applicano a caldo smaltendo i runtime MCP di sessione memorizzati nella cache.
  La successiva discovery/uso dei tool li ricrea dalla nuova configurazione, quindi le voci
  `mcp.servers` rimosse vengono eliminate immediatamente invece di attendere il TTL di inattività.

Vedi [MCP](/it/cli/mcp#openclaw-as-an-mcp-client-registry) e
[Backend CLI](/it/gateway/cli-backends#bundle-mcp-overlays) per il comportamento runtime.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oppure stringa plaintext
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist facoltativa solo per le Skills bundled (le Skills gestite/workspace non sono interessate).
- `load.extraDirs`: root Skills condivise aggiuntive (precedenza più bassa).
- `install.preferBrew`: quando è true, preferisce i programmi di installazione Homebrew quando `brew` è
  disponibile prima di ripiegare su altri tipi di installatore.
- `install.nodeManager`: preferenza del gestore Node per le specifiche `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` disabilita una Skill anche se bundled/installata.
- `entries.<skillKey>.apiKey`: campo di comodità per API key per Skills che dichiarano una variabile env primaria (stringa plaintext o oggetto SecretRef).

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
- La discovery accetta plugin OpenClaw nativi più bundle compatibili con Codex e bundle Claude, inclusi bundle Claude senza manifest con layout predefinito.
- **Le modifiche alla configurazione richiedono il riavvio del gateway.**
- `allow`: allowlist facoltativa (si caricano solo i plugin elencati). `deny` ha la precedenza.
- `plugins.entries.<id>.apiKey`: campo di comodità per API key a livello plugin (quando supportato dal plugin).
- `plugins.entries.<id>.env`: mappa di variabili env con ambito plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando è `false`, il core blocca `before_prompt_build` e ignora i campi che mutano il prompt da `before_agent_start` legacy, preservando però `modelOverride` e `providerOverride` legacy. Si applica agli hook plugin nativi e alle directory hook fornite da bundle supportati.
- `plugins.entries.<id>.hooks.allowConversationAccess`: quando è `true`, i plugin non bundled fidati possono leggere il contenuto grezzo della conversazione da hook tipizzati come `llm_input`, `llm_output`, `before_agent_finalize` e `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: considera esplicitamente affidabile questo plugin per richiedere override per esecuzione di `provider` e `model` per esecuzioni in background di sottoagenti.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist facoltativa di destinazioni canoniche `provider/model` per override fidati di sottoagenti. Usa `"*"` solo quando vuoi intenzionalmente consentire qualsiasi modello.
- `plugins.entries.<id>.config`: oggetto di configurazione definito dal plugin (validato dallo schema del plugin OpenClaw nativo quando disponibile).
- Le impostazioni di account/runtime dei plugin di canale si trovano sotto `channels.<id>` e dovrebbero essere descritte dai metadati `channelConfigs` del manifest del plugin proprietario, non da un registry centrale delle opzioni OpenClaw.
- `plugins.entries.firecrawl.config.webFetch`: impostazioni del provider web-fetch Firecrawl.
  - `apiKey`: API key Firecrawl (accetta SecretRef). Usa come fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, il legacy `tools.web.fetch.firecrawl.apiKey` o la variabile env `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base dell'API Firecrawl (predefinito: `https://api.firecrawl.dev`).
  - `onlyMainContent`: estrae solo il contenuto principale dalle pagine (predefinito: `true`).
  - `maxAgeMs`: età massima della cache in millisecondi (predefinito: `172800000` / 2 giorni).
  - `timeoutSeconds`: timeout della richiesta di scraping in secondi (predefinito: `60`).
- `plugins.entries.xai.config.xSearch`: impostazioni di xAI X Search (ricerca web Grok).
  - `enabled`: abilita il provider X Search.
  - `model`: modello Grok da usare per la ricerca (ad esempio `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: impostazioni di Dreaming della memoria. Vedi [Dreaming](/it/concepts/dreaming) per fasi e soglie.
  - `enabled`: interruttore principale di Dreaming (predefinito `false`).
  - `frequency`: cadenza Cron per ogni sweep completo di Dreaming (predefinito `"0 3 * * *"`).
  - la policy di fase e le soglie sono dettagli di implementazione (non chiavi di configurazione rivolte all'utente).
- La configurazione completa della memoria si trova in [Riferimento della configurazione della memoria](/it/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- I plugin bundle Claude abilitati possono anche contribuire con valori predefiniti Pi incorporati da `settings.json`; OpenClaw li applica come impostazioni dell'agente sanificate, non come patch grezze della configurazione OpenClaw.
- `plugins.slots.memory`: seleziona l'id del plugin di memoria attivo, oppure `"none"` per disabilitare i plugin di memoria.
- `plugins.slots.contextEngine`: seleziona l'id del plugin del motore di contesto attivo; il predefinito è `"legacy"` a meno che tu non installi e selezioni un altro motore.

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
      // dangerouslyAllowPrivateNetwork: true, // aderisci solo per accesso fidato a reti private
      // allowPrivateNetwork: true, // alias legacy
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
- `tabCleanup` recupera le schede tracciate dell'agente primario dopo un tempo di inattività o quando una
  sessione supera il proprio limite. Imposta `idleMinutes: 0` o `maxTabsPerSession: 0` per
  disabilitare singolarmente quelle modalità di pulizia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato quando non impostato, quindi la navigazione del browser resta rigorosa per impostazione predefinita.
- Imposta `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` solo quando ti fidi intenzionalmente della navigazione del browser su rete privata.
- In modalità rigorosa, gli endpoint di profilo CDP remoti (`profiles.*.cdpUrl`) sono soggetti allo stesso blocco della rete privata durante i controlli di raggiungibilità/discovery.
- `ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy.
- In modalità rigorosa, usa `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` per eccezioni esplicite.
- I profili remoti sono solo attach-only (avvio/arresto/reset disabilitati).
- `profiles.*.cdpUrl` accetta `http://`, `https://`, `ws://` e `wss://`.
  Usa HTTP(S) quando vuoi che OpenClaw scopra `/json/version`; usa WS(S)
  quando il tuo provider ti fornisce un URL WebSocket DevTools diretto.
- `remoteCdpTimeoutMs` e `remoteCdpHandshakeTimeoutMs` si applicano alla raggiungibilità CDP remota e
  `attachOnly` più alle richieste di apertura scheda. I profili loopback gestiti
  mantengono i valori predefiniti CDP locali.
- Se un servizio CDP gestito esternamente è raggiungibile tramite loopback, imposta
  `attachOnly: true` per quel profilo; altrimenti OpenClaw tratta la porta loopback come un
  profilo browser locale gestito e può segnalare errori di proprietà della porta locale.
- I profili `existing-session` usano Chrome MCP invece di CDP e possono collegarsi sull'host
  selezionato o tramite un browser Node connesso.
- I profili `existing-session` possono impostare `userDataDir` per puntare a un profilo specifico
  di browser basato su Chromium come Brave o Edge.
- I profili `existing-session` mantengono gli attuali limiti di instradamento Chrome MCP:
  azioni guidate da snapshot/ref invece che targeting tramite selettore CSS, hook di upload
  a file singolo, nessun override del timeout delle finestre di dialogo, nessun `wait --load networkidle` e nessun
  `responsebody`, esportazione PDF, intercettazione dei download o azioni batch.
- I profili locali gestiti `openclaw` assegnano automaticamente `cdpPort` e `cdpUrl`; imposta
  `cdpUrl` esplicitamente solo per CDP remoto.
- I profili locali gestiti possono impostare `executablePath` per sovrascrivere il valore globale
  `browser.executablePath` per quel profilo. Usalo per eseguire un profilo in
  Chrome e un altro in Brave.
- I profili locali gestiti usano `browser.localLaunchTimeoutMs` per la discovery HTTP di Chrome CDP
  dopo l'avvio del processo e `browser.localCdpReadyTimeoutMs` per la disponibilità websocket CDP
  post-avvio. Aumentali su host più lenti dove Chrome si avvia correttamente ma i
  controlli di disponibilità corrono in parallelo con l'avvio. Entrambi i valori devono essere
  interi positivi fino a `120000` ms; valori di configurazione non validi vengono rifiutati.
- Ordine di rilevamento automatico: browser predefinito se basato su Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` e `browser.profiles.<name>.executablePath` accettano entrambi
  `~` e `~/...` per la directory home del tuo sistema operativo prima dell'avvio di Chromium.
  Anche `userDataDir` per profilo sui profili `existing-session` espande la tilde.
- Servizio di controllo: solo loopback (porta derivata da `gateway.port`, predefinita `18791`).
- `extraArgs` aggiunge flag di avvio extra all'avvio locale di Chromium (ad esempio
  `--disable-gpu`, dimensionamento finestra o flag di debug).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, testo breve, URL immagine o data URI
    },
  },
}
```

- `seamColor`: colore di accento per la UI chrome dell'app nativa (tinta della bolla della modalità Talk, ecc.).
- `assistant`: override dell'identità di Control UI. Usa come fallback l'identità dell'agente attivo.

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
      // password: "your-password", // oppure OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // per mode=trusted-proxy; vedi /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // pericoloso: consente URL embed http(s) esterni assoluti
      // allowedOrigins: ["https://control.example.com"], // richiesto per Control UI non loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // modalità pericolosa di fallback origin tramite header Host
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
    // Facoltativo. Predefinito false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Facoltativo. Predefinito non impostato/disabilitato.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Ulteriori deny HTTP per /tools/invoke
      deny: ["browser"],
      // Rimuovi tool dalla deny list HTTP predefinita
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

- `mode`: `local` (esegue il gateway) oppure `remote` (si connette a un gateway remoto). Il Gateway rifiuta di avviarsi se non è `local`.
- `port`: singola porta multiplexed per WS + HTTP. Precedenza: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (predefinito), `lan` (`0.0.0.0`), `tailnet` (solo IP Tailscale) oppure `custom`.
- **Alias bind legacy**: usa i valori della modalità bind in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), non gli alias host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Nota Docker**: il bind `loopback` predefinito ascolta su `127.0.0.1` all'interno del container. Con il networking bridge di Docker (`-p 18789:18789`), il traffico arriva su `eth0`, quindi il gateway non è raggiungibile. Usa `--network host`, oppure imposta `bind: "lan"` (o `bind: "custom"` con `customBindHost: "0.0.0.0"`) per ascoltare su tutte le interfacce.
- **Auth**: richiesta per impostazione predefinita. I bind non loopback richiedono auth del gateway. In pratica questo significa un token/password condiviso oppure un reverse proxy identity-aware con `gateway.auth.mode: "trusted-proxy"`. La procedura guidata di onboarding genera un token per impostazione predefinita.
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef), imposta esplicitamente `gateway.auth.mode` su `token` oppure `password`. L'avvio e i flussi di installazione/riparazione del servizio falliscono quando entrambi sono configurati e la modalità non è impostata.
- `gateway.auth.mode: "none"`: modalità esplicita senza auth. Usala solo per configurazioni loopback locali fidate; questa opzione intenzionalmente non viene proposta dai prompt di onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega l'auth a un reverse proxy identity-aware e considera attendibili gli header di identità da `gateway.trustedProxies` (vedi [Auth Trusted Proxy](/it/gateway/trusted-proxy-auth)). Questa modalità si aspetta una sorgente proxy **non loopback**; i reverse proxy loopback sullo stesso host non soddisfano l'auth trusted-proxy.
- `gateway.auth.allowTailscale`: quando è `true`, gli header di identità Tailscale Serve possono soddisfare l'auth di Control UI/WebSocket (verificata tramite `tailscale whois`). Gli endpoint HTTP API **non** usano quella auth tramite header Tailscale; seguono invece la normale modalità auth HTTP del gateway. Questo flusso senza token presuppone che l'host gateway sia fidato. Il valore predefinito è `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limiter facoltativo per auth fallita. Si applica per IP client e per ambito auth (shared-secret e device-token sono tracciati in modo indipendente). I tentativi bloccati restituiscono `429` + `Retry-After`.
  - Sul percorso asincrono di Control UI Tailscale Serve, i tentativi falliti per lo stesso `{scope, clientIp}` vengono serializzati prima della scrittura del fallimento. I tentativi concorrenti errati dello stesso client possono quindi attivare il limiter sulla seconda richiesta invece che passare entrambi come semplici mismatch.
  - `gateway.auth.rateLimit.exemptLoopback` ha come predefinito `true`; imposta `false` quando vuoi intenzionalmente limitare anche il traffico localhost (per configurazioni di test o deployment proxy rigorosi).
- I tentativi auth WS con origine browser vengono sempre limitati con l'esenzione loopback disabilitata (difesa in profondità contro forza bruta localhost basata su browser).
- Su loopback, quei lockout da origine browser sono isolati per valore `Origin`
  normalizzato, quindi fallimenti ripetuti da un'origine localhost non bloccano automaticamente
  un'origine diversa.
- `tailscale.mode`: `serve` (solo tailnet, bind loopback) oppure `funnel` (pubblico, richiede auth).
- `controlUi.allowedOrigins`: allowlist esplicita delle origini browser per le connessioni WebSocket al Gateway. Richiesta quando sono previsti client browser da origini non loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modalità pericolosa che abilita il fallback dell'origine tramite header Host per deployment che si affidano intenzionalmente alla policy di origine basata su Host header.
- `remote.transport`: `ssh` (predefinito) oppure `direct` (ws/wss). Per `direct`, `remote.url` deve essere `ws://` oppure `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: override break-glass lato client a livello di
  ambiente di processo che consente `ws://` in chiaro verso IP di rete privata fidati;
  il valore predefinito resta solo loopback per il plaintext. Non esiste un equivalente in `openclaw.json`,
  e la configurazione browser di rete privata come
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` non influisce sui client WebSocket del Gateway.
- `gateway.remote.token` / `.password` sono campi credenziali del client remoto. Da soli non configurano l'auth del gateway.
- `gateway.push.apns.relay.baseUrl`: URL HTTPS base del relay APNs esterno usato dalle build iOS ufficiali/TestFlight dopo che pubblicano registrazioni supportate da relay sul gateway. Questo URL deve corrispondere all'URL del relay compilato nella build iOS.
- `gateway.push.apns.relay.timeoutMs`: timeout in millisecondi per l'invio dal gateway al relay. Predefinito `10000`.
- Le registrazioni supportate da relay vengono delegate a una specifica identità gateway. L'app iOS associata recupera `gateway.identity.get`, include quell'identità nella registrazione relay e inoltra al gateway una concessione di invio con ambito registrazione. Un altro gateway non può riutilizzare quella registrazione memorizzata.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: override env temporanei per la configurazione relay sopra.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch solo per sviluppo per URL relay HTTP loopback. Gli URL relay di produzione dovrebbero restare su HTTPS.
- `gateway.channelHealthCheckMinutes`: intervallo del monitor dello stato del canale in minuti. Imposta `0` per disabilitare globalmente i riavvii del monitor dello stato. Predefinito: `5`.
- `gateway.channelStaleEventThresholdMinutes`: soglia socket stale in minuti. Mantienila maggiore o uguale a `gateway.channelHealthCheckMinutes`. Predefinito: `30`.
- `gateway.channelMaxRestartsPerHour`: numero massimo di riavvii del monitor dello stato per canale/account in un'ora mobile. Predefinito: `10`.
- `channels.<provider>.healthMonitor.enabled`: opt-out per canale dai riavvii del monitor dello stato mantenendo abilitato il monitor globale.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: override per account per canali multi-account. Quando è impostato, ha la precedenza sull'override a livello di canale.
- I percorsi di chiamata del gateway locale possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
- Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun fallback remoto che mascheri il problema).
- `trustedProxies`: IP di reverse proxy che terminano TLS o iniettano header client inoltrati. Elenca solo proxy che controlli. Le voci loopback restano valide per configurazioni di rilevamento proxy locale/sullo stesso host (ad esempio Tailscale Serve o un reverse proxy locale), ma **non** rendono le richieste loopback idonee per `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando è `true`, il gateway accetta `X-Real-IP` se manca `X-Forwarded-For`. Predefinito `false` per comportamento fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: allowlist CIDR/IP facoltativa per l'auto-approvazione del pairing iniziale dei dispositivi node senza scope richiesti. È disabilitata quando non impostata. Questo non auto-approva pairing operator/browser/Control UI/WebChat, e non auto-approva aggiornamenti di ruolo, scope, metadati o chiave pubblica.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: modellamento globale consenti/nega per i comandi node dichiarati dopo il pairing e la valutazione dell'allowlist.
- `gateway.tools.deny`: nomi tool aggiuntivi bloccati per HTTP `POST /tools/invoke` (estende la deny list predefinita).
- `gateway.tools.allow`: rimuove nomi tool dalla deny list HTTP predefinita.

</Accordion>

### Endpoint compatibili con OpenAI

- Chat Completions: disabilitato per impostazione predefinita. Abilitalo con `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Hardening URL-input di Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Le allowlist vuote vengono trattate come non impostate; usa `gateway.http.endpoints.responses.files.allowUrl=false`
    e/o `gateway.http.endpoints.responses.images.allowUrl=false` per disabilitare il recupero URL.
- Header facoltativo di hardening delle risposte:
  - `gateway.http.securityHeaders.strictTransportSecurity` (impostalo solo per origini HTTPS che controlli; vedi [Auth Trusted Proxy](/it/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento multiistanza

Esegui più gateway su un host con porte e directory di stato uniche:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flag di comodità: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Vedi [Gateway multipli](/it/gateway/multiple-gateways).

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
- `autoGenerate`: genera automaticamente una coppia locale cert/key self-signed quando non sono configurati file espliciti; solo per uso locale/dev.
- `certPath`: percorso del filesystem al file del certificato TLS.
- `keyPath`: percorso del filesystem alla chiave privata TLS; mantienilo con permessi ristretti.
- `caPath`: percorso facoltativo al bundle CA per verifica client o catene di trust personalizzate.

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

- `mode`: controlla come vengono applicate a runtime le modifiche della configurazione.
  - `"off"`: ignora le modifiche live; le modifiche richiedono un riavvio esplicito.
  - `"restart"`: riavvia sempre il processo gateway in caso di modifica della configurazione.
  - `"hot"`: applica le modifiche in-process senza riavviare.
  - `"hybrid"` (predefinito): prova prima il reload hot; usa come fallback il riavvio se necessario.
- `debounceMs`: finestra di debounce in ms prima che le modifiche della configurazione vengano applicate (intero non negativo).
- `deferralTimeoutMs`: tempo massimo facoltativo in ms da attendere per le operazioni in volo prima di forzare un riavvio. Omettilo o imposta `0` per attendere indefinitamente e registrare avvisi periodici di attività ancora in sospeso.

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

Note su validazione e sicurezza:

- `hooks.enabled=true` richiede un `hooks.token` non vuoto.
- `hooks.token` deve essere **distinto** da `gateway.auth.token`; il riuso del token Gateway viene rifiutato.
- `hooks.path` non può essere `/`; usa un sottopercorso dedicato come `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, vincola `hooks.allowedSessionKeyPrefixes` (ad esempio `["hook:"]`).
- Se una mapping o un preset usa un `sessionKey` templated, imposta `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Le chiavi di mapping statiche non richiedono questo opt-in.

**Endpoint:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` dal payload della richiesta viene accettato solo quando `hooks.allowRequestSessionKey=true` (predefinito: `false`).
- `POST /hooks/<name>` → risolto tramite `hooks.mappings`
  - I valori `sessionKey` renderizzati tramite template nella mapping vengono trattati come forniti esternamente e richiedono anch'essi `hooks.allowRequestSessionKey=true`.

<Accordion title="Dettagli della mapping">

- `match.path` corrisponde al sottopercorso dopo `/hooks` (ad es. `/hooks/gmail` → `gmail`).
- `match.source` corrisponde a un campo del payload per percorsi generici.
- Template come `{{messages[0].subject}}` leggono dal payload.
- `transform` può puntare a un modulo JS/TS che restituisce un'azione hook.
  - `transform.module` deve essere un percorso relativo e rimanere entro `hooks.transformsDir` (i percorsi assoluti e il traversal vengono rifiutati).
- `agentId` instrada a un agente specifico; gli ID sconosciuti usano come fallback il predefinito.
- `allowedAgentIds`: limita l'instradamento esplicito (`*` oppure omesso = consenti tutti, `[]` = nega tutti).
- `defaultSessionKey`: chiave di sessione fissa facoltativa per esecuzioni dell'agente hook senza `sessionKey` esplicito.
- `allowRequestSessionKey`: consente ai chiamanti di `/hooks/agent` e alle chiavi di sessione delle mapping guidate da template di impostare `sessionKey` (predefinito: `false`).
- `allowedSessionKeyPrefixes`: allowlist facoltativa di prefissi per valori `sessionKey` espliciti (richiesta + mapping), ad es. `["hook:"]`. Diventa obbligatoria quando una mapping o un preset usa un `sessionKey` templated.
- `deliver: true` invia la risposta finale a un canale; `channel` usa come predefinito `last`.
- `model` sovrascrive l'LLM per questa esecuzione hook (deve essere consentito se è impostato un catalogo modelli).

</Accordion>

### Integrazione Gmail

- Il preset Gmail integrato usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se mantieni questo instradamento per messaggio, imposta `hooks.allowRequestSessionKey: true` e limita `hooks.allowedSessionKeyPrefixes` in modo che corrisponda allo spazio dei nomi Gmail, ad esempio `["hook:", "hook:gmail:"]`.
- Se hai bisogno di `hooks.allowRequestSessionKey: false`, sovrascrivi il preset con un `sessionKey` statico invece del valore predefinito templated.

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

- Il Gateway avvia automaticamente `gog gmail watch serve` all'avvio quando è configurato. Imposta `OPENCLAW_SKIP_GMAIL_WATCHER=1` per disabilitarlo.
- Non eseguire un `gog gmail watch serve` separato insieme al Gateway.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // oppure OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS modificabili dall'agente e A2UI via HTTP sotto la porta del Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Solo locale: mantieni `gateway.bind: "loopback"` (predefinito).
- Bind non loopback: le route canvas richiedono auth del Gateway (token/password/trusted-proxy), come le altre superfici HTTP del Gateway.
- I Node WebView in genere non inviano header auth; dopo che un Node è associato e connesso, il Gateway pubblicizza URL capability con ambito node per l'accesso a canvas/A2UI.
- Gli URL capability sono legati alla sessione WS del node attivo e scadono rapidamente. Il fallback basato su IP non viene usato.
- Inietta il client live-reload nell'HTML servito.
- Crea automaticamente un `index.html` iniziale quando è vuoto.
- Serve anche A2UI su `/__openclaw__/a2ui/`.
- Le modifiche richiedono il riavvio del gateway.
- Disabilita il live reload per directory molto grandi o in caso di errori `EMFILE`.

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
- Il nome host usa come predefinito `openclaw`. Sovrascrivilo con `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Scrive una zona DNS-SD unicast sotto `~/.openclaw/dns/`. Per la discovery cross-network, abbinala a un server DNS (CoreDNS consigliato) + split DNS Tailscale.

Configurazione: `openclaw dns setup --apply`.

---

## Ambiente

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

- Le variabili env inline vengono applicate solo se nell'env del processo manca la chiave.
- File `.env`: `.env` della CWD + `~/.openclaw/.env` (nessuno dei due sovrascrive variabili esistenti).
- `shellEnv`: importa le chiavi mancanti attese dal profilo della tua shell di login.
- Vedi [Ambiente](/it/help/environment) per la precedenza completa.

### Sostituzione di variabili env

Fai riferimento alle variabili env in qualsiasi stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Vengono riconosciuti solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`.
- Variabili mancanti/vuote generano un errore al caricamento della configurazione.
- Usa l'escape con `$${VAR}` per un `${VAR}` letterale.
- Funziona con `$include`.

---

## Segreti

I riferimenti ai segreti sono additivi: i valori plaintext continuano a funzionare.

### `SecretRef`

Usa una forma oggetto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validazione:

- pattern `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- pattern `id` per `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` `id`: puntatore JSON assoluto (ad esempio `"/providers/openai/apiKey"`)
- pattern `id` per `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- gli `id` con `source: "exec"` non devono contenere segmenti di percorso slash-delimited `.` o `..` (ad esempio `a/../b` viene rifiutato)

### Superficie credenziali supportata

- Matrice canonica: [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface)
- `secrets apply` punta ai percorsi credenziali supportati in `openclaw.json`.
- I riferimenti in `auth-profiles.json` sono inclusi nella risoluzione runtime e nella copertura dell'audit.

### Configurazione dei provider dei segreti

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // provider env esplicito facoltativo
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
- I percorsi dei provider file ed exec falliscono in modo chiuso quando la verifica ACL di Windows non è disponibile. Imposta `allowInsecurePath: true` solo per percorsi fidati che non possono essere verificati.
- Il provider `exec` richiede un percorso `command` assoluto e usa payload di protocollo su stdin/stdout.
- Per impostazione predefinita, i percorsi di comando symlink vengono rifiutati. Imposta `allowSymlinkCommand: true` per consentire percorsi symlink validando il percorso target risolto.
- Se `trustedDirs` è configurato, il controllo delle directory fidate si applica al percorso target risolto.
- L'ambiente del processo figlio `exec` è minimale per impostazione predefinita; passa esplicitamente le variabili richieste con `passEnv`.
- I riferimenti ai segreti vengono risolti al momento dell'attivazione in uno snapshot in memoria, poi i percorsi di richiesta leggono solo lo snapshot.
- Il filtro della superficie attiva si applica durante l'attivazione: i riferimenti non risolti sulle superfici abilitate causano il fallimento di avvio/reload, mentre le superfici inattive vengono saltate con diagnostica.

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

- I profili per agente sono memorizzati in `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` supporta riferimenti a livello di valore (`keyRef` per `api_key`, `tokenRef` per `token`) per modalità credenziali statiche.
- I profili in modalità OAuth (`auth.profiles.<id>.mode = "oauth"`) non supportano credenziali auth-profile supportate da SecretRef.
- Le credenziali runtime statiche provengono da snapshot risolti in memoria; le voci statiche legacy di `auth.json` vengono ripulite quando vengono rilevate.
- Import legacy OAuth da `~/.openclaw/credentials/oauth.json`.
- Vedi [OAuth](/it/concepts/oauth).
- Comportamento runtime dei segreti e strumenti `audit/configure/apply`: [Gestione dei segreti](/it/gateway/secrets).

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

- `billingBackoffHours`: backoff base in ore quando un profilo fallisce per veri
  errori di fatturazione/credito insufficiente (predefinito: `5`). Il testo esplicito di fatturazione può
  comunque finire qui anche su risposte `401`/`403`, ma i matcher di testo specifici del provider
  restano limitati al provider che li possiede (ad esempio OpenRouter
  `Key limit exceeded`). I messaggi retryable HTTP `402` relativi a finestra d'uso o
  limiti di spesa di organizzazione/workspace restano invece nel percorso `rate_limit`.
- `billingBackoffHoursByProvider`: override facoltativi per provider per le ore di backoff fatturazione.
- `billingMaxHours`: limite massimo in ore per la crescita esponenziale del backoff di fatturazione (predefinito: `24`).
- `authPermanentBackoffMinutes`: backoff base in minuti per fallimenti `auth_permanent` ad alta confidenza (predefinito: `10`).
- `authPermanentMaxMinutes`: limite massimo in minuti per la crescita del backoff `auth_permanent` (predefinito: `60`).
- `failureWindowHours`: finestra mobile in ore usata per i contatori di backoff (predefinito: `24`).
- `overloadedProfileRotations`: numero massimo di rotazioni dello stesso auth-profile provider per errori di overload prima di passare al fallback del modello (predefinito: `1`). Le forme di provider occupato come `ModelNotReadyException` finiscono qui.
- `overloadedBackoffMs`: ritardo fisso prima di riprovare una rotazione di provider/profilo sovraccarico (predefinito: `0`).
- `rateLimitedProfileRotations`: numero massimo di rotazioni dello stesso auth-profile provider per errori di rate limit prima di passare al fallback del modello (predefinito: `1`). Quel bucket di rate limit include testo modellato dal provider come `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

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
- `consoleLevel` passa a `debug` quando usi `--verbose`.
- `maxFileBytes`: dimensione massima del file di log attivo in byte prima della rotazione (intero positivo; predefinito: `104857600` = 100 MB). OpenClaw conserva fino a cinque archivi numerati accanto al file attivo.

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
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
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
- `flags`: array di stringhe flag che abilitano output di log mirato (supporta wildcard come `"telegram.*"` oppure `"*"`).
- `stuckSessionWarnMs`: soglia di età in ms per emettere avvisi di sessione bloccata mentre una sessione resta nello stato di elaborazione.
- `otel.enabled`: abilita la pipeline di esportazione OpenTelemetry (predefinito: `false`). Per la configurazione completa, il catalogo dei segnali e il modello di privacy, vedi [Esportazione OpenTelemetry](/it/gateway/opentelemetry).
- `otel.endpoint`: URL del collector per l'esportazione OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: endpoint OTLP facoltativi specifici per segnale. Quando impostati, sovrascrivono `otel.endpoint` solo per quel segnale.
- `otel.protocol`: `"http/protobuf"` (predefinito) oppure `"grpc"`.
- `otel.headers`: header di metadati HTTP/gRPC aggiuntivi inviati con le richieste di esportazione OTel.
- `otel.serviceName`: nome del servizio per gli attributi della risorsa.
- `otel.traces` / `otel.metrics` / `otel.logs`: abilitano l'esportazione di trace, metriche o log.
- `otel.sampleRate`: frequenza di campionamento delle trace `0`–`1`.
- `otel.flushIntervalMs`: intervallo periodico di flush della telemetria in ms.
- `otel.captureContent`: acquisizione opt-in del contenuto grezzo per gli attributi span OTEL. Disattivata per impostazione predefinita. Il booleano `true` acquisisce contenuto di messaggi/tool non di sistema; la forma oggetto consente di abilitare esplicitamente `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` e `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: interruttore env per gli attributi provider span GenAI sperimentali più recenti. Per impostazione predefinita gli span mantengono l'attributo legacy `gen_ai.system` per compatibilità; le metriche GenAI usano attributi semantici limitati.
- `OPENCLAW_OTEL_PRELOADED=1`: interruttore env per host che hanno già registrato un SDK OpenTelemetry globale. OpenClaw quindi salta l'avvio/arresto dell'SDK di proprietà del plugin mantenendo attivi i listener diagnostici.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` e `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: variabili env di endpoint specifiche per segnale usate quando la chiave di configurazione corrispondente non è impostata.
- `cacheTrace.enabled`: registra snapshot della cache trace per esecuzioni embedded (predefinito: `false`).
- `cacheTrace.filePath`: percorso di output per il JSONL della cache trace (predefinito: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controllano cosa viene incluso nell'output della cache trace (tutti predefiniti: `true`).

---

## Aggiornamento

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
- `checkOnStart`: controlla la presenza di aggiornamenti npm all'avvio del gateway (predefinito: `true`).
- `auto.enabled`: abilita l'aggiornamento automatico in background per le installazioni dei package (predefinito: `false`).
- `auto.stableDelayHours`: ritardo minimo in ore prima dell'applicazione automatica sul canale stable (predefinito: `6`; max: `168`).
- `auto.stableJitterHours`: finestra aggiuntiva di distribuzione graduale in ore per il canale stable (predefinito: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: frequenza di esecuzione dei controlli del canale beta in ore (predefinito: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
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

- `enabled`: gate globale della funzionalità ACP (predefinito: `true`; imposta `false` per nascondere le funzionalità ACP di dispatch e spawn).
- `dispatch.enabled`: gate indipendente per il dispatch dei turni di sessione ACP (predefinito: `true`). Imposta `false` per mantenere disponibili i comandi ACP bloccando però l'esecuzione.
- `backend`: id backend runtime ACP predefinito (deve corrispondere a un plugin runtime ACP registrato).
  Se `plugins.allow` è impostato, includi l'id del plugin backend (ad esempio `acpx`) oppure il plugin predefinito bundled non verrà caricato.
- `defaultAgent`: id agente ACP di fallback quando gli spawn non specificano una destinazione esplicita.
- `allowedAgents`: allowlist di id agente consentiti per le sessioni runtime ACP; vuoto significa nessuna restrizione aggiuntiva.
- `maxConcurrentSessions`: numero massimo di sessioni ACP attive contemporaneamente.
- `stream.coalesceIdleMs`: finestra di flush inattiva in ms per il testo in streaming.
- `stream.maxChunkChars`: dimensione massima del chunk prima della suddivisione della proiezione del blocco in streaming.
- `stream.repeatSuppression`: sopprime le righe ripetute di stato/tool per turno (predefinito: `true`).
- `stream.deliveryMode`: `"live"` esegue lo streaming incrementale; `"final_only"` accumula fino agli eventi terminali del turno.
- `stream.hiddenBoundarySeparator`: separatore prima del testo visibile dopo eventi tool nascosti (predefinito: `"paragraph"`).
- `stream.maxOutputChars`: numero massimo di caratteri di output dell'assistente proiettati per turno ACP.
- `stream.maxSessionUpdateChars`: numero massimo di caratteri per le righe proiettate di stato/aggiornamento ACP.
- `stream.tagVisibility`: record da nomi di tag a override booleani di visibilità per eventi in streaming.
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

- `cli.banner.taglineMode` controlla lo stile del sottotitolo del banner:
  - `"random"` (predefinito): sottotitoli a rotazione divertenti/stagionali.
  - `"default"`: sottotitolo neutro fisso (`All your chats, one OpenClaw.`).
  - `"off"`: nessun testo di sottotitolo (il titolo/versione del banner vengono comunque mostrati).
- Per nascondere l'intero banner (non solo i sottotitoli), imposta l'env `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadati scritti dai flussi di configurazione guidata CLI (`onboard`, `configure`, `doctor`):

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

Vedi i campi identity di `agents.list` in [Valori predefiniti dell'agente](/it/gateway/config-agents#agent-defaults).

---

## Bridge (legacy, rimosso)

Le build correnti non includono più il bridge TCP. I Node si connettono tramite il Gateway WebSocket. Le chiavi `bridge.*` non fanno più parte dello schema di configurazione (la validazione fallisce finché non vengono rimosse; `openclaw doctor --fix` può rimuovere le chiavi sconosciute).

<Accordion title="Configurazione bridge legacy (riferimento storico)">

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
    webhook: "https://example.invalid/legacy", // fallback deprecato per lavori memorizzati notify:true
    webhookToken: "replace-with-dedicated-token", // bearer token facoltativo per auth webhook in uscita
    sessionRetention: "24h", // stringa durata oppure false
    runLog: {
      maxBytes: "2mb", // predefinito 2_000_000 byte
      keepLines: 2000, // predefinito 2000
    },
  },
}
```

- `sessionRetention`: per quanto tempo mantenere le sessioni completate di esecuzioni Cron isolate prima del pruning da `sessions.json`. Controlla anche la pulizia delle trascrizioni Cron eliminate archiviate. Predefinito: `24h`; imposta `false` per disabilitare.
- `runLog.maxBytes`: dimensione massima per file di log di esecuzione (`cron/runs/<jobId>.jsonl`) prima del pruning. Predefinito: `2_000_000` byte.
- `runLog.keepLines`: righe più recenti mantenute quando viene attivato il pruning del log di esecuzione. Predefinito: `2000`.
- `webhookToken`: bearer token usato per la consegna POST del webhook Cron (`delivery.mode = "webhook"`); se omesso non viene inviato alcun header auth.
- `webhook`: URL webhook legacy deprecato di fallback (http/https) usato solo per i lavori memorizzati che hanno ancora `notify: true`.

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

- `maxAttempts`: numero massimo di retry per lavori one-shot su errori transitori (predefinito: `3`; intervallo: `0`–`10`).
- `backoffMs`: array di ritardi di backoff in ms per ogni tentativo di retry (predefinito: `[30000, 60000, 300000]`; 1–10 voci).
- `retryOn`: tipi di errore che attivano i retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Ometti per ritentare tutti i tipi transitori.

Si applica solo ai lavori Cron one-shot. I lavori ricorrenti usano una gestione separata dei fallimenti.

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

- `enabled`: abilita gli avvisi di fallimento per i lavori Cron (predefinito: `false`).
- `after`: numero di fallimenti consecutivi prima che venga attivato un avviso (intero positivo, min: `1`).
- `cooldownMs`: millisecondi minimi tra avvisi ripetuti per lo stesso lavoro (intero non negativo).
- `mode`: modalità di consegna — `"announce"` invia tramite un messaggio di canale; `"webhook"` pubblica sul webhook configurato.
- `accountId`: id account o canale facoltativo per definire l'ambito della consegna dell'avviso.

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

- Destinazione predefinita per le notifiche di fallimento Cron per tutti i lavori.
- `mode`: `"announce"` oppure `"webhook"`; usa come predefinito `"announce"` quando esistono dati target sufficienti.
- `channel`: override del canale per la consegna announce. `"last"` riusa l'ultimo canale di consegna noto.
- `to`: target announce esplicito oppure URL webhook. Richiesto per la modalità webhook.
- `accountId`: override account facoltativo per la consegna.
- `delivery.failureDestination` per lavoro sovrascrive questo valore predefinito globale.
- Quando non è impostata né una destinazione di fallimento globale né una per lavoro, i lavori che già consegnano tramite `announce` usano come fallback quel target announce primario in caso di fallimento.
- `delivery.failureDestination` è supportato solo per lavori `sessionTarget="isolated"` a meno che il `delivery.mode` primario del lavoro non sia `"webhook"`.

Vedi [Cron Jobs](/it/automation/cron-jobs). Le esecuzioni Cron isolate sono tracciate come [task in background](/it/automation/tasks).

---

## Variabili template del modello media

Segnaposto template espansi in `tools.media.models[].args`:

| Variabile          | Descrizione                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo del messaggio in entrata           |
| `{{RawBody}}`      | Corpo grezzo (senza wrapper cronologia/mittente)  |
| `{{BodyStripped}}` | Corpo con le menzioni di gruppo rimosse           |
| `{{From}}`         | Identificatore del mittente                       |
| `{{To}}`           | Identificatore della destinazione                 |
| `{{MessageSid}}`   | ID del messaggio del canale                       |
| `{{SessionId}}`    | UUID della sessione corrente                      |
| `{{IsNewSession}}` | `"true"` quando viene creata una nuova sessione   |
| `{{MediaUrl}}`     | Pseudo-URL dei media in entrata                   |
| `{{MediaPath}}`    | Percorso locale dei media                         |
| `{{MediaType}}`    | Tipo di media (immagine/audio/documento/…)        |
| `{{Transcript}}`   | Trascrizione audio                                |
| `{{Prompt}}`       | Prompt media risolto per le voci CLI              |
| `{{MaxChars}}`     | Numero massimo di caratteri risolto per le voci CLI |
| `{{ChatType}}`     | `"direct"` oppure `"group"`                       |
| `{{GroupSubject}}` | Oggetto del gruppo (best effort)                  |
| `{{GroupMembers}}` | Anteprima dei membri del gruppo (best effort)     |
| `{{SenderName}}`   | Nome visualizzato del mittente (best effort)      |
| `{{SenderE164}}`   | Numero di telefono del mittente (best effort)     |
| `{{Provider}}`     | Hint del provider (whatsapp, telegram, discord, ecc.) |

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

**Comportamento del merge:**

- File singolo: sostituisce l'oggetto contenitore.
- Array di file: deep-merge in ordine (i successivi sovrascrivono i precedenti).
- Chiavi sibling: unite dopo le include (sovrascrivono i valori inclusi).
- Include nidificate: fino a 10 livelli di profondità.
- Percorsi: risolti relativamente al file che include, ma devono rimanere all'interno della directory di configurazione di primo livello (`dirname` di `openclaw.json`). Le forme assolute/`../` sono consentite solo quando si risolvono comunque entro quel limite.
- Le scritture gestite da OpenClaw che modificano solo una sezione di primo livello supportata da un'include a file singolo scrivono direttamente in quel file incluso. Ad esempio, `plugins install` aggiorna `plugins: { $include: "./plugins.json5" }` in `plugins.json5` e lascia invariato `openclaw.json`.
- Le include root, gli array di include e le include con override sibling sono di sola lettura per le scritture gestite da OpenClaw; queste scritture falliscono in modo chiuso invece di appiattire la configurazione.
- Errori: messaggi chiari per file mancanti, errori di parsing e include circolari.

---

_Correlati: [Configurazione](/it/gateway/configuration) · [Esempi di configurazione](/it/gateway/configuration-examples) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Configurazione](/it/gateway/configuration)
- [Esempi di configurazione](/it/gateway/configuration-examples)
