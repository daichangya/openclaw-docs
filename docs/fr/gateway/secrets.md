---
read_when:
    - Configuration des SecretRefs pour les identifiants de fournisseur et les références `auth-profiles.json`
    - Exploitation sûre du rechargement, de l’audit, de la configuration et de l’application des secrets en production
    - Compréhension de l’échec rapide au démarrage, du filtrage des surfaces inactives et du comportement last-known-good
summary: 'Gestion des secrets : contrat SecretRef, comportement des instantanés runtime et nettoyage unidirectionnel sûr'
title: Gestion des secrets
x-i18n:
    generated_at: "2026-04-05T12:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Gestion des secrets

OpenClaw prend en charge les SecretRefs additives afin que les identifiants pris en charge n’aient pas besoin d’être stockés en clair dans la configuration.

Le texte brut continue de fonctionner. Les SecretRefs sont facultatives et s’activent credential par credential.

## Objectifs et modèle runtime

Les secrets sont résolus dans un instantané runtime en mémoire.

- La résolution est anticipée pendant l’activation, pas paresseuse dans les chemins de requête.
- Le démarrage échoue immédiatement lorsqu’une SecretRef effectivement active ne peut pas être résolue.
- Le rechargement utilise un échange atomique : réussite complète, ou conservation du dernier instantané valide.
- Les violations de politique SecretRef (par exemple profils d’authentification en mode OAuth combinés à une entrée SecretRef) font échouer l’activation avant l’échange runtime.
- Les requêtes runtime lisent uniquement depuis l’instantané actif en mémoire.
- Après la première activation/charge réussie de la configuration, les chemins de code runtime continuent de lire cet instantané actif en mémoire jusqu’à ce qu’un rechargement réussi le remplace.
- Les chemins de livraison sortante lisent aussi depuis cet instantané actif (par exemple livraison Discord de réponse/fil et envois d’actions Telegram) ; ils ne résolvent pas à nouveau les SecretRefs à chaque envoi.

Cela évite que des pannes du fournisseur de secrets n’affectent les chemins de requête à chaud.

## Filtrage des surfaces actives

Les SecretRefs ne sont validées que sur les surfaces effectivement actives.

- Surfaces activées : les refs non résolues bloquent le démarrage/le rechargement.
- Surfaces inactives : les refs non résolues ne bloquent pas le démarrage/le rechargement.
- Les refs inactives émettent des diagnostics non fatals avec le code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Exemples de surfaces inactives :

- Entrées de canal/compte désactivées.
- Identifiants de canal top-level dont aucun compte activé n’hérite.
- Surfaces d’outil/fonctionnalité désactivées.
- Clés spécifiques à un fournisseur de recherche web qui ne sont pas sélectionnées par `tools.web.search.provider`.
  En mode auto (fournisseur non défini), les clés sont consultées par ordre de priorité pour l’auto-détection du fournisseur jusqu’à ce qu’une résolution réussisse.
  Après sélection, les clés des fournisseurs non sélectionnés sont traitées comme inactives jusqu’à leur sélection.
- Matériel d’authentification SSH du sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData`, plus les remplacements par agent) n’est actif
  que lorsque le backend sandbox effectif est `ssh` pour l’agent par défaut ou un agent activé.
- Les SecretRefs `gateway.remote.token` / `gateway.remote.password` sont actives si l’une de ces conditions est vraie :
  - `gateway.mode=remote`
  - `gateway.remote.url` est configuré
  - `gateway.tailscale.mode` vaut `serve` ou `funnel`
  - En mode local sans ces surfaces distantes :
    - `gateway.remote.token` est actif lorsque l’authentification par jeton peut l’emporter et qu’aucun jeton env/auth n’est configuré.
    - `gateway.remote.password` n’est actif que lorsque l’authentification par mot de passe peut l’emporter et qu’aucun mot de passe env/auth n’est configuré.
- La SecretRef `gateway.auth.token` est inactive pour la résolution d’authentification au démarrage lorsque `OPENCLAW_GATEWAY_TOKEN` est défini, car l’entrée de jeton env est prioritaire pour ce runtime.

## Diagnostics de surface d’authentification de la passerelle

Lorsqu’une SecretRef est configurée sur `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` ou `gateway.remote.password`, le démarrage/rechargement de la passerelle journalise explicitement l’état de la
surface :

- `active` : la SecretRef fait partie de la surface d’authentification effective et doit être résolue.
- `inactive` : la SecretRef est ignorée pour ce runtime parce qu’une autre surface d’authentification l’emporte, ou
  parce que l’authentification distante est désactivée/inactive.

Ces entrées sont journalisées avec `SECRETS_GATEWAY_AUTH_SURFACE` et incluent la raison utilisée par la
politique de surface active, afin que vous puissiez voir pourquoi un identifiant a été traité comme actif ou inactif.

## Vérification préalable des références lors de l’onboarding

Lorsque l’onboarding s’exécute en mode interactif et que vous choisissez le stockage SecretRef, OpenClaw exécute une validation préalable avant l’enregistrement :

- Réfs env : valide le nom de la variable d’environnement et confirme qu’une valeur non vide est visible pendant la configuration.
- Réfs provider (`file` ou `exec`) : valide la sélection du fournisseur, résout `id` et vérifie le type de la valeur résolue.
- Chemin de réutilisation quickstart : lorsque `gateway.auth.token` est déjà une SecretRef, l’onboarding le résout avant le bootstrap de la sonde/du tableau de bord (pour les refs `env`, `file` et `exec`) en utilisant la même barrière fail-fast.

Si la validation échoue, l’onboarding affiche l’erreur et vous permet de réessayer.

## Contrat SecretRef

Utilisez partout une seule forme d’objet :

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
- `id` ne doit pas contenir `.` ou `..` comme segments de chemin séparés par des slashs (par exemple `a/../b` est rejeté)

## Configuration des fournisseurs

Définissez les fournisseurs sous `secrets.providers` :

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
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
- Les valeurs env manquantes/vides font échouer la résolution.

### Fournisseur file

- Lit le fichier local depuis `path`.
- `mode: "json"` attend une charge utile d’objet JSON et résout `id` comme pointeur.
- `mode: "singleValue"` attend l’ID de ref `"value"` et renvoie le contenu du fichier.
- Le chemin doit passer les contrôles de propriété/autorisations.
- Remarque fail-closed Windows : si la vérification ACL n’est pas disponible pour un chemin, la résolution échoue. Pour des chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

### Fournisseur exec

- Exécute le chemin binaire absolu configuré, sans shell.
- Par défaut, `command` doit pointer vers un fichier normal (pas un lien symbolique).
- Définissez `allowSymlinkCommand: true` pour autoriser les chemins de commande symlinkés (par exemple les shims Homebrew). OpenClaw valide le chemin cible résolu.
- Associez `allowSymlinkCommand` à `trustedDirs` pour les chemins de gestionnaires de packages (par exemple `["/opt/homebrew"]`).
- Prend en charge le délai d’expiration, le délai sans sortie, les limites d’octets de sortie, la liste d’autorisation env et les répertoires de confiance.
- Remarque fail-closed Windows : si la vérification ACL n’est pas disponible pour le chemin de commande, la résolution échoue. Pour des chemins de confiance uniquement, définissez `allowInsecurePath: true` sur ce fournisseur pour contourner les vérifications de sécurité du chemin.

Charge utile de requête (stdin) :

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Charge utile de réponse (stdout) :

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Erreurs facultatives par ID :

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
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
        allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

## Variables d’environnement du serveur MCP

Les variables env du serveur MCP configurées via `plugins.entries.acpx.config.mcpServers` prennent en charge SecretInput. Cela évite de conserver les clés API et les jetons en clair dans la configuration :

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

Les valeurs de chaîne en clair continuent de fonctionner. Les références de gabarit env comme `${MCP_SERVER_API_KEY}` et les objets SecretRef sont résolus pendant l’activation de la passerelle avant le lancement du processus serveur MCP. Comme pour les autres surfaces SecretRef, les refs non résolues ne bloquent l’activation que lorsque le plugin `acpx` est effectivement actif.

## Matériel d’authentification SSH du sandbox

Le backend core `ssh` du sandbox prend aussi en charge les SecretRefs pour le matériel d’authentification SSH :

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

- OpenClaw résout ces refs pendant l’activation du sandbox, pas paresseusement pendant chaque appel SSH.
- Les valeurs résolues sont écrites dans des fichiers temporaires avec des autorisations restrictives et utilisées dans la configuration SSH générée.
- Si le backend sandbox effectif n’est pas `ssh`, ces refs restent inactives et ne bloquent pas le démarrage.

## Surface d’identifiants prise en charge

Les identifiants canoniques pris en charge et non pris en charge sont listés dans :

- [Surface d’identifiants SecretRef](/reference/secretref-credential-surface)

Les identifiants générés au runtime ou rotatifs et le matériel de rafraîchissement OAuth sont volontairement exclus de la résolution SecretRef en lecture seule.

## Comportement requis et ordre de priorité

- Champ sans ref : inchangé.
- Champ avec ref : requis sur les surfaces actives pendant l’activation.
- Si le texte brut et la ref sont tous deux présents, la ref est prioritaire sur les chemins de priorité pris en charge.
- Le marqueur d’expurgation `__OPENCLAW_REDACTED__` est réservé à l’expurgation/restauration interne de configuration et est rejeté comme donnée de configuration soumise littéralement.

Signaux d’avertissement et d’audit :

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (avertissement runtime)
- `REF_SHADOWED` (constat d’audit lorsque les identifiants `auth-profiles.json` sont prioritaires par rapport aux refs `openclaw.json`)

Comportement de compatibilité Google Chat :

- `serviceAccountRef` est prioritaire sur `serviceAccount` en clair.
- La valeur en clair est ignorée lorsqu’une ref sœur est définie.

## Déclencheurs d’activation

L’activation des secrets s’exécute sur :

- Démarrage (pré-vérification plus activation finale)
- Chemin de hot-apply du rechargement de configuration
- Chemin restart-check du rechargement de configuration
- Rechargement manuel via `secrets.reload`
- Pré-vérification RPC d’écriture de configuration de la passerelle (`config.set` / `config.apply` / `config.patch`) pour la résolvabilité des SecretRefs de surface active dans la charge utile de configuration soumise avant persistance des modifications

Contrat d’activation :

- Une réussite remplace l’instantané de façon atomique.
- Un échec au démarrage interrompt le démarrage de la passerelle.
- Un échec de rechargement runtime conserve le dernier instantané valide.
- Un échec de pré-vérification Write-RPC rejette la configuration soumise et laisse inchangés à la fois la configuration sur disque et l’instantané runtime actif.
- Fournir un jeton de canal explicite par appel à un helper/outils sortant ne déclenche pas l’activation SecretRef ; les points d’activation restent le démarrage, le rechargement et `secrets.reload` explicite.

## Signaux d’état dégradé et restauré

Lorsque l’activation au moment du rechargement échoue après un état sain, OpenClaw passe à un état de secrets dégradé.

Codes d’événement système et de journal one-shot :

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Comportement :

- Dégradé : le runtime conserve le dernier instantané valide.
- Restauré : émis une fois après l’activation réussie suivante.
- Les échecs répétés alors que l’état est déjà dégradé journalisent des avertissements mais n’inondent pas les événements.
- L’échec rapide au démarrage n’émet pas d’événements dégradés car le runtime n’est jamais devenu actif.

## Résolution dans les chemins de commande

Les chemins de commande peuvent activer la résolution SecretRef prise en charge via le RPC d’instantané de la passerelle.

Il existe deux grands comportements :

- Les chemins de commande stricts (par exemple les chemins de mémoire distante de `openclaw memory` et `openclaw qr --remote` lorsqu’il a besoin de refs de secret partagé distant) lisent depuis l’instantané actif et échouent immédiatement lorsqu’une SecretRef requise n’est pas disponible.
- Les chemins de commande en lecture seule (par exemple `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` et les flux doctor/réparation de configuration en lecture seule) préfèrent aussi l’instantané actif, mais se dégradent au lieu d’interrompre lorsqu’une SecretRef ciblée n’est pas disponible dans ce chemin de commande.

Comportement en lecture seule :

- Lorsque la passerelle est en cours d’exécution, ces commandes lisent d’abord depuis l’instantané actif.
- Si la résolution de la passerelle est incomplète ou si la passerelle n’est pas disponible, elles tentent un repli local ciblé pour la surface de commande spécifique.
- Si une SecretRef ciblée reste indisponible, la commande continue avec une sortie en lecture seule dégradée et des diagnostics explicites tels que « configuré mais indisponible dans ce chemin de commande ».
- Ce comportement dégradé est local à la commande uniquement. Il n’affaiblit pas les chemins runtime de démarrage, de rechargement ou d’envoi/authentification.

Autres remarques :

- L’actualisation de l’instantané après rotation d’un secret backend se fait via `openclaw secrets reload`.
- Méthode RPC de passerelle utilisée par ces chemins de commande : `secrets.resolve`.

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
- résidus d’en-têtes sensibles de fournisseur en clair dans les entrées `models.json` générées
- refs non résolues
- masquage par priorité (`auth-profiles.json` prioritaire sur les refs `openclaw.json`)
- résidus hérités (`auth.json`, rappels OAuth)

Remarque exec :

- Par défaut, l’audit ignore les vérifications de résolvabilité des SecretRefs exec afin d’éviter les effets de bord de commande.
- Utilisez `openclaw secrets audit --allow-exec` pour exécuter les fournisseurs exec pendant l’audit.

Remarque sur les résidus d’en-têtes :

- La détection des en-têtes sensibles de fournisseur repose sur des heuristiques de nommage (noms et fragments courants d’en-têtes d’authentification/identifiants tels que `authorization`, `x-api-key`, `token`, `secret`, `password` et `credential`).

### `secrets configure`

Assistant interactif qui :

- configure d’abord `secrets.providers` (`env`/`file`/`exec`, ajout/édition/suppression)
- vous permet de sélectionner des champs pris en charge porteurs de secrets dans `openclaw.json` ainsi que `auth-profiles.json` pour une portée d’agent
- peut créer directement un nouveau mappage `auth-profiles.json` dans le sélecteur de cible
- capture les détails de SecretRef (`source`, `provider`, `id`)
- exécute une résolution préalable
- peut appliquer immédiatement

Remarque exec :

- La pré-vérification ignore les contrôles SecretRef exec sauf si `--allow-exec` est défini.
- Si vous appliquez directement depuis `configure --apply` et que le plan inclut des refs/fournisseurs exec, gardez aussi `--allow-exec` défini pour l’étape d’application.

Modes utiles :

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Valeurs par défaut d’application de `configure` :

- nettoie les identifiants statiques correspondants de `auth-profiles.json` pour les fournisseurs ciblés
- nettoie les anciennes entrées statiques `api_key` de `auth.json`
- nettoie les lignes de secrets connues correspondantes de `<config-dir>/.env`

### `secrets apply`

Appliquer un plan enregistré :

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Remarque exec :

- le dry-run ignore les contrôles exec sauf si `--allow-exec` est défini.
- le mode écriture rejette les plans contenant des SecretRefs/fournisseurs exec sauf si `--allow-exec` est défini.

Pour les détails stricts du contrat cible/chemin et les règles exactes de rejet, consultez :

- [Contrat de plan d’application des secrets](/gateway/secrets-plan-contract)

## Politique de sécurité unidirectionnelle

OpenClaw n’écrit volontairement pas de sauvegardes de retour arrière contenant des valeurs historiques de secrets en clair.

Modèle de sécurité :

- la pré-vérification doit réussir avant le mode écriture
- l’activation runtime est validée avant validation finale
- apply met à jour les fichiers via remplacement atomique de fichier et restauration en meilleur effort en cas d’échec

## Remarques de compatibilité avec l’authentification héritée

Pour les identifiants statiques, le runtime ne dépend plus du stockage d’authentification hérité en clair.

- La source des identifiants runtime est l’instantané résolu en mémoire.
- Les anciennes entrées statiques `api_key` sont nettoyées lorsqu’elles sont découvertes.
- Le comportement de compatibilité lié à OAuth reste séparé.

## Remarque sur l’interface Web

Certaines unions `SecretInput` sont plus faciles à configurer en mode éditeur brut qu’en mode formulaire.

## Documentation associée

- Commandes CLI : [secrets](/cli/secrets)
- Détails du contrat de plan : [Contrat de plan d’application des secrets](/gateway/secrets-plan-contract)
- Surface d’identifiants : [Surface d’identifiants SecretRef](/reference/secretref-credential-surface)
- Configuration de l’authentification : [Authentication](/gateway/authentication)
- Posture de sécurité : [Security](/gateway/security)
- Priorité des variables d’environnement : [Variables d’environnement](/help/environment)
