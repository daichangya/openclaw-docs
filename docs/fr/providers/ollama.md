---
read_when:
    - Vous souhaitez exécuter OpenClaw avec des modèles cloud ou locaux via Ollama
    - Vous avez besoin d’instructions de configuration et de paramétrage pour Ollama
    - Vous souhaitez utiliser des modèles de vision Ollama pour la compréhension d’images
summary: Exécuter OpenClaw avec Ollama (modèles cloud et locaux)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T06:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw s’intègre à l’API native d’Ollama (`/api/chat`) pour les modèles cloud hébergés et les serveurs Ollama locaux/autohébergés. Vous pouvez utiliser Ollama dans trois modes : `Cloud + Local` via un hôte Ollama accessible, `Cloud only` vers `https://ollama.com`, ou `Local only` via un hôte Ollama accessible.

<Warning>
**Utilisateurs d’Ollama à distance** : n’utilisez pas l’URL compatible OpenAI `/v1` (`http://host:11434/v1`) avec OpenClaw. Cela casse l’appel d’outils et les modèles peuvent produire du JSON d’outil brut sous forme de texte brut. Utilisez plutôt l’URL de l’API native Ollama : `baseUrl: "http://host:11434"` (sans `/v1`).
</Warning>

## Prise en main

Choisissez votre méthode de configuration et votre mode préférés.

<Tabs>
  <Tab title="Onboarding (recommandé)">
    **Idéal pour :** le chemin le plus rapide vers une configuration Ollama cloud ou locale fonctionnelle.

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        ```

        Sélectionnez **Ollama** dans la liste des fournisseurs.
      </Step>
      <Step title="Choisir votre mode">
        - **Cloud + Local** — hôte Ollama local plus modèles cloud routés via cet hôte
        - **Cloud only** — modèles Ollama hébergés via `https://ollama.com`
        - **Local only** — modèles locaux uniquement
      </Step>
      <Step title="Sélectionner un modèle">
        `Cloud only` demande `OLLAMA_API_KEY` et suggère des valeurs par défaut cloud hébergées. `Cloud + Local` et `Local only` demandent une URL de base Ollama, détectent les modèles disponibles et téléchargent automatiquement le modèle local sélectionné s’il n’est pas encore disponible. `Cloud + Local` vérifie aussi si cet hôte Ollama est connecté pour l’accès cloud.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Mode non interactif

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Vous pouvez éventuellement spécifier une URL de base ou un modèle personnalisé :

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Configuration manuelle">
    **Idéal pour :** un contrôle total de la configuration cloud ou locale.

    <Steps>
      <Step title="Choisir cloud ou local">
        - **Cloud + Local** : installez Ollama, connectez-vous avec `ollama signin` et routez les requêtes cloud via cet hôte
        - **Cloud only** : utilisez `https://ollama.com` avec une `OLLAMA_API_KEY`
        - **Local only** : installez Ollama depuis [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Télécharger un modèle local (local only)">
        ```bash
        ollama pull gemma4
        # ou
        ollama pull gpt-oss:20b
        # ou
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Activer Ollama pour OpenClaw">
        Pour `Cloud only`, utilisez votre vraie `OLLAMA_API_KEY`. Pour les configurations basées sur un hôte, n’importe quelle valeur de remplacement fonctionne :

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Ou configurez dans votre fichier de configuration
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspecter et définir votre modèle">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Ou définissez le modèle par défaut dans la configuration :

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modèles cloud

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` utilise un hôte Ollama accessible comme point de contrôle pour les modèles locaux et cloud. Il s’agit du flux hybride privilégié par Ollama.

    Utilisez **Cloud + Local** pendant la configuration. OpenClaw demande l’URL de base Ollama, détecte les modèles locaux depuis cet hôte et vérifie si l’hôte est connecté pour l’accès cloud avec `ollama signin`. Lorsque l’hôte est connecté, OpenClaw suggère aussi des valeurs par défaut cloud hébergées comme `kimi-k2.5:cloud`, `minimax-m2.7:cloud` et `glm-5.1:cloud`.

    Si l’hôte n’est pas encore connecté, OpenClaw conserve une configuration locale uniquement jusqu’à ce que vous exécutiez `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` s’exécute sur l’API hébergée d’Ollama à l’adresse `https://ollama.com`.

    Utilisez **Cloud only** pendant la configuration. OpenClaw demande `OLLAMA_API_KEY`, définit `baseUrl: "https://ollama.com"` et initialise la liste des modèles cloud hébergés. Ce chemin **ne nécessite pas** de serveur Ollama local ni `ollama signin`.

    La liste des modèles cloud affichée pendant `openclaw onboard` est remplie en direct depuis `https://ollama.com/api/tags`, limitée à 500 entrées, afin que le sélecteur reflète le catalogue hébergé actuel plutôt qu’une liste statique. Si `ollama.com` est inaccessible ou ne renvoie aucun modèle au moment de la configuration, OpenClaw revient aux suggestions codées en dur précédentes afin que l’onboarding puisse tout de même se terminer.

  </Tab>

  <Tab title="Local only">
    En mode local uniquement, OpenClaw détecte les modèles à partir de l’instance Ollama configurée. Ce chemin est destiné aux serveurs Ollama locaux ou autohébergés.

    OpenClaw suggère actuellement `gemma4` comme valeur par défaut locale.

  </Tab>
</Tabs>

## Détection des modèles (fournisseur implicite)

Lorsque vous définissez `OLLAMA_API_KEY` (ou un profil d’authentification) et que vous **ne définissez pas** `models.providers.ollama`, OpenClaw détecte les modèles depuis l’instance Ollama locale à l’adresse `http://127.0.0.1:11434`.

| Comportement | Détail |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête de catalogue | Interroge `/api/tags` |
| Détection des capacités | Utilise au mieux les recherches `/api/show` pour lire `contextWindow` et détecter les capacités (y compris la vision) |
| Modèles de vision | Les modèles avec une capacité `vision` signalée par `/api/show` sont marqués comme compatibles image (`input: ["text", "image"]`), afin qu’OpenClaw injecte automatiquement les images dans le prompt |
| Détection du raisonnement | Marque `reasoning` à l’aide d’une heuristique sur le nom du modèle (`r1`, `reasoning`, `think`) |
| Limites de tokens | Définit `maxTokens` sur le plafond maximal de tokens Ollama par défaut utilisé par OpenClaw |
| Coûts | Définit tous les coûts à `0` |

Cela évite les entrées de modèle manuelles tout en gardant le catalogue aligné sur l’instance Ollama locale.

```bash
# Voir quels modèles sont disponibles
ollama list
openclaw models list
```

Pour ajouter un nouveau modèle, téléchargez-le simplement avec Ollama :

```bash
ollama pull mistral
```

Le nouveau modèle sera automatiquement détecté et disponible à l’utilisation.

<Note>
Si vous définissez explicitement `models.providers.ollama`, la détection automatique est ignorée et vous devez définir les modèles manuellement. Consultez la section sur la configuration explicite ci-dessous.
</Note>

## Vision et description d’image

Le Plugin Ollama inclus enregistre Ollama comme fournisseur de compréhension de médias compatible avec les images. Cela permet à OpenClaw d’acheminer les demandes explicites de description d’image et les valeurs par défaut de modèle d’image configurées via des modèles de vision Ollama locaux ou hébergés.

Pour la vision locale, téléchargez un modèle qui prend en charge les images :

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Vérifiez ensuite avec la CLI infer :

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` doit être une référence complète au format `<provider/model>`. Lorsqu’il est défini, `openclaw infer image describe` exécute directement ce modèle au lieu d’ignorer la description parce que le modèle prend en charge la vision native.

Pour faire d’Ollama le modèle par défaut de compréhension d’image pour les médias entrants, configurez `agents.defaults.imageModel` :

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Si vous définissez `models.providers.ollama.models` manuellement, marquez les modèles de vision avec la prise en charge d’entrée image :

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw rejette les demandes de description d’image pour les modèles qui ne sont pas marqués comme compatibles image. Avec la détection implicite, OpenClaw lit cette information depuis Ollama lorsque `/api/show` signale une capacité de vision.

## Configuration

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Le chemin d’activation locale uniquement le plus simple passe par une variable d’environnement :

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Si `OLLAMA_API_KEY` est défini, vous pouvez omettre `apiKey` dans l’entrée du fournisseur et OpenClaw le renseignera pour les vérifications de disponibilité.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Utilisez une configuration explicite lorsque vous souhaitez une configuration cloud hébergée, qu’Ollama s’exécute sur un autre hôte/port, que vous voulez imposer des fenêtres de contexte ou des listes de modèles spécifiques, ou que vous voulez des définitions de modèles entièrement manuelles.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Si Ollama s’exécute sur un autre hôte ou port (la configuration explicite désactive la détection automatique, donc définissez les modèles manuellement) :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Sans /v1 - utilisez l’URL de l’API native Ollama
            api: "ollama", // Définissez explicitement pour garantir le comportement natif d’appel d’outils
          },
        },
      },
    }
    ```

    <Warning>
    N’ajoutez pas `/v1` à l’URL. Le chemin `/v1` utilise le mode compatible OpenAI, dans lequel l’appel d’outils n’est pas fiable. Utilisez l’URL de base Ollama sans suffixe de chemin.
    </Warning>

  </Tab>
</Tabs>

### Sélection du modèle

Une fois configurés, tous vos modèles Ollama sont disponibles :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Recherche Web Ollama

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` inclus.

| Propriété | Détail |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Hôte | Utilise votre hôte Ollama configuré (`models.providers.ollama.baseUrl` s’il est défini, sinon `http://127.0.0.1:11434`) |
| Authentification | Sans clé |
| Exigence | Ollama doit être en cours d’exécution et connecté avec `ollama signin` |

Choisissez **Ollama Web Search** pendant `openclaw onboard` ou `openclaw configure --section web`, ou définissez :

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

<Note>
Pour les détails complets de configuration et de comportement, consultez [Ollama Web Search](/fr/tools/ollama-search).
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode compatible OpenAI hérité">
    <Warning>
    **L’appel d’outils n’est pas fiable en mode compatible OpenAI.** Utilisez ce mode uniquement si vous avez besoin du format OpenAI pour un proxy et que vous ne dépendez pas du comportement natif d’appel d’outils.
    </Warning>

    Si vous devez utiliser à la place le point de terminaison compatible OpenAI (par exemple, derrière un proxy qui ne prend en charge que le format OpenAI), définissez explicitement `api: "openai-completions"` :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // défaut : true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ce mode peut ne pas prendre en charge simultanément le streaming et l’appel d’outils. Vous devrez peut-être désactiver le streaming avec `params: { streaming: false }` dans la configuration du modèle.

    Lorsque `api: "openai-completions"` est utilisé avec Ollama, OpenClaw injecte `options.num_ctx` par défaut afin qu’Ollama ne revienne pas silencieusement à une fenêtre de contexte de 4096. Si votre proxy/upstream rejette les champs `options` inconnus, désactivez ce comportement :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Fenêtres de contexte">
    Pour les modèles détectés automatiquement, OpenClaw utilise la fenêtre de contexte signalée par Ollama lorsqu’elle est disponible ; sinon, il revient à la fenêtre de contexte Ollama par défaut utilisée par OpenClaw.

    Vous pouvez remplacer `contextWindow` et `maxTokens` dans la configuration explicite du fournisseur :

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modèles de raisonnement">
    OpenClaw considère par défaut comme compatibles avec le raisonnement les modèles dont le nom contient des éléments comme `deepseek-r1`, `reasoning` ou `think`.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Aucune configuration supplémentaire n’est nécessaire — OpenClaw les marque automatiquement.

  </Accordion>

  <Accordion title="Coûts des modèles">
    Ollama est gratuit et fonctionne en local ; tous les coûts des modèles sont donc définis à 0 $. Cela s’applique aux modèles détectés automatiquement comme aux modèles définis manuellement.
  </Accordion>

  <Accordion title="Embeddings de mémoire">
    Le Plugin Ollama inclus enregistre un fournisseur d’embeddings de mémoire pour la
    [recherche en mémoire](/fr/concepts/memory). Il utilise l’URL de base Ollama
    configurée et la clé API.

    | Propriété | Valeur |
    | ------------- | ------------------- |
    | Modèle par défaut | `nomic-embed-text` |
    | Téléchargement automatique | Oui — le modèle d’embedding est téléchargé automatiquement s’il n’est pas présent localement |

    Pour sélectionner Ollama comme fournisseur d’embeddings pour la recherche en mémoire :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuration du streaming">
    L’intégration Ollama d’OpenClaw utilise l’**API native Ollama** (`/api/chat`) par défaut, qui prend entièrement en charge simultanément le streaming et l’appel d’outils. Aucune configuration particulière n’est nécessaire.

    Pour les requêtes natives `/api/chat`, OpenClaw transmet aussi directement à Ollama le contrôle du mode thinking : `/think off` et `openclaw agent --thinking off` envoient `think: false` au niveau supérieur, tandis que les niveaux de thinking autres que `off` envoient `think: true`.

    <Tip>
    Si vous devez utiliser le point de terminaison compatible OpenAI, consultez la section « Mode compatible OpenAI hérité » ci-dessus. Le streaming et l’appel d’outils peuvent ne pas fonctionner simultanément dans ce mode.
    </Tip>

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Ollama non détecté">
    Assurez-vous qu’Ollama est en cours d’exécution, que vous avez défini `OLLAMA_API_KEY` (ou un profil d’authentification) et que vous **n’avez pas** défini d’entrée explicite `models.providers.ollama` :

    ```bash
    ollama serve
    ```

    Vérifiez que l’API est accessible :

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Aucun modèle disponible">
    Si votre modèle n’est pas listé, téléchargez-le localement ou définissez-le explicitement dans `models.providers.ollama`.

    ```bash
    ollama list  # Voir ce qui est installé
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Ou un autre modèle
    ```

  </Accordion>

  <Accordion title="Connexion refusée">
    Vérifiez qu’Ollama fonctionne sur le bon port :

    ```bash
    # Vérifier si Ollama est en cours d’exécution
    ps aux | grep ollama

    # Ou redémarrer Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
  <Card title="Ollama Web Search" href="/fr/tools/ollama-search" icon="magnifying-glass">
    Détails complets de configuration et de comportement pour la recherche Web propulsée par Ollama.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration.
  </Card>
</CardGroup>
