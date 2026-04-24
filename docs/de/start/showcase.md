---
description: Real-world OpenClaw projects from the community
read_when:
    - Suche nach echten Anwendungsbeispielen für OpenClaw.
    - Highlights von Community-Projekten aktualisieren.
summary: Community-Projekte und Integrationen, die mit OpenClaw entwickelt wurden
title: Showcase
x-i18n:
    generated_at: "2026-04-24T07:00:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

OpenClaw-Projekte sind keine Spielzeug-Demos. Menschen setzen PR-Review-Loops, mobile Apps, Home Automation, Sprachsysteme, Devtools und speicherintensive Workflows aus den Channels um, die sie ohnehin schon nutzen — chat-native Builds auf Telegram, WhatsApp, Discord und im Terminal; echte Automatisierung für Buchungen, Einkäufe und Support, ohne auf eine API warten zu müssen; und Integrationen in die physische Welt mit Druckern, Staubsaugern, Kameras und Heimsystemen.

<Info>
**Möchten Sie vorgestellt werden?** Teilen Sie Ihr Projekt in [#self-promotion auf Discord](https://discord.gg/clawd) oder [taggen Sie @openclaw auf X](https://x.com/openclaw).
</Info>

## Videos

Beginnen Sie hier, wenn Sie den kürzesten Weg von „Was ist das?“ zu „Okay, ich verstehe“ möchten.

<CardGroup cols={3}>

<Card title="Komplette Einrichtungsanleitung" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 Minuten. Installieren, onboarden und von Anfang bis Ende zum ersten funktionierenden Assistant kommen.
</Card>

<Card title="Community-Showcase-Reel" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Ein schnellerer Durchlauf durch echte Projekte, Oberflächen und Workflows rund um OpenClaw.
</Card>

<Card title="Projekte in freier Wildbahn" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Beispiele aus der Community, von chat-nativen Coding-Loops bis zu Hardware und persönlicher Automatisierung.
</Card>

</CardGroup>

## Frisch von Discord

Aktuelle Highlights aus Coding, Devtools, Mobile und chat-nativer Produktentwicklung.

<CardGroup cols={2}>

<Card title="PR-Review zu Telegram-Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode beendet die Änderung, öffnet einen PR, OpenClaw prüft den Diff und antwortet in Telegram mit Vorschlägen plus einem klaren Merge-Urteil.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw-PR-Review-Feedback in Telegram zugestellt" />
</Card>

<Card title="Wine-Cellar-Skill in Minuten" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

„Robby“ (@openclaw) nach einem lokalen Wine-Cellar-Skill gefragt. Er fordert einen Beispiel-CSV-Export und einen Speicherpfad an, dann baut und testet er den Skill (im Beispiel 962 Flaschen).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw erstellt einen lokalen Wine-Cellar-Skill aus CSV" />
</Card>

<Card title="Tesco-Shop-Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Wöchentlicher Meal-Plan, Stammartikel, Lieferfenster buchen, Bestellung bestätigen. Keine APIs, nur Browser-Steuerung.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco-Shop-Automatisierung per Chat" />
</Card>

<Card title="SNAG Screenshot-zu-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Per Hotkey einen Bildschirmbereich wählen, Gemini Vision, sofort Markdown in der Zwischenablage.

  <img src="/assets/showcase/snag.png" alt="SNAG Screenshot-zu-Markdown-Tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Desktop-App zur Verwaltung von Skills und Befehlen über Agents, Claude, Codex und OpenClaw hinweg.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents-UI-App" />
</Card>

<Card title="Telegram-Sprachnotizen (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Umschließt papla.media TTS und sendet Ergebnisse als Telegram-Sprachnotizen (kein nerviges Autoplay).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram-Sprachnotiz-Ausgabe aus TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Per Homebrew installierter Helper zum Auflisten, Prüfen und Beobachten lokaler OpenAI-Codex-Sitzungen (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor auf ClawHub" />
</Card>

<Card title="Bambu-3D-Druckersteuerung" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab-Drucker steuern und Fehler beheben: Status, Jobs, Kamera, AMS, Kalibrierung und mehr.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu-CLI-Skill auf ClawHub" />
</Card>

<Card title="Wiener Verkehr (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Echtzeit-Abfahrten, Störungen, Aufzugsstatus und Routing für Wiens öffentlichen Nahverkehr.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener-Linien-Skill auf ClawHub" />
</Card>

<Card title="ParentPay-Schulmahlzeiten" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Automatisierte Buchung von Schulmahlzeiten im Vereinigten Königreich über ParentPay. Verwendet Mauskoordinaten für zuverlässiges Klicken auf Tabellenzellen.
</Card>

<Card title="R2-Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Upload nach Cloudflare R2/S3 und Erzeugung sicherer Presigned-Download-Links. Nützlich für Remote-OpenClaw-Instanzen.
</Card>

<Card title="iOS-App über Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Eine vollständige iOS-App mit Karten und Sprachaufnahme gebaut und vollständig per Telegram-Chat zu TestFlight ausgerollt.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-App auf TestFlight" />
</Card>

<Card title="Oura-Ring-Gesundheitsassistent" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Persönlicher KI-Gesundheitsassistent, der Oura-Ring-Daten mit Kalender, Terminen und Fitnessstudio-Zeitplan integriert.

  <img src="/assets/showcase/oura-health.png" alt="Oura-Ring-Gesundheitsassistent" />
</Card>

<Card title="Kev's Dream Team (14+ Agenten)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ Agenten unter einem Gateway mit einem Opus-4.5-Orchestrator, der an Codex-Worker delegiert. Siehe das [technische Write-up](https://github.com/adam91holt/orchestrated-ai-articles) und [Clawdspace](https://github.com/adam91holt/clawdspace) für Agent-Sandboxing.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI für Linear, die sich in agentische Workflows (Claude Code, OpenClaw) integriert. Issues, Projekte und Workflows aus dem Terminal verwalten.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Nachrichten über Beeper Desktop lesen, senden und archivieren. Verwendet die lokale MCP-API von Beeper, sodass Agents all Ihre Chats (iMessage, WhatsApp und mehr) an einem Ort verwalten können.
</Card>

</CardGroup>

## Automatisierung und Workflows

Planung, Browser-Steuerung, Support-Loops und die Produktseite „mach die Aufgabe einfach für mich“.

<CardGroup cols={2}>

<Card title="Winix-Luftreiniger-Steuerung" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hat die Steuerung des Luftreinigers entdeckt und bestätigt, dann übernimmt OpenClaw die Verwaltung der Luftqualität im Raum.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix-Luftreiniger-Steuerung über OpenClaw" />
</Card>

<Card title="Schöne Himmelsfotos von der Kamera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Ausgelöst durch eine Dachkamera: OpenClaw bitten, ein Himmelsfoto zu machen, wann immer er schön aussieht. Es hat einen Skill entworfen und das Bild aufgenommen.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Von OpenClaw aufgenommenes Himmelsbild der Dachkamera" />
</Card>

<Card title="Visuelle Morning-Briefing-Szene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Ein geplanter Prompt erzeugt jeden Morgen ein Szenenbild (Wetter, Aufgaben, Datum, Lieblingspost oder Zitat) über eine OpenClaw-Persona.
</Card>

<Card title="Padel-Court-Buchung" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic-Verfügbarkeitsprüfung plus Buchungs-CLI. Nie wieder einen freien Court verpassen.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli-Screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Sammelt PDFs aus E-Mails und bereitet Dokumente für einen Steuerberater auf. Monatliche Buchhaltung auf Autopilot.
</Card>

<Card title="Couch-potato-dev-Modus" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Eine komplette persönliche Website per Telegram neu gebaut, während Netflix lief — Notion zu Astro, 18 Beiträge migriert, DNS zu Cloudflare. Laptop nie geöffnet.
</Card>

<Card title="Job-Such-Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Sucht Stellenanzeigen, gleicht sie mit CV-Schlüsselwörtern ab und liefert relevante Möglichkeiten mit Links zurück. In 30 Minuten mit der JSearch API gebaut.
</Card>

<Card title="Jira-Skill-Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw wurde mit Jira verbunden und erzeugte dann on the fly einen neuen Skill (bevor er auf ClawHub existierte).
</Card>

<Card title="Todoist-Skill über Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist-Aufgaben automatisiert und OpenClaw den Skill direkt im Telegram-Chat erzeugen lassen.
</Card>

<Card title="TradingView-Analyse" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Meldet sich per Browser-Automatisierung bei TradingView an, macht Screenshots von Charts und führt bei Bedarf technische Analysen durch. Keine API nötig — nur Browser-Steuerung.
</Card>

<Card title="Slack-Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Beobachtet einen Firmen-Slack-Channel, antwortet hilfreich und leitet Benachrichtigungen an Telegram weiter. Hat autonom einen Produktionsbug in einer ausgerollten App behoben, ohne darum gebeten zu werden.
</Card>

</CardGroup>

## Wissen und Memory

Systeme, die persönliches oder Team-Wissen indexieren, durchsuchen, erinnern und darüber schlussfolgern.

<CardGroup cols={2}>

<Card title="xuezh Chinesisch lernen" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Engine zum Chinesischlernen mit Aussprache-Feedback und Lernabläufen über OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh-Aussprache-Feedback" />
</Card>

<Card title="WhatsApp-Memory-Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Nimmt vollständige WhatsApp-Exporte auf, transkribiert 1k+ Sprachnotizen, gleicht sie mit Git-Logs ab und erzeugt verlinkte Markdown-Berichte.
</Card>

<Card title="Karakeep semantische Suche" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Fügt Karakeep-Bookmarks Vektorsuche mit Qdrant sowie OpenAI- oder Ollama-Embeddings hinzu.
</Card>

<Card title="Inside-Out-2-Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Separater Memory-Manager, der Sitzungsdateien in Erinnerungen, dann in Überzeugungen und schließlich in ein sich entwickelndes Selbstmodell verwandelt.
</Card>

</CardGroup>

## Sprache und Telefon

Sprachbasierte Einstiegspunkte, Telefon-Bridges und Workflows mit starkem Fokus auf Transkription.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi-Voice-Assistant-zu-OpenClaw-HTTP-Bridge. Nahezu Echtzeit-Telefonate mit Ihrem Agenten.
</Card>

<Card title="OpenRouter-Transkription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Mehrsprachige Audio-Transkription über OpenRouter (Gemini und mehr). Verfügbar auf ClawHub.
</Card>

</CardGroup>

## Infrastruktur und Bereitstellung

Packaging, Bereitstellung und Integrationen, die OpenClaw leichter ausführbar und erweiterbar machen.

<CardGroup cols={2}>

<Card title="Home-Assistant-Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw-Gateway auf Home Assistant OS mit Unterstützung für SSH-Tunnel und persistentem Status.
</Card>

<Card title="Home-Assistant-Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Home-Assistant-Geräte per natürlicher Sprache steuern und automatisieren.
</Card>

<Card title="Nix-Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Batteries-included, nixifiziertes OpenClaw-Setup für reproduzierbare Bereitstellungen.
</Card>

<Card title="CalDAV-Kalender" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Kalender-Skill mit khal und vdirsyncer. Self-hosted-Kalender-Integration.
</Card>

</CardGroup>

## Zuhause und Hardware

Die physische Seite von OpenClaw: Häuser, Sensoren, Kameras, Staubsauger und andere Geräte.

<CardGroup cols={2}>

<Card title="GoHome-Automatisierung" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix-native Home Automation mit OpenClaw als Oberfläche, plus Grafana-Dashboards.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome-Grafana-Dashboard" />
</Card>

<Card title="Roborock-Staubsauger" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Ihren Roborock-Roboterstaubsauger per natürlicher Konversation steuern.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock-Status" />
</Card>

</CardGroup>

## Community-Projekte

Dinge, die über einen einzelnen Workflow hinaus zu breiteren Produkten oder Ökosystemen gewachsen sind.

<CardGroup cols={2}>

<Card title="StarSwap-Marktplatz" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

Vollständiger Marktplatz für Astronomie-Ausrüstung. Mit und rund um das OpenClaw-Ökosystem gebaut.
</Card>

</CardGroup>

## Ihr Projekt einreichen

<Steps>
  <Step title="Teilen">
    Posten Sie in [#self-promotion auf Discord](https://discord.gg/clawd) oder [twittern Sie @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Details angeben">
    Sagen Sie uns, was es macht, verlinken Sie auf Repo oder Demo und teilen Sie einen Screenshot, falls vorhanden.
  </Step>
  <Step title="Vorgestellt werden">
    Herausragende Projekte fügen wir dieser Seite hinzu.
  </Step>
</Steps>

## Verwandt

- [Getting started](/de/start/getting-started)
- [OpenClaw](/de/start/openclaw)
