---
read_when:
    - Configuration des approbations d'exec ou des listes d'autorisation
    - Mise en œuvre de l'UX des approbations d'exec dans l'application macOS
    - Examen des invites de sortie de sandbox et de leurs implications
summary: Approbations d'exec, listes d'autorisation et invites de sortie de sandbox
title: Approbations d'exec
x-i18n:
    generated_at: "2026-04-05T12:57:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approbations d'exec

Les approbations d'exec sont le **garde-fou de l'application compagnon / de l'hôte de nœud** pour permettre à un agent sandboxé d'exécuter des commandes sur un hôte réel (`gateway` ou `node`). Considérez cela comme un verrou de sécurité :
les commandes ne sont autorisées que lorsque la politique + la liste d'autorisation + l'approbation utilisateur (facultative) sont toutes d'accord.
Les approbations d'exec s'ajoutent à la politique des outils et au contrôle elevated (sauf si elevated est défini sur `full`, ce qui ignore les approbations).
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ; si un champ d'approbation est omis, la valeur `tools.exec` est utilisée.
L'exec sur l'hôte utilise également l'état local des approbations sur cette machine. Un
`ask: "always"` local à l'hôte dans `~/.openclaw/exec-approvals.json` continue d'afficher des invites même si
la session ou les valeurs par défaut de la configuration demandent `ask: "on-miss"`.
Utilisez `openclaw approvals get`, `openclaw approvals get --gateway`, ou
`openclaw approvals get --node <id|name|ip>` pour inspecter la politique demandée,
les sources de politique de l'hôte et le résultat effectif.

Si l'interface de l'application compagnon n'est **pas disponible**, toute requête nécessitant une invite est
résolue par la **solution de repli ask** (par défaut : refus).

## Où cela s'applique

Les approbations d'exec sont appliquées localement sur l'hôte d'exécution :

- **hôte gateway** → processus `openclaw` sur la machine gateway
- **hôte node** → exécuteur de nœud (application compagnon macOS ou hôte de nœud sans interface)

Remarque sur le modèle de confiance :

- Les appelants authentifiés auprès de la gateway sont des opérateurs de confiance pour cette Gateway.
- Les nœuds appairés étendent cette capacité d'opérateur de confiance à l'hôte du nœud.
- Les approbations d'exec réduisent le risque d'exécution accidentelle, mais ne constituent pas une limite d'authentification par utilisateur.
- Les exécutions approuvées sur l'hôte du nœud lient un contexte d'exécution canonique : `cwd` canonique, `argv` exact, liaison d'environnement si présente, et chemin d'exécutable épinglé si applicable.
- Pour les scripts shell et les invocations directes de fichiers d'interpréteur/runtime, OpenClaw essaie aussi de lier
  un opérande de fichier local concret. Si ce fichier lié change après l'approbation mais avant l'exécution,
  l'exécution est refusée au lieu d'exécuter un contenu modifié.
- Cette liaison de fichier est volontairement faite au mieux, et non comme un modèle sémantique complet de tous les chemins
  de chargement d'interpréteur/runtime. Si le mode d'approbation ne peut pas identifier exactement un fichier local concret
  à lier, il refuse de produire une exécution adossée à une approbation au lieu de prétendre à une couverture complète.

Répartition macOS :

- Le **service d'hôte de nœud** transmet `system.run` à l'**application macOS** via IPC local.
- L'**application macOS** applique les approbations + exécute la commande dans le contexte de l'interface.

## Paramètres et stockage

Les approbations sont stockées dans un fichier JSON local sur l'hôte d'exécution :

`~/.openclaw/exec-approvals.json`

Exemple de schéma :

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Mode "YOLO" sans approbation

Si vous voulez que l'exec sur l'hôte s'exécute sans invites d'approbation, vous devez ouvrir **les deux** couches de politique :

- la politique exec demandée dans la config OpenClaw (`tools.exec.*`)
- la politique d'approbations locale à l'hôte dans `~/.openclaw/exec-approvals.json`

C'est désormais le comportement hôte par défaut sauf si vous le resserrez explicitement :

- `tools.exec.security`: `full` sur `gateway`/`node`
- `tools.exec.ask`: `off`
- `host askFallback`: `full`

Distinction importante :

- `tools.exec.host=auto` choisit où exec s'exécute : en sandbox si disponible, sinon sur la gateway.
- YOLO choisit comment l'exec sur l'hôte est approuvé : `security=full` plus `ask=off`.
- `auto` ne transforme pas le routage gateway en dérogation gratuite depuis une session sandboxée. Une requête par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n'est autorisé depuis `auto` que lorsqu'aucun runtime sandbox n'est actif. Si vous voulez une valeur par défaut stable non automatique, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l'une ou l'autre couche en `allowlist` / `on-miss`
ou `deny`.

Configuration persistante "ne jamais demander" pour l'hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Définissez ensuite le fichier d'approbations de l'hôte pour qu'il corresponde :

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Pour un hôte de nœud, appliquez plutôt le même fichier d'approbations sur ce nœud :

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Raccourci valable pour la session uniquement :

- `/exec security=full ask=off` modifie uniquement la session en cours.
- `/elevated full` est un raccourci "break-glass" qui ignore aussi les approbations d'exec pour cette session.

Si le fichier d'approbations de l'hôte reste plus strict que la config, la politique de l'hôte la plus stricte l'emporte quand même.

## Réglages de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les requêtes d'exec sur l'hôte.
- **allowlist** : n'autorise que les commandes présentes dans la liste d'autorisation.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : ne jamais afficher d'invite.
- **on-miss** : afficher une invite uniquement quand la liste d'autorisation ne correspond pas.
- **always** : afficher une invite pour chaque commande.
- la confiance durable `allow-always` ne supprime pas les invites lorsque le mode ask effectif est `always`

### Solution de repli ask (`askFallback`)

Si une invite est requise mais qu'aucune interface n'est accessible, la solution de repli décide :

- **deny** : bloquer.
- **allowlist** : autoriser uniquement si la liste d'autorisation correspond.
- **full** : autoriser.

### Renforcement d'eval inline d'interpréteur (`tools.exec.strictInlineEval`)

Lorsque `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d'évaluation de code inline comme nécessitant toujours une approbation, même si le binaire de l'interpréteur lui-même figure dans la liste d'autorisation.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s'agit d'une défense en profondeur pour les chargeurs d'interpréteurs qui ne se mappent pas proprement à un opérande de fichier stable unique. En mode strict :

- ces commandes nécessitent toujours une approbation explicite ;
- `allow-always` ne conserve pas automatiquement de nouvelles entrées de liste d'autorisation pour elles.

## Liste d'autorisation (par agent)

Les listes d'autorisation sont **par agent**. Si plusieurs agents existent, changez l'agent
que vous modifiez dans l'application macOS. Les motifs sont des **correspondances glob insensibles à la casse**.
Les motifs doivent se résoudre en **chemins de binaires** (les entrées avec uniquement le nom de base sont ignorées).
Les entrées héritées `agents.default` sont migrées vers `agents.main` au chargement.
Les enchaînements shell tels que `echo ok && pwd` exigent toujours que chaque segment de premier niveau respecte les règles de la liste d'autorisation.

Exemples :

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d'autorisation suit :

- **id** UUID stable utilisé pour l'identité dans l'interface (facultatif)
- **dernière utilisation** horodatage
- **dernière commande utilisée**
- **dernier chemin résolu**

## Autoriser automatiquement les CLI de Skills

Lorsque **Autoriser automatiquement les CLI de Skills** est activé, les exécutables référencés par des skills connus
sont traités comme étant dans la liste d'autorisation sur les nœuds (nœud macOS ou hôte de nœud sans interface). Cela utilise
`skills.bins` via le RPC Gateway pour récupérer la liste des binaires de skills. Désactivez cela si vous voulez des listes d'autorisation manuelles strictes.

Remarques importantes sur la confiance :

- Il s'agit d'une **liste d'autorisation implicite de commodité**, distincte des entrées manuelles de liste d'autorisation par chemin.
- Elle est destinée à des environnements d'opérateur de confiance où la Gateway et le nœud se trouvent dans la même limite de confiance.
- Si vous exigez une confiance explicite stricte, gardez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d'autorisation par chemin.

## Safe bins (stdin only)

`tools.exec.safeBins` définit une petite liste de binaires **stdin-only** (par exemple `cut`)
qui peuvent s'exécuter en mode allowlist **sans** entrées explicites dans la liste d'autorisation. Les safe bins rejettent
les arguments de fichier positionnels et les jetons ressemblant à des chemins, afin qu'ils ne puissent agir que sur le flux entrant.
Considérez cela comme un chemin rapide étroit pour les filtres de flux, pas comme une liste de confiance générale.
N'ajoutez **pas** de binaires d'interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`.
Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites dans la liste d'autorisation et gardez les invites d'approbation activées.
Les safe bins personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
La validation est déterministe à partir de la seule forme de `argv` (sans vérification de l'existence du système de fichiers hôte), ce qui
empêche tout comportement d'oracle d'existence de fichiers à partir des différences allow/deny.
Les options orientées fichier sont refusées pour les safe bins par défaut (par exemple `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Les safe bins appliquent aussi une politique explicite par binaire sur les drapeaux pour les options qui cassent le comportement stdin-only
(par exemple `sort -o/--output/--compress-program` et les drapeaux récursifs de grep).
Les options longues sont validées de manière fail-closed en mode safe-bin : les drapeaux inconnus et les abréviations ambiguës sont rejetés.
Drapeaux refusés par profil safe-bin :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep` : `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq` : `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort` : `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc` : `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les safe bins forcent aussi les jetons `argv` à être traités comme du **texte littéral** au moment de l'exécution (pas de globbing
ni d'expansion de `$VARS`) pour les segments stdin-only, afin que des motifs comme `*` ou `$HOME/...` ne puissent pas être
utilisés pour dissimuler des lectures de fichiers.
Les safe bins doivent aussi se résoudre depuis des répertoires de binaires de confiance (valeurs système par défaut plus
`tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement considérées comme de confiance.
Les répertoires de confiance par défaut pour les safe bins sont volontairement minimaux : `/bin`, `/usr/bin`.
Si votre exécutable safe-bin se trouve dans des chemins de gestionnaire de paquets/utilisateur (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement
à `tools.exec.safeBinTrustedDirs`.
Les enchaînements shell et les redirections ne sont pas automatiquement autorisés en mode allowlist.

Les enchaînements shell (`&&`, `||`, `;`) sont autorisés lorsque chaque segment de premier niveau respecte la liste d'autorisation
(y compris les safe bins ou l'autorisation automatique des skills). Les redirections restent non prises en charge en mode allowlist.
La substitution de commande (`$()` / accents graves) est rejetée lors de l'analyse de la liste d'autorisation, y compris à l'intérieur
des guillemets doubles ; utilisez des guillemets simples si vous avez besoin de texte littéral `$()`.
Dans les approbations de l'application compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d'expansion shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec de correspondance de la liste d'autorisation sauf
si le binaire du shell lui-même figure dans la liste d'autorisation.
Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les surcharges d'environnement limitées à la requête sont réduites à une
petite liste d'autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Pour les décisions allow-always en mode allowlist, les wrappers de distribution connus
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes au lieu des chemins
des wrappers. Les multiplexeurs shell (`busybox`, `toybox`) sont aussi déroulés pour les applets shell (`sh`, `ash`,
etc.) afin que les exécutables internes soient conservés au lieu des binaires multiplexeurs. Si un wrapper ou un
multiplexeur ne peut pas être déroulé en toute sécurité, aucune entrée de liste d'autorisation n'est automatiquement conservée.
Si vous placez dans la liste d'autorisation des interpréteurs comme `python3` ou `node`, préférez `tools.exec.strictInlineEval=true` afin que l'eval inline exige toujours une approbation explicite. En mode strict, `allow-always` peut toujours conserver des invocations bénignes d'interpréteur/script, mais les supports d'eval inline ne sont pas conservés automatiquement.

Safe bins par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez, conservez des entrées explicites dans la liste d'autorisation pour
leurs workflows non stdin.
Pour `grep` en mode safe-bin, fournissez le motif avec `-e`/`--regexp` ; la forme de motif positionnelle est
refusée afin qu'aucun opérande de fichier ne puisse être dissimulé comme positionnel ambigu.

### Safe bins versus allowlist

| Sujet            | `tools.exec.safeBins`                                   | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| Objectif         | Autoriser automatiquement des filtres stdin étroits     | Faire explicitement confiance à des exécutables spécifiques  |
| Type de match    | Nom d'exécutable + politique `argv` de safe-bin         | Motif glob sur le chemin résolu de l'exécutable              |
| Portée arguments | Restreinte par le profil safe-bin et les règles littérales de jetons | Correspondance de chemin uniquement ; les arguments restent autrement de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées        |
| Meilleur usage   | Transformations de texte à faible risque dans des pipelines | Tout outil au comportement plus large ou avec des effets de bord |

Emplacement de configuration :

- `safeBins` vient de la config (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` par agent).
- `safeBinTrustedDirs` vient de la config (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` par agent).
- `safeBinProfiles` vient de la config (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` par agent). Les clés de profil par agent remplacent les clés globales.
- les entrées de liste d'autorisation vivent dans le fichier local à l'hôte `~/.openclaw/exec-approvals.json` sous `agents.<id>.allowlist` (ou via l'interface Control / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d'interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer les entrées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (revoyez-les et resserrez-les ensuite). Les binaires d'interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900004__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette quand même le builtin `env` en mode safe-bin
afin que `jq -n env` ne puisse pas vider l'environnement du processus hôte sans chemin explicite dans la liste d'autorisation
ou invite d'approbation.

## Modification dans l'interface Control

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les surcharges
par agent et les listes d'autorisation. Choisissez une portée (valeurs par défaut ou un agent), ajustez la politique,
ajoutez/supprimez des motifs de liste d'autorisation, puis cliquez sur **Save**. L'interface affiche les métadonnées de **dernière utilisation**
par motif pour vous aider à garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nœuds
doivent annoncer `system.execApprovals.get/set` (application macOS ou hôte de nœud sans interface).
Si un nœud n'annonce pas encore les approbations d'exec, modifiez directement son
`~/.openclaw/exec-approvals.json` local.

CLI : `openclaw approvals` prend en charge la modification sur gateway ou node (voir [CLI Approvals](/cli/approvals)).

## Flux d'approbation

Lorsqu'une invite est requise, la gateway diffuse `exec.approval.requested` aux clients opérateur.
L'interface Control et l'application macOS la résolvent via `exec.approval.resolve`, puis la gateway transmet la
requête approuvée à l'hôte du nœud.

Pour `host=node`, les requêtes d'approbation incluent une charge utile canonique `systemRunPlan`. La gateway utilise
ce plan comme contexte de commande/cwd/session faisant autorité lors du transfert des requêtes
`system.run` approuvées.

C'est important pour la latence d'approbation asynchrone :

- le chemin d'exec du nœud prépare un plan canonique unique en amont
- l'enregistrement d'approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvée, l'appel `system.run` final transmis réutilise le plan stocké
  au lieu de faire confiance à des modifications ultérieures de l'appelant
- si l'appelant modifie `command`, `rawCommand`, `cwd`, `agentId`, ou
  `sessionKey` après la création de la requête d'approbation, la gateway refuse l'exécution
  transmise pour cause d'incompatibilité d'approbation

## Commandes d'interpréteur/runtime

Les exécutions d'interpréteur/runtime adossées à une approbation sont volontairement prudentes :

- Le contexte exact `argv`/`cwd`/`env` est toujours lié.
- Les formes directes de scripts shell et de fichiers runtime sont liées au mieux à un instantané concret d'un fichier local.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent quand même en un seul fichier local direct (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déroulées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d'interpréteur/runtime
  (par exemple scripts de paquet, formes eval, chaînes de chargement spécifiques au runtime, ou formes ambiguës à plusieurs fichiers),
  l'exécution adossée à une approbation est refusée au lieu de prétendre à une couverture sémantique qu'elle n'a pas.
- Pour ces workflows, préférez le sandboxing, une limite d'hôte séparée, ou un workflow explicite trusted
  allowlist/full dans lequel l'opérateur accepte la sémantique plus large du runtime.

Lorsque des approbations sont requises, l'outil exec renvoie immédiatement avec un identifiant d'approbation. Utilisez cet identifiant pour
corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n'arrive avant le
délai d'expiration, la requête est traitée comme un timeout d'approbation et remontée comme motif de refus.

### Comportement de livraison de suivi

Après la fin d'un exec asynchrone approuvé, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison de suivi utilise ce canal.
- Dans les flux webchat-only ou de session interne sans cible externe, la livraison de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu'aucun canal externe ne peut être résolu, la livraison est rétrogradée en session seule au lieu d'échouer.

La boîte de dialogue de confirmation inclut :

- commande + arguments
- cwd
- id d'agent
- chemin résolu de l'exécutable
- métadonnées d'hôte + de politique

Actions :

- **Allow once** → exécuter maintenant
- **Always allow** → ajouter à la liste d'autorisation + exécuter
- **Deny** → bloquer

## Transmission des approbations aux canaux de chat

Vous pouvez transmettre les invites d'approbation d'exec à n'importe quel canal de chat (y compris les canaux de plugin) et les approuver
avec `/approve`. Cela utilise le pipeline de livraison sortante normal.

Config :
__OC_I18N_900005__
Répondez dans le chat :
__OC_I18N_900006__
La commande `/approve` gère à la fois les approbations d'exec et les approbations de plugin. Si l'ID ne correspond pas à une approbation d'exec en attente, elle vérifie automatiquement les approbations de plugin à la place.

### Transmission des approbations de plugin

La transmission des approbations de plugin utilise le même pipeline de livraison que les approbations d'exec, mais possède sa propre
configuration indépendante sous `approvals.plugin`. Activer ou désactiver l'une n'affecte pas l'autre.
__OC_I18N_900007__
La forme de la config est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d'approbation pour les approbations d'exec et
de plugin. Les canaux sans interface interactive partagée reviennent à du texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n'importe quel canal

Lorsqu'une requête d'approbation d'exec ou de plugin provient d'une surface de chat livrable, ce même chat
peut désormais l'approuver avec `/approve` par défaut. Cela s'applique à des canaux tels que Slack, Matrix et
Microsoft Teams, en plus des flux déjà existants de l'interface Web UI et de l'interface terminal.

Ce chemin partagé de commande texte utilise le modèle d'authentification normal du canal pour cette conversation. Si le
chat d'origine peut déjà envoyer des commandes et recevoir des réponses, les requêtes d'approbation n'ont plus besoin d'un
adaptateur de livraison natif séparé simplement pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur
liste d'approbateurs résolus pour l'autorisation, même lorsque la livraison native d'approbation est désactivée.

Pour Telegram et d'autres clients d'approbation natifs qui appellent directement la Gateway,
ce mécanisme de repli est volontairement limité aux échecs « approbation introuvable ». Une véritable
erreur/refus d'approbation d'exec ne réessaie pas silencieusement comme approbation de plugin.

### Livraison native des approbations

Certains canaux peuvent aussi agir comme clients natifs d'approbation. Les clients natifs ajoutent des DM aux approbateurs, la diffusion vers le chat d'origine,
et une UX d'approbation interactive propre au canal, en plus du flux partagé `/approve` dans le même chat.

Lorsque des cartes/boutons d'approbation natifs sont disponibles, cette interface native est le
chemin principal côté agent. L'agent ne doit pas également répéter une commande de chat brute
`/approve` en doublon, sauf si le résultat de l'outil indique que les approbations par chat ne sont pas disponibles ou que
l'approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d'exec sur l'hôte décide toujours si une approbation d'exec est requise
- `approvals.exec` contrôle le transfert des invites d'approbation vers d'autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client natif d'approbation

Les clients natifs d'approbation activent automatiquement la livraison prioritaire en DM lorsque tout ceci est vrai :

- le canal prend en charge la livraison native des approbations
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicites ou des
  sources de repli documentées pour ce canal
- `channels.<channel>.execApprovals.enabled` n'est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client natif d'approbation. Définissez `enabled: true` pour le forcer
lorsque les approbateurs se résolvent. La livraison publique dans le chat d'origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi y a-t-il deux configs d'approbation d'exec pour les approbations par chat ?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients natifs d'approbation ajoutent du routage DM et une diffusion facultative vers le canal en plus du flux partagé
`/approve` dans le même chat et des boutons d'approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams, et autres chats livrables utilisent le modèle d'authentification normal du canal
  pour `/approve` dans le même chat
- lorsqu'un client natif d'approbation s'active automatiquement, la cible de livraison native par défaut est les DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration propriétaire existante (`allowFrom`, plus `defaultTo` en message direct si pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d'id d'approbation, de sorte que les ids `plugin:` peuvent résoudre les approbations de plugin
  sans seconde couche locale de repli propre à Slack
- le routage DM/canal natif de Matrix est réservé à exec ; les approbations de plugin Matrix restent sur le flux partagé
  `/approve` dans le même chat et les chemins facultatifs de transmission `approvals.plugin`
- le demandeur n'a pas besoin d'être un approbateur
- le chat d'origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge commandes et réponses
- les boutons natifs d'approbation Discord routent selon le type d'id d'approbation : les ids `plugin:` vont
  directement vers les approbations de plugin, tout le reste va vers les approbations d'exec
- les boutons natifs d'approbation Telegram suivent le même mécanisme borné de repli exec-vers-plugin que `/approve`
- lorsque `target` natif active la livraison dans le chat d'origine, les invites d'approbation incluent le texte de la commande
- les approbations d'exec en attente expirent au bout de 30 minutes par défaut
- si aucune interface opérateur ou aucun client d'approbation configuré ne peut accepter la requête, l'invite se replie sur `askFallback`

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous
voulez que les invites d'approbation apparaissent aussi dans le chat/sujet Telegram d'origine. Pour les sujets de forum Telegram,
OpenClaw conserve le sujet pour l'invite d'approbation et le suivi post-approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900008__
Remarques de sécurité :

- Socket Unix en mode `0600`, token stocké dans `exec-approvals.json`.
- Vérification du pair ayant le même UID.
- Challenge/réponse (nonce + token HMAC + hachage de requête) + TTL court.

## Événements système

Le cycle de vie d'exec est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil d'avis d'exécution)
- `Exec finished`
- `Exec denied`

Ils sont publiés dans la session de l'agent après que le nœud a signalé l'événement.
Les approbations d'exec sur l'hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu'elle s'exécute au-delà du seuil).
Les exec soumis à approbation réutilisent l'id d'approbation comme `runId` dans ces messages pour faciliter la corrélation.

## Comportement en cas d'approbation refusée

Lorsqu'une approbation d'exec asynchrone est refusée, OpenClaw empêche l'agent de réutiliser
la sortie d'une exécution antérieure de la même commande dans la session. La raison du refus
est transmise avec l'indication explicite qu'aucune sortie de commande n'est disponible, ce qui empêche
l'agent d'affirmer qu'il existe une nouvelle sortie ou de répéter la commande refusée avec des
résultats obsolètes provenant d'une exécution réussie antérieure.

## Implications

- **full** est puissant ; préférez les listes d'autorisation lorsque c'est possible.
- **ask** vous maintient dans la boucle tout en permettant des approbations rapides.
- Les listes d'autorisation par agent empêchent les approbations d'un agent de fuiter vers d'autres.
- Les approbations ne s'appliquent qu'aux requêtes d'exec sur l'hôte provenant **d'expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception.
  Pour bloquer strictement l'exec sur l'hôte, définissez la sécurité des approbations sur `deny` ou refusez l'outil `exec` via la politique d'outils.

Lié :

- [Outil Exec](/tools/exec)
- [Mode elevated](/tools/elevated)
- [Skills](/tools/skills)

## Liens connexes

- [Exec](/tools/exec) — outil d'exécution de commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — modes sandbox et accès à l'espace de travail
- [Security](/fr/gateway/security) — modèle de sécurité et durcissement
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — quand utiliser chacun
