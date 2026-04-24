---
read_when:
    - Vous devez déboguer les identifiants de session, le JSONL de transcription ou les champs de sessions.json
    - Vous modifiez le comportement d’auto-Compaction ou ajoutez une maintenance « pré-Compaction »
    - Vous voulez implémenter des vidages mémoire ou des tours système silencieux
summary: 'approfondissement : magasin de sessions + transcriptions, cycle de vie et internes de Compaction (auto)'
title: approfondissement de la gestion des sessions
x-i18n:
    generated_at: "2026-04-24T07:31:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Gestion des sessions et Compaction (approfondissement)

Ce document explique comment OpenClaw gère les sessions de bout en bout :

- **Routage des sessions** (comment les messages entrants sont associés à une `sessionKey`)
- **Magasin de sessions** (`sessions.json`) et ce qu’il suit
- **Persistance des transcriptions** (`*.jsonl`) et leur structure
- **Hygiène des transcriptions** (correctifs spécifiques au fournisseur avant les exécutions)
- **Limites de contexte** (fenêtre de contexte vs tokens suivis)
- **Compaction** (Compaction manuelle + automatique) et où brancher le travail pré-Compaction
- **Maintenance silencieuse** (par exemple des écritures mémoire qui ne devraient pas produire de sortie visible par l’utilisateur)

Si vous voulez d’abord une vue d’ensemble de plus haut niveau, commencez par :

- [/concepts/session](/fr/concepts/session)
- [/concepts/compaction](/fr/concepts/compaction)
- [/concepts/memory](/fr/concepts/memory)
- [/concepts/memory-search](/fr/concepts/memory-search)
- [/concepts/session-pruning](/fr/concepts/session-pruning)
- [/reference/transcript-hygiene](/fr/reference/transcript-hygiene)

---

## Source de vérité : la Gateway

OpenClaw est conçu autour d’un seul **processus Gateway** qui possède l’état des sessions.

- Les interfaces (app macOS, Control UI web, TUI) doivent interroger la Gateway pour les listes de sessions et les comptes de tokens.
- En mode distant, les fichiers de session se trouvent sur l’hôte distant ; « vérifier vos fichiers Mac locaux » ne reflète pas ce que la Gateway utilise.

---

## Deux couches de persistance

OpenClaw conserve les sessions dans deux couches :

1. **Magasin de sessions (`sessions.json`)**
   - Map clé/valeur : `sessionKey -> SessionEntry`
   - Petit, mutable, sûr à modifier (ou à supprimer des entrées)
   - Suit les métadonnées de session (id de session courant, dernière activité, bascules, compteurs de tokens, etc.)

2. **Transcription (`<sessionId>.jsonl`)**
   - Transcription append-only avec structure en arbre (les entrées ont `id` + `parentId`)
   - Stocke la conversation réelle + appels d’outils + résumés de Compaction
   - Utilisée pour reconstruire le contexte du modèle pour les tours futurs

---

## Emplacements sur disque

Par agent, sur l’hôte Gateway :

- Magasin : `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcriptions : `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sessions de sujet Telegram : `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw les résout via `src/config/sessions.ts`.

---

## Maintenance du magasin et contrôles disque

La persistance des sessions possède des contrôles de maintenance automatique (`session.maintenance`) pour `sessions.json` et les artefacts de transcription :

- `mode` : `warn` (par défaut) ou `enforce`
- `pruneAfter` : seuil d’âge des entrées obsolètes (par défaut `30d`)
- `maxEntries` : limite d’entrées dans `sessions.json` (par défaut `500`)
- `rotateBytes` : rotation de `sessions.json` lorsqu’il devient trop volumineux (par défaut `10mb`)
- `resetArchiveRetention` : rétention des archives de transcription `*.reset.<timestamp>` (par défaut : identique à `pruneAfter` ; `false` désactive le nettoyage)
- `maxDiskBytes` : budget facultatif du répertoire de sessions
- `highWaterBytes` : cible facultative après nettoyage (par défaut `80%` de `maxDiskBytes`)

Ordre d’application du nettoyage du budget disque (`mode: "enforce"`) :

1. Supprimer d’abord les artefacts de transcription archivés ou orphelins les plus anciens.
2. Si l’usage reste au-dessus de la cible, évincer les entrées de session les plus anciennes et leurs fichiers de transcription.
3. Continuer jusqu’à ce que l’usage soit inférieur ou égal à `highWaterBytes`.

En `mode: "warn"`, OpenClaw signale les évictions potentielles mais ne modifie pas le magasin/les fichiers.

Exécuter la maintenance à la demande :

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sessions Cron et journaux d’exécution

Les exécutions Cron isolées créent aussi des entrées/transcriptions de session, et elles possèdent des contrôles de rétention dédiés :

- `cron.sessionRetention` (par défaut `24h`) purge les anciennes sessions d’exécution Cron isolées du magasin de sessions (`false` désactive cela).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` purgent les fichiers `~/.openclaw/cron/runs/<jobId>.jsonl` (par défaut : `2_000_000` octets et `2000` lignes).

---

## Clés de session (`sessionKey`)

Une `sessionKey` identifie _dans quel compartiment de conversation_ vous vous trouvez (routage + isolation).

Motifs courants :

- Chat principal/direct (par agent) : `agent:<agentId>:<mainKey>` (par défaut `main`)
- Groupe : `agent:<agentId>:<channel>:group:<id>`
- Salon/canal (Discord/Slack) : `agent:<agentId>:<channel>:channel:<id>` ou `...:room:<id>`
- Cron : `cron:<job.id>`
- Webhook : `hook:<uuid>` (sauf redéfinition)

Les règles canoniques sont documentées dans [/concepts/session](/fr/concepts/session).

---

## Identifiants de session (`sessionId`)

Chaque `sessionKey` pointe vers un `sessionId` courant (le fichier de transcription qui prolonge la conversation).

Règles générales :

- **Réinitialisation** (`/new`, `/reset`) crée un nouveau `sessionId` pour cette `sessionKey`.
- **Réinitialisation quotidienne** (par défaut 4:00 du matin, heure locale sur l’hôte gateway) crée un nouveau `sessionId` au message suivant après la limite de réinitialisation.
- **Expiration par inactivité** (`session.reset.idleMinutes` ou l’ancien `session.idleMinutes`) crée un nouveau `sessionId` lorsqu’un message arrive après la fenêtre d’inactivité. Lorsque quotidien + inactivité sont tous deux configurés, celui qui expire en premier l’emporte.
- **Garde de bifurcation du parent de fil** (`session.parentForkMaxTokens`, par défaut `100000`) ignore la bifurcation de la transcription parente lorsque la session parente est déjà trop grande ; le nouveau fil démarre à neuf. Définissez `0` pour désactiver.

Détail d’implémentation : la décision se prend dans `initSessionState()` dans `src/auto-reply/reply/session.ts`.

---

## Schéma du magasin de sessions (`sessions.json`)

Le type de valeur du magasin est `SessionEntry` dans `src/config/sessions.ts`.

Champs clés (liste non exhaustive) :

- `sessionId` : identifiant courant de transcription (le nom de fichier en dérive sauf si `sessionFile` est défini)
- `updatedAt` : horodatage de dernière activité
- `sessionFile` : redéfinition facultative explicite du chemin de transcription
- `chatType` : `direct | group | room` (aide les interfaces et la politique d’envoi)
- `provider`, `subject`, `room`, `space`, `displayName` : métadonnées pour l’étiquetage groupe/canal
- Bascule :
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (redéfinition par session)
- Sélection de modèle :
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Compteurs de tokens (meilleur effort / dépendants du fournisseur) :
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount` : nombre de fois où l’auto-Compaction s’est terminée pour cette clé de session
- `memoryFlushAt` : horodatage du dernier vidage mémoire pré-Compaction
- `memoryFlushCompactionCount` : nombre de Compactions quand le dernier vidage a eu lieu

Le magasin peut être modifié sans danger, mais la Gateway fait autorité : elle peut réécrire ou réhydrater les entrées au fur et à mesure de l’exécution des sessions.

---

## Structure des transcriptions (`*.jsonl`)

Les transcriptions sont gérées par le `SessionManager` de `@mariozechner/pi-coding-agent`.

Le fichier est en JSONL :

- Première ligne : en-tête de session (`type: "session"`, inclut `id`, `cwd`, `timestamp`, `parentSession` facultatif)
- Puis : entrées de session avec `id` + `parentId` (arbre)

Types d’entrée notables :

- `message` : messages utilisateur/assistant/toolResult
- `custom_message` : messages injectés par extension qui _entrent_ dans le contexte du modèle (peuvent être masqués de l’UI)
- `custom` : état d’extension qui n’entre _pas_ dans le contexte du modèle
- `compaction` : résumé persistant de Compaction avec `firstKeptEntryId` et `tokensBefore`
- `branch_summary` : résumé persistant lors de la navigation dans une branche de l’arbre

OpenClaw ne « corrige » volontairement **pas** les transcriptions ; la Gateway utilise `SessionManager` pour les lire/écrire.

---

## Fenêtres de contexte vs tokens suivis

Deux concepts différents comptent :

1. **Fenêtre de contexte du modèle** : plafond strict par modèle (tokens visibles par le modèle)
2. **Compteurs du magasin de sessions** : statistiques glissantes écrites dans `sessions.json` (utilisées pour /status et les tableaux de bord)

Si vous ajustez les limites :

- La fenêtre de contexte vient du catalogue de modèles (et peut être redéfinie par la configuration).
- `contextTokens` dans le magasin est une valeur d’estimation/de rapport runtime ; ne la traitez pas comme une garantie stricte.

Pour plus de détails, voir [/token-use](/fr/reference/token-use).

---

## Compaction : ce que c’est

La Compaction résume l’ancienne conversation dans une entrée persistante `compaction` de la transcription et garde les messages récents intacts.

Après Compaction, les tours futurs voient :

- Le résumé de Compaction
- Les messages après `firstKeptEntryId`

La Compaction est **persistante** (contrairement à l’élagage de session). Voir [/concepts/session-pruning](/fr/concepts/session-pruning).

## Limites de bloc de Compaction et appariement des outils

Lorsque OpenClaw découpe une longue transcription en blocs de Compaction, il garde
les appels d’outils de l’assistant appariés avec leurs entrées `toolResult`
correspondantes.

- Si la séparation par part de tokens tombe entre un appel d’outil et son résultat, OpenClaw
  déplace la limite vers le message d’appel d’outil de l’assistant au lieu de séparer
  la paire.
- Si un bloc final de résultat d’outil pousserait autrement le bloc au-delà de la cible,
  OpenClaw préserve ce bloc d’outil en attente et garde intacte la queue non résumée.
- Les blocs d’appel d’outil annulés/en erreur ne maintiennent pas une séparation en attente ouverte.

---

## Quand l’auto-Compaction se produit (runtime Pi)

Dans l’agent Pi intégré, l’auto-Compaction se déclenche dans deux cas :

1. **Récupération de dépassement** : le modèle renvoie une erreur de dépassement de contexte
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, et variantes similaires propres au fournisseur) → compacter → réessayer.
2. **Maintenance par seuil** : après un tour réussi, lorsque :

`contextTokens > contextWindow - reserveTokens`

Où :

- `contextWindow` est la fenêtre de contexte du modèle
- `reserveTokens` est la marge réservée pour les prompts + la prochaine sortie du modèle

Il s’agit de sémantiques du runtime Pi (OpenClaw consomme les événements, mais Pi décide quand compacter).

---

## Paramètres de Compaction (`reserveTokens`, `keepRecentTokens`)

Les paramètres de Compaction de Pi vivent dans les paramètres Pi :

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw applique aussi un plancher de sécurité pour les exécutions intégrées :

- Si `compaction.reserveTokens < reserveTokensFloor`, OpenClaw l’augmente.
- Le plancher par défaut est de `20000` tokens.
- Définissez `agents.defaults.compaction.reserveTokensFloor: 0` pour désactiver le plancher.
- Si la valeur est déjà plus élevée, OpenClaw la laisse telle quelle.

Pourquoi : laisser assez de marge pour une « maintenance » sur plusieurs tours (comme les écritures mémoire) avant que la Compaction ne devienne inévitable.

Implémentation : `ensurePiCompactionReserveTokens()` dans `src/agents/pi-settings.ts`
(appelé depuis `src/agents/pi-embedded-runner.ts`).

---

## Fournisseurs de Compaction enfichables

Les plugins peuvent enregistrer un fournisseur de Compaction via `registerCompactionProvider()` sur l’API plugin. Lorsque `agents.defaults.compaction.provider` est défini sur l’id d’un fournisseur enregistré, l’extension safeguard délègue la synthèse à ce fournisseur au lieu du pipeline intégré `summarizeInStages`.

- `provider` : id d’un plugin fournisseur de Compaction enregistré. Laissez vide pour la synthèse LLM par défaut.
- Définir un `provider` force `mode: "safeguard"`.
- Les fournisseurs reçoivent les mêmes instructions de Compaction et la même politique de préservation d’identifiants que le chemin intégré.
- Le safeguard préserve toujours le contexte des tours récents et de la queue de tour scindée après la sortie du fournisseur.
- Si le fournisseur échoue ou renvoie un résultat vide, OpenClaw revient automatiquement à la synthèse LLM intégrée.
- Les signaux d’abandon/délai d’expiration sont relancés (pas avalés) pour respecter l’annulation de l’appelant.

Source : `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Surfaces visibles par l’utilisateur

Vous pouvez observer la Compaction et l’état des sessions via :

- `/status` (dans n’importe quelle session de chat)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Mode verbeux : `🧹 Auto-compaction complete` + nombre de Compactions

---

## Maintenance silencieuse (`NO_REPLY`)

OpenClaw prend en charge des tours « silencieux » pour les tâches en arrière-plan où l’utilisateur ne doit pas voir de sortie intermédiaire.

Convention :

- L’assistant commence sa sortie avec le jeton silencieux exact `NO_REPLY` /
  `no_reply` pour indiquer « ne pas livrer de réponse à l’utilisateur ».
- OpenClaw retire/supprime cela dans la couche de livraison.
- La suppression exacte du jeton silencieux est insensible à la casse, donc `NO_REPLY` et
  `no_reply` comptent tous deux lorsque toute la charge utile n’est que ce jeton silencieux.
- Cela est destiné aux vrais tours d’arrière-plan/sans livraison uniquement ; ce n’est pas un raccourci pour
  les requêtes utilisateur ordinaires nécessitant une action.

À partir de `2026.1.10`, OpenClaw supprime aussi le **streaming de brouillon/de saisie** lorsqu’un
bloc partiel commence par `NO_REPLY`, afin que les opérations silencieuses ne divulguent pas de sortie partielle en milieu de tour.

---

## « Vidage mémoire » pré-Compaction (implémenté)

Objectif : avant que l’auto-Compaction ne se produise, exécuter un tour agentique silencieux qui écrit un état durable
sur disque (par ex. `memory/YYYY-MM-DD.md` dans l’espace de travail de l’agent) afin que la Compaction ne puisse pas
effacer un contexte critique.

OpenClaw utilise l’approche de **vidage avant seuil** :

1. Surveiller l’usage du contexte de session.
2. Lorsqu’il franchit un « seuil doux » (en dessous du seuil de Compaction de Pi), exécuter une directive silencieuse
   « écris la mémoire maintenant » vers l’agent.
3. Utiliser le jeton silencieux exact `NO_REPLY` / `no_reply` afin que l’utilisateur ne voie
   rien.

Configuration (`agents.defaults.compaction.memoryFlush`) :

- `enabled` (par défaut : `true`)
- `softThresholdTokens` (par défaut : `4000`)
- `prompt` (message utilisateur pour le tour de vidage)
- `systemPrompt` (prompt système supplémentaire ajouté pour le tour de vidage)

Remarques :

- Le prompt/le prompt système par défaut inclut un indice `NO_REPLY` pour supprimer
  la livraison.
- Le vidage s’exécute une fois par cycle de Compaction (suivi dans `sessions.json`).
- Le vidage ne s’exécute que pour les sessions Pi intégrées (les backends CLI l’ignorent).
- Le vidage est ignoré lorsque l’espace de travail de la session est en lecture seule (`workspaceAccess: "ro"` ou `"none"`).
- Voir [Mémoire](/fr/concepts/memory) pour l’organisation des fichiers d’espace de travail et les modèles d’écriture.

Pi expose aussi un hook `session_before_compact` dans l’API d’extension, mais la logique de
vidage d’OpenClaw vit aujourd’hui côté Gateway.

---

## Liste de contrôle de dépannage

- Mauvaise clé de session ? Commencez par [/concepts/session](/fr/concepts/session) et confirmez la `sessionKey` dans `/status`.
- Incohérence magasin vs transcription ? Confirmez l’hôte Gateway et le chemin du magasin depuis `openclaw status`.
- Spam de Compaction ? Vérifiez :
  - la fenêtre de contexte du modèle (trop petite)
  - les paramètres de Compaction (`reserveTokens` trop élevé pour la fenêtre du modèle peut provoquer une Compaction plus précoce)
  - le gonflement des résultats d’outils : activez/ajustez l’élagage de session
- Fuite de tours silencieux ? Confirmez que la réponse commence par `NO_REPLY` (jeton exact insensible à la casse) et que vous êtes sur un build qui inclut le correctif de suppression du streaming.

## Liens associés

- [Gestion des sessions](/fr/concepts/session)
- [Élagage de session](/fr/concepts/session-pruning)
- [Moteur de contexte](/fr/concepts/context-engine)
