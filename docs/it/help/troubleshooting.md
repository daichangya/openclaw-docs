---
read_when:
    - OpenClaw non funziona e hai bisogno del percorso più rapido per una soluzione
    - Vuoi un flusso di triage prima di entrare nei runbook di approfondimento
summary: Hub di risoluzione dei problemi orientato ai sintomi per OpenClaw
title: Risoluzione generale dei problemi
x-i18n:
    generated_at: "2026-04-20T08:31:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc5d8c9f804084985c672c5a003ce866e8142ab99fe81abb7a0d38e22aea4b88
    source_path: help/troubleshooting.md
    workflow: 15
---

# Risoluzione dei problemi

Se hai solo 2 minuti, usa questa pagina come punto di ingresso per il triage.

## Primi 60 secondi

Esegui questa sequenza esatta nell'ordine indicato:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Output corretto in una riga:

- `openclaw status` → mostra i canali configurati e nessun errore auth evidente.
- `openclaw status --all` → il report completo è presente e condivisibile.
- `openclaw gateway probe` → il target Gateway previsto è raggiungibile (`Reachable: yes`). `Capability: ...` indica quale livello di auth il probe ha potuto dimostrare, e `Read probe: limited - missing scope: operator.read` indica una diagnostica degradata, non un errore di connessione.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` e una riga `Capability: ...` plausibile. Usa `--require-rpc` se ti serve anche la prova RPC con ambito di lettura.
- `openclaw doctor` → nessun errore bloccante di configurazione/servizio.
- `openclaw channels status --probe` → con un gateway raggiungibile restituisce
  stato live del trasporto per account più risultati di probe/audit come `works` o `audit ok`; se il
  gateway non è raggiungibile, il comando ripiega su riepiloghi basati solo sulla configurazione.
- `openclaw logs --follow` → attività costante, nessun errore fatale ripetuto.

## Anthropic long context 429

Se vedi:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
vai a [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Il backend locale compatibile con OpenAI funziona direttamente ma fallisce in OpenClaw

Se il tuo backend locale o self-hosted `/v1` risponde a piccoli probe diretti
`/v1/chat/completions` ma fallisce su `openclaw infer model run` o nei normali
turni agente:

1. Se l'errore menziona `messages[].content` che si aspetta una stringa, imposta
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Se il backend continua a fallire solo nei turni agente di OpenClaw, imposta
   `models.providers.<provider>.models[].compat.supportsTools: false` e riprova.
3. Se le chiamate dirette minime continuano a funzionare ma i prompt OpenClaw più grandi mandano in crash il
   backend, tratta il problema rimanente come una limitazione del modello/server upstream e
   continua nel runbook di approfondimento:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/it/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## L'installazione del Plugin fallisce con estensioni openclaw mancanti

Se l'installazione fallisce con `package.json missing openclaw.extensions`, il pacchetto Plugin
usa una struttura vecchia che OpenClaw non accetta più.

Correzione nel pacchetto Plugin:

1. Aggiungi `openclaw.extensions` a `package.json`.
2. Punta gli entry ai file runtime compilati (di solito `./dist/index.js`).
3. Ripubblica il Plugin ed esegui di nuovo `openclaw plugins install <package>`.

Esempio:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Riferimento: [Architettura dei Plugin](/it/plugins/architecture)

## Albero decisionale

```mermaid
flowchart TD
  A[OpenClaw non funziona] --> B{Cosa si rompe per primo}
  B --> C[Nessuna risposta]
  B --> D[Dashboard o Control UI non si connettono]
  B --> E[Il Gateway non si avvia o il servizio non è in esecuzione]
  B --> F[Il canale si connette ma i messaggi non scorrono]
  B --> G[Cron o Heartbeat non è stato eseguito o non ha consegnato]
  B --> H[Il Node è associato ma lo strumento camera canvas screen exec fallisce]
  B --> I[Lo strumento browser fallisce]

  C --> C1[/Sezione Nessuna risposta/]
  D --> D1[/Sezione Control UI/]
  E --> E1[/Sezione Gateway/]
  F --> F1[/Sezione Flusso canale/]
  G --> G1[/Sezione Automazione/]
  H --> H1[/Sezione Strumenti Node/]
  I --> I1[/Sezione Browser/]
```

<AccordionGroup>
  <Accordion title="Nessuna risposta">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Un output corretto si presenta così:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - Il tuo canale mostra il trasporto connesso e, dove supportato, `works` o `audit ok` in `channels status --probe`
    - Il mittente risulta approvato (oppure la policy DM è open/allowlist)

    Firme comuni nei log:

    - `drop guild message (mention required` → il gating per menzione ha bloccato il messaggio in Discord.
    - `pairing request` → il mittente non è approvato ed è in attesa di approvazione per l'associazione DM.
    - `blocked` / `allowlist` nei log del canale → mittente, stanza o gruppo è filtrato.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#no-replies](/it/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/it/channels/troubleshooting)
    - [/channels/pairing](/it/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard o Control UI non si connettono">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un output corretto si presenta così:

    - `Dashboard: http://...` è mostrato in `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`
    - Nessun loop auth nei log

    Firme comuni nei log:

    - `device identity required` → HTTP/contesto non sicuro non può completare l'auth del dispositivo.
    - `origin not allowed` → l'`Origin` del browser non è consentito per il target Gateway della Control UI
    - `AUTH_TOKEN_MISMATCH` con suggerimenti di retry (`canRetryWithDeviceToken=true`) → un retry automatico con device token fidato può avvenire una volta.
    - Quel retry con token in cache riusa l'insieme di scope in cache memorizzato con il
      device token associato. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono invece il loro insieme di scope richiesto.
    - Nel percorso asincrono Tailscale Serve Control UI, i tentativi falliti per lo stesso
      `{scope, ip}` vengono serializzati prima che il limiter registri l'errore, quindi un
      secondo retry errato concorrente può già mostrare `retry later`.
    - `too many failed authentication attempts (retry later)` da un'origine browser localhost → gli errori ripetuti dalla stessa `Origin` vengono temporaneamente
      bloccati; un'altra origine localhost usa un bucket separato.
    - `repeated unauthorized` dopo quel retry → token/password errati, modalità auth non corrispondente o device token associato non aggiornato.
    - `gateway connect failed:` → la UI punta a URL/porta sbagliati o a un gateway irraggiungibile.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/it/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/it/gateway/authentication)

  </Accordion>

  <Accordion title="Il Gateway non si avvia o il servizio è installato ma non è in esecuzione">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un output corretto si presenta così:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` o `admin-capable`

    Firme comuni nei log:

    - `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → la modalità gateway è remote, oppure nel file di configurazione manca il marker local-mode e deve essere riparato.
    - `refusing to bind gateway ... without auth` → bind non-loopback senza un percorso auth gateway valido (token/password, oppure trusted-proxy dove configurato).
    - `another gateway instance is already listening` o `EADDRINUSE` → porta già occupata.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#gateway-service-not-running](/it/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/it/gateway/background-process)
    - [/gateway/configuration](/it/gateway/configuration)

  </Accordion>

  <Accordion title="Il canale si connette ma i messaggi non scorrono">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Un output corretto si presenta così:

    - Il trasporto del canale è connesso.
    - I controlli pairing/allowlist passano.
    - Le menzioni vengono rilevate dove richiesto.

    Firme comuni nei log:

    - `mention required` → il gating della menzione nel gruppo ha bloccato l'elaborazione.
    - `pairing` / `pending` → il mittente DM non è ancora approvato.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → problema di token o permessi del canale.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/it/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/it/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron o Heartbeat non è stato eseguito o non ha consegnato">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Un output corretto si presenta così:

    - `cron.status` mostra abilitato con un prossimo risveglio.
    - `cron runs` mostra recenti voci `ok`.
    - Heartbeat è abilitato e non è fuori dalle ore attive.

    Firme comuni nei log:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron è disabilitato.
    - `heartbeat skipped` con `reason=quiet-hours` → fuori dalle ore attive configurate.
    - `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` esiste ma contiene solo struttura vuota o solo intestazioni.
    - `heartbeat skipped` con `reason=no-tasks-due` → la modalità attività di `HEARTBEAT.md` è attiva ma nessun intervallo delle attività è ancora scaduto.
    - `heartbeat skipped` con `reason=alerts-disabled` → tutta la visibilità Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati).
    - `requests-in-flight` → corsia principale occupata; il risveglio Heartbeat è stato rinviato.
    - `unknown accountId` → il target di consegna Heartbeat non esiste.

    Pagine di approfondimento:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/it/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/it/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/it/gateway/heartbeat)

    </Accordion>

    <Accordion title="Il Node è associato ma lo strumento fallisce camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Un output corretto si presenta così:

      - Il Node è elencato come connesso e associato per il ruolo `node`.
      - La capability esiste per il comando che stai invocando.
      - Lo stato dei permessi è concesso per lo strumento.

      Firme comuni nei log:

      - `NODE_BACKGROUND_UNAVAILABLE` → porta l'app Node in primo piano.
      - `*_PERMISSION_REQUIRED` → il permesso del sistema operativo è stato negato o manca.
      - `SYSTEM_RUN_DENIED: approval required` → l'approvazione exec è in attesa.
      - `SYSTEM_RUN_DENIED: allowlist miss` → il comando non è nella allowlist exec.

      Pagine di approfondimento:

      - [/gateway/troubleshooting#node-paired-tool-fails](/it/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/it/nodes/troubleshooting)
      - [/tools/exec-approvals](/it/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec improvvisamente richiede approvazione">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Cosa è cambiato:

      - Se `tools.exec.host` non è impostato, il valore predefinito è `auto`.
      - `host=auto` viene risolto in `sandbox` quando è attivo un runtime sandbox, altrimenti in `gateway`.
      - `host=auto` riguarda solo il routing; il comportamento "YOLO" senza prompt deriva da `security=full` più `ask=off` su gateway/node.
      - Su `gateway` e `node`, `tools.exec.security` non impostato ha come predefinito `full`.
      - `tools.exec.ask` non impostato ha come predefinito `off`.
      - Risultato: se stai vedendo richieste di approvazione, qualche policy locale dell'host o per sessione ha irrigidito exec rispetto ai valori predefiniti attuali.

      Ripristina l'attuale comportamento predefinito senza approvazione:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Alternative più sicure:

      - Imposta solo `tools.exec.host=gateway` se vuoi soltanto un routing host stabile.
      - Usa `security=allowlist` con `ask=on-miss` se vuoi exec sull'host ma desideri comunque una revisione per le mancate corrispondenze nella allowlist.
      - Abilita la modalità sandbox se vuoi che `host=auto` venga risolto di nuovo in `sandbox`.

      Firme comuni nei log:

      - `Approval required.` → il comando è in attesa di `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → l'approvazione exec su host-node è in attesa.
      - `exec host=sandbox requires a sandbox runtime for this session` → selezione sandbox implicita/esplicita ma modalità sandbox disattivata.

      Pagine di approfondimento:

      - [/tools/exec](/it/tools/exec)
      - [/tools/exec-approvals](/it/tools/exec-approvals)
      - [/gateway/security#what-the-audit-checks-high-level](/it/gateway/security#what-the-audit-checks-high-level)

    </Accordion>

    <Accordion title="Lo strumento browser fallisce">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Un output corretto si presenta così:

      - Lo stato del browser mostra `running: true` e un browser/profilo selezionato.
      - `openclaw` si avvia, oppure `user` può vedere le schede Chrome locali.

      Firme comuni nei log:

      - `unknown command "browser"` o `unknown command 'browser'` → `plugins.allow` è impostato e non include `browser`.
      - `Failed to start Chrome CDP on port` → l'avvio del browser locale non è riuscito.
      - `browser.executablePath not found` → il percorso del binario configurato è errato.
      - `browser.cdpUrl must be http(s) or ws(s)` → l'URL CDP configurato usa uno schema non supportato.
      - `browser.cdpUrl has invalid port` → l'URL CDP configurato ha una porta non valida o fuori intervallo.
      - `No Chrome tabs found for profile="user"` → il profilo attach di Chrome MCP non ha schede Chrome locali aperte.
      - `Remote CDP for profile "<name>" is not reachable` → l'endpoint CDP remoto configurato non è raggiungibile da questo host.
      - `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → il profilo solo-attach non ha alcun target CDP live.
      - override obsoleti di viewport / dark-mode / locale / offline su profili solo-attach o CDP remoto → esegui `openclaw browser stop --browser-profile <name>` per chiudere la sessione di controllo attiva e rilasciare lo stato di emulazione senza riavviare il gateway.

      Pagine di approfondimento:

      - [/gateway/troubleshooting#browser-tool-fails](/it/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/it/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/it/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — domande frequenti
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting) — problemi specifici del Gateway
- [Doctor](/it/gateway/doctor) — controlli di salute automatizzati e riparazioni
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting) — problemi di connettività dei canali
- [Risoluzione dei problemi dell'automazione](/it/automation/cron-jobs#troubleshooting) — problemi di Cron e Heartbeat
