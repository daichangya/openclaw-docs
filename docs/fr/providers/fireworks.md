---
read_when:
    - Vous souhaitez utiliser Fireworks avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Fireworks ou de l’ID du modèle par défaut
summary: Configuration de Fireworks (authentification + sélection de modèle)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T07:26:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) expose des modèles open-weight et routés via une API compatible OpenAI. OpenClaw inclut un plugin fournisseur Fireworks intégré.

| Propriété      | Valeur                                                 |
| -------------- | ------------------------------------------------------ |
| Fournisseur    | `fireworks`                                            |
| Authentification | `FIREWORKS_API_KEY`                                  |
| API            | Chat/completions compatibles OpenAI                    |
| Base URL       | `https://api.fireworks.ai/inference/v1`                |
| Modèle par défaut | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Premiers pas

<Steps>
  <Step title="Configurer l’authentification Fireworks via l’onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Cela stocke votre clé Fireworks dans la configuration OpenClaw et définit le modèle de démarrage Fire Pass comme valeur par défaut.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Exemple non interactif

Pour les configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Référence de modèle                                     | Nom                         | Entrée      | Contexte | Sortie max | Notes                                                                                                                                                 |
| ------------------------------------------------------- | --------------------------- | ----------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`         | Kimi K2.6                   | text,image  | 262,144  | 262,144    | Dernier modèle Kimi sur Fireworks. La réflexion est désactivée pour les requêtes Fireworks K2.6 ; passez directement par Moonshot si vous avez besoin d’une sortie de réflexion Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  | Kimi K2.5 Turbo (Fire Pass) | text,image  | 256,000  | 256,000    | Modèle de démarrage intégré par défaut sur Fireworks                                                                                                  |

<Tip>
Si Fireworks publie un modèle plus récent, par exemple une nouvelle version de Qwen ou Gemma, vous pouvez y basculer directement en utilisant son identifiant de modèle Fireworks sans attendre une mise à jour du catalogue intégré.
</Tip>

## ID de modèles Fireworks personnalisés

OpenClaw accepte également des ID de modèles Fireworks dynamiques. Utilisez l’ID exact du modèle ou du routeur affiché par Fireworks et préfixez-le avec `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Comment fonctionne le préfixage des ID de modèle">
    Chaque référence de modèle Fireworks dans OpenClaw commence par `fireworks/`, suivie de l’ID exact ou du chemin de routeur provenant de la plateforme Fireworks. Par exemple :

    - Modèle routeur : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modèle direct : `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw retire le préfixe `fireworks/` lors de la construction de la requête API et envoie le chemin restant au point de terminaison Fireworks.

  </Accordion>

  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute en dehors de votre shell interactif, assurez-vous que `FIREWORKS_API_KEY` est aussi disponible pour ce processus.

    <Warning>
    Une clé présente uniquement dans `~/.profile` n’aidera pas un daemon launchd/systemd sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour vous assurer que le processus gateway peut la lire.
    </Warning>

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
