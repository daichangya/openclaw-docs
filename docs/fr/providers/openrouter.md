---
read_when:
    - Vous voulez une seule clé API pour de nombreux LLMs
    - Vous voulez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous voulez utiliser OpenRouter pour la génération d’images
summary: Utiliser l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T07:28:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter fournit une **API unifiée** qui route les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Elle est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant simplement l’URL de base.

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Lancer l’intégration">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facultatif) Basculer vers un modèle spécifique">
    L’intégration utilise par défaut `openrouter/auto`. Choisissez un modèle concret plus tard :

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Exemple de configuration

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Références de modèle

<Note>
Les références de modèle suivent le modèle `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, voir [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de repli intégrés :

| Référence de modèle                   | Remarques                          |
| ------------------------------------- | ---------------------------------- |
| `openrouter/auto`                     | Routage automatique OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6`     | Kimi K2.6 via MoonshotAI           |
| `openrouter/openrouter/healer-alpha`  | Route OpenRouter Healer Alpha      |
| `openrouter/openrouter/hunter-alpha`  | Route OpenRouter Hunter Alpha      |

## Génération d’images

OpenRouter peut aussi servir de backend pour l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw envoie les requêtes image à l’API d’images basée sur chat completions d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications prises en charge `aspectRatio` et `resolution` via `image_config` d’OpenRouter.

## Authentification et en-têtes

OpenRouter utilise en interne un jeton Bearer avec votre clé API.

Sur les vraies requêtes OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi
les en-têtes d’attribution d’application documentés par OpenRouter :

| En-tête                  | Valeur                |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Si vous repointez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes spécifiques à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèle Anthropic conservent les
    marqueurs Anthropic `cache_control` spécifiques à OpenRouter qu’OpenClaw utilise pour
    une meilleure réutilisation du cache de prompt sur les blocs de prompt système/developpeur.
  </Accordion>

  <Accordion title="Injection de réflexion / raisonnement">
    Sur les routes prises en charge non `auto`, OpenClaw mappe le niveau de réflexion sélectionné vers
    des charges utiles de raisonnement proxy OpenRouter. Les indications de modèle non prises en charge et
    `openrouter/auto` ignorent cette injection de raisonnement.
  </Accordion>

  <Accordion title="Mise en forme de requêtes réservée à OpenAI">
    OpenRouter passe toujours par le chemin de type proxy compatible OpenAI, donc
    la mise en forme de requêtes réservée à OpenAI natif, telle que `serviceTier`, `store` de Responses,
    les charges utiles compatibles raisonnement OpenAI et les indications de cache de prompt, n’est pas transmise.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement de signature de pensée Gemini, mais n’active pas la validation native de relecture Gemini
    ni les réécritures de bootstrap.
  </Accordion>

  <Accordion title="Métadonnées de routage fournisseur">
    Si vous passez un routage de fournisseur OpenRouter sous les paramètres du modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
