---
read_when:
    - Ajout ou modification des migrations doctor
    - Introduction de changements cassants de configuration
summary: 'Commande doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-21T06:59:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6460fe657e7cf0d938bfbb77e1cc0355c1b67830327d441878e48375de52a46f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` est l’outil de réparation + migration d’OpenClaw. Il corrige les configurations/états obsolètes,
vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Headless / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans invite (y compris les étapes de réparation de redémarrage/service/sandbox lorsque cela s’applique).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans invite (réparations + redémarrages lorsque c’est sûr).

```bash
openclaw doctor --repair --force
```

Applique aussi les réparations agressives (écrase les configurations de superviseur personnalisées).

```bash
openclaw doctor --non-interactive
```

Exécute sans invites et n’applique que les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations Gateway supplémentaires (launchd/systemd/schtasks).

Si vous souhaitez examiner les modifications avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

- Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole d’interface utilisateur (reconstruit l’interface Control lorsque le schéma du protocole est plus récent).
- Vérification d’état + invite de redémarrage.
- Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des plugins.
- Normalisation de la configuration pour les valeurs héritées.
- Migration de la configuration Talk à partir des champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et préparation de Chrome MCP.
- Avertissements de remplacement de provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements de masquage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration de l’état hérité sur disque (sessions/répertoire agent/authentification WhatsApp).
- Migration des clés de contrat de manifeste de Plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs delivery/payload au niveau racine, payload `provider`, tâches de secours Webhook simples `notify: true`).
- Inspection des fichiers de verrou de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des permissions du fichier de configuration (chmod 600) en exécution locale.
- Santé de l’authentification modèle : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de refroidissement/désactivation des profils d’authentification.
- Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration des services hérités et détection de gateways supplémentaires.
- Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications d’exécution Gateway (service installé mais non exécuté ; label launchd en cache).
- Avertissements d’état des canaux (sondés depuis la gateway en cours d’exécution).
- Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications des bonnes pratiques d’exécution Gateway (Node vs Bun, chemins de gestionnaire de versions).
- Diagnostics de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations de jeton SecretRef).
- Détection des problèmes d’appairage d’appareil (premières demandes d’appairage en attente, mises à niveau de rôle/scope en attente, dérive du cache local obsolète de jetons d’appareil et dérive d’authentification de l’enregistrement appairé).
- Vérification de `linger` systemd sous Linux.
- Vérification de la taille du fichier bootstrap de l’espace de travail (avertissements de troncature/proximité de la limite pour les fichiers de contexte).
- Vérification de l’état des complétions shell et installation/mise à niveau automatique.
- Vérification de préparation du provider d’embeddings de recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications d’installation depuis les sources (incompatibilité d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Backfill et réinitialisation de l’interface Dreams

La scène Dreams de l’interface Control inclut les actions **Backfill**, **Reset** et **Clear Grounded**
pour le flux de dreaming ancré. Ces actions utilisent des méthodes RPC de type
doctor gateway, mais elles ne font **pas** partie de la réparation/migration
de la CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans l’espace de travail
  actif, exécute le passage du journal REM ancré et écrit des entrées de backfill
  réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées court terme ancrées préparées
  issues de la relecture historique et n’ayant pas encore accumulé de rappel en direct
  ni de support quotidien.

Ce qu’elles ne font **pas** d’elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne préparent pas automatiquement les candidats ancrés dans le magasin de promotion court terme en direct
  sauf si vous exécutez d’abord explicitement le chemin CLI préparé

Si vous voulez que la relecture historique ancrée influence la voie normale de promotion profonde,
utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela prépare des candidats durables ancrés dans le magasin de dreaming court terme tout en
conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’une extraction git et que doctor s’exécute en mode interactif, il propose une
mise à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans remplacement propre à un canal), doctor les normalise vers le schéma
actuel.

Cela inclut les anciens champs plats Talk. La configuration publique Talk actuelle est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la map de providers.

### 2) Migrations des clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Afficher la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute également automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` au niveau racine
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- ancien `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Pour les canaux avec des `accounts` nommés mais des valeurs persistantes de canal mono-compte au niveau racine, déplacer ces valeurs délimitées par compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- suppression de `browser.relayBindHost` (ancien paramètre de relais d’extension)

Les avertissements doctor incluent aussi des recommandations sur les comptes par défaut pour les canaux multi-comptes :

- Si au moins deux entrées `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de compte configurés.

### 2b) Remplacements de provider OpenCode

Si vous avez ajouté `models.providers.opencode`, `opencode-zen` ou `opencode-go`
manuellement, cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`.
Cela peut forcer les modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous
puissiez supprimer ce remplacement et rétablir le routage API + les coûts par modèle.

### 2c) Migration du navigateur et préparation de Chrome MCP

Si votre configuration du navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor
la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
- vérifie la version Chrome détectée et avertit si elle est inférieure à Chrome 144
- rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer pour vous le paramètre côté Chrome. Le Chrome MCP local à l’hôte
nécessite toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
- le navigateur en exécution locale
- le débogage distant activé dans ce navigateur
- l’approbation de la première invite de consentement d’attachement dans le navigateur

La préparation ici ne concerne que les prérequis de l’attachement local. Existing-session conserve
les limites actuelles des routes Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF,
l’interception des téléchargements et les actions par lot exigent toujours un navigateur géré ou un profil CDP brut.

Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres
flux headless. Ceux-ci continuent d’utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison
d’autorisation OpenAI pour vérifier que la pile TLS Node/OpenSSL locale peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat auto-signé),
doctor affiche des indications de correction propres à la plateforme. Sous macOS avec un Node Homebrew, le
correctif est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si la gateway est saine.

### 2c) Remplacements de provider OAuth Codex

Si vous avez précédemment ajouté des paramètres hérités de transport OpenAI sous
`models.providers.openai-codex`, ils peuvent masquer le chemin intégré du
provider OAuth Codex que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit
ces anciens paramètres de transport en même temps que Codex OAuth afin que vous puissiez supprimer ou réécrire
ce remplacement de transport obsolète et retrouver le comportement intégré de routage/de secours.
Les proxies personnalisés et les remplacements d’en-têtes uniquement restent pris en charge et ne
déclenchent pas cet avertissement.

### 3) Migrations d’état héritées (disposition sur disque)

Doctor peut migrer d’anciennes dispositions sur disque vers la structure actuelle :

- Magasin de sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

Ces migrations sont effectuées au mieux et sont idempotentes ; doctor émet des avertissements lorsqu’il
laisse des dossiers hérités en place comme sauvegardes. La Gateway/CLI migre aussi automatiquement
les anciennes sessions + le répertoire agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans
le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp est intentionnellement migrée
uniquement via `openclaw doctor`. La normalisation de Talk provider/provider-map compare désormais
par égalité structurelle ; les différences dues uniquement à l’ordre des clés ne déclenchent donc plus de modifications
répétées sans effet de `doctor --fix`.

### 3a) Migrations héritées des manifestes de Plugin

Doctor analyse tous les manifestes de plugins installés à la recherche de clés de capacité
obsolètes au niveau racine (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du magasin Cron

Doctor vérifie aussi le magasin de tâches Cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` s’il est remplacé) pour détecter d’anciennes formes de tâches que l’ordonnanceur
accepte encore pour compatibilité.

Nettoyages Cron actuels :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs payload au niveau racine (`message`, `model`, `thinking`, ...) → `payload`
- champs delivery au niveau racine (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de delivery `provider` dans payload → `delivery.channel` explicite
- tâches de secours Webhook héritées simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
modifier le comportement. Si une tâche combine le secours notify hérité avec un mode de
delivery non Webhook existant, doctor avertit et laisse cette tâche pour examen manuel.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrou d’écriture obsolètes — des fichiers laissés
derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrou trouvé, il signale :
le chemin, le PID, si le PID est toujours actif, l’âge du verrou et s’il est
considéré comme obsolète (PID mort ou plus ancien que 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrou obsolètes ; sinon, il affiche une note et vous
demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance de session, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
les sessions, les identifiants, les logs et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d’état** : vérifie l’inscriptibilité ; propose de réparer les permissions
  (et émet une indication `chown` lorsqu’une discordance propriétaire/groupe est détectée).
- **Répertoire d’état macOS synchronisé dans le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état Linux sur carte SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires sur SD ou eMMC peuvent être plus lentes et s’user
  plus vite avec les écritures de session et d’identifiants.
- **Répertoires de sessions manquants** : `sessions/` et le répertoire du magasin de sessions sont
  nécessaires pour conserver l’historique et éviter les plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers
  de transcription manquants.
- **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n’a qu’une seule
  ligne (l’historique ne s’accumule pas).
- **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut
  se scinder entre les installations).
- **Rappel du mode distant** : si `gateway.mode=remote`, doctor vous rappelle de l’exécuter
  sur l’hôte distant (l’état y réside).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de le restreindre à `600`.

### 5) Santé de l’authentification modèle (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons
expirent/sont expirés et peut les actualiser lorsque c’est sûr. Si le profil OAuth/jeton
Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin setup-token Anthropic.
Les invites d’actualisation n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives d’actualisation.

Lorsqu’une actualisation OAuth échoue de manière permanente (par exemple `refresh_token_reused`,
`invalid_grant`, ou lorsqu’un provider vous indique de vous reconnecter), doctor signale
qu’une réauthentification est nécessaire et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d’authentification temporairement inutilisables en raison de :

- courts cooldowns (limites de débit/timeouts/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle Hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste d’autorisation et avertit lorsqu’elle ne se résoudra pas ou n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de basculer vers les anciens noms si l’image actuelle est manquante.

### 7b) Dépendances runtime des plugins intégrés

Doctor vérifie les dépendances runtime uniquement pour les plugins intégrés actifs dans la
configuration actuelle ou activés par défaut dans leur manifeste intégré, par exemple
`plugins.entries.discord.enabled: true`, l’ancien
`channels.discord.enabled: true`, ou un provider intégré activé par défaut. Si certaines
manquent, doctor signale les packages et les installe en mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Les plugins externes utilisent toujours
`openclaw plugins install` / `openclaw plugins update` ; doctor n’installe pas
de dépendances pour des chemins de plugin arbitraires.

### 8) Migrations des services Gateway et indications de nettoyage

Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et
propose de les supprimer puis d’installer le service OpenClaw en utilisant le port gateway
actuel. Il peut aussi analyser la présence de services supplémentaires semblables à une gateway et afficher des indications de nettoyage.
Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration puis
exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation
de l’ancien état chiffré. Ces deux étapes ne sont pas fatales ; les erreurs sont journalisées et
le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est totalement ignorée.

### 8c) Appairage d’appareil et dérive d’authentification

Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage normal de santé.

Ce qu’il signale :

- demandes initiales d’appairage en attente
- mises à niveau de rôle en attente pour des appareils déjà appairés
- mises à niveau de scope en attente pour des appareils déjà appairés
- réparations d’incohérence de clé publique lorsque l’ID d’appareil correspond toujours mais que l’identité
  de l’appareil ne correspond plus à l’enregistrement approuvé
- enregistrements appairés sans jeton actif pour un rôle approuvé
- jetons appairés dont les scopes dérivent en dehors de la base de référence d’appairage approuvée
- entrées locales en cache de jeton d’appareil pour la machine actuelle qui précèdent une
  rotation de jeton côté gateway ou portent des métadonnées de scope obsolètes

Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas tourner automatiquement les jetons d’appareil. Il
affiche à la place les étapes suivantes exactes :

- inspecter les demandes en attente avec `openclaw devices list`
- approuver la demande exacte avec `openclaw devices approve <requestId>`
- faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
- supprimer puis réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

Cela comble le trou fréquent « déjà appairé mais reçoit toujours pairing required » :
doctor distingue désormais l’appairage initial des mises à niveau de rôle/scope
en attente et de la dérive obsolète de jeton/identité d’appareil.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un provider est ouvert aux DM sans liste d’autorisation, ou
lorsqu’une politique est configurée d’une manière dangereuse.

### 10) systemd linger (Linux)

S’il s’exécute comme service utilisateur systemd, doctor s’assure que le mode lingering est activé pour que la
gateway reste active après la déconnexion.

### 11) État de l’espace de travail (Skills, plugins et anciens répertoires)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, à prérequis manquants et bloquées par liste d’autorisation.
- **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail
  existent à côté de l’espace de travail actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les ID de plugin pour toutes
  les erreurs ; signale les capacités des plugins du bundle.
- **Avertissements de compatibilité des plugins** : signale les plugins ayant des problèmes de compatibilité avec
  le runtime actuel.
- **Diagnostics des plugins** : expose tous les avertissements ou erreurs au chargement émis par le
  registre des plugins.

### 11b) Taille du fichier bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-dessus du budget de
caractères configuré. Il signale, pour chaque fichier, le nombre brut de caractères vs injectés, le pourcentage de troncature,
la cause de la troncature (`max/file` ou `max/total`) et le total des caractères injectés
en fraction du budget total. Lorsque des fichiers sont tronqués ou proches
de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil shell utilise un schéma lent de complétion dynamique
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide
  avec fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune complétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer le cache manuellement.

### 12) Vérifications d’authentification Gateway (jeton local)

Doctor vérifie la préparation de l’authentification par jeton gateway local.

- Si le mode jeton a besoin d’un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas par du texte en clair.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun jeton SecretRef n’est configuré.

### 12b) Réparations en lecture seule tenant compte de SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement runtime fail-fast.

- `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
- Exemple : la réparation Telegram de `allowFrom` / `groupAllowFrom` avec `@username` essaie d’utiliser les identifiants bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore l’auto-résolution au lieu de planter ou de signaler à tort que le jeton est manquant.

### 13) Vérification d’état Gateway + redémarrage

Doctor exécute une vérification d’état et propose de redémarrer la gateway lorsqu’elle semble
en mauvais état.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le provider d’embeddings de recherche mémoire configuré est prêt
pour l’agent par défaut. Le comportement dépend du backend et du provider configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut être démarré.
  Sinon, affiche des indications de correction, y compris le package npm et une option manuelle de chemin vers le binaire.
- **Provider local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable
  reconnue. En cas d’absence, suggère de passer à un provider distant.
- **Provider distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle manque.
- **Provider auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque provider distant
  dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde gateway est disponible (la gateway était saine au moment de la
vérification), doctor le compare au résultat visible côté CLI avec la configuration et signale
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

### 14) Avertissements d’état des canaux

Si la gateway est saine, doctor exécute une sonde d’état des canaux et signale les
avertissements avec des correctifs suggérés.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour détecter
des valeurs par défaut manquantes ou obsolètes (par ex. dépendances systemd network-online et
délai de redémarrage). Lorsqu’il détecte un écart, il recommande une mise à jour et peut
réécrire le fichier service/la tâche avec les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les correctifs recommandés sans invites.
- `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
- Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation du service doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en clair résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités user-systemd Linux, les vérifications de dérive de jeton doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics runtime + port Gateway

Doctor inspecte le runtime du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n’est pas réellement en cours d’exécution. Il vérifie aussi les collisions de port
sur le port gateway (par défaut `18789`) et signale les causes probables (gateway déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques runtime Gateway

Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram exigent Node,
et les chemins de gestionnaire de versions peuvent casser après les mises à jour parce que le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsqu’elle
est disponible (Homebrew/apt/choco).

### 18) Écriture de la configuration + métadonnées de l’assistant

Doctor persiste toute modification de configuration et enregistre les métadonnées de l’assistant pour consigner
l’exécution de doctor.

### 19) Conseils d’espace de travail (sauvegarde + système mémoire)

Doctor suggère un système mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la
structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).
