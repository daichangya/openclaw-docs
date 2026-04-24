---
description: Real-world OpenClaw projects from the community
read_when:
    - Vous cherchez de vrais exemples d’utilisation d’OpenClaw
    - mise à jour des projets phares de la communauté
summary: projets et intégrations créés par la communauté et propulsés par OpenClaw
title: vitrine
x-i18n:
    generated_at: "2026-04-24T07:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

Les projets OpenClaw ne sont pas des démos gadgets. Des personnes livrent des boucles de revue de PR, des apps mobiles, de l’automatisation domestique, des systèmes vocaux, des devtools et des flux riches en mémoire depuis les canaux qu’elles utilisent déjà — des builds natifs au chat sur Telegram, WhatsApp, Discord et terminaux ; de la vraie automatisation pour la réservation, les achats et le support sans attendre une API ; et des intégrations avec le monde physique via imprimantes, aspirateurs, caméras et systèmes domestiques.

<Info>
**Vous voulez être mis en avant ?** Partagez votre projet dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [mentionnez @openclaw sur X](https://x.com/openclaw).
</Info>

## Vidéos

Commencez ici si vous voulez le chemin le plus court entre « qu’est-ce que c’est ? » et « ok, j’ai compris ».

<CardGroup cols={3}>

<Card title="Guide complet de configuration" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minutes. Installer, intégrer, et arriver à un premier assistant fonctionnel de bout en bout.
</Card>

<Card title="Montage vitrine de la communauté" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Un passage plus rapide à travers de vrais projets, surfaces et flux de travail construits autour d’OpenClaw.
</Card>

<Card title="Projets en conditions réelles" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Exemples de la communauté, des boucles de codage natives au chat jusqu’au matériel et à l’automatisation personnelle.
</Card>

</CardGroup>

## Nouveautés depuis Discord

Projets remarquables récents dans le codage, les devtools, le mobile et la création de produits natifs au chat.

<CardGroup cols={2}>

<Card title="Revue de PR vers retour Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode termine la modification, ouvre une PR, OpenClaw examine le diff et répond dans Telegram avec des suggestions plus un verdict clair de fusion.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Retour de revue de PR OpenClaw livré dans Telegram" />
</Card>

<Card title="Skill cave à vin en quelques minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

A demandé à « Robby » (@openclaw) un skill local de cave à vin. Il demande un export CSV d’exemple et un chemin de stockage, puis construit et teste le skill (962 bouteilles dans l’exemple).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw construisant un skill local de cave à vin à partir d’un CSV" />
</Card>

<Card title="Pilote automatique Tesco Shop" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plan de repas hebdomadaire, achats habituels, réservation d’un créneau de livraison, confirmation de commande. Pas d’API, juste du contrôle navigateur.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automatisation Tesco shop via chat" />
</Card>

<Card title="SNAG capture d’écran vers Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Définissez un raccourci sur une région d’écran, utilisez Gemini vision, obtenez instantanément du Markdown dans votre presse-papiers.

  <img src="/assets/showcase/snag.png" alt="Outil SNAG capture d’écran vers markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

App de bureau pour gérer skills et commandes sur Agents, Claude, Codex et OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="App Agents UI" />
</Card>

<Card title="Notes vocales Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Communauté** • `voice` `tts` `telegram`

Enveloppe le TTS papla.media et envoie les résultats comme notes vocales Telegram (sans lecture automatique agaçante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Sortie de note vocale Telegram depuis le TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper installé via Homebrew pour lister, inspecter et surveiller les sessions locales OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor sur ClawHub" />
</Card>

<Card title="Contrôle d’imprimante 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Contrôlez et dépannez les imprimantes BambuLab : état, travaux, caméra, AMS, calibration, etc.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI sur ClawHub" />
</Card>

<Card title="Transports de Vienne (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Départs en temps réel, perturbations, état des ascenseurs et itinéraires pour les transports publics de Vienne.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien sur ClawHub" />
</Card>

<Card title="Repas scolaires ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Réservation automatisée des repas scolaires au Royaume-Uni via ParentPay. Utilise les coordonnées de la souris pour cliquer de manière fiable sur les cellules du tableau.
</Card>

<Card title="Téléversement R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Téléverse vers Cloudflare R2/S3 et génère des liens de téléchargement presignés sécurisés. Utile pour les instances OpenClaw distantes.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

A construit une app iOS complète avec cartes et enregistrement vocal, déployée sur TestFlight entièrement via le chat Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="App iOS sur TestFlight" />
</Card>

<Card title="Assistant santé Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistant santé IA personnel intégrant les données Oura ring avec le calendrier, les rendez-vous et le planning de salle de sport.

  <img src="/assets/showcase/oura-health.png" alt="Assistant santé Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Plus de 14 agents sous une même gateway avec un orchestrateur Opus 4.5 déléguant à des workers Codex. Voir le [texte technique](https://github.com/adam91holt/orchestrated-ai-articles) et [Clawdspace](https://github.com/adam91holt/clawdspace) pour le sandboxing d’agent.
</Card>

<Card title="CLI Linear" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI pour Linear qui s’intègre aux flux de travail agentiques (Claude Code, OpenClaw). Gérez les tickets, projets et flux de travail depuis le terminal.
</Card>

<Card title="CLI Beeper" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lire, envoyer et archiver des messages via Beeper Desktop. Utilise l’API MCP locale de Beeper pour que les agents puissent gérer toutes vos discussions (iMessage, WhatsApp, etc.) au même endroit.
</Card>

</CardGroup>

## Automatisation et flux de travail

Planification, contrôle du navigateur, boucles de support et le côté « fais simplement la tâche à ma place » du produit.

<CardGroup cols={2}>

<Card title="Contrôle de purificateur d’air Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code a découvert et confirmé les contrôles du purificateur, puis OpenClaw prend le relais pour gérer la qualité de l’air de la pièce.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Contrôle du purificateur d’air Winix via OpenClaw" />
</Card>

<Card title="Jolies photos du ciel par caméra" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Déclenché par une caméra de toit : demandez à OpenClaw de prendre une photo du ciel chaque fois qu’il est beau. Il a conçu un skill et pris la photo.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Capture du ciel par caméra de toit réalisée par OpenClaw" />
</Card>

<Card title="Scène de briefing visuel du matin" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Un prompt planifié génère chaque matin une image de scène (météo, tâches, date, publication favorite ou citation) via une persona OpenClaw.
</Card>

<Card title="Réservation de terrain de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Vérificateur de disponibilité Playtomic plus CLI de réservation. Ne manquez plus jamais un terrain libre.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="capture d’écran padel-cli" />
</Card>

<Card title="Collecte comptable" icon="file-invoice-dollar">
  **Communauté** • `automation` `email` `pdf`

Collecte les PDF depuis les emails, prépare les documents pour un conseiller fiscal. Comptabilité mensuelle en pilote automatique.
</Card>

<Card title="Mode dev canapé" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

A reconstruit tout un site personnel via Telegram en regardant Netflix — Notion vers Astro, 18 articles migrés, DNS vers Cloudflare. N’a jamais ouvert d’ordinateur portable.
</Card>

<Card title="Agent de recherche d’emploi" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Recherche des offres d’emploi, les compare aux mots-clés du CV et renvoie des opportunités pertinentes avec liens. Construit en 30 minutes avec l’API JSearch.
</Card>

<Card title="Constructeur de skill Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw s’est connecté à Jira, puis a généré un nouveau skill à la volée (avant qu’il n’existe sur ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

A automatisé des tâches Todoist et a fait générer le skill directement par OpenClaw dans le chat Telegram.
</Card>

<Card title="Analyse TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Se connecte à TradingView via automatisation de navigateur, capture des graphiques et effectue une analyse technique à la demande. Pas d’API nécessaire — juste du contrôle navigateur.
</Card>

<Card title="Auto-support Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Surveille un canal Slack d’entreprise, répond utilement et transfère les notifications vers Telegram. A corrigé de manière autonome un bug de production dans une app déployée sans qu’on le lui demande.
</Card>

</CardGroup>

## Connaissance et mémoire

Systèmes qui indexent, recherchent, mémorisent et raisonnent sur les connaissances personnelles ou d’équipe.

<CardGroup cols={2}>

<Card title="xuezh apprentissage du chinois" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Moteur d’apprentissage du chinois avec retour sur la prononciation et flux d’étude via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="retour sur la prononciation xuezh" />
</Card>

<Card title="Coffre mémoire WhatsApp" icon="vault">
  **Communauté** • `memory` `transcription` `indexing`

Ingère des exports WhatsApp complets, transcrit plus de 1 000 notes vocales, recoupe avec les journaux git, produit des rapports Markdown liés.
</Card>

<Card title="Recherche sémantique Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Ajoute la recherche vectorielle aux signets Karakeep à l’aide de Qdrant plus des embeddings OpenAI ou Ollama.
</Card>

<Card title="Mémoire Inside-Out-2" icon="brain">
  **Communauté** • `memory` `beliefs` `self-model`

Gestionnaire de mémoire séparé qui transforme les fichiers de session en souvenirs, puis en croyances, puis en un modèle de soi évolutif.
</Card>

</CardGroup>

## Voix et téléphone

Points d’entrée centrés sur la parole, ponts téléphoniques et flux riches en transcription.

<CardGroup cols={2}>

<Card title="Pont téléphonique Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Pont HTTP de l’assistant vocal Vapi vers OpenClaw. Appels téléphoniques quasi temps réel avec votre agent.
</Card>

<Card title="Transcription OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcription audio multilingue via OpenRouter (Gemini, etc.). Disponible sur ClawHub.
</Card>

</CardGroup>

## Infrastructure et déploiement

Packaging, déploiement et intégrations qui rendent OpenClaw plus facile à exécuter et à étendre.

<CardGroup cols={2}>

<Card title="Add-on Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw exécutée sur Home Assistant OS avec prise en charge du tunnel SSH et état persistant.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Contrôler et automatiser les appareils Home Assistant en langage naturel.
</Card>

<Card title="Packaging Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuration OpenClaw nixifiée avec tout inclus pour des déploiements reproductibles.
</Card>

<Card title="Calendrier CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill calendrier utilisant khal et vdirsyncer. Intégration de calendrier auto-hébergé.
</Card>

</CardGroup>

## Maison et matériel

Le côté monde physique d’OpenClaw : maisons, capteurs, caméras, aspirateurs et autres appareils.

<CardGroup cols={2}>

<Card title="Automatisation GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automatisation domestique native Nix avec OpenClaw comme interface, plus des tableaux de bord Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Tableau de bord GoHome Grafana" />
</Card>

<Card title="Aspirateur Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Contrôlez votre aspirateur robot Roborock par conversation naturelle.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="État Roborock" />
</Card>

</CardGroup>

## Projets communautaires

Des choses qui ont grandi au-delà d’un seul flux de travail pour devenir des produits ou écosystèmes plus larges.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Communauté** • `marketplace` `astronomy` `webapp`

Marketplace complète de matériel d’astronomie. Construite avec et autour de l’écosystème OpenClaw.
</Card>

</CardGroup>

## Soumettre votre projet

<Steps>
  <Step title="Partagez-le">
    Publiez dans [#self-promotion sur Discord](https://discord.gg/clawd) ou [tweet @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Inclure les détails">
    Dites-nous ce qu’il fait, ajoutez un lien vers le dépôt ou la démo, et partagez une capture d’écran si vous en avez une.
  </Step>
  <Step title="Être mis en avant">
    Nous ajouterons les projets remarquables à cette page.
  </Step>
</Steps>

## Liens associés

- [Premiers pas](/fr/start/getting-started)
- [OpenClaw](/fr/start/openclaw)
