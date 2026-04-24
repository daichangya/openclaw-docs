---
read_when:
    - Vous voulez utiliser Arcee AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration d’Arcee AI (authentification + sélection du modèle)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T07:25:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) fournit un accès à la famille de modèles Trinity de type mixture-of-experts via une API compatible OpenAI. Tous les modèles Trinity sont sous licence Apache 2.0.

Les modèles Arcee AI peuvent être utilisés directement via la plateforme Arcee ou via [OpenRouter](/fr/providers/openrouter).

| Property | Value                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (direct) ou `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API      | Compatible OpenAI                                                                     |
| Base URL | `https://api.arcee.ai/api/v1` (direct) ou `https://openrouter.ai/api/v1` (OpenRouter) |

## Bien démarrer

<Tabs>
  <Tab title="Direct (plateforme Arcee)">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé API sur [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé API sur [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Définir un modèle par défaut">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Les mêmes références de modèle fonctionnent à la fois pour les configurations directes et OpenRouter (par exemple `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration non interactive

<Tabs>
  <Tab title="Direct (plateforme Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Catalogue intégré

OpenClaw fournit actuellement ce catalogue Arcee intégré :

| Model ref                      | Name                   | Input | Context | Cost (in/out per 1M) | Notes                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Modèle par défaut ; raisonnement activé   |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Usage général ; 400B paramètres, 13B actifs |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Rapide et économique ; appels de fonction |

<Tip>
Le preset d’onboarding définit `arcee/trinity-large-thinking` comme modèle par défaut.
</Tip>

## Fonctionnalités prises en charge

| Feature                                       | Supported                    |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Oui                          |
| Tool use / function calling                   | Oui                          |
| Structured output (JSON mode and JSON schema) | Oui                          |
| Extended thinking                             | Oui (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `ARCEEAI_API_KEY`
    (ou `OPENROUTER_API_KEY`) est disponible pour ce processus (par exemple dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>

  <Accordion title="Routage OpenRouter">
    Lorsque vous utilisez des modèles Arcee via OpenRouter, les mêmes références de modèle `arcee/*` s’appliquent.
    OpenClaw gère le routage de manière transparente en fonction de votre choix d’authentification. Voir la
    [documentation du fournisseur OpenRouter](/fr/providers/openrouter) pour les détails de configuration spécifiques à OpenRouter.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/fr/providers/openrouter" icon="shuffle">
    Accédez aux modèles Arcee et à beaucoup d’autres via une seule clé API.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
</CardGroup>
