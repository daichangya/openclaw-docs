---
read_when:
    - Vous souhaitez utiliser Vercel AI Gateway avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI аиҳабы to=final code  դարձել string data="You want model refs like vercel-ai-gateway/openai/gpt-5.4"
summary: Configuration de Vercel AI Gateway (authentification + sélection de modèle)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-24T07:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1fa1c3c6e44e40d7a1fc89d93ee268c19124b746d4644d58014157be7cceeb9
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

Le [Vercel AI Gateway](https://vercel.com/ai-gateway) fournit une API unifiée pour
accéder à des centaines de modèles via un seul point de terminaison.

| Propriété      | Valeur                           |
| -------------- | -------------------------------- |
| Fournisseur    | `vercel-ai-gateway`              |
| Authentification | `AI_GATEWAY_API_KEY`           |
| API            | Compatible Anthropic Messages    |
| Catalogue de modèles | Découvert automatiquement via `/v1/models` |

<Tip>
OpenClaw découvre automatiquement le catalogue `/v1/models` du Gateway, donc
`/models vercel-ai-gateway` inclut des références de modèles actuelles telles que
`vercel-ai-gateway/openai/gpt-5.5` et
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Premiers pas

<Steps>
  <Step title="Définir la clé API">
    Exécutez l’onboarding et choisissez l’option d’authentification AI Gateway :

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Définir un modèle par défaut">
    Ajoutez le modèle à votre configuration OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Exemple non interactif

Pour les configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Abréviation des ID de modèle

OpenClaw accepte des références abrégées de modèles Claude pour Vercel et les normalise à l’exécution :

| Entrée abrégée                     | Référence de modèle normalisée                 |
| ---------------------------------- | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Vous pouvez utiliser soit l’abréviation, soit la référence complète du modèle dans votre
configuration. OpenClaw résout automatiquement la forme canonique.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus daemon">
    Si le Gateway OpenClaw fonctionne comme daemon (launchd/systemd), assurez-vous que
    `AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé définie uniquement dans `~/.profile` ne sera pas visible pour un daemon launchd/systemd
    sauf si cet environnement est explicitement importé. Définissez la clé dans
    `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus gateway puisse
    la lire.
    </Warning>

  </Accordion>

  <Accordion title="Routage du fournisseur">
    Vercel AI Gateway route les requêtes vers le fournisseur amont en fonction du préfixe de la
    référence de modèle. Par exemple, `vercel-ai-gateway/anthropic/claude-opus-4.6` est routé
    via Anthropic, tandis que `vercel-ai-gateway/openai/gpt-5.5` est routé via
    OpenAI et `vercel-ai-gateway/moonshotai/kimi-k2.6` est routé via
    MoonshotAI. Votre unique `AI_GATEWAY_API_KEY` gère l’authentification pour tous les
    fournisseurs amont.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
