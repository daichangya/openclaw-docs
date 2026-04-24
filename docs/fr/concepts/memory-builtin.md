---
read_when:
    - Vous voulez comprendre le backend mémoire par défaut
    - Vous souhaitez configurer des providers d’embedding ou la recherche hybride
summary: Le backend mémoire par défaut basé sur SQLite avec recherche par mots-clés, vectorielle et hybride
title: Moteur mémoire intégré
x-i18n:
    generated_at: "2026-04-24T07:06:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Le moteur intégré est le backend mémoire par défaut. Il stocke votre index mémoire dans
une base de données SQLite par agent et ne nécessite aucune dépendance supplémentaire pour démarrer.

## Ce qu’il fournit

- **Recherche par mots-clés** via l’indexation plein texte FTS5 (score BM25).
- **Recherche vectorielle** via des embeddings depuis n’importe quel provider pris en charge.
- **Recherche hybride** qui combine les deux pour de meilleurs résultats.
- **Prise en charge CJK** via la tokenisation trigramme pour le chinois, le japonais et le coréen.
- **Accélération sqlite-vec** pour les requêtes vectorielles dans la base de données (facultatif).

## Démarrage

Si vous disposez d’une clé API pour OpenAI, Gemini, Voyage ou Mistral, le moteur intégré
la détecte automatiquement et active la recherche vectorielle. Aucune configuration nécessaire.

Pour définir explicitement un provider :

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

Sans provider d’embedding, seule la recherche par mots-clés est disponible.

Pour forcer le provider d’embedding local intégré, faites pointer `local.modelPath` vers un
fichier GGUF :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Providers d’embedding pris en charge

| Provider | ID        | Détecté automatiquement | Remarques                            |
| -------- | --------- | ----------------------- | ------------------------------------ |
| OpenAI   | `openai`  | Oui                     | Par défaut : `text-embedding-3-small` |
| Gemini   | `gemini`  | Oui                     | Prend en charge le multimodal (image + audio) |
| Voyage   | `voyage`  | Oui                     |                                      |
| Mistral  | `mistral` | Oui                     |                                      |
| Ollama   | `ollama`  | Non                     | Local, à définir explicitement       |
| Local    | `local`   | Oui (en premier)        | Modèle GGUF, téléchargement d’environ 0,6 Go |

La détection automatique choisit le premier provider dont la clé API peut être résolue, dans l’ordre
indiqué. Définissez `memorySearch.provider` pour le remplacer.

## Fonctionnement de l’indexation

OpenClaw indexe `MEMORY.md` et `memory/*.md` en segments (~400 tokens avec
chevauchement de 80 tokens) et les stocke dans une base de données SQLite par agent.

- **Emplacement de l’index :** `~/.openclaw/memory/<agentId>.sqlite`
- **Surveillance des fichiers :** les modifications des fichiers mémoire déclenchent une réindexation avec anti-rebond (1,5 s).
- **Réindexation automatique :** lorsque le provider d’embedding, le modèle ou la configuration de segmentation
  changent, l’index entier est reconstruit automatiquement.
- **Réindexation à la demande :** `openclaw memory index --force`

<Info>
Vous pouvez aussi indexer des fichiers Markdown en dehors de l’espace de travail avec
`memorySearch.extraPaths`. Consultez la
[référence de configuration](/fr/reference/memory-config#additional-memory-paths).
</Info>

## Quand l’utiliser

Le moteur intégré est le bon choix pour la plupart des utilisateurs :

- Fonctionne immédiatement sans dépendance supplémentaire.
- Gère correctement la recherche par mots-clés et la recherche vectorielle.
- Prend en charge tous les providers d’embedding.
- La recherche hybride combine le meilleur des deux approches de récupération.

Envisagez de passer à [QMD](/fr/concepts/memory-qmd) si vous avez besoin de reranking, d’expansion
de requête, ou si vous souhaitez indexer des répertoires en dehors de l’espace de travail.

Envisagez [Honcho](/fr/concepts/memory-honcho) si vous voulez une mémoire inter-session avec
modélisation utilisateur automatique.

## Dépannage

**Recherche mémoire désactivée ?** Vérifiez `openclaw memory status`. Si aucun provider n’est
détecté, définissez-en un explicitement ou ajoutez une clé API.

**Provider local non détecté ?** Confirmez que le chemin local existe et exécutez :

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Les commandes CLI autonomes et le Gateway utilisent tous deux le même identifiant de provider `local`.
Si le provider est défini sur `auto`, les embeddings locaux ne sont pris en compte en premier
que lorsque `memorySearch.local.modelPath` pointe vers un fichier local existant.

**Résultats obsolètes ?** Exécutez `openclaw memory index --force` pour reconstruire l’index. Le watcher
peut manquer des changements dans de rares cas limites.

**sqlite-vec ne se charge pas ?** OpenClaw revient automatiquement à la similarité cosinus en processus.
Vérifiez les journaux pour l’erreur de chargement spécifique.

## Configuration

Pour la configuration du provider d’embedding, le réglage de la recherche hybride (poids, MMR, décroissance
temporelle), l’indexation par lots, la mémoire multimodale, sqlite-vec, les chemins supplémentaires et tous
les autres paramètres, consultez la
[référence de configuration mémoire](/fr/reference/memory-config).

## Lié

- [Vue d’ensemble de la mémoire](/fr/concepts/memory)
- [Recherche mémoire](/fr/concepts/memory-search)
- [Active Memory](/fr/concepts/active-memory)
