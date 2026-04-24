---
read_when:
    - Exécution ou débogage du processus gateway
summary: Runbook du service Gateway, du cycle de vie et des opérations
title: Runbook Gateway
x-i18n:
    generated_at: "2026-04-24T07:10:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Utilisez cette page pour le démarrage au jour 1 et les opérations au jour 2 du service Gateway.

<CardGroup cols={2}>
  <Card title="Dépannage approfondi" icon="siren" href="/fr/gateway/troubleshooting">
    Diagnostics orientés par symptôme avec séquences exactes de commandes et signatures de journaux.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fr/gateway/configuration">
    Guide de configuration orienté tâches + référence complète de configuration.
  </Card>
  <Card title="Gestion des secrets" icon="key-round" href="/fr/gateway/secrets">
    Contrat SecretRef, comportement des instantanés d’exécution et opérations de migration/rechargement.
  </Card>
  <Card title="Contrat du plan de secrets" icon="shield-check" href="/fr/gateway/secrets-plan-contract">
    Règles exactes de cible/chemin pour `secrets apply` et comportement des profils d’authentification ref-only.
  </Card>
</CardGroup>

## Démarrage local en 5 minutes

<Steps>
  <Step title="Démarrer le Gateway">

```bash
openclaw gateway --port 18789
# debug/trace reflétés vers stdio
openclaw gateway --port 18789 --verbose
# tue de force l’écouteur sur le port sélectionné, puis démarre
openclaw gateway --force
```

  </Step>

  <Step title="Vérifier la santé du service">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Référence saine : `Runtime: running`, `Connectivity probe: ok`, et `Capability: ...` correspondant à vos attentes. Utilisez `openclaw gateway status --require-rpc` lorsque vous avez besoin d’une preuve RPC à portée lecture, et pas seulement d’accessibilité.

  </Step>

  <Step title="Valider l’état de préparation des canaux">

```bash
openclaw channels status --probe
```

Avec un gateway accessible, cette commande exécute des sondes de canaux en direct par compte et des audits facultatifs.
Si le gateway est inaccessible, la CLI revient à des résumés de canaux basés uniquement sur la configuration
au lieu d’une sortie de sonde en direct.

  </Step>
</Steps>

<Note>
Le rechargement de configuration du Gateway surveille le chemin du fichier de configuration actif (résolu à partir des valeurs par défaut de profil/état, ou `OPENCLAW_CONFIG_PATH` s’il est défini).
Le mode par défaut est `gateway.reload.mode="hybrid"`.
Après le premier chargement réussi, le processus en cours d’exécution sert l’instantané de configuration actif en mémoire ; un rechargement réussi remplace cet instantané de façon atomique.
</Note>

## Modèle d’exécution

- Un processus toujours actif pour le routage, le plan de contrôle et les connexions de canaux.
- Port multiplexé unique pour :
  - contrôle/RPC WebSocket
  - API HTTP, compatibles OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - interface Control UI et hooks
- Mode de liaison par défaut : `loopback`.
- L’authentification est requise par défaut. Les configurations à secret partagé utilisent
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), et les configurations
  de proxy inverse non-loopback peuvent utiliser `gateway.auth.mode: "trusted-proxy"`.

## Points de terminaison compatibles OpenAI

La surface de compatibilité la plus utile d’OpenClaw est désormais :

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Pourquoi cet ensemble est important :

- La plupart des intégrations Open WebUI, LobeChat et LibreChat sondent d’abord `/v1/models`.
- De nombreux pipelines RAG et Memory attendent `/v1/embeddings`.
- Les clients natifs pour agents préfèrent de plus en plus `/v1/responses`.

Remarque de planification :

- `/v1/models` est orienté agent : il renvoie `openclaw`, `openclaw/default` et `openclaw/<agentId>`.
- `openclaw/default` est l’alias stable qui pointe toujours vers l’agent par défaut configuré.
- Utilisez `x-openclaw-model` lorsque vous souhaitez remplacer le fournisseur/modèle backend ; sinon, le modèle normal et la configuration d’embedding de l’agent sélectionné restent maîtres.

Tous ces points de terminaison s’exécutent sur le port principal du Gateway et utilisent la même frontière d’authentification d’opérateur de confiance que le reste de l’API HTTP du Gateway.

### Priorité du port et de la liaison

| Setting      | Ordre de résolution                                            |
| ------------ | -------------------------------------------------------------- |
| Port Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Mode de liaison    | CLI/remplacement → `gateway.bind` → `loopback`                    |

### Modes de rechargement à chaud

| `gateway.reload.mode` | Comportement                               |
| --------------------- | ------------------------------------------ |
| `off`                 | Aucun rechargement de configuration        |
| `hot`                 | Appliquer uniquement les changements sûrs à chaud |
| `restart`             | Redémarrer sur les changements exigeant un rechargement |
| `hybrid` (par défaut)    | Appliquer à chaud quand c’est sûr, redémarrer quand nécessaire |

## Ensemble de commandes opérateur

```bash
openclaw gateway status
openclaw gateway status --deep   # ajoute une analyse des services au niveau système
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` sert à la découverte supplémentaire de services (LaunchDaemons/unités système systemd/schtasks), et non à une sonde de santé RPC plus approfondie.

## Plusieurs gateways (même hôte)

La plupart des installations ne devraient exécuter qu’un seul gateway par machine. Un seul gateway peut héberger plusieurs
agents et canaux.

Vous n’avez besoin de plusieurs gateways que si vous voulez intentionnellement de l’isolation ou un bot de secours.

Vérifications utiles :

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Ce à quoi il faut s’attendre :

- `gateway status --deep` peut signaler `Other gateway-like services detected (best effort)`
  et afficher des conseils de nettoyage lorsque d’anciennes installations launchd/systemd/schtasks sont encore présentes.
- `gateway probe` peut avertir de `multiple reachable gateways` lorsque plus d’une cible
  répond.
- Si cela est intentionnel, isolez les ports, la configuration/l’état, et les racines d’espace de travail par gateway.

Liste de contrôle par instance :

- `gateway.port` unique
- `OPENCLAW_CONFIG_PATH` unique
- `OPENCLAW_STATE_DIR` unique
- `agents.defaults.workspace` unique

Exemple :

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configuration détaillée : [/gateway/multiple-gateways](/fr/gateway/multiple-gateways).

## Accès distant

Préféré : Tailscale/VPN.
Repli : tunnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Connectez ensuite les clients localement à `ws://127.0.0.1:18789`.

<Warning>
Les tunnels SSH ne contournent pas l’authentification du gateway. Pour l’authentification à secret partagé, les clients doivent toujours
envoyer `token`/`password` même via le tunnel. Pour les modes porteurs d’identité,
la requête doit toujours satisfaire ce chemin d’authentification.
</Warning>

Voir : [Gateway distant](/fr/gateway/remote), [Authentification](/fr/gateway/authentication), [Tailscale](/fr/gateway/tailscale).

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

Les libellés LaunchAgent sont `ai.openclaw.gateway` (par défaut) ou `ai.openclaw.<profile>` (profil nommé). `openclaw doctor` audite et répare les dérives de configuration du service.

  </Tab>

  <Tab title="Linux (systemd utilisateur)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Pour la persistance après déconnexion, activez le lingering :

```bash
sudo loginctl enable-linger <user>
```

Exemple manuel d’unité utilisateur lorsque vous avez besoin d’un chemin d’installation personnalisé :

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

Le démarrage géré natif sous Windows utilise une tâche planifiée nommée `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` pour les profils nommés). Si la création de la tâche planifiée
est refusée, OpenClaw revient à un lanceur du dossier Startup par utilisateur
qui pointe vers `gateway.cmd` dans le répertoire d’état.

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

## Chemin rapide du profil de développement

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Les valeurs par défaut incluent un état/une configuration isolés et un port gateway de base `19001`.

## Référence rapide du protocole (vue opérateur)

- La première trame client doit être `connect`.
- Le Gateway renvoie un instantané `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/politique).
- `hello-ok.features.methods` / `events` sont une liste de découverte conservatrice, pas
  un dump généré de toutes les routes d’assistance appelables.
- Requêtes : `req(method, params)` → `res(ok/payload|error)`.
- Les événements courants incluent `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, les événements du cycle de vie d’appairage/approbation, et `shutdown`.

Les exécutions d’agent se déroulent en deux étapes :

1. Accusé de réception immédiat accepté (`status:"accepted"`)
2. Réponse finale de terminaison (`status:"ok"|"error"`), avec événements `agent` diffusés entre les deux.

Voir la documentation complète du protocole : [Protocole Gateway](/fr/gateway/protocol).

## Vérifications opérationnelles

### Vivacité

- Ouvrir WS et envoyer `connect`.
- Attendre une réponse `hello-ok` avec instantané.

### Disponibilité

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Récupération après trou

Les événements ne sont pas rejoués. En cas de trous dans la séquence, actualisez l’état (`health`, `system-presence`) avant de continuer.

## Signatures de défaillance courantes

| Signature                                                      | Problème probable                                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Liaison non-loopback sans chemin d’authentification gateway valide                             |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflit de port                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | Configuration définie en mode distant, ou marque du mode local absente dans une configuration endommagée |
| `unauthorized` during connect                                  | Incompatibilité d’authentification entre le client et le gateway                                        |

Pour les séquences complètes de diagnostic, utilisez [Dépannage Gateway](/fr/gateway/troubleshooting).

## Garanties de sécurité

- Les clients du protocole Gateway échouent rapidement lorsque le Gateway est indisponible (pas de repli implicite vers un canal direct).
- Les premières trames invalides/non `connect` sont rejetées et la connexion est fermée.
- Un arrêt gracieux émet un événement `shutdown` avant la fermeture du socket.

---

Lié :

- [Dépannage](/fr/gateway/troubleshooting)
- [Processus en arrière-plan](/fr/gateway/background-process)
- [Configuration](/fr/gateway/configuration)
- [Health](/fr/gateway/health)
- [Doctor](/fr/gateway/doctor)
- [Authentification](/fr/gateway/authentication)

## Lié

- [Configuration](/fr/gateway/configuration)
- [Dépannage Gateway](/fr/gateway/troubleshooting)
- [Accès distant](/fr/gateway/remote)
- [Gestion des secrets](/fr/gateway/secrets)
