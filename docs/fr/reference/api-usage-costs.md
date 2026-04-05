---
read_when:
    - Vous souhaitez comprendre quelles fonctionnalités peuvent appeler des API payantes
    - Vous devez auditer les clés, les coûts et la visibilité de l'utilisation
    - Vous expliquez le reporting de `/status` ou `/usage cost`
summary: Auditer ce qui peut coûter de l'argent, quelles clés sont utilisées et comment consulter l'utilisation
title: Utilisation des API et coûts
x-i18n:
    generated_at: "2026-04-05T12:53:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# Utilisation des API et coûts

Cette documentation liste les **fonctionnalités pouvant invoquer des clés API** et l'endroit où leurs coûts apparaissent. Elle se concentre sur les fonctionnalités OpenClaw susceptibles de générer de l'utilisation fournisseur ou des appels API payants.

## Où les coûts apparaissent (chat + CLI)

**Instantané de coût par session**

- `/status` affiche le modèle actuel de la session, l'utilisation du contexte et les jetons de la dernière réponse.
- Si le modèle utilise une **authentification par clé API**, `/status` affiche également le **coût estimé** de la dernière réponse.
- Si les métadonnées de session live sont incomplètes, `/status` peut récupérer les compteurs de jetons/cache et le libellé du modèle runtime actif depuis la dernière entrée d'utilisation de transcription. Les valeurs live non nulles existantes restent prioritaires, et les totaux de transcription de taille prompt peuvent l'emporter lorsque les totaux stockés sont absents ou plus petits.

**Pied de page de coût par message**

- `/usage full` ajoute un pied de page d'utilisation à chaque réponse, y compris le **coût estimé** (clé API uniquement).
- `/usage tokens` n'affiche que les jetons ; les flux OAuth/jeton et CLI de type abonnement masquent le coût en dollars.
- Remarque Gemini CLI : lorsque la CLI renvoie une sortie JSON, OpenClaw lit l'utilisation depuis `stats`, normalise `stats.cached` en `cacheRead`, et dérive les jetons d'entrée à partir de `stats.input_tokens - stats.cached` si nécessaire.

Remarque Anthropic : la documentation publique Claude Code d'Anthropic inclut encore l'utilisation directe du terminal Claude Code dans les limites du plan Claude. Séparément, Anthropic a indiqué aux utilisateurs OpenClaw qu'à partir du **4 avril 2026 à 12:00 PM PT / 8:00 PM BST**, le chemin Claude-login **OpenClaw** compte comme utilisation de harnais tiers et nécessite **Extra Usage**, facturée séparément de l'abonnement. Anthropic n'expose pas d'estimation en dollars par message qu'OpenClaw pourrait afficher dans `/usage full`.

**Fenêtres d'utilisation CLI (quotas fournisseur)**

- `openclaw status --usage` et `openclaw channels list` affichent les **fenêtres d'utilisation**
  fournisseur (instantanés de quota, pas des coûts par message).
- La sortie lisible est normalisée en `X% left` pour tous les fournisseurs.
- Fournisseurs actuels de fenêtres d'utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi, et z.ai.
- Remarque MiniMax : ses champs bruts `usage_percent` / `usagePercent` signifient quota restant,
  donc OpenClaw les inverse avant affichage. Les champs basés sur le comptage restent prioritaires
  lorsqu'ils sont présents. Si le fournisseur renvoie `model_remains`, OpenClaw privilégie
  l'entrée du modèle de chat, dérive le libellé de fenêtre à partir des horodatages lorsque nécessaire, et
  inclut le nom du modèle dans le libellé du plan.
- L'authentification d'utilisation pour ces fenêtres de quota provient de hooks spécifiques au fournisseur lorsqu'ils sont disponibles ; sinon OpenClaw revient aux identifiants OAuth/clés API correspondants depuis les profils d'authentification, l'environnement ou la configuration.

Voir [Utilisation des jetons et coûts](/reference/token-use) pour des détails et des exemples.

## Comment les clés sont découvertes

OpenClaw peut récupérer les identifiants depuis :

- **Profils d'authentification** (par agent, stockés dans `auth-profiles.json`).
- **Variables d'environnement** (par ex. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Configuration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) qui peuvent exporter des clés dans l'environnement du processus de Skill.

## Fonctionnalités pouvant consommer des clés

### 1) Réponses du modèle central (chat + outils)

Chaque réponse ou appel d'outil utilise le **fournisseur du modèle actuel** (OpenAI, Anthropic, etc.). C'est la
source principale d'utilisation et de coût.

Cela inclut aussi les fournisseurs hébergés de type abonnement qui facturent toujours en dehors
de l'interface locale d'OpenClaw, tels que **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, et
le chemin Claude-login Anthropic d'OpenClaw avec **Extra Usage** activé.

Voir [Modèles](/providers/models) pour la configuration tarifaire et [Utilisation des jetons et coûts](/reference/token-use) pour l'affichage.

### 2) Compréhension des médias (audio/image/vidéo)

Les médias entrants peuvent être résumés/transcrits avant l'exécution de la réponse. Cela utilise des API modèle/fournisseur.

- Audio : OpenAI / Groq / Deepgram / Google / Mistral.
- Image : OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Vidéo : Google / Qwen / Moonshot.

Voir [Compréhension des médias](/nodes/media-understanding).

### 3) Génération d'images et de vidéos

Les capacités de génération partagées peuvent aussi consommer des clés fournisseur :

- Génération d'images : OpenAI / Google / fal / MiniMax
- Génération de vidéos : Qwen

La génération d'images peut déduire un fournisseur par défaut adossé à l'authentification lorsque
`agents.defaults.imageGenerationModel` n'est pas défini. La génération vidéo nécessite actuellement un `agents.defaults.videoGenerationModel` explicite tel que
`qwen/wan2.6-t2v`.

Voir [Génération d'images](/tools/image-generation), [Qwen Cloud](/providers/qwen),
et [Modèles](/concepts/models).

### 4) Embeddings mémoire + recherche sémantique

La recherche sémantique en mémoire utilise des **API d'embeddings** lorsqu'elle est configurée avec des fournisseurs distants :

- `memorySearch.provider = "openai"` → embeddings OpenAI
- `memorySearch.provider = "gemini"` → embeddings Gemini
- `memorySearch.provider = "voyage"` → embeddings Voyage
- `memorySearch.provider = "mistral"` → embeddings Mistral
- `memorySearch.provider = "ollama"` → embeddings Ollama (local/autohébergé ; généralement sans facturation d'API hébergée)
- Repli facultatif vers un fournisseur distant si les embeddings locaux échouent

Vous pouvez tout garder en local avec `memorySearch.provider = "local"` (aucune utilisation d'API).

Voir [Mémoire](/concepts/memory).

### 5) Outil de recherche web

`web_search` peut entraîner des frais d'utilisation selon votre fournisseur :

- **API Brave Search** : `BRAVE_API_KEY` ou `plugins.entries.brave.config.webSearch.apiKey`
- **Exa** : `EXA_API_KEY` ou `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl** : `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)** : `GEMINI_API_KEY` ou `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)** : `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)** : `KIMI_API_KEY`, `MOONSHOT_API_KEY`, ou `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search** : `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, ou `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search** : sans clé par défaut, mais nécessite un hôte Ollama joignable plus `ollama signin` ; peut aussi réutiliser l'authentification bearer normale du fournisseur Ollama lorsque l'hôte l'exige
- **API Perplexity Search** : `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, ou `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily** : `TAVILY_API_KEY` ou `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo** : repli sans clé (pas de facturation d'API, mais non officiel et basé sur HTML)
- **SearXNG** : `SEARXNG_BASE_URL` ou `plugins.entries.searxng.config.webSearch.baseUrl` (sans clé/autohébergé ; pas de facturation d'API hébergée)

Les anciens chemins de fournisseur `tools.web.search.*` sont toujours chargés via le shim temporaire de compatibilité, mais ils ne sont plus la surface de configuration recommandée.

**Crédit gratuit Brave Search :** chaque plan Brave inclut 5 $/mois de crédit gratuit renouvelé. Le plan Search coûte 5 $ pour 1 000 requêtes, donc ce crédit couvre 1 000 requêtes/mois sans frais. Définissez votre limite d'utilisation dans le dashboard Brave pour éviter des frais inattendus.

Voir [Outils web](/tools/web).

### 5) Outil de récupération web (Firecrawl)

`web_fetch` peut appeler **Firecrawl** lorsqu'une clé API est présente :

- `FIRECRAWL_API_KEY` ou `plugins.entries.firecrawl.config.webFetch.apiKey`

Si Firecrawl n'est pas configuré, l'outil revient à une récupération directe + readability (pas d'API payante).

Voir [Outils web](/tools/web).

### 6) Instantanés d'utilisation fournisseur (status/health)

Certaines commandes d'état appellent des **points de terminaison d'utilisation fournisseur** pour afficher des fenêtres de quota ou l'état de l'authentification.
Il s'agit généralement d'appels à faible volume, mais ils touchent tout de même les API fournisseur :

- `openclaw status --usage`
- `openclaw models status --json`

Voir [CLI Models](/cli/models).

### 7) Résumé de protection de compaction

La protection de compaction peut résumer l'historique de session à l'aide du **modèle actuel**, ce
qui invoque des API fournisseur lorsqu'elle s'exécute.

Voir [Gestion de session + compaction](/reference/session-management-compaction).

### 8) Scan / sonde de modèle

`openclaw models scan` peut sonder les modèles OpenRouter et utilise `OPENROUTER_API_KEY` lorsque
la sonde est activée.

Voir [CLI Models](/cli/models).

### 9) Talk (parole)

Le mode Talk peut invoquer **ElevenLabs** lorsqu'il est configuré :

- `ELEVENLABS_API_KEY` ou `talk.providers.elevenlabs.apiKey`

Voir [Mode Talk](/nodes/talk).

### 10) Skills (API tierces)

Les Skills peuvent stocker `apiKey` dans `skills.entries.<name>.apiKey`. Si une Skill utilise cette clé pour des
API externes, elle peut entraîner des coûts selon le fournisseur de la Skill.

Voir [Skills](/tools/skills).
