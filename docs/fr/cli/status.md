---
read_when:
    - Vous souhaitez un diagnostic rapide de l'état des canaux et des destinataires de session récents
    - Vous souhaitez un statut « all » copiable pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d'utilisation)
title: status
x-i18n:
    generated_at: "2026-04-05T12:39:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbe9d94fbe9938cd946ee6f293b5bd3b464b75e1ade2eacdd851788c3bffe94e
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostics pour les canaux et les sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Remarques :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` affiche les fenêtres d'utilisation normalisées des fournisseurs sous la forme `X% left`.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant, donc OpenClaw les inverse avant affichage ; les champs basés sur le comptage sont prioritaires lorsqu'ils sont présents. Les réponses `model_remains` privilégient l'entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans le libellé du plan.
- Lorsque l'instantané de la session actuelle est incomplet, `/status` peut compléter les compteurs de jetons et de cache à partir du journal d'utilisation de transcription le plus récent. Les valeurs en direct non nulles existantes restent prioritaires par rapport aux valeurs de repli de transcription.
- Le repli de transcription peut également récupérer le libellé du modèle de runtime actif lorsque l'entrée de session en direct en est dépourvue. Si ce modèle de transcription diffère du modèle sélectionné, status résout la fenêtre de contexte par rapport au modèle de runtime récupéré plutôt qu'au modèle sélectionné.
- Pour le calcul de la taille du prompt, le repli de transcription privilégie le total orienté prompt le plus grand lorsque les métadonnées de session sont absentes ou plus petites, afin que les sessions de fournisseurs personnalisés ne retombent pas à des affichages de jetons à `0`.
- La sortie inclut des magasins de sessions par agent lorsque plusieurs agents sont configurés.
- La vue d'ensemble inclut le statut d'installation/d'exécution du service hôte de la gateway et du nœud lorsqu'il est disponible.
- La vue d'ensemble inclut le canal de mise à jour et le SHA git (pour les extractions source).
- Les informations de mise à jour apparaissent dans la vue d'ensemble ; si une mise à jour est disponible, status affiche une indication pour exécuter `openclaw update` (voir [Updating](/install/updating)).
- Les surfaces de statut en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRef pris en charge pour leurs chemins de configuration ciblés lorsque c'est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, status reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible affiche des avertissements tels que « configured token unavailable in this command path », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution locale de SecretRef réussit, status privilégie l'instantané résolu et efface les marqueurs transitoires de canal « secret unavailable » de la sortie finale.
- `status --all` inclut une ligne de vue d'ensemble Secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.
