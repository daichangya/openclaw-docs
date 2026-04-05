---
read_when:
    - Vous utilisez ou modifiez l'outil exec
    - Vous déboguez le comportement stdin ou TTY
summary: Utilisation de l'outil Exec, modes stdin et prise en charge TTY
title: Outil Exec
x-i18n:
    generated_at: "2026-04-05T12:56:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b73e9900c109910fc4e178c888b7ad7f3a4eeaa34eb44bc816abba9af5d664d7
    source_path: tools/exec.md
    workflow: 15
---

# Outil Exec

Exécute des commandes shell dans le workspace. Prend en charge l'exécution au premier plan et en arrière-plan via `process`.
Si `process` n'est pas autorisé, `exec` s'exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

- `command` (obligatoire)
- `workdir` (par défaut : cwd)
- `env` (remplacements clé/valeur)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après ce délai
- `background` (bool) : exécuter immédiatement en arrière-plan
- `timeout` (secondes, par défaut 1800) : arrêter à l'expiration
- `pty` (bool) : exécuter dans un pseudo-terminal lorsque disponible (CLI TTY uniquement, agents de codage, interfaces terminal)
- `host` (`auto | sandbox | gateway | node`) : où exécuter
- `security` (`deny | allowlist | full`) : mode d'application pour `gateway`/`node`
- `ask` (`off | on-miss | always`) : demandes d'approbation pour `gateway`/`node`
- `node` (string) : id/nom du nœud pour `host=node`
- `elevated` (bool) : demander le mode élevé (sortir du sandbox vers le chemin d'hôte configuré) ; `security=full` n'est forcé que lorsque elevated se résout en `full`

Notes :

- `host` a pour valeur par défaut `auto` : sandbox quand le runtime sandbox est actif pour la session, sinon gateway.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n'est autorisé que lorsqu'aucun runtime sandbox n'est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne simplement » : sans sandbox, il se résout en `gateway` ; avec un sandbox actif, il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin d'hôte configuré : `gateway` par défaut, ou `node` quand `tools.exec.host=node` (ou que la session a `host=node` par défaut). Il n'est disponible que lorsque l'accès élevé est activé pour la session/le fournisseur en cours.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un nœud appairé (application compagnon ou hôte de nœud headless).
- Si plusieurs nœuds sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d'exécution shell pour les nœuds ; l'enveloppe héritée `nodes.run` a été supprimée.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu'il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n'existe.
- Sur les hôtes Windows, exec préfère découvrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L'exécution sur hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin de
  prévenir le détournement de binaire ou l'injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l'environnement de la commande lancée (y compris PTY et exécution en sandbox) afin que les règles shell/profil puissent détecter le contexte de l'outil exec.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, `host=auto`
  implicite se résout en `gateway`. Un `host=sandbox` explicite échoue tout de même de manière fermée au lieu de s'exécuter silencieusement
  sur l'hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables de script (pour les erreurs courantes de syntaxe shell Python/Node) n'inspectent que les fichiers à l'intérieur de la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui démarre maintenant, lancez-le une seule fois et fiez-vous au
  réveil automatique à la fin lorsqu'il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l'état, l'entrée ou l'intervention ; n'émulez pas
  la planification avec des boucles `sleep`, des boucles de timeout ou des interrogations répétées.
- Pour un travail qui doit se produire plus tard ou selon un planning, utilisez cron plutôt que
  des motifs `sleep`/délai avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque cette option est vraie, les sessions exec passées en arrière-plan mettent en file un événement système et demandent un heartbeat à la fin.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un unique avis « en cours d'exécution » lorsqu'un exec soumis à approbation dure plus longtemps que cela (0 désactive).
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` quand le runtime sandbox est actif, sinon en `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node si non défini)
- `tools.exec.ask` (par défaut : `off`)
- L'exécution hôte sans approbation est le comportement par défaut pour gateway + node. Si vous souhaitez un comportement avec approbations/liste d'autorisation, resserrez à la fois `tools.exec.*` et la politique hôte `~/.openclaw/exec-approvals.json` ; voir [Approbations Exec](/tools/exec-approvals#no-approval-yolo-mode).
- Le mode YOLO provient des politiques hôte par défaut (`security=full`, `ask=off`), pas de `host=auto`. Si vous souhaitez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque cette option est vraie, les formes d'évaluation inline d'interpréteurs telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` exigent toujours une approbation explicite. `allow-always` peut toujours conserver des invocations bénignes d'interpréteurs/scripts, mais les formes d'évaluation inline demandent quand même une approbation à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs stdin-only pouvant s'exécuter sans entrées explicites dans la liste d'autorisation. Pour le détail du comportement, voir [Safe bins](/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemin d'exécutable `safeBins`. Les entrées `PATH` ne sont jamais approuvées automatiquement. Les valeurs par défaut intégrées sont `/bin` et `/usr/bin`.
- `tools.exec.safeBinProfiles` : politique argv personnalisée facultative par safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemple :

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Gestion de PATH

- `host=gateway` : fusionne votre `PATH` de shell de connexion dans l'environnement exec. Les remplacements `env.PATH` sont
  rejetés pour l'exécution sur hôte. Le démon lui-même continue cependant à s'exécuter avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d'environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s'applique aussi ici.
- `host=node` : seuls les remplacements d'environnement non bloqués que vous transmettez sont envoyés au nœud. Les remplacements `env.PATH` sont
  rejetés pour l'exécution sur hôte et ignorés par les hôtes de nœud. Si vous avez besoin d'entrées PATH supplémentaires sur un nœud,
  configurez l'environnement de service de l'hôte de nœud (systemd/launchd) ou installez les outils dans des emplacements standard.

Association de nœud par agent (utilisez l'index de la liste d'agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI Control : l'onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir des valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d'autorisation

`/exec` n'est pris en compte que pour les **expéditeurs autorisés** (listes d'autorisation/appairage de canal plus `commands.useAccessGroups`).
Il ne met à jour que **l'état de la session** et n'écrit pas dans la configuration. Pour désactiver complètement exec, refusez-le via la
politique d'outil (`tools.deny: ["exec"]` ou par agent). Les approbations hôte s'appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations Exec (application compagnon / hôte de nœud)

Les agents sandboxés peuvent nécessiter une approbation par requête avant qu'`exec` ne s'exécute sur la gateway ou l'hôte de nœud.
Voir [Approbations Exec](/tools/exec-approvals) pour la politique, la liste d'autorisation et le flux UI.

Lorsque des approbations sont requises, l'outil exec revient immédiatement avec
`status: "approval-pending"` et un id d'approbation. Une fois approuvé (ou refusé / expiré),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d'exécution après `tools.exec.approvalRunningNoticeMs`, un unique avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d'approbation natifs, l'agent doit s'appuyer sur cette
UI native en priorité et n'inclure une commande manuelle `/approve` que lorsque le résultat
de l'outil indique explicitement que les approbations dans le chat ne sont pas disponibles ou que l'approbation manuelle est le
seul chemin.

## Allowlist + safe bins

L'application manuelle de la liste d'autorisation ne correspond qu'aux **chemins binaires résolus** (pas de correspondance par nom de base). Lorsque
`security=allowlist`, les commandes shell ne sont automatiquement autorisées que si chaque segment de pipeline est
dans la liste d'autorisation ou est un safe bin. Les enchaînements (`;`, `&&`, `||`) et les redirections sont rejetés en
mode allowlist sauf si chaque segment de niveau supérieur satisfait la liste d'autorisation (y compris les safe bins).
Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Ce n'est pas la même chose que
les entrées manuelles de liste d'autorisation par chemin. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez ces deux contrôles pour des rôles différents :

- `tools.exec.safeBins` : petits filtres de flux stdin-only.
- `tools.exec.safeBinTrustedDirs` : répertoires approuvés explicites supplémentaires pour les chemins d'exécutable safe bin.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les safe bins personnalisés.
- allowlist : confiance explicite pour les chemins d'exécutable.

Ne traitez pas `safeBins` comme une liste d'autorisation générique, et n'ajoutez pas de binaires d'interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d'autorisation et gardez les demandes d'approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d'interpréteur/runtime n'ont pas de profils explicites, et `openclaw doctor --fix` peut générer les entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous ajoutez explicitement à nouveau des binaires à comportement large comme `jq` dans `safeBins`.
Si vous autorisez explicitement des interpréteurs, activez `tools.exec.strictInlineEval` pour que les formes d'évaluation de code inline exigent toujours une nouvelle approbation.

Pour les détails complets de la politique et des exemples, voir [Approbations Exec](/tools/exec-approvals#safe-bins-stdin-only) et [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist).

## Exemples

Premier plan :

```json
{ "tool": "exec", "command": "ls -la" }
```

Arrière-plan + interrogation :

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

L'interrogation sert à obtenir un état à la demande, pas à faire des boucles d'attente. Si le réveil automatique à la fin
est activé, la commande peut réveiller la session lorsqu'elle émet une sortie ou échoue.

Envoyer des touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoyer seulement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (encadré par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées de plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration seulement
si vous souhaitez le désactiver ou le restreindre à des modèles spécifiques :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Notes :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d'outil s'applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-la sur `false` pour désactiver l'outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (limité au workspace). Ne définissez cette option sur `false` que si vous voulez intentionnellement qu'`apply_patch` écrive/supprime en dehors du répertoire workspace.

## Lié

- [Approbations Exec](/tools/exec-approvals) — barrières d'approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Background Process](/fr/gateway/background-process) — outil exec de longue durée et outil process
- [Security](/fr/gateway/security) — politique d'outil et accès élevé
