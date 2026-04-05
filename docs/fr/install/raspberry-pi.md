---
read_when:
    - Configurer OpenClaw sur un Raspberry Pi
    - Exécuter OpenClaw sur des appareils ARM
    - Construire une IA personnelle peu coûteuse et toujours active
summary: Héberger OpenClaw sur un Raspberry Pi pour un auto-hébergement toujours actif
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T12:46:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Exécutez une OpenClaw Gateway persistante et toujours active sur un Raspberry Pi. Comme le Pi n’est que la passerelle (les modèles s’exécutent dans le cloud via API), même un Pi modeste gère bien la charge.

## Prérequis

- Raspberry Pi 4 ou 5 avec 2 Go+ de RAM (4 Go recommandés)
- Carte MicroSD (16 Go+) ou SSD USB (meilleures performances)
- Alimentation officielle Pi
- Connexion réseau (Ethernet ou WiFi)
- Raspberry Pi OS 64 bits (requis -- n’utilisez pas la version 32 bits)
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Flasher l’OS">
    Utilisez **Raspberry Pi OS Lite (64-bit)** -- aucun bureau n’est nécessaire pour un serveur headless.

    1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Choisissez l’OS : **Raspberry Pi OS Lite (64-bit)**.
    3. Dans la boîte de dialogue des paramètres, préconfigurez :
       - Nom d’hôte : `gateway-host`
       - Activer SSH
       - Définir nom d’utilisateur et mot de passe
       - Configurer le WiFi (si vous n’utilisez pas Ethernet)
    4. Flashez sur votre carte SD ou votre disque USB, insérez-le, puis démarrez le Pi.

  </Step>

  <Step title="Se connecter via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Mettre à jour le système">
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

  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Suivez l’assistant. Les clés API sont recommandées à la place d’OAuth pour les appareils headless. Telegram est le canal le plus simple pour commencer.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder à l’interface Control">
    Sur votre ordinateur, obtenez une URL de tableau de bord depuis le Pi :

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Puis créez un tunnel SSH dans un autre terminal :

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Ouvrez l’URL affichée dans votre navigateur local. Pour un accès distant toujours actif, voir [Intégration Tailscale](/gateway/tailscale).

  </Step>
</Steps>

## Conseils de performance

**Utilisez un SSD USB** -- Les cartes SD sont lentes et s’usent. Un SSD USB améliore nettement les performances. Voir le [guide de démarrage USB du Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Activez le cache de compilation des modules** -- Accélère les invocations CLI répétées sur les hôtes Pi moins puissants :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Réduisez l’utilisation mémoire** -- Pour les configurations headless, libérez la mémoire GPU et désactivez les services inutilisés :

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Résolution des problèmes

**Mémoire insuffisante** -- Vérifiez que le swap est actif avec `free -h`. Désactivez les services inutilisés (`sudo systemctl disable cups bluetooth avahi-daemon`). Utilisez uniquement des modèles basés sur API.

**Performances lentes** -- Utilisez un SSD USB au lieu d’une carte SD. Vérifiez le throttling CPU avec `vcgencmd get_throttled` (doit renvoyer `0x0`).

**Le service ne démarre pas** -- Vérifiez les journaux avec `journalctl --user -u openclaw-gateway.service --no-pager -n 100` et exécutez `openclaw doctor --non-interactive`. Si c’est un Pi headless, vérifiez aussi que le lingering est activé : `sudo loginctl enable-linger "$(whoami)"`.

**Problèmes de binaire ARM** -- Si une Skill échoue avec « exec format error », vérifiez si le binaire dispose d’une build ARM64. Vérifiez l’architecture avec `uname -m` (doit afficher `aarch64`).

**Coupures WiFi** -- Désactivez la gestion d’alimentation WiFi : `sudo iwconfig wlan0 power off`.

## Étapes suivantes

- [Canaux](/channels) -- connecter Telegram, WhatsApp, Discord, et plus encore
- [Configuration Gateway](/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/install/updating) -- maintenir OpenClaw à jour
