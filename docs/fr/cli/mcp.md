---
read_when:
    - Connexion de Codex, Claude Code ou d’un autre client MCP à des canaux adossés à OpenClaw
    - Exécution de `openclaw mcp serve`
    - Gestion des définitions de serveurs MCP enregistrées par OpenClaw
summary: Exposer les conversations de canal OpenClaw via MCP et gérer les définitions enregistrées de serveurs MCP
title: MCP
x-i18n:
    generated_at: "2026-04-24T07:04:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` a deux rôles :

- exécuter OpenClaw comme serveur MCP avec `openclaw mcp serve`
- gérer les définitions de serveurs MCP sortants appartenant à OpenClaw avec `list`, `show`,
  `set` et `unset`

Autrement dit :

- `serve` correspond à OpenClaw agissant comme serveur MCP
- `list` / `show` / `set` / `unset` correspondent à OpenClaw agissant comme registre
  côté client MCP pour d’autres serveurs MCP que ses runtimes pourront consommer plus tard

Utilisez [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit lui-même héberger une
session de harnais de code et faire passer ce runtime via ACP.

## OpenClaw comme serveur MCP

C’est le chemin `openclaw mcp serve`.

## Quand utiliser `serve`

Utilisez `openclaw mcp serve` lorsque :

- Codex, Claude Code ou un autre client MCP doit parler directement à des
  conversations de canal adossées à OpenClaw
- vous avez déjà un Gateway OpenClaw local ou distant avec des sessions routées
- vous voulez un seul serveur MCP qui fonctionne à travers les backends de canaux d’OpenClaw
  au lieu d’exécuter des ponts séparés par canal

Utilisez plutôt [`openclaw acp`](/fr/cli/acp) lorsque OpenClaw doit héberger le
runtime de code lui-même et conserver la session d’agent dans OpenClaw.

## Fonctionnement

`openclaw mcp serve` démarre un serveur MCP stdio. Le client MCP possède ce
processus. Tant que le client garde la session stdio ouverte, le pont se connecte à un
Gateway OpenClaw local ou distant via WebSocket et expose les conversations de canal routées
via MCP.

Cycle de vie :

1. le client MCP lance `openclaw mcp serve`
2. le pont se connecte au Gateway
3. les sessions routées deviennent des conversations MCP et des outils de transcript/historique
4. les événements en direct sont mis en file d’attente en mémoire tant que le pont est connecté
5. si le mode canal Claude est activé, la même session peut aussi recevoir
   des notifications push spécifiques à Claude

Comportement important :

- l’état de la file d’attente en direct commence lorsque le pont se connecte
- l’historique de transcript plus ancien est lu avec `messages_read`
- les notifications push Claude n’existent que tant que la session MCP est active
- lorsque le client se déconnecte, le pont se ferme et la file d’attente en direct disparaît
- les serveurs MCP stdio lancés par OpenClaw (intégrés ou configurés par l’utilisateur) sont
  arrêtés en tant qu’arbre de processus à l’arrêt, de sorte que les sous-processus enfants démarrés par le
  serveur ne survivent pas après la fermeture du client stdio parent
- la suppression ou la réinitialisation d’une session libère les clients MCP de cette session via
  le chemin de nettoyage runtime partagé, de sorte qu’il n’existe pas de connexions stdio persistantes
  liées à une session supprimée

## Choisir un mode client

Utilisez le même pont de deux façons différentes :

- Clients MCP génériques : outils MCP standard uniquement. Utilisez `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` et les
  outils d’approbation.
- Claude Code : outils MCP standard plus l’adaptateur de canal spécifique à Claude.
  Activez `--claude-channel-mode on` ou laissez la valeur par défaut `auto`.

Aujourd’hui, `auto` se comporte comme `on`. Il n’existe pas encore de détection
des capacités du client.

## Ce que `serve` expose

Le pont utilise les métadonnées de route de session existantes du Gateway pour exposer des
conversations adossées à des canaux. Une conversation apparaît lorsque OpenClaw a déjà un état
de session avec une route connue telle que :

- `channel`
- métadonnées de destinataire ou de destination
- `accountId` facultatif
- `threadId` facultatif

Cela donne aux clients MCP un seul endroit pour :

- lister les conversations routées récentes
- lire l’historique récent du transcript
- attendre de nouveaux événements entrants
- renvoyer une réponse par la même route
- voir les demandes d’approbation qui arrivent tant que le pont est connecté

## Utilisation

```bash
# Gateway local
openclaw mcp serve

# Gateway distant
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway distant avec authentification par mot de passe
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Activer les journaux détaillés du pont
openclaw mcp serve --verbose

# Désactiver les notifications push spécifiques à Claude
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

Liste les conversations récentes adossées à une session qui ont déjà des métadonnées de route dans
l’état de session du Gateway.

Filtres utiles :

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Renvoie une conversation par `session_key`.

### `messages_read`

Lit les messages récents du transcript pour une conversation adossée à une session.

### `attachments_fetch`

Extrait les blocs de contenu de message non textuels à partir d’un message du transcript. Il s’agit d’une
vue de métadonnées sur le contenu du transcript, et non d’un stockage autonome durable de blobs de pièces jointes.

### `events_poll`

Lit les événements en direct mis en file d’attente depuis un curseur numérique.

### `events_wait`

Effectue un long polling jusqu’à l’arrivée du prochain événement correspondant dans la file d’attente ou jusqu’à expiration du délai.

Utilisez ceci lorsqu’un client MCP générique a besoin d’une livraison quasi temps réel sans
protocole push spécifique à Claude.

### `messages_send`

Envoie du texte en retour par la même route déjà enregistrée sur la session.

Comportement actuel :

- nécessite une route de conversation existante
- utilise le canal, le destinataire, l’ID de compte et l’ID de fil de la session
- envoie du texte uniquement

### `permissions_list_open`

Liste les demandes d’approbation exec/plugin en attente que le pont a observées depuis sa
connexion au Gateway.

### `permissions_respond`

Résout une demande d’approbation exec/plugin en attente avec :

- `allow-once`
- `allow-always`
- `deny`

## Modèle d’événement

Le pont conserve une file d’attente d’événements en mémoire tant qu’il est connecté.

Types d’événements actuels :

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes :

- la file d’attente est en direct uniquement ; elle commence lorsque le pont MCP démarre
- `events_poll` et `events_wait` ne rejouent pas par eux-mêmes l’ancien historique du Gateway
- l’historique durable en retard doit être lu avec `messages_read`

## Notifications de canal Claude

Le pont peut aussi exposer des notifications de canal spécifiques à Claude. C’est l’équivalent OpenClaw
d’un adaptateur de canal Claude Code : les outils MCP standard restent disponibles, mais les messages entrants en direct
peuvent également arriver sous forme de notifications MCP spécifiques à Claude.

Indicateurs :

- `--claude-channel-mode off` : outils MCP standard uniquement
- `--claude-channel-mode on` : active les notifications de canal Claude
- `--claude-channel-mode auto` : valeur par défaut actuelle ; même comportement de pont que `on`

Lorsque le mode canal Claude est activé, le serveur annonce des capacités expérimentales Claude
et peut émettre :

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportement actuel du pont :

- les messages entrants de transcript `user` sont transmis comme
  `notifications/claude/channel`
- les demandes d’autorisation Claude reçues via MCP sont suivies en mémoire
- si la conversation liée envoie ensuite `yes abcde` ou `no abcde`, le pont
  convertit cela en `notifications/claude/channel/permission`
- ces notifications ne vivent que pendant la session active ; si le client MCP se déconnecte,
  il n’y a plus de cible push

Ceci est intentionnellement spécifique au client. Les clients MCP génériques doivent s’appuyer sur les
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

Pour la plupart des clients MCP génériques, commencez par la surface d’outils standard et ignorez
le mode Claude. Activez le mode Claude uniquement pour les clients qui comprennent réellement les
méthodes de notification spécifiques à Claude.

## Options

`openclaw mcp serve` prend en charge :

- `--url <url>` : URL WebSocket du Gateway
- `--token <token>` : jeton Gateway
- `--token-file <path>` : lit le jeton depuis un fichier
- `--password <password>` : mot de passe Gateway
- `--password-file <path>` : lit le mot de passe depuis un fichier
- `--claude-channel-mode <auto|on|off>` : mode de notification Claude
- `-v`, `--verbose` : journaux détaillés sur stderr

Préférez `--token-file` ou `--password-file` aux secrets inline lorsque c’est possible.

## Sécurité et frontière de confiance

Le pont n’invente pas le routage. Il expose uniquement les conversations que le Gateway
sait déjà router.

Cela signifie que :

- les listes d’autorisation d’expéditeur, le jumelage et la confiance au niveau du canal appartiennent toujours à la
  configuration de canal OpenClaw sous-jacente
- `messages_send` ne peut répondre qu’à travers une route stockée existante
- l’état d’approbation n’est vivant/en mémoire que pour la session actuelle du pont
- l’authentification du pont doit utiliser les mêmes contrôles de jeton ou de mot de passe Gateway que vous
  jugeriez fiables pour tout autre client Gateway distant

Si une conversation manque dans `conversations_list`, la cause habituelle n’est pas la
configuration MCP. Il s’agit de métadonnées de route manquantes ou incomplètes dans la session
Gateway sous-jacente.

## Tests

OpenClaw fournit un smoke test Docker déterministe pour ce pont :

```bash
pnpm test:docker:mcp-channels
```

Ce smoke test :

- démarre un conteneur Gateway pré-initialisé
- démarre un second conteneur qui lance `openclaw mcp serve`
- vérifie la découverte des conversations, la lecture des transcripts, la lecture des métadonnées de pièces jointes,
  le comportement de la file d’attente d’événements en direct et le routage des envois sortants
- valide les notifications de type canal Claude et permissions sur le vrai pont MCP stdio

C’est le moyen le plus rapide de prouver que le pont fonctionne sans intégrer un vrai
compte Telegram, Discord ou iMessage à l’exécution des tests.

Pour un contexte de test plus large, consultez [Testing](/fr/help/testing).

## Dépannage

### Aucune conversation renvoyée

Cela signifie généralement que la session Gateway n’est pas déjà routable. Confirmez que la
session sous-jacente a stocké le canal/fournisseur, le destinataire et les métadonnées
facultatives de route de compte/fil.

### `events_poll` ou `events_wait` manque des anciens messages

C’est attendu. La file d’attente en direct commence lorsque le pont se connecte. Lisez l’ancien historique
du transcript avec `messages_read`.

### Les notifications Claude n’apparaissent pas

Vérifiez tous ces points :

- le client a gardé la session MCP stdio ouverte
- `--claude-channel-mode` est `on` ou `auto`
- le client comprend réellement les méthodes de notification spécifiques à Claude
- le message entrant est arrivé après la connexion du pont

### Les approbations sont absentes

`permissions_list_open` n’affiche que les demandes d’approbation observées pendant que le pont
était connecté. Ce n’est pas une API d’historique durable des approbations.

## OpenClaw comme registre client MCP

C’est le chemin `openclaw mcp list`, `show`, `set` et `unset`.

Ces commandes n’exposent pas OpenClaw via MCP. Elles gèrent les définitions de serveurs MCP
appartenant à OpenClaw sous `mcp.servers` dans la configuration OpenClaw.

Ces définitions enregistrées sont destinées aux runtimes qu’OpenClaw lance ou configure
plus tard, tels que Pi intégré et d’autres adaptateurs runtime. OpenClaw stocke les
définitions de façon centralisée afin que ces runtimes n’aient pas besoin de conserver leurs propres listes
dupliquées de serveurs MCP.

Comportement important :

- ces commandes lisent ou écrivent uniquement la configuration OpenClaw
- elles ne se connectent pas au serveur MCP cible
- elles ne valident pas si la commande, l’URL ou le transport distant est
  joignable en ce moment
- les adaptateurs runtime décident quelles formes de transport ils prennent réellement en charge au
  moment de l’exécution
- Pi intégré expose les outils MCP configurés dans les profils d’outils normaux `coding` et `messaging` ;
  `minimal` les masque toujours, et `tools.deny: ["bundle-mcp"]` les désactive explicitement

## Définitions de serveurs MCP enregistrées

OpenClaw stocke aussi un registre léger de serveurs MCP dans la configuration pour les surfaces
qui veulent des définitions MCP gérées par OpenClaw.

Commandes :

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Remarques :

- `list` trie les noms des serveurs.
- `show` sans nom affiche l’objet complet des serveurs MCP configurés.
- `set` attend une valeur d’objet JSON sur une seule ligne de commande.
- `unset` échoue si le serveur nommé n’existe pas.

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

| Champ                     | Description                         |
| ------------------------- | ----------------------------------- |
| `command`                 | Exécutable à lancer (requis)        |
| `args`                    | Tableau d’arguments de ligne de commande |
| `env`                     | Variables d’environnement supplémentaires |
| `cwd` / `workingDirectory` | Répertoire de travail du processus |

#### Filtre de sécurité des variables d’environnement stdio

OpenClaw rejette les clés d’environnement de démarrage de l’interpréteur qui peuvent modifier la façon dont un serveur MCP stdio démarre avant le premier RPC, même si elles apparaissent dans le bloc `env` d’un serveur. Les clés bloquées incluent `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` et des variables similaires de contrôle du runtime. Le démarrage rejette ces clés avec une erreur de configuration afin qu’elles ne puissent pas injecter un prélude implicite, remplacer l’interpréteur ou activer un débogueur sur le processus stdio. Les variables d’environnement ordinaires de type identifiants, proxy et spécifiques au serveur (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personnalisées, etc.) ne sont pas affectées.

Si votre serveur MCP a réellement besoin de l’une des variables bloquées, définissez-la sur le processus hôte du Gateway plutôt que sous `env` du serveur stdio.

### Transport SSE / HTTP

Se connecte à un serveur MCP distant via HTTP Server-Sent Events.

| Champ                 | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                   |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple jetons d’authentification) |
| `connectionTimeoutMs` | Délai d’attente de connexion par serveur en ms (facultatif)      |

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
la sortie d’état.

### Transport Streamable HTTP

`streamable-http` est une option de transport supplémentaire aux côtés de `sse` et `stdio`. Il utilise le streaming HTTP pour la communication bidirectionnelle avec des serveurs MCP distants.

| Champ                 | Description                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP ou HTTPS du serveur distant (requise)                                         |
| `transport`           | Définissez `"streamable-http"` pour sélectionner ce transport ; lorsqu’il est omis, OpenClaw utilise `sse` |
| `headers`             | Mappage clé-valeur facultatif des en-têtes HTTP (par exemple jetons d’authentification) |
| `connectionTimeoutMs` | Délai d’attente de connexion par serveur en ms (facultatif)                            |

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
n’ouvrent pas de session client MCP active et ne prouvent pas que le serveur cible est joignable.

## Limites actuelles

Cette page documente le pont tel qu’il est livré aujourd’hui.

Limites actuelles :

- la découverte des conversations dépend des métadonnées de route de session Gateway existantes
- aucun protocole push générique au-delà de l’adaptateur spécifique à Claude
- pas encore d’outils de modification ou de réaction aux messages
- le transport HTTP/SSE/streamable-http se connecte à un seul serveur distant ; pas encore de multiplexage amont
- `permissions_list_open` n’inclut que les approbations observées pendant que le pont est
  connecté

## Associé

- [Référence CLI](/fr/cli)
- [Plugins](/fr/cli/plugins)
