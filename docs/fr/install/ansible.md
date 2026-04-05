---
read_when:
    - Vous souhaitez un déploiement automatisé sur serveur avec durcissement de sécurité
    - Vous avez besoin d’une configuration isolée par pare-feu avec accès VPN
    - Vous déployez sur des serveurs Debian/Ubuntu distants
summary: Installation OpenClaw automatisée et durcie avec Ansible, VPN Tailscale et isolation par pare-feu
title: Ansible
x-i18n:
    generated_at: "2026-04-05T12:44:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27433c3b4afa09406052e428be7b1990476067e47ab8abf7145ff9547b37909a
    source_path: install/ansible.md
    workflow: 15
---

# Installation avec Ansible

Déployez OpenClaw sur des serveurs de production avec **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** -- un installeur automatisé avec une architecture axée sur la sécurité.

<Info>
Le dépôt [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) fait office de source de vérité pour le déploiement Ansible. Cette page en est un aperçu rapide.
</Info>

## Prérequis

| Exigence     | Détails                                                   |
| ------------ | --------------------------------------------------------- |
| **OS**       | Debian 11+ ou Ubuntu 20.04+                               |
| **Accès**    | Privilèges root ou sudo                                   |
| **Réseau**   | Connexion Internet pour l’installation des paquets        |
| **Ansible**  | 2.14+ (installé automatiquement par le script de démarrage rapide) |

## Ce que vous obtenez

- **Sécurité axée pare-feu** -- isolation UFW + Docker (seuls SSH + Tailscale sont accessibles)
- **VPN Tailscale** -- accès distant sécurisé sans exposition publique des services
- **Docker** -- conteneurs sandbox isolés, liaisons localhost uniquement
- **Défense en profondeur** -- architecture de sécurité à 4 couches
- **Intégration Systemd** -- démarrage automatique au boot avec durcissement
- **Configuration en une commande** -- déploiement complet en quelques minutes

## Démarrage rapide

Installation en une commande :

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## Ce qui est installé

Le playbook Ansible installe et configure :

1. **Tailscale** -- VPN maillé pour un accès distant sécurisé
2. **Pare-feu UFW** -- ports SSH + Tailscale uniquement
3. **Docker CE + Compose V2** -- pour les sandboxes d’agent
4. **Node.js 24 + pnpm** -- dépendances d’exécution (Node 22 LTS, actuellement `22.14+`, reste pris en charge)
5. **OpenClaw** -- basé sur l’hôte, non conteneurisé
6. **Service Systemd** -- démarrage automatique avec durcissement de sécurité

<Note>
La passerelle s’exécute directement sur l’hôte (pas dans Docker), mais les sandboxes d’agent utilisent Docker pour l’isolation. Consultez [Sandboxing](/gateway/sandboxing) pour plus de détails.
</Note>

## Configuration après installation

<Steps>
  <Step title="Basculer vers l’utilisateur openclaw">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="Exécuter l’assistant d’intégration guidée">
    Le script post-installation vous guide dans la configuration des paramètres OpenClaw.
  </Step>
  <Step title="Connecter les fournisseurs de messagerie">
    Connectez-vous à WhatsApp, Telegram, Discord ou Signal :
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="Vérifier l’installation">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Se connecter à Tailscale">
    Rejoignez votre réseau VPN maillé pour un accès distant sécurisé.
  </Step>
</Steps>

### Commandes rapides

```bash
# Vérifier l’état du service
sudo systemctl status openclaw

# Voir les journaux en direct
sudo journalctl -u openclaw -f

# Redémarrer la passerelle
sudo systemctl restart openclaw

# Connexion fournisseur (à exécuter comme utilisateur openclaw)
sudo -i -u openclaw
openclaw channels login
```

## Architecture de sécurité

Le déploiement utilise un modèle de défense à 4 couches :

1. **Pare-feu (UFW)** -- seuls SSH (22) + Tailscale (41641/udp) sont exposés publiquement
2. **VPN (Tailscale)** -- la passerelle est accessible uniquement via le maillage VPN
3. **Isolation Docker** -- la chaîne iptables DOCKER-USER empêche l’exposition externe des ports
4. **Durcissement Systemd** -- NoNewPrivileges, PrivateTmp, utilisateur non privilégié

Pour vérifier votre surface d’attaque externe :

```bash
nmap -p- YOUR_SERVER_IP
```

Seul le port 22 (SSH) devrait être ouvert. Tous les autres services (passerelle, Docker) sont verrouillés.

Docker est installé pour les sandboxes d’agent (exécution d’outils isolée), et non pour exécuter la passerelle elle-même. Consultez [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) pour la configuration du sandbox.

## Installation manuelle

Si vous préférez garder le contrôle manuel de l’automatisation :

<Steps>
  <Step title="Installer les prérequis">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="Cloner le dépôt">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Installer les collections Ansible">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="Exécuter le playbook">
    ```bash
    ./run-playbook.sh
    ```

    Sinon, exécutez directement puis lancez manuellement le script de configuration ensuite :
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Puis exécutez : /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## Mise à jour

L’installeur Ansible configure OpenClaw pour des mises à jour manuelles. Consultez [Mise à jour](/install/updating) pour le flux standard de mise à jour.

Pour relancer le playbook Ansible (par exemple pour des changements de configuration) :

```bash
cd openclaw-ansible
./run-playbook.sh
```

C’est idempotent et sûr à exécuter plusieurs fois.

## Dépannage

<AccordionGroup>
  <Accordion title="Le pare-feu bloque ma connexion">
    - Assurez-vous d’abord de pouvoir accéder via le VPN Tailscale
    - L’accès SSH (port 22) est toujours autorisé
    - La passerelle n’est accessible que via Tailscale par conception
  </Accordion>
  <Accordion title="Le service ne démarre pas">
    ```bash
    # Vérifier les journaux
    sudo journalctl -u openclaw -n 100

    # Vérifier les permissions
    sudo ls -la /opt/openclaw

    # Tester un démarrage manuel
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Problèmes de sandbox Docker">
    ```bash
    # Vérifier que Docker fonctionne
    sudo systemctl status docker

    # Vérifier l’image sandbox
    sudo docker images | grep openclaw-sandbox

    # Construire l’image sandbox si absente
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="La connexion au fournisseur échoue">
    Assurez-vous d’exécuter la commande en tant qu’utilisateur `openclaw` :
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## Configuration avancée

Pour l’architecture de sécurité détaillée et le dépannage, consultez le dépôt openclaw-ansible :

- [Architecture de sécurité](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [Détails techniques](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [Guide de dépannage](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## Lié

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- guide de déploiement complet
- [Docker](/install/docker) -- configuration de passerelle conteneurisée
- [Sandboxing](/gateway/sandboxing) -- configuration du sandbox d’agent
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- isolation par agent
