---
read_when:
    - Vous souhaitez utiliser la génération vidéo Wan d’Alibaba dans OpenClaw
    - Vous devez configurer une clé API Model Studio ou DashScope pour la génération vidéo
summary: Génération vidéo Wan d’Alibaba Model Studio dans OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T07:25:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw fournit un fournisseur de génération vidéo `alibaba` inclus pour les modèles Wan sur
Alibaba Model Studio / DashScope.

- Fournisseur : `alibaba`
- Authentification préférée : `MODELSTUDIO_API_KEY`
- Également accepté : `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API : génération vidéo asynchrone DashScope / Model Studio

## Premiers pas

<Steps>
  <Step title="Définir une clé API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Définir un modèle vidéo par défaut">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le fournisseur est disponible">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
N’importe laquelle des clés d’authentification acceptées (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) fonctionnera. Le choix d’onboarding `qwen-standard-api-key` configure l’identifiant DashScope partagé.
</Note>

## Modèles Wan intégrés

Le fournisseur `alibaba` inclus enregistre actuellement :

| Référence de modèle       | Mode                           |
| ------------------------- | ------------------------------ |
| `alibaba/wan2.6-t2v`      | Texte vers vidéo               |
| `alibaba/wan2.6-i2v`      | Image vers vidéo               |
| `alibaba/wan2.6-r2v`      | Référence vers vidéo           |
| `alibaba/wan2.6-r2v-flash`| Référence vers vidéo (rapide)  |
| `alibaba/wan2.7-r2v`      | Référence vers vidéo           |

## Limites actuelles

| Paramètre              | Limite                                                    |
| ---------------------- | --------------------------------------------------------- |
| Vidéos de sortie       | Jusqu’à **1** par requête                                 |
| Images d’entrée        | Jusqu’à **1**                                             |
| Vidéos d’entrée        | Jusqu’à **4**                                             |
| Durée                  | Jusqu’à **10 secondes**                                   |
| Contrôles pris en charge | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Image/vidéo de référence | Uniquement des URL distantes `http(s)`                  |

<Warning>
Le mode image/vidéo de référence exige actuellement des **URL distantes http(s)**. Les chemins de fichiers locaux ne sont pas pris en charge pour les entrées de référence.
</Warning>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Relation avec Qwen">
    Le fournisseur `qwen` inclus utilise également les endpoints DashScope hébergés par Alibaba pour
    la génération vidéo Wan. Utilisez :

    - `qwen/...` lorsque vous voulez la surface canonique du fournisseur Qwen
    - `alibaba/...` lorsque vous voulez la surface vidéo Wan directe du fournisseur

    Voir la [documentation du fournisseur Qwen](/fr/providers/qwen) pour plus de détails.

  </Accordion>

  <Accordion title="Priorité des clés d’authentification">
    OpenClaw vérifie les clés d’authentification dans cet ordre :

    1. `MODELSTUDIO_API_KEY` (préférée)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Chacune d’entre elles authentifiera le fournisseur `alibaba`.

  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres communs de l’outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="Qwen" href="/fr/providers/qwen" icon="microchip">
    Configuration du fournisseur Qwen et intégration DashScope.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Valeurs par défaut des agents et configuration des modèles.
  </Card>
</CardGroup>
