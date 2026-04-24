---
read_when:
    - utilisation ou configuration des commandes de chat
    - débogage du routage des commandes ou des permissions
summary: 'Commandes slash : texte vs natif, configuration et commandes prises en charge'
title: commandes slash
x-i18n:
    generated_at: "2026-04-24T07:38:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

Les commandes sont gérées par la Gateway. La plupart des commandes doivent être envoyées comme message **autonome** commençant par `/`.
La commande de chat bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de chat normaux (pas uniquement composés de directives), elles sont traitées comme des « indications inline » et ne persistent **pas** les paramètres de session.
  - Dans les messages ne contenant que des directives (le message contient uniquement des directives), elles persistent dans la session et répondent avec un accusé de réception.
  - Les directives ne s’appliquent que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule
    liste d’autorisation utilisée ; sinon l’autorisation vient des listes d’autorisation/appairages du canal plus `commands.useAccessGroups`.
    Pour les expéditeurs non autorisés, les directives sont traitées comme du texte brut.

Il existe aussi quelques **raccourcis inline** (expéditeurs autorisés/sur liste d’autorisation uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Ils s’exécutent immédiatement, sont retirés avant que le modèle ne voie le message, et le texte restant continue dans le flux normal.

## Configuration

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (par défaut `true`) active l’analyse de `/...` dans les messages de chat.
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes textuelles continuent de fonctionner même si vous définissez cela sur `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour redéfinir par fournisseur (booléen ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’app Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre nativement les commandes de **Skills** lorsque cela est pris en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack exige de créer une commande slash par skill).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour redéfinir par fournisseur (booléen ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell sur l’hôte (`/bash <cmd>` est un alias ; exige les listes d’autorisation `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle combien de temps bash attend avant de passer en mode arrière-plan (`0` place immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lit/écrit `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/état des plugins plus contrôles d’installation et d’activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (redéfinitions runtime uniquement).
- `commands.restart` (par défaut `true`) active `/restart` ainsi que les actions d’outil de redémarrage gateway.
- `commands.ownerAllowFrom` (facultatif) définit la liste d’autorisation explicite du propriétaire pour les surfaces de commande/d’outil réservées au propriétaire. Ceci est distinct de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` par canal (facultatif, par défaut `false`) fait que les commandes réservées au propriétaire exigent une **identité propriétaire** pour s’exécuter sur cette surface. Lorsque `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées de propriétaire natives au fournisseur), soit détenir la portée interne `operator.admin` sur un canal de message interne. Une entrée joker dans `allowFrom` du canal, ou une liste vide/non résolue de candidats propriétaires, n’est **pas** suffisante — les commandes réservées au propriétaire échouent de manière stricte sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient limitées seulement par `ownerAllowFrom` et les listes d’autorisation standard des commandes.
- `commands.ownerDisplay` contrôle la manière dont les ids de propriétaire apparaissent dans le prompt système : `raw` ou `hash`.
- `commands.ownerDisplaySecret` définit facultativement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facultatif) définit une liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la
  seule source d’autorisation pour les commandes et directives (les listes d’autorisation/appairages du canal et `commands.useAccessGroups`
  sont ignorés). Utilisez `"*"` pour une valeur par défaut globale ; les clés spécifiques au fournisseur la redéfinissent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.

## Liste des commandes

Source de référence actuelle :

- les commandes intégrées du cœur proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugin proviennent des appels `registerCommand()` des plugins
- la disponibilité réelle sur votre gateway dépend toujours des drapeaux de configuration, de la surface du canal et des plugins installés/activés

### Commandes intégrées du cœur

Commandes intégrées disponibles aujourd’hui :

- `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
- `/reset soft [message]` conserve la transcription courante, supprime les ids de session backend CLI réutilisés et relance sur place le chargement du démarrage/prompt système.
- `/compact [instructions]` compacte le contexte de session. Voir [/concepts/compaction](/fr/concepts/compaction).
- `/stop` interrompt l’exécution en cours.
- `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de liaison au fil.
- `/think <level>` définit le niveau de réflexion. Les options proviennent du profil du fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium` et `high`, avec des niveaux personnalisés tels que `xhigh`, `adaptive`, `max`, ou `on` binaire seulement lorsque pris en charge. Alias : `/thinking`, `/t`.
- `/verbose on|off|full` active/désactive la sortie détaillée. Alias : `/v`.
- `/trace on|off` active/désactive la sortie de trace des plugins pour la session courante.
- `/fast [status|on|off]` affiche ou définit le mode rapide.
- `/reasoning [on|off|stream]` active/désactive la visibilité du raisonnement. Alias : `/reason`.
- `/elevated [on|off|ask|full]` active/désactive le mode Elevated. Alias : `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exec.
- `/model [name|#|status]` affiche ou définit le modèle.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles d’un fournisseur.
- `/queue <mode>` gère le comportement de file d’attente (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) plus des options comme `debounce:2s cap:25 drop:summarize`.
- `/help` affiche le résumé d’aide court.
- `/commands` affiche le catalogue généré des commandes.
- `/tools [compact|verbose]` affiche ce que l’agent courant peut utiliser maintenant.
- `/status` affiche l’état runtime, y compris les libellés `Runtime`/`Runner` et l’utilisation/quota du fournisseur lorsque disponible.
- `/tasks` liste les tâches d’arrière-plan actives/récentes pour la session courante.
- `/context [list|detail|json]` explique comment le contexte est assemblé.
- `/export-session [path]` exporte la session courante en HTML. Alias : `/export`.
- `/export-trajectory [path]` exporte un [bundle de trajectoire](/fr/tools/trajectory) JSONL pour la session courante. Alias : `/trajectory`.
- `/whoami` affiche votre id d’expéditeur. Alias : `/id`.
- `/skill <name> [input]` exécute un skill par nom.
- `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisation. Texte uniquement.
- `/approve <id> <decision>` résout les invites d’approbation exec.
- `/btw <question>` pose une question annexe sans modifier le contexte futur de la session. Voir [/tools/btw](/fr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session courante.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options runtime.
- `/focus <target>` lie le fil Discord courant ou le sujet/conversation Telegram à une cible de session.
- `/unfocus` supprime la liaison courante.
- `/agents` liste les agents liés au fil pour la session courante.
- `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours d’exécution.
- `/steer <id|#> <message>` envoie un pilotage à un sous-agent en cours d’exécution. Alias : `/tell`.
- `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Exige `commands.config: true`.
- `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Exige `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Réservé au propriétaire pour les écritures. Exige `commands.plugins: true`.
- `/debug show|set|unset|reset` gère les redéfinitions de configuration runtime uniquement. Réservé au propriétaire. Exige `commands.debug: true`.
- `/usage off|tokens|full|cost` contrôle le pied de page d’utilisation par réponse ou affiche un résumé local de coût.
- `/tts on|off|status|provider|limit|summary|audio|help` contrôle TTS. Voir [/tools/tts](/fr/tools/tts).
- `/restart` redémarre OpenClaw lorsqu’il est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
- `/activation mention|always` définit le mode d’activation de groupe.
- `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.
- `/bash <command>` exécute une commande shell sur l’hôte. Texte uniquement. Alias : `! <command>`. Exige `commands.bash: true` plus les listes d’autorisation `tools.elevated`.
- `!poll [sessionId]` vérifie une tâche bash d’arrière-plan.
- `!stop [sessionId]` arrête une tâche bash d’arrière-plan.

### Commandes dock générées

Les commandes dock sont générées depuis des plugins de canal avec prise en charge des commandes natives. Ensemble regroupé actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes des plugins regroupés

Les plugins regroupés peuvent ajouter davantage de commandes slash. Commandes regroupées actuelles dans ce dépôt :

- `/dreaming [on|off|status|help]` active/désactive Dreaming de mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/configuration d’appareil. Voir [Pairing](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes à haut risque du nœud téléphone.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration de voix Talk. Sur Discord, le nom de commande native est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes riches LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais app-server Codex regroupé. Voir [Codex Harness](/fr/plugins/codex-harness).
- Commandes QQBot uniquement :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes de Skills dynamiques

Les Skills invocables par l’utilisateur sont aussi exposés comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque le skill/plugin les enregistre.
- l’enregistrement natif des commandes de skills est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model`, ou un nom de fournisseur (correspondance approximative) ; s’il n’y a pas de correspondance, le texte est traité comme corps du message.
- Pour le détail complet de l’utilisation par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
- `/usage` contrôle le pied de page d’utilisation par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- `/plugins install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin/archive local(e), package npm, ou `clawhub:<pkg>`.
- `/plugins enable|disable` met à jour la configuration du plugin et peut demander un redémarrage.
- Commande native Discord uniquement : `/vc join|leave|status` contrôle les canaux vocaux (exige `channels.discord.voice` et les commandes natives ; non disponible comme texte).
- Les commandes de liaison aux fils Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigent que les liaisons de fils effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence des commandes ACP et comportement runtime : [ACP Agents](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/trace` est plus ciblé que `/verbose` : il révèle uniquement les lignes de trace/débogage appartenant aux plugins et laisse désactivé le bavardage détaillé normal des outils.
- `/fast on|off` persiste une redéfinition de session. Utilisez l’option `inherit` de l’interface Sessions pour l’effacer et revenir aux valeurs par défaut de configuration.
- `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappe à `service_tier=priority` sur les endpoints Responses natifs, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d’échec d’outil sont toujours affichés quand c’est pertinent, mais le texte d’échec détaillé n’est inclus que lorsque `/verbose` est `on` ou `full`.
- `/reasoning`, `/verbose` et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler du raisonnement interne, des sorties d’outils ou des diagnostics de plugins que vous n’aviez pas l’intention d’exposer. Il vaut mieux les laisser désactivés, surtout dans les chats de groupe.
- `/model` persiste immédiatement le nouveau modèle de session.
- Si l’agent est inactif, l’exécution suivante l’utilise tout de suite.
- Si une exécution est déjà active, OpenClaw marque un basculement à chaud comme en attente et ne redémarre sur le nouveau modèle qu’à un point de réessai propre.
- Si une activité d’outil ou une sortie de réponse a déjà commencé, le basculement en attente peut rester en file jusqu’à une opportunité de réessai ultérieure ou jusqu’au prochain tour utilisateur.
- **Chemin rapide :** les messages ne contenant qu’une commande provenant d’expéditeurs sur liste d’autorisation sont traités immédiatement (contournent la file + le modèle).
- **Contrôle par mention dans les groupes :** les messages ne contenant qu’une commande provenant d’expéditeurs sur liste d’autorisation contournent les exigences de mention.
- **Raccourcis inline (expéditeurs sur liste d’autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le reste du message.
  - Exemple : `hey /status` déclenche une réponse d’état, et le texte restant continue dans le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages ne contenant qu’une commande et provenant d’expéditeurs non autorisés sont ignorés silencieusement, et les jetons inline `/...` sont traités comme du texte brut.
- **Commandes de Skills :** les Skills `user-invocable` sont exposés comme commandes slash. Les noms sont normalisés en `a-z0-9_` (max 32 caractères) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute un skill par son nom (utile lorsque les limites de commandes natives empêchent les commandes par skill).
  - Par défaut, les commandes de skills sont transmises au modèle comme une requête normale.
  - Les Skills peuvent déclarer facultativement `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments de commandes natives :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus de boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu de boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument.

## `/tools`

`/tools` répond à une question runtime, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans
cette conversation**.

- Par défaut, `/tools` est compact et optimisé pour un balayage rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces à commandes natives qui prennent en charge des arguments exposent le même changement de mode `compact|verbose`.
- Les résultats sont limités à la session, donc changer d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles au runtime, y compris les outils du cœur, les outils
  de plugin connectés et les outils appartenant aux canaux.

Pour modifier les profils et redéfinitions, utilisez le panneau Tools de la Control UI ou les surfaces de configuration/catalogue au lieu
de traiter `/tools` comme un catalogue statique.

## Surfaces d’utilisation (ce qui apparaît où)

- **Utilisation/quota du fournisseur** (exemple : « Claude 80% restant ») apparaît dans `/status` pour le fournisseur du modèle courant lorsque le suivi d’utilisation est activé. OpenClaw normalise les fenêtres des fournisseurs en `% restant` ; pour MiniMax, les champs de pourcentage restant uniquement sont inversés avant affichage, et les réponses `model_remains` privilégient l’entrée du modèle de chat avec un libellé de plan marqué par modèle.
- **Lignes de tokens/cache** dans `/status` peuvent revenir à la dernière entrée d’utilisation de transcription lorsque l’instantané de session en direct est parcimonieux. Les valeurs en direct non nulles existantes restent prioritaires, et ce repli sur la transcription peut aussi récupérer le libellé du modèle runtime actif plus un total orienté prompt plus grand lorsque les totaux stockés manquent ou sont plus petits.
- **Runtime vs runner :** `/status` indique `Runtime` pour le chemin d’exécution effectif et l’état du sandbox, et `Runner` pour l’entité qui exécute réellement la session : Pi embarqué, fournisseur adossé à la CLI ou harnais/backend ACP.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/auth/endpoints**, pas l’utilisation.

## Sélection de modèle (`/model`)

`/model` est implémenté comme directive.

Exemples :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

Remarques :

- `/model` et `/model list` affichent un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec menus déroulants de fournisseur et de modèle plus une étape Submit.
- `/model <#>` sélectionne à partir de ce sélecteur (et privilégie le fournisseur courant si possible).
- `/model status` affiche la vue détaillée, y compris l’endpoint fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsque disponible.

## Redéfinitions de débogage

`/debug` vous permet de définir des redéfinitions de configuration **runtime uniquement** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Remarques :

- Les redéfinitions s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** dans `openclaw.json`.
- Utilisez `/debug reset` pour effacer toutes les redéfinitions et revenir à la configuration sur disque.

## Sortie de trace des plugins

`/trace` vous permet d’activer/désactiver les **lignes de trace/débogage de plugin limitées à la session** sans activer le mode verbose complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état de trace actuel de la session.
- `/trace on` active les lignes de trace de plugin pour la session courante.
- `/trace off` les désactive à nouveau.
- Les lignes de trace de plugin peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` continue de gérer les redéfinitions de configuration runtime uniquement.
- `/trace` ne remplace pas `/verbose` ; la sortie détaillée normale des outils/état relève toujours de `/verbose`.

## Mises à jour de configuration

`/config` écrit dans votre configuration sur disque (`openclaw.json`). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Remarques :

- La configuration est validée avant écriture ; les modifications invalides sont rejetées.
- Les mises à jour `/config` persistent après redémarrage.

## Mises à jour MCP

`/mcp` écrit les définitions de serveur MCP gérées par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Remarques :

- `/mcp` stocke la configuration dans la configuration OpenClaw, pas dans des paramètres de projet appartenant à Pi.
- Les adaptateurs runtime décident quels transports sont réellement exécutables.

## Mises à jour de plugins

`/plugins` permet aux opérateurs d’inspecter les plugins découverts et d’activer/désactiver leur état dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez-le avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la découverte réelle des plugins sur l’espace de travail courant plus la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration des plugins ; il n’installe ni ne désinstalle les plugins.
- Après des changements d’activation/désactivation, redémarrez la gateway pour les appliquer.

## Remarques sur les surfaces

- **Les commandes textuelles** s’exécutent dans la session de chat normale (les DM partagent `main`, les groupes ont leur propre session).
- **Les commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
- **`/stop`** cible la session de chat active afin de pouvoir interrompre l’exécution courante.
- **Slack :** `channels.slack.slashCommand` est toujours pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont livrés comme boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (pas `/status`) car Slack réserve `/status`. Le texte `/status` continue de fonctionner dans les messages Slack.

## Questions annexes BTW

`/btw` est une **question annexe** rapide sur la session courante.

Contrairement au chat normal :

- il utilise la session courante comme contexte d’arrière-plan,
- il s’exécute comme un appel ponctuel séparé **sans outil**,
- il ne modifie pas le contexte futur de la session,
- il n’est pas écrit dans l’historique de transcription,
- il est livré comme résultat annexe en direct au lieu d’un message normal de l’assistant.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la
tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
```

Voir [Questions annexes BTW](/fr/tools/btw) pour le comportement complet et les détails
d’UX client.

## Liens associés

- [Skills](/fr/tools/skills)
- [Configuration des Skills](/fr/tools/skills-config)
- [Créer des Skills](/fr/tools/creating-skills)
