---
read_when:
    - Débogage de l’authentification des modèles ou de l’expiration OAuth
    - Documentation de l’authentification ou du stockage des identifiants
summary: 'authentification des modèles : OAuth, clés API, réutilisation de Claude CLI et jeton de configuration Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-04-24T07:09:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 371aa5a66bcec5c0271c6b7dcb0fcbb05a075f61ffd2c67616b6ea3a48f54934
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentification (fournisseurs de modèles)

<Note>
Cette page couvre l’authentification des **fournisseurs de modèles** (clés API, OAuth, réutilisation de Claude CLI et jeton de configuration Anthropic). Pour l’authentification de **connexion Gateway** (jeton, mot de passe, trusted-proxy), voir [Configuration](/fr/gateway/configuration) et [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les hôtes Gateway toujours actifs,
les clés API sont généralement l’option la plus prévisible. Les flux d’abonnement/OAuth
sont également pris en charge lorsqu’ils correspondent au modèle de compte de votre fournisseur.

Voir [/concepts/oauth](/fr/concepts/oauth) pour le flux OAuth complet et la disposition
du stockage.
Pour l’authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`), voir [Gestion des secrets](/fr/gateway/secrets).
Pour les règles d’éligibilité des identifiants et de code de raison utilisées par `models status --probe`, voir
[Sémantique des identifiants d’authentification](/fr/auth-credential-semantics).

## Configuration recommandée (clé API, tout fournisseur)

Si vous exécutez une Gateway de longue durée, commencez avec une clé API pour le
fournisseur choisi.
Pour Anthropic en particulier, l’authentification par clé API reste la configuration serveur la plus prévisible,
mais OpenClaw prend aussi en charge la réutilisation d’une connexion Claude CLI locale.

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte Gateway** (la machine qui exécute `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si la Gateway s’exécute sous systemd/launchd, placez de préférence la clé dans
   `~/.openclaw/.env` afin que le démon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Ensuite, redémarrez le démon (ou redémarrez votre processus Gateway) puis revérifiez :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’intégration peut stocker
des clés API pour l’usage du démon : `openclaw onboard`.

Voir [Aide](/fr/help) pour les détails sur l’héritage d’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : Claude CLI et compatibilité des jetons

L’authentification Anthropic par jeton de configuration reste disponible dans OpenClaw comme chemin de jeton
pris en charge. Le personnel Anthropic nous a depuis indiqué que l’usage de type Claude CLI dans OpenClaw est
de nouveau autorisé ; OpenClaw considère donc la réutilisation de Claude CLI et l’usage de `claude -p`
comme autorisés pour cette intégration, sauf si Anthropic publie une nouvelle politique. Lorsque
la réutilisation de Claude CLI est disponible sur l’hôte, c’est désormais le chemin préféré.

Pour les hôtes Gateway de longue durée, une clé API Anthropic reste la configuration la plus prévisible.
Si vous voulez réutiliser une connexion Claude existante sur le même hôte, utilisez le chemin Anthropic Claude CLI dans onboard/configure.

Configuration hôte recommandée pour la réutilisation de Claude CLI :

```bash
# Run on the gateway host
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Il s’agit d’une configuration en deux étapes :

1. Connectez Claude Code lui-même à Anthropic sur l’hôte Gateway.
2. Indiquez à OpenClaw de basculer la sélection de modèle Anthropic vers le backend local `claude-cli`
   et d’enregistrer le profil d’authentification OpenClaw correspondant.

Si `claude` n’est pas sur le `PATH`, installez d’abord Claude Code ou définissez
`agents.defaults.cliBackends.claude-cli.command` sur le chemin réel du binaire.

Saisie manuelle de jeton (tout fournisseur ; écrit dans `auth-profiles.json` + met à jour la configuration) :

```bash
openclaw models auth paste-token --provider openrouter
```

Les références de profil d’authentification sont aussi prises en charge pour les identifiants statiques :

- les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, une entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.

Vérification adaptée à l’automatisation (sortie `1` si expiré/manquant, `2` si expiration imminente) :

```bash
openclaw models status --check
```

Sondes d’authentification en direct :

```bash
openclaw models status --probe
```

Remarques :

- Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` explicite omet un profil enregistré, la sonde signale
  `excluded_by_auth_order` pour ce profil au lieu de l’essayer.
- Si l’authentification existe mais qu’OpenClaw ne peut pas résoudre de candidat de modèle sondable pour
  ce fournisseur, la sonde signale `status: no_model`.
- Les cooldowns de limitation de débit peuvent être liés à un modèle. Un profil en cooldown pour un
  modèle peut rester utilisable pour un modèle frère chez le même fournisseur.

Les scripts ops facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance de l’authentification](/fr/help/scripts#auth-monitoring-scripts)

## Remarque Anthropic

Le backend Anthropic `claude-cli` est de nouveau pris en charge.

- Le personnel Anthropic nous a dit que ce chemin d’intégration OpenClaw est de nouveau autorisé.
- OpenClaw considère donc la réutilisation de Claude CLI et l’usage de `claude -p` comme autorisés
  pour les exécutions adossées à Anthropic sauf si Anthropic publie une nouvelle politique.
- Les clés API Anthropic restent le choix le plus prévisible pour les hôtes Gateway de longue durée
  et pour un contrôle explicite de la facturation côté serveur.

## Vérifier l’état de l’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (Gateway)

Certains fournisseurs prennent en charge la nouvelle tentative d’une requête avec des clés alternatives lorsqu’un appel API
atteint une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (redéfinition unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent aussi `GOOGLE_API_KEY` comme repli supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw réessaie avec la clé suivante uniquement pour les erreurs de limitation de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached`, ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs hors limitation de débit ne sont pas réessayées avec des clés alternatives.
- Si toutes les clés échouent, l’erreur finale du dernier essai est renvoyée.

## Contrôler quel identifiant est utilisé

### Par session (commande de chat)

Utilisez `/model <alias-or-id>@<profileId>` pour épingler un identifiant de fournisseur spécifique pour la session courante (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + prochain profil d’authentification, plus les détails de point de terminaison du fournisseur lorsqu’ils sont configurés).

### Par agent (redéfinition CLI)

Définissez une redéfinition explicite de l’ordre des profils d’authentification pour un agent (stockée dans `auth-state.json` de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les profils enregistrés omis
comme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de cooldown, souvenez-vous que les cooldowns de limitation de débit peuvent être liés
à un identifiant de modèle plutôt qu’à l’ensemble du profil fournisseur.

## Dépannage

### « Aucun identifiant trouvé »

Si le profil Anthropic manque, configurez une clé API Anthropic sur l’
**hôte Gateway** ou mettez en place le chemin du jeton de configuration Anthropic, puis revérifiez :

```bash
openclaw models status
```

### Jeton expirant/expiré

Exécutez `openclaw models status` pour confirmer quel profil expire. Si un
profil de jeton Anthropic manque ou a expiré, actualisez cette configuration via
setup-token ou migrez vers une clé API Anthropic.

## Liens associés

- [Gestion des secrets](/fr/gateway/secrets)
- [Accès distant](/fr/gateway/remote)
- [Stockage de l’authentification](/fr/concepts/oauth)
