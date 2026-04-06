---
read_when:
    - Utilisation ou configuration des commandes de chat
    - Débogage du routage des commandes ou des autorisations
summary: 'Commandes slash : texte vs natives, configuration et commandes prises en charge'
title: Commandes slash
x-i18n:
    generated_at: "2026-04-06T03:14:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 417e35b9ddd87f25f6c019111b55b741046ea11039dde89210948185ced5696d
    source_path: tools/slash-commands.md
    workflow: 15
---

# Commandes slash

Les commandes sont gérées par la passerelle. La plupart des commandes doivent être envoyées comme un message **autonome** qui commence par `/`.
La commande de chat bash réservée à l'hôte utilise `! <cmd>` (avec `/bash <cmd>` comme alias).

Il existe deux systèmes liés :

- **Commandes** : messages autonomes `/...`.
- **Directives** : `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - Les directives sont retirées du message avant que le modèle ne le voie.
  - Dans les messages de chat normaux (pas uniquement des directives), elles sont traitées comme des « indications inline » et ne persistent **pas** dans les paramètres de session.
  - Dans les messages contenant uniquement des directives (le message ne contient que des directives), elles persistent dans la session et répondent par un accusé de réception.
  - Les directives ne sont appliquées que pour les **expéditeurs autorisés**. Si `commands.allowFrom` est défini, c'est la seule
    liste d'autorisation utilisée ; sinon, l'autorisation provient des listes d'autorisation/appairages des canaux ainsi que de `commands.useAccessGroups`.
    Pour les expéditeurs non autorisés, les directives sont traitées comme du texte brut.

Il existe également quelques **raccourcis inline** (expéditeurs autorisés/sur liste d'autorisation uniquement) : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
Ils s'exécutent immédiatement, sont retirés avant que le modèle ne voie le message, puis le texte restant continue dans le flux normal.

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
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (par défaut `true`) active l'analyse de `/...` dans les messages de chat.
  - Sur les surfaces sans commandes natives (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams), les commandes texte continuent de fonctionner même si vous le définissez sur `false`.
- `commands.native` (par défaut `"auto"`) enregistre les commandes natives.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (jusqu'à ce que vous ajoutiez des commandes slash) ; ignoré pour les fournisseurs sans prise en charge native.
  - Définissez `channels.discord.commands.native`, `channels.telegram.commands.native` ou `channels.slack.commands.native` pour remplacer le comportement par fournisseur (booléen ou `"auto"`).
  - `false` efface les commandes précédemment enregistrées sur Discord/Telegram au démarrage. Les commandes Slack sont gérées dans l'application Slack et ne sont pas supprimées automatiquement.
- `commands.nativeSkills` (par défaut `"auto"`) enregistre nativement les commandes de **skill** lorsque c'est pris en charge.
  - Auto : activé pour Discord/Telegram ; désactivé pour Slack (Slack nécessite la création d'une commande slash par skill).
  - Définissez `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills` ou `channels.slack.commands.nativeSkills` pour remplacer le comportement par fournisseur (booléen ou `"auto"`).
- `commands.bash` (par défaut `false`) active `! <cmd>` pour exécuter des commandes shell sur l'hôte (`/bash <cmd>` est un alias ; nécessite les listes d'autorisation `tools.elevated`).
- `commands.bashForegroundMs` (par défaut `2000`) contrôle combien de temps bash attend avant de passer en mode arrière-plan (`0` passe immédiatement en arrière-plan).
- `commands.config` (par défaut `false`) active `/config` (lecture/écriture de `openclaw.json`).
- `commands.mcp` (par défaut `false`) active `/mcp` (lecture/écriture de la configuration MCP gérée par OpenClaw sous `mcp.servers`).
- `commands.plugins` (par défaut `false`) active `/plugins` (découverte/statut des plugins plus contrôles d'installation + activation/désactivation).
- `commands.debug` (par défaut `false`) active `/debug` (remplacements à l'exécution uniquement).
- `commands.allowFrom` (facultatif) définit une liste d'autorisation par fournisseur pour l'autorisation des commandes. Lorsqu'elle est configurée, c'est la
  seule source d'autorisation pour les commandes et les directives (`commands.useAccessGroups` et les listes d'autorisation/appairages des canaux
  sont ignorés). Utilisez `"*"` pour une valeur par défaut globale ; les clés spécifiques au fournisseur la remplacent.
- `commands.useAccessGroups` (par défaut `true`) applique les listes d'autorisation/politiques pour les commandes lorsque `commands.allowFrom` n'est pas défini.

## Liste des commandes

Texte + natives (quand elles sont activées) :

- `/help`
- `/commands`
- `/tools [compact|verbose]` (affiche ce que l'agent actuel peut utiliser maintenant ; `verbose` ajoute des descriptions)
- `/skill <name> [input]` (exécute une skill par nom)
- `/status` (affiche l'état actuel ; inclut l'utilisation/le quota du fournisseur pour le fournisseur de modèle actuel lorsque disponible)
- `/tasks` (liste les tâches d'arrière-plan pour la session actuelle ; affiche les détails des tâches actives et récentes avec les comptes de secours locaux à l'agent)
- `/allowlist` (lister/ajouter/supprimer des entrées de liste d'autorisation)
- `/approve <id> <decision>` (résout les invites d'approbation exec ; utilisez le message d'approbation en attente pour voir les décisions disponibles)
- `/context [list|detail|json]` (explique le « contexte » ; `detail` affiche la taille par fichier + par outil + par skill + celle du prompt système)
- `/btw <question>` (poser une question latérale éphémère sur la session actuelle sans modifier le contexte futur de la session ; voir [/tools/btw](/fr/tools/btw))
- `/export-session [path]` (alias : `/export`) (exporte la session actuelle en HTML avec le prompt système complet)
- `/whoami` (affiche votre identifiant d'expéditeur ; alias : `/id`)
- `/session idle <duration|off>` (gère la perte de focus automatique par inactivité pour les associations de fils focalisés)
- `/session max-age <duration|off>` (gère la perte de focus automatique par durée maximale stricte pour les associations de fils focalisés)
- `/subagents list|kill|log|info|send|steer|spawn` (inspecte, contrôle ou lance des exécutions de sous-agents pour la session actuelle)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (inspecte et contrôle les sessions d'exécution ACP)
- `/agents` (liste les agents liés à un fil pour cette session)
- `/focus <target>` (Discord : lie ce fil, ou un nouveau fil, à une cible de session/sous-agent)
- `/unfocus` (Discord : supprime l'association du fil actuel)
- `/kill <id|#|all>` (interrompt immédiatement un ou tous les sous-agents en cours pour cette session ; aucun message de confirmation)
- `/steer <id|#> <message>` (redirige immédiatement un sous-agent en cours : pendant l'exécution quand c'est possible, sinon interrompt le travail actuel et redémarre sur le message de redirection)
- `/tell <id|#> <message>` (alias de `/steer`)
- `/config show|get|set|unset` (persiste la configuration sur disque, propriétaire uniquement ; nécessite `commands.config: true`)
- `/mcp show|get|set|unset` (gère la configuration du serveur MCP OpenClaw, propriétaire uniquement ; nécessite `commands.mcp: true`)
- `/plugins list|show|get|install|enable|disable` (inspecte les plugins découverts, installe de nouveaux plugins et bascule leur activation ; propriétaire uniquement pour les écritures ; nécessite `commands.plugins: true`)
  - `/plugin` est un alias de `/plugins`.
  - `/plugin install <spec>` accepte les mêmes spécifications de plugin que `openclaw plugins install` : chemin/archive local, paquet npm ou `clawhub:<pkg>`.
  - Les écritures d'activation/désactivation répondent toujours avec une indication de redémarrage. Sur une passerelle de premier plan surveillée, OpenClaw peut effectuer ce redémarrage automatiquement juste après l'écriture.
- `/debug show|set|unset|reset` (remplacements à l'exécution, propriétaire uniquement ; nécessite `commands.debug: true`)
- `/usage off|tokens|full|cost` (pied de page d'utilisation par réponse ou résumé local des coûts)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (contrôle le TTS ; voir [/tts](/fr/tools/tts))
  - Discord : la commande native est `/voice` (Discord réserve `/tts`) ; la commande texte `/tts` fonctionne toujours.
- `/stop`
- `/restart`
- `/dock-telegram` (alias : `/dock_telegram`) (bascule les réponses vers Telegram)
- `/dock-discord` (alias : `/dock_discord`) (bascule les réponses vers Discord)
- `/dock-slack` (alias : `/dock_slack`) (bascule les réponses vers Slack)
- `/activation mention|always` (groupes uniquement)
- `/send on|off|inherit` (propriétaire uniquement)
- `/reset` ou `/new [model]` (indication de modèle facultative ; le reste est transmis)
- `/think <off|minimal|low|medium|high|xhigh>` (choix dynamiques selon le modèle/fournisseur ; alias : `/thinking`, `/t`)
- `/fast status|on|off` (si vous omettez l'argument, affiche l'état effectif actuel du mode rapide)
- `/verbose on|full|off` (alias : `/v`)
- `/reasoning on|off|stream` (alias : `/reason` ; lorsqu'il est activé, envoie un message séparé préfixé par `Reasoning:` ; `stream` = brouillon Telegram uniquement)
- `/elevated on|off|ask|full` (alias : `/elev` ; `full` ignore les approbations exec)
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (envoyez `/exec` pour afficher l'état actuel)
- `/model <name>` (alias : `/models` ; ou `/<alias>` depuis `agents.defaults.models.*.alias`)
- `/queue <mode>` (plus des options comme `debounce:2s cap:25 drop:summarize` ; envoyez `/queue` pour voir les paramètres actuels)
- `/bash <command>` (hôte uniquement ; alias de `! <command>` ; nécessite `commands.bash: true` + listes d'autorisation `tools.elevated`)
- `/dreaming [on|off|status|help]` (active/désactive dreaming globalement ou affiche l'état ; voir [Dreaming](/fr/concepts/dreaming))

Texte uniquement :

- `/compact [instructions]` (voir [/concepts/compaction](/fr/concepts/compaction))
- `! <command>` (hôte uniquement ; une à la fois ; utilisez `!poll` + `!stop` pour les tâches longues)
- `!poll` (vérifie la sortie / l'état ; accepte un `sessionId` facultatif ; `/bash poll` fonctionne aussi)
- `!stop` (arrête la tâche bash en cours ; accepte un `sessionId` facultatif ; `/bash stop` fonctionne aussi)

Remarques :

- Les commandes acceptent un `:` facultatif entre la commande et les arguments (par ex. `/think: high`, `/send: on`, `/help:`).
- `/new <model>` accepte un alias de modèle, `provider/model` ou un nom de fournisseur (correspondance approximative) ; si aucune correspondance n'est trouvée, le texte est traité comme corps du message.
- Pour le détail complet de l'utilisation par fournisseur, utilisez `openclaw status --usage`.
- `/allowlist add|remove` nécessite `commands.config=true` et respecte `configWrites` du canal.
- Dans les canaux multi-comptes, `/allowlist --account <id>` ciblé configuration et `/config set channels.<provider>.accounts.<id>...` respectent aussi `configWrites` du compte cible.
- `/usage` contrôle le pied de page d'utilisation par réponse ; `/usage cost` affiche un résumé local des coûts à partir des journaux de session OpenClaw.
- `/restart` est activé par défaut ; définissez `commands.restart: false` pour le désactiver.
- Commande native Discord uniquement : `/vc join|leave|status` contrôle les canaux vocaux (nécessite `channels.discord.voice` et les commandes natives ; non disponible en texte).
- Les commandes de liaison de fils Discord (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) nécessitent que les liaisons de fils effectives soient activées (`session.threadBindings.enabled` et/ou `channels.discord.threadBindings.enabled`).
- Référence des commandes ACP et comportement à l'exécution : [ACP Agents](/fr/tools/acp-agents).
- `/verbose` est destiné au débogage et à une visibilité supplémentaire ; laissez-le **désactivé** en usage normal.
- `/fast on|off` persiste un remplacement au niveau de la session. Utilisez l'option `inherit` de l'interface Sessions pour l'effacer et revenir aux valeurs par défaut de la configuration.
- `/fast` est spécifique au fournisseur : OpenAI/OpenAI Codex le mappe à `service_tier=priority` sur les endpoints natifs Responses, tandis que les requêtes Anthropic publiques directes, y compris le trafic authentifié par OAuth envoyé à `api.anthropic.com`, le mappent à `service_tier=auto` ou `standard_only`. Voir [OpenAI](/fr/providers/openai) et [Anthropic](/fr/providers/anthropic).
- Les résumés d'échec d'outil sont toujours affichés lorsqu'ils sont pertinents, mais le texte détaillé de l'échec n'est inclus que lorsque `/verbose` est `on` ou `full`.
- `/reasoning` (et `/verbose`) sont risqués dans les contextes de groupe : ils peuvent révéler un raisonnement interne ou une sortie d'outil que vous n'aviez pas l'intention d'exposer. Il est préférable de les laisser désactivés, surtout dans les discussions de groupe.
- `/model` persiste immédiatement le nouveau modèle de session.
- Si l'agent est inactif, l'exécution suivante l'utilise immédiatement.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre vers le nouveau modèle qu'à un point de reprise propre.
- Si l'activité des outils ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu'à une opportunité de reprise ultérieure ou au prochain tour utilisateur.
- **Chemin rapide :** les messages ne contenant que des commandes envoyés par des expéditeurs sur liste d'autorisation sont traités immédiatement (contournent la file d'attente + le modèle).
- **Filtrage par mention dans les groupes :** les messages ne contenant que des commandes envoyés par des expéditeurs sur liste d'autorisation contournent les exigences de mention.
- **Raccourcis inline (expéditeurs sur liste d'autorisation uniquement) :** certaines commandes fonctionnent aussi lorsqu'elles sont intégrées dans un message normal et sont retirées avant que le modèle ne voie le texte restant.
  - Exemple : `hey /status` déclenche une réponse de statut, puis le texte restant continue dans le flux normal.
- Actuellement : `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- Les messages ne contenant que des commandes non autorisés sont ignorés silencieusement, et les jetons inline `/...` sont traités comme du texte brut.
- **Commandes de skill :** les skills `user-invocable` sont exposées comme commandes slash. Les noms sont normalisés en `a-z0-9_` (32 caractères max) ; les collisions reçoivent des suffixes numériques (par ex. `_2`).
  - `/skill <name> [input]` exécute une skill par nom (utile lorsque les limites de commandes natives empêchent d'avoir une commande par skill).
  - Par défaut, les commandes de skill sont transmises au modèle comme une requête normale.
  - Les skills peuvent déclarer facultativement `command-dispatch: tool` pour router directement la commande vers un outil (déterministe, sans modèle).
  - Exemple : `/prose` (plugin OpenProse) — voir [OpenProse](/fr/prose).
- **Arguments des commandes natives :** Discord utilise l'autocomplétion pour les options dynamiques (et des menus à boutons lorsque vous omettez des arguments obligatoires). Telegram et Slack affichent un menu à boutons lorsqu'une commande prend en charge des choix et que vous omettez l'argument.

## `/tools`

`/tools` répond à une question d'exécution, pas à une question de configuration : **ce que cet agent peut utiliser maintenant dans
cette conversation**.

- Par défaut, `/tools` est compact et optimisé pour un balayage rapide.
- `/tools verbose` ajoute de courtes descriptions.
- Les surfaces à commandes natives qui prennent en charge les arguments exposent le même changement de mode `compact|verbose`.
- Les résultats sont limités à la session ; ainsi, changer d'agent, de canal, de fil, d'autorisation d'expéditeur ou de modèle peut
  modifier la sortie.
- `/tools` inclut les outils réellement accessibles à l'exécution, y compris les outils du cœur, les outils de plugins
  connectés et les outils appartenant aux canaux.

Pour modifier les profils et les remplacements, utilisez le panneau Tools de l'interface de contrôle ou les surfaces de configuration/catalogue plutôt
que de traiter `/tools` comme un catalogue statique.

## Surfaces d'utilisation (ce qui s'affiche où)

- **Utilisation/quota du fournisseur** (exemple : « Claude 80% left ») s'affiche dans `/status` pour le fournisseur de modèle actuel lorsque le suivi d'utilisation est activé. OpenClaw normalise les fenêtres des fournisseurs en `% left` ; pour MiniMax, les champs de pourcentage « restant uniquement » sont inversés avant affichage, et les réponses `model_remains` privilégient l'entrée du modèle de chat plus un libellé de plan marqué par le modèle.
- **Lignes tokens/cache** dans `/status` peuvent se rabattre sur la dernière entrée d'utilisation du transcript lorsque l'instantané de session en direct est peu rempli. Les valeurs en direct non nulles existantes restent prioritaires, et ce repli sur le transcript peut aussi récupérer l'étiquette du modèle d'exécution actif ainsi qu'un total plus important orienté prompt lorsque les totaux stockés sont absents ou plus faibles.
- **Tokens/coût par réponse** est contrôlé par `/usage off|tokens|full` (ajouté aux réponses normales).
- `/model status` concerne les **modèles/authentification/endpoints**, pas l'utilisation.

## Sélection du modèle (`/model`)

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

- `/model` et `/model list` affichent un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants pour le fournisseur et le modèle, puis une étape Submit.
- `/model <#>` sélectionne depuis ce sélecteur (et privilégie le fournisseur actuel quand c'est possible).
- `/model status` affiche la vue détaillée, y compris l'endpoint du fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsque disponibles.

## Remplacements de débogage

`/debug` vous permet de définir des remplacements de configuration **à l'exécution uniquement** (en mémoire, pas sur disque). Propriétaire uniquement. Désactivé par défaut ; activez-le avec `commands.debug: true`.

Exemples :

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

Remarques :

- Les remplacements s'appliquent immédiatement aux nouvelles lectures de configuration, mais n'écrivent **pas** dans `openclaw.json`.
- Utilisez `/debug reset` pour effacer tous les remplacements et revenir à la configuration sur disque.

## Mises à jour de configuration

`/config` écrit dans votre configuration sur disque (`openclaw.json`). Propriétaire uniquement. Désactivé par défaut ; activez-le avec `commands.config: true`.

Exemples :

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

Remarques :

- La configuration est validée avant l'écriture ; les modifications invalides sont rejetées.
- Les mises à jour `/config` persistent après les redémarrages.

## Mises à jour MCP

`/mcp` écrit les définitions de serveurs MCP gérées par OpenClaw sous `mcp.servers`. Propriétaire uniquement. Désactivé par défaut ; activez-le avec `commands.mcp: true`.

Exemples :

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

Remarques :

- `/mcp` stocke la configuration dans la configuration OpenClaw, et non dans les paramètres de projet appartenant à Pi.
- Les adaptateurs d'exécution déterminent quels transports sont réellement exécutables.

## Mises à jour des plugins

`/plugins` permet aux opérateurs d'inspecter les plugins découverts et de basculer leur activation dans la configuration. Les flux en lecture seule peuvent utiliser `/plugin` comme alias. Désactivé par défaut ; activez-le avec `commands.plugins: true`.

Exemples :

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

Remarques :

- `/plugins list` et `/plugins show` utilisent la vraie découverte de plugins sur l'espace de travail actuel ainsi que la configuration sur disque.
- `/plugins enable|disable` met à jour uniquement la configuration des plugins ; il n'installe ni ne désinstalle les plugins.
- Après des changements d'activation/désactivation, redémarrez la passerelle pour les appliquer.

## Remarques sur les surfaces

- **Les commandes texte** s'exécutent dans la session de chat normale (les messages privés partagent `main`, les groupes ont leur propre session).
- **Les commandes natives** utilisent des sessions isolées :
  - Discord : `agent:<agentId>:discord:slash:<userId>`
  - Slack : `agent:<agentId>:slack:slash:<userId>` (préfixe configurable via `channels.slack.slashCommand.sessionPrefix`)
  - Telegram : `telegram:slash:<userId>` (cible la session de chat via `CommandTargetSessionKey`)
- **`/stop`** cible la session de chat active afin de pouvoir interrompre l'exécution en cours.
- **Slack :** `channels.slack.slashCommand` reste pris en charge pour une seule commande de type `/openclaw`. Si vous activez `commands.native`, vous devez créer une commande slash Slack par commande intégrée (mêmes noms que `/help`). Les menus d'arguments de commande pour Slack sont fournis sous forme de boutons Block Kit éphémères.
  - Exception native Slack : enregistrez `/agentstatus` (pas `/status`) car Slack réserve `/status`. La commande texte `/status` fonctionne toujours dans les messages Slack.

## Questions latérales BTW

`/btw` est une **question latérale** rapide à propos de la session actuelle.

Contrairement au chat normal :

- il utilise la session actuelle comme contexte de fond,
- il s'exécute comme un appel ponctuel séparé **sans outils**,
- il ne modifie pas le contexte futur de la session,
- il n'est pas écrit dans l'historique du transcript,
- il est livré comme un résultat latéral en direct plutôt que comme un message assistant normal.

Cela rend `/btw` utile lorsque vous voulez une clarification temporaire pendant que la
tâche principale continue.

Exemple :

```text
/btw what are we doing right now?
```

Consultez [BTW Side Questions](/fr/tools/btw) pour le comportement complet et les détails
de l'expérience client.
