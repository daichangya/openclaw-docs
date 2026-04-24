---
read_when:
    - Configuration des SecretRef pour les identifiants de fournisseur et les références `auth-profiles.json`
    - Exploiter en toute sécurité en production le rechargement, l’audit, la configuration et l’application des secrets
    - Comprendre l’échec rapide au démarrage, le filtrage des surfaces inactives et le comportement du dernier bon état connu
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés runtime et nettoyage unidirectionnel sécurisé'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-04-24T07:12:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw prend en charge des SecretRef additifs afin que les identifiants pris en charge n’aient pas besoin d’être stockés en clair dans la configuration.

Le texte en clair fonctionne toujours. Les SecretRef sont optionnels pour chaque identifiant.

## Objectifs et modèle runtime

Les secrets sont résolus dans un instantané runtime en mémoire.

- La résolution est anticipée pendant l’activation, et non paresseuse sur les chemins de requête.
- Le démarrage échoue rapidement lorsqu’un SecretRef effectivement actif ne peut pas être résolu.
- Le rechargement utilise un échange atomique : succès complet, ou conservation du dernier bon instantané connu.
- Les violations de politique SecretRef (par exemple des profils d’authentification en mode OAuth combinés avec une entrée SecretRef) font échouer l’activation avant l’échange runtime.
- Les requêtes runtime lisent uniquement depuis l’instantané actif en mémoire.
- Après le premier chargement/activation réussi de la configuration, les chemins de code runtime continuent de lire cet instantané actif en mémoire jusqu’à ce qu’un rechargement réussi l’échange.
- Les chemins de livraison sortante lisent également depuis cet instantané actif (par exemple la livraison de réponse/fil Discord et les envois d’actions Telegram) ; ils ne résolvent pas à nouveau les SecretRef à chaque envoi.

Cela évite que les pannes du fournisseur de secrets n’affectent les chemins de requête critiques.

## Filtrage des surfaces actives

Les SecretRef ne sont validés que sur les surfaces effectivement actives.

- Surfaces activées : les références non résolues bloquent le démarrage/le rechargement.
- Surfaces inactives : les références non résolues ne bloquent pas le démarrage/le rechargement.
- Les références inactives émettent des diagnostics non fatals avec le code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Exemples de surfaces inactives :

- Entrées de canal/compte désactivées.
- Identifiants de canal de niveau supérieur dont aucun compte activé n’hérite.
- Surfaces d’outil/fonctionnalité désactivées.
- Clés spécifiques au fournisseur de recherche web qui ne sont pas sélectionnées par `tools.web.search.provider`.
  En mode auto (fournisseur non défini), les clés sont consultées par ordre de priorité pour l’auto-détection du fournisseur jusqu’à ce que l’une d’elles soit résolue.
  Après sélection, les clés des fournisseurs non sélectionnés sont traitées comme inactives jusqu’à leur sélection.
- Matériel d’authentification SSH du sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, ainsi que les remplacements par agent) n’est actif
  que lorsque le backend sandbox effectif est `ssh` pour l’agent par défaut ou un agent activé.
- Les SecretRef `gateway.remote.token` / `gateway.remote.password` sont actifs si l’une de ces conditions est vraie :
  - `gateway.mode=remote`
  - `gateway.remote.url` est configuré
  - `gateway.tailscale.mode` est `serve` ou `funnel`
  - En mode local sans ces surfaces distantes :
    - `gateway.remote.token` est actif lorsque l’authentification par jeton peut l’emporter et qu’aucun jeton env/auth n’est configuré.
    - `gateway.remote.password` n’est actif que lorsque l’authentification par mot de passe peut l’emporter et qu’aucun mot de passe env/auth n’est configuré.
- Le SecretRef `gateway.auth.token` est inactif pour la résolution d’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée de jeton d’environnement l’emporte pour ce runtime.

## Diagnostics de surface d’authentification Gateway

Lorsqu’un SecretRef est configuré sur `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` ou `gateway.remote.password`, le démarrage/rechargement du gateway journalise explicitement
l’état de la surface :

- `active` : le SecretRef fait partie de la surface d’authentification effective et doit être résolu.
- `inactive` : le SecretRef est ignoré pour ce runtime parce qu’une autre surface d’authentification l’emporte, ou
  parce que l’authentification distante est désactivée/non active.

Ces entrées sont journalisées avec `SECRETS_GATEWAY_AUTH_SURFACE` et incluent la raison utilisée par la
politique de surface active, afin que vous puissiez comprendre pourquoi un identifiant a été traité comme actif ou inactif.

## Prévalidation des références lors de l’onboarding

Lorsque l’onboarding s’exécute en mode interactif et que vous choisissez le stockage SecretRef, OpenClaw exécute une validation préalable avant l’enregistrement :

- Références env : valide le nom de la variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Références de fournisseur (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Chemin de réutilisation quickstart : lorsque `gateway.auth.token` est déjà un SecretRef, l’onboarding le résout avant l’initialisation de la sonde/du tableau de bord (pour les références `env`, `file` et `exec`) en utilisant la même barrière d’échec rapide.

Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Utilisez partout cette forme d’objet :

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validation :

- `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
- `id` doit correspondre à `^[A-Z][A-Z0-9_]{0,127}$`

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validation :

- `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
- `id` doit être un pointeur JSON absolu (`/...`)
- Échappement RFC6901 dans les segments : `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validation :

- `provider` doit correspondre à `^[a-z][a-z0-9_-]{0,63}$`
- `id` doit correspondre à `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `id` ne doit pas contenir `.` ou `..` comme segments de chemin délimités par des slashs (par exemple `a/../b` est rejeté)

## Configuration du fournisseur

Définissez les fournisseurs sous `secrets.providers` :

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // ou "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Fournisseur env

- Liste d’autorisation facultative via `allowlist`.
- Les valeurs d’environnement manquantes/vides font échouer la résolution.

### Fournisseur file

- Lit le fichier local depuis `path`.
- `mode: "json"` attend une charge utile d’objet JSON et résout `id` comme pointeur.
- `mode: "singleValue"` attend l’identifiant de référence `"value"` et renvoie le contenu du fichier.
- Le chemin doit respecter les vérifications de propriétaire/autorisations.
- Remarque Windows en échec fermé : si la vérification ACL n’est pas disponible pour un chemin, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

### Fournisseur exec

- Exécute le chemin binaire absolu configuré, sans shell.
- Par défaut, `command` doit pointer vers un fichier ordinaire (pas un lien symbolique).
- Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande symlinkés (par exemple les shims Homebrew). OpenClaw valide le chemin cible résolu.
- Associez `allowSymlinkCommand` à `trustedDirs` pour les chemins de gestionnaire de paquets (par exemple `["/opt/homebrew"]`).
- Prend en charge un délai d’expiration, un délai sans sortie, des limites d’octets de sortie, une liste d’autorisation d’environnement et des répertoires de confiance.
- Remarque Windows en échec fermé : si la vérification ACL n’est pas disponible pour le chemin de commande, la résolution échoue. Pour les chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

Charge utile de requête (stdin) :

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Charge utile de réponse (stdout) :

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erreurs facultatives par identifiant :

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exemples d’intégration exec

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // requis pour les binaires symlinkés par Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // requis pour les binaires symlinkés par Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // requis pour les binaires symlinkés par Homebrew
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## Variables d’environnement de serveur MCP

Les variables d’environnement de serveur MCP configurées via `plugins.entries.acpx.config.mcpServers` prennent en charge SecretInput. Cela permet de garder les clés API et les jetons hors de la configuration en clair :

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Les valeurs de chaîne en clair continuent de fonctionner. Les références de modèle env comme `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation du gateway avant que le processus du serveur MCP ne soit lancé. Comme pour les autres surfaces SecretRef, les références non résolues ne bloquent l’activation que lorsque le plugin `acpx` est effectivement actif.

## Matériel d’authentification SSH du sandbox

Le backend `ssh` du sandbox central prend aussi en charge les SecretRef pour le matériel d’authentification SSH :

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Comportement runtime :

- OpenClaw résout ces références pendant l’activation du sandbox, et non paresseusement à chaque appel SSH.
- Les valeurs résolues sont écrites dans des fichiers temporaires avec des autorisations restrictives et utilisées dans la configuration SSH générée.
- Si le backend sandbox effectif n’est pas `ssh`, ces références restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants pris en charge et non pris en charge de façon canonique sont listés dans :

- [SecretRef Credential Surface](/fr/reference/secretref-credential-surface)

Les identifiants générés au runtime, rotatifs, ainsi que le matériel de rafraîchissement OAuth sont intentionnellement exclus de la résolution SecretRef en lecture seule.

## Comportement requis et priorité

- Champ sans référence : inchangé.
- Champ avec référence : requis sur les surfaces actives pendant l’activation.
- Si le texte en clair et la référence sont tous deux présents, la référence est prioritaire sur les chemins de priorité pris en charge.
- La sentinelle de masquage `__OPENCLAW_REDACTED__` est réservée au masquage/restauration interne de configuration et est rejetée comme donnée de configuration soumise littéralement.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement runtime)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants de `auth-profiles.json` sont prioritaires sur les références de `openclaw.json`)

Comportement de compatibilité Google Chat :

- `serviceAccountRef` est prioritaire sur `serviceAccount` en clair.
- La valeur en clair est ignorée lorsqu’une référence sœur est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute sur :

- Démarrage (prévalidation puis activation finale)
- Chemin de hot-apply de rechargement de configuration
- Chemin de vérification de redémarrage de rechargement de configuration
- Rechargement manuel via `secrets.reload`
- Prévalidation RPC d’écriture de configuration Gateway (`config.set` / `config.apply` / `config.patch`) pour la résolubilité des SecretRef de surface active à l’intérieur de la charge utile de configuration soumise avant la persistance des modifications

Contrat d’activation :

- Le succès échange l’instantané de façon atomique.
- Un échec au démarrage interrompt le démarrage du gateway.
- Un échec de rechargement runtime conserve le dernier bon instantané connu.
- Un échec de prévalidation de RPC d’écriture rejette la configuration soumise et conserve inchangés à la fois la configuration disque et l’instantané runtime actif.
- Fournir un jeton de canal explicite par appel à un helper/outil sortant ne déclenche pas l’activation SecretRef ; les points d’activation restent le démarrage, le rechargement et `secrets.reload` explicite.

## Signaux dégradés et récupérés

Lorsque l’activation au moment du rechargement échoue après un état sain, OpenClaw entre dans un état dégradé des secrets.

Codes de journal et événement système one-shot :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : le runtime conserve le dernier bon instantané connu.
- Récupéré : émis une seule fois après la prochaine activation réussie.
- Les échecs répétés alors que l’état est déjà dégradé journalisent des avertissements mais n’inondent pas les événements.
- L’échec rapide au démarrage n’émet pas d’événements dégradés puisque le runtime n’est jamais devenu actif.

## Résolution sur les chemins de commande

Les chemins de commande peuvent opter pour la résolution de SecretRef prise en charge via la RPC d’instantané gateway.

Il existe deux grands comportements :

- Les chemins de commande stricts (par exemple les chemins de mémoire distante de `openclaw memory` et `openclaw qr --remote` lorsqu’il a besoin de références de secret partagé distantes) lisent depuis l’instantané actif et échouent rapidement lorsqu’un SecretRef requis est indisponible.
- Les chemins de commande en lecture seule (par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit`, ainsi que les flux de doctor/réparation de configuration en lecture seule) privilégient également l’instantané actif, mais se dégradent au lieu d’abandonner lorsqu’un SecretRef ciblé est indisponible dans ce chemin de commande.

Comportement en lecture seule :

- Lorsque le gateway fonctionne, ces commandes lisent d’abord depuis l’instantané actif.
- Si la résolution gateway est incomplète ou si le gateway est indisponible, elles tentent un repli local ciblé pour la surface de commande spécifique.
- Si un SecretRef ciblé reste indisponible, la commande continue avec une sortie dégradée en lecture seule et des diagnostics explicites tels que « configured but unavailable in this command path ».
- Ce comportement dégradé est strictement local à la commande. Il n’affaiblit pas les chemins de démarrage runtime, de rechargement ou d’envoi/authentification.

Autres remarques :

- L’actualisation de l’instantané après rotation d’un secret backend est gérée par `openclaw secrets reload`.
- Méthode RPC gateway utilisée par ces chemins de commande : `secrets.resolve`.

## Flux d’audit et de configuration

Flux opérateur par défaut :

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Les constats incluent :

- valeurs en clair au repos (`openclaw.json`, `auth-profiles.json`, `.env` et `agents/*/agent/models.json` générés)
- résidus en clair d’en-têtes sensibles de fournisseur dans les entrées `models.json` générées
- références non résolues
- masquage par priorité (`auth-profiles.json` prioritaire sur les références de `openclaw.json`)
- résidus hérités (`auth.json`, rappels OAuth)

Remarque sur exec :

- Par défaut, l’audit ignore les vérifications de résolubilité des SecretRef exec pour éviter les effets de bord des commandes.
- Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

Remarque sur les résidus d’en-tête :

- La détection d’en-têtes sensibles de fournisseur est basée sur une heuristique de nom (noms courants d’en-têtes d’authentification/identifiant et fragments tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

### `secrets configure`

Assistant interactif qui :

- configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/modification/suppression)
- vous laisse sélectionner les champs pris en charge porteurs de secret dans `openclaw.json` ainsi que `auth-profiles.json` pour une portée d’agent
- peut créer directement un nouveau mappage `auth-profiles.json` dans le sélecteur de cible
- capture les détails SecretRef (`source`, `provider`, `id`)
- exécute une résolution préalable
- peut appliquer immédiatement

Remarque sur exec :

- La prévalidation ignore les vérifications de SecretRef exec sauf si `--allow-exec` est défini.
- Si vous appliquez directement depuis `configure --apply` et que le plan inclut des références/fournisseurs exec, conservez `--allow-exec` pour l’étape d’application également.

Modes utiles :

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Valeurs par défaut de l’application de `configure` :

- nettoie les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés
- nettoie les anciennes entrées statiques `api_key` de `auth.json`
- nettoie les lignes de secrets connus correspondantes de `<config-dir>/.env`

### `secrets apply`

Appliquer un plan enregistré :

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Remarque sur exec :

- le dry-run ignore les vérifications exec sauf si `--allow-exec` est défini.
- le mode écriture rejette les plans contenant des SecretRef/fournisseurs exec sauf si `--allow-exec` est défini.

Pour les détails du contrat strict cible/chemin et les règles exactes de rejet, voir :

- [Secrets Apply Plan Contract](/fr/gateway/secrets-plan-contract)

## Politique de sécurité unidirectionnelle

OpenClaw n’écrit intentionnellement pas de sauvegardes de restauration contenant des valeurs historiques de secrets en clair.

Modèle de sécurité :

- la prévalidation doit réussir avant le mode écriture
- l’activation runtime est validée avant validation
- apply met à jour les fichiers via un remplacement atomique de fichier et une restauration au mieux en cas d’échec

## Remarques de compatibilité d’authentification héritée

Pour les identifiants statiques, le runtime ne dépend plus du stockage d’authentification hérité en clair.

- La source d’identifiants runtime est l’instantané résolu en mémoire.
- Les anciennes entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes.
- Le comportement de compatibilité lié à OAuth reste distinct.

## Remarque sur l’interface web

Certaines unions SecretInput sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Documentation associée

- Commandes CLI : [secrets](/fr/cli/secrets)
- Détails du contrat de plan : [Secrets Apply Plan Contract](/fr/gateway/secrets-plan-contract)
- Surface d’identifiants : [SecretRef Credential Surface](/fr/reference/secretref-credential-surface)
- Configuration de l’authentification : [Authentication](/fr/gateway/authentication)
- Posture de sécurité : [Security](/fr/gateway/security)
- Priorité des variables d’environnement : [Environment Variables](/fr/help/environment)
