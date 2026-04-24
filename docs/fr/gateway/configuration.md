---
read_when:
    - Configuration initiale d’OpenClaw
    - Recherche de modèles de configuration courants
    - Accéder à des sections de configuration spécifiques
summary: 'vue d’ensemble de la configuration : tâches courantes, configuration rapide et liens vers la référence complète'
title: Configuration
x-i18n:
    generated_at: "2026-04-24T07:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw lit une configuration facultative <Tooltip tip="JSON5 prend en charge les commentaires et les virgules finales">**JSON5**</Tooltip> depuis `~/.openclaw/openclaw.json`.
Le chemin de configuration actif doit être un fichier ordinaire. Les dispositions
`openclaw.json` avec lien symbolique ne sont pas prises en charge pour les écritures gérées par OpenClaw ; une écriture atomique peut remplacer
le chemin au lieu de préserver le lien symbolique. Si vous conservez la configuration en dehors du
répertoire d’état par défaut, pointez `OPENCLAW_CONFIG_PATH` directement vers le vrai fichier.

Si le fichier est absent, OpenClaw utilise des valeurs par défaut sûres. Raisons courantes d’ajouter une configuration :

- Connecter des canaux et contrôler qui peut envoyer des messages au bot
- Définir les modèles, outils, le sandboxing ou l’automatisation (Cron, hooks)
- Ajuster les sessions, les médias, le réseau ou l’interface utilisateur

Voir la [référence complète](/fr/gateway/configuration-reference) pour tous les champs disponibles.

<Tip>
**Nouveau dans la configuration ?** Commencez avec `openclaw onboard` pour une configuration interactive, ou consultez le guide [Exemples de configuration](/fr/gateway/configuration-examples) pour des configurations complètes prêtes à copier-coller.
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
    openclaw onboard       # flux d’intégration complet
    openclaw configure     # assistant de configuration
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Ouvrez [http://127.0.0.1:18789](http://127.0.0.1:18789) et utilisez l’onglet **Config**.
    Le Control UI affiche un formulaire à partir du schéma de configuration actif, y compris les métadonnées de documentation de champ
    `title` / `description` ainsi que les schémas de Plugin et de canal lorsque
    disponibles, avec un éditeur **Raw JSON** comme échappatoire. Pour les interfaces
    de navigation détaillée et autres outils, la Gateway expose également `config.schema.lookup` pour
    récupérer un nœud de schéma limité à un chemin ainsi que les résumés de ses enfants immédiats.
  </Tab>
  <Tab title="Édition directe">
    Modifiez directement `~/.openclaw/openclaw.json`. La Gateway surveille le fichier et applique automatiquement les modifications (voir [rechargement à chaud](#config-hot-reload)).
  </Tab>
</Tabs>

## Validation stricte

<Warning>
OpenClaw n’accepte que les configurations qui correspondent entièrement au schéma. Les clés inconnues, les types mal formés ou les valeurs invalides font que la Gateway **refuse de démarrer**. La seule exception au niveau racine est `$schema` (chaîne), afin que les éditeurs puissent attacher des métadonnées JSON Schema.
</Warning>

`openclaw config schema` affiche le JSON Schema canonique utilisé par Control UI
et la validation. `config.schema.lookup` récupère un seul nœud limité à un chemin plus
les résumés enfants pour les outils de navigation détaillée. Les métadonnées de documentation de champ `title`/`description`
sont conservées à travers les objets imbriqués, les jokers (`*`), les éléments de tableau (`[]`) et les branches `anyOf`/
`oneOf`/`allOf`. Les schémas runtime de Plugin et de canal sont fusionnés lorsque le
registre de manifestes est chargé.

Lorsque la validation échoue :

- La Gateway ne démarre pas
- Seules les commandes de diagnostic fonctionnent (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Exécutez `openclaw doctor` pour voir les problèmes exacts
- Exécutez `openclaw doctor --fix` (ou `--yes`) pour appliquer les réparations

La Gateway conserve une copie de confiance du dernier état valide connu après chaque démarrage réussi.
Si `openclaw.json` échoue ensuite à la validation (ou perd `gateway.mode`, rétrécit
fortement ou a une ligne de journal parasite ajoutée au début), OpenClaw conserve le fichier
cassé comme `.clobbered.*`, restaure la dernière copie valide connue et journalise la raison de récupération.
Le prochain tour d’agent reçoit également un avertissement d’événement système afin que l’agent principal
ne réécrive pas aveuglément la configuration restaurée. La promotion vers le dernier état valide connu
est ignorée lorsqu’un candidat contient des espaces réservés de secret masqués tels que `***`.

## Tâches courantes

<AccordionGroup>
  <Accordion title="Configurer un canal (WhatsApp, Telegram, Discord, etc.)">
    Chaque canal a sa propre section de configuration sous `channels.<provider>`. Voir la page dédiée du canal pour les étapes de configuration :

    - [WhatsApp](/fr/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/fr/channels/telegram) — `channels.telegram`
    - [Discord](/fr/channels/discord) — `channels.discord`
    - [Feishu](/fr/channels/feishu) — `channels.feishu`
    - [Google Chat](/fr/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/fr/channels/msteams) — `channels.msteams`
    - [Slack](/fr/channels/slack) — `channels.slack`
    - [Signal](/fr/channels/signal) — `channels.signal`
    - [iMessage](/fr/channels/imessage) — `channels.imessage`
    - [Mattermost](/fr/channels/mattermost) — `channels.mattermost`

    Tous les canaux partagent le même modèle de politique DM :

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // uniquement pour allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Choisir et configurer des modèles">
    Définissez le modèle principal et les replis facultatifs :

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

    - `agents.defaults.models` définit le catalogue de modèles et agit comme liste d’autorisation pour `/model`.
    - Utilisez `openclaw config set agents.defaults.models '<json>' --strict-json --merge` pour ajouter des entrées de liste d’autorisation sans supprimer les modèles existants. Les remplacements simples qui supprimeraient des entrées sont rejetés sauf si vous passez `--replace`.
    - Les références de modèle utilisent le format `provider/model` (par ex. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` contrôle la réduction d’échelle des images dans les transcriptions/outils (par défaut `1200`) ; des valeurs plus basses réduisent généralement l’usage de tokens de vision dans les exécutions riches en captures d’écran.
    - Voir [CLI des modèles](/fr/concepts/models) pour changer de modèle dans le chat et [Basculement de modèle](/fr/concepts/model-failover) pour la rotation d’authentification et le comportement de repli.
    - Pour les fournisseurs personnalisés/auto-hébergés, voir [Fournisseurs personnalisés](/fr/gateway/config-tools#custom-providers-and-base-urls) dans la référence.

  </Accordion>

  <Accordion title="Contrôler qui peut envoyer des messages au bot">
    L’accès DM est contrôlé par canal via `dmPolicy` :

    - `"pairing"` (par défaut) : les expéditeurs inconnus reçoivent un code d’association unique à approuver
    - `"allowlist"` : seuls les expéditeurs présents dans `allowFrom` (ou le magasin d’autorisation associé)
    - `"open"` : autorise tous les DM entrants (nécessite `allowFrom: ["*"]`)
    - `"disabled"` : ignore tous les DM

    Pour les groupes, utilisez `groupPolicy` + `groupAllowFrom` ou des listes d’autorisation spécifiques au canal.

    Voir la [référence complète](/fr/gateway/config-channels#dm-and-group-access) pour les détails par canal.

  </Accordion>

  <Accordion title="Configurer le filtrage par mention dans les discussions de groupe">
    Les messages de groupe exigent par défaut **une mention**. Configurez les motifs par agent :

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

    - **Mentions de métadonnées** : mentions @ natives (WhatsApp mention par appui, Telegram @bot, etc.)
    - **Motifs texte** : motifs regex sûrs dans `mentionPatterns`
    - Voir la [référence complète](/fr/gateway/config-channels#group-chat-mention-gating) pour les redéfinitions par canal et le mode self-chat.

  </Accordion>

  <Accordion title="Restreindre les Skills par agent">
    Utilisez `agents.defaults.skills` pour une base partagée, puis redéfinissez des
    agents spécifiques avec `agents.list[].skills` :

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hérite de github, weather
          { id: "docs", skills: ["docs-search"] }, // remplace les valeurs par défaut
          { id: "locked-down", skills: [] }, // aucun skill
        ],
      },
    }
    ```

    - Omettez `agents.defaults.skills` pour des Skills non restreints par défaut.
    - Omettez `agents.list[].skills` pour hériter des valeurs par défaut.
    - Définissez `agents.list[].skills: []` pour n’avoir aucun Skills.
    - Voir [Skills](/fr/tools/skills), [Configuration des Skills](/fr/tools/skills-config), et
      la [Référence de configuration](/fr/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajuster la surveillance de santé des canaux de la Gateway">
    Contrôlez à quel point la Gateway redémarre agressivement les canaux qui semblent inactifs :

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

    - Définissez `gateway.channelHealthCheckMinutes: 0` pour désactiver globalement les redémarrages de surveillance de santé.
    - `channelStaleEventThresholdMinutes` doit être supérieur ou égal à l’intervalle de vérification.
    - Utilisez `channels.<provider>.healthMonitor.enabled` ou `channels.<provider>.accounts.<id>.healthMonitor.enabled` pour désactiver les redémarrages automatiques pour un canal ou compte sans désactiver le moniteur global.
    - Voir [Contrôles de santé](/fr/gateway/health) pour le débogage opérationnel et la [référence complète](/fr/gateway/configuration-reference#gateway) pour tous les champs.

  </Accordion>

  <Accordion title="Configurer les sessions et les réinitialisations">
    Les sessions contrôlent la continuité et l’isolation des conversations :

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommandé pour multi-utilisateur
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

    - `dmScope` : `main` (partagé) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings` : valeurs par défaut globales pour le routage de session lié à un fil (Discord prend en charge `/focus`, `/unfocus`, `/agents`, `/session idle` et `/session max-age`).
    - Voir [Gestion des sessions](/fr/concepts/session) pour le périmètre, les liens d’identité et la politique d’envoi.
    - Voir la [référence complète](/fr/gateway/config-agents#session) pour tous les champs.

  </Accordion>

  <Accordion title="Activer le sandboxing">
    Exécutez les sessions d’agent dans des runtimes sandboxés isolés :

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

    Construisez d’abord l’image : `scripts/sandbox-setup.sh`

    Voir [Sandboxing](/fr/gateway/sandboxing) pour le guide complet et la [référence complète](/fr/gateway/config-agents#agentsdefaultssandbox) pour toutes les options.

  </Accordion>

  <Accordion title="Activer le push adossé à un relais pour les builds iOS officiels">
    Le push adossé à un relais est configuré dans `openclaw.json`.

    Définissez ceci dans la configuration Gateway :

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facultatif. Par défaut : 10000
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

    - Permet à la Gateway d’envoyer `push.test`, les impulsions de réveil et les réveils de reconnexion via le relais externe.
    - Utilise une autorisation d’envoi à portée d’enregistrement transmise par l’app iOS associée. La Gateway n’a pas besoin d’un jeton de relais valable pour tout le déploiement.
    - Lie chaque enregistrement adossé à un relais à l’identité de Gateway avec laquelle l’app iOS a été associée, de sorte qu’une autre Gateway ne puisse pas réutiliser l’enregistrement stocké.
    - Conserve les builds iOS locaux/manuels sur APNs direct. Les envois adossés à un relais s’appliquent uniquement aux builds officiels distribués qui se sont enregistrés via le relais.
    - Doit correspondre à l’URL de base du relais intégrée dans le build iOS officiel/TestFlight, afin que le trafic d’enregistrement et d’envoi atteigne le même déploiement de relais.

    Flux de bout en bout :

    1. Installez un build iOS officiel/TestFlight compilé avec la même URL de base de relais.
    2. Configurez `gateway.push.apns.relay.baseUrl` sur la Gateway.
    3. Associez l’app iOS à la Gateway et laissez les sessions Node et opérateur se connecter.
    4. L’app iOS récupère l’identité de Gateway, s’enregistre auprès du relais à l’aide d’App Attest plus le reçu de l’app, puis publie la charge utile `push.apns.register` adossée au relais vers la Gateway associée.
    5. La Gateway stocke le handle du relais et l’autorisation d’envoi, puis les utilise pour `push.test`, les impulsions de réveil et les réveils de reconnexion.

    Remarques opérationnelles :

    - Si vous basculez l’app iOS vers une autre Gateway, reconnectez l’app afin qu’elle puisse publier un nouvel enregistrement de relais lié à cette Gateway.
    - Si vous distribuez un nouveau build iOS pointant vers un déploiement de relais différent, l’app actualise son enregistrement de relais mis en cache au lieu de réutiliser l’ancienne origine de relais.

    Remarque de compatibilité :

    - `OPENCLAW_APNS_RELAY_BASE_URL` et `OPENCLAW_APNS_RELAY_TIMEOUT_MS` fonctionnent toujours comme redéfinitions temporaires par variable d’environnement.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` reste une échappatoire de développement limitée à loopback ; ne conservez pas d’URL de relais HTTP dans la configuration.

    Voir [App iOS](/fr/platforms/ios#relay-backed-push-for-official-builds) pour le flux de bout en bout et [Flux d’authentification et de confiance](/fr/platforms/ios#authentication-and-trust-flow) pour le modèle de sécurité du relais.

  </Accordion>

  <Accordion title="Configurer Heartbeat (vérifications périodiques)">
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

    - `every` : chaîne de durée (`30m`, `2h`). Définissez `0m` pour désactiver.
    - `target` : `last` | `none` | `<channel-id>` (par exemple `discord`, `matrix`, `telegram` ou `whatsapp`)
    - `directPolicy` : `allow` (par défaut) ou `block` pour les cibles Heartbeat de type DM
    - Voir [Heartbeat](/fr/gateway/heartbeat) pour le guide complet.

  </Accordion>

  <Accordion title="Configurer les tâches Cron">
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

    - `sessionRetention` : purge les sessions d’exécution isolées terminées de `sessions.json` (par défaut `24h` ; définissez `false` pour désactiver).
    - `runLog` : purge `cron/runs/<jobId>.jsonl` selon la taille et le nombre de lignes conservées.
    - Voir [Tâches Cron](/fr/automation/cron-jobs) pour la vue d’ensemble des fonctionnalités et des exemples CLI.

  </Accordion>

  <Accordion title="Configurer des Webhook (hooks)">
    Activez les points de terminaison HTTP Webhook sur la Gateway :

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
    - Traitez tout le contenu des charges utiles hook/webhook comme une entrée non fiable.
    - Utilisez un `hooks.token` dédié ; ne réutilisez pas le jeton Gateway partagé.
    - L’authentification des hooks se fait uniquement par en-tête (`Authorization: Bearer ...` ou `x-openclaw-token`) ; les jetons dans la chaîne de requête sont rejetés.
    - `hooks.path` ne peut pas être `/` ; conservez l’entrée webhook sur un sous-chemin dédié tel que `/hooks`.
    - Laissez désactivés les indicateurs de contournement de contenu non sûr (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) sauf en cas de débogage strictement ciblé.
    - Si vous activez `hooks.allowRequestSessionKey`, définissez également `hooks.allowedSessionKeyPrefixes` pour borner les clés de session choisies par l’appelant.
    - Pour les agents pilotés par hook, préférez des niveaux de modèle modernes solides et une politique d’outils stricte (par exemple messagerie uniquement plus sandboxing lorsque possible).

    Voir la [référence complète](/fr/gateway/configuration-reference#hooks) pour toutes les options de mappage et l’intégration Gmail.

  </Accordion>

  <Accordion title="Configurer le routage multi-agent">
    Exécutez plusieurs agents isolés avec des espaces de travail et sessions séparés :

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

    Voir [Multi-agent](/fr/concepts/multi-agent) et la [référence complète](/fr/gateway/config-agents#multi-agent-routing) pour les règles de liaison et les profils d’accès par agent.

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

    - **Fichier unique** : remplace l’objet conteneur
    - **Tableau de fichiers** : fusion profonde dans l’ordre (le plus tardif l’emporte)
    - **Clés sœurs** : fusionnées après les inclusions (remplacent les valeurs incluses)
    - **Inclusions imbriquées** : prises en charge jusqu’à 10 niveaux de profondeur
    - **Chemins relatifs** : résolus par rapport au fichier incluant
    - **Écritures gérées par OpenClaw** : lorsqu’une écriture modifie une seule section de niveau supérieur
      adossée à une inclusion de fichier unique telle que `plugins: { $include: "./plugins.json5" }`,
      OpenClaw met à jour ce fichier inclus et laisse `openclaw.json` intact
    - **Écriture traversante non prise en charge** : les inclusions racine, les tableaux d’inclusion et les inclusions
      avec redéfinitions sœurs échouent de manière stricte pour les écritures gérées par OpenClaw au lieu
      d’aplatir la configuration
    - **Gestion des erreurs** : erreurs claires pour les fichiers manquants, les erreurs d’analyse et les inclusions circulaires

  </Accordion>
</AccordionGroup>

## Rechargement à chaud de la configuration

La Gateway surveille `~/.openclaw/openclaw.json` et applique automatiquement les modifications — aucun redémarrage manuel n’est nécessaire pour la plupart des paramètres.

Les modifications directes du fichier sont traitées comme non fiables jusqu’à leur validation. Le watcher attend
que les écritures temporaires/renommages de l’éditeur se stabilisent, lit le fichier final et rejette
les modifications externes invalides en restaurant la dernière configuration valide connue. Les écritures de configuration gérées par OpenClaw utilisent la même barrière de schéma avant écriture ; les écrasements destructeurs tels
que la suppression de `gateway.mode` ou la réduction du fichier de plus de moitié sont rejetés
et enregistrés comme `.rejected.*` pour inspection.

Si vous voyez `Config auto-restored from last-known-good` ou
`config reload restored last-known-good config` dans les journaux, inspectez le fichier
`.clobbered.*` correspondant à côté de `openclaw.json`, corrigez la charge utile rejetée puis exécutez
`openclaw config validate`. Voir [Dépannage de la Gateway](/fr/gateway/troubleshooting#gateway-restored-last-known-good-config)
pour la liste de contrôle de récupération.

### Modes de rechargement

| Mode                   | Comportement                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (par défaut) | Applique à chaud immédiatement les modifications sûres. Redémarre automatiquement pour les modifications critiques. |
| **`hot`**              | Applique à chaud uniquement les modifications sûres. Journalise un avertissement lorsqu’un redémarrage est nécessaire — à vous de le gérer. |
| **`restart`**          | Redémarre la Gateway sur toute modification de configuration, sûre ou non.            |
| **`off`**              | Désactive la surveillance de fichier. Les modifications prennent effet au prochain redémarrage manuel. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Ce qui s’applique à chaud et ce qui nécessite un redémarrage

La plupart des champs s’appliquent à chaud sans interruption. En mode `hybrid`, les modifications nécessitant un redémarrage sont gérées automatiquement.

| Catégorie            | Champs                                                            | Redémarrage nécessaire ? |
| -------------------- | ----------------------------------------------------------------- | ------------------------ |
| Canaux               | `channels.*`, `web` (WhatsApp) — tous les canaux intégrés et de Plugin | Non                  |
| Agent & modèles      | `agent`, `agents`, `models`, `routing`                            | Non                      |
| Automatisation       | `hooks`, `cron`, `agent.heartbeat`                                | Non                      |
| Sessions & messages  | `session`, `messages`                                             | Non                      |
| Outils & médias      | `tools`, `browser`, `skills`, `audio`, `talk`                     | Non                      |
| Interface & divers   | `ui`, `logging`, `identity`, `bindings`                           | Non                      |
| Serveur Gateway      | `gateway.*` (port, bind, auth, Tailscale, TLS, HTTP)              | **Oui**                  |
| Infrastructure       | `discovery`, `canvasHost`, `plugins`                              | **Oui**                  |

<Note>
`gateway.reload` et `gateway.remote` sont des exceptions — leur modification **ne** déclenche **pas** de redémarrage.
</Note>

### Planification du rechargement

Lorsque vous modifiez un fichier source référencé via `$include`, OpenClaw planifie
le rechargement à partir de la disposition rédigée dans la source, et non de la vue en mémoire aplatie.
Cela maintient des décisions de rechargement à chaud (application à chaud vs redémarrage) prévisibles même lorsqu’une
seule section de niveau supérieur se trouve dans son propre fichier inclus, comme
`plugins: { $include: "./plugins.json5" }`. La planification du rechargement échoue de manière stricte si la
disposition source est ambiguë.

## RPC de configuration (mises à jour programmatiques)

Pour les outils qui écrivent la configuration via l’API Gateway, préférez ce flux :

- `config.schema.lookup` pour inspecter un sous-arbre (nœud de schéma superficiel + résumés
  des enfants)
- `config.get` pour récupérer l’instantané actuel plus `hash`
- `config.patch` pour des mises à jour partielles (JSON merge patch : les objets fusionnent, `null`
  supprime, les tableaux remplacent)
- `config.apply` uniquement lorsque vous avez l’intention de remplacer toute la configuration
- `update.run` pour une auto-mise à jour explicite plus redémarrage

<Note>
Les écritures du plan de contrôle (`config.apply`, `config.patch`, `update.run`) sont
limitées à 3 requêtes par 60 secondes par `deviceId+clientIp`. Les
demandes de redémarrage sont fusionnées puis imposent un cooldown de 30 secondes entre les cycles de redémarrage.
</Note>

Exemple de patch partiel :

```bash
openclaw gateway call config.get --params '{}'  # capturer payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` et `config.patch` acceptent tous deux `raw`, `baseHash`, `sessionKey`,
`note` et `restartDelayMs`. `baseHash` est requis pour les deux méthodes lorsqu’une
configuration existe déjà.

## Variables d’environnement

OpenClaw lit les variables d’environnement depuis le processus parent plus :

- `.env` depuis le répertoire de travail courant (s’il existe)
- `~/.openclaw/.env` (repli global)

Aucun de ces fichiers ne remplace les variables d’environnement existantes. Vous pouvez aussi définir des variables d’environnement en ligne dans la configuration :

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Import de l’environnement du shell (facultatif)">
  Si cette option est activée et que les clés attendues ne sont pas définies, OpenClaw exécute votre shell de connexion et importe uniquement les clés manquantes :

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Équivalent variable d’environnement : `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Substitution de variables d’environnement dans les valeurs de configuration">
  Référencez les variables d’environnement dans n’importe quelle valeur de chaîne de configuration avec `${VAR_NAME}` :

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
- Substitution en ligne : `"${BASE}/v1"` → `"https://api.example.com/v1"`

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

Les détails SecretRef (y compris `secrets.providers` pour `env`/`file`/`exec`) se trouvent dans [Gestion des secrets](/fr/gateway/secrets).
Les chemins d’identifiants pris en charge sont listés dans [Surface des identifiants SecretRef](/fr/reference/secretref-credential-surface).
</Accordion>

Voir [Environnement](/fr/help/environment) pour l’ordre de priorité complet et les sources.

## Référence complète

Pour la référence complète champ par champ, voir **[Référence de configuration](/fr/gateway/configuration-reference)**.

---

_Associé : [Exemples de configuration](/fr/gateway/configuration-examples) · [Référence de configuration](/fr/gateway/configuration-reference) · [Doctor](/fr/gateway/doctor)_

## Liens associés

- [Référence de configuration](/fr/gateway/configuration-reference)
- [Exemples de configuration](/fr/gateway/configuration-examples)
- [Guide opérationnel Gateway](/fr/gateway)
