---
read_when:
    - Expliquer comment le streaming ou le découpage fonctionne sur les canaux
    - Modifier le streaming par blocs ou le comportement de découpage des canaux
    - Déboguer des réponses par blocs dupliquées/précoces ou le streaming de prévisualisation de canal
summary: Comportement de streaming + découpage (réponses par blocs, streaming de prévisualisation de canal, mappage des modes)
title: Streaming et découpage
x-i18n:
    generated_at: "2026-04-05T12:41:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + découpage

OpenClaw possède deux couches de streaming distinctes :

- **Streaming par blocs (canaux) :** émettre des **blocs** terminés à mesure que l’assistant écrit. Il s’agit de messages de canal normaux (pas de deltas de jetons).
- **Streaming de prévisualisation (Telegram/Discord/Slack) :** mettre à jour un **message de prévisualisation** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming de deltas de jetons** vers les messages de canal. Le streaming de prévisualisation est basé sur les messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant en segments grossiers dès qu’elle devient disponible.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Légende :

- `text_delta/events` : événements de flux du modèle (peuvent être clairsemés pour les modèles non streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant les limites min/max + la préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements de canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionner les blocs streamés avant envoi).
- Limite stricte du canal : `*.textChunkLimit` (par ex. `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` découpe sur les lignes vides (limites de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage de l’interface.

**Sémantique des limites :**

- `text_end` : streamer les blocs dès que le chunker les émet ; vider à chaque `text_end`.
- `message_end` : attendre que le message de l’assistant soit terminé, puis vider la sortie mise en tampon.

`message_end` utilise toujours le chunker si le texte mis en tampon dépasse `maxChars`, et peut donc émettre plusieurs segments à la fin.

## Algorithme de découpage (bornes basse/haute)

Le découpage par blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** ne rien émettre tant que le tampon est < `minChars` (sauf si forcé).
- **Borne haute :** préférer les coupures avant `maxChars` ; si forcé, couper à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure forcée.
- **Blocs de code :** ne jamais couper à l’intérieur de blocs ; si une coupure est forcée à `maxChars`, fermer puis rouvrir le bloc afin de conserver un Markdown valide.

`maxChars` est limité par `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les plafonds propres à chaque canal.

## Coalescence (fusion des blocs streamés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner des segments de blocs consécutifs**
avant de les envoyer. Cela réduit le « spam ligne par ligne » tout en fournissant
une sortie progressive.

- La coalescence attend des **périodes d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de trop petits fragments tant qu’assez de texte ne s’est pas accumulé
  (la vidange finale envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements de canal sont disponibles via `*.blockStreamingCoalesce` (y compris dans les configs par compte).
- La valeur par défaut de coalescence `minChars` est portée à 1500 pour Signal/Slack/Discord, sauf remplacement.

## Rythme humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire** entre
les réponses par blocs (après le premier bloc). Cela rend les réponses à plusieurs bulles
plus naturelles.

- Configuration : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## "Streamer par segments ou tout d’un coup"

Cela correspond à :

- **Streamer par segments :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fur et à mesure). Les canaux autres que Telegram nécessitent également `*.blockStreaming: true`.
- **Tout streamer à la fin :** `blockStreamingBreak: "message_end"` (vider une seule fois, éventuellement en plusieurs segments si c’est très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Remarque sur les canaux :** le streaming par blocs est **désactivé sauf si**
`*.blockStreaming` est explicitement défini sur `true`. Les canaux peuvent streamer une prévisualisation en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas à la racine de la configuration.

## Modes de streaming de prévisualisation

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactiver le streaming de prévisualisation.
- `partial` : une seule prévisualisation remplacée par le texte le plus récent.
- `block` : mises à jour de prévisualisation par étapes segmentées/ajoutées.
- `progress` : prévisualisation de progression/statut pendant la génération, réponse finale à la fin.

### Mappage par canal

| Canal    | `off` | `partial` | `block` | `progress`             |
| -------- | ----- | --------- | ------- | ---------------------- |
| Telegram | ✅    | ✅        | ✅      | correspond à `partial` |
| Discord  | ✅    | ✅        | ✅      | correspond à `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                     |

Slack uniquement :

- `channels.slack.nativeStreaming` active/désactive les appels à l’API de streaming native Slack lorsque `streaming=partial` (par défaut : `true`).

Migration des clés historiques :

- Telegram : `streamMode` + booléen `streaming` sont migrés automatiquement vers l’énumération `streaming`.
- Discord : `streamMode` + booléen `streaming` sont migrés automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` est migré automatiquement vers l’énumération `streaming` ; le booléen `streaming` est migré automatiquement vers `nativeStreaming`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour de prévisualisation dans les messages privés et groupes/sujets.
- Le streaming de prévisualisation est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans la prévisualisation.

Discord :

- Utilise des messages de prévisualisation avec envoi + modification.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming de prévisualisation est ignoré lorsque le streaming par blocs Discord est explicitement activé.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des prévisualisations de brouillon de type ajout.
- `progress` utilise un texte de prévisualisation de statut, puis la réponse finale.

## Lié

- [Messages](/concepts/messages) — cycle de vie et distribution des messages
- [Retry](/concepts/retry) — comportement de nouvelle tentative en cas d’échec de distribution
- [Channels](/channels) — prise en charge du streaming par canal
