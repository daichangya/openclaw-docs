---
read_when:
    - Vous voulez modifier les approbations d’exécution depuis la CLI
    - Vous devez gérer les listes d’autorisation sur les hôtes gateway ou node
summary: Référence CLI pour `openclaw approvals` (approbations d’exécution pour les hôtes gateway ou node)
title: approvals
x-i18n:
    generated_at: "2026-04-05T12:37:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gérez les approbations d’exécution pour l’**hôte local**, l’**hôte gateway** ou un **hôte node**.
Par défaut, les commandes ciblent le fichier d’approbations local sur disque. Utilisez `--gateway` pour cibler la gateway, ou `--node` pour cibler un node spécifique.

Alias : `openclaw exec-approvals`

Voir aussi :

- Approbations d’exécution : [Approbations d’exécution](/tools/exec-approvals)
- Nodes : [Nodes](/nodes)

## Commandes courantes

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` affiche maintenant la politique d’exécution effective pour les cibles locales, gateway et node :

- politique `tools.exec` demandée
- politique du fichier d’approbations de l’hôte
- résultat effectif après application des règles de priorité

La priorité est intentionnelle :

- le fichier d’approbations de l’hôte est la source de vérité applicable
- la politique `tools.exec` demandée peut restreindre ou élargir l’intention, mais le résultat effectif est toujours dérivé des règles de l’hôte
- `--node` combine le fichier d’approbations de l’hôte node avec la politique `tools.exec` de la gateway, car les deux s’appliquent toujours à l’exécution
- si la configuration gateway n’est pas disponible, la CLI revient à l’instantané d’approbations du node et indique que la politique d’exécution finale n’a pas pu être calculée

## Remplacer les approbations à partir d’un fichier

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` accepte le JSON5, pas uniquement le JSON strict. Utilisez soit `--file`, soit `--stdin`, pas les deux.

## Exemple « Ne jamais demander » / YOLO

Pour un hôte qui ne doit jamais s’arrêter sur les approbations d’exécution, définissez les valeurs par défaut des approbations de l’hôte sur `full` + `off` :

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

Variante node :

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

Cela modifie uniquement le **fichier d’approbations de l’hôte**. Pour garder la politique OpenClaw demandée alignée, définissez aussi :

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Pourquoi `tools.exec.host=gateway` dans cet exemple :

- `host=auto` signifie toujours « sandbox lorsque disponible, sinon gateway ».
- YOLO concerne les approbations, pas le routage.
- Si vous voulez une exécution sur l’hôte même lorsqu’une sandbox est configurée, rendez le choix de l’hôte explicite avec `gateway` ou `/exec host=gateway`.

Cela correspond au comportement YOLO actuel par défaut pour l’hôte. Rendez-le plus strict si vous voulez des approbations.

## Assistants de liste d’autorisation

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Options courantes

`get`, `set` et `allowlist add|remove` prennent tous en charge :

- `--node <id|name|ip>`
- `--gateway`
- options RPC node partagées : `--url`, `--token`, `--timeout`, `--json`

Remarques sur le ciblage :

- sans drapeau de cible, le fichier d’approbations local sur disque est utilisé
- `--gateway` cible le fichier d’approbations de l’hôte gateway
- `--node` cible un hôte node après résolution par ID, nom, IP ou préfixe d’ID

`allowlist add|remove` prend aussi en charge :

- `--agent <id>` (par défaut `*`)

## Remarques

- `--node` utilise le même résolveur que `openclaw nodes` (ID, nom, IP ou préfixe d’ID).
- `--agent` vaut par défaut `"*"`, ce qui s’applique à tous les agents.
- L’hôte node doit annoncer `system.execApprovals.get/set` (application macOS ou hôte node headless).
- Les fichiers d’approbations sont stockés par hôte dans `~/.openclaw/exec-approvals.json`.
