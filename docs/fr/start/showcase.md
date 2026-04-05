---
read_when:
    - Vous cherchez des exemples concrets d'utilisation d'OpenClaw
    - Vous mettez à jour les projets phares de la communauté
summary: Projets et intégrations créés par la communauté et propulsés par OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-04-05T12:55:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# Vitrine

De vrais projets issus de la communauté. Découvrez ce que les gens construisent avec OpenClaw.

<Info>
**Vous voulez figurer ici ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [identifiez @openclaw sur X](https://x.com/openclaw).
</Info>

## 🎥 OpenClaw en action

Visite guidée complète de l'installation (28 min) par VelvetShark.

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: l'IA auto-hébergée que Siri aurait dû être (installation complète)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Regarder sur YouTube](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="Vidéo de présentation d'OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Regarder sur YouTube](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="Présentation communautaire d'OpenClaw"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[Regarder sur YouTube](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Tout frais depuis Discord

<CardGroup cols={2}>

<Card title="Revue de PR → Retours sur Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine la modification → ouvre une PR → OpenClaw examine le diff et répond dans Telegram avec des « suggestions mineures » ainsi qu'un verdict de fusion clair (y compris les corrections critiques à appliquer d'abord).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Retours de revue de PR OpenClaw transmis dans Telegram" />
</Card>

<Card title="Skill cave à vin en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à « Robby » (@openclaw) un skill local pour cave à vin. Il demande un exemple d'export CSV + où le stocker, puis construit/teste rapidement le skill (962 bouteilles dans l'exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw créant un skill local de cave à vin à partir d'un CSV" />
</Card>

<Card title="Pilote automatique des courses Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de repas hebdomadaire → produits habituels → réservation d'un créneau de livraison → confirmation de la commande. Aucune API, uniquement du pilotage de navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation des courses Tesco via chat" />
</Card>

<Card title="SNAG capture d'écran vers Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Raccourci clavier sur une zone de l'écran → vision Gemini → Markdown instantané dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG de capture d'écran vers Markdown" />
</Card>

<Card title="UI Agents" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Application de bureau pour gérer les skills/commandes entre Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Application UI Agents" />
</Card>

<Card title="Notes vocales Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Communauté** • `voice` `tts` `telegram`

Encapsule le TTS de papla.media et envoie les résultats sous forme de notes vocales Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Sortie en note vocale Telegram à partir du TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Assistant installé via Homebrew pour lister/inspecter/surveiller les sessions locales OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d'imprimante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, tâches, caméra, AMS, calibration, et plus encore.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports de Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée des repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour un clic fiable sur les cellules de tableau.
</Card>

<Card title="Envoi R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléversez vers Cloudflare R2/S3 et générez des liens de téléchargement présignés sécurisés. Parfait pour les instances OpenClaw distantes.
</Card>

<Card title="Application iOS via Telegram" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

A créé une application iOS complète avec cartes et enregistrement vocal, déployée sur TestFlight entièrement via chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Application iOS sur TestFlight" />
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Assistant de santé IA personnel intégrant les données Oura ring avec le calendrier, les rendez-vous et le planning de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé Oura ring" />
</Card>
<Card title="L'équipe de rêve de Kev (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ agents sous une seule gateway avec un orchestrateur Opus 4.5 déléguant à des workers Codex. [Présentation technique complète](https://github.com/adam91holt/orchestrated-ai-articles) couvrant la composition de la Dream Team, la sélection des modèles, le sandboxing, les webhooks, les heartbeats et les flux de délégation. [Clawdspace](https://github.com/adam91holt/clawdspace) pour le sandboxing des agents. [Article de blog](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI pour Linear qui s'intègre aux workflows agentiques (Claude Code, OpenClaw). Gérez les tickets, projets et workflows depuis le terminal. Première PR externe fusionnée !
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Lisez, envoyez et archivez des messages via Beeper Desktop. Utilise l'API MCP locale de Beeper pour que les agents puissent gérer toutes vos discussions (iMessage, WhatsApp, etc.) au même endroit.
</Card>

</CardGroup>

## 🤖 Automatisation et workflows

<CardGroup cols={2}>

<Card title="Contrôle du purificateur d'air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les commandes du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l'air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle du purificateur d'air Winix via OpenClaw" />
</Card>

<Card title="Belles photos du ciel par caméra" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Déclenché par une caméra sur le toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu'il est beau — il a conçu un skill et pris le cliché.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Photo du ciel prise par la caméra de toit avec OpenClaw" />
</Card>

<Card title="Scène visuelle pour briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Une invite planifiée génère chaque matin une image de « scène » unique (météo, tâches, date, publication/citation favorite) via un persona OpenClaw.
</Card>

<Card title="Réservation de terrain de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Vérificateur de disponibilité Playtomic + CLI de réservation. Ne manquez plus jamais un terrain libre.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Capture d'écran de padel-cli" />
</Card>

<Card title="Collecte comptable" icon="file-invoice-dollar">
  **Communauté** • `automation` `email` `pdf`
  
  Récupère les PDF depuis les e-mails, prépare les documents pour le conseiller fiscal. Comptabilité mensuelle en pilote automatique.
</Card>

<Card title="Mode dev depuis le canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

A reconstruit tout son site personnel via Telegram en regardant Netflix — Notion → Astro, 18 articles migrés, DNS vers Cloudflare. N'a jamais ouvert un ordinateur portable.
</Card>

<Card title="Agent de recherche d'emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d'emploi, les compare aux mots-clés du CV et renvoie les opportunités pertinentes avec liens. Construit en 30 minutes avec l'API JSearch.
</Card>

<Card title="Créateur de skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw s'est connecté à Jira, puis a généré un nouveau skill à la volée (avant même qu'il n'existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

A automatisé des tâches Todoist et fait générer le skill directement par OpenClaw dans le chat Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView via automatisation de navigateur, capture des graphiques et effectue une analyse technique à la demande. Aucune API nécessaire — uniquement le contrôle du navigateur.
</Card>

<Card title="Support auto sur Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille le canal Slack de l'entreprise, répond utilement et transfère les notifications vers Telegram. A corrigé de façon autonome un bug de production dans une application déployée sans qu'on le lui demande.
</Card>

</CardGroup>

## 🧠 Connaissances et mémoire

<CardGroup cols={2}>

<Card title="Apprentissage du chinois xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Moteur d'apprentissage du chinois avec retour sur la prononciation et parcours d'étude via OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Retour sur la prononciation xuezh" />
</Card>

<Card title="Coffre-fort mémoire WhatsApp" icon="vault">
  **Communauté** • `memory` `transcription` `indexing`
  
  Ingère des exports complets WhatsApp, transcrit plus de 1 000 notes vocales, recoupe avec les journaux git et produit des rapports Markdown liés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Ajoute la recherche vectorielle aux favoris Karakeep à l'aide des embeddings Qdrant + OpenAI/Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Communauté** • `memory` `beliefs` `self-model`
  
  Gestionnaire de mémoire séparé qui transforme les fichiers de session en souvenirs → croyances → modèle de soi en évolution.
</Card>

</CardGroup>

## 🎙️ Voix et téléphone

<CardGroup cols={2}>

<Card title="Pont téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Pont HTTP entre l'assistant vocal Vapi et OpenClaw. Appels téléphoniques quasi temps réel avec votre agent.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini, etc.). Disponible sur ClawHub.
</Card>

</CardGroup>

## 🏗️ Infrastructure et déploiement

<CardGroup cols={2}>

<Card title="Module complémentaire Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw exécutée sur Home Assistant OS avec prise en charge des tunnels SSH et état persistant.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Contrôlez et automatisez les appareils Home Assistant en langage naturel.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Configuration OpenClaw nixifiée prête à l'emploi pour des déploiements reproductibles.
</Card>

<Card title="Calendrier CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill de calendrier utilisant khal/vdirsyncer. Intégration de calendrier auto-hébergée.
</Card>

</CardGroup>

## 🏠 Maison et matériel

<CardGroup cols={2}>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Automatisation domestique native Nix avec OpenClaw comme interface, plus de superbes tableaux de bord Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Tableau de bord Grafana GoHome" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Contrôlez votre aspirateur robot Roborock par conversation naturelle.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="État de Roborock" />
</Card>

</CardGroup>

## 🌟 Projets de la communauté

<CardGroup cols={2}>

<Card title="Place de marché StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`
  
  Place de marché complète pour le matériel d'astronomie. Construite avec/autour de l'écosystème OpenClaw.
</Card>

</CardGroup>

---

## Soumettez votre projet

Vous avez quelque chose à partager ? Nous serions ravis de le mettre en avant !

<Steps>
  <Step title="Partagez-le">
    Publiez dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw dans un post sur X](https://x.com/openclaw)
  </Step>
  <Step title="Incluez des détails">
    Dites-nous ce que cela fait, ajoutez un lien vers le dépôt/la démo, partagez une capture d'écran si vous en avez une
  </Step>
  <Step title="Soyez mis en avant">
    Nous ajouterons les projets les plus remarquables à cette page
  </Step>
</Steps>
