---
read_when:
    - Déboguer la vue WebChat Mac ou le port loopback
summary: Comment l’application Mac intègre le WebChat du gateway et comment le déboguer
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-24T07:21:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

L’application de barre de menus macOS intègre l’interface WebChat comme vue SwiftUI native. Elle
se connecte au Gateway et utilise par défaut la **session principale** pour l’agent
sélectionné (avec un sélecteur de session pour les autres sessions).

- **Mode local** : se connecte directement au WebSocket du Gateway local.
- **Mode distant** : transfère le port de contrôle du Gateway via SSH et utilise ce
  tunnel comme plan de données.

## Lancement et débogage

- Manuel : menu Lobster → « Open Chat ».
- Ouverture automatique pour les tests :

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Journaux : `./scripts/clawlog.sh` (sous-système `ai.openclaw`, catégorie `WebChatSwiftUI`).

## Comment c’est câblé

- Plan de données : méthodes WS du Gateway `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` et événements `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` renvoie des lignes de transcription normalisées pour l’affichage : les balises
  de directive en ligne sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués) ainsi que les
  tokens de contrôle de modèle ASCII/pleine largeur ayant fuité sont supprimés, les lignes assistant composées uniquement
  de tokens silencieux comme exactement `NO_REPLY` / `no_reply` sont
  omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
- Session : utilise par défaut la session principale (`main`, ou `global` lorsque le périmètre est
  global). L’interface peut basculer entre les sessions.
- L’onboarding utilise une session dédiée afin de garder la configuration du premier lancement séparée.

## Surface de sécurité

- Le mode distant ne transfère via SSH que le port de contrôle WebSocket du Gateway.

## Limites connues

- L’interface est optimisée pour les sessions de chat (pas un sandbox de navigateur complet).

## Lié

- [WebChat](/fr/web/webchat)
- [Application macOS](/fr/platforms/macos)
