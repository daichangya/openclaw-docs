---
read_when:
    - Configuration des approbations d’exécution ou des listes d’autorisation
    - Implémentation de l’UX des approbations d’exécution dans l’application macOS
    - Examen des invites d’échappement du bac à sable et de leurs implications
summary: Approbations d’exécution, listes d’autorisation et invites d’échappement du bac à sable
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-04-06T03:14:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39e91cd5c7615bdb9a6b201a85bde7514327910f6f12da5a4b0532bceb229c22
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approbations d’exécution

Les approbations d’exécution sont le **garde-fou de l’application compagnon / de l’hôte de nœud** qui permet à un agent en bac à sable d’exécuter
des commandes sur un hôte réel (`gateway` ou `node`). Considérez cela comme un verrou de sécurité :
les commandes sont autorisées uniquement lorsque la politique + la liste d’autorisation + l’approbation utilisateur (facultative) sont toutes d’accord.
Les approbations d’exécution s’ajoutent **en plus** de la politique des outils et du contrôle elevated (sauf si elevated est défini sur `full`, ce qui ignore les approbations).
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ; si un champ d’approbation est omis, la valeur `tools.exec` est utilisée.
L’exécution sur hôte utilise aussi l’état local des approbations sur cette machine. Un
`ask: "always"` local à l’hôte dans `~/.openclaw/exec-approvals.json` continue d’afficher des invites même si
la session ou les valeurs par défaut de la configuration demandent `ask: "on-miss"`.
Utilisez `openclaw approvals get`, `openclaw approvals get --gateway`, ou
`openclaw approvals get --node <id|name|ip>` pour inspecter la politique demandée,
les sources de politique de l’hôte et le résultat effectif.

Si l’interface de l’application compagnon est **indisponible**, toute demande qui nécessite une invite est
résolue par le **fallback ask** (par défaut : deny).

Les clients d’approbation de chat natifs peuvent aussi exposer des affordances spécifiques au canal sur le
message d’approbation en attente. Par exemple, Matrix peut préremplir des raccourcis de réaction sur l’invite
d’approbation (`✅` autoriser une fois, `❌` refuser, et `♾️` toujours autoriser lorsque disponible)
tout en laissant les commandes `/approve ...` dans le message comme solution de repli.

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **hôte gateway** → processus `openclaw` sur la machine gateway
- **hôte node** → exécuteur de nœud (application compagnon macOS ou hôte de nœud sans interface)

Note sur le modèle de confiance :

- Les appelants authentifiés par Gateway sont des opérateurs de confiance pour cette Gateway.
- Les nœuds appairés étendent cette capacité d’opérateur de confiance à l’hôte du nœud.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent pas une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur l’hôte du nœud lient le contexte d’exécution canonique : `cwd` canonique, `argv` exact, liaison de l’environnement
  lorsqu’elle est présente, et chemin de l’exécutable épinglé le cas échéant.
- Pour les scripts shell et les invocations directes de fichiers via interpréteur/runtime, OpenClaw essaie aussi de lier
  un seul opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution,
  l’exécution est refusée au lieu d’exécuter un contenu modifié.
- Cette liaison de fichier est intentionnellement fournie au mieux, et non comme un modèle sémantique complet de chaque
  chemin de chargement d’interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier,
  il refuse d’émettre une exécution adossée à une approbation au lieu de prétendre offrir une couverture complète.

Découpage macOS :

- Le **service hôte du nœud** transmet `system.run` à l’**application macOS** via IPC local.
- L’**application macOS** applique les approbations + exécute la commande dans le contexte de l’interface.

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

Si vous voulez que l’exécution sur l’hôte s’effectue sans invites d’approbation, vous devez ouvrir **les deux** couches de politique :

- la politique d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`)
- la politique locale d’approbations de l’hôte dans `~/.openclaw/exec-approvals.json`

C’est désormais le comportement d’hôte par défaut, sauf si vous le durcissez explicitement :

- `tools.exec.security`: `full` sur `gateway`/`node`
- `tools.exec.ask`: `off`
- `host askFallback`: `full`

Distinction importante :

- `tools.exec.host=auto` choisit où l’exécution a lieu : bac à sable lorsqu’il est disponible, sinon gateway.
- YOLO choisit comment l’exécution sur l’hôte est approuvée : `security=full` plus `ask=off`.
- En mode YOLO, OpenClaw n’ajoute pas de contrôle d’approbation heuristique séparé pour l’obfuscation de commande au-dessus de la politique d’exécution sur l’hôte configurée.
- `auto` ne transforme pas le routage gateway en remplacement libre depuis une session en bac à sable. Une demande par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime de bac à sable n’est actif. Si vous voulez une valeur par défaut stable non auto, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche vers `allowlist` / `on-miss`
ou `deny`.

Configuration persistante « ne jamais inviter » pour l’hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Définissez ensuite le fichier d’approbations de l’hôte pour qu’il corresponde :

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

Raccourci valable pour la session uniquement :

- `/exec security=full ask=off` modifie uniquement la session en cours.
- `/elevated full` est un raccourci de secours qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique plus stricte de l’hôte l’emporte quand même.

## Réglages de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les demandes d’exécution sur l’hôte.
- **allowlist** : autorise uniquement les commandes figurant dans la liste d’autorisation.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : n’affiche jamais d’invite.
- **on-miss** : affiche une invite uniquement lorsque la liste d’autorisation ne correspond pas.
- **always** : affiche une invite pour chaque commande.
- la confiance durable `allow-always` ne supprime pas les invites lorsque le mode ask effectif est `always`

### Fallback ask (`askFallback`)

Si une invite est requise mais qu’aucune UI n’est joignable, le fallback décide :

- **deny** : bloque.
- **allowlist** : autorise uniquement si la liste d’autorisation correspond.
- **full** : autorise.

### Durcissement des évaluations inline de l’interpréteur (`tools.exec.strictInlineEval`)

Quand `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d’évaluation inline de code comme nécessitant une approbation, même si le binaire de l’interpréteur lui-même figure dans la liste d’autorisation.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s’agit d’une défense en profondeur pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un opérande de fichier stable unique. En mode strict :

- ces commandes nécessitent toujours une approbation explicite ;
- `allow-always` ne persiste pas automatiquement de nouvelles entrées de liste d’autorisation pour elles.

## Liste d’autorisation (par agent)

Les listes d’autorisation sont **par agent**. Si plusieurs agents existent, changez l’agent que vous
modifiez dans l’application macOS. Les motifs sont des **correspondances glob insensibles à la casse**.
Les motifs doivent se résoudre en **chemins de binaires** (les entrées avec uniquement le basename sont ignorées).
Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell telles que `echo ok && pwd` nécessitent toujours que chaque segment de premier niveau respecte les règles de la liste d’autorisation.

Exemples :

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste d’autorisation suit :

- **id** UUID stable utilisé pour l’identité dans l’UI (facultatif)
- **last used** horodatage
- **last used command**
- **last resolved path**

## Auto-autorisation des CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par des skills connus
sont traités comme étant dans la liste d’autorisation sur les nœuds (nœud macOS ou hôte de nœud sans interface). Cela utilise
`skills.bins` via la RPC Gateway pour récupérer la liste des binaires des skills. Désactivez cette option si vous voulez des listes d’autorisation manuelles strictes.

Notes importantes sur la confiance :

- Il s’agit d’une **liste d’autorisation implicite de confort**, distincte des entrées manuelles de liste d’autorisation par chemin.
- Elle est destinée aux environnements d’opérateurs de confiance où Gateway et le nœud se trouvent dans la même frontière de confiance.
- Si vous exigez une confiance explicite stricte, laissez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste d’autorisation par chemin.

## Safe bins (stdin uniquement)

`tools.exec.safeBins` définit une petite liste de binaires **stdin uniquement** (par exemple `cut`)
qui peuvent s’exécuter en mode allowlist **sans** entrées explicites de liste d’autorisation. Les safe bins rejettent
les arguments de fichier positionnels et les jetons ressemblant à des chemins ; ils ne peuvent donc opérer que sur le flux entrant.
Considérez cela comme un chemin rapide étroit pour les filtres de flux, et non comme une liste de confiance générale.
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`.
Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites de liste d’autorisation et gardez les invites d’approbation activées.
Les safe bins personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
La validation est déterministe à partir de la seule forme de `argv` (sans vérification de l’existence sur le système de fichiers hôte), ce qui
empêche les comportements d’oracle d’existence de fichier issus des différences allow/deny.
Les options orientées fichier sont refusées pour les safe bins par défaut (par exemple `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
Les safe bins appliquent aussi une politique explicite par binaire pour les options qui brisent le comportement
stdin uniquement (par exemple `sort -o/--output/--compress-program` et les drapeaux récursifs de grep).
Les options longues sont validées en échec fermé en mode safe-bin : les drapeaux inconnus et les
abréviations ambiguës sont rejetés.
Drapeaux refusés par profil de safe-bin :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les safe bins forcent aussi les jetons `argv` à être traités comme du **texte littéral** au moment de l’exécution (pas de globbing
et pas d’expansion de `$VARS`) pour les segments stdin uniquement ; ainsi, des motifs comme `*` ou `$HOME/...` ne peuvent pas être
utilisés pour introduire subrepticement des lectures de fichiers.
Les safe bins doivent aussi se résoudre depuis des répertoires binaires de confiance (valeurs système par défaut plus éventuels
`tools.exec.safeBinTrustedDirs`). Les entrées `PATH` ne sont jamais approuvées automatiquement.
Les répertoires par défaut de confiance pour les safe bins sont volontairement minimaux : `/bin`, `/usr/bin`.
Si votre exécutable safe-bin se trouve dans des chemins de gestionnaire de paquets/utilisateur (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement
à `tools.exec.safeBinTrustedDirs`.
Les enchaînements shell et les redirections ne sont pas autorisés automatiquement en mode allowlist.

L’enchaînement shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau satisfait la liste d’autorisation
(y compris les safe bins ou l’auto-autorisation des skills). Les redirections restent non prises en charge en mode allowlist.
La substitution de commande (`$()` / backticks) est rejetée lors de l’analyse de la liste d’autorisation, y compris à l’intérieur
des guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.
Dans les approbations de l’application compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d’expansion shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence de correspondance de liste d’autorisation sauf
si le binaire shell lui-même figure dans la liste d’autorisation.
Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les surcharges d’environnement à portée de requête sont réduites à une
petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Pour les décisions allow-always en mode allowlist, les wrappers de dispatch connus
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent les chemins des exécutables internes plutôt que les chemins
des wrappers. Les multiplexeurs shell (`busybox`, `toybox`) sont aussi déballés pour les applets shell (`sh`, `ash`,
etc.) afin que les exécutables internes soient persistés au lieu des binaires du multiplexeur. Si un wrapper ou
multiplexeur ne peut pas être déballé en toute sécurité, aucune entrée de liste d’autorisation n’est persistée automatiquement.
Si vous mettez dans la liste d’autorisation des interpréteurs comme `python3` ou `node`, préférez `tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite toujours une approbation explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les vecteurs d’évaluation inline ne sont pas persistés automatiquement.

Safe bins par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez explicitement, conservez des entrées de liste d’autorisation explicites pour
leurs workflows non stdin.
Pour `grep` en mode safe-bin, fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est
rejetée afin que les opérandes de fichier ne puissent pas être introduits comme positionnels ambigus.

### Safe bins versus liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                 |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Objectif         | Auto-autoriser des filtres stdin étroits               | Faire explicitement confiance à des exécutables précis       |
| Type de correspondance | Nom de l’exécutable + politique `argv` du safe-bin | Motif glob du chemin de l’exécutable résolu                  |
| Portée des arguments   | Restreinte par le profil safe-bin et les règles de jetons littéraux | Correspondance de chemin uniquement ; les arguments restent autrement de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées        |
| Meilleure utilisation | Transformations de texte à faible risque dans des pipelines | Tout outil au comportement plus large ou avec effets de bord |

Emplacement de la configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou par agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou par agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou par agent `agents.list[].tools.exec.safeBinProfiles`). Les clés de profil par agent remplacent les clés globales.
- les entrées de liste d’autorisation résident dans le fichier local à l’hôte `~/.openclaw/exec-approvals.json` sous `agents.<id>.allowlist` (ou via la Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer les entrées personnalisées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (revoyez-les puis resserrez-les ensuite). Les binaires d’interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900004__
Si vous choisissez explicitement d’ajouter `jq` à `safeBins`, OpenClaw rejette quand même la builtin `env` en mode safe-bin
afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin de liste d’autorisation explicite
ou invite d’approbation.

## Édition dans la Control UI

Utilisez la fiche **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les
remplacements par agent et les listes d’autorisation. Choisissez une portée (Defaults ou un agent), ajustez la politique,
ajoutez/supprimez des motifs de liste d’autorisation, puis cliquez sur **Save**. L’UI affiche les métadonnées **last used**
par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nœuds
doivent annoncer `system.execApprovals.get/set` (application macOS ou hôte de nœud sans interface).
Si un nœud n’annonce pas encore les approbations d’exécution, modifiez directement son fichier local
`~/.openclaw/exec-approvals.json`.

CLI : `openclaw approvals` prend en charge l’édition pour gateway ou nœud (voir [CLI des approbations](/cli/approvals)).

## Flux d’approbation

Lorsqu’une invite est requise, la gateway diffuse `exec.approval.requested` aux clients opérateurs.
La Control UI et l’application macOS la résolvent via `exec.approval.resolve`, puis la gateway transmet la
demande approuvée à l’hôte du nœud.

Pour `host=node`, les demandes d’approbation incluent une charge utile canonique `systemRunPlan`. La gateway utilise
ce plan comme contexte autoritatif de commande/cwd/session lors de la transmission des demandes `system.run`
approuvées.

Cela est important pour la latence d’approbation asynchrone :

- le chemin d’exécution du nœud prépare un plan canonique en amont
- l’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvé, l’appel `system.run` final transmis réutilise le plan stocké
  au lieu de faire confiance à des modifications ultérieures de l’appelant
- si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId`, ou
  `sessionKey` après la création de la demande d’approbation, la gateway rejette l’exécution
  transmise comme non conforme à l’approbation

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime adossées à une approbation sont volontairement prudentes :

- Le contexte exact `argv`/`cwd`/`env` est toujours lié.
- Les formes directes de script shell et de fichier runtime direct sont liées au mieux à un instantané concret de fichier local.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent quand même en un seul fichier local direct (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un seul fichier local concret pour une commande d’interpréteur/runtime
  (par exemple scripts de paquet, formes eval, chaînes de chargeur spécifiques au runtime, ou formes ambiguës à plusieurs fichiers),
  l’exécution adossée à l’approbation est refusée au lieu de revendiquer une couverture sémantique qu’elle n’a pas.
- Pour ces workflows, préférez le bac à sable, une frontière d’hôte distincte, ou un workflow explicite de
  confiance via allowlist/full où l’opérateur accepte la sémantique plus large du runtime.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec un identifiant d’approbation. Utilisez cet identifiant pour
corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le
délai d’expiration, la demande est traitée comme un délai d’approbation dépassé et signalée comme motif de refus.

### Comportement de livraison des suivis

Après la fin d’une exécution asynchrone approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison du suivi utilise ce canal.
- Dans les flux webchat uniquement ou de session interne sans cible externe, la livraison du suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la demande échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée à la session uniquement au lieu d’échouer.

La boîte de dialogue de confirmation comprend :

- commande + arguments
- cwd
- identifiant d’agent
- chemin d’exécutable résolu
- métadonnées d’hôte + de politique

Actions :

- **Allow once** → exécuter maintenant
- **Always allow** → ajouter à la liste d’autorisation + exécuter
- **Deny** → bloquer

## Transmission des approbations vers les canaux de chat

Vous pouvez transmettre les invites d’approbation d’exécution à n’importe quel canal de chat (y compris les canaux de plugin) et les approuver
avec `/approve`. Cela utilise le pipeline de livraison sortant normal.

Configuration :
__OC_I18N_900005__
Répondez dans le chat :
__OC_I18N_900006__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de plugin. Si l’ID ne correspond pas à une approbation d’exécution en attente, elle vérifie automatiquement les approbations de plugin à la place.

### Transmission des approbations de plugin

La transmission des approbations de plugin utilise le même pipeline de livraison que les approbations d’exécution, mais dispose de sa
propre configuration indépendante sous `approvals.plugin`. L’activation ou la désactivation de l’une n’affecte pas l’autre.
__OC_I18N_900007__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter`, et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et de
plugin. Les canaux sans UI interactive partagée reviennent à du texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de plugin provient d’une surface de chat livrable, ce même chat
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux tels que Slack, Matrix et
Microsoft Teams en plus des flux existants de l’UI Web et de l’UI terminal.

Ce chemin partagé par commande texte utilise le modèle d’authentification normal du canal pour cette conversation. Si le
chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un
adaptateur de livraison natif distinct simplement pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur
liste résolue d’approbateurs pour l’autorisation même lorsque la livraison native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement la Gateway,
ce fallback est intentionnellement limité aux échecs « approval not found ». Une véritable
erreur/refus d’approbation d’exécution ne réessaie pas silencieusement comme approbation de plugin.

### Livraison native des approbations

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent des DM aux approbateurs, une diffusion vers le chat d’origine
et une UX d’approbation interactive spécifique au canal par-dessus le flux partagé `/approve` dans le même chat.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette UI native est le chemin principal
côté agent. L’agent ne doit pas également renvoyer en écho une commande de chat simple
`/approve` en double, sauf si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que
l’approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d’exécution sur l’hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle la transmission des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement la livraison DM-first lorsque toutes les conditions suivantes sont vraies :

- le canal prend en charge la livraison native des approbations
- les approbateurs peuvent être résolus depuis `execApprovals.approvers` explicite ou depuis les
  sources de fallback documentées pour ce canal
- `channels.<channel>.execApprovals.enabled` est non défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour
le forcer lorsqu’il y a résolution d’approbateurs. La livraison publique vers le chat d’origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations de chat ?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent un routage DM et une diffusion facultative vers le canal par-dessus le flux partagé
`/approve` dans le même chat et les boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et autres chats livrables utilisent le modèle d’authentification normal du canal
  pour `/approve` dans le même chat
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est les DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration propriétaire existante (`allowFrom`, plus `defaultTo` en message direct lorsque pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d’identifiant d’approbation, de sorte que les ID `plugin:` peuvent résoudre les approbations de plugin
  sans seconde couche de fallback locale propre à Slack
- le routage natif DM/canal de Matrix est réservé à l’exécution ; les approbations de plugin Matrix restent sur le chemin partagé
  `/approve` dans le même chat et les chemins facultatifs de transmission `approvals.plugin`
- le demandeur n’a pas besoin d’être un approbateur
- le chat d’origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type d’identifiant d’approbation : les ID `plugin:` vont
  directement aux approbations de plugin, tout le reste va aux approbations d’exécution
- les boutons d’approbation natifs Telegram suivent le même fallback limité exec-vers-plugin que `/approve`
- lorsque `target` natif active la livraison vers le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent après 30 minutes par défaut
- si aucune UI opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite revient à `askFallback`

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` si vous
voulez que les invites d’approbation apparaissent aussi dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram,
OpenClaw préserve le sujet pour l’invite d’approbation et pour le suivi après approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900008__
Notes de sécurité :

- Mode du socket Unix `0600`, token stocké dans `exec-approvals.json`.
- Vérification des pairs avec le même UID.
- Challenge/réponse (nonce + token HMAC + hachage de requête) + TTL court.

## Événements système

Le cycle de vie de l’exécution est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution en cours)
- `Exec finished`
- `Exec denied`

Ils sont publiés dans la session de l’agent après que le nœud a signalé l’événement.
Les approbations d’exécution sur l’hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions contrôlées par approbation réutilisent l’identifiant d’approbation comme `runId` dans ces messages pour faciliter la corrélation.

## Comportement en cas de refus d’approbation

Lorsqu’une approbation d’exécution asynchrone est refusée, OpenClaw empêche l’agent de réutiliser
la sortie de toute exécution antérieure de la même commande dans la session. Le motif du refus
est transmis avec une instruction explicite indiquant qu’aucune sortie de commande n’est disponible, ce qui empêche
l’agent d’affirmer qu’il existe une nouvelle sortie ou de répéter la commande refusée avec
des résultats obsolètes issus d’une exécution précédente réussie.

## Implications

- **full** est puissant ; préférez les listes d’autorisation quand c’est possible.
- **ask** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes d’autorisation par agent empêchent qu’une approbation d’un agent se propage aux autres.
- Les approbations ne s’appliquent qu’aux demandes d’exécution sur l’hôte provenant d’**expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau de la session pour les opérateurs autorisés et ignore les approbations par conception.
  Pour bloquer complètement l’exécution sur l’hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique des outils.

Lié :

- [Outil Exec](/fr/tools/exec)
- [Mode elevated](/fr/tools/elevated)
- [Skills](/fr/tools/skills)

## Lié

- [Exec](/fr/tools/exec) — outil d’exécution de commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — modes de bac à sable et accès à l’espace de travail
- [Security](/fr/gateway/security) — modèle de sécurité et durcissement
- [Sandbox vs Tool Policy vs Elevated](/fr/gateway/sandbox-vs-tool-policy-vs-elevated) — quand utiliser chacun
