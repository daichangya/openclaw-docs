---
read_when:
    - Ajout ou modification de migrations doctor
    - Introduction de changements de configuration incompatibles
summary: 'Commande Doctor : contrôles de santé, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T18:18:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` est l'outil de réparation + migration pour OpenClaw. Il corrige les configurations/états obsolètes, vérifie l'état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Mode headless / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage/service/sandbox lorsqu'elles s'appliquent).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsque c'est sûr).

```bash
openclaw doctor --repair --force
```

Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

```bash
openclaw doctor --non-interactive
```

S'exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d'état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d'état héritées s'exécutent automatiquement lorsqu'elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations Gateway supplémentaires (launchd/systemd/schtasks).

Si vous souhaitez examiner les modifications avant l'écriture, ouvrez d'abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu'il fait (résumé)

- Mise à jour préliminaire facultative pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit l'interface Control UI lorsque le schéma de protocole est plus récent).
- Vérification d'état de santé + invite de redémarrage.
- Résumé de l'état des Skills (éligibles/manquants/bloqués) et état des plugins.
- Normalisation de la configuration pour les valeurs héritées.
- Migration de la configuration Talk depuis les champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les configurations héritées de l'extension Chrome et pour l'état de préparation Chrome MCP.
- Avertissements sur les surcharges de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration de l'état hérité sur disque (sessions/répertoire d'agent/auth WhatsApp).
- Migration des clés de contrat héritées des manifestes de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs delivery/payload de niveau supérieur, `provider` dans le payload, tâches de repli Webhook simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous périmés.
- Vérifications d'intégrité et de permissions de l'état (sessions, transcriptions, répertoire d'état).
- Vérifications des permissions du fichier de configuration (`chmod 600`) lors d'une exécution en local.
- Santé de l'authentification des modèles : vérifie l'expiration OAuth, peut actualiser les jetons proches de l'expiration et signale les états de refroidissement/désactivation des profils d'authentification.
- Détection de répertoire d'espace de travail supplémentaire (`~/openclaw`).
- Réparation de l'image sandbox lorsque le sandboxing est activé.
- Migration de service héritée et détection de Gateway supplémentaire.
- Migration d'état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications runtime Gateway (service installé mais non lancé ; label launchd en cache).
- Avertissements d'état des canaux (sondés depuis la gateway en cours d'exécution).
- Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications des bonnes pratiques runtime Gateway (Node vs Bun, chemins de gestionnaire de versions).
- Diagnostics de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques de DM ouvertes.
- Vérifications d'authentification Gateway pour le mode jeton local (propose la génération d'un jeton lorsqu'aucune source de jeton n'existe ; n'écrase pas les configurations SecretRef de jeton).
- Détection des problèmes d'appairage des appareils (requêtes initiales d'appairage en attente, mises à niveau de rôle/portée en attente, dérive périmée du cache local de jeton d'appareil et dérive d'authentification des enregistrements appairés).
- Vérification de `linger` systemd sous Linux.
- Vérification de la taille des fichiers d'amorçage de l'espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
- Vérification de l'état des complétions du shell et installation/mise à niveau automatique.
- Vérification de l'état de préparation du fournisseur d'embeddings pour la recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications des installations source (incohérence d'espace de travail pnpm, assets UI manquants, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l'assistant.

## Backfill et réinitialisation de l'interface Dreams

La scène Dreams de l'interface Control UI comprend les actions **Backfill**, **Reset** et **Clear Grounded** pour le workflow de Dreaming ancré. Ces actions utilisent des méthodes RPC de type doctor gateway, mais elles ne font **pas** partie de la réparation/migration du CLI `openclaw doctor`.

Ce qu'elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l'espace de travail actif, exécute le passage du journal REM ancré et écrit des entrées de backfill réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme ancrées, mises en attente, qui proviennent d'une relecture historique et n'ont pas encore accumulé de rappel en direct ou de support quotidien.

Ce qu'elles ne font **pas** à elles seules :

- elles ne modifient pas `MEMORY.md`
- elles n'exécutent pas les migrations doctor complètes
- elles ne mettent pas automatiquement en attente les candidats ancrés dans le magasin de promotion à court terme en direct, sauf si vous exécutez explicitement d'abord le chemin CLI de mise en attente

Si vous voulez que la relecture historique ancrée influence le flux normal de promotion profonde, utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela met en attente des candidats durables ancrés dans le magasin de Dreaming à court terme tout en conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S'il s'agit d'un checkout git et que doctor s'exécute en mode interactif, il propose une mise à jour (fetch/rebase/build) avant d'exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction` sans surcharge spécifique à un canal), doctor les normalise vers le schéma actuel.

Cela inclut les champs plats hérités de Talk. La configuration publique actuelle de Talk est `talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` dans la map du fournisseur.

### 2) Migrations des clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s'exécuter et vous demandent d'exécuter `openclaw doctor`.

Doctor va :

- expliquer quelles clés héritées ont été trouvées ;
- afficher la migration qu'il a appliquée ;
- réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute également automatiquement les migrations doctor au démarrage lorsqu'elle détecte un format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- ancien `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` et `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` et `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` et `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` et `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- pour les canaux avec des `accounts` nommés mais des valeurs de canal de niveau supérieur à compte unique encore présentes, déplacer ces valeurs à portée de compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- supprimer `browser.relayBindHost` (paramètre hérité du relais d'extension)

Les avertissements doctor incluent aussi des recommandations sur le compte par défaut pour les canaux multi-comptes :

- si deux entrées ou plus `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ou `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu ;
- si `channels.<channel>.defaultAccount` est défini sur un id de compte inconnu, doctor avertit et liste les ids de compte configurés.

### 2b) Surcharges de fournisseur OpenCode

Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`, cela surcharge le catalogue OpenCode intégré de `@mariozechner/pi-ai`.
Cela peut forcer des modèles vers la mauvaise API ou remettre les coûts à zéro. Doctor vous avertit afin que vous puissiez supprimer la surcharge et restaurer le routage API par modèle + les coûts.

### 2c) Migration du navigateur et état de préparation Chrome MCP

Si votre configuration navigateur pointe encore vers le chemin supprimé de l'extension Chrome, doctor la normalise vers le modèle actuel d'attachement Chrome MCP local à l'hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l'hôte lorsque vous utilisez `defaultProfile: "user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils d'auto-connexion par défaut
- vérifie la version détectée de Chrome et avertit lorsqu'elle est inférieure à Chrome 144
- rappelle d'activer le débogage à distance dans la page d'inspection du navigateur (par exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer ce paramètre côté Chrome pour vous. Le Chrome MCP local à l'hôte nécessite toujours :

- un navigateur basé sur Chromium 144+ sur l'hôte gateway/node
- le navigateur en cours d'exécution localement
- le débogage à distance activé dans ce navigateur
- l'approbation de la première invite de consentement d'attachement dans le navigateur

L'état de préparation ici concerne uniquement les prérequis d'attachement local. Existing-session conserve les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l'export PDF, l'interception des téléchargements et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut.

Cette vérification ne s'applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres flux headless. Ceux-ci continuent d'utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu'un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison d'autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé), doctor affiche des instructions de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s'exécute même si la gateway est en bon état.

### 2c) Surcharges de fournisseur Codex OAuth

Si vous avez précédemment ajouté des paramètres de transport OpenAI hérités sous `models.providers.openai-codex`, ils peuvent masquer le chemin de fournisseur Codex OAuth intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu'il voit ces anciens paramètres de transport en même temps que Codex OAuth, afin que vous puissiez supprimer ou réécrire la surcharge de transport obsolète et retrouver le comportement intégré de routage/repli. Les proxys personnalisés et les surcharges limitées aux en-têtes restent pris en charge et ne déclenchent pas cet avertissement.

### 3) Migrations d'état héritées (disposition sur disque)

Doctor peut migrer d'anciennes dispositions sur disque vers la structure actuelle :

- Magasin de sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire d'agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d'authentification WhatsApp (Baileys) :
  - depuis l'ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (id de compte par défaut : `default`)

Ces migrations sont effectuées au mieux et sont idempotentes ; doctor émet des avertissements lorsqu'il laisse derrière lui des dossiers hérités comme sauvegardes. La Gateway/CLI migre aussi automatiquement les anciennes sessions + le répertoire d'agent au démarrage afin que l'historique/l'authentification/les modèles arrivent dans le chemin par agent sans exécution manuelle de doctor. L'authentification WhatsApp n'est intentionnellement migrée que via `openclaw doctor`. La normalisation du fournisseur/de la map de fournisseurs Talk compare désormais par égalité structurelle, donc les différences d'ordre des clés seules ne déclenchent plus de modifications répétées sans effet de `doctor --fix`.

### 3a) Migrations héritées des manifestes de plugin

Doctor analyse tous les manifestes des plugins installés à la recherche de clés de capacité de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu'elles sont trouvées, il propose de les déplacer dans l'objet `contracts` et de réécrire le fichier de manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du magasin Cron

Doctor vérifie aussi le magasin de tâches Cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` lorsqu'il est surchargé) à la recherche d'anciennes formes de tâches que l'ordonnanceur accepte encore pour compatibilité.

Les nettoyages Cron actuels incluent :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs delivery de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` du payload → `delivery.channel` explicite
- tâches de repli Webhook héritées simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu'il peut le faire sans
changer le comportement. Si une tâche combine le repli notify hérité avec un mode delivery non Webhook existant, doctor avertit et laisse cette tâche pour une revue manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d'agent à la recherche de fichiers de verrouillage d'écriture périmés — des fichiers laissés
derrière lorsqu'une session s'est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est toujours actif, l'âge du verrou, et s'il est
considéré comme périmé (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage périmés ; sinon, il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d'intégrité de l'état (persistance des sessions, routage et sécurité)

Le répertoire d'état est le tronc cérébral opérationnel. S'il disparaît, vous perdez
les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d'état manquant** : avertit d'une perte d'état catastrophique, propose de recréer
  le répertoire et rappelle qu'il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d'état** : vérifie la possibilité d'écriture ; propose de réparer les permissions
  (et émet une indication `chown` lorsqu'une incohérence propriétaire/groupe est détectée).
- **Répertoire d'état macOS synchronisé dans le cloud** : avertit lorsque l'état est résolu sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d'état Linux sur SD ou eMMC** : avertit lorsque l'état est résolu vers une source de montage `mmcblk*`,
  car les E/S aléatoires adossées à une carte SD ou à l'eMMC peuvent être plus lentes et s'user plus vite sous les écritures de sessions et d'identifiants.
- **Répertoires de sessions manquants** : `sessions/` et le répertoire du magasin de sessions sont
  requis pour conserver l'historique et éviter les plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des
  fichiers de transcription manquants.
- **Session principale “JSONL à 1 ligne”** : signale lorsque la transcription principale n'a qu'une seule
  ligne (l'historique ne s'accumule pas).
- **Plusieurs répertoires d'état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  plusieurs répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l'historique peut
  se répartir entre les installations).
- **Rappel de mode distant** : si `gateway.mode=remote`, doctor rappelle de l'exécuter
  sur l'hôte distant (l'état s'y trouve).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de les resserrer à `600`.

### 5) Santé de l'authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d'authentification, avertit lorsque les jetons
expirent ou ont expiré, et peut les actualiser lorsque c'est sûr. Si le profil OAuth/jeton
Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin de setup-token Anthropic.
Les invites d'actualisation n'apparaissent qu'en exécution interactive (TTY) ; `--non-interactive`
ignore les tentatives d'actualisation.

Lorsqu'une actualisation OAuth échoue définitivement (par exemple `refresh_token_reused`,
`invalid_grant`, ou un fournisseur vous indiquant de vous reconnecter), doctor signale
qu'une nouvelle authentification est requise et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d'authentification temporairement inutilisables en raison de :

- refroidissements courts (limites de débit/timeouts/échecs d'authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste d'autorisation, et avertit lorsqu'elle ne sera pas résolue ou qu'elle n'est pas autorisée.

### 7) Réparation de l'image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de les construire ou
de revenir à des noms hérités si l'image actuelle est absente.

### 7b) Dépendances runtime des plugins fournis

Doctor vérifie les dépendances runtime uniquement pour les plugins fournis qui sont actifs dans
la configuration actuelle ou activés par la valeur par défaut du manifeste fourni, par exemple
`plugins.entries.discord.enabled: true`, l'ancien
`channels.discord.enabled: true`, ou un fournisseur fourni activé par défaut. Si certaines
sont absentes, doctor signale les paquets et les installe en mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Les plugins externes continuent
d'utiliser `openclaw plugins install` / `openclaw plugins update` ; doctor n'installe pas
de dépendances pour des chemins de plugins arbitraires.

La Gateway et le CLI local peuvent aussi réparer à la demande les dépendances runtime actives des plugins fournis
avant d'importer un plugin fourni. Ces installations sont
limitées à la racine d'installation runtime du plugin, s'exécutent avec les scripts désactivés, n'écrivent
pas de verrou de paquet et sont protégées par un verrou de racine d'installation afin que des démarrages concurrents du CLI
ou de la Gateway ne modifient pas simultanément le même arbre `node_modules`.

### 8) Migrations des services Gateway et indications de nettoyage

Doctor détecte les services gateway hérités (launchd/systemd/schtasks) et
propose de les supprimer puis d'installer le service OpenClaw en utilisant le port gateway
actuel. Il peut aussi analyser des services supplémentaires de type gateway et afficher des indications de nettoyage.
Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme "supplémentaires".

### 8b) Migration Matrix au démarrage

Lorsqu'un compte de canal Matrix a une migration d'état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration, puis
exécute les étapes de migration au mieux : migration de l'état Matrix hérité et préparation
de l'état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et
le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est entièrement ignorée.

### 8c) Appairage des appareils et dérive d'authentification

Doctor inspecte désormais l'état d'appairage des appareils dans le cadre du passage normal de vérification d'état de santé.

Ce qu'il signale :

- requêtes d'appairage initial en attente
- mises à niveau de rôle en attente pour les appareils déjà appairés
- mises à niveau de portée en attente pour les appareils déjà appairés
- réparations d'incohérence de clé publique lorsque l'id de l'appareil correspond toujours mais que l'identité de l'appareil
  ne correspond plus à l'enregistrement approuvé
- enregistrements appairés sans jeton actif pour un rôle approuvé
- jetons appairés dont les portées dérivent en dehors de la ligne de base d'appairage approuvée
- entrées locales en cache de jeton d'appareil pour la machine actuelle qui sont antérieures à une
  rotation de jeton côté gateway ou qui transportent des métadonnées de portée obsolètes

Doctor n'approuve pas automatiquement les requêtes d'appairage et ne fait pas automatiquement tourner les jetons d'appareil. Il
affiche plutôt les étapes exactes suivantes :

- inspecter les requêtes en attente avec `openclaw devices list`
- approuver la requête exacte avec `openclaw devices approve <requestId>`
- faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
- supprimer puis réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

Cela ferme le problème courant "déjà appairé mais toujours en train d'obtenir pairing required" :
doctor distingue désormais le premier appairage des mises à niveau de rôle/portée en attente
et de la dérive d'identité d'appareil/de jeton obsolète.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu'un fournisseur est ouvert aux DM sans liste d'autorisation, ou
lorsqu'une politique est configurée de manière dangereuse.

### 10) `linger` systemd (Linux)

S'il s'exécute comme service utilisateur systemd, doctor s'assure que le mode linger est activé afin que la
gateway reste active après la déconnexion.

### 11) État de l'espace de travail (Skills, plugins et répertoires hérités)

Doctor affiche un résumé de l'état de l'espace de travail pour l'agent par défaut :

- **État des Skills** : nombre de Skills éligibles, avec exigences manquantes et bloqués par la liste d'autorisation.
- **Répertoires d'espace de travail hérités** : avertit lorsque `~/openclaw` ou d'autres répertoires d'espace de travail hérités
  existent à côté de l'espace de travail actuel.
- **État des plugins** : nombre de plugins activés/désactivés/en erreur ; liste les ids de plugin pour toute
  erreur ; signale les capacités des plugins bundle.
- **Avertissements de compatibilité des plugins** : signale les plugins qui ont des problèmes de compatibilité avec
  le runtime actuel.
- **Diagnostics des plugins** : expose tous les avertissements ou erreurs au chargement émis par le
  registre des plugins.

### 11b) Taille du fichier bootstrap

Doctor vérifie si les fichiers bootstrap de l'espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d'autres fichiers de contexte injectés) sont proches ou au-dessus du budget
de caractères configuré. Il signale, par fichier, les nombres de caractères bruts vs injectés, le
pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total des caractères injectés
en fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite,
doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion du shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil du shell utilise un modèle de complétion dynamique lent
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la
  variante plus rapide avec fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune complétion n'est configurée, doctor propose de l'installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d'authentification Gateway (jeton local)

Doctor vérifie l'état de préparation de l'authentification par jeton de la gateway locale.

- Si le mode jeton nécessite un jeton et qu'aucune source de jeton n'existe, doctor propose d'en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l'écrase pas avec du texte en clair.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu'aucun SecretRef de jeton n'est configuré.

### 12b) Réparations en lecture seule compatibles SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast à l'exécution.

- `openclaw doctor --fix` utilise désormais le même modèle de résumé SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
- Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` avec `@username` essaie d'utiliser les identifiants du bot configurés lorsqu'ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l'identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou d'indiquer à tort que le jeton est absent.

### 13) Vérification d'état de santé Gateway + redémarrage

Doctor exécute une vérification d'état de santé et propose de redémarrer la gateway lorsqu'elle
semble en mauvais état.

### 13b) État de préparation de la recherche mémoire

Doctor vérifie si le fournisseur d'embeddings configuré pour la recherche mémoire est prêt
pour l'agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut être démarré.
  Sinon, affiche des instructions de correction, y compris le paquet npm et une option de chemin binaire manuel.
- **Fournisseur local explicite** : vérifie la présence d'un fichier de modèle local ou d'une URL de modèle distante/téléchargeable reconnue. S'il manque, suggère de passer à un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu'une clé API est
  présente dans l'environnement ou le magasin d'authentification. Affiche des indications de correction exploitables si elle est absente.
- **Fournisseur automatique** : vérifie d'abord la disponibilité du modèle local, puis essaie chaque fournisseur distant
  dans l'ordre de sélection automatique.

Lorsqu'un résultat de sonde de gateway est disponible (la gateway était en bon état au moment de la
vérification), doctor recoupe son résultat avec la configuration visible par le CLI et signale
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier l'état de préparation des embeddings à l'exécution.

### 14) Avertissements d'état des canaux

Si la gateway est en bon état, doctor exécute une sonde d'état des canaux et signale
les avertissements avec des corrections suggérées.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie que la configuration installée du superviseur (launchd/systemd/schtasks) ne présente pas
de valeurs par défaut manquantes ou obsolètes (par exemple, les dépendances systemd sur network-online et
le délai de redémarrage). Lorsqu'il trouve un écart, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche vers les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande une confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les corrections recommandées sans invite.
- `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
- Si l'authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, la validation de l'installation/réparation du service doctor valide le SecretRef mais ne conserve pas les valeurs de jeton résolues en texte clair dans les métadonnées d'environnement du service superviseur.
- Si l'authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n'est pas résolu, doctor bloque le chemin d'installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n'est pas défini, doctor bloque l'installation/réparation jusqu'à ce que le mode soit défini explicitement.
- Pour les unités systemd utilisateur Linux, les vérifications de dérive de jeton de doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d'authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics runtime Gateway + port

Doctor inspecte le runtime du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n'est pas réellement en cours d'exécution. Il vérifie aussi les collisions de port
sur le port de la gateway (par défaut `18789`) et signale les causes probables (gateway déjà
en cours d'exécution, tunnel SSH).

### 17) Bonnes pratiques runtime Gateway

Doctor avertit lorsque le service gateway s'exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de versions peuvent se casser après des mises à niveau, car le service ne
charge pas l'initialisation de votre shell. Doctor propose de migrer vers une installation système de Node lorsque
disponible (Homebrew/apt/choco).

### 18) Écriture de la configuration + métadonnées de l'assistant

Doctor persiste toutes les modifications de configuration et appose des métadonnées d'assistant pour enregistrer
l'exécution de doctor.

### 19) Conseils pour l'espace de travail (sauvegarde + système de mémoire)

Doctor suggère un système de mémoire pour l'espace de travail lorsqu'il est absent et affiche un conseil de sauvegarde
si l'espace de travail n'est pas déjà sous git.

Consultez [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la
structure de l'espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).

## Voir aussi

- [Dépannage Gateway](/fr/gateway/troubleshooting)
- [Runbook Gateway](/fr/gateway)
