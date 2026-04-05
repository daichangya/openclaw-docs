---
read_when:
    - Vous avez besoin de la vue d’ensemble de l’architecture réseau + sécurité
    - Vous déboguez l’accès local vs tailnet ou le pairage
    - Vous souhaitez la liste canonique de la documentation réseau
summary: 'Hub réseau : surfaces de passerelle, pairage, découverte et sécurité'
title: Réseau
x-i18n:
    generated_at: "2026-04-05T12:47:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a5f39d4f40ad19646d372000c85b663770eae412af91e1c175eb27b22208118
    source_path: network.md
    workflow: 15
---

# Hub réseau

Ce hub relie la documentation principale expliquant comment OpenClaw connecte, appaire et sécurise
les appareils sur localhost, le LAN et le tailnet.

## Modèle principal

La plupart des opérations passent par la passerelle (`openclaw gateway`), un processus unique de longue durée qui possède les connexions aux canaux et le plan de contrôle WebSocket.

- **Loopback d’abord** : la passerelle WS utilise par défaut `ws://127.0.0.1:18789`.
  Les liaisons non loopback nécessitent un chemin valide d’authentification de la passerelle : authentification par
  jeton/mot de passe à secret partagé, ou un déploiement `trusted-proxy`
  non loopback correctement configuré.
- **Une passerelle par hôte** est recommandé. Pour l’isolation, exécutez plusieurs passerelles avec des profils et ports isolés ([Multiple Gateways](/gateway/multiple-gateways)).
- Le **canvas host** est servi sur le même port que la passerelle (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), protégé par l’authentification de la passerelle lorsqu’il est lié au-delà de loopback.
- L’**accès distant** se fait généralement via un tunnel SSH ou un VPN Tailscale ([Remote Access](/gateway/remote)).

Références clés :

- [Architecture de la passerelle](/concepts/architecture)
- [Protocole de passerelle](/gateway/protocol)
- [Runbook de la passerelle](/gateway)
- [Surfaces web + modes de liaison](/web)

## Pairage + identité

- [Vue d’ensemble du pairage (DM + nœuds)](/channels/pairing)
- [Pairage de nœuds géré par la passerelle](/gateway/pairing)
- [CLI Devices (pairage + rotation de jeton)](/cli/devices)
- [CLI Pairing (approbations DM)](/cli/pairing)

Confiance locale :

- Les connexions directes locales loopback peuvent être auto-approuvées pour le pairage afin de garder l’expérience sur le même hôte fluide.
- OpenClaw dispose aussi d’un chemin étroit d’auto-connexion backend/conteneur local pour des flux d’assistance à secret partagé de confiance.
- Les clients tailnet et LAN, y compris les liaisons tailnet sur le même hôte, nécessitent toujours une approbation explicite de pairage.

## Découverte + transports

- [Découverte et transports](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [Accès distant (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Nœuds + transports

- [Vue d’ensemble des nœuds](/nodes)
- [Protocole de bridge (nœuds hérités, historique)](/gateway/bridge-protocol)
- [Runbook de nœud : iOS](/platforms/ios)
- [Runbook de nœud : Android](/platforms/android)

## Sécurité

- [Vue d’ensemble de la sécurité](/gateway/security)
- [Référence de configuration de la passerelle](/gateway/configuration)
- [Dépannage](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
