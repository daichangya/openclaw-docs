---
read_when:
    - Configuration de l’intégration du chat Twitch pour OpenClaw
summary: Configuration et configuration initiale du bot de chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T07:02:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Prise en charge du chat Twitch via une connexion IRC. OpenClaw se connecte en tant qu’utilisateur Twitch (compte bot) pour recevoir et envoyer des messages dans les canaux.

## Plugin inclus

Twitch est fourni comme plugin inclus dans les versions actuelles d’OpenClaw, donc les builds
packagés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une ancienne build ou une installation personnalisée qui exclut Twitch, installez-le
manuellement :

Installation via CLI (registre npm) :

```bash
openclaw plugins install @openclaw/twitch
```

Extraction locale (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Twitch est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Créez un compte Twitch dédié pour le bot (ou utilisez un compte existant).
3. Générez les identifiants : [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Sélectionnez **Bot Token**
   - Vérifiez que les scopes `chat:read` et `chat:write` sont sélectionnés
   - Copiez le **Client ID** et le **Access Token**
4. Trouvez votre identifiant utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configurez le jeton :
   - Variable d’environnement : `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (compte par défaut uniquement)
   - Ou configuration : `channels.twitch.accessToken`
   - Si les deux sont définis, la configuration est prioritaire (le repli via variable d’environnement ne s’applique qu’au compte par défaut).
6. Démarrez le gateway.

**⚠️ Important :** ajoutez un contrôle d’accès (`allowFrom` ou `allowedRoles`) pour empêcher des utilisateurs non autorisés de déclencher le bot. `requireMention` vaut `true` par défaut.

Configuration minimale :

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Compte Twitch du bot
      accessToken: "oauth:abc123...", // Jeton d’accès OAuth (ou utilisez la variable d’environnement OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID depuis Token Generator
      channel: "vevisk", // Canal Twitch dont rejoindre le chat (obligatoire)
      allowFrom: ["123456789"], // (recommandé) Votre identifiant utilisateur Twitch uniquement - obtenez-le sur https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Ce que c’est

- Un canal Twitch possédé par le Gateway.
- Routage déterministe : les réponses retournent toujours vers Twitch.
- Chaque compte correspond à une clé de session isolée `agent:<agentId>:twitch:<accountName>`.
- `username` est le compte du bot (qui s’authentifie), `channel` est le salon de discussion à rejoindre.

## Configuration détaillée

### Générer les identifiants

Utilisez [Twitch Token Generator](https://twitchtokengenerator.com/) :

- Sélectionnez **Bot Token**
- Vérifiez que les scopes `chat:read` et `chat:write` sont sélectionnés
- Copiez le **Client ID** et le **Access Token**

Aucun enregistrement manuel d’application n’est nécessaire. Les jetons expirent après plusieurs heures.

### Configurer le bot

**Variable d’environnement (compte par défaut uniquement) :**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Ou configuration :**

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

Si la variable d’environnement et la configuration sont toutes deux définies, la configuration est prioritaire.

### Contrôle d’accès (recommandé)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommandé) Votre identifiant utilisateur Twitch uniquement
    },
  },
}
```

Préférez `allowFrom` pour une liste d’autorisation stricte. Utilisez plutôt `allowedRoles` si vous souhaitez un accès basé sur les rôles.

**Rôles disponibles :** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Pourquoi des identifiants utilisateur ?** Les noms d’utilisateur peuvent changer, ce qui permet l’usurpation d’identité. Les identifiants utilisateur sont permanents.

Trouvez votre identifiant utilisateur Twitch : [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (convertissez votre nom d’utilisateur Twitch en identifiant)

## Actualisation de jeton (facultatif)

Les jetons de [Twitch Token Generator](https://twitchtokengenerator.com/) ne peuvent pas être actualisés automatiquement ; régénérez-les lorsqu’ils expirent.

Pour une actualisation automatique des jetons, créez votre propre application Twitch sur [Twitch Developer Console](https://dev.twitch.tv/console) et ajoutez à la configuration :

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

Le bot actualise automatiquement les jetons avant leur expiration et journalise les événements d’actualisation.

## Prise en charge de plusieurs comptes

Utilisez `channels.twitch.accounts` avec des jetons par compte. Voir [`gateway/configuration`](/fr/gateway/configuration) pour le modèle partagé.

Exemple (un compte bot dans deux canaux) :

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

**Remarque :** chaque compte a besoin de son propre jeton (un jeton par canal).

## Contrôle d’accès

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

### Liste d’autorisation par identifiant utilisateur (le plus sûr)

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

`allowFrom` est une liste d’autorisation stricte. Lorsqu’elle est définie, seuls ces identifiants utilisateur sont autorisés.
Si vous souhaitez un accès basé sur les rôles, laissez `allowFrom` non défini et configurez plutôt `allowedRoles` :

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

### Désactiver l’exigence de @mention

Par défaut, `requireMention` vaut `true`. Pour la désactiver et répondre à tous les messages :

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

Commencez par exécuter les commandes de diagnostic :

```bash
openclaw doctor
openclaw channels status --probe
```

### Le bot ne répond pas aux messages

**Vérifiez le contrôle d’accès :** assurez-vous que votre identifiant utilisateur figure dans `allowFrom`, ou supprimez temporairement
`allowFrom` et définissez `allowedRoles: ["all"]` pour tester.

**Vérifiez que le bot est dans le canal :** le bot doit rejoindre le canal spécifié dans `channel`.

### Problèmes de jeton

**« Failed to connect » ou erreurs d’authentification :**

- Vérifiez que `accessToken` est bien la valeur du jeton d’accès OAuth (commence généralement par le préfixe `oauth:`)
- Vérifiez que le jeton possède les scopes `chat:read` et `chat:write`
- Si vous utilisez l’actualisation de jeton, vérifiez que `clientSecret` et `refreshToken` sont définis

### L’actualisation du jeton ne fonctionne pas

**Vérifiez les journaux pour les événements d’actualisation :**

```text
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Si vous voyez « token refresh disabled (no refresh token) » :

- Assurez-vous que `clientSecret` est fourni
- Assurez-vous que `refreshToken` est fourni

## Configuration

**Configuration du compte :**

- `username` - Nom d’utilisateur du bot
- `accessToken` - Jeton d’accès OAuth avec `chat:read` et `chat:write`
- `clientId` - Twitch Client ID (depuis Token Generator ou votre application)
- `channel` - Canal à rejoindre (obligatoire)
- `enabled` - Active ce compte (par défaut : `true`)
- `clientSecret` - Facultatif : pour l’actualisation automatique du jeton
- `refreshToken` - Facultatif : pour l’actualisation automatique du jeton
- `expiresIn` - Expiration du jeton en secondes
- `obtainmentTimestamp` - Horodatage d’obtention du jeton
- `allowFrom` - Liste d’autorisation par identifiant utilisateur
- `allowedRoles` - Contrôle d’accès basé sur les rôles (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Exige une @mention (par défaut : `true`)

**Options du fournisseur :**

- `channels.twitch.enabled` - Activer/désactiver le démarrage du canal
- `channels.twitch.username` - Nom d’utilisateur du bot (configuration simplifiée à compte unique)
- `channels.twitch.accessToken` - Jeton d’accès OAuth (configuration simplifiée à compte unique)
- `channels.twitch.clientId` - Twitch Client ID (configuration simplifiée à compte unique)
- `channels.twitch.channel` - Canal à rejoindre (configuration simplifiée à compte unique)
- `channels.twitch.accounts.<accountName>` - Configuration multi-comptes (tous les champs de compte ci-dessus)

Exemple complet :

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

## Actions de l’outil

L’agent peut appeler `twitch` avec l’action :

- `send` - Envoyer un message à un canal

Exemple :

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Sécurité et opérations

- **Traitez les jetons comme des mots de passe** - Ne validez jamais de jetons dans git
- **Utilisez l’actualisation automatique des jetons** pour les bots exécutés sur de longues durées
- **Utilisez des listes d’autorisation par identifiant utilisateur** plutôt que des noms d’utilisateur pour le contrôle d’accès
- **Surveillez les journaux** pour les événements d’actualisation de jeton et l’état de connexion
- **Limitez les scopes des jetons au minimum** - Demandez uniquement `chat:read` et `chat:write`
- **Si vous êtes bloqué** : redémarrez le gateway après avoir confirmé qu’aucun autre processus ne possède la session

## Limites

- **500 caractères** par message (découpés automatiquement aux limites des mots)
- Le Markdown est supprimé avant le découpage
- Pas de limitation de débit (utilise les limites de débit intégrées de Twitch)

## Lié

- [Aperçu des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groups](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
