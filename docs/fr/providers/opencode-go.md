---
read_when:
    - Vous souhaitez le catalogue OpenCode Go
    - Vous avez besoin des références de modèles runtime pour les modèles hébergés par Go
summary: Utiliser le catalogue OpenCode Go avec la configuration partagée OpenCode
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T07:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go est le catalogue Go dans [OpenCode](/fr/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’identifiant
de fournisseur runtime `opencode-go` afin que le routage amont par modèle reste correct.

| Propriété        | Valeur                          |
| ---------------- | ------------------------------- |
| Fournisseur runtime | `opencode-go`                |
| Authentification | `OPENCODE_API_KEY`              |
| Setup parent     | [OpenCode](/fr/providers/opencode) |

## Catalogue intégré

OpenClaw source le catalogue Go depuis le registre de modèles pi inclus. Exécutez
`openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.

Selon le catalogue pi inclus, le fournisseur comprend :

| Référence de modèle       | Nom                   |
| ------------------------- | --------------------- |
| `opencode-go/glm-5`       | GLM-5                 |
| `opencode-go/glm-5.1`     | GLM-5.1               |
| `opencode-go/kimi-k2.5`   | Kimi K2.5             |
| `opencode-go/kimi-k2.6`   | Kimi K2.6 (limites x3) |
| `opencode-go/mimo-v2-omni`| MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro` | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`| MiniMax M2.5          |
| `opencode-go/minimax-m2.7`| MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`| Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`| Qwen3.6 Plus          |

## Premiers pas

<Tabs>
  <Tab title="Interactif">
    <Steps>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Définir un modèle Go par défaut">
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

  <Tab title="Non interactif">
    <Steps>
      <Step title="Passer la clé directement">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement du routage">
    OpenClaw gère automatiquement le routage par modèle lorsque la référence de modèle utilise
    `opencode-go/...`. Aucune configuration supplémentaire du fournisseur n’est requise.
  </Accordion>

  <Accordion title="Convention des références runtime">
    Les références runtime restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
    Cela maintient le routage amont par modèle correct sur les deux catalogues.
  </Accordion>

  <Accordion title="Identifiants partagés">
    La même `OPENCODE_API_KEY` est utilisée par les catalogues Zen et Go. Saisir
    la clé pendant le setup stocke les identifiants pour les deux fournisseurs runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Voir [OpenCode](/fr/providers/opencode) pour la vue d’ensemble partagée de l’onboarding et la référence complète
des catalogues Zen + Go.
</Tip>

## Articles connexes

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Onboarding partagé, vue d’ensemble du catalogue et notes avancées.
  </Card>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèles et comportement de bascule.
  </Card>
</CardGroup>
