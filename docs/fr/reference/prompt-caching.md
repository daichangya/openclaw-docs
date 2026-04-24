---
read_when:
    - Vous voulez réduire les coûts en tokens d’invite grâce à la conservation du cache
    - Vous avez besoin d’un comportement de cache par agent dans des configurations multi-agents
    - Vous ajustez ensemble Heartbeat et l’élagage cache-ttl
summary: Réglages de mise en cache des prompts, ordre de fusion, comportement des fournisseurs et schémas d’ajustement
title: Mise en cache des prompts
x-i18n:
    generated_at: "2026-04-24T07:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

La mise en cache des prompts signifie que le fournisseur de modèle peut réutiliser des préfixes d’invite inchangés (généralement les instructions système/développeur et d’autres contextes stables) d’un tour à l’autre au lieu de les retraiter à chaque fois. OpenClaw normalise l’usage du fournisseur en `cacheRead` et `cacheWrite` lorsque l’API amont expose directement ces compteurs.

Les surfaces d’état peuvent aussi récupérer les compteurs de cache depuis le journal d’utilisation de transcription le plus récent lorsque le snapshot de session en direct ne les contient pas, de sorte que `/status` peut continuer d’afficher une ligne de cache après une perte partielle des métadonnées de session. Les valeurs de cache en direct non nulles existantes restent prioritaires sur les valeurs de repli issues de la transcription.

Pourquoi cela compte : coût en tokens plus faible, réponses plus rapides et performance plus prévisible pour les sessions de longue durée. Sans mise en cache, les invites répétées paient le coût complet de l’invite à chaque tour, même lorsque la majeure partie de l’entrée n’a pas changé.

Cette page couvre tous les réglages liés au cache qui affectent la réutilisation des invites et le coût en tokens.

Références fournisseurs :

- Mise en cache des prompts Anthropic : [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Mise en cache des prompts OpenAI : [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- En-têtes API OpenAI et IDs de requête : [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de requête et erreurs Anthropic : [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Réglages principaux

### `cacheRetention` (valeur par défaut globale, modèle et par agent)

Définissez la conservation du cache comme valeur globale par défaut pour tous les modèles :

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Remplacement par modèle :

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

Ordre de fusion de configuration :

1. `agents.defaults.params` (valeur globale par défaut — s’applique à tous les modèles)
2. `agents.defaults.models["provider/model"].params` (remplacement par modèle)
3. `agents.list[].params` (ID d’agent correspondant ; remplace clé par clé)

### `contextPruning.mode: "cache-ttl"`

Élague l’ancien contexte de résultat d’outil après les fenêtres TTL du cache afin que les requêtes après inactivité ne remettent pas en cache un historique surdimensionné.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Voir [Élagage de session](/fr/concepts/session-pruning) pour le comportement complet.

### Maintien au chaud par Heartbeat

Heartbeat peut garder les fenêtres de cache chaudes et réduire les réécritures répétées du cache après des périodes d’inactivité.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat par agent est pris en charge sous `agents.list[].heartbeat`.

## Comportement des fournisseurs

### Anthropic (API directe)

- `cacheRetention` est pris en charge.
- Avec les profils d’authentification par clé API Anthropic, OpenClaw initialise `cacheRetention: "short"` pour les références de modèle Anthropic lorsqu’il n’est pas défini.
- Les réponses Anthropic Messages natives exposent à la fois `cache_read_input_tokens` et `cache_creation_input_tokens`, donc OpenClaw peut afficher `cacheRead` et `cacheWrite`.
- Pour les requêtes Anthropic natives, `cacheRetention: "short"` correspond au cache éphémère par défaut de 5 minutes, et `cacheRetention: "long"` passe à un TTL d’1 heure uniquement sur les hôtes directs `api.anthropic.com`.

### OpenAI (API directe)

- La mise en cache des prompts est automatique sur les modèles récents pris en charge. OpenClaw n’a pas besoin d’injecter de marqueurs de cache au niveau des blocs.
- OpenClaw utilise `prompt_cache_key` pour garder un routage de cache stable entre les tours et n’utilise `prompt_cache_retention: "24h"` que lorsque `cacheRetention: "long"` est sélectionné sur des hôtes OpenAI directs.
- Les réponses OpenAI exposent les tokens d’invite mis en cache via `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` sur les événements de l’API Responses). OpenClaw les mappe vers `cacheRead`.
- OpenAI n’expose pas de compteur distinct de tokens d’écriture de cache, donc `cacheWrite` reste à `0` sur les chemins OpenAI même lorsque le fournisseur réchauffe un cache.
- OpenAI renvoie des en-têtes utiles de traçage et de limitation de débit comme `x-request-id`, `openai-processing-ms` et `x-ratelimit-*`, mais la comptabilisation des hits de cache doit provenir de la charge utile d’utilisation, pas des en-têtes.
- En pratique, OpenAI se comporte souvent comme un cache de préfixe initial plutôt qu’une réutilisation de l’historique complet à la manière d’Anthropic. Les tours avec préfixe long et stable peuvent se stabiliser autour d’un plateau de `4864` tokens mis en cache dans les sondes en direct actuelles, tandis que les transcriptions lourdes en outils ou de type MCP se stabilisent souvent autour de `4608` tokens mis en cache même sur des répétitions exactes.

### Anthropic Vertex

- Les modèles Anthropic sur Vertex AI (`anthropic-vertex/*`) prennent en charge `cacheRetention` de la même manière qu’Anthropic direct.
- `cacheRetention: "long"` correspond au vrai TTL de 1 heure du cache d’invite sur les endpoints Vertex AI.
- La conservation de cache par défaut pour `anthropic-vertex` correspond à celle d’Anthropic direct.
- Les requêtes Vertex sont routées via une mise en forme de cache sensible aux frontières afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.

### Amazon Bedrock

- Les références de modèle Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) prennent en charge le passage explicite de `cacheRetention`.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.

### Modèles Anthropic via OpenRouter

Pour les références de modèle `openrouter/anthropic/*`, OpenClaw injecte
`cache_control` Anthropic sur les blocs de prompt système/développeur afin d’améliorer la réutilisation
du cache d’invite uniquement lorsque la requête cible encore une route OpenRouter vérifiée
(`openrouter` sur son endpoint par défaut, ou tout fournisseur/URL de base qui se résout
vers `openrouter.ai`).

Si vous redirigez le modèle vers une URL de proxy arbitraire compatible OpenAI, OpenClaw
cesse d’injecter ces marqueurs de cache Anthropic spécifiques à OpenRouter.

### Autres fournisseurs

Si le fournisseur ne prend pas en charge ce mode de cache, `cacheRetention` n’a aucun effet.

### API directe Google Gemini

- Le transport direct Gemini (`api: "google-generative-ai"`) signale les hits de cache
  via `cachedContentTokenCount` en amont ; OpenClaw le mappe vers `cacheRead`.
- Lorsque `cacheRetention` est défini sur un modèle Gemini direct, OpenClaw crée,
  réutilise et actualise automatiquement les ressources `cachedContents` pour les prompts système
  sur les exécutions Google AI Studio. Cela signifie que vous n’avez plus besoin de précréer
  manuellement un handle de contenu mis en cache.
- Vous pouvez toujours transmettre un handle Gemini cached-content existant via
  `params.cachedContent` (ou l’ancien `params.cached_content`) sur le modèle configuré.
- C’est distinct de la mise en cache de préfixe d’invite Anthropic/OpenAI. Pour Gemini,
  OpenClaw gère une ressource native fournisseur `cachedContents` au lieu
  d’injecter des marqueurs de cache dans la requête.

### Utilisation JSON Gemini CLI

- La sortie JSON Gemini CLI peut aussi exposer les hits de cache via `stats.cached` ;
  OpenClaw le mappe vers `cacheRead`.
- Si la CLI omet une valeur directe `stats.input`, OpenClaw dérive les tokens d’entrée
  à partir de `stats.input_tokens - stats.cached`.
- Il s’agit uniquement d’une normalisation d’usage. Cela ne signifie pas qu’OpenClaw crée
  des marqueurs de cache d’invite de style Anthropic/OpenAI pour Gemini CLI.

## Frontière de cache du prompt système

OpenClaw découpe le prompt système en un **préfixe stable** et un **suffixe volatil**
séparés par une frontière interne de préfixe de cache. Le contenu au-dessus de la
frontière (définitions d’outils, métadonnées de Skills, fichiers d’espace de travail et autre
contexte relativement statique) est ordonné pour rester octet-identique d’un tour à l’autre.
Le contenu sous la frontière (par exemple `HEARTBEAT.md`, horodatages d’exécution et autres métadonnées par tour) est autorisé à changer sans invalider le préfixe mis en cache.

Choix de conception clés :

- Les fichiers stables de contexte de projet de l’espace de travail sont ordonnés avant `HEARTBEAT.md` afin que
  l’agitation de Heartbeat ne casse pas le préfixe stable.
- La frontière est appliquée à travers la mise en forme des transports de type Anthropic, de type OpenAI, Google et
  CLI, de sorte que tous les fournisseurs pris en charge bénéficient de la même stabilité de préfixe.
- Les requêtes Codex Responses et Anthropic Vertex sont routées via
  une mise en forme de cache sensible aux frontières afin que la réutilisation du cache reste alignée sur ce que les fournisseurs reçoivent réellement.
- Les empreintes du prompt système sont normalisées (espaces, fins de ligne,
  contexte ajouté par hook, ordre des capacités runtime) afin que les invites sémantiquement inchangées
  partagent le KV/cache entre les tours.

Si vous voyez des pics inattendus de `cacheWrite` après un changement de configuration ou d’espace de travail,
vérifiez si le changement se situe au-dessus ou au-dessous de la frontière de cache. Déplacer le
contenu volatil sous la frontière (ou le stabiliser) résout souvent le problème.

## Garde-fous de stabilité du cache OpenClaw

OpenClaw maintient aussi plusieurs formes de charge utile sensibles au cache déterministes avant
que la requête n’atteigne le fournisseur :

- Les catalogues d’outils MCP de bundle sont triés de manière déterministe avant l’enregistrement
  des outils, de sorte que les changements d’ordre `listTools()` n’agitent pas le bloc d’outils et
  ne cassent pas les préfixes de cache d’invite.
- Les anciennes sessions avec blocs d’image persistés gardent les **3 tours terminés les plus récents**
  intacts ; les anciens blocs d’image déjà traités peuvent être remplacés par
  un marqueur afin que les suivis lourds en images ne continuent pas à renvoyer de grosses
  charges utiles obsolètes.

## Schémas d’ajustement

### Trafic mixte (valeur par défaut recommandée)

Conservez une base de longue durée sur votre agent principal, désactivez la mise en cache sur les agents de notification en rafale :

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

### Base orientée coût

- Définissez `cacheRetention: "short"` comme base.
- Activez `contextPruning.mode: "cache-ttl"`.
- Gardez Heartbeat sous votre TTL uniquement pour les agents qui bénéficient de caches chauds.

## Diagnostics de cache

OpenClaw expose des diagnostics dédiés de trace de cache pour les exécutions d’agent intégrées.

Pour les diagnostics orientés utilisateur normaux, `/status` et les autres résumés d’usage peuvent utiliser
la dernière entrée d’utilisation de transcription comme source de repli pour `cacheRead` /
`cacheWrite` lorsque l’entrée de session en direct ne contient pas ces compteurs.

## Tests de régression en direct

OpenClaw conserve une seule porte de régression de cache en direct combinée pour les préfixes répétés, les tours d’outils, les tours d’image, les transcriptions d’outils de type MCP et un témoin Anthropic sans cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Exécutez la porte étroite en direct avec :

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Le fichier de base stocke les derniers chiffres observés en direct ainsi que les seuils de régression spécifiques au fournisseur utilisés par le test.
L’exécuteur utilise aussi des IDs de session frais par exécution et des espaces de noms d’invite afin que l’état de cache précédent ne pollue pas l’échantillon de régression courant.

Ces tests n’utilisent volontairement pas des critères de réussite identiques pour tous les fournisseurs.

### Attentes en direct pour Anthropic

- Attendre des écritures d’échauffement explicites via `cacheWrite`.
- Attendre une réutilisation quasi complète de l’historique sur les tours répétés parce que le contrôle de cache Anthropic fait progresser le point d’arrêt du cache à travers la conversation.
- Les assertions en direct actuelles utilisent encore des seuils élevés de taux de hit pour les chemins stables, d’outils et d’image.

### Attentes en direct pour OpenAI

- Attendre uniquement `cacheRead`. `cacheWrite` reste à `0`.
- Traiter la réutilisation de cache sur tours répétés comme un plateau spécifique au fournisseur, et non comme une réutilisation mobile de l’historique complet à la manière d’Anthropic.
- Les assertions en direct actuelles utilisent des contrôles de seuil conservateurs dérivés du comportement observé en direct sur `gpt-5.4-mini` :
  - préfixe stable : `cacheRead >= 4608`, taux de hit `>= 0.90`
  - transcription d’outil : `cacheRead >= 4096`, taux de hit `>= 0.85`
  - transcription d’image : `cacheRead >= 3840`, taux de hit `>= 0.82`
  - transcription de type MCP : `cacheRead >= 4096`, taux de hit `>= 0.85`

La vérification combinée fraîche en direct du 2026-04-04 a donné :

- préfixe stable : `cacheRead=4864`, taux de hit `0.966`
- transcription d’outil : `cacheRead=4608`, taux de hit `0.896`
- transcription d’image : `cacheRead=4864`, taux de hit `0.954`
- transcription de type MCP : `cacheRead=4608`, taux de hit `0.891`

Le temps d’exécution local récent pour la porte combinée était d’environ `88s`.

Pourquoi les assertions diffèrent :

- Anthropic expose des points d’arrêt explicites du cache et une réutilisation mobile de l’historique de conversation.
- La mise en cache des prompts OpenAI reste sensible aux préfixes exacts, mais le préfixe réutilisable effectif dans le trafic live Responses peut plafonner plus tôt que l’invite complète.
- À cause de cela, comparer Anthropic et OpenAI avec un seul seuil de pourcentage inter-fournisseurs crée de fausses régressions.

### Configuration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Valeurs par défaut :

- `filePath` : `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages` : `true`
- `includePrompt` : `true`
- `includeSystem` : `true`

### Bascule env (débogage ponctuel)

- `OPENCLAW_CACHE_TRACE=1` active la trace de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` remplace le chemin de sortie.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` active/désactive la capture complète des charges utiles de message.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` active/désactive la capture du texte de l’invite.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` active/désactive la capture de l’invite système.

### Ce qu’il faut inspecter

- Les événements de trace de cache sont en JSONL et incluent des snapshots par étape comme `session:loaded`, `prompt:before`, `stream:context` et `session:after`.
- L’impact des tokens de cache par tour est visible dans les surfaces normales d’utilisation via `cacheRead` et `cacheWrite` (par exemple `/usage full` et les résumés d’utilisation de session).
- Pour Anthropic, attendez-vous à voir `cacheRead` et `cacheWrite` lorsque la mise en cache est active.
- Pour OpenAI, attendez-vous à voir `cacheRead` sur les hits de cache et `cacheWrite` rester à `0` ; OpenAI ne publie pas de champ séparé pour les tokens d’écriture de cache.
- Si vous avez besoin d’une traçabilité des requêtes, journalisez les IDs de requête et les en-têtes de limitation de débit séparément des métriques de cache. La sortie actuelle de trace de cache d’OpenClaw se concentre sur la forme de l’invite/session et l’usage normalisé des tokens plutôt que sur les en-têtes bruts de réponse du fournisseur.

## Dépannage rapide

- `cacheWrite` élevé sur la plupart des tours : vérifiez les entrées volatiles du prompt système et confirmez que le modèle/fournisseur prend en charge vos réglages de cache.
- `cacheWrite` élevé sur Anthropic : cela signifie souvent que le point d’arrêt du cache tombe sur un contenu qui change à chaque requête.
- `cacheRead` OpenAI faible : vérifiez que le préfixe stable est en tête, que le préfixe répété fait au moins 1024 tokens, et que le même `prompt_cache_key` est réutilisé pour les tours qui doivent partager un cache.
- Aucun effet de `cacheRetention` : confirmez que la clé du modèle correspond à `agents.defaults.models["provider/model"]`.
- Requêtes Bedrock Nova/Mistral avec paramètres de cache : forçage d’exécution attendu vers `none`.

Documentation associée :

- [Anthropic](/fr/providers/anthropic)
- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Élagage de session](/fr/concepts/session-pruning)
- [Référence de configuration du Gateway](/fr/gateway/configuration-reference)

## Associé

- [Utilisation des tokens et coûts](/fr/reference/token-use)
- [Utilisation et coûts API](/fr/reference/api-usage-costs)
