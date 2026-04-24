---
read_when:
    - Vous souhaitez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification du CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T15:25:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b0d2345c72328e14351d71c5784204dc6ed9dc922f919b6adfac394001c3261
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
  <Step title="Obtenez votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Exécutez l’onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cela vous demandera votre clé API et définira `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifiez que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuration non interactive">
    Pour les installations scriptées ou sans interface, transmettez tous les indicateurs directement :

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
Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence du modèle          | Nom               | Entrée | Contexte  | Sortie max | Notes                                      |
| ---------------------------- | ----------------- | ------ | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text   | 1,000,000 | 384,000    | Modèle par défaut ; interface V4 compatible avec le thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text   | 1,000,000 | 384,000    | Interface V4 compatible avec le thinking   |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text   | 131,072   | 8,192      | Interface sans thinking DeepSeek V3.2      |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text   | 131,072   | 65,536     | Interface V3.2 avec raisonnement activé    |

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw rejoue également
`reasoning_content` de DeepSeek lors des tours de suivi afin que les sessions de thinking avec des appels
d’outils puissent se poursuivre.
</Tip>

## Exemple de configuration

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
