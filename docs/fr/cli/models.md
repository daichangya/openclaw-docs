---
read_when:
    - Vous voulez modifier les modèles par défaut ou afficher l’état d’authentification du fournisseur
    - Vous voulez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (statut/liste/définition/analyse, alias, solutions de repli, authentification)
title: models
x-i18n:
    generated_at: "2026-04-05T12:38:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, solutions de repli, profils d’authentification).

Voir aussi :

- Fournisseurs + modèles : [Models](/providers/models)
- Configuration de l’authentification du fournisseur : [Bien démarrer](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche la valeur résolue par défaut/les solutions de repli ainsi qu’une vue d’ensemble de l’authentification.
Lorsque des instantanés d’utilisation du fournisseur sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation du fournisseur et les instantanés de quota.
Fournisseurs actuels avec fenêtre d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks spécifiques au fournisseur
lorsqu’ils sont disponibles ; sinon, OpenClaw revient aux identifiants OAuth/clé API correspondants
depuis les profils d’authentification, l’environnement ou la configuration.
Ajoutez `--probe` pour exécuter des probes d’authentification en direct sur chaque profil de fournisseur configuré.
Les probes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état du modèle/de l’authentification d’un agent configuré. Lorsqu’il est omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` s’ils sont définis, sinon l’agent
par défaut configuré.
Les lignes de probe peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- Les références de modèle sont analysées en effectuant une séparation sur le **premier** `/`. Si l’ID du modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme alias, puis
  comme correspondance unique de fournisseur configuré pour cet ID de modèle exact, et seulement ensuite
  revient au fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  revient au premier fournisseur/modèle configuré au lieu d’afficher
  une valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour des espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (code de sortie 1=expiré/manquant, 2=expiration proche)
- `--probe` (probe en direct des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (répétable ou IDs de profil séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Catégories d’état de probe :

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Cas de détail/code de raison de probe auxquels s’attendre :

- `excluded_by_auth_order` : un profil stocké existe, mais `auth.order.<provider>` explicite
  l’a omis ; la probe signale donc l’exclusion au lieu
  d’essayer de l’utiliser.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais n’est pas éligible/résoluble.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre
  un candidat de modèle sondable pour ce fournisseur.

## Alias + solutions de repli

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Profils d’authentification

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` est l’assistant interactif d’authentification. Il peut lancer un flux d’authentification du fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur choisi.

`models auth login` exécute le flux d’authentification d’un plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.

Exemples :

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Remarques :

- `login --provider anthropic --method cli --set-default` réutilise une connexion locale Claude
  CLI et réécrit le chemin principal du modèle par défaut Anthropic en une référence canonique
  `claude-cli/claude-*`.
- `setup-token` et `paste-token` restent des commandes de jeton génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` requiert un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (en utilisant par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou par automatisation.
- `paste-token` requiert `--provider`, invite à saisir la valeur du jeton et l’écrit
  dans l’ID de profil par défaut `<provider>:manual` sauf si vous passez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue du jeton à partir d’une
  durée relative telle que `365d` ou `12h`.
- Remarque sur la facturation Anthropic : nous pensons que la solution de repli Claude Code CLI est probablement autorisée pour l’automatisation locale gérée par l’utilisateur d’après la documentation publique CLI d’Anthropic. Cela dit, la politique Anthropic sur les harnais tiers crée suffisamment d’ambiguïté autour de l’usage adossé à un abonnement dans des produits externes pour que nous ne le recommandions pas en production. Anthropic a également informé les utilisateurs OpenClaw le **4 avril 2026 à 12:00 PM PT / 8:00 PM BST** que le chemin de connexion Claude d’**OpenClaw** compte comme un usage de harnais tiers et nécessite **Extra Usage** facturé séparément de l’abonnement.
- Anthropic `setup-token` / `paste-token` sont de nouveau disponibles comme chemin OpenClaw hérité/manuel. Utilisez-les en gardant à l’esprit qu’Anthropic a indiqué aux utilisateurs OpenClaw que ce chemin nécessite **Extra Usage**.
