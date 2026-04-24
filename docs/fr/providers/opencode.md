---
read_when:
    - Vous voulez un accès aux modèles hébergés par OpenCode
    - Vous voulez choisir entre les catalogues Zen et Go
summary: Utiliser les catalogues OpenCode Zen et Go avec OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T07:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode expose deux catalogues hébergés dans OpenClaw :

| Catalogue | Préfixe            | Fournisseur d’exécution |
| --------- | ------------------ | ----------------------- |
| **Zen**   | `opencode/...`     | `opencode`              |
| **Go**    | `opencode-go/...`  | `opencode-go`           |

Les deux catalogues utilisent la même clé API OpenCode. OpenClaw garde les IDs de fournisseur d’exécution
séparés afin que le routage amont par modèle reste correct, mais l’onboarding et la documentation les traitent
comme une seule configuration OpenCode.

## Prise en main

<Tabs>
  <Tab title="Catalogue Zen">
    **Idéal pour :** le proxy multi-modèle OpenCode organisé (Claude, GPT, Gemini).

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou passez directement la clé :

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Zen comme modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalogue Go">
    **Idéal pour :** la gamme Kimi, GLM et MiniMax hébergée par OpenCode.

    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou passez directement la clé :

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Go comme modèle par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Exemple de configuration

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catalogues intégrés

### Zen

| Propriété        | Valeur                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Fournisseur d’exécution | `opencode`                                                       |
| Exemples de modèles | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Propriété        | Valeur                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Fournisseur d’exécution | `opencode-go`                                                     |
| Exemples de modèles | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de clé API">
    `OPENCODE_ZEN_API_KEY` est aussi pris en charge comme alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Identifiants partagés">
    Saisir une seule clé OpenCode pendant la configuration enregistre les identifiants pour les deux fournisseurs
    d’exécution. Vous n’avez pas besoin de lancer l’onboarding séparément pour chaque catalogue.
  </Accordion>

  <Accordion title="Facturation et tableau de bord">
    Vous vous connectez à OpenCode, ajoutez les détails de facturation, puis copiez votre clé API. La facturation
    et la disponibilité des catalogues sont gérées depuis le tableau de bord OpenCode.
  </Accordion>

  <Accordion title="Comportement de relecture Gemini">
    Les références OpenCode adossées à Gemini restent sur le chemin proxy-Gemini, donc OpenClaw conserve
    l’assainissement de signature de pensée Gemini sans activer la
    validation native de relecture Gemini ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Comportement de relecture non-Gemini">
    Les références OpenCode non-Gemini conservent la politique minimale de relecture compatible OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Saisir une seule clé OpenCode pendant la configuration enregistre les identifiants pour les fournisseurs d’exécution Zen et
Go, vous n’avez donc besoin de lancer l’onboarding qu’une seule fois.
</Tip>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
