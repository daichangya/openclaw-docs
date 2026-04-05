---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL des transcriptions ou les champs de sessions.json
    - Vous modifiez le comportement d’auto-compaction ou ajoutez des tâches de maintenance « pré-compaction »
    - Vous souhaitez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse détaillée : magasin de sessions + transcriptions, cycle de vie et internals de compaction (auto)'
title: Analyse détaillée de la gestion des sessions
x-i18n:
    generated_at: "2026-04-05T12:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestion des sessions et compaction (analyse détaillée)

Ce document explique comment OpenClaw gère les sessions de bout en bout :

- **Routage des sessions** (comment les messages entrants sont mappés à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (corrections spécifiques aux providers avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs tokens suivis)
- **Compaction** (compaction manuelle + automatique) et où raccorder le travail pré-compaction
- **Maintenance silencieuse** (par ex. écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous souhaitez d’abord une vue d’ensemble plus générale, commencez par :

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/memory](/concepts/memory)
- [/concepts/memory-search](/concepts/memory-search)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Source de vérité : la Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces utilisateur (application macOS, interface web Control UI, TUI) doivent interroger la Gateway pour les listes de sessions et les nombres de tokens.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers locaux sur votre Mac » ne reflète pas ce que la Gateway utilise.

---

## Deux couches de persistance

OpenClaw conserve les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Map clé/valeur : `sessionKey -> SessionEntry`
   - Petite, mutable, sûre à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (ID de session courant, dernière activité, bascules, compteurs de tokens, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription en ajout seul avec structure en arbre (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de compaction
   - Utilisée pour reconstruire le contexte du modèle pour les tours futurs

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujets Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw résout ces chemins via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json` et les artefacts de transcription :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : limite du nombre d’entrées dans `sessions.json` (par défaut `500`)
- `rotateBytes` : effectue une rotation de `sessions.json` lorsqu’il est surdimensionné (par défaut `10mb`)
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire des sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Ordre d’application pour le nettoyage sous contrainte de budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts de transcription archivés ou orphelins les plus anciens.
2. Si l’usage reste supérieur à la cible, évincer les entrées de session les plus anciennes et leurs fichiers de transcription.
3. Continuer jusqu’à ce que l’usage soit inférieur ou égal à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions cron et journaux d’exécution

Les exécutions cron isolées créent également des entrées/transcriptions de session, et elles disposent de contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) élague les anciennes sessions d’exécution cron isolées du magasin de sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (par défaut : `2_000_000` octets et `2000` lignes).

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolation).

Motifs courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées sur [/concepts/session](/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` courant (le fichier de transcription qui poursuit la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4h00 heure locale sur l’hôte gateway) crée un nouveau `sessionId` au prochain message après la frontière de réinitialisation.
- **Expiration d’inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque quotidien + inactivité sont tous deux configurés, le premier qui expire l’emporte.
- **Garde de fork parent de fil** (`session.parentForkMaxTokens`, par défaut `100000`) ignore le fork de la transcription parent lorsque la session parente est déjà trop volumineuse ; le nouveau fil démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant de transcription courant (le nom de fichier est dérivé de celui-ci sauf si `sessionFile` est défini)
- `updatedAt` : horodatage de la dernière activité
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces utilisateur et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection de modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (au mieux / dépendants du provider) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où l’auto-compaction s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-compaction
- `memoryFlushCompactionCount` : nombre de compactions au moment du dernier vidage

Le magasin peut être modifié sans risque, mais la Gateway fait autorité : elle peut réécrire ou réhydrater les entrées à mesure que les sessions s’exécutent.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est au format JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Ensuite : entrées de session avec `id` + `parentId` (arbre)

Types d’entrée notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’UI)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de compaction conservé avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé conservé lors de la navigation dans une branche de l’arbre

OpenClaw choisit intentionnellement de **ne pas** « corriger » les transcriptions ; la Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs tokens suivis

Deux concepts différents sont importants :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (tokens visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous réglez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport à l’exécution ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, voir [/token-use](/reference/token-use).

---

## Compaction : ce que c’est

La compaction résume les parties plus anciennes de la conversation dans une entrée `compaction` conservée dans la transcription et conserve intacts les messages récents.

Après la compaction, les tours futurs voient :

- Le résumé de compaction
- Les messages après `firstKeptEntryId`

La compaction est **persistante** (contrairement à l’élagage de session). Voir [/concepts/session-pruning](/concepts/session-pruning).

## Frontières de blocs de compaction et appariement des outils

Lorsque OpenClaw découpe une longue transcription en blocs de compaction, il conserve les
appels d’outils de l’assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si le découpage par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la frontière jusqu’au message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc de résultat d’outil final ferait autrement dépasser le bloc de l’objectif,
  OpenClaw préserve ce bloc d’outil en attente et conserve intacte la queue non résumée.
- Les blocs d’appels d’outils abandonnés/en erreur ne maintiennent pas une séparation en attente ouverte.

---

## Quand l’auto-compaction se produit (runtime Pi)

Dans l’agent Pi intégré, l’auto-compaction se déclenche dans deux cas :

1. **Récupération après dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et autres variantes similaires selon le provider) → compacter → réessayer.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée pour les prompts + la prochaine sortie du modèle

Il s’agit de la sémantique du runtime Pi (OpenClaw consomme les événements, mais c’est Pi qui décide quand compacter).

---

## Paramètres de compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de compaction de Pi se trouvent dans les paramètres Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw impose également un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver ce plancher.
- Si la valeur est déjà plus élevée, OpenClaw n’y touche pas.

Pourquoi : laisser suffisamment de marge pour la « maintenance » sur plusieurs tours (comme les écritures mémoire) avant que la compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la compaction et l’état de session via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de compactions

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de livraison.
- La suppression du jeton silencieux exact est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque la charge utile entière n’est constituée que du jeton silencieux.
- Cela est réservé aux véritables tours en arrière-plan/sans livraison ; ce n’est pas un raccourci pour
  les requêtes utilisateur ordinaires demandant une action.

Depuis `2026.1.10`, OpenClaw supprime également le **streaming de brouillon/de saisie** lorsqu’un
bloc partiel commence par `NO_REPLY`, de sorte que les opérations silencieuses ne divulguent pas de sortie
partielle en cours de tour.

---

## « Vidage mémoire » pré-compaction (implémenté)

Objectif : avant que l’auto-compaction ne se produise, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par ex. `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la compaction ne puisse pas
effacer le contexte critique.

OpenClaw utilise l’approche de **vidage avant le seuil** :

1. Surveiller l’utilisation du contexte de la session.
2. Lorsqu’elle franchit un « seuil doux » (en dessous du seuil de compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » vers l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Remarques :

- Le prompt / systemPrompt par défaut inclut un indice `NO_REPLY` pour supprimer
  la livraison.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Memory](/concepts/memory) pour la disposition des fichiers de l’espace de travail et les modèles d’écriture.

Pi expose également un hook `session_before_compact` dans l’API d’extension, mais la logique
de vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de vérification de dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/concepts/session) et confirmez la `sessionKey` dans `/status`.
- Incohérence entre magasin et transcription ? Confirmez l’hôte Gateway et le chemin du magasin via `openclaw status`.
- Compaction excessive ? Vérifiez :
  - fenêtre de contexte du modèle (trop petite)
  - paramètres de compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une compaction plus précoce)
  - surcharge de résultats d’outils : activez/réglez l’élagage de session
- Fuite de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous utilisez une build qui inclut le correctif de suppression du streaming.
