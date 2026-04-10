---
read_when:
    - Configuration des approbations d’exécution ou des listes d’autorisation
    - Implémentation de l’expérience utilisateur des approbations d’exécution dans l’app macOS
    - Examen des invites d’échappement au bac à sable et de leurs implications
summary: Approbations d’exécution, listes d’autorisation et invites d’échappement au bac à sable
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-04-10T06:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approbations d’exécution

Les approbations d’exécution sont le **garde-fou de l’app compagnon / de l’hôte de nœud** pour permettre à un agent sandboxé d’exécuter
des commandes sur un hôte réel (`gateway` ou `node`). Considérez cela comme un interverrouillage de sécurité :
les commandes ne sont autorisées que lorsque la politique + la liste d’autorisation + l’approbation utilisateur (facultative) sont toutes d’accord.
Les approbations d’exécution s’ajoutent à la politique de l’outil et au contrôle elevated (sauf si elevated est défini sur `full`, ce qui ignore les approbations).
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ; si un champ d’approbation est omis, la valeur de `tools.exec` est utilisée.
L’exécution sur hôte utilise aussi l’état local des approbations sur cette machine. Un
`ask: "always"` local dans `~/.openclaw/exec-approvals.json` continue à demander une approbation même si
la session ou les valeurs par défaut de la configuration demandent `ask: "on-miss"`.
Utilisez `openclaw approvals get`, `openclaw approvals get --gateway`, ou
`openclaw approvals get --node <id|name|ip>` pour inspecter la politique demandée,
les sources de politique de l’hôte et le résultat effectif.
Pour la machine locale, `openclaw exec-policy show` expose la même vue fusionnée et
`openclaw exec-policy set|preset` peut synchroniser en une seule étape la politique locale demandée avec le
fichier local des approbations de l’hôte. Lorsqu’une portée locale demande `host=node`,
`openclaw exec-policy show` signale cette portée comme gérée par le nœud au moment de l’exécution au lieu de
faire semblant que le fichier local des approbations est la source de vérité effective.

Si l’interface de l’app compagnon **n’est pas disponible**, toute demande nécessitant une invite
est résolue par la **solution de repli ask** (par défaut : deny).

Les clients d’approbation de chat natifs peuvent aussi exposer des affordances spécifiques au canal sur le
message d’approbation en attente. Par exemple, Matrix peut préremplir des raccourcis de réaction sur
l’invite d’approbation (`✅` autoriser une fois, `❌` refuser, et `♾️` toujours autoriser lorsque disponible)
tout en laissant les commandes `/approve ...` dans le message comme solution de repli.

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **hôte gateway** → processus `openclaw` sur la machine gateway
- **hôte node** → exécuteur de nœud (app compagnon macOS ou hôte de nœud headless)

Note sur le modèle de confiance :

- Les appelants authentifiés par Gateway sont des opérateurs de confiance pour cette Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur de confiance à l’hôte du nœud.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent pas une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur hôte de nœud lient le contexte d’exécution canonique : `cwd` canonique, `argv` exact, liaison d’environnement
  lorsqu’elle est présente, et chemin de l’exécutable épinglé lorsque applicable.
- Pour les scripts shell et les invocations directes de fichiers d’interpréteur/runtime, OpenClaw essaie aussi de lier
  un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution,
  l’exécution est refusée au lieu d’exécuter un contenu dérivé.
- Cette liaison de fichier est volontairement fournie au mieux, et non comme un modèle sémantique complet de chaque
  chemin de chargement d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier,
  il refuse de créer une exécution adossée à une approbation plutôt que de prétendre offrir une couverture complète.

Scission macOS :

- **service d’hôte de nœud** transfère `system.run` vers l’**app macOS** via IPC locale.
- **app macOS** applique les approbations + exécute la commande dans le contexte de l’interface.

## Paramètres et stockage

Les approbations sont stockées dans un fichier JSON local sur l’hôte d’exécution :

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

Si vous voulez que l’exécution sur hôte s’exécute sans invites d’approbation, vous devez ouvrir **les deux** couches de politique :

- la politique d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`)
- la politique locale d’approbation sur l’hôte dans `~/.openclaw/exec-approvals.json`

C’est désormais le comportement par défaut sur l’hôte, sauf si vous le resserrez explicitement :

- `tools.exec.security`: `full` sur `gateway`/`node`
- `tools.exec.ask`: `off`
- hôte `askFallback`: `full`

Distinction importante :

- `tools.exec.host=auto` choisit où l’exécution a lieu : dans le bac à sable lorsqu’il est disponible, sinon sur la gateway.
- YOLO choisit comment l’exécution sur hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute pas de contrôle d’approbation heuristique séparé pour l’obfuscation de commande au-dessus de la politique d’exécution sur hôte configurée.
- `auto` ne transforme pas le routage gateway en dérogation libre depuis une session sandboxée. Une demande par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime sandbox n’est actif. Si vous voulez une valeur par défaut stable non `auto`, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche vers `allowlist` / `on-miss`
ou `deny`.

Configuration persistante "ne jamais demander" pour l’hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ensuite, définissez le fichier d’approbations de l’hôte de façon cohérente :

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

Ce raccourci local met à jour les deux :

- `tools.exec.host/security/ask` local
- valeurs par défaut locales de `~/.openclaw/exec-approvals.json`

Il est volontairement limité au local. Si vous devez modifier à distance les approbations de l’hôte gateway ou de l’hôte node,
continuez à utiliser `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Pour un hôte de nœud, appliquez plutôt le même fichier d’approbations sur ce nœud :

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

Limitation importante limitée au local :

- `openclaw exec-policy` ne synchronise pas les approbations du nœud
- `openclaw exec-policy set --host node` est refusé
- les approbations d’exécution du nœud sont récupérées depuis le nœud au moment de l’exécution, donc les mises à jour ciblant le nœud doivent utiliser `openclaw approvals --node ...`

Raccourci limité à la session :

- `/exec security=full ask=off` modifie uniquement la session en cours.
- `/elevated full` est un raccourci brise-glace qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique d’hôte la plus stricte continue de prévaloir.

## Paramètres de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les demandes d’exécution sur hôte.
- **allowlist** : autorise uniquement les commandes figurant dans la liste d’autorisation.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : ne jamais demander.
- **on-miss** : demander uniquement quand la liste d’autorisation ne correspond pas.
- **always** : demander pour chaque commande.
- une confiance durable `allow-always` ne supprime pas les invites lorsque le mode ask effectif est `always`

### Solution de repli Ask (`askFallback`)

Si une invite est requise mais qu’aucune interface n’est accessible, la solution de repli décide :

- **deny** : bloquer.
- **allowlist** : autoriser uniquement si la liste d’autorisation correspond.
- **full** : autoriser.

### Renforcement de l’évaluation inline de l’interpréteur (`tools.exec.strictInlineEval`)

Quand `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d’évaluation inline du code comme nécessitant une approbation même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s’agit d’une défense en profondeur pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un seul opérande de fichier stable. En mode strict :

- ces commandes nécessitent toujours une approbation explicite ;
- `allow-always` ne persiste pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. Si plusieurs agents existent, changez l’agent que vous
modifiez dans l’app macOS. Les motifs sont des **correspondances glob insensibles à la casse**.
Les motifs doivent se résoudre en **chemins de binaire** (les entrées avec nom de base uniquement sont ignorées).
Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell comme `echo ok && pwd` exigent toujours que chaque segment de premier niveau respecte les règles de liste d’autorisation.

Exemples :

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

- **id** UUID stable utilisé pour l’identité dans l’interface (facultatif)
- horodatage de **dernière utilisation**
- **dernière commande utilisée**
- **dernier chemin résolu**

## Auto-autoriser les CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par les Skills connus
sont traités comme figurant dans la liste d’autorisation sur les nœuds (nœud macOS ou hôte de nœud headless). Cela utilise
`skills.bins` via le RPC Gateway pour récupérer la liste des binaires de Skills. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

Notes de confiance importantes :

- Il s’agit d’une **liste d’autorisation implicite pratique**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée à des environnements d’opérateurs de confiance où Gateway et le nœud sont dans la même frontière de confiance.
- Si vous exigez une confiance explicite stricte, conservez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

## Safe bins (stdin-only)

`tools.exec.safeBins` définit une petite liste de binaires **stdin-only** (par exemple `cut`)
qui peuvent s’exécuter en mode liste d’autorisation **sans** entrées explicites dans la liste d’autorisation. Les safe bins refusent
les arguments de fichier positionnels et les jetons ressemblant à des chemins, afin qu’ils ne puissent opérer que sur le flux entrant.
Considérez cela comme un chemin rapide étroit pour les filtres de flux, et non comme une liste de confiance générale.
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`.
Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites dans la liste d’autorisation et laissez les invites d’approbation activées.
Les safe bins personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
La validation est déterministe à partir de la seule forme de `argv` (sans vérification d’existence sur le système de fichiers hôte), ce qui
évite un comportement d’oracle d’existence de fichier via des différences d’autorisation/refus.
Les options orientées fichiers sont refusées pour les safe bins par défaut (par exemple `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Les safe bins appliquent aussi une politique explicite par binaire sur les drapeaux qui rompent le
comportement stdin-only (par exemple `sort -o/--output/--compress-program` et les drapeaux récursifs de grep).
Les options longues sont validées en refus par défaut en mode safe-bin : les drapeaux inconnus et les
abréviations ambiguës sont rejetés.
Drapeaux refusés par profil safe-bin :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep` : `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq` : `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort` : `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc` : `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les safe bins forcent aussi les jetons `argv` à être traités comme du **texte littéral** au moment de l’exécution (pas de globbing
et pas d’expansion de `$VARS`) pour les segments stdin-only, afin que des motifs comme `*` ou `$HOME/...` ne puissent pas être
utilisés pour dissimuler des lectures de fichiers.
Les safe bins doivent aussi se résoudre depuis des répertoires de binaires de confiance (valeurs système par défaut plus
`tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement considérées comme fiables.
Les répertoires fiables par défaut pour les safe bins sont volontairement minimaux : `/bin`, `/usr/bin`.
Si votre exécutable safe-bin se trouve dans des chemins utilisateur ou de gestionnaire de paquets (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement
à `tools.exec.safeBinTrustedDirs`.
L’enchaînement shell et les redirections ne sont pas automatiquement autorisés en mode allowlist.

L’enchaînement shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau satisfait la liste d’autorisation
(y compris les safe bins ou l’auto-autorisation de Skills). Les redirections restent non prises en charge en mode allowlist.
La substitution de commande (`$()` / accents graves) est rejetée lors de l’analyse allowlist, y compris à l’intérieur des
guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.
Dans les approbations de l’app compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d’expansion shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence de correspondance dans la liste d’autorisation, sauf si
le binaire shell lui-même figure dans la liste d’autorisation.
Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les substitutions d’environnement à portée de requête sont réduites à une
petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Pour les décisions allow-always en mode allowlist, les wrappers de répartition connus
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes au lieu des chemins
des wrappers. Les multiplexeurs shell (`busybox`, `toybox`) sont aussi déballés pour les applets shell (`sh`, `ash`,
etc.) afin que les exécutables internes soient persistés au lieu des binaires du multiplexeur. Si un wrapper ou un
multiplexeur ne peut pas être déballé de manière sûre, aucune entrée de liste d’autorisation n’est persistée automatiquement.
Si vous mettez des interpréteurs comme `python3` ou `node` dans la liste d’autorisation, préférez `tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite toujours une approbation explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les supports d’évaluation inline ne sont pas persistés automatiquement.

Safe bins par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne font pas partie de la liste par défaut. Si vous les activez explicitement, conservez des entrées explicites dans la liste d’autorisation pour
leurs flux de travail non stdin.
Pour `grep` en mode safe-bin, fournissez le motif avec `-e`/`--regexp` ; la forme de motif positionnelle est
rejetée afin que des opérandes de fichier ne puissent pas être dissimulés comme positionnels ambigus.

### Safe bins versus liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                 |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objectif         | Auto-autoriser des filtres stdin étroits               | Faire explicitement confiance à des exécutables spécifiques  |
| Type de correspondance | Nom d’exécutable + politique `argv` du safe-bin   | Motif glob du chemin résolu de l’exécutable                  |
| Portée des arguments   | Restreinte par le profil safe-bin et les règles de jetons littéraux | Correspondance de chemin uniquement ; les arguments relèvent sinon de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                            | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées        |
| Meilleure utilisation | Transformations de texte à faible risque dans des pipelines | Tout outil au comportement plus large ou avec effets de bord |

Emplacement de la configuration :

- `safeBins` vient de la configuration (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` par agent).
- `safeBinTrustedDirs` vient de la configuration (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` par agent).
- `safeBinProfiles` vient de la configuration (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` par agent). Les clés de profil par agent remplacent les clés globales.
- les entrées de liste d’autorisation vivent dans `~/.openclaw/exec-approvals.json` local à l’hôte sous `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer les entrées personnalisées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (vérifiez-les et resserrez-les ensuite). Les binaires d’interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900005__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette quand même le builtin `env` en mode safe-bin
afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin explicite dans la liste d’autorisation
ou invite d’approbation.

## Modification dans Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les
remplacements par agent et les listes d’autorisation. Choisissez une portée (valeurs par défaut ou agent), ajustez la politique,
ajoutez/supprimez des motifs de liste d’autorisation, puis cliquez sur **Save**. L’interface affiche les métadonnées de **dernière utilisation**
par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nœuds
doivent annoncer `system.execApprovals.get/set` (app macOS ou hôte de nœud headless).
Si un nœud n’annonce pas encore les approbations d’exécution, modifiez directement son
`~/.openclaw/exec-approvals.json` local.

CLI : `openclaw approvals` prend en charge la modification sur gateway ou sur nœud (voir [CLI d’approbations](/cli/approvals)).

## Flux d’approbation

Lorsqu’une invite est requise, la gateway diffuse `exec.approval.requested` aux clients opérateurs.
Control UI et l’app macOS la résolvent via `exec.approval.resolve`, puis la gateway transmet la
demande approuvée à l’hôte de nœud.

Pour `host=node`, les demandes d’approbation incluent une charge utile canonique `systemRunPlan`. La gateway utilise
ce plan comme contexte de commande/cwd/session faisant autorité lors du transfert des demandes
`system.run` approuvées.

C’est important pour la latence d’approbation asynchrone :

- le chemin d’exécution du nœud prépare un plan canonique en amont
- l’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvée, l’appel final `system.run` transmis réutilise le plan stocké
  au lieu de se fier à des modifications ultérieures de l’appelant
- si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId`, ou
  `sessionKey` après la création de la demande d’approbation, la gateway rejette l’exécution
  transmise comme non conforme à l’approbation

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime adossées à une approbation sont volontairement prudentes :

- Le contexte exact `argv`/`cwd`/`env` est toujours lié.
- Les formes directes de script shell et de fichier runtime sont liées au mieux à un instantané d’un seul fichier local concret.
- Les formes courantes de wrappers de gestionnaire de paquets qui se résolvent malgré tout vers un seul fichier local direct (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime
  (par exemple scripts de package, formes eval, chaînes de chargement propres au runtime, ou formes ambiguës multi-fichiers),
  l’exécution adossée à une approbation est refusée au lieu de prétendre couvrir une sémantique qu’elle n’a pas.
- Pour ces flux de travail, préférez le sandboxing, une frontière d’hôte séparée, ou un flux explicite
  de liste d’autorisation/de `full` de confiance où l’opérateur accepte la sémantique runtime plus large.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec un identifiant d’approbation. Utilisez cet identifiant pour
corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le
délai d’expiration, la demande est traitée comme un délai d’approbation expiré et remontée comme motif de refus.

### Comportement de remise de suivi

Après la fin d’une exécution asynchrone approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de remise externe valide existe (canal livrable plus cible `to`), la remise de suivi utilise ce canal.
- Dans les flux webchat uniquement ou de session interne sans cible externe, la remise de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une remise externe stricte sans canal externe résoluble, la demande échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la remise est rétrogradée en mode session uniquement au lieu d’échouer.

La boîte de dialogue de confirmation inclut :

- commande + arguments
- `cwd`
- identifiant d’agent
- chemin résolu de l’exécutable
- hôte + métadonnées de politique

Actions :

- **Allow once** → exécuter maintenant
- **Always allow** → ajouter à la liste d’autorisation + exécuter
- **Deny** → bloquer

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de chat (y compris les canaux de plugin) et les approuver
avec `/approve`. Cela utilise le pipeline de remise sortante normal.

Configuration :
__OC_I18N_900006__
Répondez dans le chat :
__OC_I18N_900007__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de plugin. Si l’identifiant ne correspond à aucune approbation d’exécution en attente, elle vérifie automatiquement les approbations de plugin à la place.

### Transfert des approbations de plugin

Le transfert des approbations de plugin utilise le même pipeline de remise que les approbations d’exécution, mais possède sa
propre configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900008__
La forme de la configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter`, et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et
de plugin. Les canaux sans interface interactive partagée reviennent à du texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de plugin provient d’une surface de chat livrable, ce même chat
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux tels que Slack, Matrix et
Microsoft Teams, en plus des flux existants de l’interface Web et de l’interface terminal.

Ce chemin partagé par commande texte utilise le modèle d’authentification normal du canal pour cette conversation. Si le
chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un
adaptateur de remise natif séparé simplement pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur
liste d’approbateurs résolue pour l’autorisation, même lorsque la remise native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement la Gateway,
cette solution de repli est volontairement limitée aux échecs de type « approbation introuvable ». Une véritable
erreur/refus d’approbation d’exécution ne réessaie pas silencieusement comme approbation de plugin.

### Remise native des approbations

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent des MP d’approbateur, un fanout vers le chat d’origine
et une expérience utilisateur d’approbation interactive propre au canal par-dessus le flux partagé `/approve` dans le même chat.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface native constitue le chemin principal
orienté agent. L’agent ne doit pas non plus répéter une commande de chat en clair
`/approve`, sauf si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que
l’approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d’exécution sur hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement une remise d’abord par MP lorsque toutes les conditions suivantes sont réunies :

- le canal prend en charge la remise d’approbation native
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicite ou des
  sources de repli documentées pour ce canal
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour le forcer
lorsque les approbateurs se résolvent. La remise publique dans le chat d’origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations par chat ?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent un routage par MP et un fanout de canal facultatif au-dessus du flux partagé
`/approve` dans le même chat et des boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et les chats livrables similaires utilisent le modèle d’authentification normal du canal
  pour `/approve` dans le même chat
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de remise native par défaut est les MP des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration propriétaire existante (`allowFrom`, plus `defaultTo` en message direct lorsque pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre les approbations de plugin
  sans deuxième couche locale de repli propre à Slack
- le routage natif par MP/canal Matrix et les raccourcis de réaction gèrent à la fois les approbations d’exécution et de plugin ;
  l’autorisation des plugins continue de provenir de `channels.matrix.dm.allowFrom`
- le demandeur n’a pas besoin d’être un approbateur
- le chat d’origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont
  directement vers les approbations de plugin, tout le reste va vers les approbations d’exécution
- les boutons d’approbation natifs Telegram suivent le même repli borné des approbations d’exécution vers les approbations de plugin que `/approve`
- lorsque `target` natif active la remise dans le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent par défaut après 30 minutes
- si aucune interface opérateur ou aucun client d’approbation configuré ne peut accepter la demande, l’invite retombe sur `askFallback`

Telegram utilise par défaut les MP des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous
voulez que les invites d’approbation apparaissent aussi dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram,
OpenClaw préserve le sujet pour l’invite d’approbation et le suivi après approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900009__
Notes de sécurité :

- Mode du socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair de même UID.
- Challenge/réponse (nonce + jeton HMAC + hachage de requête) + TTL court.

## Événements système

Le cycle de vie de l’exécution apparaît sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution en cours)
- `Exec finished`
- `Exec denied`

Ils sont publiés dans la session de l’agent après que le nœud a signalé l’événement.
Les approbations d’exécution sur l’hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions soumises à approbation réutilisent l’identifiant d’approbation comme `runId` dans ces messages pour faciliter la corrélation.

## Comportement en cas d’approbation refusée

Lorsqu’une approbation d’exécution asynchrone est refusée, OpenClaw empêche l’agent de réutiliser
la sortie d’une exécution antérieure de la même commande dans la session. Le motif du refus
est transmis avec une indication explicite qu’aucune sortie de commande n’est disponible, ce qui empêche
l’agent d’affirmer qu’il existe une nouvelle sortie ou de répéter la commande refusée avec
des résultats obsolètes issus d’une exécution réussie précédente.

## Implications

- **full** est puissant ; préférez les listes d’autorisation lorsque c’est possible.
- **ask** vous maintient dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent les approbations d’un agent de fuir vers les autres.
- Les approbations ne s’appliquent qu’aux demandes d’exécution sur hôte provenant **d’expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception.
  Pour bloquer strictement l’exécution sur hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outil.

Associé :

- [Exec tool](/fr/tools/exec)
- [Elevated mode](/fr/tools/elevated)
- [Skills](/fr/tools/skills)

## Associé

- [Exec](/fr/tools/exec) — outil d’exécution de commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — modes de bac à sable et accès à l’espace de travail
- [Security](/fr/gateway/security) — modèle de sécurité et durcissement
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — quand utiliser chacun
