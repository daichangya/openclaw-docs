---
read_when:
    - Vous voulez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Groq (authentification + sélection de modèle)
title: Groq
x-i18n:
    generated_at: "2026-04-05T12:51:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e27532cafcdaf1ac336fa310e08e4e3245d2d0eb0e94e0bcf42c532c6a9a80b
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) fournit une inférence ultra-rapide sur des modèles open source
(Llama, Gemma, Mistral, etc.) à l’aide d’un matériel LPU personnalisé. OpenClaw se connecte
à Groq via son API compatible OpenAI.

- Fournisseur : `groq`
- Authentification : `GROQ_API_KEY`
- API : compatible OpenAI

## Démarrage rapide

1. Obtenez une clé API depuis [console.groq.com/keys](https://console.groq.com/keys).

2. Définissez la clé API :

```bash
export GROQ_API_KEY="gsk_..."
```

3. Définissez un modèle par défaut :

```json5
{
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Exemple de fichier de configuration

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Transcription audio

Groq fournit aussi une transcription audio rapide basée sur Whisper. Lorsqu’il est configuré comme
fournisseur de compréhension média, OpenClaw utilise le modèle `whisper-large-v3-turbo` de Groq
pour transcrire les messages vocaux via la surface partagée `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

## Remarque sur l’environnement

Si la Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GROQ_API_KEY` est
disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).

## Remarques sur l’audio

- Chemin de configuration partagé : `tools.media.audio`
- Base URL audio Groq par défaut : `https://api.groq.com/openai/v1`
- Modèle audio Groq par défaut : `whisper-large-v3-turbo`
- La transcription audio Groq utilise le chemin compatible OpenAI `/audio/transcriptions`

## Modèles disponibles

Le catalogue de modèles de Groq change fréquemment. Exécutez `openclaw models list | grep groq`
pour voir les modèles actuellement disponibles, ou consultez
[console.groq.com/docs/models](https://console.groq.com/docs/models).

Choix populaires :

- **Llama 3.3 70B Versatile** - usage général, grand contexte
- **Llama 3.1 8B Instant** - rapide, léger
- **Gemma 2 9B** - compact, efficace
- **Mixtral 8x7B** - architecture MoE, raisonnement performant

## Liens

- [Console Groq](https://console.groq.com)
- [Documentation API](https://console.groq.com/docs)
- [Liste des modèles](https://console.groq.com/docs/models)
- [Tarification](https://groq.com/pricing)
