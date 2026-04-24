---
read_when:
    - Vous souhaitez exécuter OpenClaw sur un serveur local vLLM
    - Vous souhaitez des points de terminaison `/v1` compatibles OpenAI avec vos propres modèles
summary: Exécuter OpenClaw avec vLLM (serveur local compatible OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T07:29:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM peut servir des modèles open source (et certains modèles personnalisés) via une API HTTP **compatible OpenAI**. OpenClaw se connecte à vLLM en utilisant l’API `openai-completions`.

OpenClaw peut aussi **découvrir automatiquement** les modèles disponibles depuis vLLM lorsque vous l’activez avec `VLLM_API_KEY` (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification) et que vous ne définissez pas d’entrée explicite `models.providers.vllm`.

OpenClaw traite `vllm` comme un fournisseur local compatible OpenAI qui prend en charge
la comptabilité d’usage en streaming, de sorte que les comptes de jetons d’état/contexte peuvent être mis à jour à partir des réponses `stream_options.include_usage`.

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| ID du fournisseur      | `vllm`                                   |
| API              | `openai-completions` (compatible OpenAI) |
| Auth             | Variable d’environnement `VLLM_API_KEY`  |
| URL de base par défaut | `http://127.0.0.1:8000/v1`               |

## Démarrage

<Steps>
  <Step title="Démarrer vLLM avec un serveur compatible OpenAI">
    Votre URL de base doit exposer des points de terminaison `/v1` (par ex. `/v1/models`, `/v1/chat/completions`). vLLM s’exécute généralement sur :

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Définir la variable d’environnement de clé API">
    N’importe quelle valeur fonctionne si votre serveur n’impose pas l’authentification :

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Sélectionner un modèle">
    Remplacez par l’un de vos identifiants de modèle vLLM :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Découverte de modèles (fournisseur implicite)

Lorsque `VLLM_API_KEY` est défini (ou qu’un profil d’authentification existe) et que vous **ne définissez pas** `models.providers.vllm`, OpenClaw interroge :

```text
GET http://127.0.0.1:8000/v1/models
```

et convertit les identifiants renvoyés en entrées de modèle.

<Note>
Si vous définissez explicitement `models.providers.vllm`, la découverte automatique est ignorée et vous devez définir les modèles manuellement.
</Note>

## Configuration explicite (modèles manuels)

Utilisez une configuration explicite lorsque :

- vLLM s’exécute sur un autre hôte ou port
- Vous voulez épingler les valeurs `contextWindow` ou `maxTokens`
- Votre serveur exige une vraie clé API (ou vous voulez contrôler les en-têtes)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Modèle vLLM local",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement de style proxy">
    vLLM est traité comme un backend `/v1` compatible OpenAI de style proxy, et non comme un
    point de terminaison OpenAI natif. Cela signifie :

    | Behavior | Applied? |
    |----------|----------|
    | Formatage natif des requêtes OpenAI | Non |
    | `service_tier` | Non envoyé |
    | `store` dans les réponses | Non envoyé |
    | Indications de cache de prompt | Non envoyées |
    | Formatage de charge utile de compatibilité du raisonnement OpenAI | Non appliqué |
    | En-têtes d’attribution cachés OpenClaw | Non injectés sur les URL de base personnalisées |

  </Accordion>

  <Accordion title="URL de base personnalisée">
    Si votre serveur vLLM s’exécute sur un hôte ou un port non par défaut, définissez `baseUrl` dans la configuration explicite du fournisseur :

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Modèle vLLM distant",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Serveur inaccessible">
    Vérifiez que le serveur vLLM est en cours d’exécution et accessible :

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Si vous voyez une erreur de connexion, vérifiez l’hôte, le port et que vLLM a démarré en mode serveur compatible OpenAI.

  </Accordion>

  <Accordion title="Erreurs d’authentification sur les requêtes">
    Si les requêtes échouent avec des erreurs d’authentification, définissez un vrai `VLLM_API_KEY` correspondant à la configuration de votre serveur, ou configurez explicitement le fournisseur sous `models.providers.vllm`.

    <Tip>
    Si votre serveur vLLM n’impose pas d’authentification, toute valeur non vide pour `VLLM_API_KEY` fonctionne comme signal d’activation pour OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Aucun modèle découvert">
    La découverte automatique nécessite que `VLLM_API_KEY` soit défini **et** qu’aucune entrée explicite `models.providers.vllm` ne soit configurée. Si vous avez défini le fournisseur manuellement, OpenClaw ignore la découverte et n’utilise que vos modèles déclarés.
  </Accordion>
</AccordionGroup>

<Warning>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Warning>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="OpenAI" href="/fr/providers/openai" icon="bolt">
    Fournisseur OpenAI natif et comportement des routes compatibles OpenAI.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et comment les résoudre.
  </Card>
</CardGroup>
