---
read_when:
    - Configuration d’OpenClaw sur DigitalOcean
    - Recherche d’un hébergement VPS peu coûteux pour OpenClaw
summary: OpenClaw sur DigitalOcean (option VPS payante simple)
title: DigitalOcean (plateforme)
x-i18n:
    generated_at: "2026-04-05T12:48:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw sur DigitalOcean

## Objectif

Exécuter une OpenClaw Gateway persistante sur DigitalOcean pour **6 $/mois** (ou 4 $/mois avec un tarif réservé).

Si vous voulez une option à 0 $/mois et que l’ARM + une configuration spécifique au fournisseur ne vous dérangent pas, consultez le [guide Oracle Cloud](/platforms/oracle).

## Comparaison des coûts (2026)

| Fournisseur  | Offre            | Spécifications           | Prix/mois    | Remarques                              |
| ------------ | ---------------- | ------------------------ | ------------ | -------------------------------------- |
| Oracle Cloud | ARM Always Free  | jusqu’à 4 OCPU, 24GB RAM | $0           | ARM, capacité limitée / inscription capricieuse |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM          | €3.79 (~$4)  | Option payante la moins chère          |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM          | $6           | Interface simple, bonne documentation  |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM          | $6           | Nombreux emplacements                  |
| Linode       | Nanode           | 1 vCPU, 1GB RAM          | $5           | Fait maintenant partie d’Akamai        |

**Choisir un fournisseur :**

- DigitalOcean : expérience la plus simple + configuration prévisible (ce guide)
- Hetzner : bon rapport prix/performance (voir [guide Hetzner](/install/hetzner))
- Oracle Cloud : peut coûter 0 $/mois, mais est plus capricieux et uniquement ARM (voir [guide Oracle](/platforms/oracle))

---

## Prérequis

- Compte DigitalOcean ([inscription avec 200 $ de crédit gratuit](https://m.do.co/c/signup))
- Paire de clés SSH (ou volonté d’utiliser l’authentification par mot de passe)
- ~20 minutes

## 1) Créer un Droplet

<Warning>
Utilisez une image de base propre (Ubuntu 24.04 LTS). Évitez les images 1-click tierces du Marketplace sauf si vous avez vérifié leurs scripts de démarrage et leurs paramètres de pare-feu par défaut.
</Warning>

1. Connectez-vous à [DigitalOcean](https://cloud.digitalocean.com/)
2. Cliquez sur **Create → Droplets**
3. Choisissez :
   - **Region :** la plus proche de vous (ou de vos utilisateurs)
   - **Image :** Ubuntu 24.04 LTS
   - **Size :** Basic → Regular → **6 $/mois** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication :** clé SSH (recommandé) ou mot de passe
4. Cliquez sur **Create Droplet**
5. Notez l’adresse IP

## 2) Se connecter via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Installer OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Exécuter l’onboarding

```bash
openclaw onboard --install-daemon
```

L’assistant vous guidera pour :

- l’authentification du modèle (clés API ou OAuth)
- la configuration des canaux (Telegram, WhatsApp, Discord, etc.)
- le jeton Gateway (généré automatiquement)
- l’installation du daemon (systemd)

## 5) Vérifier la Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Accéder au tableau de bord

Par défaut, la passerelle est liée à loopback. Pour accéder à l’interface Control :

**Option A : tunnel SSH (recommandé)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Option B : Tailscale Serve (HTTPS, loopback uniquement)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Ouvrez : `https://<magicdns>/`

Remarques :

- Serve garde la Gateway en loopback uniquement et authentifie le trafic Control UI/WebSocket via les en-têtes d’identité Tailscale (l’authentification sans jeton suppose un hôte Gateway de confiance ; les API HTTP n’utilisent pas ces en-têtes Tailscale et suivent à la place le mode d’authentification HTTP normal de la passerelle).
- Pour exiger à la place des identifiants explicites à secret partagé, définissez `gateway.auth.allowTailscale: false` et utilisez `gateway.auth.mode: "token"` ou `"password"`.

**Option C : liaison tailnet (sans Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Ouvrez : `http://<tailscale-ip>:18789` (jeton requis).

## 7) Connecter vos canaux

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Voir [Canaux](/channels) pour les autres fournisseurs.

---

## Optimisations pour 1GB de RAM

Le droplet à 6 $ n’a que 1GB de RAM. Pour que tout fonctionne correctement :

### Ajouter du swap (recommandé)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Utiliser un modèle plus léger

Si vous rencontrez des OOM, envisagez de :

- utiliser des modèles basés sur API (Claude, GPT) au lieu de modèles locaux
- définir `agents.defaults.model.primary` sur un modèle plus petit

### Surveiller la mémoire

```bash
free -h
htop
```

---

## Persistance

Tout l’état se trouve dans :

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` par agent, état des canaux/fournisseurs et données de session
- `~/.openclaw/workspace/` — espace de travail (SOUL.md, mémoire, etc.)

Ces éléments survivent aux redémarrages. Sauvegardez-les périodiquement :

```bash
openclaw backup create
```

---

## Alternative gratuite Oracle Cloud

Oracle Cloud propose des instances ARM **Always Free** nettement plus puissantes que toutes les options payantes ici — pour 0 $/mois.

| Ce que vous obtenez | Spécifications        |
| ------------------- | --------------------- |
| **4 OCPU**          | ARM Ampere A1         |
| **24GB RAM**        | largement suffisant   |
| **200GB storage**   | volume bloc           |
| **Forever free**    | aucun frais de carte bancaire |

**Inconvénients :**

- L’inscription peut être capricieuse (réessayez si cela échoue)
- Architecture ARM — la plupart des choses fonctionnent, mais certains binaires nécessitent des builds ARM

Pour le guide complet de configuration, voir [Oracle Cloud](/platforms/oracle). Pour des conseils d’inscription et le dépannage du processus d’inscription, voir ce [guide communautaire](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Résolution des problèmes

### La Gateway ne démarre pas

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port déjà utilisé

```bash
lsof -i :18789
kill <PID>
```

### Mémoire insuffisante

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Voir aussi

- [Guide Hetzner](/install/hetzner) — moins cher, plus puissant
- [Installation Docker](/install/docker) — configuration conteneurisée
- [Tailscale](/gateway/tailscale) — accès distant sécurisé
- [Configuration](/gateway/configuration) — référence complète de configuration
