---
read_when:
    - Déploiement d’OpenClaw sur Fly.io
    - Configuration des volumes, secrets et de la configuration de premier démarrage Fly
summary: Déploiement Fly.io pas à pas pour OpenClaw avec stockage persistant et HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T12:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Déploiement Fly.io

**Objectif :** passerelle OpenClaw exécutée sur une machine [Fly.io](https://fly.io) avec stockage persistant, HTTPS automatique et accès Discord/canaux.

## Ce dont vous avez besoin

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installée
- Compte Fly.io (le niveau gratuit fonctionne)
- Authentification modèle : clé API pour le fournisseur de modèles choisi
- Identifiants de canaux : jeton de bot Discord, jeton Telegram, etc.

## Parcours rapide pour débutants

1. Cloner le dépôt → personnaliser `fly.toml`
2. Créer l’application + le volume → définir les secrets
3. Déployer avec `fly deploy`
4. Se connecter en SSH pour créer la configuration ou utiliser l’interface de contrôle

<Steps>
  <Step title="Créer l’application Fly">
    ```bash
    # Cloner le dépôt
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Créer une nouvelle application Fly (choisissez votre propre nom)
    fly apps create my-openclaw

    # Créer un volume persistant (1 Go suffit généralement)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Astuce :** choisissez une région proche de vous. Options courantes : `lhr` (Londres), `iad` (Virginie), `sjc` (San Jose).

  </Step>

  <Step title="Configurer fly.toml">
    Modifiez `fly.toml` pour qu’il corresponde au nom de votre application et à vos besoins.

    **Remarque de sécurité :** la configuration par défaut expose une URL publique. Pour un déploiement durci sans IP publique, consultez [Déploiement privé](#private-deployment-hardened) ou utilisez `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nom de votre application
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

    | Paramètre                     | Pourquoi                                                                   |
    | ----------------------------- | -------------------------------------------------------------------------- |
    | `--bind lan`                  | Lie à `0.0.0.0` pour que le proxy Fly puisse atteindre la passerelle       |
    | `--allow-unconfigured`        | Démarre sans fichier de configuration (vous en créerez un après)           |
    | `internal_port = 3000`        | Doit correspondre à `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) pour les vérifications de santé Fly |
    | `memory = "2048mb"`           | 512 Mo est trop faible ; 2 Go recommandés                                  |
    | `OPENCLAW_STATE_DIR = "/data"`| Persiste l’état sur le volume                                              |

  </Step>

  <Step title="Définir les secrets">
    ```bash
    # Obligatoire : jeton de passerelle (pour une liaison non loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Clés API du fournisseur de modèles
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Facultatif : autres fournisseurs
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Jetons de canaux
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Remarques :**

    - Les liaisons non loopback (`--bind lan`) nécessitent un chemin d’authentification de passerelle valide. Cet exemple Fly.io utilise `OPENCLAW_GATEWAY_TOKEN`, mais `gateway.auth.password` ou un déploiement `trusted-proxy` non loopback correctement configuré satisfont également cette exigence.
    - Traitez ces jetons comme des mots de passe.
    - **Préférez les variables d’environnement au fichier de configuration** pour toutes les clés API et tous les jetons. Cela garde les secrets hors de `openclaw.json`, où ils pourraient être exposés ou journalisés accidentellement.

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

    Créez le répertoire et le fichier de configuration :

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

    **Remarque :** le jeton Discord peut provenir de :

    - Variable d’environnement : `DISCORD_BOT_TOKEN` (recommandé pour les secrets)
    - Fichier de configuration : `channels.discord.token`

    Si vous utilisez une variable d’environnement, il n’est pas nécessaire d’ajouter le jeton à la configuration. La passerelle lit automatiquement `DISCORD_BOT_TOKEN`.

    Redémarrez pour appliquer :

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accéder à la passerelle">
    ### Interface de contrôle

    Ouvrez dans le navigateur :

    ```bash
    fly open
    ```

    Ou visitez `https://my-openclaw.fly.dev/`

    Authentifiez-vous avec le secret partagé configuré. Ce guide utilise le jeton de passerelle de `OPENCLAW_GATEWAY_TOKEN` ; si vous êtes passé à une auth par mot de passe, utilisez ce mot de passe à la place.

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

### "App is not listening on expected address"

La passerelle est liée à `127.0.0.1` au lieu de `0.0.0.0`.

**Correction :** ajoutez `--bind lan` à votre commande de processus dans `fly.toml`.

### Vérifications de santé en échec / connexion refusée

Fly ne peut pas atteindre la passerelle sur le port configuré.

**Correction :** assurez-vous que `internal_port` correspond au port de la passerelle (définissez `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problèmes de mémoire

Le conteneur redémarre sans cesse ou est tué. Signes : `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou redémarrages silencieux.

**Correction :** augmentez la mémoire dans `fly.toml` :

```toml
[[vm]]
  memory = "2048mb"
```

Ou mettez à jour une machine existante :

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Remarque :** 512 Mo est trop faible. 1 Go peut fonctionner mais peut provoquer des OOM sous charge ou avec une journalisation détaillée. **2 Go sont recommandés.**

### Problèmes de verrou de passerelle

La passerelle refuse de démarrer avec des erreurs « already running ».

Cela se produit lorsque le conteneur redémarre mais que le fichier de verrou PID persiste sur le volume.

**Correction :** supprimez le fichier de verrouillage :

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Le fichier de verrouillage se trouve dans `/data/gateway.*.lock` (pas dans un sous-répertoire).

### La configuration n’est pas lue

`--allow-unconfigured` ne fait que contourner le garde-fou de démarrage. Il ne crée ni ne répare `/data/openclaw.json`, donc assurez-vous que votre vraie configuration existe et inclut `gateway.mode="local"` lorsque vous souhaitez un démarrage normal de passerelle locale.

Vérifiez que la configuration existe :

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Écriture de la configuration via SSH

La commande `fly ssh console -C` ne prend pas en charge la redirection shell. Pour écrire un fichier de configuration :

```bash
# Utiliser echo + tee (pipe du local vers le distant)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Ou utiliser sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Remarque :** `fly sftp` peut échouer si le fichier existe déjà. Supprimez-le d’abord :

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### L’état ne persiste pas

Si vous perdez les profils d’authentification, l’état des canaux/fournisseurs ou les sessions après un redémarrage,
le répertoire d’état écrit dans le système de fichiers du conteneur.

**Correction :** assurez-vous que `OPENCLAW_STATE_DIR=/data` est défini dans `fly.toml` et redéployez.

## Mises à jour

```bash
# Récupérer les dernières modifications
git pull

# Redéployer
fly deploy

# Vérifier la santé
fly status
fly logs
```

### Mise à jour de la commande de la machine

Si vous devez modifier la commande de démarrage sans redéploiement complet :

```bash
# Obtenir l’ID de la machine
fly machines list

# Mettre à jour la commande
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou avec augmentation de mémoire
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Remarque :** après `fly deploy`, la commande de la machine peut être réinitialisée à ce qui se trouve dans `fly.toml`. Si vous avez effectué des modifications manuelles, réappliquez-les après le déploiement.

## Déploiement privé (durci)

Par défaut, Fly alloue des IP publiques, rendant votre passerelle accessible à `https://your-app.fly.dev`. C’est pratique mais cela signifie que votre déploiement est détectable par les scanners Internet (Shodan, Censys, etc.).

Pour un déploiement durci **sans exposition publique**, utilisez le modèle privé.

### Quand utiliser un déploiement privé

- Vous effectuez uniquement des appels/messages **sortants** (pas de webhooks entrants)
- Vous utilisez des tunnels **ngrok ou Tailscale** pour les rappels webhook
- Vous accédez à la passerelle via **SSH, proxy ou WireGuard** plutôt que par le navigateur
- Vous souhaitez que le déploiement soit **caché aux scanners Internet**

### Configuration

Utilisez `fly.private.toml` au lieu de la configuration standard :

```bash
# Déployer avec la configuration privée
fly deploy -c fly.private.toml
```

Ou convertissez un déploiement existant :

```bash
# Lister les IP actuelles
fly ips list -a my-openclaw

# Libérer les IP publiques
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Basculer vers la configuration privée afin que les futurs déploiements
# ne réallouent pas d’IP publiques
# (supprimer [http_service] ou déployer avec le modèle privé)
fly deploy -c fly.private.toml

# Allouer une IPv6 privée uniquement
fly ips allocate-v6 --private -a my-openclaw
```

Après cela, `fly ips list` ne devrait afficher qu’une IP de type `private` :

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accéder à un déploiement privé

Puisqu’il n’y a pas d’URL publique, utilisez l’une de ces méthodes :

**Option 1 : proxy local (le plus simple)**

```bash
# Rediriger le port local 3000 vers l’application
fly proxy 3000:3000 -a my-openclaw

# Puis ouvrir http://localhost:3000 dans le navigateur
```

**Option 2 : VPN WireGuard**

```bash
# Créer la configuration WireGuard (une seule fois)
fly wireguard create

# Importer dans le client WireGuard, puis accéder via l’IPv6 interne
# Exemple : http://[fdaa:x:x:x:x::x]:3000
```

**Option 3 : SSH uniquement**

```bash
fly ssh console -a my-openclaw
```

### Webhooks avec déploiement privé

Si vous avez besoin de rappels webhook (Twilio, Telnyx, etc.) sans exposition publique :

1. **Tunnel ngrok** - Exécuter ngrok dans le conteneur ou en sidecar
2. **Tailscale Funnel** - Exposer des chemins spécifiques via Tailscale
3. **Sortant uniquement** - Certains fournisseurs (Twilio) fonctionnent très bien pour les appels sortants sans webhooks

Exemple de configuration voice-call avec ngrok :

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

Le tunnel ngrok s’exécute à l’intérieur du conteneur et fournit une URL webhook publique sans exposer l’application Fly elle-même. Définissez `webhookSecurity.allowedHosts` sur le nom d’hôte public du tunnel afin que les en-têtes d’hôte transférés soient acceptés.

### Avantages de sécurité

| Aspect               | Public       | Privé      |
| -------------------- | ------------ | ---------- |
| Scanners Internet    | Détectable   | Caché      |
| Attaques directes    | Possibles    | Bloquées   |
| Accès à l’interface de contrôle | Navigateur   | Proxy/VPN  |
| Distribution de webhook | Directe    | Via tunnel |

## Remarques

- Fly.io utilise une **architecture x86** (pas ARM)
- Le Dockerfile est compatible avec les deux architectures
- Pour l’intégration guidée WhatsApp/Telegram, utilisez `fly ssh console`
- Les données persistantes vivent sur le volume dans `/data`
- Signal nécessite Java + signal-cli ; utilisez une image personnalisée et gardez 2 Go+ de mémoire.

## Coût

Avec la configuration recommandée (`shared-cpu-2x`, 2 Go de RAM) :

- ~10-15 $/mois selon l’usage
- Le niveau gratuit inclut une certaine allocation

Consultez [la tarification Fly.io](https://fly.io/docs/about/pricing/) pour plus de détails.

## Étapes suivantes

- Configurer les canaux de messagerie : [Channels](/channels)
- Configurer la passerelle : [Configuration de la passerelle](/gateway/configuration)
- Garder OpenClaw à jour : [Mise à jour](/install/updating)
