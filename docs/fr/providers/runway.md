---
read_when:
    - Vous voulez utiliser la génération vidéo Runway dans OpenClaw
    - Vous avez besoin de la configuration de la clé API / des variables d’environnement Runway
    - Vous voulez faire de Runway le fournisseur vidéo par défaut
summary: Configuration de la génération vidéo Runway dans OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-06T03:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc615d1a26f7a4b890d29461e756690c858ecb05024cf3c4d508218022da6e76
    source_path: providers/runway.md
    workflow: 15
---

# Runway

OpenClaw fournit un fournisseur intégré `runway` pour la génération vidéo hébergée.

- Id du fournisseur : `runway`
- Authentification : `RUNWAYML_API_SECRET` (canonique) ou `RUNWAY_API_KEY`
- API : génération vidéo Runway basée sur des tâches (polling `GET /v1/tasks/{id}`)

## Démarrage rapide

1. Définissez la clé API :

```bash
openclaw onboard --auth-choice runway-api-key
```

2. Définissez Runway comme fournisseur vidéo par défaut :

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. Demandez à l’agent de générer une vidéo. Runway sera utilisé automatiquement.

## Modes pris en charge

| Mode           | Modèle             | Entrée de référence     |
| -------------- | ------------------ | ----------------------- |
| Texte vers vidéo | `gen4.5` (par défaut) | Aucune               |
| Image vers vidéo | `gen4.5`         | 1 image locale ou distante |
| Vidéo vers vidéo | `gen4_aleph`     | 1 vidéo locale ou distante |

- Les références d’image et de vidéo locales sont prises en charge via des URI de données.
- Le mode vidéo vers vidéo nécessite actuellement spécifiquement `runway/gen4_aleph`.
- Les exécutions texte seul exposent actuellement les ratios d’aspect `16:9` et `9:16`.

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

## Liens associés

- [Génération de vidéos](/tools/video-generation) -- paramètres d’outil partagés, sélection du fournisseur et comportement asynchrone
- [Référence de configuration](/fr/gateway/configuration-reference#agent-defaults)
