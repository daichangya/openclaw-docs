---
read_when:
    - Vous voulez utiliser des modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-06T03:10:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc6c4938674aedf20ff944bc04e742c9a7e77a5ff10ae4f95b5718504c57c2d
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic développe la famille de modèles **Claude** et fournit un accès via une API.
Dans OpenClaw, la nouvelle configuration Anthropic doit utiliser une clé API. Les anciens
profils de jeton Anthropic hérités sont toujours respectés à l’exécution s’ils sont déjà
configurés.

<Warning>
Pour Anthropic dans OpenClaw, la répartition de la facturation est la suivante :

- **Clé API Anthropic** : facturation API Anthropic normale.
- **Authentification par abonnement Claude dans OpenClaw** : Anthropic a indiqué aux utilisateurs d’OpenClaw le
  **4 avril 2026 à 12 h 00 PT / 20 h 00 BST** que cela compte comme une
  utilisation d’un harnais tiers et nécessite **Extra Usage** (paiement à l’usage,
  facturé séparément de l’abonnement).

Nos reproductions locales correspondent à cette répartition :

- `claude -p` direct peut encore fonctionner
- `claude -p --append-system-prompt ...` peut déclencher la protection Extra Usage lorsque
  le prompt identifie OpenClaw
- le même prompt système de type OpenClaw ne reproduit **pas** le blocage sur le
  chemin Anthropic SDK + `ANTHROPIC_API_KEY`

La règle pratique est donc : **clé API Anthropic, ou abonnement Claude avec
Extra Usage**. Si vous voulez le chemin de production le plus clair, utilisez une clé API Anthropic.

Documentation publique actuelle d’Anthropic :

- [Référence CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Présentation du SDK Claude Agent](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Utiliser Claude Code avec votre forfait Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre forfait Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Si vous voulez le chemin de facturation le plus clair, utilisez plutôt une clé API Anthropic.
OpenClaw prend également en charge d’autres options de type abonnement, notamment [OpenAI
Codex](/fr/providers/openai), [Qwen Cloud Coding Plan](/fr/providers/qwen),
[MiniMax Coding Plan](/fr/providers/minimax), et [Z.AI / GLM Coding
Plan](/fr/providers/glm).
</Warning>

## Option A : clé API Anthropic

**Idéal pour :** l’accès API standard et la facturation à l’usage.
Créez votre clé API dans la console Anthropic.

### Configuration CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Extrait de configuration Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Valeurs par défaut de thinking (Claude 4.6)

- Les modèles Anthropic Claude 4.6 utilisent par défaut le thinking `adaptive` dans OpenClaw lorsqu’aucun niveau de thinking explicite n’est défini.
- Vous pouvez remplacer cela par message (`/think:<level>`) ou dans les paramètres du modèle :
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentation Anthropic associée :
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Mode rapide (API Anthropic)

Le basculement partagé `/fast` d’OpenClaw prend aussi en charge le trafic Anthropic public direct, y compris les requêtes authentifiées par clé API et par OAuth envoyées à `api.anthropic.com`.

- `/fast on` est mappé vers `service_tier: "auto"`
- `/fast off` est mappé vers `service_tier: "standard_only"`
- Valeur par défaut de configuration :

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Limites importantes :

- OpenClaw injecte les niveaux de service Anthropic uniquement pour les requêtes directes vers `api.anthropic.com`. Si vous acheminez `anthropic/*` via un proxy ou une passerelle, `/fast` laisse `service_tier` inchangé.
- Les paramètres explicites du modèle Anthropic `serviceTier` ou `service_tier` remplacent la valeur par défaut de `/fast` lorsque les deux sont définis.
- Anthropic rapporte le niveau effectif dans la réponse sous `usage.service_tier`. Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut quand même se résoudre en `standard`.

## Mise en cache des prompts (API Anthropic)

OpenClaw prend en charge la fonctionnalité de mise en cache des prompts d’Anthropic. Elle est **réservée à l’API** ; l’authentification Anthropic héritée par jeton ne respecte pas les paramètres de cache.

### Configuration

Utilisez le paramètre `cacheRetention` dans la configuration de votre modèle :

| Valeur  | Durée du cache | Description |
| ------- | -------------- | ----------- |
| `none`  | Pas de cache   | Désactiver la mise en cache des prompts |
| `short` | 5 minutes      | Valeur par défaut pour l’authentification par clé API |
| `long`  | 1 heure        | Cache étendu |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Valeurs par défaut

Lorsque vous utilisez l’authentification par clé API Anthropic, OpenClaw applique automatiquement `cacheRetention: "short"` (cache de 5 minutes) à tous les modèles Anthropic. Vous pouvez remplacer cela en définissant explicitement `cacheRetention` dans votre configuration.

### Remplacements `cacheRetention` par agent

Utilisez les paramètres au niveau du modèle comme base, puis remplacez-les pour des agents spécifiques via `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Ordre de fusion de configuration pour les paramètres liés au cache :

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id` correspondant, remplacement par clé)

Cela permet à un agent de conserver un cache longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour éviter les coûts d’écriture sur un trafic en rafales/à faible réutilisation.

### Notes sur Claude sur Bedrock

- Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le passage direct de `cacheRetention` lorsqu’il est configuré.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
- Les valeurs par défaut intelligentes de la clé API Anthropic définissent aussi `cacheRetention: "short"` pour les références de modèle Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.

## Fenêtre de contexte 1M (bêta Anthropic)

La fenêtre de contexte 1M d’Anthropic est soumise à une activation bêta. Dans OpenClaw, activez-la par modèle
avec `params.context1m: true` pour les modèles Opus/Sonnet pris en charge.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw mappe cela vers `anthropic-beta: context-1m-2025-08-07` sur les requêtes Anthropic.

Cela ne s’active que lorsque `params.context1m` est explicitement défini à `true` pour
ce modèle.

Exigence : Anthropic doit autoriser l’usage de contexte long sur cet identifiant
(en général via la facturation par clé API, ou le chemin de connexion Claude d’OpenClaw / l’authentification par jeton héritée
avec Extra Usage activé). Sinon Anthropic renvoie :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Remarque : Anthropic rejette actuellement les requêtes bêta `context-1m-*` lors de l’utilisation de
l’authentification Anthropic héritée par jeton (`sk-ant-oat-*`). Si vous configurez
`context1m: true` avec ce mode d’authentification hérité, OpenClaw enregistre un avertissement et
revient à la fenêtre de contexte standard en ignorant l’en-tête bêta context1m
tout en conservant les bêtas OAuth requises.

## Supprimé : backend Claude CLI

Le backend groupé Anthropic `claude-cli` a été supprimé.

- L’avis d’Anthropic du 4 avril 2026 indique que le trafic de connexion Claude piloté par OpenClaw est
  une utilisation d’un harnais tiers et nécessite **Extra Usage**.
- Nos reproductions locales montrent aussi que
  `claude -p --append-system-prompt ...` direct peut déclencher la même protection lorsque le
  prompt ajouté identifie OpenClaw.
- Le même prompt système de type OpenClaw ne déclenche pas cette protection sur le
  chemin Anthropic SDK + `ANTHROPIC_API_KEY`.
- Utilisez des clés API Anthropic pour le trafic Anthropic dans OpenClaw.

## Remarques

- La documentation publique Claude Code d’Anthropic documente toujours l’usage direct de la CLI comme
  `claude -p`, mais l’avis séparé d’Anthropic aux utilisateurs d’OpenClaw indique que le
  chemin de connexion Claude **OpenClaw** constitue une utilisation d’un harnais tiers et nécessite
  **Extra Usage** (paiement à l’usage facturé séparément de l’abonnement).
  Nos reproductions locales montrent aussi que
  `claude -p --append-system-prompt ...` direct peut déclencher la même protection lorsque le
  prompt ajouté identifie OpenClaw, alors que la même forme de prompt ne se
  reproduit pas sur le chemin Anthropic SDK + `ANTHROPIC_API_KEY`. Pour la production, nous
  recommandons plutôt les clés API Anthropic.
- Le setup-token Anthropic est de nouveau disponible dans OpenClaw comme chemin hérité/manuel. L’avis de facturation spécifique à OpenClaw d’Anthropic s’applique toujours, donc utilisez-le en considérant qu’Anthropic exige **Extra Usage** pour ce chemin.
- Les détails d’authentification + règles de réutilisation se trouvent dans [/concepts/oauth](/fr/concepts/oauth).

## Dépannage

**Erreurs 401 / jeton soudainement invalide**

- L’authentification Anthropic héritée par jeton peut expirer ou être révoquée.
- Pour une nouvelle configuration, migrez vers une clé API Anthropic.

**Aucune clé API trouvée pour le fournisseur "anthropic"**

- L’authentification est **par agent**. Les nouveaux agents n’héritent pas des clés de l’agent principal.
- Relancez l’intégration pour cet agent, ou configurez une clé API sur l’hôte
  de la passerelle, puis vérifiez avec `openclaw models status`.

**Aucun identifiant trouvé pour le profil `anthropic:default`**

- Exécutez `openclaw models status` pour voir quel profil d’authentification est actif.
- Relancez l’intégration, ou configurez une clé API pour ce chemin de profil.

**Aucun profil d’authentification disponible (tous en refroidissement/indisponibles)**

- Vérifiez `openclaw models status --json` pour `auth.unusableProfiles`.
- Les refroidissements de limitation de débit Anthropic peuvent être à portée de modèle, donc un modèle Anthropic voisin
  peut encore être utilisable même lorsque le modèle actuel est en refroidissement.
- Ajoutez un autre profil Anthropic ou attendez la fin du refroidissement.

Plus d’informations : [/gateway/troubleshooting](/fr/gateway/troubleshooting) et [/help/faq](/fr/help/faq).
