---
read_when:
    - Configuration d’intégrations IDE basées sur ACP
    - Débogage du routage de session ACP vers la passerelle
summary: Exécuter le pont ACP pour les intégrations IDE
title: acp
x-i18n:
    generated_at: "2026-04-05T12:37:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2461b181e4a97dd84580581e9436ca1947a224decce8044132dbcf7fb2b7502c
    source_path: cli/acp.md
    workflow: 15
---

# acp

Exécute le pont [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) qui communique avec une passerelle OpenClaw.

Cette commande parle ACP via stdio pour les IDE et transfère les invites vers la passerelle via WebSocket. Elle maintient les sessions ACP mappées aux clés de session de la passerelle.

`openclaw acp` est un pont ACP adossé à la passerelle, et non un runtime d’éditeur entièrement natif ACP. Il se concentre sur le routage des sessions, la livraison des invites et les mises à jour de streaming de base.

Si vous souhaitez qu’un client MCP externe parle directement aux conversations de canal OpenClaw au lieu d’héberger une session de harnais ACP, utilisez plutôt [`openclaw mcp serve`](/cli/mcp).

## Ce que ce n’est pas

Cette page est souvent confondue avec les sessions de harnais ACP.

`openclaw acp` signifie :

- OpenClaw agit comme serveur ACP
- un IDE ou client ACP se connecte à OpenClaw
- OpenClaw transfère ce travail vers une session de la passerelle

C’est différent de [ACP Agents](/tools/acp-agents), où OpenClaw exécute un harnais externe tel que Codex ou Claude Code via `acpx`.

Règle rapide :

- l’éditeur/client veut parler ACP à OpenClaw : utilisez `openclaw acp`
- OpenClaw doit lancer Codex/Claude/Gemini comme harnais ACP : utilisez `/acp spawn` et [ACP Agents](/tools/acp-agents)

## Matrice de compatibilité

| Domaine ACP                                                           | Statut      | Remarques                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implémenté  | Flux de pont principal via stdio vers le chat/send de la passerelle + abandon.                                                                                                                                                                       |
| `listSessions`, commandes slash                                       | Implémenté  | La liste des sessions fonctionne sur l’état des sessions de la passerelle ; les commandes sont publiées via `available_commands_update`.                                                                                                              |
| `loadSession`                                                         | Partiel     | Re-rattache la session ACP à une clé de session de la passerelle et rejoue l’historique de texte utilisateur/assistant stocké. L’historique des outils/système n’est pas encore reconstruit.                                                        |
| Contenu des invites (`text`, `resource` intégré, images)              | Partiel     | Le texte/les ressources sont aplatis dans l’entrée de chat ; les images deviennent des pièces jointes de la passerelle.                                                                                                                              |
| Modes de session                                                      | Partiel     | `session/set_mode` est pris en charge et le pont expose des contrôles de session initiaux adossés à la passerelle pour le niveau de réflexion, la verbosité des outils, le raisonnement, le détail d’utilisation et les actions élevées. Les surfaces plus larges de mode/config native ACP restent hors périmètre. |
| Infos de session et mises à jour d’utilisation                        | Partiel     | Le pont émet des notifications `session_info_update` et, en meilleur effort, `usage_update` à partir d’instantanés mis en cache des sessions de la passerelle. L’utilisation est approximative et n’est envoyée que lorsque les totaux de jetons de la passerelle sont marqués comme frais. |
| Streaming d’outils                                                    | Partiel     | Les événements `tool_call` / `tool_call_update` incluent les E/S brutes, le contenu texte et, en meilleur effort, les emplacements de fichiers lorsque les arguments/résultats d’outil de la passerelle les exposent. Les terminaux intégrés et une sortie native diff plus riche ne sont pas encore exposés. |
| Serveurs MCP par session (`mcpServers`)                               | Non pris en charge | Le mode pont rejette les demandes de serveur MCP par session. Configurez MCP sur la passerelle ou l’agent OpenClaw à la place.                                                                                                                |
| Méthodes de système de fichiers du client (`fs/read_text_file`, `fs/write_text_file`) | Non pris en charge | Le pont n’appelle pas les méthodes de système de fichiers du client ACP.                                                                                                                                                                     |
| Méthodes de terminal client (`terminal/*`)                            | Non pris en charge | Le pont ne crée pas de terminaux client ACP et ne transmet pas d’identifiants de terminal via les appels d’outil.                                                                                                                             |
| Plans de session / streaming de réflexion                             | Non pris en charge | Le pont émet actuellement du texte de sortie et l’état des outils, pas des mises à jour de plan ou de réflexion ACP.                                                                                                                          |

## Limitations connues

- `loadSession` rejoue l’historique de texte utilisateur et assistant stocké, mais il ne reconstruit pas les appels d’outil historiques, les avis système ni les types d’événements natifs ACP plus riches.
- Si plusieurs clients ACP partagent la même clé de session de la passerelle, le routage des événements et des annulations est assuré en meilleur effort plutôt qu’avec une isolation stricte par client. Préférez les sessions isolées par défaut `acp:<uuid>` lorsque vous avez besoin de tours locaux à l’éditeur bien séparés.
- Les états d’arrêt de la passerelle sont traduits en raisons d’arrêt ACP, mais ce mappage est moins expressif qu’un runtime entièrement natif ACP.
- Les contrôles de session initiaux exposent actuellement un sous-ensemble ciblé des réglages de la passerelle : niveau de réflexion, verbosité des outils, raisonnement, détail d’utilisation et actions élevées. La sélection de modèle et les contrôles d’hôte exec ne sont pas encore exposés comme options de configuration ACP.
- `session_info_update` et `usage_update` sont dérivés d’instantanés de session de la passerelle, et non d’une comptabilité runtime native ACP en direct. L’utilisation est approximative, ne contient pas de données de coût et n’est émise que lorsque la passerelle marque les données totales de jetons comme fraîches.
- Les données de suivi d’outil sont fournies en meilleur effort. Le pont peut exposer les chemins de fichiers qui apparaissent dans des arguments/résultats d’outil connus, mais il n’émet pas encore de terminaux ACP ni de diffs de fichiers structurés.

## Utilisation

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## Client ACP (débogage)

Utilisez le client ACP intégré pour vérifier rapidement le pont sans IDE.
Il lance le pont ACP et vous permet de saisir des invites de manière interactive.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Modèle d’autorisation (mode débogage client) :

- L’approbation automatique repose sur une liste d’autorisation et ne s’applique qu’aux ID d’outils core de confiance.
- L’approbation automatique de `read` est limitée au répertoire de travail courant (`--cwd` lorsqu’il est défini).
- ACP n’approuve automatiquement que des classes étroites en lecture seule : appels `read` limités sous le cwd actif, plus les outils de recherche en lecture seule (`search`, `web_search`, `memory_search`). Les outils inconnus/non core, les lectures hors périmètre, les outils capables d’exécuter, les outils du plan de contrôle, les outils mutables et les flux interactifs exigent toujours une approbation explicite par invite.
- Le `toolCall.kind` fourni par le serveur est traité comme une métadonnée non fiable (pas comme une source d’autorisation).
- Cette politique du pont ACP est distincte des autorisations du harnais ACPX. Si vous exécutez OpenClaw via le backend `acpx`, `plugins.entries.acpx.config.permissionMode=approve-all` est l’interrupteur d’urgence « yolo » pour cette session de harnais.

## Comment utiliser cela

Utilisez ACP lorsqu’un IDE (ou un autre client) parle Agent Client Protocol et que vous souhaitez qu’il pilote une session de passerelle OpenClaw.

1. Assurez-vous que la passerelle est en cours d’exécution (locale ou distante).
2. Configurez la cible de la passerelle (configuration ou options).
3. Configurez votre IDE pour exécuter `openclaw acp` via stdio.

Exemple de configuration (persistée) :

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Exemple d’exécution directe (sans écriture de configuration) :

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Sélection des agents

ACP ne sélectionne pas directement les agents. Il route par la clé de session de la passerelle.

Utilisez des clés de session à portée d’agent pour cibler un agent spécifique :

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Chaque session ACP est mappée à une seule clé de session de la passerelle. Un agent peut avoir de nombreuses sessions ; ACP utilise par défaut une session isolée `acp:<uuid>` sauf si vous remplacez la clé ou le libellé.

Les `mcpServers` par session ne sont pas pris en charge en mode pont. Si un client ACP les envoie pendant `newSession` ou `loadSession`, le pont renvoie une erreur claire au lieu de les ignorer silencieusement.

Si vous souhaitez que des sessions adossées à ACPX voient les outils de plugin OpenClaw, activez le pont de plugin ACPX côté passerelle au lieu d’essayer de transmettre des `mcpServers` par session. Consultez [ACP Agents](/tools/acp-agents#plugin-tools-mcp-bridge).

## Utilisation depuis `acpx` (Codex, Claude, autres clients ACP)

Si vous souhaitez qu’un agent de programmation tel que Codex ou Claude Code parle à votre bot OpenClaw via ACP, utilisez `acpx` avec sa cible intégrée `openclaw`.

Flux typique :

1. Exécutez la passerelle et assurez-vous que le pont ACP peut l’atteindre.
2. Faites pointer `acpx openclaw` vers `openclaw acp`.
3. Ciblez la clé de session OpenClaw que vous souhaitez utiliser pour l’agent de programmation.

Exemples :

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Si vous souhaitez que `acpx openclaw` cible à chaque fois une passerelle et une clé de session spécifiques, remplacez la commande de l’agent `openclaw` dans `~/.acpx/config.json` :

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Pour une extraction OpenClaw locale au dépôt, utilisez le point d’entrée CLI direct au lieu du lanceur de développement afin que le flux ACP reste propre. Par exemple :

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

C’est le moyen le plus simple de permettre à Codex, Claude Code ou un autre client compatible ACP de récupérer des informations contextuelles depuis un agent OpenClaw sans analyser un terminal.

## Configuration de l’éditeur Zed

Ajoutez un agent ACP personnalisé dans `~/.config/zed/settings.json` (ou utilisez l’interface Paramètres de Zed) :

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

Pour cibler une passerelle ou un agent spécifique :

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

Dans Zed, ouvrez le panneau Agent et sélectionnez « OpenClaw ACP » pour démarrer un fil.

## Mappage de session

Par défaut, les sessions ACP obtiennent une clé de session de passerelle isolée avec un préfixe `acp:`.
Pour réutiliser une session connue, transmettez une clé de session ou un libellé :

- `--session <key>` : utilise une clé de session de passerelle spécifique.
- `--session-label <label>` : résout une session existante par libellé.
- `--reset-session` : génère un nouvel ID de session pour cette clé (même clé, nouvelle transcription).

Si votre client ACP prend en charge les métadonnées, vous pouvez remplacer les valeurs par session :

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

En savoir plus sur les clés de session dans [/concepts/session](/concepts/session).

## Options

- `--url <url>` : URL WebSocket de la passerelle (par défaut `gateway.remote.url` lorsqu’elle est configurée).
- `--token <token>` : jeton d’authentification de la passerelle.
- `--token-file <path>` : lire le jeton d’authentification de la passerelle depuis un fichier.
- `--password <password>` : mot de passe d’authentification de la passerelle.
- `--password-file <path>` : lire le mot de passe d’authentification de la passerelle depuis un fichier.
- `--session <key>` : clé de session par défaut.
- `--session-label <label>` : libellé de session par défaut à résoudre.
- `--require-existing` : échoue si la clé/libellé de session n’existe pas.
- `--reset-session` : réinitialise la clé de session avant la première utilisation.
- `--no-prefix-cwd` : ne pas préfixer les invites avec le répertoire de travail.
- `--provenance <off|meta|meta+receipt>` : inclure des métadonnées ACP de provenance ou des reçus.
- `--verbose, -v` : journalisation verbeuse vers stderr.

Remarque de sécurité :

- `--token` et `--password` peuvent être visibles dans les listes de processus locales sur certains systèmes.
- Préférez `--token-file`/`--password-file` ou les variables d’environnement (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- La résolution de l’authentification de la passerelle suit le contrat partagé utilisé par les autres clients de passerelle :
  - mode local : env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> repli `gateway.remote.*` uniquement lorsque `gateway.auth.*` n’est pas défini (les SecretRef locaux configurés mais non résolus échouent en mode fail-closed)
  - mode distant : `gateway.remote.*` avec repli env/config selon les règles de priorité du mode distant
  - `--url` est sûr pour les remplacements et ne réutilise pas d’identifiants implicites de config/env ; transmettez explicitement `--token`/`--password` (ou leurs variantes fichier)
- Les processus enfants du backend runtime ACP reçoivent `OPENCLAW_SHELL=acp`, qui peut être utilisé pour des règles shell/profil spécifiques au contexte.
- `openclaw acp client` définit `OPENCLAW_SHELL=acp-client` sur le processus de pont lancé.

### Options de `acp client`

- `--cwd <dir>` : répertoire de travail pour la session ACP.
- `--server <command>` : commande du serveur ACP (par défaut : `openclaw`).
- `--server-args <args...>` : arguments supplémentaires passés au serveur ACP.
- `--server-verbose` : active la journalisation verbeuse sur le serveur ACP.
- `--verbose, -v` : journalisation verbeuse côté client.
