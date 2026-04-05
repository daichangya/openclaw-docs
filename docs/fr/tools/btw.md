---
read_when:
    - Vous voulez poser une question annexe rapide à propos de la session en cours
    - Vous implémentez ou déboguez le comportement BTW sur différents clients
summary: Questions annexes éphémères avec /btw
title: Questions annexes BTW
x-i18n:
    generated_at: "2026-04-05T12:55:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# Questions annexes BTW

`/btw` vous permet de poser une question annexe rapide sur la **session en cours** sans
transformer cette question en historique normal de conversation.

Il s'inspire du comportement `/btw` de Claude Code, mais est adapté à l'architecture
Gateway et multicanal d'OpenClaw.

## Ce que cela fait

Quand vous envoyez :

```text
/btw what changed?
```

OpenClaw :

1. capture un instantané du contexte de la session en cours,
2. exécute un appel de modèle séparé **sans outils**,
3. répond uniquement à la question annexe,
4. laisse l'exécution principale inchangée,
5. **n'écrit pas** la question ni la réponse BTW dans l'historique de session,
6. émet la réponse comme un **résultat annexe en direct** plutôt que comme un message assistant normal.

Le modèle mental important est :

- même contexte de session
- requête annexe ponctuelle séparée
- aucun appel d'outil
- aucune pollution du contexte futur
- aucune persistance de transcription

## Ce que cela ne fait pas

`/btw` **ne** :

- crée **pas** de nouvelle session durable,
- poursuit **pas** la tâche principale inachevée,
- exécute **pas** d'outils ni de boucles d'outils d'agent,
- écrit **pas** les données de question/réponse BTW dans l'historique de transcription,
- apparaît **pas** dans `chat.history`,
- survit **pas** à un rechargement.

Il est intentionnellement **éphémère**.

## Fonctionnement du contexte

BTW utilise la session en cours comme **contexte d'arrière-plan uniquement**.

Si l'exécution principale est actuellement active, OpenClaw capture un instantané de l'état
actuel des messages et inclut le prompt principal en cours d'exécution comme contexte
d'arrière-plan, tout en indiquant explicitement au modèle :

- répondre uniquement à la question annexe,
- ne pas reprendre ni terminer la tâche principale inachevée,
- ne pas émettre d'appels d'outil ni de pseudo-appels d'outil.

Cela permet de garder BTW isolé de l'exécution principale tout en lui donnant
conscience du sujet de la session.

## Modèle de distribution

BTW n'est **pas** distribué comme un message assistant normal dans la transcription.

Au niveau du protocole Gateway :

- le chat assistant normal utilise l'événement `chat`
- BTW utilise l'événement `chat.side_result`

Cette séparation est intentionnelle. Si BTW réutilisait le chemin normal de l'événement `chat`,
les clients le traiteraient comme un historique de conversation classique.

Comme BTW utilise un événement en direct séparé et n'est pas rejoué depuis
`chat.history`, il disparaît après un rechargement.

## Comportement des interfaces

### TUI

Dans le TUI, BTW est affiché en ligne dans la vue de la session en cours, mais il reste
éphémère :

- visiblement distinct d'une réponse assistant normale
- peut être masqué avec `Enter` ou `Esc`
- n'est pas rejoué au rechargement

### Canaux externes

Sur des canaux comme Telegram, WhatsApp et Discord, BTW est distribué comme une
réponse ponctuelle clairement libellée, car ces interfaces n'ont pas de concept local de
surcouche éphémère.

La réponse est toujours traitée comme un résultat annexe, et non comme un historique normal de session.

### UI de contrôle / web

La Gateway émet correctement BTW comme `chat.side_result`, et BTW n'est pas inclus
dans `chat.history`, donc le contrat de persistance est déjà correct pour le web.

L'UI de contrôle actuelle a encore besoin d'un consommateur `chat.side_result` dédié pour
afficher BTW en direct dans le navigateur. Tant que cette prise en charge côté client n'est pas disponible, BTW reste une fonctionnalité au niveau de la Gateway avec un comportement complet dans le TUI et sur les canaux externes, mais pas encore une expérience navigateur entièrement aboutie.

## Quand utiliser BTW

Utilisez `/btw` lorsque vous voulez :

- une clarification rapide sur le travail en cours,
- une réponse factuelle annexe pendant qu'une longue exécution est toujours en cours,
- une réponse temporaire qui ne doit pas faire partie du contexte futur de la session.

Exemples :

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Quand ne pas utiliser BTW

N'utilisez pas `/btw` si vous voulez que la réponse fasse partie du futur
contexte de travail de la session.

Dans ce cas, posez la question normalement dans la session principale au lieu d'utiliser BTW.

## Liens associés

- [Commandes slash](/tools/slash-commands)
- [Niveaux de réflexion](/tools/thinking)
- [Session](/fr/concepts/session)
