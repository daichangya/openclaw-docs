---
read_when:
    - Vous souhaitez exécuter la Gateway sur un serveur Linux ou un VPS cloud
    - Vous avez besoin d’un aperçu rapide des guides d’hébergement
    - Vous souhaitez une optimisation générique de serveur Linux pour OpenClaw
sidebarTitle: Linux Server
summary: Exécuter OpenClaw sur un serveur Linux ou un VPS cloud — sélection du fournisseur, architecture et optimisation
title: Serveur Linux
x-i18n:
    generated_at: "2026-04-05T12:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f2f26bbc116841a29055850ed5f491231554b90539bcbf91a6b519875d494fb
    source_path: vps.md
    workflow: 15
---

# Serveur Linux

Exécutez la Gateway OpenClaw sur n’importe quel serveur Linux ou VPS cloud. Cette page vous aide à
choisir un fournisseur, explique le fonctionnement des déploiements cloud et couvre les optimisations Linux
génériques qui s’appliquent partout.

## Choisir un fournisseur

<CardGroup cols={2}>
  <Card title="Railway" href="/fr/install/railway">Configuration en un clic, dans le navigateur</Card>
  <Card title="Northflank" href="/fr/install/northflank">Configuration en un clic, dans le navigateur</Card>
  <Card title="DigitalOcean" href="/fr/install/digitalocean">VPS payant simple</Card>
  <Card title="Oracle Cloud" href="/fr/install/oracle">Niveau ARM Always Free</Card>
  <Card title="Fly.io" href="/fr/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/fr/install/hetzner">Docker sur VPS Hetzner</Card>
  <Card title="GCP" href="/fr/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/fr/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/fr/install/exe-dev">VM avec proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/fr/install/raspberry-pi">Hébergement autonome ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** fonctionne également très bien.
Une vidéo de démonstration de la communauté est disponible à l’adresse
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(ressource communautaire -- peut devenir indisponible).

## Fonctionnement des configurations cloud

- La **Gateway s’exécute sur le VPS** et possède l’état + le workspace.
- Vous vous connectez depuis votre ordinateur portable ou votre téléphone via la **Control UI** ou **Tailscale/SSH**.
- Traitez le VPS comme la source de vérité et **sauvegardez** régulièrement l’état + le workspace.
- Option sécurisée par défaut : conservez la Gateway sur la loopback et accédez-y via un tunnel SSH ou Tailscale Serve.
  Si vous la liez à `lan` ou `tailnet`, exigez `gateway.auth.token` ou `gateway.auth.password`.

Pages associées : [Accès distant à la Gateway](/fr/gateway/remote), [Hub des plateformes](/fr/platforms).

## Agent d’entreprise partagé sur un VPS

Exécuter un seul agent pour une équipe est une configuration valide lorsque tous les utilisateurs se trouvent dans la même frontière de confiance et que l’agent est réservé à un usage professionnel.

- Conservez-le sur un runtime dédié (VPS/VM/conteneur + utilisateur/comptes OS dédiés).
- Ne connectez pas ce runtime à des comptes Apple/Google personnels ni à des profils personnels de navigateur/gestionnaire de mots de passe.
- Si les utilisateurs sont adverses les uns envers les autres, séparez-les par gateway/hôte/utilisateur OS.

Détails du modèle de sécurité : [Sécurité](/fr/gateway/security).

## Utiliser des nœuds avec un VPS

Vous pouvez conserver la Gateway dans le cloud et appairer des **nœuds** sur vos appareils locaux
(Mac/iOS/Android/headless). Les nœuds fournissent les capacités locales d’écran/caméra/canvas et `system.run`
tandis que la Gateway reste dans le cloud.

Documentation : [Nœuds](/fr/nodes), [CLI des nœuds](/cli/nodes).

## Optimisation du démarrage pour les petites VM et les hôtes ARM

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
- `OPENCLAW_NO_RESPAWN=1` évite le surcoût de démarrage supplémentaire lié à un chemin d’auto-relancement.
- La première exécution d’une commande réchauffe le cache ; les exécutions suivantes sont plus rapides.
- Pour les spécificités de Raspberry Pi, consultez [Raspberry Pi](/fr/install/raspberry-pi).

### Liste de contrôle d’optimisation systemd (facultatif)

Pour les hôtes VM utilisant `systemd`, envisagez :

- D’ajouter des variables d’environnement au service pour un chemin de démarrage stable :
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- De garder un comportement de redémarrage explicite :
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- De privilégier des disques basés sur SSD pour les chemins d’état/cache afin de réduire les pénalités de démarrage à froid liées aux E/S aléatoires.

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

Si vous avez délibérément installé une unité système à la place, modifiez
`openclaw-gateway.service` via `sudo systemctl edit openclaw-gateway.service`.

Comment les politiques `Restart=` facilitent la récupération automatisée :
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).
