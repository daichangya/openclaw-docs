---
read_when:
    - Vous voulez connecter OpenClaw à des canaux IRC ou à des messages privés
    - Vous configurez des listes d’autorisation IRC, des stratégies de groupe ou le filtrage par mention
summary: Configuration du plugin IRC, contrôles d’accès et dépannage
title: IRC
x-i18n:
    generated_at: "2026-04-23T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Utilisez IRC quand vous voulez OpenClaw dans des canaux classiques (`#room`) et des messages privés.
IRC est livré comme un plugin intégré, mais il se configure dans la configuration principale sous `channels.irc`.

## Démarrage rapide

1. Activez la configuration IRC dans `~/.openclaw/openclaw.json`.
2. Définissez au minimum :

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Préférez un serveur IRC privé pour la coordination du bot. Si vous utilisez intentionnellement un réseau IRC public, les choix courants incluent Libera.Chat, OFTC et Snoonet. Évitez les canaux publics prévisibles pour le trafic de coordination du bot ou de l’essaim.

3. Démarrez/redémarrez le Gateway :

```bash
openclaw gateway run
```

## Paramètres de sécurité par défaut

- `channels.irc.dmPolicy` vaut par défaut `"pairing"`.
- `channels.irc.groupPolicy` vaut par défaut `"allowlist"`.
- Avec `groupPolicy="allowlist"`, définissez `channels.irc.groups` pour définir les canaux autorisés.
- Utilisez TLS (`channels.irc.tls=true`) sauf si vous acceptez intentionnellement un transport en clair.

## Contrôle d’accès

Il existe deux « barrières » distinctes pour les canaux IRC :

1. **Accès au canal** (`groupPolicy` + `groups`) : si le bot accepte ou non les messages d’un canal.
2. **Accès de l’expéditeur** (`groupAllowFrom` / `groups["#channel"].allowFrom` par canal) : qui est autorisé à déclencher le bot dans ce canal.

Clés de configuration :

- Liste d’autorisation des MP (accès de l’expéditeur en MP) : `channels.irc.allowFrom`
- Liste d’autorisation des expéditeurs de groupe (accès de l’expéditeur dans le canal) : `channels.irc.groupAllowFrom`
- Contrôles par canal (canal + expéditeur + règles de mention) : `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` autorise les canaux non configurés (**tout en restant soumis par défaut au filtrage par mention**)

Les entrées de liste d’autorisation doivent utiliser des identités d’expéditeur stables (`nick!user@host`).
La correspondance sur un simple pseudo est mutable et n’est activée que lorsque `channels.irc.dangerouslyAllowNameMatching: true`.

### Piège courant : `allowFrom` est pour les MP, pas pour les canaux

Si vous voyez des logs comme :

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…cela signifie que l’expéditeur n’était pas autorisé pour les messages de **groupe/canal**. Corrigez cela en :

- définissant `channels.irc.groupAllowFrom` (global pour tous les canaux), ou
- définissant des listes d’autorisation d’expéditeurs par canal : `channels.irc.groups["#channel"].allowFrom`

Exemple (autoriser n’importe qui dans `#tuirc-dev` à parler au bot) :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Déclenchement des réponses (mentions)

Même si un canal est autorisé (via `groupPolicy` + `groups`) et que l’expéditeur est autorisé, OpenClaw applique par défaut un **filtrage par mention** dans les contextes de groupe.

Cela signifie que vous pouvez voir des logs comme `drop channel … (missing-mention)` sauf si le message inclut un motif de mention correspondant au bot.

Pour que le bot réponde dans un canal IRC **sans nécessiter de mention**, désactivez le filtrage par mention pour ce canal :

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ou, pour autoriser **tous** les canaux IRC (sans liste d’autorisation par canal) et quand même répondre sans mentions :

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Note de sécurité (recommandée pour les canaux publics)

Si vous autorisez `allowFrom: ["*"]` dans un canal public, n’importe qui peut solliciter le bot.
Pour réduire le risque, restreignez les outils pour ce canal.

### Les mêmes outils pour tout le monde dans le canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Des outils différents selon l’expéditeur (le propriétaire a plus de pouvoir)

Utilisez `toolsBySender` pour appliquer une politique plus stricte à `"*"` et une politique plus souple à votre pseudo :

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Remarques :

- Les clés `toolsBySender` doivent utiliser `id:` pour les valeurs d’identité d’expéditeur IRC :
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` pour une correspondance plus stricte.
- Les anciennes clés sans préfixe sont toujours acceptées et mises en correspondance comme `id:` uniquement.
- La première politique d’expéditeur correspondante l’emporte ; `"*"` est le repli générique.

Pour en savoir plus sur l’accès de groupe vs le filtrage par mention (et leur interaction), voir : [/channels/groups](/fr/channels/groups).

## NickServ

Pour vous identifier auprès de NickServ après la connexion :

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Enregistrement facultatif à usage unique lors de la connexion :

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Désactivez `register` une fois le pseudo enregistré pour éviter des tentatives `REGISTER` répétées.

## Variables d’environnement

Le compte par défaut prend en charge :

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (séparés par des virgules)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` ne peut pas être défini depuis un `.env` d’espace de travail ; voir [Fichiers `.env` d’espace de travail](/fr/gateway/security).

## Dépannage

- Si le bot se connecte mais ne répond jamais dans les canaux, vérifiez `channels.irc.groups` **et** si le filtrage par mention rejette les messages (`missing-mention`). Si vous voulez qu’il réponde sans ping, définissez `requireMention:false` pour le canal.
- Si la connexion échoue, vérifiez la disponibilité du pseudo et le mot de passe du serveur.
- Si TLS échoue sur un réseau personnalisé, vérifiez l’hôte/le port et la configuration du certificat.

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification en MP et flux de Pairing
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
