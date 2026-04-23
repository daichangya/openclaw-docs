---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
summary: 'Commandes slash : texte vs natives, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-23T14:02:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13290dcdf649ae66603a92a0aca68460bb63ff476179cc2dded796aaa841d66c
    source_path: tools/slash-commands.md
    workflow: 15
---

# Commandes slash

Les commandes sont gérées par la Gateway. La plupart des commandes doivent être envoyées comme message **autonome** commençant par `/`.
La commande de chat bash réservée à l’hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de chat normaux (pas uniquement composés de directives), elles sont traitées comme des « indications en ligne » et ne persistent **pas** les paramètres de session.
  - Dans les messages composés uniquement de directives (le message ne contient que des directives), elles persistent dans la session et répondent avec un accusé de réception.
  - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c’est la seule
    liste d’autorisation utilisée ; sinon, l’autorisation provient des listes d’autorisation/d’appairage du canal ainsi que de `commands.useAccessGroups`.
    Les expéditeurs non autorisés voient les directives traitées comme du texte brut.

Il existe aussi quelques **raccourcis en ligne** (expéditeurs autorisés/en liste d’autorisation uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
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
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes texte fonctionnent toujours même si vous définissez cette option sur `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu’à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour remplacer par fournisseur (bool ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l’app Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre nativement les commandes de **Skills** lorsque c’est pris en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite la création d’une commande slash par compétence).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour remplacer par fournisseur (bool ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell sur l’hôte (`/bash <cmd>` est un alias ; nécessite les listes d’autorisation `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle combien de temps bash attend avant de passer en mode arrière-plan (`0` passe immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lit/écrit `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lit/écrit la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/statut des plugins plus contrôles d’installation + activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (remplacements uniquement à l’exécution).
- `commands.restart` (par défaut `true`) active `/restart` ainsi que les actions d’outil de redémarrage de la Gateway.
- `commands.ownerAllowFrom` (facultatif) définit la liste d’autorisation explicite du propriétaire pour les surfaces de commande/outil réservées au propriétaire. Cela est distinct de `commands.allowFrom`.
- `channels.<channel>.commands.enforceOwnerForCommands` par canal (facultatif, par défaut `false`) fait en sorte que les commandes réservées au propriétaire exigent l’**identité du propriétaire** pour s’exécuter sur cette surface. Quand cette option vaut `true`, l’expéditeur doit soit correspondre à un candidat propriétaire résolu (par exemple une entrée dans `commands.ownerAllowFrom` ou des métadonnées natives de propriétaire du fournisseur), soit posséder la portée interne `operator.admin` sur un canal de message interne. Une entrée générique dans `allowFrom` du canal, ou une liste de candidats propriétaires vide/non résolue, n’est **pas** suffisante — les commandes réservées au propriétaire échouent en mode fermé sur ce canal. Laissez cette option désactivée si vous voulez que les commandes réservées au propriétaire soient contrôlées uniquement par `ownerAllowFrom` et les listes d’autorisation de commande standard.
- `commands.ownerDisplay` contrôle la façon dont les IDs propriétaires apparaissent dans le prompt système : `raw` ou `hash`.
- `commands.ownerDisplaySecret` définit facultativement le secret HMAC utilisé lorsque `commands.ownerDisplay="hash"`.
- `commands.allowFrom` (facultatif) définit une liste d’autorisation par fournisseur pour l’autorisation des commandes. Lorsqu’elle est configurée, c’est la
  seule source d’autorisation pour les commandes et directives (`commands.useAccessGroups` ainsi que les listes d’autorisation/appairage du canal
  sont ignorés). Utilisez `"*"` pour une valeur par défaut globale ; les clés spécifiques au fournisseur la remplacent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d’autorisation/politiques pour les commandes lorsque `commands.allowFrom` n’est pas défini.

## Liste des commandes

Source de vérité actuelle :

- les commandes intégrées core proviennent de `src/auto-reply/commands-registry.shared.ts`
- les commandes dock générées proviennent de `src/auto-reply/commands-registry.data.ts`
- les commandes de plugin proviennent des appels `registerCommand()` des plugins
- la disponibilité réelle sur votre Gateway dépend toujours des indicateurs de configuration, de la surface du canal et des plugins installés/activés

### Commandes intégrées core

Commandes intégrées disponibles aujourd’hui :

- `/new [model]` démarre une nouvelle session ; `/reset` est l’alias de réinitialisation.
- `/reset soft [message]` conserve la transcription actuelle, supprime les IDs de session backend CLI réutilisés et relance sur place le chargement du démarrage/prompt système.
- `/compact [instructions]` compacte le contexte de la session. Voir [/concepts/compaction](/fr/concepts/compaction).
- `/stop` interrompt l’exécution en cours.
- `/session idle <duration|off>` et `/session max-age <duration|off>` gèrent l’expiration de la liaison de fil.
- `/think <level>` définit le niveau de réflexion. Les options proviennent du profil du fournisseur du modèle actif ; les niveaux courants sont `off`, `minimal`, `low`, `medium` et `high`, avec des niveaux personnalisés comme `xhigh`, `adaptive`, `max` ou le binaire `on` uniquement là où ils sont pris en charge. Alias : `/thinking`, `/t`.
- `/verbose on|off|full` active ou désactive la sortie verbeuse. Alias : `/v`.
- `/trace on|off` active ou désactive la sortie de trace des plugins pour la session en cours.
- `/fast [status|on|off]` affiche ou définit le mode rapide.
- `/reasoning [on|off|stream]` active ou désactive la visibilité du raisonnement. Alias : `/reason`.
- `/elevated [on|off|ask|full]` active ou désactive le mode élevé. Alias : `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` affiche ou définit les valeurs par défaut d’exécution.
- `/model [name|#|status]` affiche ou définit le modèle.
- `/models [provider] [page] [limit=<n>|size=<n>|all]` liste les fournisseurs ou les modèles d’un fournisseur.
- `/queue <mode>` gère le comportement de la file (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) ainsi que des options comme `debounce:2s cap:25 drop:summarize`.
- `/help` affiche le résumé d’aide court.
- `/commands` affiche le catalogue de commandes généré.
- `/tools [compact|verbose]` affiche ce que l’agent actuel peut utiliser maintenant.
- `/status` affiche le statut d’exécution, y compris les libellés `Runtime`/`Runner` et l’usage/quota du fournisseur lorsqu’ils sont disponibles.
- `/tasks` liste les tâches d’arrière-plan actives/récentes pour la session en cours.
- `/context [list|detail|json]` explique comment le contexte est assemblé.
- `/export-session [path]` exporte la session actuelle en HTML. Alias : `/export`.
- `/export-trajectory [path]` exporte un [bundle de trajectoire](/fr/tools/trajectory) JSONL pour la session en cours. Alias : `/trajectory`.
- `/whoami` affiche votre ID d’expéditeur. Alias : `/id`.
- `/skill <name> [input]` exécute une compétence par nom.
- `/allowlist [list|add|remove] ...` gère les entrées de liste d’autorisation. Texte uniquement.
- `/approve <id> <decision>` résout les invites d’approbation d’exécution.
- `/btw <question>` pose une question annexe sans modifier le contexte futur de la session. Voir [/tools/btw](/fr/tools/btw).
- `/subagents list|kill|log|info|send|steer|spawn` gère les exécutions de sous-agents pour la session en cours.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` gère les sessions ACP et les options d’exécution.
- `/focus <target>` lie le fil Discord actuel ou le sujet/conversation Telegram à une cible de session.
- `/unfocus` supprime la liaison actuelle.
- `/agents` liste les agents liés à un fil pour la session en cours.
- `/kill <id|#|all>` interrompt un ou tous les sous-agents en cours d’exécution.
- `/steer <id|#> <message>` envoie un pilotage à un sous-agent en cours d’exécution. Alias : `/tell`.
- `/config show|get|set|unset` lit ou écrit `openclaw.json`. Réservé au propriétaire. Nécessite `commands.config: true`.
- `/mcp show|get|set|unset` lit ou écrit la configuration de serveur MCP gérée par OpenClaw sous `mcp.servers`. Réservé au propriétaire. Nécessite `commands.mcp: true`.
- `/plugins list|inspect|show|get|install|enable|disable` inspecte ou modifie l’état des plugins. `/plugin` est un alias. Réservé au propriétaire pour les écritures. Nécessite `commands.plugins: true`.
- `/debug show|set|unset|reset` gère les remplacements de configuration uniquement à l’exécution. Réservé au propriétaire. Nécessite `commands.debug: true`.
- `/usage off|tokens|full|cost` contrôle le pied de page d’usage par réponse ou affiche un résumé local des coûts.
- `/tts on|off|status|provider|limit|summary|audio|help` contrôle la synthèse vocale. Voir [/tools/tts](/fr/tools/tts).
- `/restart` redémarre OpenClaw lorsque c’est activé. Par défaut : activé ; définissez `commands.restart: false` pour le désactiver.
- `/activation mention|always` définit le mode d’activation de groupe.
- `/send on|off|inherit` définit la politique d’envoi. Réservé au propriétaire.
- `/bash <command>` exécute une commande shell sur l’hôte. Texte uniquement. Alias : `! <command>`. Nécessite `commands.bash: true` ainsi que les listes d’autorisation `tools.elevated`.
- `!poll [sessionId]` vérifie une tâche bash d’arrière-plan.
- `!stop [sessionId]` arrête une tâche bash d’arrière-plan.

### Commandes dock générées

Les commandes dock sont générées à partir des plugins de canal avec prise en charge des commandes natives. Ensemble fourni avec le bundle actuel :

- `/dock-discord` (alias : `/dock_discord`)
- `/dock-mattermost` (alias : `/dock_mattermost`)
- `/dock-slack` (alias : `/dock_slack`)
- `/dock-telegram` (alias : `/dock_telegram`)

### Commandes des plugins fournis avec le bundle

Les plugins fournis avec le bundle peuvent ajouter d’autres commandes slash. Commandes fournies actuellement dans ce dépôt :

- `/dreaming [on|off|status|help]` active ou désactive le Dreaming de mémoire. Voir [Dreaming](/fr/concepts/dreaming).
- `/pair [qr|status|pending|approve|cleanup|notify]` gère le flux d’appairage/configuration des appareils. Voir [Appairage](/fr/channels/pairing).
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm` arme temporairement les commandes de nœud de téléphone à haut risque.
- `/voice status|list [limit]|set <voiceId|name>` gère la configuration vocale Talk. Sur Discord, le nom de la commande native est `/talkvoice`.
- `/card ...` envoie des préréglages de cartes enrichies LINE. Voir [LINE](/fr/channels/line).
- `/codex status|models|threads|resume|compact|review|account|mcp|skills` inspecte et contrôle le harnais app-server Codex fourni avec le bundle. Voir [Harnais Codex](/fr/plugins/codex-harness).
- Commandes réservées à QQBot :
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### Commandes dynamiques de Skills

Les Skills invocables par l’utilisateur sont également exposées comme commandes slash :

- `/skill <name> [input]` fonctionne toujours comme point d’entrée générique.
- les Skills peuvent aussi apparaître comme commandes directes telles que `/prose` lorsque la compétence/le plugin les enregistre.
- l’enregistrement natif des commandes de Skills est contrôlé par `commands.nativeSkills` et `channels.<provider>.commands.nativeSkills`.

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; s’il n’y a pas de correspondance, le texte est traité comme corps du message.
- Pour le détail complet d’usage par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` exige `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé config et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
- `/usage` contrôle le pied de page d’usage par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- `/plugins install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin/archive local(e), package npm ou `clawhub:<pkg>`.
- `/plugins enable|disable` met à jour la configuration des plugins et peut demander un redémarrage.
- Commande native réservée à Discord : `/vc join|leave|status` contrôle les canaux vocaux (nécessite `channels.discord.voice` et les commandes natives ; non disponible en texte).
- Les commandes de liaison de fil Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) exigent que les liaisons de fils effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence des commandes ACP et comportement d’exécution : [Agents ACP](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/trace` est plus étroit que `/verbose` : il ne révèle que les lignes de trace/débogage appartenant aux plugins et laisse désactivé le bavardage normal verbeux des outils.
- `/fast on|off` persiste un remplacement de session. Utilisez l’option `inherit` de l’interface Sessions pour l’effacer et revenir aux valeurs par défaut de la configuration.
- `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappe à `service_tier=priority` sur les points de terminaison natifs Responses, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d’échec d’outil sont toujours affichés lorsque c’est pertinent, mais le texte détaillé d’échec n’est inclus que lorsque `/verbose` est `on` ou `full`.
- `/reasoning`, `/verbose` et `/trace` sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne, la sortie d’outils ou des diagnostics de plugins que vous n’aviez pas l’intention d’exposer. Préférez les laisser désactivés, surtout dans les discussions de groupe.
- `/model` persiste immédiatement le nouveau modèle de session.
- Si l’agent est inactif, l’exécution suivante l’utilise immédiatement.
- Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité de nouvelle tentative ultérieure ou jusqu’au tour utilisateur suivant.
- **Chemin rapide :** les messages composés uniquement de commandes provenant d’expéditeurs en liste d’autorisation sont traités immédiatement (contournement de la file + du modèle).
- **Contrôle des mentions en groupe :** les messages composés uniquement de commandes provenant d’expéditeurs en liste d’autorisation contournent les exigences de mention.
- **Raccourcis en ligne (expéditeurs en liste d’autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu’elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
  - Exemple : `hey /status` déclenche une réponse de statut, et le texte restant continue dans le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages composés uniquement de commandes non autorisés sont ignorés silencieusement, et les jetons `/...` en ligne sont traités comme du texte brut.
- **Commandes de Skills :** les Skills `user-invocable` sont exposées comme commandes slash. Les noms sont normalisés en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute une compétence par nom (utile lorsque les limites de commandes natives empêchent les commandes par compétence).
  - Par défaut, les commandes de Skills sont transmises au modèle comme une requête normale.
  - Les Skills peuvent facultativement déclarer `command-dispatch: tool` pour router la commande directement vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (Plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments de commande native :** Discord utilise l’autocomplétion pour les options dynamiques (et des menus de boutons lorsque vous omettez des arguments requis). Telegram et Slack affichent un menu de boutons lorsqu’une commande prend en charge des choix et que vous omettez l’argument.

## `/tools`

`/tools` répond à une question d’exécution, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans
cette conversation**.

- `/tools` par défaut est compact et optimisé pour une lecture rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces de commandes natives qui prennent en charge les arguments exposent le même changement de mode `compact|verbose`.
- Les résultats sont limités à la session, donc changer d’agent, de canal, de fil, d’autorisation d’expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l’exécution, y compris les outils core, les outils de plugin
  connectés et les outils appartenant au canal.

Pour l’édition de profil et de remplacement, utilisez le panneau Outils de l’interface Control ou les surfaces de config/catalogue au lieu
de traiter `/tools` comme un catalogue statique.

## Surfaces d’usage (ce qui s’affiche où)

- **Usage/quota du fournisseur** (exemple : « Claude 80% left ») apparaît dans `/status` pour le fournisseur du modèle actuel lorsque le suivi d’usage est activé. OpenClaw normalise les fenêtres des fournisseurs en `% left` ; pour MiniMax, les champs de pourcentage restant uniquement sont inversés avant affichage, et les réponses `model_remains` privilégient l’entrée du modèle de chat plus un libellé de plan balisé par modèle.
- **Lignes jetons/cache** dans `/status` peuvent revenir à la dernière entrée d’usage de transcription lorsque l’instantané live de session est clairsemé. Les valeurs live non nulles existantes gardent toujours la priorité, et le repli sur la transcription peut aussi récupérer le libellé du modèle d’exécution actif ainsi qu’un total plus important orienté prompt lorsque les totaux stockés sont absents ou plus petits.
- **Runtime vs runner :** `/status` rapporte `Runtime` pour le chemin d’exécution effectif et l’état du sandbox, et `Runner` pour l’entité qui exécute réellement la session : Pi intégré, fournisseur adossé CLI ou harnais/backend ACP.
- **Jetons/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/auth/points de terminaison**, pas l’usage.

## Sélection de modèle (`/model`)

`/model` est implémenté comme une directive.

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

- `/model` et `/model list` affichent un sélecteur compact numéroté (famille de modèle + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants de fournisseur et de modèle plus une étape Submit.
- `/model <#>` sélectionne à partir de ce sélecteur (et préfère le fournisseur actuel lorsque possible).
- `/model status` affiche la vue détaillée, y compris le point de terminaison du fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **uniquement à l’exécution** (en mémoire, pas sur disque). Réservé au propriétaire. Désactivé par défaut ; activez-le avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Remarques :

- Les remplacements s’appliquent immédiatement aux nouvelles lectures de configuration, mais n’écrivent **pas** dans `openclaw.json`.
- Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la configuration sur disque.

## Sortie de trace des plugins

`/trace` vous permet d’activer ou désactiver les lignes de trace/débogage de plugin **limitées à la session** sans activer le mode verbeux complet.

Exemples :

```text
/trace
/trace on
/trace off
```

Remarques :

- `/trace` sans argument affiche l’état actuel de la trace pour la session.
- `/trace on` active les lignes de trace des plugins pour la session en cours.
- `/trace off` les désactive à nouveau.
- Les lignes de trace des plugins peuvent apparaître dans `/status` et comme message de diagnostic de suivi après la réponse normale de l’assistant.
- `/trace` ne remplace pas `/debug` ; `/debug` gère toujours les remplacements de configuration uniquement à l’exécution.
- `/trace` ne remplace pas `/verbose` ; la sortie verbeuse normale des outils/statuts relève toujours de `/verbose`.

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

- `/mcp` stocke la configuration dans la configuration OpenClaw, pas dans les paramètres de projet appartenant à Pi.
- Les adaptateurs d’exécution décident quels transports sont réellement exécutables.

## Mises à jour de plugins

`/plugins` permet aux opérateurs d’inspecter les plugins découverts et d’activer ou désactiver leur état dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez-le avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la vraie découverte de plugins sur l’espace de travail actuel plus la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration des plugins ; il n’installe ni ne désinstalle les plugins.
- Après des changements d’activation/désactivation, redémarrez la Gateway pour les appliquer.

## Remarques sur les surfaces

- **Les commandes texte** s’exécutent dans la session de chat normale (les DM partagent `main`, les groupes ont leur propre session).
- **Les commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
- **`/stop`** cible la session de chat active afin de pouvoir interrompre l’exécution en cours.
- **Slack :** `channels.slack.slashCommand` reste pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d’arguments de commande pour Slack sont livrés sous forme de boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (pas `/status`) parce que Slack réserve `/status`. Le `/status` texte fonctionne toujours dans les messages Slack.

## Questions annexes BTW

`/btw` est une **question annexe** rapide sur la session en cours.

Contrairement au chat normal :

- elle utilise la session actuelle comme contexte de fond,
- elle s’exécute comme un appel one-shot séparé **sans outil**,
- elle ne modifie pas le contexte futur de la session,
- elle n’est pas écrite dans l’historique de transcription,
- elle est livrée comme résultat annexe en direct au lieu d’un message normal de l’assistant.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la
tâche principale continue.

Exemple :

```text
/btw qu’est-ce qu’on fait en ce moment ?
```

Voir [Questions annexes BTW](/fr/tools/btw) pour le comportement complet et les détails
d’expérience client.
