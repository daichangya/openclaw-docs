---
read_when:
    - Nuova installazione, onboarding bloccato o errori alla prima esecuzione
    - Scegliere auth e subscription del provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: avvio rapido e configurazione della prima esecuzione — installazione, onboarding, auth, subscription, errori iniziali'
title: 'FAQ: configurazione della prima esecuzione'
x-i18n:
    generated_at: "2026-04-26T11:31:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  Domande e risposte rapide per l'avvio e la prima esecuzione. Per operazioni quotidiane, modelli, auth, sessioni
  e risoluzione dei problemi vedi la [FAQ](/it/help/faq) principale.

  ## Avvio rapido e configurazione della prima esecuzione

  <AccordionGroup>
  <Accordion title="Sono bloccato, qual è il modo più veloce per sbloccarmi?">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi "sono bloccato" sono **problemi locali di configurazione o ambiente** che
    chi aiuta da remoto non può ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutarti a sistemare
    la configurazione della tua macchina (PATH, servizi, permessi, file auth). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare in seguito alla versione stable
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi esegui solo i
    comandi necessari. Così le modifiche restano piccole e più facili da verificare.

    Se scopri un vero bug o una correzione, apri per favore una issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: snapshot rapido dello stato di salute di gateway/agente + configurazione di base.
    - `openclaw models status`: controlla auth del provider + disponibilità dei modelli.
    - `openclaw doctor`: valida e ripara i problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop rapido di debug: [Primi 60 secondi se qualcosa è rotto](#first-60-seconds-if-something-is-broken).
    Documentazione di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a essere saltato. Cosa significano i motivi di skip?">
    Motivi comuni di skip di Heartbeat:

    - `quiet-hours`: fuori dalla finestra configurata di ore attive
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota/intestazione
    - `no-tasks-due`: la modalità task di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora dovuto
    - `alerts-disabled`: tutta la visibilità di Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità task, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di una vera esecuzione di heartbeat. Le esecuzioni saltate non segnano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire dal sorgente e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche creare automaticamente gli asset UI. Dopo l'onboarding, in genere esegui il Gateway sulla porta **18789**.

    Dal sorgente (contributori/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se non hai ancora un'installazione globale, eseguila tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL dashboard pulito (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede auth tramite segreto condiviso, incolla il token o la password configurati nelle impostazioni di Control UI.
    - Origine del token: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'auth di Control UI/WebSocket (nessun segreto condiviso da incollare, si assume host gateway fidato); le API HTTP richiedono comunque auth tramite segreto condiviso a meno che tu non usi intenzionalmente auth HTTP `none` o trusted-proxy per ingress privato.
      I tentativi auth Serve concorrenti errati dello stesso client vengono serializzati prima che il limiter delle auth fallite li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (oppure configura auth con password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy identity-aware**: mantieni il Gateway dietro un trusted proxy non loopback, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'auth tramite segreto condiviso continua ad applicarsi attraverso il tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per dettagli su modalità bind e auth.

  </Accordion>

  <Accordion title="Perché ci sono due configurazioni di approvazione exec per le approvazioni chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra i prompt di approvazione verso destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host resta comunque il vero gate di approvazione. La configurazione chat controlla solo dove compaiono i prompt di approvazione
    e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre gli approvatori in modo sicuro, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso primario; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato del tool dice che le approvazioni chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando i prompt devono anche essere inoltrati ad altre chat o a stanze ops esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che i prompt di approvazione vengano pubblicati di nuovo nella stanza/topic di origine.
    - Le approvazioni dei plugin sono ancora separate: usano per impostazione predefinita `/approve` nella stessa chat, inoltro facoltativo `approvals.plugin`, e solo alcuni canali nativi mantengono una gestione nativa delle approvazioni plugin anche sopra questo livello.

    In breve: l'inoltro serve per l'instradamento, la configurazione del client nativo serve per una UX più ricca e specifica del canale.
    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. `pnpm` è consigliato. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero - la documentazione indica **512MB-1GB di RAM**, **1 core** e circa **500MB**
    di spazio disco come sufficienti per uso personale, e segnala che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, media, altri servizi), sono consigliati **2GB**, ma non è
    un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway, e puoi associare **Node** sul tuo laptop/telefono per
    schermo/fotocamera/canvas locale o esecuzione di comandi. Vedi [Node](/it/nodes).

  </Accordion>

  <Accordion title="Ci sono suggerimenti per installazioni su Raspberry Pi?">
    In breve: funziona, ma aspettati qualche asperità.

    - Usa un sistema operativo **64-bit** e mantieni Node >= 22.
    - Preferisci l'installazione **hackable (git)** così puoi vedere i log e aggiornare velocemente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. La TUI invia anche
    "Wake up, my friend!" automaticamente alla prima schiusa. Se vedi quella riga con **nessuna risposta**
    e i token restano a 0, l'agente non è mai partito.

    1. Riavvia il Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controlla stato + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se continua a bloccarsi, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che la UI
    punti al Gateway corretto. Vedi [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessione, auth e stato
    del canale) finché copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili auth, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host gateway possiede lo store delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del tuo workspace su GitHub, stai facendo
    il backup di **memoria + file bootstrap**, ma **non** della cronologia delle sessioni né dell'auth. Questi vivono
    sotto `~/.openclaw/` (ad esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trovano le cose su disco](#where-things-live-on-disk),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo cosa c'è di nuovo nell'ultima versione?">
    Controlla il changelog su GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione superiore è contrassegnata come **Unreleased**, la successiva
    sezione datata è l'ultima versione distribuita. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni docs/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disattivala oppure inserisci `docs.openclaw.ai` nell'allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalandolo qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ancora non riesci a raggiungere il sito, la documentazione è replicata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build anticipata per i test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Per questo beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per le one-liner di installazione e la differenza tra beta e dev, vedi l'accordion sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è la head mobile di `main` (git); quando viene pubblicata, usa il dist-tag npm `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Maggiori dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo le ultime novità?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al branch `main` e aggiorna dal sorgente.

    2. **Installazione hackable (dal sito dell'installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo ti fornisce un repo locale che puoi modificare, poi aggiornare tramite git.

    Se preferisci fare manualmente un clone pulito, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Update](/it/cli/update), [Canali di sviluppo](/it/install/development-channels),
    [Installazione](/it/install).

  </Accordion>

  <Accordion title="Quanto tempo richiedono di solito installazione e onboarding?">
    Guida rapida:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il loop rapido di debug in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Riesegui l'installer con **output dettagliato**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installazione beta con verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Per un'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente Windows (PowerShell):

    ```powershell
    # install.ps1 non ha ancora un flag -Verbose dedicato.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione su Windows dice git not found oppure openclaw not recognized">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git not found**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui l'installer.

    **2) openclaw is not recognized dopo l'installazione**

    - La tua cartella npm global bin non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al tuo PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Se vuoi la configurazione più fluida su Windows, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese corrotto - cosa devo fare?">
    Di solito si tratta di un'incompatibilità del code page della console nelle shell Windows native.

    Sintomi:

    - l'output di `system.run`/`exec` mostra il cinese come mojibake
    - lo stesso comando appare correttamente in un altro profilo terminale

    Soluzione rapida in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Poi riavvia il Gateway e riprova il comando:

    ```powershell
    openclaw gateway restart
    ```

    Se riesci ancora a riprodurlo sull'ultima versione di OpenClaw, traccialo/segnalalo qui:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda - come ottengo una risposta migliore?">
    Usa l'**installazione hackable (git)** così avrai sorgente e documentazione completi in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ così potrà leggere il repo e rispondere in modo preciso.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/it/install) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Guida completa: [Per iniziare](/it/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Qualsiasi VPS Linux funziona. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove si trovano le guide di installazione cloud/VPS?">
    Manteniamo un **hub hosting** con i provider più comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway gira sul server**, e tu vi accedi
    dal tuo laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi tratta l'host come fonte di verità ed esegui i backup.

    Puoi associare **Node** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere a
    schermo/fotocamera/canvas locale o eseguire comandi sul tuo laptop mantenendo però il
    Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Node: [Node](/it/nodes), [CLI Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso chiedere a OpenClaw di aggiornarsi da solo?">
    Risposta breve: **possibile, non consigliato**. Il flusso di aggiornamento può riavviare il
    Gateway (interrompendo la sessione attiva), può richiedere un checkout git pulito e
    può chiedere conferma. Più sicuro: eseguire gli aggiornamenti da una shell come operatore.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se devi automatizzarlo da un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Update](/it/cli/update), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Cosa fa effettivamente l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/auth** (OAuth provider, API key, setup-token Anthropic, più opzioni di modelli locali come LM Studio)
    - Posizione del **workspace** + file bootstrap
    - **Impostazioni Gateway** (bind/porta/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più plugin di canale bundled come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - **Controlli di salute** e selezione delle **Skills**

    Avvisa anche se il modello configurato è sconosciuto o se manca l'auth.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **API key** (Anthropic/OpenAI/altri) oppure con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max oppure OpenAI Codex) sono modi facoltativi per autenticare quei provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **API key Anthropic**: normale fatturazione API Anthropic
    - **Claude CLI / auth tramite subscription Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo utilizzo è di nuovo consentito, e OpenClaw sta trattando l'uso di `claude -p`
      come autorizzato per questa integrazione salvo che Anthropic pubblichi una nuova
      policy

    Per host gateway di lunga durata, le API key Anthropic restano comunque la configurazione
    più prevedibile. OpenAI Codex OAuth è esplicitamente supportato per strumenti esterni
    come OpenClaw.

    OpenClaw supporta anche altre opzioni hosted in stile subscription, incluse
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/it/providers/anthropic), [OpenAI](/it/providers/openai),
    [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax), [Modelli GLM](/it/providers/glm),
    [Modelli locali](/it/gateway/local-models), [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare la subscription Claude Max senza una API key?">
    Sì.

    Lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi
    OpenClaw tratta l'auth tramite subscription Claude e l'uso di `claude -p` come autorizzati
    per questa integrazione salvo che Anthropic pubblichi una nuova policy. Se vuoi
    la configurazione server-side più prevedibile, usa invece una API key Anthropic.

  </Accordion>

  <Accordion title="Supportate l'auth tramite subscription Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo utilizzo è di nuovo consentito, quindi OpenClaw tratta
    il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione
    salvo che Anthropic pubblichi una nuova policy.

    Anthropic setup-token è ancora disponibile come percorso token supportato da OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'auth tramite API key Anthropic resta
    la scelta più sicura e prevedibile. Se vuoi altre opzioni hosted in stile subscription
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli
    GLM](/it/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
    Significa che la tua **quota/rate limit Anthropic** è esaurita per la finestra corrente. Se
    usi **Claude CLI**, attendi il reset della finestra oppure aggiorna il tuo piano. Se
    usi una **API key Anthropic**, controlla la Anthropic Console
    per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta Anthropic con contesto 1M (`context1m: true`). Questo funziona solo quando la tua
    credenziale è idonea alla fatturazione long-context (fatturazione tramite API key o il
    percorso OpenClaw Claude-login con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a rate limit.
    Vedi [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider bundled **Amazon Bedrock (Converse)**. Con i marker env AWS presenti, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; in alternativa puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` oppure aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso con chiave gestita, anche un proxy compatibile OpenAI davanti a Bedrock resta un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'auth di Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai-codex/gpt-5.5` per OAuth Codex tramite il runner PI predefinito. Usa
    `openai/gpt-5.5` per accesso diretto con API key OpenAI. GPT-5.5 può anche usare
    subscription/OAuth tramite `openai-codex/gpt-5.5` oppure esecuzioni native Codex app-server
    con `openai/gpt-5.5` e `agentRuntime.id: "codex"`.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw continua a menzionare openai-codex?">
    `openai-codex` è l'id del provider e dell'auth-profile per OAuth ChatGPT/Codex.
    È anche il prefisso esplicito del modello PI per OAuth Codex:

    - `openai/gpt-5.5` = attuale percorso diretto con API key OpenAI in PI
    - `openai-codex/gpt-5.5` = percorso OAuth Codex in PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = percorso nativo Codex app-server
    - `openai-codex:...` = id auth profile, non un ref di modello

    Se vuoi il percorso diretto di fatturazione/limite OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi auth tramite subscription ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai-codex` e usa
    i ref di modello `openai-codex/*` per le esecuzioni PI.

  </Accordion>

  <Accordion title="Perché i limiti di Codex OAuth possono differire da quelli del web ChatGPT?">
    Codex OAuth usa finestre di quota gestite da OpenAI e dipendenti dal piano. In pratica,
    questi limiti possono differire dall'esperienza del sito/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza
    i diritti ChatGPT-web in accesso API diretto. Se vuoi il percorso diretto di fatturazione/limite OpenAI Platform,
    usa `openai/*` con una API key.

  </Accordion>

  <Accordion title="Supportate l'auth tramite subscription OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente **OpenAI Code (Codex) subscription OAuth**.
    OpenAI consente esplicitamente l'uso di subscription OAuth in strumenti/workflow esterni
    come OpenClaw. L'onboarding può eseguire per te il flusso OAuth.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso auth del plugin**, non un client id o un secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente in modo che `gemini` sia nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo il login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` oppure `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway

    Questo memorizza i token OAuth negli auth profile sull'host gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat casuali?">
    Di solito no. OpenClaw ha bisogno di contesto ampio + forte sicurezza; schede piccole troncano e fanno trapelare. Se devi farlo, esegui localmente la build del modello **più grande** che puoi (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico verso modelli hosted in una regione specifica?">
    Scegli endpoint bloccati per regione. OpenRouter espone opzioni ospitate negli USA per MiniMax, Kimi e GLM; scegli la variante ospitata negli USA per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionalizzato che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw gira su macOS o Linux (Windows tramite WSL2). Un Mac mini è facoltativo - alcune persone
    ne acquistano uno come host always-on, ma va bene anche un piccolo VPS, un server domestico o una macchina di classe Raspberry Pi.

    Ti serve un Mac **solo per gli strumenti esclusivi macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato) - il server BlueBubbles gira su qualsiasi Mac, e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti esclusivi macOS, esegui il Gateway su un Mac o associa un node macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un qualche dispositivo macOS** connesso a Messaggi. **Non** deve essere un Mac mini -
    va bene qualsiasi Mac. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage - il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS, ed esegui il server BlueBubbles su un qualsiasi Mac connesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su una sola macchina.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway**, e il tuo MacBook Pro può connettersi come
    **node** (dispositivo companion). I Node non eseguono il Gateway - forniscono capability
    aggiuntive come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Pattern comune:

    - Gateway sul Mac mini (always-on).
    - Il MacBook Pro esegue l'app macOS o un host node e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Node](/it/nodes), [CLI Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Vediamo bug runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va inserito in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram del mittente umano** (numerico). Non è il nome utente del bot.

    La configurazione chiede solo ID utente numerici. Se hai già voci legacy `@username` nella configurazione, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    API Bot ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno private):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **instradamento multi-agent**. Associa il **DM** WhatsApp di ciascun mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e il proprio session store. Le risposte continuano comunque a provenire dallo **stesso account WhatsApp**, e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento multi-agent](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "chat veloce" e un agente "Opus per coding"?'>
    Sì. Usa l'instradamento multi-agent: assegna a ciascun agente il proprio modello predefinito, poi associa le route in entrata (account provider o peer specifici) a ciascun agente. Un esempio di configurazione si trova in [Instradamento multi-agent](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw tramite systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (oppure il tuo prefisso brew) così gli strumenti installati con `brew` vengano risolti nelle shell non di login.
    Le build recenti antepongono anche le comuni directory bin utente nei servizi systemd Linux (ad esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra installazione git hackable e installazione npm">
    - **Installazione git hackable:** checkout completo del sorgente, modificabile, ideale per i contributori.
      Esegui le build localmente e puoi patchare codice/documentazione.
    - **Installazione npm:** installazione globale della CLI, senza repo, ideale per "eseguirlo e basta".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Per iniziare](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare in seguito tra installazioni npm e git?">
    Sì. Usa `openclaw update --channel ...` quando OpenClaw è già installato.
    Questo **non elimina i tuoi dati** - cambia solo l'installazione del codice OpenClaw.
    Il tuo stato (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) restano intatti.

    Da npm a git:

    ```bash
    openclaw update --channel dev
    ```

    Da git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Aggiungi `--dry-run` per vedere prima l'anteprima del cambio di modalità previsto. L'updater esegue
    follow-up di Doctor, aggiorna le fonti dei plugin per il canale di destinazione e
    riavvia il gateway a meno che tu non passi `--no-restart`.

    Anche l'installer può forzare una delle due modalità:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Suggerimenti per il backup: vedi [Strategia di backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e ti va bene sospensione/riavvii, eseguilo in locale.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra browser visibile.
    - **Contro:** sospensione/cadute di rete = disconnessioni, aggiornamenti/riavvii del sistema operativo interrompono, deve restare acceso.

    **VPS / cloud**

    - **Pro:** always-on, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso gira headless (usa screenshot), accesso ai file solo da remoto, devi usare SSH per gli aggiornamenti.

    **Nota specifica per OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** contro finestra visibile. Vedi [Browser](/it/tools/browser).

    **Valore predefinito consigliato:** VPS se in passato hai avuto disconnessioni del gateway. Il locale è ottimo quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** always-on, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, mantieni il Gateway su un host dedicato e associa il tuo laptop come **node** per strumenti locali di schermo/fotocamera/exec. Vedi [Node](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi per un VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM, ~500MB di disco.
    - **Consigliato:** 1-2 vCPU, 2GB di RAM o più per avere margine (log, media, più canali). I tool Node e l'automazione browser possono richiedere molte risorse.

    Sistema operativo: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato soprattutto lì.

    Documentazione: [Linux](/it/platforms/linux), [Hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre attiva, raggiungibile e avere abbastanza
    RAM per il Gateway e gli eventuali canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM.
    - **Consigliato:** 2GB di RAM o più se esegui più canali, automazione browser o tool media.
    - **Sistema operativo:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se usi Windows, **WSL2 è la configurazione in stile VM più semplice** e ha la migliore compatibilità
    con gli strumenti. Vedi [Windows](/it/platforms/windows), [Hosting VPS](/it/vps).
    Se stai eseguendo macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — la FAQ principale (modelli, sessioni, gateway, sicurezza, altro)
- [Panoramica installazione](/it/install)
- [Per iniziare](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
