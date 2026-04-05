---
read_when:
    - Débogage ou configuration de l’accès à WebChat
summary: Hôte statique WebChat en loopback et utilisation de la Gateway WS pour l’interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-05T12:58:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (interface WebSocket de la Gateway)

Statut : l’interface de chat SwiftUI macOS/iOS communique directement avec le WebSocket de la Gateway.

## Ce que c’est

- Une interface de chat native pour la gateway (sans navigateur intégré ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours vers WebChat.

## Démarrage rapide

1. Démarrez la gateway.
2. Ouvrez l’interface WebChat (application macOS/iOS) ou l’onglet de chat de l’interface de contrôle.
3. Assurez-vous qu’un chemin d’authentification valide pour la gateway est configuré (secret partagé par défaut,
   même en loopback).

## Fonctionnement (comportement)

- L’interface se connecte au WebSocket de la Gateway et utilise `chat.history`, `chat.send` et `chat.inject`.
- `chat.history` est borné pour la stabilité : la Gateway peut tronquer les champs de texte longs, omettre les métadonnées lourdes et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` est aussi normalisé pour l’affichage : les balises de directive de livraison en ligne
  comme `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML d’appel d’outil en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, ainsi que les blocs d’appel d’outil tronqués), et
  les jetons de contrôle de modèle ASCII/pleine largeur divulgués sont retirés du texte visible,
  et les entrées assistant dont tout le texte visible n’est que le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- `chat.inject` ajoute directement une note d’assistant à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie partielle de l’assistant visible dans l’interface.
- La Gateway persiste le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie en mémoire tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis la gateway (sans surveillance de fichiers locale).
- Si la gateway est inaccessible, WebChat est en lecture seule.

## Panneau Outils des agents dans l’interface de contrôle

- Le panneau Outils de `/agents` dans l’interface de contrôle comporte deux vues distinctes :
  - **Disponible maintenant** utilise `tools.effective(sessionKey=...)` et montre ce que la session actuelle
    peut réellement utiliser à l’exécution, y compris les outils principaux, de plugin et propres au canal.
  - **Configuration des outils** utilise `tools.catalog` et reste centré sur les profils, les remplacements et
    la sémantique du catalogue.
- La disponibilité à l’exécution est limitée à la session. Changer de session sur le même agent peut modifier la
  liste **Disponible maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité à l’exécution ; l’accès effectif suit toujours la priorité des politiques
  (`allow`/`deny`, remplacements par agent et par fournisseur/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket de la Gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, la Gateway tronque les champs de texte longs et peut remplacer les messages surdimensionnés par un espace réservé. Un `maxChars` par requête peut aussi être envoyé par le client pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet de chat de l’interface de contrôle du navigateur peut utiliser les en-têtes d’identité Tailscale
  Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par proxy inverse pour les clients navigateur derrière une source proxy **non-loopback** sensible à l’identité (voir [Trusted Proxy Auth](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible de gateway distante.
- `session.*` : stockage des sessions et valeurs par défaut de clé principale.
