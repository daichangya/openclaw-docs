---
read_when:
    - Vous souhaitez utiliser les modèles Mistral dans OpenClaw
    - Vous avez besoin de l’onboarding par clé API Mistral et des références de modèle
summary: Utiliser les modèles Mistral et la transcription Voxtral avec OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-21T07:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw prend en charge Mistral à la fois pour le routage des modèles texte/image (`mistral/...`) et
pour la transcription audio via Voxtral dans la compréhension des médias.
Mistral peut aussi être utilisé pour les embeddings Memory (`memorySearch.provider = "mistral"`).

- Fournisseur : `mistral`
- Authentification : `MISTRAL_API_KEY`
- API : Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Premiers pas

<Steps>
  <Step title="Obtenez votre clé API">
    Créez une clé API dans la [console Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passez directement la clé :

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catalogue LLM intégré

OpenClaw fournit actuellement ce catalogue Mistral intégré :

| Model ref                        | Entrée      | Contexte | Sortie max | Remarques                                                       |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texte, image | 262,144 | 16,384     | Modèle par défaut                                                |
| `mistral/mistral-medium-2508`    | texte, image | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texte, image | 128,000 | 16,384     | Mistral Small 4 ; raisonnement ajustable via l’API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texte, image | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texte        | 256,000 | 4,096      | Codage                                                           |
| `mistral/devstral-medium-latest` | texte        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texte        | 128,000 | 40,000     | Raisonnement activé                                              |

## Transcription audio (Voxtral)

Utilisez Voxtral pour la transcription audio via le pipeline de compréhension des médias.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Le chemin de transcription média utilise `/v1/audio/transcriptions`. Le modèle audio par défaut pour Mistral est `voxtral-mini-latest`.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Raisonnement ajustable (mistral-small-latest)">
    `mistral/mistral-small-latest` correspond à Mistral Small 4 et prend en charge le [raisonnement ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) sur l’API Chat Completions via `reasoning_effort` (`none` minimise la réflexion supplémentaire dans la sortie ; `high` expose les traces complètes de réflexion avant la réponse finale).

    OpenClaw mappe le niveau de **thinking** de la session vers l’API de Mistral :

    | Niveau de thinking OpenClaw                     | Mistral `reasoning_effort` |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Les autres modèles du catalogue Mistral intégré n’utilisent pas ce paramètre. Continuez à utiliser les modèles `magistral-*` si vous voulez le comportement natif de Mistral orienté raisonnement en premier.
    </Note>

  </Accordion>

  <Accordion title="Embeddings Memory">
    Mistral peut fournir des embeddings Memory via `/v1/embeddings` (modèle par défaut : `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Authentification et URL de base">
    - L’authentification Mistral utilise `MISTRAL_API_KEY`.
    - L’URL de base du fournisseur est `https://api.mistral.ai/v1` par défaut.
    - Le modèle par défaut de l’onboarding est `mistral/mistral-large-latest`.
    - Z.AI utilise l’authentification Bearer avec votre clé API.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Compréhension des médias" href="/tools/media-understanding" icon="microphone">
    Configuration de la transcription audio et sélection du fournisseur.
  </Card>
</CardGroup>
