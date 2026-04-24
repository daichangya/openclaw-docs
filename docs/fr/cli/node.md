---
read_when:
    - Exécuter l’hôte Node headless
    - Appairer un Node non macOS pour `system.run`
summary: Référence CLI pour `openclaw node` (hôte Node headless)
title: Node
x-i18n:
    generated_at: "2026-04-24T07:04:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f2bd6d61ee87d36f7691207d03a91c914e6460549256e0cc6ea7bebfa713923
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

Exécutez un **hôte Node headless** qui se connecte au WebSocket du Gateway et expose
`system.run` / `system.which` sur cette machine.

## Pourquoi utiliser un hôte Node ?

Utilisez un hôte Node lorsque vous voulez que des agents **exécutent des commandes sur d’autres machines** de votre
réseau sans y installer une application compagnon macOS complète.

Cas d’usage courants :

- Exécuter des commandes sur des machines Linux/Windows distantes (serveurs de build, machines de labo, NAS).
- Garder l’exécution **sandboxée** sur le gateway, mais déléguer les exécutions approuvées à d’autres hôtes.
- Fournir une cible d’exécution légère et headless pour l’automatisation ou les nodes CI.

L’exécution reste protégée par les **approbations d’exécution** et les listes blanches par agent sur
l’hôte Node, ce qui vous permet de garder un accès aux commandes cadré et explicite.

## Proxy navigateur (zéro configuration)

Les hôtes Node annoncent automatiquement un proxy navigateur si `browser.enabled` n’est pas
désactivé sur le Node. Cela permet à l’agent d’utiliser l’automatisation du navigateur sur ce Node
sans configuration supplémentaire.

Par défaut, le proxy expose la surface normale de profils navigateur du Node. Si vous
définissez `nodeHost.browserProxy.allowProfiles`, le proxy devient restrictif :
le ciblage de profils non autorisés par liste blanche est rejeté, et les routes persistantes de
création/suppression de profils sont bloquées via le proxy.

Désactivez-le sur le Node si nécessaire :

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Exécution (premier plan)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID du Node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node

## Authentification Gateway pour l’hôte Node

`openclaw node run` et `openclaw node install` résolvent l’authentification gateway depuis la config/l’environnement (pas d’indicateurs `--token`/`--password` sur les commandes Node) :

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` sont vérifiés en premier.
- Puis repli sur la configuration locale : `gateway.auth.token` / `gateway.auth.password`.
- En mode local, l’hôte Node n’hérite volontairement pas de `gateway.remote.token` / `gateway.remote.password`.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution de l’authentification du Node échoue en mode sécurisé par défaut (pas de masquage par repli distant).
- En `gateway.mode=remote`, les champs client distant (`gateway.remote.token` / `gateway.remote.password`) sont également admissibles selon les règles de priorité distantes.
- La résolution de l’authentification de l’hôte Node ne respecte que les variables d’environnement `OPENCLAW_GATEWAY_*`.

Pour un Node se connectant à un Gateway `ws://` hors loopback sur un réseau privé
de confiance, définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`. Sans cela, le démarrage du Node
échoue en mode sécurisé par défaut et vous demande d’utiliser `wss://`, un tunnel SSH, ou Tailscale.
Il s’agit d’un consentement explicite via l’environnement du processus, pas d’une clé de configuration `openclaw.json`.
`openclaw node install` le persiste dans le service Node supervisé lorsqu’il est
présent dans l’environnement de la commande d’installation.

## Service (arrière-plan)

Installez un hôte Node headless en tant que service utilisateur.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Options :

- `--host <host>` : hôte WebSocket du Gateway (par défaut : `127.0.0.1`)
- `--port <port>` : port WebSocket du Gateway (par défaut : `18789`)
- `--tls` : utiliser TLS pour la connexion au gateway
- `--tls-fingerprint <sha256>` : empreinte attendue du certificat TLS (sha256)
- `--node-id <id>` : remplacer l’ID du Node (efface le jeton d’appairage)
- `--display-name <name>` : remplacer le nom d’affichage du Node
- `--runtime <runtime>` : runtime du service (`node` ou `bun`)
- `--force` : réinstaller/écraser si déjà installé

Gérez le service :

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Utilisez `openclaw node run` pour un hôte Node au premier plan (sans service).

Les commandes de service acceptent `--json` pour une sortie lisible par machine.

## Appairage

La première connexion crée une demande d’appairage d’appareil en attente (`role: node`) sur le Gateway.
Approuvez-la via :

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si le Node réessaie l’appairage avec des détails d’authentification modifiés (rôle/périmètres/clé publique),
la précédente demande en attente est remplacée et un nouveau `requestId` est créé.
Exécutez à nouveau `openclaw devices list` avant l’approbation.

L’hôte Node stocke son ID Node, son jeton, son nom d’affichage et les informations de connexion gateway dans
`~/.openclaw/node.json`.

## Approbations d’exécution

`system.run` est protégé par des approbations d’exécution locales :

- `~/.openclaw/exec-approvals.json`
- [Approbations d’exécution](/fr/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (modifier depuis le Gateway)

Pour une exécution Node asynchrone approuvée, OpenClaw prépare un `systemRunPlan`
canonique avant de demander l’approbation. Le transfert `system.run` approuvé ensuite réutilise ce
plan stocké, de sorte que les modifications des champs commande/cwd/session après la création
de la demande d’approbation sont rejetées au lieu de changer ce que le Node exécute.

## Lié

- [Référence CLI](/fr/cli)
- [Nodes](/fr/nodes)
