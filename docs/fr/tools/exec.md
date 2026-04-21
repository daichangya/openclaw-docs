---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement stdin ou TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge du TTY
title: Outil exec
x-i18n:
    generated_at: "2026-04-21T07:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Outil exec

Exécute des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan + en arrière-plan via `process`.
Si `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont délimitées par agent ; `process` ne voit que les sessions du même agent.

## Paramètres

- `command` (obligatoire)
- `workdir` (par défaut : cwd)
- `env` (remplacements clé/valeur)
- `yieldMs` (par défaut 10000) : bascule automatique en arrière-plan après délai
- `background` (bool) : arrière-plan immédiat
- `timeout` (secondes, par défaut 1800) : interruption à expiration
- `pty` (bool) : exécuter dans un pseudo-terminal lorsque disponible (CLI TTY-only, agents de code, interfaces terminales)
- `host` (`auto | sandbox | gateway | node`) : emplacement d’exécution
- `security` (`deny | allowlist | full`) : mode d’application pour `gateway`/`node`
- `ask` (`off | on-miss | always`) : invites d’approbation pour `gateway`/`node`
- `node` (string) : ID/nom de nœud pour `host=node`
- `elevated` (bool) : demander le mode élevé (sortir du sandbox vers le chemin hôte configuré) ; `security=full` n’est forcé que lorsque elevated se résout à `full`

Remarques :

- `host` est par défaut à `auto` : sandbox lorsque le runtime sandbox est actif pour la session, sinon gateway.
- `auto` est la stratégie de routage par défaut, pas un joker. Un appel individuel `host=node` est autorisé depuis `auto` ; un appel individuel `host=gateway` n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne simplement » : sans sandbox, il se résout vers `gateway` ; avec un sandbox actif, il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le provider actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un nœud appairé (app compagnon ou hôte de nœud headless).
- Si plusieurs nœuds sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nœuds ; l’ancien wrapper `nodes.run` a été supprimé.
- Sur les hôtes non Windows, exec utilise `SHELL` s’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère détecter PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin de
  prévenir le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris pour l’exécution PTY et sandbox), afin que les règles shell/profil puissent détecter le contexte de l’outil exec.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, le `host=auto`
  implicite se résout vers `gateway`. Un `host=sandbox` explicite échoue toujours en mode fermé au lieu de
  s’exécuter silencieusement sur l’hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  frontière effective `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui commence maintenant, démarrez-le une seule fois et appuyez-vous sur le
  réveil automatique à la fin lorsqu’il est activé et que la commande produit une sortie ou échoue.
  Utilisez `process` pour les logs, l’état, l’entrée ou l’intervention ; n’émulez pas
  la planification avec des boucles sleep, des boucles timeout ou des sondages répétés.
- Pour un travail qui doit se produire plus tard ou selon un planning, utilisez Cron au lieu de
  motifs sleep/delay avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec envoyées en arrière-plan mettent en file un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un unique avis « running » lorsqu’un exec soumis à approbation dure plus longtemps que cette valeur (0 désactive).
- `tools.exec.host` (par défaut : `auto` ; se résout vers `sandbox` lorsque le runtime sandbox est actif, sinon `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node lorsqu’il n’est pas défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour gateway + node. Si vous voulez un comportement d’approbation/de liste d’autorisation, resserrez à la fois `tools.exec.*` et la politique hôte `~/.openclaw/exec-approvals.json` ; voir [Exec approvals](/fr/tools/exec-approvals#no-approval-yolo-mode).
- Le mode YOLO vient des valeurs par défaut de la politique hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution hôte suit directement la politique configurée ; il n’y a pas de couche heuristique supplémentaire de préfiltrage d’obfuscation des commandes ni de rejet de vérification préalable des scripts.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline de l’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` exigent toujours une approbation explicite. `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les formes inline-eval demandent quand même une invite à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs stdin-only pouvant s’exécuter sans entrées explicites de liste d’autorisation. Pour le détail du comportement, voir [Safe bins](/fr/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires de confiance pour les vérifications de chemin exécutable `safeBins`. Les entrées `PATH` ne sont jamais automatiquement de confiance. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
- `tools.exec.safeBinProfiles` : politique argv personnalisée facultative par safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemple :

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

- `host=gateway` : fusionne le `PATH` de votre shell de connexion dans l’environnement exec. Les remplacements `env.PATH`
  sont rejetés pour l’exécution hôte. Le daemon lui-même continue toutefois de s’exécuter avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique aussi ici.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au nœud. Les remplacements `env.PATH` sont
  rejetés pour l’exécution hôte et ignorés par les hôtes de nœud. Si vous avez besoin d’entrées PATH supplémentaires sur un nœud,
  configurez l’environnement du service hôte du nœud (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison de nœud par agent (utilisez l’index de la liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI : l’onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir des valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans arguments pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est pris en compte que pour les **expéditeurs autorisés** (listes d’autorisation/appairage du canal plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas dans la configuration. Pour désactiver totalement exec, refusez-le via la
politique d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations hôte s’appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Exec approvals (app compagnon / hôte de nœud)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur l’hôte gateway ou node.
Voir [Exec approvals](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec
`status: "approval-pending"` et un ID d’approbation. Une fois approuvé (ou refusé / expiré),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, un unique avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit s’appuyer en priorité sur
cette interface native et n’inclure une commande manuelle `/approve` que lorsque le
résultat de l’outil indique explicitement que les approbations dans le chat ne sont pas disponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + safe bins

L’application manuelle de la liste d’autorisation ne correspond qu’aux **chemins binaires résolus** (pas aux correspondances par nom de base). Lorsque
`security=allowlist`, les commandes shell ne sont autorisées automatiquement que si chaque segment du pipeline est
dans la liste d’autorisation ou correspond à un safe bin. L’enchaînement (`;`, `&&`, `||`) et les redirections sont rejetés en
mode liste d’autorisation sauf si chaque segment de niveau supérieur respecte la liste d’autorisation (y compris les safe bins).
Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans exec approvals. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation par chemin. Pour une confiance explicite stricte, laissez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux stdin-only.
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires de confiance pour les chemins exécutables des safe bins.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les safe bins personnalisés.
- liste d’autorisation : confiance explicite pour les chemins exécutables.

Ne considérez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et laissez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer les entrées personnalisées `safeBinProfiles` manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous réajoutez explicitement dans `safeBins` des binaires au comportement large comme `jq`.
Si vous autorisez explicitement des interpréteurs, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation inline du code exigent toujours une nouvelle approbation.

Pour le détail complet de la politique et des exemples, voir [Exec approvals](/fr/tools/exec-approvals#safe-bins-stdin-only) et [Safe bins versus allowlist](/fr/tools/exec-approvals#safe-bins-versus-allowlist).

## Exemples

Premier plan :

```json
{ "tool": "exec", "command": "ls -la" }
```

Arrière-plan + sondage :

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Le sondage sert à obtenir l’état à la demande, pas à faire des boucles d’attente. Si le réveil automatique à la fin
est activé, la commande peut réveiller la session lorsqu’elle produit une sortie ou échoue.

Envoi de touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoi de CR uniquement) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (encadré par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
si vous voulez le désactiver ou le restreindre à certains modèles :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Remarques :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d’outil s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-la à `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-la à `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire d’espace de travail.

## Liens associés

- [Exec Approvals](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Background Process](/fr/gateway/background-process) — exec longue durée et outil process
- [Security](/fr/gateway/security) — politique d’outil et accès élevé
