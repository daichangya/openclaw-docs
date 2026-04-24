---
read_when:
    - Vous souhaitez connecter OpenClaw à des canaux IRC ou à des DM
    - Vous configurez les listes d’autorisation IRC, la politique de groupe ou le filtrage par mention
summary: Configuration du Plugin IRC, contrôles d’accès et dépannage
title: IRC
x-i18n:
    generated_at: "2026-04-24T07:00:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Utilisez IRC lorsque vous souhaitez utiliser OpenClaw dans des canaux classiques (`#room`) et des messages directs.
IRC est fourni sous forme de Plugin inclus, mais il se configure dans la configuration principale sous `channels.irc`.

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

Préférez un serveur IRC privé pour la coordination des bots. Si vous utilisez intentionnellement un réseau IRC public, les choix courants incluent Libera.Chat, OFTC et Snoonet. Évitez les canaux publics prévisibles pour le trafic de coordination des bots ou des essaims.

3. Démarrez/redémarrez le Gateway :

```bash
openclaw gateway run
```

## Paramètres de sécurité par défaut

- `channels.irc.dmPolicy` utilise par défaut `"pairing"`.
- `channels.irc.groupPolicy` utilise par défaut `"allowlist"`.
- Avec `groupPolicy="allowlist"`, définissez `channels.irc.groups` pour définir les canaux autorisés.
- Utilisez TLS (`channels.irc.tls=true`) sauf si vous acceptez intentionnellement un transport en clair.

## Contrôle d’accès

Il existe deux « barrières » distinctes pour les canaux IRC :

1. **Accès au canal** (`groupPolicy` + `groups`) : détermine si le bot accepte ou non des messages provenant d’un canal.
2. **Accès de l’expéditeur** (`groupAllowFrom` / `groups["#channel"].allowFrom` par canal) : détermine qui est autorisé à déclencher le bot dans ce canal.

Clés de configuration :

- Liste d’autorisation des DM (accès de l’expéditeur en DM) : `channels.irc.allowFrom`
- Liste d’autorisation des expéditeurs de groupe (accès de l’expéditeur dans le canal) : `channels.irc.groupAllowFrom`
- Contrôles par canal (canal + expéditeur + règles de mention) : `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` autorise les canaux non configurés (**tout en restant filtrés par mention par défaut**)

Les entrées de liste d’autorisation doivent utiliser des identités d’expéditeur stables (`nick!user@host`).
La correspondance sur le simple pseudo est mutable et n’est activée que lorsque `channels.irc.dangerouslyAllowNameMatching: true`.

### Piège courant : `allowFrom` concerne les DM, pas les canaux

Si vous voyez des journaux comme :

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

Même si un canal est autorisé (via `groupPolicy` + `groups`) et que l’expéditeur est autorisé, OpenClaw utilise par défaut le **filtrage par mention** dans les contextes de groupe.

Cela signifie que vous pouvez voir des journaux comme `drop channel … (missing-mention)` à moins que le message n’inclue un motif de mention correspondant au bot.

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

Ou, pour autoriser **tous** les canaux IRC (sans liste d’autorisation par canal) et répondre quand même sans mentions :

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

## Remarque de sécurité (recommandée pour les canaux publics)

Si vous autorisez `allowFrom: ["*"]` dans un canal public, n’importe qui peut solliciter le bot.
Pour réduire les risques, limitez les outils pour ce canal.

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
- Les anciennes clés sans préfixe sont toujours acceptées et sont mises en correspondance comme `id:` uniquement.
- La première politique d’expéditeur correspondante l’emporte ; `"*"` est la solution de repli générique.

Pour en savoir plus sur l’accès aux groupes par rapport au filtrage par mention (et sur leur interaction), consultez : [/channels/groups](/fr/channels/groups).

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

Désactivez `register` une fois le pseudo enregistré afin d’éviter des tentatives répétées de REGISTER.

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

- Si le bot se connecte mais ne répond jamais dans les canaux, vérifiez `channels.irc.groups` **ainsi que** si le filtrage par mention rejette les messages (`missing-mention`). Si vous voulez qu’il réponde sans ping, définissez `requireMention:false` pour le canal.
- Si la connexion échoue, vérifiez la disponibilité du pseudo et le mot de passe du serveur.
- Si TLS échoue sur un réseau personnalisé, vérifiez la configuration de l’hôte/du port et des certificats.

## Articles connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Pairing](/fr/channels/pairing) — authentification DM et flux de pairing
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
