---
read_when:
    - Exécution de la passerelle depuis la CLI (dev ou serveurs)
    - Débogage de l’authentification, des modes de liaison et de la connectivité de la passerelle
    - Découverte de passerelles via Bonjour (DNS-SD local + étendu)
summary: CLI OpenClaw Gateway (`openclaw gateway`) — exécuter, interroger et découvrir des passerelles
title: gateway
x-i18n:
    generated_at: "2026-04-05T12:38:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# CLI de la passerelle

La passerelle est le serveur WebSocket d’OpenClaw (canaux, nœuds, sessions, hooks).

Les sous-commandes de cette page se trouvent sous `openclaw gateway …`.

Documentation associée :

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

## Exécuter la passerelle

Exécutez un processus de passerelle local :

```bash
openclaw gateway
```

Alias de premier plan :

```bash
openclaw gateway run
```

Remarques :

- Par défaut, la passerelle refuse de démarrer sauf si `gateway.mode=local` est défini dans `~/.openclaw/openclaw.json`. Utilisez `--allow-unconfigured` pour des exécutions ad hoc/de dev.
- `openclaw onboard --mode local` et `openclaw setup` sont censés écrire `gateway.mode=local`. Si le fichier existe mais que `gateway.mode` est absent, traitez cela comme une configuration cassée ou écrasée et réparez-la au lieu de supposer implicitement le mode local.
- Si le fichier existe et que `gateway.mode` est absent, la passerelle traite cela comme un dommage de configuration suspect et refuse de « deviner local » à votre place.
- Une liaison au-delà du loopback sans auth est bloquée (garde-fou de sécurité).
- `SIGUSR1` déclenche un redémarrage dans le processus lorsqu’il est autorisé (`commands.restart` est activé par défaut ; définissez `commands.restart: false` pour bloquer le redémarrage manuel, tandis que l’application/mise à jour de l’outil/config de passerelle reste autorisée).
- Les gestionnaires `SIGINT`/`SIGTERM` arrêtent le processus de passerelle, mais ils ne restaurent pas un éventuel état personnalisé du terminal. Si vous encapsulez la CLI avec une TUI ou une entrée en mode brut, restaurez le terminal avant de quitter.

### Options

- `--port <port>` : port WebSocket (la valeur par défaut provient de la config/env ; généralement `18789`).
- `--bind <loopback|lan|tailnet|auto|custom>` : mode de liaison de l’écouteur.
- `--auth <token|password>` : remplacement du mode d’authentification.
- `--token <token>` : remplacement du jeton (définit également `OPENCLAW_GATEWAY_TOKEN` pour le processus).
- `--password <password>` : remplacement du mot de passe. Avertissement : les mots de passe en ligne peuvent être exposés dans les listes locales de processus.
- `--password-file <path>` : lire le mot de passe de la passerelle depuis un fichier.
- `--tailscale <off|serve|funnel>` : exposer la passerelle via Tailscale.
- `--tailscale-reset-on-exit` : réinitialiser la configuration Tailscale serve/funnel à l’arrêt.
- `--allow-unconfigured` : autoriser le démarrage de la passerelle sans `gateway.mode=local` dans la configuration. Cela contourne le garde-fou de démarrage uniquement pour un bootstrap ad hoc/de dev ; cela n’écrit ni ne répare le fichier de configuration.
- `--dev` : créer une config + un espace de travail de dev s’ils sont absents (ignore `BOOTSTRAP.md`).
- `--reset` : réinitialiser la config de dev + les identifiants + les sessions + l’espace de travail (nécessite `--dev`).
- `--force` : tuer tout écouteur existant sur le port sélectionné avant de démarrer.
- `--verbose` : journaux détaillés.
- `--cli-backend-logs` : afficher uniquement les journaux du backend CLI dans la console (et activer stdout/stderr).
- `--claude-cli-logs` : alias obsolète pour `--cli-backend-logs`.
- `--ws-log <auto|full|compact>` : style de journal WebSocket (par défaut `auto`).
- `--compact` : alias pour `--ws-log compact`.
- `--raw-stream` : journaliser les événements bruts du flux de modèle vers jsonl.
- `--raw-stream-path <path>` : chemin jsonl du flux brut.

## Interroger une passerelle en cours d’exécution

Toutes les commandes d’interrogation utilisent la RPC WebSocket.

Modes de sortie :

- Par défaut : lisible par l’humain (coloré dans un TTY).
- `--json` : JSON lisible par machine (sans style/spinner).
- `--no-color` (ou `NO_COLOR=1`) : désactiver l’ANSI tout en conservant la mise en page lisible.

Options partagées (lorsqu’elles sont prises en charge) :

- `--url <url>` : URL WebSocket de la passerelle.
- `--token <token>` : jeton de la passerelle.
- `--password <password>` : mot de passe de la passerelle.
- `--timeout <ms>` : délai/budget (varie selon la commande).
- `--expect-final` : attendre une réponse « finale » (appels d’agent).

Remarque : lorsque vous définissez `--url`, la CLI ne retombe pas sur les identifiants de configuration ou d’environnement.
Passez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

Récupérez des résumés de coût d’utilisation depuis les journaux de session.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

Options :

- `--days <days>` : nombre de jours à inclure (par défaut `30`).

### `gateway status`

`gateway status` affiche le service de passerelle (launchd/systemd/schtasks) plus une probe RPC facultative.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

Options :

- `--url <url>` : ajouter une cible de probe explicite. La cible distante configurée + localhost sont toujours sondés.
- `--token <token>` : auth par jeton pour la probe.
- `--password <password>` : auth par mot de passe pour la probe.
- `--timeout <ms>` : délai de probe (par défaut `10000`).
- `--no-probe` : ignorer la probe RPC (vue service uniquement).
- `--deep` : analyser aussi les services au niveau système.
- `--require-rpc` : quitter avec un code non nul si la probe RPC échoue. Ne peut pas être combiné avec `--no-probe`.

Remarques :

- `gateway status` reste disponible pour le diagnostic même lorsque la configuration CLI locale est absente ou invalide.
- `gateway status` résout les SecretRef d’authentification configurés pour l’auth de probe lorsque c’est possible.
- Si un SecretRef d’auth requis n’est pas résolu dans ce chemin de commande, `gateway status --json` signale `rpc.authWarning` lorsque la connectivité/auth de probe échoue ; passez explicitement `--token`/`--password` ou résolvez d’abord la source du secret.
- Si la probe réussit, les avertissements d’auth-ref non résolus sont masqués pour éviter les faux positifs.
- Utilisez `--require-rpc` dans les scripts et automatisations lorsqu’un service à l’écoute ne suffit pas et que vous avez besoin que la RPC de la passerelle elle-même soit saine.
- `--deep` ajoute une analyse best-effort des installations launchd/systemd/schtasks supplémentaires. Lorsque plusieurs services de type passerelle sont détectés, la sortie lisible affiche des conseils de nettoyage et avertit que la plupart des configurations ne devraient exécuter qu’une passerelle par machine.
- La sortie lisible inclut le chemin résolu du journal de fichier ainsi qu’un instantané des chemins/validités de configuration CLI-vs-service pour aider à diagnostiquer une dérive de profil ou de répertoire d’état.
- Sur les installations Linux systemd, les vérifications de dérive d’auth de service lisent à la fois les valeurs `Environment=` et `EnvironmentFile=` de l’unité (y compris `%h`, les chemins entre guillemets, plusieurs fichiers et les fichiers facultatifs `-`).
- Les vérifications de dérive résolvent les SecretRef `gateway.auth.token` à l’aide de l’environnement d’exécution fusionné (env de commande du service d’abord, puis repli sur l’env du processus).
- Si l’auth par jeton n’est pas effectivement active (mode explicite `gateway.auth.mode` de `password`/`none`/`trusted-proxy`, ou mode non défini où le mot de passe peut l’emporter et aucun candidat jeton ne peut l’emporter), les vérifications de dérive de jeton ignorent la résolution du jeton de configuration.

### `gateway probe`

`gateway probe` est la commande « tout déboguer ». Elle sonde toujours :

- votre passerelle distante configurée (si définie), et
- le loopback localhost **même si une cible distante est configurée**.

Si vous passez `--url`, cette cible explicite est ajoutée avant les deux. La sortie lisible étiquette les
cibles comme :

- `URL (explicit)`
- `Remote (configured)` ou `Remote (configured, inactive)`
- `Local loopback`

Si plusieurs passerelles sont joignables, elle les affiche toutes. Plusieurs passerelles sont prises en charge lorsque vous utilisez des profils/ports isolés (par ex. un bot de secours), mais la plupart des installations n’exécutent toujours qu’une seule passerelle.

```bash
openclaw gateway probe
openclaw gateway probe --json
```

Interprétation :

- `Reachable: yes` signifie qu’au moins une cible a accepté une connexion WebSocket.
- `RPC: ok` signifie que les appels RPC de détail (`health`/`status`/`system-presence`/`config.get`) ont également réussi.
- `RPC: limited - missing scope: operator.read` signifie que la connexion a réussi mais que la RPC de détail est limitée par la portée. Cela est signalé comme une joignabilité **dégradée**, et non comme un échec complet.
- Le code de sortie n’est non nul que lorsqu’aucune cible sondée n’est joignable.

Remarques JSON (`--json`) :

- Niveau supérieur :
  - `ok` : au moins une cible est joignable.
  - `degraded` : au moins une cible avait une RPC de détail limitée par la portée.
  - `primaryTargetId` : meilleure cible à traiter comme gagnante active dans cet ordre : URL explicite, tunnel SSH, distante configurée, puis local loopback.
  - `warnings[]` : enregistrements d’avertissement best-effort avec `code`, `message` et éventuellement `targetIds`.
  - `network` : indications d’URL local loopback/tailnet dérivées de la config actuelle et du réseau de l’hôte.
  - `discovery.timeoutMs` et `discovery.count` : budget/résultat de découverte réellement utilisés pour ce passage de probe.
- Par cible (`targets[].connect`) :
  - `ok` : joignabilité après connexion + classification dégradée.
  - `rpcOk` : succès complet de la RPC de détail.
  - `scopeLimited` : échec de la RPC de détail dû à l’absence de portée opérateur.

Codes d’avertissement courants :

- `ssh_tunnel_failed` : l’établissement du tunnel SSH a échoué ; la commande a basculé sur des probes directes.
- `multiple_gateways` : plusieurs cibles étaient joignables ; c’est inhabituel sauf si vous exécutez intentionnellement des profils isolés, comme un bot de secours.
- `auth_secretref_unresolved` : un SecretRef d’auth configuré n’a pas pu être résolu pour une cible en échec.
- `probe_scope_limited` : la connexion WebSocket a réussi, mais la RPC de détail était limitée par l’absence de portée `operator.read`.

#### Distant via SSH (parité avec l’app Mac)

Le mode « Remote over SSH » de l’app macOS utilise une redirection de port locale afin que la passerelle distante (qui peut être liée uniquement au loopback) devienne joignable à `ws://127.0.0.1:<port>`.

Équivalent CLI :

```bash
openclaw gateway probe --ssh user@gateway-host
```

Options :

- `--ssh <target>` : `user@host` ou `user@host:port` (le port vaut `22` par défaut).
- `--ssh-identity <path>` : fichier d’identité.
- `--ssh-auto` : choisir le premier hôte de passerelle découvert comme cible SSH depuis le point de terminaison de découverte résolu (`local.` plus le domaine étendu configuré, le cas échéant). Les indications TXT-only sont ignorées.

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
- `--expect-final` est principalement destiné aux RPC de style agent qui diffusent des événements intermédiaires avant une charge utile finale.

## Gérer le service de passerelle

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

Options de commande :

- `gateway status` : `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `gateway install` : `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `gateway uninstall|start|stop|restart` : `--json`

Remarques :

- `gateway install` prend en charge `--port`, `--runtime`, `--token`, `--force`, `--json`.
- Lorsque l’auth par jeton nécessite un jeton et que `gateway.auth.token` est géré par SecretRef, `gateway install` valide que le SecretRef peut être résolu mais ne persiste pas le jeton résolu dans les métadonnées d’environnement du service.
- Si l’auth par jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’installation échoue en mode fermé au lieu de persister un texte brut de secours.
- Pour l’auth par mot de passe sur `gateway run`, préférez `OPENCLAW_GATEWAY_PASSWORD`, `--password-file` ou un `gateway.auth.password` adossé à SecretRef plutôt qu’un `--password` inline.
- En mode d’auth déduit, `OPENCLAW_GATEWAY_PASSWORD` limité au shell n’assouplit pas les exigences de jeton pour l’installation ; utilisez une config durable (`gateway.auth.password` ou config `env`) lors de l’installation d’un service géré.
- Si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’installation est bloquée jusqu’à ce que le mode soit défini explicitement.
- Les commandes de cycle de vie acceptent `--json` pour les scripts.

## Découvrir des passerelles (Bonjour)

`gateway discover` analyse les balises de passerelle (`_openclaw-gw._tcp`).

- DNS-SD multicast : `local.`
- DNS-SD unicast (Wide-Area Bonjour) : choisissez un domaine (exemple : `openclaw.internal.`) et configurez un split DNS + un serveur DNS ; voir [/gateway/bonjour](/gateway/bonjour)

Seules les passerelles avec la découverte Bonjour activée (par défaut) publient la balise.

Les enregistrements de découverte Wide-Area incluent (TXT) :

- `role` (indication du rôle de la passerelle)
- `transport` (indication du transport, par ex. `gateway`)
- `gatewayPort` (port WebSocket, généralement `18789`)
- `sshPort` (facultatif ; les clients définissent par défaut les cibles SSH sur `22` lorsqu’il est absent)
- `tailnetDns` (nom d’hôte MagicDNS, lorsqu’il est disponible)
- `gatewayTls` / `gatewayTlsSha256` (TLS activé + empreinte du certificat)
- `cliPath` (indication d’installation distante écrite dans la zone wide-area)

### `gateway discover`

```bash
openclaw gateway discover
```

Options :

- `--timeout <ms>` : délai par commande (browse/resolve) ; par défaut `2000`.
- `--json` : sortie lisible par machine (désactive également le style/spinner).

Exemples :

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

Remarques :

- La CLI analyse `local.` plus le domaine wide-area configuré lorsqu’il est activé.
- `wsUrl` dans la sortie JSON est dérivé du point de terminaison de service résolu, et non d’indications TXT-only telles que `lanHost` ou `tailnetDns`.
- En mDNS `local.`, `sshPort` et `cliPath` ne sont diffusés que lorsque
  `discovery.mdns.mode` vaut `full`. Le DNS-SD wide-area écrit toujours `cliPath` ; `sshPort`
  y reste également facultatif.
