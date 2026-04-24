---
read_when:
    - Débogage de l’onglet Instances
    - Enquêter sur des lignes d’instance dupliquées ou obsolètes
    - Modifier la connexion WS du Gateway ou les balises d’événements système
summary: Comment les entrées de présence d’OpenClaw sont produites, fusionnées et affichées
title: Présence
x-i18n:
    generated_at: "2026-04-24T07:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f33a7d4a3d5e5555c68a7503b3a4f75c12db94d260e5546cfc26ca8a12de0f9
    source_path: concepts/presence.md
    workflow: 15
---

La « présence » d’OpenClaw est une vue légère, au mieux, de :

- le **Gateway** lui-même, et
- les **clients connectés au Gateway** (application Mac, WebChat, CLI, etc.)

La présence est principalement utilisée pour afficher l’onglet **Instances** de l’application macOS et pour
offrir une visibilité rapide aux opérateurs.

## Champs de présence (ce qui s’affiche)

Les entrées de présence sont des objets structurés avec des champs comme :

- `instanceId` (facultatif mais fortement recommandé) : identité client stable (généralement `connect.client.instanceId`)
- `host` : nom d’hôte lisible par un humain
- `ip` : adresse IP au mieux
- `version` : chaîne de version du client
- `deviceFamily` / `modelIdentifier` : indications sur le matériel
- `mode` : `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds` : « secondes depuis la dernière saisie utilisateur » (si connu)
- `reason` : `self`, `connect`, `node-connected`, `periodic`, ...
- `ts` : horodatage de la dernière mise à jour (ms depuis l’époque Unix)

## Producteurs (d’où vient la présence)

Les entrées de présence sont produites par plusieurs sources et **fusionnées**.

### 1) Entrée propre au Gateway

Le Gateway initialise toujours une entrée « self » au démarrage afin que les interfaces utilisateur affichent l’hôte du Gateway
même avant qu’un client ne se connecte.

### 2) Connexion WebSocket

Chaque client WS commence par une requête `connect`. Une fois la poignée de main réussie, le
Gateway met à jour ou insère une entrée de présence pour cette connexion.

#### Pourquoi les commandes CLI ponctuelles n’apparaissent pas

La CLI se connecte souvent pour des commandes courtes et ponctuelles. Afin d’éviter de polluer la
liste des Instances, `client.mode === "cli"` n’est **pas** transformé en entrée de présence.

### 3) Balises `system-event`

Les clients peuvent envoyer des balises périodiques plus riches via la méthode `system-event`. L’application Mac
utilise cela pour signaler le nom d’hôte, l’IP et `lastInputSeconds`.

### 4) Connexions de nœuds (role: node)

Lorsqu’un nœud se connecte via le WebSocket du Gateway avec `role: node`, le Gateway met à jour ou insère une entrée de présence pour ce nœud (même flux que pour les autres clients WS).

## Règles de fusion + déduplication (pourquoi `instanceId` est important)

Les entrées de présence sont stockées dans une seule table en mémoire :

- Les entrées sont indexées par une **clé de présence**.
- La meilleure clé est un `instanceId` stable (issu de `connect.client.instanceId`) qui survit aux redémarrages.
- Les clés ne sont pas sensibles à la casse.

Si un client se reconnecte sans `instanceId` stable, il peut apparaître comme une
ligne **dupliquée**.

## TTL et taille bornée

La présence est volontairement éphémère :

- **TTL :** les entrées âgées de plus de 5 minutes sont supprimées
- **Nombre maximal d’entrées :** 200 (les plus anciennes sont supprimées en premier)

Cela maintient la liste à jour et évite une croissance illimitée de la mémoire.

## Limite en mode distant/tunnel (IP loopback)

Lorsqu’un client se connecte via un tunnel SSH / une redirection de port local, le Gateway peut
voir l’adresse distante comme `127.0.0.1`. Pour éviter d’écraser une bonne IP signalée par le client,
les adresses distantes loopback sont ignorées.

## Consommateurs

### Onglet Instances macOS

L’application macOS affiche la sortie de `system-presence` et applique un petit indicateur
d’état (Active/Idle/Stale) selon l’ancienneté de la dernière mise à jour.

## Conseils de débogage

- Pour voir la liste brute, appelez `system-presence` sur le Gateway.
- Si vous voyez des doublons :
  - confirmez que les clients envoient un `client.instanceId` stable lors de la poignée de main
  - confirmez que les balises périodiques utilisent le même `instanceId`
  - vérifiez si l’entrée dérivée de la connexion n’a pas d’`instanceId` (les doublons sont attendus)

## Associé

- [Indicateurs de saisie](/fr/concepts/typing-indicators)
- [Streaming et segmentation](/fr/concepts/streaming)
