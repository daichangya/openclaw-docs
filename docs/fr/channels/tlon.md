---
read_when:
    - Travail sur les fonctionnalités du canal Tlon/Urbit
summary: Statut de prise en charge, capacités et configuration de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-05T12:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon est une messagerie décentralisée construite sur Urbit. OpenClaw se connecte à votre vaisseau Urbit et peut répondre aux messages privés et aux messages de discussion de groupe. Les réponses dans les groupes nécessitent une mention @ par défaut et peuvent être davantage restreintes via des listes d’autorisation.

Statut : plugin intégré. Les messages privés, les mentions de groupe, les réponses en fil, le formatage de texte enrichi et les envois d’images sont pris en charge. Les réactions et les sondages ne sont pas encore pris en charge.

## Plugin intégré

Tlon est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc les builds packagés normaux n’ont pas besoin d’une installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Tlon, installez-le manuellement :

Installation via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/tlon
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Détails : [Plugins](/tools/plugin)

## Configuration

1. Assurez-vous que le plugin Tlon est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Rassemblez l’URL de votre vaisseau et votre code de connexion.
3. Configurez `channels.tlon`.
4. Redémarrez la passerelle.
5. Envoyez un message privé au bot ou mentionnez-le dans un canal de groupe.

Configuration minimale (compte unique) :

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommandé : votre vaisseau, toujours autorisé
    },
  },
}
```

## Vaisseaux privés/LAN

Par défaut, OpenClaw bloque les noms d’hôte et plages d’IP privés/internes pour la protection SSRF.
Si votre vaisseau s’exécute sur un réseau privé (localhost, IP LAN ou nom d’hôte interne),
vous devez explicitement l’autoriser :

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Cela s’applique aux URL telles que :

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Activez ceci uniquement si vous faites confiance à votre réseau local. Ce paramètre désactive les protections SSRF pour les requêtes vers l’URL de votre vaisseau.

## Canaux de groupe

La découverte automatique est activée par défaut. Vous pouvez également épingler des canaux manuellement :

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Désactiver la découverte automatique :

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Contrôle d’accès

Liste d’autorisation des messages privés (vide = aucun message privé autorisé, utilisez `ownerShip` pour le flux d’approbation) :

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorisation des groupes (restreinte par défaut) :

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Système de propriétaire et d’approbation

Définissez un vaisseau propriétaire pour recevoir les demandes d’approbation lorsque des utilisateurs non autorisés tentent d’interagir :

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Le vaisseau propriétaire est **automatiquement autorisé partout** — les invitations en message privé sont automatiquement acceptées et les messages de canal sont toujours autorisés. Vous n’avez pas besoin d’ajouter le propriétaire à `dmAllowlist` ou à `defaultAuthorizedShips`.

Lorsqu’il est défini, le propriétaire reçoit des notifications en message privé pour :

- les demandes de messages privés provenant de vaisseaux absents de la liste d’autorisation
- les mentions dans des canaux sans autorisation
- les demandes d’invitation à des groupes

## Paramètres d’acceptation automatique

Accepter automatiquement les invitations en message privé (pour les vaisseaux de `dmAllowlist`) :

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accepter automatiquement les invitations de groupe :

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Cibles de distribution (CLI/cron)

Utilisez-les avec `openclaw message send` ou une distribution cron :

- Message privé : `~sampel-palnet` ou `dm/~sampel-palnet`
- Groupe : `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill intégré

Le plugin Tlon inclut un Skill intégré ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)) qui fournit un accès CLI aux opérations Tlon :

- **Contacts** : obtenir/mettre à jour des profils, lister les contacts
- **Canaux** : lister, créer, publier des messages, récupérer l’historique
- **Groupes** : lister, créer, gérer les membres
- **Messages privés** : envoyer des messages, réagir aux messages
- **Réactions** : ajouter/supprimer des réactions emoji aux publications et messages privés
- **Paramètres** : gérer les autorisations du plugin via des commandes slash

Le Skill est automatiquement disponible lorsque le plugin est installé.

## Capacités

| Fonctionnalité | Statut                                  |
| -------------- | --------------------------------------- |
| Messages privés | ✅ Pris en charge                       |
| Groupes/canaux | ✅ Pris en charge (filtrage par mention par défaut) |
| Fils           | ✅ Pris en charge (réponses automatiques dans le fil) |
| Texte enrichi  | ✅ Markdown converti au format Tlon     |
| Images         | ✅ Envoyées vers le stockage Tlon       |
| Réactions      | ✅ Via le [Skill intégré](#bundled-skill) |
| Sondages       | ❌ Pas encore pris en charge            |
| Commandes natives | ✅ Pris en charge (propriétaire uniquement par défaut) |

## Dépannage

Commencez par cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Échecs courants :

- **Messages privés ignorés** : expéditeur absent de `dmAllowlist` et aucun `ownerShip` configuré pour le flux d’approbation.
- **Messages de groupe ignorés** : canal non découvert ou expéditeur non autorisé.
- **Erreurs de connexion** : vérifiez que l’URL du vaisseau est joignable ; activez `allowPrivateNetwork` pour les vaisseaux locaux.
- **Erreurs d’authentification** : vérifiez que le code de connexion est actuel (les codes tournent).

## Référence de configuration

Configuration complète : [Configuration](/gateway/configuration)

Options du fournisseur :

- `channels.tlon.enabled` : activer/désactiver le démarrage du canal.
- `channels.tlon.ship` : nom du vaisseau Urbit du bot (par ex. `~sampel-palnet`).
- `channels.tlon.url` : URL du vaisseau (par ex. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code` : code de connexion du vaisseau.
- `channels.tlon.allowPrivateNetwork` : autoriser les URL localhost/LAN (contournement SSRF).
- `channels.tlon.ownerShip` : vaisseau propriétaire pour le système d’approbation (toujours autorisé).
- `channels.tlon.dmAllowlist` : vaisseaux autorisés à envoyer des messages privés (vide = aucun).
- `channels.tlon.autoAcceptDmInvites` : accepter automatiquement les messages privés provenant de vaisseaux autorisés.
- `channels.tlon.autoAcceptGroupInvites` : accepter automatiquement toutes les invitations de groupe.
- `channels.tlon.autoDiscoverChannels` : découvrir automatiquement les canaux de groupe (par défaut : true).
- `channels.tlon.groupChannels` : nids de canaux épinglés manuellement.
- `channels.tlon.defaultAuthorizedShips` : vaisseaux autorisés pour tous les canaux.
- `channels.tlon.authorization.channelRules` : règles d’autorisation par canal.
- `channels.tlon.showModelSignature` : ajouter le nom du modèle aux messages.

## Remarques

- Les réponses dans les groupes nécessitent une mention (par ex. `~your-bot-ship`) pour répondre.
- Réponses en fil : si le message entrant est dans un fil, OpenClaw répond dans le fil.
- Texte enrichi : le formatage Markdown (gras, italique, code, titres, listes) est converti au format natif de Tlon.
- Images : les URL sont envoyées vers le stockage Tlon et intégrées sous forme de blocs d’image.

## Lié

- [Vue d’ensemble des canaux](/channels) — tous les canaux pris en charge
- [Appairage](/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/gateway/security) — modèle d’accès et durcissement
