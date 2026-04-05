---
read_when:
    - Vous voulez faire passer OpenClaw par un proxy LiteLLM
    - Vous avez besoin du suivi des coûts, de la journalisation ou du routage des modèles via LiteLLM
summary: Exécuter OpenClaw via LiteLLM Proxy pour un accès unifié aux modèles et le suivi des coûts
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T12:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) est une passerelle LLM open source qui fournit une API unifiée vers plus de 100 fournisseurs de modèles. Faites passer OpenClaw par LiteLLM pour bénéficier d’un suivi centralisé des coûts, de la journalisation et de la souplesse nécessaire pour changer de backend sans modifier votre configuration OpenClaw.

## Pourquoi utiliser LiteLLM avec OpenClaw ?

- **Suivi des coûts** — voyez exactement ce qu’OpenClaw dépense sur l’ensemble des modèles
- **Routage des modèles** — passez de Claude à GPT-4, Gemini, Bedrock sans changement de configuration
- **Clés virtuelles** — créez des clés avec des limites de dépenses pour OpenClaw
- **Journalisation** — journaux complets des requêtes/réponses pour le débogage
- **Replis** — failover automatique si votre fournisseur principal est indisponible

## Démarrage rapide

### Via l’onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Configuration manuelle

1. Démarrez LiteLLM Proxy :

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Pointez OpenClaw vers LiteLLM :

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

C’est tout. OpenClaw route désormais via LiteLLM.

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

## Clés virtuelles

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

## Routage des modèles

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

OpenClaw continue de demander `claude-opus-4-6` — LiteLLM se charge du routage.

## Consulter l’utilisation

Consultez le tableau de bord ou l’API de LiteLLM :

```bash
# Key info
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Spend logs
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Remarques

- LiteLLM s’exécute sur `http://localhost:4000` par défaut
- OpenClaw se connecte via le point de terminaison `/v1`
  compatible OpenAI de type proxy de LiteLLM
- La mise en forme des requêtes réservée à OpenAI natif ne s’applique pas via LiteLLM :
  pas de `service_tier`, pas de `store` de Responses, pas d’indices de cache de prompt, ni de
  mise en forme de charge utile de compatibilité de raisonnement OpenAI
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`, `User-Agent`)
  ne sont pas injectés sur des base URL LiteLLM personnalisées

## Voir aussi

- [Documentation LiteLLM](https://docs.litellm.ai)
- [Model Providers](/concepts/model-providers)
