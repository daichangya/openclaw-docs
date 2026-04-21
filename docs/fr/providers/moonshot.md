---
read_when:
    - Vous souhaitez configurer Moonshot K2 (Moonshot Open Platform) ou Kimi Coding
    - Vous devez comprendre les points de terminaison, les clés et les références de modèle séparés
    - Vous voulez une configuration prête à copier-coller pour l’un ou l’autre provider
summary: Configurer Moonshot K2 vs Kimi Coding (providers + clés séparés)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T07:05:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot fournit l’API Kimi avec des points de terminaison compatibles OpenAI. Configurez le
provider et définissez le modèle par défaut sur `moonshot/kimi-k2.6`, ou utilisez
Kimi Coding avec `kimi/kimi-code`.

<Warning>
Moonshot et Kimi Coding sont des **providers distincts**. Les clés ne sont pas interchangeables, les points de terminaison diffèrent et les références de modèle diffèrent (`moonshot/...` vs `kimi/...`).
</Warning>

## Catalogue de modèles intégré

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Name                   | Reasoning | Input       | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | No        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Yes       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | No        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

Les estimations de coût intégrées pour les modèles K2 actuellement hébergés par Moonshot utilisent les
tarifs à l’usage publiés par Moonshot : Kimi K2.6 coûte 0,16 $/MTok en cache hit,
0,95 $/MTok en entrée et 4,00 $/MTok en sortie ; Kimi K2.5 coûte 0,10 $/MTok en cache hit,
0,60 $/MTok en entrée et 3,00 $/MTok en sortie. Les autres entrées héritées du catalogue conservent
des valeurs de coût nulles comme espaces réservés sauf si vous les remplacez dans la configuration.

## Démarrage

Choisissez votre provider et suivez les étapes de configuration.

<Tabs>
  <Tab title="Moonshot API">
    **Idéal pour :** les modèles Kimi K2 via la Moonshot Open Platform.

    <Steps>
      <Step title="Choisir la région de votre point de terminaison">
        | Choix d’authentification | Point de terminaison         | Région        |
        | ------------------------ | ---------------------------- | ------------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1` | Internationale |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1` | Chine         |
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Ou pour le point de terminaison Chine :

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Exécuter un test smoke en direct">
        Utilisez un répertoire d’état isolé lorsque vous voulez vérifier l’accès au modèle et le suivi
        des coûts sans toucher à vos sessions habituelles :

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        La réponse JSON doit signaler `provider: "moonshot"` et
        `model: "kimi-k2.6"`. L’entrée de transcription de l’assistant stocke l’utilisation
        normalisée des jetons ainsi que le coût estimé sous `usage.cost` lorsque Moonshot renvoie
        des métadonnées d’utilisation.
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Idéal pour :** les tâches orientées code via le point de terminaison Kimi Coding.

    <Note>
    Kimi Coding utilise une clé API différente et un préfixe de provider différent (`kimi/...`) de Moonshot (`moonshot/...`). L’ancienne référence de modèle `kimi/k2p5` reste acceptée comme ID de compatibilité.
    </Note>

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Recherche Web Kimi

OpenClaw fournit également **Kimi** comme provider `web_search`, adossé à la
recherche Web Moonshot.

<Steps>
  <Step title="Exécuter la configuration interactive de la recherche Web">
    ```bash
    openclaw configure --section web
    ```

    Choisissez **Kimi** dans la section de recherche Web pour stocker
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configurer la région de recherche Web et le modèle">
    La configuration interactive demande :

    | Paramètre            | Options                                                              |
    | -------------------- | -------------------------------------------------------------------- |
    | Région API           | `https://api.moonshot.ai/v1` (internationale) ou `https://api.moonshot.cn/v1` (Chine) |
    | Modèle de recherche Web | Par défaut `kimi-k2.6`                                             |

  </Step>
</Steps>

La configuration se trouve sous `plugins.entries.moonshot.config.webSearch` :

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // ou utilisez KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Avancé

<AccordionGroup>
  <Accordion title="Mode thinking natif">
    Moonshot Kimi prend en charge un mode thinking natif binaire :

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Configurez-le par modèle via `agents.defaults.models.<provider/model>.params` :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mappe aussi les niveaux runtime `/think` pour Moonshot :

    | Niveau `/think`      | Comportement Moonshot       |
    | -------------------- | --------------------------- |
    | `/think off`         | `thinking.type=disabled`    |
    | Tout niveau non off  | `thinking.type=enabled`     |

    <Warning>
    Lorsque le thinking Moonshot est activé, `tool_choice` doit être `auto` ou `none`. OpenClaw normalise les valeurs `tool_choice` incompatibles vers `auto` pour assurer la compatibilité.
    </Warning>

    Kimi K2.6 accepte aussi un champ facultatif `thinking.keep` qui contrôle
    la conservation sur plusieurs tours de `reasoning_content`. Définissez-le sur `"all"` pour conserver l’intégralité du
    raisonnement d’un tour à l’autre ; omettez-le (ou laissez-le à `null`) pour utiliser la
    stratégie par défaut du serveur. OpenClaw ne transmet `thinking.keep` que pour
    `moonshot/kimi-k2.6` et le retire des autres modèles.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Compatibilité de l’utilisation en streaming">
    Les points de terminaison Moonshot natifs (`https://api.moonshot.ai/v1` et
    `https://api.moonshot.cn/v1`) annoncent la compatibilité de l’utilisation en streaming sur le
    transport partagé `openai-completions`. OpenClaw s’appuie sur les capacités du point de terminaison,
    de sorte que les ID de provider personnalisés compatibles ciblant les mêmes hôtes Moonshot natifs
    héritent du même comportement d’utilisation en streaming.

    Avec la tarification intégrée K2.6, l’utilisation en streaming qui inclut les jetons d’entrée, de sortie
    et de lecture de cache est aussi convertie en coût local estimé en USD pour
    `/status`, `/usage full`, `/usage cost`, et la comptabilité de session
    adossée aux transcriptions.

  </Accordion>

  <Accordion title="Référence des points de terminaison et des références de modèle">
    | Provider    | Préfixe de référence de modèle | Point de terminaison         | Variable d’environnement d’authentification |
    | ----------- | ------------------------------ | ---------------------------- | ------------------------------------------- |
    | Moonshot    | `moonshot/`                    | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                          |
    | Moonshot CN | `moonshot/`                    | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                          |
    | Kimi Coding | `kimi/`                        | Point de terminaison Kimi Coding | `KIMI_API_KEY`                          |
    | Recherche Web | N/A                          | Identique à la région API Moonshot | `KIMI_API_KEY` ou `MOONSHOT_API_KEY` |

    - La recherche Web Kimi utilise `KIMI_API_KEY` ou `MOONSHOT_API_KEY`, et utilise par défaut `https://api.moonshot.ai/v1` avec le modèle `kimi-k2.6`.
    - Remplacez les métadonnées de tarification et de contexte dans `models.providers` si nécessaire.
    - Si Moonshot publie des limites de contexte différentes pour un modèle, ajustez `contextWindow` en conséquence.

  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les providers, les références de modèle et le comportement de failover.
  </Card>
  <Card title="Recherche Web" href="/tools/web-search" icon="magnifying-glass">
    Configurer les providers de recherche Web, y compris Kimi.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de configuration pour les providers, les modèles et les plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Gestion des clés API Moonshot et documentation.
  </Card>
</CardGroup>
