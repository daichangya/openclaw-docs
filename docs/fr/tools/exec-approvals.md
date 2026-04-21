---
read_when:
    - Configuration des approbations d’exécution ou des listes d’autorisation
    - Implémentation de l’interface d’approbation d’exécution dans l’app macOS
    - Examen des invites d’échappement du sandbox et de leurs implications
summary: Approbations d’exécution, listes d’autorisation et invites d’échappement du sandbox
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-04-21T07:06:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approbations d’exécution

Les approbations d’exécution sont le **garde-fou de l’app compagnon / de l’hôte de nœud** qui permet à un agent sandboxé d’exécuter
des commandes sur un hôte réel (`gateway` ou `node`). Voyez cela comme un interverrouillage de sécurité :
les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation + (éventuellement) l’approbation utilisateur sont toutes d’accord.
Les approbations d’exécution s’ajoutent **en plus** à la politique d’outils et au filtrage elevated (sauf si elevated est défini sur `full`, ce qui ignore les approbations).
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ; si un champ d’approbation est omis, la valeur de `tools.exec` est utilisée.
L’exécution hôte utilise aussi l’état local des approbations sur cette machine. Un paramètre local
`ask: "always"` dans `~/.openclaw/exec-approvals.json` continue d’afficher une invite même si
les valeurs par défaut de la session ou de la configuration demandent `ask: "on-miss"`.
Utilisez `openclaw approvals get`, `openclaw approvals get --gateway` ou
`openclaw approvals get --node <id|name|ip>` pour inspecter la politique demandée,
les sources de politique hôte et le résultat effectif.
Pour la machine locale, `openclaw exec-policy show` expose la même vue fusionnée et
`openclaw exec-policy set|preset` peut synchroniser la politique locale demandée avec le
fichier local d’approbations hôte en une seule étape. Lorsqu’une portée locale demande `host=node`,
`openclaw exec-policy show` signale cette portée comme gérée par le nœud à l’exécution au lieu de
prétendre que le fichier local d’approbations est la source de vérité effective.

Si l’interface de l’app compagnon **n’est pas disponible**, toute demande nécessitant une invite
est résolue par le **repli ask** (par défaut : refus).

Les clients natifs d’approbation dans le chat peuvent aussi exposer des affordances spécifiques au canal sur le
message d’approbation en attente. Par exemple, Matrix peut initialiser des raccourcis de réaction sur
l’invite d’approbation (`✅` autoriser une fois, `❌` refuser et `♾️` toujours autoriser lorsque disponible)
tout en laissant les commandes `/approve ...` dans le message comme solution de secours.

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **hôte gateway** → processus `openclaw` sur la machine gateway
- **hôte node** → exécuteur de nœud (app compagnon macOS ou hôte de nœud headless)

Remarque sur le modèle de confiance :

- Les appelants authentifiés auprès de la Gateway sont des opérateurs de confiance pour cette Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur de confiance à l’hôte de nœud.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent pas une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur l’hôte de nœud lient le contexte d’exécution canonique : `cwd` canonique, `argv` exact, liaison d’environnement lorsqu’elle est présente, et chemin d’exécutable épinglé lorsque applicable.
- Pour les scripts shell et les invocations directes de fichier via interpréteur/runtime, OpenClaw essaie aussi de lier
  un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution,
  l’exécution est refusée au lieu d’exécuter un contenu dérivé.
- Cette liaison de fichier est volontairement au mieux, et non un modèle sémantique complet de chaque
  chemin de chargement d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier,
  il refuse de créer une exécution adossée à une approbation au lieu de prétendre à une couverture complète.

Découpage macOS :

- **service d’hôte de nœud** transfère `system.run` à la **app macOS** via IPC local.
- **app macOS** applique les approbations + exécute la commande dans le contexte UI.

## Paramètres et stockage

Les approbations résident dans un fichier JSON local sur l’hôte d’exécution :

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

## Mode « YOLO » sans approbation

Si vous voulez que l’exécution hôte s’effectue sans invites d’approbation, vous devez ouvrir **les deux** couches de politique :

- politique d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`)
- politique locale d’approbations hôte dans `~/.openclaw/exec-approvals.json`

C’est désormais le comportement hôte par défaut, sauf si vous le resserrez explicitement :

- `tools.exec.security`: `full` sur `gateway`/`node`
- `tools.exec.ask`: `off`
- hôte `askFallback`: `full`

Distinction importante :

- `tools.exec.host=auto` choisit où l’exécution s’effectue : dans le sandbox s’il est disponible, sinon sur la gateway.
- YOLO choisit comment l’exécution hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute pas de barrière distincte d’approbation heuristique contre l’obfuscation de commandes ni de couche de rejet préalable de script par-dessus la politique configurée d’exécution hôte.
- `auto` ne transforme pas le routage gateway en substitution libre depuis une session sandboxée. Une demande par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime sandbox n’est actif. Si vous voulez une valeur par défaut stable non auto, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche sur `allowlist` / `on-miss`
ou `deny`.

Configuration persistante « ne jamais demander » pour l’hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Définissez ensuite le fichier d’approbations hôte en conséquence :

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

Raccourci local pour la même politique d’hôte gateway sur la machine actuelle :

```bash
openclaw exec-policy preset yolo
```

Ce raccourci local met à jour les deux éléments suivants :

- `tools.exec.host/security/ask` local
- les valeurs par défaut de `~/.openclaw/exec-approvals.json` local

Il est volontairement limité au local. Si vous devez modifier à distance les approbations de l’hôte gateway ou de l’hôte node,
continuez à utiliser `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Pour un hôte node, appliquez plutôt le même fichier d’approbations sur ce nœud :

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

Limitation importante locale uniquement :

- `openclaw exec-policy` ne synchronise pas les approbations de nœud
- `openclaw exec-policy set --host node` est rejeté
- les approbations d’exécution sur nœud sont récupérées depuis le nœud à l’exécution ; les mises à jour ciblant le nœud doivent donc utiliser `openclaw approvals --node ...`

Raccourci session uniquement :

- `/exec security=full ask=off` ne modifie que la session actuelle.
- `/elevated full` est un raccourci de type break-glass qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations hôte reste plus strict que la configuration, la politique hôte la plus stricte l’emporte quand même.

## Paramètres de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les demandes d’exécution hôte.
- **allowlist** : autorise uniquement les commandes présentes dans la liste d’autorisation.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : ne jamais demander.
- **on-miss** : demander uniquement lorsqu’aucune correspondance de liste d’autorisation n’est trouvée.
- **always** : demander pour chaque commande.
- la confiance durable `allow-always` ne supprime pas les invites lorsque le mode ask effectif est `always`

### Repli Ask (`askFallback`)

Si une invite est requise mais qu’aucune UI n’est joignable, le repli décide :

- **deny** : bloquer.
- **allowlist** : autoriser uniquement si la liste d’autorisation correspond.
- **full** : autoriser.

### Renforcement de l’évaluation inline d’interpréteur (`tools.exec.strictInlineEval`)

Lorsque `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d’évaluation de code inline comme nécessitant une approbation, même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s’agit d’une défense en profondeur pour les chargeurs d’interpréteur qui ne se rattachent pas proprement à un opérande de fichier unique et stable. En mode strict :

- ces commandes nécessitent toujours une approbation explicite ;
- `allow-always` ne persiste pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. Si plusieurs agents existent, changez d’agent
dans l’app macOS. Les motifs sont des **correspondances glob insensibles à la casse**.
Les motifs doivent se résoudre en **chemins binaires** (les entrées sur le seul basename sont ignorées).
Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell telles que `echo ok && pwd` exigent toujours que chaque segment de premier niveau satisfasse aux règles de liste d’autorisation.

Exemples :

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

- **id** UUID stable utilisé pour l’identité dans l’UI (facultatif)
- **last used** horodatage
- **last used command**
- **last resolved path**

## Auto-allow skill CLIs

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par des Skills connus
sont traités comme figurant dans la liste d’autorisation sur les nœuds (nœud macOS ou hôte de nœud headless). Cela utilise
`skills.bins` via le RPC Gateway pour récupérer la liste des binaires de Skills. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

Remarques importantes de confiance :

- Il s’agit d’une **liste d’autorisation implicite de commodité**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements d’opérateurs de confiance où la Gateway et le nœud partagent la même frontière de confiance.
- Si vous avez besoin d’une confiance explicite stricte, conservez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

## Safe bins (stdin-only)

`tools.exec.safeBins` définit une petite liste de binaires **stdin-only** (par exemple `cut`)
pouvant s’exécuter en mode liste d’autorisation **sans** entrées explicites de liste d’autorisation. Les safe bins rejettent
les arguments de fichier positionnels et les jetons ressemblant à des chemins ; ils ne peuvent donc opérer que sur le flux entrant.
Considérez cela comme un chemin rapide étroit pour les filtres de flux, et non comme une liste de confiance générale.
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`.
Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites de liste d’autorisation et laissez les invites d’approbation activées.
Les safe bins personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
La validation est déterministe à partir de la seule forme de `argv` (sans vérification d’existence sur le système de fichiers hôte), ce qui
empêche un comportement d’oracle d’existence de fichier à partir des différences autoriser/refuser.
Les options orientées fichier sont refusées pour les safe bins par défaut (par exemple `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Les safe bins appliquent aussi une politique explicite de drapeaux par binaire pour les options qui cassent le comportement stdin-only
(par exemple `sort -o/--output/--compress-program` et les drapeaux récursifs de grep).
Les options longues sont validées de manière fermée en mode safe-bin : les drapeaux inconnus et les abréviations ambiguës sont rejetés.
Drapeaux refusés par profil safe-bin :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les safe bins forcent aussi les jetons `argv` à être traités comme du **texte littéral** au moment de l’exécution (pas de globbing
et pas d’expansion de `$VARS`) pour les segments stdin-only, afin que des motifs comme `*` ou `$HOME/...` ne puissent pas être
utilisés pour dissimuler des lectures de fichiers.
Les safe bins doivent aussi se résoudre depuis des répertoires binaires de confiance (valeurs système par défaut plus
`tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement considérées comme fiables.
Les répertoires fiables par défaut pour les safe bins sont volontairement minimaux : `/bin`, `/usr/bin`.
Si votre exécutable safe-bin se trouve dans des chemins de gestionnaire de paquets/utilisateur (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement
à `tools.exec.safeBinTrustedDirs`.
Les chaînages shell et les redirections ne sont pas automatiquement autorisés en mode liste d’autorisation.

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau satisfait à la liste d’autorisation
(y compris les safe bins ou l’auto-allow des Skills). Les redirections restent non prises en charge en mode liste d’autorisation.
La substitution de commande (`$()` / backticks) est rejetée lors de l’analyse de la liste d’autorisation, y compris à l’intérieur
de guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.
Dans les approbations de l’app compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d’expansion shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence de correspondance dans la liste d’autorisation, sauf si
le binaire shell lui-même figure dans la liste d’autorisation.
Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les substitutions d’environnement à portée de requête sont réduites à une
petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Pour les décisions allow-always en mode liste d’autorisation, les wrappers de distribution connus
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes au lieu des chemins des wrappers. Les multiplexeurs shell (`busybox`, `toybox`) sont aussi déballés pour les applets shell (`sh`, `ash`,
etc.) afin que les exécutables internes soient persistés au lieu des binaires multiplexeurs. Si un wrapper ou un
multiplexeur ne peut pas être déballé en toute sécurité, aucune entrée de liste d’autorisation n’est persistée automatiquement.
Si vous mettez des interpréteurs comme `python3` ou `node` dans la liste d’autorisation, préférez `tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite toujours une approbation explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les vecteurs d’évaluation inline ne sont pas persistés automatiquement.

Safe bins par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez explicitement, conservez des entrées explicites de liste d’autorisation pour
leurs workflows non stdin.
Pour `grep` en mode safe-bin, fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est
rejetée afin que des opérandes de fichier ne puissent pas être dissimulés comme positionnels ambigus.

### Safe bins versus liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Objectif         | Autoriser automatiquement des filtres stdin étroits    | Faire explicitement confiance à des exécutables spécifiques |
| Type de correspondance | Nom d’exécutable + politique `argv` safe-bin     | Motif glob du chemin d’exécutable résolu                    |
| Portée des arguments | Restreinte par le profil safe-bin et les règles de jetons littéraux | Correspondance sur le chemin uniquement ; les arguments relèvent sinon de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées       |
| Meilleur usage   | Transformations de texte à faible risque dans des pipelines | Tout outil avec un comportement plus large ou des effets de bord |

Emplacement de configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` par agent).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` par agent).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` par agent). Les clés de profil par agent remplacent les clés globales.
- les entrées de liste d’autorisation résident dans `~/.openclaw/exec-approvals.json` local à l’hôte sous `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer les entrées personnalisées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (à examiner et resserrer ensuite). Les binaires d’interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900005__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette quand même le builtin `env` en mode safe-bin
afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin explicite dans la liste d’autorisation
ou invite d’approbation.

## Édition dans Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les substitutions
par agent et les listes d’autorisation. Choisissez une portée (Defaults ou un agent), ajustez la politique,
ajoutez/supprimez des motifs de liste d’autorisation, puis cliquez sur **Save**. L’interface affiche les métadonnées **last used**
par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nœuds
doivent annoncer `system.execApprovals.get/set` (app macOS ou hôte de nœud headless).
Si un nœud n’annonce pas encore les approbations d’exécution, modifiez directement son
`~/.openclaw/exec-approvals.json` local.

CLI : `openclaw approvals` prend en charge l’édition gateway ou nœud (voir [Approvals CLI](/cli/approvals)).

## Flux d’approbation

Lorsqu’une invite est requise, la gateway diffuse `exec.approval.requested` aux clients opérateur.
Control UI et l’app macOS la résolvent via `exec.approval.resolve`, puis la gateway transfère la
demande approuvée à l’hôte de nœud.

Pour `host=node`, les demandes d’approbation incluent une charge utile canonique `systemRunPlan`. La gateway utilise
ce plan comme contexte de vérité pour la commande/le `cwd`/la session lors du transfert des demandes approuvées `system.run`.

Cela compte pour la latence d’approbation asynchrone :

- le chemin d’exécution node prépare un plan canonique en amont
- l’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvée, l’appel final transféré `system.run` réutilise le plan stocké
  au lieu de faire confiance à des modifications ultérieures de l’appelant
- si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId` ou
  `sessionKey` après la création de la demande d’approbation, la gateway rejette l’exécution
  transférée comme incompatibilité d’approbation

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime adossées à une approbation sont volontairement prudentes :

- Le contexte exact `argv`/`cwd`/`env` est toujours lié.
- Les scripts shell directs et les formes directes de fichier runtime sont liés au mieux à un instantané concret d’un fichier local.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent quand même en un fichier local direct unique (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime
  (par exemple scripts de package, formes eval, chaînes de chargement spécifiques au runtime, ou formes multi-fichiers ambiguës),
  l’exécution adossée à une approbation est refusée au lieu de prétendre à une couverture sémantique qu’elle ne
  possède pas.
- Pour ces workflows, préférez le sandboxing, une frontière hôte distincte, ou un workflow explicite
  allowlist/full de confiance où l’opérateur accepte la sémantique plus large du runtime.

Lorsque des approbations sont requises, l’outil d’exécution renvoie immédiatement avec un identifiant d’approbation. Utilisez cet identifiant pour
corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le
timeout, la demande est traitée comme un délai d’attente d’approbation et remontée comme motif de refus.

### Comportement de livraison du suivi

Après la fin d’une exécution asynchrone approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison de suivi utilise ce canal.
- Dans les flux webchat-only ou de session interne sans cible externe, la livraison de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la demande échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée à la session uniquement au lieu d’échouer.

La boîte de dialogue de confirmation inclut :

- commande + arguments
- `cwd`
- identifiant d’agent
- chemin d’exécutable résolu
- métadonnées d’hôte + de politique

Actions :

- **Allow once** → exécuter maintenant
- **Always allow** → ajouter à la liste d’autorisation + exécuter
- **Deny** → bloquer

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de chat (y compris les canaux de Plugin) et les approuver
avec `/approve`. Cela utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900006__
Répondez dans le chat :
__OC_I18N_900007__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de Plugin. Si l’ID ne correspond à aucune approbation d’exécution en attente, elle vérifie automatiquement les approbations de Plugin à la place.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de livraison que les approbations d’exécution, mais possède sa
propre configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900008__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter` et `targets` fonctionnent de la même façon.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et de Plugin. Les canaux sans interface interactive partagée reviennent à du texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de Plugin provient d’une surface de chat livrable, le même chat
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux tels que Slack, Matrix et
Microsoft Teams, en plus des flux existants Web UI et terminal UI.

Ce chemin partagé de commande texte utilise le modèle d’authentification normal du canal pour cette conversation. Si le
chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un
adaptateur de livraison natif distinct juste pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur
liste résolue d’approbateurs pour l’autorisation, même lorsque la livraison native d’approbation est désactivée.

Pour Telegram et les autres clients natifs d’approbation qui appellent directement la Gateway,
ce mécanisme de secours est volontairement limité aux échecs « approval not found ». Un vrai
refus/erreur d’approbation d’exécution ne réessaie pas silencieusement comme approbation de Plugin.

### Livraison native des approbations

Certains canaux peuvent aussi servir de clients natifs d’approbation. Les clients natifs ajoutent les messages directs aux approbateurs, le
fanout vers le chat d’origine et une interface interactive d’approbation spécifique au canal par-dessus le flux partagé `/approve`
dans le même chat.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native constitue le chemin principal
côté agent. L’agent ne doit pas non plus répéter une commande de chat en clair
`/approve` en double, sauf si le résultat de l’outil indique que les approbations par chat sont indisponibles ou
que l’approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d’exécution hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client natif d’approbation

Les clients natifs d’approbation activent automatiquement la livraison DM-first lorsque toutes les conditions suivantes sont réunies :

- le canal prend en charge la livraison native des approbations
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicites ou des
  sources de secours documentées de ce canal
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client natif d’approbation. Définissez `enabled: true` pour le forcer
lorsque des approbateurs peuvent être résolus. La livraison publique vers le chat d’origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients natifs d’approbation ajoutent le routage DM et un éventuel fanout vers le canal par-dessus le flux partagé
`/approve` dans le même chat et les boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et chats livrables similaires utilisent le modèle d’authentification normal du canal
  pour `/approve` dans le même chat
- lorsqu’un client natif d’approbation s’active automatiquement, la cible de livraison native par défaut est le DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent autoriser ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration propriétaire existante (`allowFrom`, plus `defaultTo` en message direct lorsqu’il est pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre des approbations de Plugin
  sans seconde couche locale de secours propre à Slack
- le routage DM/canal natif Matrix et les raccourcis de réaction gèrent à la fois les approbations d’exécution et de Plugin ;
  l’autorisation de Plugin provient toujours de `channels.matrix.dm.allowFrom`
- le demandeur n’a pas besoin d’être un approbateur
- le chat d’origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge les commandes et les réponses
- les boutons natifs d’approbation Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont
  directement vers les approbations de Plugin, tout le reste va vers les approbations d’exécution
- les boutons natifs d’approbation Telegram suivent le même repli borné exec-vers-plugin que `/approve`
- lorsque `target` natif active la livraison vers le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent après 30 minutes par défaut
- si aucune interface opérateur ou aucun client d’approbation configuré ne peut accepter la demande, l’invite revient à `askFallback`

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez basculer vers `channel` ou `both` lorsque vous
voulez que les invites d’approbation apparaissent aussi dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram,
OpenClaw préserve le sujet pour l’invite d’approbation et pour le suivi après approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900009__
Remarques de sécurité :

- Mode du socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification de pair de même UID.
- Challenge/réponse (nonce + jeton HMAC + hachage de requête) + TTL court.

## Événements système

Le cycle de vie d’exécution est exposé comme messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution)
- `Exec finished`
- `Exec denied`

Ces messages sont publiés dans la session de l’agent après que le nœud a signalé l’événement.
Les approbations d’exécution sur l’hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions filtrées par approbation réutilisent l’identifiant d’approbation comme `runId` dans ces messages pour faciliter la corrélation.

## Comportement en cas d’approbation refusée

Lorsqu’une approbation d’exécution asynchrone est refusée, OpenClaw empêche l’agent de réutiliser
la sortie d’une exécution antérieure de la même commande dans la session. Le motif du refus
est transmis avec une indication explicite qu’aucune sortie de commande n’est disponible, ce qui empêche
l’agent d’affirmer qu’il existe une nouvelle sortie ou de répéter la commande refusée avec des
résultats obsolètes issus d’une exécution antérieure réussie.

## Implications

- **full** est puissant ; préférez les listes d’autorisation lorsque c’est possible.
- **ask** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent qu’une approbation d’un agent ne fuite vers un autre.
- Les approbations ne s’appliquent qu’aux demandes d’exécution hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau session pour les opérateurs autorisés et ignore les approbations par conception.
  Pour bloquer strictement l’exécution hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outils.

Liens connexes :

- [Exec tool](/fr/tools/exec)
- [Elevated mode](/fr/tools/elevated)
- [Skills](/fr/tools/skills)

## Liens connexes

- [Exec](/fr/tools/exec) — outil d’exécution de commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — modes sandbox et accès à l’espace de travail
- [Security](/fr/gateway/security) — modèle de sécurité et durcissement
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — quand utiliser chacun
