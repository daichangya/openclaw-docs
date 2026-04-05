---
read_when:
    - Exécution ou débogage du processus gateway
summary: Runbook pour le service Gateway, son cycle de vie et ses opérations
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-05T12:42:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Runbook Gateway

Utilisez cette page pour le démarrage au jour 1 et les opérations au jour 2 du service Gateway.

<CardGroup cols={2}>
  <Card title="Dépannage approfondi" icon="siren" href="/gateway/troubleshooting">
    Diagnostics orientés symptômes avec suites de commandes exactes et signatures de journaux.
  </Card>
  <Card title="Configuration" icon="sliders" href="/gateway/configuration">
    Guide de configuration orienté tâches + référence complète de configuration.
  </Card>
  <Card title="Gestion des secrets" icon="key-round" href="/gateway/secrets">
    Contrat SecretRef, comportement des instantanés d’exécution et opérations de migration/rechargement.
  </Card>
  <Card title="Contrat du plan des secrets" icon="shield-check" href="/gateway/secrets-plan-contract">
    Règles exactes de cible/chemin `secrets apply` et comportement des profils d’authentification ref-only.
  </Card>
</CardGroup>

## Démarrage local en 5 minutes

<Steps>
  <Step title="Démarrer la Gateway">

```bash
openclaw gateway --port 18789
# débogage/trace reflétés vers stdio
openclaw gateway --port 18789 --verbose
# tue de force l’écouteur sur le port sélectionné, puis démarre
openclaw gateway --force
```

  </Step>

  <Step title="Vérifier l’état de santé du service">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Base saine : `Runtime: running` et `RPC probe: ok`.

  </Step>

  <Step title="Valider l’état de préparation des canaux">

```bash
openclaw channels status --probe
```

Avec une gateway joignable, cela exécute des probes de canal en direct par compte ainsi que des audits facultatifs.
Si la gateway est injoignable, la CLI revient à des résumés de canal basés uniquement sur la configuration au lieu
de la sortie des probes en direct.

  </Step>
</Steps>

<Note>
Le rechargement de configuration de la Gateway surveille le chemin du fichier de configuration actif (résolu à partir des valeurs par défaut du profil/de l’état, ou de `OPENCLAW_CONFIG_PATH` lorsqu’il est défini).
Le mode par défaut est `gateway.reload.mode="hybrid"`.
Après le premier chargement réussi, le processus en cours d’exécution sert l’instantané de configuration actif en mémoire ; un rechargement réussi échange cet instantané de façon atomique.
</Note>

## Modèle d’exécution

- Un processus toujours actif pour le routage, le plan de contrôle et les connexions de canaux.
- Un port multiplexé unique pour :
  - le contrôle/RPC WebSocket
  - les API HTTP, compatibles OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - l’UI de contrôle et les hooks
- Mode de liaison par défaut : `loopback`.
- L’authentification est requise par défaut. Les configurations à secret partagé utilisent
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), et les configurations
  de reverse proxy hors loopback peuvent utiliser `gateway.auth.mode: "trusted-proxy"`.

## Points de terminaison compatibles OpenAI

La surface de compatibilité la plus utile d’OpenClaw est désormais :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Pourquoi cet ensemble est important :

- La plupart des intégrations Open WebUI, LobeChat et LibreChat sondent d’abord `/v1/models`.
- De nombreux pipelines RAG et mémoire attendent `/v1/embeddings`.
- Les clients natifs d’agent préfèrent de plus en plus `/v1/responses`.

Remarque de planification :

- `/v1/models` est centré sur l’agent : il renvoie `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
- `openclaw/default` est l’alias stable qui pointe toujours vers l’agent par défaut configuré.
- Utilisez `x-openclaw-model` lorsque vous voulez un remplacement fournisseur/modèle backend ; sinon, le modèle normal et la configuration d’embedding de l’agent sélectionné restent maîtres.

Tout cela s’exécute sur le port principal de la Gateway et utilise la même frontière d’authentification d’opérateur de confiance que le reste de l’API HTTP Gateway.

### Priorité du port et de la liaison

| Paramètre     | Ordre de résolution                                             |
| ------------- | --------------------------------------------------------------- |
| Port Gateway  | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode de liaison | CLI/override → `gateway.bind` → `loopback`                  |

### Modes de rechargement à chaud

| `gateway.reload.mode` | Comportement                                |
| --------------------- | ------------------------------------------- |
| `off`                 | Aucun rechargement de configuration         |
| `hot`                 | Applique uniquement les changements sûrs à chaud |
| `restart`             | Redémarre pour les changements nécessitant un redémarrage |
| `hybrid` (par défaut) | Applique à chaud lorsque c’est sûr, redémarre lorsque nécessaire |

## Ensemble de commandes opérateur

```bash
openclaw gateway status
openclaw gateway status --deep   # ajoute une analyse du service au niveau système
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sert à la découverte supplémentaire de services (LaunchDaemons/unités systemd système
/schtasks), pas à une probe RPC de santé plus approfondie.

## Plusieurs gateways (même hôte)

La plupart des installations devraient exécuter une gateway par machine. Une seule gateway peut héberger plusieurs
agents et canaux.

Vous n’avez besoin de plusieurs gateways que si vous voulez intentionnellement de l’isolation ou un bot de secours.

Vérifications utiles :

```bash
openclaw gateway status --deep
openclaw gateway probe
```

À quoi s’attendre :

- `gateway status --deep` peut signaler `Other gateway-like services detected (best effort)`
  et afficher des conseils de nettoyage lorsque des installations launchd/systemd/schtasks obsolètes sont encore présentes.
- `gateway probe` peut avertir de `multiple reachable gateways` lorsque plus d’une cible
  répond.
- Si c’est intentionnel, isolez les ports, la configuration/l’état et les racines d’espace de travail par gateway.

Configuration détaillée : [/gateway/multiple-gateways](/gateway/multiple-gateways).

## Accès distant

Préféré : Tailscale/VPN.
Solution de repli : tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Connectez ensuite les clients à `ws://127.0.0.1:18789` localement.

<Warning>
Les tunnels SSH ne contournent pas l’authentification de la gateway. Pour l’authentification à secret partagé, les clients
doivent toujours envoyer `token`/`password` même via le tunnel. Pour les modes portant une identité,
la requête doit toujours satisfaire ce chemin d’authentification.
</Warning>

Voir : [Gateway distante](/gateway/remote), [Authentification](/gateway/authentication), [Tailscale](/gateway/tailscale).

## Supervision et cycle de vie du service

Utilisez des exécutions supervisées pour une fiabilité de type production.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Les libellés LaunchAgent sont `ai.openclaw.gateway` (par défaut) ou `ai.openclaw.<profile>` (profil nommé). `openclaw doctor` audite et répare la dérive de configuration du service.

  </Tab>

  <Tab title="Linux (systemd utilisateur)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Pour la persistance après déconnexion, activez lingering :

```bash
sudo loginctl enable-linger <user>
```

Exemple manuel d’unité utilisateur si vous avez besoin d’un chemin d’installation personnalisé :

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (natif)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Le démarrage géré Windows natif utilise une tâche planifiée nommée `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` pour les profils nommés). Si la création de tâche planifiée
est refusée, OpenClaw revient à un lanceur par utilisateur dans le dossier de démarrage
pointant vers `gateway.cmd` dans le répertoire d’état.

  </Tab>

  <Tab title="Linux (service système)">

Utilisez une unité système pour les hôtes multi-utilisateurs/toujours actifs.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Utilisez le même corps de service que pour l’unité utilisateur, mais installez-le sous
`/etc/systemd/system/openclaw-gateway[-<profile>].service` et ajustez
`ExecStart=` si votre binaire `openclaw` se trouve ailleurs.

  </Tab>
</Tabs>

## Plusieurs gateways sur un même hôte

La plupart des configurations devraient exécuter **une seule** Gateway.
N’en utilisez plusieurs que pour une isolation/redondance stricte (par exemple un profil de secours).

Liste de contrôle par instance :

- `gateway.port` unique
- `OPENCLAW_CONFIG_PATH` unique
- `OPENCLAW_STATE_DIR` unique
- `agents.defaults.workspace` unique

Exemple :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Voir : [Plusieurs gateways](/gateway/multiple-gateways).

### Chemin rapide du profil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Les valeurs par défaut incluent un état/une configuration isolés et un port Gateway de base `19001`.

## Référence rapide du protocole (vue opérateur)

- La première trame cliente doit être `connect`.
- La Gateway renvoie un instantané `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/politique).
- `hello-ok.features.methods` / `events` sont une liste de découverte conservatrice, pas
  un dump généré de toutes les routes d’assistance appelables.
- Requêtes : `req(method, params)` → `res(ok/payload|error)`.
- Les événements courants incluent `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, les événements du cycle de vie d’appairage/d’approbation, et `shutdown`.

Les exécutions d’agent se déroulent en deux étapes :

1. Accusé de réception immédiat (`status:"accepted"`)
2. Réponse finale d’achèvement (`status:"ok"|"error"`), avec des événements `agent` diffusés entre les deux.

Voir la documentation complète du protocole : [Protocole Gateway](/gateway/protocol).

## Vérifications opérationnelles

### Vivacité

- Ouvrir un WS et envoyer `connect`.
- Attendre une réponse `hello-ok` avec instantané.

### Disponibilité

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Récupération après trou

Les événements ne sont pas rejoués. En cas de trous de séquence, actualisez l’état (`health`, `system-presence`) avant de continuer.

## Signatures d’échec courantes

| Signature                                                      | Problème probable                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Liaison hors loopback sans chemin d’authentification gateway valide              |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflit de port                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | Configuration en mode distant, ou marque locale manquante dans une configuration endommagée |
| `unauthorized` during connect                                  | Incohérence d’authentification entre le client et la gateway                     |

Pour les suites complètes de diagnostic, utilisez [Dépannage Gateway](/gateway/troubleshooting).

## Garanties de sécurité

- Les clients du protocole Gateway échouent immédiatement lorsque la Gateway n’est pas disponible (pas de solution de repli implicite directe vers le canal).
- Les premières trames invalides/non-connect sont rejetées et la connexion est fermée.
- Un arrêt propre émet un événement `shutdown` avant la fermeture du socket.

---

Liens associés :

- [Dépannage](/gateway/troubleshooting)
- [Processus en arrière-plan](/gateway/background-process)
- [Configuration](/gateway/configuration)
- [Santé](/gateway/health)
- [Doctor](/gateway/doctor)
- [Authentification](/gateway/authentication)
