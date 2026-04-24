---
read_when:
    - Vous voulez utiliser Qwen avec OpenClaw
    - Vous utilisiez auparavant Qwen OAuth
summary: Utiliser Qwen Cloud via le fournisseur qwen intégré d’OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T07:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth a été supprimé.** L’intégration OAuth de niveau gratuit
(`qwen-portal`) qui utilisait les points de terminaison `portal.qwen.ai` n’est plus disponible.
Voir [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) pour le
contexte.

</Warning>

OpenClaw traite désormais Qwen comme un fournisseur intégré de première classe avec l’ID canonique
`qwen`. Le fournisseur intégré cible les points de terminaison Qwen Cloud / Alibaba DashScope et
Coding Plan, et maintient les anciens IDs `modelstudio` comme alias de
compatibilité.

- Fournisseur : `qwen`
- Variable d’environnement préférée : `QWEN_API_KEY`
- Aussi acceptées pour compatibilité : `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Style d’API : compatible OpenAI

<Tip>
Si vous voulez `qwen3.6-plus`, préférez le point de terminaison **Standard (pay-as-you-go)**.
La prise en charge du Coding Plan peut être en retard par rapport au catalogue public.
</Tip>

## Prise en main

Choisissez votre type d’offre et suivez les étapes de configuration.

<Tabs>
  <Tab title="Coding Plan (abonnement)">
    **Idéal pour :** accès par abonnement via le Qwen Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Lancer l’onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Pour le point de terminaison **China** :

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens IDs `modelstudio-*` pour `auth-choice` et les références de modèle `modelstudio/...` fonctionnent encore
    comme alias de compatibilité, mais les nouveaux flux de configuration doivent préférer les
    IDs canoniques `qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Idéal pour :** accès à l’usage via le point de terminaison Standard Model Studio, y compris pour des modèles comme `qwen3.6-plus` qui peuvent ne pas être disponibles sur le Coding Plan.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Lancer l’onboarding">
        Pour le point de terminaison **Global** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Pour le point de terminaison **China** :

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Les anciens IDs `modelstudio-*` pour `auth-choice` et les références de modèle `modelstudio/...` fonctionnent encore
    comme alias de compatibilité, mais les nouveaux flux de configuration doivent préférer les
    IDs canoniques `qwen-*` pour `auth-choice` et les références de modèle `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Types d’offre et points de terminaison

| Offre                      | Région | Choix d’authentification   | Point de terminaison                             |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abonnement)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Le fournisseur sélectionne automatiquement le point de terminaison selon votre choix d’authentification. Les choix canoniques utilisent la famille `qwen-*` ; `modelstudio-*` reste réservé à la compatibilité.
Vous pouvez remplacer cela avec un `baseUrl` personnalisé dans la configuration.

<Tip>
**Gérer les clés :** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentation :** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Qwen intégré. Le catalogue configuré est
sensible au point de terminaison : les configurations Coding Plan omettent les modèles qui ne sont connus pour fonctionner que sur le point de terminaison Standard.

| Référence de modèle        | Entrée      | Contexte  | Remarques                                           |
| -------------------------- | ----------- | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`        | texte, image | 1,000,000 | Modèle par défaut                                   |
| `qwen/qwen3.6-plus`        | texte, image | 1,000,000 | Préférez les points de terminaison Standard lorsque vous avez besoin de ce modèle |
| `qwen/qwen3-max-2026-01-23` | texte      | 262,144   | Ligne Qwen Max                                      |
| `qwen/qwen3-coder-next`    | texte       | 262,144   | Coding                                              |
| `qwen/qwen3-coder-plus`    | texte       | 1,000,000 | Coding                                              |
| `qwen/MiniMax-M2.5`        | texte       | 1,000,000 | Raisonnement activé                                 |
| `qwen/glm-5`               | texte       | 202,752   | GLM                                                 |
| `qwen/glm-4.7`             | texte       | 202,752   | GLM                                                 |
| `qwen/kimi-k2.5`           | texte, image | 262,144  | Moonshot AI via Alibaba                             |

<Note>
La disponibilité peut encore varier selon le point de terminaison et l’offre de facturation, même lorsqu’un modèle est
présent dans le catalogue intégré.
</Note>

## Modules multimodaux complémentaires

Le Plugin `qwen` expose aussi des capacités multimodales sur les points de terminaison
DashScope **Standard** (pas les points de terminaison Coding Plan) :

- **Compréhension vidéo** via `qwen-vl-max-latest`
- **Génération vidéo Wan** via `wan2.6-t2v` (par défaut), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Pour utiliser Qwen comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Voir [Génération vidéo](/fr/tools/video-generation) pour les paramètres partagés de l’outil, la sélection du fournisseur et le comportement de basculement.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Compréhension d’image et de vidéo">
    Le Plugin Qwen intégré enregistre la compréhension des médias pour les images et la vidéo
    sur les points de terminaison DashScope **Standard** (pas les points de terminaison Coding Plan).

    | Propriété      | Valeur                |
    | -------------- | --------------------- |
    | Modèle         | `qwen-vl-max-latest`  |
    | Entrée prise en charge | Images, vidéo |

    La compréhension des médias est automatiquement résolue à partir de l’authentification Qwen configurée — aucune
    configuration supplémentaire n’est nécessaire. Assurez-vous d’utiliser un point de terminaison
    Standard (pay-as-you-go) pour la prise en charge de la compréhension des médias.

  </Accordion>

  <Accordion title="Disponibilité de Qwen 3.6 Plus">
    `qwen3.6-plus` est disponible sur les points de terminaison Standard (pay-as-you-go) de Model Studio :

    - China : `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global : `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Si les points de terminaison Coding Plan renvoient une erreur « unsupported model » pour
    `qwen3.6-plus`, basculez vers Standard (pay-as-you-go) au lieu du couple
    point de terminaison/clé Coding Plan.

  </Accordion>

  <Accordion title="Plan de capacités">
    Le Plugin `qwen` est positionné comme la maison fournisseur de toute la surface
    Qwen Cloud, pas seulement des modèles coding/texte.

    - **Modèles texte/chat :** intégrés maintenant
    - **Appel d’outils, sortie structurée, réflexion :** hérités du transport compatible OpenAI
    - **Génération d’image :** prévue au niveau de la couche Plugin fournisseur
    - **Compréhension image/vidéo :** intégrée maintenant sur le point de terminaison Standard
    - **Parole/audio :** prévue au niveau de la couche Plugin fournisseur
    - **Embeddings/reranking mémoire :** prévus via la surface d’adaptateur d’embedding
    - **Génération vidéo :** intégrée maintenant via la capacité partagée de génération vidéo

  </Accordion>

  <Accordion title="Détails de la génération vidéo">
    Pour la génération vidéo, OpenClaw mappe la région Qwen configurée vers l’hôte
    DashScope AIGC correspondant avant d’envoyer la tâche :

    - Global/Intl : `https://dashscope-intl.aliyuncs.com`
    - China : `https://dashscope.aliyuncs.com`

    Cela signifie qu’un `models.providers.qwen.baseUrl` normal pointant vers l’un ou l’autre des
    hôtes Qwen Coding Plan ou Standard conserve la génération vidéo sur le bon
    point de terminaison vidéo DashScope régional.

    Limites actuelles intégrées de génération vidéo Qwen :

    - Jusqu’à **1** vidéo de sortie par requête
    - Jusqu’à **1** image d’entrée
    - Jusqu’à **4** vidéos d’entrée
    - Jusqu’à **10 secondes** de durée
    - Prend en charge `size`, `aspectRatio`, `resolution`, `audio`, et `watermark`
    - Le mode image/vidéo de référence exige actuellement des **URL http(s) distantes**. Les chemins
      de fichiers locaux sont rejetés dès le départ parce que le point de terminaison vidéo DashScope n’accepte pas
      les buffers locaux téléversés pour ces références.

  </Accordion>

  <Accordion title="Compatibilité d’utilisation en streaming">
    Les points de terminaison natifs Model Studio annoncent une compatibilité d’utilisation en streaming sur le
    transport partagé `openai-completions`. OpenClaw s’appuie maintenant sur les capacités du
    point de terminaison, de sorte que les IDs de fournisseur personnalisés compatibles DashScope ciblant les
    mêmes hôtes natifs héritent du même comportement d’utilisation en streaming au lieu
    d’exiger spécifiquement l’ID de fournisseur intégré `qwen`.

    La compatibilité d’utilisation native en streaming s’applique à la fois aux hôtes Coding Plan et
    aux hôtes Standard compatibles DashScope :

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Régions des points de terminaison multimodaux">
    Les surfaces multimodales (compréhension vidéo et génération vidéo Wan) utilisent les
    points de terminaison DashScope **Standard**, pas les points de terminaison Coding Plan :

    - URL de base Standard Global/Intl : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL de base Standard China : `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Environnement et configuration du daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `QWEN_API_KEY` est
    disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés d’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/fr/providers/alibaba" icon="cloud">
    Ancien fournisseur ModelStudio et remarques de migration.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
