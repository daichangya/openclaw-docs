---
read_when:
    - Vous voulez exécuter la Gateway sur un serveur Linux ou un VPS cloud
    - Vous avez besoin d’un aperçu rapide des guides d’hébergement
    - Vous voulez un réglage fin générique de serveur Linux pour OpenClaw
sidebarTitle: Linux Server
summary: exécuter OpenClaw sur un serveur Linux ou un VPS cloud — sélecteur de fournisseur, architecture et réglage fin
title: serveur Linux
x-i18n:
    generated_at: "2026-04-24T07:40:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Exécutez la Gateway OpenClaw sur n’importe quel serveur Linux ou VPS cloud. Cette page vous aide à
choisir un fournisseur, explique le fonctionnement des déploiements cloud et couvre le réglage fin Linux
générique qui s’applique partout.

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Railway" href="/fr/install/railway">Configuration en un clic, dans le navigateur</Card>
  <Card title="Northflank" href="/fr/install/northflank">Configuration en un clic, dans le navigateur</Card>
  <Card title="DigitalOcean" href="/fr/install/digitalocean">VPS payant simple</Card>
  <Card title="Oracle Cloud" href="/fr/install/oracle">Niveau ARM Always Free</Card>
  <Card title="Fly.io" href="/fr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Docker sur VPS Hetzner</Card>
  <Card title="Hostinger" href="/fr/install/hostinger">VPS avec configuration en un clic</Card>
  <Card title="GCP" href="/fr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fr/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/fr/install/exe-dev">VM avec proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/fr/install/raspberry-pi">ARM auto-hébergé</Card>
</CardGroup>

**AWS (EC2 / Lightsail / niveau gratuit)** fonctionne également très bien.
Une vidéo explicative de la communauté est disponible sur
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ressource communautaire -- peut devenir indisponible).

## Comment fonctionnent les configurations cloud

- La **Gateway s’exécute sur le VPS** et possède l’état + l’espace de travail.
- Vous vous connectez depuis votre ordinateur portable ou votre téléphone via la **Control UI** ou **Tailscale/SSH**.
- Considérez le VPS comme la source de vérité et effectuez régulièrement une **sauvegarde** de l’état + de l’espace de travail.
- Valeur sûre par défaut : gardez la Gateway sur loopback et accédez-y via tunnel SSH ou Tailscale Serve.
  Si vous la liez à `lan` ou `tailnet`, exigez `gateway.auth.token` ou `gateway.auth.password`.

Pages associées : [Accès distant à la Gateway](/fr/gateway/remote), [Hub des plateformes](/fr/platforms).

## Agent d’entreprise partagé sur un VPS

Exécuter un agent unique pour une équipe est une configuration valide lorsque tous les utilisateurs sont dans le même périmètre de confiance et que l’agent est réservé au travail.

- Gardez-le sur un runtime dédié (VPS/VM/conteneur + utilisateur/comptes OS dédiés).
- Ne connectez pas ce runtime à des comptes Apple/Google personnels ni à des profils personnels de navigateur/gestionnaire de mots de passe.
- Si les utilisateurs sont adverses entre eux, séparez-les par gateway/hôte/utilisateur OS.

Détails du modèle de sécurité : [Sécurité](/fr/gateway/security).

## Utiliser des nœuds avec un VPS

Vous pouvez garder la Gateway dans le cloud et associer des **nœuds** sur vos appareils locaux
(Mac/iOS/Android/headless). Les nœuds fournissent les capacités locales d’écran/caméra/canvas et `system.run`
tandis que la Gateway reste dans le cloud.

Documentation : [Nœuds](/fr/nodes), [CLI des nœuds](/fr/cli/nodes).

## Réglage fin du démarrage pour petites VM et hôtes ARM

Si les commandes CLI semblent lentes sur des VM peu puissantes (ou des hôtes ARM), activez le cache de compilation de modules de Node :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` améliore les temps de démarrage des commandes répétées.
- `OPENCLAW_NO_RESPAWN=1` évite le surcoût de démarrage supplémentaire lié à un chemin d’auto-relance.
- La première exécution de commande réchauffe le cache ; les suivantes sont plus rapides.
- Pour les spécificités Raspberry Pi, voir [Raspberry Pi](/fr/install/raspberry-pi).

### Checklist de réglage systemd (facultatif)

Pour les hôtes VM utilisant `systemd`, envisagez :

- Ajouter un environnement de service pour un chemin de démarrage stable :
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Garder un comportement de redémarrage explicite :
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Préférer des disques adossés à du SSD pour les chemins d’état/cache afin de réduire les pénalités de démarrage à froid liées aux E/S aléatoires.

Pour le chemin standard `openclaw onboard --install-daemon`, modifiez l’unité utilisateur :

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Si vous avez volontairement installé une unité système à la place, modifiez
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Comment les politiques `Restart=` aident à la récupération automatisée :
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Pour le comportement OOM Linux, la sélection de victime des processus enfants et les
diagnostics `exit 137`, voir [Pression mémoire Linux et terminaisons OOM](/fr/platforms/linux#memory-pressure-and-oom-kills).

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [DigitalOcean](/fr/install/digitalocean)
- [Fly.io](/fr/install/fly)
- [Hetzner](/fr/install/hetzner)
