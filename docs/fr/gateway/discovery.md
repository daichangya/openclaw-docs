---
read_when:
    - Implémentation ou modification de la découverte/publication Bonjour
    - Ajustement des modes de connexion distante (directe vs SSH)
    - Conception de la découverte et de l’appairage des Node pour les Node distants
summary: Découverte et transports des Node (Bonjour, Tailscale, SSH) pour trouver le gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-04-24T07:10:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 684e5aeb1f74a90bf8689f8b25830be2c9e497fcdeda390d98f204d7cb4134b8
    source_path: gateway/discovery.md
    workflow: 15
---

# Découverte et transports

OpenClaw présente deux problèmes distincts qui se ressemblent en surface :

1. **Contrôle distant opérateur** : l’app de barre de menu macOS contrôle un gateway exécuté ailleurs.
2. **Appairage des Node** : iOS/Android (et futurs Node) trouvent un gateway et s’appairent de manière sécurisée.

L’objectif de conception est de conserver toute la découverte/publication réseau dans le **Node Gateway** (`openclaw gateway`) et de garder les clients (app Mac, iOS) comme consommateurs.

## Termes

- **Gateway** : un processus gateway unique de longue durée qui possède l’état (sessions, appairage, registre des Node) et exécute les canaux. La plupart des configurations en utilisent un par hôte ; des configurations multi-gateway isolées sont possibles.
- **Gateway WS (plan de contrôle)** : le point de terminaison WebSocket sur `127.0.0.1:18789` par défaut ; peut être lié au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : un point de terminaison Gateway WS exposé au LAN/tailnet (sans SSH).
- **Transport SSH (repli)** : contrôle distant en transférant `127.0.0.1:18789` via SSH.
- **Pont TCP hérité (supprimé)** : ancien transport de Node (voir
  [Protocole Bridge](/fr/gateway/bridge-protocol)) ; n’est plus annoncé pour la
  découverte et ne fait plus partie des builds actuelles.

Détails du protocole :

- [Protocole Gateway](/fr/gateway/protocol)
- [Protocole Bridge (hérité)](/fr/gateway/bridge-protocol)

## Pourquoi nous conservons à la fois le mode « direct » et SSH

- **WS direct** offre la meilleure expérience sur le même réseau et dans un tailnet :
  - découverte automatique sur le LAN via Bonjour
  - jetons d’appairage + ACL possédés par le gateway
  - aucun accès shell requis ; la surface du protocole peut rester étroite et auditable
- **SSH** reste le repli universel :
  - fonctionne partout où vous avez un accès SSH (même à travers des réseaux sans lien)
  - résiste aux problèmes de multicast/mDNS
  - ne nécessite aucun nouveau port entrant autre que SSH

## Entrées de découverte (comment les clients apprennent où se trouve le gateway)

### 1) Découverte Bonjour / DNS-SD

Bonjour multicast fonctionne en mode best-effort et ne traverse pas les réseaux. OpenClaw peut aussi parcourir la
même balise gateway via un domaine DNS-SD étendu configuré, de sorte que la découverte peut couvrir :

- `local.` sur le même LAN
- un domaine DNS-SD unicast configuré pour la découverte inter-réseaux

Direction de la cible :

- Le **gateway** annonce son point de terminaison WS via Bonjour.
- Les clients parcourent et affichent une liste « choisir un gateway », puis stockent le point de terminaison choisi.

Dépannage et détails de la balise : [Bonjour](/fr/gateway/bonjour).

#### Détails de la balise de service

- Types de service :
  - `_openclaw-gw._tcp` (balise de transport gateway)
- Clés TXT (non secrètes) :
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<nom convivial>` (nom d’affichage configuré par l’opérateur)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (uniquement lorsque TLS est activé)
  - `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
  - `canvasPort=<port>` (port de l’hôte canvas ; actuellement identique à `gatewayPort` lorsque l’hôte canvas est activé)
  - `tailnetDns=<magicdns>` (indication facultative ; détectée automatiquement lorsque Tailscale est disponible)
  - `sshPort=<port>` (mode mDNS complet uniquement ; le DNS-SD étendu peut l’omettre, auquel cas les valeurs par défaut SSH restent à `22`)
  - `cliPath=<path>` (mode mDNS complet uniquement ; le DNS-SD étendu l’écrit toujours comme indication d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients doivent traiter les valeurs TXT uniquement comme des indications d’expérience utilisateur.
- Le routage (hôte/port) doit préférer le **point de terminaison de service résolu** (SRV + A/AAAA) aux valeurs `lanHost`, `tailnetDns` ou `gatewayPort` fournies via TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé de remplacer une empreinte déjà stockée.
- Les Node iOS/Android doivent exiger une confirmation explicite « faire confiance à cette empreinte » avant de stocker une première empreinte (vérification hors bande) chaque fois que la route choisie est sécurisée/basée sur TLS.

Désactivation/remplacement :

- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publication.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison du Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé lorsque `sshPort` est émis.
- `OPENCLAW_TAILNET_DNS` publie une indication `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé.

### 2) Tailnet (inter-réseaux)

Pour des configurations de type Londres/Vienne, Bonjour n’aidera pas. La cible « directe » recommandée est :

- le nom MagicDNS Tailscale (préféré) ou une IP tailnet stable.

Si le gateway peut détecter qu’il s’exécute sous Tailscale, il publie `tailnetDns` comme indication facultative pour les clients (y compris les balises étendues).

L’app macOS préfère désormais les noms MagicDNS aux IP Tailscale brutes pour la découverte du gateway. Cela améliore la fiabilité lorsque les IP tailnet changent (par exemple après un redémarrage de Node ou une réattribution CGNAT), car les noms MagicDNS se résolvent automatiquement vers l’IP actuelle.

Pour l’appairage de Node mobiles, les indications de découverte n’assouplissent pas la sécurité du transport sur les routes tailnet/publiques :

- iOS/Android exigent toujours un premier chemin de connexion tailnet/public sécurisé (`wss://` ou Tailscale Serve/Funnel).
- Une IP tailnet brute découverte est une indication de routage, pas une permission d’utiliser un `ws://` distant en clair.
- La connexion directe `ws://` sur LAN privé reste prise en charge.
- Si vous voulez le chemin Tailscale le plus simple pour les Node mobiles, utilisez Tailscale Serve afin que la découverte et le code de configuration se résolvent tous deux vers le même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

Lorsqu’il n’y a pas de route directe (ou que le mode direct est désactivé), les clients peuvent toujours se connecter via SSH en transférant le port loopback du gateway.

Voir [Accès distant](/fr/gateway/remote).

## Sélection du transport (politique client)

Comportement client recommandé :

1. Si un point de terminaison direct appairé est configuré et accessible, l’utiliser.
2. Sinon, si la découverte trouve un gateway sur `local.` ou sur le domaine étendu configuré, proposer un choix en un clic « Utiliser ce gateway » et l’enregistrer comme point de terminaison direct.
3. Sinon, si un DNS/IP tailnet est configuré, tenter le mode direct.
   Pour les Node mobiles sur routes tailnet/publiques, direct signifie un point de terminaison sécurisé, pas un `ws://` distant en clair.
4. Sinon, se replier sur SSH.

## Appairage + authentification (transport direct)

Le gateway est la source de vérité pour l’admission des Node/clients.

- Les demandes d’appairage sont créées/approuvées/rejetées dans le gateway (voir [Appairage Gateway](/fr/gateway/pairing)).
- Le gateway applique :
  - l’authentification (jeton / paire de clés)
  - les scopes/ACL (le gateway n’est pas un proxy brut vers toutes les méthodes)
  - les limites de débit

## Responsabilités par composant

- **Gateway** : annonce les balises de découverte, possède les décisions d’appairage et héberge le point de terminaison WS.
- **App macOS** : vous aide à choisir un gateway, affiche les invites d’appairage et n’utilise SSH qu’en repli.
- **Node iOS/Android** : parcourent Bonjour par commodité et se connectent au Gateway WS appairé.

## Lié

- [Accès distant](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
- [Découverte Bonjour](/fr/gateway/bonjour)
