---
read_when:
    - Vous avez besoin d’une vue d’ensemble de l’architecture réseau et de la sécurité
    - Vous déboguez l’accès local vs tailnet ou le pairing
    - Vous voulez la liste canonique de la documentation réseau
summary: 'Hub réseau : surfaces du gateway, pairing, découverte et sécurité'
title: Réseau
x-i18n:
    generated_at: "2026-04-24T07:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# Hub réseau

Ce hub renvoie vers la documentation centrale sur la façon dont OpenClaw connecte, appaire et sécurise
les appareils à travers localhost, le LAN et le tailnet.

## Modèle central

La plupart des opérations passent par le Gateway (`openclaw gateway`), un unique processus de longue durée qui possède les connexions de canal et le plan de contrôle WebSocket.

- **Loopback d’abord** : le WS Gateway est par défaut sur `ws://127.0.0.1:18789`.
  Les liaisons non loopback nécessitent un chemin valide d’authentification gateway : authentification à secret partagé
  par token/mot de passe, ou déploiement `trusted-proxy`
  non loopback correctement configuré.
- **Un Gateway par hôte** est recommandé. Pour l’isolation, exécutez plusieurs gateways avec des profils et des ports isolés ([Plusieurs Gateways](/fr/gateway/multiple-gateways)).
- **L’hôte canvas** est servi sur le même port que le Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protégé par l’authentification Gateway lorsqu’il est lié au-delà de loopback.
- **L’accès distant** se fait généralement via tunnel SSH ou VPN Tailscale ([Accès distant](/fr/gateway/remote)).

Références clés :

- [Architecture du Gateway](/fr/concepts/architecture)
- [Protocole Gateway](/fr/gateway/protocol)
- [Guide d’exploitation du Gateway](/fr/gateway)
- [Surfaces web + modes de liaison](/fr/web)

## Pairing + identité

- [Vue d’ensemble du pairing (DM + nodes)](/fr/channels/pairing)
- [Pairing node détenu par le Gateway](/fr/gateway/pairing)
- [CLI devices (pairing + rotation de jetons)](/fr/cli/devices)
- [CLI pairing (approbations DM)](/fr/cli/pairing)

Confiance locale :

- Les connexions loopback locales directes peuvent être auto-approuvées pour le pairing afin de garder
  une UX fluide sur le même hôte.
- OpenClaw dispose aussi d’un chemin étroit d’auto-connexion backend/conteneur-local pour
  des flux helper à secret partagé de confiance.
- Les clients tailnet et LAN, y compris les liaisons tailnet sur le même hôte, nécessitent toujours
  une approbation explicite du pairing.

## Découverte + transports

- [Découverte et transports](/fr/gateway/discovery)
- [Bonjour / mDNS](/fr/gateway/bonjour)
- [Accès distant (SSH)](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)

## Nodes + transports

- [Vue d’ensemble des nodes](/fr/nodes)
- [Protocole Bridge (nodes hérités, historique)](/fr/gateway/bridge-protocol)
- [Guide d’exploitation node : iOS](/fr/platforms/ios)
- [Guide d’exploitation node : Android](/fr/platforms/android)

## Sécurité

- [Vue d’ensemble de la sécurité](/fr/gateway/security)
- [Référence de configuration du Gateway](/fr/gateway/configuration)
- [Dépannage](/fr/gateway/troubleshooting)
- [Doctor](/fr/gateway/doctor)

## Articles connexes

- [Modèle réseau du Gateway](/fr/gateway/network-model)
- [Accès distant](/fr/gateway/remote)
