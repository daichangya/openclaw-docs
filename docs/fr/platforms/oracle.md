---
read_when:
    - Configurer OpenClaw sur Oracle Cloud
    - Rechercher un hébergement VPS à faible coût pour OpenClaw
    - Vouloir OpenClaw 24 h/24 et 7 j/7 sur un petit serveur
summary: OpenClaw sur Oracle Cloud (ARM Always Free)
title: Oracle Cloud (plateforme)
x-i18n:
    generated_at: "2026-04-05T12:49:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw sur Oracle Cloud (OCI)

## Objectif

Exécuter une Gateway OpenClaw persistante sur l’offre ARM **Always Free** d’Oracle Cloud.

L’offre gratuite d’Oracle peut très bien convenir à OpenClaw (surtout si vous avez déjà un compte OCI), mais elle comporte des compromis :

- Architecture ARM (la plupart des choses fonctionnent, mais certains binaires peuvent être uniquement x86)
- La capacité et l’inscription peuvent être capricieuses

## Comparaison des coûts (2026)

| Fournisseur  | Offre            | Spécifications            | Prix/mois | Remarques            |
| ------------ | ---------------- | ------------------------- | --------- | -------------------- |
| Oracle Cloud | ARM Always Free  | jusqu’à 4 OCPU, 24GB RAM | $0        | ARM, capacité limitée |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM           | ~ $4      | Option payante la moins chère |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM           | $6        | Interface simple, bonne documentation |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM           | $6        | Nombreux emplacements |
| Linode       | Nanode           | 1 vCPU, 1GB RAM           | $5        | Fait désormais partie d’Akamai |

---

## Prérequis

- Compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) — voir le [guide d’inscription de la communauté](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si vous rencontrez des problèmes
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

**Astuce :** si la création de l’instance échoue avec « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité du niveau gratuit est limitée.

## 2) Se connecter et mettre à jour

```bash
# Connexion via l’IP publique
ssh ubuntu@YOUR_PUBLIC_IP

# Mise à jour du système
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Remarque :** `build-essential` est requis pour la compilation ARM de certaines dépendances.

## 3) Configurer l’utilisateur et le nom d’hôte

```bash
# Définir le nom d’hôte
sudo hostnamectl set-hostname openclaw

# Définir le mot de passe de l’utilisateur ubuntu
sudo passwd ubuntu

# Activer lingering (maintient les services utilisateur en cours d’exécution après la déconnexion)
sudo loginctl enable-linger ubuntu
```

## 4) Installer Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Cela active Tailscale SSH, ce qui vous permet de vous connecter via `ssh openclaw` depuis n’importe quel appareil de votre tailnet — sans IP publique.

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

> Remarque : si vous rencontrez des problèmes de build natif ARM, commencez par les paquets système (par ex. `sudo apt install -y build-essential`) avant de passer à Homebrew.

## 6) Configurer la Gateway (loopback + authentification par jeton) et activer Tailscale Serve

Utilisez l’authentification par jeton par défaut. Elle est prévisible et évite d’avoir besoin d’indicateurs Control UI d’« authentification non sécurisée ».

```bash
# Garder la Gateway privée sur la VM
openclaw config set gateway.bind loopback

# Exiger une authentification pour la Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Exposer via Tailscale Serve (HTTPS + accès tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

Ici, `gateway.trustedProxies=["127.0.0.1"]` sert uniquement à la gestion locale de l’IP transférée/client local du proxy Tailscale Serve. Ce n’est **pas** `gateway.auth.mode: "trusted-proxy"`. Dans cette configuration, les routes de visualisation des diffs conservent un comportement fail-closed : les requêtes de visualisation brutes vers `127.0.0.1` sans en-têtes de proxy transférés peuvent renvoyer `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez intentionnellement les visualiseurs distants et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou passez un proxy `baseUrl`) si vous avez besoin de liens de visualisation partageables.

## 7) Vérifier

```bash
# Vérifier la version
openclaw --version

# Vérifier l’état du démon
systemctl --user status openclaw-gateway.service

# Vérifier Tailscale Serve
tailscale serve status

# Tester une réponse locale
curl http://localhost:18789
```

## 8) Verrouiller la sécurité VCN

Maintenant que tout fonctionne, verrouillez le VCN pour bloquer tout le trafic sauf Tailscale. Le Virtual Cloud Network d’OCI agit comme un pare-feu en bordure réseau — le trafic est bloqué avant d’atteindre votre instance.

1. Accédez à **Networking → Virtual Cloud Networks** dans la console OCI
2. Cliquez sur votre VCN → **Security Lists** → Default Security List
3. **Supprimez** toutes les règles d’entrée sauf :
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Conservez les règles de sortie par défaut (tout le trafic sortant autorisé)

Cela bloque SSH sur le port 22, HTTP, HTTPS et tout le reste en bordure réseau. À partir de maintenant, vous ne pouvez vous connecter que via Tailscale.

---

## Accéder à la Control UI

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

## Sécurité : VCN + Tailscale (base de référence recommandée)

Avec le VCN verrouillé (seul l’UDP 41641 est ouvert) et la Gateway liée au loopback, vous obtenez une défense en profondeur solide : le trafic public est bloqué en bordure réseau, et l’accès d’administration se fait via votre tailnet.

Cette configuration supprime souvent le _besoin_ de règles de pare-feu supplémentaires sur l’hôte uniquement pour stopper les attaques SSH par force brute à l’échelle d’Internet — mais vous devez tout de même garder le système à jour, exécuter `openclaw security audit`, et vérifier que vous n’écoutez pas accidentellement sur des interfaces publiques.

### Déjà protégé

| Étape traditionnelle | Nécessaire ? | Pourquoi                                                                     |
| -------------------- | ------------ | ---------------------------------------------------------------------------- |
| Pare-feu UFW         | Non          | Le VCN bloque avant que le trafic n’atteigne l’instance                     |
| fail2ban             | Non          | Pas de force brute si le port 22 est bloqué au niveau du VCN                |
| Durcissement sshd    | Non          | Tailscale SSH n’utilise pas sshd                                             |
| Désactiver la connexion root | Non  | Tailscale utilise l’identité Tailscale, pas les utilisateurs système        |
| Authentification SSH par clé uniquement | Non | Tailscale authentifie via votre tailnet                         |
| Durcissement IPv6    | Généralement non | Dépend des paramètres de votre VCN/sous-réseau ; vérifiez ce qui est réellement attribué/exposé |

### Toujours recommandé

- **Autorisations des identifiants :** `chmod 700 ~/.openclaw`
- **Audit de sécurité :** `openclaw security audit`
- **Mises à jour système :** `sudo apt update && sudo apt upgrade` régulièrement
- **Surveiller Tailscale :** examinez les appareils dans la [console d’administration Tailscale](https://login.tailscale.com/admin)

### Vérifier la posture de sécurité

```bash
# Confirmer qu’aucun port public n’écoute
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Vérifier que Tailscale SSH est actif
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Facultatif : désactiver complètement sshd
sudo systemctl disable --now ssh
```

---

## Solution de repli : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH :

```bash
# Depuis votre machine locale (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Puis ouvrez `http://localhost:18789`.

---

## Dépannage

### La création de l’instance échoue (« Out of capacity »)

Les instances ARM du niveau gratuit sont populaires. Essayez :

- Un autre domaine de disponibilité
- Réessayer en heures creuses (tôt le matin)
- Utiliser le filtre « Always Free » lors de la sélection de la forme

### Tailscale ne se connecte pas

```bash
# Vérifier l’état
sudo tailscale status

# Réauthentifier
sudo tailscale up --ssh --hostname=openclaw --reset
```

### La Gateway ne démarre pas

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Impossible d’atteindre la Control UI

```bash
# Vérifier que Tailscale Serve est en cours d’exécution
tailscale serve status

# Vérifier que la gateway écoute
curl http://localhost:18789

# Redémarrer si nécessaire
systemctl --user restart openclaw-gateway.service
```

### Problèmes de binaires ARM

Certains outils peuvent ne pas avoir de builds ARM. Vérifiez :

```bash
uname -m  # Devrait afficher aarch64
```

La plupart des paquets npm fonctionnent correctement. Pour les binaires, recherchez des versions `linux-arm64` ou `aarch64`.

---

## Persistance

Tout l’état se trouve dans :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/providers et données de session
- `~/.openclaw/workspace/` — espace de travail (SOUL.md, memory, artefacts)

Effectuez régulièrement une sauvegarde :

```bash
openclaw backup create
```

---

## Voir aussi

- [Gateway remote access](/gateway/remote) — autres modèles d’accès distant
- [Tailscale integration](/gateway/tailscale) — documentation complète Tailscale
- [Gateway configuration](/gateway/configuration) — toutes les options de configuration
- [DigitalOcean guide](/platforms/digitalocean) — si vous préférez une solution payante avec une inscription plus simple
- [Hetzner guide](/install/hetzner) — alternative basée sur Docker
