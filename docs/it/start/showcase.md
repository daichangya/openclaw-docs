---
description: Real-world OpenClaw projects from the community
read_when:
    - Cerchi esempi reali di utilizzo di OpenClaw
    - Aggiornamento dei progetti della community in evidenza
summary: Progetti e integrazioni creati dalla community e basati su OpenClaw
title: Vetrina
x-i18n:
    generated_at: "2026-04-15T08:18:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# Vetrina

<div className="showcase-hero">
  <p className="showcase-kicker">Creato in chat, terminali, browser e salotti</p>
  <p className="showcase-lead">
    I progetti OpenClaw non sono demo giocattolo. Le persone stanno distribuendo loop di revisione PR, app mobili, automazione domestica,
    sistemi vocali, devtools e flussi di lavoro con uso intensivo della memoria dai canali che già utilizzano.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Guarda le demo</a>
    <a href="#fresh-from-discord">Esplora i progetti</a>
    <a href="https://discord.gg/clawd">Condividi il tuo</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Build native per la chat</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, chat web e flussi di lavoro terminal-first.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Automazione reale</strong>
      <span>Prenotazioni, acquisti, supporto, reportistica e controllo del browser senza aspettare un'API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Mondo locale + fisico</strong>
      <span>Stampanti, aspirapolvere, telecamere, dati sanitari, sistemi domestici e basi di conoscenza personali.</span>
    </div>
  </div>
</div>

<Info>
**Vuoi essere messo in evidenza?** Condividi il tuo progetto in [#self-promotion su Discord](https://discord.gg/clawd) oppure [tagga @openclaw su X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Video</a>
  <a href="#fresh-from-discord">Novità da Discord</a>
  <a href="#automation-workflows">Automazione</a>
  <a href="#knowledge-memory">Memory</a>
  <a href="#voice-phone">Voce e telefono</a>
  <a href="#infrastructure-deployment">Infrastruttura</a>
  <a href="#home-hardware">Casa e hardware</a>
  <a href="#community-projects">Community</a>
  <a href="#submit-your-project">Invia un progetto</a>
</div>

<h2 id="videos">Video</h2>

<p className="showcase-section-intro">
  Inizia da qui se vuoi il percorso più breve da “che cos'è?” a “ok, ho capito”.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: l'AI self-hosted che Siri avrebbe dovuto essere (configurazione completa)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Guida completa alla configurazione</h3>
    <p>VelvetShark, 28 minuti. Installa, configura e ottieni un primo assistente funzionante end-to-end.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Guarda su YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="Video vetrina di OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Reel vetrina della community</h3>
    <p>Una panoramica più rapida di progetti reali, superfici e flussi di lavoro costruiti attorno a OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Guarda su YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="Vetrina della community OpenClaw"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Progetti nel mondo reale</h3>
    <p>Esempi dalla community, dai loop di coding nativi per la chat fino all'hardware e all'automazione personale.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Guarda su YouTube</a>
  </div>
</div>

<h2 id="fresh-from-discord">Novità da Discord</h2>

<p className="showcase-section-intro">
  Progetti recenti di spicco tra coding, devtools, mobile e creazione di prodotti nativi per la chat.
</p>

<CardGroup cols={2}>

<Card title="Revisione PR → Feedback su Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode completa la modifica → apre una PR → OpenClaw rivede il diff e risponde su Telegram con “piccoli suggerimenti” più un chiaro verdetto di merge (incluse le correzioni critiche da applicare prima).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback di revisione PR di OpenClaw consegnato su Telegram" />
</Card>

<Card title="Skill cantina vini in pochi minuti" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Ha chiesto a “Robby” (@openclaw) una skill locale per la cantina dei vini. Richiede un export CSV di esempio + dove archiviarlo, poi costruisce/testa rapidamente la skill (962 bottiglie nell'esempio).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw che crea una skill locale per una cantina vini da CSV" />
</Card>

<Card title="Autopilota per la spesa Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Piano pasti settimanale → prodotti abituali → prenota la fascia di consegna → conferma l'ordine. Nessuna API, solo controllo del browser.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automazione della spesa Tesco via chat" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Tasto rapido su un'area dello schermo → Gemini vision → Markdown istantaneo negli appunti.

  <img src="/assets/showcase/snag.png" alt="Strumento SNAG da screenshot a Markdown" />
</Card>

<Card title="UI Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App desktop per gestire Skills/comandi tra Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App UI Agents" />
</Card>

<Card title="Note vocali Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Integra TTS di papla.media e invia i risultati come note vocali su Telegram (senza fastidioso autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Output di nota vocale Telegram da TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installabile con Homebrew per elencare/ispezionare/monitorare le sessioni locali di OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor su ClawHub" />
</Card>

<Card title="Controllo stampante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controlla e risolve i problemi delle stampanti BambuLab: stato, lavori, videocamera, AMS, calibrazione e altro.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI su ClawHub" />
</Card>

<Card title="Trasporti di Vienna (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partenze in tempo reale, interruzioni, stato degli ascensori e routing per il trasporto pubblico di Vienna.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien su ClawHub" />
</Card>

<Card title="Pasti scolastici ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Prenotazione automatizzata dei pasti scolastici nel Regno Unito tramite ParentPay. Usa coordinate del mouse per clic affidabili sulle celle della tabella.
</Card>

<Card title="Upload R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Carica su Cloudflare R2/S3 e genera link di download presigned sicuri. Perfetto per istanze OpenClaw remote.
</Card>

<Card title="App iOS tramite Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Ha creato un'app iOS completa con mappe e registrazione vocale, distribuita su TestFlight interamente tramite chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS su TestFlight" />
</Card>

<Card title="Assistente salute Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente sanitario AI personale che integra i dati di Oura ring con calendario, appuntamenti e programma della palestra.

  <img src="/assets/showcase/oura-health.png" alt="Assistente salute Oura ring" />
</Card>
<Card title="Kev's Dream Team (14+ agenti)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ agenti sotto un solo gateway con orchestratore Opus 4.5 che delega ai worker Codex. [Approfondimento tecnico](https://github.com/adam91holt/orchestrated-ai-articles) completo che copre il roster Dream Team, la selezione dei modelli, il sandboxing, i webhook, gli Heartbeat e i flussi di delega. [Clawdspace](https://github.com/adam91holt/clawdspace) per il sandboxing degli agenti. [Post del blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI per Linear che si integra con flussi di lavoro agentici (Claude Code, OpenClaw). Gestisci issue, progetti e flussi di lavoro dal terminale. Prima PR esterna unita!
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Legge, invia e archivia messaggi tramite Beeper Desktop. Usa l'API MCP locale di Beeper così gli agenti possono gestire tutte le tue chat (iMessage, WhatsApp, ecc.) in un unico posto.
</Card>

</CardGroup>

<h2 id="automation-workflows">Automazione &amp; flussi di lavoro</h2>

<p className="showcase-section-intro">
  Pianificazione, controllo del browser, loop di supporto e il lato del prodotto del tipo “fai semplicemente il compito al posto mio”.
</p>

<CardGroup cols={2}>

<Card title="Controllo del purificatore d'aria Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code ha scoperto e confermato i controlli del purificatore, poi OpenClaw subentra per gestire la qualità dell'aria della stanza.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controllo del purificatore d'aria Winix tramite OpenClaw" />
</Card>

<Card title="Bellissime foto del cielo" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Attivato da una telecamera sul tetto: chiedi a OpenClaw di scattare una foto al cielo ogni volta che appare bello — ha progettato una skill e ha scattato la foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Istantanea del cielo dalla telecamera sul tetto acquisita da OpenClaw" />
</Card>

<Card title="Scena briefing mattutino visivo" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Un prompt pianificato genera ogni mattina una singola immagine "scena" (meteo, attività, data, post/citazione preferita) tramite una persona OpenClaw.
</Card>

<Card title="Prenotazione campo da padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  CLI per controllo disponibilità e prenotazione Playtomic. Non perdere mai più un campo libero.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Screenshot di padel-cli" />
</Card>

<Card title="Raccolta documenti contabili" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  Raccoglie PDF dalle email, prepara i documenti per il consulente fiscale. Contabilità mensile in autopilota.
</Card>

<Card title="Modalità sviluppo dal divano" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Ricostruito l'intero sito personale tramite Telegram mentre guardava Netflix — Notion → Astro, 18 post migrati, DNS su Cloudflare. Non ha mai aperto un portatile.
</Card>

<Card title="Agente per la ricerca di lavoro" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Cerca annunci di lavoro, li confronta con le parole chiave del CV e restituisce opportunità pertinenti con link. Creato in 30 minuti usando l'API JSearch.
</Card>

<Card title="Builder di skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw si è connesso a Jira, poi ha generato al volo una nuova skill (prima che esistesse su ClawHub).
</Card>

<Card title="Skill Todoist tramite Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Ha automatizzato le attività Todoist e ha fatto generare a OpenClaw la skill direttamente nella chat Telegram.
</Card>

<Card title="Analisi TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Accede a TradingView tramite automazione del browser, acquisisce screenshot dei grafici ed esegue analisi tecnica su richiesta. Nessuna API necessaria: solo controllo del browser.
</Card>

<Card title="Supporto automatico su Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora il canale Slack dell'azienda, risponde in modo utile e inoltra notifiche su Telegram. Ha corretto autonomamente un bug di produzione in un'app distribuita senza che nessuno glielo chiedesse.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Conoscenza &amp; Memory</h2>

<p className="showcase-section-intro">
  Sistemi che indicizzano, cercano, ricordano e ragionano sulla conoscenza personale o di team.
</p>

<CardGroup cols={2}>

<Card title="Apprendimento del cinese xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Motore per l'apprendimento del cinese con feedback sulla pronuncia e flussi di studio tramite OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback sulla pronuncia di xuezh" />
</Card>

<Card title="Vault Memory di WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  Acquisisce esportazioni complete di WhatsApp, trascrive oltre 1.000 note vocali, le confronta con i log git e produce report markdown collegati.
</Card>

<Card title="Ricerca semantica Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Aggiunge la ricerca vettoriale ai segnalibri Karakeep usando embedding Qdrant + OpenAI/Ollama.
</Card>

<Card title="Memory Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  Gestore di memoria separato che trasforma i file di sessione in ricordi → credenze → modello del sé in evoluzione.
</Card>

</CardGroup>

<h2 id="voice-phone">Voce &amp; Telefono</h2>

<p className="showcase-section-intro">
  Punti di ingresso speech-first, bridge telefonici e flussi di lavoro con uso intensivo della trascrizione.
</p>

<CardGroup cols={2}>

<Card title="Bridge telefonico Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Bridge HTTP tra assistente vocale Vapi e OpenClaw. Chiamate telefoniche quasi in tempo reale con il tuo agente.
</Card>

<Card title="Trascrizione OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Trascrizione audio multilingue tramite OpenRouter (Gemini, ecc.). Disponibile su ClawHub.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Infrastruttura &amp; Deployment</h2>

<p className="showcase-section-intro">
  Packaging, deployment e integrazioni che rendono OpenClaw più facile da eseguire ed estendere.
</p>

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw in esecuzione su Home Assistant OS con supporto per tunnel SSH e stato persistente.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Controlla e automatizza i dispositivi Home Assistant tramite linguaggio naturale.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configurazione OpenClaw basata su nix, completa di tutto, per deployment riproducibili.
</Card>

<Card title="Calendario CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill calendario che usa khal/vdirsyncer. Integrazione calendario self-hosted.
</Card>

</CardGroup>

<h2 id="home-hardware">Casa &amp; Hardware</h2>

<p className="showcase-section-intro">
  Il lato fisico di OpenClaw: case, sensori, telecamere, aspirapolvere e altri dispositivi.
</p>

<CardGroup cols={2}>

<Card title="Automazione GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automazione domestica nativa per Nix con OpenClaw come interfaccia, più splendide dashboard Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana di GoHome" />
</Card>

<Card title="Aspirapolvere Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Controlla il tuo robot aspirapolvere Roborock tramite conversazione naturale.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Stato di Roborock" />
</Card>

</CardGroup>

<h2 id="community-projects">Progetti della community</h2>

<p className="showcase-section-intro">
  Cose che sono cresciute oltre un singolo flusso di lavoro fino a diventare prodotti o ecosistemi più ampi.
</p>

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  Marketplace completo per attrezzatura astronomica. Creato con/attorno all'ecosistema OpenClaw.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Invia il tuo progetto</h2>

<p className="showcase-section-intro">
  Se stai costruendo qualcosa di interessante con OpenClaw, inviaci tutto. Screenshot efficaci e risultati concreti aiutano.
</p>

Hai qualcosa da condividere? Ci piacerebbe metterlo in evidenza!

<Steps>
  <Step title="Condividilo">
    Pubblica in [#self-promotion su Discord](https://discord.gg/clawd) oppure [tagga @openclaw su X](https://x.com/openclaw)
  </Step>
  <Step title="Includi i dettagli">
    Dicci cosa fa, inserisci il link al repo/demo, condividi uno screenshot se ne hai uno
  </Step>
  <Step title="Ottieni visibilità">
    Aggiungeremo i progetti più interessanti a questa pagina
  </Step>
</Steps>
