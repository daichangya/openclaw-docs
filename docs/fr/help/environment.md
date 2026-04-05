---
read_when:
    - Vous devez savoir quelles variables d’environnement sont chargées, et dans quel ordre
    - Vous déboguez des clés API manquantes dans la Gateway
    - Vous documentez l’authentification des fournisseurs ou les environnements de déploiement
summary: Où OpenClaw charge les variables d’environnement et leur ordre de priorité
title: Variables d’environnement
x-i18n:
    generated_at: "2026-04-05T12:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Variables d’environnement

OpenClaw récupère les variables d’environnement depuis plusieurs sources. La règle est de **ne jamais remplacer des valeurs existantes**.

## Priorité (de la plus élevée à la plus faible)

1. **Environnement du processus** (ce que le processus Gateway possède déjà depuis le shell/daemon parent).
2. **`.env` dans le répertoire de travail courant** (valeur par défaut de dotenv ; ne remplace pas).
3. **`.env` global** à `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env` ; ne remplace pas).
4. **Bloc `env` de la configuration** dans `~/.openclaw/openclaw.json` (appliqué uniquement si absent).
5. **Import facultatif de shell de connexion** (`env.shellEnv.enabled` ou `OPENCLAW_LOAD_SHELL_ENV=1`), appliqué uniquement pour les clés attendues manquantes.

Sur les nouvelles installations Ubuntu qui utilisent le répertoire d’état par défaut, OpenClaw traite aussi `~/.config/openclaw/gateway.env` comme un repli de compatibilité après le `.env` global. Si les deux fichiers existent et divergent, OpenClaw conserve `~/.openclaw/.env` et affiche un avertissement.

Si le fichier de configuration est totalement absent, l’étape 4 est ignorée ; l’import du shell s’exécute quand même s’il est activé.

## Bloc `env` de configuration

Deux façons équivalentes de définir des variables d’environnement inline (toutes deux sans remplacement) :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Import d’environnement du shell

`env.shellEnv` exécute votre shell de connexion et n’importe que les clés attendues **manquantes** :

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Équivalents en variables d’environnement :

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Variables d’environnement injectées à l’exécution

OpenClaw injecte aussi des marqueurs de contexte dans les processus enfants lancés :

- `OPENCLAW_SHELL=exec` : défini pour les commandes exécutées via l’outil `exec`.
- `OPENCLAW_SHELL=acp` : défini pour les lancements de processus du backend runtime ACP (par exemple `acpx`).
- `OPENCLAW_SHELL=acp-client` : défini pour `openclaw acp client` lorsqu’il lance le processus de pont ACP.
- `OPENCLAW_SHELL=tui-local` : défini pour les commandes shell `!` du TUI local.

Ce sont des marqueurs d’exécution (pas une configuration utilisateur requise). Ils peuvent être utilisés dans la logique de shell/profil
pour appliquer des règles spécifiques au contexte.

## Variables d’environnement de l’interface

- `OPENCLAW_THEME=light` : force la palette TUI claire lorsque votre terminal a un arrière-plan clair.
- `OPENCLAW_THEME=dark` : force la palette TUI sombre.
- `COLORFGBG` : si votre terminal l’exporte, OpenClaw utilise l’indice de couleur d’arrière-plan pour choisir automatiquement la palette TUI.

## Substitution de variables d’environnement dans la configuration

Vous pouvez référencer directement des variables d’environnement dans les valeurs de chaîne de la configuration avec la syntaxe `${VAR_NAME}` :

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Voir [Configuration : substitution de variables d’environnement](/gateway/configuration-reference#env-var-substitution) pour tous les détails.

## Refs de secret vs chaînes `${ENV}`

OpenClaw prend en charge deux modèles pilotés par environnement :

- substitution de chaîne `${VAR}` dans les valeurs de configuration.
- objets SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) pour les champs qui prennent en charge les références de secret.

Les deux sont résolus depuis l’environnement du processus au moment de l’activation. Les détails sur SecretRef sont documentés dans [Gestion des secrets](/gateway/secrets).

## Variables d’environnement liées aux chemins

| Variable               | Objectif                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Remplace le répertoire personnel utilisé pour toute la résolution interne des chemins (`~/.openclaw/`, répertoires d’agent, sessions, identifiants). Utile lors de l’exécution d’OpenClaw avec un utilisateur de service dédié. |
| `OPENCLAW_STATE_DIR`   | Remplace le répertoire d’état (par défaut `~/.openclaw`).                                                                                                                          |
| `OPENCLAW_CONFIG_PATH` | Remplace le chemin du fichier de configuration (par défaut `~/.openclaw/openclaw.json`).                                                                                          |

## Journalisation

| Variable             | Objectif                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL` | Remplace le niveau de journalisation pour le fichier et la console (par ex. `debug`, `trace`). A priorité sur `logging.level` et `logging.consoleLevel` dans la configuration. Les valeurs invalides sont ignorées avec un avertissement. |

### `OPENCLAW_HOME`

Lorsqu’elle est définie, `OPENCLAW_HOME` remplace le répertoire personnel du système (`$HOME` / `os.homedir()`) pour toute la résolution interne des chemins. Cela permet une isolation complète du système de fichiers pour les comptes de service headless.

**Priorité :** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Exemple** (LaunchDaemon macOS) :

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` peut aussi être défini sur un chemin avec tilde (par ex. `~/svc`), qui est développé à l’aide de `$HOME` avant utilisation.

## Utilisateurs nvm : échecs TLS de web_fetch

Si Node.js a été installé via **nvm** (et non via le gestionnaire de paquets système), le `fetch()` intégré utilise
le magasin CA embarqué de nvm, auquel il peut manquer des autorités racines modernes (ISRG Root X1/X2 pour Let's Encrypt,
DigiCert Global Root G2, etc.). Cela provoque l’échec de `web_fetch` avec `"fetch failed"` sur la plupart des sites HTTPS.

Sous Linux, OpenClaw détecte automatiquement nvm et applique le correctif dans l’environnement réel de démarrage :

- `openclaw gateway install` écrit `NODE_EXTRA_CA_CERTS` dans l’environnement du service systemd
- le point d’entrée CLI `openclaw` se réexécute lui-même avec `NODE_EXTRA_CA_CERTS` défini avant le démarrage de Node

**Correctif manuel (pour les anciennes versions ou les lancements directs `node ...`) :**

Exportez la variable avant de démarrer OpenClaw :

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Ne vous fiez pas à une écriture uniquement dans `~/.openclaw/.env` pour cette variable ; Node lit
`NODE_EXTRA_CA_CERTS` au démarrage du processus.

## Lié

- [Configuration Gateway](/gateway/configuration)
- [FAQ : variables d’environnement et chargement de .env](/help/faq#env-vars-and-env-loading)
- [Vue d’ensemble des modèles](/concepts/models)
