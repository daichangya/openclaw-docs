---
read_when:
    - Configuration d’OpenClaw sur DigitalOcean
    - Recherche d’un VPS payant simple pour OpenClaw
summary: Héberger OpenClaw sur un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-05T12:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b161db8ec643d8313938a2453ce6242fc1ee8ea1fd2069916276f1aadeb71f1
    source_path: install/digitalocean.md
    workflow: 15
---

# DigitalOcean

Exécutez une Gateway OpenClaw persistante sur un Droplet DigitalOcean.

## Prérequis

- Compte DigitalOcean ([inscription](https://cloud.digitalocean.com/registrations/new))
- Paire de clés SSH (ou volonté d’utiliser l’authentification par mot de passe)
- Environ 20 minutes

## Configuration

<Steps>
  <Step title="Créer un Droplet">
    <Warning>
    Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images Marketplace tierces en 1 clic sauf si vous avez examiné leurs scripts de démarrage et leurs valeurs par défaut de pare-feu.
    </Warning>

    1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/).
    2. Cliquez sur **Create > Droplets**.
    3. Choisissez :
       - **Region:** La plus proche de vous
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 Go RAM / 25 Go SSD
       - **Authentication:** Clé SSH (recommandé) ou mot de passe
    4. Cliquez sur **Create Droplet** et notez l’adresse IP.

  </Step>

  <Step title="Se connecter et installer">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Installer Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Installer OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    L’assistant vous guide à travers l’authentification du modèle, la configuration des canaux, la génération du jeton gateway et l’installation du daemon (systemd).

  </Step>

  <Step title="Ajouter du swap (recommandé pour les Droplets de 1 Go)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Vérifier la gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accéder à l’UI de contrôle">
    La gateway se lie à loopback par défaut. Choisissez l’une de ces options.

    **Option A : tunnel SSH (le plus simple)**

    ```bash
    # Depuis votre machine locale
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Ouvrez ensuite `http://localhost:18789`.

    **Option B : Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Ouvrez ensuite `https://<magicdns>/` depuis n’importe quel appareil sur votre tailnet.

    **Option C : liaison tailnet (sans Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Ouvrez ensuite `http://<tailscale-ip>:18789` (jeton requis).

  </Step>
</Steps>

## Dépannage

**La gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et vérifiez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Port déjà utilisé** -- Exécutez `lsof -i :18789` pour trouver le processus, puis arrêtez-le.

**Mémoire insuffisante** -- Vérifiez que le swap est actif avec `free -h`. Si vous atteignez encore un OOM, utilisez des modèles basés sur API (Claude, GPT) plutôt que des modèles locaux, ou passez à un Droplet de 2 Go.

## Étapes suivantes

- [Canaux](/channels) -- connectez Telegram, WhatsApp, Discord et plus encore
- [Configuration Gateway](/gateway/configuration) -- toutes les options de configuration
- [Mise à jour](/install/updating) -- gardez OpenClaw à jour
