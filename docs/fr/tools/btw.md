---
read_when:
    - Vous souhaitez poser une question annexe rapide à propos de la session en cours
    - Vous implémentez ou déboguez le comportement BTW sur différents clients
summary: Questions annexes éphémères avec `/btw`
title: Questions annexes BTW
x-i18n:
    generated_at: "2026-04-24T07:35:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` vous permet de poser une question annexe rapide à propos de la **session en cours** sans
transformer cette question en historique normal de conversation.

Son comportement s’inspire de `/btw` dans Claude Code, mais est adapté à l’architecture Gateway et multi-canaux d’OpenClaw.

## Ce que cela fait

Quand vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. prend un instantané du contexte de la session en cours,
2. exécute un appel de modèle séparé **sans outils**,
3. répond uniquement à la question annexe,
4. laisse l’exécution principale intacte,
5. **n’écrit pas** la question ni la réponse BTW dans l’historique de session,
6. émet la réponse comme un **résultat annexe en direct** plutôt que comme un message assistant normal.

Le modèle mental important est :

- même contexte de session
- requête annexe séparée et ponctuelle
- aucun appel d’outil
- aucune pollution du contexte futur
- aucune persistance dans la transcription

## Ce que cela ne fait pas

`/btw` **ne** :

- crée **pas** une nouvelle session durable,
- ne poursuit **pas** la tâche principale inachevée,
- n’exécute **pas** d’outils ni de boucles d’outil d’agent,
- n’écrit **pas** les données question/réponse BTW dans l’historique de transcription,
- n’apparaît **pas** dans `chat.history`,
- ne survit **pas** à un rechargement.

C’est intentionnellement **éphémère**.

## Comment fonctionne le contexte

BTW utilise la session en cours comme **contexte d’arrière-plan uniquement**.

Si l’exécution principale est actuellement active, OpenClaw prend un instantané de l’état courant
des messages et inclut le prompt principal en cours d’exécution comme contexte d’arrière-plan, tout
en indiquant explicitement au modèle :

- répondre uniquement à la question annexe,
- ne pas reprendre ni terminer la tâche principale inachevée,
- ne pas émettre d’appels d’outil ni de pseudo-appels d’outil.

Cela garde BTW isolé de l’exécution principale tout en le rendant conscient du
sujet de la session.

## Modèle de livraison

BTW n’est **pas** livré comme un message normal de transcription assistant.

Au niveau du protocole Gateway :

- le chat assistant normal utilise l’événement `chat`
- BTW utilise l’événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin normal de l’événement `chat`,
les clients le traiteraient comme un historique de conversation ordinaire.

Comme BTW utilise un événement direct distinct et n’est pas rejoué depuis
`chat.history`, il disparaît après rechargement.

## Comportement selon la surface

### TUI

Dans le TUI, BTW est rendu inline dans la vue de session en cours, mais reste
éphémère :

- visiblement distinct d’une réponse assistant normale
- supprimable avec `Enter` ou `Esc`
- non rejoué au rechargement

### Canaux externes

Sur des canaux comme Telegram, WhatsApp et Discord, BTW est livré comme une
réponse ponctuelle clairement étiquetée, car ces surfaces n’ont pas de
concept local de superposition éphémère.

La réponse est toujours traitée comme un résultat annexe, pas comme un historique normal de session.

### Control UI / web

Le Gateway émet BTW correctement sous forme de `chat.side_result`, et BTW n’est pas inclus
dans `chat.history`, donc le contrat de persistance est déjà correct pour le web.

L’interface de contrôle actuelle a encore besoin d’un consommateur dédié `chat.side_result` pour
rendre BTW en direct dans le navigateur. Tant que cette prise en charge côté client n’est pas disponible, BTW est une fonctionnalité au niveau Gateway avec un comportement complet dans le TUI et sur les canaux externes, mais pas encore une UX navigateur complète.

## Quand utiliser BTW

Utilisez `/btw` lorsque vous voulez :

- une clarification rapide sur le travail en cours,
- une réponse factuelle annexe pendant qu’une longue exécution est toujours en cours,
- une réponse temporaire qui ne doit pas faire partie du futur contexte de session.

Exemples :

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quand ne pas utiliser BTW

N’utilisez pas `/btw` lorsque vous voulez que la réponse fasse partie du
contexte de travail futur de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu d’utiliser BTW.

## Lié

- [Commandes slash](/fr/tools/slash-commands)
- [Niveaux de réflexion](/fr/tools/thinking)
- [Session](/fr/concepts/session)
