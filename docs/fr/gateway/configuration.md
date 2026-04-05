---
read_when:
    - Configurer OpenClaw pour la première fois
    - Rechercher des modèles de configuration courants
    - Naviguer vers des sections de configuration spécifiques
summary: 'Vue d''ensemble de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-04-05T12:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configuration

OpenClaw lit une configuration <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> facultative depuis `~/.openclaw/openclaw.json`.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Raisons courantes d'ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir des modèles, outils, sandboxing ou automatisations (cron, hooks)
- Ajuster les sessions, médias, réseau ou l'interface utilisateur

Voir la [référence complète](/gateway/configuration-reference) pour chaque champ disponible.

<Tip>
**Nouveau dans la configuration ?** Commencez avec `openclaw onboard` pour une configuration interactive, ou consultez le guide [Exemples de configuration](/gateway/configuration-examples) pour des configurations complètes prêtes à copier-coller.
</Tip>

## Configuration minimale

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modifier la configuration

<Tabs>
  <Tab title="Assistant interactif">
    ```bash
    openclaw onboard       # flux d'onboarding complet
    openclaw configure     # assistant de configuration
    ```
  </Tab>
  <Tab title="CLI (une ligne)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interface utilisateur de contrôle">
    Ouvrez [http://127.0.0.1:18789](http://127.0.0.1:18789) et utilisez l'onglet **Config**.
    L'interface utilisateur de contrôle affiche un formulaire à partir du schéma de configuration actif, y compris les métadonnées de documentation des champs `title` / `description` ainsi que les schémas de plugin et de canal lorsqu'ils sont disponibles, avec un éditeur **Raw JSON** comme solution de secours. Pour les interfaces d'exploration détaillée et les autres outils, la gateway expose également `config.schema.lookup` pour récupérer un nœud de schéma limité à un chemin ainsi que les résumés immédiats de ses enfants.
  </Tab>
  <Tab title="Modification directe">
    Modifiez directement `~/.openclaw/openclaw.json`. La gateway surveille le fichier et applique les changements automatiquement (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n'accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, types mal formés ou valeurs invalides font que la gateway **refuse de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent attacher des métadonnées JSON Schema.
</Warning>

Remarques sur les outils de schéma :

- `openclaw config schema` affiche la même famille de JSON Schema utilisée par l'interface utilisateur de contrôle et la validation de configuration.
- Les valeurs de champ `title` et `description` sont reportées dans la sortie du schéma pour les outils d'éditeur et de formulaire.
- Les entrées d'objet imbriqué, génériques (`*`) et d'élément de tableau (`[]`) héritent des mêmes métadonnées de documentation lorsqu'une documentation de champ correspondante existe.
- Les branches de composition `anyOf` / `oneOf` / `allOf` héritent également des mêmes métadonnées de documentation, afin que les variantes d'union/intersection conservent la même aide sur les champs.
- `config.schema.lookup` renvoie un chemin de configuration normalisé avec un nœud de schéma superficiel (`title`, `description`, `type`, `enum`, `const`, bornes communes et champs de validation similaires), les métadonnées d'indication d'interface associées, ainsi que les résumés immédiats de ses enfants pour les outils d'exploration détaillée.
- Les schémas de plugin/canal runtime sont fusionnés lorsque la gateway peut charger le registre de manifeste actuel.

Lorsque la validation échoue :

- La gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal possède sa propre section de configuration sous `channels.<provider>`. Consultez la page du canal concerné pour les étapes de configuration :

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

    Tous les canaux partagent le même modèle de politique DM :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer des modèles">
    Définissez le modèle principal et des replis facultatifs :

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` définit le catalogue de modèles et agit comme liste d'autorisation pour `/model`.
    - Les références de modèle utilisent le format `provider/model` (par exemple `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle le redimensionnement des images dans les transcriptions/outils (valeur par défaut `1200`) ; des valeurs plus faibles réduisent généralement l'utilisation de jetons de vision lors d'exécutions riches en captures d'écran.
    - Voir [CLI Models](/concepts/models) pour changer de modèle dans le chat et [Bascule de modèle](/concepts/model-failover) pour le comportement de rotation d'authentification et de repli.
    - Pour les fournisseurs personnalisés/autohébergés, voir [Fournisseurs personnalisés](/gateway/configuration-reference#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L'accès DM est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code de jumelage à usage unique à approuver
    - `"allowlist"` : seuls les expéditeurs présents dans `allowFrom` (ou le magasin d'autorisations de jumelage)
    - `"open"` : autoriser tous les DMs entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignorer tous les DMs

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou les listes d'autorisation spécifiques au canal.

    Voir la [référence complète](/gateway/configuration-reference#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer le filtrage par mention dans les discussions de groupe">
    Les messages de groupe nécessitent par défaut une **mention obligatoire**. Configurez des motifs par agent :

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Mentions de métadonnées** : @mentions natives (WhatsApp tap-to-mention, Telegram @bot, etc.)
    - **Motifs textuels** : motifs regex sûrs dans `mentionPatterns`
    - Voir la [référence complète](/gateway/configuration-reference#group-chat-mention-gating) pour les remplacements par canal et le mode d'auto-chat.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` comme base partagée, puis remplacez-la pour des agents spécifiques avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour autoriser tous les Skills par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n'autoriser aucun Skill.
    - Voir [Skills](/tools/skills), [Configuration des Skills](/tools/skills-config) et la [Référence de configuration](/gateway/configuration-reference#agentsdefaultsskills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de l'état des canaux de la gateway">
    Contrôlez à quel point la gateway redémarre agressivement les canaux qui semblent inactifs :

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages du moniteur d'état.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l'intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques pour un canal ou un compte sans désactiver le moniteur global.
    - Voir [Vérifications d'état](/gateway/health) pour le débogage opérationnel et la [référence complète](/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l'isolation des conversations :

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (partagé) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valeurs par défaut globales pour le routage de sessions liées à un fil (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Voir [Gestion des sessions](/concepts/session) pour la portée, les liens d'identité et la politique d'envoi.
    - Voir la [référence complète](/gateway/configuration-reference#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le sandboxing">
    Exécutez des sessions d'agent dans des conteneurs Docker isolés :

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Construisez d'abord l'image : `scripts/sandbox-setup.sh`

    Voir [Sandboxing](/gateway/sandboxing) pour le guide complet et la [référence complète](/gateway/configuration-reference#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer le push adossé au relais pour les builds iOS officiels">
    Le push adossé au relais est configuré dans `openclaw.json`.

    Définissez ceci dans la configuration gateway :

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facultatif. Valeur par défaut : 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Équivalent CLI :

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Ce que cela fait :

    - Permet à la gateway d'envoyer `push.test`, des nudges de réveil et des réveils de reconnexion via le relais externe.
    - Utilise une autorisation d'envoi limitée à l'enregistrement transmise par l'application iOS jumelée. La gateway n'a pas besoin d'un jeton de relais déployé à l'échelle de l'installation.
    - Lie chaque enregistrement adossé au relais à l'identité gateway avec laquelle l'application iOS a été jumelée, afin qu'une autre gateway ne puisse pas réutiliser l'enregistrement stocké.
    - Garde les builds iOS locaux/manuels sur APNs direct. Les envois adossés au relais ne s'appliquent qu'aux builds officiels distribués qui se sont enregistrés via le relais.
    - Doit correspondre à l'URL de base du relais intégrée dans le build iOS officiel/TestFlight afin que le trafic d'enregistrement et d'envoi atteigne le même déploiement de relais.

    Flux de bout en bout :

    1. Installez un build iOS officiel/TestFlight compilé avec la même URL de base de relais.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur la gateway.
    3. Jumelez l'application iOS à la gateway et laissez les sessions node et operator se connecter.
    4. L'application iOS récupère l'identité de la gateway, s'enregistre auprès du relais à l'aide d'App Attest et du reçu de l'application, puis publie la charge utile `push.apns.register` adossée au relais à la gateway jumelée.
    5. La gateway stocke le handle de relais et l'autorisation d'envoi, puis les utilise pour `push.test`, les nudges de réveil et les réveils de reconnexion.

    Remarques opérationnelles :

    - Si vous basculez l'application iOS vers une autre gateway, reconnectez l'application afin qu'elle puisse publier un nouvel enregistrement de relais lié à cette gateway.
    - Si vous publiez un nouveau build iOS pointant vers un autre déploiement de relais, l'application actualise son enregistrement de relais mis en cache au lieu de réutiliser l'ancienne origine de relais.

    Remarque de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme remplacements d'environnement temporaires.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une solution de développement limitée à local loopback ; ne conservez pas d'URL de relais HTTP dans la configuration.

    Voir [Application iOS](/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d'authentification et de confiance](/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

  </Accordion>

  <Accordion title="Configurer heartbeat (check-ins périodiques)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: chaîne de durée (`30m`, `2h`). Définissez `0m` pour désactiver.
    - `target`: `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy`: `allow` (par défaut) ou `block` pour les cibles de heartbeat de type DM
    - Voir [Heartbeat](/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer des tâches cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: élaguer les sessions d'exécution isolées terminées de `sessions.json` (valeur par défaut `24h` ; définissez `false` pour désactiver).
    - `runLog`: élaguer `cron/runs/<jobId>.jsonl` selon la taille et le nombre de lignes conservées.
    - Voir [Tâches cron](/automation/cron-jobs) pour la vue d'ensemble de la fonctionnalité et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer des webhooks (hooks)">
    Activez les points de terminaison webhook HTTP sur la gateway :

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Remarque de sécurité :
    - Traitez tout contenu de charge utile hook/webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton partagé de la gateway.
    - L'authentification hook se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la query string sont rejetés.
    - `hooks.path` ne peut pas être `/` ; gardez l'entrée webhook sur un sous-chemin dédié tel que `/hooks`.
    - Gardez désactivés les drapeaux de contournement de contenu non sûr (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sauf pour un débogage strictement ciblé.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` pour limiter les clés de session choisies par l'appelant.
    - Pour les agents pilotés par hooks, privilégiez des niveaux de modèle modernes robustes et une politique d'outils stricte (par exemple messagerie uniquement, plus sandboxing lorsque possible).

    Voir la [référence complète](/gateway/configuration-reference#hooks) pour toutes les options de mapping et l'intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec des espaces de travail et des sessions séparés :

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Voir [Multi-Agent](/concepts/multi-agent) et la [référence complète](/gateway/configuration-reference#multi-agent-routing) pour les règles de liaison et les profils d'accès par agent.

  </Accordion>

  <Accordion title="Fractionner la configuration en plusieurs fichiers ($include)">
    Utilisez `$include` pour organiser les grandes configurations :

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Fichier unique** : remplace l'objet conteneur
    - **Tableau de fichiers** : fusion profonde dans l'ordre (les derniers gagnent)
    - **Clés sœurs** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu'à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus par rapport au fichier incluant
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, erreurs d'analyse et inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

La gateway surveille `~/.openclaw/openclaw.json` et applique les changements automatiquement — aucun redémarrage manuel n'est nécessaire pour la plupart des paramètres.

### Modes de rechargement

| Mode                   | Comportement                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique immédiatement à chaud les changements sûrs. Redémarre automatiquement pour les changements critiques. |
| **`hot`**              | Applique uniquement à chaud les changements sûrs. Consigne un avertissement lorsqu'un redémarrage est nécessaire — à vous de le gérer. |
| **`restart`**          | Redémarre la gateway à chaque changement de configuration, sûr ou non.                 |
| **`off`**              | Désactive la surveillance de fichier. Les changements prennent effet au prochain redémarrage manuel. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s'applique à chaud vs ce qui nécessite un redémarrage

La plupart des champs s'appliquent à chaud sans interruption. En mode `hybrid`, les changements nécessitant un redémarrage sont pris en charge automatiquement.

| Catégorie            | Champs                                                               | Redémarrage nécessaire ? |
| ------------------- | -------------------------------------------------------------------- | ------------------------ |
| Canaux              | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et d'extension | Non                  |
| Agent et modèles    | `agent`, `agents`, `models`, `routing`                               | Non                     |
| Automatisation      | `hooks`, `cron`, `agent.heartbeat`                                   | Non                     |
| Sessions et messages | `session`, `messages`                                               | Non                     |
| Outils et médias    | `tools`, `browser`, `skills`, `audio`, `talk`                        | Non                     |
| UI et divers        | `ui`, `logging`, `identity`, `bindings`                              | Non                     |
| Serveur gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Oui**                 |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                                 | **Oui**                 |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — leur modification **ne** déclenche **pas** de redémarrage.
</Note>

## RPC de configuration (mises à jour programmatiques)

<Note>
Les RPC d'écriture du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont limités à **3 requêtes par 60 secondes** par `deviceId+clientIp`. Lorsqu'une limite est atteinte, le RPC renvoie `UNAVAILABLE` avec `retryAfterMs`.
</Note>

Flux sûr/par défaut :

- `config.schema.lookup` : inspecter un sous-arbre de configuration limité à un chemin avec un nœud de schéma superficiel, les métadonnées d'indication associées et les résumés immédiats des enfants
- `config.get` : récupérer l'instantané actuel + le hash
- `config.patch` : chemin préféré pour les mises à jour partielles
- `config.apply` : remplacement de la configuration complète uniquement
- `update.run` : auto-mise à jour + redémarrage explicites

Lorsque vous ne remplacez pas la configuration entière, préférez `config.schema.lookup` puis `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (remplacement complet)">
    Valide + écrit la configuration complète et redémarre la gateway en une seule étape.

    <Warning>
    `config.apply` remplace la **configuration entière**. Utilisez `config.patch` pour les mises à jour partielles, ou `openclaw config set` pour des clés uniques.
    </Warning>

    Paramètres :

    - `raw` (chaîne) — charge utile JSON5 pour la configuration entière
    - `baseHash` (facultatif) — hash de configuration provenant de `config.get` (requis lorsque la configuration existe)
    - `sessionKey` (facultatif) — clé de session pour le ping de réveil après redémarrage
    - `note` (facultatif) — note pour le sentinelle de redémarrage
    - `restartDelayMs` (facultatif) — délai avant redémarrage (par défaut 2000)

    Les demandes de redémarrage sont coalescentes lorsqu'un redémarrage est déjà en attente/en cours, et un cooldown de 30 secondes s'applique entre les cycles de redémarrage.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (mise à jour partielle)">
    Fusionne une mise à jour partielle dans la configuration existante (sémantique JSON merge patch) :

    - Les objets fusionnent récursivement
    - `null` supprime une clé
    - Les tableaux remplacent

    Paramètres :

    - `raw` (chaîne) — JSON5 avec uniquement les clés à modifier
    - `baseHash` (requis) — hash de configuration provenant de `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — identiques à `config.apply`

    Le comportement de redémarrage correspond à celui de `config.apply` : redémarrages en attente coalescents plus un cooldown de 30 secondes entre les cycles de redémarrage.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Variables d'environnement

OpenClaw lit les variables d'environnement depuis le processus parent ainsi que :

- `.env` depuis le répertoire de travail actuel (s'il existe)
- `~/.openclaw/.env` (repli global)

Aucun des deux fichiers ne remplace les variables d'environnement déjà existantes. Vous pouvez également définir des variables inline dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import de l'environnement shell (facultatif)">
  S'il est activé et que les clés attendues ne sont pas définies, OpenClaw exécute votre shell de connexion et importe uniquement les clés manquantes :

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Équivalent variable d'environnement : `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitution de variables d'environnement dans les valeurs de configuration">
  Référencez des variables d'environnement dans n'importe quelle valeur de chaîne de configuration avec `${VAR_NAME}` :

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Règles :

- Seuls les noms en majuscules sont reconnus : `[A-Z_][A-Z0-9_]*`
- Les variables manquantes/vides provoquent une erreur au chargement
- Échappez avec `$${VAR}` pour une sortie littérale
- Fonctionne dans les fichiers `$include`
- Substitution inline : `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Références de secret (env, file, exec)">
  Pour les champs qui prennent en charge les objets SecretRef, vous pouvez utiliser :

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Les détails de SecretRef (y compris `secrets.providers` pour `env`/`file`/`exec`) se trouvent dans [Gestion des secrets](/gateway/secrets).
Les chemins d'identifiants pris en charge sont listés dans [Surface d'identifiants SecretRef](/reference/secretref-credential-surface).
</Accordion>

Voir [Environnement](/help/environment) pour la priorité complète et les sources.

## Référence complète

Pour la référence complète champ par champ, voir **[Référence de configuration](/gateway/configuration-reference)**.

---

_Lié : [Exemples de configuration](/gateway/configuration-examples) · [Référence de configuration](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
