---
read_when:
    - Ajout ou modification de migrations doctor
    - Introduction de changements cassants de configuration
summary: 'Commande Doctor : contrôles de santé, migrations de configuration et étapes de réparation'
title: Doctor
x-i18n:
    generated_at: "2026-04-06T03:08:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c0a15c522994552a1eef39206bed71fc5bf45746776372f24f31c101bfbd411
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` est l’outil de réparation + migration pour OpenClaw. Il corrige les
configurations/états obsolètes, vérifie l’état de santé et fournit des étapes de réparation concrètes.

## Démarrage rapide

```bash
openclaw doctor
```

### Sans interface / automatisation

```bash
openclaw doctor --yes
```

Accepte les valeurs par défaut sans demander de confirmation (y compris les étapes de réparation de redémarrage/service/sandbox lorsque cela s’applique).

```bash
openclaw doctor --repair
```

Applique les réparations recommandées sans demander de confirmation (réparations + redémarrages lorsque c’est sûr).

```bash
openclaw doctor --repair --force
```

Applique également les réparations agressives (écrase les configurations personnalisées du superviseur).

```bash
openclaw doctor --non-interactive
```

Exécute sans invites et n’applique que les migrations sûres (normalisation de configuration + déplacements d’état sur disque). Ignore les actions de redémarrage/service/sandbox qui nécessitent une confirmation humaine.
Les migrations d’état historiques s’exécutent automatiquement lorsqu’elles sont détectées.

```bash
openclaw doctor --deep
```

Analyse les services système à la recherche d’installations supplémentaires de gateway (launchd/systemd/schtasks).

Si vous voulez examiner les modifications avant l’écriture, ouvrez d’abord le fichier de configuration :

```bash
cat ~/.openclaw/openclaw.json
```

## Ce que cela fait (résumé)

- Mise à jour préalable facultative pour les installations git (mode interactif uniquement).
- Vérification de fraîcheur du protocole UI (reconstruit le Control UI lorsque le schéma de protocole est plus récent).
- Vérification de santé + invite de redémarrage.
- Résumé de l’état des skills (éligibles/absents/bloqués) et état des plugins.
- Normalisation de la configuration pour les valeurs historiques.
- Migration de la configuration Talk depuis les anciens champs plats `talk.*` vers `talk.provider` + `talk.providers.<provider>`.
- Vérifications de migration du navigateur pour les anciennes configurations d’extension Chrome et préparation de Chrome MCP.
- Avertissements sur les remplacements de fournisseur OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Vérification des prérequis TLS OAuth pour les profils OpenAI Codex OAuth.
- Migration de l’état historique sur disque (sessions/répertoire agent/authentification WhatsApp).
- Migration des anciennes clés de contrat de manifeste de plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migration de l’ancien stockage cron (`jobId`, `schedule.cron`, champs `delivery`/`payload` au niveau supérieur, `provider` dans `payload`, jobs de repli webhook simples `notify: true`).
- Inspection des fichiers de verrouillage de session et nettoyage des verrous obsolètes.
- Vérifications d’intégrité et de permissions de l’état (sessions, transcriptions, répertoire d’état).
- Vérifications des permissions du fichier de configuration (chmod 600) lors d’une exécution locale.
- Santé de l’authentification des modèles : vérifie l’expiration OAuth, peut actualiser les jetons qui expirent et signale les états de refroidissement/désactivation des profils d’authentification.
- Détection d’un répertoire d’espace de travail supplémentaire (`~/openclaw`).
- Réparation de l’image sandbox lorsque le sandboxing est activé.
- Migration des services historiques et détection de gateways supplémentaires.
- Migration d’état historique du canal Matrix (en mode `--fix` / `--repair`).
- Vérifications de l’exécution de la gateway (service installé mais non lancé ; étiquette launchd en cache).
- Avertissements d’état des canaux (sondés depuis la gateway en cours d’exécution).
- Audit de la configuration du superviseur (launchd/systemd/schtasks) avec réparation facultative.
- Vérifications des bonnes pratiques d’exécution de la gateway (Node vs Bun, chemins de gestionnaire de versions).
- Diagnostics de collision de port de gateway (par défaut `18789`).
- Avertissements de sécurité pour les politiques DM ouvertes.
- Vérifications d’authentification de la gateway pour le mode de jeton local (propose la génération d’un jeton lorsqu’aucune source de jeton n’existe ; n’écrase pas les configurations `token` gérées par SecretRef).
- Vérification de systemd linger sous Linux.
- Vérification de la taille des fichiers bootstrap de l’espace de travail (avertissements de troncature/proximité de limite pour les fichiers de contexte).
- Vérification de l’état de l’autocomplétion du shell et installation/mise à niveau automatique.
- Vérification de préparation du fournisseur d’embeddings pour la recherche mémoire (modèle local, clé API distante ou binaire QMD).
- Vérifications d’installation depuis les sources (incohérence de workspace pnpm, actifs UI manquants, binaire tsx manquant).
- Écrit la configuration mise à jour + les métadonnées de l’assistant.

## Comportement détaillé et justification

### 0) Mise à jour facultative (installations git)

S’il s’agit d’un checkout git et que doctor s’exécute en mode interactif, il propose
de mettre à jour (fetch/rebase/build) avant d’exécuter doctor.

### 1) Normalisation de la configuration

Si la configuration contient des formes de valeurs historiques (par exemple `messages.ackReaction`
sans remplacement spécifique à un canal), doctor les normalise vers le schéma
actuel.

Cela inclut les anciens champs plats Talk. La configuration Talk publique actuelle est
`talk.provider` + `talk.providers.<provider>`. Doctor réécrit les anciennes
formes `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` dans la map de fournisseurs.

### 2) Migrations des clés de configuration historiques

Lorsque la configuration contient des clés obsolètes, les autres commandes refusent de s’exécuter et demandent
de lancer `openclaw doctor`.

Doctor va :

- Expliquer quelles clés historiques ont été trouvées.
- Montrer la migration qu’il a appliquée.
- Réécrire `~/.openclaw/openclaw.json` avec le schéma mis à jour.

La Gateway exécute également automatiquement les migrations doctor au démarrage lorsqu’elle détecte un
format de configuration historique, afin que les configurations obsolètes soient réparées sans intervention manuelle.
Les migrations du stockage des jobs cron sont gérées par `openclaw doctor --fix`.

Migrations actuelles :

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` au niveau supérieur
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
- Pour les canaux avec des `accounts` nommés mais des valeurs de canal au niveau supérieur encore présentes pour un seul compte, déplacer ces valeurs à portée de compte vers le compte promu choisi pour ce canal (`accounts.default` pour la plupart des canaux ; Matrix peut conserver une cible nommée/par défaut existante correspondante)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- supprimer `browser.relayBindHost` (ancien paramètre de relais d’extension)

Les avertissements de doctor incluent également des recommandations sur le compte par défaut pour les canaux multi-comptes :

- Si au moins deux entrées `channels.<channel>.accounts` sont configurées sans `channels.<channel>.defaultAccount` ni `accounts.default`, doctor avertit que le routage de repli peut choisir un compte inattendu.
- Si `channels.<channel>.defaultAccount` est défini sur un identifiant de compte inconnu, doctor avertit et liste les identifiants de compte configurés.

### 2b) Remplacements de fournisseur OpenCode

Si vous avez ajouté manuellement `models.providers.opencode`, `opencode-zen` ou `opencode-go`,
cela remplace le catalogue OpenCode intégré de `@mariozechner/pi-ai`.
Cela peut forcer les modèles à utiliser la mauvaise API ou annuler les coûts. Doctor avertit afin que
vous puissiez supprimer le remplacement et rétablir le routage API + les coûts par modèle.

### 2c) Migration du navigateur et préparation de Chrome MCP

Si la configuration de votre navigateur pointe encore vers l’ancien chemin d’extension Chrome, doctor
la normalise vers le modèle actuel d’attache Chrome MCP local à l’hôte :

- `browser.profiles.*.driver: "extension"` devient `"existing-session"`
- `browser.relayBindHost` est supprimé

Doctor audite également le chemin Chrome MCP local à l’hôte lorsque vous utilisez `defaultProfile:
"user"` ou un profil `existing-session` configuré :

- vérifie si Google Chrome est installé sur le même hôte pour les profils de connexion automatique par défaut
- vérifie la version détectée de Chrome et avertit lorsqu’elle est inférieure à Chrome 144
- vous rappelle d’activer le débogage à distance dans la page inspect du navigateur (par
  exemple `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  ou `edge://inspect/#remote-debugging`)

Doctor ne peut pas activer pour vous le paramètre côté Chrome. Le Chrome MCP local à l’hôte
nécessite toujours :

- un navigateur basé sur Chromium 144+ sur l’hôte gateway/node
- le navigateur exécuté localement
- le débogage à distance activé dans ce navigateur
- l’approbation de la première invite de consentement d’attache dans le navigateur

La préparation ici concerne uniquement les prérequis d’attache locale. Existing-session conserve
les limites de route Chrome MCP actuelles ; les routes avancées comme `responsebody`, l’export PDF,
l’interception de téléchargements et les actions par lot nécessitent toujours un navigateur géré
ou un profil CDP brut.

Cette vérification **ne** s’applique **pas** à Docker, sandbox, remote-browser ou autres
flux sans interface. Ceux-ci continuent d’utiliser CDP brut.

### 2d) Prérequis TLS OAuth

Lorsqu’un profil OpenAI Codex OAuth est configuré, doctor sonde le point de terminaison
d’autorisation OpenAI pour vérifier que la pile TLS locale Node/OpenSSL peut
valider la chaîne de certificats. Si la sonde échoue avec une erreur de certificat (par
exemple `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificat expiré ou certificat autosigné),
doctor affiche des recommandations de correction spécifiques à la plateforme. Sur macOS avec un Node Homebrew, la
correction est généralement `brew postinstall ca-certificates`. Avec `--deep`, la sonde s’exécute
même si la gateway est saine.

### 3) Migrations d’état historiques (disposition sur disque)

Doctor peut migrer les anciennes dispositions sur disque vers la structure actuelle :

- Stockage des sessions + transcriptions :
  - de `~/.openclaw/sessions/` vers `~/.openclaw/agents/<agentId>/sessions/`
- Répertoire agent :
  - de `~/.openclaw/agent/` vers `~/.openclaw/agents/<agentId>/agent/`
- État d’authentification WhatsApp (Baileys) :
  - depuis l’ancien `~/.openclaw/credentials/*.json` (sauf `oauth.json`)
  - vers `~/.openclaw/credentials/whatsapp/<accountId>/...` (identifiant de compte par défaut : `default`)

Ces migrations sont réalisées au mieux et sont idempotentes ; doctor émettra des avertissements lorsqu’il
laisse des dossiers historiques en place comme sauvegardes. La Gateway/CLI migre aussi automatiquement
les anciennes sessions + le répertoire agent au démarrage afin que l’historique/l’authentification/les modèles se retrouvent dans le
chemin par agent sans exécution manuelle de doctor. L’authentification WhatsApp n’est intentionnellement migrée
que via `openclaw doctor`. La normalisation du fournisseur/de la map de fournisseurs Talk compare désormais
par égalité structurelle, donc les différences de simple ordre des clés ne déclenchent plus
de modifications répétées sans effet avec `doctor --fix`.

### 3a) Migrations historiques du manifeste de plugin

Doctor analyse tous les manifestes de plugins installés à la recherche de clés de capacité
de niveau supérieur obsolètes (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Lorsqu’elles sont trouvées, il propose de les déplacer dans l’objet `contracts`
et de réécrire le fichier manifeste sur place. Cette migration est idempotente ;
si la clé `contracts` contient déjà les mêmes valeurs, la clé historique est supprimée
sans dupliquer les données.

### 3b) Migrations historiques du stockage cron

Doctor vérifie également le stockage des jobs cron (`~/.openclaw/cron/jobs.json` par défaut,
ou `cron.store` lorsqu’il est remplacé) à la recherche d’anciennes formes de jobs que le planificateur accepte
encore pour compatibilité.

Nettoyages cron actuels :

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- champs payload de niveau supérieur (`message`, `model`, `thinking`, ...) → `payload`
- champs delivery de niveau supérieur (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de delivery `provider` dans `payload` → `delivery.channel` explicite
- jobs de repli webhook historiques simples `notify: true` → `delivery.mode="webhook"` explicite avec `delivery.to=cron.webhook`

Doctor ne migre automatiquement les jobs `notify: true` que lorsqu’il peut le faire sans
changer le comportement. Si un job combine un ancien repli notify avec un mode
de delivery non webhook existant, doctor avertit et laisse ce job pour un examen manuel.

### 3c) Nettoyage des verrous de session

Doctor analyse chaque répertoire de session d’agent à la recherche de fichiers de verrouillage d’écriture obsolètes —
des fichiers laissés derrière lorsqu’une session s’est terminée anormalement. Pour chaque fichier de verrouillage trouvé, il signale :
le chemin, le PID, si le PID est toujours actif, l’âge du verrou et s’il est
considéré comme obsolète (PID mort ou âgé de plus de 30 minutes). En mode `--fix` / `--repair`,
il supprime automatiquement les fichiers de verrouillage obsolètes ; sinon il affiche une note et
vous demande de relancer avec `--fix`.

### 4) Vérifications d’intégrité de l’état (persistance des sessions, routage et sécurité)

Le répertoire d’état est le tronc cérébral opérationnel. S’il disparaît, vous perdez
les sessions, les identifiants, les journaux et la configuration (sauf si vous avez des sauvegardes ailleurs).

Doctor vérifie :

- **Répertoire d’état manquant** : avertit d’une perte d’état catastrophique, propose de recréer
  le répertoire et rappelle qu’il ne peut pas récupérer les données manquantes.
- **Permissions du répertoire d’état** : vérifie la possibilité d’écrire ; propose de réparer les permissions
  (et émet une indication `chown` lorsqu’une incohérence propriétaire/groupe est détectée).
- **Répertoire d’état synchronisé dans le cloud sur macOS** : avertit lorsque l’état se résout sous iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) ou
  `~/Library/CloudStorage/...` car les chemins soutenus par la synchronisation peuvent provoquer des E/S plus lentes
  et des courses de verrouillage/synchronisation.
- **Répertoire d’état sur SD ou eMMC sous Linux** : avertit lorsque l’état se résout vers une source de montage `mmcblk*`,
  car les E/S aléatoires sur carte SD ou eMMC peuvent être plus lentes et user
  plus rapidement sous les écritures de sessions et d’identifiants.
- **Répertoires de session manquants** : `sessions/` et le répertoire de stockage des sessions sont
  nécessaires pour conserver l’historique et éviter les plantages `ENOENT`.
- **Incohérence de transcription** : avertit lorsque des entrées de session récentes ont des fichiers
  de transcription manquants.
- **Session principale “JSONL sur 1 ligne”** : signale lorsque la transcription principale n’a qu’une seule
  ligne (l’historique ne s’accumule pas).
- **Plusieurs répertoires d’état** : avertit lorsque plusieurs dossiers `~/.openclaw` existent entre
  différents répertoires personnels ou lorsque `OPENCLAW_STATE_DIR` pointe ailleurs (l’historique peut se
  répartir entre installations).
- **Rappel mode distant** : si `gateway.mode=remote`, doctor rappelle de l’exécuter
  sur l’hôte distant (l’état s’y trouve).
- **Permissions du fichier de configuration** : avertit si `~/.openclaw/openclaw.json` est
  lisible par le groupe/le monde et propose de les resserrer à `600`.

### 5) Santé de l’authentification des modèles (expiration OAuth)

Doctor inspecte les profils OAuth dans le stockage d’authentification, avertit lorsque les jetons
expirent ou ont expiré et peut les actualiser lorsque c’est sûr. Si le profil
OAuth/jeton Anthropic est obsolète, il suggère une clé API Anthropic ou l’ancien
chemin setup-token Anthropic.
Les invites d’actualisation n’apparaissent qu’en mode interactif (TTY) ; `--non-interactive`
ignore les tentatives d’actualisation.

Doctor détecte également les anciens états supprimés de Claude CLI Anthropic. Si d’anciens
octets d’identifiant `anthropic:claude-cli` existent encore dans `auth-profiles.json`,
doctor les reconvertit en profils de jeton/OAuth Anthropic et réécrit les anciennes références de modèle
`claude-cli/...`.
Si les octets ont disparu, doctor supprime l’ancienne configuration et affiche à la place
des commandes de récupération.

Doctor signale également les profils d’authentification temporairement inutilisables en raison de :

- courts refroidissements (limites de débit/délais d’attente/échecs d’authentification)
- désactivations plus longues (échecs de facturation/crédit)

### 6) Validation du modèle de hooks

Si `hooks.gmail.model` est défini, doctor valide la référence de modèle par rapport au
catalogue et à la liste autorisée et avertit lorsqu’elle ne se résoudra pas ou est interdite.

### 7) Réparation de l’image sandbox

Lorsque le sandboxing est activé, doctor vérifie les images Docker et propose de construire ou
de basculer vers les anciens noms si l’image actuelle est manquante.

### 7b) Dépendances d’exécution des plugins groupés

Doctor vérifie que les dépendances d’exécution des plugins groupés (par exemple les
packages d’exécution du plugin Discord) sont présentes dans la racine d’installation d’OpenClaw.
Si certaines sont manquantes, doctor signale les packages et les installe en
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrations des services gateway et indications de nettoyage

Doctor détecte les anciens services gateway (launchd/systemd/schtasks) et
propose de les supprimer puis d’installer le service OpenClaw en utilisant le port
gateway actuel. Il peut également analyser d’autres services ressemblant à une gateway et afficher des indications de nettoyage.
Les services gateway OpenClaw nommés par profil sont considérés comme de première classe et ne sont pas
signalés comme « supplémentaires ».

### 8b) Migration Matrix au démarrage

Lorsqu’un compte de canal Matrix a une migration d’état historique en attente ou exploitable,
doctor (en mode `--fix` / `--repair`) crée un instantané avant migration puis
exécute les étapes de migration au mieux : migration de l’état Matrix historique et préparation
de l’état chiffré historique. Les deux étapes ne sont pas fatales ; les erreurs sont journalisées et
le démarrage continue. En mode lecture seule (`openclaw doctor` sans `--fix`) cette vérification
est entièrement ignorée.

### 9) Avertissements de sécurité

Doctor émet des avertissements lorsqu’un fournisseur est ouvert aux DM sans liste d’autorisation, ou
lorsqu’une politique est configurée de manière dangereuse.

### 10) systemd linger (Linux)

S’il s’exécute comme service utilisateur systemd, doctor s’assure que lingering est activé afin que la
gateway reste active après déconnexion.

### 11) État de l’espace de travail (skills, plugins et anciens répertoires)

Doctor affiche un résumé de l’état de l’espace de travail pour l’agent par défaut :

- **État des skills** : compte les skills éligibles, à exigences manquantes et bloqués par liste d’autorisation.
- **Anciens répertoires d’espace de travail** : avertit lorsque `~/openclaw` ou d’autres anciens répertoires d’espace de travail
  existent à côté de l’espace de travail actuel.
- **État des plugins** : compte les plugins chargés/désactivés/en erreur ; liste les identifiants de plugin pour toute
  erreur ; signale les capacités des plugins groupés.
- **Avertissements de compatibilité des plugins** : signale les plugins qui ont des problèmes de compatibilité avec
  l’exécution actuelle.
- **Diagnostics des plugins** : expose tous les avertissements ou erreurs au chargement émis par le
  registre de plugins.

### 11b) Taille des fichiers bootstrap

Doctor vérifie si les fichiers bootstrap de l’espace de travail (par exemple `AGENTS.md`,
`CLAUDE.md` ou d’autres fichiers de contexte injectés) sont proches ou au-delà du budget
de caractères configuré. Il signale pour chaque fichier le nombre de caractères bruts et injectés,
le pourcentage de troncature, la cause de la troncature (`max/file` ou `max/total`) et le total
des caractères injectés comme fraction du budget total. Lorsque des fichiers sont tronqués ou proches
de la limite, doctor affiche des conseils pour ajuster `agents.defaults.bootstrapMaxChars`
et `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocomplétion du shell

Doctor vérifie si l’autocomplétion par tabulation est installée pour le shell actuel
(zsh, bash, fish ou PowerShell) :

- Si le profil shell utilise un schéma lent d’autocomplétion dynamique
  (`source <(openclaw completion ...)`), doctor le met à niveau vers la variante plus rapide
  basée sur un fichier en cache.
- Si l’autocomplétion est configurée dans le profil mais que le fichier de cache est manquant,
  doctor régénère automatiquement le cache.
- Si aucune autocomplétion n’est configurée, doctor propose de l’installer
  (mode interactif uniquement ; ignoré avec `--non-interactive`).

Exécutez `openclaw completion --write-state` pour régénérer manuellement le cache.

### 12) Vérifications d’authentification de la gateway (jeton local)

Doctor vérifie la préparation de l’authentification par jeton de la gateway locale.

- Si le mode jeton nécessite un jeton et qu’aucune source de jeton n’existe, doctor propose d’en générer un.
- Si `gateway.auth.token` est géré par SecretRef mais indisponible, doctor avertit et ne l’écrase pas avec du texte brut.
- `openclaw doctor --generate-gateway-token` force la génération uniquement lorsqu’aucun SecretRef de jeton n’est configuré.

### 12b) Réparations en lecture seule tenant compte de SecretRef

Certains flux de réparation doivent inspecter les identifiants configurés sans affaiblir le comportement fail-fast à l’exécution.

- `openclaw doctor --fix` utilise désormais le même modèle récapitulatif SecretRef en lecture seule que les commandes de la famille status pour des réparations de configuration ciblées.
- Exemple : la réparation Telegram `allowFrom` / `groupAllowFrom` avec `@username` essaie d’utiliser les identifiants du bot configurés lorsqu’ils sont disponibles.
- Si le jeton du bot Telegram est configuré via SecretRef mais indisponible dans le chemin de commande actuel, doctor signale que l’identifiant est configuré mais indisponible et ignore la résolution automatique au lieu de planter ou de signaler à tort que le jeton est manquant.

### 13) Vérification de santé de la gateway + redémarrage

Doctor exécute une vérification de santé et propose de redémarrer la gateway lorsqu’elle semble
en mauvais état.

### 13b) Préparation de la recherche mémoire

Doctor vérifie si le fournisseur d’embeddings configuré pour la recherche mémoire est prêt
pour l’agent par défaut. Le comportement dépend du backend et du fournisseur configurés :

- **Backend QMD** : sonde si le binaire `qmd` est disponible et peut démarrer.
  Sinon, affiche des conseils de correction, y compris le package npm et une option de chemin binaire manuel.
- **Fournisseur local explicite** : vérifie la présence d’un fichier de modèle local ou d’une URL
  de modèle distante/téléchargeable reconnue. S’il est absent, suggère de passer à un fournisseur distant.
- **Fournisseur distant explicite** (`openai`, `voyage`, etc.) : vérifie qu’une clé API est
  présente dans l’environnement ou le stockage d’authentification. Affiche des conseils de correction exploitables si elle manque.
- **Fournisseur auto** : vérifie d’abord la disponibilité du modèle local, puis essaie chaque fournisseur
  distant dans l’ordre de sélection automatique.

Lorsqu’un résultat de sonde gateway est disponible (la gateway était saine au moment de la
vérification), doctor recoupe son résultat avec la configuration visible côté CLI et note
toute divergence.

Utilisez `openclaw memory status --deep` pour vérifier la préparation des embeddings à l’exécution.

### 14) Avertissements d’état des canaux

Si la gateway est saine, doctor exécute une sonde d’état des canaux et signale
les avertissements avec les corrections suggérées.

### 15) Audit + réparation de la configuration du superviseur

Doctor vérifie la configuration du superviseur installé (launchd/systemd/schtasks) pour
les valeurs par défaut manquantes ou obsolètes (par ex. dépendances systemd network-online et
délai de redémarrage). Lorsqu’il détecte une incohérence, il recommande une mise à jour et peut
réécrire le fichier de service/la tâche avec les valeurs par défaut actuelles.

Remarques :

- `openclaw doctor` demande confirmation avant de réécrire la configuration du superviseur.
- `openclaw doctor --yes` accepte les invites de réparation par défaut.
- `openclaw doctor --repair` applique les corrections recommandées sans invite.
- `openclaw doctor --repair --force` écrase les configurations personnalisées du superviseur.
- Si l’authentification par jeton exige un jeton et que `gateway.auth.token` est géré par SecretRef, l’installation/la réparation de service par doctor valide le SecretRef mais ne conserve pas les valeurs de jeton en texte brut résolues dans les métadonnées d’environnement du service superviseur.
- Si l’authentification par jeton exige un jeton et que le SecretRef de jeton configuré n’est pas résolu, doctor bloque le chemin d’installation/réparation avec des indications exploitables.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, doctor bloque l’installation/la réparation jusqu’à ce que le mode soit défini explicitement.
- Pour les unités Linux user-systemd, les vérifications de dérive de jeton de doctor incluent désormais à la fois les sources `Environment=` et `EnvironmentFile=` lors de la comparaison des métadonnées d’authentification du service.
- Vous pouvez toujours forcer une réécriture complète via `openclaw gateway install --force`.

### 16) Diagnostics d’exécution + de port de la gateway

Doctor inspecte l’exécution du service (PID, dernier statut de sortie) et avertit lorsque le
service est installé mais ne s’exécute pas réellement. Il vérifie également les collisions de port
sur le port de la gateway (par défaut `18789`) et signale les causes probables (gateway déjà
en cours d’exécution, tunnel SSH).

### 17) Bonnes pratiques d’exécution de la gateway

Doctor avertit lorsque le service gateway s’exécute sur Bun ou sur un chemin Node géré par un gestionnaire de versions
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Les canaux WhatsApp + Telegram nécessitent Node,
et les chemins de gestionnaire de versions peuvent casser après les mises à niveau car le service ne
charge pas l’initialisation de votre shell. Doctor propose de migrer vers une installation système de Node lorsque
disponible (Homebrew/apt/choco).

### 18) Écriture de configuration + métadonnées de l’assistant

Doctor enregistre toutes les modifications de configuration et appose les métadonnées de l’assistant pour enregistrer
l’exécution de doctor.

### 19) Conseils sur l’espace de travail (sauvegarde + système de mémoire)

Doctor suggère un système de mémoire pour l’espace de travail lorsqu’il est absent et affiche un conseil de sauvegarde
si l’espace de travail n’est pas déjà sous git.

Voir [/concepts/agent-workspace](/fr/concepts/agent-workspace) pour un guide complet sur la
structure de l’espace de travail et la sauvegarde git (GitHub ou GitLab privé recommandé).
