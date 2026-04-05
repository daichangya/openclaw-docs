---
read_when:
    - Configurer OpenClaw sur un Raspberry Pi
    - Exécuter OpenClaw sur des appareils ARM
    - Construire une IA personnelle bon marché toujours active
summary: OpenClaw sur Raspberry Pi (configuration auto-hébergée économique)
title: Raspberry Pi (plateforme)
x-i18n:
    generated_at: "2026-04-05T12:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw sur Raspberry Pi

## Objectif

Exécuter une Gateway OpenClaw persistante et toujours active sur un Raspberry Pi pour un coût unique d’environ **35 à 80 $** (sans frais mensuels).

Parfait pour :

- Assistant IA personnel 24/7
- Hub domotique
- Bot Telegram/WhatsApp basse consommation toujours disponible

## Configuration matérielle requise

| Modèle de Pi     | RAM    | Fonctionne ? | Remarques                         |
| ---------------- | ------ | ------------ | --------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Le meilleur | Le plus rapide, recommandé      |
| **Pi 4**         | 4GB    | ✅ Bien      | Le meilleur compromis pour la plupart des utilisateurs |
| **Pi 4**         | 2GB    | ✅ Correct   | Fonctionne, ajoutez du swap      |
| **Pi 4**         | 1GB    | ⚠️ Serré     | Possible avec du swap, config minimale |
| **Pi 3B+**       | 1GB    | ⚠️ Lent      | Fonctionne mais manque de réactivité |
| **Pi Zero 2 W**  | 512MB  | ❌           | Non recommandé                    |

**Spécifications minimales :** 1GB de RAM, 1 cœur, 500MB de disque  
**Recommandé :** 2GB+ de RAM, OS 64 bits, carte SD de 16GB+ (ou SSD USB)

## Ce dont vous avez besoin

- Raspberry Pi 4 ou 5 (2GB+ recommandés)
- Carte MicroSD (16GB+) ou SSD USB (meilleures performances)
- Alimentation (PSU Pi officielle recommandée)
- Connexion réseau (Ethernet ou WiFi)
- ~30 minutes

## 1) Flasher l’OS

Utilisez **Raspberry Pi OS Lite (64-bit)** — pas besoin d’environnement de bureau pour un serveur headless.

1. Téléchargez [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Choisissez l’OS : **Raspberry Pi OS Lite (64-bit)**
3. Cliquez sur l’icône engrenage (⚙️) pour préconfigurer :
   - Définir le nom d’hôte : `gateway-host`
   - Activer SSH
   - Définir le nom d’utilisateur/mot de passe
   - Configurer le WiFi (si vous n’utilisez pas Ethernet)
4. Flashez sur votre carte SD / disque USB
5. Insérez-la et démarrez le Pi

## 2) Se connecter via SSH

```bash
ssh user@gateway-host
# ou utilisez l'adresse IP
ssh user@192.168.x.x
```

## 3) Configuration système

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer les paquets essentiels
sudo apt install -y git curl build-essential

# Régler le fuseau horaire (important pour cron/rappels)
sudo timedatectl set-timezone America/Chicago  # Remplacez par votre fuseau horaire
```

## 4) Installer Node.js 24 (ARM64)

```bash
# Installer Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier
node --version  # Doit afficher v24.x.x
npm --version
```

## 5) Ajouter du swap (important pour 2GB ou moins)

Le swap évite les plantages par manque de mémoire :

```bash
# Créer un fichier de swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Le rendre permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimiser pour faible RAM (réduire swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Installer OpenClaw

### Option A : installation standard (recommandée)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Option B : installation modifiable (pour bricoler)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

L’installation modifiable vous donne un accès direct aux journaux et au code — utile pour déboguer des problèmes spécifiques à ARM.

## 7) Exécuter l’onboarding

```bash
openclaw onboard --install-daemon
```

Suivez l’assistant :

1. **Mode Gateway :** Local
2. **Auth :** clés API recommandées (OAuth peut être capricieux sur un Pi headless)
3. **Canaux :** Telegram est le plus simple pour commencer
4. **Daemon :** Oui (systemd)

## 8) Vérifier l’installation

```bash
# Vérifier l'état
openclaw status

# Vérifier le service (installation standard = unité utilisateur systemd)
systemctl --user status openclaw-gateway.service

# Voir les journaux
journalctl --user -u openclaw-gateway.service -f
```

## 9) Accéder au tableau de bord OpenClaw

Remplacez `user@gateway-host` par le nom d’utilisateur et le nom d’hôte ou l’adresse IP de votre Pi.

Sur votre ordinateur, demandez au Pi d’imprimer une URL de tableau de bord fraîche :

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

La commande affiche `Dashboard URL:`. Selon la façon dont `gateway.auth.token`
est configuré, l’URL peut être un simple lien `http://127.0.0.1:18789/` ou un
lien qui inclut `#token=...`.

Dans un autre terminal sur votre ordinateur, créez le tunnel SSH :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Puis ouvrez dans votre navigateur local l’URL du tableau de bord affichée.

Si l’UI demande une auth par secret partagé, collez le jeton ou le mot de passe
configuré dans les paramètres de la Control UI. Pour l’auth par jeton, utilisez `gateway.auth.token` (ou
`OPENCLAW_GATEWAY_TOKEN`).

Pour un accès distant permanent, voir [Tailscale](/gateway/tailscale).

---

## Optimisations de performance

### Utiliser un SSD USB (grosse amélioration)

Les cartes SD sont lentes et s’usent. Un SSD USB améliore fortement les performances :

```bash
# Vérifier si le démarrage se fait depuis USB
lsblk
```

Voir le [guide de démarrage USB Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) pour la configuration.

### Accélérer le démarrage de la CLI (cache de compilation de modules)

Sur les hôtes Pi moins puissants, activez le cache de compilation de modules de Node afin d’accélérer les exécutions répétées de la CLI :

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Remarques :

- `NODE_COMPILE_CACHE` accélère les exécutions suivantes (`status`, `health`, `--help`).
- `/var/tmp` survit mieux aux redémarrages que `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` évite le coût de démarrage supplémentaire lié à l’auto-relance de la CLI.
- La première exécution réchauffe le cache ; les suivantes en bénéficient le plus.

### Réglage du démarrage systemd (facultatif)

Si ce Pi exécute principalement OpenClaw, ajoutez un drop-in de service pour réduire
les hésitations au redémarrage et stabiliser l’environnement de démarrage :

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

Puis appliquez :

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Si possible, gardez l’état/le cache OpenClaw sur un stockage SSD pour éviter les
goulots d’étranglement en I/O aléatoire des cartes SD lors des démarrages à froid.

Si c’est un Pi headless, activez une fois la persistance utilisateur pour que le service utilisateur survive
à la déconnexion :

```bash
sudo loginctl enable-linger "$(whoami)"
```

Comment les politiques `Restart=` aident à la récupération automatisée :
[systemd peut automatiser la récupération de service](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Réduire l’utilisation mémoire

```bash
# Désactiver l'allocation mémoire GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Désactiver Bluetooth si inutile
sudo systemctl disable bluetooth
```

### Surveiller les ressources

```bash
# Vérifier la mémoire
free -h

# Vérifier la température CPU
vcgencmd measure_temp

# Surveillance en direct
htop
```

---

## Remarques spécifiques à ARM

### Compatibilité binaire

La plupart des fonctionnalités OpenClaw fonctionnent sur ARM64, mais certains binaires externes peuvent nécessiter des builds ARM :

| Outil              | Statut ARM64 | Remarques                            |
| ------------------ | ------------ | ------------------------------------ |
| Node.js            | ✅           | Fonctionne très bien                 |
| WhatsApp (Baileys) | ✅           | Pur JS, aucun problème               |
| Telegram           | ✅           | Pur JS, aucun problème               |
| gog (Gmail CLI)    | ⚠️           | Vérifier s’il existe une version ARM |
| Chromium (browser) | ✅           | `sudo apt install chromium-browser`  |

Si une Skill échoue, vérifiez si son binaire a une version ARM. Beaucoup d’outils Go/Rust en ont une ; certains non.

### 32 bits vs 64 bits

**Utilisez toujours un OS 64 bits.** Node.js et beaucoup d’outils modernes l’exigent. Vérifiez avec :

```bash
uname -m
# Doit afficher : aarch64 (64 bits) et non armv7l (32 bits)
```

---

## Configuration de modèle recommandée

Comme le Pi ne sert que de Gateway (les modèles s’exécutent dans le cloud), utilisez des modèles via API :

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**N’essayez pas d’exécuter des LLM locaux sur un Pi** — même les petits modèles sont trop lents. Laissez Claude/GPT faire le gros du travail.

---

## Démarrage automatique au boot

L’onboarding configure cela, mais pour vérifier :

```bash
# Vérifier que le service est activé
systemctl --user is-enabled openclaw-gateway.service

# L'activer si nécessaire
systemctl --user enable openclaw-gateway.service

# Démarrer au boot
systemctl --user start openclaw-gateway.service
```

---

## Dépannage

### Manque de mémoire (OOM)

```bash
# Vérifier la mémoire
free -h

# Ajouter plus de swap (voir l’étape 5)
# Ou réduire les services exécutés sur le Pi
```

### Performances lentes

- Utilisez un SSD USB au lieu d’une carte SD
- Désactivez les services inutilisés : `sudo systemctl disable cups bluetooth avahi-daemon`
- Vérifiez le throttling CPU : `vcgencmd get_throttled` (doit renvoyer `0x0`)

### Le service ne démarre pas

```bash
# Vérifier les journaux
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Correctif fréquent : recompiler
cd ~/openclaw  # si vous utilisez l'installation modifiable
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problèmes de binaires ARM

Si une Skill échoue avec « exec format error » :

1. Vérifiez si le binaire existe en build ARM64
2. Essayez de compiler depuis les sources
3. Ou utilisez un conteneur Docker avec prise en charge ARM

### Coupures WiFi

Pour les Pi headless en WiFi :

```bash
# Désactiver la gestion d'alimentation WiFi
sudo iwconfig wlan0 power off

# Le rendre permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Comparaison des coûts

| Configuration  | Coût unique | Coût mensuel | Remarques                    |
| -------------- | ----------- | ------------ | ---------------------------- |
| **Pi 4 (2GB)** | ~$45        | $0           | + électricité (~5 $/an)      |
| **Pi 4 (4GB)** | ~$55        | $0           | Recommandé                   |
| **Pi 5 (4GB)** | ~$60        | $0           | Meilleures performances      |
| **Pi 5 (8GB)** | ~$80        | $0           | Excessif mais prêt pour l’avenir |
| DigitalOcean   | $0          | $6/mois      | 72 $/an                      |
| Hetzner        | $0          | 3,79 €/mois  | ~50 $/an                     |

**Seuil de rentabilité :** un Pi s’amortit en environ 6 à 12 mois par rapport à un VPS cloud.

---

## Voir aussi

- [Guide Linux](/platforms/linux) — configuration Linux générale
- [Guide DigitalOcean](/platforms/digitalocean) — alternative cloud
- [Guide Hetzner](/install/hetzner) — configuration Docker
- [Tailscale](/gateway/tailscale) — accès distant
- [Nœuds](/nodes) — appairez votre ordinateur portable/téléphone avec la gateway Pi
