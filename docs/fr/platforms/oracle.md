---
read_when:
    - Configuration d’OpenClaw sur Oracle Cloud
    - Vous cherchez un hébergement VPS à faible coût pour OpenClaw
    - Vous voulez OpenClaw 24 h/24, 7 j/7 sur un petit serveur
summary: OpenClaw sur Oracle Cloud (Always Free ARM)
title: Oracle Cloud (plateforme)
x-i18n:
    generated_at: "2026-04-24T07:21:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw sur Oracle Cloud (OCI)

## Objectif

Exécuter un Gateway OpenClaw persistant sur le niveau ARM **Always Free** d’Oracle Cloud.

Le niveau gratuit d’Oracle peut très bien convenir à OpenClaw (surtout si vous avez déjà un compte OCI), mais il comporte des compromis :

- Architecture ARM (la plupart des choses fonctionnent, mais certains binaires peuvent être uniquement x86)
- La capacité et l’inscription peuvent être capricieuses

## Comparaison des coûts (2026)

| Fournisseur  | Offre            | Spécifications          | Prix/mois | Remarques             |
| ------------ | ---------------- | ----------------------- | --------- | --------------------- |
| Oracle Cloud | Always Free ARM  | jusqu’à 4 OCPU, 24GB RAM | $0       | ARM, capacité limitée |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM         | ~ $4      | Option payante la moins chère |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM         | $6        | Interface simple, bonne documentation |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM         | $6        | Nombreux emplacements |
| Linode       | Nanode           | 1 vCPU, 1GB RAM         | $5        | Fait désormais partie d’Akamai |

---

## Prérequis

- Compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) — voir le [guide d’inscription communautaire](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si vous rencontrez des problèmes
- Compte Tailscale (gratuit sur [tailscale.com](https://tailscale.com))
- ~30 minutes

## 1) Créer une instance OCI

1. Connectez-vous à la [console Oracle Cloud](https://cloud.oracle.com/)
2. Accédez à **Compute → Instances → Create Instance**
3. Configurez :
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (ou jusqu’à 4)
   - **Memory:** 12 GB (ou jusqu’à 24 GB)
   - **Boot volume:** 50 GB (jusqu’à 200 GB gratuits)
   - **SSH key:** ajoutez votre clé publique
4. Cliquez sur **Create**
5. Notez l’adresse IP publique

**Conseil :** si la création de l’instance échoue avec « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité du niveau gratuit est limitée.

## 2) Se connecter et mettre à jour

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Remarque :** `build-essential` est requis pour la compilation ARM de certaines dépendances.

## 3) Configurer l’utilisateur et le nom d’hôte

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Installer Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Cela active Tailscale SSH, vous pouvez donc vous connecter via `ssh openclaw` depuis n’importe quel appareil de votre tailnet — aucune IP publique nécessaire.

Vérifiez :

```bash
tailscale status
```

**À partir de maintenant, connectez-vous via Tailscale :** `ssh ubuntu@openclaw` (ou utilisez l’IP Tailscale).

## 5) Installer OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Lorsque l’invite « How do you want to hatch your bot? » apparaît, sélectionnez **"Do this later"**.

> Remarque : si vous rencontrez des problèmes de build natif ARM, commencez par les packages système (par exemple `sudo apt install -y build-essential`) avant de vous tourner vers Homebrew.

## 6) Configurer le Gateway (loopback + authentification par jeton) et activer Tailscale Serve

Utilisez l’authentification par jeton comme valeur par défaut. Elle est prévisible et évite d’avoir besoin d’indicateurs « insecure auth » dans le Control UI.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ici sert uniquement à la gestion locale des IP transférées / clients locaux du proxy Tailscale Serve. Ce n’est **pas** `gateway.auth.mode: "trusted-proxy"`. Les routes de visualisation diff conservent un comportement fail-closed dans cette configuration : les requêtes brutes de visualiseur `127.0.0.1` sans en-têtes proxy transférés peuvent renvoyer `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez volontairement les visualiseurs distants et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou passez un proxy `baseUrl`) si vous avez besoin de liens de visualisation partageables.

## 7) Vérifier

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Verrouiller la sécurité VCN

Maintenant que tout fonctionne, verrouillez le VCN pour bloquer tout le trafic sauf Tailscale. Le Virtual Cloud Network d’OCI agit comme un pare-feu en bordure réseau — le trafic est bloqué avant d’atteindre votre instance.

1. Allez dans **Networking → Virtual Cloud Networks** dans la console OCI
2. Cliquez sur votre VCN → **Security Lists** → Default Security List
3. **Supprimez** toutes les règles entrantes sauf :
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Conservez les règles sortantes par défaut (autoriser tout le trafic sortant)

Cela bloque SSH sur le port 22, HTTP, HTTPS et tout le reste en bordure réseau. À partir de maintenant, vous ne pouvez vous connecter que via Tailscale.

---

## Accéder au Control UI

Depuis n’importe quel appareil de votre réseau Tailscale :

```
https://openclaw.<tailnet-name>.ts.net/
```

Remplacez `<tailnet-name>` par le nom de votre tailnet (visible dans `tailscale status`).

Aucun tunnel SSH nécessaire. Tailscale fournit :

- Chiffrement HTTPS (certificats automatiques)
- Authentification via l’identité Tailscale
- Accès depuis n’importe quel appareil de votre tailnet (ordinateur portable, téléphone, etc.)

---

## Sécurité : VCN + Tailscale (niveau de base recommandé)

Avec le VCN verrouillé (seul UDP 41641 est ouvert) et le Gateway lié au loopback, vous obtenez une forte défense en profondeur : le trafic public est bloqué à la bordure réseau, et l’accès administrateur se fait via votre tailnet.

Cette configuration supprime souvent le _besoin_ de règles de pare-feu supplémentaires côté hôte uniquement pour bloquer la force brute SSH à l’échelle d’Internet — mais vous devez tout de même garder l’OS à jour, exécuter `openclaw security audit` et vérifier que vous n’écoutez pas accidentellement sur des interfaces publiques.

### Déjà protégé

| Étape traditionnelle | Nécessaire ? | Pourquoi                                                                     |
| -------------------- | ------------ | ---------------------------------------------------------------------------- |
| Pare-feu UFW         | Non          | Le VCN bloque avant que le trafic n’atteigne l’instance                      |
| fail2ban             | Non          | Pas de force brute si le port 22 est bloqué au niveau du VCN                |
| Durcissement sshd    | Non          | Tailscale SSH n’utilise pas sshd                                             |
| Désactiver root login | Non         | Tailscale utilise l’identité Tailscale, pas les utilisateurs système         |
| Auth SSH par clé seule | Non        | Tailscale authentifie via votre tailnet                                      |
| Durcissement IPv6    | Généralement non | Dépend des paramètres de votre VCN/sous-réseau ; vérifiez ce qui est réellement attribué/exposé |

### Toujours recommandé

- **Permissions des identifiants :** `chmod 700 ~/.openclaw`
- **Audit de sécurité :** `openclaw security audit`
- **Mises à jour système :** `sudo apt update && sudo apt upgrade` régulièrement
- **Surveiller Tailscale :** examinez les appareils dans la [console d’administration Tailscale](https://login.tailscale.com/admin)

### Vérifier la posture de sécurité

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Solution de repli : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH :

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Puis ouvrez `http://localhost:18789`.

---

## Dépannage

### La création de l’instance échoue (« Out of capacity »)

Les instances ARM du niveau gratuit sont populaires. Essayez :

- Un autre domaine de disponibilité
- Réessayez pendant les heures creuses (tôt le matin)
- Utilisez le filtre « Always Free » lors de la sélection de la forme

### Tailscale ne se connecte pas

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Le Gateway ne démarre pas

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Impossible d’atteindre le Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problèmes de binaires ARM

Certains outils peuvent ne pas avoir de builds ARM. Vérifiez :

```bash
uname -m  # Should show aarch64
```

La plupart des packages npm fonctionnent correctement. Pour les binaires, recherchez des versions `linux-arm64` ou `aarch64`.

---

## Persistance

Tout l’état vit dans :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état du canal/fournisseur et données de session
- `~/.openclaw/workspace/` — espace de travail (SOUL.md, memory, artefacts)

Sauvegardez périodiquement :

```bash
openclaw backup create
```

---

## Associé

- [Accès distant au Gateway](/fr/gateway/remote) — autres schémas d’accès distant
- [Intégration Tailscale](/fr/gateway/tailscale) — documentation Tailscale complète
- [Configuration du Gateway](/fr/gateway/configuration) — toutes les options de configuration
- [Guide DigitalOcean](/fr/install/digitalocean) — si vous voulez une option payante + une inscription plus facile
- [Guide Hetzner](/fr/install/hetzner) — alternative basée sur Docker
