---
read_when:
    - Vous voulez utiliser Together AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Together AI (authentification + sélection de modèle)
title: Together AI
x-i18n:
    generated_at: "2026-04-06T03:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: b68fdc15bfcac8d59e3e0c06a39162abd48d9d41a9a64a0ac622cd8e3f80a595
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) fournit un accès à des modèles open source de premier plan, notamment Llama, DeepSeek, Kimi et d’autres, via une API unifiée.

- Fournisseur : `together`
- Authentification : `TOGETHER_API_KEY`
- API : compatible OpenAI
- URL de base : `https://api.together.xyz/v1`

## Démarrage rapide

1. Définissez la clé API (recommandé : la stocker pour la Gateway) :

```bash
openclaw onboard --auth-choice together-api-key
```

2. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Cela définira `together/moonshotai/Kimi-K2.5` comme modèle par défaut.

## Remarque sur l’environnement

Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `TOGETHER_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Catalogue intégré

OpenClaw livre actuellement ce catalogue Together groupé :

| Référence du modèle                                         | Nom                                    | Entrée      | Contexte   | Remarques                       |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | text, image | 262,144    | Modèle par défaut ; reasoning activé |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | text        | 202,752    | Modèle texte généraliste        |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Modèle d’instruction rapide     |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodal                      |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`| Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodal                      |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | text        | 131,072    | Modèle texte généraliste        |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | text        | 131,072    | Modèle de reasoning             |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | text        | 262,144    | Modèle texte Kimi secondaire    |

Le preset d’onboarding définit `together/moonshotai/Kimi-K2.5` comme modèle par défaut.

## Génération vidéo

Le plugin `together` groupé enregistre également la génération vidéo via l’outil partagé
`video_generate`.

- Modèle vidéo par défaut : `together/Wan-AI/Wan2.2-T2V-A14B`
- Modes : text-to-video et flux de référence à image unique
- Prend en charge `aspectRatio` et `resolution`

Pour utiliser Together comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

Voir [Génération vidéo](/tools/video-generation) pour les paramètres
partagés de l’outil, la sélection du fournisseur et le comportement de bascule.
