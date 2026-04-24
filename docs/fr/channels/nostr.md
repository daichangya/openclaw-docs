---
read_when:
    - Vous souhaitez qu’OpenClaw reçoive des DM via Nostr
    - Vous configurez une messagerie décentralisée
summary: Canal DM Nostr via des messages chiffrés NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-24T07:00:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**Statut :** Plugin inclus optionnel (désactivé par défaut tant qu’il n’est pas configuré).

Nostr est un protocole décentralisé de réseau social. Ce canal permet à OpenClaw de recevoir et de répondre à des messages directs (DM) chiffrés via NIP-04.

## Plugin inclus

Les versions actuelles d’OpenClaw incluent Nostr comme Plugin inclus ; les builds packagés normaux ne nécessitent donc pas d’installation séparée.

### Installations anciennes/personnalisées

- L’onboarding (`openclaw onboard`) et `openclaw channels add` continuent d’afficher Nostr depuis le catalogue partagé des canaux.
- Si votre build exclut Nostr inclus, installez-le manuellement.

```bash
openclaw plugins install @openclaw/nostr
```

Utilisez un checkout local (workflows de développement) :

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Redémarrez le Gateway après avoir installé ou activé des plugins.

### Configuration non interactive

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Utilisez `--use-env` pour conserver `NOSTR_PRIVATE_KEY` dans l’environnement au lieu de stocker la clé dans la configuration.

## Configuration rapide

1. Générez une paire de clés Nostr (si nécessaire) :

```bash
# En utilisant nak
nak key generate
```

2. Ajoutez-la à la configuration :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exportez la clé :

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Redémarrez le Gateway.

## Référence de configuration

| Clé          | Type     | Par défaut                                  | Description                              |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------- |
| `privateKey` | string   | requis                                      | Clé privée au format `nsec` ou hex       |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL des relais (WebSocket)               |
| `dmPolicy`   | string   | `pairing`                                   | Politique d’accès DM                     |
| `allowFrom`  | string[] | `[]`                                        | Clés publiques d’expéditeurs autorisées  |
| `enabled`    | boolean  | `true`                                      | Activer/désactiver le canal              |
| `name`       | string   | -                                           | Nom d’affichage                          |
| `profile`    | object   | -                                           | Métadonnées de profil NIP-01             |

## Métadonnées de profil

Les données de profil sont publiées comme un événement NIP-01 `kind:0`. Vous pouvez les gérer depuis l’interface Control UI (Channels -> Nostr -> Profile) ou les définir directement dans la configuration.

Exemple :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot DM assistant personnel",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Remarques :

- Les URL du profil doivent utiliser `https://`.
- L’import depuis des relais fusionne les champs et préserve les surcharges locales.

## Contrôle d’accès

### Politiques DM

- **pairing** (par défaut) : les expéditeurs inconnus reçoivent un code de pairing.
- **allowlist** : seules les clés publiques dans `allowFrom` peuvent envoyer des DM.
- **open** : DM entrants publics (nécessite `allowFrom: ["*"]`).
- **disabled** : ignorer les DM entrants.

Remarques sur l’application :

- Les signatures des événements entrants sont vérifiées avant la politique d’expéditeur et le déchiffrement NIP-04, afin que les événements falsifiés soient rejetés rapidement.
- Les réponses de pairing sont envoyées sans traiter le corps original du DM.
- Les DM entrants sont limités en débit et les charges utiles trop volumineuses sont ignorées avant le déchiffrement.

### Exemple de liste d’autorisation

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formats de clés

Formats acceptés :

- **Clé privée :** `nsec...` ou hex de 64 caractères
- **Clés publiques (`allowFrom`) :** `npub...` ou hex

## Relais

Par défaut : `relay.damus.io` et `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Conseils :

- Utilisez 2 à 3 relais pour la redondance.
- Évitez trop de relais (latence, duplication).
- Les relais payants peuvent améliorer la fiabilité.
- Les relais locaux conviennent pour les tests (`ws://localhost:7777`).

## Prise en charge du protocole

| NIP    | Statut    | Description                                |
| ------ | --------- | ------------------------------------------ |
| NIP-01 | Pris en charge | Format d’événement de base + métadonnées de profil |
| NIP-04 | Pris en charge | DM chiffrés (`kind:4`)                     |
| NIP-17 | Prévu     | DM encapsulés                              |
| NIP-44 | Prévu     | Chiffrement versionné                      |

## Tests

### Relais local

```bash
# Démarrer strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Test manuel

1. Notez la clé publique du bot (npub) dans les journaux.
2. Ouvrez un client Nostr (Damus, Amethyst, etc.).
3. Envoyez un DM à la clé publique du bot.
4. Vérifiez la réponse.

## Dépannage

### Aucun message reçu

- Vérifiez que la clé privée est valide.
- Assurez-vous que les URL des relais sont joignables et utilisent `wss://` (ou `ws://` en local).
- Confirmez que `enabled` n’est pas défini sur `false`.
- Consultez les journaux du Gateway pour détecter les erreurs de connexion aux relais.

### Aucune réponse envoyée

- Vérifiez que le relais accepte les écritures.
- Vérifiez la connectivité sortante.
- Surveillez les limitations de débit des relais.

### Réponses en double

- C’est attendu lors de l’utilisation de plusieurs relais.
- Les messages sont dédupliqués par ID d’événement ; seule la première livraison déclenche une réponse.

## Sécurité

- Ne validez jamais de clés privées dans le dépôt.
- Utilisez des variables d’environnement pour les clés.
- Envisagez `allowlist` pour les bots de production.
- Les signatures sont vérifiées avant la politique d’expéditeur, et la politique d’expéditeur est appliquée avant le déchiffrement ; ainsi, les événements falsifiés sont rejetés rapidement et les expéditeurs inconnus ne peuvent pas imposer un travail cryptographique complet.

## Limitations (MVP)

- Messages directs uniquement (pas de conversations de groupe).
- Aucune pièce jointe multimédia.
- NIP-04 uniquement (l’encapsulation NIP-17 est prévue).

## Articles connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification DM et flux de pairing
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
