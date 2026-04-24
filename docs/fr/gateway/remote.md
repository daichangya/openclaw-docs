---
read_when:
    - Exécution ou dépannage des configurations gateway distantes
summary: Accès distant via tunnels SSH (Gateway WS) et tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-04-24T07:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# Accès distant (SSH, tunnels et tailnets)

Ce dépôt prend en charge le mode « distant via SSH » en maintenant un seul Gateway (le maître) en cours d’exécution sur un hôte dédié (ordinateur de bureau/serveur) et en connectant les clients à celui-ci.

- Pour les **opérateurs (vous / l’app macOS)** : le tunnel SSH est le repli universel.
- Pour les **Node (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée centrale

- Le WebSocket Gateway est lié au **loopback** sur votre port configuré (par défaut `18789`).
- Pour une utilisation à distance, vous transférez ce port loopback via SSH (ou utilisez un tailnet/VPN et réduisez le besoin de tunnel).

## Configurations VPN/tailnet courantes (où vit l’agent)

Considérez l’**hôte Gateway** comme « l’endroit où vit l’agent ». Il possède les sessions, profils d’authentification, canaux et l’état.
Votre ordinateur portable/de bureau (et les Node) se connectent à cet hôte.

### 1) Gateway toujours actif dans votre tailnet (VPS ou serveur domestique)

Exécutez le Gateway sur un hôte persistant et atteignez-le via **Tailscale** ou SSH.

- **Meilleure expérience :** gardez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface Control UI.
- **Repli :** gardez loopback + tunnel SSH depuis n’importe quelle machine qui a besoin d’accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production).

C’est idéal lorsque votre ordinateur portable se met souvent en veille mais que vous voulez un agent toujours actif.

### 2) L’ordinateur de bureau à domicile exécute le Gateway, l’ordinateur portable sert de contrôle distant

L’ordinateur portable **n’exécute pas** l’agent. Il se connecte à distance :

- Utilisez le mode **Remote over SSH** de l’app macOS (Réglages → Général → « OpenClaw runs »).
- L’app ouvre et gère le tunnel, donc WebChat + vérifications de santé « fonctionnent simplement ».

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

### 3) L’ordinateur portable exécute le Gateway, accès distant depuis d’autres machines

Gardez le Gateway en local mais exposez-le en toute sécurité :

- Tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- Control UI via Tailscale Serve et Gateway limité au loopback.

Guide : [Tailscale](/fr/gateway/tailscale) et [Aperçu Web](/fr/web).

## Flux de commandes (ce qui s’exécute où)

Un seul service gateway possède l’état + les canaux. Les Node sont des périphériques.

Exemple de flux (Telegram → Node) :

- Un message Telegram arrive au **Gateway**.
- Le Gateway exécute l’**agent** et décide s’il doit appeler un outil de Node.
- Le Gateway appelle le **Node** via le WebSocket Gateway (`node.*` RPC).
- Le Node renvoie le résultat ; le Gateway répond ensuite sur Telegram.

Remarques :

- **Les Node n’exécutent pas le service gateway.** Un seul gateway doit s’exécuter par hôte sauf si vous exécutez volontairement des profils isolés (voir [Plusieurs gateways](/fr/gateway/multiple-gateways)).
- Le « mode node » de l’app macOS n’est qu’un client Node via le WebSocket Gateway.

## Tunnel SSH (CLI + outils)

Créer un tunnel local vers le WS du Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Avec le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent désormais le gateway distant via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

Remarque : remplacez `18789` par votre `gateway.port` configuré (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Remarque : lorsque vous passez `--url`, la CLI ne retombe pas sur les identifiants de configuration ou d’environnement.
Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Valeurs par défaut distantes de la CLI

Vous pouvez persister une cible distante afin que les commandes CLI l’utilisent par défaut :

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

Lorsque le gateway est limité au loopback, gardez l’URL à `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.

## Priorité des identifiants

La résolution des identifiants Gateway suit un contrat partagé unique entre les chemins call/probe/status et la surveillance Discord des approbations d’exécution. Node-host utilise le même contrat de base avec une exception en mode local (il ignore volontairement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) sont toujours prioritaires sur les chemins d’appel qui acceptent une auth explicite.
- Sécurité des remplacements d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de config/env.
  - Les remplacements d’URL par variable d’environnement (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants d’environnement (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - jeton : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant s’applique uniquement lorsque l’entrée du jeton d’auth local n’est pas définie)
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant s’applique uniquement lorsque l’entrée du mot de passe d’auth local n’est pas définie)
- Valeurs par défaut du mode distant :
  - jeton : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception du mode local de Node-host : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton de probe/status distants sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans repli sur le jeton local) lors du ciblage du mode distant.
- Les remplacements d’environnement du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Interface de chat via SSH

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Remote over SSH » de l’app, qui gère automatiquement le tunnel.

## App macOS « Remote over SSH »

L’app de barre de menu macOS peut piloter cette même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway limité au loopback** sauf si vous êtes certain d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (aucune exposition publique).
- Le `ws://` en clair est limité au loopback par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme
  solution d’urgence. Il n’existe pas d’équivalent dans `openclaw.json` ; cela doit être une variable
  d’environnement du processus client qui établit la connexion WebSocket.
- Les **liaisons non loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback est indisponible) doivent utiliser une authentification gateway : jeton, mot de passe, ou proxy inverse compatible identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants côté client. Ils ne configurent **pas** à eux seuls l’authentification du serveur.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fail-closed (aucun masquage par repli distant).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic Control UI/WebSocket via des en-têtes d’identité
  lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas cette authentification par en-tête Tailscale et suivent à la place le mode d’authentification HTTP normal du gateway. Ce flux sans jeton suppose que l’hôte gateway est fiable. Définissez la valeur sur
  `false` si vous voulez une authentification à secret partagé partout.
- L’authentification **trusted-proxy** est réservée aux configurations non loopback avec proxy compatible identité.
  Les proxys inverses loopback sur le même hôte ne satisfont pas `gateway.auth.mode: "trusted-proxy"`.
- Traitez le contrôle navigateur comme un accès opérateur : tailnet uniquement + appairage délibéré des Node.

Approfondissement : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS qui se connectent à un gateway distant, la configuration persistante la plus simple utilise une entrée de configuration SSH `LocalForward` plus un LaunchAgent pour maintenir le tunnel actif à travers les redémarrages et les plantages.

#### Étape 1 : ajouter la configuration SSH

Modifiez `~/.ssh/config` :

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Remplacez `<REMOTE_IP>` et `<REMOTE_USER>` par vos valeurs.

#### Étape 2 : copier la clé SSH (une seule fois)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Étape 3 : configurer le jeton du gateway

Stockez le jeton dans la configuration afin qu’il persiste après les redémarrages :

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Étape 4 : créer le LaunchAgent

Enregistrez ceci sous `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` :

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

#### Étape 5 : charger le LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Le tunnel démarrera automatiquement à la connexion, redémarrera en cas de plantage et gardera le port transféré actif.

Remarque : si vous avez un ancien LaunchAgent `com.openclaw.ssh-tunnel` d’une ancienne configuration, déchargez-le et supprimez-le.

#### Dépannage

Vérifier si le tunnel est en cours d’exécution :

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Redémarrer le tunnel :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Arrêter le tunnel :

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de configuration                         | Ce qu’elle fait                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789               |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel en cas de plantage              |
| `RunAtLoad`                          | Démarre le tunnel lorsque le LaunchAgent est chargé à la connexion        |

## Lié

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration de gateway distant](/fr/gateway/remote-gateway-readme)
