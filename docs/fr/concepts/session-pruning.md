---
read_when:
    - Vous souhaitez réduire la croissance du contexte due aux sorties d’outils
    - Vous souhaitez comprendre l’optimisation du cache de prompts Anthropic
summary: Rognage des anciens résultats d’outils pour conserver un contexte léger et un cache efficace
title: Élagage de session
x-i18n:
    generated_at: "2026-04-24T07:08:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: af47997b83cd478dac0e2ebb6d277a948713f28651751bec6cff4ef4b70a16c6
    source_path: concepts/session-pruning.md
    workflow: 15
---

L’élagage de session rogne les **anciens résultats d’outils** du contexte avant chaque
appel au LLM. Il réduit l’encombrement du contexte dû à l’accumulation des sorties d’outils (résultats d’exécution, lectures de fichiers, résultats de recherche) sans réécrire le texte normal de la conversation.

<Info>
L’élagage se fait uniquement en mémoire -- il ne modifie pas le transcript de session sur disque.
L’historique complet est toujours préservé.
</Info>

## Pourquoi c’est important

Les longues sessions accumulent des sorties d’outils qui gonflent la fenêtre de contexte. Cela
augmente le coût et peut forcer la [Compaction](/fr/concepts/compaction) plus tôt que
nécessaire.

L’élagage est particulièrement utile pour le **cache de prompts Anthropic**. Après l’expiration du
TTL du cache, la requête suivante remet en cache l’intégralité du prompt. L’élagage réduit la
taille d’écriture du cache, ce qui diminue directement le coût.

## Comment cela fonctionne

1. Attendre l’expiration du TTL du cache (5 minutes par défaut).
2. Trouver les anciens résultats d’outils pour l’élagage normal (le texte de conversation est laissé intact).
3. **Rognage doux** des résultats surdimensionnés -- conserver le début et la fin, insérer `...`.
4. **Effacement dur** du reste -- remplacer par un espace réservé.
5. Réinitialiser le TTL afin que les requêtes suivantes réutilisent le cache fraîchement créé.

## Nettoyage des anciennes images héritées

OpenClaw exécute aussi un nettoyage idempotent distinct pour les anciennes sessions héritées qui
conservaient des blocs d’image bruts dans l’historique.

- Il préserve les **3 tours terminés les plus récents** octet pour octet afin que les
  préfixes de cache de prompt pour les suivis récents restent stables.
- Les anciens blocs d’image déjà traités dans l’historique `user` ou `toolResult` peuvent être
  remplacés par `[image data removed - already processed by model]`.
- Cela est distinct de l’élagage normal basé sur le TTL du cache. Cela existe pour empêcher les
  charges utiles d’image répétées de casser les caches de prompt lors des tours ultérieurs.

## Valeurs par défaut intelligentes

OpenClaw active automatiquement l’élagage pour les profils Anthropic :

| Type de profil                                         | Élagage activé | Heartbeat |
| ------------------------------------------------------ | -------------- | --------- |
| Authentification Anthropic OAuth/jeton (y compris la réutilisation de Claude CLI) | Oui            | 1 heure   |
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

## Élagage vs Compaction

|            | Élagage             | Compaction               |
| ---------- | ------------------- | ------------------------ |
| **Quoi**   | Rogne les résultats d’outils | Résume la conversation |
| **Sauvegardé ?** | Non (par requête) | Oui (dans le transcript) |
| **Portée** | Résultats d’outils uniquement | Conversation entière    |

Ils se complètent -- l’élagage garde des sorties d’outils légères entre
les cycles de Compaction.

## Pour aller plus loin

- [Compaction](/fr/concepts/compaction) -- réduction du contexte basée sur la synthèse
- [Configuration du Gateway](/fr/gateway/configuration) -- tous les réglages de configuration de l’élagage
  (`contextPruning.*`)

## Associé

- [Gestion de session](/fr/concepts/session)
- [Outils de session](/fr/concepts/session-tool)
- [Moteur de contexte](/fr/concepts/context-engine)
