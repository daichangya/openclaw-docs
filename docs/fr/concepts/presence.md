---
read_when:
    - Débogage de l’onglet Instances
    - Investigation des lignes d’instance dupliquées ou obsolètes
    - Modification de la connexion WS de la passerelle ou des balises d’événement système
summary: Comment les entrées de présence OpenClaw sont produites, fusionnées et affichées
title: Présence
x-i18n:
    generated_at: "2026-04-05T12:40:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a004a1f87be08699c1b2cba97cad8678ce5e27baa425f59eaa18006fdcff26e7
    source_path: concepts/presence.md
    workflow: 15
---

# Présence

La « présence » OpenClaw est une vue légère, best-effort de :

- la **passerelle** elle-même, et
- des **clients connectés à la passerelle** (app Mac, WebChat, CLI, etc.)

La présence est utilisée principalement pour afficher l’onglet **Instances** de l’app macOS et pour fournir une visibilité rapide aux opérateurs.

## Champs de présence (ce qui s’affiche)

Les entrées de présence sont des objets structurés avec des champs tels que :

- `instanceId` (facultatif mais fortement recommandé) : identité client stable (généralement `connect.client.instanceId`)
- `host` : nom d’hôte lisible par l’humain
- `ip` : adresse IP best-effort
- `version` : chaîne de version du client
- `deviceFamily` / `modelIdentifier` : indications matérielles
- `mode` : `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds` : « secondes depuis la dernière saisie utilisateur » (si connu)
- `reason` : `self`, `connect`, `node-connected`, `periodic`, ...
- `ts` : horodatage de la dernière mise à jour (ms depuis l’époque Unix)

## Producteurs (origine de la présence)

Les entrées de présence sont produites par plusieurs sources et **fusionnées**.

### 1) Entrée propre de la passerelle

La passerelle initialise toujours une entrée « self » au démarrage afin que les interfaces affichent l’hôte de la passerelle même avant qu’un client ne se connecte.

### 2) Connexion WebSocket

Chaque client WS commence par une requête `connect`. Après une poignée de main réussie, la passerelle insère ou met à jour une entrée de présence pour cette connexion.

#### Pourquoi les commandes CLI ponctuelles n’apparaissent pas

La CLI se connecte souvent pour des commandes brèves et ponctuelles. Pour éviter d’encombrer la liste Instances, `client.mode === "cli"` n’est **pas** transformé en entrée de présence.

### 3) Balises `system-event`

Les clients peuvent envoyer des balises périodiques plus riches via la méthode `system-event`. L’app Mac l’utilise pour signaler le nom d’hôte, l’IP et `lastInputSeconds`.

### 4) Connexions de nœuds (role: node)

Lorsqu’un nœud se connecte via le WebSocket de la passerelle avec `role: node`, la passerelle insère ou met à jour une entrée de présence pour ce nœud (même flux que pour les autres clients WS).

## Règles de fusion + déduplication (pourquoi `instanceId` compte)

Les entrées de présence sont stockées dans une unique map en mémoire :

- Les entrées sont indexées par une **clé de présence**.
- La meilleure clé est un `instanceId` stable (issu de `connect.client.instanceId`) qui survit aux redémarrages.
- Les clés ne tiennent pas compte de la casse.

Si un client se reconnecte sans `instanceId` stable, il peut apparaître comme une ligne **dupliquée**.

## TTL et taille bornée

La présence est volontairement éphémère :

- **TTL :** les entrées âgées de plus de 5 minutes sont supprimées
- **Nombre maximal d’entrées :** 200 (les plus anciennes sont supprimées en premier)

Cela permet de conserver une liste fraîche et d’éviter une croissance mémoire illimitée.

## Réserve sur le mode distant/tunnel (IP loopback)

Lorsqu’un client se connecte via un tunnel SSH / une redirection de port locale, la passerelle peut voir l’adresse distante comme `127.0.0.1`. Pour éviter d’écraser une bonne IP signalée par le client, les adresses distantes loopback sont ignorées.

## Consommateurs

### Onglet Instances macOS

L’app macOS affiche la sortie de `system-presence` et applique un petit indicateur d’état (Active/Idle/Stale) en fonction de l’ancienneté de la dernière mise à jour.

## Conseils de débogage

- Pour voir la liste brute, appelez `system-presence` sur la passerelle.
- Si vous voyez des doublons :
  - confirmez que les clients envoient un `client.instanceId` stable dans la poignée de main
  - confirmez que les balises périodiques utilisent le même `instanceId`
  - vérifiez si l’entrée dérivée de la connexion n’a pas de `instanceId` (les doublons sont alors attendus)
