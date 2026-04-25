---
read_when:
    - Hai bisogno del comportamento dettagliato di `openclaw onboard`
    - Stai eseguendo il debug dei risultati di onboarding o integrando client di onboarding
sidebarTitle: CLI reference
summary: Riferimento completo per il flusso di configurazione della CLI, la configurazione di autenticazione/modello, gli output e gli aspetti interni
title: Riferimento alla configurazione della CLI
x-i18n:
    generated_at: "2026-04-25T13:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Questa pagina è il riferimento completo per `openclaw onboard`.
Per la guida breve, vedi [Onboarding (CLI)](/it/start/wizard).

## Cosa fa la procedura guidata

La modalità locale (predefinita) ti guida attraverso:

- Configurazione di modello e autenticazione (OAuth della sottoscrizione OpenAI Code, Claude CLI o chiave API Anthropic, oltre a opzioni MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Posizione dello spazio di lavoro e file bootstrap
- Impostazioni del Gateway (porta, bind, auth, tailscale)
- Canali e provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e altri Plugin di canale inclusi)
- Installazione del demone (LaunchAgent, unità utente systemd o Scheduled Task nativa di Windows con fallback nella cartella Startup)
- Controllo stato
- Configurazione delle Skills

La modalità remota configura questa macchina per connettersi a un gateway altrove.
Non installa né modifica nulla sull'host remoto.

## Dettagli del flusso locale

<Steps>
  <Step title="Rilevamento della configurazione esistente">
    - Se `~/.openclaw/openclaw.json` esiste, scegli Mantieni, Modifica o Reimposta.
    - Rieseguire la procedura guidata non cancella nulla a meno che tu non scelga esplicitamente Reimposta (oppure passi `--reset`).
    - La CLI con `--reset` usa come predefinito `config+creds+sessions`; usa `--reset-scope full` per rimuovere anche lo spazio di lavoro.
    - Se la configurazione non è valida o contiene chiavi legacy, la procedura guidata si ferma e ti chiede di eseguire `openclaw doctor` prima di continuare.
    - Il reset usa `trash` e offre questi ambiti:
      - Solo configurazione
      - Configurazione + credenziali + sessioni
      - Reset completo (rimuove anche lo spazio di lavoro)
  </Step>
  <Step title="Modello e autenticazione">
    - La matrice completa delle opzioni è in [Opzioni di autenticazione e modello](#auth-and-model-options).
  </Step>
  <Step title="Spazio di lavoro">
    - Predefinito `~/.openclaw/workspace` (configurabile).
    - Inizializza i file dello spazio di lavoro necessari per il rituale bootstrap del primo avvio.
    - Layout dello spazio di lavoro: [Agent workspace](/it/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Chiede porta, bind, modalità di autenticazione ed esposizione tailscale.
    - Consigliato: mantieni abilitata l'autenticazione con token anche su loopback così i client WS locali devono autenticarsi.
    - In modalità token, la configurazione interattiva offre:
      - **Genera/memorizza token in chiaro** (predefinito)
      - **Usa SecretRef** (opt-in)
    - In modalità password, la configurazione interattiva supporta anch'essa archiviazione in chiaro o SecretRef.
    - Percorso SecretRef non interattivo per il token: `--gateway-token-ref-env <ENV_VAR>`.
      - Richiede una variabile env non vuota nell'ambiente del processo di onboarding.
      - Non può essere combinato con `--gateway-token`.
    - Disabilita l'autenticazione solo se ti fidi completamente di ogni processo locale.
    - I bind non-loopback richiedono comunque autenticazione.
  </Step>
  <Step title="Canali">
    - [WhatsApp](/it/channels/whatsapp): login QR facoltativo
    - [Telegram](/it/channels/telegram): token bot
    - [Discord](/it/channels/discord): token bot
    - [Google Chat](/it/channels/googlechat): JSON service account + audience Webhook
    - [Mattermost](/it/channels/mattermost): token bot + base URL
    - [Signal](/it/channels/signal): installazione facoltativa di `signal-cli` + configurazione account
    - [BlueBubbles](/it/channels/bluebubbles): consigliato per iMessage; URL server + password + Webhook
    - [iMessage](/it/channels/imessage): percorso CLI legacy `imsg` + accesso DB
    - Sicurezza DM: il predefinito è pairing. Il primo DM invia un codice; approvalo con
      `openclaw pairing approve <channel> <code>` oppure usa allowlist.
  </Step>
  <Step title="Installazione del demone">
    - macOS: LaunchAgent
      - Richiede una sessione utente con login effettuato; per ambienti headless usa un LaunchDaemon personalizzato (non incluso).
    - Linux e Windows via WSL2: unità utente systemd
      - La procedura guidata tenta `loginctl enable-linger <user>` così il gateway resta attivo dopo il logout.
      - Potrebbe richiedere sudo (scrive in `/var/lib/systemd/linger`); prima ci prova senza sudo.
    - Windows nativo: prima Scheduled Task
      - Se la creazione del task viene negata, OpenClaw usa come fallback un elemento di accesso per utente nella cartella Startup e avvia subito il gateway.
      - Le Scheduled Task restano preferibili perché forniscono uno stato del supervisore migliore.
    - Scelta del runtime: Node (consigliato; richiesto per WhatsApp e Telegram). Bun non è consigliato.
  </Step>
  <Step title="Controllo stato">
    - Avvia il gateway (se necessario) ed esegue `openclaw health`.
    - `openclaw status --deep` aggiunge all'output di stato il probe di salute live del gateway, inclusi i probe dei canali quando supportati.
  </Step>
  <Step title="Skills">
    - Legge le Skills disponibili e controlla i requisiti.
    - Ti permette di scegliere il gestore dei node: npm, pnpm o bun.
    - Installa dipendenze facoltative (alcune usano Homebrew su macOS).
  </Step>
  <Step title="Fine">
    - Riepilogo e passaggi successivi, incluse opzioni per app iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se non viene rilevata alcuna GUI, la procedura guidata stampa istruzioni di port-forward SSH per la Control UI invece di aprire un browser.
Se mancano gli asset della Control UI, la procedura guidata tenta di compilarli; il fallback è `pnpm ui:build` (installa automaticamente le dipendenze UI).
</Note>

## Dettagli della modalità remota

La modalità remota configura questa macchina per connettersi a un gateway altrove.

<Info>
La modalità remota non installa né modifica nulla sull'host remoto.
</Info>

Cosa imposti:

- URL del gateway remoto (`ws://...`)
- Token se il gateway remoto richiede autenticazione (consigliato)

<Note>
- Se il gateway è solo loopback, usa tunneling SSH o una tailnet.
- Suggerimenti di discovery:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opzioni di autenticazione e modello

<AccordionGroup>
  <Accordion title="Chiave API Anthropic">
    Usa `ANTHROPIC_API_KEY` se presente oppure chiede una chiave, poi la salva per l'uso del demone.
  </Accordion>
  <Accordion title="Sottoscrizione OpenAI Code (OAuth)">
    Flusso browser; incolla `code#state`.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Sottoscrizione OpenAI Code (abbinamento del dispositivo)">
    Flusso di abbinamento nel browser con un device code a breve durata.

    Imposta `agents.defaults.model` su `openai-codex/gpt-5.5` quando il modello non è impostato o appartiene già alla famiglia OpenAI.

  </Accordion>
  <Accordion title="Chiave API OpenAI">
    Usa `OPENAI_API_KEY` se presente oppure chiede una chiave, poi memorizza la credenziale nei profili di autenticazione.

    Imposta `agents.defaults.model` su `openai/gpt-5.4` quando il modello non è impostato, è `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Chiave API xAI (Grok)">
    Chiede `XAI_API_KEY` e configura xAI come provider di modelli.
  </Accordion>
  <Accordion title="OpenCode">
    Chiede `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`) e ti consente di scegliere il catalogo Zen o Go.
    URL di configurazione: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chiave API (generica)">
    Memorizza la chiave per te.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Chiede `AI_GATEWAY_API_KEY`.
    Più dettagli: [Vercel AI Gateway](/it/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Chiede account ID, gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Più dettagli: [Cloudflare AI Gateway](/it/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configurazione viene scritta automaticamente. Il predefinito hosted è `MiniMax-M2.7`; la configurazione con chiave API usa
    `minimax/...`, e la configurazione OAuth usa `minimax-portal/...`.
    Più dettagli: [MiniMax](/it/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configurazione viene scritta automaticamente per StepFun standard o Step Plan su endpoint Cina o globali.
    Lo standard attualmente include `step-3.5-flash`, e Step Plan include anche `step-3.5-flash-2603`.
    Più dettagli: [StepFun](/it/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatibile con Anthropic)">
    Chiede `SYNTHETIC_API_KEY`.
    Più dettagli: [Synthetic](/it/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud e modelli aperti locali)">
    Chiede prima `Cloud + Local`, `Cloud only` oppure `Local only`.
    `Cloud only` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Le modalità supportate dall'host chiedono base URL (predefinito `http://127.0.0.1:11434`), rilevano i modelli disponibili e suggeriscono i predefiniti.
    `Cloud + Local` controlla anche se quell'host Ollama ha effettuato l'accesso per l'accesso cloud.
    Più dettagli: [Ollama](/it/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    Le configurazioni Moonshot (Kimi K2) e Kimi Coding vengono scritte automaticamente.
    Più dettagli: [Moonshot AI (Kimi + Kimi Coding)](/it/providers/moonshot).
  </Accordion>
  <Accordion title="Provider personalizzato">
    Funziona con endpoint compatibili con OpenAI e compatibili con Anthropic.

    L'onboarding interattivo supporta le stesse scelte di archiviazione della chiave API degli altri flussi di chiavi API provider:
    - **Incolla ora la chiave API** (testo in chiaro)
    - **Usa riferimento segreto** (env ref o provider ref configurato, con validazione preflight)

    Flag non interattivi:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (facoltativo; usa `CUSTOM_API_KEY` come fallback)
    - `--custom-provider-id` (facoltativo)
    - `--custom-compatibility <openai|anthropic>` (facoltativo; predefinito `openai`)

  </Accordion>
  <Accordion title="Salta">
    Lascia l'autenticazione non configurata.
  </Accordion>
</AccordionGroup>

Comportamento del modello:

- Scegli il modello predefinito dalle opzioni rilevate, oppure inserisci manualmente provider e modello.
- Quando l'onboarding parte da una scelta di autenticazione del provider, il selettore del modello preferisce
  automaticamente quel provider. Per Volcengine e BytePlus, la stessa preferenza
  corrisponde anche alle varianti coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se quel filtro del provider preferito fosse vuoto, il selettore torna al catalogo completo invece di non mostrare modelli.
- La procedura guidata esegue un controllo del modello e avvisa se il modello configurato è sconosciuto o manca l'autenticazione.

Percorsi di credenziali e profili:

- Profili di autenticazione (chiavi API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importazione OAuth legacy: `~/.openclaw/credentials/oauth.json`

Modalità di archiviazione delle credenziali:

- Il comportamento predefinito dell'onboarding salva le chiavi API come valori in chiaro nei profili di autenticazione.
- `--secret-input-mode ref` abilita la modalità riferimento invece dell'archiviazione della chiave in chiaro.
  Nella configurazione interattiva, puoi scegliere:
  - riferimento a variabile d'ambiente (per esempio `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - riferimento a provider configurato (`file` o `exec`) con alias provider + id
- La modalità riferimento interattiva esegue una rapida validazione preflight prima del salvataggio.
  - Ref env: valida il nome della variabile + il valore non vuoto nell'ambiente corrente di onboarding.
  - Ref provider: valida la configurazione del provider e risolve l'id richiesto.
  - Se il preflight fallisce, l'onboarding mostra l'errore e ti consente di riprovare.
- In modalità non interattiva, `--secret-input-mode ref` è supportato solo da env.
  - Imposta la variabile env del provider nell'ambiente del processo di onboarding.
  - I flag chiave inline (per esempio `--openai-api-key`) richiedono che quella variabile env sia impostata; altrimenti l'onboarding fallisce immediatamente.
  - Per i provider personalizzati, la modalità `ref` non interattiva memorizza `models.providers.<id>.apiKey` come `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - In quel caso di provider personalizzato, `--custom-api-key` richiede che `CUSTOM_API_KEY` sia impostata; altrimenti l'onboarding fallisce immediatamente.
- Le credenziali di autenticazione del Gateway supportano scelte in chiaro e SecretRef nella configurazione interattiva:
  - Modalità token: **Genera/memorizza token in chiaro** (predefinito) oppure **Usa SecretRef**.
  - Modalità password: testo in chiaro oppure SecretRef.
- Percorso SecretRef non interattivo per il token: `--gateway-token-ref-env <ENV_VAR>`.
- Le configurazioni esistenti in chiaro continuano a funzionare senza modifiche.

<Note>
Suggerimento per ambienti headless e server: completa OAuth su una macchina con browser, poi copia
`auth-profiles.json` di quell'agente (per esempio
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, oppure il percorso corrispondente
`$OPENCLAW_STATE_DIR/...`) sull'host gateway. `credentials/oauth.json`
è solo una sorgente legacy di importazione.
</Note>

## Output e aspetti interni

Campi tipici in `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` quando viene passato `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (se viene scelto Minimax)
- `tools.profile` (l'onboarding locale usa come predefinito `"coding"` quando non impostato; i valori espliciti esistenti vengono preservati)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (l'onboarding locale usa come predefinito `per-channel-peer` quando non impostato; i valori espliciti esistenti vengono preservati)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist dei canali (Slack, Discord, Matrix, Microsoft Teams) quando scegli di abilitarle durante i prompt (i nomi vengono risolti in ID quando possibile)
- `skills.install.nodeManager`
  - Il flag `setup --node-manager` accetta `npm`, `pnpm` o `bun`.
  - La configurazione manuale può ancora impostare successivamente `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` scrive `agents.list[]` e `bindings` facoltativi.

Le credenziali WhatsApp vanno in `~/.openclaw/credentials/whatsapp/<accountId>/`.
Le sessioni sono archiviate in `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alcuni canali sono distribuiti come Plugin. Quando vengono selezionati durante il setup, la procedura guidata
chiede di installare il Plugin (npm o percorso locale) prima della configurazione del canale.
</Note>

RPC della procedura guidata del Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

I client (app macOS e Control UI) possono renderizzare i passaggi senza reimplementare la logica di onboarding.

Comportamento della configurazione di Signal:

- Scarica l'asset di release appropriato
- Lo archivia in `~/.openclaw/tools/signal-cli/<version>/`
- Scrive `channels.signal.cliPath` nella configurazione
- Le build JVM richiedono Java 21
- Quando disponibili, vengono usate build native
- Windows usa WSL2 e segue il flusso Linux di signal-cli all'interno di WSL

## Documentazione correlata

- Hub onboarding: [Onboarding (CLI)](/it/start/wizard)
- Automazione e script: [CLI Automation](/it/start/wizard-cli-automation)
- Riferimento comandi: [`openclaw onboard`](/it/cli/onboard)
