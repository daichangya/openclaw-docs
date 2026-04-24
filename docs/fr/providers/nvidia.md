---
read_when:
    - Vous voulez utiliser gratuitement des modèles ouverts dans OpenClaw
    - Vous avez besoin de la configuration de `NVIDIA_API_KEY`
summary: Utiliser l’API compatible OpenAI de NVIDIA dans OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-24T07:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA fournit une API compatible OpenAI sur `https://integrate.api.nvidia.com/v1` pour
des modèles ouverts gratuits. Authentifiez-vous avec une clé API depuis
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporter la clé et lancer l’intégration">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Définir un modèle NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Si vous passez `--token` au lieu de la variable d’environnement, la valeur se retrouve dans l’historique du shell et
dans la sortie de `ps`. Préférez la variable d’environnement `NVIDIA_API_KEY` lorsque c’est possible.
</Warning>

## Exemple de configuration

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Catalogue intégré

| Référence de modèle                         | Nom                          | Contexte | Sortie max |
| ------------------------------------------- | ---------------------------- | -------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b`  | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`               | Kimi K2.5                    | 262,144  | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`             | Minimax M2.5                 | 196,608  | 8,192      |
| `nvidia/z-ai/glm5`                          | GLM 5                        | 202,752  | 8,192      |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement d’activation automatique">
    Le fournisseur s’active automatiquement lorsque la variable d’environnement `NVIDIA_API_KEY` est définie.
    Aucune configuration explicite du fournisseur n’est requise au-delà de la clé.
  </Accordion>

  <Accordion title="Catalogue et tarification">
    Le catalogue intégré est statique. Les coûts valent par défaut `0` dans le code source, car NVIDIA
    propose actuellement un accès API gratuit pour les modèles listés.
  </Accordion>

  <Accordion title="Point de terminaison compatible OpenAI">
    NVIDIA utilise le point de terminaison standard `/v1` completions. Tout outillage
    compatible OpenAI devrait fonctionner immédiatement avec l’URL de base NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Les modèles NVIDIA sont actuellement gratuits. Consultez
[build.nvidia.com](https://build.nvidia.com/) pour les dernières informations de disponibilité et
de limitation de débit.
</Tip>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
