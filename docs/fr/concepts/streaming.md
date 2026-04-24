---
read_when:
    - Explication du fonctionnement du streaming ou du découpage en blocs sur les canaux
    - Modification du comportement de streaming par blocs ou du découpage des canaux
    - Débogage des réponses par blocs dupliquées/prématurées ou du streaming d’aperçu des canaux
summary: Comportement du streaming + découpage en blocs (réponses par blocs, streaming d’aperçu des canaux, correspondance des modes)
title: Streaming et découpage en blocs
x-i18n:
    generated_at: "2026-04-24T07:08:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48d0391644e410d08f81cc2fb2d02a4aeb836ab04f37ea34a6c94bec9bc16b07
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + découpage en blocs

OpenClaw possède deux couches de streaming distinctes :

- **Streaming par blocs (canaux)** : émettre des **blocs** terminés au fur et à mesure que l’assistant écrit. Ce sont des messages de canal normaux (pas des deltas de jetons).
- **Streaming d’aperçu (Telegram/Discord/Slack)** : mettre à jour un **message d’aperçu** temporaire pendant la génération.

Il n’existe aujourd’hui **aucun véritable streaming par deltas de jetons** vers les messages de canal. Le streaming d’aperçu est basé sur les messages (envoi + modifications/ajouts).

## Streaming par blocs (messages de canal)

Le streaming par blocs envoie la sortie de l’assistant en morceaux grossiers à mesure qu’elle devient disponible.

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

- `text_delta/events` : événements de flux du modèle (peuvent être rares pour les modèles sans streaming).
- `chunker` : `EmbeddedBlockChunker` appliquant des bornes min/max + une préférence de coupure.
- `channel send` : messages sortants réels (réponses par blocs).

**Contrôles :**

- `agents.defaults.blockStreamingDefault` : `"on"`/`"off"` (désactivé par défaut).
- Remplacements par canal : `*.blockStreaming` (et variantes par compte) pour forcer `"on"`/`"off"` par canal.
- `agents.defaults.blockStreamingBreak` : `"text_end"` ou `"message_end"`.
- `agents.defaults.blockStreamingChunk` : `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce` : `{ minChars?, maxChars?, idleMs? }` (fusionner les blocs diffusés avant envoi).
- Limite stricte du canal : `*.textChunkLimit` (par ex. `channels.whatsapp.textChunkLimit`).
- Mode de découpage du canal : `*.chunkMode` (`length` par défaut, `newline` coupe sur les lignes vides (frontières de paragraphe) avant le découpage par longueur).
- Limite souple Discord : `channels.discord.maxLinesPerMessage` (17 par défaut) découpe les réponses hautes pour éviter le rognage dans l’interface.

**Sémantique des frontières :**

- `text_end` : diffuser les blocs dès que le chunker émet ; vider à chaque `text_end`.
- `message_end` : attendre la fin du message de l’assistant, puis vider la sortie mise en tampon.

`message_end` utilise toujours le chunker si le texte mis en tampon dépasse `maxChars`, il peut donc émettre plusieurs morceaux à la fin.

## Algorithme de découpage en blocs (bornes basses/hautes)

Le découpage en blocs est implémenté par `EmbeddedBlockChunker` :

- **Borne basse :** ne pas émettre tant que le tampon est < `minChars` (sauf si forcé).
- **Borne haute :** préférer des coupures avant `maxChars` ; si forcé, couper à `maxChars`.
- **Préférence de coupure :** `paragraph` → `newline` → `sentence` → `whitespace` → coupure dure.
- **Blocs de code :** ne jamais couper à l’intérieur d’un bloc ; en cas de coupure forcée à `maxChars`, fermer puis rouvrir le bloc pour conserver un Markdown valide.

`maxChars` est limité à `textChunkLimit` du canal, vous ne pouvez donc pas dépasser les plafonds par canal.

## Fusion (regrouper les blocs diffusés)

Lorsque le streaming par blocs est activé, OpenClaw peut **fusionner des morceaux de blocs consécutifs**
avant de les envoyer. Cela réduit le « spam sur une seule ligne » tout en fournissant
une sortie progressive.

- La fusion attend des **périodes d’inactivité** (`idleMs`) avant de vider.
- Les tampons sont plafonnés par `maxChars` et seront vidés s’ils le dépassent.
- `minChars` empêche l’envoi de fragments minuscules tant qu’assez de texte ne s’est pas accumulé
  (le vidage final envoie toujours le texte restant).
- Le séparateur est dérivé de `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → espace).
- Des remplacements par canal sont disponibles via `*.blockStreamingCoalesce` (y compris dans les configurations par compte).
- La valeur par défaut de fusion `minChars` est portée à 1500 pour Signal/Slack/Discord sauf remplacement.

## Rythme humain entre les blocs

Lorsque le streaming par blocs est activé, vous pouvez ajouter une **pause aléatoire**
entre les réponses par blocs (après le premier bloc). Cela rend les réponses à bulles multiples
plus naturelles.

- Config : `agents.defaults.humanDelay` (remplacement par agent via `agents.list[].humanDelay`).
- Modes : `off` (par défaut), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- S’applique uniquement aux **réponses par blocs**, pas aux réponses finales ni aux résumés d’outils.

## « Diffuser les morceaux ou tout »

Cela correspond à :

- **Diffuser les morceaux :** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (émettre au fil de l’eau). Les canaux autres que Telegram nécessitent aussi `*.blockStreaming: true`.
- **Tout diffuser à la fin :** `blockStreamingBreak: "message_end"` (vider une fois, éventuellement en plusieurs morceaux si c’est très long).
- **Pas de streaming par blocs :** `blockStreamingDefault: "off"` (réponse finale uniquement).

**Remarque sur les canaux :** Le streaming par blocs est **désactivé tant que**
`*.blockStreaming` n’est pas explicitement défini sur `true`. Les canaux peuvent diffuser un aperçu en direct
(`channels.<channel>.streaming`) sans réponses par blocs.

Rappel sur l’emplacement de la configuration : les valeurs par défaut `blockStreaming*` se trouvent sous
`agents.defaults`, pas à la racine de la configuration.

## Modes de streaming d’aperçu

Clé canonique : `channels.<channel>.streaming`

Modes :

- `off` : désactiver le streaming d’aperçu.
- `partial` : un seul aperçu remplacé par le dernier texte.
- `block` : mises à jour de l’aperçu par étapes découpées/ajoutées.
- `progress` : aperçu de progression/statut pendant la génération, réponse finale à la fin.

### Correspondance par canal

| Canal      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | correspond à `partial` |
| Discord    | ✅    | ✅        | ✅      | correspond à `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Slack uniquement :

- `channels.slack.streaming.nativeTransport` active/désactive les appels API de streaming natif Slack lorsque `channels.slack.streaming.mode="partial"` (par défaut : `true`).
- Le streaming natif Slack et le statut de fil d’assistant Slack exigent une cible de fil de réponse ; les DM de niveau supérieur n’affichent pas cet aperçu de style fil.

Migration des clés héritées :

- Telegram : `streamMode` + booléen `streaming` migrent automatiquement vers l’énumération `streaming`.
- Discord : `streamMode` + booléen `streaming` migrent automatiquement vers l’énumération `streaming`.
- Slack : `streamMode` migre automatiquement vers `streaming.mode` ; le booléen `streaming` migre automatiquement vers `streaming.mode` plus `streaming.nativeTransport` ; l’ancien `nativeStreaming` migre automatiquement vers `streaming.nativeTransport`.

### Comportement à l’exécution

Telegram :

- Utilise `sendMessage` + `editMessageText` pour les mises à jour d’aperçu dans les DM comme dans les groupes/topics.
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Telegram est explicitement activé (pour éviter un double streaming).
- `/reasoning stream` peut écrire le raisonnement dans l’aperçu.

Discord :

- Utilise des messages d’aperçu avec envoi + modification.
- Le mode `block` utilise le découpage de brouillon (`draftChunk`).
- Le streaming d’aperçu est ignoré lorsque le streaming par blocs Discord est explicitement activé.
- Les charges utiles finales de média, d’erreur et de réponse explicite annulent les aperçus en attente sans vider un nouveau brouillon, puis utilisent la livraison normale.

Slack :

- `partial` peut utiliser le streaming natif Slack (`chat.startStream`/`append`/`stop`) lorsqu’il est disponible.
- `block` utilise des aperçus de brouillon de type ajout.
- `progress` utilise un texte d’aperçu de statut, puis la réponse finale.
- Les charges utiles finales de média/erreur et les finales de progression ne créent pas de messages de brouillon jetables ; seules les finales texte/bloc pouvant modifier l’aperçu vident le texte de brouillon en attente.

Mattermost :

- Diffuse la réflexion, l’activité d’outil et le texte partiel de réponse dans un unique brouillon d’aperçu qui se finalise sur place lorsque la réponse finale peut être envoyée en toute sécurité.
- Revient à l’envoi d’un nouveau message final si le message d’aperçu a été supprimé ou n’est plus disponible au moment de la finalisation.
- Les charges utiles finales de média/erreur annulent les mises à jour d’aperçu en attente avant la livraison normale au lieu de vider un message d’aperçu temporaire.

Matrix :

- Les aperçus de brouillon se finalisent sur place lorsque le texte final peut réutiliser l’événement d’aperçu.
- Les finales uniquement média, les erreurs et les finales avec discordance de cible de réponse annulent les mises à jour d’aperçu en attente avant la livraison normale ; un aperçu obsolète déjà visible est expurgé.

### Mises à jour d’aperçu de progression d’outil

Le streaming d’aperçu peut aussi inclure des mises à jour de **progression d’outil** — de courtes lignes d’état comme « recherche sur le web », « lecture de fichier » ou « appel d’outil » — qui apparaissent dans ce même message d’aperçu pendant l’exécution des outils, avant la réponse finale. Cela donne une impression de vie aux tours d’outils en plusieurs étapes au lieu d’un silence entre le premier aperçu de réflexion et la réponse finale.

Surfaces prises en charge :

- **Discord**, **Slack** et **Telegram** diffusent la progression d’outil dans la modification d’aperçu en direct.
- **Mattermost** intègre déjà l’activité d’outil dans son unique brouillon d’aperçu (voir ci-dessus).
- Les modifications de progression d’outil suivent le mode actif de streaming d’aperçu ; elles sont ignorées lorsque le streaming d’aperçu est `off` ou lorsque le streaming par blocs a pris le contrôle du message.

## Associé

- [Messages](/fr/concepts/messages) — cycle de vie et livraison des messages
- [Retry](/fr/concepts/retry) — comportement de nouvelle tentative en cas d’échec de livraison
- [Channels](/fr/channels) — prise en charge du streaming par canal
