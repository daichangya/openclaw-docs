---
read_when:
    - Expliquer l’utilisation des jetons, les coûts ou les fenêtres de contexte
    - Déboguer la croissance du contexte ou le comportement de compaction
summary: Comment OpenClaw construit le contexte de prompt et rapporte l’utilisation des jetons + les coûts
title: Utilisation des jetons et coûts
x-i18n:
    generated_at: "2026-04-05T12:54:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Utilisation des jetons et coûts

OpenClaw suit des **jetons**, pas des caractères. Les jetons sont spécifiques au modèle, mais la plupart
des modèles de type OpenAI tournent en moyenne autour de ~4 caractères par jeton pour le texte anglais.

## Comment le prompt système est construit

OpenClaw assemble son propre prompt système à chaque exécution. Il inclut :

- Liste des outils + descriptions courtes
- Liste des Skills (uniquement les métadonnées ; les instructions sont chargées à la demande avec `read`)
- Instructions de mise à jour automatique
- Workspace + fichiers bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` lorsqu’il est nouveau, plus `MEMORY.md` lorsqu’il est présent ou `memory.md` comme repli en minuscules). Les gros fichiers sont tronqués par `agents.defaults.bootstrapMaxChars` (par défaut : 20000), et l’injection bootstrap totale est plafonnée par `agents.defaults.bootstrapTotalMaxChars` (par défaut : 150000). Les fichiers `memory/*.md` sont à la demande via les outils de mémoire et ne sont pas injectés automatiquement.
- Heure (UTC + fuseau horaire utilisateur)
- Balises de réponse + comportement heartbeat
- Métadonnées runtime (hôte/OS/modèle/thinking)

Voir la décomposition complète dans [System Prompt](/concepts/system-prompt).

## Ce qui compte dans la fenêtre de contexte

Tout ce que le modèle reçoit compte dans la limite de contexte :

- Prompt système (toutes les sections listées ci-dessus)
- Historique de conversation (messages utilisateur + assistant)
- Appels d’outils et résultats d’outils
- Pièces jointes/transcriptions (images, audio, fichiers)
- Résumés de compaction et artefacts d’élagage
- Wrappers fournisseur ou en-têtes de sécurité (non visibles, mais quand même comptés)

Pour les images, OpenClaw réduit la taille des charges utiles d’image de transcription/outils avant les appels au fournisseur.
Utilisez `agents.defaults.imageMaxDimensionPx` (par défaut : `1200`) pour ajuster cela :

- Des valeurs plus faibles réduisent généralement l’utilisation de jetons de vision et la taille des charges utiles.
- Des valeurs plus élevées préservent davantage de détails visuels pour l’OCR/les captures d’écran riches en UI.

Pour une décomposition pratique (par fichier injecté, outils, Skills et taille du prompt système), utilisez `/context list` ou `/context detail`. Voir [Context](/concepts/context).

## Comment voir l’utilisation actuelle des jetons

Utilisez ceci dans le chat :

- `/status` → **carte de statut riche en emoji** avec le modèle de session, l’utilisation du contexte,
  les jetons d’entrée/sortie de la dernière réponse, et le **coût estimé** (clé API uniquement).
- `/usage off|tokens|full` → ajoute un **pied de page d’utilisation par réponse** à chaque réponse.
  - Persiste par session (stocké comme `responseUsage`).
  - L’authentification OAuth **masque le coût** (jetons uniquement).
- `/usage cost` → affiche un résumé de coût local à partir des journaux de session OpenClaw.

Autres surfaces :

- **TUI/Web TUI :** `/status` + `/usage` sont pris en charge.
- **CLI :** `openclaw status --usage` et `openclaw channels list` affichent
  des fenêtres de quota fournisseur normalisées (`X% left`, pas les coûts par réponse).
  Fournisseurs actuels de fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi et z.ai.

Les surfaces d’utilisation normalisent les alias de champs natifs fournisseur courants avant affichage.
Pour le trafic OpenAI-family Responses, cela inclut `input_tokens` /
`output_tokens` et `prompt_tokens` / `completion_tokens`, de sorte que les noms de champs
spécifiques au transport ne modifient pas `/status`, `/usage` ou les résumés de session.
L’utilisation JSON Gemini CLI est aussi normalisée : le texte de réponse vient de `response`, et
`stats.cached` est mappé vers `cacheRead`, avec `stats.input_tokens - stats.cached`
utilisé lorsque la CLI omet un champ explicite `stats.input`.
Pour le trafic natif OpenAI-family Responses, les alias d’utilisation WebSocket/SSE sont
normalisés de la même manière, et les totaux se replient sur les entrées + sorties normalisées lorsque
`total_tokens` est absent ou vaut `0`.
Lorsque l’instantané de session courant est partiel, `/status` et `session_status` peuvent
aussi récupérer les compteurs de jetons/cache et le libellé actif du modèle runtime depuis le
journal d’utilisation de transcription le plus récent. Les valeurs live existantes non nulles gardent
la priorité sur les valeurs de repli issues de la transcription, et les totaux orientés prompt
plus élevés de la transcription peuvent l’emporter lorsque les totaux stockés sont absents ou plus faibles.
L’authentification d’utilisation pour les fenêtres de quota fournisseur vient de hooks spécifiques au fournisseur lorsque
disponibles ; sinon OpenClaw se replie sur les identifiants OAuth/clés API correspondants
depuis les profils d’authentification, l’environnement ou la configuration.

## Estimation des coûts (lorsqu’elle est affichée)

Les coûts sont estimés à partir de votre configuration tarifaire de modèle :

```
models.providers.<provider>.models[].cost
```

Il s’agit de **USD par 1M de jetons** pour `input`, `output`, `cacheRead`, et
`cacheWrite`. Si les tarifs sont absents, OpenClaw n’affiche que les jetons. Les jetons OAuth
n’affichent jamais de coût en dollars.

## Impact du TTL de cache et de l’élagage

La mise en cache des prompts côté fournisseur ne s’applique que pendant la fenêtre TTL du cache. OpenClaw peut
facultativement exécuter un **élagage cache-ttl** : il élague la session une fois le TTL de cache
expiré, puis réinitialise la fenêtre de cache pour que les requêtes suivantes puissent réutiliser le
contexte fraîchement remis en cache au lieu de remettre en cache tout l’historique. Cela réduit les coûts
d’écriture dans le cache lorsqu’une session reste inactive au-delà du TTL.

Configurez cela dans [Gateway configuration](/gateway/configuration) et consultez les
détails de comportement dans [Session pruning](/concepts/session-pruning).

Heartbeat peut garder le cache **chaud** pendant les périodes d’inactivité. Si le TTL de cache de votre modèle
est `1h`, définir l’intervalle heartbeat juste en dessous (par ex. `55m`) peut éviter
de remettre en cache tout le prompt, réduisant ainsi les coûts d’écriture dans le cache.

Dans les configurations multi-agent, vous pouvez garder une configuration de modèle partagée et ajuster le comportement du cache
par agent avec `agents.list[].params.cacheRetention`.

Pour un guide complet paramètre par paramètre, voir [Prompt Caching](/reference/prompt-caching).

Pour les tarifs API Anthropic, les lectures de cache sont nettement moins chères que les jetons
d’entrée, tandis que les écritures de cache sont facturées avec un multiplicateur plus élevé. Consultez la
tarification Anthropic du prompt caching pour les derniers tarifs et multiplicateurs TTL :
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemple : garder un cache de 1h chaud avec heartbeat

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

`agents.list[].params` fusionne par-dessus les `params` du modèle sélectionné, ce qui vous permet de
surcharger uniquement `cacheRetention` et d’hériter du reste des valeurs par défaut du modèle sans changement.

### Exemple : activer l’en-tête bêta Anthropic 1M context

La fenêtre de contexte 1M d’Anthropic est actuellement protégée par bêta. OpenClaw peut injecter la
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

Exigence : l’identifiant doit être éligible à l’utilisation long-context (facturation par clé API
ou chemin de connexion Claude d’OpenClaw avec Extra Usage activée). Sinon,
Anthropic répond
avec `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Si vous authentifiez Anthropic avec des jetons OAuth/d’abonnement (`sk-ant-oat-*`),
OpenClaw ignore l’en-tête bêta `context-1m-*` parce qu’Anthropic rejette actuellement
cette combinaison avec HTTP 401.

## Conseils pour réduire la pression sur les jetons

- Utilisez `/compact` pour résumer les longues sessions.
- Réduisez les grosses sorties d’outils dans vos workflows.
- Réduisez `agents.defaults.imageMaxDimensionPx` pour les sessions riches en captures d’écran.
- Gardez les descriptions de Skills courtes (la liste des Skills est injectée dans le prompt).
- Préférez des modèles plus petits pour le travail verbeux et exploratoire.

Voir [Skills](/tools/skills) pour la formule exacte de surcharge de la liste des Skills.
