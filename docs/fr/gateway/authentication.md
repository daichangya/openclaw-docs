---
read_when:
    - Déboguer l’authentification des modèles ou l’expiration OAuth
    - Documenter l’authentification ou le stockage des identifiants
summary: 'Authentification des modèles : OAuth, clés API et ancien setup-token Anthropic'
title: Authentification
x-i18n:
    generated_at: "2026-04-06T03:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f59ede3fcd7e692ad4132287782a850526acf35474b5bfcea29e0e23610636c2
    source_path: gateway/authentication.md
    workflow: 15
---

# Authentification (fournisseurs de modèles)

<Note>
Cette page couvre l’authentification des **fournisseurs de modèles** (clés API, OAuth et ancien setup-token Anthropic). Pour l’authentification de **connexion Gateway** (token, mot de passe, trusted-proxy), voir [Configuration](/fr/gateway/configuration) et [Authentification Trusted Proxy](/fr/gateway/trusted-proxy-auth).
</Note>

OpenClaw prend en charge OAuth et les clés API pour les fournisseurs de modèles. Pour les
hôtes Gateway toujours actifs, les clés API sont généralement l’option la plus prévisible.
Les flux par abonnement/OAuth sont également pris en charge lorsqu’ils correspondent au
modèle de compte de votre fournisseur.

Voir [/concepts/oauth](/fr/concepts/oauth) pour le flux OAuth complet et l’organisation du
stockage.
Pour l’authentification basée sur SecretRef (fournisseurs `env`/`file`/`exec`), voir [Gestion des secrets](/fr/gateway/secrets).
Pour les règles d’éligibilité des identifiants et de codes de raison utilisées par `models status --probe`, voir
[Authentification - sémantique des identifiants](/fr/auth-credential-semantics).

## Configuration recommandée (clé API, tout fournisseur)

Si vous exécutez une gateway de longue durée, commencez par une clé API pour le
fournisseur choisi.
Pour Anthropic en particulier, l’authentification par clé API est la voie sûre. Dans OpenClaw,
l’authentification de style abonnement Anthropic correspond à l’ancien chemin setup-token et
doit être traitée comme un chemin d’**utilisation supplémentaire**, et non comme un chemin lié
aux limites du forfait.

1. Créez une clé API dans la console de votre fournisseur.
2. Placez-la sur l’**hôte Gateway** (la machine qui exécute `openclaw gateway`).

```bash
export <PROVIDER>_API_KEY="..."
openclaw models status
```

3. Si la Gateway s’exécute sous systemd/launchd, il est préférable de placer la clé dans
   `~/.openclaw/.env` afin que le démon puisse la lire :

```bash
cat >> ~/.openclaw/.env <<'EOF'
<PROVIDER>_API_KEY=...
EOF
```

Redémarrez ensuite le démon (ou redémarrez votre processus Gateway), puis revérifiez :

```bash
openclaw models status
openclaw doctor
```

Si vous préférez ne pas gérer vous-même les variables d’environnement, l’onboarding peut stocker
les clés API pour l’utilisation par le démon : `openclaw onboard`.

Voir [Aide](/fr/help) pour les détails sur l’héritage d’environnement (`env.shellEnv`,
`~/.openclaw/.env`, systemd/launchd).

## Anthropic : compatibilité avec les anciens tokens

L’authentification Anthropic par setup-token est toujours disponible dans OpenClaw
comme chemin ancien/manuel. La documentation publique de Claude Code d’Anthropic couvre
toujours l’utilisation directe du terminal Claude Code avec les forfaits Claude, mais
Anthropic a séparément indiqué aux utilisateurs d’OpenClaw que le chemin de connexion Claude
dans **OpenClaw** est considéré comme une utilisation via un harnais tiers et nécessite une
**utilisation supplémentaire** facturée séparément de l’abonnement.

Pour la voie de configuration la plus claire, utilisez une clé API Anthropic. Si vous devez
conserver un chemin Anthropic de style abonnement dans OpenClaw, utilisez l’ancien chemin
setup-token en partant du principe qu’Anthropic le traite comme de l’**utilisation supplémentaire**.

Saisie manuelle de token (tout fournisseur ; écrit `auth-profiles.json` + met à jour la configuration) :

```bash
openclaw models auth paste-token --provider openrouter
```

Les références de profil d’authentification sont également prises en charge pour les identifiants statiques :

- les identifiants `api_key` peuvent utiliser `keyRef: { source, provider, id }`
- les identifiants `token` peuvent utiliser `tokenRef: { source, provider, id }`
- les profils en mode OAuth ne prennent pas en charge les identifiants SecretRef ; si `auth.profiles.<id>.mode` est défini sur `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.

Vérification adaptée à l’automatisation (sortie `1` si expiré/absent, `2` si expiration proche) :

```bash
openclaw models status --check
```

Sondes d’authentification en direct :

```bash
openclaw models status --probe
```

Remarques :

- Les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
  `excluded_by_auth_order` pour ce profil au lieu de l’essayer.
- Si l’authentification existe mais qu’OpenClaw ne peut pas résoudre de candidat de modèle sondable pour
  ce fournisseur, la sonde signale `status: no_model`.
- Les périodes de refroidissement liées aux limites de débit peuvent être propres à un modèle. Un profil en
  refroidissement pour un modèle peut encore être utilisable pour un modèle frère chez le même fournisseur.

Les scripts d’exploitation facultatifs (systemd/Termux) sont documentés ici :
[Scripts de surveillance d’authentification](/fr/help/scripts#auth-monitoring-scripts)

## Remarque sur Anthropic

Le backend Anthropic `claude-cli` a été supprimé.

- Utilisez des clés API Anthropic pour le trafic Anthropic dans OpenClaw.
- Le setup-token Anthropic reste un chemin ancien/manuel et doit être utilisé avec
  l’attente de facturation d’utilisation supplémentaire qu’Anthropic a communiquée aux utilisateurs d’OpenClaw.
- `openclaw doctor` détecte désormais l’état obsolète supprimé d’Anthropic Claude CLI. Si
  les octets d’identifiants stockés existent encore, doctor les reconvertit en
  profils Anthropic token/OAuth. Sinon, doctor supprime la configuration obsolète Claude CLI
  et vous oriente vers la récupération par clé API ou setup-token.

## Vérifier l’état de l’authentification des modèles

```bash
openclaw models status
openclaw doctor
```

## Comportement de rotation des clés API (gateway)

Certains fournisseurs prennent en charge une nouvelle tentative de requête avec d’autres clés lorsqu’un appel API
rencontre une limite de débit du fournisseur.

- Ordre de priorité :
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (remplacement unique)
  - `<PROVIDER>_API_KEYS`
  - `<PROVIDER>_API_KEY`
  - `<PROVIDER>_API_KEY_*`
- Les fournisseurs Google incluent également `GOOGLE_API_KEY` comme solution de secours supplémentaire.
- La même liste de clés est dédupliquée avant utilisation.
- OpenClaw réessaie avec la clé suivante uniquement pour les erreurs de limite de débit (par exemple
  `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent
requests`, `ThrottlingException`, `concurrency limit reached` ou
  `workers_ai ... quota limit exceeded`).
- Les erreurs autres que celles de limite de débit ne sont pas retentées avec d’autres clés.
- Si toutes les clés échouent, l’erreur finale de la dernière tentative est renvoyée.

## Contrôler quel identifiant est utilisé

### Par session (commande de chat)

Utilisez `/model <alias-or-id>@<profileId>` pour épingler un identifiant de fournisseur spécifique pour la session en cours (exemples d’identifiants de profil : `anthropic:default`, `anthropic:work`).

Utilisez `/model` (ou `/model list`) pour un sélecteur compact ; utilisez `/model status` pour la vue complète (candidats + profil d’authentification suivant, ainsi que les détails de point de terminaison du fournisseur lorsqu’ils sont configurés).

### Par agent (remplacement CLI)

Définissez un remplacement explicite de l’ordre des profils d’authentification pour un agent (stocké dans le `auth-profiles.json` de cet agent) :

```bash
openclaw models auth order get --provider anthropic
openclaw models auth order set --provider anthropic anthropic:default
openclaw models auth order clear --provider anthropic
```

Utilisez `--agent <id>` pour cibler un agent spécifique ; omettez-le pour utiliser l’agent par défaut configuré.
Lorsque vous déboguez des problèmes d’ordre, `openclaw models status --probe` affiche les
profils stockés omis sous la forme `excluded_by_auth_order` au lieu de les ignorer silencieusement.
Lorsque vous déboguez des problèmes de refroidissement, rappelez-vous que les périodes de refroidissement liées
aux limites de débit peuvent être attachées à un identifiant de modèle plutôt qu’à l’ensemble du profil fournisseur.

## Dépannage

### "No credentials found"

Si le profil Anthropic est absent, configurez une clé API Anthropic sur l’**hôte Gateway**
ou mettez en place l’ancien chemin setup-token Anthropic, puis revérifiez :

```bash
openclaw models status
```

### Token sur le point d’expirer / expiré

Exécutez `openclaw models status` pour confirmer quel profil est sur le point d’expirer. Si un ancien
profil de token Anthropic est absent ou expiré, actualisez cette configuration via
setup-token ou migrez vers une clé API Anthropic.

Si la machine possède encore un état obsolète supprimé d’Anthropic Claude CLI provenant d’anciens
builds, exécutez :

```bash
openclaw doctor --yes
```

Doctor reconvertit `anthropic:claude-cli` en Anthropic token/OAuth lorsque les
octets d’identifiants stockés existent encore. Sinon, il supprime les références obsolètes de profil/configuration/modèle Claude CLI et laisse les indications de prochaine étape.
