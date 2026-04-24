---
read_when:
    - Vous voulez utiliser Ollama pour `web_search`
    - Vous voulez un fournisseur `web_search` sans clé API
    - Vous avez besoin d’un guide de configuration pour Ollama Web Search
summary: Recherche web Ollama via votre hôte Ollama configuré
title: Recherche web Ollama
x-i18n:
    generated_at: "2026-04-24T07:38:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré.
Il utilise l’API expérimentale de recherche web d’Ollama et renvoie des résultats structurés
avec des titres, des URLs et des extraits.

Contrairement au fournisseur de modèles Ollama, cette configuration n’a pas besoin de clé API par
défaut. Elle nécessite cependant :

- un hôte Ollama accessible depuis OpenClaw
- `ollama signin`

## Configuration

<Steps>
  <Step title="Démarrer Ollama">
    Assurez-vous qu’Ollama est installé et en cours d’exécution.
  </Step>
  <Step title="Se connecter">
    Exécutez :

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choisir Ollama Web Search">
    Exécutez :

    ```bash
    openclaw configure --section web
    ```

    Puis sélectionnez **Ollama Web Search** comme fournisseur.

  </Step>
</Steps>

Si vous utilisez déjà Ollama pour les modèles, Ollama Web Search réutilise le même
hôte configuré.

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Remplacement facultatif de l’hôte Ollama :

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Si aucune URL de base Ollama explicite n’est définie, OpenClaw utilise `http://127.0.0.1:11434`.

Si votre hôte Ollama attend une authentification bearer, OpenClaw réutilise
`models.providers.ollama.apiKey` (ou l’authentification du fournisseur correspondante adossée à l’environnement)
pour les requêtes de recherche web également.

## Remarques

- Aucun champ de clé API spécifique à la recherche web n’est requis pour ce fournisseur.
- Si l’hôte Ollama est protégé par authentification, OpenClaw réutilise la clé API normale du
  fournisseur Ollama lorsqu’elle est présente.
- OpenClaw avertit pendant la configuration si Ollama est injoignable ou non connecté, mais
  n’empêche pas la sélection.
- La détection automatique à l’exécution peut se rabattre sur Ollama Web Search lorsqu’aucun fournisseur
  authentifié de priorité supérieure n’est configuré.
- Le fournisseur utilise l’endpoint expérimental `/api/experimental/web_search`
  d’Ollama.

## Associé

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Ollama](/fr/providers/ollama) -- configuration du modèle Ollama et modes cloud/local
