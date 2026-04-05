---
read_when:
    - Configurer ou déboguer le contrôle distant sur Mac
summary: Flux de l’application macOS pour contrôler une gateway OpenClaw distante via SSH
title: Contrôle à distance
x-i18n:
    generated_at: "2026-04-05T12:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 96e46e603c2275d04596b5d1ae0fb6858bd1a102a727dc13924ffcd9808fdf7e
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw distant (macOS ⇄ hôte distant)

Ce flux permet à l’application macOS d’agir comme un contrôle à distance complet pour une gateway OpenClaw exécutée sur un autre hôte (ordinateur/serveur). Il s’agit de la fonctionnalité **Remote over SSH** (exécution distante) de l’application. Toutes les fonctionnalités — vérifications d’état, transfert Voice Wake et Web Chat — réutilisent la même configuration SSH distante depuis _Settings → General_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH n’est impliqué.
- **Remote over SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’application Mac ouvre une connexion SSH avec `-o BatchMode` plus votre identité/clé choisie et un transfert de port local.
- **Remote direct (ws/wss)** : pas de tunnel SSH. L’application Mac se connecte directement à l’URL de la gateway (par exemple via Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour transférer le port de la gateway vers localhost. La gateway verra l’IP du nœud comme `127.0.0.1` car le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL de la gateway. La gateway voit l’IP réelle du client.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et compilez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est sur le PATH pour les shells non interactifs (symlink vers `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Ouvrez SSH avec authentification par clé. Nous recommandons les IP **Tailscale** pour une accessibilité stable hors LAN.

## Configuration de l’application macOS

1. Ouvrez _Settings → General_.
2. Sous **OpenClaw runs**, choisissez **Remote over SSH** puis définissez :
   - **Transport** : **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target** : `user@host` (avec `:port` facultatif).
     - Si la gateway est sur le même LAN et annonce Bonjour, choisissez-la dans la liste découverte pour remplir automatiquement ce champ.
   - **Gateway URL** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Identity file** (avancé) : chemin vers votre clé.
   - **Project root** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **CLI path** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (rempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Test remote**. Une réussite indique que `openclaw status --json` s’exécute correctement à distance. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI n’est pas trouvée à distance.
4. Les vérifications d’état et Web Chat passeront désormais automatiquement par ce tunnel SSH.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte à la gateway via le port de contrôle WebSocket transféré (par défaut 18789).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL de gateway configurée.
- Il n’y a plus de serveur HTTP WebChat séparé.

## Autorisations

- L’hôte distant a besoin des mêmes approbations TCC qu’en local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Exécutez l’onboarding sur cette machine pour les accorder une fois.
- Les nœuds annoncent leur état d’autorisation via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Remarques de sécurité

- Préférez des binds loopback sur l’hôte distant et connectez-vous via SSH ou Tailscale.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; faites d’abord confiance à la clé d’hôte pour qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez la Gateway à une interface non loopback, exigez une authentification Gateway valide : token, mot de passe, ou proxy inverse conscient de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Voir [Sécurité](/gateway/security) et [Tailscale](/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. La vérification d’état fera remonter les problèmes de liaison.

## Dépannage

- **exit 127 / not found** : `openclaw` n’est pas sur le PATH pour les shells non interactifs. Ajoutez-le à `/etc/paths`, au fichier rc de votre shell, ou créez un symlink vers `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed** : vérifiez l’accessibilité SSH, le PATH, et que Baileys est bien connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que la gateway est en cours d’exécution sur l’hôte distant et que le port transféré correspond au port WS de la gateway ; l’UI exige une connexion WS saine.
- **L’IP du nœud affiche 127.0.0.1** : c’est attendu avec le tunnel SSH. Passez **Transport** à **Direct (ws/wss)** si vous voulez que la gateway voie l’IP réelle du client.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun forwarder séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’y a plus de bascule globale de « son par défaut » dans l’application ; les appelants choisissent un son (ou aucun) pour chaque requête.
