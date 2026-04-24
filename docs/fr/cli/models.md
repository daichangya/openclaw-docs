---
read_when:
    - Vous souhaitez modifier les modèles par défaut ou voir l’état d’authentification du fournisseur
    - Vous souhaitez analyser les modèles/fournisseurs disponibles et déboguer les profils d’authentification
summary: Référence CLI pour `openclaw models` (`status`/`list`/`set`/`scan`, alias, replis, authentification)
title: Modèles
x-i18n:
    generated_at: "2026-04-24T07:04:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Découverte, analyse et configuration des modèles (modèle par défaut, replis, profils d’authentification).

Voir aussi :

- Fournisseurs + modèles : [Modèles](/fr/providers/models)
- Concepts de sélection de modèle + commande slash `/models` : [Concept des modèles](/fr/concepts/models)
- Configuration de l’authentification du fournisseur : [Premiers pas](/fr/start/getting-started)

## Commandes courantes

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` affiche les valeurs par défaut/replis résolus ainsi qu’une vue d’ensemble de l’authentification.
Lorsque des instantanés d’utilisation du fournisseur sont disponibles, la section d’état OAuth/clé API inclut
les fenêtres d’utilisation du fournisseur et les instantanés de quota.
Fournisseurs actuels avec fenêtres d’utilisation : Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi et z.ai. L’authentification d’utilisation provient de hooks spécifiques au fournisseur
lorsqu’ils sont disponibles ; sinon OpenClaw se rabat sur les identifiants OAuth/clé API correspondants
issus des profils d’authentification, de l’environnement ou de la configuration.
Dans la sortie `--json`, `auth.providers` correspond à la vue d’ensemble des fournisseurs
tenant compte de l’environnement/de la configuration/du magasin, tandis que `auth.oauth` ne couvre que la santé
des profils du magasin d’authentification.
Ajoutez `--probe` pour exécuter des sondes d’authentification actives sur chaque profil de fournisseur configuré.
Les sondes sont de vraies requêtes (elles peuvent consommer des jetons et déclencher des limites de débit).
Utilisez `--agent <id>` pour inspecter l’état modèle/authentification d’un agent configuré. Lorsqu’il est omis,
la commande utilise `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` si défini, sinon
l’agent par défaut configuré.
Les lignes de sonde peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json`.

Remarques :

- `models set <model-or-alias>` accepte `provider/model` ou un alias.
- `models list` est en lecture seule : il lit la configuration, les profils d’authentification, l’état existant du catalogue
  et les lignes de catalogue possédées par le fournisseur, mais il ne réécrit pas
  `models.json`.
- `models list --all` inclut les lignes statiques de catalogue intégrées appartenant au fournisseur même
  si vous ne vous êtes pas encore authentifié auprès de ce fournisseur. Ces lignes apparaissent néanmoins
  comme indisponibles tant qu’une authentification correspondante n’est pas configurée.
- `models list --provider <id>` filtre par identifiant de fournisseur, tel que `moonshot` ou
  `openai-codex`. Il n’accepte pas les libellés d’affichage des sélecteurs interactifs de fournisseur,
  comme `Moonshot AI`.
- Les références de modèle sont analysées en découpant sur le **premier** `/`. Si l’identifiant du modèle inclut `/` (style OpenRouter), incluez le préfixe du fournisseur (exemple : `openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout d’abord l’entrée comme un alias, puis
  comme une correspondance unique de fournisseur configuré pour cet identifiant de modèle exact, et seulement ensuite
  se rabat sur le fournisseur par défaut configuré avec un avertissement de dépréciation.
  Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
  se rabat sur le premier fournisseur/modèle configuré au lieu d’exposer une
  valeur par défaut obsolète d’un fournisseur supprimé.
- `models status` peut afficher `marker(<value>)` dans la sortie d’authentification pour les espaces réservés non secrets (par exemple `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) au lieu de les masquer comme des secrets.

### `models status`

Options :

- `--json`
- `--plain`
- `--check` (code de sortie 1=expiré/manquant, 2=expirant)
- `--probe` (sonde active des profils d’authentification configurés)
- `--probe-provider <name>` (sonder un fournisseur)
- `--probe-profile <id>` (répétable ou identifiants séparés par des virgules)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (identifiant d’agent configuré ; remplace `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Catégories d’état des sondes :

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Cas de détail/code de raison de sonde auxquels s’attendre :

- `excluded_by_auth_order` : un profil stocké existe, mais `auth.order.<provider>` explicite
  l’a omis, donc la sonde signale l’exclusion au lieu
  d’essayer de l’utiliser.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref` :
  le profil est présent mais n’est pas admissible/ne peut pas être résolu.
- `no_model` : l’authentification du fournisseur existe, mais OpenClaw n’a pas pu résoudre
  un candidat de modèle pouvant être sondé pour ce fournisseur.

## Alias + replis

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

`models auth add` est l’assistant d’authentification interactif. Il peut lancer un flux d’authentification de fournisseur
(OAuth/clé API) ou vous guider vers un collage manuel de jeton, selon le
fournisseur choisi.

`models auth login` exécute le flux d’authentification d’un Plugin fournisseur (OAuth/clé API). Utilisez
`openclaw plugins list` pour voir quels fournisseurs sont installés.

Exemples :

```bash
openclaw models auth login --provider openai-codex --set-default
```

Remarques :

- `setup-token` et `paste-token` restent des commandes de jeton génériques pour les fournisseurs
  qui exposent des méthodes d’authentification par jeton.
- `setup-token` nécessite un TTY interactif et exécute la méthode d’authentification par jeton du fournisseur
  (en utilisant par défaut la méthode `setup-token` de ce fournisseur lorsqu’il en expose
  une).
- `paste-token` accepte une chaîne de jeton générée ailleurs ou issue de l’automatisation.
- `paste-token` nécessite `--provider`, invite à saisir la valeur du jeton et l’écrit
  dans l’identifiant de profil par défaut `<provider>:manual`, sauf si vous transmettez
  `--profile-id`.
- `paste-token --expires-in <duration>` stocke une expiration absolue du jeton à partir d’une
  durée relative telle que `365d` ou `12h`.
- Remarque Anthropic : le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est de nouveau autorisé, donc OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés pour cette intégration sauf si Anthropic publie une nouvelle politique.
- Les options Anthropic `setup-token` / `paste-token` restent disponibles comme chemin de jeton OpenClaw pris en charge, mais OpenClaw préfère désormais la réutilisation de Claude CLI et `claude -p` lorsqu’ils sont disponibles.

## Voir aussi

- [Référence CLI](/fr/cli)
- [Sélection de modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
