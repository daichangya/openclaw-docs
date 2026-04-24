---
read_when:
    - Vous souhaitez une vue concise du modèle réseau du Gateway
summary: Comment le Gateway, les nœuds et l’hôte canvas se connectent.
title: Modèle réseau
x-i18n:
    generated_at: "2026-04-24T07:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> Ce contenu a été fusionné dans [Network](/fr/network#core-model). Consultez cette page pour le guide actuel.

La plupart des opérations passent par le Gateway (`openclaw gateway`), un unique processus
de longue durée qui possède les connexions aux canaux et le plan de contrôle WebSocket.

## Règles de base

- Un Gateway par hôte est recommandé. C’est le seul processus autorisé à posséder la session WhatsApp Web. Pour des bots de secours ou une isolation stricte, exécutez plusieurs gateways avec des profils et ports isolés. Voir [Plusieurs gateways](/fr/gateway/multiple-gateways).
- local loopback d’abord : le WS du Gateway vaut par défaut `ws://127.0.0.1:18789`. L’assistant crée par défaut une authentification par secret partagé et génère généralement un jeton, même pour local loopback. Pour un accès hors loopback, utilisez un chemin d’authentification Gateway valide : authentification par jeton/mot de passe à secret partagé, ou déploiement `trusted-proxy` hors loopback correctement configuré. Les configurations tailnet/mobile fonctionnent généralement mieux via Tailscale Serve ou un autre point de terminaison `wss://` plutôt qu’avec un `ws://` tailnet brut.
- Les nœuds se connectent au WS du Gateway sur LAN, tailnet ou SSH selon les besoins. L’ancien pont TCP a été supprimé.
- L’hôte canvas est servi par le serveur HTTP du Gateway sur le **même port** que le Gateway (par défaut `18789`) :
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Lorsque `gateway.auth` est configuré et que le Gateway se lie au-delà de loopback, ces routes sont protégées par l’authentification Gateway. Les clients nœud utilisent des URL à portée nœud liées à leur session WS active. Voir [Configuration du Gateway](/fr/gateway/configuration) (`canvasHost`, `gateway`).
- L’usage distant passe généralement par un tunnel SSH ou un VPN tailnet. Voir [Accès distant](/fr/gateway/remote) et [Discovery](/fr/gateway/discovery).

## Associé

- [Accès distant](/fr/gateway/remote)
- [Authentification trusted proxy](/fr/gateway/trusted-proxy-auth)
- [Protocole Gateway](/fr/gateway/protocol)
