---
read_when:
    - Exécuter l’hôte de nœud sans interface
    - Appairer un nœud non macOS pour system.run
summary: Référence CLI pour `openclaw node` (hôte de nœud sans interface)
title: node
x-i18n:
    generated_at: "2026-04-05T12:38:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Exécutez un **hôte de nœud sans interface** qui se connecte au WebSocket de la Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte de nœud ?

Utilisez un hôte de nœud lorsque vous voulez que les agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’usage courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de labo, NAS).
- Garder l’exécution **sandboxed** sur la gateway, mais déléguer les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et sans interface pour l’automatisation ou les nœuds CI.

L’exécution reste protégée par les **approbations d’exécution** et les listes d’autorisation par agent sur l’hôte de nœud, afin de conserver un accès aux commandes limité et explicite.

## Proxy de navigateur (zéro configuration)

Les hôtes de nœud annoncent automatiquement un proxy de navigateur si `browser.enabled` n’est pas
désactivé sur le nœud. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce nœud
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale du profil de navigateur du nœud. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils non autorisés est rejeté, et les routes de
création/suppression de profils persistants sont bloquées via le proxy.

Désactivez-le sur le nœud si nécessaire :

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Exécuter (premier plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket de la Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket de la Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion à la gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : surcharger l’identifiant du nœud (efface le jeton d’appairage)
- `--display-name <name>` : surcharger le nom d’affichage du nœud

## Authentification gateway pour l’hôte de nœud

`openclaw node run` et `openclaw node install` résolvent l’authentification gateway à partir de la configuration/des variables d’environnement (pas d’options `--token`/`--password` sur les commandes node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte de nœud n’hérite intentionnellement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution de l’authentification du nœud échoue en mode fermé (aucun repli distant ne masque ce cas).
- En `gateway.mode=remote`, les champs client distants (`gateway.remote.token` / `gateway.remote.password`) sont aussi éligibles selon les règles de priorité du mode distant.
- La résolution de l’authentification de l’hôte de nœud ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

## Service (arrière-plan)

Installez un hôte de nœud sans interface comme service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket de la Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket de la Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion à la gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : surcharger l’identifiant du nœud (efface le jeton d’appairage)
- `--display-name <name>` : surcharger le nom d’affichage du nœud
- `--runtime <runtime>` : runtime du service (`node` ou `bun`)
- `--force` : réinstaller/écraser si déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte de nœud au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur la Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si le nœud réessaie l’appairage avec des détails d’authentification modifiés (rôle/scopes/clé publique),
la demande en attente précédente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte de nœud stocke son identifiant de nœud, son jeton, son nom d’affichage et les informations de connexion gateway dans
`~/.openclaw/node.json`.

## Approbations d’exécution

`system.run` est protégé par les approbations d’exécution locales :

- `~/.openclaw/exec-approvals.json`
- [Exec approvals](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis la Gateway)

Pour une exécution asynchrone de nœud approuvée, OpenClaw prépare un `systemRunPlan`
canonique avant de demander l’approbation. Le transfert `system.run` approuvé ultérieurement réutilise ce
plan stocké, de sorte que les modifications des champs commande/cwd/session après la création de la demande d’approbation sont rejetées au lieu de changer ce que le nœud exécute.
