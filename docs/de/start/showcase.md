---
description: Real-world OpenClaw projects from the community
read_when:
    - Suche nach echten Anwendungsbeispielen für OpenClaw
    - Community-Projekt-Highlights aktualisieren
summary: Von der Community entwickelte Projekte und Integrationen auf Basis von OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-23T14:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Showcase

<div className="showcase-hero">
  <p className="showcase-kicker">Gebaut in Chats, Terminals, Browsern und Wohnzimmern</p>
  <p className="showcase-lead">
    OpenClaw-Projekte sind keine Demo-Spielereien. Menschen liefern PR-Review-Schleifen, mobile Apps, Heimautomatisierung,
    Sprachsysteme, Devtools und speicherintensive Workflows über die Kanäle aus, die sie bereits nutzen.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Demos ansehen</a>
    <a href="#fresh-from-discord">Projekte ansehen</a>
    <a href="https://discord.gg/clawd">Eigenes teilen</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Chat-native Builds</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, Web-Chat und Terminal-First-Workflows.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Echte Automatisierung</strong>
      <span>Buchung, Einkauf, Support, Reporting und Browser-Steuerung, ohne auf eine API zu warten.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Lokal + physische Welt</strong>
      <span>Drucker, Staubsauger, Kameras, Gesundheitsdaten, Heimsysteme und persönliche Wissensdatenbanken.</span>
    </div>
  </div>
</div>

<Info>
**Möchten Sie vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [taggen Sie @openclaw auf X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Videos</a>
  <a href="#fresh-from-discord">Neu aus Discord</a>
  <a href="#automation-workflows">Automatisierung</a>
  <a href="#knowledge-memory">Memory</a>
  <a href="#voice-phone">Sprache &amp; Telefon</a>
  <a href="#infrastructure-deployment">Infrastruktur</a>
  <a href="#home-hardware">Zuhause &amp; Hardware</a>
  <a href="#community-projects">Community</a>
  <a href="#submit-your-project">Projekt einreichen</a>
</div>

## Videos

<p className="showcase-section-intro">
  Starten Sie hier, wenn Sie den kürzesten Weg von „Was ist das?“ zu „Okay, ich verstehe es.“ möchten.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: Die selbst gehostete KI, die Siri hätte sein sollen (vollständige Einrichtung)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Vollständiger Einrichtungs-Walkthrough</h3>
    <p>VelvetShark, 28 Minuten. Installieren, onboarden und zu einem ersten funktionierenden Assistenten von Anfang bis Ende gelangen.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Auf YouTube ansehen</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw-Showcase-Video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Community-Showcase-Reel</h3>
    <p>Ein schnellerer Durchgang durch echte Projekte, Oberflächen und Workflows rund um OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Auf YouTube ansehen</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw-Community-Showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projekte in freier Wildbahn</h3>
    <p>Beispiele aus der Community, von chat-nativen Coding-Schleifen bis zu Hardware und persönlicher Automatisierung.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Auf YouTube ansehen</a>
  </div>
</div>

## Neu aus Discord

<p className="showcase-section-intro">
  Jüngste Highlights aus Coding, Devtools, Mobile und chat-nativer Produktentwicklung.
</p>

<CardGroup cols={2}>

<Card title="PR-Review → Telegram-Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode schließt die Änderung ab → eröffnet einen PR → OpenClaw prüft den Diff und antwortet in Telegram mit „kleineren Vorschlägen“ plus einem klaren Merge-Urteil (einschließlich kritischer Fixes, die zuerst angewendet werden müssen).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw-PR-Review-Feedback in Telegram zugestellt" />
</Card>

<Card title="Wine-Cellar-Skill in Minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

„Robby“ (@openclaw) nach einem lokalen Wine-Cellar-Skill gefragt. Er fordert einen Beispiel-CSV-Export plus den Speicherort an und baut/testet den Skill dann schnell (im Beispiel 962 Flaschen).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw baut einen lokalen Wine-Cellar-Skill aus CSV" />
</Card>

<Card title="Tesco-Shop-Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Essensplan → Standardartikel → Lieferfenster buchen → Bestellung bestätigen. Keine APIs, nur Browser-Steuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-Shop-Automatisierung per Chat" />
</Card>

<Card title="SNAG Screenshot-zu-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Hotkey für einen Bildschirmbereich → Gemini-Vision → sofortiges Markdown in Ihrer Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG-Screenshot-zu-Markdown-Tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zum Verwalten von Skills/Befehlen über Agents, Claude, Codex und OpenClaw hinweg.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents-UI-App" />
</Card>

<Card title="Telegram-Sprachnotizen (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Bindet papla.media-TTS ein und sendet Ergebnisse als Telegram-Sprachnotizen (kein nerviges Autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-Sprachnotiz-Ausgabe aus TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Per Homebrew installierter Helfer zum Auflisten/Prüfen/Beobachten lokaler OpenAI-Codex-Sitzungen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor auf ClawHub" />
</Card>

<Card title="Bambu-3D-Druckersteuerung" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-Drucker steuern und Fehler beheben: Status, Jobs, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu-CLI-Skill auf ClawHub" />
</Card>

<Card title="Wiener Linien" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Abfahrten in Echtzeit, Störungen, Aufzugsstatus und Routen für den öffentlichen Verkehr in Wien.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener-Linien-Skill" />
</Card>

<Card title="ParentPay-Schulessen" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulessen im Vereinigten Königreich über ParentPay. Verwendet Mauskoordinaten für zuverlässiges Klicken auf Tabellenzellen.
</Card>

<Card title="R2-Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Auf Cloudflare R2/S3 hochladen und sichere vorab signierte Download-Links erzeugen. Perfekt für entfernte OpenClaw-Instanzen.
</Card>

<Card title="iOS-App über Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Eine vollständige iOS-App mit Karten und Sprachaufzeichnung gebaut, vollständig per Telegram-Chat auf TestFlight bereitgestellt.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-App auf TestFlight" />
</Card>

<Card title="Oura-Ring-Gesundheitsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Oura-Ring-Daten mit Kalender, Terminen und Trainingsplan integriert.

  <img src="/assets/showcase/oura-health.png" alt="Oura-Ring-Gesundheitsassistent" />
</Card>
<Card title="Kev's Dream Team (14+ Agenten)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ Agenten unter einem Gateway mit einem Opus-4.5-Orchestrator, der an Codex-Worker delegiert. Umfassender [technischer Bericht](https://github.com/adam91holt/orchestrated-ai-articles) über das Dream-Team-Lineup, Modellauswahl, Sandboxing, Webhooks, Heartbeats und Delegationsflüsse. [Clawdspace](https://github.com/adam91holt/clawdspace) für Agent-Sandboxing. [Blogbeitrag](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI für Linear, die sich in agentische Workflows integriert (Claude Code, OpenClaw). Issues, Projekte und Workflows aus dem Terminal verwalten. Erster externer PR gemergt!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Nachrichten über Beeper Desktop lesen, senden und archivieren. Verwendet die lokale MCP-API von Beeper, damit Agenten all Ihre Chats (iMessage, WhatsApp usw.) an einem Ort verwalten können.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Automatisierung & Workflows

<p className="showcase-section-intro">
  Planung, Browser-Steuerung, Support-Schleifen und die Produktseite vom Typ „Erledige die Aufgabe einfach für mich“.
</p>

<CardGroup cols={2}>

<Card title="Winix-Luftreiniger-Steuerung" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hat die Steuerung des Luftreinigers entdeckt und bestätigt, dann übernimmt OpenClaw das Management der Raumluftqualität.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-Luftreiniger-Steuerung über OpenClaw" />
</Card>

<Card title="Schöne Himmelsaufnahmen" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Ausgelöst durch eine Dachkamera: OpenClaw soll ein Himmelsfoto aufnehmen, wann immer es hübsch aussieht — es hat einen Skill entworfen und das Foto aufgenommen.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Von OpenClaw aufgenommenes Himmelsbild der Dachkamera" />
</Card>

<Card title="Visuelle Morgenbriefing-Szene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Ein geplanter Prompt erzeugt jeden Morgen ein einzelnes „Szenen“-Bild (Wetter, Aufgaben, Datum, Lieblingsbeitrag/-zitat) über eine OpenClaw-Persona.
</Card>

<Card title="Padel-Platzbuchung" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Verfügbarkeitsprüfung und Buchungs-CLI für Playtomic. Verpassen Sie nie wieder einen freien Platz.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-Screenshot" />
</Card>

<Card title="Accounting Intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  Sammelt PDFs aus E-Mails und bereitet Dokumente für die Steuerberatung vor. Monatliche Buchhaltung auf Autopilot.
</Card>

<Card title="Couch-Potato-Entwicklermodus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Komplette persönliche Website per Telegram neu aufgebaut, während Netflix lief — Notion → Astro, 18 Beiträge migriert, DNS zu Cloudflare. Nie einen Laptop geöffnet.
</Card>

<Card title="Agent für Jobsuche" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Durchsucht Stellenangebote, gleicht sie mit Lebenslauf-Schlüsselwörtern ab und gibt relevante Möglichkeiten mit Links zurück. In 30 Minuten mit der JSearch-API gebaut.
</Card>

<Card title="Jira-Skill-Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw wurde mit Jira verbunden und erzeugte dann on the fly einen neuen Skill (bevor er auf ClawHub existierte).
</Card>

<Card title="Todoist-Skill über Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist-Aufgaben automatisiert und OpenClaw den Skill direkt im Telegram-Chat erzeugen lassen.
</Card>

<Card title="TradingView-Analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldet sich per Browser-Automatisierung bei TradingView an, erstellt Screenshots von Charts und führt bei Bedarf technische Analysen durch. Keine API nötig — nur Browser-Steuerung.
</Card>

<Card title="Slack-Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Beobachtet den Slack-Kanal des Unternehmens, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Hat autonom einen Produktionsfehler in einer ausgerollten App behoben, ohne darum gebeten worden zu sein.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Wissen & Memory

<p className="showcase-section-intro">
  Systeme, die persönliches oder Teamwissen indexieren, durchsuchen, speichern und darüber schlussfolgern.
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinesisch lernen" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Lern-Engine für Chinesisch mit Aussprache-Feedback und Lernabläufen über OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh Aussprache-Feedback" />
</Card>

<Card title="WhatsApp-Memory-Tresor" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  Importiert vollständige WhatsApp-Exporte, transkribiert über 1.000 Sprachnotizen, gleicht sie mit Git-Logs ab und gibt verlinkte Markdown-Berichte aus.
</Card>

<Card title="Karakeep semantische Suche" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Fügt Karakeep-Lesezeichen Vektorsuche mit Qdrant + OpenAI/Ollama-Embeddings hinzu.
</Card>

<Card title="Inside-Out-2-Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  Separater Memory-Manager, der Sitzungsdateien in Erinnerungen → Überzeugungen → ein sich entwickelndes Selbstmodell umwandelt.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Sprache & Telefon

<p className="showcase-section-intro">
  Sprachbasierte Einstiegspunkte, Telefon-Bridges und transkriptionsintensive Workflows.
</p>

<CardGroup cols={2}>

<Card title="Clawdia-Telefon-Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi-Sprachassistent ↔ OpenClaw-HTTP-Bridge. Telefonate mit Ihrem Agenten nahezu in Echtzeit.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audiotranskription über OpenRouter (Gemini usw.). Verfügbar auf ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Infrastruktur & Bereitstellung

<p className="showcase-section-intro">
  Packaging, Bereitstellung und Integrationen, die OpenClaw einfacher ausführbar und erweiterbar machen.
</p>

<CardGroup cols={2}>

<Card title="Home-Assistant-Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  OpenClaw-Gateway läuft auf Home Assistant OS mit Unterstützung für SSH-Tunnel und persistentem Status.
</Card>

<Card title="Home-Assistant-Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Home-Assistant-Geräte per natürlicher Sprache steuern und automatisieren.
</Card>

<Card title="Nix-Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Batteries-included, nixifizierte OpenClaw-Konfiguration für reproduzierbare Bereitstellungen.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Kalender-Skill mit khal/vdirsyncer. Selbst gehostete Kalenderintegration.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Zuhause & Hardware

<p className="showcase-section-intro">
  Die physische Seite von OpenClaw: Zuhause, Sensoren, Kameras, Staubsauger und andere Geräte.
</p>

<CardGroup cols={2}>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Nix-native Heimautomatisierung mit OpenClaw als Oberfläche sowie schönen Grafana-Dashboards.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome-Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Steuern Sie Ihren Roborock-Saugroboter durch natürliche Konversation.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-Status" />
</Card>

</CardGroup>

## Community-Projekte

<p className="showcase-section-intro">
  Dinge, die über einen einzelnen Workflow hinaus zu breiteren Produkten oder Ökosystemen gewachsen sind.
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  Vollständiger Marktplatz für Astronomieausrüstung. Mit/durch das OpenClaw-Ökosystem gebaut.
</Card>

</CardGroup>

---

## Projekt einreichen

<p className="showcase-section-intro">
  Wenn Sie mit OpenClaw etwas Interessantes bauen, schicken Sie es uns. Gute Screenshots und konkrete Ergebnisse helfen.
</p>

Haben Sie etwas zu teilen? Wir würden es gern vorstellen!

<Steps>
  <Step title="Teilen">
    Posten Sie es in [#self-promotion auf Discord](https://discord.gg/clawd) oder [twittern Sie an @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Details angeben">
    Sagen Sie uns, was es macht, verlinken Sie das Repo/die Demo und teilen Sie einen Screenshot, falls Sie einen haben
  </Step>
  <Step title="Vorgestellt werden">
    Wir fügen herausragende Projekte dieser Seite hinzu
  </Step>
</Steps>
