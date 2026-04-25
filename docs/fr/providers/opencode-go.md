---
read_when:
    - Vous souhaitez utiliser le catalogue Go OpenCode
    - Vous avez besoin des références de modèle d’exécution pour les modèles hébergés sur Go
summary: Utiliser le catalogue Go OpenCode avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T18:21:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b2b5ba7f81cc101c3e9abdd79a18dc523a4f18b10242a0513b288fcbcc975e4
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go est le catalogue Go au sein de [OpenCode](/fr/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’identifiant
de fournisseur d’exécution `opencode-go` afin que le routage amont par modèle reste correct.

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Fournisseur d’exécution | `opencode-go`                   |
| Authentification             | `OPENCODE_API_KEY`              |
| Configuration parente     | [OpenCode](/fr/providers/opencode) |

## Catalogue intégré

OpenClaw récupère la plupart des lignes du catalogue Go à partir du registre de modèles pi intégré et
complète les lignes amont actuelles pendant que le registre se met à jour. Exécutez
`openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.

Le fournisseur inclut :

| Référence de modèle                       | Nom                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (limites x3) |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

## Premiers pas

<Tabs>
  <Tab title="Interactif">
    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Définir un modèle Go par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
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
      <Step title="Transmettre directement la clé">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement du routage">
    OpenClaw gère automatiquement le routage par modèle lorsque la référence de modèle utilise
    `opencode-go/...`. Aucune configuration supplémentaire du fournisseur n’est requise.
  </Accordion>

  <Accordion title="Convention de référence d’exécution">
    Les références d’exécution restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
    Cela permet de conserver un routage amont correct par modèle dans les deux catalogues.
  </Accordion>

  <Accordion title="Identifiants partagés">
    La même `OPENCODE_API_KEY` est utilisée par les catalogues Zen et Go. Saisir
    la clé pendant la configuration enregistre les identifiants pour les deux fournisseurs d’exécution.
  </Accordion>
</AccordionGroup>

<Tip>
Voir [OpenCode](/fr/providers/opencode) pour la vue d’ensemble de l’onboarding partagé et la référence complète
des catalogues Zen + Go.
</Tip>

## Liens associés

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Onboarding partagé, vue d’ensemble du catalogue et notes avancées.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
</CardGroup>
