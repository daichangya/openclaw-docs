---
read_when:
    - Vous souhaitez utiliser la génération vidéo Runway dans OpenClaw
    - Vous avez besoin de la configuration de clé API / env Runway
    - Vous souhaitez faire de Runway le provider vidéo par défaut
summary: Configuration de la génération vidéo Runway dans OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-24T07:28:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 15
---

OpenClaw inclut un provider intégré `runway` pour la génération vidéo hébergée.

| Propriété    | Valeur                                                              |
| ------------ | ------------------------------------------------------------------- |
| ID de provider | `runway`                                                          |
| Auth         | `RUNWAYML_API_SECRET` (canonique) ou `RUNWAY_API_KEY`              |
| API          | Génération vidéo Runway basée sur des tâches (`GET /v1/tasks/{id}` polling) |

## Démarrage

<Steps>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Définir Runway comme provider vidéo par défaut">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Générer une vidéo">
    Demandez à l’agent de générer une vidéo. Runway sera utilisé automatiquement.
  </Step>
</Steps>

## Modes pris en charge

| Mode           | Modèle            | Entrée de référence        |
| -------------- | ----------------- | -------------------------- |
| Texte-vers-vidéo | `gen4.5` (par défaut) | Aucune                 |
| Image-vers-vidéo | `gen4.5`         | 1 image locale ou distante |
| Vidéo-vers-vidéo | `gen4_aleph`     | 1 vidéo locale ou distante |

<Note>
Les références d’images et de vidéos locales sont prises en charge via des URI de données. Les exécutions texte uniquement exposent actuellement les ratios d’aspect `16:9` et `9:16`.
</Note>

<Warning>
Le mode vidéo-vers-vidéo nécessite actuellement spécifiquement `runway/gen4_aleph`.
</Warning>

## Configuration

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de variables d’environnement">
    OpenClaw reconnaît à la fois `RUNWAYML_API_SECRET` (canonique) et `RUNWAY_API_KEY`.
    L’une ou l’autre variable authentifiera le provider Runway.
  </Accordion>

  <Accordion title="Polling des tâches">
    Runway utilise une API basée sur des tâches. Après l’envoi d’une requête de génération, OpenClaw
    sonde `GET /v1/tasks/{id}` jusqu’à ce que la vidéo soit prête. Aucune
    configuration supplémentaire n’est nécessaire pour ce comportement de polling.
  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l’outil, sélection du provider et comportement asynchrone.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults" icon="gear">
    Paramètres par défaut d’agent, y compris le modèle de génération vidéo.
  </Card>
</CardGroup>
