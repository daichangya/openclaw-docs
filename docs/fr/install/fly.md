---
read_when:
    - Déploiement d’OpenClaw sur Fly.io
    - Configuration des volumes Fly, des secrets et de la configuration de première exécution
summary: déploiement Fly.io étape par étape pour OpenClaw avec stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T07:16:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Déploiement Fly.io

**Objectif :** une Gateway OpenClaw exécutée sur une machine [Fly.io](https://fly.io) avec stockage persistant, HTTPS automatique et accès Discord/canal.

## Ce dont vous avez besoin

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installée
- Compte Fly.io (le niveau gratuit fonctionne)
- Authentification du modèle : clé API pour le fournisseur de modèle choisi
- Identifiants de canal : jeton de bot Discord, jeton Telegram, etc.

## Parcours rapide pour débutants

1. Cloner le dépôt → personnaliser `fly.toml`
2. Créer l’app + le volume → définir les secrets
3. Déployer avec `fly deploy`
4. Se connecter en SSH pour créer la configuration ou utiliser le Control UI

<Steps>
  <Step title="Créer l’app Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Conseil :** choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San Jose).

  </Step>

  <Step title="Configurer fly.toml">
    Modifiez `fly.toml` pour qu’il corresponde au nom de votre app et à vos besoins.

    **Remarque de sécurité :** la configuration par défaut expose une URL publique. Pour un déploiement durci sans IP publique, voir [Déploiement privé](#private-deployment-hardened) ou utilisez `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Paramètres clés :**

    | Paramètre                     | Pourquoi                                                                    |
    | ----------------------------- | ---------------------------------------------------------------------------- |
    | `--bind lan`                  | Lie à `0.0.0.0` afin que le proxy Fly puisse atteindre la gateway            |
    | `--allow-unconfigured`        | Démarre sans fichier de configuration (vous en créerez un après)             |
    | `internal_port = 3000`        | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les contrôles de santé Fly |
    | `memory = "2048mb"`           | 512 Mo est trop faible ; 2 Go recommandés                                    |
    | `OPENCLAW_STATE_DIR = "/data"`| Conserve l’état sur le volume                                                 |

  </Step>

  <Step title="Définir les secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Remarques :**

    - Les liaisons non loopback (`--bind lan`) exigent un chemin d’authentification Gateway valide. Cet exemple Fly.io utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement `trusted-proxy` non loopback correctement configuré satisfont aussi à cette exigence.
    - Traitez ces jetons comme des mots de passe.
    - **Préférez les variables d’environnement au fichier de configuration** pour toutes les clés API et tous les jetons. Cela garde les secrets hors de `openclaw.json`, où ils pourraient être accidentellement exposés ou journalisés.

  </Step>

  <Step title="Déployer">
    ```bash
    fly deploy
    ```

    Le premier déploiement construit l’image Docker (~2-3 minutes). Les déploiements suivants sont plus rapides.

    Après le déploiement, vérifiez :

    ```bash
    fly status
    fly logs
    ```

    Vous devriez voir :

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Créer le fichier de configuration">
    Connectez-vous en SSH à la machine pour créer une configuration correcte :

    ```bash
    fly ssh console
    ```

    Créez le répertoire de configuration et le fichier :

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Remarque :** avec `OPENCLAW_STATE_DIR=/data`, le chemin de configuration est `/data/openclaw.json`.

    **Remarque :** le jeton Discord peut venir soit de :

    - la variable d’environnement : `DISCORD_BOT_TOKEN` (recommandé pour les secrets)
    - le fichier de configuration : `channels.discord.token`

    Si vous utilisez une variable d’environnement, inutile d’ajouter le jeton à la configuration. La gateway lit automatiquement `DISCORD_BOT_TOKEN`.

    Redémarrez pour appliquer :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accéder à la Gateway">
    ### Control UI

    Ouvrez dans le navigateur :

    ```bash
    fly open
    ```

    Ou rendez-vous sur `https://my-openclaw.fly.dev/`

    Authentifiez-vous avec le secret partagé configuré. Ce guide utilise le jeton Gateway
    provenant de `OPENCLAW_GATEWAY_TOKEN` ; si vous êtes passé à une authentification par mot de passe, utilisez
    plutôt ce mot de passe.

    ### Journaux

    ```bash
    fly logs              # Journaux en direct
    fly logs --no-tail    # Journaux récents
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Dépannage

### « App is not listening on expected address »

La gateway est liée à `127.0.0.1` au lieu de `0.0.0.0`.

**Correctif :** ajoutez `--bind lan` à votre commande de processus dans `fly.toml`.

### Contrôles de santé en échec / connexion refusée

Fly ne peut pas atteindre la gateway sur le port configuré.

**Correctif :** assurez-vous que `internal_port` correspond au port de la gateway (définissez `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problèmes de mémoire

Le conteneur continue de redémarrer ou d’être tué. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou redémarrages silencieux.

**Correctif :** augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Remarque :** 512 Mo est trop faible. 1 Go peut fonctionner mais peut provoquer un OOM sous charge ou avec une journalisation verbeuse. **2 Go sont recommandés.**

### Problèmes de verrou Gateway

La Gateway refuse de démarrer avec des erreurs de type « already running ».

Cela se produit lorsque le conteneur redémarre mais que le fichier de verrou PID persiste sur le volume.

**Correctif :** supprimez le fichier de verrou :

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Le fichier de verrou se trouve dans `/data/gateway.*.lock` (pas dans un sous-répertoire).

### Configuration non lue

`--allow-unconfigured` contourne seulement la protection au démarrage. Il ne crée ni ne répare `/data/openclaw.json`, donc assurez-vous que votre vraie configuration existe et inclut `gateway.mode="local"` si vous voulez un démarrage normal de gateway locale.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écrire la configuration via SSH

La commande `fly ssh console -C` ne prend pas en charge la redirection shell. Pour écrire un fichier de configuration :

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Remarque :** `fly sftp` peut échouer si le fichier existe déjà. Supprimez-le d’abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### État non persistant

Si vous perdez les profils d’authentification, l’état des canaux/fournisseurs ou les sessions après un redémarrage,
le répertoire d’état écrit probablement dans le système de fichiers du conteneur.

**Correctif :** assurez-vous que `OPENCLAW_STATE_DIR=/data` est défini dans `fly.toml` puis redéployez.

## Mises à jour

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Mettre à jour la commande de la machine

Si vous devez modifier la commande de démarrage sans redéploiement complet :

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Remarque :** après `fly deploy`, la commande de la machine peut être réinitialisée à ce qui se trouve dans `fly.toml`. Si vous avez effectué des modifications manuelles, réappliquez-les après le déploiement.

## Déploiement privé (durci)

Par défaut, Fly alloue des IP publiques, ce qui rend votre gateway accessible à `https://your-app.fly.dev`. C’est pratique mais cela signifie que votre déploiement est détectable par les scanners Internet (Shodan, Censys, etc.).

Pour un déploiement durci avec **aucune exposition publique**, utilisez le modèle privé.

### Quand utiliser un déploiement privé

- Vous n’effectuez que des appels/messages **sortants** (pas de Webhook entrants)
- Vous utilisez des tunnels **ngrok ou Tailscale** pour tout rappel webhook
- Vous accédez à la gateway via **SSH, proxy ou WireGuard** au lieu du navigateur
- Vous voulez que le déploiement soit **caché des scanners Internet**

### Configuration

Utilisez `fly.private.toml` au lieu de la configuration standard :

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

Ou convertissez un déploiement existant :

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Après cela, `fly ips list` ne doit afficher qu’une IP de type `private` :

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accéder à un déploiement privé

Comme il n’y a pas d’URL publique, utilisez l’une des méthodes suivantes :

**Option 1 : proxy local (la plus simple)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Option 2 : VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Option 3 : SSH uniquement**

```bash
fly ssh console -a my-openclaw
```

### Webhook avec déploiement privé

Si vous avez besoin de rappels webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** - Exécutez ngrok dans le conteneur ou en sidecar
2. **Tailscale Funnel** - Exposez des chemins spécifiques via Tailscale
3. **Sortie uniquement** - Certains fournisseurs (Twilio) fonctionnent très bien pour les appels sortants sans webhook

Exemple de configuration d’appel vocal avec ngrok :

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Le tunnel ngrok s’exécute dans le conteneur et fournit une URL Webhook publique sans exposer l’app Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte public du tunnel afin que les en-têtes d’hôte transférés soient acceptés.

### Avantages de sécurité

| Aspect              | Public       | Privé      |
| ------------------- | ------------ | ---------- |
| Scanners Internet   | Détectable   | Caché      |
| Attaques directes   | Possibles    | Bloquées   |
| Accès Control UI    | Navigateur   | Proxy/VPN  |
| Livraison Webhook   | Directe      | Via tunnel |

## Remarques

- Fly.io utilise une **architecture x86** (pas ARM)
- Le Dockerfile est compatible avec les deux architectures
- Pour l’intégration WhatsApp/Telegram, utilisez `fly ssh console`
- Les données persistantes se trouvent sur le volume à `/data`
- Signal nécessite Java + signal-cli ; utilisez une image personnalisée et conservez 2 Go+ de mémoire.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM) :

- ~10-15 $/mois selon l’usage
- Le niveau gratuit inclut une certaine allocation

Voir [tarification Fly.io](https://fly.io/docs/about/pricing/) pour les détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Canaux](/fr/channels)
- Configurer la Gateway : [Configuration Gateway](/fr/gateway/configuration)
- Maintenir OpenClaw à jour : [Mise à jour](/fr/install/updating)

## Liens associés

- [Vue d’ensemble de l’installation](/fr/install)
- [Hetzner](/fr/install/hetzner)
- [Docker](/fr/install/docker)
- [Hébergement VPS](/fr/vps)
