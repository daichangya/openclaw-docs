---
read_when:
    - Vous souhaitez une passerelle conteneurisée avec Podman au lieu de Docker
summary: Exécuter OpenClaw dans un conteneur Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-05T12:47:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Exécutez OpenClaw Gateway dans un conteneur Podman rootless, géré par votre utilisateur non root actuel.

Le modèle prévu est le suivant :

- Podman exécute le conteneur de la passerelle.
- Votre CLI `openclaw` sur l’hôte est le plan de contrôle.
- L’état persistant réside sur l’hôte sous `~/.openclaw` par défaut.
- La gestion quotidienne utilise `openclaw --container <name> ...` au lieu de `sudo -u openclaw`, `podman exec` ou d’un utilisateur de service séparé.

## Prérequis

- **Podman** en mode rootless
- **CLI OpenClaw** installée sur l’hôte
- **Facultatif :** `systemd --user` si vous voulez un démarrage automatique géré par Quadlet
- **Facultatif :** `sudo` uniquement si vous voulez `loginctl enable-linger "$(whoami)"` pour la persistance au démarrage sur un hôte headless

## Démarrage rapide

<Steps>
  <Step title="Configuration initiale unique">
    Depuis la racine du dépôt, exécutez `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Démarrer le conteneur de la passerelle">
    Démarrez le conteneur avec `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Exécuter l’onboarding dans le conteneur">
    Exécutez `./scripts/run-openclaw-podman.sh launch setup`, puis ouvrez `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gérer le conteneur en cours d’exécution depuis la CLI hôte">
    Définissez `OPENCLAW_CONTAINER=openclaw`, puis utilisez les commandes `openclaw` normales depuis l’hôte.
  </Step>
</Steps>

Détails de configuration :

- `./scripts/podman/setup.sh` construit `openclaw:local` dans votre magasin Podman rootless par défaut, ou utilise `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` si vous en définissez une.
- Il crée `~/.openclaw/openclaw.json` avec `gateway.mode: "local"` si absent.
- Il crée `~/.openclaw/.env` avec `OPENCLAW_GATEWAY_TOKEN` si absent.
- Pour les lancements manuels, l’assistant ne lit qu’une petite liste d’autorisation de clés liées à Podman depuis `~/.openclaw/.env` et transmet des variables env runtime explicites au conteneur ; il ne transmet pas le fichier env complet à Podman.

Configuration gérée par Quadlet :

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet est une option Linux uniquement car elle dépend des services utilisateur systemd.

Vous pouvez aussi définir `OPENCLAW_PODMAN_QUADLET=1`.

Variables env facultatives de build/configuration :

- `OPENCLAW_IMAGE` ou `OPENCLAW_PODMAN_IMAGE` -- utiliser une image existante/téléchargée au lieu de construire `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installer des packages apt supplémentaires pendant la construction de l’image
- `OPENCLAW_EXTENSIONS` -- préinstaller des dépendances d’extension au moment du build

Démarrage du conteneur :

```bash
./scripts/run-openclaw-podman.sh launch
```

Le script démarre le conteneur avec votre uid/gid courant via `--userns=keep-id` et monte par bind votre état OpenClaw dans le conteneur.

Onboarding :

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Ouvrez ensuite `http://127.0.0.1:18789/` et utilisez le jeton de `~/.openclaw/.env`.

CLI hôte par défaut :

```bash
export OPENCLAW_CONTAINER=openclaw
```

Ensuite, des commandes comme celles-ci s’exécuteront automatiquement à l’intérieur du conteneur :

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Sur macOS, Podman machine peut faire apparaître le navigateur comme non local pour la passerelle.
Si l’interface de contrôle signale des erreurs d’authentification d’appareil après le lancement, utilisez les indications Tailscale dans
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Pour HTTPS ou l’accès à distance depuis un navigateur, suivez la documentation principale Tailscale.

Remarque spécifique à Podman :

- Conservez l’hôte de publication Podman sur `127.0.0.1`.
- Préférez `tailscale serve` géré par l’hôte à `openclaw gateway --tailscale serve`.
- Sur macOS, si le contexte d’authentification d’appareil du navigateur local n’est pas fiable, utilisez l’accès Tailscale au lieu de solutions de contournement locales ad hoc par tunnel.

Consultez :

- [Tailscale](/gateway/tailscale)
- [Control UI](/web/control-ui)

## Systemd (Quadlet, facultatif)

Si vous avez exécuté `./scripts/podman/setup.sh --quadlet`, la configuration installe un fichier Quadlet à l’emplacement :

```bash
~/.config/containers/systemd/openclaw.container
```

Commandes utiles :

- **Démarrer :** `systemctl --user start openclaw.service`
- **Arrêter :** `systemctl --user stop openclaw.service`
- **Statut :** `systemctl --user status openclaw.service`
- **Journaux :** `journalctl --user -u openclaw.service -f`

Après modification du fichier Quadlet :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Pour la persistance au démarrage sur des hôtes SSH/headless, activez lingering pour votre utilisateur courant :

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configuration, env et stockage

- **Répertoire de configuration :** `~/.openclaw`
- **Répertoire d’espace de travail :** `~/.openclaw/workspace`
- **Fichier de jeton :** `~/.openclaw/.env`
- **Assistant de lancement :** `./scripts/run-openclaw-podman.sh`

Le script de lancement et Quadlet montent par bind l’état hôte dans le conteneur :

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Par défaut, ce sont des répertoires hôte et non un état anonyme de conteneur, donc
`openclaw.json`, `auth-profiles.json` par agent, l’état des canaux/fournisseurs,
les sessions et l’espace de travail survivent au remplacement du conteneur.
La configuration Podman initialise aussi `gateway.controlUi.allowedOrigins` pour `127.0.0.1` et `localhost` sur le port publié de la passerelle afin que le tableau de bord local fonctionne avec la liaison non loopback du conteneur.

Variables env utiles pour le lanceur manuel :

- `OPENCLAW_PODMAN_CONTAINER` -- nom du conteneur (`openclaw` par défaut)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image à exécuter
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- port hôte mappé vers le `18789` du conteneur
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- port hôte mappé vers le `18790` du conteneur
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface hôte pour les ports publiés ; la valeur par défaut est `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- mode de liaison de la passerelle à l’intérieur du conteneur ; la valeur par défaut est `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (par défaut), `auto` ou `host`

Le lanceur manuel lit `~/.openclaw/.env` avant de finaliser les valeurs par défaut du conteneur/de l’image, vous pouvez donc les y conserver.

Si vous utilisez un `OPENCLAW_CONFIG_DIR` ou `OPENCLAW_WORKSPACE_DIR` non par défaut, définissez les mêmes variables pour `./scripts/podman/setup.sh` et pour les commandes ultérieures `./scripts/run-openclaw-podman.sh launch`. Le lanceur local au dépôt ne persiste pas les remplacements de chemin personnalisés entre les shells.

Remarque Quadlet :

- Le service Quadlet généré conserve volontairement une forme par défaut fixe et durcie : ports publiés sur `127.0.0.1`, `--bind lan` à l’intérieur du conteneur et espace de noms utilisateur `keep-id`.
- Il fixe `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` et `TimeoutStartSec=300`.
- Il publie à la fois `127.0.0.1:18789:18789` (passerelle) et `127.0.0.1:18790:18790` (bridge).
- Il lit `~/.openclaw/.env` comme `EnvironmentFile` runtime pour des valeurs telles que `OPENCLAW_GATEWAY_TOKEN`, mais il ne consomme pas la liste d’autorisation de remplacements spécifiques à Podman du lanceur manuel.
- Si vous avez besoin de ports publiés personnalisés, d’un hôte de publication personnalisé ou d’autres indicateurs `container-run`, utilisez le lanceur manuel ou modifiez directement `~/.config/containers/systemd/openclaw.container`, puis rechargez et redémarrez le service.

## Commandes utiles

- **Journaux du conteneur :** `podman logs -f openclaw`
- **Arrêter le conteneur :** `podman stop openclaw`
- **Supprimer le conteneur :** `podman rm -f openclaw`
- **Ouvrir l’URL du tableau de bord depuis la CLI hôte :** `openclaw dashboard --no-open`
- **État/santé via la CLI hôte :** `openclaw gateway status --deep` (sonde RPC + analyse supplémentaire
  des services)

## Dépannage

- **Permission denied (EACCES) sur la configuration ou l’espace de travail :** Le conteneur s’exécute avec `--userns=keep-id` et `--user <your uid>:<your gid>` par défaut. Assurez-vous que les chemins hôte de configuration/espace de travail appartiennent à votre utilisateur courant.
- **Démarrage de la passerelle bloqué (absence de `gateway.mode=local`) :** Assurez-vous que `~/.openclaw/openclaw.json` existe et définit `gateway.mode="local"`. `scripts/podman/setup.sh` le crée s’il est absent.
- **Les commandes CLI du conteneur ciblent la mauvaise destination :** Utilisez explicitement `openclaw --container <name> ...`, ou exportez `OPENCLAW_CONTAINER=<name>` dans votre shell.
- **`openclaw update` échoue avec `--container` :** Comportement attendu. Reconstruisez/téléchargez l’image, puis redémarrez le conteneur ou le service Quadlet.
- **Le service Quadlet ne démarre pas :** Exécutez `systemctl --user daemon-reload`, puis `systemctl --user start openclaw.service`. Sur les systèmes headless, vous pouvez aussi avoir besoin de `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux bloque les montages bind :** Laissez le comportement de montage par défaut tel quel ; le lanceur ajoute automatiquement `:Z` sous Linux lorsque SELinux est en mode enforcing ou permissive.

## Lié

- [Docker](/install/docker)
- [Processus en arrière-plan de la passerelle](/gateway/background-process)
- [Dépannage de la passerelle](/gateway/troubleshooting)
