---
read_when:
    - Implémentation des approbations d’appairage de node sans UI macOS
    - Ajout de flux CLI pour approuver des nodes distants
    - Extension du protocole gateway avec la gestion des nodes
summary: Appairage de nodes géré par la Gateway (option B) pour iOS et autres nodes distants
title: Appairage géré par la Gateway
x-i18n:
    generated_at: "2026-04-05T12:42:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Appairage géré par la Gateway (option B)

Dans l’appairage géré par la Gateway, la **Gateway** est la source de vérité pour savoir quels nodes
sont autorisés à rejoindre le système. Les UI (application macOS, futurs clients) ne sont que des interfaces
qui approuvent ou rejettent les demandes en attente.

**Important :** les nodes WS utilisent l’**appairage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin d’appairage distinct et ne contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un node a demandé à rejoindre le système ; une approbation est requise.
- **Node appairé** : node approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS de la Gateway transfère les requêtes mais ne décide pas
  de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un node se connecte au WS de la Gateway et demande l’appairage.
2. La Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou UI).
4. En cas d’approbation, la Gateway émet un **nouveau jeton** (les jetons sont rotés lors d’un réappairage).
5. Le node se reconnecte en utilisant le jeton et est maintenant « appairé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les nodes appairés/connectés et leurs capacités.

## Surface API (protocole gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — crée ou réutilise une demande en attente.
- `node.pair.list` — liste les nodes en attente + appairés (`operator.pairing`).
- `node.pair.approve` — approuve une demande en attente (émet un jeton).
- `node.pair.reject` — rejette une demande en attente.
- `node.pair.verify` — vérifie `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotente par node : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même node en attente actualisent également les métadonnées du node
  stockées ainsi que le dernier instantané déclaré de commandes autorisées, pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un jeton neuf ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande sans exécution : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- L’appairage de node est un flux de confiance/d’identité plus émission de jeton.
- Il n’épingle **pas** la surface de commandes active du node par node.
- Les commandes actives du node proviennent de ce que le node déclare à la connexion après application
  de la politique globale de commandes de node de la gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique `system.run` allow/ask par node se trouve sur le node dans
  `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

## Filtrage des commandes de node (2026.3.31+)

<Warning>
**Changement cassant :** à partir de `2026.3.31`, les commandes de node sont désactivées jusqu’à l’approbation de l’appairage du node. L’appairage d’appareil seul ne suffit plus pour exposer les commandes déclarées du node.
</Warning>

Lorsqu’un node se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes de node en attente provenant de ce node sont filtrées et ne seront pas exécutées. Une fois la confiance établie via l’approbation d’appairage, les commandes déclarées du node deviennent disponibles sous réserve de la politique normale de commandes.

Cela signifie :

- Les nodes qui comptaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent désormais terminer l’appairage de node.
- Les commandes mises en file d’attente avant l’approbation d’appairage sont abandonnées, et non différées.

## Limites de confiance des événements de node (2026.3.31+)

<Warning>
**Changement cassant :** les exécutions provenant d’un node restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés provenant d’un node et les événements de session associés sont restreints à la surface de confiance prévue. Les flux pilotés par notification ou déclenchés par node qui s’appuyaient auparavant sur un accès plus large aux outils d’hôte ou de session peuvent nécessiter des ajustements. Ce renforcement garantit que les événements de node ne peuvent pas s’élever vers un accès aux outils au niveau hôte au-delà de ce que permet la limite de confiance du node.

## Approbation automatique (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte gateway en utilisant le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approve/Reject ».

## Stockage (local, privé)

L’état d’appairage est stocké sous le répertoire d’état de la Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une nouvelle approbation (ou la suppression de l’entrée du node).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si la Gateway est hors ligne ou si l’appairage est désactivé, les nodes ne peuvent pas s’appairer.
- Si la Gateway est en mode distant, l’appairage s’effectue toujours par rapport au magasin de la Gateway distante.
