---
read_when:
    - Vous raccordez les surfaces d’utilisation/quota des fournisseurs
    - Vous devez expliquer le comportement du suivi d’utilisation ou les exigences d’authentification
summary: Surfaces de suivi d’utilisation et exigences d’identifiants
title: Suivi d’utilisation
x-i18n:
    generated_at: "2026-04-24T07:08:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 15
---

## Ce que c’est

- Récupère l’utilisation/le quota des fournisseurs directement depuis leurs endpoints d’utilisation.
- Aucun coût estimé ; uniquement les fenêtres signalées par le fournisseur.
- La sortie d’état lisible par un humain est normalisée en `X% left`, même lorsqu’une
  API amont signale un quota consommé, un quota restant, ou seulement des comptes bruts.
- Le `/status` au niveau de la session et `session_status` peuvent revenir à la dernière
  entrée d’utilisation de transcription lorsque le snapshot de session en direct est partiel. Ce
  repli complète les compteurs manquants de tokens/cache, peut récupérer le libellé du modèle
  d’exécution actif, et préfère le total orienté prompt le plus élevé lorsque les métadonnées de session
  sont absentes ou plus petites. Les valeurs en direct non nulles existantes restent prioritaires.

## Où cela s’affiche

- `/status` dans les discussions : carte d’état riche en emoji avec tokens de session + coût estimé (clé API uniquement). L’utilisation du fournisseur s’affiche pour le **fournisseur de modèle actuel** lorsqu’elle est disponible sous la forme d’une fenêtre normalisée `X% left`.
- `/usage off|tokens|full` dans les discussions : pied de page d’utilisation par réponse (OAuth n’affiche que les tokens).
- `/usage cost` dans les discussions : résumé local des coûts agrégé à partir des journaux de session OpenClaw.
- CLI : `openclaw status --usage` affiche une ventilation complète par fournisseur.
- CLI : `openclaw channels list` affiche le même snapshot d’utilisation à côté de la configuration du fournisseur (utilisez `--no-usage` pour l’ignorer).
- Barre de menus macOS : section « Usage » sous Context (uniquement si disponible).

## Fournisseurs + identifiants

- **Anthropic (Claude)** : jetons OAuth dans les profils d’authentification.
- **GitHub Copilot** : jetons OAuth dans les profils d’authentification.
- **Gemini CLI** : jetons OAuth dans les profils d’authentification.
  - L’utilisation JSON revient à `stats` ; `stats.cached` est normalisé en
    `cacheRead`.
- **OpenAI Codex** : jetons OAuth dans les profils d’authentification (`accountId` est utilisé lorsqu’il est présent).
- **MiniMax** : clé API ou profil d’authentification OAuth MiniMax. OpenClaw traite
  `minimax`, `minimax-cn` et `minimax-portal` comme la même surface de quota
  MiniMax, préfère l’OAuth MiniMax stocké lorsqu’il est présent, et sinon revient
  à `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` ou `MINIMAX_API_KEY`.
  Les champs bruts `usage_percent` / `usagePercent` de MiniMax signifient un quota **restant**,
  donc OpenClaw les inverse avant l’affichage ; les champs basés sur le comptage restent prioritaires lorsqu’ils sont présents.
  - Les libellés de fenêtre du plan de codage proviennent des champs heures/minutes du fournisseur lorsqu’ils sont
    présents, puis reviennent à l’intervalle `start_time` / `end_time`.
  - Si l’endpoint de plan de codage renvoie `model_remains`, OpenClaw préfère
    l’entrée du modèle de chat, dérive le libellé de fenêtre à partir des horodatages lorsque les champs explicites
    `window_hours` / `window_minutes` sont absents, et inclut le nom du modèle
    dans le libellé du plan.
- **Xiaomi MiMo** : clé API via env/config/magasin d’authentification (`XIAOMI_API_KEY`).
- **z.ai** : clé API via env/config/magasin d’authentification.

L’utilisation est masquée lorsqu’aucune authentification exploitable d’utilisation fournisseur ne peut être résolue. Les fournisseurs
peuvent fournir une logique d’authentification d’utilisation spécifique au Plugin ; sinon OpenClaw revient à
la correspondance des identifiants OAuth/clé API à partir des profils d’authentification, des variables d’environnement,
ou de la configuration.

## Associé

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Utilisation et coûts API](/fr/reference/api-usage-costs)
- [Mise en cache des prompts](/fr/reference/prompt-caching)
