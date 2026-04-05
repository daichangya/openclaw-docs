---
read_when:
    - Vous voulez réduire les coûts en jetons des prompts avec la rétention du cache
    - Vous avez besoin d’un comportement de cache par agent dans des configurations multi-agents
    - Vous ajustez heartbeat et l’élagage cache-ttl ensemble
summary: Paramètres de cache de prompt, ordre de fusion, comportement des fournisseurs et modèles de réglage
title: Cache de prompt
x-i18n:
    generated_at: "2026-04-05T12:53:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Cache de prompt

Le cache de prompt signifie que le fournisseur de modèle peut réutiliser des préfixes de prompt inchangés (généralement les instructions system/developer et d’autres contextes stables) entre les tours, au lieu de les retraiter à chaque fois. OpenClaw normalise l’usage fournisseur en `cacheRead` et `cacheWrite` lorsque l’API amont expose directement ces compteurs.

Les surfaces de statut peuvent aussi récupérer les compteurs de cache à partir du dernier journal
d’usage de transcription lorsque l’instantané live de session ne les contient pas, de sorte que `/status` puisse
continuer d’afficher une ligne de cache après une perte partielle des métadonnées de session. Les valeurs live existantes non nulles de cache restent prioritaires par rapport aux valeurs de repli issues de la transcription.

Pourquoi c’est important : coût en jetons plus faible, réponses plus rapides, et performances plus prévisibles pour les sessions de longue durée. Sans cache, les prompts répétés paient le coût total du prompt à chaque tour même lorsque la majeure partie de l’entrée ne change pas.

Cette page couvre tous les paramètres liés au cache qui affectent la réutilisation des prompts et le coût en jetons.

Références des fournisseurs :

- Cache de prompt Anthropic : [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompt OpenAI : [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- En-têtes API OpenAI et IDs de requête : [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de requête et erreurs Anthropic : [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Paramètres principaux

### `cacheRetention` (valeur par défaut globale, modèle et par agent)

Définissez la rétention du cache comme valeur par défaut globale pour tous les modèles :

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Remplacez-la par modèle :

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Remplacement par agent :

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordre de fusion de la configuration :

1. `agents.defaults.params` (valeur par défaut globale — s’applique à tous les modèles)
2. `agents.defaults.models["provider/model"].params` (remplacement par modèle)
3. `agents.list[].params` (ID d’agent correspondant ; remplace par clé)

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte des résultats d’outils après les fenêtres TTL du cache afin que les requêtes après inactivité ne remettent pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Voir [Élagage de session](/concepts/session-pruning) pour le comportement complet.

### Maintien à chaud via heartbeat

Heartbeat peut garder les fenêtres de cache chaudes et réduire les réécritures répétées du cache après des périodes d’inactivité.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat par agent est pris en charge via `agents.list[].heartbeat`.

## Comportement des fournisseurs

### Anthropic (API directe)

- `cacheRetention` est pris en charge.
- Avec les profils d’authentification à clé API Anthropic, OpenClaw initialise `cacheRetention: "short"` pour les références de modèles Anthropic lorsqu’elle n’est pas définie.
- Les réponses Messages natives Anthropic exposent à la fois `cache_read_input_tokens` et `cache_creation_input_tokens`, donc OpenClaw peut afficher `cacheRead` et `cacheWrite`.
- Pour les requêtes Anthropic natives, `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes, et `cacheRetention: "long"` passe à la TTL de 1 heure uniquement sur les hôtes directs `api.anthropic.com`.

### OpenAI (API directe)

- Le cache de prompt est automatique sur les modèles récents pris en charge. OpenClaw n’a pas besoin d’injecter de marqueurs de cache au niveau des blocs.
- OpenClaw utilise `prompt_cache_key` pour garder un routage de cache stable d’un tour à l’autre et utilise `prompt_cache_retention: "24h"` uniquement lorsque `cacheRetention: "long"` est sélectionné sur des hôtes directs OpenAI.
- OpenAI expose les jetons de prompt mis en cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` sur les événements Responses API). OpenClaw les mappe vers `cacheRead`.
- OpenAI n’expose pas de compteur distinct de jetons d’écriture de cache, donc `cacheWrite` reste à `0` sur les chemins OpenAI même lorsque le fournisseur réchauffe un cache.
- OpenAI renvoie des en-têtes utiles de traçage et de limitation de débit comme `x-request-id`, `openai-processing-ms`, et `x-ratelimit-*`, mais la comptabilisation des hits de cache doit venir de la charge utile d’usage, pas des en-têtes.
- En pratique, OpenAI se comporte souvent comme un cache de préfixe initial plutôt que comme la réutilisation complète d’un historique mobile à la Anthropic. Les tours texte stables avec un long préfixe peuvent atteindre un plateau d’environ `4864` jetons mis en cache dans les sondes live actuelles, tandis que les transcriptions riches en outils ou de type MCP plafonnent souvent près de `4608` jetons mis en cache, même sur des répétitions exactes.

### Anthropic Vertex

- Les modèles Anthropic sur Vertex AI (`anthropic-vertex/*`) prennent en charge `cacheRetention` de la même façon que l’API Anthropic directe.
- `cacheRetention: "long"` correspond à la vraie TTL de cache de prompt de 1 heure sur les points de terminaison Vertex AI.
- La rétention de cache par défaut pour `anthropic-vertex` correspond aux valeurs par défaut directes d’Anthropic.
- Les requêtes Vertex passent par un façonnage de cache sensible aux frontières afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.

### Amazon Bedrock

- Les références de modèle Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) prennent en charge le passage explicite de `cacheRetention`.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.

### Modèles Anthropic OpenRouter

Pour les références de modèle `openrouter/anthropic/*`, OpenClaw injecte
`cache_control` Anthropic sur les blocs de prompt system/developer afin d’améliorer la
réutilisation du cache de prompt uniquement lorsque la requête cible toujours une route OpenRouter vérifiée
(`openrouter` sur son point de terminaison par défaut, ou tout provider/base URL qui se résout vers `openrouter.ai`).

Si vous redirigez le modèle vers une URL de proxy arbitraire compatible OpenAI, OpenClaw
cesse d’injecter ces marqueurs de cache Anthropic spécifiques à OpenRouter.

### Autres fournisseurs

Si le fournisseur ne prend pas en charge ce mode de cache, `cacheRetention` n’a aucun effet.

### API directe Google Gemini

- Le transport Gemini direct (`api: "google-generative-ai"`) rapporte les hits de cache
  via `cachedContentTokenCount` amont ; OpenClaw le mappe vers `cacheRead`.
- Lorsque `cacheRetention` est défini sur un modèle Gemini direct, OpenClaw crée,
  réutilise et rafraîchit automatiquement des ressources `cachedContents` pour les prompts système
  dans les exécutions Google AI Studio. Cela signifie que vous n’avez plus besoin de précréer manuellement
  un handle cached-content.
- Vous pouvez toujours transmettre un handle Gemini cached-content existant via
  `params.cachedContent` (ou l’ancien `params.cached_content`) sur le modèle
  configuré.
- Ceci est distinct du cache de préfixe de prompt Anthropic/OpenAI. Pour Gemini,
  OpenClaw gère une ressource native fournisseur `cachedContents` au lieu
  d’injecter des marqueurs de cache dans la requête.

### Usage JSON Gemini CLI

- La sortie JSON de Gemini CLI peut aussi exposer des hits de cache via `stats.cached` ;
  OpenClaw le mappe vers `cacheRead`.
- Si la CLI omet une valeur directe `stats.input`, OpenClaw dérive les jetons d’entrée
  de `stats.input_tokens - stats.cached`.
- Il ne s’agit que d’une normalisation d’usage. Cela ne signifie pas qu’OpenClaw crée
  des marqueurs de cache de prompt de style Anthropic/OpenAI pour Gemini CLI.

## Frontière de cache du prompt système

OpenClaw divise le prompt système en un **préfixe stable** et un **suffixe volatil**
séparés par une frontière interne de préfixe de cache. Le contenu au-dessus de la
frontière (définitions d’outils, métadonnées de Skills, fichiers d’espace de travail, et autres
contextes relativement statiques) est ordonné pour rester identique octet pour octet entre les tours.
Le contenu sous la frontière (par exemple `HEARTBEAT.md`, horodatages runtime, et
autres métadonnées par tour) peut changer sans invalider le préfixe mis en cache.

Choix de conception clés :

- Les fichiers stables de contexte projet de l’espace de travail sont ordonnés avant `HEARTBEAT.md` afin que
  les variations de heartbeat n’invalident pas le préfixe stable.
- La frontière est appliquée dans le façonnage des transports de la famille Anthropic, de la famille OpenAI, Google et CLI afin que tous les fournisseurs pris en charge bénéficient de la même stabilité de préfixe.
- Les requêtes Codex Responses et Anthropic Vertex passent par un façonnage de cache sensible aux frontières afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.
- Les empreintes du prompt système sont normalisées (espaces, fins de ligne,
  contexte ajouté par hook, ordre des capacités runtime) afin que des prompts inchangés sur le plan sémantique partagent le KV/cache entre les tours.

Si vous voyez des pics inattendus de `cacheWrite` après un changement de configuration ou d’espace de travail,
vérifiez si ce changement se situe au-dessus ou au-dessous de la frontière de cache. Déplacer
du contenu volatil sous la frontière (ou le stabiliser) résout souvent le
problème.

## Garde-fous de stabilité du cache OpenClaw

OpenClaw maintient aussi plusieurs formes de charges utiles sensibles au cache déterministes avant
que la requête n’atteigne le fournisseur :

- Les catalogues d’outils MCP bundle sont triés de manière déterministe avant l’enregistrement
  des outils, afin que les changements d’ordre `listTools()` ne modifient pas le bloc d’outils
  et n’invalident pas les préfixes du cache de prompt.
- Les sessions héritées avec des blocs d’image persistés conservent intacts les **3 tours terminés
  les plus récents** ; les blocs d’image plus anciens déjà traités peuvent être
  remplacés par un marqueur afin que les suivis riches en images ne renvoient pas
  sans cesse de grosses charges utiles obsolètes.

## Modèles de réglage

### Trafic mixte (valeur par défaut recommandée)

Gardez une base de référence durable sur votre agent principal, désactivez le cache sur les agents notificateurs par rafales :

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Référence orientée coût

- Définissez la base sur `cacheRetention: "short"`.
- Activez `contextPruning.mode: "cache-ttl"`.
- Gardez heartbeat en dessous de votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Diagnostics du cache

OpenClaw expose des diagnostics dédiés de trace de cache pour les exécutions d’agent embarquées.

Pour les diagnostics utilisateur normaux, `/status` et d’autres résumés d’usage peuvent utiliser
la dernière entrée d’usage de transcription comme source de repli pour `cacheRead` /
`cacheWrite` lorsque l’entrée live de session ne contient pas ces compteurs.

## Tests live de régression

OpenClaw conserve une seule barrière combinée de régression live du cache pour les préfixes répétés, les tours d’outil, les tours d’image, les transcriptions d’outils de style MCP, et un témoin sans cache Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez cette barrière live ciblée avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de référence stocke les derniers nombres live observés ainsi que les seuils de régression spécifiques au fournisseur utilisés par le test.
L’exécuteur utilise aussi des ID de session et espaces de noms de prompt frais à chaque exécution afin que l’état de cache précédent ne pollue pas l’échantillon courant de régression.

Ces tests n’utilisent intentionnellement pas des critères de réussite identiques pour tous les fournisseurs.

### Attentes live Anthropic

- Attendez-vous à des écritures explicites d’échauffement via `cacheWrite`.
- Attendez-vous à une réutilisation presque complète de l’historique sur les tours répétés car le contrôle de cache Anthropic fait progresser le point de coupure du cache au fil de la conversation.
- Les assertions live actuelles utilisent encore des seuils élevés de taux de hit pour les chemins stables, outils et images.

### Attentes live OpenAI

- Attendez-vous uniquement à `cacheRead`. `cacheWrite` reste à `0`.
- Traitez la réutilisation du cache sur tours répétés comme un plateau spécifique au fournisseur, et non comme une réutilisation mobile complète de l’historique à la Anthropic.
- Les assertions live actuelles utilisent des seuils prudents dérivés du comportement live observé sur `gpt-5.4-mini` :
  - préfixe stable : `cacheRead >= 4608`, taux de hit `>= 0.90`
  - transcription d’outil : `cacheRead >= 4096`, taux de hit `>= 0.85`
  - transcription d’image : `cacheRead >= 3840`, taux de hit `>= 0.82`
  - transcription de style MCP : `cacheRead >= 4096`, taux de hit `>= 0.85`

La vérification live combinée fraîche du 2026-04-04 a donné :

- préfixe stable : `cacheRead=4864`, taux de hit `0.966`
- transcription d’outil : `cacheRead=4608`, taux de hit `0.896`
- transcription d’image : `cacheRead=4864`, taux de hit `0.954`
- transcription de style MCP : `cacheRead=4608`, taux de hit `0.891`

Le temps horloge local récent pour la barrière combinée était d’environ `88s`.

Pourquoi les assertions diffèrent :

- Anthropic expose des points de coupure de cache explicites et une réutilisation mobile de l’historique de conversation.
- Le cache de prompt OpenAI reste sensible au préfixe exact, mais le préfixe effectivement réutilisable dans le trafic live Responses peut plafonner plus tôt que le prompt complet.
- À cause de cela, comparer Anthropic et OpenAI avec un unique seuil de pourcentage inter-fournisseur crée de faux cas de régression.

### Configuration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # facultatif
    includeMessages: false # par défaut true
    includePrompt: false # par défaut true
    includeSystem: false # par défaut true
```

Valeurs par défaut :

- `filePath` : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages` : `true`
- `includePrompt` : `true`
- `includeSystem` : `true`

### Basculements env (débogage ponctuel)

- `OPENCLAW_CACHE_TRACE=1` active la trace de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` remplace le chemin de sortie.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` active/désactive la capture complète des charges utiles des messages.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` active/désactive la capture du texte du prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` active/désactive la capture du prompt système.

### Ce qu’il faut inspecter

- Les événements de trace de cache sont au format JSONL et incluent des instantanés par étape comme `session:loaded`, `prompt:before`, `stream:context`, et `session:after`.
- L’impact des jetons de cache par tour est visible dans les surfaces normales d’usage via `cacheRead` et `cacheWrite` (par exemple `/usage full` et les résumés d’usage de session).
- Pour Anthropic, attendez-vous à voir `cacheRead` et `cacheWrite` lorsque le cache est actif.
- Pour OpenAI, attendez-vous à `cacheRead` lors des hits de cache et à `cacheWrite` restant à `0` ; OpenAI ne publie pas de champ distinct pour les jetons d’écriture du cache.
- Si vous avez besoin de traçage de requête, journalisez les IDs de requête et les en-têtes de limitation de débit séparément des métriques de cache. La sortie actuelle de trace de cache d’OpenClaw est centrée sur la forme du prompt/de la session et l’usage normalisé des jetons plutôt que sur les en-têtes bruts de réponse du fournisseur.

## Dépannage rapide

- `cacheWrite` élevé sur la plupart des tours : vérifiez les entrées volatiles du prompt système et confirmez que le modèle/fournisseur prend en charge vos réglages de cache.
- `cacheWrite` élevé sur Anthropic : cela signifie souvent que le point de coupure du cache tombe sur du contenu qui change à chaque requête.
- `cacheRead` faible sur OpenAI : vérifiez que le préfixe stable est au début, que le préfixe répété fait au moins 1024 jetons, et que le même `prompt_cache_key` est réutilisé pour les tours censés partager un cache.
- Aucun effet de `cacheRetention` : confirmez que la clé de modèle correspond à `agents.defaults.models["provider/model"]`.
- Requêtes Bedrock Nova/Mistral avec réglages de cache : forçage runtime attendu vers `none`.

Documents associés :

- [Anthropic](/providers/anthropic)
- [Utilisation des jetons et coûts](/reference/token-use)
- [Élagage de session](/concepts/session-pruning)
- [Référence de configuration Gateway](/gateway/configuration-reference)
