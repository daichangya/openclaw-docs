---
read_when:
    - Vous voulez faire passer OpenClaw par un proxy LiteLLM
    - Vous avez besoin du suivi des coûts, de la journalisation ou du routage des modèles via LiteLLM
summary: Exécuter OpenClaw via LiteLLM Proxy pour un accès unifié aux modèles et le suivi des coûts
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T07:27:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) est une passerelle LLM open source qui fournit une API unifiée vers plus de 100 fournisseurs de modèles. Faites passer OpenClaw par LiteLLM pour obtenir un suivi centralisé des coûts, de la journalisation, et la flexibilité de changer de backend sans modifier votre configuration OpenClaw.

<Tip>
**Pourquoi utiliser LiteLLM avec OpenClaw ?**

- **Suivi des coûts** — Voir exactement ce qu’OpenClaw dépense sur tous les modèles
- **Routage des modèles** — Basculer entre Claude, GPT-4, Gemini, Bedrock sans changement de configuration
- **Clés virtuelles** — Créer des clés avec limites de dépenses pour OpenClaw
- **Journalisation** — Journaux complets des requêtes/réponses pour le débogage
- **Replis** — Basculement automatique si votre fournisseur principal est hors service

</Tip>

## Démarrage rapide

<Tabs>
  <Tab title="Intégration (recommandé)">
    **Idéal pour :** le chemin le plus rapide vers une configuration LiteLLM fonctionnelle.

    <Steps>
      <Step title="Lancer l’intégration">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Configuration manuelle">
    **Idéal pour :** un contrôle complet sur l’installation et la configuration.

    <Steps>
      <Step title="Démarrer LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Faire pointer OpenClaw vers LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        C’est tout. OpenClaw route maintenant via LiteLLM.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuration

### Variables d’environnement

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Fichier de configuration

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Clés virtuelles">
    Créez une clé dédiée pour OpenClaw avec des limites de dépenses :

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Utilisez la clé générée comme `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Routage des modèles">
    LiteLLM peut router les requêtes de modèle vers différents backends. Configurez cela dans votre `config.yaml` LiteLLM :

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw continue à demander `claude-opus-4-6` — LiteLLM gère le routage.

  </Accordion>

  <Accordion title="Afficher l’usage">
    Vérifiez le tableau de bord ou l’API LiteLLM :

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Remarques sur le comportement du proxy">
    - LiteLLM s’exécute sur `http://localhost:4000` par défaut
    - OpenClaw se connecte via le point de terminaison `/v1`
      de style proxy compatible OpenAI de LiteLLM
    - La mise en forme de requêtes réservée à OpenAI natif ne s’applique pas via LiteLLM :
      pas de `service_tier`, pas de `store` de Responses, pas d’indices de cache de prompt, ni de
      mise en forme de charge utile compatible raisonnement OpenAI
    - Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
      ne sont pas injectés sur les URL de base LiteLLM personnalisées
  </Accordion>
</AccordionGroup>

<Note>
Pour la configuration générale des fournisseurs et le comportement de repli, voir [Fournisseurs de modèles](/fr/concepts/model-providers).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Documentation LiteLLM" href="https://docs.litellm.ai" icon="book">
    Documentation officielle LiteLLM et référence API.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Vue d’ensemble de tous les fournisseurs, références de modèle et comportement de repli.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration.
  </Card>
  <Card title="Sélection de modèle" href="/fr/concepts/models" icon="brain">
    Comment choisir et configurer les modèles.
  </Card>
</CardGroup>
