---
read_when:
    - Vous avez besoin d’une référence de configuration des modèles, fournisseur par fournisseur.
    - Vous voulez des exemples de configurations ou des commandes d’intégration CLI pour les fournisseurs de modèles.
summary: Vue d’ensemble des fournisseurs de modèles avec des exemples de configurations + des flux CLI
title: Fournisseurs de modèles
x-i18n:
    generated_at: "2026-04-25T18:17:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0991f256bfeda9086eaa2911cc8056561dce84ee8cb9c16e99602eb396bbee83
    source_path: concepts/model-providers.md
    workflow: 15
---

Référence pour les **fournisseurs de LLM/modèles** (et non les canaux de chat comme WhatsApp/Telegram). Pour les règles de sélection des modèles, voir [Models](/fr/concepts/models).

## Règles rapides

- Les références de modèle utilisent `provider/model` (exemple : `opencode/claude-opus-4-6`).
- `agents.defaults.models` agit comme une liste d’autorisation lorsqu’il est défini.
- Assistants CLI : `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` est la métadonnée native du modèle ; `contextTokens` est le plafond d’exécution effectif.
- Règles de repli, sondes de cooldown et persistance des surcharges de session : [Model failover](/fr/concepts/model-failover).
- Les routes de la famille OpenAI sont spécifiques au préfixe : `openai/<model>` utilise le fournisseur direct à clé API OpenAI dans PI, `openai-codex/<model>` utilise l’OAuth Codex dans PI, et `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` utilise le harnais natif de serveur d’application Codex. Voir [OpenAI](/fr/providers/openai)
  et [Codex harness](/fr/plugins/codex-harness). Si la séparation fournisseur/runtime
  prête à confusion, lisez d’abord [Agent runtimes](/fr/concepts/agent-runtimes).
- L’activation automatique des plugins suit cette même séparation : `openai-codex/<model>` appartient
  au plugin OpenAI, tandis que le plugin Codex est activé par
  `embeddedHarness.runtime: "codex"` ou les anciennes références `codex/<model>`.
- Les runtimes CLI utilisent la même séparation : choisissez des références de modèle canoniques comme
  `anthropic/claude-*`, `google/gemini-*`, ou `openai/gpt-*`, puis définissez
  `agents.defaults.embeddedHarness.runtime` sur `claude-cli`,
  `google-gemini-cli`, ou `codex-cli` quand vous voulez un backend CLI local.
  Les anciennes références `claude-cli/*`, `google-gemini-cli/*`, et `codex-cli/*` sont migrées
  vers des références de fournisseur canoniques avec le runtime enregistré séparément.
- GPT-5.5 est disponible via `openai/gpt-5.5` pour le trafic direct à clé API,
  `openai-codex/gpt-5.5` dans PI pour l’OAuth Codex, et le harnais natif
  de serveur d’application Codex quand `embeddedHarness.runtime: "codex"` est défini.

## Comportement des fournisseurs géré par le plugin

La plupart des logiques spécifiques aux fournisseurs vivent dans les plugins de fournisseur (`registerProvider(...)`) tandis qu’OpenClaw conserve la boucle d’inférence générique. Les plugins gèrent l’intégration, les catalogues de modèles, le mapping des variables d’environnement d’authentification, la normalisation du transport/de la configuration, le nettoyage des schémas d’outils, la classification du failover, l’actualisation OAuth, le reporting d’usage, les profils de réflexion/raisonnement, et plus encore.

La liste complète des hooks du SDK fournisseur et des exemples de plugins intégrés se trouve dans [Provider plugins](/fr/plugins/sdk-provider-plugins). Un fournisseur qui a besoin d’un exécuteur de requêtes totalement personnalisé relève d’une surface d’extension distincte et plus profonde.

<Note>
Les `capabilities` du runtime fournisseur sont des métadonnées partagées du runner (famille de fournisseur, particularités de transcript/outillage, indications de transport/cache). Ce n’est pas la même chose que le [public capability model](/fr/plugins/architecture#public-capability-model), qui décrit ce qu’un plugin enregistre (inférence de texte, parole, etc.).
</Note>

## Rotation des clés API

- Prend en charge la rotation générique des fournisseurs pour certains fournisseurs sélectionnés.
- Configurez plusieurs clés via :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (surcharge live unique, priorité la plus élevée)
  - `<PROVIDER>_API_KEYS` (liste séparée par des virgules ou des points-virgules)
  - `<PROVIDER>_API_KEY` (clé principale)
  - `<PROVIDER>_API_KEY_*` (liste numérotée, par ex. `<PROVIDER>_API_KEY_1`)
- Pour les fournisseurs Google, `GOOGLE_API_KEY` est également inclus comme solution de repli.
- L’ordre de sélection des clés préserve la priorité et déduplique les valeurs.
- Les requêtes sont retentées avec la clé suivante uniquement sur des réponses de limitation de débit (par
  exemple `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded`, ou des messages périodiques de limite d’usage).
- Les échecs hors limitation de débit échouent immédiatement ; aucune rotation de clé n’est tentée.
- Lorsque toutes les clés candidates échouent, l’erreur finale renvoyée est celle de la dernière tentative.

## Fournisseurs intégrés (catalogue pi-ai)

OpenClaw est fourni avec le catalogue pi-ai. Ces fournisseurs ne nécessitent **aucune**
configuration `models.providers` ; il suffit de définir l’authentification + choisir un modèle.

### OpenAI

- Fournisseur : `openai`
- Auth : `OPENAI_API_KEY`
- Rotation facultative : `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (surcharge unique)
- Exemples de modèles : `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Vérifiez la disponibilité du compte/modèle avec `openclaw models list --provider openai`
  si une installation spécifique ou une clé API se comporte différemment.
- CLI : `openclaw onboard --auth-choice openai-api-key`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Surchargez par modèle via `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, ou `"auto"`)
- Le préchauffage WebSocket OpenAI Responses est activé par défaut via `params.openaiWsWarmup` (`true`/`false`)
- Le traitement prioritaire OpenAI peut être activé via `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` et `params.fastMode` mappent les requêtes Responses directes `openai/*` vers `service_tier=priority` sur `api.openai.com`
- Utilisez `params.serviceTier` quand vous voulez un niveau explicite au lieu du basculement partagé `/fast`
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) s’appliquent uniquement au trafic OpenAI natif vers `api.openai.com`, pas
  aux proxys génériques compatibles OpenAI
- Les routes OpenAI natives conservent également `store` de Responses, les indications de cache de prompt, et
  le façonnage de payload de compatibilité de raisonnement OpenAI ; les routes proxy ne le font pas
- `openai/gpt-5.3-codex-spark` est intentionnellement supprimé dans OpenClaw parce que les requêtes live à l’API OpenAI le rejettent et que le catalogue Codex actuel ne l’expose pas

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Fournisseur : `anthropic`
- Auth : `ANTHROPIC_API_KEY`
- Rotation facultative : `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (surcharge unique)
- Exemple de modèle : `anthropic/claude-opus-4-6`
- CLI : `openclaw onboard --auth-choice apiKey`
- Les requêtes publiques directes Anthropic prennent en charge le basculement partagé `/fast` et `params.fastMode`, y compris le trafic authentifié par clé API et OAuth envoyé vers `api.anthropic.com` ; OpenClaw le mappe vers le `service_tier` Anthropic (`auto` vs `standard_only`)
- Remarque Anthropic : le personnel Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est de nouveau autorisé, donc OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés pour cette intégration, sauf si Anthropic publie une nouvelle politique.
- Le setup-token Anthropic reste disponible en tant que chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère maintenant la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Fournisseur : `openai-codex`
- Auth : OAuth (ChatGPT)
- Référence de modèle PI : `openai-codex/gpt-5.5`
- Référence du harnais natif de serveur d’application Codex : `openai/gpt-5.5` avec `agents.defaults.embeddedHarness.runtime: "codex"`
- Documentation du harnais natif de serveur d’application Codex : [Codex harness](/fr/plugins/codex-harness)
- Anciennes références de modèle : `codex/gpt-*`
- Limite du plugin : `openai-codex/*` charge le plugin OpenAI ; le plugin natif
  du serveur d’application Codex est sélectionné uniquement par le runtime du harnais Codex ou les anciennes
  références `codex/*`.
- CLI : `openclaw onboard --auth-choice openai-codex` ou `openclaw models auth login --provider openai-codex`
- Le transport par défaut est `auto` (WebSocket d’abord, repli SSE)
- Surchargez par modèle PI via `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, ou `"auto"`)
- `params.serviceTier` est également transmis sur les requêtes Responses Codex natives (`chatgpt.com/backend-api`)
- Les en-têtes d’attribution OpenClaw cachés (`originator`, `version`,
  `User-Agent`) sont attachés uniquement au trafic Codex natif vers
  `chatgpt.com/backend-api`, pas aux proxys génériques compatibles OpenAI
- Partage le même basculement `/fast` et la même configuration `params.fastMode` que `openai/*` direct ; OpenClaw les mappe vers `service_tier=priority`
- `openai-codex/gpt-5.5` utilise le `contextWindow = 400000` natif du catalogue Codex et le `contextTokens = 272000` par défaut du runtime ; surchargez le plafond du runtime avec `models.providers.openai-codex.models[].contextTokens`
- Remarque de politique : l’OAuth OpenAI Codex est explicitement pris en charge pour les outils/workflows externes comme OpenClaw.
- Utilisez `openai-codex/gpt-5.5` quand vous voulez la route Codex OAuth/abonnement ; utilisez `openai/gpt-5.5` lorsque votre configuration à clé API et votre catalogue local exposent la route d’API publique.

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

- [Qwen Cloud](/fr/providers/qwen) : surface de fournisseur Qwen Cloud ainsi que mapping des endpoints Alibaba DashScope et Coding Plan
- [MiniMax](/fr/providers/minimax) : accès OAuth ou clé API au Coding Plan MiniMax
- [GLM models](/fr/providers/glm) : endpoints Z.AI Coding Plan ou API générales

### OpenCode

- Auth : `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`)
- Fournisseur du runtime Zen : `opencode`
- Fournisseur du runtime Go : `opencode-go`
- Exemples de modèles : `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice opencode-zen` ou `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (clé API)

- Fournisseur : `google`
- Auth : `GEMINI_API_KEY`
- Rotation facultative : `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, solution de repli `GOOGLE_API_KEY`, et `OPENCLAW_LIVE_GEMINI_KEY` (surcharge unique)
- Exemples de modèles : `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Compatibilité : l’ancienne configuration OpenClaw utilisant `google/gemini-3.1-flash-preview` est normalisée en `google/gemini-3-flash-preview`
- CLI : `openclaw onboard --auth-choice gemini-api-key`
- Réflexion : `/think adaptive` utilise la réflexion dynamique Google. Gemini 3/3.1 omettent un
  `thinkingLevel` fixe ; Gemini 2.5 envoie `thinkingBudget: -1`.
- Les exécutions Gemini directes acceptent aussi `agents.defaults.models["google/<model>"].params.cachedContent`
  (ou l’ancien `cached_content`) pour transmettre un handle natif du fournisseur
  `cachedContents/...` ; les hits de cache Gemini remontent comme `cacheRead` OpenClaw

### Google Vertex et Gemini CLI

- Fournisseurs : `google-vertex`, `google-gemini-cli`
- Auth : Vertex utilise gcloud ADC ; Gemini CLI utilise son flux OAuth
- Attention : l’OAuth Gemini CLI dans OpenClaw est une intégration non officielle. Certains utilisateurs ont signalé des restrictions de compte Google après l’usage de clients tiers. Consultez les conditions de Google et utilisez un compte non critique si vous choisissez de continuer.
- L’OAuth Gemini CLI est fourni dans le plugin `google` intégré.
  - Installez d’abord Gemini CLI :
    - `brew install gemini-cli`
    - ou `npm install -g @google/gemini-cli`
  - Activer : `openclaw plugins enable google`
  - Connexion : `openclaw models auth login --provider google-gemini-cli --set-default`
  - Modèle par défaut : `google-gemini-cli/gemini-3-flash-preview`
  - Remarque : vous ne collez **pas** d’identifiant client ni de secret dans `openclaw.json`. Le flux de connexion CLI stocke
    les jetons dans les profils d’authentification sur l’hôte Gateway.
  - Si les requêtes échouent après la connexion, définissez `GOOGLE_CLOUD_PROJECT` ou `GOOGLE_CLOUD_PROJECT_ID` sur l’hôte Gateway.
  - Les réponses JSON Gemini CLI sont analysées depuis `response` ; l’usage revient par défaut à
    `stats`, avec `stats.cached` normalisé en `cacheRead` OpenClaw.

### Z.AI (GLM)

- Fournisseur : `zai`
- Auth : `ZAI_API_KEY`
- Exemple de modèle : `zai/glm-5.1`
- CLI : `openclaw onboard --auth-choice zai-api-key`
  - Les alias `z.ai/*` et `z-ai/*` sont normalisés en `zai/*`
  - `zai-api-key` détecte automatiquement l’endpoint Z.AI correspondant ; `zai-coding-global`, `zai-coding-cn`, `zai-global`, et `zai-cn` forcent une surface spécifique

### Vercel AI Gateway

- Fournisseur : `vercel-ai-gateway`
- Auth : `AI_GATEWAY_API_KEY`
- Exemples de modèles : `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Fournisseur : `kilocode`
- Auth : `KILOCODE_API_KEY`
- Exemple de modèle : `kilocode/kilo/auto`
- CLI : `openclaw onboard --auth-choice kilocode-api-key`
- URL de base : `https://api.kilo.ai/api/gateway/`
- Le catalogue statique de repli inclut `kilocode/kilo/auto` ; la découverte live sur
  `https://api.kilo.ai/api/gateway/models` peut étendre davantage le catalogue
  du runtime.
- Le routage exact en amont derrière `kilocode/kilo/auto` est géré par Kilo Gateway,
  pas codé en dur dans OpenClaw.

Voir [/providers/kilocode](/fr/providers/kilocode) pour les détails de configuration.

### Autres plugins de fournisseur intégrés

| Fournisseur            | Id                               | Variable d’environnement d’authentification                  | Exemple de modèle                               |
| ---------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus               | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras               | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway  | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek               | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot         | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                   | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` ou `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway           | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding            | `kimi`                           | `KIMI_API_KEY` ou `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot               | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                 | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter             | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud             | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together               | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                 | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway      | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                    | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                 | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Particularités à connaître :

- **OpenRouter** applique ses en-têtes d’attribution d’application et les marqueurs Anthropic `cache_control` uniquement sur les routes vérifiées `openrouter.ai`. Les références DeepSeek, Moonshot et ZAI sont éligibles au TTL de cache pour le prompt caching géré par OpenRouter, mais ne reçoivent pas les marqueurs de cache Anthropic. En tant que chemin compatible OpenAI de style proxy, il ignore le façonnage réservé à OpenAI natif (`serviceTier`, `store` de Responses, indications de cache de prompt, compatibilité de raisonnement OpenAI). Les références adossées à Gemini conservent uniquement l’assainissement des signatures de pensée propre au proxy Gemini.
- **Kilo Gateway** : les références adossées à Gemini suivent le même chemin d’assainissement proxy-Gemini ; `kilocode/kilo/auto` et les autres références proxy sans prise en charge du raisonnement ignorent l’injection de raisonnement proxy.
- **MiniMax** : l’intégration par clé API écrit des définitions explicites de modèles de chat M2.7 texte uniquement ; la compréhension d’images reste sur le fournisseur média `MiniMax-VL-01` géré par le plugin.
- **xAI** utilise le chemin xAI Responses. `/fast` ou `params.fastMode: true` réécrit `grok-3`, `grok-3-mini`, `grok-4`, et `grok-4-0709` vers leurs variantes `*-fast`. `tool_stream` est activé par défaut ; désactivez-le via `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** : les modèles GLM utilisent `zai-glm-4.7` / `zai-glm-4.6` ; l’URL de base compatible OpenAI est `https://api.cerebras.ai/v1`.

## Fournisseurs via `models.providers` (personnalisé/URL de base)

Utilisez `models.providers` (ou `models.json`) pour ajouter des fournisseurs **personnalisés** ou
des proxys compatibles OpenAI/Anthropic.

Beaucoup des plugins de fournisseur intégrés ci-dessous publient déjà un catalogue par défaut.
Utilisez des entrées explicites `models.providers.<id>` uniquement lorsque vous voulez remplacer
l’URL de base, les en-têtes ou la liste de modèles par défaut.

### Moonshot AI (Kimi)

Moonshot est fourni sous forme de plugin de fournisseur intégré. Utilisez le fournisseur intégré par
défaut, et ajoutez une entrée explicite `models.providers.moonshot` uniquement lorsque vous
devez remplacer l’URL de base ou les métadonnées du modèle :

- Fournisseur : `moonshot`
- Auth : `MOONSHOT_API_KEY`
- Exemple de modèle : `moonshot/kimi-k2.6`
- CLI : `openclaw onboard --auth-choice moonshot-api-key` ou `openclaw onboard --auth-choice moonshot-api-key-cn`

Ids de modèles Kimi K2 :

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

Kimi Coding utilise l’endpoint compatible Anthropic de Moonshot AI :

- Fournisseur : `kimi`
- Auth : `KIMI_API_KEY`
- Exemple de modèle : `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

L’ancienne référence `kimi/k2p5` reste acceptée comme id de modèle de compatibilité.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) fournit l’accès à Doubao et à d’autres modèles en Chine.

- Fournisseur : `volcengine` (coding : `volcengine-plan`)
- Auth : `VOLCANO_ENGINE_API_KEY`
- Exemple de modèle : `volcengine-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

L’intégration utilise par défaut la surface coding, mais le catalogue général `volcengine/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification Volcengine privilégie à la fois
les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur vide
limité au fournisseur.

Modèles disponibles :

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modèles coding (`volcengine-plan`) :

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (International)

BytePlus ARK fournit un accès aux mêmes modèles que Volcano Engine pour les utilisateurs internationaux.

- Fournisseur : `byteplus` (coding : `byteplus-plan`)
- Auth : `BYTEPLUS_API_KEY`
- Exemple de modèle : `byteplus-plan/ark-code-latest`
- CLI : `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

L’intégration utilise par défaut la surface coding, mais le catalogue général `byteplus/*`
est enregistré en même temps.

Dans les sélecteurs de modèles d’intégration/configuration, le choix d’authentification BytePlus privilégie à la fois
les lignes `byteplus/*` et `byteplus-plan/*`. Si ces modèles ne sont pas encore chargés,
OpenClaw revient au catalogue non filtré au lieu d’afficher un sélecteur vide
limité au fournisseur.

Modèles disponibles :

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modèles coding (`byteplus-plan`) :

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic fournit des modèles compatibles Anthropic derrière le fournisseur `synthetic` :

- Fournisseur : `synthetic`
- Auth : `SYNTHETIC_API_KEY`
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

MiniMax est configuré via `models.providers` car il utilise des endpoints personnalisés :

- OAuth MiniMax (Global) : `--auth-choice minimax-global-oauth`
- OAuth MiniMax (CN) : `--auth-choice minimax-cn-oauth`
- Clé API MiniMax (Global) : `--auth-choice minimax-global-api`
- Clé API MiniMax (CN) : `--auth-choice minimax-cn-api`
- Auth : `MINIMAX_API_KEY` pour `minimax` ; `MINIMAX_OAUTH_TOKEN` ou
  `MINIMAX_API_KEY` pour `minimax-portal`

Voir [/providers/minimax](/fr/providers/minimax) pour les détails de configuration, les options de modèle et les extraits de configuration.

Sur le chemin de streaming compatible Anthropic de MiniMax, OpenClaw désactive la réflexion par
défaut sauf si vous la définissez explicitement, et `/fast on` réécrit
`MiniMax-M2.7` en `MiniMax-M2.7-highspeed`.

Séparation des capacités gérée par le plugin :

- Les valeurs par défaut texte/chat restent sur `minimax/MiniMax-M2.7`
- La génération d’images est `minimax/image-01` ou `minimax-portal/image-01`
- La compréhension d’images relève du plugin `MiniMax-VL-01` sur les deux chemins d’authentification MiniMax
- La recherche web reste sur l’id de fournisseur `minimax`

### LM Studio

LM Studio est fourni comme plugin de fournisseur intégré qui utilise l’API native :

- Fournisseur : `lmstudio`
- Auth : `LM_API_TOKEN`
- URL de base d’inférence par défaut : `http://localhost:1234/v1`

Définissez ensuite un modèle (remplacez par l’un des ids renvoyés par `http://localhost:1234/api/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw utilise les endpoints natifs `/api/v1/models` et `/api/v1/models/load` de LM Studio
pour la découverte + le chargement automatique, avec `/v1/chat/completions` pour l’inférence par défaut.
Voir [/providers/lmstudio](/fr/providers/lmstudio) pour la configuration et le dépannage.

### Ollama

Ollama est fourni comme plugin de fournisseur intégré et utilise l’API native d’Ollama :

- Fournisseur : `ollama`
- Auth : aucune requise (serveur local)
- Exemple de modèle : `ollama/llama3.3`
- Installation : [https://ollama.com/download](https://ollama.com/download)

```bash
# Installez Ollama, puis récupérez un modèle :
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama est détecté localement sur `http://127.0.0.1:11434` lorsque vous l’activez avec
`OLLAMA_API_KEY`, et le plugin de fournisseur intégré ajoute directement Ollama à
`openclaw onboard` et au sélecteur de modèles. Voir [/providers/ollama](/fr/providers/ollama)
pour l’intégration, le mode cloud/local et la configuration personnalisée.

### vLLM

vLLM est fourni comme plugin de fournisseur intégré pour les serveurs
compatibles OpenAI locaux/autohébergés :

- Fournisseur : `vllm`
- Auth : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:8000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur fonctionne si votre serveur n’impose pas d’authentification) :

```bash
export VLLM_API_KEY="vllm-local"
```

Définissez ensuite un modèle (remplacez par l’un des ids renvoyés par `/v1/models`) :

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Voir [/providers/vllm](/fr/providers/vllm) pour les détails.

### SGLang

SGLang est fourni comme plugin de fournisseur intégré pour des serveurs
compatibles OpenAI autohébergés rapides :

- Fournisseur : `sglang`
- Auth : facultative (dépend de votre serveur)
- URL de base par défaut : `http://127.0.0.1:30000/v1`

Pour activer la découverte automatique en local (n’importe quelle valeur fonctionne si votre serveur n’impose pas
d’authentification) :

```bash
export SGLANG_API_KEY="sglang-local"
```

Définissez ensuite un modèle (remplacez par l’un des ids renvoyés par `/v1/models`) :

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

- Pour les fournisseurs personnalisés, `reasoning`, `input`, `cost`, `contextWindow`, et `maxTokens` sont facultatifs.
  Lorsqu’ils sont omis, OpenClaw utilise par défaut :
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Recommandé : définissez des valeurs explicites correspondant aux limites de votre proxy/modèle.
- Pour `api: "openai-completions"` sur des endpoints non natifs (toute `baseUrl` non vide dont l’hôte n’est pas `api.openai.com`), OpenClaw force `compat.supportsDeveloperRole: false` afin d’éviter les erreurs 400 du fournisseur pour les rôles `developer` non pris en charge.
- Les routes compatibles OpenAI de style proxy ignorent également le façonnage de requête réservé à OpenAI natif :
  pas de `service_tier`, pas de `store` Responses, pas de `store` Completions, pas
  d’indications de cache de prompt, pas de façonnage de payload de compatibilité du raisonnement OpenAI, et pas d’en-têtes
  d’attribution OpenClaw cachés.
- Pour les proxys Completions compatibles OpenAI qui nécessitent des champs spécifiques au fournisseur,
  définissez `agents.defaults.models["provider/model"].params.extra_body` (ou
  `extraBody`) pour fusionner du JSON supplémentaire dans le corps de requête sortant.
- Si `baseUrl` est vide/omis, OpenClaw conserve le comportement OpenAI par défaut (qui pointe vers `api.openai.com`).
- Par sécurité, une valeur explicite `compat.supportsDeveloperRole: true` est quand même remplacée sur les endpoints non natifs `openai-completions`.

## Exemples CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Voir aussi : [Configuration](/fr/gateway/configuration) pour des exemples complets de configuration.

## Liens associés

- [Models](/fr/concepts/models) — configuration des modèles et alias
- [Model failover](/fr/concepts/model-failover) — chaînes de repli et comportement de nouvelle tentative
- [Configuration reference](/fr/gateway/config-agents#agent-defaults) — clés de configuration du modèle
- [Providers](/fr/providers) — guides de configuration par fournisseur
