---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles fournisseur par fournisseur
    - Vous voulez des exemples de configuration ou des commandes d’intégration CLI pour les fournisseurs de modèles
summary: vue d’ensemble des fournisseurs de modèles avec exemples de configuration + flux CLI
title: fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-24T07:07:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Cette page couvre les **fournisseurs LLM/modèle** (et non les canaux de chat comme WhatsApp/Telegram).
Pour les règles de sélection de modèle, voir [/concepts/models](/fr/concepts/models).

## Règles rapides

- Les références de modèle utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
- `agents.defaults.models` agit comme une liste d’autorisation lorsqu’il est défini.
- Assistants CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` est une métadonnée native du modèle ; `contextTokens` est la limite effective du runtime.
- Règles de repli, sondes de cooldown et persistance des redéfinitions de session : [Basculement de modèle](/fr/concepts/model-failover).
- Les routes de la famille OpenAI sont spécifiques au préfixe : `openai/<model>` utilise le fournisseur direct par clé API
  OpenAI dans Pi, `openai-codex/<model>` utilise Codex OAuth dans Pi,
  et `openai/<model>` avec `agents.defaults.embeddedHarness.runtime: "codex"` utilise le harnais natif du serveur d’app Codex. Voir [OpenAI](/fr/providers/openai)
  et [Harnais Codex](/fr/plugins/codex-harness).
- L’activation automatique de Plugin suit cette même frontière : `openai-codex/<model>` appartient
  au Plugin OpenAI, tandis que le Plugin Codex est activé par
  `embeddedHarness.runtime: "codex"` ou les références héritées `codex/<model>`.
- GPT-5.5 est actuellement disponible via des routes d’abonnement/OAuth :
  `openai-codex/gpt-5.5` dans Pi ou `openai/gpt-5.5` avec le harnais du serveur d’app
  Codex. La route directe par clé API pour `openai/gpt-5.5` est prise en charge dès que
  OpenAI active GPT-5.5 sur l’API publique ; jusque-là utilisez des modèles activés pour l’API
  tels que `openai/gpt-5.4` pour les configurations `OPENAI_API_KEY`.

## Comportement des fournisseurs possédé par le Plugin

La plupart de la logique spécifique au fournisseur vit dans les plugins de fournisseur (`registerProvider(...)`) tandis qu’OpenClaw conserve la boucle d’inférence générique. Les plugins gèrent l’intégration, les catalogues de modèles, le mappage auth vers les variables d’environnement, la normalisation transport/configuration, le nettoyage du schéma des outils, la classification du repli, le rafraîchissement OAuth, le rapport d’usage, les profils de réflexion/raisonnement, etc.

La liste complète des hooks du SDK de fournisseur et des exemples de plugins intégrés se trouve dans [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins). Un fournisseur qui a besoin d’un exécuteur de requête totalement personnalisé relève d’une surface d’extension distincte, plus profonde.

<Note>
Le `capabilities` du runtime du fournisseur est une métadonnée partagée du runner (famille de fournisseur, particularités de transcription/outillage, indications de transport/cache). Ce n’est pas la même chose que le [modèle de capacité public](/fr/plugins/architecture#public-capability-model), qui décrit ce qu’un Plugin enregistre (inférence de texte, parole, etc.).
</Note>

## Rotation des clés API

- Prend en charge la rotation générique de fournisseur pour certains fournisseurs sélectionnés.
- Configurez plusieurs clés via :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (redéfinition live unique, priorité maximale)
  - `<PROVIDER>_API_KEYS` (liste séparée par virgules ou points-virgules)
  - `<PROVIDER>_API_KEY` (clé principale)
  - `<PROVIDER>_API_KEY_*` (liste numérotée, par ex. `<PROVIDER>_API_KEY_1`)
- Pour les fournisseurs Google, `GOOGLE_API_KEY` est également inclus comme repli.
- L’ordre de sélection des clés préserve la priorité et déduplique les valeurs.
- Les requêtes sont réessayées avec la clé suivante uniquement sur des réponses de limitation de débit (par
  exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, ou des messages périodiques de limite d’usage).
- Les échecs hors limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
- Lorsque toutes les clés candidates échouent, l’erreur finale du dernier essai est renvoyée.

## Fournisseurs intégrés (catalogue pi-ai)

OpenClaw est livré avec le catalogue pi‑ai. Ces fournisseurs ne nécessitent **aucune**
configuration `models.providers` ; il suffit de définir l’authentification + choisir un modèle.

### OpenAI

- Fournisseur : `openai`
- Authentification : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (redéfinition unique)
- Exemples de modèles : `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- La prise en charge directe par API de GPT-5.5 est prête ici dès qu’OpenAI expose GPT-5.5 sur l’API
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Redéfinition par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- Le préchauffage OpenAI Responses WebSocket est activé par défaut via `params.openaiWsWarmup` (`true`/`false`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes directes `openai/*` Responses vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` si vous voulez un niveau explicite plutôt que le basculement partagé `/fast`
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) ne s’appliquent que sur le trafic OpenAI natif vers `api.openai.com`, pas
  aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent également le `store` de Responses, les indications de cache de prompt et
  la mise en forme de charge utile compatible raisonnement OpenAI ; les routes proxy non
- `openai/gpt-5.3-codex-spark` est intentionnellement supprimé dans OpenClaw car les requêtes live à l’API OpenAI le rejettent et le catalogue Codex actuel ne l’expose pas

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Authentification : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (redéfinition unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes publiques directes Anthropic prennent en charge le basculement partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé API et OAuth envoyé vers `api.anthropic.com` ; OpenClaw le mappe vers Anthropic `service_tier` (`auto` vs `standard_only`)
- Remarque Anthropic : le personnel Anthropic nous a dit que l’usage de type Claude CLI dans le style OpenClaw est de nouveau autorisé ; OpenClaw considère donc la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés pour cette intégration sauf si Anthropic publie une nouvelle politique.
- Le jeton de configuration Anthropic reste disponible comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Fournisseur : `openai-codex`
- Authentification : OAuth (ChatGPT)
- Référence de modèle Pi : `openai-codex/gpt-5.5`
- Référence du harnais natif du serveur d’app Codex : `openai/gpt-5.5` avec `agents.defaults.embeddedHarness.runtime: "codex"`
- Références de modèle héritées : `codex/gpt-*`
- Frontière de Plugin : `openai-codex/*` charge le Plugin OpenAI ; le Plugin natif de serveur d’app Codex
  est sélectionné uniquement par le runtime Codex harness ou les références héritées
  `codex/*`.
- CLI : `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Redéfinition par modèle Pi via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` ou `"auto"`)
- `params.serviceTier` est également transmis sur les requêtes natives Codex Responses (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) ne sont attachés qu’au trafic Codex natif vers
  `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage le même basculement `/fast` et la même configuration `params.fastMode` que `openai/*` direct ; OpenClaw le mappe vers `service_tier=priority`
- `openai-codex/gpt-5.5` conserve `contextWindow = 1000000` natif et un `contextTokens = 272000` de runtime par défaut ; redéfinissez la limite runtime avec `models.providers.openai-codex.models[].contextTokens`
- Remarque de politique : OpenAI Codex OAuth est explicitement pris en charge pour les outils/flux de travail externes comme OpenClaw.
- L’accès actuel à GPT-5.5 utilise cette route OAuth/abonnement jusqu’à ce qu’OpenAI active GPT-5.5 sur l’API publique.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Autres options hébergées de type abonnement

- [Qwen Cloud](/fr/providers/qwen) : surface de fournisseur Qwen Cloud plus Alibaba DashScope et mappage de point de terminaison Coding Plan
- [MiniMax](/fr/providers/minimax) : accès MiniMax Coding Plan par OAuth ou clé API
- [Modèles GLM](/fr/providers/glm) : points de terminaison Z.AI Coding Plan ou API générale

### OpenCode

- Authentification : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur de runtime Zen : `opencode`
- Fournisseur de runtime Go : `opencode-go`
- Exemples de modèles : `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clé API)

- Fournisseur : `google`
- Authentification : `GEMINI_API_KEY`
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, repli `GOOGLE_API_KEY`, et `OPENCLAW_LIVE_GEMINI_KEY` (redéfinition unique)
- Exemples de modèles : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Les exécutions directes Gemini acceptent aussi `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou l’ancien `cached_content`) pour transmettre un handle natif fournisseur
  `cachedContents/...` ; les hits de cache Gemini apparaissent comme `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Authentification : Vertex utilise gcloud ADC ; Gemini CLI utilise son flux OAuth
- Attention : Gemini CLI OAuth dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après l’usage de clients tiers. Consultez les conditions de Google et utilisez un compte non critique si vous choisissez de continuer.
- Gemini CLI OAuth est fourni dans le Plugin `google` intégré.
  - Installez d’abord Gemini CLI :
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Activer : `openclaw plugins enable google`
  - Connexion : `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
  - Remarque : vous ne collez **pas** d’identifiant client ni de secret dans `openclaw.json`. Le flux de connexion CLI stocke
    les jetons dans les profils d’authentification sur l’hôte Gateway.
  - Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte Gateway.
  - Les réponses JSON Gemini CLI sont analysées depuis `response` ; l’usage se replie sur
    `stats`, avec `stats.cached` normalisé en `cacheRead` OpenClaw.

### Z.AI (GLM)

- Fournisseur : `zai`
- Authentification : `ZAI_API_KEY`
- Exemple de modèle : `zai/glm-5.1`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Alias : `z.ai/*` et `z-ai/*` sont normalisés en `zai/*`
  - `zai-api-key` détecte automatiquement le point de terminaison Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global` et `zai-cn` forcent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Authentification : `AI_GATEWAY_API_KEY`
- Exemples de modèles : `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Fournisseur : `kilocode`
- Authentification : `KILOCODE_API_KEY`
- Exemple de modèle : `kilocode/kilo/auto`
- CLI : `openclaw onboard --auth-choice kilocode-api-key`
- URL de base : `https://api.kilo.ai/api/gateway/`
- Le catalogue statique de repli fournit `kilocode/kilo/auto` ; la découverte live
  `https://api.kilo.ai/api/gateway/models` peut étendre davantage le catalogue
  runtime.
- Le routage amont exact derrière `kilocode/kilo/auto` est géré par Kilo Gateway,
  pas codé en dur dans OpenClaw.

Voir [/providers/kilocode](/fr/providers/kilocode) pour les détails de configuration.

### Autres plugins de fournisseur intégrés

| Fournisseur             | Id                               | Variable d’environnement d’authentification                | Exemple de modèle                              |
| ----------------------- | -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                         | `byteplus-plan/ark-code-latest`                |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                         | `cerebras/zai-glm-4.7`                         |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                            | —                                              |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`       | —                                              |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                             | —                                              |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`          |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                         | `kilocode/kilo/auto`                           |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                       | `kimi/kimi-code`                               |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                  | `minimax/MiniMax-M2.7`                         |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                          | `mistral/mistral-large-latest`                 |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                         | `moonshot/kimi-k2.6`                           |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                           | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                       | `openrouter/auto`                              |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                          | `qianfan/deepseek-v3.2`                        |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                          |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                          | `stepfun/step-3.5-flash`                       |
| Together                | `together`                       | `TOGETHER_API_KEY`                                         | `together/moonshotai/Kimi-K2.5`                |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                           | —                                              |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                       | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                   | `volcengine-plan/ark-code-latest`              |
| xAI                     | `xai`                            | `XAI_API_KEY`                                              | `xai/grok-4`                                   |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                           | `xiaomi/mimo-v2-flash`                         |

Particularités utiles à connaître :

- **OpenRouter** applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes vérifiées `openrouter.ai`. En tant que chemin de type proxy compatible OpenAI, il ignore la mise en forme réservée à OpenAI natif (`serviceTier`, `store` de Responses, indications de cache de prompt, compatibilité de raisonnement OpenAI). Les références adossées à Gemini conservent uniquement l’assainissement de signature de pensée proxy-Gemini.
- **Kilo Gateway** les références adossées à Gemini suivent le même chemin d’assainissement proxy-Gemini ; `kilocode/kilo/auto` et les autres références proxy ne prenant pas en charge le raisonnement ignorent l’injection de raisonnement proxy.
- **MiniMax** l’intégration par clé API écrit des définitions de modèle M2.7 explicites avec `input: ["text", "image"]` ; le catalogue intégré conserve les références de chat en mode texte uniquement jusqu’à matérialisation de cette configuration.
- **xAI** utilise le chemin xAI Responses. `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`, `grok-4` et `grok-4-0709` vers leurs variantes `*-fast`. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** les modèles GLM utilisent `zai-glm-4.7` / `zai-glm-4.6` ; l’URL de base compatible OpenAI est `https://api.cerebras.ai/v1`.

## Fournisseurs via `models.providers` (personnalisé/URL de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou
des proxys compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseur intégrés ci-dessous publient déjà un catalogue par défaut.
Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez redéfinir l’
URL de base, les en-têtes ou la liste de modèles par défaut.

### Moonshot AI (Kimi)

Moonshot est fourni comme Plugin de fournisseur intégré. Utilisez le fournisseur intégré par
défaut et ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous
avez besoin de redéfinir l’URL de base ou les métadonnées du modèle :

- Fournisseur : `moonshot`
- Authentification : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

ID de modèle Kimi K2 :

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding utilise le point de terminaison compatible Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Authentification : `KIMI_API_KEY`
- Exemple de modèle : `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

L’ancien `kimi/k2p5` reste accepté comme identifiant de modèle de compatibilité.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fournit l’accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (codage : `volcengine-plan`)
- Authentification : `VOLCANO_ENGINE_API_KEY`
- Exemple de modèle : `volcengine-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L’intégration choisit par défaut la surface de codage, mais le catalogue général `volcengine/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification Volcengine privilégie à la fois
les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur
vide limité au fournisseur.

Modèles disponibles :

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modèles de codage (`volcengine-plan`) :

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (international)

BytePlus ARK fournit l’accès aux mêmes modèles que Volcano Engine pour les utilisateurs internationaux.

- Fournisseur : `byteplus` (codage : `byteplus-plan`)
- Authentification : `BYTEPLUS_API_KEY`
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L’intégration choisit par défaut la surface de codage, mais le catalogue général `byteplus/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification BytePlus privilégie à la fois
les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur
vide limité au fournisseur.

Modèles disponibles :

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modèles de codage (`byteplus-plan`) :

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fournit des modèles compatibles Anthropic derrière le fournisseur `synthetic` :

- Fournisseur : `synthetic`
- Authentification : `SYNTHETIC_API_KEY`
- Exemple de modèle : `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI : `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax est configuré via `models.providers` parce qu’il utilise des points de terminaison personnalisés :

- MiniMax OAuth (global) : `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (global) : `--auth-choice minimax-global-api`
- Clé API MiniMax (CN) : `--auth-choice minimax-cn-api`
- Authentification : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` pour `minimax-portal`

Voir [/providers/minimax](/fr/providers/minimax) pour les détails de configuration, les options de modèle et des extraits de configuration.

Sur le chemin de streaming compatible Anthropic de MiniMax, OpenClaw désactive la réflexion par
défaut sauf si vous la définissez explicitement, et `/fast on` réécrit
`MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

Répartition des capacités possédée par le Plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M2.7`
- La génération d’images utilise `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’image est gérée par le Plugin avec `MiniMax-VL-01` sur les deux chemins d’authentification MiniMax
- La recherche web reste sur l’identifiant fournisseur `minimax`

### LM Studio

LM Studio est fourni comme Plugin de fournisseur intégré qui utilise l’API native :

- Fournisseur : `lmstudio`
- Authentification : `LM_API_TOKEN`
- URL de base d’inférence par défaut : `http://localhost:1234/v1`

Puis définissez un modèle (remplacez par l’un des ID renvoyés par `http://localhost:1234/api/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw utilise les points de terminaison natifs `/api/v1/models` et `/api/v1/models/load` de LM Studio pour la découverte + le chargement automatique, avec `/v1/chat/completions` pour l’inférence par défaut.
Voir [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est fourni comme Plugin de fournisseur intégré et utilise l’API native d’Ollama :

- Fournisseur : `ollama`
- Authentification : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement à `http://127.0.0.1:11434` lorsque vous activez cette option avec
`OLLAMA_API_KEY`, et le Plugin de fournisseur intégré ajoute directement Ollama à
`openclaw onboard` et au sélecteur de modèles. Voir [/providers/ollama](/fr/providers/ollama)
pour l’intégration, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni comme Plugin de fournisseur intégré pour les serveurs
locaux/auto-hébergés compatibles OpenAI :

- Fournisseur : `vllm`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur convient si votre serveur n’impose pas d’authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Puis définissez un modèle (remplacez par l’un des ID renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Voir [/providers/vllm](/fr/providers/vllm) pour les détails.

### SGLang

SGLang est fourni comme Plugin de fournisseur intégré pour des serveurs
compatibles OpenAI auto-hébergés rapides :

- Fournisseur : `sglang`
- Authentification : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur convient si votre serveur n’impose pas
d’authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Puis définissez un modèle (remplacez par l’un des ID renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Voir [/providers/sglang](/fr/providers/sglang) pour les détails.

### Proxys locaux (LM Studio, vLLM, LiteLLM, etc.)

Exemple (compatible OpenAI) :

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Remarques :

- Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow` et `maxTokens` sont facultatifs.
  Lorsqu’ils sont omis, OpenClaw utilise par défaut :
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recommandé : définissez des valeurs explicites correspondant aux limites de votre proxy/modèle.
- Pour `api: "openai-completions"` sur des points de terminaison non natifs (toute `baseUrl` non vide dont l’hôte n’est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` pour éviter les erreurs 400 du fournisseur sur les rôles `developer` non pris en charge.
- Les routes compatibles OpenAI de type proxy ignorent aussi la mise en forme de requête réservée à OpenAI natif :
  pas de `service_tier`, pas de `store` de Responses, pas d’indications de cache de prompt, pas de
  mise en forme de charge utile compatible raisonnement OpenAI et pas d’en-têtes
  d’attribution OpenClaw cachés.
- Si `baseUrl` est vide/omis, OpenClaw conserve le comportement OpenAI par défaut (qui se résout vers `api.openai.com`).
- Par sécurité, une valeur explicite `compat.supportsDeveloperRole: true` est quand même redéfinie sur les points de terminaison non natifs `openai-completions`.

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [/gateway/configuration](/fr/gateway/configuration) pour des exemples de configuration complets.

## Liens associés

- [Modèles](/fr/concepts/models) — configuration et alias des modèles
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli et comportement de nouvelle tentative
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration de modèle
- [Fournisseurs](/fr/providers) — guides de configuration par fournisseur
