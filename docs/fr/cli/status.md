---
read_when:
    - Vous souhaitez un diagnostic rapide de l’état des canaux et des destinataires de session récents
    - Vous souhaitez un statut « all » copiable pour le débogage
summary: Référence CLI pour `openclaw status` (diagnostics, sondes, instantanés d’utilisation)
title: status
x-i18n:
    generated_at: "2026-04-23T13:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostics pour les canaux + sessions.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Remarques :

- `--deep` exécute des sondes en direct (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` affiche des fenêtres d’utilisation normalisées du fournisseur sous la forme `X% left`.
- La sortie d’état des sessions sépare désormais `Runtime:` de `Runner:`. `Runtime` correspond au chemin d’exécution et à l’état du bac à sable (`direct`, `docker/*`), tandis que `Runner` indique si la session utilise Pi intégré, un fournisseur adossé à la CLI ou un backend de harnais ACP tel que `codex (acp/acpx)`.
- Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant ; OpenClaw les inverse donc avant affichage ; les champs fondés sur le décompte sont prioritaires lorsqu’ils sont présents. Les réponses `model_remains` privilégient l’entrée du modèle de chat, dérivent le libellé de fenêtre à partir des horodatages si nécessaire, et incluent le nom du modèle dans le libellé du plan.
- Lorsque l’instantané de la session actuelle est incomplet, `/status` peut compléter les compteurs de jetons et de cache à partir du journal d’utilisation de transcription le plus récent. Les valeurs en direct non nulles existantes restent prioritaires sur les valeurs de secours issues de la transcription.
- Le secours par transcription peut également récupérer le libellé du modèle d’exécution actif lorsque l’entrée de session en direct ne le contient pas. Si ce modèle de transcription diffère du modèle sélectionné, status résout la fenêtre de contexte à partir du modèle d’exécution récupéré plutôt que du modèle sélectionné.
- Pour le calcul de la taille du prompt, le secours par transcription privilégie le total orienté prompt le plus grand lorsque les métadonnées de session sont absentes ou plus petites, afin que les sessions de fournisseur personnalisé ne retombent pas sur des affichages à `0` jeton.
- La sortie inclut les stockages de session par agent lorsque plusieurs agents sont configurés.
- La vue d’ensemble inclut l’état d’installation/d’exécution du service hôte Gateway + Node lorsqu’il est disponible.
- La vue d’ensemble inclut le canal de mise à jour + le SHA git (pour les checkouts source).
- Les informations de mise à jour apparaissent dans la vue d’ensemble ; si une mise à jour est disponible, status affiche une indication pour exécuter `openclaw update` (voir [Mise à jour](/fr/install/updating)).
- Les surfaces d’état en lecture seule (`status`, `status --json`, `status --all`) résolvent les SecretRefs pris en charge pour leurs chemins de configuration ciblés lorsque c’est possible.
- Si un SecretRef de canal pris en charge est configuré mais indisponible dans le chemin de commande actuel, status reste en lecture seule et signale une sortie dégradée au lieu de planter. La sortie lisible par un humain affiche des avertissements tels que « configured token unavailable in this command path », et la sortie JSON inclut `secretDiagnostics`.
- Lorsque la résolution locale à la commande d’un SecretRef réussit, status privilégie l’instantané résolu et supprime les marqueurs transitoires « secret unavailable » des canaux dans la sortie finale.
- `status --all` inclut une ligne de vue d’ensemble des Secrets et une section de diagnostic qui résume les diagnostics des secrets (tronqués pour la lisibilité) sans interrompre la génération du rapport.
