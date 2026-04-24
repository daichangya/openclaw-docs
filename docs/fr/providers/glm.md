---
read_when:
    - Vous souhaitez utiliser les modèles GLM dans OpenClaw
    - Vous avez besoin de la convention de nommage des modèles et de la configuration
summary: Vue d’ensemble de la famille de modèles GLM + comment l’utiliser dans OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-24T07:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# Modèles GLM

GLM est une **famille de modèles** (pas une entreprise) disponible via la plateforme Z.AI. Dans OpenClaw, les modèles GLM
sont accessibles via le fournisseur `zai` et des identifiants de modèle comme `zai/glm-5`.

## Premiers pas

<Steps>
  <Step title="Choisir une route d’authentification et exécuter l’onboarding">
    Choisissez l’option d’onboarding correspondant à votre offre Z.AI et à votre région :

    | Choix d’authentification | Idéal pour |
    | ------------------------ | ---------- |
    | `zai-api-key` | Configuration générique par clé API avec auto-détection de l’endpoint |
    | `zai-coding-global` | Utilisateurs de l’offre Coding (global) |
    | `zai-coding-cn` | Utilisateurs de l’offre Coding (région Chine) |
    | `zai-global` | API générale (globale) |
    | `zai-cn` | API générale (région Chine) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Définir GLM comme modèle par défaut">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Exemple de configuration

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` permet à OpenClaw de détecter l’endpoint Z.AI correspondant à partir de la clé et
d’appliquer automatiquement la bonne URL de base. Utilisez les choix régionaux explicites lorsque
vous voulez forcer une surface spécifique d’offre Coding ou d’API générale.
</Tip>

## Catalogue intégré

OpenClaw initialise actuellement le fournisseur groupé `zai` avec ces références GLM :

| Modèle          | Modèle           |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
La référence de modèle groupée par défaut est `zai/glm-5.1`. Les versions GLM et leur disponibilité
peuvent changer ; consultez la documentation Z.AI pour connaître les plus récentes.
</Note>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Auto-détection de l’endpoint">
    Lorsque vous utilisez le choix d’authentification `zai-api-key`, OpenClaw inspecte le format de la clé
    afin de déterminer la bonne URL de base Z.AI. Les choix régionaux explicites
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) remplacent
    l’auto-détection et épinglent directement l’endpoint.
  </Accordion>

  <Accordion title="Détails du fournisseur">
    Les modèles GLM sont servis par le fournisseur d’exécution `zai`. Pour la configuration complète du fournisseur,
    les endpoints régionaux et les capacités supplémentaires, voir
    [Documentation du fournisseur Z.AI](/fr/providers/zai).
  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Fournisseur Z.AI" href="/fr/providers/zai" icon="server">
    Configuration complète du fournisseur Z.AI et endpoints régionaux.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
</CardGroup>
