---
read_when:
    - Aggiunta di automazione del browser controllata dall'agente
    - Debug di perché openclaw sta interferendo con il tuo Chrome
    - Implementazione delle impostazioni del browser e del ciclo di vita nell'app macOS
summary: Servizio di controllo browser integrato + comandi di azione
title: Browser (gestito da OpenClaw)
x-i18n:
    generated_at: "2026-04-20T08:31:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Browser (gestito da openclaw)

OpenClaw può eseguire un **profilo dedicato Chrome/Brave/Edge/Chromium** controllato dall'agente.
È isolato dal tuo browser personale ed è gestito tramite un piccolo servizio di
controllo locale all'interno del Gateway (solo loopback).

Vista per principianti:

- Consideralo come un **browser separato, solo per l'agente**.
- Il profilo `openclaw` **non** tocca il profilo del tuo browser personale.
- L'agente può **aprire schede, leggere pagine, fare clic e digitare** in una corsia sicura.
- Il profilo integrato `user` si collega alla tua sessione Chrome reale autenticata tramite Chrome MCP.

## Cosa ottieni

- Un profilo browser separato chiamato **openclaw** (accento arancione per impostazione predefinita).
- Controllo deterministico delle schede (elenca/apri/metti a fuoco/chiudi).
- Azioni dell'agente (clic/digitazione/trascinamento/selezione), snapshot, screenshot, PDF.
- Supporto facoltativo per più profili (`openclaw`, `work`, `remote`, ...).

Questo browser **non** è il tuo browser quotidiano. È una superficie sicura e isolata per
l'automazione e la verifica da parte dell'agente.

## Avvio rapido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se ottieni “Browser disabled”, abilitalo nella configurazione (vedi sotto) e riavvia il
Gateway.

Se `openclaw browser` manca completamente, oppure l'agente dice che lo strumento browser
non è disponibile, vai a [Comando o strumento browser mancante](/it/tools/browser#missing-browser-command-or-tool).

## Controllo del Plugin

Lo strumento `browser` predefinito è ora un Plugin integrato che viene distribuito abilitato per
impostazione predefinita. Ciò significa che puoi disabilitarlo o sostituirlo senza rimuovere il resto del
sistema di Plugin di OpenClaw:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Disabilita il Plugin integrato prima di installare un altro plugin che fornisce lo
stesso nome di strumento `browser`. L'esperienza browser predefinita richiede entrambi:

- `plugins.entries.browser.enabled` non disabilitato
- `browser.enabled=true`

Se disattivi solo il Plugin, la CLI browser integrata (`openclaw browser`),
il metodo gateway (`browser.request`), lo strumento agente e il servizio di controllo browser
predefinito scompaiono tutti insieme. La tua configurazione `browser.*` resta intatta affinché un
plugin sostitutivo possa riutilizzarla.

Il Plugin browser integrato possiede ora anche l'implementazione runtime del browser.
Il core mantiene solo helper condivisi del Plugin SDK più re-export di compatibilità per
vecchi percorsi di import interni. In pratica, rimuovere o sostituire il pacchetto plugin browser
rimuove il set di funzionalità del browser invece di lasciare dietro un secondo runtime
posseduto dal core.

Le modifiche alla configurazione del browser richiedono comunque un riavvio del Gateway affinché il Plugin integrato
possa registrare di nuovo il proprio servizio browser con le nuove impostazioni.

## Comando o strumento browser mancante

Se `openclaw browser` diventa improvvisamente un comando sconosciuto dopo un aggiornamento, oppure
l'agente segnala che lo strumento browser è mancante, la causa più comune è una
lista `plugins.allow` restrittiva che non include `browser`.

Esempio di configurazione errata:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Correggila aggiungendo `browser` alla allowlist dei plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Note importanti:

- `browser.enabled=true` da solo non basta quando è impostato `plugins.allow`.
- Anche `plugins.entries.browser.enabled=true` da solo non basta quando è impostato `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **non** carica il Plugin browser integrato. Regola solo la policy degli strumenti dopo che il plugin è già stato caricato.
- Se non hai bisogno di una allowlist dei plugin restrittiva, rimuovere `plugins.allow` ripristina anche il comportamento predefinito del browser integrato.

Sintomi tipici:

- `openclaw browser` è un comando sconosciuto.
- `browser.request` manca.
- L'agente segnala che lo strumento browser non è disponibile o è mancante.

## Profili: `openclaw` vs `user`

- `openclaw`: browser gestito e isolato (nessuna estensione richiesta).
- `user`: profilo integrato di collegamento Chrome MCP alla tua **vera sessione Chrome autenticata**.

Per le chiamate dello strumento browser da parte dell'agente:

- Predefinito: usa il browser isolato `openclaw`.
- Preferisci `profile="user"` quando contano le sessioni già autenticate e l'utente
  è al computer per fare clic/approvare eventuali prompt di collegamento.
- `profile` è l'override esplicito quando vuoi una modalità browser specifica.

Imposta `browser.defaultProfile: "openclaw"` se vuoi la modalità gestita come predefinita.

## Configurazione

Le impostazioni del browser si trovano in `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Note:

- Il servizio di controllo browser si collega al loopback su una porta derivata da `gateway.port`
  (predefinita: `18791`, cioè gateway + 2).
- Se sovrascrivi la porta del Gateway (`gateway.port` o `OPENCLAW_GATEWAY_PORT`),
  le porte browser derivate si spostano per rimanere nella stessa “famiglia”.
- `cdpUrl` usa per impostazione predefinita la porta CDP locale gestita quando non è impostato.
- `remoteCdpTimeoutMs` si applica ai controlli di raggiungibilità CDP remoti (non loopback).
- `remoteCdpHandshakeTimeoutMs` si applica ai controlli di raggiungibilità WebSocket CDP remoti.
- La navigazione/apertura scheda del browser è protetta da SSRF prima della navigazione e ricontrollata, nei limiti del possibile, sull'URL finale `http(s)` dopo la navigazione.
- In modalità SSRF rigorosa, vengono controllati anche discovery/sonde degli endpoint CDP remoti (`cdpUrl`, incluse le ricerche `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` è disabilitato per impostazione predefinita. Impostalo su `true` solo quando ti fidi intenzionalmente dell'accesso browser alla rete privata.
- `browser.ssrfPolicy.allowPrivateNetwork` resta supportato come alias legacy per compatibilità.
- `attachOnly: true` significa “non avviare mai un browser locale; collegati solo se è già in esecuzione.”
- `color` + `color` per profilo colorano l'interfaccia del browser così puoi vedere quale profilo è attivo.
- Il profilo predefinito è `openclaw` (browser standalone gestito da OpenClaw). Usa `defaultProfile: "user"` per optare per il browser utente autenticato.
- Ordine di rilevamento automatico: browser predefinito del sistema se basato su Chromium; altrimenti Chrome → Brave → Edge → Chromium → Chrome Canary.
- I profili `openclaw` locali assegnano automaticamente `cdpPort`/`cdpUrl` — impostali solo per CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP invece del CDP grezzo. Non
  impostare `cdpUrl` per quel driver.
- Imposta `browser.profiles.<name>.userDataDir` quando un profilo existing-session
  deve collegarsi a un profilo utente Chromium non predefinito come Brave o Edge.

## Usare Brave (o un altro browser basato su Chromium)

Se il tuo browser **predefinito di sistema** è basato su Chromium (Chrome/Brave/Edge/ecc),
OpenClaw lo usa automaticamente. Imposta `browser.executablePath` per sovrascrivere
il rilevamento automatico:

Esempio CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Controllo locale vs remoto

- **Controllo locale (predefinito):** il Gateway avvia il servizio di controllo loopback e può lanciare un browser locale.
- **Controllo remoto (host node):** esegui un host node sulla macchina che ha il browser; il Gateway inoltra a esso le azioni del browser.
- **CDP remoto:** imposta `browser.profiles.<name>.cdpUrl` (oppure `browser.cdpUrl`) per
  collegarti a un browser remoto basato su Chromium. In questo caso, OpenClaw non avvierà un browser locale.

Il comportamento di arresto varia in base alla modalità del profilo:

- profili locali gestiti: `openclaw browser stop` arresta il processo browser che
  OpenClaw ha avviato
- profili attach-only e CDP remoto: `openclaw browser stop` chiude la sessione di
  controllo attiva e rilascia gli override di emulazione Playwright/CDP (viewport,
  schema colori, locale, fuso orario, modalità offline e stato simile), anche
  se nessun processo browser è stato avviato da OpenClaw

Gli URL CDP remoti possono includere autenticazione:

- Token di query (ad es. `https://provider.example?token=<token>`)
- Autenticazione HTTP Basic (ad es. `https://user:pass@provider.example`)

OpenClaw preserva l'autenticazione quando chiama gli endpoint `/json/*` e quando si collega
al WebSocket CDP. Preferisci variabili d'ambiente o gestori di segreti per i
token invece di inserirli nei file di configurazione.

## Proxy browser del Node (predefinito zero-config)

Se esegui un **host node** sulla macchina che ha il tuo browser, OpenClaw può
instradare automaticamente a quel node le chiamate dello strumento browser senza configurazione browser aggiuntiva.
Questo è il percorso predefinito per i gateway remoti.

Note:

- L'host node espone il proprio server locale di controllo browser tramite un **comando proxy**.
- I profili provengono dalla configurazione `browser.profiles` del node stesso (uguale al locale).
- `nodeHost.browserProxy.allowProfiles` è facoltativo. Lascialo vuoto per il comportamento legacy/predefinito: tutti i profili configurati restano raggiungibili tramite il proxy, incluse le route di creazione/eliminazione dei profili.
- Se imposti `nodeHost.browserProxy.allowProfiles`, OpenClaw lo tratta come un confine a privilegi minimi: solo i profili in allowlist possono essere usati come target e le route di creazione/eliminazione dei profili persistenti vengono bloccate sulla superficie proxy.
- Disabilitalo se non lo vuoi:
  - Sul node: `nodeHost.browserProxy.enabled=false`
  - Sul gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto ospitato)

[Browserless](https://browserless.io) è un servizio Chromium ospitato che espone
URL di connessione CDP tramite HTTPS e WebSocket. OpenClaw può usare entrambe le forme, ma
per un profilo browser remoto l'opzione più semplice è l'URL WebSocket diretto
dalla documentazione di connessione di Browserless.

Esempio:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Note:

- Sostituisci `<BROWSERLESS_API_KEY>` con il tuo vero token Browserless.
- Scegli l'endpoint regionale che corrisponde al tuo account Browserless (vedi la loro documentazione).
- Se Browserless ti fornisce un URL base HTTPS, puoi convertirlo in
  `wss://` per una connessione CDP diretta oppure mantenere l'URL HTTPS e lasciare che OpenClaw
  scopra `/json/version`.

## Provider CDP WebSocket diretti

Alcuni servizi browser ospitati espongono un endpoint **WebSocket diretto** invece
dello standard di discovery CDP basato su HTTP (`/json/version`). OpenClaw accetta tre
forme di URL CDP e sceglie automaticamente la strategia di connessione corretta:

- **Discovery HTTP(S)** — `http://host[:port]` oppure `https://host[:port]`.
  OpenClaw chiama `/json/version` per scoprire l'URL del debugger WebSocket, quindi
  si collega. Nessun fallback WebSocket.
- **Endpoint WebSocket diretti** — `ws://host[:port]/devtools/<kind>/<id>` oppure
  `wss://...` con un percorso `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw si collega direttamente tramite un handshake WebSocket e salta
  completamente `/json/version`.
- **Radici WebSocket bare** — `ws://host[:port]` oppure `wss://host[:port]` senza
  un percorso `/devtools/...` (ad es. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw prova prima la discovery HTTP
  `/json/version` (normalizzando lo schema in `http`/`https`);
  se la discovery restituisce un `webSocketDebuggerUrl`, viene usato, altrimenti OpenClaw
  ripiega su un handshake WebSocket diretto alla radice bare. Questo copre
  sia le porte di debug remoto in stile Chrome sia i provider solo WebSocket.

`ws://host:port` / `wss://host:port` semplice senza un percorso `/devtools/...`
puntato a un'istanza Chrome locale è supportato tramite il fallback
discovery-first — Chrome accetta upgrade WebSocket solo sul percorso specifico per browser
o target restituito da `/json/version`, quindi un handshake alla sola radice bare
fallirebbe.

### Browserbase

[Browserbase](https://www.browserbase.com) è una piattaforma cloud per eseguire
browser headless con risoluzione CAPTCHA integrata, modalità stealth e proxy
residenziali.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Note:

- [Registrati](https://www.browserbase.com/sign-up) e copia la tua **API Key**
  dalla [dashboard Overview](https://www.browserbase.com/overview).
- Sostituisci `<BROWSERBASE_API_KEY>` con la tua vera chiave API Browserbase.
- Browserbase crea automaticamente una sessione browser alla connessione WebSocket, quindi
  non è necessario alcun passaggio manuale di creazione della sessione.
- Il piano gratuito consente una sessione concorrente e un'ora browser al mese.
  Vedi i [prezzi](https://www.browserbase.com/pricing) per i limiti dei piani a pagamento.
- Consulta la [documentazione Browserbase](https://docs.browserbase.com) per il riferimento API
  completo, le guide SDK e gli esempi di integrazione.

## Sicurezza

Concetti chiave:

- Il controllo del browser è solo loopback; l'accesso passa tramite l'autenticazione del Gateway o l'associazione del node.
- L'API HTTP browser standalone in loopback usa **solo autenticazione con segreto condiviso**:
  auth bearer con token gateway, `x-openclaw-password` oppure autenticazione HTTP Basic con la
  password gateway configurata.
- Gli header di identità Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **non**
  autenticano questa API browser standalone in loopback.
- Se il controllo browser è abilitato e non è configurata alcuna autenticazione con segreto condiviso, OpenClaw
  genera automaticamente `gateway.auth.token` all'avvio e lo rende persistente nella configurazione.
- OpenClaw **non** genera automaticamente quel token quando `gateway.auth.mode` è già
  `password`, `none` oppure `trusted-proxy`.
- Mantieni il Gateway e qualsiasi host node su una rete privata (Tailscale); evita l'esposizione pubblica.
- Tratta gli URL/token CDP remoti come segreti; preferisci variabili d'ambiente o un gestore di segreti.

Suggerimenti per CDP remoto:

- Preferisci endpoint cifrati (HTTPS o WSS) e token di breve durata quando possibile.
- Evita di incorporare direttamente token di lunga durata nei file di configurazione.

## Profili (browser multipli)

OpenClaw supporta più profili con nome (configurazioni di routing). I profili possono essere:

- **gestiti da openclaw**: un'istanza browser dedicata basata su Chromium con la propria directory dati utente + porta CDP
- **remoto**: un URL CDP esplicito (browser basato su Chromium in esecuzione altrove)
- **sessione esistente**: il tuo profilo Chrome esistente tramite collegamento automatico Chrome DevTools MCP

Valori predefiniti:

- Il profilo `openclaw` viene creato automaticamente se manca.
- Il profilo `user` è integrato per il collegamento existing-session di Chrome MCP.
- I profili existing-session sono opt-in oltre a `user`; creali con `--driver existing-session`.
- Le porte CDP locali vengono allocate da **18800–18899** per impostazione predefinita.
- L'eliminazione di un profilo sposta la sua directory dati locale nel Cestino.

Tutti gli endpoint di controllo accettano `?profile=<name>`; la CLI usa `--browser-profile`.

## Existing-session tramite Chrome DevTools MCP

OpenClaw può anche collegarsi a un profilo browser già in esecuzione basato su Chromium tramite
il server ufficiale Chrome DevTools MCP. Questo riutilizza le schede e lo stato di accesso
già aperti in quel profilo browser.

Riferimenti ufficiali per contesto e configurazione:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profilo integrato:

- `user`

Facoltativo: crea un tuo profilo existing-session personalizzato se vuoi un
nome, colore o directory dati browser diversi.

Comportamento predefinito:

- Il profilo integrato `user` usa il collegamento automatico Chrome MCP, che punta al
  profilo locale predefinito di Google Chrome.

Usa `userDataDir` per Brave, Edge, Chromium o un profilo Chrome non predefinito:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Quindi, nel browser corrispondente:

1. Apri la pagina inspect di quel browser per il debug remoto.
2. Abilita il debug remoto.
3. Mantieni il browser in esecuzione e approva il prompt di connessione quando OpenClaw si collega.

Pagine inspect comuni:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Smoke test di collegamento live:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Aspetto di un esito positivo:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` elenca le schede browser già aperte
- `snapshot` restituisce ref dalla scheda live selezionata

Cosa controllare se il collegamento non funziona:

- il browser di destinazione basato su Chromium è alla versione `144+`
- il debug remoto è abilitato nella pagina inspect di quel browser
- il browser ha mostrato il prompt di consenso al collegamento e lo hai accettato
- `openclaw doctor` migra la vecchia configurazione browser basata su estensione e controlla che
  Chrome sia installato localmente per i profili predefiniti con collegamento automatico, ma non può
  abilitare per te il debug remoto lato browser

Uso da parte dell'agente:

- Usa `profile="user"` quando ti serve lo stato del browser autenticato dell'utente.
- Se usi un profilo existing-session personalizzato, passa quel nome profilo esplicito.
- Scegli questa modalità solo quando l'utente è al computer per approvare il
  prompt di collegamento.
- il Gateway o l'host node possono avviare `npx chrome-devtools-mcp@latest --autoConnect`

Note:

- Questo percorso è più rischioso del profilo isolato `openclaw` perché può
  agire all'interno della tua sessione browser autenticata.
- OpenClaw non avvia il browser per questo driver; si collega solo a una
  sessione esistente.
- OpenClaw usa qui il flusso ufficiale Chrome DevTools MCP `--autoConnect`. Se
  `userDataDir` è impostato, OpenClaw lo inoltra per puntare a quella esplicita
  directory dati utente Chromium.
- Gli screenshot existing-session supportano acquisizioni di pagina e acquisizioni di elementi `--ref`
  da snapshot, ma non i selettori CSS `--element`.
- Gli screenshot di pagina existing-session funzionano senza Playwright tramite Chrome MCP.
  Anche gli screenshot di elementi basati su ref (`--ref`) funzionano lì, ma `--full-page`
  non può essere combinato con `--ref` o `--element`.
- Le azioni existing-session sono ancora più limitate rispetto al percorso del browser
  gestito:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` richiedono
    ref di snapshot invece di selettori CSS
  - `click` è solo con pulsante sinistro (nessuna sovrascrittura del pulsante o modificatori)
  - `type` non supporta `slowly=true`; usa `fill` o `press`
  - `press` non supporta `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` ed `evaluate` non
    supportano override di timeout per singola chiamata
  - `select` attualmente supporta solo un singolo valore
- Existing-session `wait --url` supporta pattern esatti, per sottostringa e glob
  come gli altri driver browser. `wait --load networkidle` non è ancora supportato.
- Gli hook di upload existing-session richiedono `ref` o `inputRef`, supportano un file
  alla volta e non supportano il targeting CSS `element`.
- Gli hook di dialog existing-session non supportano override di timeout.
- Alcune funzionalità richiedono ancora il percorso del browser gestito, inclusi
  azioni batch, esportazione PDF, intercettazione dei download e `responsebody`.
- Existing-session può collegarsi sull'host selezionato o tramite un browser node
  connesso. Se Chrome si trova altrove e non è connesso alcun browser node, usa
  CDP remoto o un host node.

## Garanzie di isolamento

- **Directory dati utente dedicata**: non tocca mai il profilo del tuo browser personale.
- **Porte dedicate**: evita `9222` per prevenire collisioni con i workflow di sviluppo.
- **Controllo deterministico delle schede**: usa come target le schede tramite `targetId`, non “ultima scheda”.

## Selezione del browser

Quando viene avviato localmente, OpenClaw sceglie il primo disponibile:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Puoi sovrascrivere con `browser.executablePath`.

Piattaforme:

- macOS: controlla `/Applications` e `~/Applications`.
- Linux: cerca `google-chrome`, `brave`, `microsoft-edge`, `chromium`, ecc.
- Windows: controlla le posizioni di installazione comuni.

## API di controllo (facoltativa)

Solo per integrazioni locali, il Gateway espone una piccola API HTTP loopback:

- Stato/avvio/arresto: `GET /`, `POST /start`, `POST /stop`
- Schede: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Azioni: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rete: `POST /response/body`
- Stato: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stato: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Impostazioni: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tutti gli endpoint accettano `?profile=<name>`.

Se è configurata l'autenticazione gateway con segreto condiviso, anche le route HTTP del browser richiedono autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure autenticazione HTTP Basic con quella password

Note:

- Questa API browser standalone in loopback **non** usa trusted-proxy né
  gli header di identità Tailscale Serve.
- Se `gateway.auth.mode` è `none` oppure `trusted-proxy`, queste route browser loopback
  non ereditano quelle modalità basate sull'identità; mantienile solo loopback.

### Contratto di errore `/act`

`POST /act` usa una risposta di errore strutturata per validazione a livello di route e
fallimenti di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` attuali:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` è mancante o non riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): il payload dell'azione non ha superato normalizzazione o validazione.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (oppure `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` di primo livello o batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per i profili existing-session.

Altri errori di runtime possono comunque restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (`navigate`/`act`/snapshot AI/role snapshot, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, quegli endpoint restituiscono
un chiaro errore 501.

Cosa funziona ancora senza Playwright:

- snapshot ARIA
- screenshot di pagina per il browser `openclaw` gestito quando è disponibile un
  WebSocket CDP per scheda
- screenshot di pagina per i profili `existing-session` / Chrome MCP
- screenshot `existing-session` basati su ref (`--ref`) dall'output di snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- snapshot AI / role snapshot
- screenshot di elementi con selettori CSS (`--element`)
- esportazione PDF completa del browser

Gli screenshot di elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, installa il pacchetto completo
Playwright (non `playwright-core`) e riavvia il gateway, oppure reinstalla
OpenClaw con supporto browser.

#### Installazione Docker di Playwright

Se il tuo Gateway è eseguito in Docker, evita `npx playwright` (conflitti con gli override npm).
Usa invece la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (ad esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistente tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. Vedi [Docker](/it/install/docker).

## Come funziona (interno)

Flusso di alto livello:

- Un piccolo **server di controllo** accetta richieste HTTP.
- Si collega a browser basati su Chromium (Chrome/Brave/Edge/Chromium) tramite **CDP**.
- Per azioni avanzate (clic/digitazione/snapshot/PDF), usa **Playwright** sopra
  CDP.
- Quando Playwright manca, sono disponibili solo operazioni che non usano Playwright.

Questo design mantiene l'agente su un'interfaccia stabile e deterministica, lasciandoti al contempo
la possibilità di sostituire browser e profili locali/remoti.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per puntare a un profilo specifico.
Tutti i comandi accettano anche `--json` per output leggibile da macchina (payload stabili).

Base:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Ispezione:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Nota sul ciclo di vita:

- Per i profili attach-only e CDP remoto, `openclaw browser stop` resta comunque il
  comando di pulizia corretto dopo i test. Chiude la sessione di controllo attiva e
  cancella gli override temporanei di emulazione invece di terminare il browser
  sottostante.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Azioni:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Stato:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Note:

- `upload` e `dialog` sono chiamate di **arming**; eseguirle prima del clic/tasto
  che attiva il chooser/dialog.
- I percorsi di output di download e trace sono vincolati alle radici temp di OpenClaw:
  - trace: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - download: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- I percorsi di upload sono vincolati a una radice temp upload di OpenClaw:
  - upload: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` può anche impostare direttamente input file tramite `--input-ref` oppure `--element`.
- `snapshot`:
  - `--format ai` (predefinito quando Playwright è installato): restituisce uno snapshot AI con ref numerici (`aria-ref="<n>"`).
  - `--format aria`: restituisce l'albero di accessibilità (senza ref; solo ispezione).
  - `--efficient` (oppure `--mode efficient`): preset compatto di role snapshot (interactive + compact + depth + maxChars più basso).
  - Configurazione predefinita (solo tool/CLI): imposta `browser.snapshotDefaults.mode: "efficient"` per usare snapshot efficient quando il chiamante non passa una modalità (vedi [Configurazione del Gateway](/it/gateway/configuration-reference#browser)).
  - Le opzioni di role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forzano uno snapshot basato su ruoli con ref come `ref=e12`.
  - `--frame "<iframe selector>"` limita i role snapshot a un iframe (si abbina a ref di ruolo come `e12`).
  - `--interactive` produce un elenco piatto e facile da selezionare degli elementi interattivi (ideale per guidare le azioni).
  - `--labels` aggiunge uno screenshot della viewport con etichette ref sovrapposte (stampa `MEDIA:<path>`).
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (sia numerico `12` sia ref di ruolo `e12`).
  I selettori CSS intenzionalmente non sono supportati per le azioni.

## Snapshot e ref

OpenClaw supporta due stili di “snapshot”:

- **Snapshot AI (ref numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include ref numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il ref viene risolto tramite `aria-ref` di Playwright.

- **Role snapshot (ref di ruolo come `e12`)**: `openclaw browser snapshot --interactive` (oppure `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato su ruoli con `[ref=e12]` (e facoltativamente `[nth=1]`).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il ref viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot della viewport con etichette `e12` sovrapposte.

Comportamento dei ref:

- I ref **non sono stabili tra una navigazione e l'altra**; se qualcosa fallisce, riesegui `snapshot` e usa un ref aggiornato.
- Se il role snapshot è stato acquisito con `--frame`, i ref di ruolo sono limitati a quell'iframe fino al role snapshot successivo.

## Potenziamenti di wait

Puoi aspettare più di semplice tempo/testo:

- Attendere un URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attendere uno stato di caricamento:
  - `openclaw browser wait --load networkidle`
- Attendere un predicato JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Attendere che un selettore diventi visibile:
  - `openclaw browser wait "#main"`

Questi possono essere combinati:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Workflow di debug

Quando un'azione fallisce (ad es. “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci ref di ruolo in modalità interactive)
3. Se fallisce ancora: `openclaw browser highlight <ref>` per vedere cosa sta puntando Playwright
4. Se la pagina si comporta in modo strano:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una trace:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` è per scripting e tooling strutturato.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

I role snapshot in JSON includono `refs` più un piccolo blocco `stats` (righe/caratteri/ref/interattivi) così gli strumenti possono ragionare su dimensione e densità del payload.

## Controlli di stato e ambiente

Questi sono utili per workflow del tipo “fai comportare il sito come X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (la forma legacy `set headers --json '{"X-Debug":"1"}'` resta supportata)
- Auth HTTP Basic: `set credentials user pass` (oppure `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (oppure `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / locale: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preset dispositivi Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser openclaw può contenere sessioni autenticate; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. Il prompt injection può orientare
  questo comportamento. Disabilitalo con `browser.evaluateEnabled=false` se non ti serve.
- Per note su login e anti-bot (X/Twitter, ecc.), vedi [Login browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privato il Gateway/node host (solo loopback o tailnet).
- Gli endpoint CDP remoti sono potenti; instradali in tunnel e proteggili.

Esempio di modalità rigorosa (blocca per impostazione predefinita destinazioni private/interne):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Risoluzione dei problemi

Per problemi specifici di Linux (soprattutto snap Chromium), vedi
[Risoluzione dei problemi del browser](/it/tools/browser-linux-troubleshooting).

Per configurazioni split-host con Gateway WSL2 + Chrome Windows, vedi
[Risoluzione dei problemi WSL2 + Windows + CDP Chrome remoto](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Errore di avvio CDP vs blocco SSRF di navigazione

Queste sono classi di errore diverse e indicano percorsi di codice diversi.

- **Errore di avvio o readiness CDP** significa che OpenClaw non riesce a confermare che il control plane del browser sia integro.
- **Blocco SSRF di navigazione** significa che il control plane del browser è integro, ma una destinazione di navigazione di pagina viene rifiutata dalla policy.

Esempi comuni:

- Errore di avvio o readiness CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blocco SSRF di navigazione:
  - i flussi `open`, `navigate`, snapshot o apertura di schede falliscono con un errore di policy browser/rete mentre `start` e `tabs` continuano a funzionare

Usa questa sequenza minima per distinguere i due casi:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Come interpretare i risultati:

- Se `start` fallisce con `not reachable after start`, risolvi prima i problemi di readiness CDP.
- Se `start` riesce ma `tabs` fallisce, il control plane non è ancora integro. Trattalo come un problema di raggiungibilità CDP, non come un problema di navigazione della pagina.
- Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il control plane del browser è attivo e il problema è nella policy di navigazione o nella pagina di destinazione.
- Se `start`, `tabs` e `open` riescono tutti, il percorso di controllo di base del browser gestito è integro.

Dettagli importanti del comportamento:

- La configurazione del browser usa per impostazione predefinita un oggetto di policy SSRF fail-closed anche quando non configuri `browser.ssrfPolicy`.
- Per il profilo gestito locale `openclaw` in loopback, i controlli di integrità CDP saltano intenzionalmente l'applicazione della raggiungibilità SSRF del browser per il control plane locale di OpenClaw stesso.
- La protezione della navigazione è separata. Un risultato positivo di `start` o `tabs` non significa che una destinazione successiva di `open` o `navigate` sia consentita.

Linee guida di sicurezza:

- **Non** allentare la policy SSRF del browser per impostazione predefinita.
- Preferisci eccezioni host ristrette come `hostnameAllowlist` o `allowedHostnames` rispetto a un ampio accesso alla rete privata.
- Usa `dangerouslyAllowPrivateNetwork: true` solo in ambienti intenzionalmente affidabili in cui l'accesso del browser alla rete privata è richiesto e revisionato.

Esempio: navigazione bloccata, control plane integro

- `start` riesce
- `tabs` riesce
- `open http://internal.example` fallisce

Di solito significa che l'avvio del browser è corretto e la destinazione di navigazione richiede una revisione della policy.

Esempio: avvio bloccato prima che la navigazione conti

- `start` fallisce con `not reachable after start`
- `tabs` fallisce anch'esso o non può essere eseguito

Questo indica un problema di avvio del browser o di raggiungibilità CDP, non un problema di allowlist degli URL di pagina.

## Strumenti dell'agente + come funziona il controllo

L'agente riceve **uno strumento** per l'automazione del browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mappatura:

- `browser snapshot` restituisce un albero UI stabile (AI o ARIA).
- `browser act` usa gli ID `ref` dello snapshot per fare clic/digitare/trascinare/selezionare.
- `browser screenshot` cattura i pixel (pagina intera o elemento).
- `browser` accetta:
  - `profile` per scegliere un profilo browser con nome (openclaw, chrome o CDP remoto).
  - `target` (`sandbox` | `host` | `node`) per selezionare dove si trova il browser.
  - Nelle sessioni sandboxed, `target: "host"` richiede `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` viene omesso: le sessioni sandboxed usano per impostazione predefinita `sandbox`, le sessioni non sandbox usano per impostazione predefinita `host`.
  - Se è connesso un node con capacità browser, lo strumento può instradarsi automaticamente verso di esso a meno che tu non fissi `target="host"` o `target="node"`.

Questo mantiene l'agente deterministico ed evita selettori fragili.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [Sandboxing](/it/gateway/sandboxing) — controllo del browser in ambienti sandboxed
- [Sicurezza](/it/gateway/security) — rischi del controllo browser e misure di hardening
