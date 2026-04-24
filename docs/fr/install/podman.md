---
read_when:
    - Vous souhaitez un gateway conteneurisé avec Podman au lieu de Docker
summary: Exécuter OpenClaw dans un conteneur Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-24T07:17:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 559ac707e0a3ef173d0300ee2f8c6f4ed664ff5afbf1e3f1848312a9d441e9e4
    source_path: install/podman.md
    workflow: 15
---

Exécutez le Gateway OpenClaw dans un conteneur Podman rootless, géré par votre utilisateur non root actuel.

Le modèle prévu est le suivant :

- Podman exécute le conteneur gateway.
- Votre CLI `openclaw` sur l’hôte est le plan de contrôle.
- L’état persistant vit sur l’hôte sous `~/.openclaw` par défaut.
- La gestion quotidienne utilise `openclaw --container <name> ...` au lieu de `sudo -u openclaw`, `podman exec`, ou d’un utilisateur de service séparé.

## Prérequis

- **Podman** en mode rootless
- **CLI OpenClaw** installé sur l’hôte
- **Facultatif :** `systemd --user` si vous voulez un démarrage automatique géré par Quadlet
- **Facultatif :** `sudo` uniquement si vous voulez `loginctl enable-linger "$(whoami)"` pour la persistance au démarrage sur un hôte headless

## Démarrage rapide

<Steps>
  <Step title="Configuration initiale">
    À la racine du dépôt, exécutez `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Démarrer le conteneur Gateway">
    Démarrez le conteneur avec `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Exécuter l’onboarding dans le conteneur">
    Exécutez `./scripts/run-openclaw-podman.sh launch setup`, puis ouvrez `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gérer le conteneur en cours d’exécution depuis le CLI hôte">
    Définissez `OPENCLAW_CONTAINER=openclaw`, puis utilisez les commandes `openclaw` normales depuis l’hôte.
  </Step>
</Steps>

Détails de configuration :

- `./scripts/podman/setup.sh` construit `openclaw:local` dans votre magasin Podman rootless par défaut, ou utilise `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si vous en définissez une.
- Il crée `~/.openclaw/openclaw.json` avec `gateway.mode: "local"` s’il manque.
- Il crée `~/.openclaw/.env` avec `OPENCLAW_GATEWAY_TOKEN` s’il manque.
- Pour les lancements manuels, le helper ne lit qu’une petite liste d’autorisation de clés liées à Podman depuis `~/.openclaw/.env` et transmet des variables d’environnement d’exécution explicites au conteneur ; il ne donne pas le fichier env complet à Podman.

Configuration gérée par Quadlet :

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet est une option Linux uniquement car elle dépend des services utilisateur systemd.

Vous pouvez aussi définir `OPENCLAW_PODMAN_QUADLET=1`.

Variables d’environnement facultatives de build/configuration :

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- utiliser une image existante/téléchargée au lieu de construire `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installer des paquets apt supplémentaires pendant la construction de l’image
- `OPENCLAW_EXTENSIONS` -- préinstaller les dépendances de Plugin au moment du build

Démarrage du conteneur :

```bash
./scripts/run-openclaw-podman.sh launch
```

Le script démarre le conteneur avec votre uid/gid actuel via `--userns=keep-id` et monte par bind votre état OpenClaw dans le conteneur.

Onboarding :

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ouvrez ensuite `http://127.0.0.1:18789/` et utilisez le jeton de `~/.openclaw/.env`.

CLI hôte par défaut :

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ensuite, des commandes comme celles-ci s’exécuteront automatiquement dans ce conteneur :

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Sur macOS, Podman machine peut donner au navigateur une apparence non locale pour le gateway.
Si l’interface de contrôle signale des erreurs d’authentification d’appareil après le lancement, utilisez les indications Tailscale dans
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Pour HTTPS ou l’accès distant au navigateur, suivez la documentation principale Tailscale.

Remarque spécifique à Podman :

- Gardez l’hôte de publication Podman sur `127.0.0.1`.
- Préférez `tailscale serve` géré par l’hôte à `openclaw gateway --tailscale serve`.
- Sur macOS, si le contexte d’authentification d’appareil du navigateur local n’est pas fiable, utilisez l’accès Tailscale au lieu de contournements locaux ad hoc par tunnel.

Voir :

- [Tailscale](/fr/gateway/tailscale)
- [Interface de contrôle](/fr/web/control-ui)

## Systemd (Quadlet, facultatif)

Si vous avez exécuté `./scripts/podman/setup.sh --quadlet`, la configuration installe un fichier Quadlet à l’emplacement suivant :

```bash
~/.config/containers/systemd/openclaw.container
```

Commandes utiles :

- **Démarrer :** `systemctl --user start openclaw.service`
- **Arrêter :** `systemctl --user stop openclaw.service`
- **État :** `systemctl --user status openclaw.service`
- **Journaux :** `journalctl --user -u openclaw.service -f`

Après modification du fichier Quadlet :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Pour la persistance au démarrage sur les hôtes SSH/headless, activez le lingering pour votre utilisateur courant :

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuration, env et stockage

- **Répertoire de configuration :** `~/.openclaw`
- **Répertoire d’espace de travail :** `~/.openclaw/workspace`
- **Fichier de jeton :** `~/.openclaw/.env`
- **Helper de lancement :** `./scripts/run-openclaw-podman.sh`

Le script de lancement et Quadlet montent l’état de l’hôte dans le conteneur par bind :

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Par défaut, ce sont des répertoires de l’hôte, et non un état anonyme du conteneur, donc
`openclaw.json`, les `auth-profiles.json` par agent, l’état des canaux/providers,
les sessions et l’espace de travail survivent au remplacement du conteneur.
La configuration Podman initialise aussi `gateway.controlUi.allowedOrigins` pour `127.0.0.1` et `localhost` sur le port gateway publié afin que le tableau de bord local fonctionne avec le bind non loopback du conteneur.

Variables d’environnement utiles pour le lanceur manuel :

- `OPENCLAW_PODMAN_CONTAINER` -- nom du conteneur (`openclaw` par défaut)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image à exécuter
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hôte mappé au `18789` du conteneur
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hôte mappé au `18790` du conteneur
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface hôte pour les ports publiés ; la valeur par défaut est `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode de bind du gateway à l’intérieur du conteneur ; par défaut `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (par défaut), `auto`, ou `host`

Le lanceur manuel lit `~/.openclaw/.env` avant de finaliser les valeurs par défaut du conteneur/de l’image, vous pouvez donc les y persister.

Si vous utilisez un `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` non par défaut, définissez les mêmes variables à la fois pour `./scripts/podman/setup.sh` et pour les commandes ultérieures `./scripts/run-openclaw-podman.sh launch`. Le lanceur local au dépôt ne persiste pas les surcharges de chemin personnalisées entre les shells.

Remarque Quadlet :

- Le service Quadlet généré conserve volontairement une forme par défaut fixe et durcie : ports publiés sur `127.0.0.1`, `--bind lan` dans le conteneur, et espace de noms utilisateur `keep-id`.
- Il épingle `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, et `TimeoutStartSec=300`.
- Il publie à la fois `127.0.0.1:18789:18789` (gateway) et `127.0.0.1:18790:18790` (bridge).
- Il lit `~/.openclaw/.env` comme `EnvironmentFile` d’exécution pour des valeurs telles que `OPENCLAW_GATEWAY_TOKEN`, mais il ne consomme pas la liste d’autorisation de surcharges spécifiques à Podman du lanceur manuel.
- Si vous avez besoin de ports publiés personnalisés, d’un hôte de publication différent ou d’autres indicateurs d’exécution du conteneur, utilisez le lanceur manuel ou modifiez directement `~/.config/containers/systemd/openclaw.container`, puis rechargez et redémarrez le service.

## Commandes utiles

- **Journaux du conteneur :** `podman logs -f openclaw`
- **Arrêter le conteneur :** `podman stop openclaw`
- **Supprimer le conteneur :** `podman rm -f openclaw`
- **Ouvrir l’URL du tableau de bord depuis le CLI hôte :** `openclaw dashboard --no-open`
- **Santé/état via le CLI hôte :** `openclaw gateway status --deep` (sonde RPC + analyse de service supplémentaire)

## Dépannage

- **Permission denied (EACCES) sur la configuration ou l’espace de travail :** le conteneur s’exécute par défaut avec `--userns=keep-id` et `--user <your uid>:<your gid>`. Assurez-vous que les chemins de configuration/espace de travail sur l’hôte appartiennent à votre utilisateur actuel.
- **Démarrage du Gateway bloqué (`gateway.mode=local` manquant) :** assurez-vous que `~/.openclaw/openclaw.json` existe et définit `gateway.mode="local"`. `scripts/podman/setup.sh` le crée s’il manque.
- **Les commandes CLI du conteneur visent la mauvaise cible :** utilisez explicitement `openclaw --container <name> ...`, ou exportez `OPENCLAW_CONTAINER=<name>` dans votre shell.
- **`openclaw update` échoue avec `--container` :** comportement attendu. Reconstruisez/téléchargez l’image, puis redémarrez le conteneur ou le service Quadlet.
- **Le service Quadlet ne démarre pas :** exécutez `systemctl --user daemon-reload`, puis `systemctl --user start openclaw.service`. Sur les systèmes headless, vous pouvez aussi avoir besoin de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloque les montages bind :** laissez le comportement de montage par défaut tel quel ; le lanceur ajoute automatiquement `:Z` sur Linux lorsque SELinux est en mode enforcing ou permissive.

## Lié

- [Docker](/fr/install/docker)
- [Processus d’arrière-plan du Gateway](/fr/gateway/background-process)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
