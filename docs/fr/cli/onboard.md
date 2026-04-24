---
read_when:
    - Vous voulez une configuration guidée pour la Gateway, l’espace de travail, l’authentification, les canaux et les Skills
summary: Référence CLI pour `openclaw onboard` (intégration interactive)
title: Intégration
x-i18n:
    generated_at: "2026-04-24T07:04:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Intégration interactive pour une configuration locale ou distante de la Gateway.

## Guides associés

- Hub d’intégration CLI : [Intégration (CLI)](/fr/start/wizard)
- Vue d’ensemble de l’intégration : [Vue d’ensemble de l’intégration](/fr/start/onboarding-overview)
- Référence de l’intégration CLI : [Référence de configuration CLI](/fr/start/wizard-cli-reference)
- Automatisation CLI : [Automatisation CLI](/fr/start/wizard-cli-automation)
- Intégration macOS : [Intégration (app macOS)](/fr/start/onboarding)

## Exemples

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Pour les cibles `ws://` en texte brut sur réseau privé (réseaux de confiance uniquement), définissez
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` dans l’environnement du processus d’intégration.
Il n’existe pas d’équivalent `openclaw.json` pour cette mesure de secours
côté transport client.

Fournisseur personnalisé non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` est facultatif en mode non interactif. S’il est omis, l’intégration vérifie `CUSTOM_API_KEY`.

LM Studio prend aussi en charge un indicateur de clé spécifique au fournisseur en mode non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` vaut par défaut `http://127.0.0.1:11434`. `--custom-model-id` est facultatif ; s’il est omis, l’intégration utilise les valeurs par défaut suggérées par Ollama. Les ID de modèles cloud comme `kimi-k2.5:cloud` fonctionnent aussi ici.

Stocker les clés de fournisseur comme références plutôt qu’en texte brut :

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Avec `--secret-input-mode ref`, l’intégration écrit des références adossées à l’environnement au lieu de valeurs de clé en texte brut.
Pour les fournisseurs adossés à un profil d’authentification, cela écrit des entrées `keyRef` ; pour les fournisseurs personnalisés, cela écrit `models.providers.<id>.apiKey` comme référence env (par exemple `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contrat du mode `ref` non interactif :

- Définissez la variable d’environnement du fournisseur dans l’environnement du processus d’intégration (par exemple `OPENAI_API_KEY`).
- Ne passez pas d’indicateurs de clé en ligne de commande (par exemple `--openai-api-key`) à moins que cette variable d’environnement ne soit également définie.
- Si un indicateur de clé en ligne de commande est passé sans la variable d’environnement requise, l’intégration échoue immédiatement avec des indications.

Options de jeton Gateway en mode non interactif :

- `--gateway-auth token --gateway-token <token>` stocke un jeton en texte brut.
- `--gateway-auth token --gateway-token-ref-env <name>` stocke `gateway.auth.token` comme SecretRef env.
- `--gateway-token` et `--gateway-token-ref-env` s’excluent mutuellement.
- `--gateway-token-ref-env` nécessite une variable d’environnement non vide dans l’environnement du processus d’intégration.
- Avec `--install-daemon`, lorsqu’une authentification par jeton nécessite un jeton, les jetons Gateway gérés par SecretRef sont validés mais ne sont pas conservés comme texte brut résolu dans les métadonnées d’environnement du service superviseur.
- Avec `--install-daemon`, si le mode jeton nécessite un jeton et que le SecretRef de jeton configuré n’est pas résolu, l’intégration échoue de manière stricte avec des indications de remédiation.
- Avec `--install-daemon`, si `gateway.auth.token` et `gateway.auth.password` sont tous deux configurés et que `gateway.auth.mode` n’est pas défini, l’intégration bloque l’installation jusqu’à ce que le mode soit défini explicitement.
- L’intégration locale écrit `gateway.mode="local"` dans la configuration. Si un fichier de configuration ultérieur n’a pas `gateway.mode`, considérez cela comme une configuration endommagée ou une modification manuelle incomplète, et non comme un raccourci valide pour le mode local.
- `--allow-unconfigured` est une échappatoire distincte du runtime Gateway. Cela ne signifie pas que l’intégration peut omettre `gateway.mode`.

Exemple :

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Santé de la Gateway locale en mode non interactif :

- Sauf si vous passez `--skip-health`, l’intégration attend qu’une Gateway locale joignable soit disponible avant de se terminer avec succès.
- `--install-daemon` démarre d’abord le chemin d’installation de la Gateway gérée. Sans cela, vous devez déjà avoir une Gateway locale en cours d’exécution, par exemple `openclaw gateway run`.
- Si vous voulez seulement écrire la configuration/l’espace de travail/le bootstrap dans une automatisation, utilisez `--skip-health`.
- Sur Windows natif, `--install-daemon` essaie d’abord les tâches planifiées puis revient à un élément de démarrage par connexion dans le dossier Startup par utilisateur si la création de tâche est refusée.

Comportement de l’intégration interactive avec mode référence :

- Choisissez **Use secret reference** à l’invite.
- Puis choisissez soit :
  - Variable d’environnement
  - Fournisseur de secret configuré (`file` ou `exec`)
- L’intégration effectue une validation préliminaire rapide avant d’enregistrer la référence.
  - Si la validation échoue, l’intégration affiche l’erreur et vous permet de réessayer.

Choix de points de terminaison Z.AI en mode non interactif :

Remarque : `--auth-choice zai-api-key` détecte désormais automatiquement le meilleur point de terminaison Z.AI pour votre clé (préfère l’API générale avec `zai/glm-5.1`).
Si vous voulez spécifiquement les points de terminaison GLM Coding Plan, choisissez `zai-coding-global` ou `zai-coding-cn`.

```bash
# Sélection du point de terminaison sans invite
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Autres choix de points de terminaison Z.AI :
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Exemple Mistral non interactif :

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Remarques sur les flux :

- `quickstart` : invites minimales, génère automatiquement un jeton Gateway.
- `manual` : invites complètes pour port/bind/auth (alias de `advanced`).
- Lorsqu’un choix d’authentification implique un fournisseur préféré, l’intégration préfiltre les sélecteurs du
  modèle par défaut et de liste d’autorisation sur ce fournisseur. Pour Volcengine et
  BytePlus, cela couvre aussi les variantes de plan de code
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Si le filtre de fournisseur préféré ne renvoie encore aucun modèle chargé, l’intégration
  revient au catalogue non filtré au lieu de laisser le sélecteur vide.
- À l’étape de recherche web, certains fournisseurs peuvent déclencher des invites de suivi spécifiques au fournisseur :
  - **Grok** peut proposer une configuration facultative `x_search` avec la même `XAI_API_KEY`
    et un choix de modèle `x_search`.
  - **Kimi** peut demander la région d’API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) et le modèle de recherche web Kimi par défaut.
- Comportement du périmètre DM en intégration locale : [Référence de configuration CLI](/fr/start/wizard-cli-reference#outputs-and-internals).
- Chat le plus rapide : `openclaw dashboard` (Control UI, sans configuration de canal).
- Fournisseur personnalisé : connectez n’importe quel point de terminaison compatible OpenAI ou Anthropic,
  y compris des fournisseurs hébergés non listés. Utilisez Unknown pour la détection automatique.

## Commandes de suivi courantes

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` n’implique pas le mode non interactif. Utilisez `--non-interactive` pour les scripts.
</Note>
