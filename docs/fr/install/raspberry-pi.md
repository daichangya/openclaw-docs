---
read_when:
    - Configuration d’OpenClaw sur un Pi Raspberry
    - Exécution d’OpenClaw sur des appareils ARM
    - Construire une IA personnelle peu coûteuse et toujours active
summary: héberger OpenClaw sur un Pi pour un auto-hébergement toujours actif
title: Pi Raspberry
x-i18n:
    generated_at: "2026-04-24T07:18:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Exécutez une Gateway OpenClaw persistante et toujours active sur un Pi Raspberry. Comme le Pi n’est que la gateway (les modèles s’exécutent dans le cloud via API), même un Pi modeste gère bien la charge.

## Prérequis

- Pi Raspberry 4 ou 5 avec 2 Go+ de RAM (4 Go recommandés)
- Carte microSD (16 Go+) ou SSD USB (meilleures performances)
- Alimentation officielle Pi
- Connexion réseau (Ethernet ou WiFi)
- Raspberry Pi OS 64 bits (obligatoire -- n’utilisez pas 32 bits)
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Flasher l’OS">
    Utilisez **Raspberry Pi OS Lite (64-bit)** -- pas d’environnement de bureau nécessaire pour un serveur headless.

    1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Choisissez l’OS : **Raspberry Pi OS Lite (64-bit)**.
    3. Dans la boîte de dialogue des paramètres, préconfigurez :
       - Nom d’hôte : `gateway-host`
       - Activer SSH
       - Définir le nom d’utilisateur et le mot de passe
       - Configurer le WiFi (si vous n’utilisez pas Ethernet)
    4. Flashez sur votre carte SD ou votre lecteur USB, insérez-le, puis démarrez le Pi.

  </Step>

  <Step title="Se connecter via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Mettre le système à jour">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Installer Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Ajouter du swap (important pour 2 Go ou moins)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Lancer l’intégration">
    ```bash
    openclaw onboard --install-daemon
    ```

    Suivez l’assistant. Les clés API sont recommandées plutôt qu’OAuth pour les appareils headless. Telegram est le canal le plus simple pour commencer.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder au Control UI">
    Sur votre ordinateur, obtenez une URL de tableau de bord depuis le Pi :

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Puis créez un tunnel SSH dans un autre terminal :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Ouvrez l’URL affichée dans votre navigateur local. Pour un accès distant permanent, voir [Intégration Tailscale](/fr/gateway/tailscale).

  </Step>
</Steps>

## Conseils de performance

**Utilisez un SSD USB** -- les cartes SD sont lentes et s’usent. Un SSD USB améliore considérablement les performances. Voir le [guide de démarrage USB du Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Activez le cache de compilation des modules** -- accélère les invocations répétées de la CLI sur les hôtes Pi moins puissants :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Réduisez l’usage mémoire** -- pour les configurations headless, libérez la mémoire GPU et désactivez les services inutilisés :

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Dépannage

**Mémoire insuffisante** -- vérifiez que le swap est actif avec `free -h`. Désactivez les services inutilisés (`sudo systemctl disable cups bluetooth avahi-daemon`). Utilisez uniquement des modèles basés sur API.

**Performances lentes** -- utilisez un SSD USB au lieu d’une carte SD. Vérifiez le throttling CPU avec `vcgencmd get_throttled` (devrait renvoyer `0x0`).

**Le service ne démarre pas** -- vérifiez les journaux avec `journalctl --user -u openclaw-gateway.service --no-pager -n 100` et exécutez `openclaw doctor --non-interactive`. Si c’est un Pi headless, vérifiez aussi que le lingering est activé : `sudo loginctl enable-linger "$(whoami)"`.

**Problèmes de binaire ARM** -- si un skill échoue avec « exec format error », vérifiez si le binaire possède un build ARM64. Vérifiez l’architecture avec `uname -m` (doit afficher `aarch64`).

**Coupures WiFi** -- désactivez la gestion d’alimentation WiFi : `sudo iwconfig wlan0 power off`.

## Étapes suivantes

- [Canaux](/fr/channels) -- connecter Telegram, WhatsApp, Discord, etc.
- [Configuration Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/fr/install/updating) -- maintenir OpenClaw à jour

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Plateformes](/fr/platforms)
