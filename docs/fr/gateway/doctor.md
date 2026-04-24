---
read_when:
    - Ajout ou modification des migrations Doctor
    - Introduction de changements cassants dans la configuration
summary: 'Commande Doctor : vérifications d’état, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T07:10:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` est l’outil de réparation + migration pour OpenClaw. Il corrige la
configuration/l’état obsolètes, vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Sans interface / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans invite (y compris les étapes de redémarrage/service/réparation du sandbox lorsqu’elles s’appliquent).

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

S’exécute sans invite et n’applique que les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations gateway supplémentaires (launchd/systemd/schtasks).

Si vous voulez revoir les changements avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

- Mise à jour préalable facultative pour les installations git (interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit l’interface de contrôle si le schéma de protocole est plus récent).
- Vérification d’état + invite au redémarrage.
- Résumé de l’état des Skills (éligibles/manquants/bloqués) et état des Plugins.
- Normalisation de configuration pour les valeurs héritées.
- Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration browser pour les anciennes configurations d’extension Chrome et la préparation de Chrome MCP.
- Avertissements sur les surcharges de provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Avertissements sur l’ombrage OAuth Codex (`models.providers.openai-codex`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration d’état hérité sur disque (sessions/répertoire d’agent/authentification WhatsApp).
- Migration des clés de contrat de manifeste de Plugin héritées (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration du magasin Cron hérité (`jobId`, `schedule.cron`, champs de livraison/charge utile de niveau supérieur, `provider` dans la charge utile, tâches simples de secours Webhook `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et d’autorisations de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des autorisations du fichier de configuration (chmod 600) lors d’une exécution locale.
- Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut rafraîchir les jetons proches de l’expiration, et signale les états de refroidissement/désactivation des profils d’authentification.
- Détection de répertoire d’espace de travail supplémentaire (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration des services hérités et détection de gateways supplémentaires.
- Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications d’exécution du Gateway (service installé mais non lancé ; label launchd en cache).
- Avertissements d’état des canaux (sondés depuis le gateway en cours d’exécution).
- Audit de configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications de bonnes pratiques d’exécution du Gateway (Node vs Bun, chemins de gestionnaire de version).
- Diagnostics de collision de port Gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification Gateway pour le mode jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations SecretRef de jeton).
- Détection des problèmes d’association d’appareils (premières demandes d’association en attente, mises à niveau rôle/scope en attente, dérive obsolète du cache local de jeton d’appareil, et dérive d’authentification des enregistrements associés).
- Vérification `linger` systemd sur Linux.
- Vérification de taille des fichiers bootstrap de l’espace de travail (troncature/avertissements proche de la limite pour les fichiers de contexte).
- Vérification de l’état de la complétion shell et installation/mise à niveau automatique.
- Vérification de la préparation du provider d’embedding de recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications d’installation source (incohérence d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Remplissage et réinitialisation Dreams UI

La scène Dreams de l’interface de contrôle comprend les actions **Backfill**, **Reset** et **Clear Grounded**
pour le flux grounded Dreaming. Ces actions utilisent des méthodes RPC de type
doctor du gateway, mais elles **ne** font **pas** partie de la réparation/migration de la CLI `openclaw doctor`.

Ce qu’elles font :

- **Backfill** analyse les fichiers historiques `memory/YYYY-MM-DD.md` de l’espace de travail actif,
  exécute le passage grounded REM diary, puis écrit des entrées de backfill réversibles dans `DREAMS.md`.
- **Reset** supprime uniquement ces entrées de journal de backfill marquées de `DREAMS.md`.
- **Clear Grounded** supprime uniquement les entrées short-term grounded-only mises en scène qui
  proviennent d’une relecture historique et n’ont pas encore accumulé de rappel en direct ni de support quotidien.

Ce qu’elles ne font **pas** d’elles-mêmes :

- elles ne modifient pas `MEMORY.md`
- elles n’exécutent pas les migrations doctor complètes
- elles ne mettent pas automatiquement en scène les candidats grounded dans le magasin de promotion
  short-term en direct à moins que vous n’exécutiez explicitement le chemin CLI de mise en scène d’abord

Si vous voulez que la relecture historique grounded influence la voie normale de promotion profonde,
utilisez plutôt le flux CLI :

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Cela met en scène des candidats durables grounded dans le magasin de Dreaming short-term tout en
conservant `DREAMS.md` comme surface de revue.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose de
mettre à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans surcharge spécifique au canal), doctor les normalise vers le schéma
actuel.

Cela inclut les anciens champs plats Talk. La configuration publique Talk actuelle est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la map des providers.

### 2) Migrations des clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et vous
demandent d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Montrer la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

Le Gateway exécute aussi automatiquement les migrations doctor au démarrage lorsqu’il détecte un
format de configuration hérité, de sorte que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du magasin de tâches Cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- anciens `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Pour les canaux avec `accounts` nommés mais avec des valeurs de canal de niveau supérieur à compte unique persistantes, déplacer ces valeurs à portée de compte dans le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut préserver une cible nommée/par défaut déjà correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- suppression de `browser.relayBindHost` (ancien paramètre de relais d’extension)

Les avertissements doctor incluent aussi des conseils sur le compte par défaut pour les canaux multi-comptes :

- Si deux entrées ou plus `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ou `accounts.default`, doctor avertit que le routage de secours peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

### 2b) Surcharges de provider OpenCode

Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen`, ou `opencode-go`,
cela remplace le catalogue OpenCode intégré provenant de `@mariozechner/pi-ai`.
Cela peut forcer des modèles vers la mauvaise API ou ramener les coûts à zéro. Doctor avertit pour que vous
puissiez supprimer la surcharge et restaurer le routage API + les coûts par modèle.

### 2c) Migration browser et préparation Chrome MCP

Si votre configuration browser pointe encore vers l’ancien chemin d’extension Chrome supprimé, doctor
la normalise vers le modèle actuel d’attachement Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil configuré `existing-session` :

- vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
- vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
- rappelle d’activer le débogage à distance dans la page d’inspection du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer le paramètre côté Chrome à votre place. Le Chrome MCP local à l’hôte
nécessite toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
- le navigateur exécuté localement
- le débogage à distance activé dans ce navigateur
- l’approbation de la première invite de consentement d’attachement dans le navigateur

La préparation ici ne concerne que les prérequis d’attachement local. Existing-session conserve
les limites actuelles de route Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF,
l’interception des téléchargements et les actions par lot nécessitent toujours un navigateur géré
ou un profil CDP brut.

Cette vérification ne s’applique **pas** à Docker, au sandbox, au navigateur distant, ni aux autres
flux headless. Ceux-ci continuent à utiliser le CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison
d’autorisation OpenAI afin de vérifier que la pile TLS locale Node/OpenSSL peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou auto-signé),
doctor affiche des conseils de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la
correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si le gateway est sain.

### 2c) Surcharges de provider Codex OAuth

Si vous avez précédemment ajouté d’anciens paramètres de transport OpenAI sous
`models.providers.openai-codex`, ils peuvent masquer le chemin du provider
Codex OAuth intégré que les versions plus récentes utilisent automatiquement. Doctor avertit lorsqu’il voit
ces anciens paramètres de transport aux côtés de Codex OAuth afin que vous puissiez supprimer ou réécrire
la surcharge de transport obsolète et récupérer le comportement intégré de routage/repli.
Les proxys personnalisés et les surcharges limitées aux en-têtes sont toujours pris en charge et ne
déclenchent pas cet avertissement.

### 3) Migrations d’état héritées (disposition disque)

Doctor peut migrer d’anciennes dispositions sur disque vers la structure actuelle :

- Magasin de sessions + transcriptions :
  - depuis `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire d’agent :
  - depuis `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

Ces migrations font au mieux et sont idempotentes ; doctor émet des avertissements lorsqu’il
laisse des dossiers hérités en place comme sauvegardes. Le Gateway/CLI migre aussi automatiquement
les anciennes sessions + le répertoire d’agent au démarrage afin que l’historique/l’authentification/les modèles aboutissent dans le chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée que via `openclaw doctor`. La normalisation Talk provider/map de providers compare maintenant par égalité structurelle, de sorte que les différences d’ordre des clés ne déclenchent plus de changements répétés et sans effet de `doctor --fix`.

### 3a) Migrations de manifeste de Plugin héritées

Doctor analyse tous les manifestes de Plugins installés à la recherche de clés de capacité
obsolètes de niveau supérieur (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier de manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` possède déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations du magasin Cron hérité

Doctor vérifie aussi le magasin de tâches Cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` s’il est remplacé) pour détecter d’anciennes formes de tâche que le planificateur accepte toujours
pour compatibilité.

Nettoyages Cron actuels :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs de charge utile de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs de livraison de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de livraison `provider` dans la charge utile → `delivery.channel` explicite
- tâches simples héritées de secours Webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
modifier le comportement. Si une tâche combine un secours notify hérité avec un mode de livraison existant
non Webhook, doctor avertit et laisse cette tâche pour revue manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés
en place lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est encore vivant, l’âge du verrou, et s’il est
considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
sessions, identifiants, journaux et configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte catastrophique d’état, propose de recréer
  le répertoire, et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Autorisations du répertoire d’état** : vérifie la possibilité d’écriture ; propose de réparer les autorisations
  (et émet une indication `chown` lorsqu’une incohérence de propriétaire/groupe est détectée).
- **Répertoire d’état macOS synchronisé dans le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins adossés à la synchronisation peuvent provoquer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état Linux sur carte SD ou eMMC** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires adossées à une carte SD ou à eMMC peuvent être plus lentes et s’user
  plus vite sous les écritures de session et d’identifiants.
- **Répertoires de sessions manquants** : `sessions/` et le répertoire du magasin de sessions sont
  nécessaires pour persister l’historique et éviter les crashes `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers
  de transcription manquants.
- **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale n’a qu’une seule
  ligne (l’historique ne s’accumule pas).
- **Répertoires d’état multiples** : avertit lorsque plusieurs dossiers `~/.openclaw` existent dans
  différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut
  se fragmenter entre installations).
- **Rappel sur le mode distant** : si `gateway.mode=remote`, doctor rappelle de l’exécuter
  sur l’hôte distant (c’est là que vit l’état).
- **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de le restreindre à `600`.

### 5) Santé de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque des jetons
sont proches de l’expiration/expirés, et peut les rafraîchir lorsque c’est sûr. Si le profil
OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou le
chemin Anthropic setup-token.
Les invites de rafraîchissement n’apparaissent qu’en exécution interactive (TTY) ; `--non-interactive`
ignore les tentatives de rafraîchissement.

Lorsqu’un rafraîchissement OAuth échoue de façon permanente (par exemple `refresh_token_reused`,
`invalid_grant`, ou lorsqu’un provider vous indique de vous reconnecter), doctor signale
qu’une réauthentification est requise et affiche la commande exacte `openclaw models auth login --provider ...`
à exécuter.

Doctor signale aussi les profils d’authentification temporairement inutilisables en raison de :

- refroidissements courts (limites de débit/délais d’attente/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle des Hooks

Si `hooks.gmail.model` est défini, doctor valide la référence du modèle par rapport au
catalogue et à la liste d’autorisation et avertit lorsqu’elle ne se résout pas ou n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de basculer vers les noms hérités si l’image actuelle est manquante.

### 7b) Dépendances d’exécution des Plugins intégrés

Doctor vérifie les dépendances d’exécution uniquement pour les Plugins intégrés qui sont actifs dans
la configuration actuelle ou activés par la valeur par défaut de leur manifeste intégré, par exemple
`plugins.entries.discord.enabled: true`, l’ancien
`channels.discord.enabled: true`, ou un provider intégré activé par défaut. Si des
dépendances manquent, doctor les signale et les installe en mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Les Plugins externes utilisent toujours
`openclaw plugins install` / `openclaw plugins update` ; doctor n’installe pas
de dépendances pour des chemins de Plugin arbitraires.

### 8) Migrations de service Gateway et indications de nettoyage

Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et
propose de les supprimer et d’installer le service OpenClaw en utilisant le port gateway
actuel. Il peut aussi analyser les services supplémentaires de type gateway et afficher des indications de nettoyage.
Les services gateway OpenClaw nommés par profil sont considérés de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou applicable,
doctor (en mode `--fix` / `--repair`) crée un instantané pré-migration puis
exécute les étapes de migration au mieux : migration de l’état Matrix hérité et préparation de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et
le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est complètement ignorée.

### 8c) Association d’appareil et dérive d’authentification

Doctor inspecte désormais l’état d’association des appareils dans le cadre du passage de santé normal.

Ce qu’il signale :

- demandes initiales d’association en attente
- mises à niveau de rôle en attente pour des appareils déjà associés
- mises à niveau de scope en attente pour des appareils déjà associés
- réparations de non-correspondance de clé publique lorsque l’identifiant d’appareil correspond encore mais que l’identité de l’appareil ne correspond plus à l’enregistrement approuvé
- enregistrements associés sans jeton actif pour un rôle approuvé
- jetons associés dont les scopes dérivent en dehors de la base d’association approuvée
- entrées de cache local de jeton d’appareil pour la machine actuelle qui sont antérieures à une rotation de jeton côté gateway ou qui portent des métadonnées de scope obsolètes

Doctor n’approuve pas automatiquement les demandes d’association ni ne fait tourner automatiquement les jetons d’appareil. Il
affiche à la place les étapes exactes suivantes :

- inspecter les demandes en attente avec `openclaw devices list`
- approuver la demande exacte avec `openclaw devices approve <requestId>`
- faire tourner un nouveau jeton avec `openclaw devices rotate --device <deviceId> --role <role>`
- supprimer et réapprouver un enregistrement obsolète avec `openclaw devices remove <deviceId>`

Cela ferme le trou fréquent du « déjà associé mais reçoit toujours pairing required » :
doctor distingue maintenant la première association des mises à niveau de rôle/scope
en attente et de la dérive obsolète de jeton/identité d’appareil.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un provider est ouvert aux DM sans liste d’autorisation, ou
lorsqu’une politique est configurée de façon dangereuse.

### 10) systemd linger (Linux)

S’il s’exécute comme service utilisateur systemd, doctor s’assure que le linger est activé afin que le
gateway reste actif après la déconnexion.

### 11) État de l’espace de travail (Skills, Plugins et répertoires hérités)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, à exigences manquantes et bloqués par liste d’autorisation.
- **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires d’espace de travail hérités
  existent à côté de l’espace de travail actuel.
- **État des Plugins** : compte les Plugins chargés/désactivés/en erreur ; liste les identifiants de Plugin pour toute
  erreur ; signale les capacités des bundles de Plugin.
- **Avertissements de compatibilité de Plugin** : signale les Plugins qui ont des problèmes de compatibilité avec
  l’exécution actuelle.
- **Diagnostics de Plugin** : fait remonter tout avertissement ou erreur de chargement émis par le
  registre de Plugins.

### 11b) Taille du fichier bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md`, ou d’autres fichiers de contexte injectés) approchent ou dépassent le
budget de caractères configuré. Il signale par fichier le nombre de caractères bruts vs injectés, le pourcentage
de troncature, la cause de la troncature (`max/file` ou `max/total`), et le total des
caractères injectés en fraction du budget total. Lorsque des fichiers sont tronqués ou proches
de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Complétion shell

Doctor vérifie si la complétion par tabulation est installée pour le shell actuel
(zsh, bash, fish, ou PowerShell) :

- Si le profil shell utilise un modèle de complétion dynamique lent
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide
  avec fichier en cache.
- Si la complétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune complétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d’authentification Gateway (jeton local)

Doctor vérifie l’état de préparation de l’authentification par jeton du gateway local.

- Si le mode jeton a besoin d’un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

### 12b) Réparations en lecture seule tenant compte de SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement d’échec rapide à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour les réparations de configuration ciblées.
- Exemple : la réparation `@username` de `allowFrom` / `groupAllowFrom` pour Telegram essaie d’utiliser les identifiants de bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

### 13) Vérification d’état du Gateway + redémarrage

Doctor exécute une vérification d’état et propose de redémarrer le gateway lorsqu’il
semble en mauvais état.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le provider d’embedding de recherche mémoire configuré est prêt
pour l’agent par défaut. Le comportement dépend du backend et du provider configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut démarrer.
  Sinon, affiche des conseils de correction, y compris le package npm et une option de chemin de binaire manuel.
- **Provider local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. S’il manque, suggère de passer à un provider distant.
- **Provider distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou le magasin d’authentification. Affiche des indications de correction exploitables si elle manque.
- **Provider auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque provider distant
  dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde du gateway est disponible (le gateway était sain au moment de la
vérification), doctor le croise avec la configuration visible côté CLI et note
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation de l’embedding à l’exécution.

### 14) Avertissements d’état des canaux

Si le gateway est sain, doctor exécute une sonde d’état des canaux et signale
les avertissements avec des corrections suggérées.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration du superviseur installée (launchd/systemd/schtasks) pour
détecter les valeurs par défaut manquantes ou obsolètes (par ex., dépendances systemd `network-online` et
délai de redémarrage). Lorsqu’il trouve une incohérence, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les corrections recommandées sans invites.
- `openclaw doctor --repair --force` écrase les configurations de superviseur personnalisées.
- Si l’authentification par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/réparation du service doctor valide le SecretRef mais ne persiste pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des conseils exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités systemd utilisateur Linux, les vérifications de dérive de jeton de doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics d’exécution du Gateway + port

Doctor inspecte l’exécution du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais ne s’exécute pas réellement. Il vérifie aussi les collisions de port
sur le port du gateway (par défaut `18789`) et signale les causes probables (gateway déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques d’exécution du Gateway

Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de versions peuvent casser après des mises à niveau car le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système
lorsqu’elle est disponible (Homebrew/apt/choco).

### 18) Écriture de configuration + métadonnées de l’assistant

Doctor persiste toute modification de configuration et marque des métadonnées d’assistant pour enregistrer
l’exécution de doctor.

### 19) Conseils d’espace de travail (sauvegarde + système mémoire)

Doctor suggère un système mémoire d’espace de travail lorsqu’il manque et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet de la
structure d’espace de travail et des sauvegardes git (GitHub ou GitLab privés recommandés).

## Lié

- [Dépannage Gateway](/fr/gateway/troubleshooting)
- [Runbook Gateway](/fr/gateway)
