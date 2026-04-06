---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement de compaction automatique ou ajoutez un traitement de maintenance « pré-compaction »
    - Vous voulez implémenter des vidages de mémoire ou des tours système silencieux
summary: 'Analyse approfondie : stockage des sessions + transcriptions, cycle de vie et mécanismes internes de compaction (auto)'
title: Analyse approfondie de la gestion des sessions
x-i18n:
    generated_at: "2026-04-06T03:12:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0d8c2d30be773eac0424f7a4419ab055fdd50daac8bc654e7d250c891f2c3b8
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestion des sessions et compaction (analyse approfondie)

Ce document explique comment OpenClaw gère les sessions de bout en bout :

- **Routage des sessions** (comment les messages entrants sont mappés à une `sessionKey`)
- **Stockage des sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs spécifiques aux fournisseurs avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs tokens suivis)
- **Compaction** (compaction manuelle + automatique) et où brancher le travail pré-compaction
- **Maintenance silencieuse** (par ex. écritures mémoire qui ne doivent pas produire de sortie visible par l’utilisateur)

Si vous voulez d’abord une vue d’ensemble de plus haut niveau, commencez par :

- [/concepts/session](/fr/concepts/session)
- [/concepts/compaction](/fr/concepts/compaction)
- [/concepts/memory](/fr/concepts/memory)
- [/concepts/memory-search](/fr/concepts/memory-search)
- [/concepts/session-pruning](/fr/concepts/session-pruning)
- [/reference/transcript-hygiene](/fr/reference/transcript-hygiene)

---

## Source de vérité : la Gateway

OpenClaw est conçu autour d’un unique **processus Gateway** qui possède l’état des sessions.

- Les interfaces (application macOS, Control UI web, TUI) doivent interroger la Gateway pour les listes de sessions et les nombres de tokens.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflétera pas ce que la Gateway utilise.

---

## Deux couches de persistance

OpenClaw persiste les sessions dans deux couches :

1. **Stockage des sessions (`sessions.json`)**
   - Map clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (identifiant de session courant, dernière activité, bascules, compteurs de tokens, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription append-only avec structure en arbre (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + les appels d’outils + les résumés de compaction
   - Utilisée pour reconstruire le contexte du modèle pour les tours futurs

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Stockage : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du stockage et contrôles disque

La persistance des sessions dispose de contrôles de maintenance automatiques (`session.maintenance`) pour `sessions.json` et les artefacts de transcription :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : nombre maximal d’entrées dans `sessions.json` (par défaut `500`)
- `rotateBytes` : rotation de `sessions.json` lorsqu’il devient trop gros (par défaut `10mb`)
- `resetArchiveRetention` : rétention pour les archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget optionnel pour le répertoire des sessions
- `highWaterBytes` : cible optionnelle après nettoyage (par défaut `80%` de `maxDiskBytes`)

Ordre d’application pour le nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les plus anciens artefacts de transcription archivés ou orphelins.
2. Si l’utilisation reste au-dessus de la cible, évincer les plus anciennes entrées de session et leurs fichiers de transcription.
3. Continuer jusqu’à ce que l’utilisation soit inférieure ou égale à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le stockage/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions cron et journaux d’exécution

Les exécutions cron isolées créent également des entrées de session/transcriptions, et elles ont des contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) supprime les anciennes sessions d’exécution cron isolées du stockage des sessions (`false` désactive).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` élaguent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (valeurs par défaut : `2_000_000` octets et `2000` lignes).

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolation).

Modèles courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf remplacement)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` courant (le fichier de transcription qui poursuit la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut à 4:00 du matin heure locale sur l’hôte Gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration par inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque quotidien + inactivité sont tous deux configurés, le premier expiré l’emporte.
- **Garde de fork parent de fil** (`session.parentForkMaxTokens`, par défaut `100000`) ignore le fork de transcription parente lorsque la session parente est déjà trop volumineuse ; le nouveau fil démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du stockage des sessions (`sessions.json`)

Le type de valeur du stockage est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant de transcription courant (le nom de fichier en est dérivé sauf si `sessionFile` est défini)
- `updatedAt` : horodatage de la dernière activité
- `sessionFile` : remplacement facultatif explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces et les politiques d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage des groupes/canaux
- Bascules :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (remplacement par session)
- Sélection de modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (au mieux / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où la compaction automatique s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-compaction
- `memoryFlushCompactionCount` : nombre de compactions lors de la dernière exécution du vidage

Le stockage peut être modifié sans danger, mais la Gateway fait autorité : elle peut réécrire ou réhydrater les entrées au fil des sessions.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est au format JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrée notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par extension qui _entrent_ dans le contexte du modèle (peuvent être masqués dans l’interface)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé de compaction persisté avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persisté lors de la navigation dans une branche de l’arbre

OpenClaw ne « corrige » volontairement **pas** les transcriptions ; la Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs tokens suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : limite stricte par modèle (tokens visibles par le modèle)
2. **Compteurs du stockage de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte provient du catalogue de modèles (et peut être remplacée via la config).
- `contextTokens` dans le stockage est une valeur d’estimation/de reporting runtime ; ne la traitez pas comme une garantie stricte.

Pour en savoir plus, voir [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La compaction résume les anciennes conversations dans une entrée `compaction` persistée dans la transcription et conserve intacts les messages récents.

Après compaction, les tours futurs voient :

- Le résumé de compaction
- Les messages après `firstKeptEntryId`

La compaction est **persistante** (contrairement à l’élagage de session). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de blocs de compaction et appariement des outils

Quand OpenClaw découpe une longue transcription en blocs de compaction, il garde
les appels d’outils assistant appariés avec leurs entrées `toolResult` correspondantes.

- Si le découpage par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc `toolResult` final ferait autrement dépasser la cible au bloc,
  OpenClaw préserve ce bloc d’outil en attente et garde intacte la queue non résumée.
- Les blocs d’appel d’outil abandonnés/en erreur ne maintiennent pas ouverte une séparation en attente.

---

## Quand la compaction automatique se produit (runtime Pi)

Dans l’agent Pi embarqué, la compaction automatique se déclenche dans deux cas :

1. **Récupération de débordement** : le modèle renvoie une erreur de débordement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires selon le fournisseur) → compacter → réessayer.
2. **Maintenance au seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée aux prompts + à la sortie suivante du modèle

Il s’agit de sémantiques du runtime Pi (OpenClaw consomme les événements, mais c’est Pi qui décide quand compacter).

---

## Paramètres de compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de compaction de Pi vivent dans les réglages Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique également un plancher de sécurité pour les exécutions embarquées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver ce plancher.
- S’il est déjà plus élevé, OpenClaw n’y touche pas.

Pourquoi : laisser assez de marge pour la « maintenance » multi-tours (comme les écritures mémoire) avant que la compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la compaction et l’état des sessions via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de compactions

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge les tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir la sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas remettre de réponse à l’utilisateur ».
- OpenClaw le retire/le supprime dans la couche de remise.
- La suppression exacte du jeton silencieux est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque toute la charge utile est uniquement ce jeton silencieux.
- Cela est réservé aux vrais tours en arrière-plan/sans remise ; ce n’est pas un raccourci pour
  les requêtes utilisateur ordinaires nécessitant une action.

Depuis `2026.1.10`, OpenClaw supprime également le **streaming de brouillon/de frappe**
lorsqu’un fragment partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne laissent pas fuiter
de sortie partielle en milieu de tour.

---

## « Vidage mémoire » pré-compaction (implémenté)

Objectif : avant que la compaction automatique ne se produise, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par ex. `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’utilisation du contexte de la session.
2. Lorsqu’elle franchit un « seuil souple » (en dessous du seuil de compaction de Pi), exécuter une directive silencieuse
   « écrire la mémoire maintenant » vers l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` pour que l’utilisateur ne voie
   rien.

Config (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Remarques :

- Le prompt/le prompt système par défaut inclut un indice `NO_REPLY` pour supprimer
  la remise.
- Le vidage s’exécute une fois par cycle de compaction (suivi dans `sessions.json`).
- Le vidage s’exécute uniquement pour les sessions Pi embarquées.
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Memory](/fr/concepts/memory) pour l’organisation des fichiers d’espace de travail et les modèles d’écriture.

Pi expose également un hook `session_before_compact` dans l’API d’extension, mais la logique
de vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de vérification pour le dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez la `sessionKey` dans `/status`.
- Incohérence entre stockage et transcription ? Confirmez l’hôte Gateway et le chemin du stockage depuis `openclaw status`.
- Spam de compaction ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de compaction (`reserveTokens` trop élevé par rapport à la fenêtre du modèle peut provoquer une compaction plus précoce)
  - le gonflement des résultats d’outil : activez/ajustez l’élagage de session
- Les tours silencieux fuient ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous êtes sur une build qui inclut le correctif de suppression du streaming.
