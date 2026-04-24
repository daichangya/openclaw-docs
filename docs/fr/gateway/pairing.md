---
read_when:
    - Implémentation des approbations de jumelage de nœuds sans interface macOS
    - Ajout de flux CLI pour approuver des nœuds distants
    - Extension du protocole Gateway avec la gestion des nœuds
summary: Jumelage de nœuds géré par le Gateway (option B) pour iOS et autres nœuds distants
title: Jumelage géré par le Gateway
x-i18n:
    generated_at: "2026-04-24T07:11:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Jumelage géré par le Gateway (option B)

Dans le jumelage géré par le Gateway, le **Gateway** est la source de vérité pour déterminer quels nœuds
sont autorisés à rejoindre. Les interfaces (application macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent le **jumelage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un stockage de jumelage distinct et ne contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; nécessite une approbation.
- **Nœud jumelé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS du Gateway transmet les demandes mais ne décide pas
  de l’appartenance. (La prise en charge de l’ancien pont TCP a été supprimée.)

## Fonctionnement du jumelage

1. Un nœud se connecte au WS du Gateway et demande le jumelage.
2. Le Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface).
4. En cas d’approbation, le Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un re-jumelage).
5. Le nœud se reconnecte en utilisant le jeton et est désormais « jumelé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au mode headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les nœuds jumelés/connectés et leurs capacités.

## Surface API (protocole gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — créer ou réutiliser une demande en attente.
- `node.pair.list` — lister les nœuds en attente + jumelés (`operator.pairing`).
- `node.pair.approve` — approuver une demande en attente (émet un jeton).
- `node.pair.reject` — rejeter une demande en attente.
- `node.pair.verify` — vérifier `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent également les métadonnées du nœud
  stockées ainsi que le dernier instantané de commandes déclarées autorisées pour la visibilité opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’auto-approbation.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non-exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- Le jumelage de nœud est un flux de confiance/identité plus émission de jeton.
- Il **n’épingle pas** la surface de commande du nœud en direct par nœud.
- Les commandes de nœud en direct proviennent de ce que le nœud déclare à la connexion après application de la
  politique globale de commandes de nœud du gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique d’autorisation/demande `system.run` par nœud vit sur le nœud dans
  `exec.approvals.node.*`, pas dans l’enregistrement de jumelage.

## Contrôle des commandes de nœud (2026.3.31+)

<Warning>
**Changement cassant :** à partir de `2026.3.31`, les commandes de nœud sont désactivées jusqu’à approbation du jumelage de nœud. Le jumelage d’appareil seul ne suffit plus à exposer les commandes de nœud déclarées.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, le jumelage est demandé automatiquement. Tant que la demande de jumelage n’est pas approuvée, toutes les commandes de nœud en attente provenant de ce nœud sont filtrées et ne seront pas exécutées. Une fois la confiance établie via l’approbation du jumelage, les commandes déclarées du nœud deviennent disponibles sous réserve de la politique normale de commandes.

Cela signifie :

- Les nœuds qui dépendaient auparavant du seul jumelage d’appareil pour exposer des commandes doivent désormais terminer le jumelage de nœud.
- Les commandes mises en file d’attente avant l’approbation du jumelage sont abandonnées, et non différées.

## Frontières de confiance des événements de nœud (2026.3.31+)

<Warning>
**Changement cassant :** les exécutions à l’origine d’un nœud restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés d’origine nœud et les événements de session associés sont limités à la surface de confiance prévue. Les flux pilotés par notification ou déclenchés par nœud qui dépendaient auparavant d’un accès plus large aux outils d’hôte ou de session peuvent nécessiter un ajustement. Ce durcissement garantit que les événements de nœud ne peuvent pas s’élever vers un accès aux outils au niveau hôte au-delà de ce qu’autorise la frontière de confiance du nœud.

## Auto-approbation (application macOS)

L’application macOS peut éventuellement tenter une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’application peut vérifier une connexion SSH à l’hôte gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approuver/Rejeter ».

## Auto-approbation de mise à niveau des métadonnées

Lorsqu’un appareil déjà jumelé se reconnecte avec seulement des modifications non sensibles de métadonnées
(par exemple nom d’affichage ou indications de plateforme client), OpenClaw traite cela
comme une `metadata-upgrade`. L’auto-approbation silencieuse est étroite : elle s’applique uniquement
aux reconnexions de CLI/outils auxiliaires locaux de confiance qui ont déjà prouvé la possession du
jeton partagé ou du mot de passe sur loopback. Les clients navigateur/Control UI et les clients
distants utilisent toujours le flux explicite de réapprobation. Les montées de portée
(lecture vers écriture/admin) et les changements de clé publique ne sont **pas** éligibles à
l’auto-approbation de mise à niveau des métadonnées — ils restent des demandes explicites de réapprobation.

## Assistants de jumelage QR

`/pair qr` affiche la charge utile de jumelage comme média structuré afin que les clients mobiles et navigateur puissent la scanner directement.

La suppression d’un appareil balaie également toute demande de jumelage en attente obsolète pour cet
ID d’appareil, de sorte que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

Le jumelage Gateway traite une connexion comme loopback uniquement lorsque le socket brut
et toute preuve de proxy amont concordent. Si une requête arrive sur loopback mais
contient des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
qui pointent vers une origine non locale, cette preuve par en-têtes transférés invalide
la revendication de localité loopback. Le chemin de jumelage exige alors une approbation explicite
au lieu de traiter silencieusement la requête comme une connexion depuis le même hôte. Voir
[Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état du jumelage est stocké sous le répertoire d’état du Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous remplacez `OPENCLAW_STATE_DIR`, le dossier `nodes/` est déplacé avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une nouvelle approbation (ou la suppression de l’entrée du nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si le Gateway est hors ligne ou que le jumelage est désactivé, les nœuds ne peuvent pas se jumeler.
- Si le Gateway est en mode distant, le jumelage s’effectue quand même par rapport au stockage du Gateway distant.

## Associé

- [Jumelage de canal](/fr/channels/pairing)
- [Nœuds](/fr/nodes)
- [CLI des appareils](/fr/cli/devices)
