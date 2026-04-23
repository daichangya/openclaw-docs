---
read_when:
    - Exécution du Gateway depuis la CLI (développement ou serveurs)
    - Débogage de l’authentification du Gateway, des modes de liaison et de la connectivité
    - Découverte des Gateways via Bonjour (local + DNS-SD à grande échelle)
summary: CLI Gateway OpenClaw (`openclaw gateway`) — exécuter, interroger et découvrir les Gateways
title: Gateway
x-i18n:
    generated_at: "2026-04-23T13:58:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9160017a4d1326819f6b4d067bd99aa02ee37689b96c185defedef6200c19cf
    source_path: cli/gateway.md
    workflow: 15
---

# CLI Gateway

Le Gateway est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks).

Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

Documentation associée :

- [/gateway/bonjour](/fr/gateway/bonjour)
- [/gateway/discovery](/fr/gateway/discovery)
- [/gateway/configuration](/fr/gateway/configuration)

## Exécuter le Gateway

Exécutez un processus Gateway local :

```bash
openclaw gateway
```

Alias au premier plan :

```bash
openclaw gateway run
```

Remarques :

- Par défaut, le Gateway refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour des exécutions ad hoc/de développement.
- `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, considérez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
- Si le fichier existe et que `gateway.mode` est absent, le Gateway considère cela comme un dommage suspect dans la configuration et refuse de « supposer le mode local » à votre place.
- La liaison au-delà du loopback sans authentification est bloquée (garde-fou de sécurité).
- `SIGUSR1` déclenche un redémarrage en cours de processus lorsque c’est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’outil gateway et l’application/mise à jour de la configuration restent autorisés).
- Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus gateway, mais ils ne restaurent pas un état personnalisé du terminal. Si vous encapsulez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant de quitter.

### Options

- `--port <port>` : port WebSocket (la valeur par défaut vient de la config/de l’environnement ; généralement `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>` : mode de liaison de l’écouteur.
- `--auth <token|password>` : remplacement du mode d’authentification.
- `--token <token>` : remplacement du token (définit aussi `OPENCLAW_GATEWAY_TOKEN` pour le processus).
- `--password <password>` : remplacement du mot de passe. Avertissement : les mots de passe en ligne peuvent être exposés dans les listes locales de processus.
- `--password-file <path>` : lit le mot de passe du gateway depuis un fichier.
- `--tailscale <off|serve|funnel>` : expose le Gateway via Tailscale.
- `--tailscale-reset-on-exit` : réinitialise la configuration serve/funnel de Tailscale à l’arrêt.
- `--allow-unconfigured` : autorise le démarrage du gateway sans `gateway.mode=local` dans la config. Cela contourne la protection au démarrage uniquement pour l’amorçage ad hoc/de développement ; cela n’écrit ni ne répare le fichier de configuration.
- `--dev` : crée une config et un espace de travail de développement s’ils sont absents (ignore `BOOTSTRAP.md`).
- `--reset` : réinitialise la config de développement + les identifiants + les sessions + l’espace de travail (nécessite `--dev`).
- `--force` : tue tout écouteur existant sur le port sélectionné avant le démarrage.
- `--verbose` : logs détaillés.
- `--cli-backend-logs` : affiche uniquement les logs du backend CLI dans la console (et active stdout/stderr).
- `--ws-log <auto|full|compact>` : style de log websocket (par défaut `auto`).
- `--compact` : alias de `--ws-log compact`.
- `--raw-stream` : journalise les événements bruts du flux du modèle vers jsonl.
- `--raw-stream-path <path>` : chemin du jsonl de flux brut.

Profilage du démarrage :

- Définissez `OPENCLAW_GATEWAY_STARTUP_TRACE=1` pour journaliser les timings des phases pendant le démarrage du Gateway.
- Exécutez `pnpm test:startup:gateway -- --runs 5 --warmup 1` pour mesurer le démarrage du Gateway. Le benchmark enregistre la première sortie du processus, `/healthz`, `/readyz` et les timings de trace du démarrage.

## Interroger un Gateway en cours d’exécution

Toutes les commandes de requête utilisent WebSocket RPC.

Modes de sortie :

- Par défaut : lisible par un humain (coloré dans un TTY).
- `--json` : JSON lisible par une machine (sans style/spinner).
- `--no-color` (ou `NO_COLOR=1`) : désactive ANSI tout en conservant la mise en page humaine.

Options partagées (lorsque prises en charge) :

- `--url <url>` : URL WebSocket du Gateway.
- `--token <token>` : token du Gateway.
- `--password <password>` : mot de passe du Gateway.
- `--timeout <ms>` : délai/budget (varie selon la commande).
- `--expect-final` : attend une réponse « finale » (appels d’agent).

Remarque : lorsque vous définissez `--url`, la CLI ne revient pas aux identifiants de la config ou de l’environnement.
Passez `--token` ou `--password` explicitement. L’absence d’identifiants explicites est une erreur.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

Le point de terminaison HTTP `/healthz` est une sonde de vivacité : il répond dès que le serveur peut répondre en HTTP. Le point de terminaison HTTP `/readyz` est plus strict et reste en échec tant que les sidecars de démarrage, les canaux ou les hooks configurés ne sont pas encore stabilisés.

### `gateway usage-cost`

Récupère les résumés de coût d’utilisation à partir des logs de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Options :

- `--days <days>` : nombre de jours à inclure (par défaut `30`).

### `gateway stability`

Récupère l’enregistreur récent de stabilité diagnostique depuis un Gateway en cours d’exécution.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

Options :

- `--limit <limit>` : nombre maximal d’événements récents à inclure (par défaut `25`, max `1000`).
- `--type <type>` : filtre par type d’événement diagnostique, tel que `payload.large` ou `diagnostic.memory.pressure`.
- `--since-seq <seq>` : inclut uniquement les événements après un numéro de séquence diagnostique.
- `--bundle [path]` : lit un bundle de stabilité persistant au lieu d’appeler le Gateway en cours d’exécution. Utilisez `--bundle latest` (ou simplement `--bundle`) pour le bundle le plus récent sous le répertoire d’état, ou passez directement un chemin JSON de bundle.
- `--export` : écrit un zip de diagnostic d’assistance partageable au lieu d’afficher les détails de stabilité.
- `--output <path>` : chemin de sortie pour `--export`.

Remarques :

- Les enregistrements conservent des métadonnées opérationnelles : noms d’événements, nombres, tailles en octets, mesures de mémoire, état des files/sessions, noms de canaux/plugins et résumés de session expurgés. Ils ne conservent pas le texte des conversations, les corps de Webhook, les sorties d’outils, les corps bruts de requêtes ou de réponses, les tokens, les cookies, les valeurs secrètes, les noms d’hôte ni les identifiants bruts de session. Définissez `diagnostics.enabled: false` pour désactiver complètement l’enregistreur.
- Lors des sorties fatales du Gateway, des délais d’arrêt dépassés et des échecs de démarrage après redémarrage, OpenClaw écrit le même instantané diagnostique dans `~/.openclaw/logs/stability/openclaw-stability-*.json` lorsque l’enregistreur contient des événements. Inspectez le bundle le plus récent avec `openclaw gateway stability --bundle latest` ; `--limit`, `--type` et `--since-seq` s’appliquent aussi à la sortie du bundle.

### `gateway diagnostics export`

Écrit un zip de diagnostic local conçu pour être joint à des rapports de bogue.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

Options :

- `--output <path>` : chemin du zip de sortie. Par défaut, un export d’assistance sous le répertoire d’état.
- `--log-lines <count>` : nombre maximal de lignes de log nettoyées à inclure (par défaut `5000`).
- `--log-bytes <bytes>` : nombre maximal d’octets de log à inspecter (par défaut `1000000`).
- `--url <url>` : URL WebSocket du Gateway pour l’instantané de santé.
- `--token <token>` : token du Gateway pour l’instantané de santé.
- `--password <password>` : mot de passe du Gateway pour l’instantané de santé.
- `--timeout <ms>` : délai de l’instantané d’état/de santé (par défaut `3000`).
- `--no-stability-bundle` : ignore la recherche de bundle de stabilité persistant.
- `--json` : affiche en JSON le chemin écrit, la taille et le manifeste.

L’export contient un manifeste, un résumé Markdown, la forme de la config, les détails de config nettoyés, des résumés de logs nettoyés, des instantanés nettoyés de l’état/de la santé du Gateway, et le bundle de stabilité le plus récent lorsqu’il existe.

Il est destiné à être partagé. Il conserve des détails opérationnels utiles au débogage, comme des champs de log OpenClaw sûrs, des noms de sous-systèmes, des codes d’état, des durées, des modes configurés, des ports, des identifiants de plugins, des identifiants de fournisseurs, des paramètres de fonctionnalités non secrets et des messages de log opérationnels expurgés. Il omet ou expurge le texte des conversations, les corps de Webhook, les sorties d’outils, les identifiants, les cookies, les identifiants de compte/message, le texte des prompts/instructions, les noms d’hôte et les valeurs secrètes. Lorsqu’un message de type LogTape ressemble à du texte de charge utile utilisateur/conversation/outil, l’export conserve seulement qu’un message a été omis ainsi que son nombre d’octets.

### `gateway status`

`gateway status` affiche le service Gateway (launchd/systemd/schtasks) ainsi qu’une sonde facultative de connectivité/capacité d’authentification.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Options :

- `--url <url>` : ajoute une cible de sonde explicite. La cible distante configurée + localhost sont toujours sondées.
- `--token <token>` : authentification par token pour la sonde.
- `--password <password>` : authentification par mot de passe pour la sonde.
- `--timeout <ms>` : délai de la sonde (par défaut `10000`).
- `--no-probe` : ignore la sonde de connectivité (vue service uniquement).
- `--deep` : analyse aussi les services au niveau système.
- `--require-rpc` : élève la sonde de connectivité par défaut en sonde de lecture et sort avec une valeur non nulle si cette sonde de lecture échoue. Ne peut pas être combiné avec `--no-probe`.

Remarques :

- `gateway status` reste disponible pour le diagnostic même lorsque la configuration locale de la CLI est absente ou invalide.
- Par défaut, `gateway status` prouve l’état du service, la connexion WebSocket et la capacité d’authentification visible au moment du handshake. Il ne prouve pas les opérations de lecture/écriture/admin.
- `gateway status` résout les SecretRefs d’authentification configurés pour l’authentification de la sonde lorsque c’est possible.
- Si un SecretRef d’authentification requis n’est pas résolu dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/authentification de la sonde échoue ; passez `--token`/`--password` explicitement ou résolvez d’abord la source du secret.
- Si la sonde réussit, les avertissements d’auth-ref non résolus sont masqués pour éviter les faux positifs.
- Utilisez `--require-rpc` dans les scripts et l’automatisation lorsqu’un service à l’écoute ne suffit pas et que vous avez besoin que les appels RPC avec portée de lecture soient aussi sains.
- `--deep` ajoute une analyse au mieux des installations supplémentaires launchd/systemd/schtasks. Lorsque plusieurs services de type gateway sont détectés, la sortie humaine affiche des conseils de nettoyage et avertit que la plupart des installations devraient exécuter un gateway par machine.
- La sortie humaine inclut le chemin résolu du fichier de log ainsi qu’un instantané des chemins/validités de configuration CLI-vs-service pour aider à diagnostiquer une dérive de profil ou de répertoire d’état.
- Sur les installations Linux systemd, les vérifications de dérive d’authentification du service lisent les valeurs `Environment=` et `EnvironmentFile=` de l’unité (y compris `%h`, les chemins entre guillemets, plusieurs fichiers et les fichiers facultatifs `-`).
- Les vérifications de dérive résolvent les SecretRefs `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (environnement de commande du service d’abord, puis repli sur l’environnement du processus).
- Si l’authentification par token n’est pas effectivement active (mode `gateway.auth.mode` explicite à `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et où aucun candidat token ne peut l’emporter), les vérifications de dérive du token ignorent la résolution du token de configuration.

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre gateway distant configuré (si défini), et
- localhost (loopback) **même si un distant est configuré**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux autres. La sortie humaine étiquette les
cibles comme suit :

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

Si plusieurs Gateways sont joignables, elle les affiche tous. Plusieurs Gateways sont pris en charge lorsque vous utilisez des profils/ports isolés (par exemple, un bot de secours), mais la plupart des installations exécutent quand même un seul gateway.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interprétation :

- `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` indique ce que la sonde a pu prouver au sujet de l’authentification. C’est distinct de l’accessibilité.
- `Read probe: ok` signifie que les appels RPC de détail à portée de lecture (`health`/`status`/`system-presence`/`config.get`) ont aussi réussi.
- `Read probe: limited - missing scope: operator.read` signifie que la connexion a réussi mais que le RPC à portée de lecture est limité. Cela est signalé comme une accessibilité **dégradée**, pas comme un échec complet.
- Le code de sortie est non nul seulement lorsqu’aucune cible sondée n’est joignable.

Remarques JSON (`--json`) :

- Niveau supérieur :
  - `ok` : au moins une cible est joignable.
  - `degraded` : au moins une cible avait un RPC de détail limité par la portée.
  - `capability` : meilleure capacité observée parmi les cibles joignables (`read_only`, `write_capable`, `admin_capable`, `pairing_pending`, `connected_no_operator_scope` ou `unknown`).
  - `primaryTargetId` : meilleure cible à traiter comme gagnante active dans cet ordre : URL explicite, tunnel SSH, distant configuré, puis loopback local.
  - `warnings[]` : enregistrements d’avertissement au mieux avec `code`, `message` et éventuellement `targetIds`.
  - `network` : indications d’URL loopback local/tailnet dérivées de la configuration actuelle et du réseau de l’hôte.
  - `discovery.timeoutMs` et `discovery.count` : budget/résultat de découverte réellement utilisés pour ce passage de sonde.
- Par cible (`targets[].connect`) :
  - `ok` : accessibilité après connexion + classification dégradée.
  - `rpcOk` : succès complet du RPC de détail.
  - `scopeLimited` : le RPC de détail a échoué à cause de l’absence de portée opérateur.
- Par cible (`targets[].auth`) :
  - `role` : rôle d’authentification signalé dans `hello-ok` lorsqu’il est disponible.
  - `scopes` : portées accordées signalées dans `hello-ok` lorsqu’elles sont disponibles.
  - `capability` : classification de capacité d’authentification exposée pour cette cible.

Codes d’avertissement courants :

- `ssh_tunnel_failed` : la configuration du tunnel SSH a échoué ; la commande est revenue aux sondes directes.
- `multiple_gateways` : plus d’une cible était joignable ; c’est inhabituel sauf si vous exécutez intentionnellement des profils isolés, comme un bot de secours.
- `auth_secretref_unresolved` : un SecretRef d’authentification configuré n’a pas pu être résolu pour une cible en échec.
- `probe_scope_limited` : la connexion WebSocket a réussi, mais la sonde de lecture a été limitée par l’absence de `operator.read`.

#### Distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’app macOS utilise une redirection de port locale pour que le gateway distant (qui peut n’être lié qu’au loopback) devienne joignable à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

Options :

- `--ssh <target>` : `user@host` ou `user@host:port` (le port par défaut est `22`).
- `--ssh-identity <path>` : fichier d’identité.
- `--ssh-auto` : choisit le premier hôte gateway découvert comme cible SSH à partir du point de terminaison de découverte résolu (`local.` plus le domaine wide-area configuré, le cas échéant). Les indications TXT seules sont ignorées.

Configuration (facultative, utilisée comme valeur par défaut) :

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

Assistant RPC de bas niveau.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

Options :

- `--params <json>` : chaîne d’objet JSON pour les paramètres (par défaut `{}`)
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

Remarques :

- `--params` doit être un JSON valide.
- `--expect-final` est principalement destiné aux RPC de type agent qui diffusent des événements intermédiaires avant une charge utile finale.

## Gérer le service Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Options des commandes :

- `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart` : `--json`

Remarques :

- `gateway install` prend en charge `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Lorsque l’authentification par token exige un token et que `gateway.auth.token` est géré par SecretRef, `gateway install` valide que le SecretRef peut être résolu, mais ne conserve pas le token résolu dans les métadonnées d’environnement du service.
- Si l’authentification par token exige un token et que le SecretRef du token configuré n’est pas résolu, l’installation échoue de manière fermée au lieu de conserver un texte brut de secours.
- Pour l’authentification par mot de passe avec `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à SecretRef plutôt qu’un `--password` en ligne.
- En mode d’authentification inféré, `OPENCLAW_GATEWAY_PASSWORD` uniquement dans le shell n’assouplit pas les exigences de token pour l’installation ; utilisez une configuration durable (`gateway.auth.password` ou `env` de configuration) lors de l’installation d’un service géré.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Les commandes de cycle de vie acceptent `--json` pour les scripts.

## Découvrir les Gateways (Bonjour)

`gateway discover` analyse les balises Gateway (`_openclaw-gw._tcp`).

- DNS-SD multicast : `local.`
- DNS-SD unicast (Wide-Area Bonjour) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un split DNS + un serveur DNS ; voir [/gateway/bonjour](/fr/gateway/bonjour)

Seuls les Gateways avec la découverte Bonjour activée (par défaut) annoncent la balise.

Les enregistrements de découverte wide-area incluent (TXT) :

- `role` (indication du rôle du gateway)
- `transport` (indication du transport, par ex. `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (facultatif ; les clients utilisent `22` par défaut pour les cibles SSH lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indication d’installation distante écrite dans la zone wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Options :

- `--timeout <ms>` : délai par commande (browse/resolve) ; par défaut `2000`.
- `--json` : sortie lisible par une machine (désactive aussi le style/spinner).

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Remarques :

- La CLI analyse `local.` plus le domaine wide-area configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indications TXT seules comme `lanHost` ou `tailnetDns`.
- Sur mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque `discovery.mdns.mode` vaut `full`. Le DNS-SD wide-area écrit toujours `cliPath` ; `sshPort` y reste également facultatif.
