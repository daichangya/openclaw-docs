---
read_when:
    - Connexion de Codex, Claude Code ou d'un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
summary: Exposer les conversations de canal OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: mcp
x-i18n:
    generated_at: "2026-04-05T12:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` a deux fonctions :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants appartenant à OpenClaw avec `list`, `show`,
  `set` et `unset`

En d'autres termes :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre
  côté client MCP pour d'autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/cli/acp) lorsqu'OpenClaw doit lui-même héberger une
session de harnais de codage et faire passer ce runtime via ACP.

## OpenClaw en tant que serveur MCP

Il s'agit du parcours `openclaw mcp serve`.

## Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit parler directement à des
  conversations de canal adossées à OpenClaw
- vous disposez déjà d'une gateway OpenClaw locale ou distante avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne à travers les backends de canaux d'OpenClaw
  au lieu d'exécuter des ponts séparés par canal

Utilisez plutôt [`openclaw acp`](/cli/acp) lorsqu'OpenClaw doit héberger lui-même le
runtime de codage et conserver la session d'agent dans OpenClaw.

## Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce
processus. Tant que le client garde la session stdio ouverte, le pont se connecte à une
gateway OpenClaw locale ou distante via WebSocket et expose des conversations de canal routées
via MCP.

Cycle de vie :

1. le client MCP lance `openclaw mcp serve`
2. le pont se connecte à la gateway
3. les sessions routées deviennent des conversations MCP et des outils d'historique/transcription
4. les événements en direct sont mis en file en mémoire pendant que le pont est connecté
5. si le mode de canal Claude est activé, la même session peut aussi recevoir
   des notifications push spécifiques à Claude

Comportement important :

- l'état de la file en direct commence quand le pont se connecte
- l'historique de transcription plus ancien se lit avec `messages_read`
- les notifications push Claude n'existent que tant que la session MCP est active
- lorsque le client se déconnecte, le pont s'arrête et la file en direct disparaît

## Choisir un mode client

Utilisez le même pont de deux façons différentes :

- Clients MCP génériques : outils MCP standard uniquement. Utilisez `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` et les
  outils d'approbation.
- Claude Code : outils MCP standard plus l'adaptateur de canal spécifique à Claude.
  Activez `--claude-channel-mode on` ou laissez la valeur par défaut `auto`.

Aujourd'hui, `auto` se comporte comme `on`. Il n'y a pas encore de détection des
capacités client.

## Ce que `serve` expose

Le pont utilise les métadonnées de route de session existantes de la gateway pour exposer des
conversations adossées à des canaux. Une conversation apparaît lorsqu'OpenClaw possède déjà un état
de session avec une route connue telle que :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un seul endroit pour :

- lister les conversations routées récentes
- lire l'historique de transcription récent
- attendre de nouveaux événements entrants
- envoyer une réponse en retour par la même route
- voir les demandes d'approbation qui arrivent pendant que le pont est connecté

## Utilisation

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## Outils du pont

Le pont actuel expose ces outils MCP :

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Liste les conversations récentes adossées à une session qui disposent déjà de métadonnées de route dans
l'état de session de la gateway.

Filtres utiles :

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Renvoie une conversation par `session_key`.

### `messages_read`

Lit les messages récents de transcription pour une conversation adossée à une session.

### `attachments_fetch`

Extrait les blocs de contenu de message non textuel d'un message de transcription. Il s'agit d'une
vue de métadonnées sur le contenu de transcription, pas d'un magasin autonome et durable de blobs de pièces jointes.

### `events_poll`

Lit les événements en direct mis en file depuis un curseur numérique.

### `events_wait`

Effectue un long polling jusqu'à l'arrivée du prochain événement mis en file correspondant ou jusqu'à l'expiration du délai.

Utilisez ceci lorsqu'un client MCP générique a besoin d'une livraison quasi temps réel sans
protocole push spécifique à Claude.

### `messages_send`

Envoie du texte en retour par la même route déjà enregistrée sur la session.

Comportement actuel :

- nécessite une route de conversation existante
- utilise le canal, le destinataire, l'identifiant de compte et l'identifiant de fil de la session
- envoie uniquement du texte

### `permissions_list_open`

Liste les demandes d'approbation exec/plugin en attente que le pont a observées depuis sa
connexion à la gateway.

### `permissions_respond`

Résout une demande d'approbation exec/plugin en attente avec :

- `allow-once`
- `allow-always`
- `deny`

## Modèle d'événement

Le pont conserve une file d'événements en mémoire pendant sa connexion.

Types d'événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes :

- la file est uniquement en direct ; elle commence quand le pont MCP démarre
- `events_poll` et `events_wait` ne rejouent pas à eux seuls l'historique plus ancien de la gateway
- l'historique durable doit être lu avec `messages_read`

## Notifications de canal Claude

Le pont peut aussi exposer des notifications de canal spécifiques à Claude. C'est l'équivalent
OpenClaw d'un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais
les messages entrants en direct peuvent aussi arriver comme notifications MCP spécifiques à Claude.

Options :

- `--claude-channel-mode off` : outils MCP standard uniquement
- `--claude-channel-mode on` : activer les notifications de canal Claude
- `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de pont que `on`

Lorsque le mode de canal Claude est activé, le serveur annonce des capacités expérimentales Claude
et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages de transcription entrants `user` sont transférés comme
  `notifications/claude/channel`
- les demandes d'autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, le pont
  convertit cela en `notifications/claude/channel/permission`
- ces notifications sont limitées à la session en direct ; si le client MCP se déconnecte,
  il n'y a plus de cible push

Cela est intentionnellement spécifique au client. Les clients MCP génériques doivent s'appuyer sur les
outils de polling standard.

## Configuration du client MCP

Exemple de configuration de client stdio :

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Pour la plupart des clients MCP génériques, commencez par la surface d'outils standard et ignorez
le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les
méthodes de notification spécifiques à Claude.

## Options

`openclaw mcp serve` prend en charge :

- `--url <url>` : URL WebSocket de la gateway
- `--token <token>` : jeton de la gateway
- `--token-file <path>` : lire le jeton depuis un fichier
- `--password <password>` : mot de passe de la gateway
- `--password-file <path>` : lire le mot de passe depuis un fichier
- `--claude-channel-mode <auto|on|off>` : mode de notification Claude
- `-v`, `--verbose` : journaux détaillés sur stderr

Préférez `--token-file` ou `--password-file` aux secrets en ligne lorsque c'est possible.

## Sécurité et limite de confiance

Le pont n'invente pas le routage. Il expose uniquement les conversations que la gateway
sait déjà router.

Cela signifie que :

- les listes d'autorisation d'expéditeur, le jumelage et la confiance au niveau du canal relèvent toujours de la
  configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre qu'à travers une route enregistrée existante
- l'état d'approbation n'est qu'en direct/en mémoire pour la session de pont actuelle
- l'authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe de gateway que vous
  jugeriez fiables pour tout autre client de gateway distante

Si une conversation manque dans `conversations_list`, la cause habituelle n'est pas la
configuration MCP. Il s'agit de métadonnées de route manquantes ou incomplètes dans la
session de gateway sous-jacente.

## Tests

OpenClaw fournit un smoke Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke :

- démarre un conteneur gateway initialisé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte de conversations, la lecture de transcription, la lecture de métadonnées de pièces jointes,
  le comportement de la file d'événements en direct et le routage des envois sortants
- valide les notifications de canal et d'autorisation de style Claude sur le vrai
  pont MCP stdio

C'est la façon la plus rapide de prouver que le pont fonctionne sans brancher un vrai
compte Telegram, Discord ou iMessage dans l'exécution de test.

Pour un contexte de test plus large, voir [Testing](/help/testing).

## Dépannage

### Aucune conversation renvoyée

Cela signifie généralement que la session gateway n'est pas déjà routable. Confirmez que la
session sous-jacente possède bien des métadonnées de route stockées pour canal/fournisseur,
destinataire, ainsi que les métadonnées facultatives de compte/fil.

### `events_poll` ou `events_wait` manquent des messages plus anciens

C'est attendu. La file en direct commence quand le pont se connecte. Lisez l'historique de transcription
plus ancien avec `messages_read`.

### Les notifications Claude n'apparaissent pas

Vérifiez tous les points suivants :

- le client a gardé la session MCP stdio ouverte
- `--claude-channel-mode` est `on` ou `auto`
- le client comprend réellement les méthodes de notification spécifiques à Claude
- le message entrant s'est produit après la connexion du pont

### Les approbations sont absentes

`permissions_list_open` n'affiche que les demandes d'approbation observées pendant que le pont
était connecté. Ce n'est pas une API durable d'historique des approbations.

## OpenClaw comme registre client MCP

Il s'agit du parcours `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n'exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP appartenant à OpenClaw
sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées sont destinées aux runtimes qu'OpenClaw lance ou configure
plus tard, comme Pi intégré et d'autres adaptateurs de runtime. OpenClaw stocke les
définitions de manière centralisée afin que ces runtimes n'aient pas à conserver leurs propres listes
dupliquées de serveurs MCP.

Comportement important :

- ces commandes lisent ou écrivent uniquement la configuration OpenClaw
- elles ne se connectent pas au serveur MCP cible
- elles ne valident pas si la commande, l'URL ou le transport distant est
  accessible immédiatement
- les adaptateurs de runtime décident quelles formes de transport ils prennent réellement en charge au
  moment de l'exécution

## Définitions enregistrées de serveurs MCP

OpenClaw stocke également dans la configuration un registre léger de serveurs MCP pour les surfaces
qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms des serveurs.
- `show` sans nom affiche l'objet complet configuré des serveurs MCP.
- `set` attend une valeur d'objet JSON sur la ligne de commande.
- `unset` échoue si le serveur nommé n'existe pas.

Exemples :

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Exemple de structure de configuration :

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transport stdio

Lance un processus enfant local et communique via stdin/stdout.

| Champ                      | Description                          |
| -------------------------- | ------------------------------------ |
| `command`                  | Exécutable à lancer (obligatoire)    |
| `args`                     | Tableau d'arguments de ligne de commande |
| `env`                      | Variables d'environnement supplémentaires |
| `cwd` / `workingDirectory` | Répertoire de travail du processus   |

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)              |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple des jetons d'authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (facultatif)               |

Exemple :

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Les valeurs sensibles dans `url` (userinfo) et `headers` sont masquées dans les journaux et
la sortie d'état.

### Transport HTTP streamable

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Elle utilise le streaming HTTP pour la communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (obligatoire)                                     |
| `transport`           | Définissez `"streamable-http"` pour sélectionner ce transport ; lorsqu'il est omis, OpenClaw utilise `sse` |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple des jetons d'authentification) |
| `connectionTimeoutMs` | Délai de connexion par serveur en ms (facultatif)                                      |

Exemple :

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Ces commandes gèrent uniquement la configuration enregistrée. Elles ne démarrent pas le pont de canal,
n'ouvrent pas de session cliente MCP en direct et ne prouvent pas que le serveur cible est accessible.

## Limites actuelles

Cette page documente le pont tel qu'il est fourni aujourd'hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées de route de session gateway existantes
- pas de protocole push générique au-delà de l'adaptateur spécifique à Claude
- pas encore d'outils de modification de message ou de réaction
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore d'amont multiplexé
- `permissions_list_open` n'inclut que les approbations observées pendant que le pont est
  connecté
