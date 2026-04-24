---
read_when:
    - Vous souhaitez utiliser Groq avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Groq (authentification + sélection de modèle)
title: Groq
x-i18n:
    generated_at: "2026-04-24T07:27:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) fournit une inférence ultra-rapide sur des modèles open source
(Llama, Gemma, Mistral, etc.) à l’aide d’un matériel LPU personnalisé. OpenClaw se connecte
à Groq via son API compatible OpenAI.

| Propriété | Valeur            |
| --------- | ----------------- |
| Provider  | `groq`            |
| Auth      | `GROQ_API_KEY`    |
| API       | Compatible OpenAI |

## Démarrage

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API sur [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Définir la clé API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Exemple de fichier de configuration

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

## Catalogue intégré

Le catalogue de modèles de Groq change fréquemment. Exécutez `openclaw models list | grep groq`
pour voir les modèles actuellement disponibles, ou consultez
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modèle                      | Remarques                         |
| --------------------------- | --------------------------------- |
| **Llama 3.3 70B Versatile** | Usage général, grand contexte     |
| **Llama 3.1 8B Instant**    | Rapide, léger                     |
| **Gemma 2 9B**              | Compact, efficace                 |
| **Mixtral 8x7B**            | Architecture MoE, raisonnement solide |

<Tip>
Utilisez `openclaw models list --provider groq` pour obtenir la liste la plus à jour des
modèles disponibles sur votre compte.
</Tip>

## Transcription audio

Groq fournit aussi une transcription audio rapide basée sur Whisper. Lorsqu’il est configuré comme
provider de compréhension des médias, OpenClaw utilise le modèle
`whisper-large-v3-turbo` de Groq pour transcrire les messages vocaux via la surface partagée `tools.media.audio`.

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

<AccordionGroup>
  <Accordion title="Détails de la transcription audio">
    | Propriété | Valeur |
    |----------|--------|
    | Chemin de configuration partagé | `tools.media.audio` |
    | URL de base par défaut          | `https://api.groq.com/openai/v1` |
    | Modèle par défaut               | `whisper-large-v3-turbo` |
    | Point de terminaison API        | `/audio/transcriptions` compatible OpenAI |
  </Accordion>

  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `GROQ_API_KEY` est
    disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
    `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les
    processus gateway gérés comme daemon. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des providers, références de modèle et comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma complet de configuration, y compris les paramètres provider et audio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Tableau de bord Groq, documentation API et tarification.
  </Card>
  <Card title="Liste des modèles Groq" href="https://console.groq.com/docs/models" icon="list">
    Catalogue officiel des modèles Groq.
  </Card>
</CardGroup>
