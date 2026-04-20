---
read_when:
    - Ajouter ou modifier des migrations doctor
    - Introduire des modifications de configuration incompatibles
summary: 'Commande doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Médecin
x-i18n:
    generated_at: "2026-04-20T07:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` est l’outil de réparation + migration pour OpenClaw. Il corrige les
configurations/états obsolètes, vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Mode headless / automatisation

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

S’exécute sans invites et applique uniquement les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations Gateway supplémentaires (launchd/systemd/schtasks).

Si vous voulez examiner les changements avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

- Mise à jour préalable optionnelle pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit l’interface de contrôle si le schéma du protocole est plus récent).
- Vérification d’état + invite de redémarrage.
- Résumé d’état des Skills (éligibles/manquantes/bloquées) et état des plugins.
- Normalisation de la configuration pour les valeurs héritées.
- Migration de la configuration Talk des champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les configurations héritées de l’extension Chrome et la préparation de Chrome MCP.
- Avertissements sur les remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements sur le masquage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration de l’état hérité sur disque (sessions/répertoire agent/authentification WhatsApp).
- Migration de clé de contrat de manifeste Plugin héritée (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration héritée du stockage Cron (`jobId`, `schedule.cron`, champs delivery/payload de niveau supérieur, `provider` de payload, tâches de secours Webhook simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des permissions du fichier de configuration (`chmod 600`) lors d’une exécution en local.
- État de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons proches de l’expiration et signale les états de cooldown/désactivation des profils d’authentification.
- Détection d’un répertoire de workspace supplémentaire (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration de service héritée et détection de Gateway supplémentaires.
- Migration d’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications d’exécution Gateway (service installé mais non démarré ; étiquette launchd en cache).
- Avertissements d’état des canaux (testés à partir de la Gateway en cours d’exécution).
- Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation optionnelle.
- Vérifications des bonnes pratiques d’exécution Gateway (Node vs Bun, chemins du gestionnaire de versions).
- Diagnostics de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification Gateway pour le mode jeton local (propose une génération de jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
- Détection des problèmes d’appairage d’appareil (premières demandes d’appairage en attente, mises à niveau de rôle/scope en attente, dérive obsolète du cache local de jeton d’appareil et dérive d’authentification des enregistrements appairés).
- Vérification de linger systemd sous Linux.
- Vérification de la taille du fichier bootstrap du workspace (avertissements de troncature/proche de la limite pour les fichiers de contexte).
- Vérification de l’état des complétions shell et auto-installation/mise à niveau.
- Vérification de préparation du fournisseur d’embeddings pour la recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications des installations source (incohérence de workspace pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Complétion et réinitialisation de l’interface Dreams

La scène Dreams de l’interface de contrôle inclut les actions **Backfill**, **Reset** et **Clear Grounded**
pour le flux de travail de Dreaming fondé. Ces actions utilisent des méthodes RPC
de type doctor de Gateway, mais elles ne font **pas** partie de la
réparation/migration de la CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` dans le
  workspace actif, exécute le passage grounded REM diary et écrit des entrées de
  complétion réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de complétion marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées à court terme provisoires, uniquement fondées,
  issues d’une relecture historique et qui n’ont pas encore accumulé de rappel en direct
  ni de support quotidien.

Ce qu’elles ne font **pas** à elles seules :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne mettent pas automatiquement en préparation les candidats fondés dans le stockage
  vivant de promotion à court terme sauf si vous exécutez explicitement d’abord le chemin CLI en préparation

Si vous voulez que la relecture historique fondée influence le flux normal de promotion profonde,
utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela met en préparation les candidats durables fondés dans le stockage Dreaming à court terme tout en
gardant `DREAMS.md` comme surface de révision.

## Comportement détaillé et justification

### 0) Mise à jour optionnelle (installations git)

S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose
de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans remplacement spécifique à un canal), doctor les normalise vers le
schéma actuel.

Cela inclut les champs plats hérités de Talk. La configuration publique actuelle de Talk est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la table des fournisseurs.

### 2) Migrations de clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Montrer la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute également automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration hérité, de sorte que les configurations obsolètes sont réparées sans intervention manuelle.
Les migrations du stockage des tâches Cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- héritage `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Pour les canaux avec des `accounts` nommés mais encore des valeurs de canal de niveau supérieur en mode compte unique, déplacer ces valeurs liées au compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut correspondante existante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- supprimer `browser.relayBindHost` (paramètre hérité du relais d’extension)

Les avertissements doctor incluent aussi des conseils sur le compte par défaut pour les canaux multi-comptes :

- Si deux entrées ou plus sont configurées dans `channels.<channel>.accounts` sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un ID de compte inconnu, doctor avertit et liste les ID de compte configurés.

### 2b) Remplacements de fournisseur OpenCode

Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`,
cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`.
Cela peut forcer les modèles à utiliser la mauvaise API ou remettre les coûts à zéro. Doctor avertit afin que vous
puissiez supprimer ce remplacement et restaurer le routage API par modèle + les coûts.

### 2c) Migration du navigateur et préparation de Chrome MCP

Si votre configuration de navigateur pointe encore vers le chemin supprimé de l’extension Chrome, doctor
la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils de
  connexion automatique par défaut
- vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
- rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer ce paramètre côté Chrome à votre place. Le Chrome MCP local à l’hôte
requiert toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte Gateway/Node
- le navigateur exécuté localement
- le débogage à distance activé dans ce navigateur
- l’approbation de la première invite de consentement d’attachement dans le navigateur

La préparation ici concerne uniquement les prérequis d’attachement local. Existing-session conserve
les limites de routage actuelles de Chrome MCP ; des routes avancées comme `responsebody`, l’export PDF,
l’interception des téléchargements et les actions par lot nécessitent toujours un
navigateur géré ou un profil CDP brut.

Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant ni aux autres
flux headless. Ceux-ci continuent d’utiliser du CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison
d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné),
doctor affiche des conseils de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la
correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si la Gateway est en bon état.

### 2c) Remplacements de fournisseur OAuth Codex

Si vous avez précédemment ajouté des paramètres hérités de transport OpenAI sous
`models.providers.openai-codex`, ils peuvent masquer le chemin du fournisseur
OAuth Codex intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit
ces anciens paramètres de transport en même temps que Codex OAuth afin que vous puissiez supprimer
ou réécrire le remplacement de transport obsolète et retrouver le comportement
intégré de routage/secours. Les proxys personnalisés et les remplacements limités aux en-têtes restent pris en charge et ne
déclenchent pas cet avertissement.

### 3) Migrations d’état héritées (disposition sur disque)

Doctor peut migrer d’anciennes dispositions sur disque vers la structure actuelle :

- Stockage des sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - de l’héritage `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de compte par défaut : `default`)

Ces migrations sont en mode meilleur effort et idempotentes ; doctor émettra des avertissements lorsqu’il
laisse des dossiers hérités en place comme sauvegardes. La Gateway/CLI migre aussi automatiquement
les sessions héritées + le répertoire agent au démarrage afin que l’historique/l’authentification/les modèles aboutissent dans le
chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp est intentionnellement
migrée uniquement via `openclaw doctor`. La normalisation du fournisseur/de la table des fournisseurs Talk
compare désormais selon l’égalité structurelle, donc les différences de seul ordre des clés ne déclenchent plus
de changements no-op répétés de `doctor --fix`.

### 3a) Migrations héritées de manifeste Plugin

Doctor analyse tous les manifestes de plugins installés à la recherche de clés de capacité
obsolètes de niveau supérieur (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du stockage Cron

Doctor vérifie également le stockage des tâches Cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` si remplacé) à la recherche d’anciennes formes de tâches que le planificateur
accepte encore pour compatibilité.

Les nettoyages Cron actuels incluent :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs delivery de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de delivery `provider` dans payload → `delivery.channel` explicite
- tâches de secours Webhook héritées simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
changer le comportement. Si une tâche combine un secours notify hérité avec un mode
delivery non-Webhook existant, doctor avertit et laisse cette tâche pour révision manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — fichiers laissés
derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est encore actif, l’âge du verrou et s’il est
considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
les sessions, identifiants, journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d’état** : vérifie l’écriture ; propose de réparer les permissions
  (et affiche une indication `chown` lorsqu’une discordance propriétaire/groupe est détectée).
- **Répertoire d’état macOS synchronisé dans le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` parce que les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires sur SD ou eMMC peuvent être plus lentes et user
  plus vite avec les écritures de sessions et d’identifiants.
- **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont
  nécessaires pour persister l’historique et éviter les crashs `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des
  fichiers de transcription manquants.
- **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n’a qu’une
  seule ligne (l’historique ne s’accumule pas).
- **Multiples répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut
  se répartir entre plusieurs installations).
- **Rappel mode distant** : si `gateway.mode=remote`, doctor rappelle de l’exécuter
  sur l’hôte distant (l’état y réside).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de le restreindre à `600`.

### 5) État de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque les jetons
expirent ou ont expiré et peut les actualiser lorsque c’est sûr. Si le profil
OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin setup-token Anthropic.
Les invites d’actualisation n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives d’actualisation.

Lorsqu’une actualisation OAuth échoue de manière permanente (par exemple `refresh_token_reused`,
`invalid_grant`, ou lorsqu’un fournisseur vous dit de vous reconnecter), doctor signale
qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d’authentification temporairement inutilisables à cause de :

- courtes périodes de cooldown (limites de débit/timeouts/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle Hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste d’autorisation et avertit lorsqu’elle ne se résoudra pas ou n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de les construire ou
de basculer vers les noms hérités si l’image actuelle est manquante.

### 7b) Dépendances d’exécution des plugins intégrés

Doctor vérifie que les dépendances d’exécution des plugins intégrés (par exemple les
packages d’exécution du plugin Discord) sont présentes à la racine d’installation d’OpenClaw.
S’il en manque, doctor signale les packages et les installe en mode
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrations des services Gateway et indications de nettoyage

Doctor détecte les services Gateway hérités (launchd/systemd/schtasks) et
propose de les supprimer et d’installer le service OpenClaw en utilisant le port Gateway
actuel. Il peut également analyser les services supplémentaires de type Gateway et afficher des indications de nettoyage.
Les services Gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration puis
exécute les étapes de migration en mode meilleur effort : migration de l’état Matrix hérité et préparation héritée
de l’état chiffré. Les deux étapes sont non fatales ; les erreurs sont journalisées et
le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est entièrement ignorée.

### 8c) Dérive d’appairage d’appareil et d’authentification

Doctor inspecte désormais l’état d’appairage des appareils dans le cadre du passage normal de vérification d’état.

Ce qu’il signale :

- premières demandes d’appairage en attente
- mises à niveau de rôle en attente pour des appareils déjà appairés
- mises à niveau de scope en attente pour des appareils déjà appairés
- réparations de discordance de clé publique lorsque l’ID d’appareil correspond toujours mais que l’identité
  de l’appareil ne correspond plus à l’enregistrement approuvé
- enregistrements appairés sans jeton actif pour un rôle approuvé
- jetons appairés dont les scopes dérivent hors de la base de référence d’appairage approuvée
- entrées locales en cache de jeton d’appareil pour la machine actuelle qui sont antérieures à une
  rotation de jeton côté Gateway ou portent des métadonnées de scope obsolètes

Doctor n’approuve pas automatiquement les demandes d’appairage et ne fait pas non plus pivoter automatiquement les jetons d’appareil. Il
affiche à la place les étapes suivantes exactes :

- inspecter les demandes en attente avec `openclaw devices list`
- approuver la demande exacte avec `openclaw devices approve <requestId>`
- faire pivoter un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
- supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

Cela ferme le cas courant « déjà appairé mais reçoit toujours pairing required » :
doctor distingue désormais le premier appairage des mises à niveau de rôle/scope
en attente et de la dérive d’identité d’appareil/jeton obsolète.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou
lorsqu’une politique est configurée d’une manière dangereuse.

### 10) systemd linger (Linux)

En cas d’exécution comme service utilisateur systemd, doctor s’assure que le mode lingering est activé afin que la
Gateway reste active après la déconnexion.

### 11) État du workspace (Skills, plugins et répertoires hérités)

Doctor affiche un résumé de l’état du workspace pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, à exigences manquantes et bloquées par la liste d’autorisation.
- **Répertoires de workspace hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires de workspace hérités
  existent à côté du workspace actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les ID des plugins pour les
  erreurs ; signale les capacités des plugins intégrés.
- **Avertissements de compatibilité des plugins** : signale les plugins ayant des problèmes de compatibilité avec
  l’exécution actuelle.
- **Diagnostics des plugins** : expose les avertissements ou erreurs au chargement émis par le
  registre de plugins.

### 11b) Taille du fichier bootstrap

Doctor vérifie si les fichiers bootstrap du workspace (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-dessus du
budget de caractères configuré. Il signale, par fichier, le nombre brut de caractères par rapport au nombre injecté, le
pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total des
caractères injectés en fraction du budget total. Lorsque des fichiers sont tronqués ou proches
de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil shell utilise un modèle lent de complétion dynamique
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la
  variante plus rapide avec fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune complétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d’authentification Gateway (jeton local)

Doctor vérifie la préparation de l’authentification par jeton de la Gateway locale.

- Si le mode jeton a besoin d’un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

### 12b) Réparations en lecture seule compatibles SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations ciblées de configuration.
- Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` `@username` essaie d’utiliser les identifiants du bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré-mais-indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

### 13) Vérification d’état Gateway + redémarrage

Doctor exécute une vérification d’état et propose de redémarrer la Gateway lorsqu’elle semble
en mauvais état.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche mémoire est prêt
pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut être démarré.
  Sinon, affiche des conseils de correction, y compris le package npm et une option manuelle de chemin du binaire.
- **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. Si absent, suggère de basculer vers un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle est absente.
- **Fournisseur auto** : vérifie d’abord la disponibilité d’un modèle local, puis essaie chaque fournisseur distant dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde Gateway est disponible (la Gateway était en bon état au moment de la
vérification), doctor le recoupe avec la configuration visible par la CLI et signale
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

### 14) Avertissements d’état des canaux

Si la Gateway est en bon état, doctor exécute une sonde d’état des canaux et signale
les avertissements avec des corrections suggérées.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration installée du superviseur (launchd/systemd/schtasks) pour détecter
des valeurs par défaut manquantes ou obsolètes (par ex. dépendances systemd network-online et
délai de redémarrage). Lorsqu’il trouve une différence, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche vers les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les corrections recommandées sans invites.
- `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
- Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, la voie d’installation/réparation du service doctor valide le SecretRef mais ne persiste pas les valeurs résolues de jeton en texte brut dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque la voie d’installation/réparation avec des conseils exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités user-systemd Linux, les vérifications de dérive de jeton doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics d’exécution Gateway + de port

Doctor inspecte l’exécution du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n’est pas réellement en cours d’exécution. Il vérifie également les collisions de port
sur le port Gateway (par défaut `18789`) et signale les causes probables (Gateway déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques d’exécution Gateway

Doctor avertit lorsque le service Gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de versions peuvent se casser après les mises à niveau parce que le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation système de Node lorsqu’elle est
disponible (Homebrew/apt/choco).

### 18) Écriture de la configuration + métadonnées de l’assistant

Doctor persiste toutes les modifications de configuration et appose des métadonnées de l’assistant pour enregistrer l’exécution
de doctor.

### 19) Conseils pour le workspace (sauvegarde + système mémoire)

Doctor suggère un système mémoire du workspace lorsqu’il est absent et affiche un conseil de sauvegarde
si le workspace n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la
structure du workspace et de la sauvegarde git (GitHub ou GitLab privés recommandés).
