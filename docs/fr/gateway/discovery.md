---
read_when:
    - Implémenter ou modifier la découverte/publication Bonjour
    - Ajuster les modes de connexion distants (direct vs SSH)
    - Concevoir la découverte + l’appairage des nœuds pour les nœuds distants
summary: Découverte des nœuds et transports (Bonjour, Tailscale, SSH) pour trouver la gateway
title: Découverte et transports
x-i18n:
    generated_at: "2026-04-05T12:41:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e76cca9279ca77b55e30d6e746f6325e5644134ef06b9c58f2cf3d793d092685
    source_path: gateway/discovery.md
    workflow: 15
---

# Découverte et transports

OpenClaw présente deux problèmes distincts qui se ressemblent en surface :

1. **Contrôle distant de l’opérateur** : l’application de barre de menus macOS qui contrôle une gateway exécutée ailleurs.
2. **Appairage de nœuds** : iOS/Android (et les futurs nœuds) qui trouvent une gateway et s’appairent de manière sécurisée.

L’objectif de conception est de conserver toute la découverte/publication réseau dans la **Node Gateway** (`openclaw gateway`) et de garder les clients (application Mac, iOS) comme consommateurs.

## Termes

- **Gateway** : un unique processus gateway de longue durée qui détient l’état (sessions, appairage, registre des nœuds) et exécute les canaux. La plupart des configurations en utilisent un par hôte ; des configurations multi-gateway isolées sont possibles.
- **Gateway WS (plan de contrôle)** : le point de terminaison WebSocket sur `127.0.0.1:18789` par défaut ; peut être lié au LAN/tailnet via `gateway.bind`.
- **Transport WS direct** : un point de terminaison Gateway WS exposé au LAN/tailnet (sans SSH).
- **Transport SSH (repli)** : contrôle distant via le transfert de `127.0.0.1:18789` sur SSH.
- **Pont TCP hérité (supprimé)** : ancien transport de nœud (voir
  [Protocole Bridge](/gateway/bridge-protocol)) ; il n’est plus annoncé pour la
  découverte et ne fait plus partie des builds actuels.

Détails du protocole :

- [Protocole Gateway](/gateway/protocol)
- [Protocole Bridge (hérité)](/gateway/bridge-protocol)

## Pourquoi nous conservons à la fois le mode « direct » et SSH

- **WS direct** offre la meilleure UX sur le même réseau et au sein d’un tailnet :
  - découverte automatique sur le LAN via Bonjour
  - jetons d’appairage + ACL détenus par la gateway
  - aucun accès shell requis ; la surface du protocole peut rester réduite et auditable
- **SSH** reste le repli universel :
  - fonctionne partout où vous avez un accès SSH (même à travers des réseaux sans lien)
  - résiste aux problèmes de multidiffusion/mDNS
  - ne nécessite aucun nouveau port entrant en dehors de SSH

## Entrées de découverte (comment les clients apprennent où se trouve la gateway)

### 1) Découverte Bonjour / DNS-SD

Le Bonjour en multidiffusion fonctionne au mieux et ne traverse pas les réseaux. OpenClaw peut aussi parcourir la
même balise gateway via un domaine DNS-SD large zone configuré, de sorte que la découverte peut couvrir :

- `local.` sur le même LAN
- un domaine DNS-SD unicast configuré pour une découverte inter-réseaux

Direction cible :

- La **gateway** annonce son point de terminaison WS via Bonjour.
- Les clients parcourent et affichent une liste « choisir une gateway », puis stockent le point de terminaison choisi.

Dépannage et détails de balise : [Bonjour](/gateway/bonjour).

#### Détails de la balise de service

- Types de service :
  - `_openclaw-gw._tcp` (balise de transport gateway)
- Clés TXT (non secrètes) :
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (nom d’affichage configuré par l’opérateur)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (uniquement lorsque TLS est activé)
  - `gatewayTlsSha256=<sha256>` (uniquement lorsque TLS est activé et que l’empreinte est disponible)
  - `canvasPort=<port>` (port de l’hôte canvas ; actuellement identique à `gatewayPort` lorsque l’hôte canvas est activé)
  - `tailnetDns=<magicdns>` (indice facultatif ; détecté automatiquement lorsque Tailscale est disponible)
  - `sshPort=<port>` (mode complet mDNS uniquement ; le DNS-SD large zone peut l’omettre, auquel cas les valeurs SSH par défaut restent à `22`)
  - `cliPath=<path>` (mode complet mDNS uniquement ; le DNS-SD large zone l’écrit toujours comme indice d’installation distante)

Remarques de sécurité :

- Les enregistrements TXT Bonjour/mDNS sont **non authentifiés**. Les clients doivent traiter les valeurs TXT uniquement comme des indices UX.
- Le routage (hôte/port) doit préférer le **point de terminaison de service résolu** (SRV + A/AAAA) plutôt que `lanHost`, `tailnetDns` ou `gatewayPort` fournis via TXT.
- L’épinglage TLS ne doit jamais permettre à un `gatewayTlsSha256` annoncé d’écraser une empreinte déjà stockée.
- Les nœuds iOS/Android doivent exiger une confirmation explicite « faire confiance à cette empreinte » avant de stocker une première empreinte (vérification hors bande) lorsque la route choisie est sécurisée/basée sur TLS.

Désactiver/remplacer :

- `OPENCLAW_DISABLE_BONJOUR=1` désactive la publication.
- `gateway.bind` dans `~/.openclaw/openclaw.json` contrôle le mode de liaison de Gateway.
- `OPENCLAW_SSH_PORT` remplace le port SSH annoncé lorsque `sshPort` est émis.
- `OPENCLAW_TAILNET_DNS` publie un indice `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` remplace le chemin CLI annoncé.

### 2) Tailnet (inter-réseaux)

Pour des configurations de type Londres/Vienne, Bonjour ne sera d’aucune aide. La cible « directe » recommandée est :

- le nom Tailscale MagicDNS (préféré) ou une IP tailnet stable.

Si la gateway peut détecter qu’elle s’exécute sous Tailscale, elle publie `tailnetDns` comme indice facultatif pour les clients (y compris les balises large zone).

L’application macOS préfère désormais les noms MagicDNS aux IP Tailscale brutes pour la découverte de gateway. Cela améliore la fiabilité lorsque les IP tailnet changent (par exemple après le redémarrage des nœuds ou une réattribution CGNAT), car les noms MagicDNS se résolvent automatiquement vers l’IP actuelle.

Pour l’appairage des nœuds mobiles, les indices de découverte n’assouplissent pas la sécurité du transport sur les routes tailnet/publiques :

- iOS/Android exigent toujours un chemin de première connexion tailnet/publique sécurisé (`wss://` ou Tailscale Serve/Funnel).
- Une IP tailnet brute découverte est un indice de routage, pas une autorisation d’utiliser `ws://` distant en clair.
- La connexion directe `ws://` sur LAN privé reste prise en charge.
- Si vous voulez le chemin Tailscale le plus simple pour les nœuds mobiles, utilisez Tailscale Serve afin que la découverte et le code de configuration se résolvent tous deux vers le même point de terminaison MagicDNS sécurisé.

### 3) Cible manuelle / SSH

Lorsqu’il n’y a pas de route directe (ou que le mode direct est désactivé), les clients peuvent toujours se connecter via SSH en transférant le port gateway en loopback.

Voir [Accès distant](/gateway/remote).

## Sélection du transport (politique client)

Comportement client recommandé :

1. Si un point de terminaison direct appairé est configuré et accessible, l’utiliser.
2. Sinon, si la découverte trouve une gateway sur `local.` ou sur le domaine large zone configuré, proposer en un clic le choix « Utiliser cette gateway » et l’enregistrer comme point de terminaison direct.
3. Sinon, si un DNS/IP tailnet est configuré, essayer le mode direct.
   Pour les nœuds mobiles sur des routes tailnet/publiques, direct signifie un point de terminaison sécurisé, pas un `ws://` distant en clair.
4. Sinon, revenir à SSH.

## Appairage + authentification (transport direct)

La gateway est la source de vérité pour l’admission des nœuds/clients.

- Les demandes d’appairage sont créées/approuvées/rejetées dans la gateway (voir [Appairage Gateway](/gateway/pairing)).
- La gateway applique :
  - l’authentification (jeton / paire de clés)
  - les portées/ACL (la gateway n’est pas un proxy brut vers chaque méthode)
  - les limites de débit

## Responsabilités par composant

- **Gateway** : annonce les balises de découverte, détient les décisions d’appairage et héberge le point de terminaison WS.
- **Application macOS** : vous aide à choisir une gateway, affiche les invites d’appairage et n’utilise SSH qu’en repli.
- **Nœuds iOS/Android** : parcourent Bonjour par commodité et se connectent à la Gateway WS appairée.
