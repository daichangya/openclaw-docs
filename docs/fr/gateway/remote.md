---
read_when:
    - Exécution ou dépannage de configurations gateway distantes
summary: Accès distant via tunnels SSH (Gateway WS) et tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-04-05T12:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8596fa2a7fd44117dfe92b70c9d8f28c0e16d7987adf0d0769a9eff71d5bc081
    source_path: gateway/remote.md
    workflow: 15
---

# Accès distant (SSH, tunnels et tailnets)

Ce dépôt prend en charge le mode « distant via SSH » en maintenant une seule Gateway (la principale) en cours d’exécution sur un hôte dédié (desktop/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’application macOS)** : le tunnel SSH est la solution de repli universelle.
- Pour les **nodes (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** de la Gateway (LAN/tailnet ou tunnel SSH selon le besoin).

## L’idée de base

- Le WebSocket Gateway se lie à **loopback** sur votre port configuré (18789 par défaut).
- Pour un usage distant, vous transférez ce port loopback via SSH (ou vous utilisez un tailnet/VPN et réduisez le besoin de tunnel).

## Configurations VPN/tailnet courantes (où vit l’agent)

Considérez l’**hôte Gateway** comme « l’endroit où vit l’agent ». Il possède les sessions, les profils d’authentification, les canaux et l’état.
Votre laptop/desktop (et les nodes) se connectent à cet hôte.

### 1) Gateway toujours active dans votre tailnet (VPS ou serveur domestique)

Exécutez la Gateway sur un hôte persistant et joignez-la via **Tailscale** ou SSH.

- **Meilleure UX :** conservez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’UI de contrôle.
- **Solution de repli :** conservez loopback + tunnel SSH depuis toute machine qui a besoin d’y accéder.
- **Exemples :** [exe.dev](/install/exe-dev) (VM simple) ou [Hetzner](/install/hetzner) (VPS de production).

C’est idéal lorsque votre laptop se met souvent en veille mais que vous voulez un agent toujours actif.

### 2) Le desktop domestique exécute la Gateway, le laptop sert de contrôle distant

Le laptop n’exécute **pas** l’agent. Il s’y connecte à distance :

- Utilisez le mode **Remote over SSH** de l’application macOS (Réglages → Général → « OpenClaw runs »).
- L’application ouvre et gère le tunnel, donc WebChat + les vérifications de santé « fonctionnent tout simplement ».

Runbook : [accès distant macOS](/platforms/mac/remote).

### 3) Le laptop exécute la Gateway, accès distant depuis d’autres machines

Gardez la Gateway locale mais exposez-la de manière sûre :

- Tunnel SSH vers le laptop depuis d’autres machines, ou
- Tailscale Serve pour l’UI de contrôle et Gateway en loopback uniquement.

Guide : [Tailscale](/gateway/tailscale) et [Vue d’ensemble du web](/web).

## Flux de commande (ce qui s’exécute où)

Un service gateway unique possède l’état + les canaux. Les nodes sont des périphériques.

Exemple de flux (Telegram → node) :

- Un message Telegram arrive à la **Gateway**.
- La Gateway exécute l’**agent** et décide si elle doit appeler un outil de node.
- La Gateway appelle le **node** via le WebSocket Gateway (RPC `node.*`).
- Le node renvoie le résultat ; la Gateway répond ensuite sur Telegram.

Remarques :

- **Les nodes n’exécutent pas le service gateway.** Une seule gateway devrait être exécutée par hôte sauf si vous exécutez volontairement des profils isolés (voir [Plusieurs gateways](/gateway/multiple-gateways)).
- Le « mode node » de l’application macOS n’est qu’un client node via le WebSocket Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WebSocket Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Avec le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent maintenant la gateway distante via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

Remarque : remplacez `18789` par votre `gateway.port` configuré (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Remarque : lorsque vous passez `--url`, la CLI ne revient pas aux identifiants de configuration ou d’environnement.
Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Valeurs par défaut distantes de la CLI

Vous pouvez persister une cible distante pour que les commandes CLI l’utilisent par défaut :

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Lorsque la gateway est en loopback uniquement, gardez l’URL sur `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.

## Priorité des identifiants

La résolution des identifiants Gateway suit un contrat partagé unique sur les chemins d’appel/probe/statut et sur la surveillance des approbations d’exécution Discord. L’hôte node utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) sont toujours prioritaires sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité des remplacements d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites config/env.
  - Les remplacements d’URL env (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - jeton : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la solution de repli distante ne s’applique que lorsque l’entrée locale du jeton d’authentification n’est pas définie)
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la solution de repli distante ne s’applique que lorsque l’entrée locale du mot de passe d’authentification n’est pas définie)
- Valeurs par défaut du mode distant :
  - jeton : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception de mode local de l’hôte node : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton de probe/statut distants sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans solution de repli vers le jeton local) lorsqu’elles ciblent le mode distant.
- Les remplacements d’environnement Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## UI de chat via SSH

WebChat n’utilise plus de port HTTP séparé. L’UI de chat SwiftUI se connecte directement au WebSocket Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Remote over SSH » de l’application, qui gère automatiquement le tunnel.

## Application macOS « Remote over SSH »

L’application de barre de menu macOS peut piloter la même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Runbook : [accès distant macOS](/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez la Gateway en loopback uniquement** sauf si vous êtes sûr d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (pas d’exposition publique).
- Le `ws://` en clair est réservé au loopback par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme mesure d’urgence.
- Les **liaisons hors loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback n’est pas disponible) doivent utiliser une authentification gateway : jeton, mot de passe ou reverse proxy sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client. Ils ne configurent **pas** à eux seuls l’authentification côté serveur.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` sont explicitement configurés via SecretRef et non résolus, la résolution échoue en mode fermé (pas de solution de repli distante masquant le problème).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic de l’UI de contrôle/WebSocket via des en-têtes d’identité
  lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison de l’API HTTP n’utilisent pas
  cette authentification par en-tête Tailscale et suivent à la place le mode normal
  d’authentification HTTP de la gateway. Ce flux sans jeton suppose que l’hôte gateway est digne de confiance. Définissez-le sur
  `false` si vous voulez une authentification à secret partagé partout.
- L’authentification **trusted-proxy** est réservée aux configurations de proxy sensible à l’identité hors loopback.
  Les reverse proxies loopback sur le même hôte ne satisfont pas `gateway.auth.mode: "trusted-proxy"`.
- Traitez le contrôle navigateur comme un accès opérateur : tailnet uniquement + appairage de node délibéré.

Analyse détaillée : [Sécurité](/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS se connectant à une gateway distante, la configuration persistante la plus simple utilise une entrée SSH `LocalForward` plus un LaunchAgent pour maintenir le tunnel actif entre les redémarrages et les plantages.

#### Étape 1 : ajouter la configuration SSH

Modifiez `~/.ssh/config` :

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Remplacez `<REMOTE_IP>` et `<REMOTE_USER>` par vos valeurs.

#### Étape 2 : copier la clé SSH (une seule fois)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Étape 3 : configurer le jeton gateway

Stockez le jeton dans la configuration pour qu’il persiste après les redémarrages :

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Étape 4 : créer le LaunchAgent

Enregistrez ceci sous `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Étape 5 : charger le LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Le tunnel démarrera automatiquement à l’ouverture de session, redémarrera après un plantage et maintiendra le port transféré actif.

Remarque : si vous avez un LaunchAgent `com.openclaw.ssh-tunnel` hérité d’une ancienne configuration, déchargez-le et supprimez-le.

#### Dépannage

Vérifiez si le tunnel est en cours d’exécution :

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Redémarrez le tunnel :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Arrêtez le tunnel :

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de configuration              | Ce qu’elle fait                                               |
| ------------------------------------ | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789      |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel s’il plante               |
| `RunAtLoad`                          | Démarre le tunnel lorsque le LaunchAgent est chargé à l’ouverture de session |
