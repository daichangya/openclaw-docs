---
read_when:
    - Débogage de la vue WebChat Mac ou du port loopback
summary: Comment l’app Mac intègre Gateway WebChat et comment le déboguer
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-04-05T12:48:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2c45fa5512cc9c5d3b3aa188d94e2e5a90e4bcce607d959d40bea8b17c90c5
    source_path: platforms/mac/webchat.md
    workflow: 15
---

# WebChat (application macOS)

L’application de barre de menus macOS intègre l’interface WebChat comme vue SwiftUI native. Elle
se connecte à la Gateway et utilise par défaut la **session principale** pour l’agent
sélectionné (avec un sélecteur de session pour les autres sessions).

- **Mode local** : se connecte directement au WebSocket Gateway local.
- **Mode distant** : transfère le port de contrôle Gateway via SSH et utilise ce
  tunnel comme plan de données.

## Lancement et débogage

- Manuel : menu Lobster → « Open Chat ».
- Ouverture automatique pour les tests :

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- Journaux : `./scripts/clawlog.sh` (sous-système `ai.openclaw`, catégorie `WebChatSwiftUI`).

## Comment c’est câblé

- Plan de données : méthodes Gateway WS `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` et événements `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` renvoie des lignes de transcription normalisées pour l’affichage : les balises de directives inline sont supprimées du texte visible, les charges utiles XML d’appel d’outil en texte brut
  (y compris `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, et les blocs d’appel d’outil tronqués) ainsi que les jetons de contrôle du modèle en ASCII/pleine largeur qui ont fuité sont supprimés, les lignes assistant composées uniquement de jetons silencieux comme `NO_REPLY` / `no_reply` exacts sont
  omises, et les lignes surdimensionnées peuvent être remplacées par des espaces réservés.
- Session : utilise par défaut la session primaire (`main`, ou `global` lorsque la portée est
  globale). L’interface peut basculer entre les sessions.
- L’onboarding utilise une session dédiée pour garder la configuration du premier lancement séparée.

## Surface de sécurité

- Le mode distant ne transfère via SSH que le port de contrôle WebSocket Gateway.

## Limitations connues

- L’interface est optimisée pour les sessions de chat (pas pour un sandbox navigateur complet).
