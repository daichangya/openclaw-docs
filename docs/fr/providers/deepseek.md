---
read_when:
    - Vous voulez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: configuration de DeepSeek (authentification + sélection de modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T07:26:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles d’IA avec une API compatible OpenAI.

| Propriété | Valeur                     |
| --------- | -------------------------- |
| Fournisseur | `deepseek`               |
| Authentification | `DEEPSEEK_API_KEY` |
| API       | Compatible OpenAI          |
| URL de base | `https://api.deepseek.com` |

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Lancer l’intégration">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cela vous demandera votre clé API et définira `deepseek/deepseek-chat` comme modèle par défaut.

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuration non interactive">
    Pour les installations scriptées ou headless, passez directement tous les indicateurs :

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence de modèle          | Nom               | Entrée | Contexte | Sortie max | Remarques                                         |
| ---------------------------- | ----------------- | ------ | -------- | ---------- | ------------------------------------------------ |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texte  | 131,072  | 8,192      | Modèle par défaut ; surface non réfléchie DeepSeek V3.2 |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texte  | 131,072  | 65,536     | Surface V3.2 avec raisonnement activé            |

<Tip>
Les deux modèles intégrés annoncent actuellement une compatibilité d’usage du streaming dans le code source.
</Tip>

## Exemple de configuration

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de repli.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
