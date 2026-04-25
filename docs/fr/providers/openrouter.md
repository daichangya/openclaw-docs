---
read_when:
    - Vous souhaitez une seule clé API pour de nombreux LLM
    - Vous souhaitez exécuter des modèles via OpenRouter dans OpenClaw
    - Vous souhaitez utiliser OpenRouter pour la génération d’images
summary: Utiliser l’API unifiée d’OpenRouter pour accéder à de nombreux modèles dans OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:21:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter fournit une **API unifiée** qui route les requêtes vers de nombreux modèles derrière un seul
point de terminaison et une seule clé API. Il est compatible OpenAI, donc la plupart des SDK OpenAI fonctionnent en changeant simplement l’URL de base.

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Facultatif) Basculer vers un modèle spécifique">
    L’onboarding utilise par défaut `openrouter/auto`. Choisissez plus tard un modèle concret :

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
Les références de modèle suivent le motif `openrouter/<provider>/<model>`. Pour la liste complète des
fournisseurs et modèles disponibles, voir [/concepts/model-providers](/fr/concepts/model-providers).
</Note>

Exemples de repli intégrés :

| Référence de modèle                            | Remarques                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Routage automatique OpenRouter  |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 via MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Route OpenRouter Healer Alpha |
| `openrouter/openrouter/hunter-alpha` | Route OpenRouter Hunter Alpha |

## Génération d’images

OpenRouter peut également alimenter l’outil `image_generate`. Utilisez un modèle d’image OpenRouter sous `agents.defaults.imageGenerationModel` :

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw envoie les requêtes d’image à l’API d’images chat completions d’OpenRouter avec `modalities: ["image", "text"]`. Les modèles d’image Gemini reçoivent les indications prises en charge `aspectRatio` et `resolution` via `image_config` d’OpenRouter. Utilisez `agents.defaults.imageGenerationModel.timeoutMs` pour les modèles d’image OpenRouter plus lents ; le paramètre `timeoutMs` par appel de l’outil `image_generate` reste prioritaire.

## Synthèse vocale

OpenRouter peut aussi être utilisé comme fournisseur TTS via son point de terminaison
`/audio/speech` compatible OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si `messages.tts.providers.openrouter.apiKey` est omis, le TTS réutilise
`models.providers.openrouter.apiKey`, puis `OPENROUTER_API_KEY`.

## Authentification et en-têtes

OpenRouter utilise en arrière-plan un jeton Bearer avec votre clé API.

Sur les véritables requêtes OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw ajoute aussi
les en-têtes d’attribution d’application documentés par OpenRouter :

| En-tête                    | Valeur                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Si vous redirigez le fournisseur OpenRouter vers un autre proxy ou une autre URL de base, OpenClaw
n’injecte **pas** ces en-têtes spécifiques à OpenRouter ni les marqueurs de cache Anthropic.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Marqueurs de cache Anthropic">
    Sur les routes OpenRouter vérifiées, les références de modèle Anthropic conservent les
    marqueurs `cache_control` Anthropic spécifiques à OpenRouter qu’OpenClaw utilise pour une
    meilleure réutilisation du cache de prompt sur les blocs de prompt système/développeur.
  </Accordion>

  <Accordion title="Injection de thinking / raisonnement">
    Sur les routes prises en charge hors `auto`, OpenClaw mappe le niveau de réflexion sélectionné vers
    les charges utiles de raisonnement du proxy OpenRouter. Les indices de modèle non pris en charge et
    `openrouter/auto` ignorent cette injection de raisonnement.
  </Accordion>

  <Accordion title="Mise en forme des requêtes propre à OpenAI">
    OpenRouter passe toujours par le chemin compatible OpenAI de type proxy, donc
    la mise en forme native des requêtes propre à OpenAI telle que `serviceTier`, `store` de Responses,
    les charges utiles de compatibilité de raisonnement OpenAI et les indications de cache de prompt ne sont pas transmises.
  </Accordion>

  <Accordion title="Routes adossées à Gemini">
    Les références OpenRouter adossées à Gemini restent sur le chemin proxy-Gemini : OpenClaw y conserve
    l’assainissement de la signature de pensée Gemini, mais n’active pas la validation native de relecture Gemini
    ni les réécritures bootstrap.
  </Accordion>

  <Accordion title="Métadonnées de routage du fournisseur">
    Si vous transmettez le routage de fournisseur OpenRouter dans les paramètres du modèle, OpenClaw le transmet
    comme métadonnées de routage OpenRouter avant l’exécution des wrappers de flux partagés.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
