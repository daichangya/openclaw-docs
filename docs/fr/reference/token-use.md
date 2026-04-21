---
read_when:
    - Expliquer l’utilisation des tokens, les coûts ou les fenêtres de contexte
    - Déboguer la croissance du contexte ou le comportement de Compaction
summary: Comment OpenClaw construit le contexte de prompt et rapporte l’utilisation des tokens + les coûts
title: Utilisation des tokens et coûts
x-i18n:
    generated_at: "2026-04-21T07:06:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des tokens et coûts

OpenClaw suit les **tokens**, pas les caractères. Les tokens dépendent du modèle, mais la plupart
des modèles de type OpenAI comptent en moyenne ~4 caractères par token pour le texte anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il comprend :

- Liste des outils + descriptions courtes
- Liste des Skills (métadonnées uniquement ; les instructions sont chargées à la demande avec `read`).
  Le bloc compact des Skills est limité par `skills.limits.maxSkillsPromptChars`,
  avec un remplacement facultatif par agent sous
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instructions d’auto-mise à jour
- Espace de travail + fichiers d’amorçage (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent ou `memory.md` comme repli en minuscules). Les fichiers volumineux sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 12000), et l’injection totale d’amorçage est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 60000). Les fichiers quotidiens `memory/*.md` ne font pas partie du prompt d’amorçage normal ; ils restent à la demande via les outils mémoire lors des tours ordinaires, mais les commandes brutes `/new` et `/reset` peuvent préfixer un bloc ponctuel de contexte de démarrage avec la mémoire quotidienne récente pour ce premier tour. Ce préambule de démarrage est contrôlé par `agents.defaults.startupContext`.
- Heure (UTC + fuseau horaire utilisateur)
- Balises de réponse + comportement Heartbeat
- Métadonnées runtime (hôte/OS/modèle/réflexion)

Voir le détail complet dans [Prompt système](/fr/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes / transcriptions (images, audio, fichiers)
- Résumés de Compaction et artefacts d’élagage
- Wrappers fournisseur ou en-têtes de sécurité (non visibles, mais toujours comptés)

Certaines surfaces runtime lourdes ont leurs propres plafonds explicites :

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Les remplacements par agent se trouvent sous `agents.list[].contextLimits`. Ces réglages
concernent les extraits runtime bornés et les blocs injectés détenus par le runtime. Ils sont
distincts des limites d’amorçage, des limites de contexte de démarrage et des
limites de prompt Skills.

Pour les images, OpenClaw redimensionne les charges utiles d’image de transcription / outil avant les appels fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l’usage de tokens vision et la taille des charges utiles.
- Des valeurs plus élevées conservent davantage de détails visuels pour les captures d’écran riches en OCR / UI.

Pour un détail pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Contexte](/fr/concepts/context).

## Comment voir l’usage actuel des tokens

Utilisez ces commandes dans le chat :

- `/status` → **carte de statut riche en emoji** avec le modèle de la session, l’usage du contexte,
  les tokens d’entrée / sortie de la dernière réponse et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d’usage par réponse** à chaque réponse.
  - Persiste par session (stocké sous `responseUsage`).
  - L’auth OAuth **masque le coût** (tokens uniquement).
- `/usage cost` → affiche un résumé local des coûts à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels avec fenêtre d’usage : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’usage normalisent les alias de champs natifs fournisseurs courants avant affichage.
Pour le trafic OpenAI family Responses, cela inclut à la fois `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, de sorte que les noms de champs spécifiques au transport
ne changent pas `/status`, `/usage` ni les résumés de session.
L’usage JSON Gemini CLI est aussi normalisé : le texte de réponse provient de `response`, et
`stats.cached` est mappé vers `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic natif OpenAI family Responses, les alias d’usage WebSocket / SSE sont
normalisés de la même manière, et les totaux retombent sur l’entrée + sortie normalisées lorsque
`total_tokens` est manquant ou vaut `0`.
Lorsque l’instantané de la session courante est peu fourni, `/status` et `session_status` peuvent
aussi récupérer les compteurs token / cache et le libellé du modèle runtime actif depuis le journal d’usage de transcription le plus récent. Les valeurs live existantes non nulles gardent la priorité sur les valeurs de repli de transcription, et les totaux orientés prompt plus élevés dans la transcription
peuvent l’emporter lorsque les totaux stockés sont absents ou plus faibles.
L’auth d’usage pour les fenêtres de quota fournisseur provient de hooks spécifiques au fournisseur lorsque
disponibles ; sinon OpenClaw retombe sur les identifiants OAuth / clé API correspondants issus des profils d’auth, de l’environnement ou de la configuration.
Les entrées de transcription assistant conservent la même forme d’usage normalisée, y compris
`usage.cost` lorsque le modèle actif a une tarification configurée et que le fournisseur
renvoie des métadonnées d’usage. Cela donne à `/usage cost` et au statut de session
adossé à la transcription une source stable même après disparition de l’état runtime live.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration de tarification des modèles :

```
models.providers.<provider>.models[].cost
```

Il s’agit de **USD par 1M de tokens** pour `input`, `output`, `cacheRead` et
`cacheWrite`. Si la tarification manque, OpenClaw n’affiche que les tokens. Les jetons OAuth
n’affichent jamais de coût en dollars.

## Impact du TTL de cache et de l’élagage

Le cache de prompt fournisseur ne s’applique que dans la fenêtre TTL du cache. OpenClaw peut
éventuellement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL du cache
expiré, puis réinitialise la fenêtre de cache afin que les requêtes suivantes puissent réutiliser le
contexte fraîchement mis en cache au lieu de remettre en cache tout l’historique. Cela maintient les coûts
d’écriture du cache à un niveau plus faible lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Configuration du Gateway](/fr/gateway/configuration) et consultez les
détails de comportement dans [Élagage de session](/fr/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d’inactivité. Si le TTL de cache de votre modèle
est de `1h`, régler l’intervalle Heartbeat juste en dessous (par ex. `55m`) peut éviter
de remettre en cache tout le prompt, réduisant ainsi les coûts d’écriture du cache.

Dans les configurations multi-agents, vous pouvez conserver une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet paramètre par paramètre, voir [Mise en cache des prompts](/fr/reference/prompt-caching).

Pour la tarification API Anthropic, les lectures du cache sont significativement moins chères que les tokens
d’entrée, tandis que les écritures du cache sont facturées avec un multiplicateur plus élevé. Consultez la tarification
du prompt caching d’Anthropic pour les taux et multiplicateurs TTL les plus récents :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder chaud un cache de 1h avec Heartbeat

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
          cacheRetention: "long" # base par défaut pour la plupart des agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # garder chaud le cache long pour les sessions profondes
    - id: "alerts"
      params:
        cacheRetention: "none" # éviter les écritures de cache pour les notifications en rafales
```

`agents.list[].params` se fusionne par-dessus les `params` du modèle sélectionné, ce qui vous permet
de ne remplacer que `cacheRetention` et d’hériter des autres valeurs par défaut du modèle sans changement.

### Exemple : activer l’en-tête bêta Anthropic 1M context

La fenêtre de contexte 1M d’Anthropic est actuellement contrôlée par un accès bêta. OpenClaw peut injecter la
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

Cela correspond à l’en-tête bêta `context-1m-2025-08-07` d’Anthropic.

Cela ne s’applique que lorsque `context1m: true` est défini sur cette entrée de modèle.

Exigence : l’identifiant doit être éligible à l’usage de contexte long. Sinon,
Anthropic répond avec une erreur de limitation de débit côté fournisseur pour cette requête.

Si vous authentifiez Anthropic avec des jetons OAuth / abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` car Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les tokens

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les sorties d’outils volumineuses dans vos flux de travail.
- Réduisez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Voir [Skills](/fr/tools/skills) pour la formule exacte de surcharge de la liste des Skills.
