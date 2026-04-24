---
read_when:
    - utilisation ou modification de l’outil Exec
    - débogage du comportement stdin ou TTY
summary: utilisation de l’outil Exec, modes stdin et prise en charge TTY
title: outil Exec
x-i18n:
    generated_at: "2026-04-24T07:36:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cad17fecfaf7d6a523282ef4f0090e4ffaab89ab53945b5cd831e426f3fc3ac
    source_path: tools/exec.md
    workflow: 15
---

Exécutez des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan + en arrière-plan via `process`.
Si `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions d’arrière-plan sont limitées par agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail pour la commande.
</ParamField>

<ParamField path="env" type="object">
Redéfinitions d’environnement clé/valeur fusionnées au-dessus de l’environnement hérité.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Place automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Place immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Tue la commande après ce nombre de secondes.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsque disponible. À utiliser pour les CLI nécessitant un TTY, les agents de codage et les interfaces terminales.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime sandbox est actif et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode d’application pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de demande d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/nom du nœud lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode Elevated — sort du sandbox vers le chemin hôte configuré. `security=full` n’est forcé que lorsque Elevated se résout en `full`.
</ParamField>

Remarques :

- `host` vaut par défaut `auto` : sandbox lorsqu’un runtime sandbox est actif pour la session, sinon gateway.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne tout simplement » : sans sandbox, il se résout en `gateway` ; avec un sandbox actif, il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de session est `host=node`). Il n’est disponible que lorsque l’accès Elevated est activé pour la session/le fournisseur courant.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` exige un nœud associé (app compagnon ou hôte de nœud headless).
- Si plusieurs nœuds sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nœuds ; l’ancien wrapper `nodes.run` a été supprimé.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` est `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère PowerShell 7 (`pwsh`) détecté (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution hôte (`gateway`/`node`) rejette `env.PATH` et les redéfinitions de chargeur (`LD_*`/`DYLD_*`) pour
  éviter le détournement de binaire ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris PTY et exécution sandbox) afin que les règles shell/profil puissent détecter le contexte exec-tool.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, `host=auto`
  implicite se résout en `gateway`. `host=sandbox` explicite échoue quand même de manière stricte au lieu de s’exécuter silencieusement
  sur l’hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables de scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  frontière effective `workdir`. Si un chemin de script se résout en dehors de `workdir`, la prévalidation est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui commence maintenant, démarrez-le une fois et comptez sur le
  réveil automatique à l’achèvement lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’imitez pas
  une planification avec des boucles sleep, des boucles de délai d’expiration ou des sondages répétés.
- Pour un travail qui doit se produire plus tard ou selon un planning, utilisez Cron au lieu de
  motifs sleep/delay avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan mettent en file un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet une seule notification « running » lorsqu’un exec protégé par approbation dure plus longtemps que cela (0 désactive).
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime sandbox est actif, sinon `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node si non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour gateway + node. Si vous voulez un comportement d’approbation/de liste d’autorisation, resserrez à la fois `tools.exec.*` et le fichier hôte `~/.openclaw/exec-approvals.json` ; voir [Approbations Exec](/fr/tools/exec-approvals#no-approval-yolo-mode).
- Le mode YOLO vient des valeurs par défaut de politique hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution hôte suit directement la politique configurée ; il n’existe pas de couche supplémentaire de préfiltrage heuristique d’obfuscation de commande ni de couche de rejet de prévalidation de script.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes inline d’évaluation d’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, et `osascript -e` exigent toujours une approbation explicite. `allow-always` peut toujours persister les invocations bénignes d’interpréteur/script, mais les formes inline-eval demandent quand même une approbation à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs stdin-only pouvant s’exécuter sans entrées explicites de liste d’autorisation. Pour les détails de comportement, voir [Safe bins](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires de confiance pour les vérifications de chemin des exécutables safeBins. Les entrées `PATH` ne sont jamais automatiquement dignes de confiance. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
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

- `host=gateway` : fusionne le `PATH` de votre shell de connexion dans l’environnement exec. Les redéfinitions
  `env.PATH` sont rejetées pour l’exécution hôte. Le démon lui-même continue de s’exécuter avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le sourcing du profil via une variable d’environnement interne (pas d’interpolation shell) ;
  `tools.exec.pathPrepend` s’applique aussi ici.
- `host=node` : seules les redéfinitions d’environnement non bloquées que vous passez sont envoyées au nœud. Les redéfinitions
  `env.PATH` sont rejetées pour l’exécution hôte et ignorées par les hôtes de nœud. Si vous avez besoin d’entrées PATH supplémentaires sur un nœud,
  configurez l’environnement de service de l’hôte du nœud (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison de nœud par agent (utilisez l’index de liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI : l’onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Redéfinitions de session (`/exec`)

Utilisez `/exec` pour définir des valeurs par défaut **par session** pour `host`, `security`, `ask`, et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs courantes.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est pris en compte que pour les **expéditeurs autorisés** (listes d’autorisation de canal/association plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas dans la configuration. Pour désactiver définitivement exec, refusez-le via la
politique d’outils (`tools.deny: ["exec"]` ou par agent). Les approbations hôte continuent de s’appliquer sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations Exec (app compagnon / hôte de nœud)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur la gateway ou l’hôte de nœud.
Voir [Approbations Exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux UI.

Lorsque des approbations sont requises, l’outil exec revient immédiatement avec
`status: "approval-pending"` et un id d’approbation. Une fois approuvé (ou refusé / expiré),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, une seule notification `Exec running` est émise.
Sur les canaux avec cartes/boutons d’approbation natives, l’agent doit s’appuyer d’abord sur cette
interface native et n’inclure une commande manuelle `/approve` que lorsque le
résultat de l’outil indique explicitement que les approbations par chat sont indisponibles ou que l’approbation manuelle est la
seule voie.

## Liste d’autorisation + safe bins

L’application manuelle de la liste d’autorisation compare **uniquement les chemins binaires résolus** (pas de correspondance par nom de base). Lorsque
`security=allowlist`, les commandes shell ne sont automatiquement autorisées que si chaque segment du pipeline est
dans la liste d’autorisation ou est un safe bin. Les chaînages (`;`, `&&`, `||`) et redirections sont rejetés en
mode liste d’autorisation à moins que chaque segment de niveau supérieur ne satisfasse à la liste d’autorisation (y compris les safe bins).
Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Ce n’est pas la même chose que
des entrées de liste d’autorisation manuelles de chemin. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des rôles différents :

- `tools.exec.safeBins` : petits filtres de flux stdin-only.
- `tools.exec.safeBinTrustedDirs` : répertoires de confiance explicites supplémentaires pour les chemins exécutables safe-bin.
- `tools.exec.safeBinProfiles` : politique argv explicite pour des safe bins personnalisés.
- liste d’autorisation : confiance explicite pour les chemins exécutables.

Ne traitez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer des entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous ajoutez explicitement des binaires à comportement large tels que `jq` dans `safeBins`.
Si vous ajoutez explicitement des interpréteurs à la liste d’autorisation, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code inline exigent toujours une nouvelle approbation.

Pour tous les détails de politique et des exemples, voir [Approbations Exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Safe bins versus allowlist](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

L’interrogation sert à obtenir un état à la demande, pas à faire des boucles d’attente. Si le réveil automatique à l’achèvement
est activé, la commande peut réveiller la session lorsqu’elle émet une sortie ou échoue.

Envoi de touches (style tmux) :

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

`apply_patch` est un sous-outil de `exec` pour des modifications structurées sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
lorsque vous souhaitez le désactiver ou le restreindre à certains modèles :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Remarques :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d’outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut par défaut `true` ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut par défaut `true` (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Liens associés

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Processus d’arrière-plan](/fr/gateway/background-process) — exec longue durée et outil process
- [Sécurité](/fr/gateway/security) — politique d’outils et accès Elevated
