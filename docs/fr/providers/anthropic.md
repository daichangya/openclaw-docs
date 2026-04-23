---
read_when:
    - Vous souhaitez utiliser des modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **CLI Claude** — réutilisation d’une connexion Claude CLI existante sur le même hôte

<Warning>
Le personnel d’Anthropic nous a indiqué que l’usage du style Claude CLI dans OpenClaw est de nouveau autorisé, donc
OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés sauf si
Anthropic publie une nouvelle politique.

Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la voie de production la plus claire et
la plus prévisible.

Documentation publique actuelle d’Anthropic :

- [Référence de la CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Vue d’ensemble du SDK Claude Agent](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Utiliser Claude Code avec votre forfait Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre forfait Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Prise en main

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans la [console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou passez la clé directement :

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="CLI Claude">
    **Idéal pour :** réutiliser une connexion Claude CLI existante sans clé API séparée.

    <Steps>
      <Step title="S’assurer que la CLI Claude est installée et connectée">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Lancer l’onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw détecte et réutilise les identifiants Claude CLI existants.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Les détails de configuration et d’exécution du backend CLI Claude se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Tip>
    Si vous voulez la voie de facturation la plus claire, utilisez plutôt une clé API Anthropic. OpenClaw prend aussi en charge des options de type abonnement de [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), et [Z.AI / GLM](/fr/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de réflexion (Claude 4.6)

Les modèles Claude 4.6 utilisent par défaut la réflexion `adaptive` dans OpenClaw lorsqu’aucun niveau de réflexion explicite n’est défini.

Remplacez-le par message avec `/think:<level>` ou dans les paramètres du modèle :

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentation Anthropic associée :
- [Réflexion adaptative](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Réflexion étendue](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Mise en cache des prompts

OpenClaw prend en charge la fonctionnalité de mise en cache des prompts d’Anthropic pour l’authentification par clé API.

| Value               | Durée du cache | Description                                |
| ------------------- | -------------- | ------------------------------------------ |
| `"short"` (par défaut) | 5 minutes      | Appliqué automatiquement pour l’authentification par clé API |
| `"long"`            | 1 heure        | Cache étendu                               |
| `"none"`            | Pas de cache   | Désactiver la mise en cache des prompts    |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Remplacements de cache par agent">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez des agents spécifiques via `agents.list[].params` :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordre de fusion de la configuration :

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (correspondance par `id`, remplacement par clé)

    Cela permet à un agent de conserver un cache de longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour un trafic bursty/à faible réutilisation.

  </Accordion>

  <Accordion title="Remarques sur Claude via Bedrock">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent la transmission directe de `cacheRetention` lorsqu’elle est configurée.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs par défaut intelligentes pour clé API initialisent aussi `cacheRetention: "short"` pour les références Claude-sur-Bedrock lorsqu’aucune valeur explicite n’est définie.
  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    La bascule partagée `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

    | Commande | Mappé vers |
    |---------|------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Injecté uniquement pour les requêtes directes vers `api.anthropic.com`. Les routes proxy laissent `service_tier` inchangé.
    - Les paramètres explicites `serviceTier` ou `service_tier` remplacent `/fast` lorsque les deux sont définis.
    - Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut se résoudre en `standard`.
    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (image et PDF)">
    Le plugin Anthropic intégré enregistre la compréhension des images et PDF. OpenClaw
    résout automatiquement les capacités média à partir de l’authentification Anthropic configurée — aucune
    configuration supplémentaire n’est nécessaire.

    | Property       | Value                |
    | -------------- | -------------------- |
    | Modèle par défaut  | `claude-opus-4-6`    |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw
    le route automatiquement via le fournisseur de compréhension média Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M (bêta)">
    La fenêtre de contexte 1M d’Anthropic est limitée par une bêta. Activez-la par modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw la mappe vers `anthropic-beta: context-1m-2025-08-07` sur les requêtes.

    <Warning>
    Nécessite un accès au contexte long sur votre identifiant Anthropic. L’authentification par jeton héritée (`sk-ant-oat-*`) est rejetée pour les requêtes de contexte 1M — OpenClaw consigne un avertissement et retombe sur la fenêtre de contexte standard.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M de Claude Opus 4.7">
    `anthropic/claude-opus-4.7` et sa variante `claude-cli` ont une fenêtre de contexte
    1M par défaut — pas besoin de `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L’authentification par jeton Anthropic peut expirer ou être révoquée. Pour les nouvelles configurations, migrez vers une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L’authentification est **par agent**. Les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’onboarding pour cet agent, ou configurez une clé API sur l’hôte de la Gateway, puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’onboarding, ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en cooldown)">
    Vérifiez `openclaw models status --json` pour `auth.unusableProfiles`. Les cooldowns de limitation de débit Anthropic peuvent être limités à un modèle, donc un modèle Anthropic voisin peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin du cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, références de modèle et comportement de bascule.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration et détails d’exécution du backend CLI Claude.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts selon les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
