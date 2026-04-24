---
read_when:
    - Configurer ou déboguer le contrôle Mac à distance
summary: Flux de l’application macOS pour contrôler un Gateway OpenClaw distant via SSH
title: Contrôle à distance
x-i18n:
    generated_at: "2026-04-24T07:20:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw distant (macOS ⇄ hôte distant)

Ce flux permet à l’application macOS d’agir comme contrôle distant complet d’un gateway OpenClaw exécuté sur un autre hôte (ordinateur de bureau/serveur). Il s’agit de la fonctionnalité **Remote over SSH** (exécution distante) de l’application. Toutes les fonctionnalités — contrôles de santé, transfert Voice Wake et Web Chat — réutilisent la même configuration SSH distante depuis _Settings → General_.

## Modes

- **Local (ce Mac)** : tout s’exécute sur l’ordinateur portable. Aucun SSH impliqué.
- **Remote over SSH (par défaut)** : les commandes OpenClaw sont exécutées sur l’hôte distant. L’application Mac ouvre une connexion SSH avec `-o BatchMode` ainsi que votre identité/clé choisie et une redirection de port locale.
- **Remote direct (ws/wss)** : aucun tunnel SSH. L’application Mac se connecte directement à l’URL du gateway (par exemple via Tailscale Serve ou un proxy inverse HTTPS public).

## Transports distants

Le mode distant prend en charge deux transports :

- **Tunnel SSH** (par défaut) : utilise `ssh -N -L ...` pour rediriger le port du gateway vers localhost. Le gateway verra l’IP du nœud comme `127.0.0.1` parce que le tunnel est en loopback.
- **Direct (ws/wss)** : se connecte directement à l’URL du gateway. Le gateway voit la véritable IP cliente.

## Prérequis sur l’hôte distant

1. Installez Node + pnpm et compilez/installez la CLI OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Assurez-vous que `openclaw` est sur le PATH pour les shells non interactifs (créez un symlink dans `/usr/local/bin` ou `/opt/homebrew/bin` si nécessaire).
3. Ouvrez SSH avec authentification par clé. Nous recommandons les IP **Tailscale** pour une joignabilité stable hors LAN.

## Configuration de l’application macOS

1. Ouvrez _Settings → General_.
2. Sous **OpenClaw runs**, choisissez **Remote over SSH** et définissez :
   - **Transport** : **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target** : `user@host` (`:port` facultatif).
     - Si le gateway est sur le même LAN et annonce Bonjour, choisissez-le dans la liste découverte pour remplir automatiquement ce champ.
   - **Gateway URL** (Direct uniquement) : `wss://gateway.example.ts.net` (ou `ws://...` pour local/LAN).
   - **Identity file** (avancé) : chemin vers votre clé.
   - **Project root** (avancé) : chemin du checkout distant utilisé pour les commandes.
   - **CLI path** (avancé) : chemin facultatif vers un point d’entrée/binaire `openclaw` exécutable (prérempli automatiquement lorsqu’il est annoncé).
3. Cliquez sur **Test remote**. Un succès indique que `openclaw status --json` s’exécute correctement à distance. Les échecs signifient généralement des problèmes de PATH/CLI ; le code de sortie 127 signifie que la CLI est introuvable à distance.
4. Les contrôles de santé et Web Chat passeront maintenant automatiquement par ce tunnel SSH.

## Web Chat

- **Tunnel SSH** : Web Chat se connecte au gateway via le port de contrôle WebSocket redirigé (par défaut 18789).
- **Direct (ws/wss)** : Web Chat se connecte directement à l’URL du gateway configurée.
- Il n’existe plus de serveur HTTP WebChat séparé.

## Permissions

- L’hôte distant a besoin des mêmes autorisations TCC qu’en local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Exécutez l’onboarding sur cette machine pour les accorder une fois.
- Les nœuds annoncent leur état de permissions via `node.list` / `node.describe` afin que les agents sachent ce qui est disponible.

## Remarques de sécurité

- Préférez les liaisons loopback sur l’hôte distant et connectez-vous via SSH ou Tailscale.
- Le tunneling SSH utilise une vérification stricte de la clé d’hôte ; faites d’abord confiance à la clé d’hôte pour qu’elle existe dans `~/.ssh/known_hosts`.
- Si vous liez le Gateway à une interface non-loopback, exigez une authentification Gateway valide : jeton, mot de passe ou proxy inverse tenant compte de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- Voir [Sécurité](/fr/gateway/security) et [Tailscale](/fr/gateway/tailscale).

## Flux de connexion WhatsApp (distant)

- Exécutez `openclaw channels login --verbose` **sur l’hôte distant**. Scannez le QR avec WhatsApp sur votre téléphone.
- Relancez la connexion sur cet hôte si l’authentification expire. Le contrôle de santé fera remonter les problèmes de liaison.

## Dépannage

- **exit 127 / not found** : `openclaw` n’est pas sur le PATH pour les shells non interactifs. Ajoutez-le à `/etc/paths`, à votre fichier rc de shell, ou créez un symlink dans `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed** : vérifiez la joignabilité SSH, le PATH et que Baileys est bien connecté (`openclaw status --json`).
- **Web Chat bloqué** : confirmez que le gateway s’exécute sur l’hôte distant et que le port redirigé correspond au port WS du gateway ; l’interface exige une connexion WS saine.
- **L’IP du nœud affiche 127.0.0.1** : c’est normal avec le tunnel SSH. Passez **Transport** à **Direct (ws/wss)** si vous voulez que le gateway voie la véritable IP cliente.
- **Voice Wake** : les phrases de déclenchement sont transférées automatiquement en mode distant ; aucun forwarder séparé n’est nécessaire.

## Sons de notification

Choisissez les sons par notification depuis des scripts avec `openclaw` et `node.invoke`, par exemple :

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Il n’existe plus de bascule globale de « son par défaut » dans l’application ; les appelants choisissent un son (ou aucun) par requête.

## Associé

- [Application macOS](/fr/platforms/macos)
- [Accès distant](/fr/gateway/remote)
