---
read_when:
    - Vous souhaitez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous avez besoin d’auditer les clés, les coûts et la visibilité de l’utilisation
    - Vous expliquez les rapports de coût de /status ou /usage
summary: Auditer ce qui peut dépenser de l’argent, quelles clés sont utilisées et comment voir l’utilisation
title: Utilisation de l’API et coûts
x-i18n:
    generated_at: "2026-04-24T07:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Utilisation de l’API et coûts

Cette page liste les **fonctionnalités qui peuvent invoquer des clés API** et où leurs coûts apparaissent. Elle se concentre sur
les fonctionnalités OpenClaw qui peuvent générer de l’utilisation fournisseur ou des appels API payants.

## Où les coûts apparaissent (chat + CLI)

**Instantané de coût par session**

- `/status` affiche le modèle de la session actuelle, l’utilisation du contexte et les jetons de la dernière réponse.
- Si le modèle utilise une **authentification par clé API**, `/status` affiche aussi le **coût estimé** de la dernière réponse.
- Si les métadonnées actives de session sont partielles, `/status` peut récupérer les compteurs
  de jetons/cache ainsi que le libellé du modèle runtime actif depuis la dernière entrée d’utilisation du transcript.
  Les valeurs actives non nulles existantes restent prioritaires, et les
  totaux de transcript orientés taille de prompt peuvent l’emporter lorsque les totaux stockés sont absents ou plus faibles.

**Pied de page de coût par message**

- `/usage full` ajoute un pied de page d’utilisation à chaque réponse, y compris le **coût estimé** (clé API uniquement).
- `/usage tokens` affiche uniquement les jetons ; les flux OAuth/jeton ou CLI de type abonnement masquent le coût en dollars.
- Remarque Gemini CLI : lorsque la CLI renvoie une sortie JSON, OpenClaw lit l’utilisation depuis
  `stats`, normalise `stats.cached` en `cacheRead`, et dérive les jetons d’entrée à partir de `stats.input_tokens - stats.cached` lorsque nécessaire.

Remarque Anthropic : le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI
de type OpenClaw est de nouveau autorisée, donc OpenClaw traite la réutilisation de Claude CLI et l’usage de
`claude -p` comme autorisés pour cette intégration, sauf si Anthropic publie une nouvelle politique.
Anthropic n’expose toujours pas d’estimation en dollars par message qu’OpenClaw puisse
afficher dans `/usage full`.

**Fenêtres d’utilisation CLI (quotas fournisseur)**

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d’utilisation**
  des fournisseurs (instantanés de quota, pas des coûts par message).
- La sortie lisible par humain est normalisée sous la forme `X% left` pour tous les fournisseurs.
- Fournisseurs actuels de fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.
- Remarque MiniMax : ses champs bruts `usage_percent` / `usagePercent` signifient quota
  restant, donc OpenClaw les inverse avant affichage. Les champs basés sur des comptages restent prioritaires
  lorsqu’ils sont présents. Si le fournisseur renvoie `model_remains`, OpenClaw privilégie l’entrée
  du modèle de chat, dérive le libellé de fenêtre à partir des horodatages si nécessaire, et
  inclut le nom du modèle dans le libellé du plan.
- L’authentification d’utilisation pour ces fenêtres de quota provient de hooks spécifiques au fournisseur lorsque
  disponibles ; sinon OpenClaw revient aux identifiants OAuth/clé API
  correspondants depuis les profils d’authentification, l’environnement ou la configuration.

Voir [Utilisation des jetons et coûts](/fr/reference/token-use) pour les détails et les exemples.

## Comment les clés sont découvertes

OpenClaw peut récupérer les identifiants depuis :

- **Profils d’authentification** (par agent, stockés dans `auth-profiles.json`).
- **Variables d’environnement** (par ex. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) qui peuvent exporter des clés dans l’environnement du processus du skill.

## Fonctionnalités qui peuvent dépenser des clés

### 1) Réponses du modèle central (chat + outils)

Chaque réponse ou appel d’outil utilise le **fournisseur de modèle actuel** (OpenAI, Anthropic, etc.). C’est la
source principale d’utilisation et de coût.

Cela inclut aussi les fournisseurs hébergés de type abonnement qui continuent de facturer en dehors de
l’interface locale d’OpenClaw, comme **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, et
le chemin de connexion Claude Anthropic d’OpenClaw avec **Extra Usage** activé.

Voir [Models](/fr/providers/models) pour la configuration des tarifs et [Utilisation des jetons et coûts](/fr/reference/token-use) pour l’affichage.

### 2) Compréhension des médias (audio/image/vidéo)

Les médias entrants peuvent être résumés/transcrits avant l’exécution de la réponse. Cela utilise les API de modèles/fournisseurs.

- Audio : OpenAI / Groq / Deepgram / Google / Mistral.
- Image : OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vidéo : Google / Qwen / Moonshot.

Voir [Compréhension des médias](/fr/nodes/media-understanding).

### 3) Génération d’images et de vidéos

Les capacités partagées de génération peuvent également consommer des clés fournisseur :

- Génération d’images : OpenAI / Google / fal / MiniMax
- Génération de vidéo : Qwen

La génération d’images peut déduire un fournisseur par défaut adossé à l’authentification lorsque
`agents.defaults.imageGenerationModel` n’est pas défini. La génération vidéo exige actuellement
un `agents.defaults.videoGenerationModel` explicite tel que
`qwen/wan2.6-t2v`.

Voir [Génération d’images](/fr/tools/image-generation), [Qwen Cloud](/fr/providers/qwen),
et [Models](/fr/concepts/models).

### 4) Embeddings de mémoire + recherche sémantique

La recherche sémantique en mémoire utilise des **API d’embeddings** lorsqu’elle est configurée avec des fournisseurs distants :

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "lmstudio"` → embeddings LM Studio (local/auto-hébergé)
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/auto-hébergé ; généralement sans facturation d’API hébergée)
- Repli facultatif vers un fournisseur distant si les embeddings locaux échouent

Vous pouvez tout garder en local avec `memorySearch.provider = "local"` (aucune utilisation d’API).

Voir [Memory](/fr/concepts/memory).

### 5) Outil de recherche web

`web_search` peut entraîner des frais d’utilisation selon votre fournisseur :

- **Brave Search API** : `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa** : `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl** : `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)** : `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)** : `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)** : `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search** : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search** : sans clé par défaut, mais nécessite un hôte Ollama joignable plus `ollama signin` ; peut aussi réutiliser l’authentification Bearer normale du fournisseur Ollama lorsque l’hôte l’exige
- **Perplexity Search API** : `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily** : `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo** : repli sans clé (pas de facturation API, mais non officiel et basé sur HTML)
- **SearXNG** : `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sans clé/auto-hébergé ; pas de facturation d’API hébergée)

Les anciens chemins de fournisseur `tools.web.search.*` se chargent encore via la couche de compatibilité temporaire, mais ce n’est plus la surface de configuration recommandée.

**Crédit gratuit Brave Search :** chaque plan Brave inclut 5 $/mois de crédit
gratuit renouvelable. Le plan Search coûte 5 $ pour 1 000 requêtes, donc ce crédit couvre
1 000 requêtes/mois sans frais. Définissez votre limite d’utilisation dans le tableau de bord Brave
pour éviter des frais inattendus.

Voir [Outils web](/fr/tools/web).

### 5) Outil de récupération web (Firecrawl)

`web_fetch` peut appeler **Firecrawl** lorsqu’une clé API est présente :

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl n’est pas configuré, l’outil revient à une récupération directe + readability (pas d’API payante).

Voir [Outils web](/fr/tools/web).

### 6) Instantanés d’utilisation du fournisseur (status/health)

Certaines commandes de statut appellent des **points de terminaison d’utilisation fournisseur** pour afficher des fenêtres de quota ou l’état de l’authentification.
Ce sont généralement des appels de faible volume, mais ils touchent tout de même les API fournisseur :

- `openclaw status --usage`
- `openclaw models status --json`

Voir [CLI Models](/fr/cli/models).

### 7) Synthèse de sauvegarde de la Compaction

La sauvegarde de Compaction peut résumer l’historique de session en utilisant le **modèle actuel**, ce
qui invoque les API du fournisseur lorsqu’elle s’exécute.

Voir [Gestion de session + Compaction](/fr/reference/session-management-compaction).

### 8) Scan / sonde de modèle

`openclaw models scan` peut sonder les modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque
la sonde est activée.

Voir [CLI Models](/fr/cli/models).

### 9) Talk (voix)

Le mode Talk peut invoquer **ElevenLabs** lorsqu’il est configuré :

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Voir [Mode Talk](/fr/nodes/talk).

### 10) Skills (API tierces)

Les Skills peuvent stocker `apiKey` dans `skills.entries.<name>.apiKey`. Si un skill utilise cette clé pour des
API externes, il peut entraîner des coûts selon le fournisseur du skill.

Voir [Skills](/fr/tools/skills).

## Associé

- [Utilisation des jetons et coûts](/fr/reference/token-use)
- [Cache de prompts](/fr/reference/prompt-caching)
- [Suivi de l’utilisation](/fr/concepts/usage-tracking)
