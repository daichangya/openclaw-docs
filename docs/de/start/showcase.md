---
description: Real-world OpenClaw projects from the community
read_when:
    - Sie suchen nach echten Anwendungsbeispielen für OpenClaw.
    - Sie aktualisieren die Highlights von Community-Projekten.
summary: Von der Community entwickelte Projekte und Integrationen auf Basis von OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-15T06:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

{/* markdownlint-disable MD033 */}

# Showcase

<div className="showcase-hero">
  <p className="showcase-kicker">Entwickelt in Chats, Terminals, Browsern und Wohnzimmern</p>
  <p className="showcase-lead">
    OpenClaw-Projekte sind keine Spielzeug-Demos. Menschen liefern PR-Review-Schleifen, Mobile-Apps, Heimautomatisierung,
    Sprachsysteme, Devtools und speicherintensive Workflows über die Kanäle aus, die sie ohnehin bereits nutzen.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Demos ansehen</a>
    <a href="#fresh-from-discord">Projekte durchsuchen</a>
    <a href="https://discord.gg/clawd">Deines teilen</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Chat-native Builds</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, Web-Chat und terminalorientierte Workflows.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Echte Automatisierung</strong>
      <span>Buchung, Einkauf, Support, Berichterstellung und Browser-Steuerung, ohne auf eine API warten zu müssen.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Lokal + physische Welt</strong>
      <span>Drucker, Staubsauger, Kameras, Gesundheitsdaten, Heimsysteme und persönliche Wissensdatenbanken.</span>
    </div>
  </div>
</div>

<Info>
**Möchten Sie vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [markieren Sie @openclaw auf X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Videos</a>
  <a href="#fresh-from-discord">Neu von Discord</a>
  <a href="#automation-workflows">Automatisierung</a>
  <a href="#knowledge-memory">Memory</a>
  <a href="#voice-phone">Stimme &amp; Telefon</a>
  <a href="#infrastructure-deployment">Infrastruktur</a>
  <a href="#home-hardware">Zuhause &amp; Hardware</a>
  <a href="#community-projects">Community</a>
  <a href="#submit-your-project">Projekt einreichen</a>
</div>

<h2 id="videos">Videos</h2>

<p className="showcase-section-intro">
  Beginnen Sie hier, wenn Sie den kürzesten Weg von „Was ist das?“ zu „Okay, ich verstehe es“ wollen.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Komplette Einrichtungsanleitung</h3>
    <p>VelvetShark, 28 Minuten. Installieren, einrichten und von Anfang bis Ende zum ersten funktionierenden Assistenten gelangen.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Auf YouTube ansehen</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Community-Showcase-Zusammenschnitt</h3>
    <p>Ein schnellerer Überblick über reale Projekte, Oberflächen und Workflows rund um OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Auf YouTube ansehen</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Projekte in freier Wildbahn</h3>
    <p>Beispiele aus der Community, von chat-nativen Coding-Schleifen bis hin zu Hardware und persönlicher Automatisierung.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Auf YouTube ansehen</a>
  </div>
</div>

<h2 id="fresh-from-discord">Neu von Discord</h2>

<p className="showcase-section-intro">
  Aktuelle Highlights aus Coding, Devtools, Mobile und chat-nativem Produktbau.
</p>

<CardGroup cols={2}>

<Card title="PR-Review → Telegram-Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode schließt die Änderung ab → öffnet einen PR → OpenClaw prüft den Diff und antwortet in Telegram mit „kleineren Vorschlägen“ plus einem klaren Merge-Urteil (einschließlich kritischer Korrekturen, die zuerst angewendet werden müssen).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw-PR-Review-Feedback in Telegram" />
</Card>

<Card title="Wine-Cellar-Skill in Minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

„Robby“ (@openclaw) nach einem lokalen Wine-Cellar-Skill gefragt. Er fordert einen Beispiel-CSV-Export und den Speicherort an und erstellt/testet den Skill dann schnell (im Beispiel 962 Flaschen).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw erstellt einen lokalen Wine-Cellar-Skill aus CSV" />
</Card>

<Card title="Tesco-Shop-Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Essensplan → Standardartikel → Lieferfenster buchen → Bestellung bestätigen. Keine APIs, nur Browser-Steuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-Shop-Automatisierung per Chat" />
</Card>

<Card title="SNAG Screenshot-zu-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Per Hotkey einen Bildschirmbereich auswählen → Gemini-Vision → sofortiges Markdown in Ihrer Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG-Screenshot-zu-Markdown-Tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zum Verwalten von Skills/Befehlen über Agents, Claude, Codex und OpenClaw hinweg.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI-App" />
</Card>

<Card title="Telegram-Sprachnotizen (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Bindet papla.media-TTS ein und sendet Ergebnisse als Telegram-Sprachnotizen (ohne nervige automatische Wiedergabe).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-Sprachnotizausgabe aus TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Per Homebrew installierter Helfer zum Auflisten/Prüfen/Beobachten lokaler OpenAI-Codex-Sitzungen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor auf ClawHub" />
</Card>

<Card title="Bambu-3D-Druckersteuerung" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-Drucker steuern und Fehler beheben: Status, Aufträge, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu-CLI-Skill auf ClawHub" />
</Card>

<Card title="Wiener Verkehr (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Echtzeit-Abfahrten, Störungen, Aufzugsstatus und Routenplanung für den öffentlichen Verkehr in Wien.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener-Linien-Skill" />
</Card>

<Card title="ParentPay-Schulmahlzeiten" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulmahlzeiten in Großbritannien über ParentPay. Verwendet Mauskoordinaten für zuverlässiges Klicken auf Tabellenzellen.
</Card>

<Card title="R2-Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

In Cloudflare R2/S3 hochladen und sichere vorab signierte Download-Links erzeugen. Perfekt für entfernte OpenClaw-Instanzen.
</Card>

<Card title="iOS-App über Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Eine vollständige iOS-App mit Karten und Sprachaufzeichnung erstellt und vollständig per Telegram-Chat nach TestFlight bereitgestellt.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-App auf TestFlight" />
</Card>

<Card title="Oura-Ring-Gesundheitsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Oura-Ring-Daten mit Kalender, Terminen und Fitnessstudio-Plan integriert.

  <img src="/assets/showcase/oura-health.png" alt="Oura-Ring-Gesundheitsassistent" />
</Card>
<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ Agents unter einem Gateway mit Opus-4.5-Orchestrator, der an Codex-Worker delegiert. Umfassende [technische Ausarbeitung](https://github.com/adam91holt/orchestrated-ai-articles) zu Dream-Team-Aufstellung, Modellauswahl, Sandboxing, Webhooks, Heartbeats und Delegationsabläufen. [Clawdspace](https://github.com/adam91holt/clawdspace) für Agent-Sandboxing. [Blogbeitrag](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI für Linear, die sich in agentische Workflows (Claude Code, OpenClaw) integriert. Issues, Projekte und Workflows aus dem Terminal verwalten. Erster externer PR gemergt!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Nachrichten über Beeper Desktop lesen, senden und archivieren. Nutzt die lokale MCP-API von Beeper, sodass Agents alle Ihre Chats (iMessage, WhatsApp usw.) an einem Ort verwalten können.
</Card>

</CardGroup>

<h2 id="automation-workflows">Automatisierung &amp; Workflows</h2>

<p className="showcase-section-intro">
  Planung, Browser-Steuerung, Support-Schleifen und die Produktseite „erledige die Aufgabe einfach für mich“.
</p>

<CardGroup cols={2}>

<Card title="Winix-Luftreinigersteuerung" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hat die Steuerung des Luftreinigers entdeckt und bestätigt, dann übernimmt OpenClaw die Verwaltung der Raumluftqualität.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-Luftreinigersteuerung über OpenClaw" />
</Card>

<Card title="Schöne Himmelsaufnahmen mit der Kamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Ausgelöst von einer Dachkamera: OpenClaw gebeten, ein Himmelsfoto zu machen, wenn es schön aussieht — es hat einen Skill entworfen und das Foto aufgenommen.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Von OpenClaw aufgenommenes Himmelsfoto mit der Dachkamera" />
</Card>

<Card title="Visuelle Morning-Briefing-Szene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Ein geplanter Prompt erzeugt jeden Morgen ein einzelnes „Szenen“-Bild (Wetter, Aufgaben, Datum, Lieblingsbeitrag/-zitat) über eine OpenClaw-Persona.
</Card>

<Card title="Padel-Platzbuchung" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic-Verfügbarkeitsprüfer + Buchungs-CLI. Verpassen Sie nie wieder einen freien Platz.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-Screenshot" />
</Card>

<Card title="Buchhaltungsaufnahme" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  Sammelt PDFs aus E-Mails und bereitet Dokumente für den Steuerberater vor. Monatliche Buchhaltung auf Autopilot.
</Card>

<Card title="Couch-Potato-Entwicklermodus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Komplette persönliche Website über Telegram neu aufgebaut, während nebenbei Netflix lief — Notion → Astro, 18 Beiträge migriert, DNS zu Cloudflare. Nie einen Laptop geöffnet.
</Card>

<Card title="Job-Such-Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Durchsucht Stellenangebote, gleicht sie mit Lebenslauf-Schlüsselwörtern ab und liefert relevante Möglichkeiten mit Links zurück. In 30 Minuten mit der JSearch-API erstellt.
</Card>

<Card title="Jira-Skill-Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw hat sich mit Jira verbunden und dann spontan einen neuen Skill erzeugt (bevor er auf ClawHub existierte).
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

Überwacht den Slack-Kanal des Unternehmens, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Hat selbstständig einen Produktionsfehler in einer bereitgestellten App behoben, ohne dazu aufgefordert zu werden.
</Card>

</CardGroup>

<h2 id="knowledge-memory">Wissen &amp; Memory</h2>

<p className="showcase-section-intro">
  Systeme, die persönliches oder Team-Wissen indizieren, durchsuchen, speichern und darüber schlussfolgern.
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinesisch lernen" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Lernsystem für Chinesisch mit Aussprache-Feedback und Lernabläufen über OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh Aussprache-Feedback" />
</Card>

<Card title="WhatsApp Memory Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  Nimmt vollständige WhatsApp-Exporte auf, transkribiert mehr als 1.000 Sprachnotizen, gleicht sie mit Git-Logs ab und gibt verknüpfte Markdown-Berichte aus.
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

<h2 id="voice-phone">Stimme &amp; Telefon</h2>

<p className="showcase-section-intro">
  Sprache-zuerst-Einstiegspunkte, Telefon-Bridges und transkriptionsintensive Workflows.
</p>

<CardGroup cols={2}>

<Card title="Clawdia-Telefon-Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi-Sprachassistent ↔ OpenClaw-HTTP-Bridge. Nahezu Echtzeit-Telefonate mit Ihrem Agent.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audiotranskription über OpenRouter (Gemini usw.). Verfügbar auf ClawHub.
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">Infrastruktur &amp; Bereitstellung</h2>

<p className="showcase-section-intro">
  Paketierung, Bereitstellung und Integrationen, die OpenClaw einfacher ausführbar und erweiterbar machen.
</p>

<CardGroup cols={2}>

<Card title="Home-Assistant-Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  OpenClaw-Gateway auf Home Assistant OS mit SSH-Tunnel-Unterstützung und persistentem Zustand.
</Card>

<Card title="Home-Assistant-Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Home-Assistant-Geräte per natürlicher Sprache steuern und automatisieren.
</Card>

<Card title="Nix-Paketierung" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Nixifizierte OpenClaw-Konfiguration mit allem Nötigen für reproduzierbare Bereitstellungen.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Kalender-Skill mit khal/vdirsyncer. Selbst gehostete Kalenderintegration.
</Card>

</CardGroup>

<h2 id="home-hardware">Zuhause &amp; Hardware</h2>

<p className="showcase-section-intro">
  Die physische Welt von OpenClaw: Zuhause, Sensoren, Kameras, Staubsauger und andere Geräte.
</p>

<CardGroup cols={2}>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Nix-native Heimautomatisierung mit OpenClaw als Oberfläche sowie ansprechenden Grafana-Dashboards.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome-Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Steuern Sie Ihren Roborock-Saugroboter über natürliche Konversation.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-Status" />
</Card>

</CardGroup>

<h2 id="community-projects">Community-Projekte</h2>

<p className="showcase-section-intro">
  Dinge, die über einen einzelnen Workflow hinaus zu umfassenderen Produkten oder Ökosystemen gewachsen sind.
</p>

<CardGroup cols={2}>

<Card title="StarSwap-Marktplatz" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  Vollständiger Marktplatz für Astronomieausrüstung. Mit/durch das OpenClaw-Ökosystem aufgebaut.
</Card>

</CardGroup>

---

<h2 id="submit-your-project">Reichen Sie Ihr Projekt ein</h2>

<p className="showcase-section-intro">
  Wenn Sie mit OpenClaw etwas Interessantes bauen, schicken Sie es uns. Aussagekräftige Screenshots und konkrete Ergebnisse helfen.
</p>

Haben Sie etwas zu teilen? Wir würden es gerne vorstellen!

<Steps>
  <Step title="Teilen">
    Posten Sie in [#self-promotion auf Discord](https://discord.gg/clawd) oder [tweeten Sie an @openclaw](https://x.com/openclaw)
  </Step>
  <Step title="Details angeben">
    Sagen Sie uns, was es macht, verlinken Sie das Repo/die Demo und teilen Sie einen Screenshot, wenn Sie einen haben
  </Step>
  <Step title="Vorgestellt werden">
    Wir fügen herausragende Projekte dieser Seite hinzu
  </Step>
</Steps>
