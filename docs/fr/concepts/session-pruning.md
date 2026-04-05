---
read_when:
    - Vous souhaitez réduire la croissance du contexte due aux sorties d’outils
    - Vous souhaitez comprendre l’optimisation du cache de prompt Anthropic
summary: Réduction des anciens résultats d’outils pour garder un contexte léger et un cache efficace
title: Élagage de session
x-i18n:
    generated_at: "2026-04-05T12:40:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Élagage de session

L’élagage de session réduit les **anciens résultats d’outils** du contexte avant chaque
appel LLM. Il diminue le gonflement du contexte causé par l’accumulation de sorties d’outils (résultats d’exec, lectures de fichiers, résultats de recherche) sans réécrire le texte normal de la conversation.

<Info>
L’élagage agit uniquement en mémoire -- il ne modifie pas la transcription de session sur disque.
Votre historique complet est toujours conservé.
</Info>

## Pourquoi c’est important

Les longues sessions accumulent des sorties d’outils qui gonflent la fenêtre de contexte. Cela
augmente le coût et peut forcer la [compaction](/concepts/compaction) plus tôt que
nécessaire.

L’élagage est particulièrement précieux pour la **mise en cache des prompts Anthropic**. Après l’expiration du TTL du cache,
la requête suivante remet en cache l’intégralité du prompt. L’élagage réduit la taille d’écriture du
cache, ce qui diminue directement le coût.

## Fonctionnement

1. Attendre l’expiration du TTL du cache (5 minutes par défaut).
2. Trouver les anciens résultats d’outils pour l’élagage normal (le texte de conversation est laissé intact).
3. **Réduction douce** des résultats trop volumineux -- conserver le début et la fin, insérer `...`.
4. **Effacement strict** du reste -- remplacer par un espace réservé.
5. Réinitialiser le TTL pour que les requêtes suivantes réutilisent le cache rafraîchi.

## Nettoyage historique des images

OpenClaw exécute également un nettoyage idempotent séparé pour les anciennes sessions historiques qui conservaient des blocs d’image bruts dans l’historique.

- Il préserve **les 3 tours terminés les plus récents** octet pour octet afin que les préfixes du cache de prompt pour les suivis récents restent stables.
- Les anciens blocs d’image déjà traités dans l’historique `user` ou `toolResult` peuvent être remplacés par `[image data removed - already processed by model]`.
- Cela est distinct de l’élagage normal basé sur le TTL du cache. Cela existe pour empêcher des charges utiles d’image répétées d’invalider les caches de prompt lors de tours ultérieurs.

## Valeurs par défaut intelligentes

OpenClaw active automatiquement l’élagage pour les profils Anthropic :

| Type de profil                                         | Élagage activé | Heartbeat |
| ------------------------------------------------------ | -------------- | --------- |
| Auth OAuth/jeton Anthropic (y compris la réutilisation Claude CLI) | Oui            | 1 heure   |
| Clé API                                                | Oui            | 30 min    |

Si vous définissez des valeurs explicites, OpenClaw ne les remplace pas.

## Activer ou désactiver

L’élagage est désactivé par défaut pour les fournisseurs non Anthropic. Pour l’activer :

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Pour le désactiver : définissez `mode: "off"`.

## Élagage vs compaction

|            | Élagage             | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Quoi**   | Réduit les résultats d’outils | Résume la conversation |
| **Enregistré ?** | Non (par requête)   | Oui (dans la transcription)     |
| **Portée**  | Résultats d’outils uniquement | Conversation entière     |

Ils se complètent -- l’élagage garde les sorties d’outils légères entre les cycles
de compaction.

## Pour aller plus loin

- [Compaction](/concepts/compaction) -- réduction du contexte basée sur le résumé
- [Configuration de la passerelle](/gateway/configuration) -- tous les réglages de configuration de l’élagage
  (`contextPruning.*`)
