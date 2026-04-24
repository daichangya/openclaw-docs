---
read_when:
    - Configuration des intégrations IDE basées sur ACP
    - Débogage du routage de session ACP vers le Gateway
summary: Exécutez le pont ACP pour les intégrations IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T07:03:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

Exécutez le pont [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec un Gateway OpenClaw.

Cette commande parle ACP sur stdio pour les IDE et transfère les prompts vers le Gateway
via WebSocket. Elle conserve les sessions ACP mappées aux clés de session du Gateway.

`openclaw acp` est un pont ACP adossé au Gateway, et non un environnement d’exécution
éditeur entièrement natif ACP. Il se concentre sur le routage des sessions, la livraison
des prompts et les mises à jour de streaming de base.

Si vous souhaitez qu’un client MCP externe parle directement aux conversations de canal
OpenClaw au lieu d’héberger une session de harnais ACP, utilisez plutôt
[`openclaw mcp serve`](/fr/cli/mcp).

## Ce que ce n’est pas

Cette page est souvent confondue avec les sessions de harnais ACP.

`openclaw acp` signifie :

- OpenClaw agit comme serveur ACP
- un IDE ou un client ACP se connecte à OpenClaw
- OpenClaw transfère ce travail dans une session Gateway

C’est différent de [Agents ACP](/fr/tools/acp-agents), où OpenClaw exécute un
harnais externe tel que Codex ou Claude Code via `acpx`.

Règle rapide :

- l’éditeur/client veut parler ACP à OpenClaw : utilisez `openclaw acp`
- OpenClaw doit lancer Codex/Claude/Gemini comme harnais ACP : utilisez `/acp spawn` et [Agents ACP](/fr/tools/acp-agents)

## Matrice de compatibilité

| Zone ACP                                                            | Statut      | Remarques                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                      | Implémenté  | Flux principal du pont sur stdio vers le chat/l’envoi Gateway + interruption.                                                                                                                                                                   |
| `listSessions`, commandes slash                                     | Implémenté  | La liste des sessions fonctionne avec l’état des sessions Gateway ; les commandes sont annoncées via `available_commands_update`.                                                                                                               |
| `loadSession`                                                       | Partiel     | Relie de nouveau la session ACP à une clé de session Gateway et rejoue l’historique de texte utilisateur/assistant stocké. L’historique des outils/système n’est pas encore reconstruit.                                                      |
| Contenu des prompts (`text`, `resource` intégré, images)            | Partiel     | Le texte/les ressources sont aplatis dans l’entrée du chat ; les images deviennent des pièces jointes Gateway.                                                                                                                                 |
| Modes de session                                                    | Partiel     | `session/set_mode` est pris en charge et le pont expose des contrôles initiaux de session adossés au Gateway pour le niveau de réflexion, la verbosité des outils, le raisonnement, le détail d’utilisation et les actions élevées. Les surfaces plus larges de mode/configuration natives ACP restent hors périmètre. |
| Informations de session et mises à jour d’utilisation               | Partiel     | Le pont émet des notifications `session_info_update` et `usage_update` en mode best-effort à partir d’instantanés mis en cache des sessions Gateway. L’utilisation est approximative et n’est envoyée que lorsque les totaux de jetons du Gateway sont marqués comme frais. |
| Streaming d’outils                                                  | Partiel     | Les événements `tool_call` / `tool_call_update` incluent les E/S brutes, le contenu texte et, en mode best-effort, les emplacements de fichiers lorsque les arguments/résultats des outils Gateway les exposent. Les terminaux intégrés et la sortie native de diff plus riche ne sont pas encore exposés. |
| Serveurs MCP par session (`mcpServers`)                             | Non pris en charge | Le mode pont rejette les demandes de serveur MCP par session. Configurez MCP sur le gateway ou l’agent OpenClaw à la place.                                                                                                                     |
| Méthodes de système de fichiers du client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | Le pont n’appelle pas les méthodes de système de fichiers du client ACP.                                                                                                                                                                         |
| Méthodes de terminal client (`terminal/*`)                          | Non pris en charge | Le pont ne crée pas de terminaux client ACP et ne transmet pas d’identifiants de terminal via les appels d’outils.                                                                                                                             |
| Plans de session / streaming de réflexion                           | Non pris en charge | Le pont émet actuellement le texte de sortie et l’état des outils, pas les mises à jour de plan ou de réflexion ACP.                                                                                                                           |

## Limitations connues

- `loadSession` rejoue l’historique de texte utilisateur et assistant stocké, mais il ne
  reconstruit pas les appels d’outils historiques, les notices système ou les types
  d’événements natifs ACP plus riches.
- Si plusieurs clients ACP partagent la même clé de session Gateway, le routage
  des événements et des annulations est en mode best-effort plutôt que strictement isolé par client. Préférez les
  sessions `acp:<uuid>` isolées par défaut lorsque vous avez besoin de tours
  propres au niveau de l’éditeur local.
- Les états d’arrêt du Gateway sont traduits en raisons d’arrêt ACP, mais ce mappage est
  moins expressif qu’un environnement d’exécution entièrement natif ACP.
- Les contrôles de session initiaux n’exposent actuellement qu’un sous-ensemble ciblé des réglages Gateway :
  niveau de réflexion, verbosité des outils, raisonnement, détail d’utilisation et
  actions élevées. La sélection du modèle et les contrôles d’hôte d’exécution ne sont pas encore exposés comme options
  de configuration ACP.
- `session_info_update` et `usage_update` sont dérivés d’instantanés de session Gateway,
  et non d’une comptabilité d’exécution native ACP en direct. L’utilisation est approximative,
  ne contient pas de données de coût et n’est émise que lorsque le Gateway marque les données
  totales de jetons comme fraîches.
- Les données de suivi des outils sont en mode best-effort. Le pont peut exposer les chemins de fichiers qui
  apparaissent dans des arguments/résultats d’outils connus, mais il n’émet pas encore de terminaux ACP ni de diffs de fichiers structurés.

## Utilisation

```bash
openclaw acp

# Gateway distant
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway distant (jeton depuis un fichier)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attacher à une clé de session existante
openclaw acp --session agent:main:main

# Attacher par libellé (doit déjà exister)
openclaw acp --session-label "support inbox"

# Réinitialiser la clé de session avant le premier prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (débogage)

Utilisez le client ACP intégré pour vérifier le bon fonctionnement du pont sans IDE.
Il lance le pont ACP et vous permet de saisir des prompts de manière interactive.

```bash
openclaw acp client

# Pointer le pont lancé vers un Gateway distant
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remplacer la commande du serveur (par défaut : openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle de permissions (mode débogage client) :

- L’approbation automatique est basée sur une liste d’autorisation et ne s’applique qu’aux identifiants d’outils cœur de confiance.
- L’approbation automatique `read` est limitée au répertoire de travail courant (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des classes étroites en lecture seule : appels `read` limités sous le cwd actif plus outils de recherche en lecture seule (`search`, `web_search`, `memory_search`). Les outils inconnus/non cœur, les lectures hors périmètre, les outils capables d’exécution, les outils de plan de contrôle, les outils mutateurs et les flux interactifs exigent toujours une approbation explicite par prompt.
- Le `toolCall.kind` fourni par le serveur est traité comme une métadonnée non fiable (et non comme une source d’autorisation).
- Cette politique du pont ACP est distincte des permissions de harnais ACPX. Si vous exécutez OpenClaw via le backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur d’urgence « yolo » pour cette session de harnais.

## Comment utiliser ceci

Utilisez ACP lorsqu’un IDE (ou un autre client) parle Agent Client Protocol et que vous voulez
qu’il pilote une session Gateway OpenClaw.

1. Assurez-vous que le Gateway est en cours d’exécution (local ou distant).
2. Configurez la cible Gateway (configuration ou options).
3. Configurez votre IDE pour exécuter `openclaw acp` sur stdio.

Exemple de configuration (persistée) :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe (sans écriture de configuration) :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# préférable pour la sécurité du processus local
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne choisit pas directement les agents. Il route selon la clé de session Gateway.

Utilisez des clés de session à portée d’agent pour cibler un agent spécifique :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP correspond à une seule clé de session Gateway. Un agent peut avoir de nombreuses
sessions ; ACP utilise par défaut une session `acp:<uuid>` isolée sauf si vous remplacez
la clé ou le libellé.

Les `mcpServers` par session ne sont pas pris en charge en mode pont. Si un client ACP
les envoie pendant `newSession` ou `loadSession`, le pont renvoie une erreur
claire au lieu de les ignorer silencieusement.

Si vous souhaitez que les sessions adossées à ACPX voient les outils de plugin OpenClaw ou certains
outils intégrés sélectionnés tels que `cron`, activez plutôt les ponts MCP ACPX côté gateway
au lieu d’essayer de passer des `mcpServers` par session. Voir
[Agents ACP](/fr/tools/acp-agents-setup#plugin-tools-mcp-bridge) et
[Pont MCP des outils OpenClaw](/fr/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude, autres clients ACP)

Si vous souhaitez qu’un agent de programmation tel que Codex ou Claude Code parle à votre
bot OpenClaw via ACP, utilisez `acpx` avec sa cible `openclaw` intégrée.

Flux typique :

1. Exécutez le Gateway et assurez-vous que le pont ACP peut l’atteindre.
2. Pointez `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que vous souhaitez que l’agent de programmation utilise.

Exemples :

```bash
# Requête ponctuelle dans votre session ACP OpenClaw par défaut
acpx openclaw exec "Summarize the active OpenClaw session state."

# Session nommée persistante pour les tours suivants
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si vous souhaitez que `acpx openclaw` cible à chaque fois un Gateway spécifique et une clé de session spécifique,
remplacez la commande de l’agent `openclaw` dans `~/.acpx/config.json` :

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Pour une extraction OpenClaw locale dans un dépôt, utilisez le point d’entrée CLI direct au lieu du
lanceur de développement afin que le flux ACP reste propre. Par exemple :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est la façon la plus simple de permettre à Codex, Claude Code ou un autre client compatible ACP
de récupérer des informations contextuelles depuis un agent OpenClaw sans analyser un terminal.

## Configuration de l’éditeur Zed

Ajoutez un agent ACP personnalisé dans `~/.config/zed/settings.json` (ou utilisez l’interface Réglages de Zed) :

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Pour cibler un Gateway ou un agent spécifique :

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Dans Zed, ouvrez le panneau Agent et sélectionnez « OpenClaw ACP » pour démarrer un fil.

## Mappage des sessions

Par défaut, les sessions ACP reçoivent une clé de session Gateway isolée avec un préfixe `acp:`.
Pour réutiliser une session connue, passez une clé de session ou un libellé :

- `--session <key>` : utilise une clé de session Gateway spécifique.
- `--session-label <label>` : résout une session existante par libellé.
- `--reset-session` : génère un nouvel identifiant de session pour cette clé (même clé, nouvelle transcription).

Si votre client ACP prend en charge les métadonnées, vous pouvez remplacer ces valeurs par session :

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Pour en savoir plus sur les clés de session, consultez [/concepts/session](/fr/concepts/session).

## Options

- `--url <url>` : URL WebSocket du Gateway (utilise par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton d’authentification du Gateway.
- `--token-file <path>` : lit le jeton d’authentification du Gateway depuis un fichier.
- `--password <password>` : mot de passe d’authentification du Gateway.
- `--password-file <path>` : lit le mot de passe d’authentification du Gateway depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : libellé de session par défaut à résoudre.
- `--require-existing` : échoue si la clé/le libellé de session n’existe pas.
- `--reset-session` : réinitialise la clé de session avant la première utilisation.
- `--no-prefix-cwd` : ne préfixe pas les prompts avec le répertoire de travail.
- `--provenance <off|meta|meta+receipt>` : inclut les métadonnées de provenance ACP ou les reçus.
- `--verbose, -v` : journalisation verbeuse vers stderr.

Remarque de sécurité :

- `--token` et `--password` peuvent être visibles dans les listes de processus locales sur certains systèmes.
- Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution d’authentification du Gateway suit le contrat partagé utilisé par les autres clients Gateway :
  - mode local : env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> repli `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (les SecretRefs locaux configurés mais non résolus échouent en mode fail-closed)
  - mode distant : `gateway.remote.*` avec repli env/config selon les règles de priorité du mode distant
  - `--url` est sûr pour le remplacement et ne réutilise pas les identifiants implicites de configuration/env ; passez `--token`/`--password` explicites (ou leurs variantes fichier)
- Les processus enfants du backend d’exécution ACP reçoivent `OPENCLAW_SHELL=acp`, qui peut être utilisé pour des règles de shell/profil spécifiques au contexte.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus du pont lancé.

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail pour la session ACP.
- `--server <command>` : commande du serveur ACP (par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires transmis au serveur ACP.
- `--server-verbose` : active la journalisation verbeuse sur le serveur ACP.
- `--verbose, -v` : journalisation verbeuse du client.

## Lié

- [Référence CLI](/fr/cli)
- [Agents ACP](/fr/tools/acp-agents)
