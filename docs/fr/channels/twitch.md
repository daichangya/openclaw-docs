---
read_when:
    - Configurer l'intégration du chat Twitch pour OpenClaw
summary: Configuration et mise en place du bot de discussion Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-05T12:36:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Prise en charge du chat Twitch via connexion IRC. OpenClaw se connecte comme utilisateur Twitch (compte bot) pour recevoir et envoyer des messages dans les canaux.

## Plugin intégré

Twitch est livré comme plugin intégré dans les versions actuelles d'OpenClaw, donc les builds
packagés normaux ne nécessitent pas d'installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Twitch, installez-le
manuellement :

Installer via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/twitch
```

Extraction locale (lors de l'exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Détails : [Plugins](/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Twitch est disponible.
   - Les versions packagées actuelles d'OpenClaw l'intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l'ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Twitch dédié pour le bot (ou utilisez un compte existant).
3. Générez des identifiants : [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Sélectionnez **Bot Token**
   - Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
   - Copiez le **Client ID** et l'**Access Token**
4. Trouvez votre ID utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configurez le jeton :
   - Variable d'environnement : `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (compte par défaut uniquement)
   - Ou configuration : `channels.twitch.accessToken`
   - Si les deux sont définis, la configuration a priorité (le repli sur variable d'environnement ne s'applique qu'au compte par défaut).
6. Démarrez la gateway.

**⚠️ Important :** ajoutez un contrôle d'accès (`allowFrom` ou `allowedRoles`) pour empêcher des utilisateurs non autorisés de déclencher le bot. `requireMention` est défini sur `true` par défaut.

Configuration minimale :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Ce que c'est

- Un canal Twitch détenu par la gateway.
- Routage déterministe : les réponses reviennent toujours vers Twitch.
- Chaque compte correspond à une clé de session isolée `agent:<agentId>:twitch:<accountName>`.
- `username` est le compte du bot (celui qui s'authentifie), `channel` est le salon de discussion à rejoindre.

## Configuration détaillée

### Générer des identifiants

Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

- Sélectionnez **Bot Token**
- Vérifiez que les portées `chat:read` et `chat:write` sont sélectionnées
- Copiez le **Client ID** et l'**Access Token**

Aucun enregistrement manuel d'application n'est nécessaire. Les jetons expirent après plusieurs heures.

### Configurer le bot

**Variable d'environnement (compte par défaut uniquement) :**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Ou configuration :**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Si la variable d'environnement et la configuration sont toutes deux définies, la configuration a priorité.

### Contrôle d'accès (recommandé)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Préférez `allowFrom` pour une liste d'autorisation stricte. Utilisez plutôt `allowedRoles` si vous souhaitez un accès basé sur les rôles.

**Rôles disponibles :** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Pourquoi des IDs utilisateur ?** Les noms d'utilisateur peuvent changer, ce qui permet l'usurpation. Les IDs utilisateur sont permanents.

Trouvez votre ID utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (convertir votre nom d'utilisateur Twitch en ID)

## Actualisation du jeton (facultatif)

Les jetons provenant de [Twitch Token Generator](https://twitchtokengenerator.com/) ne peuvent pas être actualisés automatiquement : régénérez-les lorsqu'ils expirent.

Pour une actualisation automatique des jetons, créez votre propre application Twitch dans [Twitch Developer Console](https://dev.twitch.tv/console) et ajoutez à la configuration :

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Le bot actualise automatiquement les jetons avant expiration et consigne les événements d'actualisation.

## Prise en charge multi-comptes

Utilisez `channels.twitch.accounts` avec des jetons par compte. Voir [`gateway/configuration`](/gateway/configuration) pour le modèle partagé.

Exemple (un compte bot dans deux canaux) :

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Remarque :** chaque compte a besoin de son propre jeton (un jeton par canal).

## Contrôle d'accès

### Restrictions basées sur les rôles

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Liste d'autorisation par ID utilisateur (le plus sûr)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Accès basé sur les rôles (alternative)

`allowFrom` est une liste d'autorisation stricte. Lorsqu'il est défini, seuls ces IDs utilisateur sont autorisés.
Si vous voulez un accès basé sur les rôles, laissez `allowFrom` non défini et configurez plutôt `allowedRoles` :

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Désactiver l'exigence de @mention

Par défaut, `requireMention` vaut `true`. Pour le désactiver et répondre à tous les messages :

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Dépannage

Exécutez d'abord les commandes de diagnostic :

```bash
openclaw doctor
openclaw channels status --probe
```

### Le bot ne répond pas aux messages

**Vérifiez le contrôle d'accès :** assurez-vous que votre ID utilisateur est dans `allowFrom`, ou supprimez temporairement
`allowFrom` et définissez `allowedRoles: ["all"]` pour tester.

**Vérifiez que le bot est dans le canal :** le bot doit rejoindre le canal spécifié dans `channel`.

### Problèmes de jeton

**« Failed to connect » ou erreurs d'authentification :**

- Vérifiez que `accessToken` correspond à la valeur du jeton d'accès OAuth (commence généralement par le préfixe `oauth:`)
- Vérifiez que le jeton possède les portées `chat:read` et `chat:write`
- Si vous utilisez l'actualisation de jeton, vérifiez que `clientSecret` et `refreshToken` sont définis

### L'actualisation du jeton ne fonctionne pas

**Vérifiez les journaux pour les événements d'actualisation :**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Si vous voyez « token refresh disabled (no refresh token) » :

- Assurez-vous que `clientSecret` est fourni
- Assurez-vous que `refreshToken` est fourni

## Configuration

**Configuration du compte :**

- `username` - nom d'utilisateur du bot
- `accessToken` - jeton d'accès OAuth avec `chat:read` et `chat:write`
- `clientId` - ID client Twitch (depuis Token Generator ou votre application)
- `channel` - canal à rejoindre (obligatoire)
- `enabled` - activer ce compte (par défaut : `true`)
- `clientSecret` - facultatif : pour l'actualisation automatique du jeton
- `refreshToken` - facultatif : pour l'actualisation automatique du jeton
- `expiresIn` - expiration du jeton en secondes
- `obtainmentTimestamp` - horodatage d'obtention du jeton
- `allowFrom` - liste d'autorisation par ID utilisateur
- `allowedRoles` - contrôle d'accès basé sur les rôles (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - exiger une @mention (par défaut : `true`)

**Options du fournisseur :**

- `channels.twitch.enabled` - activer/désactiver le démarrage du canal
- `channels.twitch.username` - nom d'utilisateur du bot (configuration simplifiée à compte unique)
- `channels.twitch.accessToken` - jeton d'accès OAuth (configuration simplifiée à compte unique)
- `channels.twitch.clientId` - ID client Twitch (configuration simplifiée à compte unique)
- `channels.twitch.channel` - canal à rejoindre (configuration simplifiée à compte unique)
- `channels.twitch.accounts.<accountName>` - configuration multi-comptes (tous les champs de compte ci-dessus)

Exemple complet :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Actions d'outil

L'agent peut appeler `twitch` avec l'action :

- `send` - envoyer un message à un canal

Exemple :

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sécurité et exploitation

- **Traitez les jetons comme des mots de passe** - ne validez jamais des jetons dans git
- **Utilisez l'actualisation automatique des jetons** pour les bots de longue durée
- **Utilisez des listes d'autorisation par ID utilisateur** plutôt que des noms d'utilisateur pour le contrôle d'accès
- **Surveillez les journaux** pour les événements d'actualisation de jeton et l'état de la connexion
- **Limitez au minimum les portées des jetons** - demandez uniquement `chat:read` et `chat:write`
- **En cas de blocage** : redémarrez la gateway après avoir confirmé qu'aucun autre processus ne possède la session

## Limites

- **500 caractères** par message (segmentation automatique aux limites des mots)
- Le markdown est supprimé avant la segmentation
- Pas de limitation de débit (utilise les limites de débit intégrées de Twitch)

## Lié

- [Vue d'ensemble des canaux](/channels) — tous les canaux pris en charge
- [Jumelage](/channels/pairing) — authentification en message privé et flux de jumelage
- [Groupes](/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/gateway/security) — modèle d'accès et durcissement
