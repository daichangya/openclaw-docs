---
read_when:
    - Mise en œuvre des approbations d’appairage de Node sans interface macOS
    - Ajout de flux CLI pour approuver des nœuds distants
    - Extension du protocole Gateway avec la gestion des nœuds
summary: Appairage de Node géré par la Gateway (Option B) pour iOS et d’autres nœuds distants
title: Appairage géré par la Gateway
x-i18n:
    generated_at: "2026-04-23T14:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Appairage géré par la Gateway (Option B)

Dans l’appairage géré par la Gateway, la **Gateway** est la source de vérité pour savoir quels nœuds
sont autorisés à rejoindre. Les interfaces utilisateur (app macOS, futurs clients) ne sont que des frontends qui
approuvent ou rejettent les demandes en attente.

**Important :** les nœuds WS utilisent l’**appairage d’appareil** (rôle `node`) pendant `connect`.
`node.pair.*` est un magasin d’appairage distinct et ne contrôle **pas** la poignée de main WS.
Seuls les clients qui appellent explicitement `node.pair.*` utilisent ce flux.

## Concepts

- **Demande en attente** : un nœud a demandé à rejoindre ; nécessite une approbation.
- **Nœud appairé** : nœud approuvé avec un jeton d’authentification émis.
- **Transport** : le point de terminaison WS de la Gateway transmet les demandes mais ne décide pas
  de l’appartenance. (La prise en charge héritée du pont TCP a été supprimée.)

## Fonctionnement de l’appairage

1. Un nœud se connecte à la Gateway WS et demande l’appairage.
2. La Gateway stocke une **demande en attente** et émet `node.pair.requested`.
3. Vous approuvez ou rejetez la demande (CLI ou interface).
4. Lors de l’approbation, la Gateway émet un **nouveau jeton** (les jetons sont renouvelés lors d’un réappairage).
5. Le nœud se reconnecte en utilisant le jeton et est maintenant « appairé ».

Les demandes en attente expirent automatiquement après **5 minutes**.

## Flux CLI (adapté au mode headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` affiche les nœuds appairés/connectés et leurs capacités.

## Surface API (protocole Gateway)

Événements :

- `node.pair.requested` — émis lorsqu’une nouvelle demande en attente est créée.
- `node.pair.resolved` — émis lorsqu’une demande est approuvée/rejetée/expirée.

Méthodes :

- `node.pair.request` — crée ou réutilise une demande en attente.
- `node.pair.list` — liste les nœuds en attente + appairés (`operator.pairing`).
- `node.pair.approve` — approuve une demande en attente (émet un jeton).
- `node.pair.reject` — rejette une demande en attente.
- `node.pair.verify` — vérifie `{ nodeId, token }`.

Remarques :

- `node.pair.request` est idempotent par nœud : les appels répétés renvoient la même
  demande en attente.
- Les demandes répétées pour le même nœud en attente actualisent aussi les métadonnées
  stockées du nœud ainsi que le dernier instantané déclaré des commandes mises en liste d’autorisation pour la visibilité de l’opérateur.
- L’approbation génère **toujours** un nouveau jeton ; aucun jeton n’est jamais renvoyé par
  `node.pair.request`.
- Les demandes peuvent inclure `silent: true` comme indication pour les flux d’approbation automatique.
- `node.pair.approve` utilise les commandes déclarées de la demande en attente pour appliquer
  des portées d’approbation supplémentaires :
  - demande sans commande : `operator.pairing`
  - demande de commande non-exec : `operator.pairing` + `operator.write`
  - demande `system.run` / `system.run.prepare` / `system.which` :
    `operator.pairing` + `operator.admin`

Important :

- L’appairage de nœud est un flux de confiance/identité plus émission de jeton.
- Il ne fige **pas** la surface de commandes active du nœud par nœud.
- Les commandes de nœud actives proviennent de ce que le nœud déclare à la connexion après application
  de la politique globale de commandes de nœud de la Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La politique d’autorisation/demande `system.run` par nœud vit sur le nœud dans
  `exec.approvals.node.*`, pas dans l’enregistrement d’appairage.

## Contrôle des commandes de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** à partir de `2026.3.31`, les commandes de nœud sont désactivées jusqu’à l’approbation de l’appairage du nœud. L’appairage d’appareil seul ne suffit plus pour exposer les commandes de nœud déclarées.
</Warning>

Lorsqu’un nœud se connecte pour la première fois, l’appairage est demandé automatiquement. Tant que la demande d’appairage n’est pas approuvée, toutes les commandes de nœud en attente provenant de ce nœud sont filtrées et ne s’exécutent pas. Une fois la confiance établie par l’approbation de l’appairage, les commandes déclarées du nœud deviennent disponibles sous réserve de la politique de commandes normale.

Cela signifie :

- Les nœuds qui s’appuyaient auparavant uniquement sur l’appairage d’appareil pour exposer des commandes doivent désormais terminer l’appairage du nœud.
- Les commandes mises en file d’attente avant l’approbation de l’appairage sont abandonnées, pas différées.

## Limites de confiance des événements de nœud (2026.3.31+)

<Warning>
**Changement incompatible :** les exécutions initiées par le nœud restent désormais sur une surface de confiance réduite.
</Warning>

Les résumés initiés par le nœud et les événements de session associés sont limités à la surface de confiance prévue. Les flux déclenchés par notification ou par nœud qui s’appuyaient auparavant sur un accès plus large aux outils de l’hôte ou de la session peuvent nécessiter des ajustements. Ce durcissement garantit que les événements de nœud ne peuvent pas conduire à une élévation vers un accès aux outils au niveau de l’hôte au-delà de ce que permet la limite de confiance du nœud.

## Approbation automatique (app macOS)

L’app macOS peut tenter facultativement une **approbation silencieuse** lorsque :

- la demande est marquée `silent`, et
- l’app peut vérifier une connexion SSH à l’hôte Gateway avec le même utilisateur.

Si l’approbation silencieuse échoue, elle revient à l’invite normale « Approve/Reject ».

## Approbation automatique des mises à niveau de métadonnées

Lorsqu’un appareil déjà appairé se reconnecte avec uniquement des changements de métadonnées non sensibles
(par exemple, nom d’affichage ou indications de plateforme cliente), OpenClaw traite
cela comme un `metadata-upgrade`. L’approbation automatique silencieuse est étroite : elle s’applique uniquement
aux reconnexions locales fiables CLI/helper qui ont déjà prouvé la possession du
jeton partagé ou du mot de passe via local loopback. Les clients navigateur/Control UI et les clients
distants utilisent toujours le flux explicite de réapprobation. Les mises à niveau de portée (lecture vers
écriture/admin) et les changements de clé publique ne sont **pas** éligibles à l’approbation automatique
`metadata-upgrade` — ils restent des demandes explicites de réapprobation.

## Assistants d’appairage par QR

`/pair qr` affiche la charge utile d’appairage comme média structuré afin que les clients mobiles et
navigateurs puissent la scanner directement.

La suppression d’un appareil nettoie aussi toutes les demandes d’appairage en attente obsolètes pour cet
ID d’appareil, afin que `nodes pending` n’affiche pas de lignes orphelines après une révocation.

## Localité et en-têtes transférés

L’appairage Gateway considère une connexion comme loopback uniquement si à la fois le socket brut
et toute preuve de proxy amont concordent. Si une demande arrive sur loopback mais
porte des en-têtes `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
qui pointent vers une origine non locale, cette preuve via en-têtes transférés invalide
la revendication de localité loopback. Le chemin d’appairage exige alors une approbation explicite
au lieu de traiter silencieusement la demande comme une connexion du même hôte. Voir
[Authentification de proxy approuvé](/fr/gateway/trusted-proxy-auth) pour la règle équivalente sur
l’authentification opérateur.

## Stockage (local, privé)

L’état d’appairage est stocké sous le répertoire d’état de la Gateway (par défaut `~/.openclaw`) :

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Si vous redéfinissez `OPENCLAW_STATE_DIR`, le dossier `nodes/` se déplace avec lui.

Remarques de sécurité :

- Les jetons sont des secrets ; traitez `paired.json` comme sensible.
- La rotation d’un jeton nécessite une réapprobation (ou la suppression de l’entrée du nœud).

## Comportement du transport

- Le transport est **sans état** ; il ne stocke pas l’appartenance.
- Si la Gateway est hors ligne ou si l’appairage est désactivé, les nœuds ne peuvent pas s’appairer.
- Si la Gateway est en mode distant, l’appairage se fait tout de même par rapport au magasin de la Gateway distante.
