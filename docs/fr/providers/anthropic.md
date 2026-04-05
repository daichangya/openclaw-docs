---
read_when:
    - Vous souhaitez utiliser des modèles Anthropic dans OpenClaw
    - Vous souhaitez réutiliser l’authentification par abonnement Claude CLI sur l’hôte de la passerelle
summary: Utiliser Anthropic Claude via des clés API ou Claude CLI dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T12:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic développe la famille de modèles **Claude** et fournit un accès via une API.
Dans OpenClaw, une nouvelle configuration Anthropic doit utiliser une clé API ou le
backend local Claude CLI. Les profils de jeton Anthropic historiques existants restent
pris en charge à l’exécution s’ils sont déjà configurés.

<Warning>
La documentation publique Claude Code d’Anthropic documente explicitement l’utilisation CLI
non interactive telle que `claude -p`. D’après cette documentation, nous pensons que le
mode de secours local Claude Code CLI géré par l’utilisateur est probablement autorisé.

Séparément, Anthropic a informé les utilisateurs d’OpenClaw le **4 avril 2026 à 12:00 PM
PT / 8:00 PM BST** qu’**OpenClaw est considéré comme un harnais tiers**. Selon leur
politique déclarée, le trafic Claude-login piloté par **OpenClaw** n’utilise plus le
pool d’abonnement Claude inclus et nécessite désormais **Extra Usage**
(paiement à l’usage, facturé séparément de l’abonnement).

Cette distinction de politique concerne la **réutilisation de Claude CLI pilotée par OpenClaw**,
et non l’exécution directe de `claude` dans votre propre terminal. Cela dit, la
politique de harnais tiers d’Anthropic laisse encore suffisamment d’ambiguïté autour
de l’utilisation adossée à un abonnement dans des produits externes pour que nous ne recommandions pas cette voie en production.

Documentation publique actuelle d’Anthropic :

- [Référence CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Vue d’ensemble de Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Utiliser Claude Code avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Si vous voulez la voie de facturation la plus claire, utilisez plutôt une clé API Anthropic.
OpenClaw prend également en charge d’autres options de type abonnement, y compris [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax), et [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Option A : clé API Anthropic

**Idéal pour :** accès API standard et facturation à l’usage.
Créez votre clé API dans la console Anthropic.

### Configuration CLI

```bash
openclaw onboard
# choisir : clé API Anthropic

# ou non interactif
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Extrait de configuration Claude CLI

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Valeurs par défaut de réflexion (Claude 4.6)

- Les modèles Anthropic Claude 4.6 utilisent par défaut la réflexion `adaptive` dans OpenClaw lorsqu’aucun niveau de réflexion explicite n’est défini.
- Vous pouvez remplacer cela par message (`/think:<level>`) ou dans les paramètres du modèle :
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentation Anthropic associée :
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Mode rapide (API Anthropic)

Le bouton `/fast` partagé d’OpenClaw prend également en charge le trafic direct public Anthropic, y compris les requêtes authentifiées par clé API et OAuth envoyées à `api.anthropic.com`.

- `/fast on` correspond à `service_tier: "auto"`
- `/fast off` correspond à `service_tier: "standard_only"`
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

- OpenClaw n’injecte les niveaux de service Anthropic que pour les requêtes directes vers `api.anthropic.com`. Si vous routez `anthropic/*` via un proxy ou une passerelle, `/fast` laisse `service_tier` inchangé.
- Les paramètres explicites de modèle Anthropic `serviceTier` ou `service_tier` remplacent la valeur par défaut `/fast` lorsque les deux sont définis.
- Anthropic signale le niveau effectif dans la réponse sous `usage.service_tier`. Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut quand même se résoudre en `standard`.

## Mise en cache des prompts (API Anthropic)

OpenClaw prend en charge la fonctionnalité de mise en cache des prompts d’Anthropic. Cela est **réservé à l’API** ; l’authentification par jeton Anthropic historique ne respecte pas les paramètres de cache.

### Configuration

Utilisez le paramètre `cacheRetention` dans votre configuration de modèle :

| Valeur   | Durée du cache | Description                |
| -------- | -------------- | -------------------------- |
| `none`   | Pas de cache   | Désactiver la mise en cache des prompts |
| `short`  | 5 minutes      | Valeur par défaut pour l’auth par clé API |
| `long`   | 1 heure        | Cache étendu               |

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

Lors de l’utilisation de l’authentification par clé API Anthropic, OpenClaw applique automatiquement `cacheRetention: "short"` (cache de 5 minutes) à tous les modèles Anthropic. Vous pouvez remplacer cela en définissant explicitement `cacheRetention` dans votre configuration.

### Remplacements `cacheRetention` par agent

Utilisez les paramètres au niveau du modèle comme base, puis remplacez des agents spécifiques via `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // base pour la plupart des agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // remplacement pour cet agent uniquement
    ],
  },
}
```

Ordre de fusion de configuration pour les paramètres liés au cache :

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (correspondance sur `id`, remplacement par clé)

Cela permet à un agent de conserver un cache longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour éviter les coûts d’écriture sur un trafic en rafale / à faible réutilisation.

### Remarques sur Bedrock Claude

- Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le passage direct de `cacheRetention` lorsqu’il est configuré.
- Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
- Les valeurs intelligentes par défaut pour les clés API Anthropic initialisent également `cacheRetention: "short"` pour les références de modèles Claude-on-Bedrock lorsqu’aucune valeur explicite n’est définie.

## Fenêtre de contexte 1M (bêta Anthropic)

La fenêtre de contexte 1M d’Anthropic est protégée par une bêta. Dans OpenClaw, activez-la par modèle
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

Cela ne s’active que lorsque `params.context1m` est explicitement défini à `true` pour ce modèle.

Exigence : Anthropic doit autoriser l’utilisation long-context sur cet identifiant
(généralement facturation par clé API, ou chemin Claude-login / authentification par jeton historique d’OpenClaw
avec Extra Usage activé). Sinon Anthropic renvoie :
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Remarque : Anthropic rejette actuellement les requêtes bêta `context-1m-*` lors de l’utilisation de
l’authentification par jeton Anthropic historique (`sk-ant-oat-*`). Si vous configurez
`context1m: true` avec ce mode d’authentification historique, OpenClaw journalise un avertissement et
revient à la fenêtre de contexte standard en omettant l’en-tête bêta context1m
tout en conservant les bêta OAuth requises.

## Option B : Claude CLI comme fournisseur de messages

**Idéal pour :** un hôte de passerelle mono-utilisateur qui a déjà Claude CLI installé
et connecté, comme solution de repli locale plutôt que comme voie de production recommandée.

Remarque de facturation : nous pensons que le mode de secours Claude Code CLI est probablement autorisé pour l’automatisation locale gérée par l’utilisateur d’après la documentation publique CLI d’Anthropic. Cela dit,
la politique de harnais tiers d’Anthropic crée suffisamment d’ambiguïté autour
de l’utilisation adossée à un abonnement dans des produits externes pour que nous ne la recommandions pas en
production. Anthropic a également indiqué aux utilisateurs d’OpenClaw que l’utilisation **pilotée par OpenClaw** de Claude
CLI est traitée comme du trafic de harnais tiers et, depuis le **4 avril 2026
à 12:00 PM PT / 8:00 PM BST**, nécessite **Extra Usage** au lieu des
limites d’abonnement Claude incluses.

Cette voie utilise le binaire local `claude` pour l’inférence du modèle au lieu d’appeler
directement l’API Anthropic. OpenClaw le traite comme un **fournisseur backend CLI**
avec des références de modèle comme :

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Fonctionnement :

1. OpenClaw lance `claude -p --output-format stream-json --include-partial-messages ...`
   sur l’**hôte de la passerelle** et envoie le prompt sur stdin.
2. Le premier tour envoie `--session-id <uuid>`.
3. Les tours suivants réutilisent la session Claude stockée via `--resume <sessionId>`.
4. Vos messages de chat passent toujours par le pipeline de messages OpenClaw normal, mais
   la réponse réelle du modèle est produite par Claude CLI.

### Exigences

- Claude CLI installé sur l’hôte de la passerelle et disponible dans le PATH, ou configuré
  avec un chemin de commande absolu.
- Claude CLI déjà authentifié sur ce même hôte :

```bash
claude auth status
```

- OpenClaw charge automatiquement le plugin Anthropic intégré au démarrage de la passerelle lorsque votre
  configuration référence explicitement `claude-cli/...` ou une config de backend `claude-cli`.

### Extrait de configuration

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Si le binaire `claude` n’est pas dans le PATH de l’hôte de la passerelle :

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Ce que vous obtenez

- Réutilisation de l’authentification par abonnement Claude depuis la CLI locale (lue à l’exécution, non persistée)
- Routage normal des messages/sessions OpenClaw
- Continuité de session Claude CLI entre les tours (invalidée lors des changements d’auth)
- Outils de passerelle exposés à Claude CLI via un bridge MCP loopback
- Streaming JSONL avec progression en direct des messages partiels

### Migrer de l’auth Anthropic vers Claude CLI

Si vous utilisez actuellement `anthropic/...` avec un profil de jeton historique ou une clé API et souhaitez
basculer le même hôte de passerelle vers Claude CLI, OpenClaw le prend en charge comme chemin
normal de migration d’authentification fournisseur.

Prérequis :

- Claude CLI installé sur le **même hôte de passerelle** qui exécute OpenClaw
- Claude CLI déjà connecté à cet endroit : `claude auth login`

Ensuite exécutez :

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Ou dans l’intégration guidée :

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` interactif et `openclaw configure` préfèrent désormais **Anthropic
Claude CLI** en premier et **clé API Anthropic** en second.

Ce que cela fait :

- vérifie que Claude CLI est déjà connecté sur l’hôte de la passerelle
- bascule le modèle par défaut vers `claude-cli/...`
- réécrit les solutions de repli de modèle par défaut Anthropic comme `anthropic/claude-opus-4-6`
  en `claude-cli/claude-opus-4-6`
- ajoute des entrées `claude-cli/...` correspondantes à `agents.defaults.models`

Vérification rapide :

```bash
openclaw models status
```

Vous devriez voir le modèle principal résolu sous `claude-cli/...`.

Ce que cela **ne** fait pas :

- supprimer vos profils d’authentification Anthropic existants
- supprimer toutes les anciennes références de configuration `anthropic/...` en dehors du chemin principal
  modèle/allowlist par défaut

Cela rend le retour arrière simple : remettez le modèle par défaut sur `anthropic/...` si
vous en avez besoin.

### Limites importantes

- Ce n’est **pas** le fournisseur API Anthropic. C’est le runtime CLI local.
- OpenClaw n’injecte pas directement les appels d’outils. Claude CLI reçoit les outils de passerelle via un bridge MCP loopback (`bundleMcp: true`, valeur par défaut).
- Claude CLI streame les réponses via JSONL (`stream-json` avec
  `--include-partial-messages`). Les prompts sont envoyés sur stdin, pas argv.
- L’authentification est lue à l’exécution depuis les identifiants Claude CLI en direct et n’est pas persistée
  dans les profils OpenClaw. Les invites Keychain sont supprimées dans les contextes non interactifs.
- La réutilisation de session est suivie via les métadonnées `cliSessionBinding`. Lorsque l’état de connexion Claude CLI change (reconnexion, rotation de jeton), les sessions stockées sont invalidées et une nouvelle session démarre.
- Convient surtout à un hôte de passerelle personnel, pas à des configurations de facturation partagée multi-utilisateurs.

Plus de détails : [/gateway/cli-backends](/gateway/cli-backends)

## Remarques

- La documentation publique Claude Code d’Anthropic documente toujours l’utilisation directe de la CLI telle que
  `claude -p`. Nous pensons que le mode de secours local géré par l’utilisateur est probablement autorisé, mais
  l’avis séparé d’Anthropic aux utilisateurs d’OpenClaw indique que le chemin
  Claude-login **OpenClaw** est un usage de harnais tiers et nécessite **Extra Usage**
  (paiement à l’usage facturé séparément de l’abonnement). Pour la production, nous
  recommandons plutôt les clés API Anthropic.
- Le jeton de configuration Anthropic est de nouveau disponible dans OpenClaw comme voie historique/manuelle. L’avis de facturation spécifique à OpenClaw d’Anthropic s’applique toujours, utilisez-le donc en partant du principe qu’Anthropic exige **Extra Usage** pour cette voie.
- Les détails d’authentification + règles de réutilisation se trouvent dans [/concepts/oauth](/concepts/oauth).

## Dépannage

**Erreurs 401 / jeton soudainement invalide**

- L’authentification par jeton Anthropic historique peut expirer ou être révoquée.
- Pour une nouvelle configuration, migrez vers une clé API Anthropic ou vers le chemin local Claude CLI sur l’hôte de la passerelle.

**No API key found for provider "anthropic"**

- L’authentification est **par agent**. Les nouveaux agents n’héritent pas des clés de l’agent principal.
- Relancez l’intégration guidée pour cet agent, ou configurez une clé API sur l’hôte de la passerelle, puis vérifiez avec `openclaw models status`.

**No credentials found for profile `anthropic:default`**

- Exécutez `openclaw models status` pour voir quel profil d’authentification est actif.
- Relancez l’intégration guidée, ou configurez une clé API ou Claude CLI pour ce chemin de profil.

**No available auth profile (all in cooldown/unavailable)**

- Vérifiez `openclaw models status --json` pour `auth.unusableProfiles`.
- Les périodes de refroidissement de limitation de débit Anthropic peuvent être limitées à un modèle, donc un modèle Anthropic voisin peut encore être utilisable même lorsque le modèle actuel est en refroidissement.
- Ajoutez un autre profil Anthropic ou attendez la fin du refroidissement.

Plus d’informations : [/gateway/troubleshooting](/gateway/troubleshooting) et [/help/faq](/help/faq).
