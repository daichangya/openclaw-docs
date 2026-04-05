---
read_when:
    - Vous souhaitez qu’OpenClaw reçoive des DMs via Nostr
    - Vous configurez une messagerie décentralisée
summary: Canal DM Nostr via des messages chiffrés NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-05T12:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82829ee66fbeb3367007af343797140049ea49f2e842a695fa56acea0c80728
    source_path: channels/nostr.md
    workflow: 15
---

# Nostr

**Statut :** plugin groupé facultatif (désactivé par défaut tant qu’il n’est pas configuré).

Nostr est un protocole décentralisé de réseau social. Ce canal permet à OpenClaw de recevoir et de répondre à des messages directs (DMs) chiffrés via NIP-04.

## Plugin groupé

Les versions actuelles d’OpenClaw livrent Nostr comme plugin groupé, donc les builds empaquetés normaux n’ont pas besoin d’une installation séparée.

### Installations anciennes/personnalisées

- L’onboarding (`openclaw onboard`) et `openclaw channels add` affichent toujours Nostr à partir du catalogue de canaux partagé.
- Si votre build exclut le plugin groupé Nostr, installez-le manuellement.

```bash
openclaw plugins install @openclaw/nostr
```

Utiliser une extraction locale (flux de développement) :

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Redémarrez la passerelle après avoir installé ou activé des plugins.

### Configuration non interactive

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Utilisez `--use-env` pour conserver `NOSTR_PRIVATE_KEY` dans l’environnement au lieu de stocker la clé dans la configuration.

## Configuration rapide

1. Générez une paire de clés Nostr (si nécessaire) :

```bash
# Using nak
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

4. Redémarrez la passerelle.

## Référence de configuration

| Clé          | Type     | Valeur par défaut                            | Description                               |
| ------------ | -------- | -------------------------------------------- | ----------------------------------------- |
| `privateKey` | string   | requis                                       | Clé privée au format `nsec` ou hexadécimal |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']`  | URL des relais (WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                    | Politique d’accès DM                      |
| `allowFrom`  | string[] | `[]`                                         | Clés publiques d’expéditeurs autorisés    |
| `enabled`    | boolean  | `true`                                       | Activer/désactiver le canal               |
| `name`       | string   | -                                            | Nom d’affichage                           |
| `profile`    | object   | -                                            | Métadonnées de profil NIP-01              |

## Métadonnées de profil

Les données de profil sont publiées comme événement NIP-01 `kind:0`. Vous pouvez les gérer depuis l’interface de contrôle (Canaux -> Nostr -> Profil) ou les définir directement dans la configuration.

Exemple :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

- Les URL de profil doivent utiliser `https://`.
- L’importation depuis les relais fusionne les champs et préserve les remplacements locaux.

## Contrôle d’accès

### Politiques DM

- **pairing** (par défaut) : les expéditeurs inconnus reçoivent un code de pairage.
- **allowlist** : seules les clés publiques dans `allowFrom` peuvent envoyer des DMs.
- **open** : DMs publics entrants (nécessite `allowFrom: ["*"]`).
- **disabled** : ignore les DMs entrants.

Remarques sur l’application :

- Les signatures des événements entrants sont vérifiées avant la politique d’expéditeur et le déchiffrement NIP-04, donc les événements falsifiés sont rejetés tôt.
- Les réponses de pairage sont envoyées sans traiter le corps du DM d’origine.
- Les DMs entrants sont limités en débit et les charges utiles surdimensionnées sont abandonnées avant le déchiffrement.

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

## Formats de clé

Formats acceptés :

- **Clé privée :** `nsec...` ou hexadécimal de 64 caractères
- **Clés publiques (`allowFrom`) :** `npub...` ou hexadécimal

## Relais

Valeurs par défaut : `relay.damus.io` et `nos.lol`.

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
- Évitez d’utiliser trop de relais (latence, duplication).
- Les relais payants peuvent améliorer la fiabilité.
- Les relais locaux conviennent pour les tests (`ws://localhost:7777`).

## Prise en charge du protocole

| NIP    | Statut    | Description                               |
| ------ | --------- | ----------------------------------------- |
| NIP-01 | Pris en charge | Format d’événement de base + métadonnées de profil |
| NIP-04 | Pris en charge | DMs chiffrés (`kind:4`)              |
| NIP-17 | Prévu     | DMs enveloppés                            |
| NIP-44 | Prévu     | Chiffrement versionné                     |

## Tests

### Relais local

```bash
# Start strfry
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

### Ne reçoit pas de messages

- Vérifiez que la clé privée est valide.
- Assurez-vous que les URL des relais sont accessibles et utilisent `wss://` (ou `ws://` en local).
- Confirmez que `enabled` n’est pas défini sur `false`.
- Vérifiez les journaux de la passerelle pour les erreurs de connexion aux relais.

### N’envoie pas de réponses

- Vérifiez que le relais accepte les écritures.
- Vérifiez la connectivité sortante.
- Surveillez les limites de débit des relais.

### Réponses en double

- Attendu lors de l’utilisation de plusieurs relais.
- Les messages sont dédupliqués par ID d’événement ; seule la première livraison déclenche une réponse.

## Sécurité

- Ne validez jamais de clés privées dans le dépôt.
- Utilisez des variables d’environnement pour les clés.
- Envisagez `allowlist` pour les bots de production.
- Les signatures sont vérifiées avant la politique d’expéditeur, et la politique d’expéditeur est appliquée avant le déchiffrement, donc les événements falsifiés sont rejetés tôt et les expéditeurs inconnus ne peuvent pas forcer un travail cryptographique complet.

## Limitations (MVP)

- Messages directs uniquement (pas de discussions de groupe).
- Pas de pièces jointes multimédias.
- NIP-04 uniquement (enveloppe-cadeau NIP-17 prévue).

## Lié

- [Vue d’ensemble des canaux](/channels) — tous les canaux pris en charge
- [Pairing](/channels/pairing) — flux d’authentification et de pairage des DMs
- [Groups](/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Channel Routing](/channels/channel-routing) — routage des sessions pour les messages
- [Security](/gateway/security) — modèle d’accès et durcissement
