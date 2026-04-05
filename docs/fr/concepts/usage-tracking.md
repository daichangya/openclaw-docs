---
read_when:
    - Vous configurez les surfaces d'utilisation/quota des fournisseurs
    - Vous devez expliquer le comportement du suivi d'utilisation ou les exigences d'authentification
summary: Surfaces de suivi d'utilisation et exigences d'identifiants
title: Suivi d'utilisation
x-i18n:
    generated_at: "2026-04-05T12:41:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62164492c61a8d602e3b73879c13ce3e14ce35964b7f2ffd389a4e6a7ec7e9c0
    source_path: concepts/usage-tracking.md
    workflow: 15
---

# Suivi d'utilisation

## Ce que c'est

- Récupère directement l'utilisation/le quota du fournisseur depuis ses points de terminaison d'utilisation.
- Aucun coût estimé ; uniquement les fenêtres rapportées par le fournisseur.
- La sortie d'état lisible par un humain est normalisée en `X% left`, même lorsqu'une
  API amont rapporte le quota consommé, le quota restant, ou uniquement des comptes bruts.
- `/status` et `session_status` au niveau session peuvent revenir à la dernière
  entrée d'utilisation de transcription lorsque l'instantané de session en direct est incomplet. Ce
  repli remplit les compteurs de jetons/cache manquants, peut récupérer le libellé du modèle
  de runtime actif, et privilégie le total orienté prompt le plus grand lorsque les
  métadonnées de session sont absentes ou plus petites. Les valeurs en direct non nulles existantes restent prioritaires.

## Où cela apparaît

- `/status` dans les chats : carte d'état riche en emojis avec jetons de session + coût estimé (clé API uniquement). L'utilisation du fournisseur s'affiche pour le **fournisseur du modèle actuel** lorsqu'elle est disponible, sous forme de fenêtre normalisée `X% left`.
- `/usage off|tokens|full` dans les chats : pied de page d'utilisation par réponse (OAuth n'affiche que les jetons).
- `/usage cost` dans les chats : résumé local des coûts agrégé à partir des journaux de session OpenClaw.
- CLI : `openclaw status --usage` affiche une ventilation complète par fournisseur.
- CLI : `openclaw channels list` affiche le même instantané d'utilisation à côté de la configuration du fournisseur (utilisez `--no-usage` pour l'ignorer).
- Barre de menus macOS : section « Usage » sous Context (uniquement si disponible).

## Fournisseurs + identifiants

- **Anthropic (Claude)** : jetons OAuth dans les profils d'authentification.
- **GitHub Copilot** : jetons OAuth dans les profils d'authentification.
- **Gemini CLI** : jetons OAuth dans les profils d'authentification.
  - L'utilisation JSON revient à `stats` ; `stats.cached` est normalisé en
    `cacheRead`.
- **OpenAI Codex** : jetons OAuth dans les profils d'authentification (`accountId` est utilisé lorsqu'il est présent).
- **MiniMax** : clé API ou profil d'authentification OAuth MiniMax. OpenClaw traite
  `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota
  MiniMax, privilégie l'OAuth MiniMax stocké lorsqu'il est présent, et revient sinon
  à `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax signifient un quota **restant**,
  donc OpenClaw les inverse avant affichage ; les champs basés sur le comptage sont prioritaires lorsqu'ils sont
  présents.
  - Les libellés de fenêtre du plan de codage proviennent des champs heures/minutes du fournisseur lorsqu'ils sont
    présents, puis reviennent à l'intervalle `start_time` / `end_time`.
  - Si le point de terminaison du plan de codage renvoie `model_remains`, OpenClaw privilégie l'entrée
    du modèle de chat, dérive le libellé de fenêtre à partir des horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents, et inclut le nom du modèle
    dans le libellé du plan.
- **Xiaomi MiMo** : clé API via env/config/magasin d'authentification (`XIAOMI_API_KEY`).
- **z.ai** : clé API via env/config/magasin d'authentification.

L'utilisation est masquée lorsqu'aucune authentification exploitable d'utilisation du fournisseur ne peut être résolue. Les fournisseurs
peuvent fournir une logique d'authentification d'utilisation spécifique au plugin ; sinon OpenClaw revient
à la correspondance des identifiants OAuth/clés API depuis les profils d'authentification, les variables d'environnement
ou la configuration.
