---
read_when:
    - explication de l’utilisation des tokens, des coûts ou des fenêtres de contexte
    - débogage de la croissance du contexte ou du comportement de Compaction
summary: comment OpenClaw construit le contexte de prompt et signale l’utilisation des tokens + les coûts
title: utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-04-24T07:32:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des tokens et coûts

OpenClaw suit des **tokens**, pas des caractères. Les tokens sont spécifiques au modèle, mais la plupart
des modèles de type OpenAI ont en moyenne ~4 caractères par token pour le texte anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il inclut :

- La liste des outils + de courtes descriptions
- La liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec redéfinition facultative par agent dans
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Les instructions d’auto-mise à jour
- L’espace de travail + les fichiers bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent). Le fichier racine en minuscules `memory.md` n’est pas injecté ; il sert d’entrée de réparation héritée pour `openclaw doctor --fix` lorsqu’il est associé à `MEMORY.md`. Les gros fichiers sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l’injection bootstrap totale est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt bootstrap normal ; ils restent à la demande via les outils mémoire lors des tours ordinaires, mais `/new` et `/reset` nus peuvent préfixer un bloc de contexte de démarrage ponctuel avec la mémoire quotidienne récente pour ce premier tour. Ce prélude de démarrage est contrôlé par `agents.defaults.startupContext`.
- L’heure (UTC + fuseau horaire utilisateur)
- Les balises de réponse + le comportement Heartbeat
- Les métadonnées runtime (hôte/OS/modèle/réflexion)

Voir le détail complet dans [Prompt système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte pour la limite de contexte :

- Le prompt système (toutes les sections listées ci-dessus)
- L’historique de conversation (messages utilisateur + assistant)
- Les appels d’outils et résultats d’outils
- Les pièces jointes/transcriptions (images, audio, fichiers)
- Les résumés de Compaction et les artefacts d’élagage
- Les wrappers fournisseur ou en-têtes de sécurité (non visibles, mais toujours comptés)

Certaines surfaces lourdes côté runtime ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les redéfinitions par agent se trouvent sous `agents.list[].contextLimits`. Ces paramètres
concernent les extraits runtime bornés et les blocs injectés possédés par le runtime. Ils sont
distincts des limites bootstrap, des limites de contexte de démarrage et des limites de prompt des skills.

Pour les images, OpenClaw réduit la taille des charges utiles d’image de transcription/outil avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l’usage des tokens de vision et la taille de charge utile.
- Des valeurs plus élevées préservent davantage de détails visuels pour les captures d’écran riches en OCR/UI.

Pour un détail pratique (par fichier injecté, outils, skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’utilisation actuelle des tokens

Utilisez ceci dans le chat :

- `/status` → **carte d’état riche en emoji** avec le modèle de session, l’utilisation du contexte,
  les tokens d’entrée/sortie de la dernière réponse, et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied d’usage par réponse** à chaque réponse.
  - Persiste par session (stocké comme `responseUsage`).
  - L’authentification OAuth **masque le coût** (tokens uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels de fenêtres d’usage : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’usage normalisent les alias de champs natifs fournisseur courants avant l’affichage.
Pour le trafic OpenAI-family Responses, cela inclut `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, de sorte que les noms de champs spécifiques au transport
ne changent pas `/status`, `/usage` ou les résumés de session.
L’usage JSON Gemini CLI est aussi normalisé : le texte de réponse vient de `response`, et
`stats.cached` est mappé vers `cacheRead` avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic natif OpenAI-family Responses, les alias d’usage WebSocket/SSE sont
normalisés de la même manière, et les totaux se replient sur l’entrée + la sortie normalisées lorsque
`total_tokens` est manquant ou vaut `0`.
Lorsque l’instantané de la session courante est peu fourni, `/status` et `session_status` peuvent
aussi récupérer les compteurs de tokens/cache et le label du modèle runtime actif depuis le
journal d’usage de la transcription la plus récente. Les valeurs live existantes non nulles gardent
toujours la priorité sur les valeurs de repli issues de la transcription, et des
totaux plus grands orientés prompt issus de la transcription peuvent l’emporter lorsque les totaux stockés sont absents ou plus petits.
L’authentification d’usage pour les fenêtres de quota fournisseur provient de hooks spécifiques au fournisseur lorsqu’ils sont disponibles ; sinon OpenClaw se replie sur les identifiants OAuth/clé API correspondants des profils d’authentification, de l’environnement ou de la configuration.
Les entrées de transcription de l’assistant persistent la même forme d’usage normalisée, y compris
`usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur
renvoie des métadonnées d’usage. Cela fournit à `/usage cost` et à l’état de session adossé à la transcription
une source stable même après disparition de l’état runtime live.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration tarifaire de modèle :

```
models.providers.<provider>.models[].cost
```

Ce sont des valeurs en **USD par 1M de tokens** pour `input`, `output`, `cacheRead`, et
`cacheWrite`. Si la tarification est absente, OpenClaw n’affiche que les tokens. Les jetons OAuth
n’affichent jamais de coût en dollars.

## Impact du TTL de cache et de l’élagage

Le cache de prompt fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut
facultativement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de recacher tout l’historique. Cela réduit les coûts d’écriture du cache lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Configuration Gateway](/fr/gateway/configuration) et voyez les
détails de comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** à travers les périodes d’inactivité. Si le TTL du cache de votre modèle
est `1h`, définir l’intervalle Heartbeat juste en dessous (par exemple `55m`) peut éviter
de recacher tout le prompt, réduisant ainsi les coûts d’écriture de cache.

Dans les configurations multi-agents, vous pouvez garder une configuration de modèle partagée et ajuster le comportement de cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet paramètre par paramètre, voir [Mise en cache de prompt](/fr/reference/prompt-caching).

Pour la tarification API Anthropic, les lectures de cache sont nettement moins chères que les tokens
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Voir la
tarification de mise en cache de prompt d’Anthropic pour les derniers tarifs et multiplicateurs TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1h chaud avec Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemple : trafic mixte avec stratégie de cache par agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` se fusionne au-dessus des `params` du modèle sélectionné, donc vous pouvez
redéfinir uniquement `cacheRetention` et hériter des autres valeurs par défaut du modèle sans changement.

### Exemple : activer l’en-tête bêta Anthropic 1M de contexte

La fenêtre de contexte 1M d’Anthropic est actuellement protégée par une bêta. OpenClaw peut injecter la
valeur `anthropic-beta` requise lorsque vous activez `context1m` sur des modèles Opus
ou Sonnet pris en charge.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Cela est mappé vers l’en-tête bêta Anthropic `context-1m-2025-08-07`.

Cela ne s’applique que lorsque `context1m: true` est défini sur cette entrée de modèle.

Exigence : l’identifiant doit être éligible à l’usage grand contexte. Sinon,
Anthropic répond avec une erreur de limitation de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des jetons OAuth/abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les grosses sorties d’outils dans vos flux de travail.
- Diminuez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de skills courtes (la liste des skills est injectée dans le prompt).
- Préférez des modèles plus petits pour les travaux verbeux et exploratoires.

Voir [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des skills.

## Liens associés

- [Utilisation API et coûts](/fr/reference/api-usage-costs)
- [Mise en cache de prompt](/fr/reference/prompt-caching)
- [Suivi de l’usage](/fr/concepts/usage-tracking)
