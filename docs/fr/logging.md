---
read_when:
    - Vous avez besoin d’un aperçu de la journalisation adapté aux débutants
    - Vous souhaitez configurer les niveaux ou formats de journalisation
    - Vous êtes en train de dépanner et avez besoin de trouver rapidement les journaux
summary: 'Aperçu de la journalisation : journaux de fichiers, sortie console, suivi CLI et interface de contrôle'
title: Aperçu de la journalisation
x-i18n:
    generated_at: "2026-04-24T07:18:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Journalisation

OpenClaw possède deux principales surfaces de journalisation :

- **Journaux de fichiers** (lignes JSON) écrits par le Gateway.
- **Sortie console** affichée dans les terminaux et dans l’interface Gateway Debug.

L’onglet **Logs** de l’interface de contrôle suit le journal de fichier du gateway. Cette page explique où
se trouvent les journaux, comment les lire et comment configurer les niveaux et formats de journalisation.

## Où se trouvent les journaux

Par défaut, le Gateway écrit un fichier journal rotatif sous :

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La date utilise le fuseau horaire local de l’hôte du gateway.

Vous pouvez remplacer cela dans `~/.openclaw/openclaw.json` :

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Comment lire les journaux

### CLI : suivi en direct (recommandé)

Utilisez la CLI pour suivre le fichier journal du gateway via RPC :

```bash
openclaw logs --follow
```

Options utiles actuelles :

- `--local-time` : afficher les horodatages dans votre fuseau horaire local
- `--url <url>` / `--token <token>` / `--timeout <ms>` : options RPC Gateway standard
- `--expect-final` : indicateur d’attente de réponse finale pour les RPC adossés à un agent (accepté ici via la couche client partagée)

Modes de sortie :

- **Sessions TTY** : lignes de journal jolies, colorées et structurées.
- **Sessions non TTY** : texte brut.
- `--json` : JSON délimité par ligne (un événement de journal par ligne).
- `--plain` : forcer le texte brut dans les sessions TTY.
- `--no-color` : désactiver les couleurs ANSI.

Lorsque vous passez un `--url` explicite, la CLI n’applique pas automatiquement la configuration ni les
identifiants d’environnement ; incluez vous-même `--token` si le Gateway cible
requiert une authentification.

En mode JSON, la CLI émet des objets balisés par `type` :

- `meta` : métadonnées du flux (fichier, curseur, taille)
- `log` : entrée de journal analysée
- `notice` : indications de troncature / rotation
- `raw` : ligne de journal non analysée

Si le Gateway loopback local demande un appairage, `openclaw logs` revient automatiquement
au fichier journal local configuré. Les cibles `--url` explicites n’utilisent pas
ce repli.

Si le Gateway est inaccessible, la CLI affiche une courte indication vous invitant à exécuter :

```bash
openclaw doctor
```

### Interface de contrôle (web)

L’onglet **Logs** de l’interface de contrôle suit le même fichier via `logs.tail`.
Voir [/web/control-ui](/fr/web/control-ui) pour savoir comment l’ouvrir.

### Journaux de canal uniquement

Pour filtrer l’activité des canaux (WhatsApp/Telegram/etc.), utilisez :

```bash
openclaw channels logs --channel whatsapp
```

## Formats de journaux

### Journaux de fichiers (JSONL)

Chaque ligne du fichier journal est un objet JSON. La CLI et l’interface de contrôle analysent ces
entrées pour afficher une sortie structurée (heure, niveau, sous-système, message).

### Sortie console

Les journaux console sont **adaptés au TTY** et formatés pour la lisibilité :

- Préfixes de sous-système (par ex. `gateway/channels/whatsapp`)
- Couleurs de niveau (info/warn/error)
- Mode compact ou JSON facultatif

Le formatage console est contrôlé par `logging.consoleStyle`.

### Journaux WebSocket du Gateway

`openclaw gateway` possède aussi une journalisation du protocole WebSocket pour le trafic RPC :

- mode normal : seulement les résultats intéressants (erreurs, erreurs d’analyse, appels lents)
- `--verbose` : tout le trafic requête/réponse
- `--ws-log auto|compact|full` : choisir le style d’affichage verbeux
- `--compact` : alias pour `--ws-log compact`

Exemples :

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurer la journalisation

Toute la configuration de la journalisation se trouve sous `logging` dans `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Niveaux de journalisation

- `logging.level` : niveau des **journaux de fichiers** (JSONL).
- `logging.consoleLevel` : niveau de verbosité de la **console**.

Vous pouvez remplacer les deux via la variable d’environnement **`OPENCLAW_LOG_LEVEL`** (par ex. `OPENCLAW_LOG_LEVEL=debug`). La variable d’environnement est prioritaire sur le fichier de configuration, ce qui vous permet d’augmenter la verbosité pour une seule exécution sans modifier `openclaw.json`. Vous pouvez aussi passer l’option CLI globale **`--log-level <level>`** (par exemple, `openclaw --log-level debug gateway run`), qui remplace la variable d’environnement pour cette commande.

`--verbose` n’affecte que la sortie console et la verbosité des journaux WS ; il ne modifie pas
les niveaux des journaux de fichiers.

### Styles de console

`logging.consoleStyle` :

- `pretty` : lisible par l’humain, coloré, avec horodatages.
- `compact` : sortie plus serrée (meilleure pour les longues sessions).
- `json` : JSON par ligne (pour les processeurs de journaux).

### Expurgation

Les résumés d’outils peuvent expurger les jetons sensibles avant qu’ils n’atteignent la console :

- `logging.redactSensitive` : `off` | `tools` (par défaut : `tools`)
- `logging.redactPatterns` : liste de chaînes regex pour remplacer l’ensemble par défaut

L’expurgation n’affecte **que la sortie console** et ne modifie pas les journaux de fichiers.

## Diagnostics + OpenTelemetry

Les diagnostics sont des événements structurés et lisibles par machine pour les exécutions de modèle **et**
la télémétrie du flux de messages (webhooks, mise en file d’attente, état de session). Ils ne **remplacent pas**
les journaux ; ils existent pour alimenter les métriques, les traces et d’autres exportateurs.

Les événements de diagnostic sont émis dans le processus, mais les exportateurs ne s’attachent que lorsque
les diagnostics + le plugin exportateur sont activés.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)** : le modèle de données + les SDK pour les traces, métriques et journaux.
- **OTLP** : le protocole filaire utilisé pour exporter les données OTel vers un collecteur/backend.
- OpenClaw exporte aujourd’hui via **OTLP/HTTP (protobuf)**.

### Signaux exportés

- **Métriques** : compteurs + histogrammes (utilisation de jetons, flux de messages, mise en file d’attente).
- **Traces** : spans pour l’utilisation de modèle + traitement des webhooks/messages.
- **Journaux** : exportés via OTLP lorsque `diagnostics.otel.logs` est activé. Le
  volume de journaux peut être élevé ; gardez `logging.level` et les filtres de l’exportateur à l’esprit.

### Catalogue d’événements de diagnostic

Utilisation de modèle :

- `model.usage` : jetons, coût, durée, contexte, fournisseur/modèle/canal, identifiants de session.

Flux de messages :

- `webhook.received` : entrée de webhook par canal.
- `webhook.processed` : webhook traité + durée.
- `webhook.error` : erreurs du gestionnaire de webhook.
- `message.queued` : message mis en file pour traitement.
- `message.processed` : résultat + durée + erreur facultative.

File d’attente + session :

- `queue.lane.enqueue` : mise en file dans une voie de la file de commandes + profondeur.
- `queue.lane.dequeue` : sortie de file d’une voie + temps d’attente.
- `session.state` : transition d’état de session + raison.
- `session.stuck` : avertissement de session bloquée + âge.
- `run.attempt` : métadonnées de tentative/nouvelle tentative d’exécution.
- `diagnostic.heartbeat` : compteurs agrégés (webhooks/file/session).

### Activer les diagnostics (sans exportateur)

Utilisez ceci si vous voulez rendre les événements de diagnostic disponibles pour les plugins ou des destinations personnalisées :

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Options de diagnostic (journaux ciblés)

Utilisez des options pour activer des journaux de débogage supplémentaires et ciblés sans augmenter `logging.level`.
Les options sont insensibles à la casse et prennent en charge les jokers (par ex. `telegram.*` ou `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Remplacement par variable d’environnement (ponctuel) :

```text
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Remarques :

- Les journaux d’options vont dans le fichier journal standard (le même que `logging.file`).
- La sortie reste expurgée selon `logging.redactSensitive`.
- Guide complet : [/diagnostics/flags](/fr/diagnostics/flags).

### Exporter vers OpenTelemetry

Les diagnostics peuvent être exportés via le plugin `diagnostics-otel` (OTLP/HTTP). Cela
fonctionne avec tout collecteur/backend OpenTelemetry acceptant OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

Remarques :

- Vous pouvez aussi activer le plugin avec `openclaw plugins enable diagnostics-otel`.
- `protocol` prend actuellement en charge `http/protobuf` uniquement. `grpc` est ignoré.
- Les métriques incluent l’utilisation des jetons, le coût, la taille du contexte, la durée d’exécution et les
  compteurs/histogrammes de flux de messages (webhooks, mise en file, état de session, profondeur/attente de file).
- Les traces/métriques peuvent être activées/désactivées avec `traces` / `metrics` (activé par défaut). Les traces
  incluent les spans d’utilisation de modèle ainsi que les spans de traitement des webhooks/messages lorsqu’ils sont activés.
- Définissez `headers` lorsque votre collecteur exige une authentification.
- Variables d’environnement prises en charge : `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### Métriques exportées (noms + types)

Utilisation de modèle :

- `openclaw.tokens` (compteur, attributs : `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (compteur, attributs : `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogramme, attributs : `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flux de messages :

- `openclaw.webhook.received` (compteur, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (compteur, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (compteur, attributs : `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (compteur, attributs : `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogramme, attributs : `openclaw.channel`,
  `openclaw.outcome`)

Files + sessions :

- `openclaw.queue.lane.enqueue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (compteur, attributs : `openclaw.lane`)
- `openclaw.queue.depth` (histogramme, attributs : `openclaw.lane` ou
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogramme, attributs : `openclaw.lane`)
- `openclaw.session.state` (compteur, attributs : `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (compteur, attributs : `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histogramme, attributs : `openclaw.state`)
- `openclaw.run.attempt` (compteur, attributs : `openclaw.attempt`)

### Spans exportés (noms + attributs clés)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Échantillonnage + vidage

- Échantillonnage des traces : `diagnostics.otel.sampleRate` (0.0–1.0, spans racine uniquement).
- Intervalle d’export des métriques : `diagnostics.otel.flushIntervalMs` (minimum 1000 ms).

### Remarques sur le protocole

- Les points de terminaison OTLP/HTTP peuvent être définis via `diagnostics.otel.endpoint` ou
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Si le point de terminaison contient déjà `/v1/traces` ou `/v1/metrics`, il est utilisé tel quel.
- Si le point de terminaison contient déjà `/v1/logs`, il est utilisé tel quel pour les journaux.
- `diagnostics.otel.logs` active l’export OTLP des journaux pour la sortie du journaliseur principal.

### Comportement d’export des journaux

- Les journaux OTLP utilisent les mêmes enregistrements structurés que ceux écrits dans `logging.file`.
- Respectent `logging.level` (niveau des journaux de fichiers). L’expurgation console ne s’applique **pas**
  aux journaux OTLP.
- Les installations à fort volume devraient préférer l’échantillonnage/le filtrage par le collecteur OTLP.

## Conseils de dépannage

- **Gateway inaccessible ?** Exécutez d’abord `openclaw doctor`.
- **Journaux vides ?** Vérifiez que le Gateway est en cours d’exécution et écrit bien dans le chemin de fichier
  défini par `logging.file`.
- **Besoin de plus de détails ?** Définissez `logging.level` sur `debug` ou `trace` puis réessayez.

## Lié

- [Détails internes de la journalisation Gateway](/fr/gateway/logging) — styles de journaux WS, préfixes de sous-système et capture console
- [Diagnostics](/fr/gateway/configuration-reference#diagnostics) — export OpenTelemetry et configuration de trace du cache
