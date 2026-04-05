---
read_when:
    - Vous voulez une vue concise du modèle réseau de la Gateway
summary: Comment la Gateway, les nœuds et l’hôte canvas se connectent.
title: Modèle réseau
x-i18n:
    generated_at: "2026-04-05T12:42:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d02d87f38ee5a9fae228f5028892b192c50b473ab4441bbe0b40ee85a1dd402
    source_path: gateway/network-model.md
    workflow: 15
---

# Modèle réseau

> Ce contenu a été fusionné dans [Network](/network#core-model). Consultez cette page pour le guide à jour.

La plupart des opérations passent par la Gateway (`openclaw gateway`), un unique
processus de longue durée qui possède les connexions de canal et le plan de contrôle WebSocket.

## Règles de base

- Une Gateway par hôte est recommandée. C’est le seul processus autorisé à posséder la session WhatsApp Web. Pour des bots de secours ou une isolation stricte, exécutez plusieurs gateways avec des profils et des ports isolés. Voir [Multiple gateways](/gateway/multiple-gateways).
- Priorité au loopback : le WS de la Gateway utilise par défaut `ws://127.0.0.1:18789`. L’assistant crée une authentification par secret partagé par défaut et génère généralement un jeton, même pour loopback. Pour un accès hors loopback, utilisez un chemin d’authentification gateway valide : authentification par jeton/mot de passe à secret partagé, ou déploiement `trusted-proxy` hors loopback correctement configuré. Les configurations tailnet/mobile fonctionnent généralement mieux via Tailscale Serve ou un autre point de terminaison `wss://` plutôt que du `ws://` tailnet brut.
- Les nœuds se connectent au WS de la Gateway via le LAN, le tailnet ou SSH selon les besoins. L’ancien pont TCP a été supprimé.
- L’hôte canvas est servi par le serveur HTTP de la Gateway sur le **même port** que la Gateway (par défaut `18789`) :
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Lorsque `gateway.auth` est configuré et que la Gateway se lie au-delà de loopback, ces routes sont protégées par l’authentification Gateway. Les clients de nœud utilisent des URLs de capacité à portée nœud liées à leur session WS active. Voir [Gateway configuration](/gateway/configuration) (`canvasHost`, `gateway`).
- L’utilisation distante se fait généralement via un tunnel SSH ou un VPN tailnet. Voir [Remote access](/gateway/remote) et [Discovery](/gateway/discovery).
