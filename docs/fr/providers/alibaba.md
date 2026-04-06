---
read_when:
    - Vous voulez utiliser la génération vidéo Alibaba Wan dans OpenClaw
    - Vous avez besoin de configurer une clé API Model Studio ou DashScope pour la génération vidéo
summary: Génération vidéo Wan d’Alibaba Model Studio dans OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-06T03:09:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 97a1eddc7cbd816776b9368f2a926b5ef9ee543f08d151a490023736f67dc635
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw inclut un fournisseur groupé de génération vidéo `alibaba` pour les modèles Wan sur
Alibaba Model Studio / DashScope.

- Fournisseur : `alibaba`
- Authentification préférée : `MODELSTUDIO_API_KEY`
- Également acceptées : `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API : génération vidéo asynchrone DashScope / Model Studio

## Démarrage rapide

1. Définissez une clé API :

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. Définissez un modèle vidéo par défaut :

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

## Modèles Wan intégrés

Le fournisseur groupé `alibaba` enregistre actuellement :

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## Limites actuelles

- Jusqu’à **1** vidéo de sortie par requête
- Jusqu’à **1** image d’entrée
- Jusqu’à **4** vidéos d’entrée
- Jusqu’à **10 secondes** de durée
- Prend en charge `size`, `aspectRatio`, `resolution`, `audio` et `watermark`
- Le mode image/vidéo de référence nécessite actuellement des **URL http(s) distantes**

## Relation avec Qwen

Le fournisseur groupé `qwen` utilise également des endpoints DashScope hébergés par Alibaba pour
la génération vidéo Wan. Utilisez :

- `qwen/...` lorsque vous voulez la surface canonique du fournisseur Qwen
- `alibaba/...` lorsque vous voulez la surface vidéo Wan directe détenue par l’éditeur

## Lié

- [Video Generation](/tools/video-generation)
- [Qwen](/fr/providers/qwen)
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults)
