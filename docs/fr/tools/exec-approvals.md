---
read_when:
    - |-
      Configurer des approbations d’exécution ou des listes blanches【อ่านข้อความเต็มanalysis to=functions.bash  კომენტary 公众号天天中彩票json
      {"command":"true"}
    - Implémenter l’UX d’approbation d’exécution dans l’application macOS
    - Examiner les invites d’échappement du sandbox et leurs implications
summary: Approbations d’exécution, listes blanches et invites d’échappement du sandbox
title: Approbations d’exécution
x-i18n:
    generated_at: "2026-04-24T07:36:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7c5cd24e7c1831d5a865da6fa20f4c23280a0ec12b9e8f7f3245170a05a37d
    source_path: tools/exec-approvals.md
    workflow: 15
---

Les approbations d’exécution sont le **garde-fou de l’application compagnon / de l’hôte node** pour permettre à un agent
sandboxé d’exécuter des commandes sur un véritable hôte (`gateway` ou `node`). Un
interverrouillage de sécurité : les commandes ne sont autorisées que lorsque la politique + la liste blanche + l’approbation (facultative) de l’utilisateur sont toutes d’accord. Les approbations d’exécution s’empilent **au-dessus** de la politique d’outil et du filtrage Elevated (sauf si Elevated est défini sur `full`, ce qui ignore les approbations).

<Note>
La politique effective est la **plus stricte** entre `tools.exec.*` et les valeurs par défaut des approbations ;
si un champ d’approbation est omis, la valeur `tools.exec` est utilisée. L’exécution sur l’hôte
utilise aussi l’état local d’approbation sur cette machine — un `ask: "always"` local
dans `~/.openclaw/exec-approvals.json` continue à demander une confirmation même si la session ou la
configuration demande par défaut `ask: "on-miss"`.
</Note>

## Inspection de la politique effective

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — affichent la politique demandée, les sources de politique de l’hôte, et le résultat effectif.
- `openclaw exec-policy show` — vue fusionnée sur la machine locale.
- `openclaw exec-policy set|preset` — synchronise en une étape la politique demandée locale avec le fichier d’approbations local de l’hôte.

Lorsqu’un périmètre local demande `host=node`, `exec-policy show` signale ce périmètre
comme géré par le node à l’exécution au lieu de prétendre que le fichier d’approbations local est
la source de vérité.

Si l’interface de l’application compagnon n’est **pas disponible**, toute requête qui demanderait normalement une confirmation est résolue par le **repli ask** (par défaut : deny).

<Tip>
Les clients natifs d’approbation par chat peuvent initialiser des affordances spécifiques au canal sur le
message d’approbation en attente. Par exemple, Matrix initialise des raccourcis de réaction (`✅`
autoriser une fois, `❌` refuser, `♾️` autoriser toujours) tout en laissant les commandes
`/approve ...` dans le message comme repli.
</Tip>

## Où cela s’applique

Les approbations d’exécution sont appliquées localement sur l’hôte d’exécution :

- **hôte gateway** → processus `openclaw` sur la machine gateway
- **hôte node** → exécuteur node (application compagnon macOS ou hôte node headless)

Remarque sur le modèle de confiance :

- Les appelants authentifiés par le Gateway sont des opérateurs de confiance pour ce Gateway.
- Les nodes appairés étendent cette capacité d’opérateur de confiance à l’hôte node.
- Les approbations d’exécution réduisent le risque d’exécution accidentelle, mais ne constituent pas une frontière d’authentification par utilisateur.
- Les exécutions approuvées sur l’hôte node lient un contexte d’exécution canonique : cwd canonique, argv exact, liaison d’environnement lorsque présente, et chemin d’exécutable épinglé lorsqu’applicable.
- Pour les scripts shell et les invocations directes de fichier interpréteur/runtime, OpenClaw essaie aussi de lier
  un opérande de fichier local concret. Si ce fichier lié change après l’approbation mais avant l’exécution,
  l’exécution est refusée au lieu d’exécuter un contenu dérivé.
- Cette liaison de fichier est volontairement au mieux, pas un modèle sémantique complet de tous les chemins de chargeur interpréteur/runtime. Si le mode d’approbation ne peut pas identifier exactement un fichier local concret à lier, il refuse d’émettre une exécution adossée à une approbation au lieu de prétendre à une couverture complète.

Séparation macOS :

- Le **service hôte node** transfère `system.run` à l’**application macOS** via IPC local.
- L’**application macOS** applique les approbations + exécute la commande dans le contexte UI.

## Paramètres et stockage

Les approbations vivent dans un fichier JSON local sur l’hôte d’exécution :

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

## Mode « sans approbation » YOLO

Si vous voulez que l’exécution sur l’hôte s’effectue sans invites d’approbation, vous devez ouvrir **les deux** couches de politique :

- politique d’exécution demandée dans la configuration OpenClaw (`tools.exec.*`)
- politique locale d’approbation de l’hôte dans `~/.openclaw/exec-approvals.json`

C’est maintenant le comportement hôte par défaut, sauf si vous le resserrez explicitement :

- `tools.exec.security` : `full` sur `gateway`/`node`
- `tools.exec.ask` : `off`
- hôte `askFallback` : `full`

Distinction importante :

- `tools.exec.host=auto` choisit où l’exécution a lieu : sandbox si disponible, sinon gateway.
- YOLO choisit comment l’exécution sur l’hôte est approuvée : `security=full` plus `ask=off`.
- Les fournisseurs adossés à une CLI qui exposent leur propre mode non interactif d’autorisation peuvent suivre cette politique.
  Claude CLI ajoute `--permission-mode bypassPermissions` lorsque la politique d’exécution demandée par OpenClaw est
  YOLO. Remplacez ce comportement backend avec des arguments Claude explicites sous
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs`, par exemple
  `--permission-mode default`, `acceptEdits`, ou `bypassPermissions`.
- En mode YOLO, OpenClaw n’ajoute pas par-dessus la politique configurée d’exécution sur l’hôte une couche distincte d’approbation heuristique contre l’obfuscation de commande ni une couche de rejet préalable de script.
- `auto` ne fait pas du routage gateway un remplacement libre depuis une session sandboxée. Une requête par appel `host=node` est autorisée depuis `auto`, et `host=gateway` n’est autorisé depuis `auto` que lorsqu’aucun runtime sandbox n’est actif. Si vous voulez une valeur par défaut stable non-auto, définissez `tools.exec.host` ou utilisez `/exec host=...` explicitement.

Si vous voulez une configuration plus prudente, resserrez l’une ou l’autre couche vers `allowlist` / `on-miss`
ou `deny`.

Configuration persistante « ne jamais demander » sur l’hôte gateway :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Puis définissez le fichier d’approbations de l’hôte pour qu’il corresponde :

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

Ce raccourci local met à jour à la fois :

- `tools.exec.host/security/ask` local
- les valeurs par défaut locales de `~/.openclaw/exec-approvals.json`

Il est intentionnellement limité au local. Si vous devez changer à distance les approbations d’un hôte gateway ou node,
continuez à utiliser `openclaw approvals set --gateway` ou
`openclaw approvals set --node <id|name|ip>`.

Pour un hôte node, appliquez à la place le même fichier d’approbations sur ce node :

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

Limitation importante uniquement locale :

- `openclaw exec-policy` ne synchronise pas les approbations node
- `openclaw exec-policy set --host node` est rejeté
- les approbations d’exécution node sont récupérées depuis le node à l’exécution, donc les mises à jour ciblant le node doivent utiliser `openclaw approvals --node ...`

Raccourci limité à la session :

- `/exec security=full ask=off` ne change que la session actuelle.
- `/elevated full` est un raccourci d’urgence qui ignore aussi les approbations d’exécution pour cette session.

Si le fichier d’approbations de l’hôte reste plus strict que la configuration, la politique plus stricte de l’hôte l’emporte quand même.

## Paramètres de politique

### Sécurité (`exec.security`)

- **deny** : bloque toutes les requêtes d’exécution sur l’hôte.
- **allowlist** : autorise uniquement les commandes sur liste blanche.
- **full** : autorise tout (équivalent à elevated).

### Ask (`exec.ask`)

- **off** : ne jamais demander.
- **on-miss** : demander uniquement lorsqu’aucune entrée de liste blanche ne correspond.
- **always** : demander pour chaque commande.
- la confiance durable `allow-always` ne supprime pas les invites lorsque le mode effectif ask vaut `always`

### Ask fallback (`askFallback`)

Si une invite est requise mais qu’aucune interface n’est joignable, le repli décide :

- **deny** : bloquer.
- **allowlist** : autoriser uniquement si la liste blanche correspond.
- **full** : autoriser.

### Durcissement de l’évaluation inline de l’interpréteur (`tools.exec.strictInlineEval`)

Lorsque `tools.exec.strictInlineEval=true`, OpenClaw traite les formes d’évaluation inline de code comme nécessitant une approbation, même si le binaire interpréteur lui-même est sur liste blanche.

Exemples :

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Il s’agit d’une défense en profondeur pour les chargeurs d’interpréteur qui ne se mappent pas proprement à un unique opérande de fichier stable. En mode strict :

- ces commandes exigent toujours une approbation explicite ;
- `allow-always` ne persiste pas automatiquement de nouvelles entrées de liste blanche pour elles.

## Liste blanche (par agent)

Les listes blanches sont **par agent**. Si plusieurs agents existent, changez l’agent
que vous modifiez dans l’application macOS. Les motifs sont des **glob insensibles à la casse**.
Les motifs doivent se résoudre en **chemins binaires** (les entrées basées uniquement sur le basename sont ignorées).
Les anciennes entrées `agents.default` sont migrées vers `agents.main` au chargement.
Les chaînes shell telles que `echo ok && pwd` exigent toujours que chaque segment de niveau supérieur satisfasse les règles de liste blanche.

Exemples :

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Chaque entrée de liste blanche suit :

- **id** UUID stable utilisé pour l’identité dans l’interface (facultatif)
- **dernière utilisation** horodatage
- **dernière commande utilisée**
- **dernier chemin résolu**

## Auto-allow des CLI de Skills

Lorsque **Auto-allow skill CLIs** est activé, les exécutables référencés par des Skills connus
sont traités comme sur liste blanche sur les nodes (node macOS ou hôte node headless). Cela utilise
`skills.bins` via le RPC Gateway pour récupérer la liste des binaires de skill. Désactivez cela si vous voulez des listes blanches manuelles strictes.

Remarques importantes sur la confiance :

- Il s’agit d’une **liste blanche implicite de commodité**, distincte des entrées manuelles de liste blanche de chemin.
- Elle est destinée aux environnements d’opérateurs de confiance où Gateway et node partagent la même frontière de confiance.
- Si vous exigez une confiance explicite stricte, gardez `autoAllowSkills: false` et utilisez uniquement des entrées manuelles de liste blanche de chemin.

## Safe bins et transfert des approbations

Pour les safe bins (chemin rapide stdin-only), les détails de liaison d’interpréteur, et la façon
de transférer les invites d’approbation vers Slack/Discord/Telegram (ou de les exécuter comme clients
natifs d’approbation), voir [Approbations d’exécution — avancé](/fr/tools/exec-approvals-advanced).

<!-- moved to /tools/exec-approvals-advanced -->

## Édition dans la Control UI

Utilisez la carte **Control UI → Nodes → Exec approvals** pour modifier les valeurs par défaut, les remplacements
par agent, et les listes blanches. Choisissez un périmètre (Defaults ou un agent), ajustez la politique,
ajoutez/supprimez des motifs de liste blanche, puis **Save**. L’interface affiche les métadonnées **last used** par motif afin que vous puissiez garder la liste propre.

Le sélecteur de cible choisit **Gateway** (approbations locales) ou un **Node**. Les nodes
doivent annoncer `system.execApprovals.get/set` (application macOS ou hôte node headless).
Si un node n’annonce pas encore les approbations d’exécution, modifiez directement son fichier local
`~/.openclaw/exec-approvals.json`.

CLI : `openclaw approvals` prend en charge la modification du gateway ou du node (voir [CLI Approvals](/fr/cli/approvals)).

## Flux d’approbation

Lorsqu’une invite est requise, le gateway diffuse `exec.approval.requested` aux clients operator.
La Control UI et l’application macOS la résolvent via `exec.approval.resolve`, puis le gateway transfère la
requête approuvée à l’hôte node.

Pour `host=node`, les requêtes d’approbation incluent une charge utile canonique `systemRunPlan`. Le gateway utilise
ce plan comme contexte autoritaire commande/cwd/session lorsqu’il transfère les requêtes
`system.run` approuvées.

C’est important pour la latence d’approbation asynchrone :

- le chemin d’exécution node prépare un plan canonique unique dès le départ
- l’enregistrement d’approbation stocke ce plan et ses métadonnées de liaison
- une fois approuvé, l’appel final transféré `system.run` réutilise le plan stocké
  au lieu de faire confiance à des modifications ultérieures de l’appelant
- si l’appelant modifie `command`, `rawCommand`, `cwd`, `agentId`, ou
  `sessionKey` après la création de la demande d’approbation, le gateway rejette l’exécution
  transférée comme incompatibilité d’approbation

## Événements système

Le cycle de vie exec est exposé sous forme de messages système :

- `Exec running` (uniquement si la commande dépasse le seuil de notification d’exécution)
- `Exec finished`
- `Exec denied`

Ces messages sont publiés dans la session de l’agent après que le node a signalé l’événement.
Les approbations d’exécution de l’hôte gateway émettent les mêmes événements de cycle de vie lorsque la commande se termine (et éventuellement lorsqu’elle s’exécute plus longtemps que le seuil).
Les exécutions protégées par approbation réutilisent l’ID d’approbation comme `runId` dans ces messages pour une corrélation facile.

## Comportement lors d’un refus d’approbation

Lorsqu’une approbation d’exécution asynchrone est refusée, OpenClaw empêche l’agent de réutiliser
la sortie de toute exécution antérieure de la même commande dans la session. La raison du refus
est transmise avec une indication explicite qu’aucune sortie de commande n’est disponible, ce qui empêche
l’agent d’affirmer qu’il existe une nouvelle sortie ou de répéter la commande refusée avec
des résultats obsolètes provenant d’une exécution précédente réussie.

## Implications

- **full** est puissant ; préférez les listes blanches lorsque c’est possible.
- **ask** vous garde dans la boucle tout en permettant des approbations rapides.
- Les listes blanches par agent empêchent les approbations d’un agent de fuiter vers les autres.
- Les approbations ne s’appliquent qu’aux requêtes d’exécution sur l’hôte provenant **d’expéditeurs autorisés**. Les expéditeurs non autorisés ne peuvent pas émettre `/exec`.
- `/exec security=full` est une commodité au niveau session pour les opérateurs autorisés et ignore les approbations par conception. Pour bloquer strictement l’exécution sur l’hôte, définissez la sécurité des approbations sur `deny` ou refusez l’outil `exec` via la politique d’outil.

## Lié

<CardGroup cols={2}>
  <Card title="Approbations d’exécution — avancé" href="/fr/tools/exec-approvals-advanced" icon="gear">
    Safe bins, liaison d’interpréteur, et transfert des approbations vers le chat.
  </Card>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Outil d’exécution de commandes shell.
  </Card>
  <Card title="Mode Elevated" href="/fr/tools/elevated" icon="shield-exclamation">
    Chemin d’urgence qui ignore aussi les approbations.
  </Card>
  <Card title="Sandboxing" href="/fr/gateway/sandboxing" icon="box">
    Modes de sandbox et accès à l’espace de travail.
  </Card>
  <Card title="Sécurité" href="/fr/gateway/security" icon="lock">
    Modèle de sécurité et durcissement.
  </Card>
  <Card title="Sandbox vs politique d’outil vs Elevated" href="/fr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Quand utiliser chacun de ces contrôles.
  </Card>
  <Card title="Skills" href="/fr/tools/skills" icon="sparkles">
    Comportement d’auto-allow adossé aux Skills.
  </Card>
</CardGroup>
