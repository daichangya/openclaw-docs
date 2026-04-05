---
read_when:
    - Ajout ou modification des migrations doctor
    - Introduction de changements de configuration cassants
summary: 'Commande Doctor : contrôles d’état, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T12:42:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` est l’outil de réparation + migration d’OpenClaw. Il corrige la
configuration/l’état obsolètes, vérifie l’état de santé et fournit des étapes de réparation exploitables.

## Démarrage rapide

```bash
openclaw doctor
```

### Sans interface / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans invite (y compris les étapes de réparation de redémarrage/service/sandbox lorsque cela s’applique).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans invite (réparations + redémarrages quand c’est sûr).

```bash
openclaw doctor --repair --force
```

Applique aussi les réparations agressives (écrase les configurations personnalisées du superviseur).

```bash
openclaw doctor --non-interactive
```

Exécute sans invites et applique uniquement les migrations sûres (normalisation de la configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui exigent une confirmation humaine.
Les migrations d’état héritées s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système pour détecter des installations supplémentaires de la passerelle (launchd/systemd/schtasks).

Si vous souhaitez examiner les changements avant écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce qu’il fait (résumé)

- Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit l’interface de contrôle lorsque le schéma du protocole est plus récent).
- Vérification d’état + invite de redémarrage.
- Résumé d’état des Skills (éligibles/manquants/bloqués) et état des plugins.
- Normalisation de la configuration pour les valeurs héritées.
- Migration de la configuration Talk des champs plats hérités `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration navigateur pour les anciennes configurations d’extension Chrome et la préparation de Chrome MCP.
- Avertissements de remplacement de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Vérification des prérequis TLS OAuth pour les profils OAuth OpenAI Codex.
- Migration de l’état hérité sur disque (sessions/répertoire agent/auth WhatsApp).
- Migration héritée des clés de contrat du manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration du magasin cron hérité (`jobId`, `schedule.cron`, champs delivery/payload de niveau supérieur, `provider` dans payload, tâches de repli webhook simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Contrôles d’intégrité et d’autorisations de l’état (sessions, transcriptions, répertoire d’état).
- Contrôles des autorisations du fichier de configuration (`chmod 600`) lors d’une exécution locale.
- Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut rafraîchir les jetons en cours d’expiration et signale les états de refroidissement/désactivation des profils d’authentification.
- Détection de répertoire d’espace de travail supplémentaire (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration des services hérités et détection de passerelles supplémentaires.
- Migration de l’état hérité du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications du runtime de la passerelle (service installé mais non démarré ; libellé launchd mis en cache).
- Avertissements d’état des canaux (sondés depuis la passerelle en cours d’exécution).
- Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications des bonnes pratiques de runtime de la passerelle (Node vs Bun, chemins des gestionnaires de version).
- Diagnostics de collision de port de la passerelle (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification de la passerelle pour le mode jeton local (propose une génération de jeton lorsqu’aucune source n’existe ; n’écrase pas les configurations de jeton SecretRef).
- Vérification de linger systemd sous Linux.
- Vérification de taille des fichiers bootstrap de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
- Vérification de l’état de l’autocomplétion shell et auto-installation/mise à niveau.
- Vérification de préparation du fournisseur d’embeddings de recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications des installations source (incohérence d’espace de travail pnpm, ressources UI manquantes, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées du wizard.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’une extraction git et que doctor s’exécute de manière interactive, il propose
de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs héritées (par exemple `messages.ackReaction`
sans remplacement spécifique au canal), doctor les normalise vers le schéma actuel.

Cela inclut les anciens champs plats Talk. La configuration publique actuelle de Talk est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes formes
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` vers la map de fournisseurs.

### 2) Migrations de clés de configuration héritées

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
d’exécuter `openclaw doctor`.

Doctor va :

- Expliquer quelles clés héritées ont été trouvées.
- Afficher la migration appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La passerelle exécute aussi automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration hérité, afin que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du magasin de tâches cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de niveau supérieur
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- hérités `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
- Pour les canaux avec `accounts` nommés mais encore des valeurs top-level à compte unique, déplacer ces valeurs à portée de compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- suppression de `browser.relayBindHost` (ancien réglage de relais d’extension)

Les avertissements doctor incluent aussi des recommandations de compte par défaut pour les canaux multicomptes :

- Si deux entrées ou plus sont configurées dans `channels.<channel>.accounts` sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

### 2b) Remplacements de fournisseur OpenCode

Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`,
cela remplace le catalogue OpenCode intégré provenant de `@mariozechner/pi-ai`.
Cela peut forcer des modèles sur la mauvaise API ou ramener les coûts à zéro. Doctor avertit afin que vous
puissiez supprimer ce remplacement et restaurer le routage API + les coûts par modèle.

### 2c) Migration navigateur et préparation de Chrome MCP

Si votre configuration navigateur pointe encore vers le chemin d’extension Chrome supprimé, doctor
la normalise vers le modèle actuel d’attache Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite aussi le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil configuré `existing-session` :

- vérifie si Google Chrome est installé sur le même hôte pour les profils par défaut
  à connexion automatique
- vérifie la version Chrome détectée et avertit si elle est inférieure à Chrome 144
- vous rappelle d’activer le débogage distant dans la page d’inspection du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer ce réglage côté Chrome pour vous. Chrome MCP local à l’hôte
requiert toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte passerelle/nœud
- le navigateur exécuté localement
- le débogage distant activé dans ce navigateur
- l’approbation de la première invite de consentement d’attache dans le navigateur

La préparation ici concerne uniquement les prérequis d’attache locale. Existing-session conserve
les limites actuelles de route Chrome MCP ; les routes avancées comme `responsebody`, l’export PDF,
l’interception de téléchargements et les actions par lot nécessitent toujours un navigateur géré ou un profil CDP brut.

Cette vérification ne s’applique **pas** aux flux Docker, sandbox, navigateur distant ou autres flux
headless. Ceux-ci continuent d’utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OAuth OpenAI Codex est configuré, doctor sonde le point de terminaison
d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou auto-signé),
doctor affiche des consignes de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la
correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si la passerelle est saine.

### 3) Migrations d’état héritées (organisation disque)

Doctor peut migrer les anciennes dispositions sur disque vers la structure actuelle :

- Magasin de sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

Ces migrations sont en meilleur effort et idempotentes ; doctor émet des avertissements lorsqu’il
laisse des dossiers hérités en sauvegarde. La passerelle/CLI migre aussi automatiquement
les anciennes sessions + le répertoire agent au démarrage afin que l’historique/l’authentification/les modèles arrivent dans le
chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est volontairement migrée
que via `openclaw doctor`. La normalisation Talk provider/provider-map compare désormais
par égalité structurelle, de sorte que des différences d’ordre de clés uniquement ne déclenchent plus
de changements répétitifs vides avec `doctor --fix`.

### 3a) Migrations héritées du manifeste de plugin

Doctor analyse tous les manifestes de plugin installés à la recherche de clés de capacité top-level obsolètes
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé héritée est supprimée
sans dupliquer les données.

### 3b) Migrations héritées du magasin cron

Doctor vérifie aussi le magasin des tâches cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciens formats de tâche que le planificateur
accepte encore pour compatibilité.

Nettoyages cron actuels :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs de payload top-level (`message`, `model`, `thinking`, ...) → `payload`
- champs de delivery top-level (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de delivery `provider` dans payload → `delivery.channel` explicite
- tâches simples héritées de repli webhook `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les tâches `notify: true` que lorsqu’il peut le faire sans
modifier le comportement. Si une tâche combine un repli notify hérité avec un mode de delivery existant
non webhook, doctor avertit et laisse cette tâche pour révision manuelle.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de sessions d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes — des fichiers laissés
derrière eux lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrou trouvé, il signale :
le chemin, le PID, si le PID est encore actif, l’ancienneté du verrou et s’il est
considéré comme obsolète (PID mort ou plus de 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrou obsolètes ; sinon, il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Contrôles d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
sessions, identifiants, journaux et configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Autorisations du répertoire d’état** : vérifie l’écriture ; propose de réparer les autorisations
  (et émet un indice `chown` lorsqu’une incohérence propriétaire/groupe est détectée).
- **Répertoire d’état macOS synchronisé dans le cloud** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins synchronisés peuvent provoquer des E/S plus lentes
  et des conditions de concurrence de verrouillage/synchronisation.
- **Répertoire d’état Linux sur SD ou eMMC** : avertit lorsque l’état se résout sur une source de montage `mmcblk*`,
  car les E/S aléatoires adossées à SD ou eMMC peuvent être plus lentes et s’user plus vite sous les écritures de session et d’identifiants.
- **Répertoires de sessions manquants** : `sessions/` et le répertoire du magasin de sessions sont
  nécessaires pour persister l’historique et éviter des plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des
  fichiers de transcription manquants.
- **Session principale « JSONL sur 1 ligne »** : signale lorsque la transcription principale ne contient qu’une ligne (l’historique ne s’accumule pas).
- **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se
  scinder entre installations).
- **Rappel mode distant** : si `gateway.mode=remote`, doctor rappelle de
  l’exécuter sur l’hôte distant (l’état y réside).
- **Autorisations du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par groupe/monde et propose de le restreindre à `600`.

### 5) Santé de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le magasin d’authentification, avertit lorsque des jetons
expirent/sont expirés et peut les rafraîchir lorsque c’est sûr. Si le profil OAuth/jeton
Anthropic est obsolète, il suggère de migrer vers Claude CLI ou une
clé API Anthropic.
Les invites de rafraîchissement n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives de rafraîchissement.

Doctor signale aussi les profils d’authentification temporairement inutilisables en raison de :

- refroidissements courts (limites de débit/timeouts/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle de hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste d’autorisation et avertit lorsqu’elle ne se résout pas ou n’est pas autorisée.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de basculer vers les noms hérités si l’image actuelle est absente.

### 7b) Dépendances runtime des plugins groupés

Doctor vérifie que les dépendances runtime des plugins groupés (par exemple les
packages runtime du plugin Discord) sont présentes dans la racine d’installation d’OpenClaw.
Si certaines sont absentes, doctor signale les packages et les installe en
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrations des services de passerelle et indices de nettoyage

Doctor détecte les services hérités de passerelle (launchd/systemd/schtasks) et
propose de les supprimer et d’installer le service OpenClaw en utilisant le port actuel de la passerelle.
Il peut aussi rechercher des services supplémentaires ressemblant à une passerelle et afficher des indices de nettoyage.
Les services de passerelle OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état héritée en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration puis
exécute les étapes de migration en meilleur effort : migration d’état Matrix héritée et préparation
de l’état chiffré hérité. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et le
démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`), cette vérification
est entièrement ignorée.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DMs sans liste d’autorisation, ou
lorsqu’une politique est configurée de manière dangereuse.

### 10) Linger systemd (Linux)

S’il s’exécute comme service utilisateur systemd, doctor s’assure que lingering est activé afin que la
passerelle reste active après déconnexion.

### 11) État de l’espace de travail (Skills, plugins et répertoires hérités)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des Skills** : compte les Skills éligibles, à exigences manquantes et bloquées par liste d’autorisation.
- **Répertoires d’espace de travail hérités** : avertit lorsque `~/openclaw` ou d’autres répertoires hérités
  existent en parallèle de l’espace de travail actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les identifiants de plugin pour toute
  erreur ; signale les capacités des plugins de bundle.
- **Avertissements de compatibilité des plugins** : signale les plugins qui ont des problèmes de compatibilité avec
  le runtime actuel.
- **Diagnostics des plugins** : fait remonter tous les avertissements ou erreurs de chargement émis par le
  registre des plugins.

### 11b) Taille des fichiers bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget de
caractères configuré. Il signale par fichier le nombre de caractères bruts vs injectés, le
pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total des caractères injectés
comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocomplétion shell

Doctor vérifie si l’autocomplétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil shell utilise un modèle lent d’autocomplétion dynamique
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide
  à fichier mis en cache.
- Si l’autocomplétion est configurée dans le profil mais que le fichier cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune autocomplétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d’authentification de la passerelle (jeton local)

Doctor vérifie la préparation de l’authentification locale par jeton de la passerelle.

- Si le mode jeton nécessite un jeton et qu’aucune source n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

### 12b) Réparations en lecture seule prenant en compte SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour des réparations ciblées de configuration.
- Exemple : la réparation des `@username` Telegram dans `allowFrom` / `groupAllowFrom` essaie d’utiliser les identifiants bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore l’auto-résolution au lieu de planter ou de signaler à tort que le jeton est manquant.

### 13) Vérification de l’état de santé de la passerelle + redémarrage

Doctor exécute une vérification d’état et propose de redémarrer la passerelle lorsqu’elle semble
en mauvaise santé.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche mémoire est prêt
pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut démarrer.
  Si ce n’est pas le cas, affiche des consignes de correction incluant le package npm et une option de chemin binaire manuel.
- **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL de modèle distante/téléchargeable reconnue. Si absent, suggère de passer à un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou le magasin d’authentification. Affiche des indices de correction exploitables si elle manque.
- **Fournisseur automatique** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur distant
  dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde de la passerelle est disponible (passerelle saine au moment de la
vérification), doctor recoupe son résultat avec la configuration visible par la CLI et note
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

### 14) Avertissements d’état des canaux

Si la passerelle est saine, doctor exécute une sonde d’état des canaux et signale
les avertissements avec les correctifs suggérés.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration du superviseur installé (launchd/systemd/schtasks) pour
les valeurs par défaut manquantes ou obsolètes (par ex., dépendances systemd network-online et
délai de redémarrage). Lorsqu’il trouve un écart, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche vers les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les correctifs recommandés sans invites.
- `openclaw doctor --repair --force` écrase les configurations personnalisées du superviseur.
- Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/réparation du service par doctor valide le SecretRef mais ne persiste pas les valeurs résolues du jeton en clair dans les métadonnées d’environnement du service du superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités user-systemd Linux, les vérifications de dérive de jeton de doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics du runtime de la passerelle + du port

Doctor inspecte le runtime du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais n’est pas réellement en cours d’exécution. Il vérifie aussi les collisions
sur le port de la passerelle (par défaut `18789`) et signale les causes probables (passerelle déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques du runtime de la passerelle

Doctor avertit lorsque le service de passerelle s’exécute sur Bun ou sur un chemin Node géré par gestionnaire de version
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de version peuvent se casser après des mises à niveau car le service ne charge pas
l’initialisation de votre shell. Doctor propose de migrer vers une installation Node système lorsque
disponible (Homebrew/apt/choco).

### 18) Écriture de la configuration + métadonnées du wizard

Doctor persiste tout changement de configuration et inscrit des métadonnées du wizard pour enregistrer l’exécution
de doctor.

### 19) Conseils d’espace de travail (sauvegarde + système de mémoire)

Doctor suggère un système de mémoire d’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Consultez [/concepts/agent-workspace](/concepts/agent-workspace) pour un guide complet de la
structure de l’espace de travail et de la sauvegarde git (GitHub ou GitLab privé recommandé).
