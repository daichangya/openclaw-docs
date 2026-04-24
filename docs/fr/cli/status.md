---
read_when:
    - Vous souhaitez un diagnostic rapide de la santé des canaux + des destinataires de session récents
    - Vous souhaitez un statut « all » copiable pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: Statut
x-i18n:
    generated_at: "2026-04-24T07:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostics pour les canaux + les sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Remarques :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` affiche les fenêtres d’utilisation normalisées sous la forme `X% left`.
- La sortie de statut de session sépare désormais `Runtime:` de `Runner:`. `Runtime` correspond au chemin d’exécution et à l’état de sandbox (`direct`, `docker/*`), tandis que `Runner` indique si la session utilise Pi embarqué, un fournisseur adossé à la CLI ou un backend de harnais ACP tel que `codex (acp/acpx)`.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant affichage ; les champs basés sur un comptage sont prioritaires lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages si nécessaire et incluent le nom du modèle dans le libellé du plan.
- Lorsque l’instantané de la session actuelle est partiel, `/status` peut compléter les compteurs de jetons et de cache à partir du journal d’utilisation de transcript le plus récent. Les valeurs actives non nulles existantes restent prioritaires sur les valeurs de repli issues du transcript.
- Le repli transcript peut aussi récupérer le libellé du modèle runtime actif lorsque l’entrée de session active ne le contient pas. Si ce modèle de transcript diffère du modèle sélectionné, le statut résout la fenêtre de contexte par rapport au modèle runtime récupéré plutôt qu’au modèle sélectionné.
- Pour le comptage de taille de prompt, le repli transcript privilégie le total orienté prompt le plus grand lorsque les métadonnées de session sont absentes ou plus petites, afin que les sessions de fournisseur personnalisé ne retombent pas à un affichage de `0` jeton.
- La sortie inclut les stockages de session par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation/d’exécution du service Gateway + hôte node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les copies source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, le statut affiche une indication pour exécuter `openclaw update` (voir [Updating](/fr/install/updating)).
- Les surfaces de statut en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRef pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, le statut reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible par humain affiche des avertissements tels que « configured token unavailable in this command path », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution locale de SecretRef pour la commande réussit, le statut privilégie l’instantané résolu et efface des marqueurs transitoires de canal « secret unavailable » dans la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des secrets et une section de diagnostic qui résume les diagnostics de secrets (tronqués pour la lisibilité) sans arrêter la génération du rapport.

## Associé

- [Référence CLI](/fr/cli)
- [Doctor](/fr/gateway/doctor)
