---
read_when:
    - Vous voulez comprendre comment `memory_search` fonctionne
    - Vous voulez choisir un fournisseur d’embeddings
    - Vous voulez ajuster la qualité de recherche
summary: Comment la recherche mémoire trouve des notes pertinentes à l’aide des embeddings et de la récupération hybride
title: Recherche mémoire
x-i18n:
    generated_at: "2026-04-10T06:55:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca0237f4f1ee69dcbfb12e6e9527a53e368c0bf9b429e506831d4af2f3a3ac6f
    source_path: concepts/memory-search.md
    workflow: 15
---

# Recherche mémoire

`memory_search` trouve des notes pertinentes dans vos fichiers de mémoire, même lorsque la formulation diffère du texte d’origine. Elle fonctionne en indexant la mémoire en petits fragments, puis en les recherchant à l’aide d’embeddings, de mots-clés, ou des deux.

## Démarrage rapide

Si vous avez une clé API OpenAI, Gemini, Voyage ou Mistral configurée, la recherche mémoire fonctionne automatiquement. Pour définir explicitement un fournisseur :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // ou "gemini", "local", "ollama", etc.
      },
    },
  },
}
```

Pour des embeddings locaux sans clé API, utilisez `provider: "local"` (nécessite `node-llama-cpp`).

## Fournisseurs pris en charge

| Fournisseur | ID        | Nécessite une clé API | Notes                                                   |
| ----------- | --------- | --------------------- | ------------------------------------------------------- |
| OpenAI      | `openai`  | Oui                   | Détection automatique, rapide                           |
| Gemini      | `gemini`  | Oui                   | Prend en charge l’indexation d’images et d’audio        |
| Voyage      | `voyage`  | Oui                   | Détection automatique                                   |
| Mistral     | `mistral` | Oui                   | Détection automatique                                   |
| Bedrock     | `bedrock` | Non                   | Détection automatique lorsque la chaîne d’identifiants AWS est résolue |
| Ollama      | `ollama`  | Non                   | Local, doit être défini explicitement                   |
| Local       | `local`   | Non                   | Modèle GGUF, téléchargement d’environ 0,6 Go            |

## Comment la recherche fonctionne

OpenClaw exécute deux chemins de récupération en parallèle et fusionne les résultats :

```mermaid
flowchart LR
    Q["Requête"] --> E["Embedding"]
    Q --> T["Tokenisation"]
    E --> VS["Recherche vectorielle"]
    T --> BM["Recherche BM25"]
    VS --> M["Fusion pondérée"]
    BM --> M
    M --> R["Meilleurs résultats"]
```

- **Recherche vectorielle** trouve des notes au sens similaire (« gateway host » correspond à « la machine qui exécute OpenClaw »).
- **Recherche par mots-clés BM25** trouve des correspondances exactes (ID, chaînes d’erreur, clés de configuration).

Si un seul chemin est disponible (pas d’embeddings ou pas de FTS), l’autre s’exécute seul.

## Améliorer la qualité de recherche

Deux fonctionnalités facultatives aident lorsque vous avez un long historique de notes :

### Décroissance temporelle

Les anciennes notes perdent progressivement du poids dans le classement, afin que les informations récentes remontent en premier. Avec la demi-vie par défaut de 30 jours, une note du mois dernier obtient 50 % de son poids d’origine. Les fichiers pérennes comme `MEMORY.md` ne subissent jamais de décroissance.

<Tip>
Activez la décroissance temporelle si votre agent a des mois de notes quotidiennes et que des informations obsolètes continuent de dépasser le contexte récent dans le classement.
</Tip>

### MMR (diversité)

Réduit les résultats redondants. Si cinq notes mentionnent toutes la même configuration de routeur, MMR garantit que les meilleurs résultats couvrent différents sujets au lieu de se répéter.

<Tip>
Activez MMR si `memory_search` continue de renvoyer des extraits presque dupliqués provenant de différentes notes quotidiennes.
</Tip>

### Activer les deux

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Mémoire multimodale

Avec Gemini Embedding 2, vous pouvez indexer des images et des fichiers audio en plus du Markdown. Les requêtes de recherche restent textuelles, mais elles sont mises en correspondance avec le contenu visuel et audio. Consultez la [référence de configuration de la mémoire](/fr/reference/memory-config) pour la configuration.

## Recherche dans la mémoire de session

Vous pouvez facultativement indexer les transcriptions de session afin que `memory_search` puisse rappeler des conversations antérieures. Cette fonctionnalité est activée sur opt-in via `memorySearch.experimental.sessionMemory`. Consultez la [référence de configuration](/fr/reference/memory-config) pour plus de détails.

## Dépannage

**Aucun résultat ?** Exécutez `openclaw memory status` pour vérifier l’index. S’il est vide, exécutez `openclaw memory index --force`.

**Seulement des correspondances par mots-clés ?** Votre fournisseur d’embeddings n’est peut-être pas configuré. Vérifiez avec `openclaw memory status --deep`.

**Texte CJK introuvable ?** Reconstruisez l’index FTS avec `openclaw memory index --force`.

## Pour aller plus loin

- [Mémoire active](/fr/concepts/active-memory) -- mémoire de sous-agent pour les sessions de chat interactives
- [Mémoire](/fr/concepts/memory) -- disposition des fichiers, backends, outils
- [Référence de configuration de la mémoire](/fr/reference/memory-config) -- tous les paramètres de configuration
