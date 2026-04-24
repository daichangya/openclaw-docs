---
read_when:
    - Configuration de binaires sûrs ou de profils personnalisés de binaires sûrs
    - Transfert des approbations vers Slack/Discord/Telegram ou d’autres canaux de chat
    - Implémentation d’un client d’approbation natif pour un canal
summary: 'Approbations exec avancées : binaires sûrs, liaison d’interpréteur, transfert d’approbation, livraison native'
title: Approbations exec — avancé
x-i18n:
    generated_at: "2026-04-24T07:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7834a8ebfb623b38e4c2676f0e24285d5b44e2dce45c55a33db842d1bbf81be
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Sujets avancés d’approbation exec : le chemin rapide `safeBins`, la liaison d’interpréteur/runtime,
et le transfert d’approbation vers les canaux de chat (y compris la livraison native).
Pour la politique cœur et le flux d’approbation, voir [Approbations Exec](/fr/tools/exec-approvals).

## Binaires sûrs (stdin uniquement)

`tools.exec.safeBins` définit une petite liste de binaires **stdin uniquement** (par
exemple `cut`) qui peuvent s’exécuter en mode allowlist **sans** entrées explicites dans la
liste d’autorisation. Les binaires sûrs rejettent les arguments de fichier positionnels et les jetons de type chemin, de sorte qu’ils
ne peuvent opérer que sur le flux entrant. Traitez cela comme un chemin rapide étroit pour les
filtres de flux, pas comme une liste générale de confiance.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code,
exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites dans la
liste d’autorisation et gardez les invites d’approbation activées. Les binaires sûrs personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binaires sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous activez l’option, conservez des
entrées explicites dans la liste d’autorisation pour leurs flux de travail non stdin. Pour `grep` en mode binaire sûr,
fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est rejetée
afin que des opérandes de fichier ne puissent pas être introduits comme positionnels ambigus.

### Validation argv et indicateurs refusés

La validation est déterministe à partir de la seule forme de argv (sans vérification
de l’existence des fichiers sur l’hôte), ce qui évite un comportement d’oracle d’existence de fichier entre allow/deny.
Les options orientées fichier sont refusées pour les binaires sûrs par défaut ; les options longues sont validées en mode fail-closed (les indicateurs inconnus et les abréviations ambiguës sont
rejetés).

Indicateurs refusés par profil de binaire sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep` : `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq` : `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort` : `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc` : `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les binaires sûrs forcent aussi les jetons argv à être traités comme du **texte littéral** au moment de l’exécution
(pas de globbing ni d’expansion `$VARS`) pour les segments stdin uniquement, de sorte que des motifs
comme `*` ou `$HOME/...` ne puissent pas être utilisés pour faire passer des lectures de fichiers.

### Répertoires de binaires de confiance

Les binaires sûrs doivent être résolus depuis des répertoires de binaires de confiance (valeurs par défaut système plus `tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement considérées comme fiables.
Les répertoires de confiance par défaut sont volontairement minimaux : `/bin`, `/usr/bin`. Si
votre exécutable de binaire sûr se trouve dans des chemins d’utilisateur/de gestionnaire de paquets (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les
explicitement à `tools.exec.safeBinTrustedDirs`.

### Chaînage shell, wrappers et multiplexeurs

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de niveau supérieur satisfait la
liste d’autorisation (y compris les binaires sûrs ou l’auto-autorisation par skill). Les redirections ne sont toujours pas prises en charge en mode allowlist. La substitution de commande (`$()` / backticks) est
rejetée pendant l’analyse allowlist, y compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.

Sur les approbations de l’app compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou
d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est
traité comme un échec de liste d’autorisation, sauf si le binaire shell lui-même est dans la liste d’autorisation.

Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement à portée requête sont
réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode allowlist, les wrappers de dispatch connus (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistent le chemin de l’exécutable interne plutôt que le chemin du wrapper. Les multiplexeurs shell (`busybox`, `toybox`) sont déballés pour
les applets shell (`sh`, `ash`, etc.) de la même manière. Si un wrapper ou un multiplexeur
ne peut pas être déballé de façon sûre, aucune entrée de liste d’autorisation n’est persistée automatiquement.

Si vous placez dans la liste d’autorisation des interpréteurs comme `python3` ou `node`, préférez
`tools.exec.strictInlineEval=true` afin que l’évaluation inline exige toujours une approbation explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les transporteurs d’évaluation inline ne sont pas persistés
automatiquement.

### Binaires sûrs versus liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                    |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| Objectif             | Auto-autoriser des filtres stdin étroits                        | Faire explicitement confiance à des exécutables spécifiques     |
| Type de correspondance       | Nom d’exécutable + politique argv de binaire sûr                 | Motif glob du chemin d’exécutable résolu                        |
| Portée des arguments   | Restreinte par le profil de binaire sûr et les règles de jetons littéraux | Correspondance par chemin uniquement ; les arguments restent autrement de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées           |
| Meilleur usage         | Transformations de texte à faible risque dans des pipelines      | Tout outil ayant un comportement plus large ou des effets de bord |

Emplacement de configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou par agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou par agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou par agent `agents.list[].tools.exec.safeBinProfiles`). Les clés de profil par agent remplacent les clés globales.
- les entrées de liste d’autorisation vivent dans `~/.openclaw/exec-approvals.json` local à l’hôte sous `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer des entrées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (relisez-les et resserrez-les ensuite). Les binaires d’interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette quand même le builtin `env` en mode binaire sûr
afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin explicite dans la liste d’autorisation
ou invite d’approbation.

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime adossées à une approbation sont volontairement conservatrices :

- Le contexte exact argv/cwd/env est toujours lié.
- Les formes directes de script shell et de fichier runtime direct sont liées au mieux à un seul instantané concret de fichier local.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent encore vers un seul fichier local direct (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un seul fichier local concret pour une commande d’interpréteur/runtime
  (par exemple les scripts de package, les formes eval, les chaînes de chargement spécifiques au runtime, ou les formes multi-fichiers ambiguës), l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir sémantiquement ce qu’elle ne peut pas couvrir.
- Pour ces flux de travail, préférez le sandboxing, une frontière d’hôte séparée, ou un flux allowlist/full explicitement de confiance où l’opérateur accepte les sémantiques runtime plus larges.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec un identifiant d’approbation. Utilisez cet identifiant pour
corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le
délai d’expiration, la requête est traitée comme un délai d’approbation dépassé et exposée comme motif de refus.

### Comportement de livraison de suivi

Après la fin d’un exec asynchrone approuvé, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison de suivi utilise ce canal.
- Dans les flux webchat uniquement ou de session interne sans cible externe, la livraison de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée vers session uniquement au lieu d’échouer.

## Transfert d’approbation vers les canaux de chat

Vous pouvez transférer les invites d’approbation exec vers n’importe quel canal de chat (y compris les canaux de plugin) et les approuver
avec `/approve`. Cela utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900001__
Répondre dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations exec et les approbations de plugin. Si l’identifiant ne correspond pas à une approbation exec en attente, elle vérifie automatiquement les approbations de plugin à la place.

### Transfert d’approbation de plugin

Le transfert d’approbation de plugin utilise le même pipeline de livraison que les approbations exec mais possède sa propre
configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900003__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées rendent les mêmes boutons d’approbation pour les approbations exec et
plugin. Les canaux sans interface interactive partagée reviennent à du texte brut avec des instructions `/approve`.

### Approbations dans la même discussion sur n’importe quel canal

Lorsqu’une demande d’approbation exec ou plugin provient d’une surface de chat livrable, cette même discussion
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux tels que Slack, Matrix et
Microsoft Teams, en plus des flux déjà existants de l’interface Web et du terminal.

Ce chemin de commande texte partagé utilise le modèle normal d’authentification du canal pour cette conversation. Si la
discussion d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un adaptateur de livraison native séparé simplement pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans la même discussion, mais ces canaux utilisent toujours
leur liste résolue d’approbateurs pour l’autorisation, même lorsque la livraison d’approbation native est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement le Gateway,
ce repli est volontairement limité aux échecs de type « approval not found ». Un vrai
refus/erreur d’approbation exec ne réessaie pas silencieusement comme approbation de plugin.

### Livraison d’approbation native

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent les DM des approbateurs, la
propagation vers la discussion d’origine, et une UX d’approbation interactive spécifique au canal au-dessus du
flux partagé `/approve` dans la même discussion.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal
orienté agent. L’agent ne doit pas aussi répéter une commande simple de chat
`/approve` en double, sauf si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou
que l’approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d’exécution hôte décide toujours si une approbation exec est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement la livraison prioritaire par DM lorsque toutes ces conditions sont réunies :

- le canal prend en charge la livraison d’approbation native
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicites ou des
  sources de repli documentées de ce canal
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour le forcer à
s’activer lorsque les approbateurs se résolvent. La livraison publique vers la discussion d’origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation exec pour les approbations de chat ?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent le routage DM et une propagation facultative au canal au-dessus du
flux partagé `/approve` dans la même discussion et des boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et les discussions livrables similaires utilisent le modèle normal d’authentification du canal
  pour `/approve` dans la même discussion
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est le DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration propriétaire existante (`allowFrom`, plus le `defaultTo` des messages directs lorsque pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre les approbations de plugin
  sans deuxième couche locale Slack de repli
- le routage natif DM/canal Matrix et les raccourcis de réaction gèrent à la fois les approbations exec et plugin ;
  l’autorisation de plugin provient toujours de `channels.matrix.dm.allowFrom`
- le demandeur n’a pas besoin d’être un approbateur
- la discussion d’origine peut approuver directement avec `/approve` lorsque cette discussion prend déjà en charge les commandes et réponses
- les boutons natifs d’approbation Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont
  directement vers les approbations de plugin, tout le reste va vers les approbations exec
- les boutons natifs d’approbation Telegram suivent le même repli borné exec-vers-plugin que `/approve`
- lorsque `target` natif active la livraison vers la discussion d’origine, les invites d’approbation incluent le texte de la commande
- les approbations exec en attente expirent au bout de 30 minutes par défaut
- si aucune interface opérateur ni client d’approbation configuré ne peut accepter la requête, l’invite retombe sur `askFallback`

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous
voulez que les invites d’approbation apparaissent également dans la discussion/le sujet Telegram d’origine. Pour les sujets de forum Telegram, OpenClaw préserve le sujet pour l’invite d’approbation et le suivi post-approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900004__
Remarques de sécurité :

- Mode socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair avec le même UID.
- Challenge/réponse (nonce + jeton HMAC + hash de requête) + TTL court.

## Lié

- [Approbations Exec](/fr/tools/exec-approvals) — politique cœur et flux d’approbation
- [Outil Exec](/fr/tools/exec)
- [Mode Elevated](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’auto-autorisation adossé aux skills
