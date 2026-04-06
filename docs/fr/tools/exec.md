---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge du TTY
title: Outil Exec
x-i18n:
    generated_at: "2026-04-06T03:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28388971c627292dba9bf65ae38d7af8cde49a33bb3b5fc8b20da4f0e350bedd
    source_path: tools/exec.md
    workflow: 15
---

# Outil Exec

Exécutez des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan + en arrière-plan via `process`.
Si `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions d’arrière-plan sont limitées par agent ; `process` ne voit que les sessions du même agent.

## Paramètres

- `command` (obligatoire)
- `workdir` (par défaut : cwd)
- `env` (remplacements clé/valeur)
- `yieldMs` (par défaut 10000) : passage automatique en arrière-plan après le délai
- `background` (bool) : arrière-plan immédiat
- `timeout` (secondes, par défaut 1800) : arrêt à l’expiration
- `pty` (bool) : exécution dans un pseudo-terminal quand disponible (CLI TTY-only, agents de codage, interfaces terminales)
- `host` (`auto | sandbox | gateway | node`) : emplacement d’exécution
- `security` (`deny | allowlist | full`) : mode d’application pour `gateway`/`node`
- `ask` (`off | on-miss | always`) : invites d’approbation pour `gateway`/`node`
- `node` (string) : identifiant/nom du nœud pour `host=node`
- `elevated` (bool) : demander le mode élevé (sortir du sandbox vers le chemin d’hôte configuré) ; `security=full` n’est imposé que lorsque elevated se résout en `full`

Remarques :

- `host` a pour valeur par défaut `auto` : sandbox quand le runtime sandbox est actif pour la session, sinon gateway.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne simplement » : sans sandbox, il se résout vers `gateway` ; avec un sandbox actif, il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` quand `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un nœud appairé (application compagnon ou hôte de nœud headless).
- Si plusieurs nœuds sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nœuds ; l’enveloppe héritée `nodes.run` a été supprimée.
- Sur les hôtes non Windows, exec utilise `SHELL` s’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère découvrir PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution sur l’hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements du chargeur (`LD_*`/`DYLD_*`) afin
  d’empêcher le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris pour l’exécution PTY et sandbox) afin que les règles shell/profil puissent détecter le contexte de l’outil exec.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, le `host=auto`
  implicite se résout vers `gateway`. Un `host=sandbox` explicite échoue quand même de manière sûre au lieu de
  s’exécuter silencieusement sur l’hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de
  la limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui démarre maintenant, démarrez-le une seule fois et fiez-vous au
  réveil automatique à l’achèvement lorsqu’il est activé et que la commande produit une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’émulez pas
  une planification avec des boucles sleep, des boucles timeout ou des interrogations répétées.
- Pour un travail qui doit se produire plus tard ou selon un planning, utilisez cron au lieu de
  schémas de sleep/délai avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : quand true, les sessions exec passées en arrière-plan mettent en file un événement système et demandent un heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émettre un unique avis « en cours d’exécution » lorsqu’un exec soumis à approbation dure plus longtemps que cette valeur (0 désactive).
- `tools.exec.host` (par défaut : `auto` ; se résout vers `sandbox` quand le runtime sandbox est actif, sinon vers `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node quand non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour gateway + node. Si vous voulez des approbations/un comportement d’allowlist, resserrez à la fois `tools.exec.*` et la politique d’hôte `~/.openclaw/exec-approvals.json` ; voir [Approbations Exec](/fr/tools/exec-approvals#no-approval-yolo-mode).
- Le mode YOLO vient des valeurs par défaut de la politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution hôte suit directement la politique configurée ; il n’y a pas de préfiltre heuristique supplémentaire pour l’obfuscation des commandes.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : quand true, les formes d’évaluation inline de l’interpréteur, comme `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e`, nécessitent toujours une approbation explicite. `allow-always` peut toujours rendre persistantes des invocations bénignes d’interpréteur/script, mais les formes d’évaluation inline demandent quand même une approbation à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs stdin-only pouvant s’exécuter sans entrées explicites dans l’allowlist. Pour les détails de comportement, voir [Safe bins](/fr/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemin des exécutables `safeBins`. Les entrées `PATH` ne sont jamais approuvées automatiquement. Les valeurs par défaut intégrées sont `/bin` et `/usr/bin`.
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

- `host=gateway` : fusionne le `PATH` de votre shell de connexion dans l’environnement exec. Les remplacements de `env.PATH` sont
  rejetés pour l’exécution sur l’hôte. Le daemon lui-même continue à s’exécuter avec un `PATH` minimal :
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous fournissez sont envoyés au nœud. Les remplacements de `env.PATH` sont
  rejetés pour l’exécution sur l’hôte et ignorés par les hôtes de nœud. Si vous avez besoin d’entrées PATH supplémentaires sur un nœud,
  configurez l’environnement du service hôte du nœud (systemd/launchd) ou installez les outils dans des emplacements standard.

Association de nœud par agent (utilisez l’index de la liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI : l’onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir des valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est pris en compte que pour les **expéditeurs autorisés** (allowlists/appairage de canal plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de la session** et n’écrit pas la configuration. Pour désactiver complètement exec, refusez-le via la
politique d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations d’hôte s’appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations Exec (application compagnon / hôte de nœud)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur l’hôte gateway ou node.
Voir [Approbations Exec](/fr/tools/exec-approvals) pour la politique, l’allowlist et le flux UI.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec
`status: "approval-pending"` et un identifiant d’approbation. Une fois approuvée (ou refusée / expirée),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, un unique avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit s’appuyer sur cette
UI native en priorité et n’inclure une commande `/approve` manuelle que lorsque le
résultat de l’outil indique explicitement que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est
le seul chemin possible.

## Allowlist + safe bins

L’application manuelle de l’allowlist correspond uniquement aux **chemins binaires résolus** (aucune correspondance sur le nom de base). Quand
`security=allowlist`, les commandes shell sont automatiquement autorisées uniquement si chaque segment du pipeline est
dans l’allowlist ou est un safe bin. L’enchaînement (`;`, `&&`, `||`) et les redirections sont rejetés en
mode allowlist à moins que chaque segment de premier niveau ne satisfasse l’allowlist (y compris les safe bins).
Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande enchaînée exige toujours que chaque
segment de premier niveau corresponde.

`autoAllowSkills` est un chemin pratique distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles d’allowlist par chemin. Pour une confiance explicite stricte, laissez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des rôles différents :

- `tools.exec.safeBins` : petits filtres de flux stdin-only.
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les chemins d’exécutable safe-bin.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les safe bins personnalisés.
- allowlist : confiance explicite pour les chemins d’exécutable.

Ne traitez pas `safeBins` comme une allowlist générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites dans l’allowlist et laissez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer les entrées personnalisées `safeBinProfiles` manquantes.
`openclaw security audit` et `openclaw doctor` avertissent également lorsque vous ajoutez explicitement à nouveau des binaires au comportement large comme `jq` dans `safeBins`.
Si vous autorisez explicitement des interpréteurs dans l’allowlist, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation inline du code nécessitent toujours une nouvelle approbation.

Pour les détails complets de la politique et des exemples, voir [Approbations Exec](/fr/tools/exec-approvals#safe-bins-stdin-only) et [Safe bins versus allowlist](/fr/tools/exec-approvals#safe-bins-versus-allowlist).

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

L’interrogation sert à obtenir l’état à la demande, pas à faire des boucles d’attente. Si le réveil automatique à l’achèvement
est activé, la commande peut réveiller la session lorsqu’elle produit une sortie ou échoue.

Envoyer des touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoyer CR uniquement) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (entre délimiteurs par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour des modifications structurées sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
si vous voulez le désactiver ou le limiter à des modèles spécifiques :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Remarques :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d’outil s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` a pour valeur par défaut `true` ; définissez-la sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` a pour valeur par défaut `true` (contenu dans l’espace de travail). Définissez-la sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Lié

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Background Process](/fr/gateway/background-process) — `exec` de longue durée et outil process
- [Security](/fr/gateway/security) — politique d’outil et accès élevé
