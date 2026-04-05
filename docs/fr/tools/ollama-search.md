---
read_when:
    - Vous souhaitez utiliser Ollama pour `web_search`
    - Vous voulez un fournisseur `web_search` sans clé
    - Vous avez besoin d'un guide de configuration pour la recherche Web Ollama
summary: Recherche Web Ollama via votre hôte Ollama configuré
title: Recherche Web Ollama
x-i18n:
    generated_at: "2026-04-05T12:56:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c1d0765594e0eb368c25cca21a712c054e71cf43e7bfb385d10feddd990f4fd
    source_path: tools/ollama-search.md
    workflow: 15
---

# Recherche Web Ollama

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` groupé.
Il utilise l'API expérimentale de recherche web d'Ollama et renvoie des résultats structurés
avec des titres, des URL et des extraits.

Contrairement au fournisseur de modèles Ollama, cette configuration ne nécessite pas de clé API par
défaut. Elle exige toutefois :

- un hôte Ollama accessible depuis OpenClaw
- `ollama signin`

## Configuration

<Steps>
  <Step title="Démarrer Ollama">
    Assurez-vous qu'Ollama est installé et en cours d'exécution.
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

    Sélectionnez ensuite **Ollama Web Search** comme fournisseur.

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

Remplacement facultatif de l'hôte Ollama :

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

Si aucune URL de base Ollama explicite n'est définie, OpenClaw utilise `http://127.0.0.1:11434`.

Si votre hôte Ollama attend une authentification bearer, OpenClaw réutilise
`models.providers.ollama.apiKey` (ou l'authentification de fournisseur correspondante basée sur l'environnement)
pour les requêtes de recherche web également.

## Notes

- Aucun champ de clé API spécifique à la recherche web n'est requis pour ce fournisseur.
- Si l'hôte Ollama est protégé par auth, OpenClaw réutilise la clé API normale du
  fournisseur Ollama lorsqu'elle est présente.
- OpenClaw affiche un avertissement pendant la configuration si Ollama est inaccessible ou si aucune connexion n'est établie, mais
  cela ne bloque pas la sélection.
- La détection automatique à l'exécution peut se rabattre sur Ollama Web Search lorsqu'aucun fournisseur
  avec identifiants de priorité plus élevée n'est configuré.
- Le fournisseur utilise l'endpoint expérimental `/api/experimental/web_search` d'Ollama.

## Lié

- [Vue d'ensemble de Web Search](/tools/web) -- tous les fournisseurs et la détection automatique
- [Ollama](/fr/providers/ollama) -- configuration des modèles Ollama et modes cloud/local
