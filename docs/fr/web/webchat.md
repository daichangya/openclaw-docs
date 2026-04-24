---
read_when:
    - Déboguer ou configurer l’accès à WebChat
summary: Hôte statique WebChat loopback et utilisation du WS Gateway pour l’interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-24T07:40:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Statut : l’interface de chat SwiftUI macOS/iOS parle directement au WebSocket Gateway.

## Ce que c’est

- Une interface de chat native pour le gateway (sans navigateur embarqué ni serveur statique local).
- Utilise les mêmes sessions et règles de routage que les autres canaux.
- Routage déterministe : les réponses reviennent toujours vers WebChat.

## Démarrage rapide

1. Démarrez le gateway.
2. Ouvrez l’interface WebChat (app macOS/iOS) ou l’onglet chat de l’UI de contrôle.
3. Assurez-vous qu’un chemin d’authentification gateway valide est configuré (secret partagé par défaut,
   même sur loopback).

## Comment cela fonctionne (comportement)

- L’interface se connecte au WebSocket Gateway et utilise `chat.history`, `chat.send`, et `chat.inject`.
- `chat.history` est borné pour la stabilité : Gateway peut tronquer les champs de texte longs, omettre les métadonnées lourdes, et remplacer les entrées surdimensionnées par `[chat.history omitted: message too large]`.
- `chat.history` est aussi normalisé pour l’affichage : les tags de directive de livraison inline
  comme `[[reply_to_*]]` et `[[audio_as_voice]]`, les charges utiles XML d’appel d’outil en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués), ainsi que
  les jetons de contrôle du modèle divulgués en ASCII/pleine largeur sont retirés du texte visible,
  et les entrées assistant dont tout le texte visible n’est que le jeton silencieux exact
  `NO_REPLY` / `no_reply` sont omises.
- `chat.inject` ajoute directement une note d’assistant à la transcription et la diffuse à l’interface (sans exécution d’agent).
- Les exécutions interrompues peuvent conserver une sortie partielle de l’assistant visible dans l’interface.
- Gateway persiste le texte partiel interrompu de l’assistant dans l’historique de transcription lorsqu’une sortie mise en tampon existe, et marque ces entrées avec des métadonnées d’interruption.
- L’historique est toujours récupéré depuis le gateway (sans surveillance de fichier local).
- Si le gateway est inaccessible, WebChat est en lecture seule.

## Panneau des outils d’agents de l’UI de contrôle

- Le panneau Outils de `/agents` dans l’UI de contrôle comporte deux vues distinctes :
  - **Disponibles maintenant** utilise `tools.effective(sessionKey=...)` et montre ce que la session courante
    peut réellement utiliser au runtime, y compris les outils du core, des plugins, et détenus par les canaux.
  - **Configuration des outils** utilise `tools.catalog` et reste centrée sur les profils, les surcharges, et
    la sémantique du catalogue.
- La disponibilité au runtime est limitée à la session. Changer de session sur le même agent peut modifier la liste
  **Disponibles maintenant**.
- L’éditeur de configuration n’implique pas la disponibilité au runtime ; l’accès effectif continue de suivre la priorité des politiques
  (`allow`/`deny`, surcharges par agent et par fournisseur/canal).

## Utilisation à distance

- Le mode distant tunnelise le WebSocket gateway via SSH/Tailscale.
- Vous n’avez pas besoin d’exécuter un serveur WebChat séparé.

## Référence de configuration (WebChat)

Configuration complète : [Configuration](/fr/gateway/configuration)

Options WebChat :

- `gateway.webchat.chatHistoryMaxChars` : nombre maximal de caractères pour les champs de texte dans les réponses `chat.history`. Lorsqu’une entrée de transcription dépasse cette limite, Gateway tronque les champs de texte longs et peut remplacer les messages surdimensionnés par un espace réservé. Le client peut aussi envoyer `maxChars` par requête pour remplacer cette valeur par défaut pour un seul appel `chat.history`.

Options globales associées :

- `gateway.port`, `gateway.bind` : hôte/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password` :
  authentification WebSocket par secret partagé.
- `gateway.auth.allowTailscale` : l’onglet chat de l’UI de contrôle dans le navigateur peut utiliser les
  en-têtes d’identité Tailscale Serve lorsqu’ils sont activés.
- `gateway.auth.mode: "trusted-proxy"` : authentification par reverse proxy pour les clients navigateur derrière une source proxy **non-loopback** avec prise en charge de l’identité (voir [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password` : cible gateway distante.
- `session.*` : stockage de session et valeurs par défaut de clé principale.

## Articles connexes

- [UI de contrôle](/fr/web/control-ui)
- [Tableau de bord](/fr/web/dashboard)
