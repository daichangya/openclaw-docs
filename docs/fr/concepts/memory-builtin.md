---
read_when:
    - Vous voulez comprendre le backend de mémoire par défaut
    - Vous voulez configurer des fournisseurs d’embeddings ou la recherche hybride
summary: Le moteur de mémoire par défaut basé sur SQLite avec recherche par mots-clés, vectorielle et hybride
title: Moteur de mémoire intégré
x-i18n:
    generated_at: "2026-04-05T12:39:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Moteur de mémoire intégré

Le moteur intégré est le backend de mémoire par défaut. Il stocke votre index de mémoire dans
une base de données SQLite par agent et ne nécessite aucune dépendance supplémentaire pour démarrer.

## Ce qu’il fournit

- **Recherche par mots-clés** via l’indexation plein texte FTS5 (score BM25).
- **Recherche vectorielle** via des embeddings de n’importe quel fournisseur pris en charge.
- **Recherche hybride** qui combine les deux pour de meilleurs résultats.
- **Prise en charge CJK** via la tokenisation trigramme pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles en base de données (facultatif).

## Pour commencer

Si vous avez une clé API pour OpenAI, Gemini, Voyage ou Mistral, le moteur intégré
la détecte automatiquement et active la recherche vectorielle. Aucune configuration n’est nécessaire.

Pour définir explicitement un fournisseur :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Sans fournisseur d’embeddings, seule la recherche par mots-clés est disponible.

## Fournisseurs d’embeddings pris en charge

| Fournisseur | ID        | Détection automatique | Remarques                            |
| ----------- | --------- | --------------------- | ------------------------------------ |
| OpenAI      | `openai`  | Oui                   | Par défaut : `text-embedding-3-small` |
| Gemini      | `gemini`  | Oui                   | Prend en charge le multimodal (image + audio) |
| Voyage      | `voyage`  | Oui                   |                                      |
| Mistral     | `mistral` | Oui                   |                                      |
| Ollama      | `ollama`  | Non                   | Local, à définir explicitement       |
| Local       | `local`   | Oui (en premier)      | Modèle GGUF, téléchargement d’environ 0,6 Go |

La détection automatique choisit le premier fournisseur dont la clé API peut être résolue, dans l’ordre
indiqué. Définissez `memorySearch.provider` pour la remplacer.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en segments (~400 jetons avec
un chevauchement de 80 jetons) et les stocke dans une base de données SQLite par agent.

- **Emplacement de l’index :** `~/.openclaw/memory/<agentId>.sqlite`
- **Surveillance des fichiers :** les modifications des fichiers mémoire déclenchent une réindexation temporisée (1,5 s).
- **Réindexation automatique :** lorsque le fournisseur d’embeddings, le modèle ou la configuration de segmentation
  changent, l’index entier est automatiquement reconstruit.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez également indexer des fichiers Markdown en dehors de l’espace de travail avec
`memorySearch.extraPaths`. Voir la
[référence de configuration](/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le bon choix pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendances supplémentaires.
- Gère bien la recherche par mots-clés et la recherche vectorielle.
- Prend en charge tous les fournisseurs d’embeddings.
- La recherche hybride combine le meilleur des deux approches de récupération.

Envisagez de passer à [QMD](/concepts/memory-qmd) si vous avez besoin d’un reranking, d’une expansion de requête
ou si vous voulez indexer des répertoires en dehors de l’espace de travail.

Envisagez [Honcho](/concepts/memory-honcho) si vous voulez une mémoire intersessions avec
une modélisation automatique des utilisateurs.

## Résolution des problèmes

**Recherche mémoire désactivée ?** Vérifiez `openclaw memory status`. Si aucun fournisseur n’est
détecté, définissez-en un explicitement ou ajoutez une clé API.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire l’index. Le surveillant
peut manquer des modifications dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw repasse automatiquement à la similarité cosinus en processus.
Vérifiez les journaux pour l’erreur de chargement spécifique.

## Configuration

Pour la configuration du fournisseur d’embeddings, le réglage de la recherche hybride (poids, MMR, décroissance
temporelle), l’indexation par lot, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et tous les
autres paramètres de configuration, voir la
[référence de configuration de la mémoire](/reference/memory-config).
