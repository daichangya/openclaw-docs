---
read_when:
    - Débogage de l’authentification des modèles ou de l’expiration OAuth
    - Documentation de l’authentification ou du stockage des identifiants
summary: 'Authentification des modèles : OAuth, clés API et réutilisation de Claude CLI'
title: Authentification
x-i18n:
    generated_at: "2026-04-05T12:41:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c0ceee7d10fe8d10345f32889b63425d81773f3a08d8ecd3fd88d965b207ddc
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentification (fournisseurs de modèles)

<Note>
Cette page couvre l’authentification des **fournisseurs de modèles** (clés API, OAuth, réutilisation de Claude CLI). Pour l’authentification de **connexion à la passerelle** (jeton, mot de passe, trusted-proxy), consultez [Configuration](/gateway/configuration) et [Authentification Trusted Proxy](/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les hôtes de passerelle toujours actifs, les clés API sont généralement l’option la plus prévisible. Les flux d’abonnement/OAuth sont également pris en charge lorsqu’ils correspondent au modèle de compte de votre fournisseur.

Consultez [/concepts/oauth](/concepts/oauth) pour le flux OAuth complet et la disposition de stockage.
Pour l’auth basée sur SecretRef (fournisseurs `env`/`file`/`exec`), consultez [Gestion des secrets](/gateway/secrets).
Pour les règles d’éligibilité/code de raison des identifiants utilisées par `models status --probe`, consultez
[Sémantique des identifiants d’authentification](/auth-credential-semantics).

## Configuration recommandée (clé API, tout fournisseur)

Si vous exécutez une passerelle de longue durée, commencez avec une clé API pour le fournisseur choisi.
Pour Anthropic en particulier, l’authentification par clé API est la voie sûre. La réutilisation de Claude CLI est l’autre voie de configuration prise en charge de type abonnement.

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte de la passerelle** (la machine qui exécute `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si la passerelle s’exécute sous systemd/launchd, il est préférable de placer la clé dans
   `~/.openclaw/.env` afin que le daemon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Redémarrez ensuite le daemon (ou redémarrez votre processus de passerelle) et vérifiez de nouveau :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’intégration guidée peut stocker les clés API pour l’usage du daemon : `openclaw onboard`.

Consultez [Aide](/help) pour les détails sur l’héritage d’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : compatibilité avec les jetons historiques

L’authentification par jeton de configuration Anthropic reste disponible dans OpenClaw comme
voie historique/manuelle. La documentation publique de Claude Code d’Anthropic couvre toujours l’utilisation directe
de Claude Code dans le terminal sous les offres Claude, mais Anthropic a indiqué séparément aux utilisateurs d’OpenClaw que le chemin de connexion Claude **OpenClaw** est considéré comme un usage de harnais tiers et nécessite **Extra Usage**, facturé séparément de l’abonnement.

Pour la voie de configuration la plus claire, utilisez une clé API Anthropic ou migrez vers Claude CLI sur l’hôte de la passerelle.

Saisie manuelle de jeton (tout fournisseur ; écrit dans `auth-profiles.json` + met à jour la config) :

```bash
openclaw models auth paste-token --provider openrouter
```

Les références de profil d’authentification sont également prises en charge pour les identifiants statiques :

- les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.

Vérification adaptée à l’automatisation (code de sortie `1` si expiré/absent, `2` si proche de l’expiration) :

```bash
openclaw models status --check
```

Probes d’authentification en direct :

```bash
openclaw models status --probe
```

Remarques :

- Les lignes de probe peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` explicite omet un profil stocké, la probe signale `excluded_by_auth_order` pour ce profil au lieu de l’essayer.
- Si une auth existe mais qu’OpenClaw ne peut pas résoudre de candidat de modèle probeable pour ce fournisseur, la probe signale `status: no_model`.
- Les périodes de refroidissement de limitation de débit peuvent être limitées à un modèle. Un profil en refroidissement pour un modèle peut rester utilisable pour un modèle voisin chez le même fournisseur.

Des scripts ops facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance d’authentification](/help/scripts#auth-monitoring-scripts)

## Anthropic : migration vers Claude CLI

Si Claude CLI est déjà installé et connecté sur l’hôte de la passerelle, vous pouvez
basculer une configuration Anthropic existante vers le backend CLI. Il s’agit d’une
voie de migration OpenClaw prise en charge pour réutiliser une connexion locale Claude CLI sur cet
hôte.

Prérequis :

- `claude` installé sur l’hôte de la passerelle
- Claude CLI déjà connecté là-bas avec `claude auth login`

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Cela conserve vos profils d’authentification Anthropic existants pour un retour arrière, mais modifie la
sélection de modèle par défaut vers `claude-cli/...` et ajoute des entrées de liste d’autorisation Claude CLI correspondantes sous `agents.defaults.models`.

Vérifiez :

```bash
openclaw models status
```

Raccourci d’intégration guidée :

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` interactif et `openclaw configure` préfèrent toujours Claude CLI
pour Anthropic, mais le jeton de configuration Anthropic est de nouveau disponible comme
voie historique/manuelle et doit être utilisé avec l’attente de facturation Extra Usage.

## Vérifier l’état de l’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (passerelle)

Certains fournisseurs prennent en charge une nouvelle tentative de requête avec des clés alternatives lorsqu’un appel API atteint une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent également `GOOGLE_API_KEY` comme solution de repli supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw ne réessaie avec la clé suivante qu’en cas d’erreurs de limitation de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs autres que celles liées à la limitation de débit ne sont pas retentées avec d’autres clés.
- Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

## Contrôler l’identifiant utilisé

### Par session (commande de chat)

Utilisez `/model <alias-or-id>@<profileId>` pour épingler un identifiant fournisseur spécifique à la session en cours (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + profil d’authentification suivant, ainsi que les détails de point de terminaison du fournisseur lorsqu’ils sont configurés).

### Par agent (remplacement CLI)

Définissez un remplacement explicite d’ordre de profils d’authentification pour un agent (stocké dans le `auth-profiles.json` de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les profils stockés omis comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de refroidissement, rappelez-vous que les périodes de refroidissement de limitation de débit peuvent être liées à un identifiant de modèle plutôt qu’à l’ensemble du profil fournisseur.

## Dépannage

### "No credentials found"

Si le profil Anthropic est absent, migrez cette configuration vers Claude CLI ou une clé API sur l’**hôte de la passerelle**, puis vérifiez de nouveau :

```bash
openclaw models status
```

### Jeton proche de l’expiration/expiré

Exécutez `openclaw models status` pour confirmer quel profil est sur le point d’expirer. Si un profil de jeton Anthropic historique est absent ou expiré, migrez cette configuration vers Claude CLI ou une clé API.

## Exigences Claude CLI

Uniquement nécessaires pour la voie de réutilisation Anthropic Claude CLI :

- CLI Claude Code installée (commande `claude` disponible)
