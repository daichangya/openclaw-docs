---
read_when:
    - Configuration d’OpenClaw sur Oracle Cloud
    - Vous cherchez un hébergement VPS gratuit pour OpenClaw
    - Vous voulez OpenClaw 24 h/24, 7 j/7 sur un petit serveur
summary: Héberger OpenClaw sur l’offre ARM Always Free d’Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-24T07:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 15
---

Exécutez un Gateway OpenClaw persistant sur l’offre ARM **Always Free** d’Oracle Cloud (jusqu’à 4 OCPU, 24 Go de RAM, 200 Go de stockage) sans frais.

## Prérequis

- Compte Oracle Cloud ([inscription](https://www.oracle.com/cloud/free/)) -- voir le [guide communautaire d’inscription](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si vous rencontrez des problèmes
- Compte Tailscale (gratuit sur [tailscale.com](https://tailscale.com))
- Une paire de clés SSH
- Environ 30 minutes

## Configuration

<Steps>
  <Step title="Créer une instance OCI">
    1. Connectez-vous à la [console Oracle Cloud](https://cloud.oracle.com/).
    2. Accédez à **Compute > Instances > Create Instance**.
    3. Configurez :
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (ou jusqu’à 4)
       - **Memory:** 12 GB (ou jusqu’à 24 GB)
       - **Boot volume:** 50 GB (jusqu’à 200 GB gratuits)
       - **SSH key:** ajoutez votre clé publique
    4. Cliquez sur **Create** et notez l’adresse IP publique.

    <Tip>
    Si la création de l’instance échoue avec « Out of capacity », essayez un autre domaine de disponibilité ou réessayez plus tard. La capacité du niveau gratuit est limitée.
    </Tip>

  </Step>

  <Step title="Se connecter et mettre à jour le système">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` est requis pour la compilation ARM de certaines dépendances.

  </Step>

  <Step title="Configurer l’utilisateur et le nom d’hôte">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    L’activation du linger permet aux services utilisateur de continuer à s’exécuter après la déconnexion.

  </Step>

  <Step title="Installer Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    À partir de maintenant, connectez-vous via Tailscale : `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Installer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Lorsqu’il est demandé « How do you want to hatch your bot? », sélectionnez **Do this later**.

  </Step>

  <Step title="Configurer le gateway">
    Utilisez l’authentification par jeton avec Tailscale Serve pour un accès distant sécurisé.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ici sert uniquement à la gestion locale des IP transférées/du client local par le proxy Tailscale Serve. Ce n’est **pas** `gateway.auth.mode: "trusted-proxy"`. Les routes de visualisation diff conservent ici un comportement fail-closed : les requêtes de visualisation brutes `127.0.0.1` sans en-têtes proxy transférés peuvent renvoyer `Diff not found`. Utilisez `mode=file` / `mode=both` pour les pièces jointes, ou activez volontairement les visualisations distantes et définissez `plugins.entries.diffs.config.viewerBaseUrl` (ou passez un proxy `baseUrl`) si vous avez besoin de liens de visualisation partageables.

  </Step>

  <Step title="Verrouiller la sécurité VCN">
    Bloquez tout le trafic sauf Tailscale à la périphérie réseau :

    1. Allez dans **Networking > Virtual Cloud Networks** dans la console OCI.
    2. Cliquez sur votre VCN, puis sur **Security Lists > Default Security List**.
    3. **Supprimez** toutes les règles entrantes sauf `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Conservez les règles de sortie par défaut (autoriser tout le trafic sortant).

    Cela bloque SSH sur le port 22, HTTP, HTTPS, et tout le reste à la périphérie réseau. Vous ne pourrez vous connecter qu’avec Tailscale à partir de ce moment-là.

  </Step>

  <Step title="Vérifier">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Accédez à l’interface de contrôle depuis n’importe quel appareil de votre tailnet :

    ```text
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Remplacez `<tailnet-name>` par le nom de votre tailnet (visible dans `tailscale status`).

  </Step>
</Steps>

## Repli : tunnel SSH

Si Tailscale Serve ne fonctionne pas, utilisez un tunnel SSH depuis votre machine locale :

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Ouvrez ensuite `http://localhost:18789`.

## Dépannage

**La création de l’instance échoue (« Out of capacity »)** -- Les instances ARM gratuites sont populaires. Essayez un autre domaine de disponibilité ou réessayez en heures creuses.

**Tailscale ne se connecte pas** -- Exécutez `sudo tailscale up --ssh --hostname=openclaw --reset` pour réauthentifier.

**Le Gateway ne démarre pas** -- Exécutez `openclaw doctor --non-interactive` et vérifiez les journaux avec `journalctl --user -u openclaw-gateway.service -n 50`.

**Problèmes de binaire ARM** -- La plupart des paquets npm fonctionnent sur ARM64. Pour les binaires natifs, recherchez des versions `linux-arm64` ou `aarch64`. Vérifiez l’architecture avec `uname -m`.

## Étapes suivantes

- [Canaux](/fr/channels) -- connecter Telegram, WhatsApp, Discord, et plus encore
- [Configuration du Gateway](/fr/gateway/configuration) -- toutes les options de configuration
- [Updating](/fr/install/updating) -- maintenir OpenClaw à jour

## Lié

- [Aperçu de l’installation](/fr/install)
- [GCP](/fr/install/gcp)
- [Hébergement VPS](/fr/vps)
