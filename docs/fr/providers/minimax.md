---
read_when:
    - Vous souhaitez utiliser les modèles MiniMax dans OpenClaw
    - Vous avez besoin d’un guide de configuration MiniMax
summary: Utiliser les modèles MiniMax dans OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T07:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Le provider MiniMax d’OpenClaw utilise par défaut **MiniMax M2.7**.

MiniMax fournit aussi :

- la synthèse vocale intégrée via T2A v2
- la compréhension d’image intégrée via `MiniMax-VL-01`
- la génération musicale intégrée via `music-2.5+`
- le `web_search` intégré via l’API de recherche MiniMax Coding Plan

Découpage du provider :

| ID de provider   | Auth      | Capacités                                                      |
| ---------------- | --------- | -------------------------------------------------------------- |
| `minimax`        | Clé API   | Texte, génération d’images, compréhension d’image, voix, recherche web |
| `minimax-portal` | OAuth     | Texte, génération d’images, compréhension d’image              |

## Catalogue intégré

| Modèle                   | Type              | Description                                  |
| ------------------------ | ----------------- | -------------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning)  | Modèle de raisonnement hébergé par défaut    |
| `MiniMax-M2.7-highspeed` | Chat (reasoning)  | Niveau de raisonnement M2.7 plus rapide      |
| `MiniMax-VL-01`          | Vision            | Modèle de compréhension d’image              |
| `image-01`               | Génération d’image | Texte-vers-image et édition image-vers-image |
| `music-2.5+`             | Génération musicale | Modèle musical par défaut                   |
| `music-2.5`              | Génération musicale | Niveau précédent de génération musicale     |
| `music-2.0`              | Génération musicale | Niveau hérité de génération musicale        |
| `MiniMax-Hailuo-2.3`     | Génération vidéo  | Flux texte-vers-vidéo et image de référence  |

## Démarrage

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Idéal pour :** configuration rapide avec MiniMax Coding Plan via OAuth, sans clé API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Cela authentifie contre `api.minimax.io`.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chine">
        <Steps>
          <Step title="Exécuter l’onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Cela authentifie contre `api.minimaxi.com`.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Les configurations OAuth utilisent l’identifiant de provider `minimax-portal`. Les références de modèle suivent la forme `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clé API">
    **Idéal pour :** MiniMax hébergé avec API compatible Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Exécuter l’onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Cela configure `api.minimax.io` comme URL de base.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Chine">
        <Steps>
          <Step title="Exécuter l’onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Cela configure `api.minimaxi.com` comme URL de base.
          </Step>
          <Step title="Vérifier que le modèle est disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Exemple de configuration

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Sur le chemin de streaming compatible Anthropic, OpenClaw désactive par défaut la réflexion MiniMax sauf si vous définissez explicitement `thinking` vous-même. Le point de terminaison de streaming de MiniMax émet `reasoning_content` dans des segments delta de style OpenAI au lieu de blocs de réflexion Anthropic natifs, ce qui peut faire fuiter le raisonnement interne dans la sortie visible si cela reste activé implicitement.
    </Warning>

    <Note>
    Les configurations par clé API utilisent l’identifiant de provider `minimax`. Les références de modèle suivent la forme `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurer via `openclaw configure`

Utilisez l’assistant de configuration interactif pour définir MiniMax sans éditer le JSON :

<Steps>
  <Step title="Lancer l’assistant">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Sélectionner Modèle/auth">
    Choisissez **Model/auth** dans le menu.
  </Step>
  <Step title="Choisir une option d’authentification MiniMax">
    Choisissez l’une des options MiniMax disponibles :

    | Choix d’authentification | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth international (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Chine (Coding Plan) |
    | `minimax-global-api` | Clé API internationale |
    | `minimax-cn-api` | Clé API Chine |

  </Step>
  <Step title="Choisir votre modèle par défaut">
    Sélectionnez votre modèle par défaut lorsque cela vous est demandé.
  </Step>
</Steps>

## Capacités

### Génération d’image

Le Plugin MiniMax enregistre le modèle `image-01` pour l’outil `image_generate`. Il prend en charge :

- **Génération texte-vers-image** avec contrôle du ratio d’aspect
- **Édition image-vers-image** (référence de sujet) avec contrôle du ratio d’aspect
- Jusqu’à **9 images de sortie** par requête
- Jusqu’à **1 image de référence** par requête d’édition
- Ratios d’aspect pris en charge : `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Pour utiliser MiniMax pour la génération d’image, définissez-le comme provider de génération d’image :

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Le Plugin utilise la même authentification `MINIMAX_API_KEY` ou OAuth que les modèles texte. Aucune configuration supplémentaire n’est nécessaire si MiniMax est déjà configuré.

`minimax` et `minimax-portal` enregistrent tous deux `image_generate` avec le même
modèle `image-01`. Les configurations par clé API utilisent `MINIMAX_API_KEY` ; les configurations OAuth peuvent utiliser
à la place le chemin d’authentification intégré `minimax-portal`.

Lorsque l’onboarding ou la configuration par clé API écrit des entrées explicites `models.providers.minimax`,
OpenClaw matérialise `MiniMax-M2.7` et
`MiniMax-M2.7-highspeed` avec `input: ["text", "image"]`.

Le catalogue texte MiniMax intégré lui-même reste des métadonnées texte uniquement tant
que cette configuration provider explicite n’existe pas. La compréhension d’image est exposée séparément
via le provider média `MiniMax-VL-01` détenu par le Plugin.

<Note>
Voir [Génération d’image](/fr/tools/image-generation) pour les paramètres d’outil partagés, la sélection de provider et le comportement de repli.
</Note>

### Génération musicale

Le Plugin intégré `minimax` enregistre aussi la génération musicale via l’outil partagé
`music_generate`.

- Modèle musical par défaut : `minimax/music-2.5+`
- Prend aussi en charge `minimax/music-2.5` et `minimax/music-2.0`
- Contrôles de prompt : `lyrics`, `instrumental`, `durationSeconds`
- Format de sortie : `mp3`
- Les exécutions adossées à une session se détachent via le flux partagé task/status, y compris `action: "status"`

Pour utiliser MiniMax comme provider musical par défaut :

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Voir [Génération musicale](/fr/tools/music-generation) pour les paramètres d’outil partagés, la sélection de provider et le comportement de repli.
</Note>

### Génération vidéo

Le Plugin intégré `minimax` enregistre aussi la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `minimax/MiniMax-Hailuo-2.3`
- Modes : texte-vers-vidéo et flux à image de référence unique
- Prend en charge `aspectRatio` et `resolution`

Pour utiliser MiniMax comme provider vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres d’outil partagés, la sélection de provider et le comportement de repli.
</Note>

### Compréhension d’image

Le Plugin MiniMax enregistre la compréhension d’image séparément du catalogue
texte :

| ID de provider   | Modèle d’image par défaut |
| ---------------- | ------------------------- |
| `minimax`        | `MiniMax-VL-01`           |
| `minimax-portal` | `MiniMax-VL-01`           |

C’est pourquoi le routage automatique des médias peut utiliser la compréhension d’image MiniMax même
lorsque le catalogue du provider texte intégré affiche encore des références de chat M2.7 texte uniquement.

### Recherche web

Le Plugin MiniMax enregistre aussi `web_search` via l’API de recherche MiniMax Coding Plan.

- Identifiant de provider : `minimax`
- Résultats structurés : titres, URL, extraits, requêtes associées
- Variable d’environnement préférée : `MINIMAX_CODE_PLAN_KEY`
- Alias env accepté : `MINIMAX_CODING_API_KEY`
- Repli de compatibilité : `MINIMAX_API_KEY` lorsqu’il pointe déjà vers un jeton coding-plan
- Réutilisation de région : `plugins.entries.minimax.config.webSearch.region`, puis `MINIMAX_API_HOST`, puis les URL de base du provider MiniMax
- La recherche reste sur l’identifiant de provider `minimax` ; la configuration OAuth CN/globale peut toujours orienter la région indirectement via `models.providers.minimax-portal.baseUrl`

La configuration se trouve sous `plugins.entries.minimax.config.webSearch.*`.

<Note>
Voir [Recherche MiniMax](/fr/tools/minimax-search) pour la configuration complète et l’utilisation de la recherche web.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Options de configuration">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Préférez `https://api.minimax.io/anthropic` (compatible Anthropic) ; `https://api.minimax.io/v1` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.api` | Préférez `anthropic-messages` ; `openai-completions` est facultatif pour les charges utiles compatibles OpenAI |
    | `models.providers.minimax.apiKey` | Clé API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Définissez `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Donnez un alias aux modèles que vous voulez dans la liste d’autorisation |
    | `models.mode` | Gardez `merge` si vous voulez ajouter MiniMax en plus des modèles intégrés |
  </Accordion>

  <Accordion title="Valeurs par défaut de réflexion">
    Avec `api: "anthropic-messages"`, OpenClaw injecte `thinking: { type: "disabled" }` à moins que la réflexion ne soit déjà explicitement définie dans les paramètres/la configuration.

    Cela empêche le point de terminaison de streaming MiniMax d’émettre `reasoning_content` dans des segments delta de style OpenAI, ce qui ferait fuiter le raisonnement interne dans la sortie visible.

  </Accordion>

  <Accordion title="Mode rapide">
    `/fast on` ou `params.fastMode: true` réécrit `MiniMax-M2.7` en `MiniMax-M2.7-highspeed` sur le chemin de flux compatible Anthropic.
  </Accordion>

  <Accordion title="Exemple de repli">
    **Idéal pour :** garder votre modèle le plus puissant de dernière génération en primaire, puis basculer vers MiniMax M2.7. L’exemple ci-dessous utilise Opus comme primaire concret ; remplacez-le par votre modèle primaire de dernière génération préféré.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Détails d’utilisation de Coding Plan">
    - API d’utilisation Coding Plan : `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (nécessite une clé coding plan).
    - OpenClaw normalise l’utilisation du coding plan MiniMax vers le même affichage `% restants` que celui utilisé pour les autres providers. Les champs bruts `usage_percent` / `usagePercent` de MiniMax représentent le quota restant, et non le quota consommé ; OpenClaw les inverse donc. Les champs basés sur des compteurs ont la priorité lorsqu’ils sont présents.
    - Lorsque l’API renvoie `model_remains`, OpenClaw préfère l’entrée de modèle de chat, dérive le libellé de fenêtre à partir de `start_time` / `end_time` si nécessaire, et inclut le nom du modèle sélectionné dans le libellé du plan afin que les fenêtres de coding plan soient plus faciles à distinguer.
    - Les instantanés d’utilisation traitent `minimax`, `minimax-cn`, et `minimax-portal` comme une même surface de quota MiniMax, et préfèrent l’OAuth MiniMax stocké avant de revenir aux variables env de clé Coding Plan.
  </Accordion>
</AccordionGroup>

## Remarques

- Les références de modèle suivent le chemin d’authentification :
  - configuration par clé API : `minimax/<model>`
  - configuration OAuth : `minimax-portal/<model>`
- Modèle de chat par défaut : `MiniMax-M2.7`
- Modèle de chat alternatif : `MiniMax-M2.7-highspeed`
- L’onboarding et la configuration directe par clé API écrivent des définitions de modèle explicites avec `input: ["text", "image"]` pour les deux variantes M2.7
- Le catalogue intégré du provider expose actuellement les références de chat comme métadonnées texte uniquement jusqu’à ce qu’une configuration provider MiniMax explicite existe
- Mettez à jour les valeurs de tarification dans `models.json` si vous avez besoin d’un suivi exact des coûts
- Utilisez `openclaw models list` pour confirmer l’identifiant actuel du provider, puis basculez avec `openclaw models set minimax/MiniMax-M2.7` ou `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Lien de parrainage pour MiniMax Coding Plan (10 % de réduction) : [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Voir [Providers de modèles](/fr/concepts/model-providers) pour les règles des providers.
</Note>

## Dépannage

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Cela signifie généralement que le **provider MiniMax n’est pas configuré** (aucune entrée provider correspondante et aucun profil d’authentification/env key MiniMax trouvé). Un correctif pour cette détection se trouve dans **2026.1.12**. Pour corriger :

    - Mettre à niveau vers **2026.1.12** (ou exécuter la source `main`), puis redémarrer le gateway.
    - Exécuter `openclaw configure` et sélectionner une option d’authentification **MiniMax**, ou
    - Ajouter manuellement le bloc `models.providers.minimax` ou `models.providers.minimax-portal` correspondant, ou
    - Définir `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN`, ou un profil d’authentification MiniMax afin que le provider correspondant puisse être injecté.

    Assurez-vous que l’identifiant du modèle est **sensible à la casse** :

    - chemin clé API : `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
    - chemin OAuth : `minimax-portal/MiniMax-M2.7` ou `minimax-portal/MiniMax-M2.7-highspeed`

    Vérifiez ensuite à nouveau avec :

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des providers, références de modèle et comportement de repli.
  </Card>
  <Card title="Génération d’image" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l’outil image et sélection du provider.
  </Card>
  <Card title="Génération musicale" href="/fr/tools/music-generation" icon="music">
    Paramètres partagés de l’outil musique et sélection du provider.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil vidéo et sélection du provider.
  </Card>
  <Card title="Recherche MiniMax" href="/fr/tools/minimax-search" icon="magnifying-glass">
    Configuration de recherche web via MiniMax Coding Plan.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
